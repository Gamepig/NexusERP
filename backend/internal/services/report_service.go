package services

import (
	"crypto/md5"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"nexus-erp/backend/internal/models"
)

type ReportService struct {
	db *sqlx.DB
}

func NewReportService(db *sqlx.DB) *ReportService {
	return &ReportService{db: db}
}

// generateCacheKey 產生快取鍵
func (s *ReportService) generateCacheKey(reportType string, params map[string]interface{}) string {
	paramStr := ""
	if params != nil {
		paramBytes, _ := json.Marshal(params)
		paramStr = string(paramBytes)
	}
	
	hash := md5.Sum([]byte(reportType + paramStr))
	return fmt.Sprintf("%x", hash)
}

// getCachedReport 獲取快取報表
func (s *ReportService) getCachedReport(cacheKey string) (*models.ReportCache, error) {
	var cache models.ReportCache
	query := `
		SELECT id, report_key, report_type, data, parameters, expires_at, created_at, updated_at
		FROM report_cache 
		WHERE report_key = $1 AND expires_at > NOW()
	`
	
	err := s.db.Get(&cache, query, cacheKey)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &cache, err
}

// setCachedReport 設定快取報表
func (s *ReportService) setCachedReport(cacheKey, reportType string, data json.RawMessage, params map[string]interface{}, cacheDuration time.Duration) error {
	paramBytes, _ := json.Marshal(params)
	
	query := `
		INSERT INTO report_cache (report_key, report_type, data, parameters, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (report_key) 
		DO UPDATE SET 
			data = $3,
			parameters = $4,
			expires_at = $5,
			updated_at = NOW()
	`
	
	_, err := s.db.Exec(query, cacheKey, reportType, data, paramBytes, time.Now().Add(cacheDuration))
	return err
}

// GetSalesReport 獲取銷售報表
func (s *ReportService) GetSalesReport(req models.ReportRequest) (*models.ReportResponse, error) {
	cacheKey := s.generateCacheKey("sales", req.Parameters)
	
	// 檢查快取
	if req.UseCache {
		if cached, err := s.getCachedReport(cacheKey); err == nil && cached != nil {
			return &models.ReportResponse{
				ReportType:  "sales",
				Data:        cached.Data,
				GeneratedAt: cached.UpdatedAt,
				CachedUntil: &cached.ExpiresAt,
				Parameters:  req.Parameters,
			}, nil
		}
	}
	
	// 構建查詢條件
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1
	
	if req.DateFrom != nil {
		whereClause += fmt.Sprintf(" AND order_date >= $%d", argIndex)
		args = append(args, *req.DateFrom)
		argIndex++
	}
	
	if req.DateTo != nil {
		whereClause += fmt.Sprintf(" AND order_date <= $%d", argIndex)
		args = append(args, *req.DateTo)
		argIndex++
	}
	
	// 添加狀態過濾
	if status, ok := req.Parameters["status"].(string); ok && status != "" {
		whereClause += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}
	
	// 檢查是否為產品銷售分析報表
	if reportType, ok := req.Parameters["report_type"].(string); ok && reportType == "by_product" {
		return s.getProductSalesReport(req, whereClause, args)
	}
	
	// 獲取詳細資料
	query := fmt.Sprintf(`
		SELECT order_id, order_number, customer_id, customer_name, 
		       total_amount, status, order_date, order_month, order_quarter, order_year,
		       created_at, updated_at
		FROM sales_report_data 
		%s
		ORDER BY order_date DESC
	`, whereClause)
	
	var salesData []models.SalesReportData
	err := s.db.Select(&salesData, query, args...)
	if err != nil {
		return nil, fmt.Errorf("獲取銷售資料失敗: %w", err)
	}
	
	// 計算摘要
	summary, err := s.calculateSalesSummary(whereClause, args)
	if err != nil {
		return nil, fmt.Errorf("計算銷售摘要失敗: %w", err)
	}
	
	// 序列化資料
	dataBytes, _ := json.Marshal(salesData)
	summaryBytes, _ := json.Marshal(summary)
	
	// 快取結果
	if req.UseCache {
		s.setCachedReport(cacheKey, "sales", dataBytes, req.Parameters, 30*time.Minute)
	}
	
	return &models.ReportResponse{
		ReportType:  "sales",
		Data:        dataBytes,
		Summary:     summaryBytes,
		GeneratedAt: time.Now(),
		Parameters:  req.Parameters,
	}, nil
}

