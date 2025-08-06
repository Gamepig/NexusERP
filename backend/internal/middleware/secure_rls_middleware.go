// 安全強化的 RLS 中間件
// 修正日期: 2025-08-02
// 目標: 解決JWT整合的安全漏洞和效能問題

package middleware

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type SecureRLSMiddleware struct {
	db     *sql.DB
	config *RLSConfig
}

type RLSConfig struct {
	MaxContextSetupTime time.Duration
	EnableAuditLogging  bool
	StrictValidation    bool
	EmergencyMode       bool
}

type UserContext struct {
	UserID    int64    `json:"user_id"`
	CompanyID int64    `json:"company_id"`
	Roles     []string `json:"roles"`
	IsActive  bool     `json:"is_active"`
}

// 安全錯誤類型
type SecurityError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

func (e SecurityError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func NewSecureRLSMiddleware(db *sql.DB, config *RLSConfig) *SecureRLSMiddleware {
	if config == nil {
		config = &RLSConfig{
			MaxContextSetupTime: 5 * time.Second,
			EnableAuditLogging:  true,
			StrictValidation:    true,
			EmergencyMode:       false,
		}
	}

	return &SecureRLSMiddleware{
		db:     db,
		config: config,
	}
}

func (m *SecureRLSMiddleware) SetSecureRLSContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		// 1. 緊急模式檢查
		if m.config.EmergencyMode {
			m.handleEmergencyMode(c)
			return
		}

		// 2. 從JWT Claims中安全地獲取用戶資訊
		userContext, err := m.extractUserContext(c)
		if err != nil {
			m.handleSecurityError(c, err)
			return
		}

		// 3. 驗證用戶上下文的合法性
		if err := m.validateUserContext(userContext); err != nil {
			m.handleSecurityError(c, err)
			return
		}

		// 4. 驗證用戶-公司關係
		if err := m.validateUserCompanyRelation(userContext); err != nil {
			m.handleSecurityError(c, err)
			return
		}

		// 5. 設定資料庫上下文（使用事務確保原子性）
		tx, err := m.db.BeginTx(c.Request.Context(), &sql.TxOptions{
			Isolation: sql.LevelReadCommitted,
			ReadOnly:  false,
		})
		if err != nil {
			m.handleSecurityError(c, SecurityError{
				Code:    "DB_TRANSACTION_FAILED",
				Message: "Failed to begin database transaction",
				Details: err.Error(),
			})
			return
		}

		// 確保事務清理
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
				log.Printf("Panic in RLS middleware: %v", r)
				c.JSON(500, gin.H{
					"error": "internal_server_error",
					"code":  "MIDDLEWARE_PANIC",
				})
				c.Abort()
			}
		}()

		// 6. 設定 PostgreSQL 會話變數
		if err := m.setDatabaseContextSecure(tx, userContext, c); err != nil {
			tx.Rollback()
			m.handleSecurityError(c, err)
			return
		}

		// 7. 驗證上下文設定是否成功
		if err := m.verifyContextSetup(tx, userContext); err != nil {
			tx.Rollback()
			m.handleSecurityError(c, err)
			return
		}

		// 8. 提交上下文設定
		if err := tx.Commit(); err != nil {
			m.handleSecurityError(c, SecurityError{
				Code:    "CONTEXT_COMMIT_FAILED",
				Message: "Failed to commit RLS context",
				Details: err.Error(),
			})
			return
		}

		// 9. 記錄審計日誌
		if m.config.EnableAuditLogging {
			go m.logContextSetup(userContext, c, time.Since(startTime))
		}

		// 10. 設定清理函數
		c.Set("rls_cleanup", func() {
			m.clearDatabaseContext()
		})

		c.Next()

		// 11. 請求結束後清理上下文
		m.clearDatabaseContext()
	}
}

