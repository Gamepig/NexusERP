package tests

import (
	"context"
	"errors"
	"testing"
	"time"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/utils"
)

// TestOCRErrorCreation tests the creation and properties of OCR errors
func TestOCRErrorCreation(t *testing.T) {
	tests := []struct {
		name           string
		code           models.OCRErrorCode
		message        string
		category       models.OCRErrorCategory
		severity       models.OCRErrorSeverity
		expectedRetryable bool
	}{
		{
			name:              "Service timeout error",
			code:              models.OCRErrorServiceTimeout,
			message:           "OCR service timed out",
			category:          models.OCRErrorCategoryProvider,
			severity:          models.OCRErrorSeverityMedium,
			expectedRetryable: true,
		},
		{
			name:              "File not found error",
			code:              models.OCRErrorFileNotFound,
			message:           "File not found",
			category:          models.OCRErrorCategoryUser,
			severity:          models.OCRErrorSeverityLow,
			expectedRetryable: false,
		},
		{
			name:              "Invalid API key error",
			code:              models.OCRErrorInvalidAPIKey,
			message:           "Invalid API key",
			category:          models.OCRErrorCategorySystem,
			severity:          models.OCRErrorSeverityHigh,
			expectedRetryable: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := models.NewOCRError(tt.code, tt.message, tt.category, tt.severity)

			if err.Code != tt.code {
				t.Errorf("Expected code %s, got %s", tt.code, err.Code)
			}

			if err.Message != tt.message {
				t.Errorf("Expected message %s, got %s", tt.message, err.Message)
			}

			if err.Category != tt.category {
				t.Errorf("Expected category %s, got %s", tt.category, err.Category)
			}

			if err.Severity != tt.severity {
				t.Errorf("Expected severity %s, got %s", tt.severity, err.Severity)
			}

			if err.IsRetryable() != tt.expectedRetryable {
				t.Errorf("Expected retryable %t, got %t", tt.expectedRetryable, err.IsRetryable())
			}

			if err.IsUserError() != (tt.category == models.OCRErrorCategoryUser) {
				t.Errorf("Expected user error %t, got %t", tt.category == models.OCRErrorCategoryUser, err.IsUserError())
			}
		})
	}
}

// TestOCRErrorWrapping tests error wrapping functionality
func TestOCRErrorWrapping(t *testing.T) {
	originalErr := errors.New("original database error")
	
	wrappedErr := models.WrapOCRError(
		originalErr,
		models.OCRErrorDatabaseConnection,
		"Database connection failed",
		models.OCRErrorCategorySystem,
		models.OCRErrorSeverityHigh,
	)

	if wrappedErr.OriginalError != originalErr {
		t.Errorf("Expected original error to be preserved")
	}

	if !errors.Is(wrappedErr, originalErr) {
		t.Errorf("Expected wrapped error to unwrap to original error")
	}

	if wrappedErr.Unwrap() != originalErr {
		t.Errorf("Expected Unwrap() to return original error")
	}
}

// TestOCRErrorUserFriendlyMessages tests user-friendly message generation
func TestOCRErrorUserFriendlyMessages(t *testing.T) {
	tests := []struct {
		name         string
		code         models.OCRErrorCode
		expectedMsg  string
	}{
		{
			name:        "File too big",
			code:        models.OCRErrorFileTooBig,
			expectedMsg: "The file is too large. Please upload a file smaller than 10MB.",
		},
		{
			name:        "Service unavailable",
			code:        models.OCRErrorServiceUnavailable,
			expectedMsg: "The OCR service is temporarily unavailable. Please try again later or use manual data entry.",
		},
		{
			name:        "Low confidence",
			code:        models.OCRErrorLowConfidence,
			expectedMsg: "The text recognition quality is low. Please review the extracted data carefully or use manual data entry.",
		},
		{
			name:        "Unknown error",
			code:        models.OCRErrorCode("UNKNOWN_ERROR"),
			expectedMsg: "An error occurred while processing your document. Please try again or contact support.",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := models.NewOCRError(tt.code, "Test error", models.OCRErrorCategorySystem, models.OCRErrorSeverityMedium)
			userMsg := err.GetUserFriendlyMessage()

			if userMsg != tt.expectedMsg {
				t.Errorf("Expected user message %q, got %q", tt.expectedMsg, userMsg)
			}
		})
	}
}