// calculateSalesSummary 計算銷售摘要
func (s *ReportService) calculateSalesSummary(whereClause string, args []interface{}) (*models.SalesReportSummary, error) {
	// 基本統計
	var summary models.SalesReportSummary
	
	basicQuery := fmt.Sprintf(`
		SELECT 
			COALESCE(SUM(total_amount), 0) as total_sales,
			COUNT(*) as order_count,
			COALESCE(AVG(total_amount), 0) as average_order_size
		FROM sales_report_data 
		%s
	`, whereClause)
	
	err := s.db.Get(&summary, basicQuery, args...)
	if err != nil {
		return nil, err
	}
	
	// 前五大客戶
	topCustomersQuery := fmt.Sprintf(`
		SELECT customer_name, SUM(total_amount) as total_amount
		FROM sales_report_data 
		%s AND customer_name IS NOT NULL
		GROUP BY customer_name
		ORDER BY total_amount DESC
		LIMIT 5
	`, whereClause)
	
	err = s.db.Select(&summary.TopCustomers, topCustomersQuery, args...)
	if err != nil {
		log.Printf("獲取前五大客戶失敗: %v", err)
		summary.TopCustomers = []struct {
			CustomerName string  `json:"customer_name" db:"customer_name"`
			TotalAmount  float64 `json:"total_amount" db:"total_amount"`
		}{}
	}
	
	// 月度銷售
	monthlyQuery := fmt.Sprintf(`
		SELECT 
			TO_CHAR(order_month, 'YYYY-MM') as month,
			SUM(total_amount) as sales
		FROM sales_report_data 
		%s
		GROUP BY order_month
		ORDER BY order_month DESC
		LIMIT 12
	`, whereClause)
	
	err = s.db.Select(&summary.SalesByMonth, monthlyQuery, args...)
	if err != nil {
		log.Printf("獲取月度銷售失敗: %v", err)
		summary.SalesByMonth = []struct {
			Month string  `json:"month" db:"month"`
			Sales float64 `json:"sales" db:"sales"`
		}{}
	}
	
	return &summary, nil
}

// GetInventoryReport 獲取庫存報表
func (s *ReportService) GetInventoryReport(req models.ReportRequest) (*models.ReportResponse, error) {
	cacheKey := s.generateCacheKey("inventory", req.Parameters)
	
	// 檢查快取
	if req.UseCache {
		if cached, err := s.getCachedReport(cacheKey); err == nil && cached != nil {
			return &models.ReportResponse{
				ReportType:  "inventory",
				Data:        cached.Data,
				GeneratedAt: cached.UpdatedAt,
				CachedUntil: &cached.ExpiresAt,
				Parameters:  req.Parameters,
			}, nil
		}
	}
	
	// 構建查詢條件
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1
	
	// 倉庫過濾
	if warehouseID, ok := req.Parameters["warehouse_id"].(string); ok && warehouseID != "" {
		whereClause += fmt.Sprintf(" AND warehouse_id = $%d", argIndex)
		if uuid, err := uuid.Parse(warehouseID); err == nil {
			args = append(args, uuid)
			argIndex++
		}
	}
	
	// 庫存狀態過濾
	if stockStatus, ok := req.Parameters["stock_status"].(string); ok && stockStatus != "" {
		whereClause += fmt.Sprintf(" AND stock_status = $%d", argIndex)
		args = append(args, stockStatus)
		argIndex++
	}
	
	// 獲取詳細資料
	query := fmt.Sprintf(`
		SELECT product_id, product_name, sku, category_name, warehouse_id, warehouse_name,
		       quantity, reserved_quantity, available_quantity, safety_stock, stock_status,
		       unit_price, inventory_value, last_updated
		FROM inventory_report_data 
		%s
		ORDER BY inventory_value DESC
	`, whereClause)
	
	var inventoryData []models.InventoryReportData
	err := s.db.Select(&inventoryData, query, args...)
	if err != nil {
		return nil, fmt.Errorf("獲取庫存資料失敗: %w", err)
	}
	
	// 計算摘要
	summary, err := s.calculateInventorySummary(whereClause, args)
	if err != nil {
		return nil, fmt.Errorf("計算庫存摘要失敗: %w", err)
	}
	
	// 序列化資料
	dataBytes, _ := json.Marshal(inventoryData)
	summaryBytes, _ := json.Marshal(summary)
	
	// 快取結果
	if req.UseCache {
		s.setCachedReport(cacheKey, "inventory", dataBytes, req.Parameters, 15*time.Minute)
	}
	
	return &models.ReportResponse{
		ReportType:  "inventory",
		Data:        dataBytes,
		Summary:     summaryBytes,
		GeneratedAt: time.Now(),
		Parameters:  req.Parameters,
	}, nil
}

