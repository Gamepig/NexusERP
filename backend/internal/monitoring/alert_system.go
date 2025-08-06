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

// AlertSeverity 告警嚴重程度
type AlertSeverity string

const (
	AlertSeverityInfo     AlertSeverity = "info"
	AlertSeverityWarning  AlertSeverity = "warning"
	AlertSeverityError    AlertSeverity = "error"
	AlertSeverityCritical AlertSeverity = "critical"
)

// AlertType 告警類型
type AlertType string

const (
	AlertTypeSecurityBreach    AlertType = "security_breach"
	AlertTypePerformance       AlertType = "performance"
	AlertTypeSystemHealth      AlertType = "system_health"
	AlertTypeBusinessMetrics   AlertType = "business_metrics"
	AlertTypeDataIntegrity     AlertType = "data_integrity"
	AlertTypeResourceExhaustion AlertType = "resource_exhaustion"
)

// AlertChannel 告警通道
type AlertChannel string

const (
	AlertChannelEmail    AlertChannel = "email"
	AlertChannelSlack    AlertChannel = "slack"
	AlertChannelWebhook  AlertChannel = "webhook"
	AlertChannelDatabase AlertChannel = "database"
	AlertChannelSMS      AlertChannel = "sms"
)

// Alert 告警記錄
type Alert struct {
	ID          int64                  `json:"id" db:"id"`
	Type        AlertType              `json:"type" db:"type"`
	Severity    AlertSeverity          `json:"severity" db:"severity"`
	Title       string                 `json:"title" db:"title"`
	Message     string                 `json:"message" db:"message"`
	Source      string                 `json:"source" db:"source"`
	Metadata    map[string]interface{} `json:"metadata" db:"metadata"`
	IsResolved  bool                   `json:"is_resolved" db:"is_resolved"`
	ResolvedAt  *time.Time             `json:"resolved_at" db:"resolved_at"`
	ResolvedBy  *int64                 `json:"resolved_by" db:"resolved_by"`
	Resolution  string                 `json:"resolution" db:"resolution"`
	CreatedAt   time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at" db:"updated_at"`
	
	// 運行時字段
	NotificationsSent []AlertChannel `json:"notifications_sent,omitempty"`
}

// AlertRule 告警規則
type AlertRule struct {
	ID           int64         `json:"id" db:"id"`
	Name         string        `json:"name" db:"name"`
	Type         AlertType     `json:"type" db:"type"`
	Severity     AlertSeverity `json:"severity" db:"severity"`
	Condition    string        `json:"condition" db:"condition"`    // SQL條件或表達式
	Threshold    float64       `json:"threshold" db:"threshold"`
	TimeWindow   time.Duration `json:"time_window" db:"time_window"`
	IsEnabled    bool          `json:"is_enabled" db:"is_enabled"`
	Channels     []string      `json:"channels" db:"channels"`      // JSON array
	Cooldown     time.Duration `json:"cooldown" db:"cooldown"`      // 冷卻期
	LastTriggered *time.Time   `json:"last_triggered" db:"last_triggered"`
	CreatedAt    time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at" db:"updated_at"`
}

// AlertMetrics 告警統計指標
type AlertMetrics struct {
	TotalAlerts        int64             `json:"total_alerts"`
	ResolvedAlerts     int64             `json:"resolved_alerts"`
	UnresolvedAlerts   int64             `json:"unresolved_alerts"`
	AlertsBySeverity   map[string]int64  `json:"alerts_by_severity"`
	AlertsByType       map[string]int64  `json:"alerts_by_type"`
	AvgResolutionTime  time.Duration     `json:"avg_resolution_time"`
	LastAlertTime      time.Time         `json:"last_alert_time"`
	AlertsLast24h      int64             `json:"alerts_last_24h"`
	CriticalAlertsOpen int64             `json:"critical_alerts_open"`
}

// NotificationChannel 通知通道介面
type NotificationChannel interface {
	Send(ctx context.Context, alert *Alert) error
	GetChannelType() AlertChannel
}

