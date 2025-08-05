@extends('layouts.app')

@section('title', '供應商詳情')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">供應商詳情</h1>
            <p class="text-gray-600 dark:text-gray-400">查看供應商的詳細資訊</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('suppliers.edit', $supplierId) }}" 
               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                編輯供應商
            </a>
            <a href="{{ route('suppliers.index') }}" 
               class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回列表
            </a>
        </div>
    </div>

    <!-- Supplier Info Card -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">基本資訊</h3>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500 dark:text-gray-400">供應商 ID: {{ $supplierId }}</span>
                </div>
            </div>
        </div>
        
        <div class="p-6">
            <!-- Loading state -->
            <div id="supplier-loading" class="text-center py-8">
                <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white transition ease-in-out duration-150">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    載入中...
                </div>
            </div>

            <!-- Error state -->
            <div id="supplier-error" class="hidden text-center py-8">
                <div class="flex flex-col items-center">
                    <svg class="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p class="text-red-500 text-lg mb-2">載入失敗</p>
                    <p id="error-message" class="text-gray-400 text-sm mb-4"></p>
                    <button onclick="loadSupplierDetails()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        重新載入
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div id="supplier-content" class="hidden">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Company Info -->
                    <div class="space-y-4">
                        <h4 class="text-lg font-medium text-gray-900 dark:text-white">公司資訊</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">公司名稱</label>
                                <p id="supplier-name" class="mt-1 text-sm text-gray-900 dark:text-white">-</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">供應商代碼</label>
                                <p id="supplier-code" class="mt-1 text-sm text-gray-900 dark:text-white">-</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">供應商類型</label>
                                <p id="supplier-type" class="mt-1 text-sm text-gray-900 dark:text-white">-</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">描述</label>
                                <p id="supplier-description" class="mt-1 text-sm text-gray-900 dark:text-white">-</p>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Info -->
                    <div class="space-y-4">
                        <h4 class="text-lg font-medium text-gray-900 dark:text-white">聯絡資訊</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">聯絡人</label>
                                <p id="supplier-contact-person" class="mt-1 text-sm text-gray-900 dark:text-white">-</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">電子郵件</label>
                                <p id="supplier-email" class="mt-1 text-sm text-gray-900 dark:text-white">-</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">電話</label>
                                <p id="supplier-phone" class="mt-1 text-sm text-gray-900 dark:text-white">-</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">地址</label>
                                <p id="supplier-address" class="mt-1 text-sm text-gray-900 dark:text-white">-</p>
                            </div>
                        </div>
                    </div>

                    <!-- Business Info -->
                    <div class="space-y-4">
                        <h4 class="text-lg font-medium text-gray-900 dark:text-white">商務資訊</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">付款條件</label>
                                <p id="supplier-payment-terms" class="mt-1 text-sm text-gray-900 dark:text-white">-</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">信用額度</label>
                                <p id="supplier-credit-limit" class="mt-1 text-sm text-gray-900 dark:text-white">-</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">狀態</label>
                                <span id="supplier-status" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">-</span>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">建立時間</label>
                                <p id="supplier-created-at" class="mt-1 text-sm text-gray-900 dark:text-white">-</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    loadSupplierDetails();
});

async function loadSupplierDetails() {
    const supplierId = {{ $supplierId }};
    const API_BASE_URL = 'http://127.0.0.1:8082';
    
    // Show loading state
    document.getElementById('supplier-loading').classList.remove('hidden');
    document.getElementById('supplier-error').classList.add('hidden');
    document.getElementById('supplier-content').classList.add('hidden');
    
    try {
        // Get authentication token
        let token = getAuthToken();
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/suppliers/${supplierId}`, {
            method: 'GET',
            credentials: 'include',
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Supplier details loaded:', data);
        
        // Hide loading and show content
        document.getElementById('supplier-loading').classList.add('hidden');
        document.getElementById('supplier-content').classList.remove('hidden');
        
        // Populate supplier data
        populateSupplierData(data.data || data);
        
    } catch (error) {
        console.error('Error loading supplier details:', error);
        
        // Hide loading and show error
        document.getElementById('supplier-loading').classList.add('hidden');
        document.getElementById('supplier-error').classList.remove('hidden');
        document.getElementById('error-message').textContent = error.message;
    }
}

function populateSupplierData(supplier) {
    // Company Info
    document.getElementById('supplier-name').textContent = supplier.name || supplier.company_name || '未提供';
    document.getElementById('supplier-code').textContent = supplier.code || supplier.supplier_code || '未提供';
    document.getElementById('supplier-type').textContent = getSupplierTypeText(supplier.type) || '一般供應商';
    document.getElementById('supplier-description').textContent = supplier.description || '無描述';
    
    // Contact Info
    document.getElementById('supplier-contact-person').textContent = supplier.contact_person || '未提供';
    document.getElementById('supplier-email').textContent = supplier.email || supplier.contact_email || '未提供';
    document.getElementById('supplier-phone').textContent = supplier.phone || supplier.contact_phone || '未提供';
    document.getElementById('supplier-address').textContent = supplier.address || '未提供';
    
    // Business Info
    document.getElementById('supplier-payment-terms').textContent = supplier.payment_terms || '現金';
    document.getElementById('supplier-credit-limit').textContent = supplier.credit_limit ? `NT$ ${parseFloat(supplier.credit_limit).toLocaleString()}` : '無限制';
    
    // Status
    const statusElement = document.getElementById('supplier-status');
    statusElement.textContent = getStatusText(supplier.status);
    statusElement.className = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + getStatusBadgeClass(supplier.status);
    
    // Created at
    document.getElementById('supplier-created-at').textContent = supplier.created_at ? 
        new Date(supplier.created_at).toLocaleDateString('zh-TW') : '未提供';
}

// Get auth token - same as in index.blade.php
function getAuthToken() {
    const user = getUserFromSession();
    if (user) {
        return btoa(unescape(encodeURIComponent(JSON.stringify({
            user_id: user.id || 1191,
            email: user.email || 'test@example.com',
            name: user.name || 'Test User',
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        }))));
    }
    return '';
}

function getUserFromSession() {
    return {
        id: 1191,
        email: 'test@example.com',
        name: 'Test User'
    };
}

// Helper functions - same as in index.blade.php
function getStatusBadgeClass(status) {
    switch(status) {
        case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'active': return '啟用';
        case 'inactive': return '停用';
        case 'pending': return '待審核';
        default: return '未知';
    }
}

function getSupplierTypeText(type) {
    switch(type) {
        case 'manufacturer': return '製造商';
        case 'distributor': return '經銷商';
        case 'wholesaler': return '批發商';
        case 'service': return '服務商';
        default: return '一般供應商';
    }
}
</script>
@endpush
@endsection