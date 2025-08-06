package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"nexus-erp-fiber/internal/database"
	"nexus-erp-fiber/internal/models"

	"github.com/redis/go-redis/v9"
)

// InventoryReportService provides high-performance inventory reporting
type InventoryReportService struct {
	db    *database.DB
	cache *redis.Client
}

// NewInventoryReportService creates a new inventory report service
func NewInventoryReportService(db *database.DB, cacheService *CacheService) *InventoryReportService {
	var redisClient *redis.Client
	if cacheService != nil {
		redisClient = cacheService.redis
	}
	
	return &InventoryReportService{
		db:    db,
		cache: redisClient,
	}
}

// InventoryOverview represents comprehensive inventory overview
type InventoryOverview struct {
	Summary     []InventorySummary    `json:"summary"`
	Trends      []InventoryTrend      `json:"trends"`
	Categories  []CategoryBreakdown   `json:"categories"`
	Warehouses  []WarehouseBreakdown  `json:"warehouses"`
	LowStock    []LowStockAlert       `json:"low_stock_alerts"`
	TopMovers   []ProductMovement     `json:"top_movers"`
	GeneratedAt time.Time            `json:"generated_at"`
}

type InventorySummary struct {
	TotalProducts    int     `json:"total_products"`
	TotalValue       float64 `json:"total_value"`
	TotalQuantity    int     `json:"total_quantity"`
	ActiveProducts   int     `json:"active_products"`
	InactiveProducts int     `json:"inactive_products"`
	AverageValue     float64 `json:"average_value"`
}

type InventoryTrend struct {
	Date     time.Time `json:"date"`
	Value    float64   `json:"value"`
	Quantity int       `json:"quantity"`
	Change   float64   `json:"change_percent"`
}

type CategoryBreakdown struct {
	CategoryID    int     `json:"category_id"`
	CategoryName  string  `json:"category_name"`
	ProductCount  int     `json:"product_count"`
	TotalValue    float64 `json:"total_value"`
	TotalQuantity int     `json:"total_quantity"`
	Percentage    float64 `json:"percentage"`
}

type WarehouseBreakdown struct {
	WarehouseID   int     `json:"warehouse_id"`
	WarehouseName string  `json:"warehouse_name"`
	ProductCount  int     `json:"product_count"`
	TotalValue    float64 `json:"total_value"`
	TotalQuantity int     `json:"total_quantity"`
	Utilization   float64 `json:"utilization_percent"`
}

type LowStockAlert struct {
	ProductID     int     `json:"product_id"`
	ProductName   string  `json:"product_name"`
	SKU           string  `json:"sku"`
	CurrentStock  int     `json:"current_stock"`
	MinimumStock  int     `json:"minimum_stock"`
	ReorderLevel  int     `json:"reorder_level"`
	WarehouseName string  `json:"warehouse_name"`
	Priority      string  `json:"priority"`
}

type ProductMovement struct {
	ProductID      int     `json:"product_id"`
	ProductName    string  `json:"product_name"`
	SKU            string  `json:"sku"`
	MovementIn     int     `json:"movement_in"`
	MovementOut    int     `json:"movement_out"`
	NetMovement    int     `json:"net_movement"`
	TurnoverRate   float64 `json:"turnover_rate"`
	Category       string  `json:"category"`
}

// GetInventoryOverview returns comprehensive inventory overview with caching
func (s *InventoryReportService) GetInventoryOverview(tenantID int, filters models.ReportFilters) (*InventoryOverview, error) {
	// Generate cache key
	cacheKey := fmt.Sprintf("inventory_overview:%d:%s", tenantID, filters.Hash())
	
	// Try to get from cache
	if s.cache != nil {
		cached := s.cache.Get(context.Background(), cacheKey).Val()
		if cached != "" {
			var result InventoryOverview
			if err := json.Unmarshal([]byte(cached), &result); err == nil {
				return &result, nil
			}
		}
	}

	// Get fresh data from database
	overview, err := s.generateInventoryOverview(tenantID, filters)
	if err != nil {
		return nil, err
	}

	// Cache the result for 15 minutes
	if s.cache != nil {
		jsonData, _ := json.Marshal(overview)
		s.cache.Set(context.Background(), cacheKey, jsonData, 15*time.Minute)
	}

	return overview, nil
}

