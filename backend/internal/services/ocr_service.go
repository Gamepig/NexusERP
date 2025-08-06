package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"nexus-erp/backend/internal/models"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// OCRService interface defines the operations for OCR functionality
type OCRService interface {
	// Document operations
	UploadDocument(ctx context.Context, file *multipart.FileHeader, req models.UploadDocumentRequest, userID int64) (*models.OCRDocument, error)
	GetDocument(ctx context.Context, id int64) (*models.OCRDocumentWithDetails, error)
	GetDocuments(ctx context.Context, page, limit int, status models.OCRStatus, documentType models.OCRDocumentType, userID *int64) ([]models.OCRDocumentWithDetails, int, error)
	DeleteDocument(ctx context.Context, id int64, userID int64) error
	
	// Processing operations
	ProcessDocument(ctx context.Context, req models.ProcessDocumentRequest, userID int64) (*models.OCRResult, error)
	BatchProcessDocuments(ctx context.Context, req models.BatchProcessRequest, userID int64) error
	GetProcessingStatus(ctx context.Context, documentID int64) (*models.OCRDocument, error)
	
	// Verification operations
	VerifyOCRResult(ctx context.Context, req models.VerifyOCRResultRequest, userID int64) error
	GetOCRResult(ctx context.Context, documentID int64) (*models.OCRResult, error)
	
	// Template operations
	CreateTemplate(ctx context.Context, req models.CreateTemplateRequest, userID int64) (*models.OCRTemplate, error)
	GetTemplate(ctx context.Context, id int64) (*models.OCRTemplate, error)
	GetTemplates(ctx context.Context, documentType *models.OCRDocumentType, isActive *bool) ([]models.OCRTemplate, error)
	UpdateTemplate(ctx context.Context, id int64, req models.UpdateTemplateRequest, userID int64) (*models.OCRTemplate, error)
	DeleteTemplate(ctx context.Context, id int64, userID int64) error
	
	// Statistics
	GetOCRStats(ctx context.Context, userID *int64, dateFrom, dateTo *time.Time) (*models.OCRStats, error)
	
	// Invoice data parsing operations
	ParseInvoiceData(ctx context.Context, documentID int64) (*ParsedInvoiceData, *ValidationResult, error)
	ValidateInvoiceData(ctx context.Context, data *ParsedInvoiceData) (*ValidationResult, error)
}

type ocrService struct {
	db           *sqlx.DB
	ocrClient    OCRClient
	dataParser   InvoiceDataParser
}

// NewOCRService creates a new OCR service instance
func NewOCRService(db *sqlx.DB) OCRService {
	// Use mock client for development - this will be updated in main.go to use real client
	mockClient := NewMockOCRClient()
	return &ocrService{
		db:         db,
		ocrClient:  mockClient,
		dataParser: NewInvoiceDataParser(),
	}
}

// NewOCRServiceWithClient creates a new OCR service instance with a specific OCR client
func NewOCRServiceWithClient(db *sqlx.DB, ocrClient OCRClient) OCRService {
	return &ocrService{
		db:         db,
		ocrClient:  ocrClient,
		dataParser: NewInvoiceDataParser(),
	}
}

