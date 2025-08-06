package models

import (
	"database/sql/driver"
	"fmt"
	"time"
)

// SupplierStatus represents the status of a supplier
type SupplierStatus string

const (
	SupplierStatusPending   SupplierStatus = "pending"
	SupplierStatusApproved  SupplierStatus = "approved"
	SupplierStatusRejected  SupplierStatus = "rejected"
	SupplierStatusSuspended SupplierStatus = "suspended"
	SupplierStatusInactive  SupplierStatus = "inactive"
)

// Scan implements the Scanner interface for SupplierStatus
func (s *SupplierStatus) Scan(value interface{}) error {
	if value == nil {
		*s = SupplierStatusPending
		return nil
	}
	if bv, err := driver.String.ConvertValue(value); err == nil {
		if v, ok := bv.(string); ok {
			*s = SupplierStatus(v)
			return nil
		}
	}
	return fmt.Errorf("cannot scan %T into SupplierStatus", value)
}

// Value implements the Valuer interface for SupplierStatus
func (s SupplierStatus) Value() (driver.Value, error) {
	return string(s), nil
}

// BusinessType represents the type of business
type BusinessType string

const (
	BusinessTypeManufacturer     BusinessType = "manufacturer"
	BusinessTypeDistributor      BusinessType = "distributor"
	BusinessTypeRetailer         BusinessType = "retailer"
	BusinessTypeServiceProvider  BusinessType = "service_provider"
)

// Scan implements the Scanner interface for BusinessType
func (bt *BusinessType) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	if bv, err := driver.String.ConvertValue(value); err == nil {
		if v, ok := bv.(string); ok {
			*bt = BusinessType(v)
			return nil
		}
	}
	return fmt.Errorf("cannot scan %T into BusinessType", value)
}

// Value implements the Valuer interface for BusinessType
func (bt BusinessType) Value() (driver.Value, error) {
	return string(bt), nil
}

// MarketplaceSupplier represents a supplier in the marketplace
type MarketplaceSupplier struct {
	ID                        int64                `json:"id" db:"id"`
	UserID                    *int64               `json:"user_id,omitempty" db:"user_id"`
	CompanyName               string               `json:"company_name" db:"company_name"`
	BusinessRegistrationNumber *string             `json:"business_registration_number,omitempty" db:"business_registration_number"`
	TaxID                     *string              `json:"tax_id,omitempty" db:"tax_id"`
	ContactPersonName         string               `json:"contact_person_name" db:"contact_person_name"`
	ContactEmail              string               `json:"contact_email" db:"contact_email"`
	ContactPhone              *string              `json:"contact_phone,omitempty" db:"contact_phone"`
	BusinessAddress           *string              `json:"business_address,omitempty" db:"business_address"`
	BillingAddress            *string              `json:"billing_address,omitempty" db:"billing_address"`
	WebsiteURL                *string              `json:"website_url,omitempty" db:"website_url"`
	BusinessType              *BusinessType        `json:"business_type,omitempty" db:"business_type"`
	BusinessCategory          *string              `json:"business_category,omitempty" db:"business_category"`
	Description               *string              `json:"description,omitempty" db:"description"`
	EstablishedYear           *int                 `json:"established_year,omitempty" db:"established_year"`
	EmployeeCountRange        *string              `json:"employee_count_range,omitempty" db:"employee_count_range"`
	AnnualRevenueRange        *string              `json:"annual_revenue_range,omitempty" db:"annual_revenue_range"`
	PaymentTerms              *string              `json:"payment_terms,omitempty" db:"payment_terms"`
	DeliveryCapabilities      *string              `json:"delivery_capabilities,omitempty" db:"delivery_capabilities"`
	Certifications            *string              `json:"certifications,omitempty" db:"certifications"`
	ProfileImageURL           *string              `json:"profile_image_url,omitempty" db:"profile_image_url"`
	CoverImageURL             *string              `json:"cover_image_url,omitempty" db:"cover_image_url"`
	Status                    SupplierStatus       `json:"status" db:"status"`
	ApprovalDate              *time.Time           `json:"approval_date,omitempty" db:"approval_date"`
	ApprovedBy                *int64               `json:"approved_by,omitempty" db:"approved_by"`
	RejectionReason           *string              `json:"rejection_reason,omitempty" db:"rejection_reason"`
	LastActivityDate          *time.Time           `json:"last_activity_date,omitempty" db:"last_activity_date"`
	CreatedAt                 time.Time            `json:"created_at" db:"created_at"`
	UpdatedAt                 time.Time            `json:"updated_at" db:"updated_at"`
	DeletedAt                 *time.Time           `json:"deleted_at,omitempty" db:"deleted_at"`
}

