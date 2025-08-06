package services

import (
	"crypto/md5"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"time"

	"github.com/jmoiron/sqlx"
	"nexus-erp/backend/internal/models"
)

// ForecastingService 提供銷售預測功能
type ForecastingService struct {
	db               *sqlx.DB
	dataExtractor    *DataExtractionService
	defaultCacheTTL  time.Duration
}

// NewForecastingService 建立新的預測服務實例
func NewForecastingService(db *sqlx.DB, dataExtractor *DataExtractionService) *ForecastingService {
	return &ForecastingService{
		db:              db,
		dataExtractor:   dataExtractor,
		defaultCacheTTL: 30 * time.Minute,
	}
}

// GenerateSalesForecast 產生銷售預測
func (s *ForecastingService) GenerateSalesForecast(req models.SalesForecastRequest) (*models.SalesForecastResponse, error) {
	// 生成請求 ID
	requestID := s.generateRequestID(req)
	
	// 檢查快取
	if req.UseCache {
		if cached, err := s.getCachedForecast(requestID); err == nil && cached != nil {
			return cached, nil
		}
	}
	
	// 獲取歷史資料
	historicalData, err := s.dataExtractor.GetHistoricalSalesData(req)
	if err != nil {
		return nil, fmt.Errorf("獲取歷史資料失敗: %w", err)
	}
	
	// 驗證資料品質
	quality := s.dataExtractor.ValidateDataQuality(historicalData)
	if quality["status"] == "error" {
		return nil, fmt.Errorf("資料品質檢查失敗: %s", quality["message"])
	}
	
	// 選擇預測模型
	modelType := req.ModelType
	if modelType == "" {
		modelType = s.selectBestModel(historicalData)
	}
	
	// 執行預測
	var forecasts []models.SalesForecastDataPoint
	switch modelType {
	case models.ModelTypeMovingAverage:
		forecasts, err = s.movingAverageForcast(historicalData, req.ForecastDays)
	case models.ModelTypeExponentialSmoothing:
		forecasts, err = s.exponentialSmoothingForecast(historicalData, req.ForecastDays)
	case models.ModelTypeLinearRegression:
		forecasts, err = s.linearRegressionForecast(historicalData, req.ForecastDays)
	default:
		forecasts, err = s.movingAverageForcast(historicalData, req.ForecastDays)
		modelType = models.ModelTypeMovingAverage
	}
	
	if err != nil {
		return nil, fmt.Errorf("預測計算失敗: %w", err)
	}
	
	// 計算準確度（如果有足夠的歷史資料）
	accuracy, err := s.calculateAccuracy(historicalData, modelType)
	if err != nil {
		log.Printf("計算準確度失敗: %v", err)
	}
	
	response := &models.SalesForecastResponse{
		RequestID:      requestID,
		ProductID:      req.ProductID,
		CategoryID:     req.CategoryID,
		BusinessUnitID: req.BusinessUnitID,
		ModelUsed:      modelType,
		Forecasts:      forecasts,
		Accuracy:       accuracy,
		GeneratedAt:    time.Now(),
	}
	
	// 儲存預測結果到資料庫
	if err := s.savePredictionResults(response); err != nil {
		log.Printf("儲存預測結果失敗: %v", err)
	}
	
	// 快取結果
	if req.UseCache {
		cacheUntil := time.Now().Add(s.defaultCacheTTL)
		response.CachedUntil = &cacheUntil
		if err := s.setCachedForecast(requestID, response); err != nil {
			log.Printf("快取預測結果失敗: %v", err)
		}
	}
	
	return response, nil
}

