package models

import (
	"fmt"
	"time"
)

// OCRErrorCode represents specific error codes for OCR operations
type OCRErrorCode string

const (
	// File-related errors
	OCRErrorFileNotFound       OCRErrorCode = "FILE_NOT_FOUND"
	OCRErrorFileTooBig         OCRErrorCode = "FILE_TOO_BIG"
	OCRErrorUnsupportedFormat  OCRErrorCode = "UNSUPPORTED_FORMAT"
	OCRErrorFileCorrupted      OCRErrorCode = "FILE_CORRUPTED"
	OCRErrorFileReadFailed     OCRErrorCode = "FILE_READ_FAILED"
	
	// OCR Service errors
	OCRErrorServiceUnavailable OCRErrorCode = "SERVICE_UNAVAILABLE"
	OCRErrorServiceTimeout     OCRErrorCode = "SERVICE_TIMEOUT"
	OCRErrorAPIQuotaExceeded   OCRErrorCode = "API_QUOTA_EXCEEDED"
	OCRErrorInvalidAPIKey      OCRErrorCode = "INVALID_API_KEY"
	OCRErrorRateLimitExceeded  OCRErrorCode = "RATE_LIMIT_EXCEEDED"
	
	// Processing errors
	OCRErrorProcessingFailed   OCRErrorCode = "PROCESSING_FAILED"
	OCRErrorLowConfidence      OCRErrorCode = "LOW_CONFIDENCE"
	OCRErrorNoTextDetected     OCRErrorCode = "NO_TEXT_DETECTED"
	OCRErrorLanguageNotSupported OCRErrorCode = "LANGUAGE_NOT_SUPPORTED"
	
	// Data validation errors
	OCRErrorDataParsingFailed  OCRErrorCode = "DATA_PARSING_FAILED"
	OCRErrorInvalidDataFormat  OCRErrorCode = "INVALID_DATA_FORMAT"
	OCRErrorMissingRequiredField OCRErrorCode = "MISSING_REQUIRED_FIELD"
	OCRErrorValidationFailed   OCRErrorCode = "VALIDATION_FAILED"
	
	// Database errors
	OCRErrorDatabaseConnection OCRErrorCode = "DATABASE_CONNECTION"
	OCRErrorDataSaveFailed     OCRErrorCode = "DATA_SAVE_FAILED"
	OCRErrorDocumentNotFound   OCRErrorCode = "DOCUMENT_NOT_FOUND"
	
	// Authentication and authorization errors
	OCRErrorUnauthorized       OCRErrorCode = "UNAUTHORIZED"
	OCRErrorForbidden          OCRErrorCode = "FORBIDDEN"
	
	// System errors
	OCRErrorInternalError      OCRErrorCode = "INTERNAL_ERROR"
	OCRErrorConfigurationError OCRErrorCode = "CONFIGURATION_ERROR"
	OCRErrorNetworkError       OCRErrorCode = "NETWORK_ERROR"
)

// OCRErrorCategory represents the category of error for better classification
type OCRErrorCategory string

const (
	OCRErrorCategoryUser     OCRErrorCategory = "user"     // User-fixable errors
	OCRErrorCategorySystem   OCRErrorCategory = "system"   // System/infrastructure errors
	OCRErrorCategoryProvider OCRErrorCategory = "provider" // External OCR provider errors
	OCRErrorCategoryData     OCRErrorCategory = "data"     // Data processing/validation errors
)

// OCRErrorSeverity represents the severity level of the error
type OCRErrorSeverity string

const (
	OCRErrorSeverityLow      OCRErrorSeverity = "low"      // Warnings, low confidence
	OCRErrorSeverityMedium   OCRErrorSeverity = "medium"   // Processing failures with fallback
	OCRErrorSeverityHigh     OCRErrorSeverity = "high"     // Service unavailable, critical failures
	OCRErrorSeverityCritical OCRErrorSeverity = "critical" // System-wide failures
)