// 從JWT Claims中安全地提取用戶資訊
func (m *SecureRLSMiddleware) extractUserContext(c *gin.Context) (*UserContext, error) {
	// 從JWT claims獲取用戶資訊
	claims, exists := c.Get("jwt_claims")
	if !exists {
		return nil, SecurityError{
			Code:    "JWT_CLAIMS_MISSING",
			Message: "JWT claims not found in context",
		}
	}

	jwtClaims, ok := claims.(jwt.MapClaims)
	if !ok {
		return nil, SecurityError{
			Code:    "JWT_CLAIMS_INVALID",
			Message: "Invalid JWT claims format",
		}
	}

	// 安全地提取用戶ID
	userIDRaw, exists := jwtClaims["user_id"]
	if !exists {
		return nil, SecurityError{
			Code:    "USER_ID_MISSING",
			Message: "User ID not found in JWT claims",
		}
	}

	userID, err := m.parseIntFromInterface(userIDRaw)
	if err != nil {
		return nil, SecurityError{
			Code:    "USER_ID_INVALID",
			Message: "Invalid user ID format",
			Details: err.Error(),
		}
	}

	// 安全地提取公司ID
	companyIDRaw, exists := jwtClaims["company_id"]
	if !exists {
		return nil, SecurityError{
			Code:    "COMPANY_ID_MISSING",
			Message: "Company ID not found in JWT claims",
		}
	}

	companyID, err := m.parseIntFromInterface(companyIDRaw)
	if err != nil {
		return nil, SecurityError{
			Code:    "COMPANY_ID_INVALID",
			Message: "Invalid company ID format",
			Details: err.Error(),
		}
	}

	// 提取角色資訊
	var roles []string
	if rolesRaw, exists := jwtClaims["roles"]; exists {
		switch v := rolesRaw.(type) {
		case []interface{}:
			for _, role := range v {
				if roleStr, ok := role.(string); ok {
					roles = append(roles, roleStr)
				}
			}
		case string:
			if v != "" {
				roles = strings.Split(v, ",")
			}
		}
	}

	return &UserContext{
		UserID:    userID,
		CompanyID: companyID,
		Roles:     roles,
		IsActive:  true, // 後續會驗證
	}, nil
}

// 解析介面類型為整數
func (m *SecureRLSMiddleware) parseIntFromInterface(value interface{}) (int64, error) {
	switch v := value.(type) {
	case float64:
		return int64(v), nil
	case int64:
		return v, nil
	case int:
		return int64(v), nil
	case string:
		return strconv.ParseInt(v, 10, 64)
	default:
		return 0, fmt.Errorf("unsupported type: %T", value)
	}
}

// 驗證用戶上下文的基本合法性
func (m *SecureRLSMiddleware) validateUserContext(ctx *UserContext) error {
	if ctx.UserID <= 0 {
		return SecurityError{
			Code:    "INVALID_USER_ID",
			Message: "User ID must be positive",
		}
	}

	if ctx.CompanyID <= 0 {
		return SecurityError{
			Code:    "INVALID_COMPANY_ID",
			Message: "Company ID must be positive",
		}
	}

	// 檢查是否在黑名單中
	if m.isUserBlacklisted(ctx.UserID) {
		return SecurityError{
			Code:    "USER_BLACKLISTED",
			Message: "User access has been revoked",
		}
	}

	return nil
}

// 驗證用戶-公司關係
func (m *SecureRLSMiddleware) validateUserCompanyRelation(ctx *UserContext) error {
	query := `
		SELECT 
			uc.is_active,
			c.status as company_status,
			u.status as user_status,
			u.is_active as user_is_active
		FROM user_companies uc
		JOIN companies c ON uc.company_id = c.id
		JOIN users u ON uc.user_id = u.id
		WHERE uc.user_id = $1 
		AND uc.company_id = $2
		AND c.deleted_at IS NULL
		AND u.deleted_at IS NULL
	`

	var ucActive, userActive bool
	var companyStatus, userStatus string

	ctx2, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.db.QueryRowContext(ctx2, query, ctx.UserID, ctx.CompanyID).Scan(
		&ucActive, &companyStatus, &userStatus, &userActive,
	)

	if err == sql.ErrNoRows {
		return SecurityError{
			Code:    "USER_COMPANY_RELATION_NOT_FOUND",
			Message: "User is not associated with the specified company",
		}
	}

	if err != nil {
		return SecurityError{
			Code:    "DB_VALIDATION_ERROR",
			Message: "Failed to validate user-company relationship",
			Details: err.Error(),
		}
	}

	// 檢查各種狀態
	if !ucActive {
		return SecurityError{
			Code:    "USER_COMPANY_INACTIVE",
			Message: "User-company relationship is inactive",
		}
	}

	if companyStatus != "active" {
		return SecurityError{
			Code:    "COMPANY_INACTIVE",
			Message: "Company is not active",
		}
	}

	if userStatus != "active" || !userActive {
		return SecurityError{
			Code:    "USER_INACTIVE",
			Message: "User account is not active",
		}
	}

	ctx.IsActive = true
	return nil
}

