package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"nexus-erp/backend/internal/models"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockOCRService for testing
type MockOCRService struct {
	mock.Mock
}

func (m *MockOCRService) UploadDocument(ctx context.Context, file *multipart.FileHeader, req models.UploadDocumentRequest, userID int64) (*models.OCRDocument, error) {
	args := m.Called(ctx, file, req, userID)
	return args.Get(0).(*models.OCRDocument), args.Error(1)
}

func (m *MockOCRService) GetDocument(ctx context.Context, id int64) (*models.OCRDocumentWithDetails, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.OCRDocumentWithDetails), args.Error(1)
}

func (m *MockOCRService) GetDocuments(ctx context.Context, page, limit int, status models.OCRStatus, documentType models.OCRDocumentType, userID *int64) ([]models.OCRDocumentWithDetails, int, error) {
	args := m.Called(ctx, page, limit, status, documentType, userID)
	return args.Get(0).([]models.OCRDocumentWithDetails), args.Int(1), args.Error(2)
}

func (m *MockOCRService) DeleteDocument(ctx context.Context, id int64, userID int64) error {
	args := m.Called(ctx, id, userID)
	return args.Error(0)
}

func (m *MockOCRService) ProcessDocument(ctx context.Context, req models.ProcessDocumentRequest, userID int64) (*models.OCRResult, error) {
	args := m.Called(ctx, req, userID)
	return args.Get(0).(*models.OCRResult), args.Error(1)
}

func (m *MockOCRService) BatchProcessDocuments(ctx context.Context, req models.BatchProcessRequest, userID int64) error {
	args := m.Called(ctx, req, userID)
	return args.Error(0)
}

func (m *MockOCRService) GetProcessingStatus(ctx context.Context, documentID int64) (*models.OCRDocument, error) {
	args := m.Called(ctx, documentID)
	return args.Get(0).(*models.OCRDocument), args.Error(1)
}

func (m *MockOCRService) VerifyOCRResult(ctx context.Context, req models.VerifyOCRResultRequest, userID int64) error {
	args := m.Called(ctx, req, userID)
	return args.Error(0)
}

func (m *MockOCRService) GetOCRResult(ctx context.Context, documentID int64) (*models.OCRResult, error) {
	args := m.Called(ctx, documentID)
	return args.Get(0).(*models.OCRResult), args.Error(1)
}

func (m *MockOCRService) CreateTemplate(ctx context.Context, req models.CreateTemplateRequest, userID int64) (*models.OCRTemplate, error) {
	args := m.Called(ctx, req, userID)
	return args.Get(0).(*models.OCRTemplate), args.Error(1)
}

func (m *MockOCRService) GetTemplate(ctx context.Context, id int64) (*models.OCRTemplate, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.OCRTemplate), args.Error(1)
}

func (m *MockOCRService) GetTemplates(ctx context.Context, documentType *models.OCRDocumentType, isActive *bool) ([]models.OCRTemplate, error) {
	args := m.Called(ctx, documentType, isActive)
	return args.Get(0).([]models.OCRTemplate), args.Error(1)
}

func (m *MockOCRService) UpdateTemplate(ctx context.Context, id int64, req models.UpdateTemplateRequest, userID int64) (*models.OCRTemplate, error) {
	args := m.Called(ctx, id, req, userID)
	return args.Get(0).(*models.OCRTemplate), args.Error(1)
}

func (m *MockOCRService) DeleteTemplate(ctx context.Context, id int64, userID int64) error {
	args := m.Called(ctx, id, userID)
	return args.Error(0)
}

func (m *MockOCRService) GetOCRStats(ctx context.Context, userID *int64, dateFrom, dateTo *time.Time) (*models.OCRStats, error) {
	args := m.Called(ctx, userID, dateFrom, dateTo)
	return args.Get(0).(*models.OCRStats), args.Error(1)
}