// generateInventoryOverview generates comprehensive inventory overview
func (s *InventoryReportService) generateInventoryOverview(tenantID int, filters models.ReportFilters) (*InventoryOverview, error) {
	// Set tenant context
	if err := s.db.SetTenantContext(tenantID); err != nil {
		return nil, err
	}

	overview := &InventoryOverview{
		GeneratedAt: time.Now(),
	}

	// Generate summary
	summary, err := s.getInventorySummary()
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory summary: %w", err)
	}
	overview.Summary = []InventorySummary{summary}

	// Generate trends
	trends, err := s.getInventoryTrends(filters.DateRange)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory trends: %w", err)
	}
	overview.Trends = trends

	// Generate category breakdown
	categories, err := s.getCategoryBreakdown()
	if err != nil {
		return nil, fmt.Errorf("failed to get category breakdown: %w", err)
	}
	overview.Categories = categories

	// Generate warehouse breakdown
	warehouses, err := s.getWarehouseBreakdown()
	if err != nil {
		return nil, fmt.Errorf("failed to get warehouse breakdown: %w", err)
	}
	overview.Warehouses = warehouses

	// Generate low stock alerts
	lowStock, err := s.getLowStockAlerts()
	if err != nil {
		return nil, fmt.Errorf("failed to get low stock alerts: %w", err)
	}
	overview.LowStock = lowStock

	// Generate top movers
	topMovers, err := s.getTopMovers(filters.DateRange)
	if err != nil {
		return nil, fmt.Errorf("failed to get top movers: %w", err)
	}
	overview.TopMovers = topMovers

	return overview, nil
}

// getInventorySummary generates inventory summary statistics
func (s *InventoryReportService) getInventorySummary() (InventorySummary, error) {
	query := `
		WITH inventory_stats AS (
			SELECT 
				COUNT(*) as total_products,
				COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_products,
				COUNT(CASE WHEN p.status != 'active' THEN 1 END) as inactive_products,
				COALESCE(SUM(il.quantity * p.unit_price), 0) as total_value,
				COALESCE(SUM(il.quantity), 0) as total_quantity
			FROM products p
			LEFT JOIN inventory_levels il ON p.id = il.product_id
			WHERE p.company_id = get_current_tenant_id()
		)
		SELECT 
			total_products,
			active_products,
			inactive_products,
			total_value,
			total_quantity,
			CASE 
				WHEN total_products > 0 THEN total_value / total_products 
				ELSE 0 
			END as average_value
		FROM inventory_stats;
	`

	var summary InventorySummary
	err := s.db.Raw(query).Scan(&summary).Error
	return summary, err
}

