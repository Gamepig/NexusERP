package handlers

import (
	"net/http"
	"strconv"

	"nexus-erp/backend/internal/middleware"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type CustomerHandler struct {
	customerService *services.CustomerService
}

func NewCustomerHandler(customerService *services.CustomerService) *CustomerHandler {
	return &CustomerHandler{
		customerService: customerService,
	}
}

// CreateCustomer creates a new customer
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {
	var req models.CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
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

	userIDInt64, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// Get company ID from context
	companyID := middleware.GetCompanyIDFromContext(c)

	customer, err := h.customerService.CreateCustomer(&req, userIDInt64, companyID)
	if err != nil {
		if err.Error() == "customer with this code already exists" {
			c.JSON(http.StatusConflict, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create customer",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Customer created successfully",
		"customer": customer,
	})
}

// GetCustomer retrieves a customer by ID
func (h *CustomerHandler) GetCustomer(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid customer ID",
		})
		return
	}

	// Get company ID from context
	companyID := middleware.GetCompanyIDFromContext(c)

	customer, err := h.customerService.GetCustomer(id, companyID)
	if err != nil {
		if err.Error() == "customer not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get customer",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customer": customer,
	})
}

// GetCustomers retrieves a paginated list of customers
func (h *CustomerHandler) GetCustomers(c *gin.Context) {
	var params models.CustomerQueryParams

	// Bind query parameters
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid query parameters",
			"details": err.Error(),
		})
		return
	}

	// Set default values if not provided
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.PageSize > 100 {
		params.PageSize = 100 // Limit maximum page size
	}
	if params.SortBy == "" {
		params.SortBy = "created_at"
	}
	if params.SortOrder == "" {
		params.SortOrder = "desc"
	}

	// Validate sort order
	if params.SortOrder != "asc" && params.SortOrder != "desc" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sort order. Must be 'asc' or 'desc'",
		})
		return
	}

	// Get company ID from context
	companyID := middleware.GetCompanyIDFromContext(c)

	response, err := h.customerService.GetCustomers(&params, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get customers",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UpdateCustomer updates an existing customer
func (h *CustomerHandler) UpdateCustomer(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid customer ID",
		})
		return
	}

	var req models.UpdateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get company ID from context
	companyID := middleware.GetCompanyIDFromContext(c)

	customer, err := h.customerService.UpdateCustomer(id, &req, companyID)
	if err != nil {
		if err.Error() == "customer not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		if err.Error() == "no fields to update" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update customer",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Customer updated successfully",
		"customer": customer,
	})
}

// DeleteCustomer soft deletes a customer
func (h *CustomerHandler) DeleteCustomer(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid customer ID",
		})
		return
	}

	// Get company ID from context
	companyID := middleware.GetCompanyIDFromContext(c)

	err = h.customerService.DeleteCustomer(id, companyID)
	if err != nil {
		if err.Error() == "customer not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete customer",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Customer deleted successfully",
	})
}

// CreateCustomerContact creates a new customer contact
func (h *CustomerHandler) CreateCustomerContact(c *gin.Context) {
	var req models.CreateCustomerContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get company ID from context
	companyID := middleware.GetCompanyIDFromContext(c)

	contact, err := h.customerService.CreateCustomerContact(&req, companyID)
	if err != nil {
		if err.Error() == "customer not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create customer contact",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Customer contact created successfully",
		"contact": contact,
	})
}

// CreateCustomerActivity creates a new customer activity
func (h *CustomerHandler) CreateCustomerActivity(c *gin.Context) {
	var req models.CreateCustomerActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
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

	userIDInt64, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// Get company ID from context
	companyID := middleware.GetCompanyIDFromContext(c)

	activity, err := h.customerService.CreateCustomerActivity(&req, userIDInt64, companyID)
	if err != nil {
		if err.Error() == "customer not found" || err.Error() == "contact not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create customer activity",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Customer activity created successfully",
		"activity": activity,
	})
}