// 安全地設定資料庫上下文
func (m *SecureRLSMiddleware) setDatabaseContextSecure(tx *sql.Tx, ctx *UserContext, c *gin.Context) error {
	// 基礎上下文設定查詢
	queries := []struct {
		name  string
		query string
		value interface{}
	}{
		{"user_id", "SET app.current_user_id = $1", ctx.UserID},
		{"company_id", "SET app.current_company_id = $1", ctx.CompanyID},
		{"user_roles", "SET app.user_role = $1", strings.Join(ctx.Roles, ",")},
		{"client_ip", "SET app.client_ip = $1", c.ClientIP()},
		{"user_agent", "SET app.user_agent = $1", c.GetHeader("User-Agent")},
		{"request_path", "SET app.request_path = $1", c.Request.URL.Path},
		{"session_id", "SET app.session_id = $1", m.generateSessionID(c)},
		{"query_start_time", "SET app.query_start_time = $1", time.Now()},
	}

	// 判斷超級管理員模式
	isSuperUser := m.checkSuperUserStatus(ctx.UserID, ctx.Roles)
	queries = append(queries, struct {
		name  string
		query string
		value interface{}
	}{"superuser_mode", "SET app.superuser_mode = $1", isSuperUser})

	// 批次執行設定（在事務中）
	for _, q := range queries {
		if _, err := tx.Exec(q.query, q.value); err != nil {
			return SecurityError{
				Code:    "CONTEXT_SETUP_FAILED",
				Message: fmt.Sprintf("Failed to set %s", q.name),
				Details: err.Error(),
			}
		}
	}

	// 設定可存取的資源清單
	if err := m.setAccessibleResourcesTx(tx, ctx); err != nil {
		// 記錄警告但不阻斷請求
		log.Printf("Warning: Failed to set accessible resources: %v", err)
	}

	return nil
}

// 在事務中設定可存取資源
func (m *SecureRLSMiddleware) setAccessibleResourcesTx(tx *sql.Tx, ctx *UserContext) error {
	// 獲取用戶可存取的倉庫清單
	warehouses, err := m.getUserAccessibleWarehousesTx(tx, ctx.UserID, ctx.CompanyID)
	if err != nil {
		return err
	}

	warehouseIDs := make([]string, len(warehouses))
	for i, wh := range warehouses {
		warehouseIDs[i] = strconv.FormatInt(wh, 10)
	}

	// 設定可存取倉庫清單
	warehouseList := strings.Join(warehouseIDs, ",")
	_, err = tx.Exec("SET app.accessible_warehouses = $1", warehouseList)

	return err
}

