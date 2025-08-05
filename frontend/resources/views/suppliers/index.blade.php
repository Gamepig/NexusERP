@extends('layouts.app')

@section('title', '供應商管理')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">供應商管理</h1>
            <p class="text-gray-600 dark:text-gray-400">管理您的供應商資訊與關係</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('suppliers.create') }}" 
               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                新增供應商
            </a>
        </div>
    </div>

    <!-- Search and Filter Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-1">
                <label for="search" class="sr-only">搜尋供應商</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                    <input type="text" id="search" name="search" 
                           class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                           placeholder="搜尋供應商名稱、代碼或聯絡人...">
                </div>
            </div>
            <div class="flex gap-3">
                <select class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">所有類型</option>
                    <option value="manufacturer">製造商</option>
                    <option value="distributor">經銷商</option>
                    <option value="wholesaler">批發商</option>
                    <option value="service">服務商</option>
                </select>
                <select id="status-filter" class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">所有狀態</option>
                    <option value="active">啟用</option>
                    <option value="inactive">停用</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Suppliers Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">供應商清單</h3>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500 dark:text-gray-400">共 <span id="suppliers-count">0</span> 家供應商</span>
                </div>
            </div>
        </div>
        
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            供應商資訊
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            代碼
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            類型
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            聯絡資訊
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            付款條件
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            狀態
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            操作
                        </th>
                    </tr>
                </thead>
                <tbody id="suppliers-table-body" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <!-- Data will be loaded via JavaScript -->
                    <tr>
                        <td colspan="8" class="px-6 py-12 text-center">
                            <div class="flex flex-col items-center">
                                <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                                <p class="text-gray-500 dark:text-gray-400 text-lg mb-2">尚無供應商資料</p>
                                <p class="text-gray-400 dark:text-gray-500 text-sm mb-4">開始新增您的第一家供應商</p>
                                <a href="{{ route('suppliers.create') }}" 
                                   class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                    新增供應商
                                </a>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div class="flex items-center justify-between">
                <div class="flex-1 flex justify-between sm:hidden">
                    <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        上一頁
                    </button>
                    <button class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        下一頁
                    </button>
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                            顯示第 <span class="font-medium">1</span> 到 <span class="font-medium">0</span> 項，共 <span class="font-medium">0</span> 項結果
                        </p>
                    </div>
                    <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="分頁">
                            <!-- Pagination buttons will be generated by JavaScript -->
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize suppliers table
    loadSuppliers();
    
    // Search functionality
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', debounce(function() {
        loadSuppliers();
    }, 300));
    
    // Status filter functionality
    const statusFilter = document.getElementById('status-filter');
    statusFilter.addEventListener('change', function() {
        loadSuppliers();
    });
    
    // Load suppliers data
    async function loadSuppliers() {
        try {
            // Build query parameters
            const params = new URLSearchParams();
            
            // Add search parameter
            const searchValue = document.getElementById('search').value.trim();
            if (searchValue) {
                params.append('search', searchValue);
            }
            
            // Add status filter parameter
            const statusValue = document.getElementById('status-filter').value;
            if (statusValue) {
                params.append('status', statusValue);
            }
            
            const queryString = params.toString();
            const url = `/api/suppliers${queryString ? '?' + queryString : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Suppliers loaded:', data);
            renderSuppliersTable(data.data || data || []);
            updateSuppliersCount(data.total || (data.data ? data.data.length : (Array.isArray(data) ? data.length : 0)));
        } catch (error) {
            console.error('Error loading suppliers:', error);
            showEmptyState('載入供應商資料時發生錯誤: ' + error.message);
        }
    }
    
    
    // Render suppliers table
    function renderSuppliersTable(suppliers) {
        const tbody = document.getElementById('suppliers-table-body');
        
        if (!suppliers || !Array.isArray(suppliers) || suppliers.length === 0) {
            showEmptyState('載入供應商資料時發生錯誤: suppliers.map is not a function');
            return;
        }
        
        tbody.innerHTML = suppliers.map(supplier => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" value="${supplier.id}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                                ${supplier.name || '未命名供應商'}
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">
                                ${supplier.description || '無描述'}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${supplier.code || supplier.supplier_code || '無代碼'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${getSupplierTypeText(supplier.type)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>
                        <div>${supplier.contact_person || '無聯絡人'}</div>
                        <div class="text-xs">${supplier.email || supplier.contact_email || ''}</div>
                        <div class="text-xs">${supplier.phone || supplier.contact_phone || ''}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${supplier.payment_terms || '現金'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(supplier)}">
                        ${getStatusText(supplier)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <a href="/suppliers/${supplier.id}" 
                           class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            查看
                        </a>
                        <a href="/suppliers/${supplier.id}/edit" 
                           class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            編輯
                        </a>
                        <button onclick="deleteSupplier(${supplier.id})" 
                                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                            刪除
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    // Show empty state
    function showEmptyState(message = '尚無供應商資料') {
        const tbody = document.getElementById('suppliers-table-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center">
                        <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                        <p class="text-gray-500 dark:text-gray-400 text-lg mb-2">${message}</p>
                        ${message === '尚無供應商資料' ? `
                            <p class="text-gray-400 dark:text-gray-500 text-sm mb-4">開始新增您的第一家供應商</p>
                            <a href="/suppliers/create" 
                               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                新增供應商
                            </a>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Update suppliers count
    function updateSuppliersCount(count) {
        const countElement = document.getElementById('suppliers-count');
        if (countElement) {
            countElement.textContent = count || 0;
        }
    }
    
    // Helper functions
    function getStatusBadgeClass(supplier) {
        // Use is_active field from database instead of status
        const isActive = supplier.is_active;
        if (isActive === true || isActive === 1 || isActive === '1') {
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        } else {
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    }
    
    function getStatusText(supplier) {
        // Use is_active field from database instead of status
        const isActive = supplier.is_active;
        if (isActive === true || isActive === 1 || isActive === '1') {
            return '啟用';
        } else {
            return '停用';
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
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Global functions
    window.deleteSupplier = function(id) {
        if (confirm('確定要刪除此供應商嗎？此操作無法復原。')) {
            fetch(`/api/suppliers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            })
            .then(response => {
                if (response.ok) {
                    // For 204 No Content, there's no JSON to parse
                    if (response.status === 204) {
                        loadSuppliers();
                        return;
                    }
                    // For other success responses with JSON
                    return response.json().then(data => {
                        if (data.success !== false) {
                            loadSuppliers();
                        } else {
                            alert('刪除失敗：' + (data.message || '未知錯誤'));
                        }
                    });
                } else {
                    // Handle HTTP error responses (400, 500, etc.)
                    return response.json().then(data => {
                        console.error('Delete API error:', data);
                        let errorMessage = '刪除失敗：';
                        
                        if (data.error) {
                            // Handle business logic errors (e.g., foreign key constraint)
                            if (data.error.includes('foreign key constraint')) {
                                errorMessage += '此供應商有關聯的產品資料，無法刪除。請先移除相關產品後再試。';
                            } else {
                                errorMessage += data.error;
                            }
                        } else {
                            errorMessage += `HTTP ${response.status} - ${data.message || response.statusText}`;
                        }
                        
                        alert(errorMessage);
                    }).catch(parseError => {
                        console.error('Failed to parse error response:', parseError);
                        alert(`刪除失敗：HTTP ${response.status} - ${response.statusText}`);
                    });
                }
            })
            .catch(error => {
                console.error('Error deleting supplier:', error);
                alert('刪除時發生錯誤: ' + error.message);
            });
        }
    };
});
</script>
@endpush
@endsection