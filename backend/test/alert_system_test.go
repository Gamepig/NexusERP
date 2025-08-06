package test

import (
	"context"
	"testing"
	"time"

	"nexus-erp/backend/internal/auth"
	"nexus-erp/backend/internal/monitoring"
	
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// setupTestDB 設置測試資料庫連接
func setupTestDB() *sqlx.DB {
	db, err := sqlx.Connect("postgres", "postgres://nexus:securepassword@localhost:5432/nexus_erp?sslmode=disable")
	if err != nil {
		panic(err)
	}
	return db
}

func TestAlertSystem_BasicFunctionality(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	// 創建告警系統
	alertSystem := monitoring.NewAlertSystem(db)
	ctx := context.Background()

	// 註冊通知通道
	securityMonitor := monitoring.NewSecurityMonitor(db)
	dbChannel := monitoring.NewDatabaseNotificationChannel(securityMonitor)
	alertSystem.RegisterNotificationChannel(dbChannel)

	// 測試創建告警
	t.Run("CreateAlert", func(t *testing.T) {
		alert := &monitoring.Alert{
			Type:     monitoring.AlertTypeSecurityBreach,
			Severity: monitoring.AlertSeverityWarning,
			Title:    "Test Security Alert",
			Message:  "This is a test security alert",
			Source:   "test_system",
			Metadata: map[string]interface{}{
				"test_key": "test_value",
				"user_id":  123,
			},
		}

		err := alertSystem.CreateAlert(ctx, alert)
		if err != nil {
			t.Fatalf("Failed to create alert: %v", err)
		}

		if alert.ID == 0 {
			t.Error("Alert ID should be set after creation")
		}

		if alert.CreatedAt.IsZero() {
			t.Error("CreatedAt should be set")
		}
	})

	// 測試查詢告警
	t.Run("GetAlerts", func(t *testing.T) {
		filters := monitoring.AlertFilters{
			Severity: monitoring.AlertSeverityWarning,
			Limit:    10,
		}

		alerts, err := alertSystem.GetAlerts(ctx, filters)
		if err != nil {
			t.Fatalf("Failed to get alerts: %v", err)
		}

		if len(alerts) == 0 {
			t.Error("Should have at least one alert")
		}

		// 驗證過濾器工作
		for _, alert := range alerts {
			if alert.Severity != monitoring.AlertSeverityWarning {
				t.Errorf("Expected severity %s, got %s", monitoring.AlertSeverityWarning, alert.Severity)
			}
		}
	})

	// 測試解決告警
	t.Run("ResolveAlert", func(t *testing.T) {
		// 先創建一個告警
		alert := &monitoring.Alert{
			Type:     monitoring.AlertTypePerformance,
			Severity: monitoring.AlertSeverityError,
			Title:    "Performance Issue",
			Message:  "High response time detected",
			Source:   "performance_monitor",
		}

		err := alertSystem.CreateAlert(ctx, alert)
		if err != nil {
			t.Fatalf("Failed to create alert: %v", err)
		}

		// 解決告警 (使用有效的用戶ID)
		err = alertSystem.ResolveAlert(ctx, alert.ID, 1060, "Issue resolved by restarting service")
		if err != nil {
			t.Fatalf("Failed to resolve alert: %v", err)
		}

		// 驗證告警已解決
		resolvedFilters := monitoring.AlertFilters{
			IsResolved: &[]bool{true}[0],
			Limit:      1,
		}

		resolvedAlerts, err := alertSystem.GetAlerts(ctx, resolvedFilters)
		if err != nil {
			t.Fatalf("Failed to get resolved alerts: %v", err)
		}

		found := false
		for _, a := range resolvedAlerts {
			if a.ID == alert.ID && a.IsResolved {
				found = true
				break
			}
		}

		if !found {
			t.Error("Alert should be marked as resolved")
		}
	})

	// 測試告警指標
	t.Run("AlertMetrics", func(t *testing.T) {
		metrics := alertSystem.GetMetrics()

		if metrics == nil {
			t.Fatal("Metrics should not be nil")
		}

		if metrics.TotalAlerts < 0 {
			t.Error("Total alerts should not be negative")
		}

		if metrics.AlertsBySeverity == nil {
			t.Error("AlertsBySeverity should not be nil")
		}

		if metrics.AlertsByType == nil {
			t.Error("AlertsByType should not be nil")
		}
	})
}

func TestNotificationChannels(t *testing.T) {
	// 測試通知通道
	t.Run("DatabaseNotificationChannel", func(t *testing.T) {
		db := setupTestDB()
		defer db.Close()

		monitor := monitoring.NewSecurityMonitor(db)
		channel := monitoring.NewDatabaseNotificationChannel(monitor)

		if channel.GetChannelType() != monitoring.AlertChannelDatabase {
			t.Errorf("Expected channel type %s, got %s", monitoring.AlertChannelDatabase, channel.GetChannelType())
		}

		alert := &monitoring.Alert{
			ID:       1,
			Type:     monitoring.AlertTypeSecurityBreach,
			Severity: monitoring.AlertSeverityCritical,
			Title:    "Test Alert",
			Message:  "Test message",
			Source:   "test",
		}

		ctx := context.Background()
		err := channel.Send(ctx, alert)
		if err != nil {
			t.Fatalf("Failed to send notification: %v", err)
		}
	})

	t.Run("SlackNotificationChannel", func(t *testing.T) {
		// 測試Slack通知通道（不需要真實的webhook URL）
		channel := monitoring.NewSlackNotificationChannel("")

		if channel.GetChannelType() != monitoring.AlertChannelSlack {
			t.Errorf("Expected channel type %s, got %s", monitoring.AlertChannelSlack, channel.GetChannelType())
		}

		alert := &monitoring.Alert{
			ID:       1,
			Type:     monitoring.AlertTypeSystemHealth,
			Severity: monitoring.AlertSeverityWarning,
			Title:    "System Health Alert",
			Message:  "System health check failed",
			Source:   "health_monitor",
			Metadata: map[string]interface{}{
				"component": "database",
				"status":    "degraded",
			},
		}

		ctx := context.Background()
		err := channel.Send(ctx, alert)
		// 預期會失敗，因為沒有配置webhook URL
		if err == nil {
			t.Error("Expected error when webhook URL is not configured")
		}
	})

	t.Run("EmailNotificationChannel", func(t *testing.T) {
		// 測試Email通知通道
		toEmails := []string{"admin@example.com", "security@example.com"}
		channel := monitoring.NewEmailNotificationChannel(
			"smtp.example.com", 587, "user", "pass", "alerts@example.com", toEmails,
		)

		if channel.GetChannelType() != monitoring.AlertChannelEmail {
			t.Errorf("Expected channel type %s, got %s", monitoring.AlertChannelEmail, channel.GetChannelType())
		}

		alert := &monitoring.Alert{
			ID:       1,
			Type:     monitoring.AlertTypeDataIntegrity,
			Severity: monitoring.AlertSeverityError,
			Title:    "Data Integrity Issue",
			Message:  "Data corruption detected in user table",
			Source:   "data_validator",
		}

		ctx := context.Background()
		// 這個測試只驗證功能，不實際發送郵件
		err := channel.Send(ctx, alert)
		if err != nil {
			t.Fatalf("Failed to send email notification: %v", err)
		}
	})
}

func TestAlertSystemIntegration(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	// 創建完整的告警系統
	alertSystem := monitoring.NewAlertSystem(db)
	securityMonitor := monitoring.NewSecurityMonitor(db)
	ctx := context.Background()

	// 註冊多個通知通道
	dbChannel := monitoring.NewDatabaseNotificationChannel(securityMonitor)
	emailChannel := monitoring.NewEmailNotificationChannel(
		"smtp.example.com", 587, "user", "pass", "alerts@example.com", []string{"admin@example.com"},
	)
	slackChannel := monitoring.NewSlackNotificationChannel("https://hooks.slack.com/test")

	alertSystem.RegisterNotificationChannel(dbChannel)
	alertSystem.RegisterNotificationChannel(emailChannel)
	alertSystem.RegisterNotificationChannel(slackChannel)

	// 測試完整的告警流程
	t.Run("FullAlertWorkflow", func(t *testing.T) {
		// 1. 創建不同嚴重程度的告警
		alerts := []*monitoring.Alert{
			{
				Type:     monitoring.AlertTypeSecurityBreach,
				Severity: monitoring.AlertSeverityInfo,
				Title:    "Login Attempt",
				Message:  "Normal login attempt detected",
				Source:   "auth_system",
			},
			{
				Type:     monitoring.AlertTypePerformance,
				Severity: monitoring.AlertSeverityWarning,
				Title:    "High Response Time",
				Message:  "API response time above threshold",
				Source:   "performance_monitor",
			},
			{
				Type:     monitoring.AlertTypeSystemHealth,
				Severity: monitoring.AlertSeverityError,
				Title:    "Service Unavailable",
				Message:  "Database connection failed",
				Source:   "health_check",
			},
			{
				Type:     monitoring.AlertTypeSecurityBreach,
				Severity: monitoring.AlertSeverityCritical,
				Title:    "Security Breach",
				Message:  "Unauthorized access detected",
				Source:   "security_monitor",
			},
		}

		// 創建所有告警
		for _, alert := range alerts {
			err := alertSystem.CreateAlert(ctx, alert)
			if err != nil {
				t.Fatalf("Failed to create alert: %v", err)
			}
		}

		// 2. 驗證告警已創建
		allAlerts, err := alertSystem.GetAlerts(ctx, monitoring.AlertFilters{Limit: 10})
		if err != nil {
			t.Fatalf("Failed to get alerts: %v", err)
		}

		if len(allAlerts) < len(alerts) {
			t.Errorf("Expected at least %d alerts, got %d", len(alerts), len(allAlerts))
		}

		// 3. 解決一些告警
		for _, alert := range alerts[:2] {
			err := alertSystem.ResolveAlert(ctx, alert.ID, 1060, "Resolved by test")
			if err != nil {
				t.Fatalf("Failed to resolve alert %d: %v", alert.ID, err)
			}
		}

		// 4. 驗證指標更新
		metrics := alertSystem.GetMetrics()
		if metrics.TotalAlerts == 0 {
			t.Error("Total alerts should be greater than 0")
		}

		if metrics.ResolvedAlerts == 0 {
			t.Error("Should have some resolved alerts")
		}

		if metrics.UnresolvedAlerts == 0 {
			t.Error("Should have some unresolved alerts")
		}

		// 5. 測試過濾功能
		criticalAlerts, err := alertSystem.GetAlerts(ctx, monitoring.AlertFilters{
			Severity: monitoring.AlertSeverityCritical,
			IsResolved: &[]bool{false}[0],
		})
		if err != nil {
			t.Fatalf("Failed to get critical alerts: %v", err)
		}

		criticalCount := 0
		for _, alert := range criticalAlerts {
			if alert.Severity == monitoring.AlertSeverityCritical && !alert.IsResolved {
				criticalCount++
			}
		}

		if criticalCount == 0 {
			t.Error("Should have at least one unresolved critical alert")
		}
	})
}

// 基準測試：告警系統效能
func BenchmarkAlertSystem_CreateAlert(b *testing.B) {
	db := setupTestDB()
	defer db.Close()

	alertSystem := monitoring.NewAlertSystem(db)
	securityMonitor := monitoring.NewSecurityMonitor(db)
	dbChannel := monitoring.NewDatabaseNotificationChannel(securityMonitor)
	alertSystem.RegisterNotificationChannel(dbChannel)

	ctx := context.Background()

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		alert := &monitoring.Alert{
			Type:     monitoring.AlertTypePerformance,
			Severity: monitoring.AlertSeverityWarning,
			Title:    "Benchmark Alert",
			Message:  "This is a benchmark test alert",
			Source:   "benchmark",
			Metadata: map[string]interface{}{
				"iteration": i,
			},
		}

		alertSystem.CreateAlert(ctx, alert)
	}
}