// OCRError represents a structured OCR error with detailed context
type OCRError struct {
	Code        OCRErrorCode     `json:"code"`
	Message     string           `json:"message"`
	Category    OCRErrorCategory `json:"category"`
	Severity    OCRErrorSeverity `json:"severity"`
	Details     map[string]interface{} `json:"details,omitempty"`
	DocumentID  *int64           `json:"document_id,omitempty"`
	UserID      *int64           `json:"user_id,omitempty"`
	RequestID   string           `json:"request_id,omitempty"`
	Timestamp   time.Time        `json:"timestamp"`
	Retryable   bool             `json:"retryable"`
	Context     map[string]string `json:"context,omitempty"`
	StackTrace  string           `json:"stack_trace,omitempty"`
	OriginalError error          `json:"-"` // Don't serialize the original error
}

// Error implements the error interface
func (e *OCRError) Error() string {
	if e.DocumentID != nil {
		return fmt.Sprintf("OCR Error [%s] for document %d: %s", e.Code, *e.DocumentID, e.Message)
	}
	return fmt.Sprintf("OCR Error [%s]: %s", e.Code, e.Message)
}

// Unwrap returns the original error for error wrapping compatibility
func (e *OCRError) Unwrap() error {
	return e.OriginalError
}

// IsRetryable returns whether this error can be retried
func (e *OCRError) IsRetryable() bool {
	return e.Retryable
}

// IsUserError returns whether this is a user-fixable error
func (e *OCRError) IsUserError() bool {
	return e.Category == OCRErrorCategoryUser
}

// NewOCRError creates a new OCR error with the given parameters
func NewOCRError(code OCRErrorCode, message string, category OCRErrorCategory, severity OCRErrorSeverity) *OCRError {
	return &OCRError{
		Code:      code,
		Message:   message,
		Category:  category,
		Severity:  severity,
		Timestamp: time.Now(),
		Details:   make(map[string]interface{}),
		Context:   make(map[string]string),
		Retryable: isRetryableError(code),
	}
}

// NewOCRErrorWithDetails creates a new OCR error with additional details
func NewOCRErrorWithDetails(code OCRErrorCode, message string, category OCRErrorCategory, severity OCRErrorSeverity, details map[string]interface{}) *OCRError {
	err := NewOCRError(code, message, category, severity)
	err.Details = details
	return err
}

// WrapOCRError wraps an existing error with OCR-specific context
func WrapOCRError(originalErr error, code OCRErrorCode, message string, category OCRErrorCategory, severity OCRErrorSeverity) *OCRError {
	ocrErr := NewOCRError(code, message, category, severity)
	ocrErr.OriginalError = originalErr
	return ocrErr
}

// isRetryableError determines if an error code represents a retryable condition
func isRetryableError(code OCRErrorCode) bool {
	retryableCodes := map[OCRErrorCode]bool{
		OCRErrorServiceTimeout:     true,
		OCRErrorServiceUnavailable: true,
		OCRErrorNetworkError:       true,
		OCRErrorRateLimitExceeded:  true,
		OCRErrorDatabaseConnection: true,
		OCRErrorInternalError:      true,
	}
	return retryableCodes[code]
}

