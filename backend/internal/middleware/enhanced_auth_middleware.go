package middleware

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/services"
	"nexus-erp/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// EnhancedAuthMiddleware 增強版認證中介軟體，包含速率限制和安全日誌
type EnhancedAuthMiddleware struct {
	userService      services.UserServiceInterface
	rateLimitService *services.RateLimitService
	auditService     *services.AuditService
	config           *config.Config
}

// NewEnhancedAuthMiddleware 創建增強版認證中介軟體
func NewEnhancedAuthMiddleware(
	userService services.UserServiceInterface,
	rateLimitService *services.RateLimitService,
	auditService *services.AuditService,
	config *config.Config,
) *EnhancedAuthMiddleware {
	return &EnhancedAuthMiddleware{
		userService:      userService,
		rateLimitService: rateLimitService,
		auditService:     auditService,
		config:           config,
	}
}

// RequireAuthWithRateLimit 需要認證並實施速率限制
func (m *EnhancedAuthMiddleware) RequireAuthWithRateLimit(rateLimitConfig services.RateLimitConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		_ = c.GetHeader("User-Agent") // userAgent for future security checks

		// 檢查 IP 是否被封鎖
		if m.rateLimitService != nil {
			blocked, err := m.rateLimitService.IsBlocked(c.Request.Context(), clientIP)
			if err == nil && blocked {
				m.logSecurityEvent(c, nil, "blocked_ip_access", false, "IP is blocked")
				c.JSON(http.StatusTooManyRequests, gin.H{
					"error":   "Access denied",
					"message": "Your IP address has been temporarily blocked due to suspicious activity",
				})
				c.Abort()
				return
			}

			// 檢查速率限制
			result, err := m.rateLimitService.CheckIPRate(c.Request.Context(), clientIP, rateLimitConfig)
			if err == nil && !result.Allowed {
				m.logSecurityEvent(c, nil, "rate_limit_exceeded", false, "Rate limit exceeded")
				c.Header("X-RateLimit-Limit", strconv.Itoa(rateLimitConfig.MaxRequests))
				c.Header("X-RateLimit-Remaining", "0")
				c.Header("X-RateLimit-Reset", strconv.FormatInt(result.ResetTime.Unix(), 10))
				c.Header("Retry-After", strconv.Itoa(int(result.RetryAfter.Seconds())))

				c.JSON(http.StatusTooManyRequests, gin.H{
					"error":       "Rate limit exceeded",
					"retry_after": int(result.RetryAfter.Seconds()),
				})
				c.Abort()
				return
			}

			if result != nil {
				c.Header("X-RateLimit-Limit", strconv.Itoa(rateLimitConfig.MaxRequests))
				c.Header("X-RateLimit-Remaining", strconv.Itoa(result.Remaining))
				c.Header("X-RateLimit-Reset", strconv.FormatInt(result.ResetTime.Unix(), 10))
			}
		}

		// 執行認證
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			m.logSecurityEvent(c, nil, "missing_auth_header", false, "Authorization header required")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
			})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			m.logSecurityEvent(c, nil, "invalid_auth_format", false, "Invalid authorization header format")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		claims, err := utils.ValidateJWT(tokenString, m.config.JWT.Secret)
		if err != nil {
			m.logSecurityEvent(c, nil, "invalid_token", false, err.Error())
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token",
			})
			c.Abort()
			return
		}

		user, err := m.userService.GetUserByID(claims.UserID)
		if err != nil {
			m.logSecurityEvent(c, &claims.UserID, "user_not_found", false, "User not found")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User not found",
			})
			c.Abort()
			return
		}

		if user.Status != "active" {
			m.logSecurityEvent(c, &user.ID, "inactive_user_access", false, "User account is not active")
			c.JSON(http.StatusForbidden, gin.H{
				"error": "User account is not active",
			})
			c.Abort()
			return
		}

		// 記錄成功的認證事件
		m.logSecurityEvent(c, &user.ID, "successful_auth", true, "")

		c.Set("user", user)
		c.Set("user_id", user.ID)
		c.Set("username", user.Username)
		c.Next()
	}
}

