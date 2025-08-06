package services

import (
	"context"
	"encoding/json"
	"fmt"
	"nexus-erp/backend/internal/models"
	"regexp"
	"strconv"
	"strings"
	"time"
)


// ParsedInvoiceData represents the standardized internal invoice data model
type ParsedInvoiceData struct {
	// Core invoice fields
	InvoiceNumber   string                     `json:"invoice_number"`
	InvoiceDate     *time.Time                 `json:"invoice_date,omitempty"`
	DueDate         *time.Time                 `json:"due_date,omitempty"`
	IssueDate       *time.Time                 `json:"issue_date,omitempty"` // Alias for InvoiceDate
	
	// Vendor/Supplier information
	VendorName      string                     `json:"vendor_name"`
	VendorAddress   string                     `json:"vendor_address,omitempty"`
	SupplierName    string                     `json:"supplier_name"` // Alias for VendorName
	SupplierAddress string                     `json:"supplier_address,omitempty"` // Alias for VendorAddress
	TaxNumber       string                     `json:"tax_number,omitempty"`
	
	// Financial information
	Subtotal        *float64                   `json:"subtotal,omitempty"`
	TaxAmount       *float64                   `json:"tax_amount,omitempty"`
	TotalAmount     *float64                   `json:"total_amount,omitempty"`
	Currency        string                     `json:"currency,omitempty"`
	
	// Line items
	LineItems       []ParsedInvoiceItem        `json:"line_items,omitempty"`
	Items           []ParsedInvoiceItem        `json:"items,omitempty"` // Alias for LineItems
	
	// Metadata
	RawData         *json.RawMessage           `json:"raw_data,omitempty"`
	ParsedFields    map[string]interface{}     `json:"parsed_fields,omitempty"`
}

// ParsedInvoiceItem represents a standardized line item
type ParsedInvoiceItem struct {
	Description string   `json:"description"`
	Quantity    *float64 `json:"quantity,omitempty"`
	UnitPrice   *float64 `json:"unit_price,omitempty"`
	Amount      *float64 `json:"amount,omitempty"`
	LineTotal   *float64 `json:"line_total,omitempty"` // Alias for Amount
	TaxRate     *float64 `json:"tax_rate,omitempty"`
	TaxAmount   *float64 `json:"tax_amount,omitempty"`
}

// ValidationResult contains validation results and errors
type ValidationResult struct {
	IsValid      bool                       `json:"is_valid"`
	Errors       []ValidationError          `json:"errors,omitempty"`
	Warnings     []ValidationWarning        `json:"warnings,omitempty"`
	FieldResults map[string]FieldValidation `json:"field_results,omitempty"`
}

// ValidationError represents a validation error
type ValidationError struct {
	Field       string `json:"field"`
	Value       interface{} `json:"value,omitempty"`
	Code        string `json:"code"`
	Message     string `json:"message"`
	Severity    string `json:"severity"` // "error", "warning", "info"
}

