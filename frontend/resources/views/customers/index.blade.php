@extends('layouts.app')

@section('title', '客戶管理')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">客戶管理</h1>
            <p class="text-gray-600 dark:text-gray-400">管理您的客戶資訊與聯絡方式</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('customers.create') }}" 
               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                新增客戶
            </a>
        </div>
    </div>

    <!-- Search and Filter Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-1">
                <label for="search" class="sr-only">搜尋客戶</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                    <input type="text" id="search" name="search" 
                           class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                           placeholder="搜尋客戶名稱、電話或電子郵件...">
                </div>
            </div>
            <div class="flex gap-3">
                <select class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">所有類型</option>
                    <option value="individual">個人客戶</option>
                    <option value="company">企業客戶</option>
                </select>
                <select class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">所有狀態</option>
                    <option value="active">活躍</option>
                    <option value="inactive">非活躍</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Customers Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">客戶清單</h3>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500 dark:text-gray-400">共 {{ $pagination['total'] ?? 0 }} 位客戶</span>
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
                            客戶資訊
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            聯絡方式
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            類型
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            訂單數量
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            總消費
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            狀態
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            操作
                        </th>
                    </tr>
                </thead>
                <tbody id="customers-table-body" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    @if(count($customers ?? []) > 0)
                        @foreach($customers as $customer)
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <input type="checkbox" value="{{ $customer['id'] }}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 h-10 w-10">
                                        <div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                            {{ strtoupper(substr($customer['name'] ?? 'U', 0, 1)) }}
                                        </div>
                                    </div>
                                    <div class="ml-4">
                                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                                            {{ $customer['name'] ?? '未知' }}
                                        </div>
                                        <div class="text-sm text-gray-500 dark:text-gray-400">
                                            {{ $customer['company_name'] ?? '個人客戶' }}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900 dark:text-white">{{ $customer['primary_email'] ?? '無郵件' }}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">{{ $customer['primary_phone'] ?? '無電話' }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                @if(($customer['customer_type'] ?? '') === 'business')
                                    企業客戶
                                @elseif(($customer['customer_type'] ?? '') === 'organization')
                                    組織客戶
                                @else
                                    個人客戶
                                @endif
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {{ $customer['orders_count'] ?? 0 }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                NT$ {{ number_format($customer['total_spent'] ?? 0, 0) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                @if(($customer['status'] ?? '') === 'active')
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                        活躍
                                    </span>
                                @else
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        非活躍
                                    </span>
                                @endif
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div class="flex space-x-2">
                                    <a href="{{ route('customers.show', $customer['id']) }}" 
                                       class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                        查看
                                    </a>
                                    <a href="{{ route('customers.edit', $customer['id']) }}" 
                                       class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                        編輯
                                    </a>
                                    <button onclick="deleteCustomer({{ $customer['id'] }})" 
                                            class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                        刪除
                                    </button>
                                </div>
                            </td>
                        </tr>
                        @endforeach
                    @else
                        <tr>
                            <td colspan="8" class="px-6 py-12 text-center">
                                <div class="flex flex-col items-center">
                                    <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2m5-8a3 3 0 110-6 3 3 0 010 6m-5 6a3 3 0 110-6 3 3 0 010 6"/>
                                    </svg>
                                    <p class="text-gray-500 dark:text-gray-400 text-lg mb-2">
                                        @if(isset($error))
                                            {{ $error }}
                                        @else
                                            尚無客戶資料
                                        @endif
                                    </p>
                                    @if(!isset($error))
                                        <p class="text-gray-400 dark:text-gray-500 text-sm mb-4">開始新增您的第一位客戶</p>
                                        <a href="{{ route('customers.create') }}" 
                                           class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                            新增客戶
                                        </a>
                                    @endif
                                </div>
                            </td>
                        </tr>
                    @endif
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
                            顯示第 <span class="font-medium">{{ ($pagination['page'] - 1) * $pagination['page_size'] + 1 }}</span> 
                            到 <span class="font-medium">{{ min($pagination['page'] * $pagination['page_size'], $pagination['total']) }}</span> 項，
                            共 <span class="font-medium">{{ $pagination['total'] ?? 0 }}</span> 項結果
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
    // Note: Customer data is loaded server-side via CustomerController
    // No need for AJAX loading since we use server-side rendering
    
    // Initialize pagination
    const paginationData = @json($pagination ?? []);
    generatePagination(paginationData);
    
    // Search functionality with AJAX (即時搜尋)
    const searchInput = document.getElementById('search');
    if (searchInput) {
        // 設定當前搜尋值，避免重複搜尋
        searchInput.value = '{{ request("search") }}' || '';
        
        searchInput.addEventListener('input', debounce(function() {
            performAjaxSearch();
        }, 500)); // 增加延遲到 500ms
    }
    
    // Status and type filter functionality
    const statusFilter = document.querySelector('select[name="status"]');
    const typeFilter = document.querySelector('select[name="customer_type"]');
    
    if (statusFilter) {
        statusFilter.value = '{{ request("status") }}' || '';
        statusFilter.addEventListener('change', performAjaxSearch);
    }
    
    if (typeFilter) {
        typeFilter.value = '{{ request("customer_type") }}' || '';
        typeFilter.addEventListener('change', performAjaxSearch);
    }
    
    // AJAX 搜尋功能（即時搜尋）
    function performAjaxSearch() {
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        const status = statusFilter ? statusFilter.value : '';
        const customerType = typeFilter ? typeFilter.value : '';
        
        // 建立查詢參數
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (status) params.append('status', status);
        if (customerType) params.append('customer_type', customerType);
        
        // 使用 AJAX 載入結果
        fetch(`/customers?${params.toString()}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'text/html'
            }
        })
        .then(response => response.text())
        .then(html => {
            // 使用 DOMParser 解析回應
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 更新客戶表格內容
            const newTableBody = doc.querySelector('#customers-table-body');
            const currentTableBody = document.querySelector('#customers-table-body');
            if (newTableBody && currentTableBody) {
                currentTableBody.innerHTML = newTableBody.innerHTML;
            }
            
            // 更新分頁資訊
            const newPaginationInfo = doc.querySelector('.pagination-info');
            const currentPaginationInfo = document.querySelector('.pagination-info');
            if (newPaginationInfo && currentPaginationInfo) {
                currentPaginationInfo.innerHTML = newPaginationInfo.innerHTML;
            }
            
            // 更新總數顯示
            const newTotalCount = doc.querySelector('.text-sm.text-gray-500');
            const currentTotalCount = document.querySelector('.text-sm.text-gray-500');
            if (newTotalCount && currentTotalCount) {
                currentTotalCount.textContent = newTotalCount.textContent;
            }
            
            // 更新 URL 但不重新載入頁面
            const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
            window.history.pushState({}, '', newUrl);
        })
        .catch(error => {
            console.error('Search error:', error);
            // 如果 AJAX 失敗，回退到頁面重新載入
            performSearch();
        });
    }
    
    // 傳統搜尋功能（作為回退）
    function performSearch() {
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        const status = statusFilter ? statusFilter.value : '';
        const customerType = typeFilter ? typeFilter.value : '';
        
        // Build URL with search parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (status) params.append('status', status);
        if (customerType) params.append('customer_type', customerType);
        
        // Navigate to the same page with search parameters
        const currentUrl = window.location.pathname;
        const newUrl = currentUrl + (params.toString() ? '?' + params.toString() : '');
        window.location.href = newUrl;
    }
    
    // Helper function for debouncing
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
    
    // Generate pagination buttons
    function generatePagination(pagination) {
        const paginationNav = document.querySelector('nav[aria-label="分頁"]');
        if (!paginationNav || !pagination.total_pages || pagination.total_pages <= 1) {
            return;
        }
        
        const currentPage = pagination.page || 1;
        const totalPages = pagination.total_pages;
        const currentUrl = new URL(window.location);
        
        let paginationHtml = '';
        
        // Previous button
        if (currentPage > 1) {
            const prevUrl = new URL(currentUrl);
            prevUrl.searchParams.set('page', currentPage - 1);
            paginationHtml += `
                <a href="${prevUrl.href}" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span class="sr-only">上一頁</span>
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                </a>
            `;
        } else {
            paginationHtml += `
                <span class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed">
                    <span class="sr-only">上一頁</span>
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                </span>
            `;
        }
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let page = startPage; page <= endPage; page++) {
            if (page === currentPage) {
                paginationHtml += `
                    <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-900 text-sm font-medium text-blue-600 dark:text-blue-400">
                        ${page}
                    </span>
                `;
            } else {
                const pageUrl = new URL(currentUrl);
                pageUrl.searchParams.set('page', page);
                paginationHtml += `
                    <a href="${pageUrl.href}" class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        ${page}
                    </a>
                `;
            }
        }
        
        // Next button
        if (currentPage < totalPages) {
            const nextUrl = new URL(currentUrl);
            nextUrl.searchParams.set('page', currentPage + 1);
            paginationHtml += `
                <a href="${nextUrl.href}" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span class="sr-only">下一頁</span>
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                </a>
            `;
        } else {
            paginationHtml += `
                <span class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed">
                    <span class="sr-only">下一頁</span>
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                </span>
            `;
        }
        
        paginationNav.innerHTML = paginationHtml;
    }
    
    // Global functions
    window.deleteCustomer = function(id) {
        if (confirm('確定要刪除此客戶嗎？此操作無法復原。')) {
            // Create a form and submit it for proper Laravel routing
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `/customers/${id}`;
            
            // Add CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
            
            // Add method override for DELETE
            const methodInput = document.createElement('input');
            methodInput.type = 'hidden';
            methodInput.name = '_method';
            methodInput.value = 'DELETE';
            form.appendChild(methodInput);
            
            document.body.appendChild(form);
            form.submit();
        }
    };
});
</script>
@endpush
@endsection