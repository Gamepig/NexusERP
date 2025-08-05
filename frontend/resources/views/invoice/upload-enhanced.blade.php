@extends('layouts.app')

@section('title', 'Enhanced Invoice OCR Upload - NexusERP')

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
                Enhanced Invoice OCR Processing
            </h1>
            <p class="text-gray-600">
                Upload invoice files with comprehensive error handling and manual fallback options
            </p>
        </div>

        <!-- System Status Banner -->
        <div id="system-status" class="hidden mb-6">
            <!-- Will be populated by JavaScript -->
        </div>

        <!-- Upload Section -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
                Upload Invoice
            </h2>
            
            <!-- File Upload Area -->
            <div id="upload-area" class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <div id="upload-content">
                    <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <p class="text-lg text-gray-600 mb-2">
                        <span class="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p class="text-sm text-gray-500">
                        PDF, PNG, JPEG files (max 10MB)
                    </p>
                </div>
                
                <!-- Loading state -->
                <div id="upload-loading" class="hidden">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p class="text-lg text-gray-600">Uploading...</p>
                </div>

                <!-- Upload Error State -->
                <div id="upload-error" class="hidden">
                    <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <p class="text-lg text-red-600 mb-2 font-semibold">Upload Failed</p>
                    <p id="upload-error-message" class="text-sm text-gray-600 mb-4"></p>
                    <button id="retry-upload" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
            
            <!-- Hidden file input -->
            <input type="file" id="file-input" class="hidden" accept=".pdf,.png,.jpg,.jpeg" />
            
            <!-- Upload Progress -->
            <div id="upload-progress" class="hidden mt-4">
                <div class="bg-gray-200 rounded-full h-2">
                    <div id="progress-bar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
                <p id="progress-text" class="text-sm text-gray-600 mt-2">0% uploaded</p>
            </div>

            <!-- File Validation Errors -->
            <div id="validation-errors" class="hidden mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 class="text-red-800 font-semibold mb-2">File Validation Issues:</h4>
                <ul id="validation-errors-list" class="list-disc list-inside text-red-700 text-sm">
                    <!-- Validation errors will be populated here -->
                </ul>
            </div>
        </div>

        <!-- Processing Status with Enhanced Error Handling -->
        <div id="processing-status" class="hidden mb-8">
            <!-- Processing states will be dynamically populated -->
        </div>

        <!-- OCR Error Handling Section -->
        <div id="ocr-error-section" class="hidden bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div class="flex items-start">
                <svg class="h-6 w-6 text-red-400 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-red-800 mb-2">
                        OCR Processing Failed
                    </h3>
                    <p id="ocr-error-message" class="text-red-700 mb-4"></p>
                    
                    <!-- Error Details -->
                    <div id="error-details" class="hidden bg-red-100 rounded-lg p-4 mb-4">
                        <h4 class="font-medium text-red-800 mb-2">Technical Details:</h4>
                        <div class="text-sm text-red-700 space-y-1">
                            <p><strong>Error Code:</strong> <span id="error-code"></span></p>
                            <p><strong>Category:</strong> <span id="error-category"></span></p>
                            <p><strong>Request ID:</strong> <span id="error-request-id"></span></p>
                        </div>
                    </div>

                    <!-- Suggested Actions -->
                    <div id="suggested-actions" class="mb-4">
                        <h4 class="font-medium text-red-800 mb-2">Suggested Actions:</h4>
                        <div id="action-buttons" class="flex flex-wrap gap-2">
                            <!-- Action buttons will be populated based on error type -->
                        </div>
                    </div>

                    <!-- Manual Entry Fallback -->
                    <div class="border-t border-red-200 pt-4">
                        <button id="manual-entry-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Enter Data Manually
                        </button>
                        <button id="show-error-details" class="ml-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                            Show Technical Details
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Low Confidence Warning -->
        <div id="confidence-warning" class="hidden bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div class="flex items-start">
                <svg class="h-6 w-6 text-yellow-400 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-yellow-800 mb-2">
                        Low OCR Confidence Detected
                    </h3>
                    <p class="text-yellow-700 mb-4">
                        The OCR system has processed your document, but the confidence level is low. Please review all extracted data carefully before submitting.
                    </p>
                    <div class="flex items-center mb-4">
                        <span class="text-sm font-medium text-yellow-700 mr-2">Confidence Level:</span>
                        <div class="flex-1 bg-yellow-200 rounded-full h-2 mr-2">
                            <div id="low-confidence-bar" class="bg-yellow-500 h-2 rounded-full"></div>
                        </div>
                        <span id="low-confidence-score" class="text-sm font-bold text-yellow-700"></span>
                    </div>
                    <div class="flex gap-2">
                        <button id="proceed-review" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                            Review & Edit Data
                        </button>
                        <button id="restart-manual" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Start Over Manually
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- OCR Results Section (Enhanced) -->
        <div id="ocr-results" class="hidden bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-xl font-semibold text-gray-900">
                        OCR Results
                    </h2>
                    <p class="text-sm text-gray-600 mt-1">
                        Review and edit the extracted data as needed
                    </p>
                </div>
                <div class="flex space-x-2">
                    <button id="edit-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Edit
                    </button>
                    <button id="save-btn" class="hidden px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Save Changes
                    </button>
                    <button id="cancel-btn" class="hidden px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>

            <!-- Enhanced Confidence Score with Color Coding -->
            <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">OCR Confidence</span>
                    <div class="flex items-center">
                        <span id="confidence-score" class="text-sm font-bold mr-2">--%</span>
                        <span id="confidence-badge" class="px-2 py-1 rounded-full text-xs font-medium">
                            <!-- Badge will be populated based on confidence level -->
                        </span>
                    </div>
                </div>
                <div class="bg-gray-200 rounded-full h-2">
                    <div id="confidence-bar" class="h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low (0-60%)</span>
                    <span>Medium (60-80%)</span>
                    <span>High (80%+)</span>
                </div>
            </div>

            <!-- Data Quality Indicators -->
            <div id="data-quality" class="hidden mb-6 bg-gray-50 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">Data Quality Indicators</h4>
                <div id="quality-indicators" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <!-- Quality indicators will be populated here -->
                </div>
            </div>

            <!-- Invoice Form (Same as before but enhanced with validation feedback) -->
            <form id="invoice-form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Basic Information with validation feedback -->
                    <div>
                        <label for="invoice_number" class="block text-sm font-medium text-gray-700 mb-2">
                            Invoice Number
                            <span id="invoice_number_confidence" class="text-xs text-gray-500"></span>
                        </label>
                        <div class="relative">
                            <input type="text" id="invoice_number" name="invoice_number" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                            <div id="invoice_number_validation" class="hidden absolute top-0 right-0 -mr-2 -mt-2">
                                <!-- Validation icon will be shown here -->
                            </div>
                        </div>
                        <div id="invoice_number_suggestion" class="hidden mt-1 text-xs text-blue-600">
                            <!-- Suggestions will be shown here -->
                        </div>
                    </div>

                    <div>
                        <label for="invoice_date" class="block text-sm font-medium text-gray-700 mb-2">
                            Invoice Date
                            <span id="invoice_date_confidence" class="text-xs text-gray-500"></span>
                        </label>
                        <div class="relative">
                            <input type="date" id="invoice_date" name="invoice_date" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                            <div id="invoice_date_validation" class="hidden absolute top-0 right-0 -mr-2 -mt-2">
                                <!-- Validation icon will be shown here -->
                            </div>
                        </div>
                    </div>

                    <div>
                        <label for="due_date" class="block text-sm font-medium text-gray-700 mb-2">
                            Due Date
                            <span id="due_date_confidence" class="text-xs text-gray-500"></span>
                        </label>
                        <input type="date" id="due_date" name="due_date" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                               readonly>
                    </div>

                    <div>
                        <label for="currency" class="block text-sm font-medium text-gray-700 mb-2">
                            Currency
                            <span id="currency_confidence" class="text-xs text-gray-500"></span>
                        </label>
                        <input type="text" id="currency" name="currency" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                               readonly>
                    </div>
                </div>

                <!-- Supplier Information -->
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Supplier Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="supplier_name" class="block text-sm font-medium text-gray-700 mb-2">
                                Supplier Name
                                <span id="supplier_name_confidence" class="text-xs text-gray-500"></span>
                            </label>
                            <input type="text" id="supplier_name" name="supplier_name" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                        </div>

                        <div>
                            <label for="tax_number" class="block text-sm font-medium text-gray-700 mb-2">
                                Tax Number
                                <span id="tax_number_confidence" class="text-xs text-gray-500"></span>
                            </label>
                            <input type="text" id="tax_number" name="tax_number" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                        </div>
                    </div>

                    <div class="mt-4">
                        <label for="supplier_address" class="block text-sm font-medium text-gray-700 mb-2">
                            Supplier Address
                            <span id="supplier_address_confidence" class="text-xs text-gray-500"></span>
                        </label>
                        <textarea id="supplier_address" name="supplier_address" rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  readonly></textarea>
                    </div>
                </div>

                <!-- Financial Summary -->
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label for="subtotal" class="block text-sm font-medium text-gray-700 mb-2">
                                Subtotal
                                <span id="subtotal_confidence" class="text-xs text-gray-500"></span>
                            </label>
                            <input type="number" step="0.01" id="subtotal" name="subtotal" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                        </div>

                        <div>
                            <label for="tax_amount" class="block text-sm font-medium text-gray-700 mb-2">
                                Tax Amount
                                <span id="tax_amount_confidence" class="text-xs text-gray-500"></span>
                            </label>
                            <input type="number" step="0.01" id="tax_amount" name="tax_amount" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                        </div>

                        <div>
                            <label for="total_amount" class="block text-sm font-medium text-gray-700 mb-2">
                                Total Amount
                                <span id="total_amount_confidence" class="text-xs text-gray-500"></span>
                            </label>
                            <input type="number" step="0.01" id="total_amount" name="total_amount" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                        </div>
                    </div>
                </div>

                <!-- Line Items (Same as before) -->
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Line Items</h3>
                    <div class="overflow-x-auto">
                        <table id="line-items-table" class="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="line-items-body" class="divide-y divide-gray-200">
                                <!-- Line items will be populated here -->
                            </tbody>
                        </table>
                        
                        <button type="button" id="add-line-item" class="hidden mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Add Line Item
                        </button>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button type="button" id="process-another" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Process Another Invoice
                    </button>
                    <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Submit Invoice Data
                    </button>
                </div>
            </form>
        </div>

        <!-- Manual Entry Form (Fallback) -->
        <div id="manual-entry-form" class="hidden bg-white rounded-lg shadow-lg p-6">
            <div class="mb-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-2">
                    Manual Data Entry
                </h2>
                <p class="text-gray-600">
                    Enter invoice data manually when OCR processing is unavailable or produces poor results.
                </p>
            </div>
            
            <!-- Manual form content would be similar to OCR results form but always editable -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p class="text-blue-700 text-sm">
                    <strong>Tip:</strong> You can upload a new file at any time by clicking "Process Another Invoice" to try OCR again.
                </p>
            </div>
            
            <!-- Include the same form structure as OCR results but in manual mode -->
            <!-- This would be a copy of the invoice form above with all inputs always enabled -->
        </div>

        <!-- System Health Status -->
        <div id="health-status" class="hidden mt-8 bg-gray-50 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-2">System Status</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="flex items-center">
                    <div id="ocr-service-status" class="w-3 h-3 rounded-full mr-2"></div>
                    <span>OCR Service</span>
                </div>
                <div class="flex items-center">
                    <div id="database-status" class="w-3 h-3 rounded-full mr-2"></div>
                    <span>Database</span>
                </div>
                <div class="flex items-center">
                    <div id="file-storage-status" class="w-3 h-3 rounded-full mr-2"></div>
                    <span>File Storage</span>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('styles')
<style>
    .drag-over {
        @apply border-blue-500 bg-blue-50
    }
    
    .fade-in {
        animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .confidence-high .confidence-bar { @apply bg-green-500; }
    .confidence-medium .confidence-bar { @apply bg-yellow-500; }
    .confidence-low .confidence-bar { @apply bg-red-500; }

    .field-high-confidence { @apply border-green-300 }
    .field-medium-confidence { @apply border-yellow-300 }
    .field-low-confidence { @apply border-red-300 }

    .status-healthy { @apply bg-green-500; }
    .status-degraded { @apply bg-yellow-500; }
    .status-unhealthy { @apply bg-red-500; }
</style>
@endpush

@push('scripts')
@include('partials.app-config')
<script src="{{ asset('js/invoice-ocr-enhanced.js') }}"></script>
@endpush