package services

import (
	"context"
	"encoding/json"
	"nexus-erp/backend/internal/models"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestInvoiceDataParser_ParseOCRResponse(t *testing.T) {
	parser := NewInvoiceDataParser()
	ctx := context.Background()

	t.Run("Parse InvoiceStructuredData format", func(t *testing.T) {
		// Create test data in InvoiceStructuredData format
		invoiceData := InvoiceStructuredData{
			InvoiceNumber:   "INV-2025-001",
			InvoiceDate:     "2025-01-15",
			DueDate:         "2025-02-15",
			SupplierName:    "Test Supplier Co., Ltd.",
			SupplierAddress: "123 Main St, Taipei, Taiwan",
			TaxNumber:       "12345678",
			Subtotal:        floatPtr(1000.00),
			TaxAmount:       floatPtr(50.00),
			TotalAmount:     floatPtr(1050.00),
			Currency:        "TWD",
			Items: []InvoiceItemExtracted{
				{
					Description: "Product A",
					Quantity:    floatPtr(2.0),
					UnitPrice:   floatPtr(250.00),
					Amount:      floatPtr(500.00),
					TaxRate:     floatPtr(5.0),
				},
				{
					Description: "Product B",
					Quantity:    floatPtr(1.0),
					UnitPrice:   floatPtr(500.00),
					Amount:      floatPtr(500.00),
					TaxRate:     floatPtr(5.0),
				},
			},
		}

		structuredDataBytes, err := json.Marshal(invoiceData)
		require.NoError(t, err)
		structuredData := json.RawMessage(structuredDataBytes)

		ocrResponse := &OCRResponse{
			RawText:        "Some raw text",
			Confidence:     0.95,
			Language:       "zh-TW",
			ProcessingTime: 1500,
			StructuredData: &structuredData,
		}

		// Parse the response
		result, err := parser.ParseOCRResponse(ctx, ocrResponse)
		require.NoError(t, err)
		assert.NotNil(t, result)

		// Verify basic fields
		assert.Equal(t, "INV-2025-001", result.InvoiceNumber)
		assert.Equal(t, "Test Supplier Co., Ltd.", result.VendorName)
		assert.Equal(t, "Test Supplier Co., Ltd.", result.SupplierName)
		assert.Equal(t, "123 Main St, Taipei, Taiwan", result.VendorAddress)
		assert.Equal(t, "12345678", result.TaxNumber)
		assert.Equal(t, 1000.00, *result.Subtotal)
		assert.Equal(t, 50.00, *result.TaxAmount)
		assert.Equal(t, 1050.00, *result.TotalAmount)
		assert.Equal(t, "TWD", result.Currency)

		// Verify dates
		assert.NotNil(t, result.InvoiceDate)
		expectedDate := time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC)
		assert.Equal(t, expectedDate, *result.InvoiceDate)
		assert.Equal(t, expectedDate, *result.IssueDate) // Alias check

		assert.NotNil(t, result.DueDate)
		expectedDueDate := time.Date(2025, 2, 15, 0, 0, 0, 0, time.UTC)
		assert.Equal(t, expectedDueDate, *result.DueDate)

		// Verify line items
		assert.Len(t, result.LineItems, 2)
		assert.Len(t, result.Items, 2) // Alias check

		firstItem := result.LineItems[0]
		assert.Equal(t, "Product A", firstItem.Description)
		assert.Equal(t, 2.0, *firstItem.Quantity)
		assert.Equal(t, 250.00, *firstItem.UnitPrice)
		assert.Equal(t, 500.00, *firstItem.Amount)
		assert.Equal(t, 500.00, *firstItem.LineTotal) // Alias check
		assert.Equal(t, 5.0, *firstItem.TaxRate)
	})

	t.Run("Parse models.InvoiceData format", func(t *testing.T) {
		// Create test data in models.InvoiceData format
		invoiceData := models.InvoiceData{
			InvoiceNumber:   "INV-2025-002",
			InvoiceDate:     stringPtr("2025/01/20"),
			DueDate:         stringPtr("2025/02/20"),
			SupplierName:    "Another Supplier Inc.",
			SupplierAddress: "456 Business Ave, Taichung, Taiwan",
			TaxNumber:       "87654321",
			Subtotal:        floatPtr(2000.00),
			TaxAmount:       floatPtr(100.00),
			TotalAmount:     floatPtr(2100.00),
			Currency:        "USD",
			Items: []models.InvoiceItemData{
				{
					Description: "Service A",
					Quantity:    floatPtr(5.0),
					UnitPrice:   floatPtr(400.00),
					Amount:      floatPtr(2000.00),
					TaxRate:     floatPtr(5.0),
				},
			},
		}

		structuredDataBytes, err := json.Marshal(invoiceData)
		require.NoError(t, err)
		structuredData := json.RawMessage(structuredDataBytes)

		ocrResponse := &OCRResponse{
			StructuredData: &structuredData,
		}

		// Parse the response
		result, err := parser.ParseOCRResponse(ctx, ocrResponse)
		require.NoError(t, err)
		assert.NotNil(t, result)

		// Verify basic fields
		assert.Equal(t, "INV-2025-002", result.InvoiceNumber)
		assert.Equal(t, "Another Supplier Inc.", result.VendorName)
		assert.Equal(t, 2000.00, *result.Subtotal)
		assert.Equal(t, 100.00, *result.TaxAmount)
		assert.Equal(t, 2100.00, *result.TotalAmount)
		assert.Equal(t, "USD", result.Currency)

		// Verify date parsing with different format
		assert.NotNil(t, result.InvoiceDate)
		expectedDate := time.Date(2025, 1, 20, 0, 0, 0, 0, time.UTC)
		assert.Equal(t, expectedDate, *result.InvoiceDate)

		// Verify line items
		assert.Len(t, result.LineItems, 1)
		item := result.LineItems[0]
		assert.Equal(t, "Service A", item.Description)
		assert.Equal(t, 5.0, *item.Quantity)
		assert.Equal(t, 400.00, *item.UnitPrice)
		assert.Equal(t, 2000.00, *item.Amount)
	})

	t.Run("Parse generic JSON format", func(t *testing.T) {
		// Create test data in generic JSON format with various field names
		genericData := map[string]interface{}{
			"發票號碼":   "INV-2025-003",
			"廠商名稱":   "台灣供應商有限公司",
			"廠商地址":   "台北市信義區松仁路123號",
			"統一編號":   "98765432",
			"總金額":    1500.00,
			"小計":     1400.00,
			"稅額":     100.00,
			"幣別":     "TWD",
			"發票日期":   "2025-01-25",
			"到期日":    "2025-02-25",
			"明細": []map[string]interface{}{
				{
					"品名": "商品甲",
					"數量": 3.0,
					"單價": 400.00,
					"金額": 1200.00,
					"稅率": 5.0,
				},
				{
					"品名": "商品乙",
					"數量": 1.0,
					"單價": 200.00,
					"金額": 200.00,
					"稅率": 5.0,
				},
			},
		}

		structuredDataBytes, err := json.Marshal(genericData)
		require.NoError(t, err)
		structuredData := json.RawMessage(structuredDataBytes)

		ocrResponse := &OCRResponse{
			StructuredData: &structuredData,
		}

		// Parse the response
		result, err := parser.ParseOCRResponse(ctx, ocrResponse)
		require.NoError(t, err)
		assert.NotNil(t, result)

		// Verify Chinese field mapping worked
		assert.Equal(t, "INV-2025-003", result.InvoiceNumber)
		assert.Equal(t, "台灣供應商有限公司", result.VendorName)
		assert.Equal(t, "台北市信義區松仁路123號", result.VendorAddress)
		assert.Equal(t, "98765432", result.TaxNumber)
		assert.Equal(t, 1500.00, *result.TotalAmount)
		assert.Equal(t, 1400.00, *result.Subtotal)
		assert.Equal(t, 100.00, *result.TaxAmount)
		assert.Equal(t, "TWD", result.Currency)

		// Verify line items with Chinese field names
		assert.Len(t, result.LineItems, 2)
		firstItem := result.LineItems[0]
		assert.Equal(t, "商品甲", firstItem.Description)
		assert.Equal(t, 3.0, *firstItem.Quantity)
		assert.Equal(t, 400.00, *firstItem.UnitPrice)
		assert.Equal(t, 1200.00, *firstItem.Amount)
	})

	t.Run("Handle nil OCR response", func(t *testing.T) {
		result, err := parser.ParseOCRResponse(ctx, nil)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "OCR response is nil")
	})

	t.Run("Handle nil structured data", func(t *testing.T) {
		ocrResponse := &OCRResponse{
			RawText: "Some text",
		}

		result, err := parser.ParseOCRResponse(ctx, ocrResponse)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "no structured data in OCR response")
	})
}

