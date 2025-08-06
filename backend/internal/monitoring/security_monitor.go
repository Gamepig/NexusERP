package monitoring

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/jmoiron/sqlx"
)

// SecurityEvent 安全事件類型
type SecurityEvent struct {
	ID          int64                  `json:"id" db:"id"`
	EventType   string                 `json:"event_type" db:"event_type"`
	UserID      *int64                 `json:"user_id,omitempty" db:"user_id"`
	CompanyID   *int64                 `json:"company_id,omitempty" db:"company_id"`
	IPAddress   string                 `json:"ip_address" db:"ip_address"`
	UserAgent   string                 `json:"user_agent" db:"user_agent"`
	Details     map[string]interface{} `json:"details" db:"details"`
	Severity    string                 `json:"severity" db:"severity"` // info, warning, error, critical
	CreatedAt   time.Time              `json:"created_at" db:"created_at"`
}

// JWTMetrics JWT使用統計
type JWTMetrics struct {
	TokensIssued      int64     `json:"tokens_issued"`
	TokensValidated   int64     `json:"tokens_validated"`
	TokensRefreshed   int64     `json:"tokens_refreshed"`
	TokensRevoked     int64     `json:"tokens_revoked"`
	FailedValidations int64     `json:"failed_validations"`
	LastUpdated       time.Time `json:"last_updated"`
}

// RLSMetrics RLS效能統計
type RLSMetrics struct {
	QueriesExecuted   int64   `json:"queries_executed"`
	AvgResponseTime   float64 `json:"avg_response_time_ms"`
	SlowQueries       int64   `json:"slow_queries"`
	ContextSwitches   int64   `json:"context_switches"`
	FailedContextSets int64   `json:"failed_context_sets"`
	LastUpdated       time.Time `json:"last_updated"`
}

// SecurityMonitor 安全監控服務
type SecurityMonitor struct {
	db         *sqlx.DB
	jwtMetrics *JWTMetrics
	rlsMetrics *RLSMetrics
	mu         sync.RWMutex
}

func NewSecurityMonitor(db *sqlx.DB) *SecurityMonitor {
	return &SecurityMonitor{
		db: db,
		jwtMetrics: &JWTMetrics{
			LastUpdated: time.Now(),
		},
		rlsMetrics: &RLSMetrics{
			LastUpdated: time.Now(),
		},
	}
}

// LogSecurityEvent 記錄安全事件
func (m *SecurityMonitor) LogSecurityEvent(ctx context.Context, event SecurityEvent) error {
	// 將details轉換為JSON
	detailsJSON, err := json.Marshal(event.Details)
	if err != nil {
		return fmt.Errorf("failed to marshal event details: %w", err)
	}

	query := `
		INSERT INTO security_events (event_type, user_id, company_id, ip_address, user_agent, details, severity, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`
	
	err = m.db.QueryRowxContext(ctx, query,
		event.EventType,
		event.UserID,
		event.CompanyID,
		event.IPAddress,
		event.UserAgent,
		detailsJSON,
		event.Severity,
		time.Now(),
	).Scan(&event.ID)
	
	if err != nil {
		log.Printf("Failed to log security event: %v", err)
		return fmt.Errorf("failed to log security event: %w", err)
	}

	// 如果是高風險事件，立即處理
	if event.Severity == "critical" || event.Severity == "error" {
		go m.handleHighRiskEvent(event)
	}

	return nil
}

// RecordJWTActivity 記錄JWT活動
func (m *SecurityMonitor) RecordJWTActivity(activityType string, success bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	switch activityType {
	case "issue":
		m.jwtMetrics.TokensIssued++
	case "validate":
		if success {
			m.jwtMetrics.TokensValidated++
		} else {
			m.jwtMetrics.FailedValidations++
		}
	case "refresh":
		m.jwtMetrics.TokensRefreshed++
	case "revoke":
		m.jwtMetrics.TokensRevoked++
	}

	m.jwtMetrics.LastUpdated = time.Now()
}

// RecordRLSActivity 記錄RLS活動
func (m *SecurityMonitor) RecordRLSActivity(queryTime time.Duration, success bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if success {
		m.rlsMetrics.QueriesExecuted++
		
		// 計算平均響應時間
		currentAvg := m.rlsMetrics.AvgResponseTime
		count := float64(m.rlsMetrics.QueriesExecuted)
		newTime := float64(queryTime.Milliseconds())
		
		if count == 1 {
			m.rlsMetrics.AvgResponseTime = newTime
		} else {
			m.rlsMetrics.AvgResponseTime = ((currentAvg * (count - 1)) + newTime) / count
		}

		// 記錄慢查詢（超過100ms）
		if queryTime > 100*time.Millisecond {
			m.rlsMetrics.SlowQueries++
		}
	} else {
		m.rlsMetrics.FailedContextSets++
	}

	m.rlsMetrics.LastUpdated = time.Now()
}

// RecordRLSContextSwitch 記錄RLS上下文切換
func (m *SecurityMonitor) RecordRLSContextSwitch() {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.rlsMetrics.ContextSwitches++
	m.rlsMetrics.LastUpdated = time.Now()
}

