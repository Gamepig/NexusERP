package middleware

import (
	"strings"
	"time"

	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

// RequestAuditMiddleware 記錄請求的審計中介層（MVP）
// - 於請求結束後寫入 audit_logs，包含 userId、資源、動作、IP、UA、狀態與耗時
// - 不影響回應流程，寫入失敗僅記錄在服務內部（由服務自行處理錯誤）
func RequestAuditMiddleware(auditService *services.AuditService) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// 紀錄部分請求內容
		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}
		method := c.Request.Method
		clientIP := c.ClientIP()
		userAgent := c.GetHeader("User-Agent")

		// 嘗試取出資源與 ID（依路由慣例 /api/<resource>/:id）
		resource := deriveResourceFromPath(path)
		resourceID := c.Param("id")

		// 放行到下一個處理器
		c.Next()

		// 取得使用者 ID（若已由認證中介層設定）
		var userID int64
		if v, exists := c.Get("user_id"); exists {
			if id, ok := v.(int64); ok {
				userID = id
			}
		}

		// 是否成功（2xx/3xx 視為成功）
		status := c.Writer.Status()
		success := status >= 200 && status < 400

		// 寫入審計事件
		if auditService != nil {
			var resourceIDPtr *string
			if resourceID != "" {
				resourceIDPtr = &resourceID
			}
			_ = auditService.LogEvent(&services.AuditEvent{
				UserID:     &userID,
				Action:     strings.ToLower(method),
				Resource:   resource,
				ResourceID: resourceIDPtr,
				IPAddress:  clientIP,
				UserAgent:  userAgent,
				Metadata: map[string]interface{}{
					"status":      status,
					"latency_ms":  time.Since(start).Milliseconds(),
					"path":        path,
					"query":       c.Request.URL.RawQuery,
					"has_api_key": c.GetHeader("X-API-Key") != "",
				},
				Success:      success,
				ErrorMessage: nil,
				Timestamp:    time.Now(),
			})
		}
	}
}

func deriveResourceFromPath(path string) string {
	if path == "" {
		return "unknown"
	}
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) == 0 {
		return "unknown"
	}
	// 盡量取第2段作為資源（常見 /api/<resource>）
	if len(parts) >= 2 && parts[0] == "api" {
		return parts[1]
	}
	// 回退：取第一段
	return parts[0]
}
