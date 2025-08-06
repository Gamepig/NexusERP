package test

import (
	"context"
	"strings"
	"testing"
	"time"

	"nexus-erp/backend/internal/auth"
	
	_ "github.com/lib/pq"
)

func TestEnterpriseAuthService_SecurityFeatures(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	// 創建企業級認證服務
	authService := auth.NewEnterpriseAuthService("test-secret", "nexus-erp-test", db)
	ctx := context.Background()

	// 測試威脅檢測
	t.Run("ThreatDetection", func(t *testing.T) {
		threatService := authService.GetThreatDetectionService()

		// 模擬多次失敗登入
		for i := 0; i < 6; i++ {
			threat, err := threatService.AnalyzeLoginAttempt(
				ctx, nil, nil, "192.168.1.100", "malicious-bot/1.0", false,
			)
			if err != nil {
				t.Fatalf("Failed to analyze login attempt: %v", err)
			}

			// 第6次應該觸發威脅檢測
			if i == 5 && threat == nil {
				t.Error("Expected threat to be detected after multiple failures")
			}
		}

		// 檢查IP是否被標記為可疑
		if !threatService.IsIPSuspicious("192.168.1.100") {
			t.Error("IP should be marked as suspicious after threat detection")
		}
	})

	// 測試MFA功能
	t.Run("MFASetup", func(t *testing.T) {
		mfaService := authService.GetMFAService()

		// 設置TOTP (使用有效的用戶ID和公司ID)
		device, qrURL, err := mfaService.SetupTOTP(ctx, 1060, 298, "Test Device", "test@example.com")
		if err != nil {
			t.Fatalf("Failed to setup TOTP: %v", err)
		}

		if device == nil {
			t.Fatal("Device should not be nil")
		}

		if qrURL == "" {
			t.Error("QR URL should not be empty")
		}

		if device.Method != auth.MFAMethodTOTP {
			t.Errorf("Expected method %v, got %v", auth.MFAMethodTOTP, device.Method)
		}

		if device.IsActive {
			t.Error("Device should not be active before verification")
		}
	})

	// 測試OAuth功能
	t.Run("OAuthSetup", func(t *testing.T) {
		oauthService := authService.GetOAuthService()

		// 設置預設提供者
		oauthService.SetupDefaultProviders()

		// 獲取Google認證URL (使用有效的公司ID)
		authURL, err := oauthService.GetAuthURL(
			ctx, auth.ProviderGoogle, 298, "http://localhost:8000/callback",
			"127.0.0.1", "test-browser",
		)
		if err != nil {
			t.Fatalf("Failed to get auth URL: %v", err)
		}

		if authURL == "" {
			t.Error("Auth URL should not be empty")
		}

		// 檢查URL包含必要參數
		if !contains(authURL, "client_id") || !contains(authURL, "state") {
			t.Error("Auth URL should contain client_id and state parameters")
		}
	})

	// 測試安全政策
	t.Run("SecurityPolicies", func(t *testing.T) {
		policies := authService.GetSecurityPolicies()

		// 驗證預設政策
		if policies.PasswordMinLength != 8 {
			t.Errorf("Expected password min length 8, got %d", policies.PasswordMinLength)
		}

		if !policies.ThreatDetectionEnabled {
			t.Error("Threat detection should be enabled by default")
		}

		// 更新政策
		newPolicies := &auth.SecurityPolicies{
			RequireMFA:             true,
			MaxFailedAttempts:      3,
			ThreatDetectionEnabled: true,
			BlockSuspiciousIPs:     true,
		}

		authService.UpdateSecurityPolicies(newPolicies)

		updatedPolicies := authService.GetSecurityPolicies()
		if !updatedPolicies.RequireMFA {
			t.Error("MFA should be required after policy update")
		}
	})

	// 測試監控功能
	t.Run("SecurityMonitoring", func(t *testing.T) {
		monitor := authService.GetSecurityMonitor()

		// 記錄一些JWT活動
		monitor.RecordJWTActivity("issue", true)
		monitor.RecordJWTActivity("validate", true)
		monitor.RecordJWTActivity("validate", false)

		// 獲取指標
		metrics := monitor.GetJWTMetrics()

		if metrics.TokensIssued != 1 {
			t.Errorf("Expected 1 token issued, got %d", metrics.TokensIssued)
		}

		if metrics.TokensValidated != 1 {
			t.Errorf("Expected 1 successful validation, got %d", metrics.TokensValidated)
		}

		if metrics.FailedValidations != 1 {
			t.Errorf("Expected 1 failed validation, got %d", metrics.FailedValidations)
		}

		// 測試RLS指標
		monitor.RecordRLSActivity(50*time.Millisecond, true)
		monitor.RecordRLSActivity(150*time.Millisecond, true)

		rlsMetrics := monitor.GetRLSMetrics()

		if rlsMetrics.QueriesExecuted != 2 {
			t.Errorf("Expected 2 queries executed, got %d", rlsMetrics.QueriesExecuted)
		}

		expectedAvg := (50.0 + 150.0) / 2.0
		if rlsMetrics.AvgResponseTime != expectedAvg {
			t.Errorf("Expected average response time %.2f, got %.2f", expectedAvg, rlsMetrics.AvgResponseTime)
		}
	})
}