// calculateInventorySummary 計算庫存摘要
func (s *ReportService) calculateInventorySummary(whereClause string, args []interface{}) (*models.InventoryReportSummary, error) {
	var summary models.InventoryReportSummary
	
	// 基本統計
	basicQuery := fmt.Sprintf(`
		SELECT 
			COUNT(*) as total_products,
			COALESCE(SUM(inventory_value), 0) as total_value,
			COUNT(CASE WHEN stock_status = 'low_stock' THEN 1 END) as low_stock_count,
			COUNT(CASE WHEN stock_status = 'out_of_stock' THEN 1 END) as out_of_stock_count
		FROM inventory_report_data 
		%s
	`, whereClause)
	
	err := s.db.Get(&summary, basicQuery, args...)
	if err != nil {
		return nil, err
	}
	
	// 前五大價值商品
	topValueQuery := fmt.Sprintf(`
		SELECT product_name, inventory_value as value
		FROM inventory_report_data 
		%s
		ORDER BY inventory_value DESC
		LIMIT 5
	`, whereClause)
	
	err = s.db.Select(&summary.TopValueProducts, topValueQuery, args...)
	if err != nil {
		log.Printf("獲取前五大價值商品失敗: %v", err)
		summary.TopValueProducts = []struct {
			ProductName string  `json:"product_name"`
			Value       float64 `json:"value"`
		}{}
	}
	
	// 庫存狀態分布
	statusQuery := fmt.Sprintf(`
		SELECT stock_status, COUNT(*) as count
		FROM inventory_report_data 
		%s
		GROUP BY stock_status
	`, whereClause)
	
	rows, err := s.db.Query(statusQuery, args...)
	if err == nil {
		defer rows.Close()
		summary.StockStatusBreakdown = make(map[string]int)
		for rows.Next() {
			var status string
			var count int
			if err := rows.Scan(&status, &count); err == nil {
				summary.StockStatusBreakdown[status] = count
			}
		}
	}
	
	// 計算庫存週轉率 (簡化版本)
	summary.InventoryTurnover = 0.0 // 需要歷史數據計算
	
	return &summary, nil
}

// GetFinancialReport 獲取財務報表
func (s *ReportService) GetFinancialReport(req models.ReportRequest) (*models.ReportResponse, error) {
	cacheKey := s.generateCacheKey("financial", req.Parameters)
	
	// 檢查快取
	if req.UseCache {
		if cached, err := s.getCachedReport(cacheKey); err == nil && cached != nil {
			return &models.ReportResponse{
				ReportType:  "financial",
				Data:        cached.Data,
				GeneratedAt: cached.UpdatedAt,
				CachedUntil: &cached.ExpiresAt,
				Parameters:  req.Parameters,
			}, nil
		}
	}
	
	// 獲取應收應付帳款資料
	arData, err := s.getARData(req)
	if err != nil {
		return nil, fmt.Errorf("獲取應收帳款資料失敗: %w", err)
	}
	
	apData, err := s.getAPData(req)
	if err != nil {
		return nil, fmt.Errorf("獲取應付帳款資料失敗: %w", err)
	}
	
	// 計算摘要
	summary, err := s.calculateFinancialSummary(arData, apData)
	if err != nil {
		return nil, fmt.Errorf("計算財務摘要失敗: %w", err)
	}
	
	// 組合資料
	financialData := map[string]interface{}{
		"accounts_receivable": arData,
		"accounts_payable":   apData,
	}
	
	// 序列化資料
	dataBytes, _ := json.Marshal(financialData)
	summaryBytes, _ := json.Marshal(summary)
	
	// 快取結果
	if req.UseCache {
		s.setCachedReport(cacheKey, "financial", dataBytes, req.Parameters, 30*time.Minute)
	}
	
	return &models.ReportResponse{
		ReportType:  "financial",
		Data:        dataBytes,
		Summary:     summaryBytes,
		GeneratedAt: time.Now(),
		Parameters:  req.Parameters,
	}, nil
}