func TestOCRHandler_UploadInvoice(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		fileName       string
		fileContent    string
		contentType    string
		fileSize       int64
		userID         int64
		expectedStatus int
		expectedError  string
		setupMock      func(*MockOCRService)
	}{
		{
			name:           "Valid PDF upload",
			fileName:       "test-invoice.pdf",
			fileContent:    "%PDF-1.4 test content",
			contentType:    "application/pdf",
			fileSize:       1024,
			userID:         1,
			expectedStatus: http.StatusCreated,
			setupMock: func(mockService *MockOCRService) {
				expectedDoc := &models.OCRDocument{
					ID:              1,
					FileName:        "test-invoice.pdf",
					FileSize:        1024,
					FileType:        "application/pdf",
					FilePath:        "uploads/ocr/invoice/test-uuid.pdf",
					DocumentType:    models.OCRDocumentTypeInvoice,
					Status:          models.OCRStatusPending,
					Progress:        0,
					CreatedByUserID: 1,
					CreatedAt:       time.Now(),
					UpdatedAt:       time.Now(),
				}
				mockService.On("UploadDocument", mock.Anything, mock.Anything, mock.MatchedBy(func(req models.UploadDocumentRequest) bool {
					return req.DocumentType == models.OCRDocumentTypeInvoice
				}), int64(1)).Return(expectedDoc, nil)
			},
		},
		{
			name:           "Valid JPEG upload",
			fileName:       "test-invoice.jpg",
			fileContent:    "\xFF\xD8\xFF test jpeg content",
			contentType:    "image/jpeg",
			fileSize:       2048,
			userID:         1,
			expectedStatus: http.StatusCreated,
			setupMock: func(mockService *MockOCRService) {
				expectedDoc := &models.OCRDocument{
					ID:              2,
					FileName:        "test-invoice.jpg",
					FileSize:        2048,
					FileType:        "image/jpeg",
					FilePath:        "uploads/ocr/invoice/test-uuid.jpg",
					DocumentType:    models.OCRDocumentTypeInvoice,
					Status:          models.OCRStatusPending,
					Progress:        0,
					CreatedByUserID: 1,
					CreatedAt:       time.Now(),
					UpdatedAt:       time.Now(),
				}
				mockService.On("UploadDocument", mock.Anything, mock.Anything, mock.MatchedBy(func(req models.UploadDocumentRequest) bool {
					return req.DocumentType == models.OCRDocumentTypeInvoice
				}), int64(1)).Return(expectedDoc, nil)
			},
		},
		{
			name:           "Invalid file type",
			fileName:       "test-invoice.txt",
			fileContent:    "text file content",
			contentType:    "text/plain",
			fileSize:       100,
			userID:         1,
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Unsupported file type",
			setupMock:      func(mockService *MockOCRService) {},
		},
		{
			name:           "File too large",
			fileName:       "large-invoice.pdf",
			fileContent:    strings.Repeat("x", 11*1024*1024), // 11MB
			contentType:    "application/pdf",
			fileSize:       11 * 1024 * 1024,
			userID:         1,
			expectedStatus: http.StatusBadRequest,
			expectedError:  "File size exceeds maximum limit",
			setupMock:      func(mockService *MockOCRService) {},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockService := new(MockOCRService)
			tt.setupMock(mockService)
			
			handler := NewOCRHandler(mockService)

			// Create multipart form
			var buf bytes.Buffer
			writer := multipart.NewWriter(&buf)
			
			part, err := writer.CreateFormFile("file", tt.fileName)
			assert.NoError(t, err)
			
			_, err = io.Copy(part, strings.NewReader(tt.fileContent))
			assert.NoError(t, err)
			
			writer.Close()

			// Create request
			req := httptest.NewRequest("POST", "/api/invoices/upload", &buf)
			req.Header.Set("Content-Type", writer.FormDataContentType())
			
			// Create response recorder
			w := httptest.NewRecorder()
			
			// Create Gin context with user_id
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Set("user_id", tt.userID)

			// Call handler
			handler.UploadInvoice(c)

			// Assert response
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedError != "" {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Contains(t, response["error"], tt.expectedError)
			} else {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, "Invoice uploaded successfully", response["message"])
				assert.NotNil(t, response["document"])
			}

			mockService.AssertExpectations(t)
		})
	}
}

func TestOCRHandler_UploadInvoice_NoAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockService := new(MockOCRService)
	handler := NewOCRHandler(mockService)

	// Create multipart form
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	part, _ := writer.CreateFormFile("file", "test.pdf")
	io.Copy(part, strings.NewReader("%PDF test"))
	writer.Close()

	// Create request without user_id in context
	req := httptest.NewRequest("POST", "/api/invoices/upload", &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	// Don't set user_id in context

	handler.UploadInvoice(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "User not authenticated", response["error"])
}

func TestOCRHandler_UploadInvoice_NoFile(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockService := new(MockOCRService)
	handler := NewOCRHandler(mockService)

	// Create empty multipart form
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	writer.Close()

	req := httptest.NewRequest("POST", "/api/invoices/upload", &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("user_id", int64(1))

	handler.UploadInvoice(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "No file uploaded", response["error"])
}