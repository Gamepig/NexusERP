package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
)

// MarketplaceSupplierHandler handles marketplace supplier-related HTTP requests
type MarketplaceSupplierHandler struct {
	supplierService *services.MarketplaceSupplierService
	validator       *validator.Validate
}

// NewMarketplaceSupplierHandler creates a new marketplace supplier handler
func NewMarketplaceSupplierHandler(supplierService *services.MarketplaceSupplierService) *MarketplaceSupplierHandler {
	return &MarketplaceSupplierHandler{
		supplierService: supplierService,
		validator:       validator.New(),
	}
}

// RegisterSupplier godoc
// @Summary Register a new supplier
// @Description Register a new supplier in the marketplace
// @Tags marketplace-suppliers
// @Accept json
// @Produce json
// @Param supplier body services.SupplierRegistrationRequest true "Supplier registration data"
// @Success 201 {object} models.MarketplaceSupplier
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/marketplace/suppliers/register [post]
func (h *MarketplaceSupplierHandler) RegisterSupplier(c *gin.Context) {
	var req services.SupplierRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Message: err.Error(),
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if exists {
		if uid, ok := userID.(int64); ok {
			req.UserID = &uid
		}
	}

	supplier, err := h.supplierService.RegisterSupplier(c.Request.Context(), &req)
	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			c.JSON(http.StatusConflict, ErrorResponse{
				Error:   "Supplier already exists",
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to register supplier",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, supplier)
}

// GetSupplier godoc
// @Summary Get supplier by ID
// @Description Get supplier details by ID
// @Tags marketplace-suppliers
// @Produce json
// @Param id path int true "Supplier ID"
// @Success 200 {object} models.MarketplaceSupplier
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/marketplace/suppliers/{id} [get]
func (h *MarketplaceSupplierHandler) GetSupplier(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid supplier ID",
			Message: "Supplier ID must be a valid number",
		})
		return
	}

	supplier, err := h.supplierService.GetSupplierByID(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Supplier not found",
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to get supplier",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, supplier)
}

// GetMySupplier godoc
// @Summary Get current user's supplier profile
// @Description Get the supplier profile for the authenticated user
// @Tags marketplace-suppliers
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.MarketplaceSupplier
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/marketplace/suppliers/me [get]
func (h *MarketplaceSupplierHandler) GetMySupplier(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "User not authenticated",
			Message: "User ID not found in context",
		})
		return
	}

	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Invalid user ID",
			Message: "User ID is not valid",
		})
		return
	}

	supplier, err := h.supplierService.GetSupplierByUserID(c.Request.Context(), uid)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Supplier profile not found",
				Message: "No supplier profile found for this user",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to get supplier profile",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, supplier)
}

// UpdateSupplier godoc
// @Summary Update supplier profile
// @Description Update supplier profile information
// @Tags marketplace-suppliers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Supplier ID"
// @Param supplier body services.SupplierUpdateRequest true "Supplier update data"
// @Success 200 {object} models.MarketplaceSupplier
// @Failure 400 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/marketplace/suppliers/{id} [put]
func (h *MarketplaceSupplierHandler) UpdateSupplier(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid supplier ID",
			Message: "Supplier ID must be a valid number",
		})
		return
	}

	var req services.SupplierUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	// Check if user owns this supplier or is admin
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "User not authenticated",
			Message: "User ID not found in context",
		})
		return
	}

	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Invalid user ID",
			Message: "User ID is not valid",
		})
		return
	}

	// Get existing supplier to check ownership
	existing, err := h.supplierService.GetSupplierByID(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Supplier not found",
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to get supplier",
			Message: err.Error(),
		})
		return
	}

	// Check ownership (allow admin users to edit any supplier)
	userRole, _ := c.Get("userRole")
	isAdmin := userRole == "admin" || userRole == "superadmin"
	
	if !isAdmin && (existing.UserID == nil || *existing.UserID != uid) {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error:   "Access denied",
			Message: "You can only update your own supplier profile",
		})
		return
	}

	supplier, err := h.supplierService.UpdateSupplier(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to update supplier",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, supplier)
}