// AlertSystem 告警系統
type AlertSystem struct {
	db              *sqlx.DB
	channels        map[AlertChannel]NotificationChannel
	rules           map[int64]*AlertRule
	rulesMutex      sync.RWMutex
	metrics         *AlertMetrics
	metricsMutex    sync.RWMutex
	stopChan        chan struct{}
	isRunning       bool
	evaluationTicker *time.Ticker
}

func NewAlertSystem(db *sqlx.DB) *AlertSystem {
	return &AlertSystem{
		db:       db,
		channels: make(map[AlertChannel]NotificationChannel),
		rules:    make(map[int64]*AlertRule),
		metrics: &AlertMetrics{
			AlertsBySeverity: make(map[string]int64),
			AlertsByType:     make(map[string]int64),
		},
		stopChan: make(chan struct{}),
	}
}

// RegisterNotificationChannel 註冊通知通道
func (as *AlertSystem) RegisterNotificationChannel(channel NotificationChannel) {
	as.channels[channel.GetChannelType()] = channel
}

// CreateAlert 創建新告警
func (as *AlertSystem) CreateAlert(ctx context.Context, alert *Alert) error {
	// 設置預設值
	if alert.CreatedAt.IsZero() {
		alert.CreatedAt = time.Now()
	}
	alert.UpdatedAt = alert.CreatedAt

	// 將metadata轉換為JSON
	metadataJSON, err := json.Marshal(alert.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	// 插入資料庫
	query := `
		INSERT INTO alerts (type, severity, title, message, source, metadata, is_resolved, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`
	err = as.db.QueryRowContext(ctx, query,
		alert.Type, alert.Severity, alert.Title, alert.Message,
		alert.Source, metadataJSON, alert.IsResolved,
		alert.CreatedAt, alert.UpdatedAt,
	).Scan(&alert.ID)

	if err != nil {
		return fmt.Errorf("failed to create alert: %w", err)
	}

	// 更新統計指標
	as.updateMetrics(alert)

	// 發送通知
	go as.sendNotifications(ctx, alert)

	return nil
}

// ResolveAlert 解決告警
func (as *AlertSystem) ResolveAlert(ctx context.Context, alertID int64, resolvedBy int64, resolution string) error {
	now := time.Now()
	
	query := `
		UPDATE alerts 
		SET is_resolved = true, resolved_at = $1, resolved_by = $2, resolution = $3, updated_at = $1
		WHERE id = $4 AND is_resolved = false
	`
	
	result, err := as.db.ExecContext(ctx, query, now, resolvedBy, resolution, alertID)
	if err != nil {
		return fmt.Errorf("failed to resolve alert: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("alert not found or already resolved")
	}

	// 更新統計指標
	as.updateMetricsOnResolve()

	return nil
}

// GetAlerts 獲取告警列表
func (as *AlertSystem) GetAlerts(ctx context.Context, filters AlertFilters) ([]Alert, error) {
	query := `
		SELECT id, type, severity, title, message, source, metadata, 
		       is_resolved, resolved_at, resolved_by, resolution, created_at, updated_at
		FROM alerts
	`
	
	args := []interface{}{}
	where := []string{}
	argIndex := 1

	// 構建WHERE條件
	if filters.Severity != "" {
		where = append(where, fmt.Sprintf("severity = $%d", argIndex))
		args = append(args, filters.Severity)
		argIndex++
	}

	if filters.Type != "" {
		where = append(where, fmt.Sprintf("type = $%d", argIndex))
		args = append(args, filters.Type)
		argIndex++
	}

	if filters.IsResolved != nil {
		where = append(where, fmt.Sprintf("is_resolved = $%d", argIndex))
		args = append(args, *filters.IsResolved)
		argIndex++
	}

	if !filters.StartTime.IsZero() {
		where = append(where, fmt.Sprintf("created_at >= $%d", argIndex))
		args = append(args, filters.StartTime)
		argIndex++
	}

	if !filters.EndTime.IsZero() {
		where = append(where, fmt.Sprintf("created_at <= $%d", argIndex))
		args = append(args, filters.EndTime)
		argIndex++
	}

	if len(where) > 0 {
		query += " WHERE " + fmt.Sprintf("%s", where[0])
		for i := 1; i < len(where); i++ {
			query += " AND " + where[i]
		}
	}

	query += " ORDER BY created_at DESC"

	if filters.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, filters.Limit)
	}

	rows, err := as.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query alerts: %w", err)
	}
	defer rows.Close()

	var alerts []Alert
	for rows.Next() {
		var alert Alert
		var metadataJSON []byte

		var resolution *string
		err := rows.Scan(
			&alert.ID, &alert.Type, &alert.Severity, &alert.Title,
			&alert.Message, &alert.Source, &metadataJSON,
			&alert.IsResolved, &alert.ResolvedAt, &alert.ResolvedBy,
			&resolution, &alert.CreatedAt, &alert.UpdatedAt,
		)
		if resolution != nil {
			alert.Resolution = *resolution
		}
		if err != nil {
			log.Printf("Failed to scan alert: %v", err)
			continue
		}

		// 解析metadata
		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &alert.Metadata); err != nil {
				log.Printf("Failed to unmarshal metadata: %v", err)
				alert.Metadata = make(map[string]interface{})
			}
		}

		alerts = append(alerts, alert)
	}

	return alerts, nil
}