func BenchmarkAlertSystem_GetAlerts(b *testing.B) {
	db := setupTestDB()
	defer db.Close()

	alertSystem := monitoring.NewAlertSystem(db)
	ctx := context.Background()

	// 預先創建一些告警
	for i := 0; i < 100; i++ {
		alert := &monitoring.Alert{
			Type:     monitoring.AlertTypePerformance,
			Severity: monitoring.AlertSeverityWarning,
			Title:    "Test Alert",
			Message:  "Test message",
			Source:   "test",
		}
		alertSystem.CreateAlert(ctx, alert)
	}

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		alertSystem.GetAlerts(ctx, monitoring.AlertFilters{Limit: 10})
	}
}

// SecurityMonitor 相關測試

func TestSecurityMonitor_LogSecurityEvent(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	monitor := monitoring.NewSecurityMonitor(db)
	ctx := context.Background()

	// 測試記錄安全事件
	event := monitoring.SecurityEvent{
		EventType: "test_event",
		IPAddress: "127.0.0.1",
		UserAgent: "test-agent",
		Details: map[string]interface{}{
			"test_key": "test_value",
			"timestamp": time.Now(),
		},
		Severity: "info",
	}

	err := monitor.LogSecurityEvent(ctx, event)
	if err != nil {
		t.Fatalf("Failed to log security event: %v", err)
	}

	// 驗證事件已記錄
	events, err := monitor.GetRecentSecurityEvents(ctx, 1, "")
	if err != nil {
		t.Fatalf("Failed to get security events: %v", err)
	}

	if len(events) == 0 {
		t.Fatal("No security events found")
	}

	if events[0].EventType != "test_event" {
		t.Errorf("Expected event type 'test_event', got '%s'", events[0].EventType)
	}
}

