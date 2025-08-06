package models

import (
	"time"
	"encoding/json"
)

// ProductCategory represents a product category
type ProductCategory struct {
	ID               int64      `json:"id" db:"id"`
	Name             string     `json:"name" db:"name"`
	ParentCategoryID *int64     `json:"parent_category_id,omitempty" db:"parent_category_id"`
	Description      *string    `json:"description,omitempty" db:"description"`
	IsActive         bool       `json:"is_active" db:"is_active"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
}

// Product represents a product
type Product struct {
	ID            int64           `json:"id" db:"id"`
	SKU           string          `json:"sku" db:"sku"`
	Name          string          `json:"name" db:"name"`
	Description   *string         `json:"description,omitempty" db:"description"`
	CategoryID    *int64          `json:"category_id,omitempty" db:"category_id"`
	UnitOfMeasure string          `json:"unit_of_measure" db:"unit_of_measure"`
	Weight        *float64        `json:"weight,omitempty" db:"weight"`
	Dimensions    *json.RawMessage `json:"dimensions,omitempty" db:"dimensions"`
	CostPrice     *float64        `json:"cost_price,omitempty" db:"cost_price"`
	SellingPrice  *float64        `json:"selling_price,omitempty" db:"selling_price"`
	Barcode       *string         `json:"barcode,omitempty" db:"barcode"`
	ImageURL      *string         `json:"image_url,omitempty" db:"image_url"`
	IsActive      bool            `json:"is_active" db:"is_active"`
	Attributes    *json.RawMessage `json:"attributes,omitempty" db:"attributes"`
	SupplierID    *int64          `json:"supplier_id,omitempty" db:"supplier_id"`
	ReorderPoint  int             `json:"reorder_point" db:"reorder_point"`
	CreatedAt     time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at" db:"updated_at"`
}

// Warehouse represents a warehouse
type Warehouse struct {
	ID          int64           `json:"id" db:"id"`
	Name        string          `json:"name" db:"name"`
	Code        string          `json:"code" db:"code"`
	Address     *json.RawMessage `json:"address,omitempty" db:"address"`
	ContactInfo *json.RawMessage `json:"contact_info,omitempty" db:"contact_info"`
	IsActive    bool            `json:"is_active" db:"is_active"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at" db:"updated_at"`
}

