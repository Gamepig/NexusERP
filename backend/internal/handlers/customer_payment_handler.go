package handlers

import (
	"net/http"
	"strconv"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type CustomerPaymentHandler struct {
	customerPaymentService services.CustomerPaymentService
}

// NewCustomerPaymentHandler creates a new customer payment handler instance
func NewCustomerPaymentHandler(customerPaymentService services.CustomerPaymentService) *CustomerPaymentHandler {
	return &CustomerPaymentHandler{
		customerPaymentService: customerPaymentService,
	}
}

// CreateCustomerPayment handles POST /api/payments/customer
func (h *CustomerPaymentHandler) CreateCustomerPayment(c *gin.Context) {
	var req models.CreateCustomerPaymentRequest
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

	userIDInt64, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	payment, err := h.customerPaymentService.CreateCustomerPayment(c.Request.Context(), &req, userIDInt64)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    payment,
	})
}

// GetCustomerPayments handles GET /api/payments/customer
func (h *CustomerPaymentHandler) GetCustomerPayments(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	status := c.Query("status")
	
	var customerID *int64
	if customerIDStr := c.Query("customer_id"); customerIDStr != "" {
		if id, err := strconv.ParseInt(customerIDStr, 10, 64); err == nil {
			customerID = &id
		}
	}

	payments, total, err := h.customerPaymentService.GetCustomerPayments(c.Request.Context(), page, limit, customerID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payments,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_pages": (total + limit - 1) / limit,
		},
	})
}

// GetCustomerPayment handles GET /api/payments/customer/:id
func (h *CustomerPaymentHandler) GetCustomerPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	payment, err := h.customerPaymentService.GetCustomerPayment(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "customer payment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payment,
	})
}

// UpdateCustomerPayment handles PUT /api/payments/customer/:id
func (h *CustomerPaymentHandler) UpdateCustomerPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	var req models.UpdateCustomerPaymentRequest
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

	userIDInt64, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	payment, err := h.customerPaymentService.UpdateCustomerPayment(c.Request.Context(), id, &req, userIDInt64)
	if err != nil {
		if err.Error() == "customer payment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payment,
	})
}

// DeleteCustomerPayment handles DELETE /api/payments/customer/:id
func (h *CustomerPaymentHandler) DeleteCustomerPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	err = h.customerPaymentService.DeleteCustomerPayment(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "customer payment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Customer payment deleted successfully",
	})
}

// ProcessCustomerPayment handles POST /api/payments/customer/:id/process
func (h *CustomerPaymentHandler) ProcessCustomerPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	var req models.ProcessCustomerPaymentRequest
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

	userIDInt64, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	payment, err := h.customerPaymentService.ProcessCustomerPayment(c.Request.Context(), id, &req, userIDInt64)
	if err != nil {
		if err.Error() == "customer payment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payment,
		"message": "Customer payment processed successfully",
	})
}

// CancelCustomerPayment handles POST /api/payments/customer/:id/cancel
func (h *CustomerPaymentHandler) CancelCustomerPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	var req models.CancelCustomerPaymentRequest
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

	userIDInt64, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	payment, err := h.customerPaymentService.CancelCustomerPayment(c.Request.Context(), id, &req, userIDInt64)
	if err != nil {
		if err.Error() == "customer payment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payment,
		"message": "Customer payment cancelled successfully",
	})
}

// ApplyCustomerPayment handles POST /api/payments/customer/:id/apply
func (h *CustomerPaymentHandler) ApplyCustomerPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	var req models.ApplyCustomerPaymentRequest
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

	userIDInt64, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	payment, err := h.customerPaymentService.ApplyCustomerPayment(c.Request.Context(), id, &req, userIDInt64)
	if err != nil {
		if err.Error() == "customer payment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer payment not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payment,
		"message": "Customer payment applied successfully",
	})
}

// GetOutstandingAccountsReceivable handles GET /api/customers/:id/outstanding-ar
func (h *CustomerPaymentHandler) GetOutstandingAccountsReceivable(c *gin.Context) {
	idStr := c.Param("id")
	customerID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	arRecords, err := h.customerPaymentService.GetOutstandingAccountsReceivable(c.Request.Context(), customerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    arRecords,
		"message": "Outstanding accounts receivable retrieved successfully",
	})
}

// GetCustomerPaymentAllocations handles GET /api/payments/customer/:id/allocations
func (h *CustomerPaymentHandler) GetCustomerPaymentAllocations(c *gin.Context) {
	idStr := c.Param("id")
	paymentID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	allocations, err := h.customerPaymentService.GetCustomerPaymentAllocations(c.Request.Context(), paymentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    allocations,
		"message": "Payment allocations retrieved successfully",
	})
}

// RemovePaymentAllocation handles DELETE /api/payments/customer/allocations/:id
func (h *CustomerPaymentHandler) RemovePaymentAllocation(c *gin.Context) {
	idStr := c.Param("id")
	allocationID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid allocation ID"})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDInt64, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	err = h.customerPaymentService.RemovePaymentAllocation(c.Request.Context(), allocationID, userIDInt64)
	if err != nil {
		if err.Error() == "payment allocation not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment allocation not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment allocation removed successfully",
	})
}