// AlertFilters 告警過濾器
type AlertFilters struct {
	Severity   AlertSeverity
	Type       AlertType
	IsResolved *bool
	StartTime  time.Time
	EndTime    time.Time
	Limit      int
}

// StartMonitoring 啟動監控系統
func (as *AlertSystem) StartMonitoring(ctx context.Context) {
	if as.isRunning {
		return
	}

	as.isRunning = true
	as.evaluationTicker = time.NewTicker(30 * time.Second) // 每30秒評估一次規則

	// 載入告警規則
	as.loadAlertRules(ctx)

	go func() {
		for {
			select {
			case <-as.evaluationTicker.C:
				as.evaluateRules(ctx)
			case <-as.stopChan:
				as.evaluationTicker.Stop()
				return
			case <-ctx.Done():
				as.evaluationTicker.Stop()
				return
			}
		}
	}()

	// 啟動指標更新
	go as.periodicMetricsUpdate(ctx)
}

// StopMonitoring 停止監控系統
func (as *AlertSystem) StopMonitoring() {
	if !as.isRunning {
		return
	}

	as.isRunning = false
	close(as.stopChan)
}

// sendNotifications 發送通知
func (as *AlertSystem) sendNotifications(ctx context.Context, alert *Alert) {
	// 根據告警嚴重程度確定通知通道
	var channelsToUse []AlertChannel

	switch alert.Severity {
	case AlertSeverityCritical:
		channelsToUse = []AlertChannel{AlertChannelEmail, AlertChannelSlack, AlertChannelSMS, AlertChannelDatabase}
	case AlertSeverityError:
		channelsToUse = []AlertChannel{AlertChannelEmail, AlertChannelSlack, AlertChannelDatabase}
	case AlertSeverityWarning:
		channelsToUse = []AlertChannel{AlertChannelSlack, AlertChannelDatabase}
	case AlertSeverityInfo:
		channelsToUse = []AlertChannel{AlertChannelDatabase}
	}

	// 發送到各個通道
	for _, channelType := range channelsToUse {
		if channel, exists := as.channels[channelType]; exists {
			go func(ch NotificationChannel) {
				if err := ch.Send(ctx, alert); err != nil {
					log.Printf("Failed to send alert via %s: %v", ch.GetChannelType(), err)
				} else {
					alert.NotificationsSent = append(alert.NotificationsSent, ch.GetChannelType())
				}
			}(channel)
		}
	}
}