// InventoryLevel represents inventory levels for a product in a warehouse
type InventoryLevel struct {
	ProductID        int64     `json:"product_id" db:"product_id"`
	WarehouseID      int64     `json:"warehouse_id" db:"warehouse_id"`
	QuantityOnHand   int       `json:"quantity_on_hand" db:"quantity_on_hand"`
	QuantityAvailable int      `json:"quantity_available" db:"quantity_available"`
	QuantityReserved int       `json:"quantity_reserved" db:"quantity_reserved"`
	QuantityOnOrder  int       `json:"quantity_on_order" db:"quantity_on_order"`
	ReorderPoint     int       `json:"reorder_point" db:"reorder_point"`
	MaxStockLevel    *int      `json:"max_stock_level,omitempty" db:"max_stock_level"`
	LastUpdatedAt    time.Time `json:"last_updated_at" db:"last_updated_at"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

// InventoryTransactionType represents types of inventory transactions
type InventoryTransactionType struct {
	ID          int64     `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description *string   `json:"description,omitempty" db:"description"`
	IsInbound   bool      `json:"is_inbound" db:"is_inbound"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// InventoryTransaction represents an inventory transaction
type InventoryTransaction struct {
	ID                     int64      `json:"id" db:"id"`
	TransactionTypeID      int64      `json:"transaction_type_id" db:"transaction_type_id"`
	ProductID              int64      `json:"product_id" db:"product_id"`
	WarehouseID            int64      `json:"warehouse_id" db:"warehouse_id"`
	QuantityChanged        int        `json:"quantity_changed" db:"quantity_changed"`
	QuantityBefore         int        `json:"quantity_before" db:"quantity_before"`
	QuantityAfter          int        `json:"quantity_after" db:"quantity_after"`
	UnitCost               *float64   `json:"unit_cost,omitempty" db:"unit_cost"`
	TotalCost              *float64   `json:"total_cost,omitempty" db:"total_cost"`
	TransactionDate        time.Time  `json:"transaction_date" db:"transaction_date"`
	ReferenceDocumentType  *string    `json:"reference_document_type,omitempty" db:"reference_document_type"`
	ReferenceDocumentID    *int64     `json:"reference_document_id,omitempty" db:"reference_document_id"`
	UserID                 *int64     `json:"user_id,omitempty" db:"user_id"`
	Notes                  *string    `json:"notes,omitempty" db:"notes"`
	BatchNumber            *string    `json:"batch_number,omitempty" db:"batch_number"`
	ExpiryDate             *time.Time `json:"expiry_date,omitempty" db:"expiry_date"`
	CreatedAt              time.Time  `json:"created_at" db:"created_at"`
}

// Request/Response Models

// CreateProductCategoryRequest represents the request body for creating a product category
type CreateProductCategoryRequest struct {
	Name             string `json:"name" binding:"required"`
	ParentCategoryID *int64 `json:"parent_category_id,omitempty"`
	Description      string `json:"description"`
}

// UpdateProductCategoryRequest represents the request body for updating a product category
type UpdateProductCategoryRequest struct {
	Name             string `json:"name" binding:"required"`
	ParentCategoryID *int64 `json:"parent_category_id,omitempty"`
	Description      string `json:"description"`
	IsActive         bool   `json:"is_active"`
}

// CreateProductRequest represents the request body for creating a product
type CreateProductRequest struct {
	SKU           string          `json:"sku" binding:"required"`
	Name          string          `json:"name" binding:"required"`
	Description   string          `json:"description"`
	CategoryID    *int64          `json:"category_id,omitempty"`
	UnitOfMeasure string          `json:"unit_of_measure"`
	Weight        *float64        `json:"weight,omitempty"`
	Dimensions    *json.RawMessage `json:"dimensions,omitempty"`
	CostPrice     *float64        `json:"cost_price,omitempty"`
	SellingPrice  *float64        `json:"selling_price,omitempty"`
	Barcode       string          `json:"barcode"`
	ImageURL      string          `json:"image_url"`
	Attributes    *json.RawMessage `json:"attributes,omitempty"`
	SupplierID    *int64          `json:"supplier_id,omitempty"`
	ReorderPoint  int             `json:"reorder_point"`
}

// UpdateProductRequest represents the request body for updating a product
type UpdateProductRequest struct {
	SKU           string          `json:"sku" binding:"required"`
	Name          string          `json:"name" binding:"required"`
	Description   string          `json:"description"`
	CategoryID    *int64          `json:"category_id,omitempty"`
	UnitOfMeasure string          `json:"unit_of_measure"`
	Weight        *float64        `json:"weight,omitempty"`
	Dimensions    *json.RawMessage `json:"dimensions,omitempty"`
	CostPrice     *float64        `json:"cost_price,omitempty"`
	SellingPrice  *float64        `json:"selling_price,omitempty"`
	Barcode       string          `json:"barcode"`
	ImageURL      string          `json:"image_url"`
	IsActive      bool            `json:"is_active"`
	Attributes    *json.RawMessage `json:"attributes,omitempty"`
	SupplierID    *int64          `json:"supplier_id,omitempty"`
	ReorderPoint  int             `json:"reorder_point"`
}

// CreateWarehouseRequest represents the request body for creating a warehouse
type CreateWarehouseRequest struct {
	Name        string          `json:"name" binding:"required"`
	Code        string          `json:"code" binding:"required"`
	Address     *json.RawMessage `json:"address,omitempty"`
	ContactInfo *json.RawMessage `json:"contact_info,omitempty"`
}

// UpdateWarehouseRequest represents the request body for updating a warehouse
type UpdateWarehouseRequest struct {
	Name        string          `json:"name" binding:"required"`
	Code        string          `json:"code" binding:"required"`
	Address     *json.RawMessage `json:"address,omitempty"`
	ContactInfo *json.RawMessage `json:"contact_info,omitempty"`
	IsActive    bool            `json:"is_active"`
}

// CreateInventoryTransactionRequest represents the request body for creating an inventory transaction
type CreateInventoryTransactionRequest struct {
	TransactionTypeID     int64      `json:"transaction_type_id" binding:"required"`
	ProductID             int64      `json:"product_id" binding:"required"`
	WarehouseID           int64      `json:"warehouse_id" binding:"required"`
	QuantityChanged       int        `json:"quantity_changed" binding:"required"`
	UnitCost              *float64   `json:"unit_cost,omitempty"`
	ReferenceDocumentType *string    `json:"reference_document_type,omitempty"`
	ReferenceDocumentID   *int64     `json:"reference_document_id,omitempty"`
	Notes                 string     `json:"notes"`
	BatchNumber           string     `json:"batch_number"`
	ExpiryDate            *time.Time `json:"expiry_date,omitempty"`
}

// InventoryLevelWithDetails represents inventory level with product and warehouse details
type InventoryLevelWithDetails struct {
	InventoryLevel
	Product   *Product   `json:"product,omitempty"`
	Warehouse *Warehouse `json:"warehouse,omitempty"`
}

// InventoryTransactionWithDetails represents inventory transaction with related details
type InventoryTransactionWithDetails struct {
	InventoryTransaction
	TransactionType *InventoryTransactionType `json:"transaction_type,omitempty"`
	Product         *Product                  `json:"product,omitempty"`
	Warehouse       *Warehouse                `json:"warehouse,omitempty"`
	User            *User                     `json:"user,omitempty"`
}

// SupplierAddress represents supplier address information
type SupplierAddress struct {
	Street   string `json:"street,omitempty"`
	City     string `json:"city,omitempty"`
	State    string `json:"state,omitempty"`
	Country  string `json:"country,omitempty"`
	PostCode string `json:"post_code,omitempty"`
}

// Supplier represents a supplier/vendor
type Supplier struct {
	ID            int64           `json:"id" db:"id"`
	Code          string          `json:"code" db:"code"`
	Name          string          `json:"name" db:"name"`
	ContactPerson *string         `json:"contact_person,omitempty" db:"contact_person"`
	Email         *string         `json:"email,omitempty" db:"email"`
	Phone         *string         `json:"phone,omitempty" db:"phone"`
	Address       *json.RawMessage `json:"address,omitempty" db:"address"`
	TaxNumber     *string         `json:"tax_number,omitempty" db:"tax_number"`
	PaymentTerms  *string         `json:"payment_terms,omitempty" db:"payment_terms"`
	CreditLimit   *float64        `json:"credit_limit,omitempty" db:"credit_limit"`
	IsActive      bool            `json:"is_active" db:"is_active"`
	Notes         *string         `json:"notes,omitempty" db:"notes"`
	CreatedAt     time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at" db:"updated_at"`
}

