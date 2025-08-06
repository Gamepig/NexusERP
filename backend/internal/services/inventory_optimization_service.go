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

// InventoryOptimizationService 提供庫存優化建議功能
type InventoryOptimizationService struct {
	db                 *sqlx.DB
	dataExtractor      *DataExtractionService
	forecastingService *ForecastingService
	defaultCacheTTL    time.Duration
}

// NewInventoryOptimizationService 建立新的庫存優化服務實例
func NewInventoryOptimizationService(db *sqlx.DB, dataExtractor *DataExtractionService, forecastingService *ForecastingService) *InventoryOptimizationService {
	return &InventoryOptimizationService{
		db:                 db,
		dataExtractor:      dataExtractor,
		forecastingService: forecastingService,
		defaultCacheTTL:    15 * time.Minute,
	}
}

// GenerateInventoryOptimization 產生庫存優化建議
func (s *InventoryOptimizationService) GenerateInventoryOptimization(req models.InventoryOptimizationRequest) (*models.InventoryOptimizationResponse, error) {
	// 生成請求 ID
	requestID := s.generateRequestID(req)
	
	// 檢查快取
	if req.UseCache {
		if cached, err := s.getCachedOptimization(requestID); err == nil && cached != nil {
			return cached, nil
		}
	}
	
	// 獲取目前庫存水準
	currentInventory, err := s.dataExtractor.GetCurrentInventoryLevels(req.ProductID, req.WarehouseID)
	if err != nil {
		return nil, fmt.Errorf("獲取目前庫存水準失敗: %w", err)
	}
	
	if len(currentInventory) == 0 {
		return nil, fmt.Errorf("沒有找到符合條件的庫存資料")
	}
	
	// 獲取歷史異動資料
	movementData, err := s.dataExtractor.GetInventoryMovementData(req)
	if err != nil {
		return nil, fmt.Errorf("獲取庫存異動資料失敗: %w", err)
	}
	
	// 獲取商品交期資訊
	leadTimes, err := s.dataExtractor.GetProductLeadTimes(req.ProductID)
	if err != nil {
		log.Printf("獲取商品交期失敗: %v", err)
		leadTimes = make(map[int64]int)
	}
	
	// 產生優化建議
	var recommendations []models.InventoryRecommendation
	var totalInventoryValue float64
	var potentialSavings float64
	var estimatedCarryingCost float64
	var productAnalyzed int
	var needingReorder int
	var overstocked int
	
	for _, inventory := range currentInventory {
		// 計算需求預測
		demandForecast, err := s.calculateDemandForecast(inventory.ProductID, inventory.WarehouseID, req.AnalysisDays)
		if err != nil {
			log.Printf("計算商品 %d 需求預測失敗: %v", inventory.ProductID, err)
			demandForecast = inventory.QuantityOnHand / 30 // 簡單估算
		}
		
		// 獲取該商品的交期
		leadTime := req.LeadTimeDays
		if productLeadTime, exists := leadTimes[inventory.ProductID]; exists {
			leadTime = productLeadTime
		}
		
		// 計算庫存優化參數
		recommendation := s.calculateInventoryParameters(
			inventory,
			demandForecast,
			float64(leadTime),
			req.ServiceLevel,
			movementData,
		)
		
		recommendations = append(recommendations, recommendation)
		
		// 累計統計資訊
		productAnalyzed++
		inventoryValue := inventory.QuantityOnHand * s.getProductUnitPrice(inventory.ProductID)
		totalInventoryValue += inventoryValue
		
		// 計算持有成本 (假設年持有成本率為 20%)
		carryingCostRate := 0.20
		estimatedCarryingCost += inventoryValue * carryingCostRate / 365 * float64(req.AnalysisDays)
		
		// 分類統計
		switch recommendation.RecommendedAction {
		case models.ActionOrderNow:
			needingReorder++
		case models.ActionReduceStock:
			overstocked++
			// 計算潛在節省（過多庫存的持有成本）
			excessStock := math.Max(0, inventory.QuantityOnHand-recommendation.OptimalOrderQuantity)
			excessValue := excessStock * s.getProductUnitPrice(inventory.ProductID)
			potentialSavings += excessValue * carryingCostRate / 365 * 30 // 30天的持有成本
		}
	}
	
	// 計算風險評估
	stockoutRisk := s.calculateStockoutRisk(recommendations, req.ServiceLevel)
	
	// 建立回應
	response := &models.InventoryOptimizationResponse{
		RequestID:       requestID,
		ProductID:       req.ProductID,
		WarehouseID:     req.WarehouseID,
		BusinessUnitID:  req.BusinessUnitID,
		Recommendations: recommendations,
		Summary: models.InventoryOptimizationSummary{
			TotalProductsAnalyzed:    productAnalyzed,
			ProductsNeedingReorder:   needingReorder,
			ProductsOverstocked:      overstocked,
			TotalInventoryValue:      totalInventoryValue,
			PotentialSavings:         potentialSavings,
			EstimatedCarryingCost:    estimatedCarryingCost,
			EstimatedStockoutRisk:    stockoutRisk,
		},
		GeneratedAt: time.Now(),
	}
	
	// 儲存優化結果到資料庫
	if err := s.saveOptimizationResults(response); err != nil {
		log.Printf("儲存優化結果失敗: %v", err)
	}
	
	// 快取結果
	if req.UseCache {
		cacheUntil := time.Now().Add(s.defaultCacheTTL)
		response.CachedUntil = &cacheUntil
		if err := s.setCachedOptimization(requestID, response); err != nil {
			log.Printf("快取優化結果失敗: %v", err)
		}
	}
	
	return response, nil
}