func TestSecurityMonitor_JWTMetrics(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	monitor := monitoring.NewSecurityMonitor(db)

	// 記錄JWT活動
	monitor.RecordJWTActivity("issue", true)
	monitor.RecordJWTActivity("validate", true)
	monitor.RecordJWTActivity("validate", false)

	// 獲取指標
	metrics := monitor.GetJWTMetrics()

	if metrics.TokensIssued != 1 {
		t.Errorf("Expected 1 token issued, got %d", metrics.TokensIssued)
	}

	if metrics.TokensValidated != 1 {
		t.Errorf("Expected 1 token validated, got %d", metrics.TokensValidated)
	}

	if metrics.FailedValidations != 1 {
		t.Errorf("Expected 1 failed validation, got %d", metrics.FailedValidations)
	}
}

func TestSecurityMonitor_RLSMetrics(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	monitor := monitoring.NewSecurityMonitor(db)

	// 記錄RLS活動
	monitor.RecordRLSActivity(50*time.Millisecond, true)
	monitor.RecordRLSActivity(150*time.Millisecond, true) // 慢查詢
	monitor.RecordRLSActivity(0, false) // 失敗

	// 獲取指標
	metrics := monitor.GetRLSMetrics()

	if metrics.QueriesExecuted != 2 {
		t.Errorf("Expected 2 queries executed, got %d", metrics.QueriesExecuted)
	}

	if metrics.SlowQueries != 1 {
		t.Errorf("Expected 1 slow query, got %d", metrics.SlowQueries)
	}

	if metrics.FailedContextSets != 1 {
		t.Errorf("Expected 1 failed context set, got %d", metrics.FailedContextSets)
	}

	// 檢查平均響應時間計算
	expectedAvg := (50.0 + 150.0) / 2.0
	if metrics.AvgResponseTime != expectedAvg {
		t.Errorf("Expected average response time %.2f, got %.2f", expectedAvg, metrics.AvgResponseTime)
	}
}

