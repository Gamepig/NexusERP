package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"nexus-erp/backend/internal/monitoring"
	
	"github.com/jmoiron/sqlx"
)

// OAuthProvider OAuth提供者類型
type OAuthProvider string

const (
	ProviderGoogle OAuthProvider = "google"
	ProviderLINE   OAuthProvider = "line"
	ProviderGitHub OAuthProvider = "github"
)

// OAuthConfig OAuth配置
type OAuthConfig struct {
	Provider     OAuthProvider `json:"provider"`
	ClientID     string        `json:"client_id"`
	ClientSecret string        `json:"client_secret"`
	RedirectURL  string        `json:"redirect_url"`
	Scope        string        `json:"scope"`
	AuthURL      string        `json:"auth_url"`
	TokenURL     string        `json:"token_url"`
	UserInfoURL  string        `json:"user_info_url"`
}

// OAuthState OAuth狀態記錄
type OAuthState struct {
	ID          int64     `json:"id" db:"id"`
	State       string    `json:"state" db:"state"`
	Provider    string    `json:"provider" db:"provider"`
	RedirectURL string    `json:"redirect_url" db:"redirect_url"`
	CompanyID   int64     `json:"company_id" db:"company_id"`
	IPAddress   string    `json:"ip_address" db:"ip_address"`
	UserAgent   string    `json:"user_agent" db:"user_agent"`
	ExpiresAt   time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// OAuthUserInfo OAuth用戶信息
type OAuthUserInfo struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Picture  string `json:"picture"`
	Verified bool   `json:"verified"`
}

// OAuthToken OAuth Token信息
type OAuthToken struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	Scope        string `json:"scope"`
}

// OAuthService OAuth認證服務
type OAuthService struct {
	db       *sqlx.DB
	monitor  *monitoring.SecurityMonitor
	configs  map[OAuthProvider]*OAuthConfig
	httpClient *http.Client
}

func NewOAuthService(db *sqlx.DB, monitor *monitoring.SecurityMonitor) *OAuthService {
	return &OAuthService{
		db:      db,
		monitor: monitor,
		configs: make(map[OAuthProvider]*OAuthConfig),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// RegisterProvider 註冊OAuth提供者配置
func (o *OAuthService) RegisterProvider(provider OAuthProvider, config *OAuthConfig) {
	o.configs[provider] = config
}

// GetAuthURL 獲取OAuth認證URL
func (o *OAuthService) GetAuthURL(ctx context.Context, provider OAuthProvider, companyID int64, redirectURL, ipAddress, userAgent string) (string, error) {
	config, exists := o.configs[provider]
	if !exists {
		return "", fmt.Errorf("unsupported OAuth provider: %s", provider)
	}

	// 生成隨機state
	stateBytes := make([]byte, 32)
	_, err := rand.Read(stateBytes)
	if err != nil {
		return "", fmt.Errorf("failed to generate state: %w", err)
	}
	state := base64.URLEncoding.EncodeToString(stateBytes)

	// 保存OAuth狀態
	oauthState := &OAuthState{
		State:       state,
		Provider:    string(provider),
		RedirectURL: redirectURL,
		CompanyID:   companyID,
		IPAddress:   ipAddress,
		UserAgent:   userAgent,
		ExpiresAt:   time.Now().Add(10 * time.Minute), // 10分鐘過期
		CreatedAt:   time.Now(),
	}

	query := `
		INSERT INTO oauth_states (state, provider, redirect_url, company_id, ip_address, user_agent, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`
	err = o.db.QueryRowContext(ctx, query,
		oauthState.State, oauthState.Provider, oauthState.RedirectURL,
		oauthState.CompanyID, oauthState.IPAddress, oauthState.UserAgent,
		oauthState.ExpiresAt, oauthState.CreatedAt,
	).Scan(&oauthState.ID)

	if err != nil {
		return "", fmt.Errorf("failed to save OAuth state: %w", err)
	}

	// 構建認證URL
	authURL, err := url.Parse(config.AuthURL)
	if err != nil {
		return "", fmt.Errorf("invalid auth URL: %w", err)
	}

	params := url.Values{}
	params.Add("client_id", config.ClientID)
	params.Add("redirect_uri", config.RedirectURL)
	params.Add("scope", config.Scope)
	params.Add("response_type", "code")
	params.Add("state", state)

	// 特定提供者的額外參數
	switch provider {
	case ProviderGoogle:
		params.Add("access_type", "offline")
		params.Add("prompt", "consent")
	case ProviderLINE:
		params.Add("nonce", state) // LINE需要nonce參數
	}

	authURL.RawQuery = params.Encode()

	// 記錄安全事件
	o.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "oauth_auth_started",
		CompanyID: &companyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"provider":     string(provider),
			"redirect_url": redirectURL,
		},
		Severity: "info",
	})

	return authURL.String(), nil
}

