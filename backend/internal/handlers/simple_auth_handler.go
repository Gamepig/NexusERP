package handlers

import (
	"net/http"

	"nexus-erp/backend/internal/auth"
	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type SimpleAuthHandler struct {
	authService *auth.SimpleAuthService
	userService services.UserServiceInterface
	config      *config.Config
}

func NewSimpleAuthHandler(authService *auth.SimpleAuthService, userService services.UserServiceInterface, config *config.Config) *SimpleAuthHandler {
	return &SimpleAuthHandler{
		authService: authService,
		userService: userService,
		config:      config,
	}
}

// SimpleLoginRequest Laravel整合登入請求
type SimpleLoginRequest struct {
	UserID    int64  `json:"user_id" binding:"required"`
	CompanyID int64  `json:"company_id" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
}

// SimpleLogin Laravel整合專用的簡化登入端點
func (h *SimpleAuthHandler) SimpleLogin(c *gin.Context) {
	var req SimpleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// 驗證用戶是否存在且有效
	user, err := h.userService.GetUserByID(req.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not found or invalid",
		})
		return
	}

	// 驗證email匹配
	if user.Email != req.Email {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Email mismatch",
		})
		return
	}

	// 生成JWT並設定RLS
	authResult, err := h.authService.AuthenticateWithRLS(c.Request.Context(), req.UserID, req.CompanyID, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Authentication failed",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"access_token": authResult.AccessToken,
		"token_type":   authResult.TokenType,
		"expires_in":   authResult.ExpiresIn,
		"user_id":      authResult.UserID,
		"company_id":   authResult.CompanyID,
		"rls_active":   authResult.RLSActive,
	})
}

// Note: RefreshTokenRequest is now defined in models package

// RefreshToken 刷新Token並維持RLS上下文
func (h *SimpleAuthHandler) RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// 刷新Token並設定RLS
	authResult, err := h.authService.RefreshTokenWithRLS(c.Request.Context(), req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Token refresh failed",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"access_token": authResult.AccessToken,
		"token_type":   authResult.TokenType,
		"expires_in":   authResult.ExpiresIn,
		"user_id":      authResult.UserID,
		"company_id":   authResult.CompanyID,
		"rls_active":   authResult.RLSActive,
	})
}

// VerifyRLS 驗證RLS上下文狀態
func (h *SimpleAuthHandler) VerifyRLS(c *gin.Context) {
	// 從JWT中獲取用戶信息
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Company context missing",
		})
		return
	}

	// 驗證RLS上下文
	err := h.authService.VerifyRLSContext(
		c.Request.Context(),
		userID.(int64),
		companyID.(int64),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":     "RLS context verification failed",
			"details":   err.Error(),
			"rls_active": false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"rls_active": true,
		"user_id":    userID,
		"company_id": companyID,
	})
}

// SimpleLogout 簡化登出
func (h *SimpleAuthHandler) SimpleLogout(c *gin.Context) {
	// 從 Authorization header 取得 token（可選）
	authHeader := c.GetHeader("Authorization")
	token := ""
	if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		token = authHeader[7:]
	}
	
	// 清除RLS上下文
	if err := h.authService.LogoutAndClearRLS(c.Request.Context(), token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Logout failed",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged out successfully",
	})
}