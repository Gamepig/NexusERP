package auth

import (
	"context"
	"fmt"
	"log"
	
	"github.com/jmoiron/sqlx"
)

// SimpleAuthService 簡化的統一認證服務
type SimpleAuthService struct {
	jwtService *EnhancedJWTService
	rlsService *SimpleRLSService
	db         *sqlx.DB
}

func NewSimpleAuthService(secret, issuer string, db *sqlx.DB) *SimpleAuthService {
	return &SimpleAuthService{
		jwtService: NewEnhancedJWTService(secret, issuer, db),
		rlsService: NewSimpleRLSService(db),
		db:         db,
	}
}

// AuthenticateWithRLS 認證並設定RLS上下文
func (s *SimpleAuthService) AuthenticateWithRLS(ctx context.Context, userID, companyID int64, email string) (*EnhancedAuthResult, error) {
	// 1. 生成增強的JWT Token配對
	tokenPair, err := s.jwtService.GenerateTokenPairWithRefresh(ctx, userID, companyID, email)
	if err != nil {
		return nil, fmt.Errorf("failed to generate JWT: %w", err)
	}
	
	// 2. 設定RLS上下文
	if err := s.rlsService.SetSimpleRLSContext(ctx, userID, companyID); err != nil {
		log.Printf("Warning: RLS context setup failed: %v", err)
		// 不中斷認證流程，但記錄警告
	}
	
	// 3. 返回增強的認證結果
	return &EnhancedAuthResult{
		TokenPair:      tokenPair.TokenPair,
		RefreshToken:   tokenPair.RefreshToken,
		RefreshExpires: tokenPair.RefreshExpires,
		UserID:         userID,
		CompanyID:      companyID,
		RLSActive:      true,
	}, nil
}

// ValidateTokenAndSetRLS 驗證Token並設定RLS上下文
func (s *SimpleAuthService) ValidateTokenAndSetRLS(ctx context.Context, tokenString string) (*SimpleClaims, error) {
	// 1. 驗證JWT Token
	claims, err := s.jwtService.ValidateToken(tokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}
	
	// 2. 設定RLS上下文
	if err := s.rlsService.SetSimpleRLSContext(ctx, claims.UserID, claims.CompanyID); err != nil {
		log.Printf("Warning: RLS context setup failed for user %d, company %d: %v", 
			claims.UserID, claims.CompanyID, err)
		// 繼續執行，但RLS可能不生效
	}
	
	return claims, nil
}

// RefreshTokenWithRLS 使用刷新Token刷新並維持RLS上下文
func (s *SimpleAuthService) RefreshTokenWithRLS(ctx context.Context, refreshTokenStr string) (*EnhancedAuthResult, error) {
	// 1. 使用刷新Token生成新的Token配對
	tokenPair, err := s.jwtService.RefreshAccessToken(ctx, refreshTokenStr)
	if err != nil {
		return nil, fmt.Errorf("failed to refresh JWT: %w", err)
	}
	
	// 2. 從新Token中獲取用戶信息
	claims, err := s.jwtService.ValidateToken(tokenPair.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refreshed token: %w", err)
	}
	
	// 3. 重新設定RLS上下文
	if err := s.rlsService.SetSimpleRLSContext(ctx, claims.UserID, claims.CompanyID); err != nil {
		log.Printf("Warning: RLS context refresh failed: %v", err)
	}
	
	return &EnhancedAuthResult{
		TokenPair:      tokenPair.TokenPair,
		RefreshToken:   tokenPair.RefreshToken,
		RefreshExpires: tokenPair.RefreshExpires,
		UserID:         claims.UserID,
		CompanyID:      claims.CompanyID,
		RLSActive:      true,
	}, nil
}

// LogoutAndClearRLS 登出並清除RLS上下文
func (s *SimpleAuthService) LogoutAndClearRLS(ctx context.Context, refreshTokenStr string) error {
	// 撤銷刷新Token
	if refreshTokenStr != "" {
		if err := s.jwtService.RevokeRefreshToken(ctx, refreshTokenStr); err != nil {
			log.Printf("Warning: Failed to revoke refresh token: %v", err)
		}
	}
	
	// 清除RLS上下文
	if err := s.rlsService.ClearRLSContext(ctx); err != nil {
		log.Printf("Warning: Failed to clear RLS context: %v", err)
	}
	
	return nil
}

// VerifyRLSContext 驗證RLS上下文狀態
func (s *SimpleAuthService) VerifyRLSContext(ctx context.Context, expectedUserID, expectedCompanyID int64) error {
	userID, companyID, err := s.rlsService.GetCurrentRLSContext(ctx)
	if err != nil {
		return fmt.Errorf("failed to get RLS context: %w", err)
	}
	
	if userID != expectedUserID || companyID != expectedCompanyID {
		return fmt.Errorf("RLS context mismatch: expected user=%d company=%d, got user=%d company=%d",
			expectedUserID, expectedCompanyID, userID, companyID)
	}
	
	return nil
}