// UpdateCreditLimit updates a customer's credit limit
func (h *CustomerHandler) UpdateCreditLimit(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid customer ID",
		})
		return
	}

	var req struct {
		NewLimit float64 `json:"new_limit" binding:"required,min=0"`
		Reason   string  `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
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

	userIDInt64, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// Get company ID from context
	companyID := middleware.GetCompanyIDFromContext(c)

	err = h.customerService.UpdateCreditLimit(id, req.NewLimit, req.Reason, userIDInt64, companyID)
	if err != nil {
		if err.Error() == "customer not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update credit limit",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Credit limit updated successfully",
	})
}

// GenerateCustomerCode generates a unique customer code
func (h *CustomerHandler) GenerateCustomerCode(c *gin.Context) {
	// Get company ID from context
	companyID := middleware.GetCompanyIDFromContext(c)

	code, err := h.customerService.GenerateCustomerCode(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate customer code",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customer_code": code,
	})
}

// ValidateCustomerCode validates a customer code
func (h *CustomerHandler) ValidateCustomerCode(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Customer code is required",
		})
		return
	}

	// Get company ID from context
	companyID := middleware.GetCompanyIDFromContext(c)

	err := h.customerService.ValidateCustomerCode(code, companyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
			"valid": false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Customer code is valid",
		"valid": true,
	})
}

// GetCustomerTypes returns available customer types
func (h *CustomerHandler) GetCustomerTypes(c *gin.Context) {
	types := map[string]string{
		models.CustomerTypeIndividual:   "Individual",
		models.CustomerTypeBusiness:     "Business",
		models.CustomerTypeOrganization: "Organization",
	}

	c.JSON(http.StatusOK, gin.H{
		"customer_types": types,
	})
}

// GetCustomerSegments returns available customer segments
func (h *CustomerHandler) GetCustomerSegments(c *gin.Context) {
	segments := map[string]string{
		models.CustomerSegmentPremium:  "Premium",
		models.CustomerSegmentStandard: "Standard",
		models.CustomerSegmentBudget:   "Budget",
		models.CustomerSegmentVIP:      "VIP",
	}

	c.JSON(http.StatusOK, gin.H{
		"customer_segments": segments,
	})
}

// GetCustomerStatuses returns available customer statuses
func (h *CustomerHandler) GetCustomerStatuses(c *gin.Context) {
	statuses := map[string]string{
		models.CustomerStatusActive:      "Active",
		models.CustomerStatusInactive:    "Inactive",
		models.CustomerStatusBlacklisted: "Blacklisted",
	}

	c.JSON(http.StatusOK, gin.H{
		"customer_statuses": statuses,
	})
}

// GetContactTypes returns available contact types
func (h *CustomerHandler) GetContactTypes(c *gin.Context) {
	types := map[string]string{
		models.ContactTypePrimary:   "Primary",
		models.ContactTypeBilling:   "Billing",
		models.ContactTypeShipping:  "Shipping",
		models.ContactTypeTechnical: "Technical",
		models.ContactTypeSales:     "Sales",
		models.ContactTypeSupport:   "Support",
		models.ContactTypeGeneral:   "General",
	}

	c.JSON(http.StatusOK, gin.H{
		"contact_types": types,
	})
}

// GetActivityTypes returns available activity types
func (h *CustomerHandler) GetActivityTypes(c *gin.Context) {
	types := map[string]string{
		models.ActivityTypeCall:      "Call",
		models.ActivityTypeEmail:     "Email",
		models.ActivityTypeMeeting:   "Meeting",
		models.ActivityTypeQuote:     "Quote",
		models.ActivityTypeOrder:     "Order",
		models.ActivityTypePayment:   "Payment",
		models.ActivityTypeComplaint: "Complaint",
		models.ActivityTypeSupport:   "Support",
		models.ActivityTypeNote:      "Note",
	}

	c.JSON(http.StatusOK, gin.H{
		"activity_types": types,
	})
}