// calculateInventoryParameters 計算庫存優化參數
func (s *InventoryOptimizationService) calculateInventoryParameters(
	inventory InventoryLevel,
	avgDailyDemand float64,
	leadTimeDays float64,
	serviceLevel float64,
	movementData []models.InventoryMovementData,
) models.InventoryRecommendation {
	
	// 計算需求變異性
	demandVariability := s.calculateDemandVariability(inventory.ProductID, inventory.WarehouseID, movementData)
	
	// 計算安全庫存
	// 使用正態分布的安全庫存公式：SS = Z * σ * √(L)
	// 其中 Z 是服務水準對應的 Z 值，σ 是需求標準差，L 是交期
	zScore := s.getZScoreForServiceLevel(serviceLevel)
	safetyStock := zScore * demandVariability * math.Sqrt(leadTimeDays)
	
	// 計算補貨點
	// ROP = (平均日需求 * 交期) + 安全庫存
	reorderPoint := (avgDailyDemand * leadTimeDays) + safetyStock
	
	// 計算經濟訂購量 (EOQ)
	// 簡化的 EOQ 公式：EOQ = √(2 * D * S / H)
	// 其中 D 是年需求，S 是訂購成本，H 是持有成本
	annualDemand := avgDailyDemand * 365
	orderingCost := 100.0 // 假設訂購成本為 100 元
	holdingCostRate := 0.20 // 年持有成本率 20%
	unitPrice := s.getProductUnitPrice(inventory.ProductID)
	holdingCost := unitPrice * holdingCostRate
	
	var eoq float64
	if holdingCost > 0 {
		eoq = math.Sqrt((2 * annualDemand * orderingCost) / holdingCost)
	} else {
		eoq = avgDailyDemand * 30 // 預設 30 天供應量
	}
	
	// 確保 EOQ 不會太小
	minOrderQuantity := avgDailyDemand * 7 // 至少 7 天供應量
	if eoq < minOrderQuantity {
		eoq = minOrderQuantity
	}
	
	// 計算庫存天數
	daysOfStock := 0.0
	if avgDailyDemand > 0 {
		daysOfStock = inventory.QuantityOnHand / avgDailyDemand
	}
	
	// 決定建議行動
	action := models.ActionMonitor
	priority := models.PriorityLow
	
	if inventory.QuantityOnHand <= reorderPoint {
		action = models.ActionOrderNow
		if inventory.QuantityOnHand <= safetyStock {
			priority = models.PriorityHigh
		} else {
			priority = models.PriorityMedium
		}
	} else if daysOfStock > 90 && inventory.QuantityOnHand > eoq*2 {
		action = models.ActionReduceStock
		priority = models.PriorityMedium
	}
	
	return models.InventoryRecommendation{
		ProductID:            inventory.ProductID,
		ProductName:          inventory.ProductName,
		WarehouseID:          inventory.WarehouseID,
		WarehouseName:        inventory.WarehouseName,
		CurrentStock:         inventory.QuantityOnHand,
		ReorderPoint:         reorderPoint,
		SafetyStock:          safetyStock,
		OptimalOrderQuantity: eoq,
		RecommendedAction:    action,
		EstimatedDemand:      avgDailyDemand,
		DaysOfStock:          daysOfStock,
		Priority:             priority,
	}
}

