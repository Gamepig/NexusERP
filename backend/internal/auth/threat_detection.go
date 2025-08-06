package auth

import (
	"context"
	"fmt"
	"net"
	"strings"
	"time"

	"nexus-erp/backend/internal/monitoring"
	
	"github.com/jmoiron/sqlx"
)

// ThreatLevel 威脅等級
type ThreatLevel int

const (
	ThreatLevelLow ThreatLevel = iota
	ThreatLevelMedium
	ThreatLevelHigh
	ThreatLevelCritical
)

func (t ThreatLevel) String() string {
	switch t {
	case ThreatLevelLow:
		return "low"
	case ThreatLevelMedium:
		return "medium"
	case ThreatLevelHigh:
		return "high"
	case ThreatLevelCritical:
		return "critical"
	default:
		return "unknown"
	}
}

// ThreatIndicator 威脅指標
type ThreatIndicator struct {
	Type        string      `json:"type"`
	Value       string      `json:"value"`
	Level       ThreatLevel `json:"level"`
	Description string      `json:"description"`
	Confidence  float64     `json:"confidence"` // 0.0-1.0
	Source      string      `json:"source"`
	DetectedAt  time.Time   `json:"detected_at"`
}

// SecurityThreat 安全威脅記錄
type SecurityThreat struct {
	ID          int64             `json:"id" db:"id"`
	ThreatType  string            `json:"threat_type" db:"threat_type"`
	Level       string            `json:"level" db:"level"`
	UserID      *int64            `json:"user_id,omitempty" db:"user_id"`
	CompanyID   *int64            `json:"company_id,omitempty" db:"company_id"`
	IPAddress   string            `json:"ip_address" db:"ip_address"`
	UserAgent   string            `json:"user_agent" db:"user_agent"`
	Indicators  []ThreatIndicator `json:"indicators"`
	IsResolved  bool              `json:"is_resolved" db:"is_resolved"`
	Resolution  string            `json:"resolution" db:"resolution"`
	ResolvedAt  *time.Time        `json:"resolved_at" db:"resolved_at"`
	CreatedAt   time.Time         `json:"created_at" db:"created_at"`
}

// ThreatDetectionService 威脅檢測服務
type ThreatDetectionService struct {
	db                *sqlx.DB
	monitor           *monitoring.SecurityMonitor
	suspiciousIPs     map[string]time.Time
	blockedIPs        map[string]time.Time
	suspiciousAgents  map[string]int
}

func NewThreatDetectionService(db *sqlx.DB, monitor *monitoring.SecurityMonitor) *ThreatDetectionService {
	return &ThreatDetectionService{
		db:               db,
		monitor:          monitor,
		suspiciousIPs:    make(map[string]time.Time),
		blockedIPs:       make(map[string]time.Time),
		suspiciousAgents: make(map[string]int),
	}
}

// AnalyzeLoginAttempt 分析登入嘗試的威脅
func (t *ThreatDetectionService) AnalyzeLoginAttempt(ctx context.Context, userID, companyID *int64, ipAddress, userAgent string, success bool) (*SecurityThreat, error) {
	var indicators []ThreatIndicator
	maxLevel := ThreatLevelLow

	// 1. 檢測異常IP地址
	if indicator := t.detectSuspiciousIP(ctx, ipAddress); indicator != nil {
		indicators = append(indicators, *indicator)
		if indicator.Level > maxLevel {
			maxLevel = indicator.Level
		}
	}

	// 2. 檢測異常User Agent
	if indicator := t.detectSuspiciousUserAgent(userAgent); indicator != nil {
		indicators = append(indicators, *indicator)
		if indicator.Level > maxLevel {
			maxLevel = indicator.Level
		}
	}

	// 3. 檢測暴力破解攻擊
	if !success {
		if indicator := t.detectBruteForceAttack(ctx, ipAddress, userID); indicator != nil {
			indicators = append(indicators, *indicator)
			if indicator.Level > maxLevel {
				maxLevel = indicator.Level
			}
		}
	}

	// 4. 檢測異常登入模式
	if success && userID != nil {
		if indicator := t.detectAnomalousLoginPattern(ctx, *userID, ipAddress); indicator != nil {
			indicators = append(indicators, *indicator)
			if indicator.Level > maxLevel {
				maxLevel = indicator.Level
			}
		}
	}

	// 5. 檢測地理位置異常 (簡化版本)
	if indicator := t.detectGeographicAnomaly(ipAddress); indicator != nil {
		indicators = append(indicators, *indicator)
		if indicator.Level > maxLevel {
			maxLevel = indicator.Level
		}
	}

	// 如果有威脅指標，創建威脅記錄
	if len(indicators) > 0 {
		threat := &SecurityThreat{
			ThreatType: "login_anomaly",
			Level:      maxLevel.String(),
			UserID:     userID,
			CompanyID:  companyID,
			IPAddress:  ipAddress,
			UserAgent:  userAgent,
			Indicators: indicators,
			IsResolved: false,
			CreatedAt:  time.Now(),
		}

		// 保存威脅記錄
		err := t.saveThreatRecord(ctx, threat)
		if err != nil {
			return nil, fmt.Errorf("failed to save threat record: %w", err)
		}

		// 根據威脅等級採取行動
		t.handleThreatResponse(ctx, threat)

		return threat, nil
	}

	return nil, nil
}

