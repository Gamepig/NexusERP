package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

// EnhancedJWTService 增強的JWT服務，支持自動刷新和過期管理
type EnhancedJWTService struct {
	*SimpleJWTService
	db           *sqlx.DB
	refreshTTL   time.Duration
	enableRefresh bool
}

// RefreshToken 刷新Token記錄
type RefreshToken struct {
	ID        int64     `db:"id"`
	UserID    int64     `db:"user_id"`
	CompanyID int64     `db:"company_id"`
	Token     string    `db:"token"`
	ExpiresAt time.Time `db:"expires_at"`
	CreatedAt time.Time `db:"created_at"`
	IsRevoked bool      `db:"is_revoked"`
}

func NewEnhancedJWTService(secret, issuer string, db *sqlx.DB) *EnhancedJWTService {
	return &EnhancedJWTService{
		SimpleJWTService: NewSimpleJWTService(secret, issuer),
		db:              db,
		refreshTTL:      7 * 24 * time.Hour, // 7天
		enableRefresh:   true,
	}
}

// GenerateTokenPairWithRefresh 生成Token配對並儲存刷新Token
func (e *EnhancedJWTService) GenerateTokenPairWithRefresh(ctx context.Context, userID, companyID int64, email string) (*EnhancedTokenPair, error) {
	// 生成基礎Token配對
	basePair, err := e.SimpleJWTService.GenerateTokenPair(userID, companyID, email)
	if err != nil {
		return nil, fmt.Errorf("failed to generate base token pair: %w", err)
	}

	// 生成並儲存刷新Token
	refreshToken, err := e.generateAndStoreRefreshToken(ctx, userID, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &EnhancedTokenPair{
		TokenPair:      basePair,
		RefreshToken:   refreshToken.Token,
		RefreshExpires: refreshToken.ExpiresAt.Unix(),
	}, nil
}

// RefreshAccessToken 使用刷新Token生成新的訪問Token
func (e *EnhancedJWTService) RefreshAccessToken(ctx context.Context, refreshTokenStr string) (*EnhancedTokenPair, error) {
	// 驗證刷新Token
	refreshToken, err := e.validateRefreshToken(ctx, refreshTokenStr)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	// 檢查是否已撤銷
	if refreshToken.IsRevoked {
		return nil, fmt.Errorf("refresh token has been revoked")
	}

	// 檢查是否過期
	if time.Now().After(refreshToken.ExpiresAt) {
		return nil, fmt.Errorf("refresh token has expired")
	}

	// 獲取用戶資訊
	email, err := e.getUserEmail(ctx, refreshToken.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user email: %w", err)
	}

	// 生成新的Token配對
	return e.GenerateTokenPairWithRefresh(ctx, refreshToken.UserID, refreshToken.CompanyID, email)
}

// RevokeRefreshToken 撤銷刷新Token
func (e *EnhancedJWTService) RevokeRefreshToken(ctx context.Context, refreshTokenStr string) error {
	query := `UPDATE refresh_tokens SET is_revoked = true WHERE token = $1 AND is_revoked = false`
	result, err := e.db.ExecContext(ctx, query, refreshTokenStr)
	if err != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("refresh token not found or already revoked")
	}

	return nil
}

// CleanupExpiredTokens 清理過期的刷新Token
func (e *EnhancedJWTService) CleanupExpiredTokens(ctx context.Context) (int64, error) {
	query := `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = true`
	result, err := e.db.ExecContext(ctx, query)
	if err != nil {
		return 0, fmt.Errorf("failed to cleanup expired tokens: %w", err)
	}

	return result.RowsAffected()
}

