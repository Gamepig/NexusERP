package handlers

import (
	"net/http"
	"strconv"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type AccountsPayableHandler struct {
	invoiceService         services.InvoiceService
	accountsPayableService services.AccountsPayableService
	paymentService         services.PaymentService
}

func NewAccountsPayableHandler(
	invoiceService services.InvoiceService,
	accountsPayableService services.AccountsPayableService,
	paymentService services.PaymentService,
) *AccountsPayableHandler {
	return &AccountsPayableHandler{
		invoiceService:         invoiceService,
		accountsPayableService: accountsPayableService,
		paymentService:         paymentService,
	}
}

// Invoice Handlers

// CreateInvoice creates a new supplier invoice
func (h *AccountsPayableHandler) CreateInvoice(c *gin.Context) {
	var req models.CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	invoice, err := h.invoiceService.CreateInvoice(c.Request.Context(), &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create invoice",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Invoice created successfully",
		"data":    invoice,
	})
}

// GetInvoices retrieves invoices with filtering and pagination
func (h *AccountsPayableHandler) GetInvoices(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	status := c.Query("status")
	
	var supplierID *int64
	if supplierIDStr := c.Query("supplier_id"); supplierIDStr != "" {
		if id, err := strconv.ParseInt(supplierIDStr, 10, 64); err == nil {
			supplierID = &id
		}
	}

	invoices, total, err := h.invoiceService.GetInvoices(c.Request.Context(), page, limit, search, status, supplierID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get invoices",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": invoices,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetInvoice retrieves a single invoice by ID
func (h *AccountsPayableHandler) GetInvoice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	invoice, err := h.invoiceService.GetInvoice(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "invoice not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get invoice",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": invoice})
}

// UpdateInvoice updates an existing invoice
func (h *AccountsPayableHandler) UpdateInvoice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	var req models.UpdateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	invoice, err := h.invoiceService.UpdateInvoice(c.Request.Context(), id, &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update invoice",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Invoice updated successfully",
		"data":    invoice,
	})
}

// ApproveInvoice approves an invoice
func (h *AccountsPayableHandler) ApproveInvoice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	var req models.ApproveInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	invoice, err := h.invoiceService.ApproveInvoice(c.Request.Context(), id, &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to approve invoice",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Invoice approved successfully",
		"data":    invoice,
	})
}

// GenerateInvoiceFromPO generates an invoice from a purchase order
func (h *AccountsPayableHandler) GenerateInvoiceFromPO(c *gin.Context) {
	poIDStr := c.Param("po_id")
	poID, err := strconv.ParseInt(poIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid purchase order ID"})
		return
	}

	var req models.GenerateInvoiceFromPORequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	invoice, err := h.invoiceService.GenerateInvoiceFromPO(c.Request.Context(), poID, &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to generate invoice from purchase order",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Invoice generated successfully",
		"data":    invoice,
	})
}

// GetCurrencies retrieves all active currencies
func (h *AccountsPayableHandler) GetCurrencies(c *gin.Context) {
	currencies, err := h.invoiceService.GetCurrencies(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get currencies",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": currencies})
}

// Accounts Payable Handlers

// GetAccountsPayable retrieves accounts payable records with filtering and pagination
func (h *AccountsPayableHandler) GetAccountsPayable(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	
	var supplierID *int64
	if supplierIDStr := c.Query("supplier_id"); supplierIDStr != "" {
		if id, err := strconv.ParseInt(supplierIDStr, 10, 64); err == nil {
			supplierID = &id
		}
	}

	apRecords, total, err := h.accountsPayableService.GetAccountsPayable(c.Request.Context(), page, limit, supplierID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get accounts payable",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": apRecords,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetAccountsPayableByID retrieves a single accounts payable record by ID
func (h *AccountsPayableHandler) GetAccountsPayableByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid accounts payable ID"})
		return
	}

	apRecord, err := h.accountsPayableService.GetAccountsPayableByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "accounts payable record not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Accounts payable record not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get accounts payable record",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": apRecord})
}

// GetAPAgingReport generates accounts payable aging report
func (h *AccountsPayableHandler) GetAPAgingReport(c *gin.Context) {
	report, err := h.accountsPayableService.GetAPAgingReport(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to generate AP aging report",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": report})
}

// Payment Handlers

// CreatePayment creates a new payment
func (h *AccountsPayableHandler) CreatePayment(c *gin.Context) {
	var req models.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	payment, err := h.paymentService.CreatePayment(c.Request.Context(), &req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create payment",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Payment created successfully",
		"data":    payment,
	})
}

// GetPayments retrieves payments with filtering and pagination
func (h *AccountsPayableHandler) GetPayments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	
	var supplierID *int64
	if supplierIDStr := c.Query("supplier_id"); supplierIDStr != "" {
		if id, err := strconv.ParseInt(supplierIDStr, 10, 64); err == nil {
			supplierID = &id
		}
	}

	payments, total, err := h.paymentService.GetPayments(c.Request.Context(), page, limit, supplierID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get payments",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": payments,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetPayment retrieves a single payment by ID
func (h *AccountsPayableHandler) GetPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	payment, err := h.paymentService.GetPayment(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "payment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get payment",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": payment})
}

// ProcessPayment processes a payment
func (h *AccountsPayableHandler) ProcessPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	payment, err := h.paymentService.ProcessPayment(c.Request.Context(), id, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to process payment",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment processed successfully",
		"data":    payment,
	})
}

// CancelPayment cancels a payment
func (h *AccountsPayableHandler) CancelPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	payment, err := h.paymentService.CancelPayment(c.Request.Context(), id, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to cancel payment",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment cancelled successfully",
		"data":    payment,
	})
}