/**
 * Invoice OCR Upload and Processing JavaScript
 * Handles file upload, OCR processing, and form management
 */

class InvoiceOCR {
    constructor() {
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.uploadProgress = document.getElementById('upload-progress');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.processingStatus = document.getElementById('processing-status');
        this.ocrResults = document.getElementById('ocr-results');
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
        
        this.currentDocumentId = null;
        this.isEditing = false;
        this.originalFormData = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCSRFToken();
    }

    setupCSRFToken() {
        // Get CSRF token from meta tag
        this.csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    }

    setupEventListeners() {
        // File upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Form controls
        document.getElementById('edit-btn')?.addEventListener('click', this.enableEditing.bind(this));
        document.getElementById('save-btn')?.addEventListener('click', this.saveChanges.bind(this));
        document.getElementById('cancel-btn')?.addEventListener('click', this.cancelEditing.bind(this));
        document.getElementById('add-line-item')?.addEventListener('click', this.addLineItem.bind(this));
        document.getElementById('process-another')?.addEventListener('click', this.resetForm.bind(this));
        document.getElementById('invoice-form')?.addEventListener('submit', this.submitInvoiceData.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        // Validate file
        if (!this.validateFile(file)) {
            return;
        }

        try {
            this.showUploadProgress();
            
            // Upload file
            const uploadResult = await this.uploadFile(file);
            
            if (uploadResult.success) {
                this.currentDocumentId = uploadResult.document.id;
                
                // Show processing status
                this.showProcessingStatus();
                
                // Start OCR processing
                await this.processDocument(this.currentDocumentId);
                
                // Get and display results
                await this.getOCRResults(this.currentDocumentId);
            }
        } catch (error) {
            this.showError(`Upload failed: ${error.message}`);
        } finally {
            this.hideUploadProgress();
            this.hideProcessingStatus();
        }
    }

    validateFile(file) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            this.showError('Invalid file type. Please upload PDF, JPEG, or PNG files only.');
            return false;
        }

        if (file.size > maxSize) {
            this.showError('File size exceeds maximum limit of 10MB.');
            return false;
        }

