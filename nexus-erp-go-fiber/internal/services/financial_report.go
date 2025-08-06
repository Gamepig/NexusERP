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

// FinancialReportService provides comprehensive financial reporting
type FinancialReportService struct {
	db    *database.DB
	cache *redis.Client
}

// NewFinancialReportService creates a new financial report service
func NewFinancialReportService(db *database.DB, cacheService *CacheService) *FinancialReportService {
	var redisClient *redis.Client
	if cacheService != nil {
		redisClient = cacheService.redis
	}
	
	return &FinancialReportService{
		db:    db,
		cache: redisClient,
	}
}

// Financial Report Data Structures

type ProfitLossReport struct {
	Period      models.DateRange    `json:"period"`
	Revenue     RevenueBreakdown    `json:"revenue"`
	COGS        COGSBreakdown       `json:"cogs"`
	Expenses    ExpenseBreakdown    `json:"expenses"`
	Summary     PLSummary           `json:"summary"`
	Trends      []PLTrend           `json:"trends"`
	Ratios      FinancialRatios     `json:"ratios"`
	GeneratedAt time.Time           `json:"generated_at"`
}

type RevenueBreakdown struct {
	TotalRevenue    float64                    `json:"total_revenue"`
	SalesRevenue    float64                    `json:"sales_revenue"`
	ServiceRevenue  float64                    `json:"service_revenue"`
	OtherRevenue    float64                    `json:"other_revenue"`
	ByMonth         []MonthlyRevenue           `json:"by_month"`
	ByCategory      []CategoryRevenue          `json:"by_category"`
	ByCustomer      []CustomerRevenue          `json:"by_customer"`
}

type COGSBreakdown struct {
	TotalCOGS       float64                    `json:"total_cogs"`
	MaterialCosts   float64                    `json:"material_costs"`
	LaborCosts      float64                    `json:"labor_costs"`
	OverheadCosts   float64                    `json:"overhead_costs"`
	ByProduct       []ProductCOGS              `json:"by_product"`
}

type ExpenseBreakdown struct {
	TotalExpenses     float64                  `json:"total_expenses"`
	OperatingExpenses float64                  `json:"operating_expenses"`
	AdminExpenses     float64                  `json:"admin_expenses"`
	SalesExpenses     float64                  `json:"sales_expenses"`
	ByCategory        []ExpenseCategory        `json:"by_category"`
}

type PLSummary struct {
	GrossProfit     float64 `json:"gross_profit"`
	OperatingIncome float64 `json:"operating_income"`
	NetIncome       float64 `json:"net_income"`
	EBITDA          float64 `json:"ebitda"`
}

type PLTrend struct {
	Month           time.Time `json:"month"`
	Revenue         float64   `json:"revenue"`
	COGS            float64   `json:"cogs"`
	GrossProfit     float64   `json:"gross_profit"`
	OperatingIncome float64   `json:"operating_income"`
	NetIncome       float64   `json:"net_income"`
}

type FinancialRatios struct {
	GrossMargin     float64 `json:"gross_margin"`
	OperatingMargin float64 `json:"operating_margin"`
	NetMargin       float64 `json:"net_margin"`
	ROA             float64 `json:"roa"`
	ROE             float64 `json:"roe"`
	CurrentRatio    float64 `json:"current_ratio"`
	QuickRatio      float64 `json:"quick_ratio"`
	DebtToEquity    float64 `json:"debt_to_equity"`
}

type CashFlowReport struct {
	Period            models.DateRange      `json:"period"`
	OperatingCashFlow OperatingCashFlow     `json:"operating_cash_flow"`
	InvestingCashFlow InvestingCashFlow     `json:"investing_cash_flow"`
	FinancingCashFlow FinancingCashFlow     `json:"financing_cash_flow"`
	NetCashFlow       float64               `json:"net_cash_flow"`
	CashBalance       CashBalance           `json:"cash_balance"`
	Trends            []CashFlowTrend       `json:"trends"`
	GeneratedAt       time.Time             `json:"generated_at"`
}

type OperatingCashFlow struct {
	NetIncome           float64 `json:"net_income"`
	Depreciation        float64 `json:"depreciation"`
	AccountsReceivable  float64 `json:"accounts_receivable_change"`
	AccountsPayable     float64 `json:"accounts_payable_change"`
	InventoryChange     float64 `json:"inventory_change"`
	OtherOperating      float64 `json:"other_operating"`
	Total               float64 `json:"total"`
}

