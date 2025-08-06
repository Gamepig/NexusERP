package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ReportConfiguration 報表設定
type ReportConfiguration struct {
	ID                     uuid.UUID       `json:"id" db:"id"`
	Name                   string          `json:"name" db:"name"`
	ReportType             string          `json:"report_type" db:"report_type"`
	Parameters             json.RawMessage `json:"parameters" db:"parameters"`
	RefreshIntervalMinutes int             `json:"refresh_interval_minutes" db:"refresh_interval_minutes"`
	IsEnabled              bool            `json:"is_enabled" db:"is_enabled"`
	CreatedAt              time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time       `json:"updated_at" db:"updated_at"`
}

// ReportCache 報表快取
type ReportCache struct {
	ID         uuid.UUID       `json:"id" db:"id"`
	ReportKey  string          `json:"report_key" db:"report_key"`
	ReportType string          `json:"report_type" db:"report_type"`
	Data       json.RawMessage `json:"data" db:"data"`
	Parameters json.RawMessage `json:"parameters" db:"parameters"`
	ExpiresAt  time.Time       `json:"expires_at" db:"expires_at"`
	CreatedAt  time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at" db:"updated_at"`
}

// SalesReportData 銷售報表資料
type SalesReportData struct {
	OrderID      uuid.UUID  `json:"order_id" db:"order_id"`
	OrderNumber  string     `json:"order_number" db:"order_number"`
	CustomerID   *uuid.UUID `json:"customer_id" db:"customer_id"`
	CustomerName *string    `json:"customer_name" db:"customer_name"`
	TotalAmount  float64    `json:"total_amount" db:"total_amount"`
	Status       string     `json:"status" db:"status"`
	OrderDate    time.Time  `json:"order_date" db:"order_date"`
	OrderMonth   time.Time  `json:"order_month" db:"order_month"`
	OrderQuarter time.Time  `json:"order_quarter" db:"order_quarter"`
	OrderYear    time.Time  `json:"order_year" db:"order_year"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

// InventoryReportData 庫存報表資料
type InventoryReportData struct {
	ProductID         uuid.UUID `json:"product_id" db:"product_id"`
	ProductName       string    `json:"product_name" db:"product_name"`
	SKU               string    `json:"sku" db:"sku"`
	CategoryName      *string   `json:"category_name" db:"category_name"`
	WarehouseID       uuid.UUID `json:"warehouse_id" db:"warehouse_id"`
	WarehouseName     string    `json:"warehouse_name" db:"warehouse_name"`
	QuantityOnHand    int       `json:"quantity_on_hand" db:"quantity_on_hand"`
	QuantityReserved  int       `json:"quantity_reserved" db:"quantity_reserved"`
	QuantityAvailable int       `json:"quantity_available" db:"quantity_available"`
	ReorderPoint      int       `json:"reorder_point" db:"reorder_point"`
	StockStatus       string    `json:"stock_status" db:"stock_status"`
	UnitPrice         float64   `json:"unit_price" db:"unit_price"`
	InventoryValue    float64   `json:"inventory_value" db:"inventory_value"`
	LastUpdated       time.Time `json:"last_updated" db:"last_updated"`
}

// ARReportData 應收帳款報表資料
type ARReportData struct {
	ARID               uuid.UUID `json:"ar_id" db:"ar_id"`
	InvoiceID          uuid.UUID `json:"invoice_id" db:"invoice_id"`
	InvoiceNumber      string    `json:"invoice_number" db:"invoice_number"`
	CustomerID         uuid.UUID `json:"customer_id" db:"customer_id"`
	CustomerName       string    `json:"customer_name" db:"customer_name"`
	OriginalAmount     float64   `json:"original_amount" db:"original_amount"`
	OutstandingAmount  float64   `json:"outstanding_amount" db:"outstanding_amount"`
	PaidAmount         float64   `json:"paid_amount" db:"paid_amount"`
	DueDate            time.Time `json:"due_date" db:"due_date"`
	Status             string    `json:"status" db:"status"`
	DaysOverdue        float64   `json:"days_overdue" db:"days_overdue"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

// APReportData 應付帳款報表資料
type APReportData struct {
	APID               uuid.UUID `json:"ap_id" db:"ap_id"`
	InvoiceID          uuid.UUID `json:"invoice_id" db:"invoice_id"`
	InvoiceNumber      string    `json:"invoice_number" db:"invoice_number"`
	SupplierID         uuid.UUID `json:"supplier_id" db:"supplier_id"`
	SupplierName       string    `json:"supplier_name" db:"supplier_name"`
	OriginalAmount     float64   `json:"original_amount" db:"original_amount"`
	OutstandingAmount  float64   `json:"outstanding_amount" db:"outstanding_amount"`
	PaidAmount         float64   `json:"paid_amount" db:"paid_amount"`
	DueDate            time.Time `json:"due_date" db:"due_date"`
	Status             string    `json:"status" db:"status"`
	DaysOverdue        float64   `json:"days_overdue" db:"days_overdue"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

// 報表摘要結構
type SalesReportSummary struct {
	TotalSales       float64 `json:"total_sales" db:"total_sales"`
	OrderCount       int     `json:"order_count" db:"order_count"`
	AverageOrderSize float64 `json:"average_order_size" db:"average_order_size"`
	TopCustomers     []struct {
		CustomerName string  `json:"customer_name" db:"customer_name"`
		TotalAmount  float64 `json:"total_amount" db:"total_amount"`
	} `json:"top_customers"`
	SalesByMonth []struct {
		Month string  `json:"month" db:"month"`
		Sales float64 `json:"sales" db:"sales"`
	} `json:"sales_by_month"`
}

type InventoryReportSummary struct {
	TotalProducts       int     `json:"total_products"`
	TotalValue          float64 `json:"total_value"`
	LowStockCount       int     `json:"low_stock_count"`
	OutOfStockCount     int     `json:"out_of_stock_count"`
	InventoryTurnover   float64 `json:"inventory_turnover"`
	TopValueProducts    []struct {
		ProductName string  `json:"product_name"`
		Value       float64 `json:"value"`
	} `json:"top_value_products"`
	StockStatusBreakdown map[string]int `json:"stock_status_breakdown"`
}

type FinancialReportSummary struct {
	TotalAR           float64 `json:"total_ar"`
	TotalAP           float64 `json:"total_ap"`
	OverdueAR         float64 `json:"overdue_ar"`
	OverdueAP         float64 `json:"overdue_ap"`
	ARTurnover        float64 `json:"ar_turnover"`
	APTurnover        float64 `json:"ap_turnover"`
	CashFlow          float64 `json:"cash_flow"` // AR - AP
	AgingBuckets      map[string]float64 `json:"aging_buckets"`
}

// 報表請求參數
type ReportRequest struct {
	ReportType string            `json:"report_type"`
	DateFrom   *time.Time        `json:"date_from"`
	DateTo     *time.Time        `json:"date_to"`
	Parameters map[string]interface{} `json:"parameters"`
	UseCache   bool              `json:"use_cache"`
}

// 報表回應
type ReportResponse struct {
	ReportType  string          `json:"report_type"`
	Data        json.RawMessage `json:"data"`
	Summary     json.RawMessage `json:"summary"`
	GeneratedAt time.Time       `json:"generated_at"`
	CachedUntil *time.Time      `json:"cached_until,omitempty"`
	Parameters  map[string]interface{} `json:"parameters"`
}

// DashboardData 儀表板資料結構
type DashboardData struct {
	Sales     *SalesData     `json:"sales,omitempty"`
	Inventory *InventoryData `json:"inventory,omitempty"`
	Financial *FinancialData `json:"financial,omitempty"`
}

type SalesData struct {
	TotalSales float64 `json:"total_sales"`
	OrderCount int     `json:"order_count"`
}

type InventoryData struct {
	TotalValue    float64 `json:"total_value"`
	LowStockCount int     `json:"low_stock_count"`
}

type FinancialData struct {
	TotalAR  float64 `json:"total_ar"`
	TotalAP  float64 `json:"total_ap"`
	CashFlow float64 `json:"cash_flow"`
}

// ProductSalesData 產品銷售分析數據結構
type ProductSalesData struct {
	ProductID     int64   `json:"product_id" db:"product_id"`
	ProductName   string  `json:"product_name" db:"product_name"`
	CategoryName  string  `json:"category_name" db:"category_name"`
	QuantitySold  float64 `json:"quantity_sold" db:"quantity_sold"`
	TotalSales    float64 `json:"total_sales" db:"total_sales"`
	AveragePrice  float64 `json:"average_price" db:"average_price"`
	OrderCount    int     `json:"order_count" db:"order_count"`
	Rank          int     `json:"rank" db:"rank"`
}

// CategorySalesData 類別銷售分析數據結構
type CategorySalesData struct {
	CategoryName string  `json:"category_name" db:"category_name"`
	TotalSales   float64 `json:"total_sales" db:"total_sales"`
	ProductCount int     `json:"product_count" db:"product_count"`
}

// ProductSalesResponse 產品銷售分析回應結構
type ProductSalesResponse struct {
	Products   []ProductSalesData  `json:"products"`
	Categories []CategorySalesData `json:"categories"`
}