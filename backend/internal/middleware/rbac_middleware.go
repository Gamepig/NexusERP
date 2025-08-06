package middleware

import (
	"net/http"
	"nexus-erp/backend/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

// RequirePermission creates a middleware that checks if the authenticated user has the required permission
func RequirePermission(userService services.UserServiceInterface, resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by auth middleware)
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		// Convert user ID to int64
		userIDInt, ok := userID.(int64)
		if !ok {
			// Try to convert from string if it's stored as string
			userIDStr, ok := userID.(string)
			if !ok {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
				c.Abort()
				return
			}
			
			var err error
			userIDInt, err = strconv.ParseInt(userIDStr, 10, 64)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
				c.Abort()
				return
			}
		}

		// Check if user has the required permission
		hasPermission, err := userService.HasPermission(userIDInt, resource, action)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions"})
			c.Abort()
			return
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRole creates a middleware that checks if the authenticated user has the required role
func RequireRole(userService services.UserServiceInterface, roleName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by auth middleware)
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		// Convert user ID to int64
		userIDInt, ok := userID.(int64)
		if !ok {
			// Try to convert from string if it's stored as string
			userIDStr, ok := userID.(string)
			if !ok {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
				c.Abort()
				return
			}
			
			var err error
			userIDInt, err = strconv.ParseInt(userIDStr, 10, 64)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
				c.Abort()
				return
			}
		}

		// Get user roles
		roles, err := userService.GetUserRoles(userIDInt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user roles"})
			c.Abort()
			return
		}

		// Check if user has the required role
		hasRole := false
		for _, role := range roles {
			if role.Name == roleName {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient role permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAdmin creates a middleware that checks if the authenticated user is an admin
func RequireAdmin(userService services.UserServiceInterface) gin.HandlerFunc {
	return RequireRole(userService, "admin")
}

// RequireManagerOrAdmin creates a middleware that checks if the authenticated user is a manager or admin
func RequireManagerOrAdmin(userService services.UserServiceInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by auth middleware)
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		// Convert user ID to int64
		userIDInt, ok := userID.(int64)
		if !ok {
			// Try to convert from string if it's stored as string
			userIDStr, ok := userID.(string)
			if !ok {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
				c.Abort()
				return
			}
			
			var err error
			userIDInt, err = strconv.ParseInt(userIDStr, 10, 64)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
				c.Abort()
				return
			}
		}

		// Get user roles
		roles, err := userService.GetUserRoles(userIDInt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user roles"})
			c.Abort()
			return
		}

		// Check if user has manager or admin role
		hasRequiredRole := false
		for _, role := range roles {
			if role.Name == "admin" || role.Name == "manager" {
				hasRequiredRole = true
				break
			}
		}

		if !hasRequiredRole {
			c.JSON(http.StatusForbidden, gin.H{"error": "Manager or admin role required"})
			c.Abort()
			return
		}

		c.Next()
	}
}