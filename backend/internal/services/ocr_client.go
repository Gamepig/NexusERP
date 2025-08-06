package services

import (
	"context"
	"encoding/json"
)

// OCRClient defines the interface for OCR service providers
type OCRClient interface {
	// ProcessDocument processes a document file and returns structured OCR results
	ProcessDocument(ctx context.Context, filePath string) (*OCRResponse, error)
	
	// Close closes any resources used by the client
	Close() error
}

// OCRResponse represents the structured response from an OCR service
type OCRResponse struct {
	// Raw text extracted from the document
	RawText string `json:"raw_text"`
	
	// Confidence score (0.0 to 1.0)
	Confidence float64 `json:"confidence"`
	
	// Detected language code (e.g., "zh-TW", "en-US")
	Language string `json:"language"`
	
	// Processing time in milliseconds
	ProcessingTime int64 `json:"processing_time"`
	
	// Structured data extracted from the document (varies by document type)
	StructuredData *json.RawMessage `json:"structured_data,omitempty"`
	
	// Any error message from the OCR service
	ErrorMessage string `json:"error_message,omitempty"`
	
	// Provider-specific raw response
	ProviderResponse *json.RawMessage `json:"provider_response,omitempty"`
}

// InvoiceStructuredData represents structured data extracted from an invoice
type InvoiceStructuredData struct {
	InvoiceNumber   string                 `json:"invoice_number,omitempty"`
	InvoiceDate     string                 `json:"invoice_date,omitempty"`
	DueDate         string                 `json:"due_date,omitempty"`
	SupplierName    string                 `json:"supplier_name,omitempty"`
	SupplierAddress string                 `json:"supplier_address,omitempty"`
	TaxNumber       string                 `json:"tax_number,omitempty"`
	Subtotal        *float64               `json:"subtotal,omitempty"`
	TaxAmount       *float64               `json:"tax_amount,omitempty"`
	TotalAmount     *float64               `json:"total_amount,omitempty"`
	Currency        string                 `json:"currency,omitempty"`
	Items           []InvoiceItemExtracted `json:"items,omitempty"`
}

// InvoiceItemExtracted represents a line item extracted from an invoice
type InvoiceItemExtracted struct {
	Description string   `json:"description,omitempty"`
	Quantity    *float64 `json:"quantity,omitempty"`
	UnitPrice   *float64 `json:"unit_price,omitempty"`
	Amount      *float64 `json:"amount,omitempty"`
	TaxRate     *float64 `json:"tax_rate,omitempty"`
}

// OCRClientFactory creates OCR clients based on provider configuration
type OCRClientFactory interface {
	CreateClient(provider string, config map[string]string) (OCRClient, error)
}