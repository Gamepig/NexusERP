package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"nexus-erp/backend/internal/services"
)

// ShipmentHandler handles shipment and tracking related requests
type ShipmentHandler struct {
	trackingService *services.ShipmentTrackingService
	// Add database service for shipment CRUD operations
	// shipmentService *services.ShipmentService
}

// NewShipmentHandler creates a new shipment handler
func NewShipmentHandler(trackingService *services.ShipmentTrackingService) *ShipmentHandler {
	return &ShipmentHandler{
		trackingService: trackingService,
	}
}

// TrackShipmentRequest represents a single tracking request
type TrackShipmentRequest struct {
	TrackingNumber string `json:"tracking_number" binding:"required"`
}

// BatchTrackingRequest represents a batch tracking request
type BatchTrackingRequest struct {
	TrackingNumbers []string `json:"tracking_numbers" binding:"required,min=1"`
}

// ShipmentQueryParams represents query parameters for shipment listing
type ShipmentQueryParams struct {
	SalesOrderID *int64 `form:"sales_order_id"`
	CustomerID   *int64 `form:"customer_id"`
	Status       string `form:"status"`
	Carrier      string `form:"carrier"`
	DateFrom     string `form:"date_from"` // YYYY-MM-DD format
	DateTo       string `form:"date_to"`   // YYYY-MM-DD format
	Page         int    `form:"page,default=1"`
	PageSize     int    `form:"page_size,default=20"`
	SortBy       string `form:"sort_by,default=created_at"`
	SortOrder    string `form:"sort_order,default=desc"`
}

// TrackSingleShipment godoc
// @Summary Track a single shipment
// @Description Get tracking information for a specific tracking number
// @Tags shipments
// @Accept json
// @Produce json
// @Param tracking_number path string true "Tracking Number"
// @Success 200 {object} services.TrackingInfo
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/shipments/track/{tracking_number} [get]
func (h *ShipmentHandler) TrackSingleShipment(c *gin.Context) {
	trackingNumber := strings.TrimSpace(c.Param("tracking_number"))
	if trackingNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "tracking number is required",
		})
		return
	}

	trackingInfo, err := h.trackingService.TrackShipment(trackingNumber)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to track shipment",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, trackingInfo)
}

// TrackMultipleShipments godoc
// @Summary Track multiple shipments in batch
// @Description Get tracking information for multiple tracking numbers
// @Tags shipments
// @Accept json
// @Produce json
// @Param request body BatchTrackingRequest true "Batch Tracking Request"
// @Success 200 {object} map[string]services.TrackingInfo
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/shipments/track/batch [post]
func (h *ShipmentHandler) TrackMultipleShipments(c *gin.Context) {
	var req BatchTrackingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request",
			"message": err.Error(),
		})
		return
	}

	// Limit batch size to prevent abuse
	if len(req.TrackingNumbers) > 50 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "too many tracking numbers",
			"message": "maximum 50 tracking numbers allowed per batch",
		})
		return
	}

	results, err := h.trackingService.TrackMultipleShipments(req.TrackingNumbers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to track shipments",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, results)
}

// GetShipments godoc
// @Summary Get shipments list
// @Description Get list of shipments with optional filtering
// @Tags shipments
// @Accept json
// @Produce json
// @Param sales_order_id query int false "Sales Order ID"
// @Param customer_id query int false "Customer ID"
// @Param status query string false "Shipment Status"
// @Param carrier query string false "Carrier Name"
// @Param date_from query string false "Date From (YYYY-MM-DD)"
// @Param date_to query string false "Date To (YYYY-MM-DD)"
// @Param page query int false "Page Number" default(1)
// @Param page_size query int false "Page Size" default(20)
// @Param sort_by query string false "Sort By" default(created_at)
// @Param sort_order query string false "Sort Order" default(desc)
// @Success 200 {object} ShipmentListResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/shipments [get]
func (h *ShipmentHandler) GetShipments(c *gin.Context) {
	var params ShipmentQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid query parameters",
			"message": err.Error(),
		})
		return
	}

	// For demo purposes, return mock data
	// In a real implementation, this would query the database
	mockShipments := h.getMockShipments(params)
	
	response := ShipmentListResponse{
		Shipments: mockShipments,
		Total:     int64(len(mockShipments)),
		Page:      params.Page,
		PageSize:  params.PageSize,
		Pages:     (len(mockShipments) + params.PageSize - 1) / params.PageSize,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateShipmentTracking godoc
// @Summary Update shipment tracking status
// @Description Refresh tracking information for a specific shipment
// @Tags shipments
// @Accept json
// @Produce json
// @Param id path int true "Shipment ID"
// @Success 200 {object} services.ShipmentWithDetails
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/shipments/{id}/track/update [post]
func (h *ShipmentHandler) UpdateShipmentTracking(c *gin.Context) {
	shipmentIDStr := c.Param("id")
	shipmentID, err := strconv.ParseInt(shipmentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid shipment ID",
		})
		return
	}

	// For demo purposes, return mock updated shipment
	// In a real implementation, this would:
	// 1. Get shipment from database
	// 2. Update tracking info using tracking service
	// 3. Save updated shipment to database
	// 4. Return updated shipment

	mockShipment := h.getMockShipmentByID(shipmentID)
	if mockShipment == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "shipment not found",
		})
		return
	}

	// Simulate tracking update
	if mockShipment.TrackingNumber != "" {
		trackingInfo, err := h.trackingService.TrackShipment(mockShipment.TrackingNumber)
		if err == nil {
			mockShipment.Status = trackingInfo.Status
			mockShipment.StatusDescription = trackingInfo.StatusDescription
			mockShipment.LastTracked = time.Now()
			mockShipment.TrackingInfo = trackingInfo
		}
	}

	c.JSON(http.StatusOK, mockShipment)
}

