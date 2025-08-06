package services

import (
	"testing"
	"time"

	"nexus-erp/backend/internal/models"
)

// TestFillMissingDates 測試填補缺失日期功能
func TestFillMissingDates(t *testing.T) {
	service := &DataExtractionService{}
	
	// 模擬有缺失日期的資料
	startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC)
	
	data := []models.HistoricalSalesData{
		{Date: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), Amount: 100, Quantity: 10},
		{Date: time.Date(2024, 1, 3, 0, 0, 0, 0, time.UTC), Amount: 150, Quantity: 15}, // 缺少 1/2
		{Date: time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC), Amount: 120, Quantity: 12}, // 缺少 1/4
	}
	
	result := service.fillMissingDates(data, startDate, endDate)
	
	// 檢查是否填補了所有日期
	expectedDays := 5
	if len(result) != expectedDays {
		t.Errorf("預期 %d 天的資料，實際得到 %d 天", expectedDays, len(result))
	}
	
	// 檢查缺失日期是否被正確填補
	expectedDates := []time.Time{
		time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC),
		time.Date(2024, 1, 3, 0, 0, 0, 0, time.UTC),
		time.Date(2024, 1, 4, 0, 0, 0, 0, time.UTC),
		time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC),
	}
	
	for i, expectedDate := range expectedDates {
		if !result[i].Date.Equal(expectedDate) {
			t.Errorf("日期 %d 不正確，預期 %v，實際 %v", 
				i, expectedDate, result[i].Date)
		}
	}
	
	// 檢查缺失日期的值是否為零
	if result[1].Amount != 0 || result[1].Quantity != 0 {
		t.Errorf("缺失日期（1/2）的值應為零，實際 Amount=%f, Quantity=%f", 
			result[1].Amount, result[1].Quantity)
	}
	
	if result[3].Amount != 0 || result[3].Quantity != 0 {
		t.Errorf("缺失日期（1/4）的值應為零，實際 Amount=%f, Quantity=%f", 
			result[3].Amount, result[3].Quantity)
	}
}

// TestCalculateSeasonality 測試季節性計算
func TestCalculateSeasonality(t *testing.T) {
	service := &DataExtractionService{}
	
	// 模擬一年的月度資料，12月銷售特別高
	data := []models.HistoricalSalesData{}
	
	// 第一年
	for month := 1; month <= 12; month++ {
		amount := 100.0
		if month == 12 { // 12月是旺季
			amount = 200.0
		}
		data = append(data, models.HistoricalSalesData{
			Date:   time.Date(2023, time.Month(month), 1, 0, 0, 0, 0, time.UTC),
			Amount: amount,
		})
	}
	
	// 第二年
	for month := 1; month <= 12; month++ {
		amount := 100.0
		if month == 12 { // 12月是旺季
			amount = 200.0
		}
		data = append(data, models.HistoricalSalesData{
			Date:   time.Date(2024, time.Month(month), 1, 0, 0, 0, 0, time.UTC),
			Amount: amount,
		})
	}
	
	seasonality := service.CalculateSeasonality(data)
	
	if seasonality == nil {
		t.Fatal("季節性計算應該返回結果")
	}
	
	// 12月的季節性指數應該大於1（高於平均）
	if seasonality[12] <= 1.0 {
		t.Errorf("12月的季節性指數應大於1，實際為 %f", seasonality[12])
	}
	
	// 其他月份的季節性指數應該小於1（低於平均）
	for month := 1; month <= 11; month++ {
		if seasonality[month] >= 1.0 {
			t.Errorf("月份 %d 的季節性指數應小於1，實際為 %f", month, seasonality[month])
		}
	}
}

// TestCalculateTrend 測試趨勢計算
func TestCalculateTrend(t *testing.T) {
	service := &DataExtractionService{}
	
	// 模擬上升趨勢資料
	data := []models.HistoricalSalesData{
		{Date: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), Amount: 100},
		{Date: time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC), Amount: 110},
		{Date: time.Date(2024, 1, 3, 0, 0, 0, 0, time.UTC), Amount: 120},
		{Date: time.Date(2024, 1, 4, 0, 0, 0, 0, time.UTC), Amount: 130},
		{Date: time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC), Amount: 140},
	}
	
	slope, intercept, err := service.CalculateTrend(data)
	
	if err != nil {
		t.Fatalf("趨勢計算失敗: %v", err)
	}
	
	// 檢查斜率是否為正（上升趨勢）
	if slope <= 0 {
		t.Errorf("上升趨勢的斜率應為正，實際為 %f", slope)
	}
	
	// 檢查斜率是否接近預期值（每天增長10）
	expectedSlope := 10.0
	tolerance := 1.0
	if slope < expectedSlope-tolerance || slope > expectedSlope+tolerance {
		t.Errorf("斜率應接近 %f，實際為 %f", expectedSlope, slope)
	}
	
	// 檢查截距是否合理
	if intercept < 90 || intercept > 110 {
		t.Errorf("截距應接近 100，實際為 %f", intercept)
	}
}