// movingAverageForcast 移動平均預測
func (s *ForecastingService) movingAverageForcast(data []models.HistoricalSalesData, forecastDays int) ([]models.SalesForecastDataPoint, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("無歷史資料可供預測")
	}
	
	// 動態決定窗口大小
	windowSize := s.calculateOptimalWindowSize(data)
	if windowSize > len(data) {
		windowSize = len(data)
	}
	
	// 計算最近 windowSize 天的平均值
	sum := 0.0
	for i := len(data) - windowSize; i < len(data); i++ {
		sum += data[i].Amount
	}
	average := sum / float64(windowSize)
	
	// 計算標準差用於信賴區間
	variance := 0.0
	for i := len(data) - windowSize; i < len(data); i++ {
		diff := data[i].Amount - average
		variance += diff * diff
	}
	stdDev := math.Sqrt(variance / float64(windowSize-1))
	
	// 生成預測結果
	var forecasts []models.SalesForecastDataPoint
	lastDate := data[len(data)-1].Date
	
	for i := 1; i <= forecastDays; i++ {
		forecastDate := lastDate.AddDate(0, 0, i)
		
		// 簡單的季節性調整
		seasonalityFactor := s.getSeasonalityFactor(data, forecastDate)
		adjustedForecast := average * seasonalityFactor
		
		// 95% 信賴區間
		margin := 1.96 * stdDev
		lowerBound := math.Max(0, adjustedForecast-margin)
		upperBound := adjustedForecast + margin
		
		forecast := models.SalesForecastDataPoint{
			Date:                    forecastDate,
			PredictedValue:         adjustedForecast,
			ConfidenceIntervalLower: &lowerBound,
			ConfidenceIntervalUpper: &upperBound,
		}
		forecasts = append(forecasts, forecast)
	}
	
	return forecasts, nil
}

// exponentialSmoothingForecast 指數平滑預測
func (s *ForecastingService) exponentialSmoothingForecast(data []models.HistoricalSalesData, forecastDays int) ([]models.SalesForecastDataPoint, error) {
	if len(data) < 2 {
		return nil, fmt.Errorf("指數平滑需要至少 2 個資料點")
	}
	
	// 平滑參數
	alpha := 0.3 // 水準平滑係數
	beta := 0.1  // 趨勢平滑係數
	
	// 初始值
	level := data[0].Amount
	trend := 0.0
	if len(data) > 1 {
		trend = data[1].Amount - data[0].Amount
	}
	
	// Holt 線性趨勢方法
	for i := 1; i < len(data); i++ {
		prevLevel := level
		level = alpha*data[i].Amount + (1-alpha)*(level+trend)
		trend = beta*(level-prevLevel) + (1-beta)*trend
	}
	
	// 計算預測誤差用於信賴區間
	errors := make([]float64, 0)
	testLevel := data[0].Amount
	testTrend := 0.0
	if len(data) > 1 {
		testTrend = data[1].Amount - data[0].Amount
	}
	
	for i := 1; i < len(data); i++ {
		predicted := testLevel + testTrend
		actual := data[i].Amount
		errors = append(errors, math.Abs(actual-predicted))
		
		prevLevel := testLevel
		testLevel = alpha*actual + (1-alpha)*(testLevel+testTrend)
		testTrend = beta*(testLevel-prevLevel) + (1-beta)*testTrend
	}
	
	// 計算平均絕對誤差
	mae := 0.0
	if len(errors) > 0 {
		sum := 0.0
		for _, err := range errors {
			sum += err
		}
		mae = sum / float64(len(errors))
	}
	
	// 生成預測
	var forecasts []models.SalesForecastDataPoint
	lastDate := data[len(data)-1].Date
	
	for i := 1; i <= forecastDays; i++ {
		forecastDate := lastDate.AddDate(0, 0, i)
		
		// 預測值 = 水準 + 趨勢 * 期數
		predicted := level + trend*float64(i)
		
		// 季節性調整
		seasonalityFactor := s.getSeasonalityFactor(data, forecastDate)
		adjustedForecast := predicted * seasonalityFactor
		
		// 信賴區間（基於 MAE）
		margin := 1.96 * mae
		lowerBound := math.Max(0, adjustedForecast-margin)
		upperBound := adjustedForecast + margin
		
		forecast := models.SalesForecastDataPoint{
			Date:                    forecastDate,
			PredictedValue:         adjustedForecast,
			ConfidenceIntervalLower: &lowerBound,
			ConfidenceIntervalUpper: &upperBound,
		}
		forecasts = append(forecasts, forecast)
	}
	
	return forecasts, nil
}