// getInventoryTrends generates inventory value trends over time
func (s *InventoryReportService) getInventoryTrends(dateRange models.DateRange) ([]InventoryTrend, error) {
	startDate := dateRange.StartDate
	endDate := dateRange.EndDate
	if startDate.IsZero() {
		startDate = time.Now().AddDate(0, -3, 0) // Default to 3 months ago
	}
	if endDate.IsZero() {
		endDate = time.Now()
	}

	query := `
		WITH RECURSIVE date_series AS (
			SELECT DATE_TRUNC('day', $1::timestamp) as date
			UNION ALL
			SELECT date + INTERVAL '1 day'
			FROM date_series
			WHERE date < DATE_TRUNC('day', $2::timestamp)
		),
		daily_inventory AS (
			SELECT 
				ds.date,
				COALESCE(SUM(il.quantity * p.unit_price), 0) as total_value,
				COALESCE(SUM(il.quantity), 0) as total_quantity
			FROM date_series ds
			LEFT JOIN inventory_transactions it ON DATE_TRUNC('day', it.created_at) = ds.date
			LEFT JOIN products p ON it.product_id = p.id
			LEFT JOIN inventory_levels il ON p.id = il.product_id
			WHERE p.company_id = get_current_tenant_id() OR p.company_id IS NULL
			GROUP BY ds.date
		),
		trends_with_change AS (
			SELECT 
				date,
				total_value,
				total_quantity,
				LAG(total_value) OVER (ORDER BY date) as prev_value
			FROM daily_inventory
		)
		SELECT 
			date,
			total_value as value,
			total_quantity as quantity,
			CASE 
				WHEN prev_value > 0 THEN ((total_value - prev_value) / prev_value) * 100
				ELSE 0
			END as change
		FROM trends_with_change
		ORDER BY date;
	`

	var trends []InventoryTrend
	err := s.db.Raw(query, startDate, endDate).Scan(&trends).Error
	return trends, err
}

// getCategoryBreakdown generates inventory breakdown by category
func (s *InventoryReportService) getCategoryBreakdown() ([]CategoryBreakdown, error) {
	query := `
		WITH category_stats AS (
			SELECT 
				pc.id as category_id,
				pc.name as category_name,
				COUNT(p.id) as product_count,
				COALESCE(SUM(il.quantity * p.unit_price), 0) as total_value,
				COALESCE(SUM(il.quantity), 0) as total_quantity
			FROM product_categories pc
			LEFT JOIN products p ON pc.id = p.category_id
			LEFT JOIN inventory_levels il ON p.id = il.product_id
			WHERE pc.company_id = get_current_tenant_id()
			GROUP BY pc.id, pc.name
		),
		total_value AS (
			SELECT SUM(total_value) as grand_total
			FROM category_stats
		)
		SELECT 
			cs.category_id,
			cs.category_name,
			cs.product_count,
			cs.total_value,
			cs.total_quantity,
			CASE 
				WHEN tv.grand_total > 0 THEN (cs.total_value / tv.grand_total) * 100
				ELSE 0
			END as percentage
		FROM category_stats cs, total_value tv
		ORDER BY cs.total_value DESC;
	`

	var categories []CategoryBreakdown
	err := s.db.Raw(query).Scan(&categories).Error
	return categories, err
}

// getWarehouseBreakdown generates inventory breakdown by warehouse
func (s *InventoryReportService) getWarehouseBreakdown() ([]WarehouseBreakdown, error) {
	query := `
		SELECT 
			w.id as warehouse_id,
			w.name as warehouse_name,
			COUNT(DISTINCT il.product_id) as product_count,
			COALESCE(SUM(il.quantity * p.unit_price), 0) as total_value,
			COALESCE(SUM(il.quantity), 0) as total_quantity,
			CASE 
				WHEN w.capacity > 0 THEN (SUM(il.quantity)::float / w.capacity) * 100
				ELSE 0
			END as utilization
		FROM warehouses w
		LEFT JOIN inventory_levels il ON w.id = il.warehouse_id
		LEFT JOIN products p ON il.product_id = p.id
		WHERE w.company_id = get_current_tenant_id()
		AND w.is_active = true
		GROUP BY w.id, w.name, w.capacity
		ORDER BY total_value DESC;
	`

	var warehouses []WarehouseBreakdown
	err := s.db.Raw(query).Scan(&warehouses).Error
	return warehouses, err
}

