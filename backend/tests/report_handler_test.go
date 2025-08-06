package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"nexus-erp/backend/internal/handlers"
	"nexus-erp/backend/internal/models"
)

// 測試銷售報表 API 端點結構
func TestSalesReportAPIStructure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// 創建 handler (使用 nil 因為我們只測試結構)
	handler := handlers.NewReportHandler(nil)
	
	router := gin.New()
	router.GET("/api/reports/sales", handler.GetSalesReport)

	req, _ := http.NewRequest("GET", "/api/reports/sales?date_from=2024-01-01&date_to=2024-01-31", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// 期望會有錯誤因為沒有資料庫連接，但應該不是路由錯誤
	assert.NotEqual(t, http.StatusNotFound, w.Code)
}

// 測試庫存報表 API 端點結構
func TestInventoryReportAPIStructure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := handlers.NewReportHandler(nil)
	
	router := gin.New()
	router.GET("/api/reports/inventory", handler.GetInventoryReport)

	req, _ := http.NewRequest("GET", "/api/reports/inventory", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.NotEqual(t, http.StatusNotFound, w.Code)
}

// 測試財務報表 API 端點結構
func TestFinancialReportAPIStructure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := handlers.NewReportHandler(nil)
	
	router := gin.New()
	router.GET("/api/reports/financial", handler.GetFinancialReport)

	req, _ := http.NewRequest("GET", "/api/reports/financial?date_from=2024-01-01&date_to=2024-01-31", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.NotEqual(t, http.StatusNotFound, w.Code)
}

// 測試儀表板 API 端點結構
func TestDashboardAPIStructure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := handlers.NewReportHandler(nil)
	
	router := gin.New()
	router.GET("/api/dashboard", handler.GetDashboardData)

	req, _ := http.NewRequest("GET", "/api/dashboard", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.NotEqual(t, http.StatusNotFound, w.Code)
}

// 測試報表請求參數驗證
func TestReportRequestValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := handlers.NewReportHandler(nil)
	
	router := gin.New()
	router.GET("/api/reports/sales", handler.GetSalesReport)

	// 測試無效的日期格式
	req, _ := http.NewRequest("GET", "/api/reports/sales?date_from=invalid-date", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// 應該返回 400 Bad Request 對於無效日期格式
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// 測試模型結構
func TestReportModelStructures(t *testing.T) {
	// 測試 ReportRequest 結構
	req := models.ReportRequest{
		ReportType: "sales",
		Parameters: make(map[string]interface{}),
		UseCache:   true,
	}
	assert.Equal(t, "sales", req.ReportType)
	assert.True(t, req.UseCache)

	// 測試 ReportResponse 結構
	summary := json.RawMessage(`{"total_sales": 100000}`)
	data := json.RawMessage(`[]`)
	
	resp := models.ReportResponse{
		ReportType: "sales",
		Summary:    summary,
		Data:       data,
	}
	assert.Equal(t, "sales", resp.ReportType)
	assert.NotNil(t, resp.Summary)
	assert.NotNil(t, resp.Data)
}