func TestInvoiceDataParser_ValidateInvoiceData(t *testing.T) {
	parser := NewInvoiceDataParser()
	ctx := context.Background()

	t.Run("Valid invoice data", func(t *testing.T) {
		data := &ParsedInvoiceData{
			InvoiceNumber: "INV-2025-001",
			VendorName:    "Test Supplier",
			InvoiceDate:   timePtr(time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC)),
			DueDate:       timePtr(time.Date(2025, 2, 15, 0, 0, 0, 0, time.UTC)),
			TotalAmount:   floatPtr(1000.00),
			Subtotal:      floatPtr(950.00),
			TaxAmount:     floatPtr(50.00),
			LineItems: []ParsedInvoiceItem{
				{
					Description: "Product A",
					Quantity:    floatPtr(2.0),
					UnitPrice:   floatPtr(475.00),
					Amount:      floatPtr(950.00),
				},
			},
		}

		result, err := parser.ValidateInvoiceData(ctx, data)
		require.NoError(t, err)
		assert.True(t, result.IsValid)
		assert.Empty(t, result.Errors)
	})

	t.Run("Missing required fields", func(t *testing.T) {
		data := &ParsedInvoiceData{
			InvoiceNumber: "", // Missing
			VendorName:    "", // Missing
			TotalAmount:   floatPtr(-100.00), // Invalid
		}

		result, err := parser.ValidateInvoiceData(ctx, data)
		require.NoError(t, err)
		assert.False(t, result.IsValid)
		assert.Len(t, result.Errors, 3) // Invoice number, vendor name, negative amount

		// Check specific errors
		errorCodes := make(map[string]bool)
		for _, err := range result.Errors {
			errorCodes[err.Code] = true
		}
		assert.True(t, errorCodes["REQUIRED"])
		assert.True(t, errorCodes["NEGATIVE_AMOUNT"])
	})

	t.Run("Invalid date order", func(t *testing.T) {
		data := &ParsedInvoiceData{
			InvoiceNumber: "INV-2025-001",
			VendorName:    "Test Supplier",
			InvoiceDate:   timePtr(time.Date(2025, 2, 15, 0, 0, 0, 0, time.UTC)),
			DueDate:       timePtr(time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC)), // Before invoice date
			TotalAmount:   floatPtr(1000.00),
		}

		result, err := parser.ValidateInvoiceData(ctx, data)
		require.NoError(t, err)
		assert.False(t, result.IsValid)
		
		// Should have error about date order
		found := false
		for _, err := range result.Errors {
			if err.Code == "INVALID_DATE_ORDER" {
				found = true
				break
			}
		}
		assert.True(t, found, "Should have INVALID_DATE_ORDER error")
	})

	t.Run("Calculation warnings", func(t *testing.T) {
		data := &ParsedInvoiceData{
			InvoiceNumber: "INV-2025-001",
			VendorName:    "Test Supplier",
			TotalAmount:   floatPtr(1000.00),
			Subtotal:      floatPtr(950.00),
			TaxAmount:     floatPtr(60.00), // Should be 50 to match total
			LineItems: []ParsedInvoiceItem{
				{
					Description: "Product A",
					Quantity:    floatPtr(2.0),
					UnitPrice:   floatPtr(500.00), // 2 × 500 = 1000, but Amount is 950
					Amount:      floatPtr(950.00),
				},
			},
		}

		result, err := parser.ValidateInvoiceData(ctx, data)
		require.NoError(t, err)
		assert.True(t, result.IsValid) // Warnings don't make it invalid
		assert.Len(t, result.Warnings, 2) // Calculation mismatches

		// Check for calculation mismatch warnings
		warningCodes := make(map[string]bool)
		for _, warning := range result.Warnings {
			warningCodes[warning.Code] = true
		}
		assert.True(t, warningCodes["CALCULATION_MISMATCH"])
	})

	t.Run("Line item validation", func(t *testing.T) {
		data := &ParsedInvoiceData{
			InvoiceNumber: "INV-2025-001",
			VendorName:    "Test Supplier",
			TotalAmount:   floatPtr(1000.00),
			LineItems: []ParsedInvoiceItem{
				{
					Description: "", // Missing description
					Quantity:    floatPtr(-1.0), // Negative quantity
					UnitPrice:   floatPtr(-100.00), // Negative price
					Amount:      floatPtr(100.00),
				},
				{
					Description: "Valid item",
					Quantity:    floatPtr(1.0),
					UnitPrice:   floatPtr(100.00),
					Amount:      floatPtr(900.00), // Should be 100
				},
			},
		}

		result, err := parser.ValidateInvoiceData(ctx, data)
		require.NoError(t, err)
		assert.False(t, result.IsValid)
		
		// Should have multiple line item errors
		lineItemErrors := 0
		for _, err := range result.Errors {
			if err.Field[0:11] == "line_items[" {
				lineItemErrors++
			}
		}
		assert.GreaterOrEqual(t, lineItemErrors, 3) // Description, quantity, unit price
	})

	t.Run("Nil data", func(t *testing.T) {
		result, err := parser.ValidateInvoiceData(ctx, nil)
		require.NoError(t, err)
		assert.False(t, result.IsValid)
		assert.Len(t, result.Errors, 1)
		assert.Equal(t, "NULL_DATA", result.Errors[0].Code)
	})
}

