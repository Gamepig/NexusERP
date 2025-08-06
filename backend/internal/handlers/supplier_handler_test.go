package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"nexus-erp/backend/internal/models"
)

// MockSupplierService is a mock implementation of SupplierService
type MockSupplierService struct {
	mock.Mock
}

func (m *MockSupplierService) CreateSupplier(ctx context.Context, req models.CreateSupplierRequest) (*models.Supplier, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func (m *MockSupplierService) GetSuppliers(ctx context.Context, page, limit int, search string, isActive *bool) ([]models.Supplier, int, error) {
	args := m.Called(ctx, page, limit, search, isActive)
	return args.Get(0).([]models.Supplier), args.Get(1).(int), args.Error(2)
}

func (m *MockSupplierService) GetSupplier(ctx context.Context, id int64) (*models.Supplier, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func (m *MockSupplierService) UpdateSupplier(ctx context.Context, id int64, req models.UpdateSupplierRequest) (*models.Supplier, error) {
	args := m.Called(ctx, id, req)
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func (m *MockSupplierService) DeleteSupplier(ctx context.Context, id int64) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockSupplierService) GetSupplierByCode(ctx context.Context, code string) (*models.Supplier, error) {
	args := m.Called(ctx, code)
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func TestSupplierHandler_CreateSupplier(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	mockService := new(MockSupplierService)
	handler := NewSupplierHandler(mockService)
	
	router.POST("/api/suppliers", handler.CreateSupplier)

	// Test data
	req := models.CreateSupplierRequest{
		Code:          "SUP001",
		Name:          "Test Supplier",
		ContactPerson: "John Doe",
		Email:         "john@testsupplier.com",
		Phone:         "+1-555-0123",
		PaymentTerms:  "Net 30",
		Notes:         "Test supplier for unit testing",
	}

	expectedSupplier := &models.Supplier{
		ID:            1,
		Code:          req.Code,
		Name:          req.Name,
		ContactPerson: &req.ContactPerson,
		Email:         &req.Email,
		Phone:         &req.Phone,
		PaymentTerms:  &req.PaymentTerms,
		Notes:         &req.Notes,
		IsActive:      true,
	}

	// Setup mock
	mockService.On("CreateSupplier", mock.Anything, req).Return(expectedSupplier, nil)

	// Execute
	reqBody, _ := json.Marshal(req)
	w := httptest.NewRecorder()
	httpReq, _ := http.NewRequest("POST", "/api/suppliers", bytes.NewBuffer(reqBody))
	httpReq.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, httpReq)

	// Assert
	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response models.Supplier
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, expectedSupplier.Code, response.Code)
	assert.Equal(t, expectedSupplier.Name, response.Name)
	assert.Equal(t, expectedSupplier.IsActive, response.IsActive)
	
	mockService.AssertExpectations(t)
}

func TestSupplierHandler_GetSuppliers(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	mockService := new(MockSupplierService)
	handler := NewSupplierHandler(mockService)
	
	router.GET("/api/suppliers", handler.GetSuppliers)

	// Test data
	suppliers := []models.Supplier{
		{
			ID:       1,
			Code:     "SUP001",
			Name:     "Test Supplier 1",
			IsActive: true,
		},
		{
			ID:       2,
			Code:     "SUP002",
			Name:     "Test Supplier 2",
			IsActive: true,
		},
	}

	// Setup mock
	mockService.On("GetSuppliers", mock.Anything, 1, 10, "", (*bool)(nil)).Return(suppliers, 2, nil)

	// Execute
	w := httptest.NewRecorder()
	httpReq, _ := http.NewRequest("GET", "/api/suppliers", nil)
	
	router.ServeHTTP(w, httpReq)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, float64(2), response["total"])
	assert.Equal(t, float64(1), response["page"])
	assert.Equal(t, float64(10), response["limit"])
	
	data, ok := response["data"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, data, 2)
	
	mockService.AssertExpectations(t)
}

