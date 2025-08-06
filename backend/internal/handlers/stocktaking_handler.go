package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
)

type StocktakingHandler struct {
	stocktakingService services.StocktakingService
}

func NewStocktakingHandler(stocktakingService services.StocktakingService) *StocktakingHandler {
	return &StocktakingHandler{
		stocktakingService: stocktakingService,
	}
}

// CreateStocktakingOrder creates a new stocktaking order
func (h *StocktakingHandler) CreateStocktakingOrder(c *gin.Context) {
	var req models.CreateStocktakingOrderRequest
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

	order, err := h.stocktakingService.CreateStocktakingOrder(c.Request.Context(), &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, order)
}

// GetStocktakingOrders retrieves stocktaking orders with optional filtering
func (h *StocktakingHandler) GetStocktakingOrders(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	
	var warehouseID *int64
	if warehouseIDStr := c.Query("warehouse_id"); warehouseIDStr != "" {
		if id, err := strconv.ParseInt(warehouseIDStr, 10, 64); err == nil {
			warehouseID = &id
		}
	}

	status := c.Query("status")

	orders, total, err := h.stocktakingService.GetStocktakingOrders(c.Request.Context(), limit, offset, warehouseID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  orders,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}

// GetStocktakingOrderByID retrieves a specific stocktaking order
func (h *StocktakingHandler) GetStocktakingOrderByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	order, err := h.stocktakingService.GetStocktakingOrderByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// UpdateStocktakingOrder updates a stocktaking order
func (h *StocktakingHandler) UpdateStocktakingOrder(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req models.UpdateStocktakingOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order, err := h.stocktakingService.UpdateStocktakingOrder(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// StartStocktakingOrder starts a stocktaking order
func (h *StocktakingHandler) StartStocktakingOrder(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req models.StartStocktakingOrderRequest
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

	order, err := h.stocktakingService.StartStocktakingOrder(c.Request.Context(), id, &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// ProcessStocktakingOrder processes multiple stocktaking items
func (h *StocktakingHandler) ProcessStocktakingOrder(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req models.ProcessStocktakingOrderRequest
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

	order, err := h.stocktakingService.ProcessStocktakingOrder(c.Request.Context(), id, &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// FinalizeStocktakingOrder finalizes a stocktaking order and creates inventory adjustments
func (h *StocktakingHandler) FinalizeStocktakingOrder(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req models.FinalizeStocktakingOrderRequest
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

	order, err := h.stocktakingService.FinalizeStocktakingOrder(c.Request.Context(), id, &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// ApproveStocktakingOrder approves a stocktaking order
func (h *StocktakingHandler) ApproveStocktakingOrder(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req models.ApproveStocktakingOrderRequest
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

	order, err := h.stocktakingService.ApproveStocktakingOrder(c.Request.Context(), id, &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// DeleteStocktakingOrder deletes a stocktaking order
func (h *StocktakingHandler) DeleteStocktakingOrder(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	err = h.stocktakingService.DeleteStocktakingOrder(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stocktaking order deleted successfully"})
}

// GetStocktakingItems retrieves items for a stocktaking order
func (h *StocktakingHandler) GetStocktakingItems(c *gin.Context) {
	orderID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	items, err := h.stocktakingService.GetStocktakingItems(c.Request.Context(), orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

// CountStocktakingItem records the counted quantity for a stocktaking item
func (h *StocktakingHandler) CountStocktakingItem(c *gin.Context) {
	orderID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	productID, err := strconv.ParseInt(c.Param("product_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req models.CountStocktakingItemRequest
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

	item, err := h.stocktakingService.CountStocktakingItem(c.Request.Context(), orderID, productID, &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

// Safety Stock Management

// CreateProductSafetyStock creates safety stock configuration
func (h *StocktakingHandler) CreateProductSafetyStock(c *gin.Context) {
	var req models.CreateProductSafetyStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	safetyStock, err := h.stocktakingService.CreateProductSafetyStock(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, safetyStock)
}

// GetProductSafetyStocks retrieves safety stock configurations
func (h *StocktakingHandler) GetProductSafetyStocks(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var productID, warehouseID *int64
	if productIDStr := c.Query("product_id"); productIDStr != "" {
		if id, err := strconv.ParseInt(productIDStr, 10, 64); err == nil {
			productID = &id
		}
	}
	if warehouseIDStr := c.Query("warehouse_id"); warehouseIDStr != "" {
		if id, err := strconv.ParseInt(warehouseIDStr, 10, 64); err == nil {
			warehouseID = &id
		}
	}

	safetyStocks, total, err := h.stocktakingService.GetProductSafetyStocks(c.Request.Context(), limit, offset, productID, warehouseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  safetyStocks,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}

// GetProductSafetyStockByID retrieves a specific safety stock configuration
func (h *StocktakingHandler) GetProductSafetyStockByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid safety stock ID"})
		return
	}

	safetyStock, err := h.stocktakingService.GetProductSafetyStockByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, safetyStock)
}

// UpdateProductSafetyStock updates safety stock configuration
func (h *StocktakingHandler) UpdateProductSafetyStock(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid safety stock ID"})
		return
	}

	var req models.UpdateProductSafetyStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	safetyStock, err := h.stocktakingService.UpdateProductSafetyStock(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, safetyStock)
}

// DeleteProductSafetyStock deletes safety stock configuration
func (h *StocktakingHandler) DeleteProductSafetyStock(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid safety stock ID"})
		return
	}

	err = h.stocktakingService.DeleteProductSafetyStock(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Safety stock configuration deleted successfully"})
}

// Inventory Alerts

// GetInventoryAlerts retrieves inventory alerts
func (h *StocktakingHandler) GetInventoryAlerts(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	status := c.DefaultQuery("status", "ACTIVE")

	var alertTypeID, productID, warehouseID *int64
	if alertTypeIDStr := c.Query("alert_type_id"); alertTypeIDStr != "" {
		if id, err := strconv.ParseInt(alertTypeIDStr, 10, 64); err == nil {
			alertTypeID = &id
		}
	}
	if productIDStr := c.Query("product_id"); productIDStr != "" {
		if id, err := strconv.ParseInt(productIDStr, 10, 64); err == nil {
			productID = &id
		}
	}
	if warehouseIDStr := c.Query("warehouse_id"); warehouseIDStr != "" {
		if id, err := strconv.ParseInt(warehouseIDStr, 10, 64); err == nil {
			warehouseID = &id
		}
	}

	alerts, total, err := h.stocktakingService.GetInventoryAlerts(c.Request.Context(), limit, offset, status, alertTypeID, productID, warehouseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  alerts,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}

// GetInventoryAlertByID retrieves a specific inventory alert
func (h *StocktakingHandler) GetInventoryAlertByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	alert, err := h.stocktakingService.GetInventoryAlertByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, alert)
}

// ResolveInventoryAlert resolves an inventory alert
func (h *StocktakingHandler) ResolveInventoryAlert(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	var req models.ResolveInventoryAlertRequest
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

	alert, err := h.stocktakingService.ResolveInventoryAlert(c.Request.Context(), id, &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, alert)
}

// DismissInventoryAlert dismisses an inventory alert
func (h *StocktakingHandler) DismissInventoryAlert(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	var req models.DismissInventoryAlertRequest
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

	alert, err := h.stocktakingService.DismissInventoryAlert(c.Request.Context(), id, &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, alert)
}

// CheckInventoryLevels manually triggers inventory level checking
func (h *StocktakingHandler) CheckInventoryLevels(c *gin.Context) {
	err := h.stocktakingService.CheckInventoryLevels(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Inventory levels checked successfully"})
}

// Reports

// GetStocktakingReport generates stocktaking report
func (h *StocktakingHandler) GetStocktakingReport(c *gin.Context) {
	var req models.StocktakingReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, err := h.stocktakingService.GetStocktakingReport(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

// GetInventoryAlertReport generates inventory alert report
func (h *StocktakingHandler) GetInventoryAlertReport(c *gin.Context) {
	var req models.InventoryAlertReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, err := h.stocktakingService.GetInventoryAlertReport(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}