func TestMonitoredAuthService_Authentication(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	// 創建監控的認證服務
	authService := auth.NewMonitoredAuthService("test-secret", "nexus-erp", db)
	ctx := context.Background()

	// 先記錄一些指標活動
	monitor := authService.GetSecurityMonitor()
	monitor.RecordJWTActivity("issue", true)
	monitor.RecordJWTActivity("validate", true)
	monitor.RecordRLSActivity(50*time.Millisecond, true)
	
	// 測試獲取安全摘要
	summary, err := authService.GetSecurityDashboard(ctx)
	if err != nil {
		t.Fatalf("Failed to get security summary: %v", err)
	}

	if summary == nil {
		t.Fatal("Security summary is nil")
	}

	// 驗證摘要結構
	if _, ok := summary["summary"]; !ok {
		t.Error("Security dashboard missing summary")
	}

	// 檢查 summary 內部是否包含 jwt_metrics 和 rls_metrics
	innerSummary, ok := summary["summary"].(map[string]interface{})
	if !ok {
		t.Fatal("Summary is not a map[string]interface{}")
	}

	if _, ok := innerSummary["jwt_metrics"]; !ok {
		t.Error("Security summary missing jwt_metrics")
	}

	if _, ok := innerSummary["rls_metrics"]; !ok {
		t.Error("Security summary missing rls_metrics")
	}
}