// linearRegressionForecast 線性回歸預測
func (s *ForecastingService) linearRegressionForecast(data []models.HistoricalSalesData, forecastDays int) ([]models.SalesForecastDataPoint, error) {
	if len(data) < 2 {
		return nil, fmt.Errorf("線性回歸需要至少 2 個資料點")
	}
	
	// 計算線性回歸係數
	slope, intercept, err := s.dataExtractor.CalculateTrend(data)
	if err != nil {
		return nil, fmt.Errorf("計算線性趨勢失敗: %w", err)
	}
	
	// 計算殘差標準差
	residuals := make([]float64, 0)
	for i, item := range data {
		predicted := intercept + slope*float64(i)
		residual := item.Amount - predicted
		residuals = append(residuals, residual)
	}
	
	residualStdDev := 0.0
	if len(residuals) > 1 {
		mean := 0.0
		for _, r := range residuals {
			mean += r
		}
		mean /= float64(len(residuals))
		
		variance := 0.0
		for _, r := range residuals {
			diff := r - mean
			variance += diff * diff
		}
		residualStdDev = math.Sqrt(variance / float64(len(residuals)-1))
	}
	
	// 生成預測
	var forecasts []models.SalesForecastDataPoint
	lastDate := data[len(data)-1].Date
	dataLength := len(data)
	
	for i := 1; i <= forecastDays; i++ {
		forecastDate := lastDate.AddDate(0, 0, i)
		
		// 預測值
		x := float64(dataLength + i - 1)
		predicted := intercept + slope*x
		
		// 季節性調整
		seasonalityFactor := s.getSeasonalityFactor(data, forecastDate)
		adjustedForecast := predicted * seasonalityFactor
		
		// 信賴區間
		margin := 1.96 * residualStdDev
		lowerBound := math.Max(0, adjustedForecast-margin)
		upperBound := adjustedForecast + margin
		
		forecast := models.SalesForecastDataPoint{
			Date:                    forecastDate,
			PredictedValue:         adjustedForecast,
			ConfidenceIntervalLower: &lowerBound,
			ConfidenceIntervalUpper: &upperBound,
		}
		forecasts = append(forecasts, forecast)
	}
	
	return forecasts, nil
}

// calculateOptimalWindowSize 計算最適移動平均窗口大小
func (s *ForecastingService) calculateOptimalWindowSize(data []models.HistoricalSalesData) int {
	dataLength := len(data)
	
	// 基於資料長度決定窗口大小
	if dataLength >= 90 {
		return 14 // 2 週
	} else if dataLength >= 60 {
		return 10
	} else if dataLength >= 30 {
		return 7 // 1 週
	} else {
		return int(math.Min(float64(dataLength/2), 5))
	}
}

// getSeasonalityFactor 獲取季節性調整因子
func (s *ForecastingService) getSeasonalityFactor(data []models.HistoricalSalesData, forecastDate time.Time) float64 {
	// 簡化的季節性計算
	seasonality := s.dataExtractor.CalculateSeasonality(data)
	if seasonality == nil {
		return 1.0
	}
	
	month := int(forecastDate.Month())
	if factor, exists := seasonality[month]; exists {
		return factor
	}
	
	return 1.0
}

// selectBestModel 選擇最佳預測模型
func (s *ForecastingService) selectBestModel(data []models.HistoricalSalesData) string {
	dataLength := len(data)
	
	// 計算資料變異性
	volatility := s.dataExtractor.CalculateVolatility(data)
	
	// 檢查是否有明顯趨勢
	_, _, trendErr := s.dataExtractor.CalculateTrend(data)
	hasTrend := trendErr == nil
	
	// 模型選擇邏輯
	if dataLength < 30 {
		// 資料量少，使用簡單移動平均
		return models.ModelTypeMovingAverage
	}
	
	if volatility > 0.5 {
		// 高變異性，使用指數平滑
		return models.ModelTypeExponentialSmoothing
	}
	
	if hasTrend && dataLength >= 60 {
		// 有趨勢且資料充足，使用線性回歸
		return models.ModelTypeLinearRegression
	}
	
	// 預設使用指數平滑
	return models.ModelTypeExponentialSmoothing
}