// HandleCallback 處理OAuth回調
func (o *OAuthService) HandleCallback(ctx context.Context, provider OAuthProvider, code, state, ipAddress, userAgent string) (*OAuthUserInfo, error) {
	config, exists := o.configs[provider]
	if !exists {
		return nil, fmt.Errorf("unsupported OAuth provider: %s", provider)
	}

	// 驗證並獲取OAuth狀態
	oauthState, err := o.validateOAuthState(ctx, state, string(provider))
	if err != nil {
		// 記錄失敗事件
		o.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "oauth_callback_invalid_state",
			IPAddress: ipAddress,
			UserAgent: userAgent,
			Details: map[string]interface{}{
				"provider": string(provider),
				"error":    err.Error(),
			},
			Severity: "error",
		})
		return nil, err
	}

	// 交換authorization code獲取access token
	token, err := o.exchangeCodeForToken(config, code)
	if err != nil {
		// 記錄失敗事件
		o.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "oauth_token_exchange_failed",
			CompanyID: &oauthState.CompanyID,
			IPAddress: ipAddress,
			UserAgent: userAgent,
			Details: map[string]interface{}{
				"provider": string(provider),
				"error":    err.Error(),
			},
			Severity: "error",
		})
		return nil, err
	}

	// 獲取用戶信息
	userInfo, err := o.getUserInfo(config, token.AccessToken)
	if err != nil {
		// 記錄失敗事件
		o.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "oauth_userinfo_failed",
			CompanyID: &oauthState.CompanyID,
			IPAddress: ipAddress,
			UserAgent: userAgent,
			Details: map[string]interface{}{
				"provider": string(provider),
				"error":    err.Error(),
			},
			Severity: "error",
		})
		return nil, err
	}

	// 清理使用過的OAuth狀態
	o.cleanupOAuthState(ctx, oauthState.ID)

	// 記錄成功事件
	o.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "oauth_callback_success",
		CompanyID: &oauthState.CompanyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"provider":   string(provider),
			"user_id":    userInfo.ID,
			"user_email": userInfo.Email,
		},
		Severity: "info",
	})

	return userInfo, nil
}

