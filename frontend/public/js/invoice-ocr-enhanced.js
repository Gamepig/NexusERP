/**
 * Enhanced Invoice OCR Handler with Comprehensive Error Handling
 * Provides robust error handling, retry mechanisms, and manual fallback options
 */

class EnhancedInvoiceOCR {
    constructor() {
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
            retryAttempts: 3,
            retryDelay: 2000,
            confidenceThresholds: {
                high: 0.8,
                medium: 0.6,
                low: 0.0
            },
            pollInterval: 2000,
            maxPollTime: 300000 // 5 minutes
        };

        this.state = {
            currentFile: null,
            documentId: null,
            processingState: 'idle', // idle, uploading, processing, completed, error
            retryCount: 0,
            ocrResults: null,
            isEditing: false,
            requestId: null
        };

        this.errorHandler = new OCRErrorHandler();
        this.initialize();
    }

    initialize() {
        this.bindEvents();
        this.checkSystemHealth();
        this.setupFormValidation();
        
        // Check for existing session data
        this.restoreSession();

        console.log('Enhanced Invoice OCR initialized');
    }

    bindEvents() {
        // File upload events
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        uploadArea?.addEventListener('click', () => this.openFileDialog());
        uploadArea?.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea?.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea?.addEventListener('drop', (e) => this.handleDrop(e));

        fileInput?.addEventListener('change', (e) => this.handleFileSelect(e));

        // Error handling events
        document.getElementById('retry-upload')?.addEventListener('click', () => this.retryUpload());
        document.getElementById('manual-entry-btn')?.addEventListener('click', () => this.switchToManualEntry());
        document.getElementById('show-error-details')?.addEventListener('click', () => this.toggleErrorDetails());

        // Confidence warning events
        document.getElementById('proceed-review')?.addEventListener('click', () => this.proceedWithReview());
        document.getElementById('restart-manual')?.addEventListener('click', () => this.switchToManualEntry());

        // Form events
        document.getElementById('edit-btn')?.addEventListener('click', () => this.enableEditing());
        document.getElementById('save-btn')?.addEventListener('click', () => this.saveChanges());
        document.getElementById('cancel-btn')?.addEventListener('click', () => this.cancelEditing());
        document.getElementById('process-another')?.addEventListener('click', () => this.resetForm());

        // Form submission
        document.getElementById('invoice-form')?.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Health status refresh
        setInterval(() => this.checkSystemHealth(), 30000); // Check every 30 seconds
    }

    // === FILE HANDLING ===

    openFileDialog() {
        document.getElementById('file-input')?.click();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        this.state.currentFile = file;
        this.state.requestId = this.generateRequestId();

        // Clear previous errors
        this.hideElement('validation-errors');
        this.hideElement('ocr-error-section');
        this.hideElement('confidence-warning');

        // Validate file
        const validationResult = this.validateFile(file);
        if (!validationResult.isValid) {
            this.showValidationErrors(validationResult.errors);
            return;
        }

        // Start upload
        this.uploadFile(file);
    }

    validateFile(file) {
        const errors = [];

        // Check file size
        if (file.size > this.config.maxFileSize) {
            errors.push({
                type: 'FILE_TOO_BIG',
                message: `File size (${this.formatFileSize(file.size)}) exceeds maximum limit (${this.formatFileSize(this.config.maxFileSize)})`,
                suggestion: 'compress_file'
            });
        }

        // Check file type
        if (!this.config.allowedTypes.includes(file.type)) {
            errors.push({
                type: 'UNSUPPORTED_FORMAT',
                message: `File type (${file.type}) is not supported`,
                suggestion: 'convert_format'
            });
        }

        // Check file name
        if (!file.name || file.name.trim() === '') {
            errors.push({
                type: 'INVALID_FILENAME',
                message: 'File must have a valid name',
                suggestion: 'rename_file'
            });
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    showValidationErrors(errors) {
        const container = document.getElementById('validation-errors');
        const list = document.getElementById('validation-errors-list');
        
        if (!container || !list) return;

        list.innerHTML = '';
        errors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error.message;
            list.appendChild(li);
        });

        this.showElement(container);
        this.setUploadState('error');
    }

    // === UPLOAD HANDLING ===

    async uploadFile(file) {
        this.setUploadState('uploading');
        this.state.retryCount = 0;

        try {
            const result = await this.performUpload(file);
            this.state.documentId = result.document.id;
            this.startOCRProcessing(result.document.id);
        } catch (error) {
            this.handleUploadError(error);
        }
    }

    async performUpload(file) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('document_type', 'invoice');

            const xhr = new XMLHttpRequest();

            // Progress tracking
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    this.updateUploadProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            resolve(response);
                        } else {
                            reject(new Error(response.user_message || response.message || 'Upload failed'));
                        }
                    } catch (e) {
                        reject(new Error('Invalid response format'));
                    }
                } else {
                    this.handleHTTPError(xhr.status, xhr.responseText, reject);
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error occurred during upload'));
            });

            xhr.addEventListener('timeout', () => {
                reject(new Error('Upload request timed out'));
            });

            xhr.timeout = 120000; // 2 minutes timeout
            xhr.setRequestHeader('X-Request-ID', this.state.requestId);
            
            xhr.open('POST', this.getApiUrl('/api/ocr/upload'));
            xhr.send(formData);
        });
    }

    handleHTTPError(status, responseText, reject) {
        let errorMessage = 'Upload failed';
        let errorDetails = null;

        try {
            const errorResponse = JSON.parse(responseText);
            if (errorResponse.error) {
                errorMessage = errorResponse.user_message || errorResponse.error.message || errorMessage;
                errorDetails = errorResponse.error;
            }
        } catch (e) {
            // Response is not JSON, use status-based message
            errorMessage = this.getHTTPErrorMessage(status);
        }

        const error = new Error(errorMessage);
        error.details = errorDetails;
        error.status = status;
        reject(error);
    }

    getHTTPErrorMessage(status) {
        const messages = {
            400: 'Invalid file or request format',
            401: 'Authentication required',
            413: 'File too large',
            415: 'Unsupported file type',
            429: 'Too many requests, please wait',
            500: 'Server error, please try again',
            502: 'Service temporarily unavailable',
            503: 'Service unavailable',
            504: 'Request timeout'
        };
        return messages[status] || `HTTP error ${status}`;
    }

    updateUploadProgress(percent) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        if (progressText) {
            progressText.textContent = `${Math.round(percent)}% uploaded`;
        }
    }

    handleUploadError(error) {
        console.error('Upload error:', error);

        this.setUploadState('error');
        
        // Show error with retry options
        this.showUploadError(error);

        // Save state for potential retry
        this.saveSession();
    }

    showUploadError(error) {
        const errorMessage = document.getElementById('upload-error-message');
        if (errorMessage) {
            errorMessage.textContent = error.message || 'Upload failed';
        }

        this.showElement('upload-error');
    }

    async retryUpload() {
        if (!this.state.currentFile) {
            this.showError('No file to retry upload');
            return;
        }

        if (this.state.retryCount >= this.config.retryAttempts) {
            this.showError('Maximum retry attempts exceeded. Please try a different file or contact support.');
            return;
        }

        this.state.retryCount++;
        this.hideElement('upload-error');
        
        // Add delay before retry
        await this.delay(this.config.retryDelay);
        
        this.uploadFile(this.state.currentFile);
    }

    // === OCR PROCESSING ===

    async startOCRProcessing(documentId) {
        this.setProcessingState('processing');
        this.showProcessingStatus('Initializing OCR processing...');

        try {
            // Start processing
            const processResponse = await this.callAPI('/api/ocr/process', {
                method: 'POST',
                body: JSON.stringify({
                    document_id: documentId,
                    language: 'auto',
                    auto_verify: false
                })
            });

            if (processResponse.success) {
                // Start polling for results
                this.pollForResults(documentId);
            } else {
                throw new Error(processResponse.user_message || 'Failed to start OCR processing');
            }
        } catch (error) {
            this.handleOCRError(error, 'process_start');
        }
    }

    async pollForResults(documentId, startTime = Date.now()) {
        try {
            const response = await this.callAPI(`/api/ocr/documents/${documentId}/result`);

            if (response.success && response.document) {
                const doc = response.document;
                
                if (doc.status === 'completed') {
                    this.handleOCRSuccess(doc);
                } else if (doc.status === 'failed') {
                    throw new Error('OCR processing failed');
                } else if (doc.status === 'processing') {
                    // Continue polling if not timed out
                    if (Date.now() - startTime < this.config.maxPollTime) {
                        this.updateProcessingStatus('OCR processing in progress...', doc.progress || 0);
                        setTimeout(() => this.pollForResults(documentId, startTime), this.config.pollInterval);
                    } else {
                        throw new Error('OCR processing timeout');
                    }
                } else {
                    throw new Error(`Unexpected document status: ${doc.status}`);
                }
            } else {
                throw new Error('Failed to get processing status');
            }
        } catch (error) {
            this.handleOCRError(error, 'poll_results');
        }
    }

    handleOCRSuccess(document) {
        this.state.ocrResults = document.result;
        this.setProcessingState('completed');
        this.hideElement('processing-status');

        // Check confidence level
        const confidence = document.result?.confidence || 0;
        
        if (confidence < this.config.confidenceThresholds.medium) {
            this.showConfidenceWarning(confidence);
        } else {
            this.displayResults(document.result);
        }

        this.saveSession();
    }

    handleOCRError(error, operation) {
        console.error(`OCR error in ${operation}:`, error);
        
        this.setProcessingState('error');
        this.hideElement('processing-status');
        
        this.showOCRError(error, operation);
        this.saveSession();
    }

    showOCRError(error, operation) {
        const errorSection = document.getElementById('ocr-error-section');
        const errorMessage = document.getElementById('ocr-error-message');
        const errorCode = document.getElementById('error-code');
        const errorCategory = document.getElementById('error-category');
        const errorRequestId = document.getElementById('error-request-id');

        if (errorMessage) {
            errorMessage.textContent = error.message || 'OCR processing failed';
        }

        // Show error details if available
        if (error.details) {
            if (errorCode) errorCode.textContent = error.details.code || 'UNKNOWN';
            if (errorCategory) errorCategory.textContent = error.details.category || 'system';
            if (errorRequestId) errorRequestId.textContent = this.state.requestId || 'N/A';
        }

        // Generate action buttons based on error type
        this.generateActionButtons(error, operation);

        this.showElement(errorSection);
    }

    generateActionButtons(error, operation) {
        const actionButtons = document.getElementById('action-buttons');
        if (!actionButtons) return;

        actionButtons.innerHTML = '';

        // Determine suggested actions based on error type
        const suggestions = this.getErrorSuggestions(error, operation);

        suggestions.forEach(suggestion => {
            const button = document.createElement('button');
            button.className = `px-3 py-1 rounded text-sm ${suggestion.style}`;
            button.textContent = suggestion.text;
            button.addEventListener('click', suggestion.action);
            actionButtons.appendChild(button);
        });
    }

    getErrorSuggestions(error, operation) {
        const suggestions = [];

        // Common suggestions based on error characteristics
        if (error.status === 429 || error.message?.includes('rate limit')) {
            suggestions.push({
                text: 'Wait & Retry',
                style: 'bg-yellow-600 text-white hover:bg-yellow-700',
                action: () => this.waitAndRetry()
            });
        }

        if (error.status >= 500 || error.message?.includes('service unavailable')) {
            suggestions.push({
                text: 'Try Again',
                style: 'bg-blue-600 text-white hover:bg-blue-700',
                action: () => this.retryOCRProcessing()
            });
        }

        if (error.message?.includes('file') || error.message?.includes('format')) {
            suggestions.push({
                text: 'Upload Different File',
                style: 'bg-green-600 text-white hover:bg-green-700',
                action: () => this.resetForm()
            });
        }

        // Always offer manual entry as fallback
        suggestions.push({
            text: 'Manual Entry',
            style: 'bg-gray-600 text-white hover:bg-gray-700',
            action: () => this.switchToManualEntry()
        });

        return suggestions;
    }

    async waitAndRetry() {
        this.showProcessingStatus('Waiting before retry...', 0);
        await this.delay(5000); // Wait 5 seconds
        this.retryOCRProcessing();
    }

    async retryOCRProcessing() {
        if (!this.state.documentId) {
            this.showError('No document to retry processing');
            return;
        }

        this.hideElement('ocr-error-section');
        this.startOCRProcessing(this.state.documentId);
    }

    // === CONFIDENCE HANDLING ===

    showConfidenceWarning(confidence) {
        const warningSection = document.getElementById('confidence-warning');
        const confidenceBar = document.getElementById('low-confidence-bar');
        const confidenceScore = document.getElementById('low-confidence-score');

        if (confidenceBar) {
            confidenceBar.style.width = `${confidence * 100}%`;
        }
        if (confidenceScore) {
            confidenceScore.textContent = `${Math.round(confidence * 100)}%`;
        }

        this.showElement(warningSection);
    }

    proceedWithReview() {
        this.hideElement('confidence-warning');
        this.displayResults(this.state.ocrResults);
    }

    // === RESULTS DISPLAY ===

    displayResults(results) {
        if (!results) return;

        // Show results section
        this.showElement('ocr-results');

        // Update confidence display
        this.updateConfidenceDisplay(results.confidence || 0);

        // Populate form fields
        this.populateForm(results);

        // Show data quality indicators
        this.showDataQuality(results);

        // Enable editing
        this.state.isEditing = false;
        this.updateEditingState();
    }

    updateConfidenceDisplay(confidence) {
        const confidenceScore = document.getElementById('confidence-score');
        const confidenceBar = document.getElementById('confidence-bar');
        const confidenceBadge = document.getElementById('confidence-badge');

        const percentage = Math.round(confidence * 100);
        
        if (confidenceScore) {
            confidenceScore.textContent = `${percentage}%`;
        }

        if (confidenceBar) {
            confidenceBar.style.width = `${percentage}%`;
            
            // Update color based on confidence level
            confidenceBar.className = 'h-2 rounded-full transition-all duration-300';
            if (confidence >= this.config.confidenceThresholds.high) {
                confidenceBar.classList.add('bg-green-500');
                if (confidenceBadge) {
                    confidenceBadge.textContent = 'High Confidence';
                    confidenceBadge.className = 'px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                }
            } else if (confidence >= this.config.confidenceThresholds.medium) {
                confidenceBar.classList.add('bg-yellow-500');
                if (confidenceBadge) {
                    confidenceBadge.textContent = 'Medium Confidence';
                    confidenceBadge.className = 'px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                }
            } else {
                confidenceBar.classList.add('bg-red-500');
                if (confidenceBadge) {
                    confidenceBadge.textContent = 'Low Confidence';
                    confidenceBadge.className = 'px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                }
            }
        }
    }

    populateForm(results) {
        // Parse structured data
        let invoiceData = {};
        if (results.structured_data) {
            try {
                invoiceData = typeof results.structured_data === 'string' 
                    ? JSON.parse(results.structured_data) 
                    : results.structured_data;
            } catch (e) {
                console.error('Failed to parse structured data:', e);
            }
        }

        // Populate basic fields
        this.setFieldValue('invoice_number', invoiceData.invoice_number);
        this.setFieldValue('invoice_date', invoiceData.invoice_date);
        this.setFieldValue('due_date', invoiceData.due_date);
        this.setFieldValue('currency', invoiceData.currency);

        // Populate supplier information
        this.setFieldValue('supplier_name', invoiceData.supplier_name);
        this.setFieldValue('supplier_address', invoiceData.supplier_address);
        this.setFieldValue('tax_number', invoiceData.tax_number);

        // Populate financial summary
        this.setFieldValue('subtotal', invoiceData.subtotal);
        this.setFieldValue('tax_amount', invoiceData.tax_amount);
        this.setFieldValue('total_amount', invoiceData.total_amount);

        // Populate line items
        this.populateLineItems(invoiceData.items || []);

        // Add field confidence indicators
        this.addFieldConfidenceIndicators(invoiceData, results.confidence);
    }

    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field && value !== undefined && value !== null) {
            field.value = value;
        }
    }

    addFieldConfidenceIndicators(data, overallConfidence) {
        // This is a simplified implementation
        // In practice, you'd have field-level confidence scores
        const fields = [
            'invoice_number', 'invoice_date', 'due_date', 'currency',
            'supplier_name', 'supplier_address', 'tax_number',
            'subtotal', 'tax_amount', 'total_amount'
        ];

        fields.forEach(fieldId => {
            const confidenceSpan = document.getElementById(`${fieldId}_confidence`);
            if (confidenceSpan) {
                // Use overall confidence as field confidence for demo
                const confidence = overallConfidence || 0;
                const percentage = Math.round(confidence * 100);
                confidenceSpan.textContent = `(${percentage}% confidence)`;
                
                if (confidence >= this.config.confidenceThresholds.high) {
                    confidenceSpan.className = 'text-xs text-green-600 dark:text-green-400';
                } else if (confidence >= this.config.confidenceThresholds.medium) {
                    confidenceSpan.className = 'text-xs text-yellow-600 dark:text-yellow-400';
                } else {
                    confidenceSpan.className = 'text-xs text-red-600 dark:text-red-400';
                }
            }
        });
    }

    showDataQuality(results) {
        const qualitySection = document.getElementById('data-quality');
        const indicatorsContainer = document.getElementById('quality-indicators');

        if (!qualitySection || !indicatorsContainer) return;

        // Generate quality indicators
        const indicators = this.generateQualityIndicators(results);
        
        indicatorsContainer.innerHTML = '';
        indicators.forEach(indicator => {
            const div = document.createElement('div');
            div.className = 'text-center';
            div.innerHTML = `
                <div class="w-8 h-8 mx-auto mb-1 rounded-full ${indicator.color}"></div>
                <div class="text-xs font-medium text-gray-700 dark:text-gray-300">${indicator.label}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${indicator.status}</div>
            `;
            indicatorsContainer.appendChild(div);
        });

        this.showElement(qualitySection);
    }

    generateQualityIndicators(results) {
        const confidence = results.confidence || 0;
        
        // This is a simplified implementation
        // In practice, you'd analyze the actual data quality
        return [
            {
                label: 'Text Quality',
                status: confidence > 0.8 ? 'Excellent' : confidence > 0.6 ? 'Good' : 'Poor',
                color: confidence > 0.8 ? 'bg-green-500' : confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
            },
            {
                label: 'Data Structure',
                status: results.structured_data ? 'Complete' : 'Partial',
                color: results.structured_data ? 'bg-green-500' : 'bg-yellow-500'
            },
            {
                label: 'Field Coverage',
                status: this.calculateFieldCoverage(results),
                color: 'bg-blue-500'
            },
            {
                label: 'Validation',
                status: 'Pending',
                color: 'bg-gray-400'
            }
        ];
    }

    calculateFieldCoverage(results) {
        // Simplified field coverage calculation
        let filledFields = 0;
        let totalFields = 10; // Major fields

        try {
            const data = typeof results.structured_data === 'string' 
                ? JSON.parse(results.structured_data) 
                : results.structured_data || {};

            const fields = ['invoice_number', 'invoice_date', 'supplier_name', 'total_amount'];
            filledFields = fields.filter(field => data[field]).length;
        } catch (e) {
            // Error parsing data
        }

        const percentage = Math.round((filledFields / totalFields) * 100);
        return `${percentage}%`;
    }

    // === MANUAL ENTRY ===

    switchToManualEntry() {
        // Hide all OCR-related sections
        this.hideElement('upload-area');
        this.hideElement('processing-status');
        this.hideElement('ocr-error-section');
        this.hideElement('confidence-warning');
        this.hideElement('ocr-results');

        // Show manual entry form
        this.showElement('manual-entry-form');

        // Reset state
        this.state.processingState = 'manual';
        this.state.isEditing = true;

        // Enable all form fields for manual entry
        this.enableAllFormFields();

        this.saveSession();
    }

    enableAllFormFields() {
        const form = document.getElementById('invoice-form');
        if (!form) return;

        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.removeAttribute('readonly');
            input.removeAttribute('disabled');
        });

        // Show add line item button
        this.showElement('add-line-item');
    }

    // === FORM EDITING ===

    enableEditing() {
        this.state.isEditing = true;
        this.updateEditingState();
    }

    saveChanges() {
        // Validate form
        if (this.validateForm()) {
            this.state.isEditing = false;
            this.updateEditingState();
            this.saveSession();
        }
    }

    cancelEditing() {
        // Restore original values
        if (this.state.ocrResults) {
            this.populateForm(this.state.ocrResults);
        }
        this.state.isEditing = false;
        this.updateEditingState();
    }

    updateEditingState() {
        const form = document.getElementById('invoice-form');
        const editBtn = document.getElementById('edit-btn');
        const saveBtn = document.getElementById('save-btn');
        const cancelBtn = document.getElementById('cancel-btn');
        const addLineItemBtn = document.getElementById('add-line-item');

        if (!form) return;

        if (this.state.isEditing) {
            // Enable form fields
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.removeAttribute('readonly');
            });

            // Update buttons
            this.hideElement(editBtn);
            this.showElement(saveBtn);
            this.showElement(cancelBtn);
            this.showElement(addLineItemBtn);
        } else {
            // Disable form fields
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.setAttribute('readonly', true);
            });

            // Update buttons
            this.showElement(editBtn);
            this.hideElement(saveBtn);
            this.hideElement(cancelBtn);
            this.hideElement(addLineItemBtn);
        }
    }

    validateForm() {
        // Basic form validation
        const requiredFields = ['invoice_number', 'supplier_name', 'total_amount'];
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('border-red-500');
        // You could add error message display here
    }

    clearFieldError(field) {
        field.classList.remove('border-red-500');
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        try {
            // Collect form data
            const formData = this.collectFormData();

            // Submit to backend
            const response = await this.callAPI('/api/invoices', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (response.success) {
                this.showSuccess('Invoice data submitted successfully!');
                this.resetForm();
            } else {
                throw new Error(response.message || 'Failed to submit invoice data');
            }
        } catch (error) {
            this.showError(`Failed to submit: ${error.message}`);
        }
    }

    collectFormData() {
        const form = document.getElementById('invoice-form');
        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Add line items
        data.line_items = this.collectLineItems();

        // Add metadata
        data.document_id = this.state.documentId;
        data.processing_method = this.state.processingState === 'manual' ? 'manual' : 'ocr';
        data.confidence_score = this.state.ocrResults?.confidence;

        return data;
    }

    collectLineItems() {
        // Collect line items from table
        const lineItems = [];
        const rows = document.querySelectorAll('#line-items-body tr');

        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 4) {
                lineItems.push({
                    description: inputs[0].value,
                    quantity: parseFloat(inputs[1].value) || 0,
                    unit_price: parseFloat(inputs[2].value) || 0,
                    amount: parseFloat(inputs[3].value) || 0
                });
            }
        });

        return lineItems;
    }

    // === SYSTEM HEALTH ===

    async checkSystemHealth() {
        try {
            const response = await this.callAPI('/api/ocr/health');
            this.updateSystemStatus(response.services || {});
        } catch (error) {
            console.warn('Failed to check system health:', error);
            this.updateSystemStatus({
                ocr_service: 'unknown',
                database: 'unknown',
                file_storage: 'unknown'
            });
        }
    }

    updateSystemStatus(services) {
        const statusElements = {
            'ocr-service-status': services.ocr_service || services.ocr_handler,
            'database-status': services.database,
            'file-storage-status': services.file_storage
        };

        Object.entries(statusElements).forEach(([elementId, status]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.className = 'w-3 h-3 rounded-full mr-2';
                if (status === 'healthy') {
                    element.classList.add('status-healthy');
                } else if (status === 'degraded') {
                    element.classList.add('status-degraded');
                } else {
                    element.classList.add('status-unhealthy');
                }
            }
        });

        // Show health status if any service is not healthy
        const hasIssues = Object.values(services).some(status => status !== 'healthy');
        if (hasIssues) {
            this.showElement('health-status');
        }
    }

    // === STATE MANAGEMENT ===

    setUploadState(state) {
        const uploadContent = document.getElementById('upload-content');
        const uploadLoading = document.getElementById('upload-loading');
        const uploadError = document.getElementById('upload-error');
        const uploadProgress = document.getElementById('upload-progress');

        // Hide all states
        [uploadContent, uploadLoading, uploadError].forEach(el => {
            if (el) this.hideElement(el);
        });

        // Show appropriate state
        switch (state) {
            case 'idle':
                this.showElement(uploadContent);
                this.hideElement(uploadProgress);
                break;
            case 'uploading':
                this.showElement(uploadLoading);
                this.showElement(uploadProgress);
                break;
            case 'error':
                this.showElement(uploadError);
                this.hideElement(uploadProgress);
                break;
        }

        this.state.processingState = state;
    }

    setProcessingState(state) {
        this.state.processingState = state;
    }

    showProcessingStatus(message, progress = null) {
        const statusDiv = document.getElementById('processing-status');
        if (!statusDiv) return;

        statusDiv.innerHTML = `
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div class="flex items-center">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                    <p class="text-blue-700 dark:text-blue-300">${message}</p>
                </div>
                ${progress !== null ? `
                    <div class="mt-3">
                        <div class="bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
                        </div>
                        <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">${progress}% complete</p>
                    </div>
                ` : ''}
            </div>
        `;

        this.showElement(statusDiv);
    }

    updateProcessingStatus(message, progress) {
        const statusDiv = document.getElementById('processing-status');
        if (!statusDiv) return;

        const progressBar = statusDiv.querySelector('.bg-blue-600');
        const progressText = statusDiv.querySelector('.text-xs');
        const messageText = statusDiv.querySelector('.text-blue-700, .text-blue-300');

        if (messageText) messageText.textContent = message;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}% complete`;
    }

    saveSession() {
        try {
            const sessionData = {
                state: this.state,
                timestamp: Date.now()
            };
            localStorage.setItem('invoice_ocr_session', JSON.stringify(sessionData));
        } catch (e) {
            console.warn('Failed to save session:', e);
        }
    }

    restoreSession() {
        try {
            const sessionData = localStorage.getItem('invoice_ocr_session');
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                
                // Check if session is not too old (1 hour)
                if (Date.now() - parsed.timestamp < 3600000) {
                    this.state = { ...this.state, ...parsed.state };
                    
                    // Restore UI state based on saved state
                    if (this.state.processingState === 'completed' && this.state.ocrResults) {
                        this.displayResults(this.state.ocrResults);
                    } else if (this.state.processingState === 'manual') {
                        this.switchToManualEntry();
                    }
                } else {
                    // Clear old session
                    localStorage.removeItem('invoice_ocr_session');
                }
            }
        } catch (e) {
            console.warn('Failed to restore session:', e);
            localStorage.removeItem('invoice_ocr_session');
        }
    }

    resetForm() {
        // Clear state
        this.state = {
            currentFile: null,
            documentId: null,
            processingState: 'idle',
            retryCount: 0,
            ocrResults: null,
            isEditing: false,
            requestId: null
        };

        // Reset UI
        this.setUploadState('idle');
        
        // Hide all sections
        ['processing-status', 'ocr-error-section', 'confidence-warning', 'ocr-results', 'manual-entry-form', 'validation-errors'].forEach(id => {
            this.hideElement(id);
        });

        // Show upload area
        this.showElement('upload-area');

        // Clear form
        const form = document.getElementById('invoice-form');
        if (form) {
            form.reset();
        }

        // Clear file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.value = '';
        }

        // Clear session
        localStorage.removeItem('invoice_ocr_session');
    }

    // === ERROR DISPLAY ===

    toggleErrorDetails() {
        const errorDetails = document.getElementById('error-details');
        if (errorDetails) {
            errorDetails.classList.toggle('hidden');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        if (errorText) errorText.textContent = message;
        if (errorDiv) this.showElement(errorDiv);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (errorDiv) this.hideElement(errorDiv);
        }, 10000);
    }

    showSuccess(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 z-50';
        successDiv.innerHTML = `
            <div class="flex items-center">
                <svg class="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <p class="text-green-700 dark:text-green-300">${message}</p>
            </div>
        `;

        document.body.appendChild(successDiv);

        // Remove after 5 seconds
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 5000);
    }

    // === UTILITY METHODS ===

    showElement(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.classList.remove('hidden');
        }
    }

    hideElement(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.classList.add('hidden');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getApiUrl(path) {
        return window.appConfig?.apiBaseUrl ? `${window.appConfig.apiBaseUrl}${path}` : path;
    }

    async callAPI(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': this.state.requestId || this.generateRequestId(),
                ...(options.headers || {})
            }
        };

        const response = await fetch(this.getApiUrl(url), {
            ...defaultOptions,
            ...options
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `HTTP ${response.status}`;
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.user_message || errorData.message || errorMessage;
            } catch (e) {
                // Use default message
            }

            const error = new Error(errorMessage);
            error.status = response.status;
            throw error;
        }

        return await response.json();
    }

    // === LINE ITEMS MANAGEMENT ===

    populateLineItems(items) {
        const tbody = document.getElementById('line-items-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        items.forEach((item, index) => {
            this.addLineItemRow(item, index);
        });

        // Add empty row if no items
        if (items.length === 0) {
            this.addLineItemRow({}, 0);
        }
    }

    addLineItemRow(item = {}, index = 0) {
        const tbody = document.getElementById('line-items-body');
        if (!tbody) return;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-3">
                <input type="text" value="${item.description || ''}" 
                       class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                       ${this.state.isEditing ? '' : 'readonly'}>
            </td>
            <td class="px-4 py-3">
                <input type="number" step="0.01" value="${item.quantity || ''}" 
                       class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                       ${this.state.isEditing ? '' : 'readonly'}>
            </td>
            <td class="px-4 py-3">
                <input type="number" step="0.01" value="${item.unit_price || ''}" 
                       class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                       ${this.state.isEditing ? '' : 'readonly'}>
            </td>
            <td class="px-4 py-3">
                <input type="number" step="0.01" value="${item.amount || ''}" 
                       class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                       ${this.state.isEditing ? '' : 'readonly'}>
            </td>
            <td class="px-4 py-3">
                <button type="button" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ${this.state.isEditing ? '' : 'hidden'}"
                        onclick="this.closest('tr').remove()">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    }

    setupFormValidation() {
        // Add real-time validation for form fields
        const form = document.getElementById('invoice-form');
        if (!form) return;

        // Add input event listeners for validation
        const inputs = form.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateNumericField(input);
            });
        });

        // Add change event listeners for date fields
        const dateInputs = form.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.validateDateField(input);
            });
        });
    }

    validateNumericField(input) {
        const value = parseFloat(input.value);
        if (isNaN(value) || value < 0) {
            input.classList.add('border-red-500');
        } else {
            input.classList.remove('border-red-500');
        }
    }

    validateDateField(input) {
        const value = new Date(input.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(value.getTime())) {
            input.classList.add('border-red-500');
        } else {
            input.classList.remove('border-red-500');
        }
    }
}

// Simple error handler class for demonstration
class OCRErrorHandler {
    constructor() {
        this.errorHistory = [];
    }

    logError(error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            context: context
        };

        this.errorHistory.push(errorEntry);
        console.error('OCR Error:', errorEntry);

        // Keep only last 50 errors
        if (this.errorHistory.length > 50) {
            this.errorHistory.shift();
        }
    }

    getErrorHistory() {
        return this.errorHistory;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.invoiceOCR = new EnhancedInvoiceOCR();
});