// calculateAccuracy 計算模型準確度
func (s *ForecastingService) calculateAccuracy(data []models.HistoricalSalesData, modelType string) (*models.PredictionAccuracyInfo, error) {
	if len(data) < 14 {
		return nil, fmt.Errorf("資料不足以計算準確度")
	}
	
	// 使用後 30% 的資料作為測試集
	testSize := int(float64(len(data)) * 0.3)
	if testSize < 7 {
		testSize = 7
	}
	if testSize > len(data)/2 {
		testSize = len(data) / 2
	}
	
	trainData := data[:len(data)-testSize]
	testData := data[len(data)-testSize:]
	
	// 使用訓練資料進行預測
	var predictions []float64
	
	switch modelType {
	case models.ModelTypeMovingAverage:
		predictions = s.backtestMovingAverage(trainData, testData)
	case models.ModelTypeExponentialSmoothing:
		predictions = s.backtestExponentialSmoothing(trainData, testData)
	case models.ModelTypeLinearRegression:
		predictions = s.backtestLinearRegression(trainData, testData)
	default:
		predictions = s.backtestMovingAverage(trainData, testData)
	}
	
	// 計算準確度指標
	var mape, mae, rmse float64
	var validPredictions int
	
	for i, actual := range testData {
		if i >= len(predictions) {
			break
		}
		
		predicted := predictions[i]
		actualValue := actual.Amount
		
		if actualValue > 0 { // 避免除以零
			// MAPE (Mean Absolute Percentage Error)
			ape := math.Abs(actualValue-predicted) / actualValue
			mape += ape
			validPredictions++
		}
		
		// MAE (Mean Absolute Error)
		ae := math.Abs(actualValue - predicted)
		mae += ae
		
		// RMSE (Root Mean Square Error)
		se := math.Pow(actualValue-predicted, 2)
		rmse += se
	}
	
	if validPredictions == 0 {
		return nil, fmt.Errorf("無有效的預測資料計算準確度")
	}
	
	mape = mape / float64(validPredictions)
	mae = mae / float64(len(testData))
	rmse = math.Sqrt(rmse / float64(len(testData)))
	
	return &models.PredictionAccuracyInfo{
		MAPE:            mape,
		MAE:             mae,
		RMSE:            rmse,
		LastEvaluatedAt: time.Now(),
		SampleSize:      len(testData),
		ConfidenceLevel: 0.95,
	}, nil
}

// backtestMovingAverage 回測移動平均模型
func (s *ForecastingService) backtestMovingAverage(trainData, testData []models.HistoricalSalesData) []float64 {
	windowSize := s.calculateOptimalWindowSize(trainData)
	predictions := make([]float64, len(testData))
	
	// 合併訓練和測試資料進行滾動預測
	allData := append(trainData, testData...)
	
	for i := range testData {
		startIdx := len(trainData) + i - windowSize
		if startIdx < 0 {
			startIdx = 0
		}
		endIdx := len(trainData) + i
		
		sum := 0.0
		count := 0
		for j := startIdx; j < endIdx; j++ {
			sum += allData[j].Amount
			count++
		}
		
		if count > 0 {
			predictions[i] = sum / float64(count)
		}
	}
	
	return predictions
}

