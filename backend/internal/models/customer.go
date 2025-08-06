package models

import (
	"time"
	"encoding/json"
	"database/sql/driver"
)

// JSONBMap is a custom type for handling JSONB fields
type JSONBMap map[string]interface{}

// Value implements the driver.Valuer interface for database storage
func (j JSONBMap) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements the sql.Scanner interface for database retrieval
func (j *JSONBMap) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	
	return json.Unmarshal(bytes, j)
}

// Customer represents the main customer entity
type Customer struct {
	ID                   int64      `json:"id" db:"id"`
	CustomerCode         string     `json:"customer_code" db:"customer_code"`
	Name                 string     `json:"name" db:"name"`
	CompanyName          *string    `json:"company_name,omitempty" db:"company_name"`
	CustomerType         string     `json:"customer_type" db:"customer_type"`
	Status               string     `json:"status" db:"status"`
	
	// Primary contact information
	PrimaryEmail         *string    `json:"primary_email,omitempty" db:"primary_email"`
	PrimaryPhone         *string    `json:"primary_phone,omitempty" db:"primary_phone"`
	
	// Address information
	AddressLine1         *string    `json:"address_line1,omitempty" db:"address_line1"`
	AddressLine2         *string    `json:"address_line2,omitempty" db:"address_line2"`
	City                 *string    `json:"city,omitempty" db:"city"`
	State                *string    `json:"state,omitempty" db:"state"`
	PostalCode           *string    `json:"postal_code,omitempty" db:"postal_code"`
	Country              *string    `json:"country,omitempty" db:"country"`
	
	// Business information
	TaxID                *string    `json:"tax_id,omitempty" db:"tax_id"`
	CreditLimit          float64    `json:"credit_limit" db:"credit_limit"`
	CreditUsed           float64    `json:"credit_used" db:"credit_used"`
	PaymentTerms         int        `json:"payment_terms" db:"payment_terms"`
	DiscountPercentage   float64    `json:"discount_percentage" db:"discount_percentage"`
	
	// Classification and segmentation
	Industry             *string    `json:"industry,omitempty" db:"industry"`
	CustomerSegment      *string    `json:"customer_segment,omitempty" db:"customer_segment"`
	LeadSource           *string    `json:"lead_source,omitempty" db:"lead_source"`
	AssignedSalesRepID   *int64     `json:"assigned_sales_rep_id,omitempty" db:"assigned_sales_rep_id"`
	
	// Additional metadata
	Notes                *string    `json:"notes,omitempty" db:"notes"`
	Tags                 JSONBMap   `json:"tags,omitempty" db:"tags"`
	CustomFields         JSONBMap   `json:"custom_fields,omitempty" db:"custom_fields"`
	
	// Relations
	CreatedByUserID      *int64     `json:"created_by_user_id,omitempty" db:"created_by_user_id"`
	CompanyID            int64      `json:"company_id" db:"company_id"`
	
	// Encryption flags
	NameEncrypted        bool       `json:"name_encrypted" db:"name_encrypted"`
	EmailEncrypted       bool       `json:"email_encrypted" db:"email_encrypted"`
	PhoneEncrypted       bool       `json:"phone_encrypted" db:"phone_encrypted"`
	AddressEncrypted     bool       `json:"address_encrypted" db:"address_encrypted"`
	TaxIDEncrypted       bool       `json:"tax_id_encrypted" db:"tax_id_encrypted"`
	
	// Search hashes
	NameSearchHash       *string    `json:"name_search_hash,omitempty" db:"name_search_hash"`
	EmailSearchHash      *string    `json:"email_search_hash,omitempty" db:"email_search_hash"`
	PhoneSearchHash      *string    `json:"phone_search_hash,omitempty" db:"phone_search_hash"`
	
	// Timestamps
	FirstPurchaseDate    *time.Time `json:"first_purchase_date,omitempty" db:"first_purchase_date"`
	LastPurchaseDate     *time.Time `json:"last_purchase_date,omitempty" db:"last_purchase_date"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt            *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// CustomerContact represents contact persons for customers
type CustomerContact struct {
	ID                     int64      `json:"id" db:"id"`
	CustomerID             int64      `json:"customer_id" db:"customer_id"`
	ContactType            string     `json:"contact_type" db:"contact_type"`
	
	// Contact person information
	FirstName              *string    `json:"first_name,omitempty" db:"first_name"`
	LastName               *string    `json:"last_name,omitempty" db:"last_name"`
	Title                  *string    `json:"title,omitempty" db:"title"`
	Department             *string    `json:"department,omitempty" db:"department"`
	
	// Contact details
	Email                  *string    `json:"email,omitempty" db:"email"`
	Phone                  *string    `json:"phone,omitempty" db:"phone"`
	Mobile                 *string    `json:"mobile,omitempty" db:"mobile"`
	Fax                    *string    `json:"fax,omitempty" db:"fax"`
	
	// Address (if different from customer)
	AddressLine1           *string    `json:"address_line1,omitempty" db:"address_line1"`
	AddressLine2           *string    `json:"address_line2,omitempty" db:"address_line2"`
	City                   *string    `json:"city,omitempty" db:"city"`
	State                  *string    `json:"state,omitempty" db:"state"`
	PostalCode             *string    `json:"postal_code,omitempty" db:"postal_code"`
	Country                *string    `json:"country,omitempty" db:"country"`
	
	// Contact preferences
	IsPrimary              bool       `json:"is_primary" db:"is_primary"`
	ReceiveMarketing       bool       `json:"receive_marketing" db:"receive_marketing"`
	ReceiveInvoices        bool       `json:"receive_invoices" db:"receive_invoices"`
	ReceiveShippingUpdates bool       `json:"receive_shipping_updates" db:"receive_shipping_updates"`
	PreferredContactMethod string     `json:"preferred_contact_method" db:"preferred_contact_method"`
	
	// Additional information
	Notes                  *string    `json:"notes,omitempty" db:"notes"`
	Tags                   JSONBMap   `json:"tags,omitempty" db:"tags"`
	
	// Timestamps
	CreatedAt              time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt              *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// CustomerActivity represents interactions and history with customers
type CustomerActivity struct {
	ID                    int64      `json:"id" db:"id"`
	CustomerID            int64      `json:"customer_id" db:"customer_id"`
	ContactID             *int64     `json:"contact_id,omitempty" db:"contact_id"`
	
	// Activity information
	ActivityType          string     `json:"activity_type" db:"activity_type"`
	ActivitySubtype       *string    `json:"activity_subtype,omitempty" db:"activity_subtype"`
	Subject               string     `json:"subject" db:"subject"`
	Description           *string    `json:"description,omitempty" db:"description"`
	
	// Activity status and priority
	Status                string     `json:"status" db:"status"`
	Priority              string     `json:"priority" db:"priority"`
	
	// Related information
	RelatedDocumentType   *string    `json:"related_document_type,omitempty" db:"related_document_type"`
	RelatedDocumentID     *int64     `json:"related_document_id,omitempty" db:"related_document_id"`
	
	// People involved
	CreatedByUserID       *int64     `json:"created_by_user_id,omitempty" db:"created_by_user_id"`
	AssignedToUserID      *int64     `json:"assigned_to_user_id,omitempty" db:"assigned_to_user_id"`
	
	// Timing
	ScheduledAt           *time.Time `json:"scheduled_at,omitempty" db:"scheduled_at"`
	CompletedAt           *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	DurationMinutes       *int       `json:"duration_minutes,omitempty" db:"duration_minutes"`
	
	// Follow-up
	FollowUpRequired      bool       `json:"follow_up_required" db:"follow_up_required"`
	FollowUpDate          *time.Time `json:"follow_up_date,omitempty" db:"follow_up_date"`
	FollowUpNotes         *string    `json:"follow_up_notes,omitempty" db:"follow_up_notes"`
	
	// Additional metadata
	Tags                  JSONBMap   `json:"tags,omitempty" db:"tags"`
	CustomFields          JSONBMap   `json:"custom_fields,omitempty" db:"custom_fields"`
	
	// Timestamps
	CreatedAt             time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at" db:"updated_at"`
}