// GetParsedAddress parses the JSON address and returns a SupplierAddress struct
func (s *Supplier) GetParsedAddress() (*SupplierAddress, error) {
	if s.Address == nil {
		return &SupplierAddress{}, nil
	}
	
	var addr SupplierAddress
	if err := json.Unmarshal(*s.Address, &addr); err != nil {
		return nil, err
	}
	return &addr, nil
}

// City returns the city from the parsed address
func (s *Supplier) City() string {
	addr, err := s.GetParsedAddress()
	if err != nil || addr == nil {
		return ""
	}
	return addr.City
}

// State returns the state from the parsed address
func (s *Supplier) State() string {
	addr, err := s.GetParsedAddress()
	if err != nil || addr == nil {
		return ""
	}
	return addr.State
}

// Country returns the country from the parsed address
func (s *Supplier) Country() string {
	addr, err := s.GetParsedAddress()
	if err != nil || addr == nil {
		return ""
	}
	return addr.Country
}

// PurchaseOrder represents a purchase order
type PurchaseOrder struct {
	ID                   int64           `json:"id" db:"id"`
	PONumber             string          `json:"po_number" db:"po_number"`
	SupplierID           int64           `json:"supplier_id" db:"supplier_id"`
	Status               string          `json:"status" db:"status"`
	OrderDate            time.Time       `json:"order_date" db:"order_date"`
	ExpectedDeliveryDate *time.Time      `json:"expected_delivery_date,omitempty" db:"expected_delivery_date"`
	DeliveryAddress      *json.RawMessage `json:"delivery_address,omitempty" db:"delivery_address"`
	Subtotal             float64         `json:"subtotal" db:"subtotal"`
	TaxAmount            float64         `json:"tax_amount" db:"tax_amount"`
	TotalAmount          float64         `json:"total_amount" db:"total_amount"`
	Currency             string          `json:"currency" db:"currency"`
	PaymentTerms         *string         `json:"payment_terms,omitempty" db:"payment_terms"`
	Notes                *string         `json:"notes,omitempty" db:"notes"`
	CreatedByUserID      *int64          `json:"created_by_user_id,omitempty" db:"created_by_user_id"`
	ApprovedByUserID     *int64          `json:"approved_by_user_id,omitempty" db:"approved_by_user_id"`
	ApprovedAt           *time.Time      `json:"approved_at,omitempty" db:"approved_at"`
	CreatedAt            time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at" db:"updated_at"`
}

