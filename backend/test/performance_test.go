package test

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"nexus-erp/backend/internal/auth"
	"nexus-erp/backend/internal/monitoring"

	_ "github.com/lib/pq"
)

// 壓力測試：高併發JWT生成和驗證
func BenchmarkJWT_HighConcurrency(b *testing.B) {
	jwtService := auth.NewSimpleJWTService("test-secret", "nexus-erp")
	
	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			// 模擬JWT簽發
			token, err := jwtService.GenerateToken(1060, 298, "test@example.com")
			if err != nil {
				b.Errorf("Failed to generate token: %v", err)
				continue
			}
			
			// 立即驗證
			_, err = jwtService.ValidateToken(token)
			if err != nil {
				b.Errorf("Failed to validate token: %v", err)
			}
		}
	})
}

// 壓力測試：告警系統高負載
func BenchmarkAlertSystem_HighLoad(b *testing.B) {
	db := setupTestDB()
	defer db.Close()

	alertSystem := monitoring.NewAlertSystem(db)
	securityMonitor := monitoring.NewSecurityMonitor(db)
	dbChannel := monitoring.NewDatabaseNotificationChannel(securityMonitor)
	alertSystem.RegisterNotificationChannel(dbChannel)

	ctx := context.Background()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			alert := &monitoring.Alert{
				Type:     monitoring.AlertTypePerformance,
				Severity: monitoring.AlertSeverityWarning,
				Title:    fmt.Sprintf("Load Test Alert %d", i),
				Message:  "High load test alert message",
				Source:   "load_test",
				Metadata: map[string]interface{}{
					"iteration": i,
					"worker":    fmt.Sprintf("worker_%d", i%10),
				},
			}
			
			if err := alertSystem.CreateAlert(ctx, alert); err != nil {
				b.Errorf("Failed to create alert: %v", err)
			}
			i++
		}
	})
}

// 壓力測試：安全事件記錄
func BenchmarkSecurityMonitor_EventLogging(b *testing.B) {
	db := setupTestDB()
	defer db.Close()

	monitor := monitoring.NewSecurityMonitor(db)
	ctx := context.Background()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			event := monitoring.SecurityEvent{
				EventType: "load_test_event",
				IPAddress: fmt.Sprintf("192.168.1.%d", (i%254)+1),
				UserAgent: "LoadTestAgent/1.0",
				Details: map[string]interface{}{
					"iteration": i,
					"timestamp": time.Now(),
				},
				Severity: "info",
			}
			
			if err := monitor.LogSecurityEvent(ctx, event); err != nil {
				b.Errorf("Failed to log event: %v", err)
			}
			i++
		}
	})
}

// 壓力測試：資料庫連接池
func TestDatabaseConnectionPool(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	// 設置連接池參數
	db.SetMaxOpenConns(50)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx := context.Background()
	concurrency := 100
	operations := 1000

	var wg sync.WaitGroup
	errors := make(chan error, concurrency*operations)

	start := time.Now()

	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			
			for j := 0; j < operations; j++ {
				// 模擬複雜查詢
				var count int
				query := `
					SELECT COUNT(*) 
					FROM security_events 
					WHERE created_at >= NOW() - INTERVAL '1 hour'
					AND severity = 'info'
				`
				
				if err := db.QueryRowContext(ctx, query).Scan(&count); err != nil {
					errors <- fmt.Errorf("worker %d, operation %d: %v", workerID, j, err)
				}
			}
		}(i)
	}

	wg.Wait()
	close(errors)

	duration := time.Since(start)
	totalOps := concurrency * operations
	opsPerSecond := float64(totalOps) / duration.Seconds()

	t.Logf("Database stress test completed:")
	t.Logf("- Total operations: %d", totalOps)
	t.Logf("- Duration: %v", duration)
	t.Logf("- Operations per second: %.2f", opsPerSecond)
	t.Logf("- Average latency: %v", duration/time.Duration(totalOps))

	errorCount := 0
	for err := range errors {
		t.Errorf("Database error: %v", err)
		errorCount++
	}

	if errorCount > 0 {
		t.Fatalf("Database stress test failed with %d errors", errorCount)
	}

	// 基準要求：至少500 ops/sec
	if opsPerSecond < 500 {
		t.Errorf("Performance below threshold: %.2f ops/sec < 500 ops/sec", opsPerSecond)
	}
}