// CustomerCreditHistory represents credit limit changes
type CustomerCreditHistory struct {
	ID                      int64      `json:"id" db:"id"`
	CustomerID              int64      `json:"customer_id" db:"customer_id"`
	
	// Credit change information
	ChangeType              string     `json:"change_type" db:"change_type"`
	Amount                  float64    `json:"amount" db:"amount"`
	PreviousLimit           float64    `json:"previous_limit" db:"previous_limit"`
	NewLimit                float64    `json:"new_limit" db:"new_limit"`
	
	// Reason and documentation
	Reason                  string     `json:"reason" db:"reason"`
	ReferenceDocumentType   *string    `json:"reference_document_type,omitempty" db:"reference_document_type"`
	ReferenceDocumentID     *int64     `json:"reference_document_id,omitempty" db:"reference_document_id"`
	
	// Approval workflow
	RequestedByUserID       *int64     `json:"requested_by_user_id,omitempty" db:"requested_by_user_id"`
	ApprovedByUserID        *int64     `json:"approved_by_user_id,omitempty" db:"approved_by_user_id"`
	ApprovedAt              *time.Time `json:"approved_at,omitempty" db:"approved_at"`
	
	// Additional information
	Notes                   *string    `json:"notes,omitempty" db:"notes"`
	
	// Timestamps
	CreatedAt               time.Time  `json:"created_at" db:"created_at"`
}