// ValidateAndRefreshIfNeeded 驗證Token，如果接近過期則自動刷新
func (e *EnhancedJWTService) ValidateAndRefreshIfNeeded(ctx context.Context, accessToken, refreshTokenStr string) (*TokenValidationResult, error) {
	// 驗證訪問Token
	claims, err := e.SimpleJWTService.ValidateToken(accessToken)
	if err != nil {
		// Token無效，嘗試使用刷新Token
		if refreshTokenStr != "" {
			newPair, refreshErr := e.RefreshAccessToken(ctx, refreshTokenStr)
			if refreshErr != nil {
				return nil, fmt.Errorf("access token invalid and refresh failed: %w", refreshErr)
			}
			
			// 重新驗證新Token
			newClaims, validateErr := e.SimpleJWTService.ValidateToken(newPair.AccessToken)
			if validateErr != nil {
				return nil, fmt.Errorf("newly refreshed token is invalid: %w", validateErr)
			}

			return &TokenValidationResult{
				Claims:      newClaims,
				NewTokens:   newPair,
				WasRefreshed: true,
			}, nil
		}
		return nil, fmt.Errorf("access token invalid and no refresh token provided: %w", err)
	}

	// Token有效，檢查是否需要刷新（剩餘時間少於5分鐘）
	timeUntilExpiry := time.Until(claims.ExpiresAt.Time)
	if timeUntilExpiry < 5*time.Minute && refreshTokenStr != "" {
		newPair, refreshErr := e.RefreshAccessToken(ctx, refreshTokenStr)
		if refreshErr == nil {
			newClaims, validateErr := e.SimpleJWTService.ValidateToken(newPair.AccessToken)
			if validateErr == nil {
				return &TokenValidationResult{
					Claims:      newClaims,
					NewTokens:   newPair,
					WasRefreshed: true,
				}, nil
			}
		}
		// 刷新失敗但原Token仍有效，繼續使用原Token
	}

	return &TokenValidationResult{
		Claims:      claims,
		WasRefreshed: false,
	}, nil
}

// generateAndStoreRefreshToken 生成並儲存刷新Token
func (e *EnhancedJWTService) generateAndStoreRefreshToken(ctx context.Context, userID, companyID int64) (*RefreshToken, error) {
	// 生成刷新Token字符串
	tokenStr, err := generateSecureToken(32)
	if err != nil {
		return nil, fmt.Errorf("failed to generate secure token: %w", err)
	}

	refreshToken := &RefreshToken{
		UserID:    userID,
		CompanyID: companyID,
		Token:     tokenStr,
		ExpiresAt: time.Now().Add(e.refreshTTL),
		CreatedAt: time.Now(),
		IsRevoked: false,
	}

	// 儲存到資料庫
	query := `
		INSERT INTO refresh_tokens (user_id, company_id, token, expires_at, created_at, is_revoked)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`
	
	err = e.db.QueryRowContext(ctx, query,
		refreshToken.UserID,
		refreshToken.CompanyID,
		refreshToken.Token,
		refreshToken.ExpiresAt,
		refreshToken.CreatedAt,
		refreshToken.IsRevoked,
	).Scan(&refreshToken.ID)

	if err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	return refreshToken, nil
}

// validateRefreshToken 驗證刷新Token
func (e *EnhancedJWTService) validateRefreshToken(ctx context.Context, tokenStr string) (*RefreshToken, error) {
	var refreshToken RefreshToken
	query := `
		SELECT id, user_id, company_id, token, expires_at, created_at, is_revoked
		FROM refresh_tokens
		WHERE token = $1`
	
	err := e.db.GetContext(ctx, &refreshToken, query, tokenStr)
	if err != nil {
		return nil, fmt.Errorf("refresh token not found: %w", err)
	}

	return &refreshToken, nil
}

// getUserEmail 獲取用戶郵箱
func (e *EnhancedJWTService) getUserEmail(ctx context.Context, userID int64) (string, error) {
	var email string
	query := `SELECT email FROM users WHERE id = $1 AND deleted_at IS NULL`
	err := e.db.GetContext(ctx, &email, query, userID)
	if err != nil {
		return "", fmt.Errorf("user not found: %w", err)
	}
	return email, nil
}

// EnhancedTokenPair 增強的Token配對
type EnhancedTokenPair struct {
	*TokenPair
	RefreshToken   string `json:"refresh_token"`
	RefreshExpires int64  `json:"refresh_expires"`
}

// TokenValidationResult Token驗證結果
type TokenValidationResult struct {
	Claims       *SimpleClaims      `json:"claims"`
	NewTokens    *EnhancedTokenPair `json:"new_tokens,omitempty"`
	WasRefreshed bool               `json:"was_refreshed"`
}

// generateSecureToken 生成安全的隨機Token
func generateSecureToken(length int) (string, error) {
	// 使用現有的utils函數
	return generateSecureRandomString(length)
}