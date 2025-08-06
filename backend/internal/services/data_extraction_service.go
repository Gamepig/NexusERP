package services

import (
	"database/sql"
	"fmt"
	"log"
	"math"
	"sort"
	"time"

	"github.com/jmoiron/sqlx"
	"nexus-erp/backend/internal/models"
)

// DataExtractionService 負責從資料庫提取和預處理歷史資料用於預測
type DataExtractionService struct {
	db *sqlx.DB
}

// NewDataExtractionService 建立新的資料提取服務實例
func NewDataExtractionService(db *sqlx.DB) *DataExtractionService {
	return &DataExtractionService{db: db}
}

// GetHistoricalSalesData 提取歷史銷售資料用於預測
func (s *DataExtractionService) GetHistoricalSalesData(req models.SalesForecastRequest) ([]models.HistoricalSalesData, error) {
	// 構建查詢條件
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	// 產品篩選
	if req.ProductID != nil {
		whereClause += fmt.Sprintf(" AND product_id = $%d", argIndex)
		args = append(args, *req.ProductID)
		argIndex++
	}

	// 分類篩選
	if req.CategoryID != nil {
		whereClause += fmt.Sprintf(" AND category_id = $%d", argIndex)
		args = append(args, *req.CategoryID)
		argIndex++
	}

	// 業務單位篩選 (需要 JOIN sales_orders)
	if req.BusinessUnitID != nil {
		whereClause += fmt.Sprintf(" AND business_unit_id = $%d", argIndex)
		args = append(args, *req.BusinessUnitID)
		argIndex++
	}

	// 日期範圍篩選
	if !req.StartDate.IsZero() {
		whereClause += fmt.Sprintf(" AND date >= $%d", argIndex)
		args = append(args, req.StartDate)
		argIndex++
	}

	if !req.EndDate.IsZero() {
		whereClause += fmt.Sprintf(" AND date <= $%d", argIndex)
		args = append(args, req.EndDate)
		argIndex++
	}

	// 如果指定業務單位，需要額外的 JOIN
	query := ""
	if req.BusinessUnitID != nil {
		query = fmt.Sprintf(`
			SELECT hsd.date, hsd.product_id, hsd.category_id, 
			       SUM(hsd.quantity) as quantity, 
			       SUM(hsd.amount) as amount, 
			       SUM(hsd.order_count) as order_count
			FROM historical_sales_data hsd
			JOIN sales_orders so ON DATE(so.order_date) = hsd.date
			JOIN sales_order_items soi ON so.id = soi.sales_order_id AND soi.product_id = hsd.product_id
			%s
			GROUP BY hsd.date, hsd.product_id, hsd.category_id
			ORDER BY hsd.date ASC
		`, whereClause)
	} else {
		query = fmt.Sprintf(`
			SELECT date, product_id, category_id, quantity, amount, order_count
			FROM historical_sales_data
			%s
			ORDER BY date ASC
		`, whereClause)
	}

	var salesData []models.HistoricalSalesData
	err := s.db.Select(&salesData, query, args...)
	if err != nil {
		return nil, fmt.Errorf("提取歷史銷售資料失敗: %w", err)
	}

	// 資料預處理：填補缺失的日期
	if len(salesData) > 0 {
		salesData = s.fillMissingDates(salesData, req.StartDate, req.EndDate)
	}

	return salesData, nil
}

// GetInventoryMovementData 提取庫存異動資料用於庫存優化
func (s *DataExtractionService) GetInventoryMovementData(req models.InventoryOptimizationRequest) ([]models.InventoryMovementData, error) {
	// 構建查詢條件
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	// 產品篩選
	if req.ProductID != nil {
		whereClause += fmt.Sprintf(" AND product_id = $%d", argIndex)
		args = append(args, *req.ProductID)
		argIndex++
	}

	// 倉庫篩選
	if req.WarehouseID != nil {
		whereClause += fmt.Sprintf(" AND warehouse_id = $%d", argIndex)
		args = append(args, *req.WarehouseID)
		argIndex++
	}

	// 分析期間篩選
	analysisStartDate := time.Now().AddDate(0, 0, -req.AnalysisDays)
	whereClause += fmt.Sprintf(" AND date >= $%d", argIndex)
	args = append(args, analysisStartDate)
	argIndex++

	query := fmt.Sprintf(`
		SELECT date, product_id, warehouse_id, opening_stock, 
		       inbound, outbound, closing_stock, stockout_occurred
		FROM inventory_movement_data
		%s
		ORDER BY date ASC, product_id, warehouse_id
	`, whereClause)

	var movementData []models.InventoryMovementData
	err := s.db.Select(&movementData, query, args...)
	if err != nil {
		return nil, fmt.Errorf("提取庫存異動資料失敗: %w", err)
	}

	return movementData, nil
}