// updateMetrics 更新告警統計指標
func (as *AlertSystem) updateMetrics(alert *Alert) {
	as.metricsMutex.Lock()
	defer as.metricsMutex.Unlock()

	as.metrics.TotalAlerts++
	as.metrics.AlertsBySeverity[string(alert.Severity)]++
	as.metrics.AlertsByType[string(alert.Type)]++
	as.metrics.LastAlertTime = alert.CreatedAt

	if !alert.IsResolved {
		as.metrics.UnresolvedAlerts++
		if alert.Severity == AlertSeverityCritical {
			as.metrics.CriticalAlertsOpen++
		}
	}

	// 更新24小時內告警數
	if time.Since(alert.CreatedAt) <= 24*time.Hour {
		as.metrics.AlertsLast24h++
	}
}

// updateMetricsOnResolve 告警解決時更新指標
func (as *AlertSystem) updateMetricsOnResolve() {
	as.metricsMutex.Lock()
	defer as.metricsMutex.Unlock()

	as.metrics.ResolvedAlerts++
	if as.metrics.UnresolvedAlerts > 0 {
		as.metrics.UnresolvedAlerts--
	}
}

// loadAlertRules 載入告警規則
func (as *AlertSystem) loadAlertRules(ctx context.Context) {
	// 簡化版本：創建一些預設規則
	defaultRules := []*AlertRule{
		{
			ID:        1,
			Name:      "High Failed Login Rate",
			Type:      AlertTypeSecurityBreach,
			Severity:  AlertSeverityWarning,
			Condition: "COUNT(*) FROM security_events WHERE event_type LIKE '%_failed' AND created_at >= NOW() - INTERVAL '5 minutes'",
			Threshold: 10,
			TimeWindow: 5 * time.Minute,
			IsEnabled: true,
			Channels:  []string{"slack", "database"},
			Cooldown:  15 * time.Minute,
		},
		{
			ID:        2,
			Name:      "Critical Security Threat",
			Type:      AlertTypeSecurityBreach,
			Severity:  AlertSeverityCritical,
			Condition: "COUNT(*) FROM security_events WHERE severity = 'critical' AND created_at >= NOW() - INTERVAL '1 minute'",
			Threshold: 1,
			TimeWindow: 1 * time.Minute,
			IsEnabled: true,
			Channels:  []string{"email", "slack", "sms"},
			Cooldown:  5 * time.Minute,
		},
		{
			ID:        3,
			Name:      "High RLS Response Time",
			Type:      AlertTypePerformance,
			Severity:  AlertSeverityWarning,
			Condition: "avg_response_time > 500",
			Threshold: 500,
			TimeWindow: 10 * time.Minute,
			IsEnabled: true,
			Channels:  []string{"slack"},
			Cooldown:  30 * time.Minute,
		},
	}

	as.rulesMutex.Lock()
	defer as.rulesMutex.Unlock()

	for _, rule := range defaultRules {
		as.rules[rule.ID] = rule
	}
}

// evaluateRules 評估告警規則
func (as *AlertSystem) evaluateRules(ctx context.Context) {
	as.rulesMutex.RLock()
	rules := make([]*AlertRule, 0, len(as.rules))
	for _, rule := range as.rules {
		if rule.IsEnabled {
			rules = append(rules, rule)
		}
	}
	as.rulesMutex.RUnlock()

	for _, rule := range rules {
		// 檢查冷卻期
		if rule.LastTriggered != nil && time.Since(*rule.LastTriggered) < rule.Cooldown {
			continue
		}

		// 評估規則條件
		if as.evaluateRuleCondition(ctx, rule) {
			// 觸發告警
			alert := &Alert{
				Type:     rule.Type,
				Severity: rule.Severity,
				Title:    fmt.Sprintf("Alert Rule Triggered: %s", rule.Name),
				Message:  fmt.Sprintf("Rule '%s' has been triggered", rule.Name),
				Source:   "alert_system",
				Metadata: map[string]interface{}{
					"rule_id":   rule.ID,
					"rule_name": rule.Name,
					"threshold": rule.Threshold,
				},
			}

			if err := as.CreateAlert(ctx, alert); err != nil {
				log.Printf("Failed to create alert for rule %s: %v", rule.Name, err)
			} else {
				// 更新規則的最後觸發時間
				now := time.Now()
				rule.LastTriggered = &now
			}
		}
	}
}