// TestOCRErrorSuggestedActions tests suggested action generation
func TestOCRErrorSuggestedActions(t *testing.T) {
	tests := []struct {
		name           string
		code           models.OCRErrorCode
		expectedAction string
	}{
		{
			name:           "File too big",
			code:           models.OCRErrorFileTooBig,
			expectedAction: "compress_file",
		},
		{
			name:           "Low confidence",
			code:           models.OCRErrorLowConfidence,
			expectedAction: "manual_entry",
		},
		{
			name:           "Service timeout",
			code:           models.OCRErrorServiceTimeout,
			expectedAction: "retry_or_manual",
		},
		{
			name:           "Unknown error",
			code:           models.OCRErrorCode("UNKNOWN_ERROR"),
			expectedAction: "contact_support",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := models.NewOCRError(tt.code, "Test error", models.OCRErrorCategorySystem, models.OCRErrorSeverityMedium)
			action := err.GetSuggestedAction()

			if action != tt.expectedAction {
				t.Errorf("Expected action %q, got %q", tt.expectedAction, action)
			}
		})
	}
}

// TestOCRValidationResult tests validation result functionality
func TestOCRValidationResult(t *testing.T) {
	result := &models.OCRValidationResult{
		IsValid: true,
		Errors:  []models.OCRValidationError{},
		Warnings: []models.OCRValidationError{},
	}

	// Should start as valid
	if !result.IsValid {
		t.Errorf("Expected validation result to start as valid")
	}

	// Add error should make it invalid
	result.AddError("field1", "required", "Field is required", nil)
	if result.IsValid {
		t.Errorf("Expected validation result to be invalid after adding error")
	}

	if len(result.Errors) != 1 {
		t.Errorf("Expected 1 error, got %d", len(result.Errors))
	}

	// Add warning should not affect validity
	result.IsValid = true // Reset for test
	result.AddWarning("field2", "format", "Field format is unusual", "test_value")
	if !result.IsValid {
		t.Errorf("Expected validation result to remain valid after adding warning")
	}

	if len(result.Warnings) != 1 {
		t.Errorf("Expected 1 warning, got %d", len(result.Warnings))
	}
}

// TestFileErrorCreation tests file error helper function
func TestFileErrorCreation(t *testing.T) {
	filename := "test-invoice.pdf"
	details := map[string]interface{}{
		"file_size": 15000000,
		"max_size":  10000000,
	}

	err := utils.CreateFileError(models.OCRErrorFileTooBig, filename, details)

	if err.Code != models.OCRErrorFileTooBig {
		t.Errorf("Expected error code %s, got %s", models.OCRErrorFileTooBig, err.Code)
	}

	if err.Category != models.OCRErrorCategoryUser {
		t.Errorf("Expected category %s, got %s", models.OCRErrorCategoryUser, err.Category)
	}

	if err.Severity != models.OCRErrorSeverityLow {
		t.Errorf("Expected severity %s, got %s", models.OCRErrorSeverityLow, err.Severity)
	}

	if err.Details["filename"] != filename {
		t.Errorf("Expected filename in details")
	}

	if err.Details["file_size"] != 15000000 {
		t.Errorf("Expected file_size in details")
	}
}

// TestServiceErrorCreation tests service error helper function
func TestServiceErrorCreation(t *testing.T) {
	serviceName := "Google Cloud Vision"
	details := map[string]interface{}{
		"status_code": 429,
		"retry_after": 60,
	}

	err := utils.CreateServiceError(models.OCRErrorRateLimitExceeded, serviceName, details)

	if err.Code != models.OCRErrorRateLimitExceeded {
		t.Errorf("Expected error code %s, got %s", models.OCRErrorRateLimitExceeded, err.Code)
	}

	if err.Category != models.OCRErrorCategoryProvider {
		t.Errorf("Expected category %s, got %s", models.OCRErrorCategoryProvider, err.Category)
	}

	if err.Details["service"] != serviceName {
		t.Errorf("Expected service name in details")
	}
}

// TestProcessingErrorCreation tests processing error helper function
func TestProcessingErrorCreation(t *testing.T) {
	confidence := 0.45
	details := map[string]interface{}{
		"document_type": "invoice",
		"language":      "en",
	}

	err := utils.CreateProcessingError(models.OCRErrorLowConfidence, confidence, details)

	if err.Code != models.OCRErrorLowConfidence {
		t.Errorf("Expected error code %s, got %s", models.OCRErrorLowConfidence, err.Code)
	}

	if err.Category != models.OCRErrorCategoryData {
		t.Errorf("Expected category %s, got %s", models.OCRErrorCategoryData, err.Category)
	}

	if err.Details["confidence"] != confidence {
		t.Errorf("Expected confidence in details")
	}
}

