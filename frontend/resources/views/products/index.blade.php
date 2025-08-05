@extends('layouts.app')

@section('title', '商品管理')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">商品管理</h1>
            <p class="text-gray-600 dark:text-gray-400">管理您的商品庫存與資訊</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('products.create') }}" 
               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                新增商品
            </a>
        </div>
    </div>

    <!-- Search and Filter Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-1">
                <label for="search" class="sr-only">搜尋商品</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                    <input type="text" id="search" name="search" 
                           class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                           placeholder="搜尋商品名稱、SKU 或條碼...">
                </div>
            </div>
            <div class="flex gap-3">
                <select class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">所有分類</option>
                    <option value="electronics">電子產品</option>
                    <option value="clothing">服飾配件</option>
                    <option value="home">居家用品</option>
                </select>
                <select class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">所有狀態</option>
                    <option value="active">上架中</option>
                    <option value="inactive">已下架</option>
                    <option value="out_of_stock">缺貨</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Products Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">商品清單</h3>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500 dark:text-gray-400">共 0 項商品</span>
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
                            商品資訊
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            SKU
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            分類
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            庫存
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            價格
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            狀態
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            操作
                        </th>
                    </tr>
                </thead>
                <tbody id="products-table-body" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <!-- Data will be loaded via JavaScript -->
                    <tr>
                        <td colspan="8" class="px-6 py-12 text-center">
                            <div class="flex flex-col items-center">
                                <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                </svg>
                                <p class="text-gray-500 dark:text-gray-400 text-lg mb-2">尚無商品資料</p>
                                <p class="text-gray-400 dark:text-gray-500 text-sm mb-4">開始新增您的第一個商品</p>
                                <a href="{{ route('products.create') }}" 
                                   class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                    新增商品
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
                        <p class="text-sm text-gray-700 dark:text-gray-300 pagination-info">
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
    // Initialize products table
    loadProducts();
    
    // Search functionality
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', debounce(function() {
        loadProducts();
    }, 300));
    
    // Filter functionality
    const categoryFilter = document.querySelector('select:nth-of-type(1)');
    const statusFilter = document.querySelector('select:nth-of-type(2)');
    
    categoryFilter.addEventListener('change', function() {
        loadProducts();
    });
    
    statusFilter.addEventListener('change', function() {
        loadProducts();
    });
    
    // Load products data
    function loadProducts() {
        // 收集搜尋和篩選參數
        const searchValue = document.getElementById('search').value.trim();
        const categoryFilter = document.querySelector('select:nth-of-type(1)').value;
        const statusFilter = document.querySelector('select:nth-of-type(2)').value;
        
        // 建立查詢參數
        const params = new URLSearchParams();
        if (searchValue) params.append('search', searchValue);
        if (categoryFilter) params.append('category', categoryFilter);
        if (statusFilter) params.append('status', statusFilter);
        
        const url = '/api/products' + (params.toString() ? '?' + params.toString() : '');
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const products = data.data || [];
                renderProductsTable(products);
                
                // 如果API沒有回傳分頁資訊，根據實際資料建立備用分頁資訊
                let pagination = data.pagination || {};
                if (!pagination.total && products.length > 0) {
                    pagination = {
                        total: products.length,
                        per_page: products.length,
                        current_page: 1,
                        last_page: 1
                    };
                }
                updatePagination(pagination);
            })
            .catch(error => {
                console.error('Error loading products:', error);
                showEmptyState('載入商品資料時發生錯誤');
            });
    }
    
    // Render products table
    function renderProductsTable(products) {
        const tbody = document.getElementById('products-table-body');
        
        if (products.length === 0) {
            showEmptyState();
            return;
        }
        
        tbody.innerHTML = products.map(product => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" value="${product.id}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-lg object-cover" 
                                 src="${product.image || '/images/default-product.png'}" 
                                 alt="${product.name}">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                                ${product.name}
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">
                                ${product.description || '無描述'}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${product.sku}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${product.category_name || '未分類'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <span class="${product.stock_quantity <= product.low_stock_threshold ? 'text-red-600' : 'text-green-600'}">
                        ${product.stock_quantity || 0}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    NT$ ${parseFloat(product.price || 0).toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(product.status)}">
                        ${getStatusText(product.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <a href="/products/${product.id}" 
                           class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            查看
                        </a>
                        <a href="/products/${product.id}/edit" 
                           class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            編輯
                        </a>
                        <button onclick="deleteProduct(${product.id})" 
                                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                            刪除
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    // Show empty state
    function showEmptyState(message = '尚無商品資料') {
        const tbody = document.getElementById('products-table-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center">
                        <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                        <p class="text-gray-500 dark:text-gray-400 text-lg mb-2">${message}</p>
                        ${message === '尚無商品資料' ? `
                            <p class="text-gray-400 dark:text-gray-500 text-sm mb-4">開始新增您的第一個商品</p>
                            <a href="/products/create" 
                               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                新增商品
                            </a>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Helper functions
    function getStatusBadgeClass(status) {
        switch(status) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'out_of_stock': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    }
    
    function getStatusText(status) {
        switch(status) {
            case 'active': return '上架中';
            case 'inactive': return '已下架';
            case 'out_of_stock': return '缺貨';
            default: return '未知';
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
    
    function updatePagination(pagination) {
        // 更新商品總數顯示
        const totalCountElement = document.querySelector('.text-sm.text-gray-500');
        if (totalCountElement && pagination.total !== undefined) {
            totalCountElement.textContent = `共 ${pagination.total} 項商品`;
        }
        
        // 更新分頁統計資訊
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo && pagination && pagination.total !== undefined) {
            const total = parseInt(pagination.total) || 0;
            const perPage = parseInt(pagination.per_page) || 25;
            const currentPage = parseInt(pagination.current_page) || 1;
            
            if (total > 0) {
                const startItem = ((currentPage - 1) * perPage) + 1;
                const endItem = Math.min(currentPage * perPage, total);
                paginationInfo.textContent = `顯示第 ${startItem} 到 ${endItem} 項，共 ${total} 項結果`;
            } else {
                paginationInfo.textContent = `顯示第 0 到 0 項，共 0 項結果`;
            }
        }
    }
    
    // Global functions
    window.deleteProduct = function(id) {
        if (confirm('確定要刪除此商品嗎？此操作無法復原。')) {
            fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadProducts();
                } else {
                    alert('刪除失敗：' + (data.message || '未知錯誤'));
                }
            })
            .catch(error => {
                console.error('Error deleting product:', error);
                alert('刪除時發生錯誤');
            });
        }
    };
});
</script>
@endpush
@endsection