// GetJWTMetrics 獲取JWT統計
func (m *SecurityMonitor) GetJWTMetrics() JWTMetrics {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return *m.jwtMetrics
}

// GetRLSMetrics 獲取RLS統計
func (m *SecurityMonitor) GetRLSMetrics() RLSMetrics {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return *m.rlsMetrics
}

// GetRecentSecurityEvents 獲取最近的安全事件
func (m *SecurityMonitor) GetRecentSecurityEvents(ctx context.Context, limit int, severity string) ([]SecurityEvent, error) {
	query := `
		SELECT id, event_type, user_id, company_id, ip_address, user_agent, details, severity, created_at
		FROM security_events
	`
	args := []interface{}{}
	
	if severity != "" {
		query += " WHERE severity = $1"
		args = append(args, severity)
		query += " ORDER BY created_at DESC LIMIT $2"
		args = append(args, limit)
	} else {
		query += " ORDER BY created_at DESC LIMIT $1"
		args = append(args, limit)
	}

	rows, err := m.db.QueryxContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query security events: %w", err)
	}
	defer rows.Close()

	var events []SecurityEvent
	for rows.Next() {
		var event SecurityEvent
		var detailsJSON []byte
		
		err := rows.Scan(
			&event.ID,
			&event.EventType,
			&event.UserID,
			&event.CompanyID,
			&event.IPAddress,
			&event.UserAgent,
			&detailsJSON,
			&event.Severity,
			&event.CreatedAt,
		)
		if err != nil {
			log.Printf("Failed to scan security event: %v", err)
			continue
		}

		// 解析JSON details
		if len(detailsJSON) > 0 {
			if err := json.Unmarshal(detailsJSON, &event.Details); err != nil {
				log.Printf("Failed to unmarshal event details: %v", err)
				event.Details = make(map[string]interface{})
			}
		}

		events = append(events, event)
	}

	return events, nil
}

// GetSecuritySummary 獲取安全摘要
func (m *SecurityMonitor) GetSecuritySummary(ctx context.Context) (map[string]interface{}, error) {
	// 獲取最近24小時的統計
	query := `
		SELECT 
			event_type,
			severity,
			COUNT(*) as count
		FROM security_events 
		WHERE created_at >= NOW() - INTERVAL '24 hours'
		GROUP BY event_type, severity
		ORDER BY count DESC
	`

	rows, err := m.db.QueryxContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query security summary: %w", err)
	}
	defer rows.Close()

	eventStats := make(map[string]map[string]int)
	for rows.Next() {
		var eventType, severity string
		var count int
		
		if err := rows.Scan(&eventType, &severity, &count); err != nil {
			continue
		}

		if eventStats[eventType] == nil {
			eventStats[eventType] = make(map[string]int)
		}
		eventStats[eventType][severity] = count
	}

	return map[string]interface{}{
		"jwt_metrics":    m.GetJWTMetrics(),
		"rls_metrics":    m.GetRLSMetrics(),
		"event_summary":  eventStats,
		"generated_at":   time.Now(),
	}, nil
}

// StartMetricsCollection 啟動指標收集（背景任務）
func (m *SecurityMonitor) StartMetricsCollection(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute) // 每5分鐘收集一次
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			m.collectDatabaseMetrics(ctx)
		}
	}
}

// collectDatabaseMetrics 收集資料庫指標
func (m *SecurityMonitor) collectDatabaseMetrics(ctx context.Context) {
	// 收集RLS索引使用統計
	query := `SELECT * FROM get_rls_index_usage_stats()`
	rows, err := m.db.QueryxContext(ctx, query)
	if err != nil {
		log.Printf("Failed to collect RLS metrics: %v", err)
		return
	}
	defer rows.Close()

	// 記錄慢查詢警告
	for rows.Next() {
		var indexName, tableName string
		var sizeMB float64
		var scans, tuplesRead, tuplesFetched int64
		
		err := rows.Scan(&indexName, &tableName, &sizeMB, &scans, &tuplesRead, &tuplesFetched)
		if err != nil {
			continue
		}

		// 如果索引很少被使用但很大，記錄警告
		if sizeMB > 100 && scans < 100 {
			m.LogSecurityEvent(ctx, SecurityEvent{
				EventType: "database_performance",
				Details: map[string]interface{}{
					"index_name":     indexName,
					"table_name":     tableName,
					"size_mb":        sizeMB,
					"scans":          scans,
					"issue":          "large_unused_index",
				},
				Severity:  "warning",
				IPAddress: "system",
				UserAgent: "monitoring",
			})
		}
	}
}

// handleHighRiskEvent 處理高風險事件
func (m *SecurityMonitor) handleHighRiskEvent(event SecurityEvent) {
	log.Printf("HIGH RISK SECURITY EVENT: Type=%s, Severity=%s, UserID=%v, CompanyID=%v, Details=%v",
		event.EventType, event.Severity, event.UserID, event.CompanyID, event.Details)

	// 這裡可以添加更多的高風險事件處理邏輯：
	// - 發送通知
	// - 暫時鎖定帳戶
	// - 記錄到外部日誌系統
	// - 觸發自動回應機制
}