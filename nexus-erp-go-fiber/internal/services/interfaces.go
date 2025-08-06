package services

import (
	"nexus-erp-fiber/internal/models"
)

// UserServiceInterface defines user service methods
type UserServiceInterface interface {
	GetUserByID(id int64) (*User, error)
	GetUserByUsername(username string) (*User, error)
	GetUserByEmail(email string) (*User, error)
	CreateUser(user *User) error
	UpdateUser(user *User) error
	DeleteUser(id int64) error
	ValidatePassword(user *User, password string) bool
	HasPermission(userID int64, resource, action string) (bool, error)
	GetUserCompanies(userID int64) ([]UserCompany, error)
}

// ReportServiceInterface defines report service methods
type ReportServiceInterface interface {
	GetDashboardStats(tenantID int) (*models.DashboardStats, error)
	GetDashboardCharts(tenantID int, filters models.ReportFilters) (*models.DashboardCharts, error)
	GetDashboardAlerts(tenantID int) (*models.DashboardAlerts, error)
	ClearCache(tenantID int) error
}

// InventoryReportServiceInterface defines inventory report service methods
type InventoryReportServiceInterface interface {
	GetInventoryOverview(tenantID int, filters models.ReportFilters) (*InventoryOverview, error)
	GetInventoryLevels(tenantID int, filters models.ReportFilters) ([]InventoryLevel, error)
	GetInventoryMovements(tenantID int, filters models.ReportFilters) ([]InventoryMovement, error)
	GetInventoryAging(tenantID int, filters models.ReportFilters) ([]InventoryAging, error)
	GetInventoryTurnover(tenantID int, filters models.ReportFilters) ([]InventoryTurnover, error)
	ClearCache(tenantID int) error
}

// FinancialReportServiceInterface defines financial report service methods
type FinancialReportServiceInterface interface {
	GetProfitLossReport(tenantID int, period models.DateRange) (*ProfitLossReport, error)
	GetCashFlowReport(tenantID int, period models.DateRange) (*CashFlowReport, error)
	GetBalanceSheetReport(tenantID int, asOfDate models.DateRange) (*BalanceSheetReport, error)
	GetFinancialRatios(tenantID int, period models.DateRange) (*FinancialRatios, error)
	ClearCache(tenantID int) error
}

// CompanyServiceInterface defines company service methods
type CompanyServiceInterface interface {
	GetUserCompanies(userID int) ([]Company, error)
	SwitchCompany(userID, companyID int) (string, error)
	InviteUser(companyID, inviterID int, request InviteUserRequest) (*Invitation, error)
	GetCompanyUsers(companyID int) ([]CompanyUser, error)
	UpdateUserRole(companyID, userID int, role string) error
}

// CacheServiceInterface defines cache service methods
type CacheServiceInterface interface {
	Get(key string) (string, error)
	Set(key string, value interface{}, ttl int) error
	Delete(key string) error
	Clear(pattern string) error
	WarmUpCache() error
}

// Supporting types that would be defined elsewhere

type User struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Status   string `json:"status"`
	// Add other user fields as needed
}

type UserCompany struct {
	UserID    int64  `json:"user_id"`
	CompanyID int64  `json:"company_id"`
	Role      string `json:"role"`
	IsActive  bool   `json:"is_active"`
	IsPrimary bool   `json:"is_primary"`
}

type Company struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	IsActive bool   `json:"is_active"`
}

type CompanyUser struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	IsActive bool   `json:"is_active"`
}

type Invitation struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Token     string `json:"token"`
	CompanyID int    `json:"company_id"`
}

type InviteUserRequest struct {
	Email string `json:"email" validate:"required,email"`
	Role  string `json:"role" validate:"required"`
}

// Inventory report supporting types
type InventoryLevel struct {
	ProductID     int     `json:"product_id"`
	ProductName   string  `json:"product_name"`
	SKU           string  `json:"sku"`
	WarehouseID   int     `json:"warehouse_id"`
	WarehouseName string  `json:"warehouse_name"`
	Quantity      int     `json:"quantity"`
	ReservedQty   int     `json:"reserved_quantity"`
	AvailableQty  int     `json:"available_quantity"`
	UnitPrice     float64 `json:"unit_price"`
	TotalValue    float64 `json:"total_value"`
	LastUpdated   string  `json:"last_updated"`
}

type InventoryMovement struct {
	ID              int     `json:"id"`
	ProductID       int     `json:"product_id"`
	ProductName     string  `json:"product_name"`
	SKU             string  `json:"sku"`
	TransactionType string  `json:"transaction_type"`
	Quantity        int     `json:"quantity"`
	UnitPrice       float64 `json:"unit_price"`
	Reference       string  `json:"reference"`
	CreatedAt       string  `json:"created_at"`
}

type InventoryAging struct {
	ProductID     int     `json:"product_id"`
	ProductName   string  `json:"product_name"`
	SKU           string  `json:"sku"`
	Days0to30     int     `json:"days_0_to_30"`
	Days31to60    int     `json:"days_31_to_60"`
	Days61to90    int     `json:"days_61_to_90"`
	Days90Plus    int     `json:"days_90_plus"`
	TotalQuantity int     `json:"total_quantity"`
	AverageAge    float64 `json:"average_age_days"`
}

type InventoryTurnover struct {
	ProductID      int     `json:"product_id"`
	ProductName    string  `json:"product_name"`
	SKU            string  `json:"sku"`
	COGS           float64 `json:"cogs"`
	AverageInventory float64 `json:"average_inventory"`
	TurnoverRatio  float64 `json:"turnover_ratio"`
	DaysInInventory float64 `json:"days_in_inventory"`
}

// Balance Sheet types (placeholder)
type BalanceSheetReport struct {
	// This would be implemented based on actual balance sheet requirements
	AsOfDate    string  `json:"as_of_date"`
	TotalAssets float64 `json:"total_assets"`
	// Add other balance sheet items
}