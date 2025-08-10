package models

import (
	"time"
)

// SalesOrder represents a sales order according to database_spec.md
type SalesOrder struct {
	ID             int64     `json:"id" db:"id"`
	OrderNumber    string    `json:"order_number" db:"order_number"`
	CompanyID      int64     `json:"company_id" db:"company_id"`
	CustomerID     int64     `json:"customer_id" db:"customer_id"`
	BusinessUnitID *int64    `json:"business_unit_id,omitempty" db:"business_unit_id"`
	Status         string    `json:"status" db:"status"`
	UserID         *int64    `json:"user_id,omitempty" db:"user_id"`
	OrderDate      time.Time `json:"order_date" db:"order_date"`
	TotalAmount    float64   `json:"total_amount" db:"total_amount"`
	CurrencyID     *int64    `json:"currency_id,omitempty" db:"currency_id"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// SalesOrderItem represents a line item in a sales order according to database_spec.md
type SalesOrderItem struct {
	ID           int64     `json:"id" db:"id"`
	SalesOrderID int64     `json:"sales_order_id" db:"sales_order_id"`
	ProductID    int64     `json:"product_id" db:"product_id"`
	Quantity     float64   `json:"quantity" db:"quantity"`
	UnitPrice    float64   `json:"unit_price" db:"unit_price"`
	TotalPrice   float64   `json:"total_price" db:"total_price"`
	Status       string    `json:"status" db:"status"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// Request/Response Models

// CreateSalesOrderRequest represents the request body for creating a sales order
type CreateSalesOrderRequest struct {
	CompanyID      int64                         `json:"company_id" binding:"required"`
	CustomerID     int64                         `json:"customer_id" binding:"required"`
	BusinessUnitID *int64                        `json:"business_unit_id,omitempty"`
	OrderDate      time.Time                     `json:"order_date" binding:"required"`
	CurrencyID     *int64                        `json:"currency_id,omitempty"`
	Items          []CreateSalesOrderItemRequest `json:"items" binding:"required,min=1"`
}

// CreateSalesOrderItemRequest represents a line item in a sales order creation request
type CreateSalesOrderItemRequest struct {
	ProductID int64   `json:"product_id" binding:"required"`
	Quantity  float64 `json:"quantity" binding:"required,min=0.01"`
	UnitPrice float64 `json:"unit_price" binding:"required,min=0"`
}

// UpdateSalesOrderRequest represents the request body for updating a sales order
type UpdateSalesOrderRequest struct {
	CustomerID     *int64                        `json:"customer_id,omitempty"`
	BusinessUnitID *int64                        `json:"business_unit_id,omitempty"`
	Status         *string                       `json:"status,omitempty"`
	OrderDate      *time.Time                    `json:"order_date,omitempty"`
	CurrencyID     *int64                        `json:"currency_id,omitempty"`
	Items          []UpdateSalesOrderItemRequest `json:"items,omitempty"`
}

// UpdateSalesOrderItemRequest represents a line item in a sales order update request
type UpdateSalesOrderItemRequest struct {
	ID        *int64  `json:"id,omitempty"` // If nil, create new item
	ProductID int64   `json:"product_id" binding:"required"`
	Quantity  float64 `json:"quantity" binding:"required,min=0.01"`
	UnitPrice float64 `json:"unit_price" binding:"required,min=0"`
	Status    *string `json:"status,omitempty"`
}

// ShipSalesOrderRequest represents the request body for shipping a sales order
type ShipSalesOrderRequest struct {
	Items []ShipSalesOrderItemRequest `json:"items" binding:"required,min=1"`
	Notes string                      `json:"notes"`
}

// ShipSalesOrderItemRequest represents a line item in a shipping request
type ShipSalesOrderItemRequest struct {
	SalesOrderItemID int64   `json:"sales_order_item_id" binding:"required"`
	QuantityShipped  float64 `json:"quantity_shipped" binding:"required,min=0.01"`
	WarehouseID      int64   `json:"warehouse_id" binding:"required"`
}

// SalesOrderWithDetails represents a sales order with all related details
type SalesOrderWithDetails struct {
	SalesOrder
	Customer      *Customer                   `json:"customer,omitempty"`
	BusinessUnit  *BusinessUnit               `json:"business_unit,omitempty"`
	Currency      *Currency                   `json:"currency,omitempty"`
	Items         []SalesOrderItemWithDetails `json:"items,omitempty"`
	CreatedByUser *User                       `json:"created_by_user,omitempty"`
}

// SalesOrderItemWithDetails represents a sales order item with product details
type SalesOrderItemWithDetails struct {
	SalesOrderItem
	Product *Product `json:"product,omitempty"`
}

// SalesOrderListResponse represents paginated sales order list response
type SalesOrderListResponse struct {
	SalesOrders []SalesOrderWithDetails `json:"sales_orders"`
	Total       int64                   `json:"total"`
	Page        int                     `json:"page"`
	PageSize    int                     `json:"page_size"`
	Pages       int                     `json:"total_pages"`
}

// SalesOrderQueryParams represents query parameters for sales order search
type SalesOrderQueryParams struct {
	CustomerID     *int64 `form:"customer_id"`
	Status         string `form:"status"`
	BusinessUnitID *int64 `form:"business_unit_id"`
	DateFrom       string `form:"date_from"` // YYYY-MM-DD format
	DateTo         string `form:"date_to"`   // YYYY-MM-DD format
	Page           int    `form:"page,default=1"`
	PageSize       int    `form:"page_size,default=20"`
	SortBy         string `form:"sort_by,default=created_at"`
	SortOrder      string `form:"sort_order,default=desc"`
}

// Supporting models are imported from organization.go

// SalesOrderConstants defines valid enum values
const (
	// Sales Order Status
	SalesOrderStatusDraft      = "draft"
	SalesOrderStatusProcessing = "processing"
	SalesOrderStatusShipped    = "shipped"
	SalesOrderStatusCompleted  = "completed"
	SalesOrderStatusCancelled  = "cancelled"

	// Sales Order Item Status
	SalesOrderItemStatusDraft      = "draft"
	SalesOrderItemStatusProcessing = "processing"
	SalesOrderItemStatusShipped    = "shipped"
	SalesOrderItemStatusCompleted  = "completed"
	SalesOrderItemStatusCancelled  = "cancelled"
)
