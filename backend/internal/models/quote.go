package models

import (
	"time"
)

// Quote represents a sales quote according to PRD 3.5.3
type Quote struct {
	ID                   int64     `json:"id" db:"id"`
	QuoteNumber          string    `json:"quote_number" db:"quote_number"`
	CustomerID           int64     `json:"customer_id" db:"customer_id"`
	BusinessUnitID       *int64    `json:"business_unit_id,omitempty" db:"business_unit_id"`
	Status               string    `json:"status" db:"status"`
	UserID               *int64    `json:"user_id,omitempty" db:"user_id"`
	QuoteDate            time.Time `json:"quote_date" db:"quote_date"`
	ExpiryDate           *time.Time `json:"expiry_date,omitempty" db:"expiry_date"`
	TotalAmount          float64   `json:"total_amount" db:"total_amount"`
	CurrencyID           *int64    `json:"currency_id,omitempty" db:"currency_id"`
	Notes                string    `json:"notes" db:"notes"`
	TermsAndConditions   string    `json:"terms_and_conditions" db:"terms_and_conditions"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

// QuoteItem represents a line item in a quote according to PRD 3.5.3
type QuoteItem struct {
	ID          int64     `json:"id" db:"id"`
	QuoteID     int64     `json:"quote_id" db:"quote_id"`
	ProductID   int64     `json:"product_id" db:"product_id"`
	Quantity    float64   `json:"quantity" db:"quantity"`
	UnitPrice   float64   `json:"unit_price" db:"unit_price"`
	TotalPrice  float64   `json:"total_price" db:"total_price"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Request/Response Models

// CreateQuoteRequest represents the request body for creating a quote
type CreateQuoteRequest struct {
	CustomerID         int64                   `json:"customer_id" binding:"required"`
	BusinessUnitID     *int64                  `json:"business_unit_id,omitempty"`
	QuoteDate          time.Time               `json:"quote_date" binding:"required"`
	ExpiryDate         *time.Time              `json:"expiry_date,omitempty"`
	CurrencyID         *int64                  `json:"currency_id,omitempty"`
	Notes              string                  `json:"notes"`
	TermsAndConditions string                  `json:"terms_and_conditions"`
	Items              []CreateQuoteItemRequest `json:"items" binding:"required,min=1"`
}

// CreateQuoteItemRequest represents a line item in a quote creation request
type CreateQuoteItemRequest struct {
	ProductID   int64   `json:"product_id" binding:"required"`
	Quantity    float64 `json:"quantity" binding:"required,min=0.01"`
	UnitPrice   float64 `json:"unit_price" binding:"required,min=0"`
	Description string  `json:"description"`
}

// UpdateQuoteRequest represents the request body for updating a quote
type UpdateQuoteRequest struct {
	CustomerID         *int64                   `json:"customer_id,omitempty"`
	BusinessUnitID     *int64                   `json:"business_unit_id,omitempty"`
	Status             *string                  `json:"status,omitempty"`
	QuoteDate          *time.Time               `json:"quote_date,omitempty"`
	ExpiryDate         *time.Time               `json:"expiry_date,omitempty"`
	CurrencyID         *int64                   `json:"currency_id,omitempty"`
	Notes              *string                  `json:"notes,omitempty"`
	TermsAndConditions *string                  `json:"terms_and_conditions,omitempty"`
	Items              []UpdateQuoteItemRequest `json:"items,omitempty"`
}

// UpdateQuoteItemRequest represents a line item in a quote update request
type UpdateQuoteItemRequest struct {
	ID          *int64  `json:"id,omitempty"` // If nil, create new item
	ProductID   int64   `json:"product_id" binding:"required"`
	Quantity    float64 `json:"quantity" binding:"required,min=0.01"`
	UnitPrice   float64 `json:"unit_price" binding:"required,min=0"`
	Description string  `json:"description"`
}

// ConvertQuoteRequest represents the request body for converting a quote to sales order
type ConvertQuoteRequest struct {
	OrderDate  *time.Time `json:"order_date,omitempty"` // If not provided, use current date
	Notes      string     `json:"notes"`                // Additional notes for the sales order
}

// QuoteWithDetails represents a quote with all related details
type QuoteWithDetails struct {
	Quote
	Customer      *Customer               `json:"customer,omitempty"`
	BusinessUnit  *BusinessUnit           `json:"business_unit,omitempty"`
	Currency      *Currency               `json:"currency,omitempty"`
	Items         []QuoteItemWithDetails  `json:"items,omitempty"`
	CreatedByUser *User                   `json:"created_by_user,omitempty"`
}

// QuoteItemWithDetails represents a quote item with product details
type QuoteItemWithDetails struct {
	QuoteItem
	Product *Product `json:"product,omitempty"`
}

// QuoteListResponse represents paginated quote list response
type QuoteListResponse struct {
	Quotes   []QuoteWithDetails `json:"quotes"`
	Total    int64              `json:"total"`
	Page     int                `json:"page"`
	PageSize int                `json:"page_size"`
	Pages    int                `json:"total_pages"`
}

// QuoteQueryParams represents query parameters for quote search
type QuoteQueryParams struct {
	CustomerID     *int64 `form:"customer_id"`
	Status         string `form:"status"`
	BusinessUnitID *int64 `form:"business_unit_id"`
	DateFrom       string `form:"date_from"` // YYYY-MM-DD format
	DateTo         string `form:"date_to"`   // YYYY-MM-DD format
	ExpiryFrom     string `form:"expiry_from"` // YYYY-MM-DD format
	ExpiryTo       string `form:"expiry_to"`   // YYYY-MM-DD format
	Page           int    `form:"page,default=1"`
	PageSize       int    `form:"page_size,default=20"`
	SortBy         string `form:"sort_by,default=created_at"`
	SortOrder      string `form:"sort_order,default=desc"`
}

// QuoteConstants defines valid enum values
const (
	// Quote Status
	QuoteStatusDraft     = "draft"
	QuoteStatusPending   = "pending"
	QuoteStatusApproved  = "approved"
	QuoteStatusRejected  = "rejected"
	QuoteStatusExpired   = "expired"
	QuoteStatusConverted = "converted"
)

// ConvertQuoteResponse represents the response when converting a quote to sales order
type ConvertQuoteResponse struct {
	Success      bool              `json:"success"`
	Message      string            `json:"message"`
	SalesOrderID int64             `json:"sales_order_id,omitempty"`
	SalesOrder   *SalesOrderWithDetails `json:"sales_order,omitempty"`
}