func TestSecurityMonitor_SecuritySummary(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	monitor := monitoring.NewSecurityMonitor(db)
	ctx := context.Background()

	// 記錄一些測試事件
	testEvents := []monitoring.SecurityEvent{
		{
			EventType: "login_attempt",
			IPAddress: "192.168.1.1",
			UserAgent: "test-browser",
			Severity:  "info",
		},
		{
			EventType: "login_failed",
			IPAddress: "192.168.1.1",
			UserAgent: "test-browser",
			Severity:  "warning",
		},
		{
			EventType: "suspicious_activity",
			IPAddress: "10.0.0.1",
			UserAgent: "malicious-bot",
			Severity:  "critical",
		},
	}

	for _, event := range testEvents {
		err := monitor.LogSecurityEvent(ctx, event)
		if err != nil {
			t.Fatalf("Failed to log event: %v", err)
		}
	}

	// 獲取安全摘要
	summary, err := monitor.GetSecuritySummary(ctx)
	if err != nil {
		t.Fatalf("Failed to get security summary: %v", err)
	}

	// 驗證摘要包含預期的數據
	if summary["generated_at"] == nil {
		t.Error("Security summary missing generated_at")
	}

	if summary["event_summary"] == nil {
		t.Error("Security summary missing event_summary")
	}
}

// 基準測試：測試監控系統的效能影響
func BenchmarkSecurityMonitor_LogEvent(b *testing.B) {
	db := setupTestDB()
	defer db.Close()

	monitor := monitoring.NewSecurityMonitor(db)
	ctx := context.Background()

	event := monitoring.SecurityEvent{
		EventType: "benchmark_test",
		IPAddress: "127.0.0.1",
		UserAgent: "benchmark",
		Details: map[string]interface{}{
			"iteration": 0,
		},
		Severity: "info",
	}

	b.ResetTimer()
	
	for i := 0; i < b.N; i++ {
		event.Details["iteration"] = i
		monitor.LogSecurityEvent(ctx, event)
	}
}

func BenchmarkSecurityMonitor_RecordMetrics(b *testing.B) {
	db := setupTestDB()
	defer db.Close()

	monitor := monitoring.NewSecurityMonitor(db)

	b.ResetTimer()
	
	for i := 0; i < b.N; i++ {
		monitor.RecordJWTActivity("validate", true)
		monitor.RecordRLSActivity(time.Millisecond*50, true)
	}
}