// calculateDemandForecast 計算需求預測
func (s *InventoryOptimizationService) calculateDemandForecast(productID, warehouseID int64, analysisDays int) (float64, error) {
	// 構建銷售預測請求
	forecastReq := models.SalesForecastRequest{
		ProductID:    &productID,
		StartDate:    time.Now().AddDate(0, 0, -analysisDays),
		EndDate:      time.Now(),
		ForecastDays: 30, // 預測未來 30 天
		ModelType:    models.ModelTypeMovingAverage,
		UseCache:     true,
	}
	
	// 獲取銷售預測
	forecast, err := s.forecastingService.GenerateSalesForecast(forecastReq)
	if err != nil {
		return 0, fmt.Errorf("獲取銷售預測失敗: %w", err)
	}
	
	// 計算平均日需求
	if len(forecast.Forecasts) == 0 {
		return 0, fmt.Errorf("沒有預測資料")
	}
	
	totalDemand := 0.0
	for _, f := range forecast.Forecasts {
		totalDemand += f.PredictedValue
	}
	
	avgDailyDemand := totalDemand / float64(len(forecast.Forecasts))
	
	// 轉換銷售額為數量（假設使用平均單價）
	unitPrice := s.getProductUnitPrice(productID)
	if unitPrice > 0 {
		return avgDailyDemand / unitPrice, nil
	}
	
	return avgDailyDemand, nil
}

// calculateDemandVariability 計算需求變異性
func (s *InventoryOptimizationService) calculateDemandVariability(productID, warehouseID int64, movementData []models.InventoryMovementData) float64 {
	// 找出該商品在該倉庫的歷史異動資料
	var productMovements []float64
	for _, movement := range movementData {
		if movement.ProductID == productID && movement.WarehouseID == warehouseID {
			productMovements = append(productMovements, movement.Outbound)
		}
	}
	
	if len(productMovements) < 2 {
		return 1.0 // 預設變異性
	}
	
	// 計算標準差
	sum := 0.0
	for _, demand := range productMovements {
		sum += demand
	}
	mean := sum / float64(len(productMovements))
	
	varianceSum := 0.0
	for _, demand := range productMovements {
		diff := demand - mean
		varianceSum += diff * diff
	}
	variance := varianceSum / float64(len(productMovements)-1)
	stdDev := math.Sqrt(variance)
	
	return stdDev
}

// getZScoreForServiceLevel 根據服務水準獲取 Z 分數
func (s *InventoryOptimizationService) getZScoreForServiceLevel(serviceLevel float64) float64 {
	// 常見服務水準對應的 Z 分數
	zScores := map[float64]float64{
		0.80: 0.84,
		0.85: 1.04,
		0.90: 1.28,
		0.95: 1.65,
		0.975: 1.96,
		0.99: 2.33,
		0.995: 2.58,
	}
	
	// 找最接近的服務水準
	if z, exists := zScores[serviceLevel]; exists {
		return z
	}
	
	// 使用線性插值
	var lowerLevel, upperLevel float64
	var lowerZ, upperZ float64
	
	levels := []float64{0.80, 0.85, 0.90, 0.95, 0.975, 0.99, 0.995}
	for i, level := range levels {
		if serviceLevel <= level {
			if i == 0 {
				return zScores[level]
			}
			lowerLevel = levels[i-1]
			upperLevel = level
			lowerZ = zScores[lowerLevel]
			upperZ = zScores[upperLevel]
			break
		}
	}
	
	if upperLevel == 0 {
		return zScores[0.995] // 最高服務水準
	}
	
	// 線性插值
	ratio := (serviceLevel - lowerLevel) / (upperLevel - lowerLevel)
	return lowerZ + ratio*(upperZ-lowerZ)
}

