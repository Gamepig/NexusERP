package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	vision "cloud.google.com/go/vision/v2/apiv1"
	"cloud.google.com/go/vision/v2/apiv1/visionpb"
)

// GoogleVisionClient implements OCRClient using Google Cloud Vision API
type GoogleVisionClient struct {
	client    *vision.ImageAnnotatorClient
	projectID string
}

// NewGoogleVisionClient creates a new Google Cloud Vision client
func NewGoogleVisionClient(ctx context.Context, projectID string, credentialsPath string) (*GoogleVisionClient, error) {
	// Set credentials environment variable if provided
	if credentialsPath != "" {
		os.Setenv("GOOGLE_APPLICATION_CREDENTIALS", credentialsPath)
	}
	
	client, err := vision.NewImageAnnotatorClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create Vision client: %w", err)
	}
	
	return &GoogleVisionClient{
		client:    client,
		projectID: projectID,
	}, nil
}

// ProcessDocument processes a document using Google Cloud Vision API
func (g *GoogleVisionClient) ProcessDocument(ctx context.Context, filePath string) (*OCRResponse, error) {
	startTime := time.Now()
	
	// Read the image file
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()
	
	imageBytes, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}
	
	// Create vision request
	image := &visionpb.Image{
		Content: imageBytes,
	}
	
	// Perform document text detection
	req := &visionpb.BatchAnnotateImagesRequest{
		Requests: []*visionpb.AnnotateImageRequest{
			{
				Image: image,
				Features: []*visionpb.Feature{
					{
						Type: visionpb.Feature_DOCUMENT_TEXT_DETECTION,
					},
				},
			},
		},
	}
	
	resp, err := g.client.BatchAnnotateImages(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to annotate image: %w", err)
	}
	
	if len(resp.Responses) == 0 {
		return nil, fmt.Errorf("no response from Vision API")
	}
	
	annotations := resp.Responses[0]
	
	processingTime := time.Since(startTime).Milliseconds()
	
	// Extract basic information
	response := &OCRResponse{
		ProcessingTime: processingTime,
		Language:       "zh-TW", // Default, will be detected if available
	}
	
	if annotations.GetFullTextAnnotation() != nil {
		response.RawText = annotations.GetFullTextAnnotation().GetText()
		response.Confidence = calculateAverageConfidence(annotations.GetFullTextAnnotation())
		
		// Detect language from the first page if available
		if len(annotations.GetFullTextAnnotation().GetPages()) > 0 {
			page := annotations.GetFullTextAnnotation().GetPages()[0]
			if page.GetProperty() != nil && page.GetProperty().GetDetectedLanguages() != nil {
				languages := page.GetProperty().GetDetectedLanguages()
				if len(languages) > 0 {
					response.Language = languages[0].GetLanguageCode()
				}
			}
		}
		
		// Extract structured data for invoices
		structuredData, err := g.extractInvoiceData(response.RawText)
		if err == nil && structuredData != nil {
			structuredDataBytes, _ := json.Marshal(structuredData)
			structuredDataJSON := json.RawMessage(structuredDataBytes)
			response.StructuredData = &structuredDataJSON
		}
	}
	
	// Store provider response
	providerBytes, _ := json.Marshal(annotations)
	providerResponse := json.RawMessage(providerBytes)
	response.ProviderResponse = &providerResponse
	
	return response, nil
}

// Close closes the Google Vision client
func (g *GoogleVisionClient) Close() error {
	if g.client != nil {
		return g.client.Close()
	}
	return nil
}

// calculateAverageConfidence calculates the average confidence from all detected text
func calculateAverageConfidence(annotation *visionpb.TextAnnotation) float64 {
	if len(annotation.GetPages()) == 0 {
		return 0.0
	}
	
	var totalConfidence float64
	var count int
	
	for _, page := range annotation.GetPages() {
		for _, block := range page.GetBlocks() {
			if block.GetConfidence() > 0 {
				totalConfidence += float64(block.GetConfidence())
				count++
			}
		}
	}
	
	if count == 0 {
		return 0.8 // Default confidence if no confidence scores available
	}
	
	return totalConfidence / float64(count)
}