// Request/Response Models

// CreateCustomerRequest represents the request body for creating a customer
type CreateCustomerRequest struct {
	CustomerCode         string     `json:"customer_code" binding:"required"`
	Name                 string     `json:"name" binding:"required"`
	CompanyName          *string    `json:"company_name"`
	CustomerType         string     `json:"customer_type" binding:"required"`
	Status               string     `json:"status"`
	
	// Primary contact information
	PrimaryEmail         *string    `json:"primary_email"`
	PrimaryPhone         *string    `json:"primary_phone"`
	
	// Address information
	AddressLine1         *string    `json:"address_line1"`
	AddressLine2         *string    `json:"address_line2"`
	City                 *string    `json:"city"`
	State                *string    `json:"state"`
	PostalCode           *string    `json:"postal_code"`
	Country              *string    `json:"country"`
	
	// Business information
	TaxID                *string    `json:"tax_id"`
	CreditLimit          float64    `json:"credit_limit"`
	PaymentTerms         int        `json:"payment_terms"`
	DiscountPercentage   float64    `json:"discount_percentage"`
	
	// Classification and segmentation
	Industry             *string    `json:"industry"`
	CustomerSegment      *string    `json:"customer_segment"`
	LeadSource           *string    `json:"lead_source"`
	AssignedSalesRepID   *int64     `json:"assigned_sales_rep_id"`
	
	// Additional metadata
	Notes                *string    `json:"notes"`
	Tags                 JSONBMap   `json:"tags"`
	CustomFields         JSONBMap   `json:"custom_fields"`
}

// UpdateCustomerRequest represents the request body for updating a customer
type UpdateCustomerRequest struct {
	Name                 *string    `json:"name"`
	CompanyName          *string    `json:"company_name"`
	CustomerType         *string    `json:"customer_type"`
	Status               *string    `json:"status"`
	
	// Primary contact information
	PrimaryEmail         *string    `json:"primary_email"`
	PrimaryPhone         *string    `json:"primary_phone"`
	
	// Address information
	AddressLine1         *string    `json:"address_line1"`
	AddressLine2         *string    `json:"address_line2"`
	City                 *string    `json:"city"`
	State                *string    `json:"state"`
	PostalCode           *string    `json:"postal_code"`
	Country              *string    `json:"country"`
	
	// Business information
	TaxID                *string    `json:"tax_id"`
	CreditLimit          *float64   `json:"credit_limit"`
	PaymentTerms         *int       `json:"payment_terms"`
	DiscountPercentage   *float64   `json:"discount_percentage"`
	
	// Classification and segmentation
	Industry             *string    `json:"industry"`
	CustomerSegment      *string    `json:"customer_segment"`
	LeadSource           *string    `json:"lead_source"`
	AssignedSalesRepID   *int64     `json:"assigned_sales_rep_id"`
	
	// Additional metadata
	Notes                *string    `json:"notes"`
	Tags                 JSONBMap   `json:"tags"`
	CustomFields         JSONBMap   `json:"custom_fields"`
}

// CreateCustomerContactRequest represents the request body for creating a customer contact
type CreateCustomerContactRequest struct {
	CustomerID             int64      `json:"customer_id" binding:"required"`
	ContactType            string     `json:"contact_type" binding:"required"`
	
	// Contact person information
	FirstName              *string    `json:"first_name"`
	LastName               *string    `json:"last_name"`
	Title                  *string    `json:"title"`
	Department             *string    `json:"department"`
	
	// Contact details
	Email                  *string    `json:"email"`
	Phone                  *string    `json:"phone"`
	Mobile                 *string    `json:"mobile"`
	Fax                    *string    `json:"fax"`
	
	// Address (if different from customer)
	AddressLine1           *string    `json:"address_line1"`
	AddressLine2           *string    `json:"address_line2"`
	City                   *string    `json:"city"`
	State                  *string    `json:"state"`
	PostalCode             *string    `json:"postal_code"`
	Country                *string    `json:"country"`
	
	// Contact preferences
	IsPrimary              bool       `json:"is_primary"`
	ReceiveMarketing       bool       `json:"receive_marketing"`
	ReceiveInvoices        bool       `json:"receive_invoices"`
	ReceiveShippingUpdates bool       `json:"receive_shipping_updates"`
	PreferredContactMethod string     `json:"preferred_contact_method"`
	
	// Additional information
	Notes                  *string    `json:"notes"`
	Tags                   JSONBMap   `json:"tags"`
}

