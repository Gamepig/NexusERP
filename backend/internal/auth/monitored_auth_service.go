package auth

import (
	"context"
	"fmt"
	"time"

	"nexus-erp/backend/internal/monitoring"
	
	"github.com/jmoiron/sqlx"
)

// MonitoredAuthService 帶監控的認證服務
type MonitoredAuthService struct {
	*SimpleAuthService
	monitor *monitoring.SecurityMonitor
}

func NewMonitoredAuthService(secret, issuer string, db *sqlx.DB) *MonitoredAuthService {
	return &MonitoredAuthService{
		SimpleAuthService: NewSimpleAuthService(secret, issuer, db),
		monitor:          monitoring.NewSecurityMonitor(db),
	}
}

// AuthenticateWithRLSAndMonitoring 認證並設定RLS上下文，包含監控
func (m *MonitoredAuthService) AuthenticateWithRLSAndMonitoring(ctx context.Context, userID, companyID int64, email, ipAddress, userAgent string) (*EnhancedAuthResult, error) {
	startTime := time.Now()

	// 記錄認證嘗試
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "jwt_authentication_attempt",
		UserID:    &userID,
		CompanyID: &companyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"email": email,
		},
		Severity: "info",
	})

	// 執行認證
	result, err := m.SimpleAuthService.AuthenticateWithRLS(ctx, userID, companyID, email)
	
	// 記錄JWT活動
	if err != nil {
		m.monitor.RecordJWTActivity("issue", false)
		
		// 記錄認證失敗
		m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "jwt_authentication_failed",
			UserID:    &userID,
			CompanyID: &companyID,
			IPAddress: ipAddress,
			UserAgent: userAgent,
			Details: map[string]interface{}{
				"email": email,
				"error": err.Error(),
			},
			Severity: "error",
		})
		
		return nil, err
	}

	m.monitor.RecordJWTActivity("issue", true)
	
	// 記錄RLS活動
	rlsTime := time.Since(startTime)
	m.monitor.RecordRLSActivity(rlsTime, true)
	m.monitor.RecordRLSContextSwitch()

	// 記錄成功認證
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "jwt_authentication_success",
		UserID:    &userID,
		CompanyID: &companyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"email":         email,
			"token_expires": result.TokenPair.ExpiresIn,
			"rls_active":    result.RLSActive,
		},
		Severity: "info",
	})

	return result, nil
}

// ValidateTokenAndSetRLSWithMonitoring 驗證Token並設定RLS上下文，包含監控
func (m *MonitoredAuthService) ValidateTokenAndSetRLSWithMonitoring(ctx context.Context, tokenString, ipAddress, userAgent string) (*SimpleClaims, error) {
	startTime := time.Now()

	// 執行驗證
	claims, err := m.SimpleAuthService.ValidateTokenAndSetRLS(ctx, tokenString)
	
	// 記錄JWT活動
	if err != nil {
		m.monitor.RecordJWTActivity("validate", false)
		
		// 記錄驗證失敗
		m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "jwt_validation_failed",
			IPAddress: ipAddress,
			UserAgent: userAgent,
			Details: map[string]interface{}{
				"error": err.Error(),
			},
			Severity: "warning",
		})
		
		return nil, err
	}

	m.monitor.RecordJWTActivity("validate", true)
	
	// 記錄RLS活動
	rlsTime := time.Since(startTime)
	m.monitor.RecordRLSActivity(rlsTime, true)
	m.monitor.RecordRLSContextSwitch()

	// 記錄成功驗證
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "jwt_validation_success",
		UserID:    &claims.UserID,
		CompanyID: &claims.CompanyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"email": claims.Email,
		},
		Severity: "info",
	})

	return claims, nil
}

