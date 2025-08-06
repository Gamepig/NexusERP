package middleware

import (
	"net/http"
	"strings"

	"nexus-erp/backend/internal/auth"

	"github.com/gin-gonic/gin"
)

// SimpleAuthMiddleware 簡化的認證中間件
type SimpleAuthMiddleware struct {
	authService *auth.SimpleAuthService
}

func NewSimpleAuthMiddleware(authService *auth.SimpleAuthService) *SimpleAuthMiddleware {
	return &SimpleAuthMiddleware{
		authService: authService,
	}
}

// RequireAuth 需要認證的中間件
func (m *SimpleAuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 提取Token
		token := extractToken(c)
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Missing authentication token",
			})
			c.Abort()
			return
		}

		// 驗證Token並設定RLS上下文
		claims, err := m.authService.ValidateTokenAndSetRLS(c.Request.Context(), token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
				"details": err.Error(),
			})
			c.Abort()
			return
		}

		// 設定用戶上下文到gin.Context
		c.Set("user_id", claims.UserID)
		c.Set("company_id", claims.CompanyID)
		c.Set("email", claims.Email)
		c.Set("claims", claims)

		c.Next()
	}
}

// extractToken 從請求中提取Token
func extractToken(c *gin.Context) string {
	// 1. 首先檢查Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		// Bearer token format
		if strings.HasPrefix(authHeader, "Bearer ") {
			return strings.TrimPrefix(authHeader, "Bearer ")
		}
		// 直接使用header值
		return authHeader
	}

	// 2. 檢查查詢參數
	token := c.Query("token")
	if token != "" {
		return token
	}

	// 3. 檢查表單數據
	token = c.PostForm("token")
	if token != "" {
		return token
	}

	return ""
}

// OptionalAuth 可選認證中間件（不強制要求認證）
func (m *SimpleAuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token == "" {
			// 沒有Token，繼續執行但不設定用戶上下文
			c.Next()
			return
		}

		// 有Token則嘗試驗證
		claims, err := m.authService.ValidateTokenAndSetRLS(c.Request.Context(), token)
		if err == nil {
			// Token有效，設定上下文
			c.Set("user_id", claims.UserID)
			c.Set("company_id", claims.CompanyID)
			c.Set("email", claims.Email)
			c.Set("claims", claims)
		}
		// 即使Token無效也繼續執行

		c.Next()
	}
}