// UploadDocument handles document upload for OCR processing
func (s *ocrService) UploadDocument(ctx context.Context, file *multipart.FileHeader, req models.UploadDocumentRequest, userID int64) (*models.OCRDocument, error) {
	// 1. Save file to local storage
	filePath, err := s.saveUploadedFile(file, req.DocumentType)
	if err != nil {
		return nil, fmt.Errorf("failed to save file: %w", err)
	}
	
	// 2. Create database record
	query := `
		INSERT INTO ocr_documents (file_name, file_size, file_type, file_path, document_type, status, progress, created_by_user_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	
	var doc models.OCRDocument
	err = s.db.QueryRowContext(ctx, query,
		file.Filename,
		file.Size,
		file.Header.Get("Content-Type"),
		filePath,
		req.DocumentType,
		models.OCRStatusPending,
		0,
		userID,
	).Scan(&doc.ID, &doc.CreatedAt, &doc.UpdatedAt)
	
	if err != nil {
		// Clean up file if database insertion failed
		os.Remove(filePath)
		return nil, fmt.Errorf("failed to create document record: %w", err)
	}
	
	// Populate the returned document
	doc.FileName = file.Filename
	doc.FileSize = file.Size
	doc.FileType = file.Header.Get("Content-Type")
	doc.FilePath = filePath
	doc.DocumentType = req.DocumentType
	doc.Status = models.OCRStatusPending
	doc.Progress = 0
	doc.CreatedByUserID = userID
	
	return &doc, nil
}

// GetDocument retrieves a document with its details
func (s *ocrService) GetDocument(ctx context.Context, id int64) (*models.OCRDocumentWithDetails, error) {
	query := `
		SELECT 
			d.id, d.file_name, d.file_size, d.file_type, d.file_path, d.document_type, 
			d.status, d.progress, d.created_by_user_id, d.created_at, d.updated_at,
			u.username, u.email,
			r.id as result_id, r.raw_text, r.structured_data, r.confidence, r.language, 
			r.processing_time, r.error_message, r.created_at as result_created_at
		FROM ocr_documents d
		LEFT JOIN users u ON d.created_by_user_id = u.id
		LEFT JOIN ocr_results r ON d.id = r.document_id
		WHERE d.id = $1
	`
	
	var doc models.OCRDocumentWithDetails
	var user models.User
	var result models.OCRResult
	var resultID sql.NullInt64
	var rawText, language, errorMessage sql.NullString
	var structuredData []byte
	var confidence sql.NullFloat64
	var processingTime sql.NullInt64
	var resultCreatedAt sql.NullTime
	
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&doc.ID, &doc.FileName, &doc.FileSize, &doc.FileType, &doc.FilePath, 
		&doc.DocumentType, &doc.Status, &doc.Progress, &doc.CreatedByUserID, 
		&doc.CreatedAt, &doc.UpdatedAt,
		&user.Username, &user.Email,
		&resultID, &rawText, &structuredData, &confidence, &language,
		&processingTime, &errorMessage, &resultCreatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("document not found")
		}
		return nil, fmt.Errorf("failed to get document: %w", err)
	}
	
	// Set user info
	user.ID = doc.CreatedByUserID
	doc.CreatedByUser = &user
	
	// Set result info if exists
	if resultID.Valid {
		result.ID = resultID.Int64
		result.DocumentID = doc.ID
		result.RawText = rawText.String
		if structuredData != nil {
		result.StructuredData = (*json.RawMessage)(&structuredData)
	}
		result.Confidence = confidence.Float64
		result.Language = language.String
		result.ProcessingTime = processingTime.Int64
		if errorMessage.Valid {
			result.ErrorMessage = &errorMessage.String
		}
		if resultCreatedAt.Valid {
			result.CreatedAt = resultCreatedAt.Time
		}
		doc.Result = &result
	}
	
	return &doc, nil
}

// GetDocuments retrieves documents with pagination and filtering
func (s *ocrService) GetDocuments(ctx context.Context, page, limit int, status models.OCRStatus, documentType models.OCRDocumentType, userID *int64) ([]models.OCRDocumentWithDetails, int, error) {
	offset := (page - 1) * limit
	
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1
	
	if status != "" {
		whereClause += fmt.Sprintf(" AND d.status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}
	
	if documentType != "" {
		whereClause += fmt.Sprintf(" AND d.document_type = $%d", argIndex)
		args = append(args, documentType)
		argIndex++
	}
	
	if userID != nil {
		whereClause += fmt.Sprintf(" AND d.created_by_user_id = $%d", argIndex)
		args = append(args, *userID)
		argIndex++
	}
	
	// Count query
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM ocr_documents d %s", whereClause)
	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count documents: %w", err)
	}
	
	// Main query
	query := fmt.Sprintf(`
		SELECT 
			d.id, d.file_name, d.file_size, d.file_type, d.file_path, d.document_type, 
			d.status, d.progress, d.created_by_user_id, d.created_at, d.updated_at,
			u.username, u.email
		FROM ocr_documents d
		LEFT JOIN users u ON d.created_by_user_id = u.id
		%s
		ORDER BY d.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)
	
	args = append(args, limit, offset)
	
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query documents: %w", err)
	}
	defer rows.Close()
	
	var documents []models.OCRDocumentWithDetails
	for rows.Next() {
		var doc models.OCRDocumentWithDetails
		var user models.User
		
		err := rows.Scan(
			&doc.ID, &doc.FileName, &doc.FileSize, &doc.FileType, &doc.FilePath,
			&doc.DocumentType, &doc.Status, &doc.Progress, &doc.CreatedByUserID,
			&doc.CreatedAt, &doc.UpdatedAt,
			&user.Username, &user.Email,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan document: %w", err)
		}
		
		user.ID = doc.CreatedByUserID
		doc.CreatedByUser = &user
		documents = append(documents, doc)
	}
	
	return documents, total, nil
}