func TestSupplierHandler_GetSupplier(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	mockService := new(MockSupplierService)
	handler := NewSupplierHandler(mockService)
	
	router.GET("/api/suppliers/:id", handler.GetSupplier)

	// Test data
	supplier := &models.Supplier{
		ID:       1,
		Code:     "SUP001",
		Name:     "Test Supplier",
		IsActive: true,
	}

	// Setup mock
	mockService.On("GetSupplier", mock.Anything, int64(1)).Return(supplier, nil)

	// Execute
	w := httptest.NewRecorder()
	httpReq, _ := http.NewRequest("GET", "/api/suppliers/1", nil)
	
	router.ServeHTTP(w, httpReq)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response models.Supplier
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, supplier.ID, response.ID)
	assert.Equal(t, supplier.Code, response.Code)
	assert.Equal(t, supplier.Name, response.Name)
	
	mockService.AssertExpectations(t)
}

func TestSupplierHandler_UpdateSupplier(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	mockService := new(MockSupplierService)
	handler := NewSupplierHandler(mockService)
	
	router.PUT("/api/suppliers/:id", handler.UpdateSupplier)

	// Test data
	req := models.UpdateSupplierRequest{
		Code:          "SUP001",
		Name:          "Updated Supplier",
		ContactPerson: "Jane Doe",
		Email:         "jane@testsupplier.com",
		Phone:         "+1-555-0124",
		PaymentTerms:  "Net 15",
		IsActive:      true,
		Notes:         "Updated supplier for unit testing",
	}

	updatedSupplier := &models.Supplier{
		ID:            1,
		Code:          req.Code,
		Name:          req.Name,
		ContactPerson: &req.ContactPerson,
		Email:         &req.Email,
		Phone:         &req.Phone,
		PaymentTerms:  &req.PaymentTerms,
		IsActive:      req.IsActive,
		Notes:         &req.Notes,
	}

	// Setup mock
	mockService.On("UpdateSupplier", mock.Anything, int64(1), req).Return(updatedSupplier, nil)

	// Execute
	reqBody, _ := json.Marshal(req)
	w := httptest.NewRecorder()
	httpReq, _ := http.NewRequest("PUT", "/api/suppliers/1", bytes.NewBuffer(reqBody))
	httpReq.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, httpReq)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response models.Supplier
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, updatedSupplier.Name, response.Name)
	assert.Equal(t, updatedSupplier.IsActive, response.IsActive)
	
	mockService.AssertExpectations(t)
}

func TestSupplierHandler_DeleteSupplier(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	mockService := new(MockSupplierService)
	handler := NewSupplierHandler(mockService)
	
	router.DELETE("/api/suppliers/:id", handler.DeleteSupplier)

	// Setup mock
	mockService.On("DeleteSupplier", mock.Anything, int64(1)).Return(nil)

	// Execute
	w := httptest.NewRecorder()
	httpReq, _ := http.NewRequest("DELETE", "/api/suppliers/1", nil)
	
	router.ServeHTTP(w, httpReq)

	// Assert
	assert.Equal(t, http.StatusNoContent, w.Code)
	
	mockService.AssertExpectations(t)
}

func TestSupplierHandler_GetSupplierByCode(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	mockService := new(MockSupplierService)
	handler := NewSupplierHandler(mockService)
	
	router.GET("/api/suppliers/code/:code", handler.GetSupplierByCode)

	// Test data
	supplier := &models.Supplier{
		ID:       1,
		Code:     "SUP001",
		Name:     "Test Supplier",
		IsActive: true,
	}

	// Setup mock
	mockService.On("GetSupplierByCode", mock.Anything, "SUP001").Return(supplier, nil)

	// Execute
	w := httptest.NewRecorder()
	httpReq, _ := http.NewRequest("GET", "/api/suppliers/code/SUP001", nil)
	
	router.ServeHTTP(w, httpReq)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response models.Supplier
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, supplier.Code, response.Code)
	assert.Equal(t, supplier.Name, response.Name)
	
	mockService.AssertExpectations(t)
}