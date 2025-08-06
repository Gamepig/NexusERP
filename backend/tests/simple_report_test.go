package tests

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"

	"nexus-erp/backend/internal/models"
)

// 測試報表模型結構
func TestReportModelStructures(t *testing.T) {
	// 測試 ReportRequest 結構
	req := models.ReportRequest{
		ReportType: "sales",
		Parameters: make(map[string]interface{}),
		UseCache:   true,
	}
	assert.Equal(t, "sales", req.ReportType)
	assert.True(t, req.UseCache)
	assert.NotNil(t, req.Parameters)

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

// 測試報表摘要結構
func TestReportSummaryStructures(t *testing.T) {
	// 測試銷售報表摘要
	salesSummary := models.SalesReportSummary{
		TotalSales:       150000.0,
		OrderCount:       75,
		AverageOrderSize: 2000.0,
	}
	assert.Equal(t, float64(150000), salesSummary.TotalSales)
	assert.Equal(t, 75, salesSummary.OrderCount)
	assert.Equal(t, float64(2000), salesSummary.AverageOrderSize)

	// 測試庫存報表摘要
	inventorySummary := models.InventoryReportSummary{
		TotalProducts:   100,
		TotalValue:      500000.0,
		LowStockCount:   8,
		OutOfStockCount: 3,
	}
	assert.Equal(t, 100, inventorySummary.TotalProducts)
	assert.Equal(t, float64(500000), inventorySummary.TotalValue)
	assert.Equal(t, 8, inventorySummary.LowStockCount)

	// 測試財務報表摘要
	financialSummary := models.FinancialReportSummary{
		TotalAR:   85000.0,
		TotalAP:   45000.0,
		OverdueAR: 15000.0,
		OverdueAP: 8000.0,
		CashFlow:  40000.0,
	}
	assert.Equal(t, float64(85000), financialSummary.TotalAR)
	assert.Equal(t, float64(45000), financialSummary.TotalAP)
	assert.Equal(t, float64(40000), financialSummary.CashFlow)
}

// 測試儀表板資料結構
func TestDashboardDataStructures(t *testing.T) {
	dashboard := models.DashboardData{
		Sales: &models.SalesData{
			TotalSales: 150000.0,
			OrderCount: 75,
		},
		Inventory: &models.InventoryData{
			TotalValue:    500000.0,
			LowStockCount: 8,
		},
		Financial: &models.FinancialData{
			TotalAR:  85000.0,
			TotalAP:  45000.0,
			CashFlow: 40000.0,
		},
	}

	assert.NotNil(t, dashboard.Sales)
	assert.NotNil(t, dashboard.Inventory)
	assert.NotNil(t, dashboard.Financial)
	
	assert.Equal(t, float64(150000), dashboard.Sales.TotalSales)
	assert.Equal(t, 75, dashboard.Sales.OrderCount)
	assert.Equal(t, float64(500000), dashboard.Inventory.TotalValue)
	assert.Equal(t, 8, dashboard.Inventory.LowStockCount)
	assert.Equal(t, float64(85000), dashboard.Financial.TotalAR)
	assert.Equal(t, float64(40000), dashboard.Financial.CashFlow)
}

// 測試 JSON 序列化/反序列化
func TestJSONSerialization(t *testing.T) {
	// 測試 ReportResponse JSON 處理
	original := models.ReportResponse{
		ReportType: "sales",
		Summary:    json.RawMessage(`{"total_sales": 100000, "order_count": 50}`),
		Data:       json.RawMessage(`[{"order_id": "1", "amount": 2000}]`),
	}

	// 序列化
	jsonData, err := json.Marshal(original)
	assert.NoError(t, err)
	assert.NotEmpty(t, jsonData)

	// 反序列化
	var restored models.ReportResponse
	err = json.Unmarshal(jsonData, &restored)
	assert.NoError(t, err)
	assert.Equal(t, original.ReportType, restored.ReportType)
	
	// 檢驗 Summary 內容 (忽略格式差異)
	var originalSummary, restoredSummary map[string]interface{}
	err = json.Unmarshal(original.Summary, &originalSummary)
	assert.NoError(t, err)
	err = json.Unmarshal(restored.Summary, &restoredSummary)
	assert.NoError(t, err)
	assert.Equal(t, originalSummary, restoredSummary)
	
	// 檢驗 Data 內容 (忽略格式差異)
	var originalData, restoredData []map[string]interface{}
	err = json.Unmarshal(original.Data, &originalData)
	assert.NoError(t, err)
	err = json.Unmarshal(restored.Data, &restoredData)
	assert.NoError(t, err)
	assert.Equal(t, originalData, restoredData)
}