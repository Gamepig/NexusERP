package handlers

import (
	"net/http"
	"strconv"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type QuoteHandler struct {
	quoteService *services.QuoteService
}

func NewQuoteHandler(quoteService *services.QuoteService) *QuoteHandler {
	return &QuoteHandler{
		quoteService: quoteService,
	}
}

// CreateQuote creates a new quote
func (h *QuoteHandler) CreateQuote(c *gin.Context) {
	var req models.CreateQuoteRequest
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

	quote, err := h.quoteService.CreateQuote(&req, userIDInt)
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
			if len(err.Error()) > 7 && err.Error()[:7] == "product" {
				c.JSON(http.StatusNotFound, gin.H{
					"error": err.Error(),
				})
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create quote",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Quote created successfully",
		"quote":   quote,
	})
}

// GetQuote retrieves a quote by ID
func (h *QuoteHandler) GetQuote(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid quote ID",
		})
		return
	}

	quote, err := h.quoteService.GetQuoteByID(id)
	if err != nil {
		if err.Error() == "quote not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get quote",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"quote": quote,
	})
}

// UpdateQuote updates a quote
func (h *QuoteHandler) UpdateQuote(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid quote ID",
		})
		return
	}

	var req models.UpdateQuoteRequest
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

	quote, err := h.quoteService.UpdateQuote(id, &req, userIDInt)
	if err != nil {
		switch err.Error() {
		case "quote not found":
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		case "cannot update converted quote":
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
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
			if len(err.Error()) > 7 && err.Error()[:7] == "product" {
				c.JSON(http.StatusNotFound, gin.H{
					"error": err.Error(),
				})
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update quote",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Quote updated successfully",
		"quote":   quote,
	})
}

// DeleteQuote deletes a quote
func (h *QuoteHandler) DeleteQuote(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid quote ID",
		})
		return
	}

	err = h.quoteService.DeleteQuote(id)
	if err != nil {
		switch err.Error() {
		case "quote not found":
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		case "cannot delete converted quote":
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete quote",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Quote deleted successfully",
	})
}

// ListQuotes retrieves a paginated list of quotes
func (h *QuoteHandler) ListQuotes(c *gin.Context) {
	var params models.QuoteQueryParams
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

	result, err := h.quoteService.ListQuotes(&params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to list quotes",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// ConvertQuoteToSalesOrder converts a quote to a sales order
func (h *QuoteHandler) ConvertQuoteToSalesOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid quote ID",
		})
		return
	}

	var req models.ConvertQuoteRequest
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

	response, err := h.quoteService.ConvertQuoteToSalesOrder(id, &req, userIDInt)
	if err != nil {
		if err.Error() == "failed to get quote: quote not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "quote not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to convert quote to sales order",
			"details": err.Error(),
		})
		return
	}

	if !response.Success {
		c.JSON(http.StatusBadRequest, response)
		return
	}

	c.JSON(http.StatusOK, response)
}

// ApproveQuote approves a quote (helper endpoint)
func (h *QuoteHandler) ApproveQuote(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid quote ID",
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

	status := models.QuoteStatusApproved
	req := &models.UpdateQuoteRequest{
		Status: &status,
	}

	quote, err := h.quoteService.UpdateQuote(id, req, userIDInt)
	if err != nil {
		switch err.Error() {
		case "quote not found":
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		case "cannot update converted quote":
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to approve quote",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Quote approved successfully",
		"quote":   quote,
	})
}

// RejectQuote rejects a quote (helper endpoint)
func (h *QuoteHandler) RejectQuote(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid quote ID",
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

	status := models.QuoteStatusRejected
	req := &models.UpdateQuoteRequest{
		Status: &status,
	}

	quote, err := h.quoteService.UpdateQuote(id, req, userIDInt)
	if err != nil {
		switch err.Error() {
		case "quote not found":
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		case "cannot update converted quote":
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to reject quote",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Quote rejected successfully",
		"quote":   quote,
	})
}