// TestCalculateVolatility 測試變異性計算
func TestCalculateVolatility(t *testing.T) {
	service := &DataExtractionService{}
	
	// 測試穩定資料（低變異性）
	stableData := []models.HistoricalSalesData{
		{Quantity: 100}, {Quantity: 100}, {Quantity: 100}, 
		{Quantity: 100}, {Quantity: 100},
	}
	
	volatility := service.CalculateVolatility(stableData)
	if volatility != 0 {
		t.Errorf("穩定資料的變異性應為0，實際為 %f", volatility)
	}
	
	// 測試波動資料（高變異性）
	volatileData := []models.HistoricalSalesData{
		{Quantity: 50}, {Quantity: 150}, {Quantity: 25}, 
		{Quantity: 175}, {Quantity: 100},
	}
	
	volatility = service.CalculateVolatility(volatileData)
	if volatility <= 0.1 {
		t.Errorf("波動資料的變異性應較高，實際為 %f", volatility)
	}
}

// TestGetDemandStatistics 測試需求統計計算
func TestGetDemandStatistics(t *testing.T) {
	service := &DataExtractionService{}
	
	data := []models.HistoricalSalesData{
		{Quantity: 80}, {Quantity: 90}, {Quantity: 100}, 
		{Quantity: 110}, {Quantity: 120},
	}
	
	stats := service.GetDemandStatistics(data)
	
	if stats == nil {
		t.Fatal("需求統計應該返回結果")
	}
	
	// 檢查基本統計
	expectedMean := 100.0
	if stats["mean"] != expectedMean {
		t.Errorf("平均值應為 %f，實際為 %f", expectedMean, stats["mean"])
	}
	
	expectedMedian := 100.0
	if stats["median"] != expectedMedian {
		t.Errorf("中位數應為 %f，實際為 %f", expectedMedian, stats["median"])
	}
	
	// 檢查最大值和最小值
	if stats["max"] != 120 {
		t.Errorf("最大值應為 120，實際為 %f", stats["max"])
	}
	
	if stats["min"] != 80 {
		t.Errorf("最小值應為 80，實際為 %f", stats["min"])
	}
	
	// 檢查標準差是否合理
	if stats["std_dev"] <= 0 {
		t.Errorf("標準差應大於0，實際為 %f", stats["std_dev"])
	}
}

// TestPercentile 測試百分位數計算
func TestPercentile(t *testing.T) {
	service := &DataExtractionService{}
	
	// 測試已排序的資料
	sortedData := []float64{10, 20, 30, 40, 50, 60, 70, 80, 90, 100}
	
	// 測試50%百分位數（中位數）
	p50 := service.percentile(sortedData, 0.5)
	expected := 55.0 // 第5和第6個值的平均
	if p50 != expected {
		t.Errorf("50%%百分位數應為 %f，實際為 %f", expected, p50)
	}
	
	// 測試90%百分位數
	p90 := service.percentile(sortedData, 0.9)
	if p90 < 90 {
		t.Errorf("90%%百分位數應接近90，實際為 %f", p90)
	}
	
	// 測試邊界情況
	p0 := service.percentile(sortedData, 0.0)
	if p0 != 10 {
		t.Errorf("0%%百分位數應為最小值10，實際為 %f", p0)
	}
	
	p100 := service.percentile(sortedData, 1.0)
	if p100 != 100 {
		t.Errorf("100%%百分位數應為最大值100，實際為 %f", p100)
	}
}

// TestValidateDataQuality 測試資料品質驗證
func TestValidateDataQuality(t *testing.T) {
	service := &DataExtractionService{}
	
	// 測試空資料
	emptyData := []models.HistoricalSalesData{}
	quality := service.ValidateDataQuality(emptyData)
	
	if quality["status"] != "error" {
		t.Errorf("空資料的狀態應為 error，實際為 %s", quality["status"])
	}
	
	// 測試良好資料
	goodData := make([]models.HistoricalSalesData, 60)
	for i := range goodData {
		goodData[i] = models.HistoricalSalesData{
			Date:     time.Date(2024, 1, i+1, 0, 0, 0, 0, time.UTC),
			Amount:   float64(100 + i),
			Quantity: float64(10 + i),
		}
	}
	
	quality = service.ValidateDataQuality(goodData)
	
	if quality["status"] != "good" {
		t.Errorf("良好資料的狀態應為 good，實際為 %s", quality["status"])
	}
	
	score, ok := quality["quality_score"].(float64)
	if !ok || score < 80 {
		t.Errorf("良好資料的品質分數應≥80，實際為 %v", quality["quality_score"])
	}
	
	// 測試有問題的資料（大量零值）
	poorData := make([]models.HistoricalSalesData, 30)
	for i := range poorData {
		// 大部分是零值
		amount := 0.0
		quantity := 0.0
		if i < 5 {
			amount = 100.0
			quantity = 10.0
		}
		
		poorData[i] = models.HistoricalSalesData{
			Date:     time.Date(2024, 1, i+1, 0, 0, 0, 0, time.UTC),
			Amount:   amount,
			Quantity: quantity,
		}
	}
	
	quality = service.ValidateDataQuality(poorData)
	
	if quality["status"] == "good" {
		t.Errorf("劣質資料的狀態不應為 good，實際為 %s", quality["status"])
	}
	
	zeroPercentage, ok := quality["zero_percentage"].(float64)
	if !ok || zeroPercentage < 80 {
		t.Errorf("劣質資料的零值百分比應很高，實際為 %v", quality["zero_percentage"])
	}
}