// detectSuspiciousIP 檢測可疑IP地址
func (t *ThreatDetectionService) detectSuspiciousIP(ctx context.Context, ipAddress string) *ThreatIndicator {
	// 1. 檢查是否在已知惡意IP列表中
	if t.isKnownMaliciousIP(ipAddress) {
		return &ThreatIndicator{
			Type:        "malicious_ip",
			Value:       ipAddress,
			Level:       ThreatLevelCritical,
			Description: "IP address found in malicious IP database",
			Confidence:  0.9,
			Source:      "threat_intelligence",
			DetectedAt:  time.Now(),
		}
	}

	// 2. 檢查是否為Tor出口節點
	if t.isTorExitNode(ipAddress) {
		return &ThreatIndicator{
			Type:        "tor_exit_node",
			Value:       ipAddress,
			Level:       ThreatLevelHigh,
			Description: "Connection from Tor exit node",
			Confidence:  0.8,
			Source:      "network_analysis",
			DetectedAt:  time.Now(),
		}
	}

	// 3. 檢查最近失敗次數
	failureCount := t.getRecentFailureCount(ctx, ipAddress, 1*time.Hour)
	if failureCount >= 10 {
		return &ThreatIndicator{
			Type:        "high_failure_rate",
			Value:       fmt.Sprintf("%d failures in 1 hour", failureCount),
			Level:       ThreatLevelHigh,
			Description: "High number of authentication failures from this IP",
			Confidence:  0.7,
			Source:      "failure_analysis",
			DetectedAt:  time.Now(),
		}
	} else if failureCount >= 5 {
		return &ThreatIndicator{
			Type:        "moderate_failure_rate",
			Value:       fmt.Sprintf("%d failures in 1 hour", failureCount),
			Level:       ThreatLevelMedium,
			Description: "Moderate number of authentication failures from this IP",
			Confidence:  0.6,
			Source:      "failure_analysis",
			DetectedAt:  time.Now(),
		}
	}

	return nil
}

// detectSuspiciousUserAgent 檢測可疑User Agent
func (t *ThreatDetectionService) detectSuspiciousUserAgent(userAgent string) *ThreatIndicator {
	userAgent = strings.ToLower(userAgent)

	// 檢測自動化工具特徵
	suspiciousAgents := []string{
		"curl", "wget", "python", "requests", "httpie", "postman",
		"burp", "sqlmap", "nmap", "nikto", "dirb", "gobuster",
		"bot", "crawler", "spider", "scraper",
	}

	for _, suspicious := range suspiciousAgents {
		if strings.Contains(userAgent, suspicious) {
			level := ThreatLevelMedium
			if strings.Contains(userAgent, "sqlmap") || strings.Contains(userAgent, "nmap") {
				level = ThreatLevelHigh
			}

			return &ThreatIndicator{
				Type:        "suspicious_user_agent",
				Value:       userAgent,
				Level:       level,
				Description: fmt.Sprintf("User agent contains suspicious keyword: %s", suspicious),
				Confidence:  0.7,
				Source:      "user_agent_analysis",
				DetectedAt:  time.Now(),
			}
		}
	}

	// 檢測空或異常短的User Agent
	if len(userAgent) < 10 {
		return &ThreatIndicator{
			Type:        "anomalous_user_agent",
			Value:       userAgent,
			Level:       ThreatLevelLow,
			Description: "Unusually short or empty user agent",
			Confidence:  0.5,
			Source:      "user_agent_analysis",
			DetectedAt:  time.Now(),
		}
	}

	return nil
}