// InventoryLevel 庫存水準結構
type InventoryLevel struct {
	ProductID         int64   `db:"product_id"`
	WarehouseID       int64   `db:"warehouse_id"`
	ProductName       string  `db:"product_name"`
	WarehouseName     string  `db:"warehouse_name"`
	QuantityOnHand    float64 `db:"quantity_on_hand"`
	QuantityAvailable float64 `db:"quantity_available"`
	QuantityReserved  float64 `db:"quantity_reserved"`
	ReorderPoint      float64 `db:"reorder_point"`
}

// GetCurrentInventoryLevels 獲取目前庫存水準
func (s *DataExtractionService) GetCurrentInventoryLevels(productID *int64, warehouseID *int64) ([]InventoryLevel, error) {
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if productID != nil {
		whereClause += fmt.Sprintf(" AND il.product_id = $%d", argIndex)
		args = append(args, *productID)
		argIndex++
	}

	if warehouseID != nil {
		whereClause += fmt.Sprintf(" AND il.warehouse_id = $%d", argIndex)
		args = append(args, *warehouseID)
		argIndex++
	}

	query := fmt.Sprintf(`
		SELECT il.product_id, il.warehouse_id, p.name as product_name, w.name as warehouse_name,
		       il.quantity_on_hand, il.quantity_available, il.quantity_reserved,
		       COALESCE(il.reorder_point, 0) as reorder_point
		FROM inventory_levels il
		JOIN products p ON il.product_id = p.id
		JOIN warehouses w ON il.warehouse_id = w.id
		%s
		ORDER BY p.name, w.name
	`, whereClause)


	var levels []InventoryLevel
	err := s.db.Select(&levels, query, args...)
	return levels, err
}