type InvestingCashFlow struct {
	CapitalExpenditure float64 `json:"capital_expenditure"`
	AssetSales         float64 `json:"asset_sales"`
	Investments        float64 `json:"investments"`
	Total              float64 `json:"total"`
}

type FinancingCashFlow struct {
	DebtChanges     float64 `json:"debt_changes"`
	EquityChanges   float64 `json:"equity_changes"`
	Dividends       float64 `json:"dividends"`
	Total           float64 `json:"total"`
}

type CashBalance struct {
	OpeningBalance float64 `json:"opening_balance"`
	ClosingBalance float64 `json:"closing_balance"`
	NetChange      float64 `json:"net_change"`
}

type CashFlowTrend struct {
	Month     time.Time `json:"month"`
	Operating float64   `json:"operating"`
	Investing float64   `json:"investing"`
	Financing float64   `json:"financing"`
	Net       float64   `json:"net"`
}

// Supporting types
type MonthlyRevenue struct {
	Month   time.Time `json:"month"`
	Revenue float64   `json:"revenue"`
}

type CategoryRevenue struct {
	Category string  `json:"category"`
	Revenue  float64 `json:"revenue"`
}

type CustomerRevenue struct {
	CustomerID   int     `json:"customer_id"`
	CustomerName string  `json:"customer_name"`
	Revenue      float64 `json:"revenue"`
}

type ProductCOGS struct {
	ProductID   int     `json:"product_id"`
	ProductName string  `json:"product_name"`
	COGS        float64 `json:"cogs"`
}

type ExpenseCategory struct {
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
}

// GetProfitLossReport generates comprehensive P&L report
func (s *FinancialReportService) GetProfitLossReport(tenantID int, period models.DateRange) (*ProfitLossReport, error) {
	// Generate cache key
	cacheKey := fmt.Sprintf("pl_report:%d:%s_%s", tenantID, 
		period.StartDate.Format("2006-01-02"), 
		period.EndDate.Format("2006-01-02"))
	
	// Try to get from cache
	if s.cache != nil {
		cached := s.cache.Get(context.Background(), cacheKey).Val()
		if cached != "" {
			var result ProfitLossReport
			if err := json.Unmarshal([]byte(cached), &result); err == nil {
				return &result, nil
			}
		}
	}

	// Set tenant context
	if err := s.db.SetTenantContext(tenantID); err != nil {
		return nil, err
	}

	// Generate P&L report
	report, err := s.generateProfitLossReport(period)
	if err != nil {
		return nil, err
	}

	// Cache the result for 30 minutes
	if s.cache != nil {
		jsonData, _ := json.Marshal(report)
		s.cache.Set(context.Background(), cacheKey, jsonData, 30*time.Minute)
	}

	return report, nil
}

// generateProfitLossReport generates the P&L report from database
func (s *FinancialReportService) generateProfitLossReport(period models.DateRange) (*ProfitLossReport, error) {
	report := &ProfitLossReport{
		Period:      period,
		GeneratedAt: time.Now(),
	}

	// Calculate revenue breakdown
	revenue, err := s.calculateRevenueBreakdown(period)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate revenue: %w", err)
	}
	report.Revenue = revenue

	// Calculate COGS breakdown
	cogs, err := s.calculateCOGSBreakdown(period)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate COGS: %w", err)
	}
	report.COGS = cogs

	// Calculate expense breakdown
	expenses, err := s.calculateExpenseBreakdown(period)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate expenses: %w", err)
	}
	report.Expenses = expenses

	// Calculate summary
	report.Summary = PLSummary{
		GrossProfit:     revenue.TotalRevenue - cogs.TotalCOGS,
		OperatingIncome: revenue.TotalRevenue - cogs.TotalCOGS - expenses.OperatingExpenses,
		NetIncome:       revenue.TotalRevenue - cogs.TotalCOGS - expenses.TotalExpenses,
		EBITDA:          revenue.TotalRevenue - cogs.TotalCOGS - expenses.OperatingExpenses, // Simplified
	}

	// Calculate financial ratios
	report.Ratios = s.calculateFinancialRatios(report.Revenue.TotalRevenue, report.Summary)

	// Calculate trends
	trends, err := s.calculatePLTrends(period)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate trends: %w", err)
	}
	report.Trends = trends

	return report, nil
}