// evaluateRuleCondition 評估規則條件
func (as *AlertSystem) evaluateRuleCondition(ctx context.Context, rule *AlertRule) bool {
	// 簡化版本：基於條件字符串評估
	// 實際應用中應該有更複雜的表達式解析器

	switch rule.Name {
	case "High Failed Login Rate":
		var count int
		query := `
			SELECT COUNT(*) 
			FROM security_events 
			WHERE event_type LIKE '%_failed' 
			AND created_at >= NOW() - INTERVAL '5 minutes'
		`
		err := as.db.QueryRowContext(ctx, query).Scan(&count)
		if err != nil {
			log.Printf("Failed to evaluate rule %s: %v", rule.Name, err)
			return false
		}
		return float64(count) >= rule.Threshold

	case "Critical Security Threat":
		var count int
		query := `
			SELECT COUNT(*) 
			FROM security_events 
			WHERE severity = 'critical' 
			AND created_at >= NOW() - INTERVAL '1 minute'
		`
		err := as.db.QueryRowContext(ctx, query).Scan(&count)
		if err != nil {
			return false
		}
		return float64(count) >= rule.Threshold

	case "High RLS Response Time":
		// 這裡應該查詢RLS性能指標
		// 簡化版本直接返回false
		return false
	}

	return false
}

// periodicMetricsUpdate 定期更新指標
func (as *AlertSystem) periodicMetricsUpdate(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			as.refreshMetrics(ctx)
		case <-ctx.Done():
			return
		}
	}
}

// refreshMetrics 刷新告警指標
func (as *AlertSystem) refreshMetrics(ctx context.Context) {
	// 查詢總告警數
	var totalAlerts, resolvedAlerts, unresolvedAlerts, criticalOpen, alertsLast24h int64

	as.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM alerts").Scan(&totalAlerts)
	as.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM alerts WHERE is_resolved = true").Scan(&resolvedAlerts)
	as.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM alerts WHERE is_resolved = false").Scan(&unresolvedAlerts)
	as.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM alerts WHERE severity = 'critical' AND is_resolved = false").Scan(&criticalOpen)
	as.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM alerts WHERE created_at >= NOW() - INTERVAL '24 hours'").Scan(&alertsLast24h)

	as.metricsMutex.Lock()
	as.metrics.TotalAlerts = totalAlerts
	as.metrics.ResolvedAlerts = resolvedAlerts
	as.metrics.UnresolvedAlerts = unresolvedAlerts
	as.metrics.CriticalAlertsOpen = criticalOpen
	as.metrics.AlertsLast24h = alertsLast24h
	as.metricsMutex.Unlock()
}

// GetMetrics 獲取告警統計指標
func (as *AlertSystem) GetMetrics() *AlertMetrics {
	as.metricsMutex.RLock()
	defer as.metricsMutex.RUnlock()

	// 創建副本以避免競態條件
	metrics := &AlertMetrics{
		TotalAlerts:        as.metrics.TotalAlerts,
		ResolvedAlerts:     as.metrics.ResolvedAlerts,
		UnresolvedAlerts:   as.metrics.UnresolvedAlerts,
		AlertsBySeverity:   make(map[string]int64),
		AlertsByType:       make(map[string]int64),
		AvgResolutionTime:  as.metrics.AvgResolutionTime,
		LastAlertTime:      as.metrics.LastAlertTime,
		AlertsLast24h:      as.metrics.AlertsLast24h,
		CriticalAlertsOpen: as.metrics.CriticalAlertsOpen,
	}

	for k, v := range as.metrics.AlertsBySeverity {
		metrics.AlertsBySeverity[k] = v
	}
	for k, v := range as.metrics.AlertsByType {
		metrics.AlertsByType[k] = v
	}

	return metrics
}