func TestInvoiceDataParser_ParseAndValidate(t *testing.T) {
	parser := NewInvoiceDataParser()
	ctx := context.Background()

	t.Run("Parse and validate successful", func(t *testing.T) {
		// Create valid test data
		invoiceData := InvoiceStructuredData{
			InvoiceNumber:   "INV-2025-001",
			InvoiceDate:     "2025-01-15",
			DueDate:         "2025-02-15",
			SupplierName:    "Test Supplier Co., Ltd.",
			SupplierAddress: "123 Main St, Taipei, Taiwan",
			TotalAmount:     floatPtr(1050.00),
			Items: []InvoiceItemExtracted{
				{
					Description: "Product A",
					Quantity:    floatPtr(2.0),
					UnitPrice:   floatPtr(500.00),
					Amount:      floatPtr(1000.00),
				},
			},
		}

		structuredDataBytes, err := json.Marshal(invoiceData)
		require.NoError(t, err)
		structuredData := json.RawMessage(structuredDataBytes)

		ocrResponse := &OCRResponse{
			StructuredData: &structuredData,
		}

		// Parse and validate
		parsedData, validationResult, err := parser.ParseAndValidate(ctx, ocrResponse)
		require.NoError(t, err)
		assert.NotNil(t, parsedData)
		assert.NotNil(t, validationResult)

		// Verify parsing worked
		assert.Equal(t, "INV-2025-001", parsedData.InvoiceNumber)
		assert.Equal(t, "Test Supplier Co., Ltd.", parsedData.VendorName)

		// Verify validation worked
		assert.True(t, validationResult.IsValid)
		assert.Empty(t, validationResult.Errors)
	})

	t.Run("Parse successful but validation fails", func(t *testing.T) {
		// Create invalid test data (missing invoice number)
		invoiceData := InvoiceStructuredData{
			InvoiceNumber: "", // Missing - will cause validation error
			SupplierName:  "Test Supplier",
			TotalAmount:   floatPtr(-100.00), // Negative - will cause validation error
		}

		structuredDataBytes, err := json.Marshal(invoiceData)
		require.NoError(t, err)
		structuredData := json.RawMessage(structuredDataBytes)

		ocrResponse := &OCRResponse{
			StructuredData: &structuredData,
		}

		// Parse and validate
		parsedData, validationResult, err := parser.ParseAndValidate(ctx, ocrResponse)
		require.NoError(t, err)
		assert.NotNil(t, parsedData)
		assert.NotNil(t, validationResult)

		// Verify parsing worked but data is invalid
		assert.Equal(t, "", parsedData.InvoiceNumber)
		assert.False(t, validationResult.IsValid)
		assert.NotEmpty(t, validationResult.Errors)
	})
}

