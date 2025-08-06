package auth

import (
	"context"
	"fmt"
	"strconv"
	
	"github.com/jmoiron/sqlx"
)

// SimpleRLSService 簡化的RLS上下文管理
type SimpleRLSService struct {
	db *sqlx.DB
}

func NewSimpleRLSService(db *sqlx.DB) *SimpleRLSService {
	return &SimpleRLSService{
		db: db,
	}
}

// SetSimpleRLSContext 簡化的RLS上下文設定
func (s *SimpleRLSService) SetSimpleRLSContext(ctx context.Context, userID, companyID int64) error {
	// 基本輸入驗證
	if userID <= 0 || companyID <= 0 {
		return fmt.Errorf("invalid user_id (%d) or company_id (%d)", userID, companyID)
	}
	
	// 驗證用戶-公司關聯
	if !s.validateUserCompanyAccess(ctx, userID, companyID) {
		return fmt.Errorf("user %d does not have access to company %d", userID, companyID)
	}
	
	// 設定RLS上下文變數
	queries := []string{
		fmt.Sprintf("SET LOCAL app.current_user_id = '%d'", userID),
		fmt.Sprintf("SET LOCAL app.current_company_id = '%d'", companyID),
	}
	
	for _, query := range queries {
		if _, err := s.db.ExecContext(ctx, query); err != nil {
			return fmt.Errorf("failed to set RLS context: %w", err)
		}
	}
	
	return nil
}

// validateUserCompanyAccess 驗證用戶對公司的存取權限
func (s *SimpleRLSService) validateUserCompanyAccess(ctx context.Context, userID, companyID int64) bool {
	// 簡化版：檢查users表中的company_id
	query := `
		SELECT COUNT(*) 
		FROM users 
		WHERE id = $1 
		AND company_id = $2 
		AND deleted_at IS NULL`
	
	var count int
	err := s.db.QueryRowContext(ctx, query, userID, companyID).Scan(&count)
	if err != nil {
		return false
	}
	
	return count > 0
}

// ClearRLSContext 清除RLS上下文
func (s *SimpleRLSService) ClearRLSContext(ctx context.Context) error {
	queries := []string{
		"SET LOCAL app.current_user_id = ''",
		"SET LOCAL app.current_company_id = ''",
	}
	
	for _, query := range queries {
		if _, err := s.db.ExecContext(ctx, query); err != nil {
			return fmt.Errorf("failed to clear RLS context: %w", err)
		}
	}
	
	return nil
}

// GetCurrentRLSContext 獲取當前RLS上下文
func (s *SimpleRLSService) GetCurrentRLSContext(ctx context.Context) (userID, companyID int64, err error) {
	query := `
		SELECT 
			COALESCE(current_setting('app.current_user_id', true), '0'),
			COALESCE(current_setting('app.current_company_id', true), '0')`
	
	var userIDStr, companyIDStr string
	err = s.db.QueryRowContext(ctx, query).Scan(&userIDStr, &companyIDStr)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get RLS context: %w", err)
	}
	
	userID, _ = strconv.ParseInt(userIDStr, 10, 64)
	companyID, _ = strconv.ParseInt(companyIDStr, 10, 64)
	
	return userID, companyID, nil
}