// getARData 獲取應收帳款資料
func (s *ReportService) getARData(req models.ReportRequest) ([]models.ARReportData, error) {
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1
	
	if req.DateFrom != nil {
		whereClause += fmt.Sprintf(" AND created_at >= $%d", argIndex)
		args = append(args, *req.DateFrom)
		argIndex++
	}
	
	if req.DateTo != nil {
		whereClause += fmt.Sprintf(" AND created_at <= $%d", argIndex)
		args = append(args, *req.DateTo)
		argIndex++
	}
	
	if status, ok := req.Parameters["ar_status"].(string); ok && status != "" {
		whereClause += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}
	
	query := fmt.Sprintf(`
		SELECT ar_id, invoice_id, invoice_number, customer_id, customer_name,
		       original_amount, outstanding_amount, paid_amount, due_date, status,
		       days_overdue, created_at, updated_at
		FROM ar_report_data 
		%s
		ORDER BY due_date ASC
	`, whereClause)
	
	var arData []models.ARReportData
	err := s.db.Select(&arData, query, args...)
	return arData, err
}

// getAPData 獲取應付帳款資料
func (s *ReportService) getAPData(req models.ReportRequest) ([]models.APReportData, error) {
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1
	
	if req.DateFrom != nil {
		whereClause += fmt.Sprintf(" AND created_at >= $%d", argIndex)
		args = append(args, *req.DateFrom)
		argIndex++
	}
	
	if req.DateTo != nil {
		whereClause += fmt.Sprintf(" AND created_at <= $%d", argIndex)
		args = append(args, *req.DateTo)
		argIndex++
	}
	
	if status, ok := req.Parameters["ap_status"].(string); ok && status != "" {
		whereClause += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}
	
	query := fmt.Sprintf(`
		SELECT ap_id, invoice_id, invoice_number, supplier_id, supplier_name,
		       original_amount, outstanding_amount, paid_amount, due_date, status,
		       days_overdue, created_at, updated_at
		FROM ap_report_data 
		%s
		ORDER BY due_date ASC
	`, whereClause)
	
	var apData []models.APReportData
	err := s.db.Select(&apData, query, args...)
	return apData, err
}

// calculateFinancialSummary 計算財務摘要
func (s *ReportService) calculateFinancialSummary(arData []models.ARReportData, apData []models.APReportData) (*models.FinancialReportSummary, error) {
	var summary models.FinancialReportSummary
	
	// 計算應收帳款統計
	for _, ar := range arData {
		summary.TotalAR += ar.OutstandingAmount
		if ar.Status == "overdue" {
			summary.OverdueAR += ar.OutstandingAmount
		}
	}
	
	// 計算應付帳款統計
	for _, ap := range apData {
		summary.TotalAP += ap.OutstandingAmount
		if ap.Status == "overdue" {
			summary.OverdueAP += ap.OutstandingAmount
		}
	}
	
	// 現金流 = 應收 - 應付
	summary.CashFlow = summary.TotalAR - summary.TotalAP
	
	// 帳齡分析（簡化版本）
	summary.AgingBuckets = make(map[string]float64)
	summary.AgingBuckets["0-30"] = 0
	summary.AgingBuckets["31-60"] = 0
	summary.AgingBuckets["61-90"] = 0
	summary.AgingBuckets["90+"] = 0
	
	for _, ar := range arData {
		if ar.DaysOverdue <= 30 {
			summary.AgingBuckets["0-30"] += ar.OutstandingAmount
		} else if ar.DaysOverdue <= 60 {
			summary.AgingBuckets["31-60"] += ar.OutstandingAmount
		} else if ar.DaysOverdue <= 90 {
			summary.AgingBuckets["61-90"] += ar.OutstandingAmount
		} else {
			summary.AgingBuckets["90+"] += ar.OutstandingAmount
		}
	}
	
	// 週轉率計算（簡化版本，需要歷史數據）
	summary.ARTurnover = 0.0
	summary.APTurnover = 0.0
	
	return &summary, nil
}