        return true;
    }

    async uploadFile(file) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    this.updateProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 201) {
                    const response = JSON.parse(xhr.responseText);
                    resolve({ success: true, document: response.document });
                } else {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.error || 'Upload failed'));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            // Get the Go backend URL from app configuration
            const backendUrl = window.APP_CONFIG?.BACKEND_URL || window.BACKEND_URL || 'http://localhost:8080';
            xhr.open('POST', `${backendUrl}/api/invoices/upload`);
            
            // Add auth header if available
            const authToken = this.getAuthToken();
            if (authToken) {
                xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
            }

            xhr.send(formData);
        });
    }

    async processDocument(documentId) {
        const backendUrl = window.APP_CONFIG?.BACKEND_URL || window.BACKEND_URL || 'http://localhost:8080';
        
        const response = await fetch(`${backendUrl}/api/ocr/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
                document_id: documentId,
                auto_verify: false
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'OCR processing failed');
        }

        return await response.json();
    }

    async getOCRResults(documentId) {
        const backendUrl = window.APP_CONFIG?.BACKEND_URL || window.BACKEND_URL || 'http://localhost:8080';
        
        // Poll for results with timeout
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout
        
        while (attempts < maxAttempts) {
            try {
                const response = await fetch(`${backendUrl}/api/ocr/documents/${documentId}/result`, {
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.structured_data) {
                        this.displayOCRResults(result);
                        return;
                    }
                }
                
                // Wait 1 second before next attempt
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            } catch (error) {
                console.error('Error polling for results:', error);
                attempts++;
            }
        }
        
        throw new Error('OCR processing timed out. Please try again.');
    }

    displayOCRResults(result) {
        try {
            const structuredData = JSON.parse(result.structured_data);
            
            // Update confidence score
            this.updateConfidenceScore(result.confidence);
            
            // Populate form fields
            this.populateForm(structuredData);
            
            // Store original data for cancel functionality
            this.originalFormData = { ...structuredData };
            
            // Show results section
            this.showOCRResults();
            
        } catch (error) {
            this.showError(`Failed to parse OCR results: ${error.message}`);
        }
    }

    populateForm(data) {
        // Basic fields
        this.setFormValue('invoice_number', data.invoice_number || '');
        this.setFormValue('invoice_date', this.formatDate(data.invoice_date));
        this.setFormValue('due_date', this.formatDate(data.due_date));
        this.setFormValue('currency', data.currency || '');
        
        // Supplier information
        this.setFormValue('supplier_name', data.supplier_name || data.vendor_name || '');
        this.setFormValue('supplier_address', data.supplier_address || data.vendor_address || '');
        this.setFormValue('tax_number', data.tax_number || '');
        
        // Financial summary
        this.setFormValue('subtotal', data.subtotal);
        this.setFormValue('tax_amount', data.tax_amount);
        this.setFormValue('total_amount', data.total_amount);
        
        // Line items
        this.populateLineItems(data.line_items || data.items || []);
    }

    populateLineItems(items) {
        const tbody = document.getElementById('line-items-body');
        tbody.innerHTML = '';
        
        items.forEach((item, index) => {
            this.addLineItemRow(item, index);
        });
        
        // Add at least one empty row if no items
        if (items.length === 0) {
            this.addLineItemRow({}, 0);
        }
    }

    addLineItemRow(item = {}, index) {
        const tbody = document.getElementById('line-items-body');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-3">
                <input type="text" name="items[${index}][description]" value="${item.description || ''}" 
                       class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" readonly>
            </td>
            <td class="px-4 py-3">
                <input type="number" step="0.01" name="items[${index}][quantity]" value="${item.quantity || ''}" 
                       class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" readonly>
            </td>
            <td class="px-4 py-3">
                <input type="number" step="0.01" name="items[${index}][unit_price]" value="${item.unit_price || ''}" 
                       class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" readonly>
            </td>
            <td class="px-4 py-3">
                <input type="number" step="0.01" name="items[${index}][amount]" value="${item.amount || ''}" 
                       class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" readonly>
            </td>
            <td class="px-4 py-3">
                <button type="button" class="remove-item hidden text-red-600 hover:text-red-800 dark:text-red-400" onclick="this.closest('tr').remove()">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    }

    addLineItem() {
        const tbody = document.getElementById('line-items-body');
        const currentRows = tbody.querySelectorAll('tr').length;
        this.addLineItemRow({}, currentRows);
        
        // Make the new row editable if in edit mode
        if (this.isEditing) {
            const newRow = tbody.lastElementChild;
            const inputs = newRow.querySelectorAll('input');
            inputs.forEach(input => input.removeAttribute('readonly'));
            newRow.querySelector('.remove-item').classList.remove('hidden');
        }
    }

    enableEditing() {
        this.isEditing = true;
        
        // Enable all form inputs
        const form = document.getElementById('invoice-form');
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => input.removeAttribute('readonly'));
        
        // Show/hide buttons
        document.getElementById('edit-btn').classList.add('hidden');
        document.getElementById('save-btn').classList.remove('hidden');
        document.getElementById('cancel-btn').classList.remove('hidden');
        document.getElementById('add-line-item').classList.remove('hidden');
        
        // Show remove buttons for line items
        document.querySelectorAll('.remove-item').forEach(btn => btn.classList.remove('hidden'));
    }

    saveChanges() {
        // Collect form data
        const formData = this.collectFormData();
        
        // Store the updated data
        this.originalFormData = { ...formData };
        
        // Disable editing
        this.disableEditing();
        
        this.showSuccess('Changes saved successfully!');
    }

    cancelEditing() {
        // Restore original data
        this.populateForm(this.originalFormData);
        
        // Disable editing
        this.disableEditing();
    }

    disableEditing() {
        this.isEditing = false;
        
        // Disable all form inputs
        const form = document.getElementById('invoice-form');
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => input.setAttribute('readonly', 'readonly'));
        
        // Show/hide buttons
        document.getElementById('edit-btn').classList.remove('hidden');
        document.getElementById('save-btn').classList.add('hidden');
        document.getElementById('cancel-btn').classList.add('hidden');
        document.getElementById('add-line-item').classList.add('hidden');
        
        // Hide remove buttons for line items
        document.querySelectorAll('.remove-item').forEach(btn => btn.classList.add('hidden'));
    }

    async submitInvoiceData(e) {
        e.preventDefault();
        
        const formData = this.collectFormData();
        
        try {
            // Here you would typically submit to your invoice management system
            // For now, we'll just show a success message
            this.showSuccess('Invoice data submitted successfully!');
            
            // Optionally reset the form for next invoice
            setTimeout(() => {
                this.resetForm();
            }, 2000);
            
        } catch (error) {
            this.showError(`Failed to submit invoice data: ${error.message}`);
        }
    }

    collectFormData() {
        const form = document.getElementById('invoice-form');
        const formData = new FormData(form);
        const data = {};
        
        // Collect basic fields
        for (let [key, value] of formData.entries()) {
            if (key.includes('[')) {
                // Handle array fields (line items)
                const matches = key.match(/(\w+)\[(\d+)\]\[(\w+)\]/);
                if (matches) {
                    const [, arrayName, index, fieldName] = matches;
                    if (!data[arrayName]) data[arrayName] = [];
                    if (!data[arrayName][index]) data[arrayName][index] = {};
                    data[arrayName][index][fieldName] = value;
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }

    resetForm() {
        // Hide results and reset state
        this.hideOCRResults();
        this.hideError();
        this.currentDocumentId = null;
        this.isEditing = false;
        this.originalFormData = {};
        
        // Reset file input
        this.fileInput.value = '';
        
        // Reset upload area
        document.getElementById('upload-content').classList.remove('hidden');
        document.getElementById('upload-loading').classList.add('hidden');
    }

    // Utility methods
    setFormValue(fieldName, value) {
        const field = document.getElementById(fieldName);
        if (field && value !== null && value !== undefined) {
            field.value = value;
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    }

    updateProgress(percent) {
        this.progressBar.style.width = `${percent}%`;
        this.progressText.textContent = `${Math.round(percent)}% uploaded`;
    }

    updateConfidenceScore(confidence) {
        const percent = Math.round(confidence * 100);
        document.getElementById('confidence-score').textContent = `${percent}%`;
        document.getElementById('confidence-bar').style.width = `${percent}%`;
        
        // Update color based on confidence level
        const bar = document.getElementById('confidence-bar');
        if (percent >= 80) {
            bar.className = 'bg-green-500 h-2 rounded-full transition-all duration-300';
        } else if (percent >= 60) {
            bar.className = 'bg-yellow-500 h-2 rounded-full transition-all duration-300';
        } else {
            bar.className = 'bg-red-500 h-2 rounded-full transition-all duration-300';
        }
    }

    getAuthToken() {
        // This should be implemented based on your authentication system
        // For now, return a placeholder or get from localStorage/sessionStorage
        return localStorage.getItem('auth_token') || '';
    }

    // UI State management
    showUploadProgress() {
        document.getElementById('upload-content').classList.add('hidden');
        document.getElementById('upload-loading').classList.remove('hidden');
        this.uploadProgress.classList.remove('hidden');
    }

    hideUploadProgress() {
        document.getElementById('upload-content').classList.remove('hidden');
        document.getElementById('upload-loading').classList.add('hidden');
        this.uploadProgress.classList.add('hidden');
    }

    showProcessingStatus() {
        this.processingStatus.classList.remove('hidden');
    }

    hideProcessingStatus() {
        this.processingStatus.classList.add('hidden');
    }

    showOCRResults() {
        this.ocrResults.classList.remove('hidden');
        this.ocrResults.classList.add('fade-in');
    }

    hideOCRResults() {
        this.ocrResults.classList.add('hidden');
        this.ocrResults.classList.remove('fade-in');
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    showSuccess(message) {
        // Create a temporary success message element
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 z-50';
        successDiv.innerHTML = `
            <div class="flex">
                <svg class="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <p class="text-green-700 dark:text-green-300">${message}</p>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InvoiceOCR();
});