// calculateRevenueBreakdown calculates revenue breakdown
func (s *FinancialReportService) calculateRevenueBreakdown(period models.DateRange) (RevenueBreakdown, error) {
	// Main revenue query
	revenueQuery := `
		SELECT 
			COALESCE(SUM(so.total_amount), 0) as total_revenue,
			COALESCE(SUM(CASE WHEN so.order_type = 'sales' THEN so.total_amount ELSE 0 END), 0) as sales_revenue,
			COALESCE(SUM(CASE WHEN so.order_type = 'service' THEN so.total_amount ELSE 0 END), 0) as service_revenue,
			COALESCE(SUM(CASE WHEN so.order_type NOT IN ('sales', 'service') THEN so.total_amount ELSE 0 END), 0) as other_revenue
		FROM sales_orders so
		WHERE so.company_id = get_current_tenant_id()
		AND so.order_date BETWEEN $1 AND $2
		AND so.status = 'completed'
	`

	var breakdown RevenueBreakdown
	err := s.db.Raw(revenueQuery, period.StartDate, period.EndDate).Scan(&breakdown).Error
	if err != nil {
		return breakdown, err
	}

	// Monthly revenue trends
	monthlyQuery := `
		SELECT 
			DATE_TRUNC('month', so.order_date) as month,
			COALESCE(SUM(so.total_amount), 0) as revenue
		FROM sales_orders so
		WHERE so.company_id = get_current_tenant_id()
		AND so.order_date BETWEEN $1 AND $2
		AND so.status = 'completed'
		GROUP BY DATE_TRUNC('month', so.order_date)
		ORDER BY month
	`

	err = s.db.Raw(monthlyQuery, period.StartDate, period.EndDate).Scan(&breakdown.ByMonth).Error
	if err != nil {
		return breakdown, err
	}

	// Revenue by category
	categoryQuery := `
		SELECT 
			pc.name as category,
			COALESCE(SUM(soi.quantity * soi.unit_price), 0) as revenue
		FROM sales_order_items soi
		JOIN sales_orders so ON soi.sales_order_id = so.id
		JOIN products p ON soi.product_id = p.id
		JOIN product_categories pc ON p.category_id = pc.id
		WHERE so.company_id = get_current_tenant_id()
		AND so.order_date BETWEEN $1 AND $2
		AND so.status = 'completed'
		GROUP BY pc.name
		ORDER BY revenue DESC
	`

	err = s.db.Raw(categoryQuery, period.StartDate, period.EndDate).Scan(&breakdown.ByCategory).Error
	if err != nil {
		return breakdown, err
	}

	// Revenue by customer (top 10)
	customerQuery := `
		SELECT 
			c.id as customer_id,
			c.name as customer_name,
			COALESCE(SUM(so.total_amount), 0) as revenue
		FROM sales_orders so
		JOIN customers c ON so.customer_id = c.id
		WHERE so.company_id = get_current_tenant_id()
		AND so.order_date BETWEEN $1 AND $2
		AND so.status = 'completed'
		GROUP BY c.id, c.name
		ORDER BY revenue DESC
		LIMIT 10
	`

	err = s.db.Raw(customerQuery, period.StartDate, period.EndDate).Scan(&breakdown.ByCustomer).Error
	return breakdown, err
}

// calculateCOGSBreakdown calculates cost of goods sold breakdown
func (s *FinancialReportService) calculateCOGSBreakdown(period models.DateRange) (COGSBreakdown, error) {
	// Main COGS query
	cogsQuery := `
		SELECT 
			COALESCE(SUM(soi.quantity * p.cost_price), 0) as total_cogs,
			COALESCE(SUM(soi.quantity * p.material_cost), 0) as material_costs,
			COALESCE(SUM(soi.quantity * p.labor_cost), 0) as labor_costs,
			COALESCE(SUM(soi.quantity * p.overhead_cost), 0) as overhead_costs
		FROM sales_order_items soi
		JOIN sales_orders so ON soi.sales_order_id = so.id
		JOIN products p ON soi.product_id = p.id
		WHERE so.company_id = get_current_tenant_id()
		AND so.order_date BETWEEN $1 AND $2
		AND so.status = 'completed'
	`

	var breakdown COGSBreakdown
	err := s.db.Raw(cogsQuery, period.StartDate, period.EndDate).Scan(&breakdown).Error
	if err != nil {
		return breakdown, err
	}

	// COGS by product
	productCogsQuery := `
		SELECT 
			p.id as product_id,
			p.name as product_name,
			COALESCE(SUM(soi.quantity * p.cost_price), 0) as cogs
		FROM sales_order_items soi
		JOIN sales_orders so ON soi.sales_order_id = so.id
		JOIN products p ON soi.product_id = p.id
		WHERE so.company_id = get_current_tenant_id()
		AND so.order_date BETWEEN $1 AND $2
		AND so.status = 'completed'
		GROUP BY p.id, p.name
		ORDER BY cogs DESC
		LIMIT 20
	`

	err = s.db.Raw(productCogsQuery, period.StartDate, period.EndDate).Scan(&breakdown.ByProduct).Error
	return breakdown, err
}

