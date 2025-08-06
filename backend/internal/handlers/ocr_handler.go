package handlers

import (
	"net/http"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type OCRHandler struct {
	ocrService services.OCRService
}

func NewOCRHandler(ocrService services.OCRService) *OCRHandler {
	return &OCRHandler{
		ocrService: ocrService,
	}
}

// UploadInvoice handles POST /api/invoices/upload - specifically for invoice documents
func (h *OCRHandler) UploadInvoice(c *gin.Context) {
	// Get user ID from context (set by authentication middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Validate file size (max 10MB)
	const maxFileSize = 10 * 1024 * 1024
	if file.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds maximum limit (10MB)"})
		return
	}

	// Validate file type for invoice documents
	allowedTypes := map[string]bool{
		"image/jpeg":      true,
		"image/png":       true,
		"application/pdf": true,
	}

	contentType := file.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported file type. Only JPEG, PNG, and PDF files are allowed for invoices"})
		return
	}

	// Create request with invoice document type
	req := models.UploadDocumentRequest{
		DocumentType: models.OCRDocumentTypeInvoice,
		TemplateID:   nil, // Will use default invoice template
	}

	document, err := h.ocrService.UploadDocument(c.Request.Context(), file, req, userIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Invoice uploaded successfully",
		"document": document,
	})
}

// UploadDocument handles POST /api/ocr/upload
func (h *OCRHandler) UploadDocument(c *gin.Context) {
	// Get user ID from context (set by authentication middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Parse form data
	var req models.UploadDocumentRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Validate file size (max 10MB)
	const maxFileSize = 10 * 1024 * 1024
	if file.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds maximum limit (10MB)"})
		return
	}

	// Validate file type
	allowedTypes := map[string]bool{
		"image/jpeg":      true,
		"image/png":       true,
		"image/gif":       true,
		"image/bmp":       true,
		"image/tiff":      true,
		"application/pdf": true,
	}

	contentType := file.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported file type"})
		return
	}

	document, err := h.ocrService.UploadDocument(c.Request.Context(), file, req, userIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, document)
}

// GetDocument handles GET /api/ocr/documents/:id
func (h *OCRHandler) GetDocument(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	document, err := h.ocrService.GetDocument(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, document)
}

// GetDocuments handles GET /api/ocr/documents
func (h *OCRHandler) GetDocuments(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	status := models.OCRStatus(c.Query("status"))
	documentType := models.OCRDocumentType(c.Query("document_type"))
	
	var userID *int64
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		if id, err := strconv.ParseInt(userIDStr, 10, 64); err == nil {
			userID = &id
		}
	}

	documents, total, err := h.ocrService.GetDocuments(c.Request.Context(), page, limit, status, documentType, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"documents": documents,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + limit - 1) / limit,
		},
	})
}

// DeleteDocument handles DELETE /api/ocr/documents/:id
func (h *OCRHandler) DeleteDocument(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	err = h.ocrService.DeleteDocument(c.Request.Context(), id, userIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Document deleted successfully"})
}

// ProcessDocument handles POST /api/ocr/process
func (h *OCRHandler) ProcessDocument(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.ProcessDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.ocrService.ProcessDocument(c.Request.Context(), req, userIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// BatchProcessDocuments handles POST /api/ocr/batch-process
func (h *OCRHandler) BatchProcessDocuments(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.BatchProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.ocrService.BatchProcessDocuments(c.Request.Context(), req, userIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Batch processing initiated"})
}

// GetProcessingStatus handles GET /api/ocr/documents/:id/status
func (h *OCRHandler) GetProcessingStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	status, err := h.ocrService.GetProcessingStatus(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"document_id": status.ID,
		"status":      status.Status,
		"progress":    status.Progress,
		"updated_at":  status.UpdatedAt,
	})
}

// VerifyOCRResult handles POST /api/ocr/verify
func (h *OCRHandler) VerifyOCRResult(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.VerifyOCRResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.ocrService.VerifyOCRResult(c.Request.Context(), req, userIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OCR result verified successfully"})
}

// GetOCRResult handles GET /api/ocr/documents/:id/result
func (h *OCRHandler) GetOCRResult(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	result, err := h.ocrService.GetOCRResult(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetOCRStats handles GET /api/ocr/stats
func (h *OCRHandler) GetOCRStats(c *gin.Context) {
	var userID *int64
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		if id, err := strconv.ParseInt(userIDStr, 10, 64); err == nil {
			userID = &id
		}
	}

	// TODO: Parse date parameters for date filtering
	stats, err := h.ocrService.GetOCRStats(c.Request.Context(), userID, nil, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Template-related handlers

// CreateTemplate handles POST /api/ocr/templates
func (h *OCRHandler) CreateTemplate(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.CreateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	template, err := h.ocrService.CreateTemplate(c.Request.Context(), req, userIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, template)
}

// GetTemplate handles GET /api/ocr/templates/:id
func (h *OCRHandler) GetTemplate(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	template, err := h.ocrService.GetTemplate(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, template)
}

// GetTemplates handles GET /api/ocr/templates
func (h *OCRHandler) GetTemplates(c *gin.Context) {
	var documentType *models.OCRDocumentType
	if dt := c.Query("document_type"); dt != "" {
		docType := models.OCRDocumentType(dt)
		documentType = &docType
	}

	var isActive *bool
	if ia := c.Query("is_active"); ia != "" {
		if active, err := strconv.ParseBool(ia); err == nil {
			isActive = &active
		}
	}

	templates, err := h.ocrService.GetTemplates(c.Request.Context(), documentType, isActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"templates": templates})
}

// UpdateTemplate handles PUT /api/ocr/templates/:id
func (h *OCRHandler) UpdateTemplate(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	var req models.UpdateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	template, err := h.ocrService.UpdateTemplate(c.Request.Context(), id, req, userIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, template)
}

// DeleteTemplate handles DELETE /api/ocr/templates/:id
func (h *OCRHandler) DeleteTemplate(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDInt, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	err = h.ocrService.DeleteTemplate(c.Request.Context(), id, userIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Template deleted successfully"})
}

// ParseInvoiceData handles POST /api/ocr/documents/:id/parse-invoice - parse and validate invoice data
func (h *OCRHandler) ParseInvoiceData(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	// Parse and validate the invoice data
	parsedData, validationResult, err := h.ocrService.ParseInvoiceData(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return both parsed data and validation results
	response := gin.H{
		"parsed_data":       parsedData,
		"validation_result": validationResult,
		"is_valid":          validationResult.IsValid,
	}

	c.JSON(http.StatusOK, response)
}

// ValidateInvoiceData handles POST /api/ocr/validate-invoice - validate parsed invoice data
func (h *OCRHandler) ValidateInvoiceData(c *gin.Context) {
	var parsedData services.ParsedInvoiceData
	if err := c.ShouldBindJSON(&parsedData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate the invoice data
	validationResult, err := h.ocrService.ValidateInvoiceData(c.Request.Context(), &parsedData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, validationResult)
}