// extractInvoiceData attempts to extract structured invoice data from raw text
func (g *GoogleVisionClient) extractInvoiceData(rawText string) (*InvoiceStructuredData, error) {
	if rawText == "" {
		return nil, fmt.Errorf("no text to process")
	}
	
	data := &InvoiceStructuredData{}
	
	// Regular expressions for common invoice patterns
	// These patterns are designed for Traditional Chinese invoices but can be adapted
	
	// Invoice number patterns
	invoiceNumPatterns := []string{
		`發票號碼[:：]\s*([A-Z0-9-]+)`,
		`Invoice\s*(?:Number|No)[:：]?\s*([A-Z0-9-]+)`,
		`統一發票[:：]\s*([A-Z0-9-]+)`,
		`([A-Z]{2}\d{8})`, // Taiwan invoice format
	}
	
	for _, pattern := range invoiceNumPatterns {
		if match := regexp.MustCompile(pattern).FindStringSubmatch(rawText); len(match) > 1 {
			data.InvoiceNumber = strings.TrimSpace(match[1])
			break
		}
	}
	
	// Date patterns
	datePatterns := []string{
		`日期[:：]\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})`,
		`Date[:：]?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})`,
		`(\d{4}[-/]\d{1,2}[-/]\d{1,2})`,
		`(\d{1,2}[-/]\d{1,2}[-/]\d{4})`,
	}
	
	for _, pattern := range datePatterns {
		if match := regexp.MustCompile(pattern).FindStringSubmatch(rawText); len(match) > 1 {
			data.InvoiceDate = strings.TrimSpace(match[1])
			break
		}
	}
	
	// Supplier name patterns
	supplierPatterns := []string{
		`賣方[:：]\s*([^\n\r]+)`,
		`供應商[:：]\s*([^\n\r]+)`,
		`公司[:：]\s*([^\n\r]+)`,
		`Supplier[:：]?\s*([^\n\r]+)`,
	}
	
	for _, pattern := range supplierPatterns {
		if match := regexp.MustCompile(pattern).FindStringSubmatch(rawText); len(match) > 1 {
			data.SupplierName = strings.TrimSpace(match[1])
			break
		}
	}
	
	// Total amount patterns
	totalPatterns := []string{
		`總計[:：]\s*\$?([0-9,]+\.?\d*)`,
		`合計[:：]\s*\$?([0-9,]+\.?\d*)`,
		`Total[:：]?\s*\$?([0-9,]+\.?\d*)`,
		`Amount[:：]?\s*\$?([0-9,]+\.?\d*)`,
	}
	
	for _, pattern := range totalPatterns {
		if match := regexp.MustCompile(pattern).FindStringSubmatch(rawText); len(match) > 1 {
			amountStr := strings.ReplaceAll(strings.TrimSpace(match[1]), ",", "")
			if amount, err := strconv.ParseFloat(amountStr, 64); err == nil {
				data.TotalAmount = &amount
				break
			}
		}
	}
	
	// Tax number patterns (Taiwan format)
	taxNumPatterns := []string{
		`統一編號[:：]\s*(\d{8})`,
		`Tax\s*(?:ID|Number)[:：]?\s*(\d{8})`,
		`(\d{8})`, // Generic 8-digit number
	}
	
	for _, pattern := range taxNumPatterns {
		if match := regexp.MustCompile(pattern).FindStringSubmatch(rawText); len(match) > 1 {
			data.TaxNumber = strings.TrimSpace(match[1])
			break
		}
	}
	
	// Set default currency
	data.Currency = "TWD"
	
	// If we found at least some structured data, return it
	if data.InvoiceNumber != "" || data.SupplierName != "" || data.TotalAmount != nil {
		return data, nil
	}
	
	return nil, fmt.Errorf("could not extract structured invoice data")
}