// getProductUnitPrice 獲取商品單價
func (s *InventoryOptimizationService) getProductUnitPrice(productID int64) float64 {
	var price sql.NullFloat64
	query := "SELECT selling_price FROM products WHERE id = $1"
	err := s.db.Get(&price, query, productID)
	if err != nil || !price.Valid {
		return 100.0 // 預設價格
	}
	return price.Float64
}

// calculateStockoutRisk 計算缺貨風險
func (s *InventoryOptimizationService) calculateStockoutRisk(recommendations []models.InventoryRecommendation, serviceLevel float64) float64 {
	if len(recommendations) == 0 {
		return 0
	}
	
	riskProducts := 0
	for _, rec := range recommendations {
		if rec.CurrentStock <= rec.SafetyStock {
			riskProducts++
		}
	}
	
	baseRisk := float64(riskProducts) / float64(len(recommendations))
	
	// 調整風險基於服務水準
	adjustedRisk := baseRisk * (1.0 - serviceLevel)
	
	return math.Min(adjustedRisk, 1.0)
}

// 快取相關方法

// generateRequestID 生成請求 ID
func (s *InventoryOptimizationService) generateRequestID(req models.InventoryOptimizationRequest) string {
	data := fmt.Sprintf("%v-%v-%v-%d-%d-%f",
		req.ProductID, req.WarehouseID, req.BusinessUnitID,
		req.AnalysisDays, req.LeadTimeDays, req.ServiceLevel)
	
	hash := md5.Sum([]byte(data))
	return fmt.Sprintf("%x", hash)
}

