package services

import (
	"testing"
	"time"

	"nexus-erp/backend/internal/models"
)

// TestMovingAverageForcast 測試移動平均預測
func TestMovingAverageForcast(t *testing.T) {
	service := &ForecastingService{}
	
	// 模擬歷史資料
	data := []models.HistoricalSalesData{
		{Date: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), Amount: 100},
		{Date: time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC), Amount: 120},
		{Date: time.Date(2024, 1, 3, 0, 0, 0, 0, time.UTC), Amount: 110},
		{Date: time.Date(2024, 1, 4, 0, 0, 0, 0, time.UTC), Amount: 130},
		{Date: time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC), Amount: 115},
	}
	
	forecasts, err := service.movingAverageForcast(data, 3)
	
	if err != nil {
		t.Fatalf("移動平均預測失敗: %v", err)
	}
	
	if len(forecasts) != 3 {
		t.Errorf("預期 3 個預測點，實際得到 %d 個", len(forecasts))
	}
	
	// 檢查預測值是否合理
	for i, forecast := range forecasts {
		if forecast.PredictedValue <= 0 {
			t.Errorf("預測點 %d 的值應該大於 0，實際為 %f", i, forecast.PredictedValue)
		}
		
		if forecast.ConfidenceIntervalLower == nil || forecast.ConfidenceIntervalUpper == nil {
			t.Errorf("預測點 %d 缺少信賴區間", i)
		}
		
		if forecast.ConfidenceIntervalLower != nil && forecast.ConfidenceIntervalUpper != nil {
			if *forecast.ConfidenceIntervalLower > forecast.PredictedValue ||
				*forecast.ConfidenceIntervalUpper < forecast.PredictedValue {
				t.Errorf("預測點 %d 的信賴區間不正確", i)
			}
		}
	}
}

// TestExponentialSmoothingForecast 測試指數平滑預測
func TestExponentialSmoothingForecast(t *testing.T) {
	service := &ForecastingService{}
	
	// 模擬有趨勢的歷史資料
	data := []models.HistoricalSalesData{
		{Date: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), Amount: 100},
		{Date: time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC), Amount: 105},
		{Date: time.Date(2024, 1, 3, 0, 0, 0, 0, time.UTC), Amount: 110},
		{Date: time.Date(2024, 1, 4, 0, 0, 0, 0, time.UTC), Amount: 115},
		{Date: time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC), Amount: 120},
	}
	
	forecasts, err := service.exponentialSmoothingForecast(data, 3)
	
	if err != nil {
		t.Fatalf("指數平滑預測失敗: %v", err)
	}
	
	if len(forecasts) != 3 {
		t.Errorf("預期 3 個預測點，實際得到 %d 個", len(forecasts))
	}
	
	// 檢查預測值是否呈現上升趨勢
	for i := 1; i < len(forecasts); i++ {
		if forecasts[i].PredictedValue <= forecasts[i-1].PredictedValue {
			t.Errorf("指數平滑應該反映上升趨勢，但預測點 %d 的值 (%f) 不大於前一點 (%f)", 
				i, forecasts[i].PredictedValue, forecasts[i-1].PredictedValue)
		}
	}
}

// TestLinearRegressionForecast 測試線性回歸預測
func TestLinearRegressionForecast(t *testing.T) {
	service := &ForecastingService{}
	
	// 模擬線性趨勢資料
	data := []models.HistoricalSalesData{
		{Date: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), Amount: 100},
		{Date: time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC), Amount: 110},
		{Date: time.Date(2024, 1, 3, 0, 0, 0, 0, time.UTC), Amount: 120},
		{Date: time.Date(2024, 1, 4, 0, 0, 0, 0, time.UTC), Amount: 130},
		{Date: time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC), Amount: 140},
	}
	
	forecasts, err := service.linearRegressionForecast(data, 3)
	
	if err != nil {
		t.Fatalf("線性回歸預測失敗: %v", err)
	}
	
	if len(forecasts) != 3 {
		t.Errorf("預期 3 個預測點，實際得到 %d 個", len(forecasts))
	}
	
	// 檢查線性趨勢
	expectedIncrease := 10.0 // 每天增長 10
	tolerance := 5.0
	
	for i := 1; i < len(forecasts); i++ {
		actualIncrease := forecasts[i].PredictedValue - forecasts[i-1].PredictedValue
		if actualIncrease < expectedIncrease-tolerance || actualIncrease > expectedIncrease+tolerance {
			t.Errorf("線性回歸預測的增長幅度不正確，預期約 %f，實際 %f", 
				expectedIncrease, actualIncrease)
		}
	}
}

