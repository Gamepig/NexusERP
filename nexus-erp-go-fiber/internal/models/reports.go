package models

import (
	"crypto/md5"
	"fmt"
	"time"
)

// Common report filter and date range structures
type ReportFilters struct {
	DateRange   DateRange `json:"date_range"`
	Category    string    `json:"category,omitempty"`
	Warehouse   string    `json:"warehouse,omitempty"`
	Customer    string    `json:"customer,omitempty"`
	Supplier    string    `json:"supplier,omitempty"`
	Product     string    `json:"product,omitempty"`
	Status      string    `json:"status,omitempty"`
	GroupBy     string    `json:"group_by,omitempty"`
	SortBy      string    `json:"sort_by,omitempty"`
	SortOrder   string    `json:"sort_order,omitempty"`
	Limit       int       `json:"limit,omitempty"`
	Offset      int       `json:"offset,omitempty"`
}

type DateRange struct {
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
}

// Hash generates a hash for caching purposes
func (f *ReportFilters) Hash() string {
	str := fmt.Sprintf("%s_%s_%s_%s_%s_%s_%s_%s_%s_%s_%d_%d",
		f.DateRange.StartDate.Format("2006-01-02"),
		f.DateRange.EndDate.Format("2006-01-02"),
		f.Category,
		f.Warehouse,
		f.Customer,
		f.Supplier,
		f.Product,
		f.Status,
		f.GroupBy,
		f.SortBy,
		f.Limit,
		f.Offset,
	)
	return fmt.Sprintf("%x", md5.Sum([]byte(str)))
}

// Report Response Templates
type ReportResponse struct {
	Data        interface{} `json:"data"`
	Metadata    ReportMeta  `json:"metadata"`
	GeneratedAt time.Time   `json:"generated_at"`
	CacheHit    bool        `json:"cache_hit,omitempty"`
}

type ReportMeta struct {
	TotalRecords   int           `json:"total_records"`
	FilteredRecords int          `json:"filtered_records,omitempty"`
	ProcessingTime time.Duration `json:"processing_time_ms"`
	DataSource     string        `json:"data_source"`
	ReportType     string        `json:"report_type"`
	Period         DateRange     `json:"period,omitempty"`
}

// Export formats
type ExportFormat string

const (
	FormatJSON  ExportFormat = "json"
	FormatCSV   ExportFormat = "csv"
	FormatExcel ExportFormat = "xlsx"
	FormatPDF   ExportFormat = "pdf"
)

type ExportRequest struct {
	ReportType string       `json:"report_type"`
	Format     ExportFormat `json:"format"`
	Filters    ReportFilters `json:"filters"`
	Options    ExportOptions `json:"options,omitempty"`
}

type ExportOptions struct {
	IncludeCharts bool   `json:"include_charts,omitempty"`
	Template      string `json:"template,omitempty"`
	Title         string `json:"title,omitempty"`
	Orientation   string `json:"orientation,omitempty"` // portrait, landscape
	PageSize      string `json:"page_size,omitempty"`   // A4, A3, Letter
	Watermark     string `json:"watermark,omitempty"`
}

// Dashboard data structures
type DashboardStats struct {
	TotalRevenue        float64     `json:"total_revenue"`
	TotalOrders         int         `json:"total_orders"`
	TotalCustomers      int         `json:"total_customers"`
	TotalProducts       int         `json:"total_products"`
	LowStockItems       int         `json:"low_stock_items"`
	PendingOrders       int         `json:"pending_orders"`
	RecentTransactions  []Transaction `json:"recent_transactions"`
	TopProducts         []ProductStat `json:"top_products"`
	RevenueGrowth       float64     `json:"revenue_growth"`
	OrderGrowth         float64     `json:"order_growth"`
	LastUpdated         time.Time   `json:"last_updated"`
}

type Transaction struct {
	ID          int       `json:"id"`
	Type        string    `json:"type"`
	Description string    `json:"description"`
	Amount      float64   `json:"amount"`
	Date        time.Time `json:"date"`
	Status      string    `json:"status"`
}

type ProductStat struct {
	ProductID   int     `json:"product_id"`
	ProductName string  `json:"product_name"`
	SKU         string  `json:"sku"`
	Sales       int     `json:"sales"`
	Revenue     float64 `json:"revenue"`
}

type DashboardCharts struct {
	RevenueChart     ChartData `json:"revenue_chart"`
	OrdersChart      ChartData `json:"orders_chart"`
	ProductChart     ChartData `json:"product_chart"`
	CustomerChart    ChartData `json:"customer_chart"`
	InventoryChart   ChartData `json:"inventory_chart"`
}

type ChartData struct {
	Type   string      `json:"type"`   // line, bar, pie, donut
	Title  string      `json:"title"`
	Labels []string    `json:"labels"`
	Data   []ChartSeries `json:"data"`
}

type ChartSeries struct {
	Name   string    `json:"name"`
	Values []float64 `json:"values"`
	Color  string    `json:"color,omitempty"`
}

type DashboardAlerts struct {
	CriticalAlerts []Alert `json:"critical_alerts"`
	WarningAlerts  []Alert `json:"warning_alerts"`
	InfoAlerts     []Alert `json:"info_alerts"`
}

