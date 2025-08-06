package handlers

import (
	"net/http"
	"strconv"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type PermissionHandler struct {
	permissionService services.PermissionServiceInterface
}

func NewPermissionHandler(permissionService services.PermissionServiceInterface) *PermissionHandler {
	return &PermissionHandler{
		permissionService: permissionService,
	}
}

// GetAllPermissions retrieves all permissions
func (h *PermissionHandler) GetAllPermissions(c *gin.Context) {
	permissions, err := h.permissionService.GetAllPermissions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"permissions": permissions})
}

// GetPermissionByID retrieves a permission by ID
func (h *PermissionHandler) GetPermissionByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permission ID"})
		return
	}

	permission, err := h.permissionService.GetPermissionByID(id)
	if err != nil {
		if err.Error() == "permission not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Permission not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"permission": permission})
}

// CreatePermission creates a new permission
func (h *PermissionHandler) CreatePermission(c *gin.Context) {
	var req models.CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	permission, err := h.permissionService.CreatePermission(req.Name, req.Resource, req.Action, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"permission": permission})
}

// UpdatePermission updates an existing permission
func (h *PermissionHandler) UpdatePermission(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permission ID"})
		return
	}

	var req models.UpdatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	permission, err := h.permissionService.UpdatePermission(id, req.Name, req.Resource, req.Action, req.Description)
	if err != nil {
		if err.Error() == "permission not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Permission not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"permission": permission})
}

// DeletePermission deletes a permission
func (h *PermissionHandler) DeletePermission(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permission ID"})
		return
	}

	err = h.permissionService.DeletePermission(id)
	if err != nil {
		if err.Error() == "permission not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Permission not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permission deleted successfully"})
}