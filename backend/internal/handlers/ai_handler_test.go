package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockAIService for testing
type MockAIService struct {
	mock.Mock
}

func (m *MockAIService) ClassifyBusiness(businessDescription string) (*models.BusinessClassification, error) {
	args := m.Called(businessDescription)
	return args.Get(0).(*models.BusinessClassification), args.Error(1)
}

func (m *MockAIService) GenerateYAML(classification *models.BusinessClassification) (string, error) {
	args := m.Called(classification)
	return args.String(0), args.Error(1)
}

func (m *MockAIService) ProcessQuery(req *services.AIQueryRequest) (*services.AIQueryResponse, error) {
	args := m.Called(req)
	return args.Get(0).(*services.AIQueryResponse), args.Error(1)
}

func setupAIHandler() (*AIHandler, *MockAIService) {
	mockService := new(MockAIService)
	handler := NewAIHandler(mockService)
	return handler, mockService
}

func TestAIHandler_AIQuery_Success(t *testing.T) {
	handler, mockService := setupAIHandler()

	// 設定模擬回應
	expectedResponse := &services.AIQueryResponse{
		Response: "這是測試回應",
		Intent:   "data_query",
		Data: map[string]interface{}{
			"suggested_action": "view_sales_report",
		},
		Suggestions: []string{"查看銷售報表", "分析銷售趨勢"},
		Success:     true,
	}

	mockService.On("ProcessQuery", mock.AnythingOfType("*services.AIQueryRequest")).Return(expectedResponse, nil)

	// 建立測試請求
	requestBody := AIQueryAPIRequest{
		Query:   "查詢銷售數據",
		Context: "dashboard",
	}

	jsonBody, _ := json.Marshal(requestBody)

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// 設定請求
	req, _ := http.NewRequest("POST", "/api/ai/query", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	// 模擬認證中間件設定的用戶 ID
	c.Set("user_id", "123")

	// 執行處理器
	handler.AIQuery(c)

	// 驗證回應
	assert.Equal(t, http.StatusOK, w.Code)

	var response services.AIQueryResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, expectedResponse.Response, response.Response)
	assert.Equal(t, expectedResponse.Intent, response.Intent)
	assert.True(t, response.Success)

	mockService.AssertExpectations(t)
}

func TestAIHandler_AIQuery_InvalidRequest(t *testing.T) {
	handler, _ := setupAIHandler()

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// 發送無效 JSON
	req, _ := http.NewRequest("POST", "/api/ai/query", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	c.Set("user_id", "123")

	handler.AIQuery(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid request format", response["error"])
	assert.False(t, response["success"].(bool))
}

func TestAIHandler_AIQuery_EmptyQuery(t *testing.T) {
	handler, _ := setupAIHandler()

	requestBody := AIQueryAPIRequest{
		Query:   "",
		Context: "dashboard",
	}

	jsonBody, _ := json.Marshal(requestBody)

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	req, _ := http.NewRequest("POST", "/api/ai/query", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	c.Set("user_id", "123")

	handler.AIQuery(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Query cannot be empty", response["error"])
	assert.False(t, response["success"].(bool))
}

func TestAIHandler_AIQuery_TooLongQuery(t *testing.T) {
	handler, _ := setupAIHandler()

	// 建立超過長度限制的查詢
	longQuery := string(make([]byte, 1001))
	requestBody := AIQueryAPIRequest{
		Query:   longQuery,
		Context: "dashboard",
	}

	jsonBody, _ := json.Marshal(requestBody)

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	req, _ := http.NewRequest("POST", "/api/ai/query", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	c.Set("user_id", "123")

	handler.AIQuery(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Query too long (max 1000 characters)", response["error"])
	assert.False(t, response["success"].(bool))
}

func TestAIHandler_AIQuery_NoAuth(t *testing.T) {
	handler, _ := setupAIHandler()

	requestBody := AIQueryAPIRequest{
		Query:   "測試查詢",
		Context: "dashboard",
	}

	jsonBody, _ := json.Marshal(requestBody)

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	req, _ := http.NewRequest("POST", "/api/ai/query", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	// 不設定用戶 ID（未認證）

	handler.AIQuery(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "User not authenticated", response["error"])
	assert.False(t, response["success"].(bool))
}

func TestAIHandler_GetAICapabilities(t *testing.T) {
	handler, _ := setupAIHandler()

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	req, _ := http.NewRequest("GET", "/api/ai/capabilities", nil)
	c.Request = req

	handler.GetAICapabilities(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["capabilities"])

	capabilities := response["capabilities"].(map[string]interface{})
	assert.NotNil(t, capabilities["intents"])
	assert.NotNil(t, capabilities["supported_modules"])
	assert.NotNil(t, capabilities["features"])
}

func TestAIHandler_GetAIStatus(t *testing.T) {
	handler, _ := setupAIHandler()

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	req, _ := http.NewRequest("GET", "/api/ai/status", nil)
	c.Request = req

	handler.GetAIStatus(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["status"])

	status := response["status"].(map[string]interface{})
	assert.Equal(t, "available", status["service"])
	assert.Equal(t, "1.0.0", status["version"])
}