// detectBruteForceAttack 檢測暴力破解攻擊
func (t *ThreatDetectionService) detectBruteForceAttack(ctx context.Context, ipAddress string, userID *int64) *ThreatIndicator {
	// 檢查同一IP在短時間內的失敗次數
	failures5min := t.getRecentFailureCount(ctx, ipAddress, 5*time.Minute)
	failures1hour := t.getRecentFailureCount(ctx, ipAddress, 1*time.Hour)

	if failures5min >= 5 {
		return &ThreatIndicator{
			Type:        "brute_force_attack",
			Value:       fmt.Sprintf("%d failures in 5 minutes", failures5min),
			Level:       ThreatLevelHigh,
			Description: "Potential brute force attack detected",
			Confidence:  0.8,
			Source:      "brute_force_detection",
			DetectedAt:  time.Now(),
		}
	}

	if failures1hour >= 20 {
		return &ThreatIndicator{
			Type:        "sustained_attack",
			Value:       fmt.Sprintf("%d failures in 1 hour", failures1hour),
			Level:       ThreatLevelHigh,
			Description: "Sustained attack pattern detected",
			Confidence:  0.7,
			Source:      "brute_force_detection",
			DetectedAt:  time.Now(),
		}
	}

	return nil
}

// detectAnomalousLoginPattern 檢測異常登入模式
func (t *ThreatDetectionService) detectAnomalousLoginPattern(ctx context.Context, userID int64, ipAddress string) *ThreatIndicator {
	// 檢查用戶是否從新的IP地址登入
	if !t.isKnownUserIP(ctx, userID, ipAddress) {
		return &ThreatIndicator{
			Type:        "new_ip_login",
			Value:       ipAddress,
			Level:       ThreatLevelMedium,
			Description: "Login from previously unseen IP address",
			Confidence:  0.6,
			Source:      "behavioral_analysis",
			DetectedAt:  time.Now(),
		}
	}

	// 檢查異常登入時間
	now := time.Now()
	if now.Hour() < 6 || now.Hour() > 22 {
		return &ThreatIndicator{
			Type:        "unusual_time_login",
			Value:       now.Format("15:04"),
			Level:       ThreatLevelLow,
			Description: "Login at unusual hour",
			Confidence:  0.4,
			Source:      "temporal_analysis",
			DetectedAt:  time.Now(),
		}
	}

	return nil
}

// detectGeographicAnomaly 檢測地理位置異常
func (t *ThreatDetectionService) detectGeographicAnomaly(ipAddress string) *ThreatIndicator {
	// 簡化版本：檢查是否為私有IP（可能是VPN或代理）
	ip := net.ParseIP(ipAddress)
	if ip != nil {
		if ip.IsPrivate() && !ip.IsLoopback() {
			return &ThreatIndicator{
				Type:        "private_ip_access",
				Value:       ipAddress,
				Level:       ThreatLevelLow,
				Description: "Access from private IP address range",
				Confidence:  0.3,
				Source:      "geo_analysis",
				DetectedAt:  time.Now(),
			}
		}
	}

	return nil
}

// 輔助方法

func (t *ThreatDetectionService) isKnownMaliciousIP(ipAddress string) bool {
	// 簡化版本：檢查本地黑名單
	// 實際應用中應該查詢威脅情報數據庫
	maliciousIPs := []string{
		"127.0.0.1", // 示例，實際不應該封鎖localhost
	}

	for _, malicious := range maliciousIPs {
		if ipAddress == malicious {
			return true
		}
	}

	return false
}

func (t *ThreatDetectionService) isTorExitNode(ipAddress string) bool {
	// 簡化版本：實際應該查詢Tor出口節點列表
	// 這裡只是示例實作
	return false
}