// RequireLoginWithBruteForceProtection 登入端點的暴力攻擊防護
func (m *EnhancedAuthMiddleware) RequireLoginWithBruteForceProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()

		if m.rateLimitService != nil {
			// 檢查暴力攻擊防護
			result, err := m.rateLimitService.CheckBruteForceProtection(c.Request.Context(), clientIP)
			if err == nil && !result.Allowed {
				m.logSecurityEvent(c, nil, "brute_force_blocked", false, "Brute force protection triggered")
				c.JSON(http.StatusTooManyRequests, gin.H{
					"error":       "Too many failed login attempts",
					"message":     "Your IP has been temporarily blocked due to multiple failed login attempts",
					"retry_after": int(result.RetryAfter.Seconds()),
				})
				c.Abort()
				return
			}

			// 檢查登入速率限制
			loginConfig := services.RateLimitConfig{
				MaxRequests: 5,
				Window:      15 * time.Minute,
			}

			loginResult, err := m.rateLimitService.CheckIPRate(c.Request.Context(), clientIP, loginConfig)
			if err == nil && !loginResult.Allowed {
				m.logSecurityEvent(c, nil, "login_rate_limit_exceeded", false, "Login rate limit exceeded")
				c.JSON(http.StatusTooManyRequests, gin.H{
					"error":       "Too many login attempts",
					"retry_after": int(loginResult.RetryAfter.Seconds()),
				})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// logSecurityEvent 記錄安全事件
func (m *EnhancedAuthMiddleware) logSecurityEvent(c *gin.Context, userID *int64, action string, success bool, errorMsg string) {
	if m.auditService == nil {
		return
	}

	var errorMsgPtr *string
	if errorMsg != "" {
		errorMsgPtr = &errorMsg
	}

	_ = m.auditService.LogEvent(&services.AuditEvent{
		UserID:       userID,
		Action:       action,
		Resource:     "auth",
		IPAddress:    c.ClientIP(),
		UserAgent:    c.GetHeader("User-Agent"),
		Success:      success,
		ErrorMessage: errorMsgPtr,
		Metadata: map[string]interface{}{
			"path":   c.Request.URL.Path,
			"method": c.Request.Method,
		},
	})
}

// RecordLoginFailure 記錄登入失敗（在處理器中調用）
func (m *EnhancedAuthMiddleware) RecordLoginFailure(c *gin.Context, username string) {
	clientIP := c.ClientIP()
	
	if m.rateLimitService != nil {
		_ = m.rateLimitService.RecordLoginFailure(c.Request.Context(), clientIP)
	}

	if m.auditService != nil {
		errorMsg := "Invalid credentials"
		_ = m.auditService.LogLoginAttempt(nil, username, clientIP, c.GetHeader("User-Agent"), false, &errorMsg)
	}
}

// RecordLoginSuccess 記錄登入成功（在處理器中調用）
func (m *EnhancedAuthMiddleware) RecordLoginSuccess(c *gin.Context, userID int64, username string) {
	clientIP := c.ClientIP()
	
	if m.rateLimitService != nil {
		_ = m.rateLimitService.ClearLoginFailures(c.Request.Context(), clientIP)
	}

	if m.auditService != nil {
		_ = m.auditService.LogLoginAttempt(&userID, username, clientIP, c.GetHeader("User-Agent"), true, nil)
	}
}

// DetectSuspiciousActivity 檢測可疑活動
func (m *EnhancedAuthMiddleware) DetectSuspiciousActivity() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		userAgent := c.GetHeader("User-Agent")

		// 檢測常見的攻擊模式
		suspiciousPatterns := []struct {
			check   func() bool
			activity string
		}{
			{
				check: func() bool {
					return strings.Contains(strings.ToLower(userAgent), "sqlmap")
				},
				activity: "sqlmap_detected",
			},
			{
				check: func() bool {
					return strings.Contains(strings.ToLower(userAgent), "nmap")
				},
				activity: "nmap_detected",
			},
			{
				check: func() bool {
					path := strings.ToLower(c.Request.URL.Path)
					return strings.Contains(path, "../") || strings.Contains(path, "..\\")
				},
				activity: "path_traversal_attempt",
			},
			{
				check: func() bool {
					query := strings.ToLower(c.Request.URL.RawQuery)
					return strings.Contains(query, "union") || strings.Contains(query, "select") || strings.Contains(query, "drop")
				},
				activity: "sql_injection_attempt",
			},
			{
				check: func() bool {
					return userAgent == "" || len(userAgent) < 10
				},
				activity: "suspicious_user_agent",
			},
		}

		for _, pattern := range suspiciousPatterns {
			if pattern.check() {
				if m.rateLimitService != nil {
					_ = m.rateLimitService.RecordSuspiciousActivity(c.Request.Context(), clientIP, pattern.activity)
				}
				
				m.logSecurityEvent(c, nil, pattern.activity, false, "Suspicious activity detected")
				
				// 對於嚴重的攻擊嘗試，立即封鎖 IP
				if pattern.activity == "sql_injection_attempt" || pattern.activity == "path_traversal_attempt" {
					if m.rateLimitService != nil {
						_ = m.rateLimitService.BlockIP(c.Request.Context(), clientIP, 24*time.Hour)
					}
					
					c.JSON(http.StatusForbidden, gin.H{
						"error": "Access denied",
					})
					c.Abort()
					return
				}
			}
		}

		c.Next()
	}
}