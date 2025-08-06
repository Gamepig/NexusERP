package services

import (
	"context"
	"encoding/json"
	"fmt"
	"path/filepath"
	"strings"
	"time"
)

// MockOCRClient implements OCRClient for testing and development
type MockOCRClient struct{}

// NewMockOCRClient creates a new mock OCR client
func NewMockOCRClient() *MockOCRClient {
	return &MockOCRClient{}
}

// ProcessDocument simulates OCR processing with mock data
func (m *MockOCRClient) ProcessDocument(ctx context.Context, filePath string) (*OCRResponse, error) {
	// Simulate processing time
	time.Sleep(500 * time.Millisecond)
	
	// Generate mock response based on file name
	fileName := filepath.Base(filePath)
	fileExt := strings.ToLower(filepath.Ext(fileName))
	
	// Simulate different responses based on file type
	var mockText string
	var mockStructuredData *InvoiceStructuredData
	
	switch fileExt {
	case ".pdf":
		mockText = generateMockInvoiceTextPDF()
		mockStructuredData = generateMockInvoiceStructuredData()
	case ".jpg", ".jpeg":
		mockText = generateMockInvoiceTextJPEG()
		mockStructuredData = generateMockInvoiceStructuredData()
	case ".png":
		mockText = generateMockInvoiceTextPNG()
		mockStructuredData = generateMockInvoiceStructuredData()
	default:
		return nil, fmt.Errorf("unsupported file type: %s", fileExt)
	}
	
	// Convert structured data to JSON
	var structuredDataJSON *json.RawMessage
	if mockStructuredData != nil {
		structuredBytes, _ := json.Marshal(mockStructuredData)
		rawMessage := json.RawMessage(structuredBytes)
		structuredDataJSON = &rawMessage
	}
	
	// Create mock provider response
	mockProviderResponse := map[string]interface{}{
		"mock": true,
		"file": fileName,
		"timestamp": time.Now().Unix(),
		"pages": []map[string]interface{}{
			{
				"page_number": 1,
				"confidence": 0.95,
				"detected_languages": []map[string]interface{}{
					{"language_code": "zh-TW", "confidence": 0.9},
				},
			},
		},
	}
	
	providerBytes, _ := json.Marshal(mockProviderResponse)
	providerResponse := json.RawMessage(providerBytes)
	
	return &OCRResponse{
		RawText:          mockText,
		Confidence:       0.95,
		Language:         "zh-TW",
		ProcessingTime:   500,
		StructuredData:   structuredDataJSON,
		ProviderResponse: &providerResponse,
	}, nil
}

// Close closes the mock client (no-op)
func (m *MockOCRClient) Close() error {
	return nil
}

// generateMockInvoiceTextPDF generates mock text for PDF invoices
func generateMockInvoiceTextPDF() string {
	return `統一發票
發票號碼: AB12345678
日期: 2025-01-15
統一編號: 12345678

賣方: 測試供應商有限公司
地址: 台北市信義區信義路五段7號

品項：
1. 辦公用品 - 數量: 10, 單價: $50, 小計: $500
2. 文具用品 - 數量: 5, 單價: $30, 小計: $150

小計: $650
稅額: $32
總計: $682`
}

// generateMockInvoiceTextJPEG generates mock text for JPEG invoices
func generateMockInvoiceTextJPEG() string {
	return `電子發票
Invoice No: CD87654321
Date: 2025-01-16
Tax ID: 87654321

Supplier: ABC Electronics Co., Ltd.
Address: 新北市板橋區中山路一段123號

Items:
- 電腦設備 x2 @ $15,000 = $30,000
- 網路設備 x1 @ $5,000 = $5,000

Subtotal: $35,000
Tax (5%): $1,750
Total: $36,750`
}

// generateMockInvoiceTextPNG generates mock text for PNG invoices
func generateMockInvoiceTextPNG() string {
	return `餐飲發票
Receipt No: EF11223344
Date: 2025-01-17
Business ID: 11223344

Restaurant: 美食天堂餐廳
Location: 台中市西區台灣大道二段459號

Orders:
• 牛肉麵 x2 - $180 each = $360
• 滷肉飯 x3 - $80 each = $240
• 飲料 x5 - $30 each = $150

Subtotal: $750
Service Charge (10%): $75
Total Amount: $825`
}

// generateMockInvoiceStructuredData generates mock structured invoice data
func generateMockInvoiceStructuredData() *InvoiceStructuredData {
	subtotal := 650.0
	taxAmount := 32.0
	totalAmount := 682.0
	
	items := []InvoiceItemExtracted{
		{
			Description: "辦公用品",
			Quantity:    &[]float64{10}[0],
			UnitPrice:   &[]float64{50}[0],
			Amount:      &[]float64{500}[0],
		},
		{
			Description: "文具用品",
			Quantity:    &[]float64{5}[0],
			UnitPrice:   &[]float64{30}[0],
			Amount:      &[]float64{150}[0],
		},
	}
	
	return &InvoiceStructuredData{
		InvoiceNumber:   "AB12345678",
		InvoiceDate:     "2025-01-15",
		SupplierName:    "測試供應商有限公司",
		SupplierAddress: "台北市信義區信義路五段7號",
		TaxNumber:       "12345678",
		Subtotal:        &subtotal,
		TaxAmount:       &taxAmount,
		TotalAmount:     &totalAmount,
		Currency:        "TWD",
		Items:           items,
	}
}