// GetSupportedCarriers godoc
// @Summary Get supported logistics carriers
// @Description Get list of supported logistics carriers and providers
// @Tags shipments
// @Accept json
// @Produce json
// @Success 200 {object} []services.TrackingProvider
// @Router /api/shipments/carriers [get]
func (h *ShipmentHandler) GetSupportedCarriers(c *gin.Context) {
	carriers := services.GetSupportedProviders()
	c.JSON(http.StatusOK, gin.H{
		"carriers": carriers,
	})
}

// TestTrackingConnection godoc
// @Summary Test connection to tracking service
// @Description Test connectivity to the configured logistics provider API
// @Tags shipments
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/shipments/test-connection [post]
func (h *ShipmentHandler) TestTrackingConnection(c *gin.Context) {
	err := h.trackingService.TestConnection()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "connection test failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "connection test successful",
		"status":  "ok",
	})
}

// Response models

// ShipmentListResponse represents paginated shipment list response
type ShipmentListResponse struct {
	Shipments []services.ShipmentWithDetails `json:"shipments"`
	Total     int64                          `json:"total"`
	Page      int                            `json:"page"`
	PageSize  int                            `json:"page_size"`
	Pages     int                            `json:"total_pages"`
}

// Mock data helpers (for development/testing)

func (h *ShipmentHandler) getMockShipments(params ShipmentQueryParams) []services.ShipmentWithDetails {
	mockData := []services.ShipmentWithDetails{
		{
			Shipment: services.Shipment{
				ID:               1,
				SalesOrderID:     1001,
				CustomerID:       1,
				TrackingNumber:   "DHL123456789",
				Carrier:          "DHL",
				ServiceType:      "Express",
				Status:           "in_transit",
				StatusDescription: "In Transit",
				ShipDate:         time.Now().AddDate(0, 0, -2),
				EstimatedDelivery: timePtr(time.Now().AddDate(0, 0, 1)),
				Weight:           2.5,
				WeightUnit:       "kg",
				LastTracked:      time.Now().Add(-time.Hour),
				CreatedAt:        time.Now().AddDate(0, 0, -3),
				UpdatedAt:        time.Now().Add(-time.Hour),
			},
		},
		{
			Shipment: services.Shipment{
				ID:               2,
				SalesOrderID:     1002,
				CustomerID:       2,
				TrackingNumber:   "FEDEX987654321",
				Carrier:          "FedEx",
				ServiceType:      "Ground",
				Status:           "delivered",
				StatusDescription: "Delivered",
				ShipDate:         time.Now().AddDate(0, 0, -5),
				EstimatedDelivery: timePtr(time.Now().AddDate(0, 0, -2)),
				ActualDelivery:    timePtr(time.Now().AddDate(0, 0, -1)),
				Weight:           1.8,
				WeightUnit:       "kg",
				LastTracked:      time.Now().Add(-2*time.Hour),
				CreatedAt:        time.Now().AddDate(0, 0, -6),
				UpdatedAt:        time.Now().Add(-2*time.Hour),
			},
		},
		{
			Shipment: services.Shipment{
				ID:               3,
				SalesOrderID:     1003,
				CustomerID:       1,
				TrackingNumber:   "UPS456789123",
				Carrier:          "UPS",
				ServiceType:      "Standard",
				Status:           "picked_up",
				StatusDescription: "Package Picked Up",
				ShipDate:         time.Now(),
				EstimatedDelivery: timePtr(time.Now().AddDate(0, 0, 3)),
				Weight:           3.2,
				WeightUnit:       "kg",
				LastTracked:      time.Now().Add(-30*time.Minute),
				CreatedAt:        time.Now().Add(-time.Hour),
				UpdatedAt:        time.Now().Add(-30*time.Minute),
			},
		},
	}

	// Apply filters
	var filtered []services.ShipmentWithDetails
	for _, shipment := range mockData {
		// Filter by sales order ID
		if params.SalesOrderID != nil && shipment.SalesOrderID != *params.SalesOrderID {
			continue
		}
		
		// Filter by customer ID
		if params.CustomerID != nil && shipment.CustomerID != *params.CustomerID {
			continue
		}
		
		// Filter by status
		if params.Status != "" && params.Status != "all" && string(shipment.Status) != params.Status {
			continue
		}
		
		// Filter by carrier
		if params.Carrier != "" && params.Carrier != "all" && shipment.Carrier != params.Carrier {
			continue
		}
		
		// Filter by date range
		if params.DateFrom != "" {
			dateFrom, err := time.Parse("2006-01-02", params.DateFrom)
			if err == nil && shipment.ShipDate.Before(dateFrom) {
				continue
			}
		}
		
		if params.DateTo != "" {
			dateTo, err := time.Parse("2006-01-02", params.DateTo)
			if err == nil && shipment.ShipDate.After(dateTo.AddDate(0, 0, 1)) {
				continue
			}
		}
		
		filtered = append(filtered, shipment)
	}

	return filtered
}

func (h *ShipmentHandler) getMockShipmentByID(id int64) *services.ShipmentWithDetails {
	mockData := h.getMockShipments(ShipmentQueryParams{})
	for _, shipment := range mockData {
		if shipment.ID == id {
			return &shipment
		}
	}
	return nil
}

// Helper function to create time pointer
func timePtr(t time.Time) *time.Time {
	return &t
}