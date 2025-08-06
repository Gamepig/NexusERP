package main

import (
	"encoding/json"
	"fmt"
	"log"
)

// Example demonstrating how to use the Invoice Data Parser
// This shows various OCR response formats and how they get parsed

func main() {
	fmt.Println("=== Invoice Data Parser Examples ===\n")

	// Example 1: Standard format with English fields
	fmt.Println("Example 1: Standard Invoice Format")
	standardExample()

	// Example 2: Chinese/Traditional format
	fmt.Println("\nExample 2: Chinese Traditional Format")
	chineseExample()

	// Example 3: Mixed format with calculation validation
	fmt.Println("\nExample 3: Mixed Format with Validation Issues")
	validationExample()

	// Example 4: Generic JSON format
	fmt.Println("\nExample 4: Generic JSON Format")
	genericExample()
}

func standardExample() {
	// Simulate OCR response in standard format
	ocrData := map[string]interface{}{
		"invoice_number":   "INV-2025-001",
		"invoice_date":     "2025-01-15",
		"due_date":         "2025-02-15",
		"supplier_name":    "Tech Solutions Ltd.",
		"supplier_address": "123 Innovation Drive, Taipei 110, Taiwan",
		"tax_number":       "12345678",
		"subtotal":         950.00,
		"tax_amount":       47.50,
		"total_amount":     997.50,
		"currency":         "TWD",
		"items": []map[string]interface{}{
			{
				"description": "Software License",
				"quantity":    1.0,
				"unit_price":  800.00,
				"amount":      800.00,
				"tax_rate":    5.0,
			},
			{
				"description": "Technical Support",
				"quantity":    3.0,
				"unit_price":  50.00,
				"amount":      150.00,
				"tax_rate":    5.0,
			},
		},
	}

	prettyPrint("Input OCR Data", ocrData)

	// Simulate parsing result
	parsedResult := map[string]interface{}{
		"invoice_number": "INV-2025-001",
		"vendor_name":    "Tech Solutions Ltd.",
		"total_amount":   997.50,
		"line_items":     2,
		"validation": map[string]interface{}{
			"is_valid":     true,
			"errors":       []string{},
			"warnings":     []string{},
			"field_count":  10,
		},
	}

	prettyPrint("Parsed Result", parsedResult)
}

func chineseExample() {
	// Simulate OCR response with Chinese field names
	ocrData := map[string]interface{}{
		"發票號碼":   "TW-2025-0001",
		"發票日期":   "2025年01月20日",
		"到期日":    "2025年02月20日",
		"廠商名稱":   "台灣科技有限公司",
		"廠商地址":   "台北市信義區松仁路100號8樓",
		"統一編號":   "98765432",
		"小計":     8500.00,
		"稅額":     425.00,
		"總金額":    8925.00,
		"幣別":     "TWD",
		"明細": []map[string]interface{}{
			{
				"品名": "筆記型電腦",
				"數量": 2.0,
				"單價": 4000.00,
				"金額": 8000.00,
				"稅率": 5.0,
			},
			{
				"品名": "滑鼠",
				"數量": 10.0,
				"單價": 50.00,
				"金額": 500.00,
				"稅率": 5.0,
			},
		},
	}

	prettyPrint("Chinese Input OCR Data", ocrData)

	// Simulate successful field mapping
	mappedResult := map[string]interface{}{
		"invoice_number": "TW-2025-0001",
		"vendor_name":    "台灣科技有限公司",
		"total_amount":   8925.00,
		"field_mapping": map[string]string{
			"發票號碼": "invoice_number",
			"廠商名稱": "vendor_name",
			"總金額":  "total_amount",
			"明細":   "line_items",
		},
		"validation": map[string]interface{}{
			"is_valid": true,
			"notes":    "All Chinese fields mapped successfully",
		},
	}

	prettyPrint("Mapped Result", mappedResult)
}

