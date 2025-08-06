package handlers

import (
	"net/http"
	"strconv"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type SalesOrderHandler struct {
	salesOrderService *services.SalesOrderService
}

func NewSalesOrderHandler(salesOrderService *services.SalesOrderService) *SalesOrderHandler {
	return &SalesOrderHandler{
		salesOrderService: salesOrderService,
	}
}

// CreateSalesOrder creates a new sales order
func (h *SalesOrderHandler) CreateSalesOrder(c *gin.Context) {
	var req models.CreateSalesOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user ID format",
		})
		return
	}

	salesOrder, err := h.salesOrderService.CreateSalesOrder(&req, userIDInt)
	if err != nil {
		switch err.Error() {
		case "customer not found":
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		case "business unit not found":
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		case "currency not found or inactive":
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		default:
			if err.Error()[:7] == "product" {
				c.JSON(http.StatusNotFound, gin.H{
					"error": err.Error(),
				})
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create sales order",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Sales order created successfully",
		"sales_order": salesOrder,
	})
}

// GetSalesOrder retrieves a sales order by ID
func (h *SalesOrderHandler) GetSalesOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sales order ID",
		})
		return
	}

	salesOrder, err := h.salesOrderService.GetSalesOrderByID(id)
	if err != nil {
		if err.Error() == "sales order not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get sales order",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sales_order": salesOrder,
	})
}

// ListSalesOrders retrieves a paginated list of sales orders
func (h *SalesOrderHandler) ListSalesOrders(c *gin.Context) {
	var params models.SalesOrderQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid query parameters",
			"details": err.Error(),
		})
		return
	}

	// Set defaults if not provided
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.PageSize > 100 {
		params.PageSize = 100 // Max page size limit
	}
	if params.SortBy == "" {
		params.SortBy = "created_at"
	}
	if params.SortOrder == "" {
		params.SortOrder = "desc"
	}

	result, err := h.salesOrderService.ListSalesOrders(&params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get sales orders",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// UpdateSalesOrderStatus updates the status of a sales order
func (h *SalesOrderHandler) UpdateSalesOrderStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sales order ID",
		})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user ID format",
		})
		return
	}

	err = h.salesOrderService.UpdateSalesOrderStatus(id, req.Status, userIDInt)
	if err != nil {
		if err.Error() == "sales order not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		if err.Error() == "invalid sales order status" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update sales order status",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sales order status updated successfully",
	})
}

// ShipSalesOrder processes the shipping of a sales order
func (h *SalesOrderHandler) ShipSalesOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sales order ID",
		})
		return
	}

	var req models.ShipSalesOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user ID format",
		})
		return
	}

	err = h.salesOrderService.ShipSalesOrder(id, &req, userIDInt)
	if err != nil {
		if err.Error() == "sales order not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		if err.Error()[:10] == "cannot ship" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}
		if err.Error()[:11] == "sales order" && err.Error()[len(err.Error())-9:] == "not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to ship sales order",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sales order shipped successfully",
	})
}

// DeleteSalesOrder deletes a sales order (soft delete)
func (h *SalesOrderHandler) DeleteSalesOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sales order ID",
		})
		return
	}

	// For now, we'll just mark it as cancelled
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user ID format",
		})
		return
	}

	err = h.salesOrderService.UpdateSalesOrderStatus(id, models.SalesOrderStatusCancelled, userIDInt)
	if err != nil {
		if err.Error() == "sales order not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete sales order",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sales order deleted successfully",
	})
}