// TestCalculateOptimalWindowSize 測試最適窗口大小計算
func TestCalculateOptimalWindowSize(t *testing.T) {
	service := &ForecastingService{}
	
	testCases := []struct {
		dataLength   int
		expectedSize int
	}{
		{dataLength: 10, expectedSize: 5},
		{dataLength: 30, expectedSize: 7},
		{dataLength: 60, expectedSize: 10},
		{dataLength: 90, expectedSize: 14},
		{dataLength: 120, expectedSize: 14},
	}
	
	for _, tc := range testCases {
		data := make([]models.HistoricalSalesData, tc.dataLength)
		windowSize := service.calculateOptimalWindowSize(data)
		
		if windowSize != tc.expectedSize {
			t.Errorf("資料長度 %d 的最適窗口大小應為 %d，實際為 %d", 
				tc.dataLength, tc.expectedSize, windowSize)
		}
	}
}

// TestSelectBestModel 測試最佳模型選擇
func TestSelectBestModel(t *testing.T) {
	service := &ForecastingService{
		dataExtractor: &DataExtractionService{},
	}
	
	// 測試少量資料
	shortData := make([]models.HistoricalSalesData, 20)
	for i := range shortData {
		shortData[i] = models.HistoricalSalesData{
			Date:   time.Date(2024, 1, i+1, 0, 0, 0, 0, time.UTC),
			Amount: float64(100 + i),
		}
	}
	
	model := service.selectBestModel(shortData)
	if model != models.ModelTypeMovingAverage {
		t.Errorf("少量資料應選擇移動平均模型，實際選擇 %s", model)
	}
	
	// 測試大量穩定資料
	stableData := make([]models.HistoricalSalesData, 60)
	for i := range stableData {
		stableData[i] = models.HistoricalSalesData{
			Date:   time.Date(2024, 1, i+1, 0, 0, 0, 0, time.UTC),
			Amount: 100.0, // 穩定值
		}
	}
	
	model = service.selectBestModel(stableData)
	if model != models.ModelTypeLinearRegression {
		t.Errorf("大量穩定資料應選擇線性回歸模型，實際選擇 %s", model)
	}
}

// TestGenerateRequestID 測試請求 ID 生成
func TestGenerateRequestID(t *testing.T) {
	service := &ForecastingService{}
	
	productID := int64(1)
	req := models.SalesForecastRequest{
		ProductID:    &productID,
		StartDate:    time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		EndDate:      time.Date(2024, 1, 31, 0, 0, 0, 0, time.UTC),
		ForecastDays: 30,
		ModelType:    models.ModelTypeMovingAverage,
	}
	
	id1 := service.generateRequestID(req)
	id2 := service.generateRequestID(req)
	
	// 相同請求應產生相同 ID
	if id1 != id2 {
		t.Errorf("相同請求應產生相同 ID，id1=%s, id2=%s", id1, id2)
	}
	
	// 不同請求應產生不同 ID
	req.ForecastDays = 60
	id3 := service.generateRequestID(req)
	
	if id1 == id3 {
		t.Errorf("不同請求應產生不同 ID，id1=%s, id3=%s", id1, id3)
	}
	
	// 檢查 ID 格式
	if len(id1) != 32 {
		t.Errorf("請求 ID 應為 32 字符的 MD5 雜湊，實際長度 %d", len(id1))
	}
}

// TestBacktestMovingAverage 測試移動平均回測
func TestBacktestMovingAverage(t *testing.T) {
	service := &ForecastingService{}
	
	trainData := []models.HistoricalSalesData{
		{Date: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), Amount: 100},
		{Date: time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC), Amount: 110},
		{Date: time.Date(2024, 1, 3, 0, 0, 0, 0, time.UTC), Amount: 120},
	}
	
	testData := []models.HistoricalSalesData{
		{Date: time.Date(2024, 1, 4, 0, 0, 0, 0, time.UTC), Amount: 130},
		{Date: time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC), Amount: 125},
	}
	
	predictions := service.backtestMovingAverage(trainData, testData)
	
	if len(predictions) != len(testData) {
		t.Errorf("預測數量應等於測試資料數量，預期 %d，實際 %d", 
			len(testData), len(predictions))
	}
	
	// 檢查預測值是否合理
	for i, pred := range predictions {
		if pred <= 0 {
			t.Errorf("預測點 %d 的值應大於 0，實際為 %f", i, pred)
		}
	}
}