// calculateExpenseBreakdown calculates expense breakdown
func (s *FinancialReportService) calculateExpenseBreakdown(period models.DateRange) (ExpenseBreakdown, error) {
	// This would need an expenses table which might not exist yet
	// For now, we'll use approximations from other data
	
	breakdown := ExpenseBreakdown{
		TotalExpenses:     0,
		OperatingExpenses: 0,
		AdminExpenses:     0,
		SalesExpenses:     0,
		ByCategory:        []ExpenseCategory{},
	}

	// In a real implementation, you'd query an expenses table
	// For now, we'll estimate some expenses from purchase orders and other sources
	
	return breakdown, nil
}

// calculateFinancialRatios calculates key financial ratios
func (s *FinancialReportService) calculateFinancialRatios(totalRevenue float64, summary PLSummary) FinancialRatios {
	ratios := FinancialRatios{}

	if totalRevenue > 0 {
		ratios.GrossMargin = (summary.GrossProfit / totalRevenue) * 100
		ratios.OperatingMargin = (summary.OperatingIncome / totalRevenue) * 100
		ratios.NetMargin = (summary.NetIncome / totalRevenue) * 100
	}

	// Additional ratios would require balance sheet data
	// These would be calculated from assets, liabilities, and equity tables
	ratios.ROA = 0     // Return on Assets
	ratios.ROE = 0     // Return on Equity
	ratios.CurrentRatio = 0
	ratios.QuickRatio = 0
	ratios.DebtToEquity = 0

	return ratios
}

// calculatePLTrends calculates monthly P&L trends
func (s *FinancialReportService) calculatePLTrends(period models.DateRange) ([]PLTrend, error) {
	query := `
		WITH monthly_data AS (
			SELECT 
				DATE_TRUNC('month', so.order_date) as month,
				COALESCE(SUM(so.total_amount), 0) as revenue,
				COALESCE(SUM(soi.quantity * p.cost_price), 0) as cogs
			FROM sales_orders so
			LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
			LEFT JOIN products p ON soi.product_id = p.id
			WHERE so.company_id = get_current_tenant_id()
			AND so.order_date BETWEEN $1 AND $2
			AND so.status = 'completed'
			GROUP BY DATE_TRUNC('month', so.order_date)
		)
		SELECT 
			month,
			revenue,
			cogs,
			(revenue - cogs) as gross_profit,
			(revenue - cogs) as operating_income, -- Simplified
			(revenue - cogs) as net_income       -- Simplified
		FROM monthly_data
		ORDER BY month
	`

	var trends []PLTrend
	err := s.db.Raw(query, period.StartDate, period.EndDate).Scan(&trends).Error
	return trends, err
}

// GetCashFlowReport generates cash flow report
func (s *FinancialReportService) GetCashFlowReport(tenantID int, period models.DateRange) (*CashFlowReport, error) {
	// Set tenant context
	if err := s.db.SetTenantContext(tenantID); err != nil {
		return nil, err
	}

	// This is a simplified implementation
	// A full cash flow report would require more detailed financial data
	report := &CashFlowReport{
		Period:      period,
		GeneratedAt: time.Now(),
	}

	// Operating cash flow approximation
	report.OperatingCashFlow = OperatingCashFlow{
		NetIncome: 0, // Would need to calculate from P&L
		Total:     0,
	}

	// Investing cash flow
	report.InvestingCashFlow = InvestingCashFlow{
		Total: 0,
	}

	// Financing cash flow
	report.FinancingCashFlow = FinancingCashFlow{
		Total: 0,
	}

	report.NetCashFlow = report.OperatingCashFlow.Total + 
		report.InvestingCashFlow.Total + 
		report.FinancingCashFlow.Total

	return report, nil
}

// ClearCache clears financial report cache
func (s *FinancialReportService) ClearCache(tenantID int) error {
	if s.cache == nil {
		return nil
	}

	pattern := fmt.Sprintf("*_report:%d:*", tenantID)
	keys := s.cache.Keys(context.Background(), pattern).Val()
	
	if len(keys) > 0 {
		return s.cache.Del(context.Background(), keys...).Err()
	}
	
	return nil
}