type Alert struct {
	ID          int       `json:"id"`
	Type        string    `json:"type"`        // critical, warning, info
	Category    string    `json:"category"`    // inventory, finance, sales, etc.
	Title       string    `json:"title"`
	Message     string    `json:"message"`
	ActionURL   string    `json:"action_url,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	ExpiresAt   time.Time `json:"expires_at,omitempty"`
}

// Sales Report Structures
type SalesOverview struct {
	TotalSales      float64              `json:"total_sales"`
	TotalOrders     int                  `json:"total_orders"`
	AverageOrderValue float64            `json:"average_order_value"`
	TopCustomers    []CustomerSales      `json:"top_customers"`
	TopProducts     []ProductSales       `json:"top_products"`
	SalesTrends     []SalesTrend         `json:"sales_trends"`
	RegionalSales   []RegionalSales      `json:"regional_sales"`
}

type CustomerSales struct {
	CustomerID   int     `json:"customer_id"`
	CustomerName string  `json:"customer_name"`
	TotalSales   float64 `json:"total_sales"`
	OrderCount   int     `json:"order_count"`
	LastOrder    time.Time `json:"last_order"`
}

type ProductSales struct {
	ProductID    int     `json:"product_id"`
	ProductName  string  `json:"product_name"`
	SKU          string  `json:"sku"`
	UnitsSold    int     `json:"units_sold"`
	Revenue      float64 `json:"revenue"`
	GrossMargin  float64 `json:"gross_margin"`
}

type SalesTrend struct {
	Period      time.Time `json:"period"`
	Sales       float64   `json:"sales"`
	Orders      int       `json:"orders"`
	Growth      float64   `json:"growth_percent"`
}

type RegionalSales struct {
	Region      string  `json:"region"`
	Sales       float64 `json:"sales"`
	Orders      int     `json:"orders"`
	Customers   int     `json:"customers"`
}

// Purchase Report Structures
type PurchaseOverview struct {
	TotalPurchases   float64             `json:"total_purchases"`
	TotalOrders      int                 `json:"total_orders"`
	TopSuppliers     []SupplierPurchase  `json:"top_suppliers"`
	TopProducts      []ProductPurchase   `json:"top_products"`
	PurchaseTrends   []PurchaseTrend     `json:"purchase_trends"`
}

type SupplierPurchase struct {
	SupplierID   int     `json:"supplier_id"`
	SupplierName string  `json:"supplier_name"`
	TotalPurchases float64 `json:"total_purchases"`
	OrderCount   int     `json:"order_count"`
	LastOrder    time.Time `json:"last_order"`
}

type ProductPurchase struct {
	ProductID   int     `json:"product_id"`
	ProductName string  `json:"product_name"`
	SKU         string  `json:"sku"`
	UnitsOrdered int    `json:"units_ordered"`
	TotalCost   float64 `json:"total_cost"`
}

type PurchaseTrend struct {
	Period    time.Time `json:"period"`
	Purchases float64   `json:"purchases"`
	Orders    int       `json:"orders"`
	Growth    float64   `json:"growth_percent"`
}

// Employee Report Structures
type EmployeeAttendance struct {
	EmployeeID     int       `json:"employee_id"`
	EmployeeName   string    `json:"employee_name"`
	Department     string    `json:"department"`
	TotalHours     float64   `json:"total_hours"`
	WorkingDays    int       `json:"working_days"`
	AbsentDays     int       `json:"absent_days"`
	LateArrivals   int       `json:"late_arrivals"`
	EarlyDepartures int      `json:"early_departures"`
	AttendanceRate float64   `json:"attendance_rate"`
	Period         DateRange `json:"period"`
}

type EmployeePerformance struct {
	EmployeeID     int     `json:"employee_id"`
	EmployeeName   string  `json:"employee_name"`
	Department     string  `json:"department"`
	Role           string  `json:"role"`
	SalesTarget    float64 `json:"sales_target,omitempty"`
	SalesAchieved  float64 `json:"sales_achieved,omitempty"`
	Achievement    float64 `json:"achievement_percent,omitempty"`
	TasksCompleted int     `json:"tasks_completed,omitempty"`
	TasksAssigned  int     `json:"tasks_assigned,omitempty"`
	Rating         float64 `json:"rating,omitempty"`
}

// Validation methods
func (dr *DateRange) IsValid() bool {
	return !dr.StartDate.IsZero() && !dr.EndDate.IsZero() && dr.StartDate.Before(dr.EndDate)
}

func (dr *DateRange) Duration() time.Duration {
	return dr.EndDate.Sub(dr.StartDate)
}

func (f *ReportFilters) SetDefaults() {
	if f.DateRange.StartDate.IsZero() {
		f.DateRange.StartDate = time.Now().AddDate(0, -1, 0) // 1 month ago
	}
	if f.DateRange.EndDate.IsZero() {
		f.DateRange.EndDate = time.Now()
	}
	if f.SortOrder == "" {
		f.SortOrder = "DESC"
	}
	if f.Limit == 0 {
		f.Limit = 100
	}
}