// SearchSuppliers godoc
// @Summary Search suppliers
// @Description Search suppliers with filters and pagination
// @Tags marketplace-suppliers
// @Produce json
// @Param status query []string false "Filter by status (pending, approved, rejected, suspended, inactive)"
// @Param business_type query []string false "Filter by business type (manufacturer, distributor, retailer, service_provider)"
// @Param business_category query []string false "Filter by business category"
// @Param search query string false "Search term for company name, contact person, or email"
// @Param page query int false "Page number (default: 1)"
// @Param page_size query int false "Page size (default: 20)"
// @Success 200 {object} services.SupplierSearchResult
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/marketplace/suppliers [get]
func (h *MarketplaceSupplierHandler) SearchSuppliers(c *gin.Context) {
	filters := &services.SupplierSearchFilters{}

	// Parse status filter
	if statusStrs := c.QueryArray("status"); len(statusStrs) > 0 {
		for _, statusStr := range statusStrs {
			status := models.SupplierStatus(statusStr)
			filters.Status = append(filters.Status, status)
		}
	}

	// Parse business type filter
	filters.BusinessType = c.QueryArray("business_type")

	// Parse business category filter
	filters.BusinessCategory = c.QueryArray("business_category")

	// Parse search term
	filters.Search = c.Query("search")

	// Parse pagination
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filters.Page = page
		}
	}
	if filters.Page == 0 {
		filters.Page = 1
	}

	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil && pageSize > 0 && pageSize <= 100 {
			filters.PageSize = pageSize
		}
	}
	if filters.PageSize == 0 {
		filters.PageSize = 20
	}

	result, err := h.supplierService.SearchSuppliers(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to search suppliers",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// ApproveSupplier godoc
// @Summary Approve or reject a supplier
// @Description Approve or reject a supplier registration (admin only)
// @Tags marketplace-admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Supplier ID"
// @Param approval body services.SupplierApprovalRequest true "Approval data"
// @Success 200 {object} models.MarketplaceSupplier
// @Failure 400 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/marketplace/admin/suppliers/{id}/approve [put]
func (h *MarketplaceSupplierHandler) ApproveSupplier(c *gin.Context) {
	// Check admin permissions
	userRole, exists := c.Get("userRole")
	if !exists || (userRole != "admin" && userRole != "superadmin") {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error:   "Access denied",
			Message: "Admin access required",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid supplier ID",
			Message: "Supplier ID must be a valid number",
		})
		return
	}

	var req services.SupplierApprovalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Message: err.Error(),
		})
		return
	}

	// Get approver user ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "User not authenticated",
			Message: "User ID not found in context",
		})
		return
	}

	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Invalid user ID",
			Message: "User ID is not valid",
		})
		return
	}

	req.ApprovedBy = uid

	supplier, err := h.supplierService.ApproveSupplier(c.Request.Context(), id, &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Supplier not found",
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to approve supplier",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, supplier)
}

// DeleteSupplier godoc
// @Summary Delete a supplier
// @Description Soft delete a supplier (admin only)
// @Tags marketplace-admin
// @Security BearerAuth
// @Param id path int true "Supplier ID"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/marketplace/admin/suppliers/{id} [delete]
func (h *MarketplaceSupplierHandler) DeleteSupplier(c *gin.Context) {
	// Check admin permissions
	userRole, exists := c.Get("userRole")
	if !exists || (userRole != "admin" && userRole != "superadmin") {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error:   "Access denied",
			Message: "Admin access required",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid supplier ID",
			Message: "Supplier ID must be a valid number",
		})
		return
	}

	err = h.supplierService.DeleteSupplier(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Supplier not found",
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to delete supplier",
			Message: err.Error(),
		})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetSupplierStatistics godoc
// @Summary Get supplier statistics
// @Description Get supplier statistics by status (admin only)
// @Tags marketplace-admin
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]int64
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/marketplace/admin/suppliers/statistics [get]
func (h *MarketplaceSupplierHandler) GetSupplierStatistics(c *gin.Context) {
	// Check admin permissions
	userRole, exists := c.Get("userRole")
	if !exists || (userRole != "admin" && userRole != "superadmin") {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error:   "Access denied",
			Message: "Admin access required",
		})
		return
	}

	stats, err := h.supplierService.GetSupplierStatistics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to get statistics",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// SetupSupplierRoutes sets up the supplier routes
func (h *MarketplaceSupplierHandler) SetupSupplierRoutes(router *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	suppliers := router.Group("/suppliers")
	{
		// Public routes
		suppliers.POST("/register", h.RegisterSupplier)
		suppliers.GET("/:id", h.GetSupplier)
		suppliers.GET("", h.SearchSuppliers)

		// Protected routes (require authentication)
		protected := suppliers.Group("")
		protected.Use(authMiddleware)
		{
			protected.GET("/me", h.GetMySupplier)
			protected.PUT("/:id", h.UpdateSupplier)
		}
	}

	// Admin routes
	admin := router.Group("/admin/suppliers")
	admin.Use(authMiddleware)
	{
		admin.PUT("/:id/approve", h.ApproveSupplier)
		admin.DELETE("/:id", h.DeleteSupplier)
		admin.GET("/statistics", h.GetSupplierStatistics)
	}
}