package models

import (
	"time"
)

// StocktakingStatus represents the status of a stocktaking order
type StocktakingStatus struct {
	ID          int64     `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description *string   `json:"description,omitempty" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// StocktakingOrder represents a stocktaking order
type StocktakingOrder struct {
	ID                 int64      `json:"id" db:"id"`
	ReferenceNumber    string     `json:"reference_number" db:"reference_number"`
	Title              string     `json:"title" db:"title"`
	Description        *string    `json:"description,omitempty" db:"description"`
	WarehouseID        int64      `json:"warehouse_id" db:"warehouse_id"`
	StatusID           int64      `json:"status_id" db:"status_id"`
	StartDate          *time.Time `json:"start_date,omitempty" db:"start_date"`
	EndDate            *time.Time `json:"end_date,omitempty" db:"end_date"`
	PlannedDate        *time.Time `json:"planned_date,omitempty" db:"planned_date"`
	CreatedByUserID    int64      `json:"created_by_user_id" db:"created_by_user_id"`
	ApprovedByUserID   *int64     `json:"approved_by_user_id,omitempty" db:"approved_by_user_id"`
	FinalizedByUserID  *int64     `json:"finalized_by_user_id,omitempty" db:"finalized_by_user_id"`
	ApprovedAt         *time.Time `json:"approved_at,omitempty" db:"approved_at"`
	FinalizedAt        *time.Time `json:"finalized_at,omitempty" db:"finalized_at"`
	Notes              *string    `json:"notes,omitempty" db:"notes"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`
}

// StocktakingItem represents an item in a stocktaking order
type StocktakingItem struct {
	ID                int64      `json:"id" db:"id"`
	StocktakingOrderID int64     `json:"stocktaking_order_id" db:"stocktaking_order_id"`
	ProductID         int64      `json:"product_id" db:"product_id"`
	SystemQuantity    int        `json:"system_quantity" db:"system_quantity"`
	CountedQuantity   *int       `json:"counted_quantity,omitempty" db:"counted_quantity"`
	AdjustmentQuantity int       `json:"adjustment_quantity" db:"adjustment_quantity"`
	UnitCost          *float64   `json:"unit_cost,omitempty" db:"unit_cost"`
	TotalCostImpact   *float64   `json:"total_cost_impact,omitempty" db:"total_cost_impact"`
	BatchNumber       *string    `json:"batch_number,omitempty" db:"batch_number"`
	ExpiryDate        *time.Time `json:"expiry_date,omitempty" db:"expiry_date"`
	Notes             *string    `json:"notes,omitempty" db:"notes"`
	CountedByUserID   *int64     `json:"counted_by_user_id,omitempty" db:"counted_by_user_id"`
	CountedAt         *time.Time `json:"counted_at,omitempty" db:"counted_at"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`
}

// ProductSafetyStock represents safety stock configuration for a product
type ProductSafetyStock struct {
	ID              int64     `json:"id" db:"id"`
	ProductID       int64     `json:"product_id" db:"product_id"`
	WarehouseID     int64     `json:"warehouse_id" db:"warehouse_id"`
	SafetyStockLevel int      `json:"safety_stock_level" db:"safety_stock_level"`
	ReorderQuantity int       `json:"reorder_quantity" db:"reorder_quantity"`
	IsActive        bool      `json:"is_active" db:"is_active"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// InventoryAlertType represents types of inventory alerts
type InventoryAlertType struct {
	ID            int64     `json:"id" db:"id"`
	Name          string    `json:"name" db:"name"`
	Description   *string   `json:"description,omitempty" db:"description"`
	SeverityLevel int       `json:"severity_level" db:"severity_level"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

// InventoryAlert represents an inventory alert
type InventoryAlert struct {
	ID                 int64      `json:"id" db:"id"`
	AlertTypeID        int64      `json:"alert_type_id" db:"alert_type_id"`
	ProductID          int64      `json:"product_id" db:"product_id"`
	WarehouseID        int64      `json:"warehouse_id" db:"warehouse_id"`
	CurrentLevel       int        `json:"current_level" db:"current_level"`
	SafetyLevel        *int       `json:"safety_level,omitempty" db:"safety_level"`
	MaxLevel           *int       `json:"max_level,omitempty" db:"max_level"`
	AlertMessage       *string    `json:"alert_message,omitempty" db:"alert_message"`
	TriggeredAt        time.Time  `json:"triggered_at" db:"triggered_at"`
	ResolvedAt         *time.Time `json:"resolved_at,omitempty" db:"resolved_at"`
	ResolvedByUserID   *int64     `json:"resolved_by_user_id,omitempty" db:"resolved_by_user_id"`
	Status             string     `json:"status" db:"status"`
	NotificationSent   bool       `json:"notification_sent" db:"notification_sent"`
	NotificationSentAt *time.Time `json:"notification_sent_at,omitempty" db:"notification_sent_at"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`
}

// Request/Response Models for Stocktaking

// CreateStocktakingOrderRequest represents the request body for creating a stocktaking order
type CreateStocktakingOrderRequest struct {
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	WarehouseID int64      `json:"warehouse_id" binding:"required"`
	PlannedDate *time.Time `json:"planned_date,omitempty"`
	Notes       string     `json:"notes"`
}

// UpdateStocktakingOrderRequest represents the request body for updating a stocktaking order
type UpdateStocktakingOrderRequest struct {
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	PlannedDate *time.Time `json:"planned_date,omitempty"`
	Notes       string     `json:"notes"`
}

// StartStocktakingOrderRequest represents the request body for starting a stocktaking order
type StartStocktakingOrderRequest struct {
	StartDate *time.Time `json:"start_date,omitempty"`
	Notes     string     `json:"notes"`
}

// CountStocktakingItemRequest represents the request body for counting a stocktaking item
type CountStocktakingItemRequest struct {
	CountedQuantity int        `json:"counted_quantity" binding:"required,min=0"`
	BatchNumber     string     `json:"batch_number"`
	ExpiryDate      *time.Time `json:"expiry_date,omitempty"`
	Notes           string     `json:"notes"`
}

// ProcessStocktakingOrderRequest represents the request body for processing multiple stocktaking items
type ProcessStocktakingOrderRequest struct {
	Items []ProcessStocktakingItemRequest `json:"items" binding:"required,min=1"`
	Notes string                          `json:"notes"`
}

// ProcessStocktakingItemRequest represents a single item in the processing request
type ProcessStocktakingItemRequest struct {
	ProductID       int64      `json:"product_id" binding:"required"`
	CountedQuantity int        `json:"counted_quantity" binding:"required,min=0"`
	BatchNumber     string     `json:"batch_number"`
	ExpiryDate      *time.Time `json:"expiry_date,omitempty"`
	Notes           string     `json:"notes"`
}

// FinalizeStocktakingOrderRequest represents the request body for finalizing a stocktaking order
type FinalizeStocktakingOrderRequest struct {
	EndDate *time.Time `json:"end_date,omitempty"`
	Notes   string     `json:"notes"`
}

// ApproveStocktakingOrderRequest represents the request body for approving a stocktaking order
type ApproveStocktakingOrderRequest struct {
	Notes string `json:"notes"`
}

// Request/Response Models for Safety Stock

// CreateProductSafetyStockRequest represents the request body for creating product safety stock
type CreateProductSafetyStockRequest struct {
	ProductID        int64 `json:"product_id" binding:"required"`
	WarehouseID      int64 `json:"warehouse_id" binding:"required"`
	SafetyStockLevel int   `json:"safety_stock_level" binding:"required,min=0"`
	ReorderQuantity  int   `json:"reorder_quantity" binding:"required,min=0"`
}

// UpdateProductSafetyStockRequest represents the request body for updating product safety stock
type UpdateProductSafetyStockRequest struct {
	SafetyStockLevel int  `json:"safety_stock_level" binding:"required,min=0"`
	ReorderQuantity  int  `json:"reorder_quantity" binding:"required,min=0"`
	IsActive         bool `json:"is_active"`
}

// Request/Response Models for Inventory Alerts

// ResolveInventoryAlertRequest represents the request body for resolving an inventory alert
type ResolveInventoryAlertRequest struct {
	Notes string `json:"notes"`
}

// DismissInventoryAlertRequest represents the request body for dismissing an inventory alert
type DismissInventoryAlertRequest struct {
	Notes string `json:"notes"`
}

// Detailed Response Models

// StocktakingOrderWithDetails represents a stocktaking order with all related details
type StocktakingOrderWithDetails struct {
	StocktakingOrder
	Status           *StocktakingStatus `json:"status,omitempty"`
	Warehouse        *Warehouse         `json:"warehouse,omitempty"`
	Items            []StocktakingItemWithDetails `json:"items,omitempty"`
	CreatedByUser    *User              `json:"created_by_user,omitempty"`
	ApprovedByUser   *User              `json:"approved_by_user,omitempty"`
	FinalizedByUser  *User              `json:"finalized_by_user,omitempty"`
	ItemsCount       int                `json:"items_count"`
	CountedItemsCount int               `json:"counted_items_count"`
	TotalAdjustments int                `json:"total_adjustments"`
	TotalCostImpact  float64            `json:"total_cost_impact"`
}

// StocktakingItemWithDetails represents a stocktaking item with product details
type StocktakingItemWithDetails struct {
	StocktakingItem
	Product       *Product   `json:"product,omitempty"`
	CountedByUser *User      `json:"counted_by_user,omitempty"`
}

// ProductSafetyStockWithDetails represents product safety stock with related details
type ProductSafetyStockWithDetails struct {
	ProductSafetyStock
	Product   *Product   `json:"product,omitempty"`
	Warehouse *Warehouse `json:"warehouse,omitempty"`
}

// InventoryAlertWithDetails represents an inventory alert with related details
type InventoryAlertWithDetails struct {
	InventoryAlert
	AlertType       *InventoryAlertType `json:"alert_type,omitempty"`
	Product         *Product            `json:"product,omitempty"`
	Warehouse       *Warehouse          `json:"warehouse,omitempty"`
	ResolvedByUser  *User               `json:"resolved_by_user,omitempty"`
}

// StocktakingReportRequest represents the request body for generating stocktaking reports
type StocktakingReportRequest struct {
	WarehouseID *int64     `json:"warehouse_id,omitempty"`
	FromDate    *time.Time `json:"from_date,omitempty"`
	ToDate      *time.Time `json:"to_date,omitempty"`
	Status      string     `json:"status"`
	ProductID   *int64     `json:"product_id,omitempty"`
}

// StocktakingReportResponse represents the response for stocktaking reports
type StocktakingReportResponse struct {
	TotalOrders        int     `json:"total_orders"`
	CompletedOrders    int     `json:"completed_orders"`
	PendingOrders      int     `json:"pending_orders"`
	TotalItemsCounted  int     `json:"total_items_counted"`
	TotalAdjustments   int     `json:"total_adjustments"`
	TotalCostImpact    float64 `json:"total_cost_impact"`
	PositiveAdjustments int    `json:"positive_adjustments"`
	NegativeAdjustments int    `json:"negative_adjustments"`
	Orders             []StocktakingOrderWithDetails `json:"orders"`
}

// InventoryAlertReportRequest represents the request body for generating inventory alert reports
type InventoryAlertReportRequest struct {
	WarehouseID *int64     `json:"warehouse_id,omitempty"`
	FromDate    *time.Time `json:"from_date,omitempty"`
	ToDate      *time.Time `json:"to_date,omitempty"`
	Status      string     `json:"status"`
	AlertTypeID *int64     `json:"alert_type_id,omitempty"`
	ProductID   *int64     `json:"product_id,omitempty"`
}

// InventoryAlertReportResponse represents the response for inventory alert reports
type InventoryAlertReportResponse struct {
	TotalAlerts     int     `json:"total_alerts"`
	ActiveAlerts    int     `json:"active_alerts"`
	ResolvedAlerts  int     `json:"resolved_alerts"`
	DismissedAlerts int     `json:"dismissed_alerts"`
	CriticalAlerts  int     `json:"critical_alerts"`
	Alerts          []InventoryAlertWithDetails `json:"alerts"`
}

// Constants for status values
const (
	StocktakingStatusPlanned   = "PLANNED"
	StocktakingStatusInProgress = "IN_PROGRESS"
	StocktakingStatusCompleted = "COMPLETED"
	StocktakingStatusCancelled = "CANCELLED"
	StocktakingStatusApproved  = "APPROVED"
	StocktakingStatusFinalized = "FINALIZED"
	
	AlertStatusActive    = "ACTIVE"
	AlertStatusResolved  = "RESOLVED"
	AlertStatusDismissed = "DISMISSED"
	
	AlertTypeLowStock    = "LOW_STOCK"
	AlertTypeOutOfStock  = "OUT_OF_STOCK"
	AlertTypeOverstock   = "OVERSTOCK"
	AlertTypeExpiredStock = "EXPIRED_STOCK"
	AlertTypeSlowMoving  = "SLOW_MOVING"
)