// ProductStatus represents the status of a marketplace product
type ProductStatus string

const (
	ProductStatusDraft         ProductStatus = "draft"
	ProductStatusPendingReview ProductStatus = "pending_review"
	ProductStatusApproved      ProductStatus = "approved"
	ProductStatusRejected      ProductStatus = "rejected"
	ProductStatusInactive      ProductStatus = "inactive"
)

// Scan implements the Scanner interface for ProductStatus
func (ps *ProductStatus) Scan(value interface{}) error {
	if value == nil {
		*ps = ProductStatusDraft
		return nil
	}
	if bv, err := driver.String.ConvertValue(value); err == nil {
		if v, ok := bv.(string); ok {
			*ps = ProductStatus(v)
			return nil
		}
	}
	return fmt.Errorf("cannot scan %T into ProductStatus", value)
}

// Value implements the Valuer interface for ProductStatus
func (ps ProductStatus) Value() (driver.Value, error) {
	return string(ps), nil
}

// StockStatus represents the stock status of a product
type StockStatus string

const (
	StockStatusInStock      StockStatus = "in_stock"
	StockStatusLowStock     StockStatus = "low_stock"
	StockStatusOutOfStock   StockStatus = "out_of_stock"
	StockStatusDiscontinued StockStatus = "discontinued"
)

// Scan implements the Scanner interface for StockStatus
func (ss *StockStatus) Scan(value interface{}) error {
	if value == nil {
		*ss = StockStatusInStock
		return nil
	}
	if bv, err := driver.String.ConvertValue(value); err == nil {
		if v, ok := bv.(string); ok {
			*ss = StockStatus(v)
			return nil
		}
	}
	return fmt.Errorf("cannot scan %T into StockStatus", value)
}

// Value implements the Valuer interface for StockStatus
func (ss StockStatus) Value() (driver.Value, error) {
	return string(ss), nil
}

