package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMockAIService_ProcessQuery_SalesQuery(t *testing.T) {
	service := NewMockAIService()

	req := &AIQueryRequest{
		Query:  "查詢銷售數據",
		UserID: 123,
	}

	response, err := service.ProcessQuery(req)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, "data_query", response.Intent)
	assert.True(t, response.Success)
	assert.Contains(t, response.Response, "銷售")
	assert.NotEmpty(t, response.Suggestions)

	// 檢查回應資料
	assert.NotNil(t, response.Data)
	data := response.Data.(map[string]interface{})
	assert.Equal(t, "view_sales_report", data["suggested_action"])
	assert.Equal(t, "/api/reports/sales", data["api_endpoint"])
	assert.True(t, data["mock_data"].(bool))
}

func TestMockAIService_ProcessQuery_InventoryQuery(t *testing.T) {
	service := NewMockAIService()

	req := &AIQueryRequest{
		Query:  "查看庫存狀況",
		UserID: 123,
	}

	response, err := service.ProcessQuery(req)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, "data_query", response.Intent)
	assert.True(t, response.Success)
	assert.Contains(t, response.Response, "庫存")
	assert.Contains(t, response.Response, "150")
	assert.NotEmpty(t, response.Suggestions)

	// 檢查回應資料
	data := response.Data.(map[string]interface{})
	assert.Equal(t, "view_inventory", data["suggested_action"])
	assert.Equal(t, "/api/inventory/levels", data["api_endpoint"])
}

func TestMockAIService_ProcessQuery_FinancialQuery(t *testing.T) {
	service := NewMockAIService()

	req := &AIQueryRequest{
		Query:  "財務報表",
		UserID: 123,
	}

	response, err := service.ProcessQuery(req)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, "data_query", response.Intent)
	assert.True(t, response.Success)
	assert.Contains(t, response.Response, "財務")
	assert.Contains(t, response.Response, "應收帳款")
	assert.Contains(t, response.Response, "應付帳款")
}

func TestMockAIService_ProcessQuery_CreateProductAction(t *testing.T) {
	service := NewMockAIService()

	req := &AIQueryRequest{
		Query:  "如何新增產品",
		UserID: 123,
	}

	response, err := service.ProcessQuery(req)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, "action_request", response.Intent)
	assert.True(t, response.Success)
	assert.Contains(t, response.Response, "新增產品")
	assert.Contains(t, response.Response, "步驟")

	// 檢查回應資料
	data := response.Data.(map[string]interface{})
	assert.Equal(t, "create_product", data["suggested_action"])
	assert.Equal(t, "/products", data["navigation_path"])
}

func TestMockAIService_ProcessQuery_HelpQuery(t *testing.T) {
	service := NewMockAIService()

	req := &AIQueryRequest{
		Query:  "如何使用系統",
		UserID: 123,
	}

	response, err := service.ProcessQuery(req)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, "navigation_help", response.Intent)
	assert.True(t, response.Success)
	assert.Contains(t, response.Response, "功能")
	assert.NotEmpty(t, response.Suggestions)
}

func TestMockAIService_ProcessQuery_GeneralQuery(t *testing.T) {
	service := NewMockAIService()

	req := &AIQueryRequest{
		Query:  "你好",
		UserID: 123,
	}

	response, err := service.ProcessQuery(req)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, "general_help", response.Intent)
	assert.True(t, response.Success)
	assert.Contains(t, response.Response, "NexusERP")
	assert.Contains(t, response.Response, "智慧助手")
	assert.NotEmpty(t, response.Suggestions)
}

func TestMockAIService_ProcessQuery_EnglishQuery(t *testing.T) {
	service := NewMockAIService()

	req := &AIQueryRequest{
		Query:  "show me sales data",
		UserID: 123,
	}

	response, err := service.ProcessQuery(req)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, "data_query", response.Intent)
	assert.True(t, response.Success)
	assert.Contains(t, response.Response, "銷售")
}

func TestMockAIService_ProcessQuery_CreateGeneralAction(t *testing.T) {
	service := NewMockAIService()

	req := &AIQueryRequest{
		Query:  "我想新增資料",
		UserID: 123,
	}

	response, err := service.ProcessQuery(req)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, "action_request", response.Intent)
	assert.True(t, response.Success)
	assert.Contains(t, response.Response, "新增")
	assert.NotEmpty(t, response.Suggestions)
}

func TestFallbackIntentClassification(t *testing.T) {
	service := &AIService{}

	// 測試數據查詢意圖
	intent := service.fallbackIntentClassification("查詢銷售報表")
	assert.Equal(t, "data_query", intent.Intent)
	assert.Equal(t, 0.7, intent.Confidence)
	assert.Equal(t, "query_data", intent.Action)

	// 測試操作請求意圖
	intent = service.fallbackIntentClassification("新增產品資料")
	assert.Equal(t, "action_request", intent.Intent)
	assert.Equal(t, 0.7, intent.Confidence)
	assert.Equal(t, "perform_action", intent.Action)

	// 測試導航幫助意圖
	intent = service.fallbackIntentClassification("如何操作系統")
	assert.Equal(t, "navigation_help", intent.Intent)
	assert.Equal(t, 0.7, intent.Confidence)
	assert.Equal(t, "provide_guidance", intent.Action)

	// 測試一般幫助意圖
	intent = service.fallbackIntentClassification("請幫助我")
	assert.Equal(t, "general_help", intent.Intent)
	assert.Equal(t, 0.7, intent.Confidence)
	assert.Equal(t, "provide_help", intent.Action)

	// 測試未知查詢（預設）
	intent = service.fallbackIntentClassification("xyz unknown query")
	assert.Equal(t, "general_help", intent.Intent)
	assert.Equal(t, 0.5, intent.Confidence)
	assert.Equal(t, "provide_help", intent.Action)
}

func TestContainsFunction(t *testing.T) {
	// 測試包含關鍵字
	assert.True(t, contains("查詢銷售數據", []string{"查詢", "銷售"}))
	assert.True(t, contains("新增產品", []string{"新增", "產品"}))
	assert.False(t, contains("其他文字", []string{"查詢", "銷售"}))
	
	// 測試空的情況
	assert.False(t, contains("", []string{"查詢"}))
	assert.False(t, contains("查詢", []string{}))
}