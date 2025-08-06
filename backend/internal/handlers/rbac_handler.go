package handlers

import (
	"net/http"
	"strconv"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type RBACHandler struct {
	userService services.UserServiceInterface
}

func NewRBACHandler(userService services.UserServiceInterface) *RBACHandler {
	return &RBACHandler{
		userService: userService,
	}
}

// GetUserRoles retrieves roles for a user
func (h *RBACHandler) GetUserRoles(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	roles, err := h.userService.GetUserRoles(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.UserRolesResponse{
		UserID: userID,
		Roles:  roles,
	})
}

// GetUserPermissions retrieves permissions for a user
func (h *RBACHandler) GetUserPermissions(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	permissions, err := h.userService.GetUserPermissions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.UserPermissionsResponse{
		UserID:      userID,
		Permissions: permissions,
	})
}

// AssignRole assigns a role to a user
func (h *RBACHandler) AssignRole(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.AssignRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.userService.AssignRole(userID, req.RoleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role assigned to user successfully"})
}

// RemoveRole removes a role from a user
func (h *RBACHandler) RemoveRole(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	roleIDStr := c.Param("role_id")
	roleID, err := strconv.ParseInt(roleIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
		return
	}

	err = h.userService.RemoveRole(userID, roleID)
	if err != nil {
		if err.Error() == "role assignment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Role assignment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role removed from user successfully"})
}

// CheckPermission checks if a user has a specific permission
func (h *RBACHandler) CheckPermission(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	resource := c.Query("resource")
	action := c.Query("action")

	if resource == "" || action == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Resource and action parameters are required"})
		return
	}

	hasPermission, err := h.userService.HasPermission(userID, resource, action)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":        userID,
		"resource":       resource,
		"action":         action,
		"has_permission": hasPermission,
	})
}