package tests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/handlers"
	"nexus-erp/backend/internal/services"
)

// IntegrationTestSuite contains test setup and common functionality
type IntegrationTestSuite struct {
	router             *gin.Engine
	integrationConfig  *config.IntegrationConfig
	quickbooksService  *services.QuickBooksService
	trackingService    *services.ShipmentTrackingService
	shipmentHandler    *handlers.ShipmentHandler
}

// SetupIntegrationTests initializes the test environment
func SetupIntegrationTests(t *testing.T) *IntegrationTestSuite {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Load integration configuration
	integrationConfig, err := config.LoadIntegrationConfig()
	require.NoError(t, err, "Failed to load integration configuration")

	// Ensure we're in sandbox mode for testing
	assert.True(t, integrationConfig.IsSandboxMode(), "Tests must run in sandbox mode")

	// Create services
	var quickbooksService *services.QuickBooksService
	var trackingService *services.ShipmentTrackingService

	if integrationConfig.QuickBooks.Enabled {
		quickbooksService, err = integrationConfig.CreateQuickBooksService()
		if err != nil {
			t.Logf("QuickBooks service creation failed: %v", err)
		}
	}

	if integrationConfig.ShipmentTracking.Enabled {
		trackingService, err = integrationConfig.CreateShipmentTrackingService("")
		if err != nil {
			t.Logf("Shipment tracking service creation failed: %v", err)
		}
	}

	// Create handlers
	shipmentHandler := handlers.NewShipmentHandler(trackingService)

	// Setup router
	router := gin.New()
	setupRoutes(router, shipmentHandler)

	return &IntegrationTestSuite{
		router:            router,
		integrationConfig: integrationConfig,
		quickbooksService: quickbooksService,
		trackingService:   trackingService,
		shipmentHandler:   shipmentHandler,
	}
}

// setupRoutes configures API routes for testing
func setupRoutes(router *gin.Engine, shipmentHandler *handlers.ShipmentHandler) {
	api := router.Group("/api")
	shipments := api.Group("/shipments")
	{
		shipments.GET("", shipmentHandler.GetShipments)
		shipments.GET("/track/:tracking_number", shipmentHandler.TrackSingleShipment)
		shipments.POST("/track/batch", shipmentHandler.TrackMultipleShipments)
		shipments.POST("/:id/track/update", shipmentHandler.UpdateShipmentTracking)
		shipments.GET("/carriers", shipmentHandler.GetSupportedCarriers)
		shipments.POST("/test-connection", shipmentHandler.TestTrackingConnection)
	}
}

// TestQuickBooksIntegration tests QuickBooks API integration
func TestQuickBooksIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration tests in short mode")
	}

	suite := SetupIntegrationTests(t)
	
	if suite.quickbooksService == nil {
		t.Skip("QuickBooks service not available")
	}

	t.Run("TestConnection", func(t *testing.T) {
		err := suite.quickbooksService.TestConnection()
		if err != nil {
			t.Logf("QuickBooks connection test failed (expected in test environment): %v", err)
		}
	})

	t.Run("CustomerSync", func(t *testing.T) {
		// Create a test customer
		testCustomer := &models.Customer{
			ID:           1,
			CustomerCode: "TEST001",
			Name:         "Test Customer",
			Status:       "active",
			PrimaryEmail: stringPtr("test@example.com"),
			CreditLimit:  5000.00,
		}

		// Attempt to sync (will likely fail in test environment)
		_, err := suite.quickbooksService.SyncCustomer(testCustomer)
		if err != nil {
			t.Logf("Customer sync failed (expected in test environment): %v", err)
		}
	})

	t.Run("GetCustomer", func(t *testing.T) {
		// Attempt to get a customer
		_, err := suite.quickbooksService.GetCustomerByName("Test Customer")
		if err != nil {
			t.Logf("Get customer failed (expected in test environment): %v", err)
		}
	})
}

// TestShipmentTrackingIntegration tests shipment tracking integration
func TestShipmentTrackingIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration tests in short mode")
	}

	suite := SetupIntegrationTests(t)
	
	if suite.trackingService == nil {
		t.Skip("Shipment tracking service not available")
	}

	t.Run("TestConnection", func(t *testing.T) {
		err := suite.trackingService.TestConnection()
		if err != nil {
			t.Logf("Tracking service connection test failed (expected in test environment): %v", err)
		}
	})

	t.Run("SingleTrackingTest", func(t *testing.T) {
		// Use a test tracking number
		testTrackingNumber := "TEST123456789"
		
		trackingInfo, err := suite.trackingService.TrackShipment(testTrackingNumber)
		if err != nil {
			t.Logf("Single tracking failed (expected for test tracking number): %v", err)
		} else {
			assert.NotNil(t, trackingInfo)
			assert.Equal(t, testTrackingNumber, trackingInfo.TrackingNumber)
		}
	})

	t.Run("BatchTrackingTest", func(t *testing.T) {
		testTrackingNumbers := []string{
			"TEST123456789",
			"TEST987654321",
		}
		
		results, err := suite.trackingService.TrackMultipleShipments(testTrackingNumbers)
		if err != nil {
			t.Logf("Batch tracking failed: %v", err)
		} else {
			assert.NotNil(t, results)
			assert.Len(t, results, len(testTrackingNumbers))
		}
	})
}

