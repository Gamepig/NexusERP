package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
)

type InventoryHandler struct {
	inventoryService services.InventoryService
}

func NewInventoryHandler(inventoryService services.InventoryService) *InventoryHandler {
	return &InventoryHandler{
		inventoryService: inventoryService,
	}
}

// CreateInventoryTransaction handles POST /api/inventory-transactions
func (h *InventoryHandler) CreateInventoryTransaction(c *gin.Context) {
	var req models.CreateInventoryTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	transaction, err := h.inventoryService.CreateInventoryTransaction(c.Request.Context(), req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, transaction)
}

// GetInventoryTransactions handles GET /api/inventory-transactions
func (h *InventoryHandler) GetInventoryTransactions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	productID := c.Query("product_id")
	warehouseID := c.Query("warehouse_id")
	transactionType := c.Query("transaction_type")

	var productIDPtr *int64
	if productID != "" {
		if id, err := strconv.ParseInt(productID, 10, 64); err == nil {
			productIDPtr = &id
		}
	}

	var warehouseIDPtr *int64
	if warehouseID != "" {
		if id, err := strconv.ParseInt(warehouseID, 10, 64); err == nil {
			warehouseIDPtr = &id
		}
	}

	var transactionTypeIDPtr *int64
	if transactionType != "" {
		if id, err := strconv.ParseInt(transactionType, 10, 64); err == nil {
			transactionTypeIDPtr = &id
		}
	}

	transactions, total, err := h.inventoryService.GetInventoryTransactions(c.Request.Context(), page, limit, productIDPtr, warehouseIDPtr, transactionTypeIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"total":        total,
		"page":         page,
		"limit":        limit,
	})
}

// GetInventoryLevels handles GET /api/inventory-levels
func (h *InventoryHandler) GetInventoryLevels(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	productID := c.Query("product_id")
	warehouseID := c.Query("warehouse_id")
	lowStock := c.Query("low_stock")

	var productIDPtr *int64
	if productID != "" {
		if id, err := strconv.ParseInt(productID, 10, 64); err == nil {
			productIDPtr = &id
		}
	}

	var warehouseIDPtr *int64
	if warehouseID != "" {
		if id, err := strconv.ParseInt(warehouseID, 10, 64); err == nil {
			warehouseIDPtr = &id
		}
	}

	var lowStockPtr *bool
	if lowStock != "" {
		if stock, err := strconv.ParseBool(lowStock); err == nil {
			lowStockPtr = &stock
		}
	}

	levels, total, err := h.inventoryService.GetInventoryLevels(c.Request.Context(), page, limit, productIDPtr, warehouseIDPtr, lowStockPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"inventory_levels": levels,
		"total":            total,
		"page":             page,
		"limit":            limit,
	})
}

// GetInventoryLevel handles GET /api/inventory-levels/:product_id/:warehouse_id
func (h *InventoryHandler) GetInventoryLevel(c *gin.Context) {
	productID, err := strconv.ParseInt(c.Param("product_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	warehouseID, err := strconv.ParseInt(c.Param("warehouse_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	level, err := h.inventoryService.GetInventoryLevel(c.Request.Context(), productID, warehouseID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inventory level not found"})
		return
	}

	c.JSON(http.StatusOK, level)
}

// GetProductInventory handles GET /api/products/:id/inventory
func (h *InventoryHandler) GetProductInventory(c *gin.Context) {
	productID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	inventory, err := h.inventoryService.GetProductInventoryAcrossWarehouses(c.Request.Context(), productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, inventory)
}

// GetWarehouseInventory handles GET /api/warehouses/:id/inventory
func (h *InventoryHandler) GetWarehouseInventory(c *gin.Context) {
	warehouseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	inventory, err := h.inventoryService.GetWarehouseInventory(c.Request.Context(), warehouseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, inventory)
}

// Warehouse Handlers

// CreateWarehouse handles POST /api/warehouses
func (h *InventoryHandler) CreateWarehouse(c *gin.Context) {
	var req models.CreateWarehouseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	warehouse, err := h.inventoryService.CreateWarehouse(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, warehouse)
}

// GetWarehouses handles GET /api/warehouses
func (h *InventoryHandler) GetWarehouses(c *gin.Context) {
	warehouses, err := h.inventoryService.GetWarehouses(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, warehouses)
}

// GetWarehouse handles GET /api/warehouses/:id
func (h *InventoryHandler) GetWarehouse(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	warehouse, err := h.inventoryService.GetWarehouseByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Warehouse not found"})
		return
	}

	c.JSON(http.StatusOK, warehouse)
}

// UpdateWarehouse handles PUT /api/warehouses/:id
func (h *InventoryHandler) UpdateWarehouse(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	var req models.UpdateWarehouseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	warehouse, err := h.inventoryService.UpdateWarehouse(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, warehouse)
}

// DeleteWarehouse handles DELETE /api/warehouses/:id
func (h *InventoryHandler) DeleteWarehouse(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	err = h.inventoryService.DeleteWarehouse(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}