// DeleteDocument removes a document and its associated data
func (s *ocrService) DeleteDocument(ctx context.Context, id int64, userID int64) error {
	// TODO: Also delete the physical file
	query := `DELETE FROM ocr_documents WHERE id = $1 AND created_by_user_id = $2`
	
	result, err := s.db.ExecContext(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete document: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("document not found or permission denied")
	}
	
	return nil
}

// ProcessDocument initiates OCR processing for a document
func (s *ocrService) ProcessDocument(ctx context.Context, req models.ProcessDocumentRequest, userID int64) (*models.OCRResult, error) {
	// 1. Validate document exists and is owned by user
	document, err := s.getDocumentForProcessing(ctx, req.DocumentID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get document: %w", err)
	}
	
	// 2. Update status to processing
	err = s.updateDocumentStatus(ctx, req.DocumentID, models.OCRStatusProcessing, 10)
	if err != nil {
		return nil, fmt.Errorf("failed to update document status: %w", err)
	}
	
	// 3. Call OCR service
	ocrResponse, err := s.ocrClient.ProcessDocument(ctx, document.FilePath)
	if err != nil {
		// Update status to failed
		s.updateDocumentStatus(ctx, req.DocumentID, models.OCRStatusFailed, 0)
		return nil, fmt.Errorf("OCR processing failed: %w", err)
	}
	
	// 4. Save results to database
	result, err := s.saveOCRResult(ctx, req.DocumentID, ocrResponse)
	if err != nil {
		// Update status to failed
		s.updateDocumentStatus(ctx, req.DocumentID, models.OCRStatusFailed, 0)
		return nil, fmt.Errorf("failed to save OCR result: %w", err)
	}
	
	// 5. Update status to completed
	err = s.updateDocumentStatus(ctx, req.DocumentID, models.OCRStatusCompleted, 100)
	if err != nil {
		return nil, fmt.Errorf("failed to update completion status: %w", err)
	}
	
	return result, nil
}

// BatchProcessDocuments processes multiple documents
func (s *ocrService) BatchProcessDocuments(ctx context.Context, req models.BatchProcessRequest, userID int64) error {
	// TODO: Implement batch processing
	// This could use background jobs/workers for processing
	return fmt.Errorf("batch processing not implemented yet")
}

// GetProcessingStatus retrieves the current processing status of a document
func (s *ocrService) GetProcessingStatus(ctx context.Context, documentID int64) (*models.OCRDocument, error) {
	query := `SELECT id, status, progress, updated_at FROM ocr_documents WHERE id = $1`
	
	var doc models.OCRDocument
	err := s.db.QueryRowContext(ctx, query, documentID).Scan(
		&doc.ID, &doc.Status, &doc.Progress, &doc.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("document not found")
		}
		return nil, fmt.Errorf("failed to get processing status: %w", err)
	}
	
	return &doc, nil
}

// VerifyOCRResult allows manual verification and correction of OCR results
func (s *ocrService) VerifyOCRResult(ctx context.Context, req models.VerifyOCRResultRequest, userID int64) error {
	// TODO: Implement verification logic
	// 1. Update the structured data with verified data
	// 2. Mark as verified
	// 3. Log verification activity
	return fmt.Errorf("verification not implemented yet")
}

