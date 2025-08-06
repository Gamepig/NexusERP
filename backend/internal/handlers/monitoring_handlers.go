package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"nexus-erp/backend/internal/auth"
	"nexus-erp/backend/internal/monitoring"
	"nexus-erp/backend/internal/utils"
)

// MonitoringHandlers 監控相關的HTTP處理器
type MonitoringHandlers struct {
	authService *auth.MonitoredAuthService
}

func NewMonitoringHandlers(authService *auth.MonitoredAuthService) *MonitoringHandlers {
	return &MonitoringHandlers{
		authService: authService,
	}
}

// GetSecurityDashboard 獲取安全儀表板
func (h *MonitoringHandlers) GetSecurityDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 驗證管理員權限
	if !h.isAdminUser(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	dashboard, err := h.authService.GetSecurityDashboard(ctx)
	if err != nil {
		http.Error(w, "Failed to get security dashboard", http.StatusInternalServerError)
		return
	}

	utils.JSONResponse(w, dashboard, http.StatusOK)
}

// GetJWTMetrics 獲取JWT統計指標
func (h *MonitoringHandlers) GetJWTMetrics(w http.ResponseWriter, r *http.Request) {
	// 驗證管理員權限
	if !h.isAdminUser(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	monitor := h.authService.GetSecurityMonitor()
	metrics := monitor.GetJWTMetrics()

	utils.JSONResponse(w, metrics, http.StatusOK)
}

// GetRLSMetrics 獲取RLS效能指標
func (h *MonitoringHandlers) GetRLSMetrics(w http.ResponseWriter, r *http.Request) {
	// 驗證管理員權限
	if !h.isAdminUser(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	monitor := h.authService.GetSecurityMonitor()
	metrics := monitor.GetRLSMetrics()

	utils.JSONResponse(w, metrics, http.StatusOK)
}

// GetSecurityEvents 獲取安全事件列表
func (h *MonitoringHandlers) GetSecurityEvents(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 驗證管理員權限
	if !h.isAdminUser(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 解析查詢參數
	limitStr := r.URL.Query().Get("limit")
	limit := 50 // 預設值
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 1000 {
			limit = parsedLimit
		}
	}

	severity := r.URL.Query().Get("severity")

	monitor := h.authService.GetSecurityMonitor()
	events, err := monitor.GetRecentSecurityEvents(ctx, limit, severity)
	if err != nil {
		http.Error(w, "Failed to get security events", http.StatusInternalServerError)
		return
	}

	utils.JSONResponse(w, map[string]interface{}{
		"events": events,
		"count":  len(events),
		"limit":  limit,
		"filter": map[string]string{
			"severity": severity,
		},
	}, http.StatusOK)
}

// LogCustomSecurityEvent 記錄自定義安全事件
func (h *MonitoringHandlers) LogCustomSecurityEvent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 驗證管理員權限
	if !h.isAdminUser(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var request struct {
		EventType string                 `json:"event_type"`
		UserID    *int64                 `json:"user_id,omitempty"`
		CompanyID *int64                 `json:"company_id,omitempty"`
		IPAddress string                 `json:"ip_address"`
		UserAgent string                 `json:"user_agent"`
		Details   map[string]interface{} `json:"details"`
		Severity  string                 `json:"severity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// 驗證必要欄位
	if request.EventType == "" {
		http.Error(w, "event_type is required", http.StatusBadRequest)
		return
	}

	if request.IPAddress == "" {
		request.IPAddress = utils.GetClientIP(r)
	}

	if request.UserAgent == "" {
		request.UserAgent = r.UserAgent()
	}

	if request.Severity == "" {
		request.Severity = "info"
	}

	// 驗證嚴重程度
	validSeverities := map[string]bool{
		"info":     true,
		"warning":  true,
		"error":    true,
		"critical": true,
	}
	if !validSeverities[request.Severity] {
		http.Error(w, "Invalid severity level", http.StatusBadRequest)
		return
	}

	// 記錄事件
	monitor := h.authService.GetSecurityMonitor()
	event := monitoring.SecurityEvent{
		EventType: request.EventType,
		UserID:    request.UserID,
		CompanyID: request.CompanyID,
		IPAddress: request.IPAddress,
		UserAgent: request.UserAgent,
		Details:   request.Details,
		Severity:  request.Severity,
	}

	if err := monitor.LogSecurityEvent(ctx, event); err != nil {
		http.Error(w, "Failed to log security event", http.StatusInternalServerError)
		return
	}

	utils.JSONResponse(w, map[string]interface{}{
		"message": "Security event logged successfully",
		"event":   event,
	}, http.StatusCreated)
}

// GetSecuritySummary 獲取安全摘要統計
func (h *MonitoringHandlers) GetSecuritySummary(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 驗證管理員權限
	if !h.isAdminUser(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	monitor := h.authService.GetSecurityMonitor()
	summary, err := monitor.GetSecuritySummary(ctx)
	if err != nil {
		http.Error(w, "Failed to get security summary", http.StatusInternalServerError)
		return
	}

	utils.JSONResponse(w, summary, http.StatusOK)
}

// HealthCheck 健康檢查端點（包含監控狀態）
func (h *MonitoringHandlers) HealthCheck(w http.ResponseWriter, r *http.Request) {
	monitor := h.authService.GetSecurityMonitor()
	
	jwtMetrics := monitor.GetJWTMetrics()
	rlsMetrics := monitor.GetRLSMetrics()

	status := map[string]interface{}{
		"status": "healthy",
		"timestamp": map[string]interface{}{
			"jwt_metrics_updated": jwtMetrics.LastUpdated,
			"rls_metrics_updated": rlsMetrics.LastUpdated,
		},
		"metrics": map[string]interface{}{
			"jwt": map[string]interface{}{
				"tokens_issued":    jwtMetrics.TokensIssued,
				"tokens_validated": jwtMetrics.TokensValidated,
				"failed_validations": jwtMetrics.FailedValidations,
			},
			"rls": map[string]interface{}{
				"queries_executed":    rlsMetrics.QueriesExecuted,
				"avg_response_time":   rlsMetrics.AvgResponseTime,
				"slow_queries":        rlsMetrics.SlowQueries,
			},
		},
	}

	// 檢查是否有異常指標
	if jwtMetrics.FailedValidations > jwtMetrics.TokensValidated/2 {
		status["status"] = "warning"
		status["warnings"] = []string{"High JWT validation failure rate"}
	}

	if rlsMetrics.AvgResponseTime > 100 {
		status["status"] = "warning"
		if status["warnings"] == nil {
			status["warnings"] = []string{}
		}
		status["warnings"] = append(status["warnings"].([]string), "High RLS average response time")
	}

	statusCode := http.StatusOK
	if status["status"] == "warning" {
		statusCode = http.StatusOK // 仍然返回200，但狀態為warning
	}

	utils.JSONResponse(w, status, statusCode)
}

// isAdminUser 檢查是否為管理員用戶（簡化版本）
func (h *MonitoringHandlers) isAdminUser(r *http.Request) bool {
	// 這裡應該實作真正的管理員權限檢查
	// 可以從JWT token中獲取用戶角色，或檢查特定的API key
	
	// 簡化版本：檢查是否有管理員授權標頭
	adminKey := r.Header.Get("X-Admin-Key")
	expectedKey := "admin-monitoring-key" // 應該從環境變數或配置中獲取
	
	return adminKey == expectedKey
}

// RegisterMonitoringRoutes 註冊監控相關路由
func (h *MonitoringHandlers) RegisterMonitoringRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/monitoring/dashboard", h.GetSecurityDashboard)
	mux.HandleFunc("/api/monitoring/jwt-metrics", h.GetJWTMetrics)
	mux.HandleFunc("/api/monitoring/rls-metrics", h.GetRLSMetrics)
	mux.HandleFunc("/api/monitoring/security-events", h.GetSecurityEvents)
	mux.HandleFunc("/api/monitoring/log-event", h.LogCustomSecurityEvent)
	mux.HandleFunc("/api/monitoring/summary", h.GetSecuritySummary)
	mux.HandleFunc("/api/monitoring/health", h.HealthCheck)
}