// TestValidationErrorCreation tests validation error helper function
func TestValidationErrorCreation(t *testing.T) {
	validationResult := &models.OCRValidationResult{
		IsValid: false,
		Errors: []models.OCRValidationError{
			{
				Field:   "invoice_number",
				Value:   "",
				Rule:    "required",
				Message: "Invoice number is required",
			},
			{
				Field:   "total_amount",
				Value:   -100,
				Rule:    "positive",
				Message: "Total amount must be positive",
			},
		},
		Warnings: []models.OCRValidationError{
			{
				Field:   "due_date",
				Value:   "2024-01-01",
				Rule:    "future_date",
				Message: "Due date is in the past",
			},
		},
	}

	err := utils.CreateValidationError(validationResult)

	if err.Code != models.OCRErrorValidationFailed {
		t.Errorf("Expected error code %s, got %s", models.OCRErrorValidationFailed, err.Code)
	}

	if err.Category != models.OCRErrorCategoryData {
		t.Errorf("Expected category %s, got %s", models.OCRErrorCategoryData, err.Category)
	}

	if err.Severity != models.OCRErrorSeverityLow {
		t.Errorf("Expected severity %s, got %s", models.OCRErrorSeverityLow, err.Severity)
	}

	// Check if validation details are included
	validationErrors, ok := err.Details["validation_errors"].([]models.OCRValidationError)
	if !ok || len(validationErrors) != 2 {
		t.Errorf("Expected validation errors in details")
	}

	validationWarnings, ok := err.Details["validation_warnings"].([]models.OCRValidationError)
	if !ok || len(validationWarnings) != 1 {
		t.Errorf("Expected validation warnings in details")
	}
}

// TestOCRErrorResponse tests error response creation
func TestOCRErrorResponse(t *testing.T) {
	ocrError := models.NewOCRError(
		models.OCRErrorServiceTimeout,
		"OCR service timed out",
		models.OCRErrorCategoryProvider,
		models.OCRErrorSeverityMedium,
	)
	ocrError.DocumentID = &[]int64{123}[0]
	ocrError.UserID = &[]int64{456}[0]

	requestID := "req_123456789"
	response := models.NewOCRErrorResponse(ocrError, requestID)

	if response.Success {
		t.Errorf("Expected success to be false for error response")
	}

	if response.Error != ocrError {
		t.Errorf("Expected error to match original OCR error")
	}

	if response.RequestID != requestID {
		t.Errorf("Expected request ID %s, got %s", requestID, response.RequestID)
	}

	if response.UserMessage == "" {
		t.Errorf("Expected user message to be populated")
	}

	if response.SuggestedAction == "" {
		t.Errorf("Expected suggested action to be populated")
	}

	if response.Timestamp.IsZero() {
		t.Errorf("Expected timestamp to be set")
	}
}

// TestOCRErrorContextualInfo tests error context enhancement
func TestOCRErrorContextualInfo(t *testing.T) {
	err := models.NewOCRError(
		models.OCRErrorFileTooBig,
		"File too large",
		models.OCRErrorCategoryUser,
		models.OCRErrorSeverityLow,
	)

	// Initially no contextual info
	if err.DocumentID != nil {
		t.Errorf("Expected document ID to be nil initially")
	}

	if err.UserID != nil {
		t.Errorf("Expected user ID to be nil initially")
	}

	if err.RequestID != "" {
		t.Errorf("Expected request ID to be empty initially")
	}

	// Add contextual info
	documentID := int64(123)
	userID := int64(456)
	requestID := "req_123456789"

	err.DocumentID = &documentID
	err.UserID = &userID
	err.RequestID = requestID

	// Verify context is preserved
	if *err.DocumentID != 123 {
		t.Errorf("Expected document ID 123, got %d", *err.DocumentID)
	}

	if *err.UserID != 456 {
		t.Errorf("Expected user ID 456, got %d", *err.UserID)
	}

	if err.RequestID != requestID {
		t.Errorf("Expected request ID %s, got %s", requestID, err.RequestID)
	}

	// Test error message with context
	errorMsg := err.Error()
	expectedMsg := "OCR Error [FILE_TOO_BIG] for document 123: File too large"
	if errorMsg != expectedMsg {
		t.Errorf("Expected error message %q, got %q", expectedMsg, errorMsg)
	}
}

// TestErrorTimestamp tests that errors have proper timestamps
func TestErrorTimestamp(t *testing.T) {
	before := time.Now()
	
	err := models.NewOCRError(
		models.OCRErrorInternalError,
		"Test error",
		models.OCRErrorCategorySystem,
		models.OCRErrorSeverityMedium,
	)
	
	after := time.Now()

	if err.Timestamp.Before(before) || err.Timestamp.After(after) {
		t.Errorf("Expected timestamp to be between %v and %v, got %v", before, after, err.Timestamp)
	}
}