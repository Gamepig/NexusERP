package auth

import (
	"fmt"
	"time"

	"nexus-erp/backend/internal/utils"
	
	"github.com/golang-jwt/jwt/v5"
)

// SimpleClaims 簡化的Claims結構 - 只包含必要資訊
type SimpleClaims struct {
	UserID    int64  `json:"user_id"`
	CompanyID int64  `json:"company_id"`
	Email     string `json:"email"`
	jwt.RegisteredClaims
}

// SimpleJWTService 簡化的JWT服務 - 專注核心功能
type SimpleJWTService struct {
	secretKey []byte
	issuer    string
	accessTTL time.Duration
}

func NewSimpleJWTService(secret, issuer string) *SimpleJWTService {
	return &SimpleJWTService{
		secretKey: []byte(secret),
		issuer:    issuer,
		accessTTL: 15 * time.Minute, // 短期Token
	}
}

// GenerateToken 生成Token - 簡單直接
func (s *SimpleJWTService) GenerateToken(userID, companyID int64, email string) (string, error) {
	now := time.Now()
	claims := &SimpleClaims{
		UserID:    userID,
		CompanyID: companyID,
		Email:     email,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   fmt.Sprintf("user:%d", userID),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.accessTTL)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secretKey)
}

// ValidateToken 驗證Token - 基本驗證
func (s *SimpleJWTService) ValidateToken(tokenString string) (*SimpleClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &SimpleClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.secretKey, nil
	})
	
	if err != nil {
		return nil, err
	}
	
	if claims, ok := token.Claims.(*SimpleClaims); ok && token.Valid {
		return claims, nil
	}
	
	return nil, fmt.Errorf("invalid token")
}

// GenerateTokenPair 生成Access和Refresh Token配對
func (s *SimpleJWTService) GenerateTokenPair(userID, companyID int64, email string) (*TokenPair, error) {
	// 生成Access Token
	accessToken, err := s.GenerateToken(userID, companyID, email)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}
	
	// 生成Refresh Token (使用現有utils)
	refreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}
	
	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.accessTTL.Seconds()),
	}, nil
}

// TokenPair Token配對結構
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

// AuthResult 認證結果
type AuthResult struct {
	*TokenPair
	UserID    int64 `json:"user_id"`
	CompanyID int64 `json:"company_id"`
	RLSActive bool  `json:"rls_active"`
}

// EnhancedAuthResult 增強的認證結果
type EnhancedAuthResult struct {
	*TokenPair
	RefreshToken   string `json:"refresh_token"`
	RefreshExpires int64  `json:"refresh_expires"`
	UserID         int64  `json:"user_id"`
	CompanyID      int64  `json:"company_id"`
	RLSActive      bool   `json:"rls_active"`
}