// fillMissingDates 填補時間序列中缺失的日期
func (s *DataExtractionService) fillMissingDates(data []models.HistoricalSalesData, startDate, endDate time.Time) []models.HistoricalSalesData {
	if len(data) == 0 {
		return data
	}

	// 建立日期到資料的映射
	dataMap := make(map[string]models.HistoricalSalesData)
	for _, item := range data {
		key := item.Date.Format("2006-01-02")
		if existing, exists := dataMap[key]; exists {
			// 如果同一天有多筆資料，進行聚合
			existing.Quantity += item.Quantity
			existing.Amount += item.Amount
			existing.OrderCount += item.OrderCount
			dataMap[key] = existing
		} else {
			dataMap[key] = item
		}
	}

	// 建立完整的日期序列
	var result []models.HistoricalSalesData
	currentDate := startDate
	
	// 使用第一筆資料作為範本
	template := data[0]
	
	for !currentDate.After(endDate) {
		key := currentDate.Format("2006-01-02")
		if item, exists := dataMap[key]; exists {
			result = append(result, item)
		} else {
			// 填入零值
			zeroItem := models.HistoricalSalesData{
				Date:       currentDate,
				ProductID:  template.ProductID,
				CategoryID: template.CategoryID,
				Quantity:   0,
				Amount:     0,
				OrderCount: 0,
			}
			result = append(result, zeroItem)
		}
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	return result
}

// CalculateSeasonality 計算季節性指標
func (s *DataExtractionService) CalculateSeasonality(data []models.HistoricalSalesData) map[int]float64 {
	if len(data) == 0 {
		return nil
	}

	// 按月份分組計算平均值
	monthlyTotals := make(map[int][]float64)
	for _, item := range data {
		month := int(item.Date.Month())
		monthlyTotals[month] = append(monthlyTotals[month], item.Amount)
	}

	// 計算月度平均值
	monthlyAverages := make(map[int]float64)
	overallTotal := 0.0
	totalMonths := 0

	for month, values := range monthlyTotals {
		if len(values) > 0 {
			sum := 0.0
			for _, value := range values {
				sum += value
			}
			avg := sum / float64(len(values))
			monthlyAverages[month] = avg
			overallTotal += avg
			totalMonths++
		}
	}

	// 計算季節性指數（相對於年平均值）
	if totalMonths == 0 || overallTotal == 0 {
		return nil
	}

	yearlyAverage := overallTotal / float64(totalMonths)
	seasonalityIndex := make(map[int]float64)

	for month, avg := range monthlyAverages {
		seasonalityIndex[month] = avg / yearlyAverage
	}

	return seasonalityIndex
}

// CalculateTrend 計算趨勢指標（簡單線性趨勢）
func (s *DataExtractionService) CalculateTrend(data []models.HistoricalSalesData) (slope float64, intercept float64, err error) {
	if len(data) < 2 {
		return 0, 0, fmt.Errorf("需要至少 2 個資料點計算趨勢")
	}

	// 準備 X (天數) 和 Y (銷售額) 資料
	n := len(data)
	var sumX, sumY, sumXY, sumX2 float64

	for i, item := range data {
		x := float64(i) // 使用索引作為 X 值
		y := item.Amount
		sumX += x
		sumY += y
		sumXY += x * y
		sumX2 += x * x
	}

	// 計算線性回歸係數
	// slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX)
	// intercept = (sumY - slope*sumX) / n
	denominator := float64(n)*sumX2 - sumX*sumX
	if denominator == 0 {
		return 0, 0, fmt.Errorf("無法計算趨勢：分母為零")
	}

	slope = (float64(n)*sumXY - sumX*sumY) / denominator
	intercept = (sumY - slope*sumX) / float64(n)

	return slope, intercept, nil
}

// CalculateVolatility 計算需求變異性
func (s *DataExtractionService) CalculateVolatility(data []models.HistoricalSalesData) float64 {
	if len(data) <= 1 {
		return 0
	}

	// 計算平均值
	sum := 0.0
	for _, item := range data {
		sum += item.Quantity
	}
	mean := sum / float64(len(data))

	// 計算標準差
	varianceSum := 0.0
	for _, item := range data {
		diff := item.Quantity - mean
		varianceSum += diff * diff
	}
	variance := varianceSum / float64(len(data)-1)
	stdDev := math.Sqrt(variance)

	// 返回變異係數 (CV = 標準差 / 平均值)
	if mean == 0 {
		return 0
	}
	return stdDev / mean
}

// GetProductLeadTimes 獲取商品採購交期資訊
func (s *DataExtractionService) GetProductLeadTimes(productID *int64) (map[int64]int, error) {
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if productID != nil {
		whereClause += fmt.Sprintf(" AND poi.product_id = $%d", argIndex)
		args = append(args, *productID)
		argIndex++
	}

	// 計算平均交期：從採購單建立到收貨完成的平均天數
	query := fmt.Sprintf(`
		SELECT poi.product_id, 
		       AVG(EXTRACT(DAY FROM (po.updated_at - po.created_at))) as avg_lead_time_days
		FROM purchase_order_items poi
		JOIN purchase_orders po ON poi.purchase_order_id = po.id
		%s
		AND po.status = 'completed'
		AND poi.received_quantity > 0
		GROUP BY poi.product_id
	`, whereClause)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("查詢商品交期失敗: %w", err)
	}
	defer rows.Close()

	leadTimes := make(map[int64]int)
	for rows.Next() {
		var productID int64
		var avgLeadTime sql.NullFloat64
		if err := rows.Scan(&productID, &avgLeadTime); err != nil {
			log.Printf("掃描交期資料失敗: %v", err)
			continue
		}
		if avgLeadTime.Valid {
			leadTimes[productID] = int(math.Ceil(avgLeadTime.Float64))
		} else {
			leadTimes[productID] = 7 // 預設 7 天交期
		}
	}

	return leadTimes, nil
}

