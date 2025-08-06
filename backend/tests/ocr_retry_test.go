package tests

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"testing"
	"time"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/utils"
)

// TestRetryConfigDefaults tests default retry configuration
func TestRetryConfigDefaults(t *testing.T) {
	config := utils.DefaultRetryConfig()

	if config.MaxRetries != 3 {
		t.Errorf("Expected max retries 3, got %d", config.MaxRetries)
	}

	if config.BaseDelay != time.Second*2 {
		t.Errorf("Expected base delay 2s, got %v", config.BaseDelay)
	}

	if config.MaxDelay != time.Minute*2 {
		t.Errorf("Expected max delay 2m, got %v", config.MaxDelay)
	}

	if config.Multiplier != 2.0 {
		t.Errorf("Expected multiplier 2.0, got %f", config.Multiplier)
	}

	if !config.Jitter {
		t.Errorf("Expected jitter to be enabled")
	}

	// Check that retryable error codes are defined
	expectedRetryableCodes := []models.OCRErrorCode{
		models.OCRErrorServiceTimeout,
		models.OCRErrorServiceUnavailable,
		models.OCRErrorNetworkError,
		models.OCRErrorRateLimitExceeded,
		models.OCRErrorDatabaseConnection,
		models.OCRErrorInternalError,
	}

	if len(config.RetryableErrors) != len(expectedRetryableCodes) {
		t.Errorf("Expected %d retryable error codes, got %d", len(expectedRetryableCodes), len(config.RetryableErrors))
	}

	for _, expectedCode := range expectedRetryableCodes {
		found := false
		for _, actualCode := range config.RetryableErrors {
			if actualCode == expectedCode {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected retryable error code %s not found", expectedCode)
		}
	}
}

// TestRetrySuccessFirstAttempt tests successful execution on first attempt
func TestRetrySuccessFirstAttempt(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	retry := utils.NewOCRRetry(nil, logger)

	ctx := context.Background()
	expectedResult := "success"
	attempts := 0

	result, err := retry.Execute(ctx, "test_operation", func(ctx context.Context, attempt int) (string, error) {
		attempts++
		return expectedResult, nil
	})

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if result != expectedResult {
		t.Errorf("Expected result %s, got %s", expectedResult, result)
	}

	if attempts != 1 {
		t.Errorf("Expected 1 attempt, got %d", attempts)
	}
}

// TestRetrySuccessAfterFailures tests successful execution after retries
func TestRetrySuccessAfterFailures(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	config := &utils.RetryConfig{
		MaxRetries:      3,
		BaseDelay:       time.Millisecond * 10, // Short delay for testing
		MaxDelay:        time.Second,
		Multiplier:      2.0,
		Jitter:          false, // Disable for predictable testing
		RetryableErrors: []models.OCRErrorCode{models.OCRErrorServiceTimeout},
	}
	retry := utils.NewOCRRetry(config, logger)

	ctx := context.Background()
	expectedResult := "success"
	attempts := 0

	result, err := retry.Execute(ctx, "test_operation", func(ctx context.Context, attempt int) (string, error) {
		attempts++
		if attempt < 2 { // Fail first 2 attempts
			return "", models.NewOCRError(
				models.OCRErrorServiceTimeout,
				"Service timeout",
				models.OCRErrorCategoryProvider,
				models.OCRErrorSeverityMedium,
			)
		}
		return expectedResult, nil
	})

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if result != expectedResult {
		t.Errorf("Expected result %s, got %s", expectedResult, result)
	}

	if attempts != 3 {
		t.Errorf("Expected 3 attempts, got %d", attempts)
	}
}

// TestRetryFailureExceedsMaxAttempts tests failure when max attempts exceeded
func TestRetryFailureExceedsMaxAttempts(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	config := &utils.RetryConfig{
		MaxRetries:      2,
		BaseDelay:       time.Millisecond * 10,
		MaxDelay:        time.Second,
		Multiplier:      2.0,
		Jitter:          false,
		RetryableErrors: []models.OCRErrorCode{models.OCRErrorServiceTimeout},
	}
	retry := utils.NewOCRRetry(config, logger)

	ctx := context.Background()
	attempts := 0
	expectedError := models.NewOCRError(
		models.OCRErrorServiceTimeout,
		"Service timeout",
		models.OCRErrorCategoryProvider,
		models.OCRErrorSeverityMedium,
	)

	result, err := retry.Execute(ctx, "test_operation", func(ctx context.Context, attempt int) (string, error) {
		attempts++
		return "", expectedError
	})

	if err == nil {
		t.Errorf("Expected error, got nil")
	}

	if result != "" {
		t.Errorf("Expected empty result, got %s", result)
	}

	if attempts != 3 { // Initial attempt + 2 retries
		t.Errorf("Expected 3 attempts, got %d", attempts)
	}

	// Check that the returned error is the original error
	var ocrErr *models.OCRError
	if !errors.As(err, &ocrErr) {
		t.Errorf("Expected OCR error, got %T", err)
	} else if ocrErr.Code != models.OCRErrorServiceTimeout {
		t.Errorf("Expected error code %s, got %s", models.OCRErrorServiceTimeout, ocrErr.Code)
	}
}

// TestRetryNonRetryableError tests that non-retryable errors are not retried
func TestRetryNonRetryableError(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	config := &utils.RetryConfig{
		MaxRetries:      3,
		BaseDelay:       time.Millisecond * 10,
		MaxDelay:        time.Second,
		Multiplier:      2.0,
		Jitter:          false,
		RetryableErrors: []models.OCRErrorCode{models.OCRErrorServiceTimeout}, // Only timeout is retryable
	}
	retry := utils.NewOCRRetry(config, logger)

	ctx := context.Background()
	attempts := 0
	nonRetryableError := models.NewOCRError(
		models.OCRErrorFileNotFound,
		"File not found",
		models.OCRErrorCategoryUser,
		models.OCRErrorSeverityLow,
	)

	result, err := retry.Execute(ctx, "test_operation", func(ctx context.Context, attempt int) (string, error) {
		attempts++
		return "", nonRetryableError
	})

	if err == nil {
		t.Errorf("Expected error, got nil")
	}

	if result != "" {
		t.Errorf("Expected empty result, got %s", result)
	}

	if attempts != 1 {
		t.Errorf("Expected 1 attempt (no retries), got %d", attempts)
	}
}

// TestRetryContextCancellation tests that retry respects context cancellation
func TestRetryContextCancellation(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	config := &utils.RetryConfig{
		MaxRetries:      5,
		BaseDelay:       time.Millisecond * 100, // Longer delay to allow cancellation
		MaxDelay:        time.Second,
		Multiplier:      2.0,
		Jitter:          false,
		RetryableErrors: []models.OCRErrorCode{models.OCRErrorServiceTimeout},
	}
	retry := utils.NewOCRRetry(config, logger)

	ctx, cancel := context.WithCancel(context.Background())
	attempts := 0

	// Cancel context after short delay
	go func() {
		time.Sleep(time.Millisecond * 50)
		cancel()
	}()

	result, err := retry.Execute(ctx, "test_operation", func(ctx context.Context, attempt int) (string, error) {
		attempts++
		return "", models.NewOCRError(
			models.OCRErrorServiceTimeout,
			"Service timeout",
			models.OCRErrorCategoryProvider,
			models.OCRErrorSeverityMedium,
		)
	})

	if err == nil {
		t.Errorf("Expected error due to context cancellation, got nil")
	}

	if err != context.Canceled {
		t.Errorf("Expected context.Canceled error, got %v", err)
	}

	if result != "" {
		t.Errorf("Expected empty result, got %s", result)
	}

	// Should have attempted at least once but not completed all retries
	if attempts == 0 {
		t.Errorf("Expected at least one attempt")
	}

	if attempts > 2 {
		t.Errorf("Expected context cancellation to stop retries, but got %d attempts", attempts)
	}
}

// TestRetryGenericError tests retry behavior with generic (non-OCR) errors
func TestRetryGenericError(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	config := &utils.RetryConfig{
		MaxRetries:      2,
		BaseDelay:       time.Millisecond * 10,
		MaxDelay:        time.Second,
		Multiplier:      2.0,
		Jitter:          false,
		RetryableErrors: []models.OCRErrorCode{models.OCRErrorServiceTimeout},
	}
	retry := utils.NewOCRRetry(config, logger)

	ctx := context.Background()
	attempts := 0

	// Test with generic retryable error (contains "timeout")
	result, err := retry.Execute(ctx, "test_operation", func(ctx context.Context, attempt int) (string, error) {
		attempts++
		return "", errors.New("connection timeout occurred")
	})

	if err == nil {
		t.Errorf("Expected error, got nil")
	}

	if result != "" {
		t.Errorf("Expected empty result, got %s", result)
	}

	// Should retry generic retryable errors
	if attempts != 3 { // Initial + 2 retries
		t.Errorf("Expected 3 attempts for retryable generic error, got %d", attempts)
	}

	// Test with generic non-retryable error
	attempts = 0
	result, err = retry.Execute(ctx, "test_operation_2", func(ctx context.Context, attempt int) (string, error) {
		attempts++
		return "", errors.New("invalid format")
	})

	if err == nil {
		t.Errorf("Expected error, got nil")
	}

	// Should not retry generic non-retryable errors
	if attempts != 1 {
		t.Errorf("Expected 1 attempt for non-retryable generic error, got %d", attempts)
	}
}

// TestCircuitBreakerBasic tests basic circuit breaker functionality
func TestCircuitBreakerBasic(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	cb := utils.NewCircuitBreaker("test_circuit", 2, time.Millisecond*100, logger)

	ctx := context.Background()

	// Initially should be closed (allowing calls)
	if cb.GetState() != utils.CircuitClosed {
		t.Errorf("Expected circuit to be closed initially")
	}

	// Successful call should keep circuit closed
	err := cb.Execute(ctx, func() error {
		return nil
	})

	if err != nil {
		t.Errorf("Expected no error for successful call, got %v", err)
	}

	if cb.GetState() != utils.CircuitClosed {
		t.Errorf("Expected circuit to remain closed after successful call")
	}
}

// TestCircuitBreakerOpening tests circuit breaker opening after failures
func TestCircuitBreakerOpening(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	maxFailures := 2
	cb := utils.NewCircuitBreaker("test_circuit", maxFailures, time.Millisecond*100, logger)

	ctx := context.Background()

	// Cause enough failures to open the circuit
	for i := 0; i < maxFailures; i++ {
		err := cb.Execute(ctx, func() error {
			return errors.New("test error")
		})
		if err == nil {
			t.Errorf("Expected error from failed function call")
		}
	}

	// Circuit should now be open
	if cb.GetState() != utils.CircuitOpen {
		t.Errorf("Expected circuit to be open after %d failures", maxFailures)
	}

	// Next call should fail immediately with circuit breaker error
	err := cb.Execute(ctx, func() error {
		t.Errorf("Function should not be called when circuit is open")
		return nil
	})

	if err == nil {
		t.Errorf("Expected circuit breaker error when circuit is open")
	}

	var ocrErr *models.OCRError
	if !errors.As(err, &ocrErr) {
		t.Errorf("Expected OCR error from circuit breaker, got %T", err)
	} else if ocrErr.Code != models.OCRErrorServiceUnavailable {
		t.Errorf("Expected service unavailable error, got %s", ocrErr.Code)
	}
}

// TestCircuitBreakerHalfOpen tests circuit breaker half-open state
func TestCircuitBreakerHalfOpen(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	resetTimeout := time.Millisecond * 50
	cb := utils.NewCircuitBreaker("test_circuit", 1, resetTimeout, logger)

	ctx := context.Background()

	// Cause failure to open circuit
	cb.Execute(ctx, func() error {
		return errors.New("test error")
	})

	if cb.GetState() != utils.CircuitOpen {
		t.Errorf("Expected circuit to be open after failure")
	}

	// Wait for reset timeout
	time.Sleep(resetTimeout + time.Millisecond*10)

	// Next call should transition to half-open
	err := cb.Execute(ctx, func() error {
		// Check state during execution
		if cb.GetState() != utils.CircuitHalfOpen {
			t.Errorf("Expected circuit to be half-open during execution")
		}
		return nil
	})

	if err != nil {
		t.Errorf("Expected successful call in half-open state, got %v", err)
	}

	// Circuit should now be closed again
	if cb.GetState() != utils.CircuitClosed {
		t.Errorf("Expected circuit to be closed after successful call in half-open state")
	}
}

// TestRetryableOperation tests the RetryableOperation wrapper
func TestRetryableOperation(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	config := &utils.RetryConfig{
		MaxRetries:      2,
		BaseDelay:       time.Millisecond * 10,
		MaxDelay:        time.Second,
		Multiplier:      2.0,
		Jitter:          false,
		RetryableErrors: []models.OCRErrorCode{models.OCRErrorServiceTimeout},
	}
	retry := utils.NewOCRRetry(config, logger)
	operation := utils.NewRetryableOperation[string](retry, "test_upload")

	ctx := context.Background()
	attempts := 0

	result, err := operation.Execute(ctx, func(ctx context.Context, attempt int) (string, error) {
		attempts++
		if attempt < 1 {
			return "", models.NewOCRError(
				models.OCRErrorServiceTimeout,
				"Service timeout",
				models.OCRErrorCategoryProvider,
				models.OCRErrorSeverityMedium,
			)
		}
		return "success", nil
	})

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if result != "success" {
		t.Errorf("Expected result 'success', got %s", result)
	}

	if attempts != 2 {
		t.Errorf("Expected 2 attempts, got %d", attempts)
	}
}

// BenchmarkRetryExecution benchmarks retry execution performance
func BenchmarkRetryExecution(b *testing.B) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	retry := utils.NewOCRRetry(nil, logger)
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		retry.Execute(ctx, "benchmark_operation", func(ctx context.Context, attempt int) (string, error) {
			return "result", nil
		})
	}
}

// BenchmarkRetryWithFailures benchmarks retry execution with failures
func BenchmarkRetryWithFailures(b *testing.B) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	config := &utils.RetryConfig{
		MaxRetries:      1,
		BaseDelay:       time.Microsecond * 10, // Very short for benchmarking
		MaxDelay:        time.Millisecond,
		Multiplier:      2.0,
		Jitter:          false,
		RetryableErrors: []models.OCRErrorCode{models.OCRErrorServiceTimeout},
	}
	retry := utils.NewOCRRetry(config, logger)
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		retry.Execute(ctx, "benchmark_operation", func(ctx context.Context, attempt int) (string, error) {
			if attempt == 0 {
				return "", models.NewOCRError(
					models.OCRErrorServiceTimeout,
					"Timeout",
					models.OCRErrorCategoryProvider,
					models.OCRErrorSeverityMedium,
				)
			}
			return "result", nil
		})
	}
}