// getProductSalesReport 獲取產品銷售分析報表
func (s *ReportService) getProductSalesReport(req models.ReportRequest, whereClause string, args []interface{}) (*models.ReportResponse, error) {
	// 構建產品銷售查詢
	productQuery := `
		SELECT 
			p.id as product_id,
			p.name as product_name,
			COALESCE(pc.name, '未分類') as category_name,
			COALESCE(SUM(soi.quantity), 0) as quantity_sold,
			COALESCE(SUM(soi.total_price), 0) as total_sales,
			COALESCE(AVG(soi.unit_price), 0) as average_price,
			COUNT(DISTINCT so.id) as order_count,
			ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(soi.total_price), 0) DESC) as rank
		FROM products p
		LEFT JOIN sales_order_items soi ON p.id = soi.product_id
		LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
		LEFT JOIN product_categories pc ON p.category_id = pc.id
		WHERE 1=1
	`
	
	// 重新構建 WHERE 條件 (針對 sales_orders 表)
	if len(args) > 0 {
		argIndex := 1
		if req.DateFrom != nil {
			productQuery += fmt.Sprintf(" AND so.created_at >= $%d", argIndex)
			argIndex++
		}
		if req.DateTo != nil {
			productQuery += fmt.Sprintf(" AND so.created_at <= $%d", argIndex)
			argIndex++
		}
		if status, ok := req.Parameters["status"].(string); ok && status != "" {
			productQuery += fmt.Sprintf(" AND so.status = $%d", argIndex)
		}
	}
	
	productQuery += `
		AND so.status IN ('completed', 'shipped', 'processing')
		GROUP BY p.id, p.name, pc.name
		HAVING SUM(soi.total_price) > 0
		ORDER BY total_sales DESC
	`
	
	// 執行產品銷售查詢
	var products []models.ProductSalesData
	err := s.db.Select(&products, productQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("獲取產品銷售資料失敗: %w", err)
	}
	
	// 構建類別銷售查詢
	categoryQuery := `
		SELECT 
			COALESCE(pc.name, '未分類') as category_name,
			SUM(soi.total_price) as total_sales,
			COUNT(DISTINCT p.id) as product_count
		FROM products p
		LEFT JOIN sales_order_items soi ON p.id = soi.product_id
		LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
		LEFT JOIN product_categories pc ON p.category_id = pc.id
		WHERE 1=1
	`
	
	// 重新應用 WHERE 條件
	if len(args) > 0 {
		argIndex := 1
		if req.DateFrom != nil {
			categoryQuery += fmt.Sprintf(" AND so.created_at >= $%d", argIndex)
			argIndex++
		}
		if req.DateTo != nil {
			categoryQuery += fmt.Sprintf(" AND so.created_at <= $%d", argIndex)
			argIndex++
		}
		if status, ok := req.Parameters["status"].(string); ok && status != "" {
			categoryQuery += fmt.Sprintf(" AND so.status = $%d", argIndex)
		}
	}
	
	categoryQuery += `
		AND so.status IN ('completed', 'shipped', 'processing')
		GROUP BY pc.name
		HAVING SUM(soi.total_price) > 0
		ORDER BY total_sales DESC
	`
	
	// 執行類別銷售查詢
	var categories []models.CategorySalesData
	err = s.db.Select(&categories, categoryQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("獲取類別銷售資料失敗: %w", err)
	}
	
	// 構建回應數據
	productSalesData := models.ProductSalesResponse{
		Products:   products,
		Categories: categories,
	}
	
	// 序列化數據
	dataBytes, _ := json.Marshal(productSalesData)
	
	// 構建產品銷售摘要
	summary := &models.SalesReportSummary{
		TotalSales:       0,
		OrderCount:       0,
		AverageOrderSize: 0,
		TopCustomers:     []struct {
			CustomerName string  `json:"customer_name" db:"customer_name"`
			TotalAmount  float64 `json:"total_amount" db:"total_amount"`
		}{},
		SalesByMonth: []struct {
			Month string  `json:"month" db:"month"`
			Sales float64 `json:"sales" db:"sales"`
		}{},
	}
	
	// 從產品數據計算摘要
	if len(products) > 0 {
		totalOrders := 0
		for _, product := range products {
			summary.TotalSales += product.TotalSales
			totalOrders += product.OrderCount
		}
		summary.OrderCount = totalOrders
		if totalOrders > 0 {
			summary.AverageOrderSize = summary.TotalSales / float64(totalOrders)
		}
	}
	
	summaryBytes, _ := json.Marshal(summary)
	
	// 快取結果
	if req.UseCache {
		cacheKey := s.generateCacheKey("sales_by_product", req.Parameters)
		s.setCachedReport(cacheKey, "sales_by_product", dataBytes, req.Parameters, 30*time.Minute)
	}
	
	return &models.ReportResponse{
		ReportType:  "sales",
		Data:        dataBytes,
		Summary:     summaryBytes,
		GeneratedAt: time.Now(),
		Parameters:  req.Parameters,
	}, nil
}

// ClearExpiredCache 清理過期快取
func (s *ReportService) ClearExpiredCache() error {
	query := "DELETE FROM report_cache WHERE expires_at <= NOW()"
	_, err := s.db.Exec(query)
	return err
}