func (t *ThreatDetectionService) getRecentFailureCount(ctx context.Context, ipAddress string, duration time.Duration) int {
	query := `
		SELECT COUNT(*)
		FROM security_events 
		WHERE ip_address = $1 
		AND event_type LIKE '%_failed'
		AND created_at >= $2
	`
	
	var count int
	err := t.db.QueryRowContext(ctx, query, ipAddress, time.Now().Add(-duration)).Scan(&count)
	if err != nil {
		return 0
	}
	
	return count
}

func (t *ThreatDetectionService) isKnownUserIP(ctx context.Context, userID int64, ipAddress string) bool {
	query := `
		SELECT COUNT(*)
		FROM security_events 
		WHERE user_id = $1 
		AND ip_address = $2
		AND event_type LIKE '%_success'
		AND created_at >= $3
	`
	
	var count int
	err := t.db.QueryRowContext(ctx, query, userID, ipAddress, time.Now().Add(-30*24*time.Hour)).Scan(&count)
	if err != nil {
		return false
	}
	
	return count > 0
}

func (t *ThreatDetectionService) saveThreatRecord(ctx context.Context, threat *SecurityThreat) error {
	// 將indicators轉換為JSON字符串存儲
	// 簡化版本：不實際存儲，只記錄到安全事件
	eventType := "threat_detected"
	if threat.Level == "critical" {
		eventType = "critical_threat_detected"
	}

	details := map[string]interface{}{
		"threat_type": threat.ThreatType,
		"level":       threat.Level,
		"indicators":  threat.Indicators,
	}

	return t.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: eventType,
		UserID:    threat.UserID,
		CompanyID: threat.CompanyID,
		IPAddress: threat.IPAddress,
		UserAgent: threat.UserAgent,
		Details:   details,
		Severity:  threat.Level,
	})
}

func (t *ThreatDetectionService) handleThreatResponse(ctx context.Context, threat *SecurityThreat) {
	switch threat.Level {
	case "critical":
		// 立即封鎖IP
		t.blockedIPs[threat.IPAddress] = time.Now().Add(24 * time.Hour)
		t.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "ip_blocked_automatically",
			IPAddress: threat.IPAddress,
			Details: map[string]interface{}{
				"reason":     "critical_threat_detected",
				"threat_id":  threat.ID,
				"block_until": time.Now().Add(24 * time.Hour),
			},
			Severity: "critical",
		})

	case "high":
		// 標記為可疑IP
		t.suspiciousIPs[threat.IPAddress] = time.Now().Add(6 * time.Hour)
		t.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "ip_marked_suspicious",
			IPAddress: threat.IPAddress,
			Details: map[string]interface{}{
				"reason":         "high_threat_detected",
				"threat_id":      threat.ID,
				"suspicious_until": time.Now().Add(6 * time.Hour),
			},
			Severity: "warning",
		})

	case "medium":
		// 增加監控
		t.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "threat_monitoring_increased",
			IPAddress: threat.IPAddress,
			Details: map[string]interface{}{
				"reason":    "medium_threat_detected",
				"threat_id": threat.ID,
			},
			Severity: "info",
		})
	}
}

// IsIPBlocked 檢查IP是否被封鎖
func (t *ThreatDetectionService) IsIPBlocked(ipAddress string) bool {
	if blockUntil, exists := t.blockedIPs[ipAddress]; exists {
		if time.Now().Before(blockUntil) {
			return true
		}
		// 過期則移除
		delete(t.blockedIPs, ipAddress)
	}
	return false
}

// IsIPSuspicious 檢查IP是否可疑
func (t *ThreatDetectionService) IsIPSuspicious(ipAddress string) bool {
	if suspiciousUntil, exists := t.suspiciousIPs[ipAddress]; exists {
		if time.Now().Before(suspiciousUntil) {
			return true
		}
		// 過期則移除
		delete(t.suspiciousIPs, ipAddress)
	}
	return false
}

// GetThreatLevel 獲取IP的威脅等級
func (t *ThreatDetectionService) GetThreatLevel(ipAddress string) ThreatLevel {
	if t.IsIPBlocked(ipAddress) {
		return ThreatLevelCritical
	}
	if t.IsIPSuspicious(ipAddress) {
		return ThreatLevelHigh
	}
	return ThreatLevelLow
}