// MarketplaceCategory represents a product category
type MarketplaceCategory struct {
	ID              int64      `json:"id" db:"id"`
	ParentID        *int64     `json:"parent_id,omitempty" db:"parent_id"`
	Name            string     `json:"name" db:"name"`
	Slug            string     `json:"slug" db:"slug"`
	Description     *string    `json:"description,omitempty" db:"description"`
	IconURL         *string    `json:"icon_url,omitempty" db:"icon_url"`
	BannerURL       *string    `json:"banner_url,omitempty" db:"banner_url"`
	SortOrder       int        `json:"sort_order" db:"sort_order"`
	IsActive        bool       `json:"is_active" db:"is_active"`
	MetaTitle       *string    `json:"meta_title,omitempty" db:"meta_title"`
	MetaDescription *string    `json:"meta_description,omitempty" db:"meta_description"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

// MarketplaceProduct represents a product in the marketplace
type MarketplaceProduct struct {
	ID                     int64           `json:"id" db:"id"`
	SupplierID             int64           `json:"supplier_id" db:"supplier_id"`
	CategoryID             *int64          `json:"category_id,omitempty" db:"category_id"`
	InternalProductID      *int64          `json:"internal_product_id,omitempty" db:"internal_product_id"`
	SKU                    *string         `json:"sku,omitempty" db:"sku"`
	Name                   string          `json:"name" db:"name"`
	Slug                   string          `json:"slug" db:"slug"`
	ShortDescription       *string         `json:"short_description,omitempty" db:"short_description"`
	Description            *string         `json:"description,omitempty" db:"description"`
	Specifications         *string         `json:"specifications,omitempty" db:"specifications"`
	Brand                  *string         `json:"brand,omitempty" db:"brand"`
	Model                  *string         `json:"model,omitempty" db:"model"`
	UnitOfMeasure          *string         `json:"unit_of_measure,omitempty" db:"unit_of_measure"`
	MinimumOrderQuantity   int             `json:"minimum_order_quantity" db:"minimum_order_quantity"`
	MaximumOrderQuantity   *int            `json:"maximum_order_quantity,omitempty" db:"maximum_order_quantity"`
	LeadTimeDays           *int            `json:"lead_time_days,omitempty" db:"lead_time_days"`
	WeightKg               *float64        `json:"weight_kg,omitempty" db:"weight_kg"`
	DimensionsCm           *string         `json:"dimensions_cm,omitempty" db:"dimensions_cm"`
	OriginCountry          *string         `json:"origin_country,omitempty" db:"origin_country"`
	Certifications         *string         `json:"certifications,omitempty" db:"certifications"`
	WarrantyInfo           *string         `json:"warranty_info,omitempty" db:"warranty_info"`
	Price                  float64         `json:"price" db:"price"`
	Currency               string          `json:"currency" db:"currency"`
	DiscountPercentage     float64         `json:"discount_percentage" db:"discount_percentage"`
	PriceTier1Qty          *int            `json:"price_tier_1_qty,omitempty" db:"price_tier_1_qty"`
	PriceTier1Price        *float64        `json:"price_tier_1_price,omitempty" db:"price_tier_1_price"`
	PriceTier2Qty          *int            `json:"price_tier_2_qty,omitempty" db:"price_tier_2_qty"`
	PriceTier2Price        *float64        `json:"price_tier_2_price,omitempty" db:"price_tier_2_price"`
	PriceTier3Qty          *int            `json:"price_tier_3_qty,omitempty" db:"price_tier_3_qty"`
	PriceTier3Price        *float64        `json:"price_tier_3_price,omitempty" db:"price_tier_3_price"`
	StockQuantity          int             `json:"stock_quantity" db:"stock_quantity"`
	LowStockThreshold      int             `json:"low_stock_threshold" db:"low_stock_threshold"`
	StockStatus            StockStatus     `json:"stock_status" db:"stock_status"`
	MetaTitle              *string         `json:"meta_title,omitempty" db:"meta_title"`
	MetaDescription        *string         `json:"meta_description,omitempty" db:"meta_description"`
	Keywords               *string         `json:"keywords,omitempty" db:"keywords"`
	Status                 ProductStatus   `json:"status" db:"status"`
	IsFeatured             bool            `json:"is_featured" db:"is_featured"`
	IsNewArrival           bool            `json:"is_new_arrival" db:"is_new_arrival"`
	IsBestseller           bool            `json:"is_bestseller" db:"is_bestseller"`
	FeaturedUntil          *time.Time      `json:"featured_until,omitempty" db:"featured_until"`
	ViewCount              int             `json:"view_count" db:"view_count"`
	InquiryCount           int             `json:"inquiry_count" db:"inquiry_count"`
	OrderCount             int             `json:"order_count" db:"order_count"`
	LastViewedAt           *time.Time      `json:"last_viewed_at,omitempty" db:"last_viewed_at"`
	ApprovedDate           *time.Time      `json:"approved_date,omitempty" db:"approved_date"`
	ApprovedBy             *int64          `json:"approved_by,omitempty" db:"approved_by"`
	RejectionReason        *string         `json:"rejection_reason,omitempty" db:"rejection_reason"`
	CreatedAt              time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time       `json:"updated_at" db:"updated_at"`
	DeletedAt              *time.Time      `json:"deleted_at,omitempty" db:"deleted_at"`
}

// MarketplaceProductImage represents a product image
type MarketplaceProductImage struct {
	ID        int64     `json:"id" db:"id"`
	ProductID int64     `json:"product_id" db:"product_id"`
	ImageURL  string    `json:"image_url" db:"image_url"`
	AltText   *string   `json:"alt_text,omitempty" db:"alt_text"`
	SortOrder int       `json:"sort_order" db:"sort_order"`
	IsPrimary bool      `json:"is_primary" db:"is_primary"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// InquiryStatus represents the status of an inquiry
type InquiryStatus string

const (
	InquiryStatusNew       InquiryStatus = "new"
	InquiryStatusResponded InquiryStatus = "responded"
	InquiryStatusQuoted    InquiryStatus = "quoted"
	InquiryStatusConverted InquiryStatus = "converted"
	InquiryStatusClosed    InquiryStatus = "closed"
)

// Scan implements the Scanner interface for InquiryStatus
func (is *InquiryStatus) Scan(value interface{}) error {
	if value == nil {
		*is = InquiryStatusNew
		return nil
	}
	if bv, err := driver.String.ConvertValue(value); err == nil {
		if v, ok := bv.(string); ok {
			*is = InquiryStatus(v)
			return nil
		}
	}
	return fmt.Errorf("cannot scan %T into InquiryStatus", value)
}

// Value implements the Valuer interface for InquiryStatus
func (is InquiryStatus) Value() (driver.Value, error) {
	return string(is), nil
}

// MarketplaceInquiry represents a buyer inquiry to a supplier
type MarketplaceInquiry struct {
	ID               int64          `json:"id" db:"id"`
	ProductID        int64          `json:"product_id" db:"product_id"`
	SupplierID       int64          `json:"supplier_id" db:"supplier_id"`
	BuyerUserID      *int64         `json:"buyer_user_id,omitempty" db:"buyer_user_id"`
	BuyerName        string         `json:"buyer_name" db:"buyer_name"`
	BuyerEmail       string         `json:"buyer_email" db:"buyer_email"`
	BuyerPhone       *string        `json:"buyer_phone,omitempty" db:"buyer_phone"`
	BuyerCompany     *string        `json:"buyer_company,omitempty" db:"buyer_company"`
	Message          string         `json:"message" db:"message"`
	Quantity         *int           `json:"quantity,omitempty" db:"quantity"`
	TargetPrice      *float64       `json:"target_price,omitempty" db:"target_price"`
	DeliveryDate     *time.Time     `json:"delivery_date,omitempty" db:"delivery_date"`
	Status           InquiryStatus  `json:"status" db:"status"`
	SupplierResponse *string        `json:"supplier_response,omitempty" db:"supplier_response"`
	RespondedAt      *time.Time     `json:"responded_at,omitempty" db:"responded_at"`
	CreatedAt        time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at" db:"updated_at"`
}

// ReviewStatus represents the status of a review
type ReviewStatus string

const (
	ReviewStatusPending  ReviewStatus = "pending"
	ReviewStatusApproved ReviewStatus = "approved"
	ReviewStatusRejected ReviewStatus = "rejected"
	ReviewStatusHidden   ReviewStatus = "hidden"
)

// Scan implements the Scanner interface for ReviewStatus
func (rs *ReviewStatus) Scan(value interface{}) error {
	if value == nil {
		*rs = ReviewStatusPending
		return nil
	}
	if bv, err := driver.String.ConvertValue(value); err == nil {
		if v, ok := bv.(string); ok {
			*rs = ReviewStatus(v)
			return nil
		}
	}
	return fmt.Errorf("cannot scan %T into ReviewStatus", value)
}

// Value implements the Valuer interface for ReviewStatus
func (rs ReviewStatus) Value() (driver.Value, error) {
	return string(rs), nil
}

// MarketplaceReview represents a product/supplier review
type MarketplaceReview struct {
	ID                  int64        `json:"id" db:"id"`
	ProductID           int64        `json:"product_id" db:"product_id"`
	SupplierID          int64        `json:"supplier_id" db:"supplier_id"`
	ReviewerUserID      *int64       `json:"reviewer_user_id,omitempty" db:"reviewer_user_id"`
	ReviewerName        string       `json:"reviewer_name" db:"reviewer_name"`
	ReviewerEmail       *string      `json:"reviewer_email,omitempty" db:"reviewer_email"`
	Rating              int          `json:"rating" db:"rating"`
	Title               *string      `json:"title,omitempty" db:"title"`
	ReviewText          *string      `json:"review_text,omitempty" db:"review_text"`
	IsVerifiedPurchase  bool         `json:"is_verified_purchase" db:"is_verified_purchase"`
	OrderID             *int64       `json:"order_id,omitempty" db:"order_id"`
	HelpfulCount        int          `json:"helpful_count" db:"helpful_count"`
	Status              ReviewStatus `json:"status" db:"status"`
	ModeratedBy         *int64       `json:"moderated_by,omitempty" db:"moderated_by"`
	ModeratedAt         *time.Time   `json:"moderated_at,omitempty" db:"moderated_at"`
	CreatedAt           time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time    `json:"updated_at" db:"updated_at"`
}

// MarketplaceSupplierDocument represents supplier verification documents
type MarketplaceSupplierDocument struct {
	ID           int64      `json:"id" db:"id"`
	SupplierID   int64      `json:"supplier_id" db:"supplier_id"`
	DocumentType string     `json:"document_type" db:"document_type"`
	DocumentName string     `json:"document_name" db:"document_name"`
	FileURL      string     `json:"file_url" db:"file_url"`
	FileSize     *int       `json:"file_size,omitempty" db:"file_size"`
	MimeType     *string    `json:"mime_type,omitempty" db:"mime_type"`
	IsVerified   bool       `json:"is_verified" db:"is_verified"`
	VerifiedBy   *int64     `json:"verified_by,omitempty" db:"verified_by"`
	VerifiedAt   *time.Time `json:"verified_at,omitempty" db:"verified_at"`
	ExpiryDate   *time.Time `json:"expiry_date,omitempty" db:"expiry_date"`
	Notes        *string    `json:"notes,omitempty" db:"notes"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}