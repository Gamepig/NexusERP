package models

import (
	"encoding/json"
	"time"
)

// OCRDocumentType represents the type of document being processed
type OCRDocumentType string

const (
	OCRDocumentTypeInvoice   OCRDocumentType = "invoice"
	OCRDocumentTypeReceipt   OCRDocumentType = "receipt"
	OCRDocumentTypeContract  OCRDocumentType = "contract"
	OCRDocumentTypeMenu      OCRDocumentType = "menu"
	OCRDocumentTypeBusinessCard OCRDocumentType = "business_card"
	OCRDocumentTypePurchaseOrder OCRDocumentType = "purchase_order"
	OCRDocumentTypeDeliveryNote OCRDocumentType = "delivery_note"
	OCRDocumentTypeQuotation OCRDocumentType = "quotation"
	OCRDocumentTypeOther     OCRDocumentType = "other"
)

// OCRStatus represents the processing status of an OCR task
type OCRStatus string

const (
	OCRStatusPending    OCRStatus = "pending"
	OCRStatusProcessing OCRStatus = "processing"
	OCRStatusCompleted  OCRStatus = "completed"
	OCRStatusFailed     OCRStatus = "failed"
	OCRStatusVerified   OCRStatus = "verified"
)

// OCRDocument represents an uploaded document for OCR processing
type OCRDocument struct {
	ID          int64           `json:"id" db:"id"`
	FileName    string          `json:"file_name" db:"file_name"`
	FileSize    int64           `json:"file_size" db:"file_size"`
	FileType    string          `json:"file_type" db:"file_type"`
	FilePath    string          `json:"file_path" db:"file_path"`
	DocumentType OCRDocumentType `json:"document_type" db:"document_type"`
	Status      OCRStatus       `json:"status" db:"status"`
	Progress    int             `json:"progress" db:"progress"`
	CreatedByUserID int64       `json:"created_by_user_id" db:"created_by_user_id"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at" db:"updated_at"`
}

// OCRResult represents the result of OCR processing
type OCRResult struct {
	ID          int64           `json:"id" db:"id"`
	DocumentID  int64           `json:"document_id" db:"document_id"`
	RawText     string          `json:"raw_text" db:"raw_text"`
	StructuredData *json.RawMessage `json:"structured_data,omitempty" db:"structured_data"`
	Confidence  float64         `json:"confidence" db:"confidence"`
	Language    string          `json:"language" db:"language"`
	ProcessingTime int64        `json:"processing_time" db:"processing_time"`
	ErrorMessage *string        `json:"error_message,omitempty" db:"error_message"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at" db:"updated_at"`
}

// OCRTemplate represents a document template for parsing
type OCRTemplate struct {
	ID          int64           `json:"id" db:"id"`
	Name        string          `json:"name" db:"name"`
	DocumentType OCRDocumentType `json:"document_type" db:"document_type"`
	Description *string         `json:"description,omitempty" db:"description"`
	Fields      *json.RawMessage `json:"fields,omitempty" db:"fields"`
	Rules       *json.RawMessage `json:"rules,omitempty" db:"rules"`
	IsActive    bool            `json:"is_active" db:"is_active"`
	CreatedByUserID int64       `json:"created_by_user_id" db:"created_by_user_id"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at" db:"updated_at"`
}

// OCRDocumentWithDetails represents a document with its processing results
type OCRDocumentWithDetails struct {
	OCRDocument
	Result    *OCRResult `json:"result,omitempty"`
	Template  *OCRTemplate `json:"template,omitempty"`
	CreatedByUser *User   `json:"created_by_user,omitempty"`
}

// Request/Response Models

// UploadDocumentRequest represents the request for document upload
type UploadDocumentRequest struct {
	DocumentType OCRDocumentType `json:"document_type" binding:"required"`
	TemplateID   *int64          `json:"template_id,omitempty"`
}

// ProcessDocumentRequest represents the request to process a document
type ProcessDocumentRequest struct {
	DocumentID  int64  `json:"document_id" binding:"required"`
	TemplateID  *int64 `json:"template_id,omitempty"`
	Language    string `json:"language,omitempty"`
	AutoVerify  bool   `json:"auto_verify"`
}