// ValidationWarning represents a validation warning
type ValidationWarning struct {
	Field   string `json:"field"`
	Value   interface{} `json:"value,omitempty"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

// FieldValidation represents validation result for a specific field
type FieldValidation struct {
	IsValid     bool   `json:"is_valid"`
	OriginalValue interface{} `json:"original_value,omitempty"`
	ParsedValue   interface{} `json:"parsed_value,omitempty"`
	ErrorMessage  string `json:"error_message,omitempty"`
	WarningMessage string `json:"warning_message,omitempty"`
}

// invoiceDataParser implements InvoiceDataParser interface
type invoiceDataParser struct {
	// Add dependencies if needed in the future
}

// NewInvoiceDataParser creates a new invoice data parser instance
func NewInvoiceDataParser() InvoiceDataParser {
	return &invoiceDataParser{}
}

// ParseOCRResponse parses OCR structured data into internal invoice data model
func (p *invoiceDataParser) ParseOCRResponse(ctx context.Context, ocrResponse *OCRResponse) (*ParsedInvoiceData, error) {
	if ocrResponse == nil {
		return nil, fmt.Errorf("OCR response is nil")
	}
	
	if ocrResponse.StructuredData == nil {
		return nil, fmt.Errorf("no structured data in OCR response")
	}
	
	// Parse the structured data based on different possible formats
	var parsedData *ParsedInvoiceData
	var err error
	
	// Try parsing as InvoiceStructuredData first (our standard format)
	if parsedData, err = p.parseAsInvoiceStructuredData(ocrResponse.StructuredData); err == nil {
		parsedData.RawData = ocrResponse.StructuredData
		return parsedData, nil
	}
	
	// Try parsing as models.InvoiceData (existing OCR model format)
	if parsedData, err = p.parseAsInvoiceData(ocrResponse.StructuredData); err == nil {
		parsedData.RawData = ocrResponse.StructuredData
		return parsedData, nil
	}
	
	// Try parsing as generic JSON format
	if parsedData, err = p.parseAsGenericJSON(ocrResponse.StructuredData); err == nil {
		parsedData.RawData = ocrResponse.StructuredData
		return parsedData, nil
	}
	
	return nil, fmt.Errorf("failed to parse structured data in any known format: %w", err)
}

// parseAsInvoiceStructuredData parses data as InvoiceStructuredData format
func (p *invoiceDataParser) parseAsInvoiceStructuredData(data *json.RawMessage) (*ParsedInvoiceData, error) {
	var invoiceData InvoiceStructuredData
	if err := json.Unmarshal(*data, &invoiceData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal as InvoiceStructuredData: %w", err)
	}
	
	result := &ParsedInvoiceData{
		InvoiceNumber:   invoiceData.InvoiceNumber,
		VendorName:      invoiceData.SupplierName,
		SupplierName:    invoiceData.SupplierName,
		VendorAddress:   invoiceData.SupplierAddress,
		SupplierAddress: invoiceData.SupplierAddress,
		TaxNumber:       invoiceData.TaxNumber,
		Subtotal:        invoiceData.Subtotal,
		TaxAmount:       invoiceData.TaxAmount,
		TotalAmount:     invoiceData.TotalAmount,
		Currency:        invoiceData.Currency,
	}
	
	// Parse dates
	if invoiceData.InvoiceDate != "" {
		if date, err := p.parseDate(invoiceData.InvoiceDate); err == nil {
			result.InvoiceDate = &date
			result.IssueDate = &date // Alias
		}
	}
	
	if invoiceData.DueDate != "" {
		if date, err := p.parseDate(invoiceData.DueDate); err == nil {
			result.DueDate = &date
		}
	}
	
	// Parse line items
	for _, item := range invoiceData.Items {
		parsedItem := ParsedInvoiceItem{
			Description: item.Description,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Amount:      item.Amount,
			LineTotal:   item.Amount, // Alias
			TaxRate:     item.TaxRate,
		}
		result.LineItems = append(result.LineItems, parsedItem)
		result.Items = append(result.Items, parsedItem) // Alias
	}
	
	return result, nil
}

// parseAsInvoiceData parses data as models.InvoiceData format
func (p *invoiceDataParser) parseAsInvoiceData(data *json.RawMessage) (*ParsedInvoiceData, error) {
	var invoiceData models.InvoiceData
	if err := json.Unmarshal(*data, &invoiceData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal as models.InvoiceData: %w", err)
	}
	
	result := &ParsedInvoiceData{
		InvoiceNumber:   invoiceData.InvoiceNumber,
		VendorName:      invoiceData.SupplierName,
		SupplierName:    invoiceData.SupplierName,
		VendorAddress:   invoiceData.SupplierAddress,
		SupplierAddress: invoiceData.SupplierAddress,
		TaxNumber:       invoiceData.TaxNumber,
		Subtotal:        invoiceData.Subtotal,
		TaxAmount:       invoiceData.TaxAmount,
		TotalAmount:     invoiceData.TotalAmount,
		Currency:        invoiceData.Currency,
	}
	
	// Parse dates
	if invoiceData.InvoiceDate != nil && *invoiceData.InvoiceDate != "" {
		if date, err := p.parseDate(*invoiceData.InvoiceDate); err == nil {
			result.InvoiceDate = &date
			result.IssueDate = &date // Alias
		}
	}
	
	if invoiceData.DueDate != nil && *invoiceData.DueDate != "" {
		if date, err := p.parseDate(*invoiceData.DueDate); err == nil {
			result.DueDate = &date
		}
	}
	
	// Parse line items
	for _, item := range invoiceData.Items {
		parsedItem := ParsedInvoiceItem{
			Description: item.Description,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Amount:      item.Amount,
			LineTotal:   item.Amount, // Alias
			TaxRate:     item.TaxRate,
		}
		result.LineItems = append(result.LineItems, parsedItem)
		result.Items = append(result.Items, parsedItem) // Alias
	}
	
	return result, nil
}

// parseAsGenericJSON attempts to parse data as generic JSON and map to our structure
func (p *invoiceDataParser) parseAsGenericJSON(data *json.RawMessage) (*ParsedInvoiceData, error) {
	var genericData map[string]interface{}
	if err := json.Unmarshal(*data, &genericData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal as generic JSON: %w", err)
	}
	
	result := &ParsedInvoiceData{
		ParsedFields: genericData,
	}
	
	// Extract common fields using flexible field mapping
	fieldMappings := map[string][]string{
		"invoice_number":   {"invoice_number", "invoiceNumber", "invoice_no", "invoiceNo", "number", "發票號碼"},
		"vendor_name":      {"vendor_name", "vendorName", "supplier_name", "supplierName", "vendor", "supplier", "廠商名稱", "供應商名稱"},
		"vendor_address":   {"vendor_address", "vendorAddress", "supplier_address", "supplierAddress", "address", "廠商地址", "供應商地址"},
		"tax_number":       {"tax_number", "taxNumber", "tax_id", "taxId", "統一編號", "統編"},
		"total_amount":     {"total_amount", "totalAmount", "total", "amount", "總金額", "金額"},
		"subtotal":         {"subtotal", "subTotal", "sub_total", "小計"},
		"tax_amount":       {"tax_amount", "taxAmount", "tax", "稅額"},
		"currency":         {"currency", "幣別", "currency_code"},
		"invoice_date":     {"invoice_date", "invoiceDate", "issue_date", "issueDate", "date", "發票日期", "開立日期"},
		"due_date":         {"due_date", "dueDate", "payment_date", "paymentDate", "到期日"},
	}
	
	// Map fields
	for targetField, possibleKeys := range fieldMappings {
		for _, key := range possibleKeys {
			if value, exists := genericData[key]; exists && value != nil {
				switch targetField {
				case "invoice_number":
					if str := p.toString(value); str != "" {
						result.InvoiceNumber = str
					}
				case "vendor_name":
					if str := p.toString(value); str != "" {
						result.VendorName = str
						result.SupplierName = str
					}
				case "vendor_address":
					if str := p.toString(value); str != "" {
						result.VendorAddress = str
						result.SupplierAddress = str
					}
				case "tax_number":
					if str := p.toString(value); str != "" {
						result.TaxNumber = str
					}
				case "total_amount":
					if amount := p.toFloat64(value); amount != nil {
						result.TotalAmount = amount
					}
				case "subtotal":
					if amount := p.toFloat64(value); amount != nil {
						result.Subtotal = amount
					}
				case "tax_amount":
					if amount := p.toFloat64(value); amount != nil {
						result.TaxAmount = amount
					}
				case "currency":
					if str := p.toString(value); str != "" {
						result.Currency = str
					}
				case "invoice_date":
					if str := p.toString(value); str != "" {
						if date, err := p.parseDate(str); err == nil {
							result.InvoiceDate = &date
							result.IssueDate = &date
						}
					}
				case "due_date":
					if str := p.toString(value); str != "" {
						if date, err := p.parseDate(str); err == nil {
							result.DueDate = &date
						}
					}
				}
				break // Use first matching key
			}
		}
	}
	
	// Try to extract line items
	itemKeys := []string{"items", "line_items", "lineItems", "products", "明細", "項目"}
	for _, key := range itemKeys {
		if itemsValue, exists := genericData[key]; exists {
			if items := p.parseLineItems(itemsValue); len(items) > 0 {
				result.LineItems = items
				result.Items = items
				break
			}
		}
	}
	
	return result, nil
}

// parseLineItems extracts line items from various formats
func (p *invoiceDataParser) parseLineItems(itemsValue interface{}) []ParsedInvoiceItem {
	var items []ParsedInvoiceItem
	
	switch v := itemsValue.(type) {
	case []interface{}:
		for _, item := range v {
			if parsedItem := p.parseLineItem(item); parsedItem != nil {
				items = append(items, *parsedItem)
			}
		}
	case []map[string]interface{}:
		for _, item := range v {
			if parsedItem := p.parseLineItem(item); parsedItem != nil {
				items = append(items, *parsedItem)
			}
		}
	}
	
	return items
}

// parseLineItem parses a single line item from generic data
func (p *invoiceDataParser) parseLineItem(itemValue interface{}) *ParsedInvoiceItem {
	itemMap, ok := itemValue.(map[string]interface{})
	if !ok {
		return nil
	}
	
	item := &ParsedInvoiceItem{}
	
	// Map description fields
	descKeys := []string{"description", "desc", "name", "product", "item", "品名", "項目", "說明"}
	for _, key := range descKeys {
		if value, exists := itemMap[key]; exists {
			if str := p.toString(value); str != "" {
				item.Description = str
				break
			}
		}
	}
	
	// Map quantity fields
	qtyKeys := []string{"quantity", "qty", "amount", "count", "數量"}
	for _, key := range qtyKeys {
		if value, exists := itemMap[key]; exists {
			if qty := p.toFloat64(value); qty != nil {
				item.Quantity = qty
				break
			}
		}
	}
	
	// Map unit price fields
	priceKeys := []string{"unit_price", "unitPrice", "price", "unit_amount", "單價"}
	for _, key := range priceKeys {
		if value, exists := itemMap[key]; exists {
			if price := p.toFloat64(value); price != nil {
				item.UnitPrice = price
				break
			}
		}
	}
	
	// Map amount/total fields
	amountKeys := []string{"amount", "total", "line_total", "lineTotal", "小計", "金額"}
	for _, key := range amountKeys {
		if value, exists := itemMap[key]; exists {
			if amount := p.toFloat64(value); amount != nil {
				item.Amount = amount
				item.LineTotal = amount
				break
			}
		}
	}
	
	// Map tax rate fields
	taxKeys := []string{"tax_rate", "taxRate", "tax", "稅率"}
	for _, key := range taxKeys {
		if value, exists := itemMap[key]; exists {
			if tax := p.toFloat64(value); tax != nil {
				item.TaxRate = tax
				break
			}
		}
	}
	
	return item
}

// ValidateInvoiceData validates parsed invoice data and returns validation results
func (p *invoiceDataParser) ValidateInvoiceData(ctx context.Context, data *ParsedInvoiceData) (*ValidationResult, error) {
	if data == nil {
		return &ValidationResult{
			IsValid: false,
			Errors: []ValidationError{
				{Field: "data", Code: "NULL_DATA", Message: "Invoice data is null", Severity: "error"},
			},
		}, nil
	}
	
	result := &ValidationResult{
		IsValid:      true,
		FieldResults: make(map[string]FieldValidation),
	}
	
	// Validate invoice number
	p.validateInvoiceNumber(data.InvoiceNumber, result)
	
	// Validate dates
	p.validateDates(data, result)
	
	// Validate vendor information
	p.validateVendorInfo(data, result)
	
	// Validate financial amounts
	p.validateAmounts(data, result)
	
	// Validate line items
	p.validateLineItems(data.LineItems, result)
	
	// Set overall validity
	result.IsValid = len(result.Errors) == 0
	
	return result, nil
}

// validateInvoiceNumber validates invoice number field
func (p *invoiceDataParser) validateInvoiceNumber(invoiceNumber string, result *ValidationResult) {
	fieldResult := FieldValidation{
		OriginalValue: invoiceNumber,
		ParsedValue:   invoiceNumber,
	}
	
	if invoiceNumber == "" {
		fieldResult.IsValid = false
		fieldResult.ErrorMessage = "Invoice number is required"
		result.Errors = append(result.Errors, ValidationError{
			Field: "invoice_number", Code: "REQUIRED", Message: "Invoice number is required", Severity: "error",
		})
	} else {
		// Check for valid format (basic validation)
		if len(strings.TrimSpace(invoiceNumber)) < 3 {
			fieldResult.IsValid = false
			fieldResult.ErrorMessage = "Invoice number too short (minimum 3 characters)"
			result.Errors = append(result.Errors, ValidationError{
				Field: "invoice_number", Value: invoiceNumber, Code: "INVALID_FORMAT", 
				Message: "Invoice number too short (minimum 3 characters)", Severity: "error",
			})
		} else {
			fieldResult.IsValid = true
		}
	}
	
	result.FieldResults["invoice_number"] = fieldResult
}

// validateDates validates date fields
func (p *invoiceDataParser) validateDates(data *ParsedInvoiceData, result *ValidationResult) {
	// Validate invoice date
	if data.InvoiceDate != nil {
		fieldResult := FieldValidation{
			OriginalValue: data.InvoiceDate,
			ParsedValue:   data.InvoiceDate,
			IsValid:       true,
		}
		
		// Check if date is not too far in the future
		if data.InvoiceDate.After(time.Now().AddDate(0, 1, 0)) {
			fieldResult.WarningMessage = "Invoice date is more than 1 month in the future"
			result.Warnings = append(result.Warnings, ValidationWarning{
				Field: "invoice_date", Value: data.InvoiceDate, Code: "FUTURE_DATE",
				Message: "Invoice date is more than 1 month in the future",
			})
		}
		
		result.FieldResults["invoice_date"] = fieldResult
	}
	
	// Validate due date
	if data.DueDate != nil {
		fieldResult := FieldValidation{
			OriginalValue: data.DueDate,
			ParsedValue:   data.DueDate,
			IsValid:       true,
		}
		
		// Check if due date is before invoice date
		if data.InvoiceDate != nil && data.DueDate.Before(*data.InvoiceDate) {
			fieldResult.IsValid = false
			fieldResult.ErrorMessage = "Due date cannot be before invoice date"
			result.Errors = append(result.Errors, ValidationError{
				Field: "due_date", Value: data.DueDate, Code: "INVALID_DATE_ORDER",
				Message: "Due date cannot be before invoice date", Severity: "error",
			})
		}
		
		result.FieldResults["due_date"] = fieldResult
	}
}

// validateVendorInfo validates vendor/supplier information
func (p *invoiceDataParser) validateVendorInfo(data *ParsedInvoiceData, result *ValidationResult) {
	// Validate vendor name
	vendorName := data.VendorName
	if vendorName == "" {
		vendorName = data.SupplierName // Try alias
	}
	
	fieldResult := FieldValidation{
		OriginalValue: vendorName,
		ParsedValue:   vendorName,
	}
	
	if vendorName == "" {
		fieldResult.IsValid = false
		fieldResult.ErrorMessage = "Vendor/supplier name is required"
		result.Errors = append(result.Errors, ValidationError{
			Field: "vendor_name", Code: "REQUIRED", Message: "Vendor/supplier name is required", Severity: "error",
		})
	} else {
		fieldResult.IsValid = true
	}
	
	result.FieldResults["vendor_name"] = fieldResult
}

// validateAmounts validates financial amount fields
func (p *invoiceDataParser) validateAmounts(data *ParsedInvoiceData, result *ValidationResult) {
	// Validate total amount
	if data.TotalAmount != nil {
		fieldResult := FieldValidation{
			OriginalValue: data.TotalAmount,
			ParsedValue:   data.TotalAmount,
		}
		
		if *data.TotalAmount < 0 {
			fieldResult.IsValid = false
			fieldResult.ErrorMessage = "Total amount cannot be negative"
			result.Errors = append(result.Errors, ValidationError{
				Field: "total_amount", Value: data.TotalAmount, Code: "NEGATIVE_AMOUNT",
				Message: "Total amount cannot be negative", Severity: "error",
			})
		} else if *data.TotalAmount == 0 {
			fieldResult.WarningMessage = "Total amount is zero"
			result.Warnings = append(result.Warnings, ValidationWarning{
				Field: "total_amount", Value: data.TotalAmount, Code: "ZERO_AMOUNT",
				Message: "Total amount is zero",
			})
			fieldResult.IsValid = true
		} else {
			fieldResult.IsValid = true
		}
		
		result.FieldResults["total_amount"] = fieldResult
	}
	
	// Validate subtotal and tax calculation
	if data.Subtotal != nil && data.TaxAmount != nil && data.TotalAmount != nil {
		calculated := *data.Subtotal + *data.TaxAmount
		tolerance := 0.01 // Allow small rounding differences
		
		if abs(calculated-*data.TotalAmount) > tolerance {
			result.Warnings = append(result.Warnings, ValidationWarning{
				Field: "total_amount", Value: data.TotalAmount, Code: "CALCULATION_MISMATCH",
				Message: fmt.Sprintf("Total amount (%.2f) doesn't match subtotal + tax (%.2f)", *data.TotalAmount, calculated),
			})
		}
	}
}

// validateLineItems validates invoice line items
func (p *invoiceDataParser) validateLineItems(items []ParsedInvoiceItem, result *ValidationResult) {
	if len(items) == 0 {
		result.Warnings = append(result.Warnings, ValidationWarning{
			Field: "line_items", Code: "NO_ITEMS", Message: "No line items found",
		})
		return
	}
	
	for i, item := range items {
		fieldPrefix := fmt.Sprintf("line_items[%d]", i)
		
		// Validate description
		if item.Description == "" {
			result.Errors = append(result.Errors, ValidationError{
				Field: fieldPrefix + ".description", Code: "REQUIRED",
				Message: fmt.Sprintf("Line item %d description is required", i+1), Severity: "error",
			})
		}
		
		// Validate quantity
		if item.Quantity != nil && *item.Quantity <= 0 {
			result.Errors = append(result.Errors, ValidationError{
				Field: fieldPrefix + ".quantity", Value: item.Quantity, Code: "INVALID_QUANTITY",
				Message: fmt.Sprintf("Line item %d quantity must be positive", i+1), Severity: "error",
			})
		}
		
		// Validate unit price
		if item.UnitPrice != nil && *item.UnitPrice < 0 {
			result.Errors = append(result.Errors, ValidationError{
				Field: fieldPrefix + ".unit_price", Value: item.UnitPrice, Code: "NEGATIVE_PRICE",
				Message: fmt.Sprintf("Line item %d unit price cannot be negative", i+1), Severity: "error",
			})
		}
		
		// Validate calculation consistency
		if item.Quantity != nil && item.UnitPrice != nil && item.Amount != nil {
			calculated := (*item.Quantity) * (*item.UnitPrice)
			tolerance := 0.01
			
			if abs(calculated-*item.Amount) > tolerance {
				result.Warnings = append(result.Warnings, ValidationWarning{
					Field: fieldPrefix + ".amount", Value: item.Amount, Code: "CALCULATION_MISMATCH",
					Message: fmt.Sprintf("Line item %d amount (%.2f) doesn't match quantity × unit price (%.2f)", i+1, *item.Amount, calculated),
				})
			}
		}
	}
}

// ParseAndValidate combines parsing and validation in one step
func (p *invoiceDataParser) ParseAndValidate(ctx context.Context, ocrResponse *OCRResponse) (*ParsedInvoiceData, *ValidationResult, error) {
	// Parse the data first
	parsedData, err := p.ParseOCRResponse(ctx, ocrResponse)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse OCR response: %w", err)
	}
	
	// Validate the parsed data
	validationResult, err := p.ValidateInvoiceData(ctx, parsedData)
	if err != nil {
		return parsedData, nil, fmt.Errorf("failed to validate invoice data: %w", err)
	}
	
	return parsedData, validationResult, nil
}

// Helper functions

// parseDate parses various date formats commonly found in invoices
func (p *invoiceDataParser) parseDate(dateStr string) (time.Time, error) {
	dateStr = strings.TrimSpace(dateStr)
	if dateStr == "" {
		return time.Time{}, fmt.Errorf("empty date string")
	}
	
	// Common date formats found in invoices
	formats := []string{
		"2006-01-02",           // ISO format
		"2006/01/02",           // Common format
		"02/01/2006",           // DD/MM/YYYY
		"01/02/2006",           // MM/DD/YYYY
		"2006-01-02 15:04:05",  // With time
		"2006/01/02 15:04:05",  // With time
		"02-01-2006",           // DD-MM-YYYY
		"01-02-2006",           // MM-DD-YYYY
		"20060102",             // YYYYMMDD
		"2006年01月02日",        // Chinese format
		"2006.01.02",           // Dot separated
	}
	
	for _, format := range formats {
		if date, err := time.Parse(format, dateStr); err == nil {
			return date, nil
		}
	}
	
	return time.Time{}, fmt.Errorf("unable to parse date: %s", dateStr)
}

// toString safely converts interface{} to string
func (p *invoiceDataParser) toString(value interface{}) string {
	if value == nil {
		return ""
	}
	
	switch v := value.(type) {
	case string:
		return strings.TrimSpace(v)
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	case int:
		return strconv.Itoa(v)
	case int64:
		return strconv.FormatInt(v, 10)
	default:
		return fmt.Sprintf("%v", v)
	}
}

// toFloat64 safely converts interface{} to *float64
func (p *invoiceDataParser) toFloat64(value interface{}) *float64 {
	if value == nil {
		return nil
	}
	
	switch v := value.(type) {
	case float64:
		return &v
	case float32:
		f := float64(v)
		return &f
	case int:
		f := float64(v)
		return &f
	case int64:
		f := float64(v)
		return &f
	case string:
		// Clean up the string (remove currency symbols, commas, etc.)
		cleaned := p.cleanNumericString(v)
		if f, err := strconv.ParseFloat(cleaned, 64); err == nil {
			return &f
		}
	}
	
	return nil
}

// cleanNumericString removes common non-numeric characters from amount strings
func (p *invoiceDataParser) cleanNumericString(s string) string {
	// Remove common currency symbols and formatting
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, ",", "")
	s = strings.ReplaceAll(s, "$", "")
	s = strings.ReplaceAll(s, "€", "")
	s = strings.ReplaceAll(s, "£", "")
	s = strings.ReplaceAll(s, "¥", "")
	s = strings.ReplaceAll(s, "NT$", "")
	s = strings.ReplaceAll(s, "USD", "")
	s = strings.ReplaceAll(s, "TWD", "")
	
	// Use regex to extract numeric part (including decimal point)
	re := regexp.MustCompile(`[-+]?\d*\.?\d+`)
	matches := re.FindStringSubmatch(s)
	if len(matches) > 0 {
		return matches[0]
	}
	
	return s
}

// abs returns the absolute value of a float64
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}