// 在事務中獲取用戶可存取的倉庫
func (m *SecureRLSMiddleware) getUserAccessibleWarehousesTx(tx *sql.Tx, userID, companyID int64) ([]int64, error) {
	query := `
		SELECT DISTINCT w.id 
		FROM warehouses w
		LEFT JOIN user_warehouse_permissions uwp ON w.id = uwp.warehouse_id
		WHERE w.company_id = $1 
		AND w.status = 'active'
		AND w.deleted_at IS NULL
		AND (
			uwp.user_id = $2 
			OR EXISTS (
				SELECT 1 FROM user_roles ur 
				JOIN roles r ON ur.role_id = r.id 
				WHERE ur.user_id = $2 
				AND r.name IN ('admin', 'warehouse_admin')
				AND ur.is_active = true
			)
		)
	`

	rows, err := tx.Query(query, companyID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var warehouses []int64
	for rows.Next() {
		var warehouseID int64
		if err := rows.Scan(&warehouseID); err != nil {
			return nil, err
		}
		warehouses = append(warehouses, warehouseID)
	}

	return warehouses, nil
}

// 驗證上下文設定是否成功
func (m *SecureRLSMiddleware) verifyContextSetup(tx *sql.Tx, ctx *UserContext) error {
	var setUserID, setCompanyID int64

	err := tx.QueryRow(`
		SELECT 
			COALESCE(current_setting('app.current_user_id', true)::int, 0),
			COALESCE(current_setting('app.current_company_id', true)::int, 0)
	`).Scan(&setUserID, &setCompanyID)

	if err != nil {
		return SecurityError{
			Code:    "CONTEXT_VERIFICATION_FAILED",
			Message: "Failed to verify context setup",
			Details: err.Error(),
		}
	}

	if setUserID != ctx.UserID || setCompanyID != ctx.CompanyID {
		return SecurityError{
			Code:    "CONTEXT_MISMATCH",
			Message: "Context verification failed - values do not match",
			Details: fmt.Sprintf("Expected user_id=%d, company_id=%d, got user_id=%d, company_id=%d",
				ctx.UserID, ctx.CompanyID, setUserID, setCompanyID),
		}
	}

	return nil
}

// 檢查超級管理員狀態
func (m *SecureRLSMiddleware) checkSuperUserStatus(userID int64, roles []string) bool {
	// 首先檢查角色
	for _, role := range roles {
		if role == "super_admin" || role == "system_admin" {
			// 進一步驗證該用戶確實有超級管理員權限
			return m.verifySuperUserInDB(userID)
		}
	}
	return false
}

// 在資料庫中驗證超級管理員權限
func (m *SecureRLSMiddleware) verifySuperUserInDB(userID int64) bool {
	var count int
	err := m.db.QueryRow(`
		SELECT COUNT(*) 
		FROM user_roles ur
		JOIN roles r ON ur.role_id = r.id
		WHERE ur.user_id = $1 
		AND r.name IN ('super_admin', 'system_admin')
		AND ur.is_active = true
		AND r.is_active = true
	`, userID).Scan(&count)

	return err == nil && count > 0
}

// 檢查用戶是否在黑名單中
func (m *SecureRLSMiddleware) isUserBlacklisted(userID int64) bool {
	var count int
	err := m.db.QueryRow(`
		SELECT COUNT(*) 
		FROM user_blacklist 
		WHERE user_id = $1 
		AND is_active = true 
		AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
	`, userID).Scan(&count)

	return err == nil && count > 0
}

// 生成會話ID
func (m *SecureRLSMiddleware) generateSessionID(c *gin.Context) string {
	// 可以改用更複雜的會話ID生成邏輯
	return fmt.Sprintf("%s_%d", c.ClientIP(), time.Now().UnixNano())
}

// 處理安全錯誤
func (m *SecureRLSMiddleware) handleSecurityError(c *gin.Context, err error) {
	// 清理任何可能的部分設定
	m.clearDatabaseContext()

	// 記錄安全事件
	if m.config.EnableAuditLogging {
		go m.logSecurityEvent(c, err)
	}

	var secErr SecurityError
	if e, ok := err.(SecurityError); ok {
		secErr = e
	} else {
		secErr = SecurityError{
			Code:    "SECURITY_ERROR",
			Message: "Security validation failed",
			Details: err.Error(),
		}
	}

	// 根據錯誤類型決定HTTP狀態碼
	statusCode := 401
	switch secErr.Code {
	case "USER_COMPANY_RELATION_NOT_FOUND", "COMPANY_ACCESS_DENIED":
		statusCode = 403
	case "DB_VALIDATION_ERROR", "CONTEXT_SETUP_FAILED":
		statusCode = 500
	}

	c.JSON(statusCode, gin.H{
		"error":   "authentication_failed",
		"code":    secErr.Code,
		"message": secErr.Message,
	})
	c.Abort()
}

// 處理緊急模式
func (m *SecureRLSMiddleware) handleEmergencyMode(c *gin.Context) {
	c.JSON(503, gin.H{
		"error":   "service_unavailable",
		"code":    "EMERGENCY_MODE",
		"message": "System is in emergency mode - authentication temporarily disabled",
	})
	c.Abort()
}

// 清理資料庫上下文
func (m *SecureRLSMiddleware) clearDatabaseContext() {
	clearQueries := []string{
		"SET app.current_user_id = DEFAULT",
		"SET app.current_company_id = DEFAULT",
		"SET app.user_role = DEFAULT",
		"SET app.superuser_mode = DEFAULT",
		"SET app.accessible_warehouses = DEFAULT",
		"SET app.client_ip = DEFAULT",
		"SET app.user_agent = DEFAULT",
		"SET app.request_path = DEFAULT",
		"SET app.session_id = DEFAULT",
		"SET app.query_start_time = DEFAULT",
	}

	for _, query := range clearQueries {
		m.db.Exec(query) // 忽略錯誤
	}
}

// 記錄上下文設定
func (m *SecureRLSMiddleware) logContextSetup(ctx *UserContext, c *gin.Context, duration time.Duration) {
	logData := map[string]interface{}{
		"event":        "rls_context_setup",
		"user_id":      ctx.UserID,
		"company_id":   ctx.CompanyID,
		"roles":        ctx.Roles,
		"client_ip":    c.ClientIP(),
		"user_agent":   c.GetHeader("User-Agent"),
		"request_path": c.Request.URL.Path,
		"duration_ms":  duration.Milliseconds(),
		"timestamp":    time.Now(),
	}

	logJSON, _ := json.Marshal(logData)
	log.Printf("RLS_AUDIT: %s", string(logJSON))
}

// 記錄安全事件
func (m *SecureRLSMiddleware) logSecurityEvent(c *gin.Context, err error) {
	logData := map[string]interface{}{
		"event":        "security_violation",
		"error":        err.Error(),
		"client_ip":    c.ClientIP(),
		"user_agent":   c.GetHeader("User-Agent"),
		"request_path": c.Request.URL.Path,
		"request_method": c.Request.Method,
		"timestamp":    time.Now(),
	}

	logJSON, _ := json.Marshal(logData)
	log.Printf("SECURITY_ALERT: %s", string(logJSON))

	// 可以整合外部告警系統
	// alertManager.SendAlert("RLS_SECURITY_VIOLATION", logData)
}