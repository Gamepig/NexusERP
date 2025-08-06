package handlers

import (
	"crypto/subtle"
	"net/http"
	"strings"
	"time"

	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/middleware"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

// SecureAuthHandler 安全增強版認證處理器
type SecureAuthHandler struct {
	userService         services.UserServiceInterface
	aiService           services.AIClassifier
	auditService        *services.AuditService
	enhancedAuthMiddleware *middleware.EnhancedAuthMiddleware
	config              *config.Config
}

// NewSecureAuthHandler 創建安全認證處理器
func NewSecureAuthHandler(
	userService services.UserServiceInterface,
	aiService services.AIClassifier,
	auditService *services.AuditService,
	enhancedAuthMiddleware *middleware.EnhancedAuthMiddleware,
	config *config.Config,
) *SecureAuthHandler {
	return &SecureAuthHandler{
		userService:         userService,
		aiService:           aiService,
		auditService:        auditService,
		enhancedAuthMiddleware: enhancedAuthMiddleware,
		config:              config,
	}
}

// SecureLogin 安全登入處理
func (h *SecureAuthHandler) SecureLogin(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logFailedAttempt(c, "", "invalid_request_format", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": "Request format is invalid",
		})
		return
	}

	// 輸入驗證和清理
	req.Name = strings.TrimSpace(req.Name)
	req.Password = strings.TrimSpace(req.Password)

	if len(req.Name) == 0 || len(req.Password) == 0 {
		h.logFailedAttempt(c, req.Name, "empty_credentials", "Empty username or password")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username and password cannot be empty",
		})
		return
	}

	// 檢查用戶名長度和格式
	if len(req.Name) > 100 || len(req.Password) > 200 {
		h.logFailedAttempt(c, req.Name, "invalid_credential_length", "Credentials too long")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid credentials format",
		})
		return
	}

	// 檢查用戶是否存在
	user, err := h.userService.GetUserByUsername(req.Name)
	if err != nil {
		// 使用固定時間比較防止計時攻擊
		time.Sleep(100 * time.Millisecond)
		h.enhancedAuthMiddleware.RecordLoginFailure(c, req.Name)
		h.logFailedAttempt(c, req.Name, "invalid_credentials", "User not found")
		
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	// 驗證密碼
	if err := h.userService.ValidatePassword(user, req.Password); err != nil {
		h.enhancedAuthMiddleware.RecordLoginFailure(c, req.Name)
		h.logFailedAttempt(c, req.Name, "invalid_password", "Password validation failed")
		
		// 防止計時攻擊 - 保持一致的回應時間
		time.Sleep(100 * time.Millisecond)
		
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	// 檢查用戶狀態
	if user.Status != "active" {
		h.logFailedAttempt(c, req.Name, "inactive_account", "Account is not active")
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Account is not active",
		})
		return
	}

	// 生成 JWT token
	token, err := h.userService.GenerateJWT(user, h.config.JWT.Secret)
	if err != nil {
		h.logError(c, user.ID, "token_generation_failed", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})
		return
	}

	// 生成 refresh token
	refreshToken, err := h.userService.CreateRefreshToken(user.ID)
	if err != nil {
		h.logError(c, user.ID, "refresh_token_creation_failed", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate refresh token",
		})
		return
	}

	// 記錄成功登入
	h.enhancedAuthMiddleware.RecordLoginSuccess(c, user.ID, req.Name)

	// 記錄成功登入事件
	h.logSuccessfulLogin(c, user.ID, req.Name)

	c.JSON(http.StatusOK, gin.H{
		"message":       "Login successful",
		"token":         token,
		"refresh_token": refreshToken.Token,
		"user":          user.ToUserResponse(),
		"expires_in":    int(15 * time.Minute.Seconds()), // 15 minutes
	})
}

// SecureForgotPassword 安全的密碼重設請求
func (h *SecureAuthHandler) SecureForgotPassword(c *gin.Context) {
	var req models.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": "Request format is invalid",
		})
		return
	}

	// 清理輸入
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	// 基本電子郵件格式驗證
	if !h.isValidEmail(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid email format",
		})
		return
	}

	// 為了安全考慮，無論電子郵件是否存在，都返回相同的回應
	// 這防止了用戶枚舉攻擊
	user, err := h.userService.GetUserByEmail(req.Email)
	if err != nil {
		// 記錄嘗試，但不透露電子郵件不存在
		h.logSecurityEvent(c, nil, "password_reset_nonexistent_email", false, "Password reset attempt for non-existent email")
	} else {
		// 只有在生產環境才實際發送電子郵件
		if h.config.App.Environment == "production" {
			// 創建密碼重設 token
			_, err := h.userService.CreatePasswordResetToken(user.ID)
			if err != nil {
				h.logError(c, user.ID, "reset_token_creation_failed", err.Error())
			} else {
				// TODO: 實施電子郵件服務發送重設連結
				// 記錄密碼重設請求
				h.logSecurityEvent(c, &user.ID, "password_reset_requested", true, "")
			}
		} else {
			// 開發環境：創建 token 但記錄警告
			_, err := h.userService.CreatePasswordResetToken(user.ID)
			if err == nil {
				h.logSecurityEvent(c, &user.ID, "password_reset_dev_mode", true, "Development mode - token not sent via email")
			}
		}
	}

	// 統一回應，防止用戶枚舉
	c.JSON(http.StatusOK, gin.H{
		"message": "If the email exists in our system, a password reset link has been sent",
	})
}