// backtestExponentialSmoothing 回測指數平滑模型
func (s *ForecastingService) backtestExponentialSmoothing(trainData, testData []models.HistoricalSalesData) []float64 {
	alpha := 0.3
	predictions := make([]float64, len(testData))
	
	// 初始化
	level := trainData[0].Amount
	
	// 用訓練資料初始化模型
	for i := 1; i < len(trainData); i++ {
		level = alpha*trainData[i].Amount + (1-alpha)*level
	}
	
	// 對測試資料進行預測
	for i := range testData {
		predictions[i] = level
		// 使用實際值更新模型（模擬線上學習）
		level = alpha*testData[i].Amount + (1-alpha)*level
	}
	
	return predictions
}

// backtestLinearRegression 回測線性回歸模型
func (s *ForecastingService) backtestLinearRegression(trainData, testData []models.HistoricalSalesData) []float64 {
	slope, intercept, err := s.dataExtractor.CalculateTrend(trainData)
	if err != nil {
		// 回退到移動平均
		return s.backtestMovingAverage(trainData, testData)
	}
	
	predictions := make([]float64, len(testData))
	trainLength := len(trainData)
	
	for i := range testData {
		x := float64(trainLength + i)
		predictions[i] = intercept + slope*x
	}
	
	return predictions
}

// 快取相關方法

// generateRequestID 生成請求 ID
func (s *ForecastingService) generateRequestID(req models.SalesForecastRequest) string {
	data := fmt.Sprintf("%v-%v-%v-%s-%s-%d-%s",
		req.ProductID, req.CategoryID, req.BusinessUnitID,
		req.StartDate.Format("2006-01-02"), req.EndDate.Format("2006-01-02"),
		req.ForecastDays, req.ModelType)
	
	hash := md5.Sum([]byte(data))
	return fmt.Sprintf("%x", hash)
}

// getCachedForecast 獲取快取的預測結果
func (s *ForecastingService) getCachedForecast(requestID string) (*models.SalesForecastResponse, error) {
	query := `
		SELECT report_key, data, expires_at 
		FROM report_cache 
		WHERE report_key = $1 AND report_type = 'forecast' AND expires_at > NOW()
	`
	
	var cacheKey string
	var data []byte
	var expiresAt time.Time
	
	err := s.db.QueryRow(query, requestID).Scan(&cacheKey, &data, &expiresAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	
	var response models.SalesForecastResponse
	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}
	
	response.CachedUntil = &expiresAt
	return &response, nil
}

// setCachedForecast 設定快取的預測結果
func (s *ForecastingService) setCachedForecast(requestID string, response *models.SalesForecastResponse) error {
	data, err := json.Marshal(response)
	if err != nil {
		return err
	}
	
	query := `
		INSERT INTO report_cache (report_key, report_type, data, expires_at)
		VALUES ($1, 'forecast', $2, $3)
		ON CONFLICT (report_key) 
		DO UPDATE SET 
			data = $2,
			expires_at = $3,
			updated_at = NOW()
	`
	
	expiresAt := time.Now().Add(s.defaultCacheTTL)
	_, err = s.db.Exec(query, requestID, data, expiresAt)
	return err
}

// savePredictionResults 儲存預測結果到資料庫
func (s *ForecastingService) savePredictionResults(response *models.SalesForecastResponse) error {
	// 決定目標實體類型和 ID
	var targetEntityType string
	var targetEntityID *int64
	
	if response.ProductID != nil {
		targetEntityType = models.TargetEntityTypeProduct
		targetEntityID = response.ProductID
	} else if response.CategoryID != nil {
		targetEntityType = models.TargetEntityTypeCategory
		targetEntityID = response.CategoryID
	} else {
		targetEntityType = models.TargetEntityTypeTotal
		targetEntityID = nil
	}
	
	// 儲存每個預測點
	for _, forecast := range response.Forecasts {
		query := `
			INSERT INTO predictions (
				prediction_type, target_entity_type, target_entity_id, 
				prediction_date, predicted_value, confidence_interval_lower, 
				confidence_interval_upper, model_used
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`
		
		_, err := s.db.Exec(query,
			models.PredictionTypeSales,
			targetEntityType,
			targetEntityID,
			forecast.Date,
			forecast.PredictedValue,
			forecast.ConfidenceIntervalLower,
			forecast.ConfidenceIntervalUpper,
			response.ModelUsed,
		)
		
		if err != nil {
			log.Printf("儲存預測結果失敗: %v", err)
			return err
		}
	}
	
	return nil
}