// getLowStockAlerts generates low stock alerts
func (s *InventoryReportService) getLowStockAlerts() ([]LowStockAlert, error) {
	query := `
		SELECT 
			p.id as product_id,
			p.name as product_name,
			p.sku,
			COALESCE(il.quantity, 0) as current_stock,
			COALESCE(p.minimum_stock_level, 0) as minimum_stock,
			COALESCE(p.reorder_level, 0) as reorder_level,
			w.name as warehouse_name,
			CASE 
				WHEN COALESCE(il.quantity, 0) = 0 THEN 'CRITICAL'
				WHEN COALESCE(il.quantity, 0) <= COALESCE(p.minimum_stock_level, 0) THEN 'HIGH'
				WHEN COALESCE(il.quantity, 0) <= COALESCE(p.reorder_level, 0) THEN 'MEDIUM'
				ELSE 'LOW'
			END as priority
		FROM products p
		LEFT JOIN inventory_levels il ON p.id = il.product_id
		LEFT JOIN warehouses w ON il.warehouse_id = w.id
		WHERE p.company_id = get_current_tenant_id()
		AND p.status = 'active'
		AND (
			COALESCE(il.quantity, 0) <= COALESCE(p.reorder_level, 0)
			OR COALESCE(il.quantity, 0) <= COALESCE(p.minimum_stock_level, 0)
		)
		ORDER BY 
			CASE priority
				WHEN 'CRITICAL' THEN 1
				WHEN 'HIGH' THEN 2
				WHEN 'MEDIUM' THEN 3
				ELSE 4
			END,
			il.quantity ASC;
	`

	var alerts []LowStockAlert
	err := s.db.Raw(query).Scan(&alerts).Error
	return alerts, err
}

// getTopMovers generates top moving products analysis
func (s *InventoryReportService) getTopMovers(dateRange models.DateRange) ([]ProductMovement, error) {
	startDate := dateRange.StartDate
	endDate := dateRange.EndDate
	if startDate.IsZero() {
		startDate = time.Now().AddDate(0, -1, 0) // Default to 1 month ago
	}
	if endDate.IsZero() {
		endDate = time.Now()
	}

	query := `
		WITH product_movements AS (
			SELECT 
				p.id as product_id,
				p.name as product_name,
				p.sku,
				pc.name as category,
				COALESCE(SUM(CASE WHEN it.transaction_type IN ('purchase', 'adjustment_in', 'transfer_in') THEN it.quantity ELSE 0 END), 0) as movement_in,
				COALESCE(SUM(CASE WHEN it.transaction_type IN ('sale', 'adjustment_out', 'transfer_out') THEN it.quantity ELSE 0 END), 0) as movement_out,
				COALESCE(AVG(il.quantity), 0) as avg_stock
			FROM products p
			LEFT JOIN inventory_transactions it ON p.id = it.product_id 
				AND it.created_at BETWEEN $1 AND $2
			LEFT JOIN product_categories pc ON p.category_id = pc.id
			LEFT JOIN inventory_levels il ON p.id = il.product_id
			WHERE p.company_id = get_current_tenant_id()
			AND p.status = 'active'
			GROUP BY p.id, p.name, p.sku, pc.name
		)
		SELECT 
			product_id,
			product_name,
			sku,
			movement_in,
			movement_out,
			(movement_out - movement_in) as net_movement,
			CASE 
				WHEN avg_stock > 0 THEN movement_out / avg_stock
				ELSE 0
			END as turnover_rate,
			category
		FROM product_movements
		WHERE movement_in > 0 OR movement_out > 0
		ORDER BY turnover_rate DESC, movement_out DESC
		LIMIT 20;
	`

	var movements []ProductMovement
	err := s.db.Raw(query, startDate, endDate).Scan(&movements).Error
	return movements, err
}

// ClearCache clears inventory report cache
func (s *InventoryReportService) ClearCache(tenantID int) error {
	if s.cache == nil {
		return nil
	}

	pattern := fmt.Sprintf("inventory_*:%d:*", tenantID)
	keys := s.cache.Keys(context.Background(), pattern).Val()
	
	if len(keys) > 0 {
		return s.cache.Del(context.Background(), keys...).Err()
	}
	
	return nil
}