// exchangeCodeForToken 交換authorization code獲取access token
func (o *OAuthService) exchangeCodeForToken(config *OAuthConfig, code string) (*OAuthToken, error) {
	data := url.Values{}
	data.Set("client_id", config.ClientID)
	data.Set("client_secret", config.ClientSecret)
	data.Set("code", code)
	data.Set("grant_type", "authorization_code")
	data.Set("redirect_uri", config.RedirectURL)

	req, err := http.NewRequest("POST", config.TokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create token request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	resp, err := o.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("token request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("token request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var token OAuthToken
	if err := json.NewDecoder(resp.Body).Decode(&token); err != nil {
		return nil, fmt.Errorf("failed to decode token response: %w", err)
	}

	return &token, nil
}

// getUserInfo 獲取用戶信息
func (o *OAuthService) getUserInfo(config *OAuthConfig, accessToken string) (*OAuthUserInfo, error) {
	req, err := http.NewRequest("GET", config.UserInfoURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create user info request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	resp, err := o.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("user info request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("user info request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// 根據不同提供者解析用戶信息
	var userInfo OAuthUserInfo
	switch config.Provider {
	case ProviderGoogle:
		err = o.parseGoogleUserInfo(resp.Body, &userInfo)
	case ProviderLINE:
		err = o.parseLINEUserInfo(resp.Body, &userInfo)
	case ProviderGitHub:
		err = o.parseGitHubUserInfo(resp.Body, &userInfo)
	default:
		err = json.NewDecoder(resp.Body).Decode(&userInfo)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to parse user info: %w", err)
	}

	return &userInfo, nil
}

// validateOAuthState 驗證OAuth狀態
func (o *OAuthService) validateOAuthState(ctx context.Context, state, provider string) (*OAuthState, error) {
	var oauthState OAuthState
	query := `
		SELECT id, state, provider, redirect_url, company_id, ip_address, user_agent, expires_at, created_at
		FROM oauth_states
		WHERE state = $1 AND provider = $2 AND expires_at > NOW()
	`
	err := o.db.GetContext(ctx, &oauthState, query, state, provider)
	if err != nil {
		return nil, fmt.Errorf("invalid or expired OAuth state: %w", err)
	}

	return &oauthState, nil
}

// cleanupOAuthState 清理OAuth狀態
func (o *OAuthService) cleanupOAuthState(ctx context.Context, stateID int64) {
	query := `DELETE FROM oauth_states WHERE id = $1`
	_, err := o.db.ExecContext(ctx, query, stateID)
	if err != nil {
		// 只記錄警告，不影響主流程
		fmt.Printf("Warning: failed to cleanup OAuth state %d: %v\n", stateID, err)
	}
}

// 特定提供者的用戶信息解析

func (o *OAuthService) parseGoogleUserInfo(body io.Reader, userInfo *OAuthUserInfo) error {
	var googleUser struct {
		ID            string `json:"sub"`
		Email         string `json:"email"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
		EmailVerified bool   `json:"email_verified"`
	}

	if err := json.NewDecoder(body).Decode(&googleUser); err != nil {
		return err
	}

	userInfo.ID = googleUser.ID
	userInfo.Email = googleUser.Email
	userInfo.Name = googleUser.Name
	userInfo.Picture = googleUser.Picture
	userInfo.Verified = googleUser.EmailVerified

	return nil
}

func (o *OAuthService) parseLINEUserInfo(body io.Reader, userInfo *OAuthUserInfo) error {
	var lineUser struct {
		UserID      string `json:"userId"`
		DisplayName string `json:"displayName"`
		PictureURL  string `json:"pictureUrl"`
		Email       string `json:"email"`
	}

	if err := json.NewDecoder(body).Decode(&lineUser); err != nil {
		return err
	}

	userInfo.ID = lineUser.UserID
	userInfo.Email = lineUser.Email
	userInfo.Name = lineUser.DisplayName
	userInfo.Picture = lineUser.PictureURL
	userInfo.Verified = true // LINE用戶預設為已驗證

	return nil
}

func (o *OAuthService) parseGitHubUserInfo(body io.Reader, userInfo *OAuthUserInfo) error {
	var githubUser struct {
		ID        int    `json:"id"`
		Login     string `json:"login"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	}

	if err := json.NewDecoder(body).Decode(&githubUser); err != nil {
		return err
	}

	userInfo.ID = fmt.Sprintf("%d", githubUser.ID)
	userInfo.Email = githubUser.Email
	userInfo.Name = githubUser.Name
	if userInfo.Name == "" {
		userInfo.Name = githubUser.Login
	}
	userInfo.Picture = githubUser.AvatarURL
	userInfo.Verified = githubUser.Email != "" // 有email就算驗證

	return nil
}

// CleanupExpiredStates 清理過期的OAuth狀態
func (o *OAuthService) CleanupExpiredStates(ctx context.Context) error {
	query := `DELETE FROM oauth_states WHERE expires_at < NOW()`
	result, err := o.db.ExecContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired OAuth states: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected > 0 {
		fmt.Printf("Cleaned up %d expired OAuth states\n", rowsAffected)
	}

	return nil
}

// SetupDefaultProviders 設置預設的OAuth提供者配置
func (o *OAuthService) SetupDefaultProviders() {
	// Google OAuth配置
	o.RegisterProvider(ProviderGoogle, &OAuthConfig{
		Provider:    ProviderGoogle,
		AuthURL:     "https://accounts.google.com/o/oauth2/v2/auth",
		TokenURL:    "https://oauth2.googleapis.com/token",
		UserInfoURL: "https://openidconnect.googleapis.com/v1/userinfo",
		Scope:       "openid email profile",
	})

	// LINE OAuth配置
	o.RegisterProvider(ProviderLINE, &OAuthConfig{
		Provider:    ProviderLINE,
		AuthURL:     "https://access.line.me/oauth2/v2.1/authorize",
		TokenURL:    "https://api.line.me/oauth2/v2.1/token",
		UserInfoURL: "https://api.line.me/v2/profile",
		Scope:       "profile openid email",
	})

	// GitHub OAuth配置
	o.RegisterProvider(ProviderGitHub, &OAuthConfig{
		Provider:    ProviderGitHub,
		AuthURL:     "https://github.com/login/oauth/authorize",
		TokenURL:    "https://github.com/login/oauth/access_token",
		UserInfoURL: "https://api.github.com/user",
		Scope:       "user:email",
	})
}