// PurchaseOrderItem represents a line item in a purchase order
type PurchaseOrderItem struct {
	ID               int64     `json:"id" db:"id"`
	PurchaseOrderID  int64     `json:"purchase_order_id" db:"purchase_order_id"`
	ProductID        int64     `json:"product_id" db:"product_id"`
	Quantity         int       `json:"quantity" db:"quantity"`
	UnitPrice        float64   `json:"unit_price" db:"unit_price"`
	LineTotal        float64   `json:"line_total" db:"line_total"`
	QuantityReceived int       `json:"quantity_received" db:"quantity_received"`
	WarehouseID      *int64    `json:"warehouse_id,omitempty" db:"warehouse_id"`
	Notes            *string   `json:"notes,omitempty" db:"notes"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

// Request/Response Models for Suppliers

// CreateSupplierRequest represents the request body for creating a supplier
type CreateSupplierRequest struct {
	Code          string          `json:"code" binding:"required"`
	Name          string          `json:"name" binding:"required"`
	ContactPerson string          `json:"contact_person"`
	Email         string          `json:"email"`
	Phone         string          `json:"phone"`
	Address       *json.RawMessage `json:"address,omitempty"`
	TaxNumber     string          `json:"tax_number"`
	PaymentTerms  string          `json:"payment_terms"`
	CreditLimit   *float64        `json:"credit_limit,omitempty"`
	Notes         string          `json:"notes"`
}

// UpdateSupplierRequest represents the request body for updating a supplier
type UpdateSupplierRequest struct {
	Code          string          `json:"code" binding:"required"`
	Name          string          `json:"name" binding:"required"`
	ContactPerson string          `json:"contact_person"`
	Email         string          `json:"email"`
	Phone         string          `json:"phone"`
	Address       *json.RawMessage `json:"address,omitempty"`
	TaxNumber     string          `json:"tax_number"`
	PaymentTerms  string          `json:"payment_terms"`
	CreditLimit   *float64        `json:"credit_limit,omitempty"`
	IsActive      bool            `json:"is_active"`
	Notes         string          `json:"notes"`
}

// Request/Response Models for Purchase Orders

// CreatePurchaseOrderRequest represents the request body for creating a purchase order
type CreatePurchaseOrderRequest struct {
	SupplierID           int64                        `json:"supplier_id" binding:"required"`
	OrderDate            time.Time                    `json:"order_date" binding:"required"`
	ExpectedDeliveryDate *time.Time                   `json:"expected_delivery_date,omitempty"`
	DeliveryAddress      *json.RawMessage             `json:"delivery_address,omitempty"`
	Currency             string                       `json:"currency"`
	PaymentTerms         string                       `json:"payment_terms"`
	Notes                string                       `json:"notes"`
	Items                []CreatePurchaseOrderItemRequest `json:"items" binding:"required,min=1"`
}

// CreatePurchaseOrderItemRequest represents a line item in a purchase order creation request
type CreatePurchaseOrderItemRequest struct {
	ProductID   int64   `json:"product_id" binding:"required"`
	Quantity    int     `json:"quantity" binding:"required,min=1"`
	UnitPrice   float64 `json:"unit_price" binding:"required,min=0"`
	WarehouseID *int64  `json:"warehouse_id,omitempty"`
	Notes       string  `json:"notes"`
}

// UpdatePurchaseOrderRequest represents the request body for updating a purchase order
type UpdatePurchaseOrderRequest struct {
	SupplierID           int64                        `json:"supplier_id" binding:"required"`
	OrderDate            time.Time                    `json:"order_date" binding:"required"`
	ExpectedDeliveryDate *time.Time                   `json:"expected_delivery_date,omitempty"`
	DeliveryAddress      *json.RawMessage             `json:"delivery_address,omitempty"`
	Currency             string                       `json:"currency"`
	PaymentTerms         string                       `json:"payment_terms"`
	Notes                string                       `json:"notes"`
	Status               string                       `json:"status"`
	Items                []UpdatePurchaseOrderItemRequest `json:"items" binding:"required,min=1"`
}

// UpdatePurchaseOrderItemRequest represents a line item in a purchase order update request
type UpdatePurchaseOrderItemRequest struct {
	ID          *int64  `json:"id,omitempty"` // If nil, create new item
	ProductID   int64   `json:"product_id" binding:"required"`
	Quantity    int     `json:"quantity" binding:"required,min=1"`
	UnitPrice   float64 `json:"unit_price" binding:"required,min=0"`
	WarehouseID *int64  `json:"warehouse_id,omitempty"`
	Notes       string  `json:"notes"`
}

// ApprovePurchaseOrderRequest represents the request body for approving a purchase order
type ApprovePurchaseOrderRequest struct {
	Notes string `json:"notes"`
}

// ReceivePurchaseOrderRequest represents the request body for receiving goods
type ReceivePurchaseOrderRequest struct {
	Items []ReceivePurchaseOrderItemRequest `json:"items" binding:"required,min=1"`
	Notes string                            `json:"notes"`
}

// ReceivePurchaseOrderItemRequest represents a line item in a goods receipt
type ReceivePurchaseOrderItemRequest struct {
	PurchaseOrderItemID int64 `json:"purchase_order_item_id" binding:"required"`
	QuantityReceived    int   `json:"quantity_received" binding:"required,min=1"`
}

// PurchaseOrderWithDetails represents a purchase order with all related details
type PurchaseOrderWithDetails struct {
	PurchaseOrder
	Supplier     *Supplier            `json:"supplier,omitempty"`
	Items        []PurchaseOrderItemWithDetails `json:"items,omitempty"`
	CreatedByUser *User               `json:"created_by_user,omitempty"`
	ApprovedByUser *User              `json:"approved_by_user,omitempty"`
}

// PurchaseOrderItemWithDetails represents a purchase order item with product details
type PurchaseOrderItemWithDetails struct {
	PurchaseOrderItem
	Product   *Product   `json:"product,omitempty"`
	Warehouse *Warehouse `json:"warehouse,omitempty"`
}