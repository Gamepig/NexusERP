package middleware

import (
	"database/sql"
	"net/http"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

// TenantContextMiddleware 多租戶上下文中間件
type TenantContextMiddleware struct {
	jwtSecret string
	db        *sqlx.DB
}

// NewTenantContextMiddleware 創建新的多租戶上下文中間件
func NewTenantContextMiddleware(jwtSecret string) *TenantContextMiddleware {
	return &TenantContextMiddleware{
		jwtSecret: jwtSecret,
	}
}

// NewTenantContextMiddlewareWithDB 創建帶數據庫連接的多租戶上下文中間件
func NewTenantContextMiddlewareWithDB(jwtSecret string, db *sqlx.DB) *TenantContextMiddleware {
	return &TenantContextMiddleware{
		jwtSecret: jwtSecret,
		db:        db,
	}
}

// SetTenantContext 設置租戶上下文
// 該中間件從 JWT token 中提取公司 ID，或者從已認證用戶獲取主要公司 ID
func (m *TenantContextMiddleware) SetTenantContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 首先檢查是否已經通過 authMiddleware 認證，並且有 user 資訊
		if user, exists := c.Get("user"); exists {
			// 如果已經有認證用戶，嘗試獲取該用戶的主要公司 ID
			if userModel, ok := user.(*models.User); ok && m.db != nil {
				companyID, err := m.getUserPrimaryCompanyID(userModel.ID)
				if err == nil && companyID > 0 {
					c.Set("company_id", companyID)
					c.Set("user_id", userModel.ID)
					c.Set("username", userModel.Username)
					c.Next()
					return
				}
			}
		}

		// 如果沒有認證用戶或無法獲取公司 ID，嘗試 JWT token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// 如果沒有 Authorization header，設置預設公司 ID 為 1
			c.Set("company_id", int64(1))
			c.Next()
			return
		}

		// 解析 Bearer token
		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			c.Set("company_id", int64(1))
			c.Next()
			return
		}

		tokenString := authHeader[7:]

		// 驗證並解析 JWT token
		claims, err := utils.ValidateJWT(tokenString, m.jwtSecret)
		if err != nil {
			// 如果 token 無效，使用預設公司 ID
			c.Set("company_id", int64(1))
			c.Next()
			return
		}

		// 將公司 ID 設置到上下文中
		c.Set("company_id", claims.CompanyID)
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		
		c.Next()
	}
}

// getUserPrimaryCompanyID 獲取用戶的主要公司 ID
func (m *TenantContextMiddleware) getUserPrimaryCompanyID(userID int64) (int64, error) {
	if m.db == nil {
		return 0, sql.ErrNoRows
	}

	// 查詢用戶的主要公司
	query := `
		SELECT uc.company_id 
		FROM user_companies uc
		INNER JOIN companies c ON c.id = uc.company_id
		WHERE uc.user_id = $1 
		AND uc.is_active = true 
		AND c.is_active = true
		AND (uc.is_primary = true OR uc.id = (
			SELECT MIN(id) FROM user_companies 
			WHERE user_id = $1 AND is_active = true
		))
		LIMIT 1`

	var companyID int64
	err := m.db.Get(&companyID, query, userID)
	if err != nil {
		return 0, err
	}

	return companyID, nil
}

// GetCompanyIDFromContext 從 Gin 上下文中獲取公司 ID
func GetCompanyIDFromContext(c *gin.Context) int64 {
	if companyID, exists := c.Get("company_id"); exists {
		if id, ok := companyID.(int64); ok {
			return id
		}
	}
	// 預設返回公司 ID 1
	return 1
}

// GetUserIDFromContext 從 Gin 上下文中獲取用戶 ID
func GetUserIDFromContext(c *gin.Context) int64 {
	if userID, exists := c.Get("user_id"); exists {
		if id, ok := userID.(int64); ok {
			return id
		}
	}
	// 如果找不到用戶 ID，返回 0
	return 0
}

// GetUsernameFromContext 從 Gin 上下文中獲取用戶名
func GetUsernameFromContext(c *gin.Context) string {
	if username, exists := c.Get("username"); exists {
		if name, ok := username.(string); ok {
			return name
		}
	}
	// 如果找不到用戶名，返回空字符串
	return ""
}

// RequireTenantContext 確保請求包含租戶上下文的中間件
// 如果無法獲取公司 ID，會返回錯誤響應
func (m *TenantContextMiddleware) RequireTenantContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 先設置租戶上下文
		m.SetTenantContext()(c)
		
		// 檢查是否成功設置了公司 ID
		companyID := GetCompanyIDFromContext(c)
		if companyID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unable to determine tenant context",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}