// GetUserFriendlyMessage returns a user-friendly error message
func (e *OCRError) GetUserFriendlyMessage() string {
	userMessages := map[OCRErrorCode]string{
		OCRErrorFileNotFound:       "The uploaded file could not be found. Please try uploading again.",
		OCRErrorFileTooBig:         "The file is too large. Please upload a file smaller than 10MB.",
		OCRErrorUnsupportedFormat:  "This file format is not supported. Please upload a PDF, PNG, or JPEG file.",
		OCRErrorFileCorrupted:      "The file appears to be corrupted. Please try uploading a different file.",
		OCRErrorServiceUnavailable: "The OCR service is temporarily unavailable. Please try again later or use manual data entry.",
		OCRErrorServiceTimeout:     "Processing took longer than expected. Please try again or use manual data entry.",
		OCRErrorLowConfidence:      "The text recognition quality is low. Please review the extracted data carefully or use manual data entry.",
		OCRErrorNoTextDetected:     "No text could be detected in the document. Please ensure the document is clear and readable.",
		OCRErrorAPIQuotaExceeded:   "OCR processing limit reached. Please try again later or contact support.",
		OCRErrorRateLimitExceeded:  "Too many requests. Please wait a moment and try again.",
		OCRErrorUnauthorized:       "You are not authorized to perform this action. Please log in and try again.",
		OCRErrorInternalError:      "An unexpected error occurred. Please try again or contact support if the problem persists.",
	}
	
	if msg, exists := userMessages[e.Code]; exists {
		return msg
	}
	return "An error occurred while processing your document. Please try again or contact support."
}

// GetSuggestedAction returns suggested actions for the user based on the error
func (e *OCRError) GetSuggestedAction() string {
	actions := map[OCRErrorCode]string{
		OCRErrorFileTooBig:         "compress_file",
		OCRErrorUnsupportedFormat:  "convert_format",
		OCRErrorFileCorrupted:      "reupload_file",
		OCRErrorLowConfidence:      "manual_entry",
		OCRErrorNoTextDetected:     "manual_entry",
		OCRErrorServiceUnavailable: "retry_or_manual",
		OCRErrorServiceTimeout:     "retry_or_manual",
		OCRErrorAPIQuotaExceeded:   "wait_and_retry",
		OCRErrorRateLimitExceeded:  "wait_and_retry",
	}
	
	if action, exists := actions[e.Code]; exists {
		return action
	}
	return "contact_support"
}

// OCRErrorResponse represents the standardized error response for API consumers
type OCRErrorResponse struct {
	Success         bool                   `json:"success"`
	Error           *OCRError             `json:"error"`
	Message         string                `json:"message"`
	UserMessage     string                `json:"user_message"`
	SuggestedAction string                `json:"suggested_action"`
	RequestID       string                `json:"request_id,omitempty"`
	Timestamp       time.Time             `json:"timestamp"`
	Details         map[string]interface{} `json:"details,omitempty"`
}

// NewOCRErrorResponse creates a standardized error response
func NewOCRErrorResponse(ocrError *OCRError, requestID string) *OCRErrorResponse {
	return &OCRErrorResponse{
		Success:         false,
		Error:           ocrError,
		Message:         ocrError.Message,
		UserMessage:     ocrError.GetUserFriendlyMessage(),
		SuggestedAction: ocrError.GetSuggestedAction(),
		RequestID:       requestID,
		Timestamp:       time.Now(),
		Details:         ocrError.Details,
	}
}

// OCRValidationError represents validation errors for OCR data
type OCRValidationError struct {
	Field   string `json:"field"`
	Value   interface{} `json:"value"`
	Rule    string `json:"rule"`
	Message string `json:"message"`
}

// OCRValidationResult represents the result of OCR data validation
type OCRValidationResult struct {
	IsValid  bool                  `json:"is_valid"`
	Errors   []OCRValidationError  `json:"errors,omitempty"`
	Warnings []OCRValidationError  `json:"warnings,omitempty"`
}

// AddError adds a validation error
func (vr *OCRValidationResult) AddError(field, rule, message string, value interface{}) {
	vr.IsValid = false
	vr.Errors = append(vr.Errors, OCRValidationError{
		Field:   field,
		Value:   value,
		Rule:    rule,
		Message: message,
	})
}

// AddWarning adds a validation warning
func (vr *OCRValidationResult) AddWarning(field, rule, message string, value interface{}) {
	vr.Warnings = append(vr.Warnings, OCRValidationError{
		Field:   field,
		Value:   value,
		Rule:    rule,
		Message: message,
	})
}