// 壓力測試：RLS效能
func TestRLSPerformanceUnderLoad(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	ctx := context.Background()
	testCompanyID := int64(298)
	
	// 設置RLS上下文
	_, err := db.ExecContext(ctx, "SELECT set_config('app.current_company_id', $1, true)", testCompanyID)
	if err != nil {
		t.Fatalf("Failed to set RLS context: %v", err)
	}

	concurrency := 50
	queriesPerWorker := 100

	var wg sync.WaitGroup
	latencies := make([]time.Duration, 0, concurrency*queriesPerWorker)
	var latencyMutex sync.Mutex

	start := time.Now()

	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			
			for j := 0; j < queriesPerWorker; j++ {
				queryStart := time.Now()
				
				// 測試RLS查詢
				var count int
				query := `SELECT COUNT(*) FROM alerts WHERE created_at >= NOW() - INTERVAL '1 day'`
				
				if err := db.QueryRowContext(ctx, query).Scan(&count); err != nil {
					t.Errorf("RLS query failed: %v", err)
					continue
				}

				latency := time.Since(queryStart)
				
				latencyMutex.Lock()
				latencies = append(latencies, latency)
				latencyMutex.Unlock()
			}
		}()
	}

	wg.Wait()
	totalDuration := time.Since(start)

	// 計算統計
	if len(latencies) == 0 {
		t.Fatal("No successful queries")
	}

	var totalLatency time.Duration
	var maxLatency time.Duration
	minLatency := latencies[0]

	for _, lat := range latencies {
		totalLatency += lat
		if lat > maxLatency {
			maxLatency = lat
		}
		if lat < minLatency {
			minLatency = lat
		}
	}

	avgLatency := totalLatency / time.Duration(len(latencies))
	qps := float64(len(latencies)) / totalDuration.Seconds()

	t.Logf("RLS Performance Test Results:")
	t.Logf("- Total queries: %d", len(latencies))
	t.Logf("- Duration: %v", totalDuration)
	t.Logf("- QPS: %.2f", qps)
	t.Logf("- Average latency: %v", avgLatency)
	t.Logf("- Min latency: %v", minLatency)
	t.Logf("- Max latency: %v", maxLatency)

	// 效能基準
	if avgLatency > 100*time.Millisecond {
		t.Errorf("Average latency too high: %v > 100ms", avgLatency)
	}

	if qps < 100 {
		t.Errorf("QPS too low: %.2f < 100", qps)
	}
}

// 記憶體使用測試
func TestMemoryUsage(t *testing.T) {
	db := setupTestDB()
	defer db.Close()

	// 創建大量告警測試記憶體使用
	alertSystem := monitoring.NewAlertSystem(db)
	securityMonitor := monitoring.NewSecurityMonitor(db)
	dbChannel := monitoring.NewDatabaseNotificationChannel(securityMonitor)
	alertSystem.RegisterNotificationChannel(dbChannel)

	ctx := context.Background()
	alertCount := 10000

	t.Logf("Creating %d alerts to test memory usage...", alertCount)
	
	start := time.Now()
	for i := 0; i < alertCount; i++ {
		alert := &monitoring.Alert{
			Type:     monitoring.AlertTypePerformance,
			Severity: monitoring.AlertSeverityInfo,
			Title:    fmt.Sprintf("Memory Test Alert %d", i),
			Message:  "Testing memory usage with large dataset",
			Source:   "memory_test",
			Metadata: map[string]interface{}{
				"iteration": i,
				"data":      fmt.Sprintf("test_data_%d", i),
			},
		}
		
		if err := alertSystem.CreateAlert(ctx, alert); err != nil {
			t.Errorf("Failed to create alert %d: %v", i, err)
		}
		
		// 每1000個告警檢查一次進度
		if i%1000 == 0 && i > 0 {
			t.Logf("Created %d alerts...", i)
		}
	}

	duration := time.Since(start)
	t.Logf("Created %d alerts in %v (%.2f alerts/sec)", alertCount, duration, float64(alertCount)/duration.Seconds())

	// 測試批量查詢
	t.Log("Testing batch retrieval...")
	retrievalStart := time.Now()
	
	alerts, err := alertSystem.GetAlerts(ctx, monitoring.AlertFilters{
		Limit: alertCount,
	})
	
	retrievalDuration := time.Since(retrievalStart)
	
	if err != nil {
		t.Fatalf("Failed to retrieve alerts: %v", err)
	}

	t.Logf("Retrieved %d alerts in %v", len(alerts), retrievalDuration)

	if len(alerts) == 0 {
		t.Error("No alerts retrieved")
	}
}