func validationExample() {
	// Simulate OCR response with validation issues
	ocrData := map[string]interface{}{
		"invoice_number": "",           // Missing - validation error
		"vendor_name":    "Some Vendor",
		"total_amount":   1000.00,
		"subtotal":       950.00,
		"tax_amount":     60.00,        // Should be 50 to match total - validation warning
		"invoice_date":   "2025-02-15",
		"due_date":       "2025-01-15", // Before invoice date - validation error
		"items": []map[string]interface{}{
			{
				"description": "Product A",
				"quantity":    2.0,
				"unit_price":  500.00,  // 2 × 500 = 1000, but amount is 950 - warning
				"amount":      950.00,
			},
		},
	}

	prettyPrint("Input with Issues", ocrData)

	// Simulate validation results
	validationResult := map[string]interface{}{
		"is_valid": false,
		"errors": []map[string]interface{}{
			{
				"field":    "invoice_number",
				"code":     "REQUIRED",
				"message":  "Invoice number is required",
				"severity": "error",
			},
			{
				"field":    "due_date",
				"code":     "INVALID_DATE_ORDER",
				"message":  "Due date cannot be before invoice date",
				"severity": "error",
			},
		},
		"warnings": []map[string]interface{}{
			{
				"field":   "total_amount",
				"code":    "CALCULATION_MISMATCH",
				"message": "Total amount (1000.00) doesn't match subtotal + tax (1010.00)",
			},
			{
				"field":   "line_items[0].amount",
				"code":    "CALCULATION_MISMATCH",
				"message": "Line item 1 amount (950.00) doesn't match quantity × unit price (1000.00)",
			},
		},
		"field_results": map[string]interface{}{
			"invoice_number": map[string]interface{}{
				"is_valid":      false,
				"error_message": "Invoice number is required",
			},
			"total_amount": map[string]interface{}{
				"is_valid":        true,
				"warning_message": "Calculation mismatch detected",
			},
		},
	}

	prettyPrint("Validation Result", validationResult)
}

func genericExample() {
	// Simulate OCR response in completely generic format
	ocrData := map[string]interface{}{
		"document_info": map[string]interface{}{
			"type":   "invoice",
			"number": "GEN-2025-001",
			"date":   "2025-01-25",
		},
		"vendor": map[string]interface{}{
			"name":    "Generic Supplier Inc.",
			"address": "456 Business Ave, Taichung",
			"tax_id":  "11223344",
		},
		"amounts": map[string]interface{}{
			"subtotal": 1500.00,
			"tax":      75.00,
			"total":    1575.00,
		},
		"line_items": []map[string]interface{}{
			{
				"item_name": "Service Package A",
				"qty":       1,
				"price":     1200.00,
				"total":     1200.00,
			},
			{
				"item_name": "Additional Support",
				"qty":       6,
				"price":     50.00,
				"total":     300.00,
			},
		},
	}

	prettyPrint("Generic Format Input", ocrData)

	// Simulate flexible parsing result
	parsedResult := map[string]interface{}{
		"parsing_strategy": "generic_json_mapping",
		"fields_found":     []string{"vendor.name", "amounts.total", "line_items"},
		"mapped_data": map[string]interface{}{
			"invoice_number": "GEN-2025-001",
			"vendor_name":    "Generic Supplier Inc.",
			"total_amount":   1575.00,
			"line_items":     2,
		},
		"unmapped_fields": []string{"document_info.type", "vendor.tax_id"},
		"validation": map[string]interface{}{
			"is_valid":       true,
			"parsing_method": "flexible_field_mapping",
		},
	}

	prettyPrint("Generic Parsing Result", parsedResult)
}

func prettyPrint(title string, data interface{}) {
	fmt.Printf("--- %s ---\n", title)
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Printf("Error marshaling data: %v", err)
		return
	}
	fmt.Println(string(jsonData))
	fmt.Println()
}