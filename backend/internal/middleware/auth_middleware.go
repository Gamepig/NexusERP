package middleware

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/services"
	"nexus-erp/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	userService services.UserServiceInterface
	config      *config.Config
}

func NewAuthMiddleware(userService services.UserServiceInterface, config *config.Config) *AuthMiddleware {
	return &AuthMiddleware{
		userService: userService,
		config:      config,
	}
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
			})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		// Try to validate as JWT first
		claims, err := utils.ValidateJWT(tokenString, m.config.JWT.Secret)
		
		// If JWT validation fails, try Laravel API token validation
		if err != nil {
			user, err := m.userService.ValidateLaravelAPIToken(tokenString)
			if err != nil {
				// If Laravel token validation fails, try simple base64 token (for development)
				userID, err := m.validateSimpleToken(tokenString)
				if err != nil {
					c.JSON(http.StatusUnauthorized, gin.H{
						"error": "Invalid token",
					})
					c.Abort()
					return
				}
				
				user, err := m.userService.GetUserByID(int64(userID))
				if err != nil {
					c.JSON(http.StatusUnauthorized, gin.H{
						"error": "User not found",
					})
					c.Abort()
					return
				}

				if user.Status != "active" {
					c.JSON(http.StatusForbidden, gin.H{
						"error": "User account is not active",
					})
					c.Abort()
					return
				}

				c.Set("user", user)
				c.Set("user_id", user.ID)
				c.Set("username", user.Username)
				c.Next()
				return
			}

			// Laravel API token validation succeeded
			if user.Status != "active" {
				c.JSON(http.StatusForbidden, gin.H{
					"error": "User account is not active",
				})
				c.Abort()
				return
			}

			c.Set("user", user)
			c.Set("user_id", user.ID)
			c.Set("username", user.Username)
			c.Next()
			return
		}

		user, err := m.userService.GetUserByID(claims.UserID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User not found",
			})
			c.Abort()
			return
		}

		if user.Status != "active" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "User account is not active",
			})
			c.Abort()
			return
		}

		c.Set("user", user)
		c.Set("user_id", user.ID)
		c.Set("username", user.Username)
		c.Next()
	}
}

// RequireAuthWithPermission combines authentication with permission checking
func (m *AuthMiddleware) RequireAuthWithPermission(resource, action string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// First run authentication
		authFunc := m.RequireAuth()
		authFunc(c)
		
		// If auth failed, abort
		if c.IsAborted() {
			return
		}
		
		// Then check permission
		permissionFunc := RequirePermission(m.userService, resource, action)
		permissionFunc(c)
	})
}

// RequireAuthWithRole combines authentication with role checking
func (m *AuthMiddleware) RequireAuthWithRole(roleName string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// First run authentication
		authFunc := m.RequireAuth()
		authFunc(c)
		
		// If auth failed, abort
		if c.IsAborted() {
			return
		}
		
		// Then check role
		roleFunc := RequireRole(m.userService, roleName)
		roleFunc(c)
	})
}

// RequireAuthWithAdmin combines authentication with admin role checking
func (m *AuthMiddleware) RequireAuthWithAdmin() gin.HandlerFunc {
	return m.RequireAuthWithRole("admin")
}

// validateSimpleToken validates a simple base64 token (for development)
func (m *AuthMiddleware) validateSimpleToken(tokenString string) (int, error) {
	// Decode base64 token
	decoded, err := base64.StdEncoding.DecodeString(tokenString)
	if err != nil {
		return 0, fmt.Errorf("invalid base64 token")
	}
	
	// Parse JSON
	var payload struct {
		UserID int    `json:"user_id"`
		Email  string `json:"email"`
		Name   string `json:"name"`
		Exp    int64  `json:"exp"`
	}
	
	if err := json.Unmarshal(decoded, &payload); err != nil {
		return 0, fmt.Errorf("invalid token format")
	}
	
	// Check expiration
	if payload.Exp < time.Now().Unix() {
		return 0, fmt.Errorf("token expired")
	}
	
	// Return user ID for further validation
	return payload.UserID, nil
}