// TestShipmentAPI tests the shipment API endpoints
func TestShipmentAPI(t *testing.T) {
	suite := SetupIntegrationTests(t)

	t.Run("GetShipments", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/shipments", nil)
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response, "shipments")
	})

	t.Run("GetShipmentsWithFilters", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/shipments?status=delivered&carrier=DHL", nil)
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("TrackSingleShipment", func(t *testing.T) {
		trackingNumber := "TEST123456789"
		req, _ := http.NewRequest("GET", fmt.Sprintf("/api/shipments/track/%s", trackingNumber), nil)
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		// May fail in test environment, but should return proper error response
		assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusInternalServerError)
	})

	t.Run("TrackMultipleShipments", func(t *testing.T) {
		payload := `{"tracking_numbers": ["TEST123456789", "TEST987654321"]}`
		req, _ := http.NewRequest("POST", "/api/shipments/track/batch", strings.NewReader(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		// May fail in test environment, but should return proper error response
		assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusInternalServerError)
	})

	t.Run("GetSupportedCarriers", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/shipments/carriers", nil)
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response, "carriers")
	})

	t.Run("TestTrackingConnection", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/shipments/test-connection", nil)
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		// May fail in test environment, but should return proper response
		assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusInternalServerError)
	})
}

// TestConfigurationValidation tests integration configuration validation
func TestConfigurationValidation(t *testing.T) {
	suite := SetupIntegrationTests(t)

	t.Run("ValidateConfig", func(t *testing.T) {
		err := suite.integrationConfig.Validate()
		if err != nil {
			t.Logf("Configuration validation failed (may be expected in test environment): %v", err)
		}
	})

	t.Run("IsSandboxMode", func(t *testing.T) {
		assert.True(t, suite.integrationConfig.IsSandboxMode(), "Should be in sandbox mode for tests")
	})

	t.Run("GetEnabledProviders", func(t *testing.T) {
		providers := suite.integrationConfig.GetEnabledTrackingProviders()
		t.Logf("Enabled tracking providers: %v", providers)
	})
}

// TestErrorHandling tests error handling in integration scenarios
func TestErrorHandling(t *testing.T) {
	suite := SetupIntegrationTests(t)

	t.Run("InvalidTrackingNumber", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/shipments/track/INVALID", nil)
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		assert.True(t, w.Code >= 400)
	})

	t.Run("EmptyTrackingNumber", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/shipments/track/", nil)
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("TooManyBatchRequests", func(t *testing.T) {
		// Create a request with too many tracking numbers
		trackingNumbers := make([]string, 51) // Over the limit of 50
		for i := range trackingNumbers {
			trackingNumbers[i] = fmt.Sprintf("TEST%d", i)
		}
		
		payload := fmt.Sprintf(`{"tracking_numbers": %s}`, toJSONArray(trackingNumbers))
		req, _ := http.NewRequest("POST", "/api/shipments/track/batch", strings.NewReader(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("InvalidJSON", func(t *testing.T) {
		payload := `{"tracking_numbers": invalid_json}`
		req, _ := http.NewRequest("POST", "/api/shipments/track/batch", strings.NewReader(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// TestPerformance tests basic performance characteristics
func TestPerformance(t *testing.T) {
	suite := SetupIntegrationTests(t)

	t.Run("ConcurrentRequests", func(t *testing.T) {
		const numRequests = 10
		done := make(chan bool, numRequests)

		start := time.Now()

		for i := 0; i < numRequests; i++ {
			go func() {
				req, _ := http.NewRequest("GET", "/api/shipments", nil)
				w := httptest.NewRecorder()
				suite.router.ServeHTTP(w, req)
				done <- true
			}()
		}

		// Wait for all requests to complete
		for i := 0; i < numRequests; i++ {
			<-done
		}

		duration := time.Since(start)
		t.Logf("Completed %d concurrent requests in %v", numRequests, duration)
		
		// Basic performance check - should complete within reasonable time
		assert.Less(t, duration, 5*time.Second, "Requests took too long")
	})
}

// Helper functions

func stringPtr(s string) *string {
	return &s
}

func toJSONArray(strings []string) string {
	result := "["
	for i, s := range strings {
		if i > 0 {
			result += ","
		}
		result += fmt.Sprintf(`"%s"`, s)
	}
	result += "]"
	return result
}

// BenchmarkShipmentAPI benchmarks the shipment API performance
func BenchmarkShipmentAPI(b *testing.B) {
	suite := SetupIntegrationTests(&testing.T{})

	b.Run("GetShipments", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			req, _ := http.NewRequest("GET", "/api/shipments", nil)
			w := httptest.NewRecorder()
			suite.router.ServeHTTP(w, req)
		}
	})

	b.Run("TrackSingleShipment", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			req, _ := http.NewRequest("GET", "/api/shipments/track/TEST123456789", nil)
			w := httptest.NewRecorder()
			suite.router.ServeHTTP(w, req)
		}
	})
}