// RefreshTokenWithRLSAndMonitoring 刷新Token並維持RLS上下文，包含監控
func (m *MonitoredAuthService) RefreshTokenWithRLSAndMonitoring(ctx context.Context, refreshTokenStr, ipAddress, userAgent string) (*EnhancedAuthResult, error) {
	startTime := time.Now()

	// 記錄刷新嘗試
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "jwt_refresh_attempt",
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"refresh_token_length": len(refreshTokenStr),
		},
		Severity: "info",
	})

	// 執行刷新
	result, err := m.SimpleAuthService.RefreshTokenWithRLS(ctx, refreshTokenStr)
	
	// 記錄JWT活動
	if err != nil {
		m.monitor.RecordJWTActivity("refresh", false)
		
		// 記錄刷新失敗
		m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "jwt_refresh_failed",
			IPAddress: ipAddress,
			UserAgent: userAgent,
			Details: map[string]interface{}{
				"error": err.Error(),
			},
			Severity: "error",
		})
		
		return nil, err
	}

	m.monitor.RecordJWTActivity("refresh", true)
	
	// 記錄RLS活動
	rlsTime := time.Since(startTime)
	m.monitor.RecordRLSActivity(rlsTime, true)
	m.monitor.RecordRLSContextSwitch()

	// 記錄成功刷新
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "jwt_refresh_success",
		UserID:    &result.UserID,
		CompanyID: &result.CompanyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"new_token_expires": result.TokenPair.ExpiresIn,
		},
		Severity: "info",
	})

	return result, nil
}

// LogoutAndClearRLSWithMonitoring 登出並清除RLS上下文，包含監控
func (m *MonitoredAuthService) LogoutAndClearRLSWithMonitoring(ctx context.Context, refreshTokenStr, ipAddress, userAgent string, userID, companyID int64) error {
	// 記錄登出嘗試
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "logout_attempt",
		UserID:    &userID,
		CompanyID: &companyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Severity:  "info",
	})

	// 執行登出
	err := m.SimpleAuthService.LogoutAndClearRLS(ctx, refreshTokenStr)
	
	if err != nil {
		// 記錄登出失敗
		m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "logout_failed",
			UserID:    &userID,
			CompanyID: &companyID,
			IPAddress: ipAddress,
			UserAgent: userAgent,
			Details: map[string]interface{}{
				"error": err.Error(),
			},
			Severity: "warning",
		})
		
		return err
	}

	// 記錄Token撤銷
	m.monitor.RecordJWTActivity("revoke", true)

	// 記錄成功登出
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "logout_success",
		UserID:    &userID,
		CompanyID: &companyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Severity:  "info",
	})

	return nil
}

// VerifyRLSContextWithMonitoring 驗證RLS上下文狀態，包含監控
func (m *MonitoredAuthService) VerifyRLSContextWithMonitoring(ctx context.Context, expectedUserID, expectedCompanyID int64, ipAddress, userAgent string) error {
	startTime := time.Now()

	err := m.SimpleAuthService.VerifyRLSContext(ctx, expectedUserID, expectedCompanyID)
	
	// 記錄RLS驗證活動
	rlsTime := time.Since(startTime)
	m.monitor.RecordRLSActivity(rlsTime, err == nil)

	if err != nil {
		// 記錄RLS驗證失敗 - 這可能是安全問題
		m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "rls_context_verification_failed",
			UserID:    &expectedUserID,
			CompanyID: &expectedCompanyID,
			IPAddress: ipAddress,
			UserAgent: userAgent,
			Details: map[string]interface{}{
				"error": err.Error(),
			},
			Severity: "critical", // 這是關鍵安全事件
		})
		
		return err
	}

	// 記錄成功驗證
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "rls_context_verification_success",
		UserID:    &expectedUserID,
		CompanyID: &expectedCompanyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Severity:  "info",
	})

	return nil
}

// GetSecurityMonitor 獲取監控服務實例
func (m *MonitoredAuthService) GetSecurityMonitor() *monitoring.SecurityMonitor {
	return m.monitor
}

// StartMonitoring 啟動監控服務
func (m *MonitoredAuthService) StartMonitoring(ctx context.Context) {
	go m.monitor.StartMetricsCollection(ctx)
}

// GetSecurityDashboard 獲取安全儀表板數據
func (m *MonitoredAuthService) GetSecurityDashboard(ctx context.Context) (map[string]interface{}, error) {
	summary, err := m.monitor.GetSecuritySummary(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get security summary: %w", err)
	}

	// 獲取最近的高風險事件
	recentHighRisk, err := m.monitor.GetRecentSecurityEvents(ctx, 10, "critical")
	if err != nil {
		recentHighRisk = []monitoring.SecurityEvent{} // 如果失敗，返回空列表
	}

	dashboard := map[string]interface{}{
		"summary":           summary,
		"recent_high_risk":  recentHighRisk,
		"dashboard_updated": time.Now(),
	}

	return dashboard, nil
}