// GetPredictionHistory 獲取歷史預測記錄
func (s *ForecastingService) GetPredictionHistory(req models.PredictionHistoryRequest) (*models.PredictionHistoryResponse, error) {
	// 構建查詢條件
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1
	
	if req.PredictionType != "" {
		whereClause += fmt.Sprintf(" AND prediction_type = $%d", argIndex)
		args = append(args, req.PredictionType)
		argIndex++
	}
	
	if req.TargetEntityType != "" {
		whereClause += fmt.Sprintf(" AND target_entity_type = $%d", argIndex)
		args = append(args, req.TargetEntityType)
		argIndex++
	}
	
	if req.TargetEntityID != nil {
		whereClause += fmt.Sprintf(" AND target_entity_id = $%d", argIndex)
		args = append(args, *req.TargetEntityID)
		argIndex++
	}
	
	if req.DateFrom != nil {
		whereClause += fmt.Sprintf(" AND prediction_date >= $%d", argIndex)
		args = append(args, *req.DateFrom)
		argIndex++
	}
	
	if req.DateTo != nil {
		whereClause += fmt.Sprintf(" AND prediction_date <= $%d", argIndex)
		args = append(args, *req.DateTo)
		argIndex++
	}
	
	// 計算總數
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM predictions %s", whereClause)
	var total int64
	err := s.db.Get(&total, countQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("計算總數失敗: %w", err)
	}
	
	// 計算分頁
	offset := (req.Page - 1) * req.PageSize
	pages := int(math.Ceil(float64(total) / float64(req.PageSize)))
	
	// 獲取分頁資料
	query := fmt.Sprintf(`
		SELECT id, prediction_type, target_entity_type, target_entity_id,
		       prediction_date, predicted_value, confidence_interval_lower,
		       confidence_interval_upper, model_used, created_at
		FROM predictions 
		%s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d
	`, whereClause, req.SortBy, req.SortOrder, argIndex, argIndex+1)
	
	args = append(args, req.PageSize, offset)
	
	var predictions []models.Prediction
	err = s.db.Select(&predictions, query, args...)
	if err != nil {
		return nil, fmt.Errorf("獲取預測記錄失敗: %w", err)
	}
	
	// 轉換為帶詳細資訊的結構
	var predictionsWithDetails []models.PredictionWithDetails
	for _, p := range predictions {
		pwd := models.PredictionWithDetails{
			Prediction: p,
		}
		
		// 獲取目標實體名稱
		if p.TargetEntityID != nil {
			switch p.TargetEntityType {
			case models.TargetEntityTypeProduct:
				if name, err := s.getProductName(*p.TargetEntityID); err == nil {
					pwd.TargetEntityName = name
				}
			case models.TargetEntityTypeCategory:
				if name, err := s.getCategoryName(*p.TargetEntityID); err == nil {
					pwd.TargetEntityName = name
				}
			}
		}
		
		predictionsWithDetails = append(predictionsWithDetails, pwd)
	}
	
	return &models.PredictionHistoryResponse{
		Predictions: predictionsWithDetails,
		Total:       total,
		Page:        req.Page,
		PageSize:    req.PageSize,
		Pages:       pages,
	}, nil
}

// 輔助方法

// getProductName 獲取商品名稱
func (s *ForecastingService) getProductName(productID int64) (string, error) {
	var name string
	err := s.db.Get(&name, "SELECT name FROM products WHERE id = $1", productID)
	return name, err
}

// getCategoryName 獲取分類名稱
func (s *ForecastingService) getCategoryName(categoryID int64) (string, error) {
	var name string
	err := s.db.Get(&name, "SELECT name FROM product_categories WHERE id = $1", categoryID)
	return name, err
}