// GetDemandStatistics 計算需求統計資訊
func (s *DataExtractionService) GetDemandStatistics(data []models.HistoricalSalesData) map[string]float64 {
	if len(data) == 0 {
		return nil
	}

	stats := make(map[string]float64)
	
	// 提取需求資料
	demands := make([]float64, len(data))
	for i, item := range data {
		demands[i] = item.Quantity
	}

	// 排序以計算百分位數
	sortedDemands := make([]float64, len(demands))
	copy(sortedDemands, demands)
	sort.Float64s(sortedDemands)

	// 基本統計
	sum := 0.0
	for _, demand := range demands {
		sum += demand
	}
	mean := sum / float64(len(demands))
	stats["mean"] = mean

	// 中位數
	n := len(sortedDemands)
	if n%2 == 0 {
		stats["median"] = (sortedDemands[n/2-1] + sortedDemands[n/2]) / 2
	} else {
		stats["median"] = sortedDemands[n/2]
	}

	// 標準差
	varianceSum := 0.0
	for _, demand := range demands {
		diff := demand - mean
		varianceSum += diff * diff
	}
	if len(demands) > 1 {
		variance := varianceSum / float64(len(demands)-1)
		stats["std_dev"] = math.Sqrt(variance)
		stats["cv"] = stats["std_dev"] / mean // 變異係數
	}

	// 最大值和最小值
	stats["max"] = sortedDemands[n-1]
	stats["min"] = sortedDemands[0]

	// 百分位數
	stats["p95"] = s.percentile(sortedDemands, 0.95)
	stats["p90"] = s.percentile(sortedDemands, 0.90)
	stats["p75"] = s.percentile(sortedDemands, 0.75)
	stats["p25"] = s.percentile(sortedDemands, 0.25)

	return stats
}

// percentile 計算百分位數
func (s *DataExtractionService) percentile(sortedData []float64, p float64) float64 {
	if len(sortedData) == 0 {
		return 0
	}
	if p <= 0 {
		return sortedData[0]
	}
	if p >= 1 {
		return sortedData[len(sortedData)-1]
	}

	index := p * float64(len(sortedData)-1)
	lower := int(index)
	upper := lower + 1

	if upper >= len(sortedData) {
		return sortedData[lower]
	}

	weight := index - float64(lower)
	return sortedData[lower]*(1-weight) + sortedData[upper]*weight
}

// ValidateDataQuality 驗證資料品質
func (s *DataExtractionService) ValidateDataQuality(data []models.HistoricalSalesData) map[string]interface{} {
	quality := make(map[string]interface{})
	
	if len(data) == 0 {
		quality["status"] = "error"
		quality["message"] = "無資料"
		return quality
	}

	// 資料量檢查
	quality["total_records"] = len(data)
	
	// 零值檢查
	zeroCount := 0
	negativeCount := 0
	for _, item := range data {
		if item.Quantity == 0 && item.Amount == 0 {
			zeroCount++
		}
		if item.Quantity < 0 || item.Amount < 0 {
			negativeCount++
		}
	}
	
	quality["zero_records"] = zeroCount
	quality["negative_records"] = negativeCount
	quality["zero_percentage"] = float64(zeroCount) / float64(len(data)) * 100
	
	// 連續性檢查（檢查是否有很多連續的零值）
	maxConsecutiveZeros := 0
	currentConsecutiveZeros := 0
	for _, item := range data {
		if item.Quantity == 0 && item.Amount == 0 {
			currentConsecutiveZeros++
			if currentConsecutiveZeros > maxConsecutiveZeros {
				maxConsecutiveZeros = currentConsecutiveZeros
			}
		} else {
			currentConsecutiveZeros = 0
		}
	}
	quality["max_consecutive_zeros"] = maxConsecutiveZeros
	
	// 品質評分
	score := 100.0
	if quality["zero_percentage"].(float64) > 50 {
		score -= 30 // 零值太多
	} else if quality["zero_percentage"].(float64) > 20 {
		score -= 15
	}
	
	if negativeCount > 0 {
		score -= 20 // 有負值
	}
	
	if len(data) < 30 {
		score -= 25 // 資料量不足
	} else if len(data) < 90 {
		score -= 10
	}
	
	if maxConsecutiveZeros > 7 {
		score -= 15 // 連續零值太長
	}
	
	quality["quality_score"] = math.Max(0, score)
	
	if score >= 80 {
		quality["status"] = "good"
	} else if score >= 60 {
		quality["status"] = "fair"
	} else {
		quality["status"] = "poor"
	}
	
	return quality
}