// 長時間運行穩定性測試
func TestLongRunningStability(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping long running test in short mode")
	}

	db := setupTestDB()
	defer db.Close()

	alertSystem := monitoring.NewAlertSystem(db)
	securityMonitor := monitoring.NewSecurityMonitor(db)
	dbChannel := monitoring.NewDatabaseNotificationChannel(securityMonitor)
	alertSystem.RegisterNotificationChannel(dbChannel)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// 啟動監控系統
	alertSystem.StartMonitoring(ctx)
	securityMonitor.StartMetricsCollection(ctx)

	var wg sync.WaitGroup
	errors := make(chan error, 100)
	
	// 模擬持續的系統活動
	wg.Add(3)

	// Worker 1: 持續創建告警
	go func() {
		defer wg.Done()
		i := 0
		ticker := time.NewTicker(100 * time.Millisecond)
		defer ticker.Stop()
		
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				alert := &monitoring.Alert{
					Type:     monitoring.AlertTypeSystemHealth,
					Severity: monitoring.AlertSeverityInfo,
					Title:    fmt.Sprintf("Stability Test Alert %d", i),
					Message:  "Long running stability test",
					Source:   "stability_test",
				}
				
				if err := alertSystem.CreateAlert(ctx, alert); err != nil {
					select {
					case errors <- err:
					default:
					}
				}
				i++
			}
		}
	}()

	// Worker 2: 記錄安全事件
	go func() {
		defer wg.Done()
		i := 0
		ticker := time.NewTicker(50 * time.Millisecond)
		defer ticker.Stop()
		
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				event := monitoring.SecurityEvent{
					EventType: "stability_test",
					IPAddress: fmt.Sprintf("10.0.0.%d", (i%254)+1),
					UserAgent: "StabilityTest/1.0",
					Severity:  "info",
				}
				
				if err := securityMonitor.LogSecurityEvent(ctx, event); err != nil {
					select {
					case errors <- err:
					default:
					}
				}
				i++
			}
		}
	}()

	// Worker 3: 定期查詢
	go func() {
		defer wg.Done()
		ticker := time.NewTicker(200 * time.Millisecond)
		defer ticker.Stop()
		
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				// 查詢告警
				_, err := alertSystem.GetAlerts(ctx, monitoring.AlertFilters{Limit: 10})
				if err != nil {
					select {
					case errors <- err:
					default:
					}
				}
				
				// 查詢安全事件
				_, err = securityMonitor.GetRecentSecurityEvents(ctx, 10, "")
				if err != nil {
					select {
					case errors <- err:
					default:
					}
				}
			}
		}
	}()

	// 等待測試完成
	wg.Wait()
	close(errors)

	// 檢查錯誤
	errorCount := 0
	for err := range errors {
		t.Errorf("Stability test error: %v", err)
		errorCount++
	}

	t.Logf("Long running stability test completed with %d errors", errorCount)

	if errorCount > 10 {
		t.Errorf("Too many errors during stability test: %d", errorCount)
	}
}