package models

import (
	"time"
)

// Currency represents a currency
type Currency struct {
	ID             int64     `json:"id" db:"id"`
	Code           string    `json:"code" db:"code"`
	Name           string    `json:"name" db:"name"`
	Symbol         string    `json:"symbol" db:"symbol"`
	ExchangeRate   float64   `json:"exchange_rate" db:"exchange_rate"`
	IsBaseCurrency bool      `json:"is_base_currency" db:"is_base_currency"`
	IsActive       bool      `json:"is_active" db:"is_active"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// Invoice represents both supplier invoices (purchase) and customer invoices (sales)
type Invoice struct {
	ID                int64      `json:"id" db:"id"`
	InvoiceNumber     string     `json:"invoice_number" db:"invoice_number"`
	InvoiceType       string     `json:"invoice_type" db:"invoice_type"` // 'purchase' or 'sales'
	PurchaseOrderID   *int64     `json:"purchase_order_id,omitempty" db:"purchase_order_id"`
	SupplierID        *int64     `json:"supplier_id,omitempty" db:"supplier_id"` // For purchase invoices
	CustomerID        *int64     `json:"customer_id,omitempty" db:"customer_id"` // For sales invoices
	SalesOrderID      *int64     `json:"sales_order_id,omitempty" db:"sales_order_id"` // For sales invoices
	InvoiceDate       time.Time  `json:"invoice_date" db:"invoice_date"`
	DueDate           time.Time  `json:"due_date" db:"due_date"`
	Subtotal          float64    `json:"subtotal" db:"subtotal"`
	TaxAmount         float64    `json:"tax_amount" db:"tax_amount"`
	TotalAmount       float64    `json:"total_amount" db:"total_amount"`
	CurrencyID        int64      `json:"currency_id" db:"currency_id"`
	ExchangeRate      float64    `json:"exchange_rate" db:"exchange_rate"`
	Status            string     `json:"status" db:"status"`
	PaymentTerms      *string    `json:"payment_terms,omitempty" db:"payment_terms"`
	Description       *string    `json:"description,omitempty" db:"description"`
	Notes             *string    `json:"notes,omitempty" db:"notes"`
	AttachmentURL     *string    `json:"attachment_url,omitempty" db:"attachment_url"`
	CreatedByUserID   *int64     `json:"created_by_user_id,omitempty" db:"created_by_user_id"`
	ApprovedByUserID  *int64     `json:"approved_by_user_id,omitempty" db:"approved_by_user_id"`
	ApprovedAt        *time.Time `json:"approved_at,omitempty" db:"approved_at"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`
}

// InvoiceItem represents a line item in an invoice
type InvoiceItem struct {
	ID          int64     `json:"id" db:"id"`
	InvoiceID   int64     `json:"invoice_id" db:"invoice_id"`
	ProductID   *int64    `json:"product_id,omitempty" db:"product_id"`
	Description string    `json:"description" db:"description"`
	Quantity    float64   `json:"quantity" db:"quantity"`
	UnitPrice   float64   `json:"unit_price" db:"unit_price"`
	LineTotal   float64   `json:"line_total" db:"line_total"`
	TaxRate     float64   `json:"tax_rate" db:"tax_rate"`
	TaxAmount   float64   `json:"tax_amount" db:"tax_amount"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// AccountsPayable represents an accounts payable record
type AccountsPayable struct {
	ID                 int64     `json:"id" db:"id"`
	InvoiceID          int64     `json:"invoice_id" db:"invoice_id"`
	SupplierID         int64     `json:"supplier_id" db:"supplier_id"`
	Amount             float64   `json:"amount" db:"amount"`
	CurrencyID         int64     `json:"currency_id" db:"currency_id"`
	DueDate            time.Time `json:"due_date" db:"due_date"`
	PaidAmount         float64   `json:"paid_amount" db:"paid_amount"`
	OutstandingAmount  float64   `json:"outstanding_amount" db:"outstanding_amount"`
	Status             string    `json:"status" db:"status"`
	AgingBucket        *string   `json:"aging_bucket,omitempty" db:"aging_bucket"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

// Payment represents a payment to suppliers
type Payment struct {
	ID               int64      `json:"id" db:"id"`
	PaymentNumber    string     `json:"payment_number" db:"payment_number"`
	SupplierID       int64      `json:"supplier_id" db:"supplier_id"`
	PaymentDate      time.Time  `json:"payment_date" db:"payment_date"`
	TotalAmount      float64    `json:"total_amount" db:"total_amount"`
	CurrencyID       int64      `json:"currency_id" db:"currency_id"`
	ExchangeRate     float64    `json:"exchange_rate" db:"exchange_rate"`
	PaymentMethod    string     `json:"payment_method" db:"payment_method"`
	ReferenceNumber  *string    `json:"reference_number,omitempty" db:"reference_number"`
	BankAccount      *string    `json:"bank_account,omitempty" db:"bank_account"`
	Notes            *string    `json:"notes,omitempty" db:"notes"`
	Status           string     `json:"status" db:"status"`
	CreatedByUserID  *int64     `json:"created_by_user_id,omitempty" db:"created_by_user_id"`
	ProcessedAt      *time.Time `json:"processed_at,omitempty" db:"processed_at"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
}

// PaymentAllocation represents the allocation of a payment to specific invoices
type PaymentAllocation struct {
	ID              int64     `json:"id" db:"id"`
	PaymentID       int64     `json:"payment_id" db:"payment_id"`
	InvoiceID       int64     `json:"invoice_id" db:"invoice_id"`
	AllocatedAmount float64   `json:"allocated_amount" db:"allocated_amount"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

// AccountsReceivable represents an accounts receivable record for customer invoices
type AccountsReceivable struct {
	ID           int64      `json:"id" db:"id"`
	InvoiceID    int64      `json:"invoice_id" db:"invoice_id"`
	CustomerID   int64      `json:"customer_id" db:"customer_id"`
	AmountDue    float64    `json:"amount_due" db:"amount_due"`
	BalanceDue   float64    `json:"balance_due" db:"balance_due"`
	CurrencyID   int64      `json:"currency_id" db:"currency_id"`
	DueDate      time.Time  `json:"due_date" db:"due_date"`
	Status       string     `json:"status" db:"status"`
	AgingBucket  *string    `json:"aging_bucket,omitempty" db:"aging_bucket"`
	Terms        *string    `json:"terms,omitempty" db:"terms"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

// CustomerPayment represents a payment from customers
type CustomerPayment struct {
	ID               int64      `json:"id" db:"id"`
	PaymentNumber    string     `json:"payment_number" db:"payment_number"`
	CustomerID       int64      `json:"customer_id" db:"customer_id"`
	PaymentDate      time.Time  `json:"payment_date" db:"payment_date"`
	Amount           float64    `json:"amount" db:"amount"`
	CurrencyID       int64      `json:"currency_id" db:"currency_id"`
	ExchangeRate     float64    `json:"exchange_rate" db:"exchange_rate"`
	PaymentMethod    string     `json:"payment_method" db:"payment_method"`
	ReferenceNumber  *string    `json:"reference_number,omitempty" db:"reference_number"`
	BankAccount      *string    `json:"bank_account,omitempty" db:"bank_account"`
	Notes            *string    `json:"notes,omitempty" db:"notes"`
	Status           string     `json:"status" db:"status"`
	UnappliedAmount  float64    `json:"unapplied_amount" db:"unapplied_amount"`
	CreatedByUserID  *int64     `json:"created_by_user_id,omitempty" db:"created_by_user_id"`
	ProcessedAt      *time.Time `json:"processed_at,omitempty" db:"processed_at"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
}

// CustomerPaymentAllocation represents the allocation of customer payments to specific AR records
type CustomerPaymentAllocation struct {
	ID                    int64     `json:"id" db:"id"`
	PaymentID            int64     `json:"payment_id" db:"payment_id"`
	AccountsReceivableID int64     `json:"accounts_receivable_id" db:"accounts_receivable_id"`
	AllocatedAmount      float64   `json:"allocated_amount" db:"allocated_amount"`
	AllocationDate       time.Time `json:"allocation_date" db:"allocation_date"`
	Notes                *string   `json:"notes,omitempty" db:"notes"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
}

// Request/Response Models for Invoice Management

// CreateInvoiceRequest represents the request body for creating an invoice
type CreateInvoiceRequest struct {
	InvoiceType     string                     `json:"invoice_type" binding:"required"` // 'purchase' or 'sales'
	PurchaseOrderID *int64                     `json:"purchase_order_id,omitempty"`
	SupplierID      *int64                     `json:"supplier_id,omitempty"`      // Required for purchase invoices
	CustomerID      *int64                     `json:"customer_id,omitempty"`      // Required for sales invoices
	SalesOrderID    *int64                     `json:"sales_order_id,omitempty"`   // Optional for sales invoices
	InvoiceDate     time.Time                  `json:"invoice_date" binding:"required"`
	DueDate         time.Time                  `json:"due_date" binding:"required"`
	CurrencyID      int64                      `json:"currency_id" binding:"required"`
	ExchangeRate    *float64                   `json:"exchange_rate,omitempty"`
	PaymentTerms    string                     `json:"payment_terms"`
	Description     string                     `json:"description"`
	Notes           string                     `json:"notes"`
	AttachmentURL   string                     `json:"attachment_url"`
	Items           []CreateInvoiceItemRequest `json:"items" binding:"required,min=1"`
}

// CreateInvoiceItemRequest represents a line item in an invoice creation request
type CreateInvoiceItemRequest struct {
	ProductID   *int64  `json:"product_id,omitempty"`
	Description string  `json:"description" binding:"required"`
	Quantity    float64 `json:"quantity" binding:"required,min=0"`
	UnitPrice   float64 `json:"unit_price" binding:"required,min=0"`
	TaxRate     float64 `json:"tax_rate"`
}

// UpdateInvoiceRequest represents the request body for updating an invoice
type UpdateInvoiceRequest struct {
	PurchaseOrderID *int64                     `json:"purchase_order_id,omitempty"`
	SupplierID      int64                      `json:"supplier_id" binding:"required"`
	InvoiceDate     time.Time                  `json:"invoice_date" binding:"required"`
	DueDate         time.Time                  `json:"due_date" binding:"required"`
	CurrencyID      int64                      `json:"currency_id" binding:"required"`
	ExchangeRate    *float64                   `json:"exchange_rate,omitempty"`
	PaymentTerms    string                     `json:"payment_terms"`
	Description     string                     `json:"description"`
	Notes           string                     `json:"notes"`
	AttachmentURL   string                     `json:"attachment_url"`
	Status          string                     `json:"status"`
	Items           []UpdateInvoiceItemRequest `json:"items" binding:"required,min=1"`
}

// UpdateInvoiceItemRequest represents a line item in an invoice update request
type UpdateInvoiceItemRequest struct {
	ID          *int64  `json:"id,omitempty"` // If nil, create new item
	ProductID   *int64  `json:"product_id,omitempty"`
	Description string  `json:"description" binding:"required"`
	Quantity    float64 `json:"quantity" binding:"required,min=0"`
	UnitPrice   float64 `json:"unit_price" binding:"required,min=0"`
	TaxRate     float64 `json:"tax_rate"`
}

// ApproveInvoiceRequest represents the request body for approving an invoice
type ApproveInvoiceRequest struct {
	Notes string `json:"notes"`
}

// GenerateInvoiceFromPORequest represents the request for generating invoice from PO
type GenerateInvoiceFromPORequest struct {
	InvoiceDate   time.Time `json:"invoice_date" binding:"required"`
	DueDate       time.Time `json:"due_date" binding:"required"`
	PaymentTerms  string    `json:"payment_terms"`
	Description   string    `json:"description"`
	Notes         string    `json:"notes"`
	AttachmentURL string    `json:"attachment_url"`
}

// CreatePaymentRequest represents the request body for creating a payment
type CreatePaymentRequest struct {
	SupplierID        int64                         `json:"supplier_id" binding:"required"`
	PaymentDate       time.Time                     `json:"payment_date" binding:"required"`
	CurrencyID        int64                         `json:"currency_id" binding:"required"`
	ExchangeRate      *float64                      `json:"exchange_rate,omitempty"`
	PaymentMethod     string                        `json:"payment_method" binding:"required"`
	ReferenceNumber   string                        `json:"reference_number"`
	BankAccount       string                        `json:"bank_account"`
	Notes             string                        `json:"notes"`
	Allocations       []CreatePaymentAllocationRequest `json:"allocations" binding:"required,min=1"`
}

// CreatePaymentAllocationRequest represents payment allocation to an invoice
type CreatePaymentAllocationRequest struct {
	InvoiceID       int64   `json:"invoice_id" binding:"required"`
	AllocatedAmount float64 `json:"allocated_amount" binding:"required,min=0"`
}

// UpdatePaymentRequest represents the request body for updating a payment
type UpdatePaymentRequest struct {
	PaymentDate     time.Time                     `json:"payment_date" binding:"required"`
	CurrencyID      int64                         `json:"currency_id" binding:"required"`
	ExchangeRate    *float64                      `json:"exchange_rate,omitempty"`
	PaymentMethod   string                        `json:"payment_method" binding:"required"`
	ReferenceNumber string                        `json:"reference_number"`
	BankAccount     string                        `json:"bank_account"`
	Notes           string                        `json:"notes"`
	Status          string                        `json:"status"`
	Allocations     []UpdatePaymentAllocationRequest `json:"allocations" binding:"required,min=1"`
}

// UpdatePaymentAllocationRequest represents payment allocation update
type UpdatePaymentAllocationRequest struct {
	ID              *int64  `json:"id,omitempty"` // If nil, create new allocation
	InvoiceID       int64   `json:"invoice_id" binding:"required"`
	AllocatedAmount float64 `json:"allocated_amount" binding:"required,min=0"`
}

// Complex Response Models with Related Data

// InvoiceWithDetails represents an invoice with all related details
type InvoiceWithDetails struct {
	Invoice
	PurchaseOrder      *PurchaseOrder       `json:"purchase_order,omitempty"`      // For purchase invoices
	SalesOrder         *SalesOrder          `json:"sales_order,omitempty"`         // For sales invoices
	Supplier           *Supplier            `json:"supplier,omitempty"`            // For purchase invoices
	Customer           *Customer            `json:"customer,omitempty"`            // For sales invoices
	Currency           *Currency            `json:"currency,omitempty"`
	Items              []InvoiceItemWithDetails `json:"items,omitempty"`
	AccountsPayable    *AccountsPayable     `json:"accounts_payable,omitempty"`    // For purchase invoices
	AccountsReceivable *AccountsReceivable  `json:"accounts_receivable,omitempty"` // For sales invoices
	CreatedByUser      *User                `json:"created_by_user,omitempty"`
	ApprovedByUser     *User                `json:"approved_by_user,omitempty"`
}

// InvoiceItemWithDetails represents an invoice item with product details
type InvoiceItemWithDetails struct {
	InvoiceItem
	Product *Product `json:"product,omitempty"`
}

// AccountsPayableWithDetails represents an AP record with related details
type AccountsPayableWithDetails struct {
	AccountsPayable
	Invoice  *Invoice  `json:"invoice,omitempty"`
	Supplier *Supplier `json:"supplier,omitempty"`
	Currency *Currency `json:"currency,omitempty"`
}

// PaymentWithDetails represents a payment with all related details
type PaymentWithDetails struct {
	Payment
	Supplier    *Supplier           `json:"supplier,omitempty"`
	Currency    *Currency           `json:"currency,omitempty"`
	Allocations []PaymentAllocationWithDetails `json:"allocations,omitempty"`
	CreatedByUser *User             `json:"created_by_user,omitempty"`
}

// PaymentAllocationWithDetails represents payment allocation with invoice details
type PaymentAllocationWithDetails struct {
	PaymentAllocation
	Invoice *Invoice `json:"invoice,omitempty"`
}

// AccountsReceivableWithDetails represents an AR record with related details
type AccountsReceivableWithDetails struct {
	AccountsReceivable
	Invoice  *Invoice  `json:"invoice,omitempty"`
	Customer *Customer `json:"customer,omitempty"`
	Currency *Currency `json:"currency,omitempty"`
}

// CustomerPaymentWithDetails represents a customer payment with all related details
type CustomerPaymentWithDetails struct {
	CustomerPayment
	Customer    *Customer                           `json:"customer,omitempty"`
	Currency    *Currency                           `json:"currency,omitempty"`
	Allocations []CustomerPaymentAllocationWithDetails `json:"allocations,omitempty"`
	CreatedByUser *User                             `json:"created_by_user,omitempty"`
}

// CustomerPaymentAllocationWithDetails represents customer payment allocation with AR details
type CustomerPaymentAllocationWithDetails struct {
	CustomerPaymentAllocation
	AccountsReceivable *AccountsReceivable `json:"accounts_receivable,omitempty"`
}

// Report Models

// APAgingReportItem represents an item in the AP aging report
type APAgingReportItem struct {
	SupplierID     int64   `json:"supplier_id"`
	SupplierName   string  `json:"supplier_name"`
	CurrencyCode   string  `json:"currency_code"`
	Current        float64 `json:"current"`
	Days1to30      float64 `json:"days_1_to_30"`
	Days31to60     float64 `json:"days_31_to_60"`
	Days61to90     float64 `json:"days_61_to_90"`
	Over90Days     float64 `json:"over_90_days"`
	TotalAmount    float64 `json:"total_amount"`
}

// APAgingReport represents the complete AP aging report
type APAgingReport struct {
	GeneratedAt time.Time           `json:"generated_at"`
	Summary     APAgingReportSummary `json:"summary"`
	Items       []APAgingReportItem `json:"items"`
}

// APAgingReportSummary represents summary totals for AP aging
type APAgingReportSummary struct {
	TotalSuppliers int     `json:"total_suppliers"`
	Current        float64 `json:"current"`
	Days1to30      float64 `json:"days_1_to_30"`
	Days31to60     float64 `json:"days_31_to_60"`
	Days61to90     float64 `json:"days_61_to_90"`
	Over90Days     float64 `json:"over_90_days"`
	TotalAmount    float64 `json:"total_amount"`
}

// InvoiceStatus constants
const (
	InvoiceStatusDraft            = "draft"
	InvoiceStatusPendingApproval  = "pending_approval"
	InvoiceStatusApproved         = "approved"
	InvoiceStatusPartiallyPaid    = "partially_paid"
	InvoiceStatusPaid             = "paid"
	InvoiceStatusOverdue          = "overdue"
	InvoiceStatusCancelled        = "cancelled"
)

// AccountsPayableStatus constants
const (
	APStatusPending       = "pending"
	APStatusPartiallyPaid = "partially_paid"
	APStatusPaid          = "paid"
	APStatusOverdue       = "overdue"
	APStatusDisputed      = "disputed"
	APStatusCancelled     = "cancelled"
)

// PaymentStatus constants
const (
	PaymentStatusPending    = "pending"
	PaymentStatusProcessing = "processing"
	PaymentStatusCompleted  = "completed"
	PaymentStatusFailed     = "failed"
	PaymentStatusCancelled  = "cancelled"
)

// PaymentMethod constants
const (
	PaymentMethodBankTransfer = "bank_transfer"
	PaymentMethodCheck        = "check"
	PaymentMethodCash         = "cash"
	PaymentMethodCreditCard   = "credit_card"
	PaymentMethodWireTransfer = "wire_transfer"
	PaymentMethodACH          = "ach"
)

// AgingBucket constants
const (
	AgingBucketCurrent    = "current"
	AgingBucket1to30Days  = "1-30_days"
	AgingBucket31to60Days = "31-60_days"
	AgingBucket61to90Days = "61-90_days"
	AgingBucketOver90Days = "over_90_days"
)

// InvoiceType constants
const (
	InvoiceTypePurchase = "purchase"
	InvoiceTypeSales    = "sales"
)

// AccountsReceivableStatus constants
const (
	ARStatusOpen           = "open"
	ARStatusPartiallyPaid  = "partially_paid"
	ARStatusPaid           = "paid"
	ARStatusOverdue        = "overdue"
	ARStatusDisputed       = "disputed"
	ARStatusWrittenOff     = "written_off"
)

// CustomerPaymentStatus constants
const (
	CustomerPaymentStatusPending    = "pending"
	CustomerPaymentStatusProcessing = "processing"
	CustomerPaymentStatusCompleted  = "completed"
	CustomerPaymentStatusFailed     = "failed"
	CustomerPaymentStatusCancelled  = "cancelled"
)

// CustomerPaymentMethod constants
const (
	CustomerPaymentMethodBankTransfer = "bank_transfer"
	CustomerPaymentMethodCheck        = "check"
	CustomerPaymentMethodCash         = "cash"
	CustomerPaymentMethodCreditCard   = "credit_card"
	CustomerPaymentMethodWireTransfer = "wire_transfer"
	CustomerPaymentMethodACH          = "ach"
	CustomerPaymentMethodOnlinePayment = "online_payment"
)

// Request/Response Models for Customer Payment Management

// CreateCustomerPaymentRequest represents the request body for creating a customer payment
type CreateCustomerPaymentRequest struct {
	CustomerID      int64     `json:"customer_id" binding:"required"`
	PaymentDate     time.Time `json:"payment_date" binding:"required"`
	Amount          float64   `json:"amount" binding:"required,gt=0"`
	CurrencyID      int64     `json:"currency_id" binding:"required"`
	ExchangeRate    *float64  `json:"exchange_rate,omitempty"`
	PaymentMethod   string    `json:"payment_method" binding:"required"`
	ReferenceNumber *string   `json:"reference_number,omitempty"`
	BankAccount     *string   `json:"bank_account,omitempty"`
	Notes           *string   `json:"notes,omitempty"`
}

// UpdateCustomerPaymentRequest represents the request body for updating a customer payment
type UpdateCustomerPaymentRequest struct {
	PaymentDate     time.Time `json:"payment_date" binding:"required"`
	Amount          float64   `json:"amount" binding:"required,gt=0"`
	CurrencyID      int64     `json:"currency_id" binding:"required"`
	ExchangeRate    *float64  `json:"exchange_rate,omitempty"`
	PaymentMethod   string    `json:"payment_method" binding:"required"`
	ReferenceNumber *string   `json:"reference_number,omitempty"`
	BankAccount     *string   `json:"bank_account,omitempty"`
	Notes           *string   `json:"notes,omitempty"`
	Status          string    `json:"status" binding:"required"`
}

// ProcessCustomerPaymentRequest represents the request to process a customer payment
type ProcessCustomerPaymentRequest struct {
	Notes *string `json:"notes,omitempty"`
}

// CancelCustomerPaymentRequest represents the request to cancel a customer payment
type CancelCustomerPaymentRequest struct {
	Reason *string `json:"reason,omitempty"`
}

// ApplyCustomerPaymentRequest represents the request to apply a customer payment to invoices
type ApplyCustomerPaymentRequest struct {
	ApplicationMode string                                     `json:"application_mode" binding:"required"` // 'automatic' or 'manual'
	Allocations     []CreateCustomerPaymentAllocationRequest `json:"allocations,omitempty"`                 // Required for manual mode
	Notes           *string                                   `json:"notes,omitempty"`
}

// CreateCustomerPaymentAllocationRequest represents payment allocation to an AR record
type CreateCustomerPaymentAllocationRequest struct {
	AccountsReceivableID int64   `json:"accounts_receivable_id" binding:"required"`
	AllocatedAmount      float64 `json:"allocated_amount" binding:"required,gt=0"`
	Notes                *string `json:"notes,omitempty"`
}

// ApplicationMode constants
const (
	PaymentApplicationModeAutomatic = "automatic"
	PaymentApplicationModeManual    = "manual"
)

// CustomerBalanceInfo represents detailed customer balance information
type CustomerBalanceInfo struct {
	CustomerID       int64   `json:"customer_id"`
	CustomerName     string  `json:"customer_name"`
	CustomerCode     string  `json:"customer_code"`
	TotalBalance     float64 `json:"total_balance"`
	CurrentBalance   float64 `json:"current_balance"`
	OverdueBalance   float64 `json:"overdue_balance"`
	CreditLimit      float64 `json:"credit_limit"`
	AvailableCredit  float64 `json:"available_credit"`
	Currency         string  `json:"currency"`
	LastPaymentDate  *string `json:"last_payment_date,omitempty"`
	LastPaymentAmount *float64 `json:"last_payment_amount,omitempty"`
	OutstandingInvoices int   `json:"outstanding_invoices"`
	OldestInvoiceDate   *string `json:"oldest_invoice_date,omitempty"`
}

// CustomerBalanceSummary represents a simplified customer balance view
type CustomerBalanceSummary struct {
	CustomerID       int64   `json:"customer_id"`
	TotalBalance     float64 `json:"total_balance"`
	OverdueBalance   float64 `json:"overdue_balance"`
	AvailableCredit  float64 `json:"available_credit"`
	Currency         string  `json:"currency"`
}

// ARAgingReportItem represents an item in the AR aging report
type ARAgingReportItem struct {
	CustomerID     int64   `json:"customer_id"`
	CustomerName   string  `json:"customer_name"`
	CustomerCode   string  `json:"customer_code"`
	CurrencyCode   string  `json:"currency_code"`
	Current        float64 `json:"current"`
	Days1to30      float64 `json:"days_1_to_30"`
	Days31to60     float64 `json:"days_31_to_60"`
	Days61to90     float64 `json:"days_61_to_90"`
	Over90Days     float64 `json:"over_90_days"`
	TotalBalance   float64 `json:"total_balance"`
}

// ARAgingReport represents the complete AR aging report
type ARAgingReport struct {
	GeneratedAt time.Time              `json:"generated_at"`
	Summary     ARAgingReportSummary   `json:"summary"`
	Items       []ARAgingReportItem    `json:"items"`
}

// ARAgingReportSummary represents summary totals for AR aging
type ARAgingReportSummary struct {
	TotalCustomers int     `json:"total_customers"`
	Current        float64 `json:"current"`
	Days1to30      float64 `json:"days_1_to_30"`
	Days31to60     float64 `json:"days_31_to_60"`
	Days61to90     float64 `json:"days_61_to_90"`
	Over90Days     float64 `json:"over_90_days"`
	TotalBalance   float64 `json:"total_balance"`
}