func TestInvoiceDataParser_DateParsing(t *testing.T) {
	parser := &invoiceDataParser{}

	testCases := []struct {
		input    string
		expected time.Time
		hasError bool
	}{
		{"2025-01-15", time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC), false},
		{"2025/01/15", time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC), false},
		{"15/01/2025", time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC), false},
		{"01/15/2025", time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC), false},
		{"2025-01-15 10:30:00", time.Date(2025, 1, 15, 10, 30, 0, 0, time.UTC), false},
		{"20250115", time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC), false},
		{"2025年01月15日", time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC), false},
		{"2025.01.15", time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC), false},
		{"invalid-date", time.Time{}, true},
		{"", time.Time{}, true},
	}

	for _, tc := range testCases {
		t.Run(tc.input, func(t *testing.T) {
			result, err := parser.parseDate(tc.input)
			if tc.hasError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.expected, result)
			}
		})
	}
}

func TestInvoiceDataParser_NumericParsing(t *testing.T) {
	parser := &invoiceDataParser{}

	t.Run("cleanNumericString", func(t *testing.T) {
		testCases := []struct {
			input    string
			expected string
		}{
			{"1,234.56", "1234.56"},
			{"$1,234.56", "1234.56"},
			{"NT$1,234", "1234"},
			{"€123.45", "123.45"},
			{"¥123", "123"},
			{"USD 123.45", "123.45"},
			{"123.45 TWD", "123.45"},
			{"-123.45", "-123.45"},
			{"+123.45", "+123.45"},
			{"abc123.45def", "123.45"},
		}

		for _, tc := range testCases {
			t.Run(tc.input, func(t *testing.T) {
				result := parser.cleanNumericString(tc.input)
				assert.Equal(t, tc.expected, result)
			})
		}
	})

	t.Run("toFloat64", func(t *testing.T) {
		testCases := []struct {
			input    interface{}
			expected *float64
		}{
			{123.45, floatPtr(123.45)},
			{float32(123.45), floatPtr(123.45)},
			{123, floatPtr(123.0)},
			{int64(123), floatPtr(123.0)},
			{"123.45", floatPtr(123.45)},
			{"$1,234.56", floatPtr(1234.56)},
			{"invalid", nil},
			{nil, nil},
		}

		for _, tc := range testCases {
			t.Run("", func(t *testing.T) {
				result := parser.toFloat64(tc.input)
				if tc.expected == nil {
					assert.Nil(t, result)
				} else {
					assert.NotNil(t, result)
					assert.Equal(t, *tc.expected, *result)
				}
			})
		}
	})
}

// Helper functions for tests
func floatPtr(f float64) *float64 {
	return &f
}

func stringPtr(s string) *string {
	return &s
}

func timePtr(t time.Time) *time.Time {
	return &t
}