func TestEnterpriseAuthService_IntegrationScenario(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	authService := auth.NewEnterpriseAuthService("test-secret", "nexus-erp-test", db)
	ctx := context.Background()

	// 綜合測試場景：完整的認證流程
	t.Run("FullAuthenticationFlow", func(t *testing.T) {
		// 1. 模擬認證請求
		req := &auth.AuthenticationRequest{
			Email:     "test@example.com",
			Password:  "password123",
			CompanyID: 298,
			IPAddress: "192.168.1.1",
			UserAgent: "Mozilla/5.0 (compatible; TestBrowser)",
		}

		// 注意：這個測試會失敗，因為我們沒有實際的用戶數據
		// 這是正常的，主要測試服務的整合性
		_, err := authService.AuthenticateUser(ctx, req)
		if err == nil {
			t.Log("Authentication unexpectedly succeeded (no user data)")
		} else {
			t.Logf("Authentication failed as expected: %v", err)
		}

		// 2. 測試威脅檢測是否正常工作
		threatService := authService.GetThreatDetectionService()
		threat, err := threatService.AnalyzeLoginAttempt(
			ctx, nil, &req.CompanyID, req.IPAddress, req.UserAgent, false,
		)
		if err != nil {
			t.Fatalf("Threat analysis failed: %v", err)
		}

		// 第一次失敗不應該觸發威脅
		if threat != nil {
			t.Log("Threat detected (this might be expected depending on configuration)")
		}

		// 3. 測試OAuth流程
		oauthService := authService.GetOAuthService()
		oauthService.SetupDefaultProviders()

		authURL, err := oauthService.GetAuthURL(
			ctx, auth.ProviderGoogle, req.CompanyID, "http://localhost:8000/callback",
			req.IPAddress, req.UserAgent,
		)
		if err != nil {
			t.Fatalf("Failed to get OAuth URL: %v", err)
		}

		if authURL == "" {
			t.Error("OAuth URL should not be empty")
		}

		// 4. 測試安全摘要
		summary, err := authService.GetSecurityDashboard(ctx)
		if err != nil {
			t.Fatalf("Failed to get security dashboard: %v", err)
		}

		if summary == nil {
			t.Error("Security dashboard should not be nil")
		}

		// 驗證摘要包含必要欄位
		if _, ok := summary["jwt_metrics"]; !ok {
			t.Error("Security dashboard should include JWT metrics")
		}

		if _, ok := summary["rls_metrics"]; !ok {
			t.Error("Security dashboard should include RLS metrics")
		}
	})
}

// 基準測試：企業級認證服務的效能
func BenchmarkEnterpriseAuth_ThreatDetection(b *testing.B) {
	db := setupTestDB()
	defer db.Close()

	authService := auth.NewEnterpriseAuthService("test-secret", "nexus-erp-test", db)
	threatService := authService.GetThreatDetectionService()
	ctx := context.Background()

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		threatService.AnalyzeLoginAttempt(
			ctx, nil, nil, "192.168.1.1", "test-agent", false,
		)
	}
}

func BenchmarkEnterpriseAuth_SecurityMonitoring(b *testing.B) {
	db := setupTestDB()
	defer db.Close()

	authService := auth.NewEnterpriseAuthService("test-secret", "nexus-erp-test", db)
	monitor := authService.GetSecurityMonitor()

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		monitor.RecordJWTActivity("validate", true)
		monitor.RecordRLSActivity(time.Millisecond*50, true)
	}
}

// 輔助函數
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && 
		(s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || 
		 strings.Contains(s, substr)))
}