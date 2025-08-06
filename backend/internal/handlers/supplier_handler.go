package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
)

type SupplierHandler struct {
	supplierService services.SupplierService
}

func NewSupplierHandler(supplierService services.SupplierService) *SupplierHandler {
	return &SupplierHandler{
		supplierService: supplierService,
	}
}

// CreateSupplier handles POST /api/suppliers
func (h *SupplierHandler) CreateSupplier(c *gin.Context) {
	var req models.CreateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	supplier, err := h.supplierService.CreateSupplier(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, supplier)
}

// GetSuppliers handles GET /api/suppliers
func (h *SupplierHandler) GetSuppliers(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	isActive := c.Query("is_active")

	var isActivePtr *bool
	if isActive != "" {
		if active, err := strconv.ParseBool(isActive); err == nil {
			isActivePtr = &active
		}
	}

	suppliers, total, err := h.supplierService.GetSuppliers(c.Request.Context(), page, limit, search, isActivePtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  suppliers,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetSupplier handles GET /api/suppliers/:id
func (h *SupplierHandler) GetSupplier(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid supplier ID"})
		return
	}

	supplier, err := h.supplierService.GetSupplier(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Supplier not found"})
		return
	}

	c.JSON(http.StatusOK, supplier)
}

// UpdateSupplier handles PUT /api/suppliers/:id
func (h *SupplierHandler) UpdateSupplier(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid supplier ID"})
		return
	}

	var req models.UpdateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	supplier, err := h.supplierService.UpdateSupplier(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, supplier)
}

// DeleteSupplier handles DELETE /api/suppliers/:id
func (h *SupplierHandler) DeleteSupplier(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid supplier ID"})
		return
	}

	err = h.supplierService.DeleteSupplier(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetSupplierByCode handles GET /api/suppliers/code/:code
func (h *SupplierHandler) GetSupplierByCode(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Supplier code is required"})
		return
	}

	supplier, err := h.supplierService.GetSupplierByCode(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Supplier not found"})
		return
	}

	c.JSON(http.StatusOK, supplier)
}