// GetOCRResult retrieves the OCR result for a document
func (s *ocrService) GetOCRResult(ctx context.Context, documentID int64) (*models.OCRResult, error) {
	query := `
		SELECT id, document_id, raw_text, structured_data, confidence, language, 
		       processing_time, error_message, created_at, updated_at
		FROM ocr_results 
		WHERE document_id = $1
	`
	
	var result models.OCRResult
	var structuredData []byte
	var errorMessage sql.NullString
	
	err := s.db.QueryRowContext(ctx, query, documentID).Scan(
		&result.ID, &result.DocumentID, &result.RawText, &structuredData,
		&result.Confidence, &result.Language, &result.ProcessingTime,
		&errorMessage, &result.CreatedAt, &result.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("OCR result not found")
		}
		return nil, fmt.Errorf("failed to get OCR result: %w", err)
	}
	
	if structuredData != nil {
		result.StructuredData = (*json.RawMessage)(&structuredData)
	}
	if errorMessage.Valid {
		result.ErrorMessage = &errorMessage.String
	}
	
	return &result, nil
}

// Template-related methods would be implemented here...
// For brevity, I'll implement the essential template methods

// CreateTemplate creates a new OCR template
func (s *ocrService) CreateTemplate(ctx context.Context, req models.CreateTemplateRequest, userID int64) (*models.OCRTemplate, error) {
	// TODO: Implement template creation
	return nil, fmt.Errorf("template creation not implemented yet")
}

// GetTemplate retrieves an OCR template by ID
func (s *ocrService) GetTemplate(ctx context.Context, id int64) (*models.OCRTemplate, error) {
	// TODO: Implement template retrieval
	return nil, fmt.Errorf("template retrieval not implemented yet")
}

// GetTemplates retrieves all templates with optional filtering
func (s *ocrService) GetTemplates(ctx context.Context, documentType *models.OCRDocumentType, isActive *bool) ([]models.OCRTemplate, error) {
	// TODO: Implement template listing
	return nil, fmt.Errorf("template listing not implemented yet")
}

// UpdateTemplate updates an existing template
func (s *ocrService) UpdateTemplate(ctx context.Context, id int64, req models.UpdateTemplateRequest, userID int64) (*models.OCRTemplate, error) {
	// TODO: Implement template update
	return nil, fmt.Errorf("template update not implemented yet")
}

// DeleteTemplate removes a template
func (s *ocrService) DeleteTemplate(ctx context.Context, id int64, userID int64) error {
	// TODO: Implement template deletion
	return fmt.Errorf("template deletion not implemented yet")
}

// GetOCRStats retrieves OCR processing statistics
func (s *ocrService) GetOCRStats(ctx context.Context, userID *int64, dateFrom, dateTo *time.Time) (*models.OCRStats, error) {
	// TODO: Implement statistics calculation
	return &models.OCRStats{
		TotalDocuments:        0,
		ProcessedDocuments:    0,
		PendingDocuments:      0,
		FailedDocuments:       0,
		AverageConfidence:     0.0,
		AverageProcessingTime: 0.0,
	}, nil
}

// saveUploadedFile saves the uploaded file to local storage
func (s *ocrService) saveUploadedFile(file *multipart.FileHeader, documentType models.OCRDocumentType) (string, error) {
	// Create upload directory if it doesn't exist
	uploadDir := filepath.Join("uploads", "ocr", string(documentType))
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}
	
	// Generate unique filename to avoid conflicts
	fileUUID := uuid.New().String()
	fileExt := filepath.Ext(file.Filename)
	fileName := fmt.Sprintf("%s%s", fileUUID, fileExt)
	filePath := filepath.Join(uploadDir, fileName)
	
	// Open uploaded file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer src.Close()
	
	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dst.Close()
	
	// Copy file contents
	if _, err := io.Copy(dst, src); err != nil {
		os.Remove(filePath) // Clean up on error
		return "", fmt.Errorf("failed to copy file: %w", err)
	}
	
	return filePath, nil
}

