package services

import (
	"context"
	"fmt"
	"nexus-erp/backend/internal/config"
)

// DefaultOCRClientFactory implements OCRClientFactory
type DefaultOCRClientFactory struct{}

// NewOCRClientFactory creates a new OCR client factory
func NewOCRClientFactory() OCRClientFactory {
	return &DefaultOCRClientFactory{}
}

// CreateClient creates an OCR client based on the provider configuration
func (f *DefaultOCRClientFactory) CreateClient(provider string, config map[string]string) (OCRClient, error) {
	switch provider {
	case "google":
		return f.createGoogleVisionClient(config)
	case "aws":
		return f.createAWSTextractClient(config)
	case "azure":
		return f.createAzureClient(config)
	case "mock":
		return f.createMockClient(config)
	default:
		return nil, fmt.Errorf("unsupported OCR provider: %s", provider)
	}
}

// createGoogleVisionClient creates a Google Cloud Vision client
func (f *DefaultOCRClientFactory) createGoogleVisionClient(config map[string]string) (OCRClient, error) {
	projectID := config["project_id"]
	credentialsPath := config["credentials_path"]
	
	if projectID == "" {
		return nil, fmt.Errorf("google project_id is required")
	}
	
	ctx := context.Background()
	client, err := NewGoogleVisionClient(ctx, projectID, credentialsPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create Google Vision client: %w", err)
	}
	
	return client, nil
}

// createAWSTextractClient creates an AWS Textract client (placeholder)
func (f *DefaultOCRClientFactory) createAWSTextractClient(config map[string]string) (OCRClient, error) {
	// TODO: Implement AWS Textract client
	return nil, fmt.Errorf("AWS Textract client not implemented yet")
}

// createAzureClient creates an Azure Cognitive Services client (placeholder)
func (f *DefaultOCRClientFactory) createAzureClient(config map[string]string) (OCRClient, error) {
	// TODO: Implement Azure Cognitive Services client
	return nil, fmt.Errorf("Azure client not implemented yet")
}

// createMockClient creates a mock OCR client for testing
func (f *DefaultOCRClientFactory) createMockClient(config map[string]string) (OCRClient, error) {
	return NewMockOCRClient(), nil
}

// CreateOCRClientFromConfig creates an OCR client from application config
func CreateOCRClientFromConfig(cfg *config.Config) (OCRClient, error) {
	factory := NewOCRClientFactory()
	
	configMap := make(map[string]string)
	
	switch cfg.OCR.Provider {
	case "google":
		configMap["project_id"] = cfg.OCR.GoogleProjectID
		configMap["credentials_path"] = cfg.OCR.GoogleCredentials
	case "aws":
		configMap["access_key"] = cfg.OCR.AWSAccessKey
		configMap["secret_key"] = cfg.OCR.AWSSecretKey
		configMap["region"] = cfg.OCR.AWSRegion
	case "azure":
		configMap["endpoint"] = cfg.OCR.AzureEndpoint
		configMap["subscription_key"] = cfg.OCR.AzureSubscriptionKey
	case "mock":
		// Mock client doesn't need configuration
	default:
		return nil, fmt.Errorf("unsupported OCR provider: %s", cfg.OCR.Provider)
	}
	
	return factory.CreateClient(cfg.OCR.Provider, configMap)
}