// CreateCustomerActivityRequest represents the request body for creating a customer activity
type CreateCustomerActivityRequest struct {
	CustomerID            int64      `json:"customer_id" binding:"required"`
	ContactID             *int64     `json:"contact_id"`
	
	// Activity information
	ActivityType          string     `json:"activity_type" binding:"required"`
	ActivitySubtype       *string    `json:"activity_subtype"`
	Subject               string     `json:"subject" binding:"required"`
	Description           *string    `json:"description"`
	
	// Activity status and priority
	Status                string     `json:"status"`
	Priority              string     `json:"priority"`
	
	// Related information
	RelatedDocumentType   *string    `json:"related_document_type"`
	RelatedDocumentID     *int64     `json:"related_document_id"`
	
	// People involved
	AssignedToUserID      *int64     `json:"assigned_to_user_id"`
	
	// Timing
	ScheduledAt           *time.Time `json:"scheduled_at"`
	DurationMinutes       *int       `json:"duration_minutes"`
	
	// Follow-up
	FollowUpRequired      bool       `json:"follow_up_required"`
	FollowUpDate          *time.Time `json:"follow_up_date"`
	FollowUpNotes         *string    `json:"follow_up_notes"`
	
	// Additional metadata
	Tags                  JSONBMap   `json:"tags"`
	CustomFields          JSONBMap   `json:"custom_fields"`
}

// CustomerResponse represents the response body for customer operations
type CustomerResponse struct {
	Customer
	Contacts     []CustomerContact  `json:"contacts,omitempty"`
	Activities   []CustomerActivity `json:"recent_activities,omitempty"`
	SalesRep     *User             `json:"sales_rep,omitempty"`
	CreditInfo   CustomerCreditInfo `json:"credit_info"`
}

// CustomerCreditInfo represents credit-related information
type CustomerCreditInfo struct {
	CreditLimit       float64 `json:"credit_limit"`
	CreditUsed        float64 `json:"credit_used"`
	CreditAvailable   float64 `json:"credit_available"`
	CreditUtilization float64 `json:"credit_utilization_percentage"`
}

// CustomerListResponse represents paginated customer list response
type CustomerListResponse struct {
	Customers []Customer `json:"customers"`
	Total     int64      `json:"total"`
	Page      int        `json:"page"`
	PageSize  int        `json:"page_size"`
	Pages     int        `json:"total_pages"`
}

// CustomerQueryParams represents query parameters for customer search
type CustomerQueryParams struct {
	Search          string `form:"search"`
	CustomerType    string `form:"customer_type"`
	Status          string `form:"status"`
	CustomerSegment string `form:"customer_segment"`
	SalesRepID      *int64 `form:"sales_rep_id"`
	Page            int    `form:"page,default=1"`
	PageSize        int    `form:"page_size,default=20"`
	SortBy          string `form:"sort_by,default=created_at"`
	SortOrder       string `form:"sort_order,default=desc"`
}

// CustomerConstants defines valid enum values
const (
	// Customer Types
	CustomerTypeIndividual   = "individual"
	CustomerTypeBusiness     = "business"
	CustomerTypeOrganization = "organization"
	
	// Customer Status
	CustomerStatusActive      = "active"
	CustomerStatusInactive    = "inactive"
	CustomerStatusBlacklisted = "blacklisted"
	
	// Customer Segments
	CustomerSegmentPremium  = "premium"
	CustomerSegmentStandard = "standard"
	CustomerSegmentBudget   = "budget"
	CustomerSegmentVIP      = "vip"
	
	// Contact Types
	ContactTypePrimary   = "primary"
	ContactTypeBilling   = "billing"
	ContactTypeShipping  = "shipping"
	ContactTypeTechnical = "technical"
	ContactTypeSales     = "sales"
	ContactTypeSupport   = "support"
	ContactTypeGeneral   = "general"
	
	// Activity Types
	ActivityTypeCall      = "call"
	ActivityTypeEmail     = "email"
	ActivityTypeMeeting   = "meeting"
	ActivityTypeQuote     = "quote"
	ActivityTypeOrder     = "order"
	ActivityTypePayment   = "payment"
	ActivityTypeComplaint = "complaint"
	ActivityTypeSupport   = "support"
	ActivityTypeNote      = "note"
	
	// Activity Status
	ActivityStatusPlanned     = "planned"
	ActivityStatusInProgress  = "in_progress"
	ActivityStatusCompleted   = "completed"
	ActivityStatusCancelled   = "cancelled"
	
	// Activity Priority
	ActivityPriorityLow    = "low"
	ActivityPriorityMedium = "medium"
	ActivityPriorityHigh   = "high"
	ActivityPriorityUrgent = "urgent"
	
	// Credit Change Types
	CreditChangeIncrease   = "increase"
	CreditChangeDecrease   = "decrease"
	CreditChangeAdjustment = "adjustment"
)