// VerifyOCRResultRequest represents the request to verify OCR results
type VerifyOCRResultRequest struct {
	DocumentID     int64           `json:"document_id" binding:"required"`
	VerifiedData   *json.RawMessage `json:"verified_data,omitempty"`
	IsAccurate     bool            `json:"is_accurate"`
	CorrectionNotes *string         `json:"correction_notes,omitempty"`
}

// CreateTemplateRequest represents the request to create an OCR template
type CreateTemplateRequest struct {
	Name         string          `json:"name" binding:"required"`
	DocumentType OCRDocumentType `json:"document_type" binding:"required"`
	Description  string          `json:"description"`
	Fields       *json.RawMessage `json:"fields,omitempty"`
	Rules        *json.RawMessage `json:"rules,omitempty"`
}

// UpdateTemplateRequest represents the request to update an OCR template
type UpdateTemplateRequest struct {
	Name         string          `json:"name" binding:"required"`
	DocumentType OCRDocumentType `json:"document_type" binding:"required"`
	Description  string          `json:"description"`
	Fields       *json.RawMessage `json:"fields,omitempty"`
	Rules        *json.RawMessage `json:"rules,omitempty"`
	IsActive     bool            `json:"is_active"`
}

// BatchProcessRequest represents the request for batch processing
type BatchProcessRequest struct {
	DocumentIDs  []int64 `json:"document_ids" binding:"required,min=1"`
	TemplateID   *int64  `json:"template_id,omitempty"`
	Language     string  `json:"language,omitempty"`
	AutoVerify   bool    `json:"auto_verify"`
}

// OCRStats represents OCR processing statistics
type OCRStats struct {
	TotalDocuments    int64   `json:"total_documents"`
	ProcessedDocuments int64  `json:"processed_documents"`
	PendingDocuments  int64   `json:"pending_documents"`
	FailedDocuments   int64   `json:"failed_documents"`
	AverageConfidence float64 `json:"average_confidence"`
	AverageProcessingTime float64 `json:"average_processing_time"`
}

// Structured data models for common document types

// InvoiceData represents structured invoice data extracted from OCR
type InvoiceData struct {
	InvoiceNumber string    `json:"invoice_number,omitempty"`
	InvoiceDate   *string   `json:"invoice_date,omitempty"`
	DueDate       *string   `json:"due_date,omitempty"`
	SupplierName  string    `json:"supplier_name,omitempty"`
	SupplierAddress string  `json:"supplier_address,omitempty"`
	TaxNumber     string    `json:"tax_number,omitempty"`
	Subtotal      *float64  `json:"subtotal,omitempty"`
	TaxAmount     *float64  `json:"tax_amount,omitempty"`
	TotalAmount   *float64  `json:"total_amount,omitempty"`
	Currency      string    `json:"currency,omitempty"`
	Items         []InvoiceItemData `json:"items,omitempty"`
}

// InvoiceItemData represents a line item in an invoice
type InvoiceItemData struct {
	Description string   `json:"description,omitempty"`
	Quantity    *float64 `json:"quantity,omitempty"`
	UnitPrice   *float64 `json:"unit_price,omitempty"`
	Amount      *float64 `json:"amount,omitempty"`
	TaxRate     *float64 `json:"tax_rate,omitempty"`
}

// BusinessCardData represents structured business card data
type BusinessCardData struct {
	Name        string `json:"name,omitempty"`
	JobTitle    string `json:"job_title,omitempty"`
	Company     string `json:"company,omitempty"`
	Email       string `json:"email,omitempty"`
	Phone       string `json:"phone,omitempty"`
	Mobile      string `json:"mobile,omitempty"`
	Address     string `json:"address,omitempty"`
	Website     string `json:"website,omitempty"`
}

// MenuData represents structured menu data
type MenuData struct {
	RestaurantName string     `json:"restaurant_name,omitempty"`
	Categories     []MenuCategory `json:"categories,omitempty"`
}

// MenuCategory represents a menu category
type MenuCategory struct {
	Name  string     `json:"name"`
	Items []MenuItem `json:"items"`
}

// MenuItem represents a menu item
type MenuItem struct {
	Name        string   `json:"name"`
	Description string   `json:"description,omitempty"`
	Price       *float64 `json:"price,omitempty"`
	Currency    string   `json:"currency,omitempty"`
}