// getDocumentForProcessing retrieves a document for OCR processing
func (s *ocrService) getDocumentForProcessing(ctx context.Context, documentID int64, userID int64) (*models.OCRDocument, error) {
	query := `
		SELECT id, file_name, file_size, file_type, file_path, document_type, status, progress, created_by_user_id
		FROM ocr_documents 
		WHERE id = $1 AND created_by_user_id = $2
	`
	
	var doc models.OCRDocument
	err := s.db.QueryRowContext(ctx, query, documentID, userID).Scan(
		&doc.ID, &doc.FileName, &doc.FileSize, &doc.FileType, &doc.FilePath,
		&doc.DocumentType, &doc.Status, &doc.Progress, &doc.CreatedByUserID,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("document not found or access denied")
		}
		return nil, fmt.Errorf("failed to query document: %w", err)
	}
	
	// Check if document is in a valid state for processing
	if doc.Status == models.OCRStatusProcessing {
		return nil, fmt.Errorf("document is already being processed")
	}
	
	if doc.Status == models.OCRStatusCompleted {
		return nil, fmt.Errorf("document has already been processed")
	}
	
	return &doc, nil
}

// updateDocumentStatus updates the processing status and progress of a document
func (s *ocrService) updateDocumentStatus(ctx context.Context, documentID int64, status models.OCRStatus, progress int) error {
	query := `
		UPDATE ocr_documents 
		SET status = $1, progress = $2, updated_at = NOW()
		WHERE id = $3
	`
	
	_, err := s.db.ExecContext(ctx, query, status, progress, documentID)
	if err != nil {
		return fmt.Errorf("failed to update document status: %w", err)
	}
	
	return nil
}

// saveOCRResult saves OCR processing results to the database
func (s *ocrService) saveOCRResult(ctx context.Context, documentID int64, ocrResponse *OCRResponse) (*models.OCRResult, error) {
	query := `
		INSERT INTO ocr_results (document_id, raw_text, structured_data, confidence, language, processing_time, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	
	var result models.OCRResult
	var structuredDataBytes []byte
	
	// Convert structured data to JSONB
	if ocrResponse.StructuredData != nil {
		structuredDataBytes = []byte(*ocrResponse.StructuredData)
	}
	
	err := s.db.QueryRowContext(ctx, query,
		documentID,
		ocrResponse.RawText,
		structuredDataBytes,
		ocrResponse.Confidence,
		ocrResponse.Language,
		ocrResponse.ProcessingTime,
	).Scan(&result.ID, &result.CreatedAt, &result.UpdatedAt)
	
	if err != nil {
		return nil, fmt.Errorf("failed to save OCR result: %w", err)
	}
	
	// Populate the result object
	result.DocumentID = documentID
	result.RawText = ocrResponse.RawText
	if structuredDataBytes != nil {
		structuredData := json.RawMessage(structuredDataBytes)
		result.StructuredData = &structuredData
	}
	result.Confidence = ocrResponse.Confidence
	result.Language = ocrResponse.Language
	result.ProcessingTime = ocrResponse.ProcessingTime
	
	return &result, nil
}

// ParseInvoiceData parses OCR result data for an invoice document and validates it
func (s *ocrService) ParseInvoiceData(ctx context.Context, documentID int64) (*ParsedInvoiceData, *ValidationResult, error) {
	// 1. Get the OCR result for the document
	ocrResult, err := s.GetOCRResult(ctx, documentID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get OCR result: %w", err)
	}
	
	// 2. Check if the document is an invoice type
	document, err := s.GetDocument(ctx, documentID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get document: %w", err)
	}
	
	if document.DocumentType != models.OCRDocumentTypeInvoice {
		return nil, nil, fmt.Errorf("document type is not invoice: %s", document.DocumentType)
	}
	
	// 3. Convert OCR result to OCR response format for parsing
	ocrResponse := &OCRResponse{
		RawText:        ocrResult.RawText,
		Confidence:     ocrResult.Confidence,
		Language:       ocrResult.Language,
		ProcessingTime: ocrResult.ProcessingTime,
		StructuredData: ocrResult.StructuredData,
	}
	
	if ocrResult.ErrorMessage != nil {
		ocrResponse.ErrorMessage = *ocrResult.ErrorMessage
	}
	
	// 4. Parse and validate the data using the invoice data parser
	parsedData, validationResult, err := s.dataParser.ParseAndValidate(ctx, ocrResponse)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse and validate invoice data: %w", err)
	}
	
	return parsedData, validationResult, nil
}

// ValidateInvoiceData validates parsed invoice data using the data parser
func (s *ocrService) ValidateInvoiceData(ctx context.Context, data *ParsedInvoiceData) (*ValidationResult, error) {
	return s.dataParser.ValidateInvoiceData(ctx, data)
}