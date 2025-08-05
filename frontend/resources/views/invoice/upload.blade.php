@extends('layouts.app')

@section('title', 'Invoice OCR Upload - NexusERP')

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
                Invoice OCR Processing
            </h1>
            <p class="text-gray-600">
                Upload invoice files and extract data using OCR technology
            </p>
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
        </div>

        <!-- Processing Status -->
        <div id="processing-status" class="hidden bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div class="flex items-center">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                <p class="text-blue-700">Processing document with OCR...</p>
            </div>
        </div>

        <!-- OCR Results Section -->
        <div id="ocr-results" class="hidden bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-semibold text-gray-900">
                    OCR Results
                </h2>
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

            <!-- Confidence Score -->
            <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">OCR Confidence</span>
                    <span id="confidence-score" class="text-sm font-bold text-green-600">--%</span>
                </div>
                <div class="bg-gray-200 rounded-full h-2">
                    <div id="confidence-bar" class="bg-green-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>

            <!-- Invoice Form -->
            <form id="invoice-form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Basic Information -->
                    <div>
                        <label for="invoice_number" class="block text-sm font-medium text-gray-700 mb-2">
                            Invoice Number
                        </label>
                        <input type="text" id="invoice_number" name="invoice_number" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                               readonly>
                    </div>

                    <div>
                        <label for="invoice_date" class="block text-sm font-medium text-gray-700 mb-2">
                            Invoice Date
                        </label>
                        <input type="date" id="invoice_date" name="invoice_date" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                               readonly>
                    </div>

                    <div>
                        <label for="due_date" class="block text-sm font-medium text-gray-700 mb-2">
                            Due Date
                        </label>
                        <input type="date" id="due_date" name="due_date" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                               readonly>
                    </div>

                    <div>
                        <label for="currency" class="block text-sm font-medium text-gray-700 mb-2">
                            Currency
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
                            </label>
                            <input type="text" id="supplier_name" name="supplier_name" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                        </div>

                        <div>
                            <label for="tax_number" class="block text-sm font-medium text-gray-700 mb-2">
                                Tax Number
                            </label>
                            <input type="text" id="tax_number" name="tax_number" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                        </div>
                    </div>

                    <div class="mt-4">
                        <label for="supplier_address" class="block text-sm font-medium text-gray-700 mb-2">
                            Supplier Address
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
                            </label>
                            <input type="number" step="0.01" id="subtotal" name="subtotal" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                        </div>

                        <div>
                            <label for="tax_amount" class="block text-sm font-medium text-gray-700 mb-2">
                                Tax Amount
                            </label>
                            <input type="number" step="0.01" id="tax_amount" name="tax_amount" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                        </div>

                        <div>
                            <label for="total_amount" class="block text-sm font-medium text-gray-700 mb-2">
                                Total Amount
                            </label>
                            <input type="number" step="0.01" id="total_amount" name="total_amount" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   readonly>
                        </div>
                    </div>
                </div>

                <!-- Line Items -->
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

        <!-- Error Messages -->
        <div id="error-message" class="hidden mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
                <svg class="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <p id="error-text" class="text-red-700"></p>
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
</style>
@endpush

@push('scripts')
@include('partials.app-config')
<script src="{{ asset('js/invoice-ocr.js') }}"></script>
@endpush