// SecureResetPassword 安全的密碼重設
func (h *SecureAuthHandler) SecureResetPassword(c *gin.Context) {
	var req models.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": "Request format is invalid",
		})
		return
	}

	// 驗證新密碼強度
	if !h.isStrongPassword(req.NewPassword) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Password does not meet security requirements",
			"requirements": []string{
				"At least 8 characters long",
				"Contains uppercase and lowercase letters",
				"Contains at least one number",
				"Contains at least one special character",
			},
		})
		return
	}

	// 驗證密碼重設 token
	resetToken, err := h.userService.ValidatePasswordResetToken(req.Token)
	if err != nil {
		h.logSecurityEvent(c, nil, "invalid_reset_token", false, "Invalid or expired password reset token")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid or expired password reset token",
		})
		return
	}

	// 更新用戶密碼
	err = h.userService.UpdateUserPassword(resetToken.UserID, req.NewPassword)
	if err != nil {
		h.logError(c, resetToken.UserID, "password_update_failed", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update password",
		})
		return
	}

	// 標記 token 為已使用
	err = h.userService.UsePasswordResetToken(req.Token)
	if err != nil {
		h.logError(c, resetToken.UserID, "reset_token_cleanup_failed", err.Error())
	}

	// 撤銷所有現有的 refresh token 以強制重新登入
	err = h.userService.RevokeAllUserRefreshTokens(resetToken.UserID)
	if err != nil {
		h.logError(c, resetToken.UserID, "refresh_token_revocation_failed", err.Error())
	}

	// 記錄成功的密碼重設
	h.logSecurityEvent(c, &resetToken.UserID, "password_reset_completed", true, "")

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successfully. Please log in with your new password.",
	})
}

// 輔助函數

// isValidEmail 基本電子郵件格式驗證
func (h *SecureAuthHandler) isValidEmail(email string) bool {
	return strings.Contains(email, "@") && strings.Contains(email, ".") && len(email) > 5 && len(email) < 255
}

// isStrongPassword 檢查密碼強度
func (h *SecureAuthHandler) isStrongPassword(password string) bool {
	if len(password) < 8 {
		return false
	}

	hasUpper := false
	hasLower := false
	hasNumber := false
	hasSpecial := false

	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasNumber = true
		case strings.ContainsRune("!@#$%^&*()_+-=[]{}|;:,.<>?", char):
			hasSpecial = true
		}
	}

	return hasUpper && hasLower && hasNumber && hasSpecial
}

// constantTimeCompare 防止計時攻擊的字符串比較
func (h *SecureAuthHandler) constantTimeCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

// 日誌記錄函數

func (h *SecureAuthHandler) logFailedAttempt(c *gin.Context, username, reason, details string) {
	if h.auditService != nil {
		_ = h.auditService.LogEvent(&services.AuditEvent{
			Action:    "login_failed",
			Resource:  "auth",
			IPAddress: c.ClientIP(),
			UserAgent: c.GetHeader("User-Agent"),
			Success:   false,
			ErrorMessage: &details,
			Metadata: map[string]interface{}{
				"username": username,
				"reason":   reason,
			},
		})
	}
}

func (h *SecureAuthHandler) logSuccessfulLogin(c *gin.Context, userID int64, username string) {
	if h.auditService != nil {
		_ = h.auditService.LogEvent(&services.AuditEvent{
			UserID:    &userID,
			Action:    "login_success",
			Resource:  "auth",
			IPAddress: c.ClientIP(),
			UserAgent: c.GetHeader("User-Agent"),
			Success:   true,
			Metadata: map[string]interface{}{
				"username": username,
			},
		})
	}
}

func (h *SecureAuthHandler) logError(c *gin.Context, userID int64, action, errorMsg string) {
	if h.auditService != nil {
		_ = h.auditService.LogEvent(&services.AuditEvent{
			UserID:       &userID,
			Action:       action,
			Resource:     "auth",
			IPAddress:    c.ClientIP(),
			UserAgent:    c.GetHeader("User-Agent"),
			Success:      false,
			ErrorMessage: &errorMsg,
		})
	}
}

func (h *SecureAuthHandler) logSecurityEvent(c *gin.Context, userID *int64, action string, success bool, details string) {
	if h.auditService != nil {
		var errorMsgPtr *string
		if details != "" && !success {
			errorMsgPtr = &details
		}

		_ = h.auditService.LogEvent(&services.AuditEvent{
			UserID:       userID,
			Action:       action,
			Resource:     "auth",
			IPAddress:    c.ClientIP(),
			UserAgent:    c.GetHeader("User-Agent"),
			Success:      success,
			ErrorMessage: errorMsgPtr,
			Metadata: map[string]interface{}{
				"details": details,
			},
		})
	}
}