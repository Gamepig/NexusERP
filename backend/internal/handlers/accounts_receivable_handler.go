package handlers

import (
	"net/http"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AccountsReceivableHandler struct {
	arService       services.AccountsReceivableService
	customerService *services.CustomerService
}

// NewAccountsReceivableHandler creates a new accounts receivable handler
func NewAccountsReceivableHandler(arService services.AccountsReceivableService, customerService *services.CustomerService) *AccountsReceivableHandler {
	return &AccountsReceivableHandler{
		arService:       arService,
		customerService: customerService,
	}
}

// GetAccountsReceivable handles GET /api/accounts-receivable
func (h *AccountsReceivableHandler) GetAccountsReceivable(c *gin.Context) {
	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Parse filter parameters
	var customerID *int64
	if customerIDStr := c.Query("customer_id"); customerIDStr != "" {
		if id, err := strconv.ParseInt(customerIDStr, 10, 64); err == nil {
			customerID = &id
		}
	}

	status := c.Query("status")
	
	var startDate, endDate *string
	if startDateStr := c.Query("start_date"); startDateStr != "" {
		startDate = &startDateStr
	}
	if endDateStr := c.Query("end_date"); endDateStr != "" {
		endDate = &endDateStr
	}

	// Get AR records
	arRecords, total, err := h.arService.GetAccountsReceivable(c.Request.Context(), page, limit, customerID, status, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve accounts receivable",
			"details": err.Error(),
		})
		return
	}

	// Calculate pagination info
	totalPages := (total + limit - 1) / limit
	hasNext := page < totalPages
	hasPrev := page > 1

	c.JSON(http.StatusOK, gin.H{
		"data": arRecords,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": totalPages,
			"has_next":    hasNext,
			"has_prev":    hasPrev,
		},
		"filters": gin.H{
			"customer_id": customerID,
			"status":      status,
			"start_date":  startDate,
			"end_date":    endDate,
		},
	})
}

// GetAccountsReceivableByID handles GET /api/accounts-receivable/:id
func (h *AccountsReceivableHandler) GetAccountsReceivableByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid accounts receivable ID",
		})
		return
	}

	arRecord, err := h.arService.GetAccountsReceivableByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "AR record with ID "+idStr+" not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Accounts receivable record not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve accounts receivable record",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": arRecord,
	})
}

// GetCustomerBalance handles GET /api/customers/:id/balance
func (h *AccountsReceivableHandler) GetCustomerBalance(c *gin.Context) {
	idStr := c.Param("id")
	customerID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid customer ID",
		})
		return
	}

	// Check if detailed balance is requested
	detailed := c.Query("detailed") == "true"

	if detailed {
		// Return detailed balance information
		balance, err := h.arService.GetCustomerBalance(c.Request.Context(), customerID)
		if err != nil {
			if err.Error() == "customer with ID "+idStr+" not found" {
				c.JSON(http.StatusNotFound, gin.H{
					"error": "Customer not found",
				})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to retrieve customer balance",
				"details": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": balance,
		})
	} else {
		// Return simplified balance summary
		summary, err := h.arService.GetCustomerBalanceSummary(c.Request.Context(), customerID)
		if err != nil {
			if err.Error() == "customer with ID "+idStr+" not found" {
				c.JSON(http.StatusNotFound, gin.H{
					"error": "Customer not found",
				})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to retrieve customer balance summary",
				"details": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": summary,
		})
	}
}

// GetARAgingReport handles GET /api/accounts-receivable/aging-report
func (h *AccountsReceivableHandler) GetARAgingReport(c *gin.Context) {
	var customerID *int64
	if customerIDStr := c.Query("customer_id"); customerIDStr != "" {
		if id, err := strconv.ParseInt(customerIDStr, 10, 64); err == nil {
			customerID = &id
		}
	}

	report, err := h.arService.GetARAgingReport(c.Request.Context(), customerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to generate AR aging report",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": report,
	})
}

// UpdateAgingBuckets handles POST /api/accounts-receivable/update-aging
func (h *AccountsReceivableHandler) UpdateAgingBuckets(c *gin.Context) {
	err := h.arService.UpdateAgingBuckets(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update aging buckets",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Aging buckets updated successfully",
	})
}

// GetOutstandingAccountsReceivable handles GET /api/customers/:id/outstanding-ar
// This endpoint is used by payment application functionality
func (h *AccountsReceivableHandler) GetOutstandingAccountsReceivable(c *gin.Context) {
	idStr := c.Param("id")
	customerID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid customer ID",
		})
		return
	}

	// Use the AR service to get outstanding AR records
	// Note: We'll use status filter for outstanding records - need to call multiple times for different statuses
	var allRecords []models.AccountsReceivableWithDetails
	
	// Get open records
	openRecords, _, err := h.arService.GetAccountsReceivable(c.Request.Context(), 1, 1000, &customerID, "open", nil, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve outstanding accounts receivable",
			"details": err.Error(),
		})
		return
	}
	allRecords = append(allRecords, openRecords...)
	
	// Get partially paid records
	partialRecords, _, err := h.arService.GetAccountsReceivable(c.Request.Context(), 1, 1000, &customerID, "partially_paid", nil, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve outstanding accounts receivable",
			"details": err.Error(),
		})
		return
	}
	allRecords = append(allRecords, partialRecords...)
	
	// Get overdue records
	overdueRecords, _, err := h.arService.GetAccountsReceivable(c.Request.Context(), 1, 1000, &customerID, "overdue", nil, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve outstanding accounts receivable",
			"details": err.Error(),
		})
		return
	}
	allRecords = append(allRecords, overdueRecords...)

	// Filter only records with balance due > 0
	var outstandingRecords []interface{}
	for _, ar := range allRecords {
		if ar.BalanceDue > 0 {
			outstandingRecords = append(outstandingRecords, ar)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": outstandingRecords,
	})
}