// getCachedOptimization 獲取快取的優化結果
func (s *InventoryOptimizationService) getCachedOptimization(requestID string) (*models.InventoryOptimizationResponse, error) {
	query := `
		SELECT report_key, data, expires_at 
		FROM report_cache 
		WHERE report_key = $1 AND report_type = 'inventory_optimization' AND expires_at > NOW()
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
	
	var response models.InventoryOptimizationResponse
	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}
	
	response.CachedUntil = &expiresAt
	return &response, nil
}

// setCachedOptimization 設定快取的優化結果
func (s *InventoryOptimizationService) setCachedOptimization(requestID string, response *models.InventoryOptimizationResponse) error {
	data, err := json.Marshal(response)
	if err != nil {
		return err
	}
	
	query := `
		INSERT INTO report_cache (report_key, report_type, data, expires_at)
		VALUES ($1, 'inventory_optimization', $2, $3)
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

// saveOptimizationResults 儲存優化結果到資料庫
func (s *InventoryOptimizationService) saveOptimizationResults(response *models.InventoryOptimizationResponse) error {
	// 儲存庫存建議為預測記錄
	for _, recommendation := range response.Recommendations {
		// 儲存補貨點建議
		query := `
			INSERT INTO predictions (
				prediction_type, target_entity_type, target_entity_id, 
				prediction_date, predicted_value, model_used
			) VALUES ($1, $2, $3, $4, $5, $6)
		`
		
		_, err := s.db.Exec(query,
			models.PredictionTypeInventory,
			models.TargetEntityTypeProduct,
			recommendation.ProductID,
			time.Now().AddDate(0, 0, 1), // 明天的建議
			recommendation.ReorderPoint,
			"inventory_optimization",
		)
		
		if err != nil {
			log.Printf("儲存庫存優化結果失敗: %v", err)
		}
		
		// 同時儲存最佳訂購量建議
		_, err = s.db.Exec(query,
			models.PredictionTypeInventory,
			models.TargetEntityTypeProduct,
			recommendation.ProductID,
			time.Now().AddDate(0, 0, 1), // 明天的建議
			recommendation.OptimalOrderQuantity,
			"eoq_optimization",
		)
		
		if err != nil {
			log.Printf("儲存 EOQ 優化結果失敗: %v", err)
		}
	}
	
	return nil
}

// CalculateABCAnalysis 進行 ABC 分析
func (s *InventoryOptimizationService) CalculateABCAnalysis(warehouseID *int64, analysisDays int) (map[int64]string, error) {
	// 獲取商品銷售資料
	whereClause := "WHERE so.status NOT IN ('draft', 'cancelled')"
	args := []interface{}{}
	argIndex := 1
	
	// 時間範圍
	startDate := time.Now().AddDate(0, 0, -analysisDays)
	whereClause += fmt.Sprintf(" AND so.order_date >= $%d", argIndex)
	args = append(args, startDate)
	argIndex++
	
	// 倉庫篩選（通過業務單位關聯）
	if warehouseID != nil {
		whereClause += fmt.Sprintf(" AND w.id = $%d", argIndex)
		args = append(args, *warehouseID)
		argIndex++
	}
	
	query := fmt.Sprintf(`
		SELECT soi.product_id, SUM(soi.total_price) as total_sales
		FROM sales_orders so
		JOIN sales_order_items soi ON so.id = soi.sales_order_id
		JOIN products p ON soi.product_id = p.id
		LEFT JOIN warehouses w ON so.business_unit_id = w.business_unit_id
		%s
		GROUP BY soi.product_id
		ORDER BY total_sales DESC
	`, whereClause)
	
	type ProductSales struct {
		ProductID  int64   `db:"product_id"`
		TotalSales float64 `db:"total_sales"`
	}
	
	var productSales []ProductSales
	err := s.db.Select(&productSales, query, args...)
	if err != nil {
		return nil, fmt.Errorf("獲取商品銷售資料失敗: %w", err)
	}
	
	if len(productSales) == 0 {
		return make(map[int64]string), nil
	}
	
	// 計算累積銷售額
	totalSales := 0.0
	for _, ps := range productSales {
		totalSales += ps.TotalSales
	}
	
	// ABC 分類
	abcCategories := make(map[int64]string)
	cumulativeSales := 0.0
	
	for _, ps := range productSales {
		cumulativeSales += ps.TotalSales
		cumulativePercentage := cumulativeSales / totalSales
		
		if cumulativePercentage <= 0.8 {
			abcCategories[ps.ProductID] = "A" // 前 80% 銷售額
		} else if cumulativePercentage <= 0.95 {
			abcCategories[ps.ProductID] = "B" // 80%-95% 銷售額
		} else {
			abcCategories[ps.ProductID] = "C" // 95%-100% 銷售額
		}
	}
	
	return abcCategories, nil
}

// CalculateVEDAnalysis 進行 VED (Vital, Essential, Desirable) 分析
func (s *InventoryOptimizationService) CalculateVEDAnalysis(warehouseID *int64) (map[int64]string, error) {
	// 獲取商品缺貨歷史
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1
	
	if warehouseID != nil {
		whereClause += fmt.Sprintf(" AND warehouse_id = $%d", argIndex)
		args = append(args, *warehouseID)
		argIndex++
	}
	
	query := fmt.Sprintf(`
		SELECT product_id, 
		       COUNT(CASE WHEN stockout_occurred THEN 1 END) as stockout_count,
		       COUNT(*) as total_days,
		       AVG(outbound) as avg_demand
		FROM inventory_movement_data
		%s
		AND date >= CURRENT_DATE - INTERVAL '90 days'
		GROUP BY product_id
	`, whereClause)
	
	type ProductCriticality struct {
		ProductID     int64   `db:"product_id"`
		StockoutCount int     `db:"stockout_count"`
		TotalDays     int     `db:"total_days"`
		AvgDemand     float64 `db:"avg_demand"`
	}
	
	var productCriticality []ProductCriticality
	err := s.db.Select(&productCriticality, query, args...)
	if err != nil {
		return nil, fmt.Errorf("獲取商品關鍵性資料失敗: %w", err)
	}
	
	vedCategories := make(map[int64]string)
	
	for _, pc := range productCriticality {
		stockoutRate := float64(pc.StockoutCount) / float64(pc.TotalDays)
		
		// VED 分類邏輯
		if stockoutRate > 0.1 || pc.AvgDemand > 100 { // 缺貨率超過 10% 或需求量大
			vedCategories[pc.ProductID] = "V" // Vital - 關鍵商品
		} else if stockoutRate > 0.05 || pc.AvgDemand > 50 {
			vedCategories[pc.ProductID] = "E" // Essential - 重要商品
		} else {
			vedCategories[pc.ProductID] = "D" // Desirable - 一般商品
		}
	}
	
	return vedCategories, nil
}

// GenerateInventoryReport 產生庫存分析報告
func (s *InventoryOptimizationService) GenerateInventoryReport(warehouseID *int64, analysisDays int) (map[string]interface{}, error) {
	report := make(map[string]interface{})
	
	// ABC 分析
	abcAnalysis, err := s.CalculateABCAnalysis(warehouseID, analysisDays)
	if err != nil {
		log.Printf("ABC 分析失敗: %v", err)
	} else {
		report["abc_analysis"] = abcAnalysis
	}
	
	// VED 分析
	vedAnalysis, err := s.CalculateVEDAnalysis(warehouseID)
	if err != nil {
		log.Printf("VED 分析失敗: %v", err)
	} else {
		report["ved_analysis"] = vedAnalysis
	}
	
	// 庫存週轉率分析
	turnoverAnalysis, err := s.calculateInventoryTurnover(warehouseID, analysisDays)
	if err != nil {
		log.Printf("庫存週轉率分析失敗: %v", err)
	} else {
		report["turnover_analysis"] = turnoverAnalysis
	}
	
	report["generated_at"] = time.Now()
	report["analysis_period_days"] = analysisDays
	
	return report, nil
}

// calculateInventoryTurnover 計算庫存週轉率
func (s *InventoryOptimizationService) calculateInventoryTurnover(warehouseID *int64, analysisDays int) (map[string]float64, error) {
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1
	
	if warehouseID != nil {
		whereClause += fmt.Sprintf(" AND il.warehouse_id = $%d", argIndex)
		args = append(args, *warehouseID)
		argIndex++
	}
	
	// 計算期間內的出庫總量和平均庫存
	query := fmt.Sprintf(`
		SELECT 
			il.product_id,
			p.name as product_name,
			il.quantity_on_hand as current_stock,
			COALESCE(sales.total_outbound, 0) as total_outbound,
			COALESCE(sales.avg_stock, il.quantity_on_hand) as avg_stock
		FROM inventory_levels il
		JOIN products p ON il.product_id = p.id
		LEFT JOIN (
			SELECT 
				product_id,
				warehouse_id,
				SUM(outbound) as total_outbound,
				AVG(closing_stock) as avg_stock
			FROM inventory_movement_data
			WHERE date >= CURRENT_DATE - INTERVAL '%d days'
			GROUP BY product_id, warehouse_id
		) sales ON il.product_id = sales.product_id AND il.warehouse_id = sales.warehouse_id
		%s
	`, analysisDays, whereClause)
	
	type TurnoverData struct {
		ProductID     int64   `db:"product_id"`
		ProductName   string  `db:"product_name"`
		CurrentStock  float64 `db:"current_stock"`
		TotalOutbound float64 `db:"total_outbound"`
		AvgStock      float64 `db:"avg_stock"`
	}
	
	var turnoverData []TurnoverData
	err := s.db.Select(&turnoverData, query, args...)
	if err != nil {
		return nil, err
	}
	
	turnoverRates := make(map[string]float64)
	turnoverRates["high_turnover_products"] = 0
	turnoverRates["medium_turnover_products"] = 0
	turnoverRates["low_turnover_products"] = 0
	turnoverRates["average_turnover_rate"] = 0
	
	totalTurnover := 0.0
	validProducts := 0
	
	for _, td := range turnoverData {
		if td.AvgStock > 0 {
			// 年化週轉率 = (期間出庫量 / 期間天數 * 365) / 平均庫存
			annualizedTurnover := (td.TotalOutbound / float64(analysisDays) * 365) / td.AvgStock
			totalTurnover += annualizedTurnover
			validProducts++
			
			// 分類週轉率
			if annualizedTurnover > 12 { // 月轉一次以上
				turnoverRates["high_turnover_products"]++
			} else if annualizedTurnover > 4 { // 季轉一次以上
				turnoverRates["medium_turnover_products"]++
			} else {
				turnoverRates["low_turnover_products"]++
			}
		}
	}
	
	if validProducts > 0 {
		turnoverRates["average_turnover_rate"] = totalTurnover / float64(validProducts)
	}
	
	return turnoverRates, nil
}