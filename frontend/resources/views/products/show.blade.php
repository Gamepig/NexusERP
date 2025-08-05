@extends('layouts.app')

@section('title', '商品詳情')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1 id="product-title" class="text-2xl font-bold text-gray-900 dark:text-white mb-2">載入中...</h1>
            <p class="text-gray-600 dark:text-gray-400">商品詳細資訊與庫存狀況</p>
        </div>
        <div class="flex space-x-3">
            <a href="{{ route('products.index') }}" 
               class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回清單
            </a>
            <a id="edit-product-link" href="#" 
               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                編輯商品
            </a>
        </div>
    </div>

    <!-- Product Information Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Product Information -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Basic Information -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">基本資訊</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">商品名稱</label>
                        <p id="product-name" class="text-gray-900 dark:text-white">--</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU 編號</label>
                        <p id="product-sku" class="text-gray-900 dark:text-white font-mono">--</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">條碼</label>
                        <p id="product-barcode" class="text-gray-900 dark:text-white font-mono">--</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">商品分類</label>
                        <p id="product-category" class="text-gray-900 dark:text-white">--</p>
                    </div>
                    
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">商品描述</label>
                        <p id="product-description" class="text-gray-600 dark:text-gray-400">--</p>
                    </div>
                </div>
            </div>

            <!-- Pricing and Inventory -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">價格與庫存</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">售價</label>
                        <p id="product-price" class="text-2xl font-bold text-green-600">--</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">成本價</label>
                        <p id="product-cost-price" class="text-lg text-gray-900 dark:text-white">--</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">毛利率</label>
                        <p id="product-margin" class="text-lg text-blue-600">--</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">現有庫存</label>
                        <p id="product-stock" class="text-2xl font-bold">--</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">計量單位</label>
                        <p id="product-unit" class="text-gray-900 dark:text-white">--</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">低庫存警告值</label>
                        <p id="product-low-stock" class="text-gray-900 dark:text-white">--</p>
                    </div>
                </div>
            </div>

            <!-- Product Specifications -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">規格資訊</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">重量</label>
                        <p id="product-weight" class="text-gray-900 dark:text-white">--</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">尺寸</label>
                        <p id="product-dimensions" class="text-gray-900 dark:text-white">--</p>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">最近活動</h3>
                
                <div id="recent-activity" class="space-y-3">
                    <div class="flex items-center justify-center py-8">
                        <div class="text-center">
                            <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <p class="text-gray-500 dark:text-gray-400">載入活動記錄中...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
            <!-- Product Image -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">商品圖片</h3>
                
                <div id="product-image-container" class="w-full h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div class="text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">載入圖片中...</p>
                    </div>
                </div>
            </div>

            <!-- Product Status -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">商品狀態</h3>
                
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-700 dark:text-gray-300">狀態</span>
                        <span id="product-status-badge" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">--</span>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-700 dark:text-gray-300">精選商品</span>
                        <span id="product-featured-badge" class="text-sm text-gray-500">--</span>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-700 dark:text-gray-300">追蹤庫存</span>
                        <span id="product-track-inventory-badge" class="text-sm text-gray-500">--</span>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">快速操作</h3>
                
                <div class="space-y-3">
                    <button id="adjust-stock-btn" type="button"
                            class="w-full text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-3 rounded-lg text-sm transition-colors duration-200">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                            </svg>
                            <span class="text-gray-900 dark:text-white">調整庫存</span>
                        </div>
                    </button>
                    
                    <button id="view-history-btn" type="button"
                            class="w-full text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-3 rounded-lg text-sm transition-colors duration-200">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span class="text-gray-900 dark:text-white">查看歷史</span>
                        </div>
                    </button>
                    
                    <button id="generate-qr-btn" type="button"
                            class="w-full text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-3 rounded-lg text-sm transition-colors duration-200">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                            </svg>
                            <span class="text-gray-900 dark:text-white">產生 QR Code</span>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Product Statistics -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">統計資訊</h3>
                
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-700 dark:text-gray-300">建立日期</span>
                        <span id="product-created-date" class="text-sm text-gray-900 dark:text-white">--</span>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-700 dark:text-gray-300">最後更新</span>
                        <span id="product-updated-date" class="text-sm text-gray-900 dark:text-white">--</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Loading Overlay -->
<div id="loading-overlay" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
        <div class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-gray-900 dark:text-white">載入商品資料...</span>
        </div>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const productId = {{ $productId ?? 'null' }};
    
    if (!productId) {
        alert('商品 ID 不存在');
        window.location.href = '/products';
        return;
    }
    
    // Load product data
    loadProductData(productId);
    
    // Quick action handlers
    document.getElementById('adjust-stock-btn').addEventListener('click', function() {
        // TODO: Implement stock adjustment modal
        alert('庫存調整功能開發中...');
    });
    
    document.getElementById('view-history-btn').addEventListener('click', function() {
        // TODO: Implement history view
        alert('歷史查看功能開發中...');
    });
    
    document.getElementById('generate-qr-btn').addEventListener('click', function() {
        // TODO: Implement QR code generation
        alert('QR Code 產生功能開發中...');
    });
    
    // Load product data
    function loadProductData(productId) {
        fetch(`/api/products/${productId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderProductData(data.data);
                    loadRecentActivity(productId);
                } else {
                    throw new Error(data.message || '載入失敗');
                }
            })
            .catch(error => {
                console.error('Error loading product:', error);
                alert('載入商品資料時發生錯誤：' + error.message);
                window.location.href = '/products';
            })
            .finally(() => {
                hideLoadingOverlay();
            });
    }
    
    // Render product data
    function renderProductData(product) {
        // Update page title and header
        document.getElementById('product-title').textContent = product.name;
        document.getElementById('edit-product-link').href = `/products/${product.id}/edit`;
        
        // Basic information
        document.getElementById('product-name').textContent = product.name || '--';
        document.getElementById('product-sku').textContent = product.sku || '--';
        document.getElementById('product-barcode').textContent = product.barcode || '--';
        document.getElementById('product-category').textContent = product.category_name || '未分類';
        document.getElementById('product-description').textContent = product.description || '無描述';
        
        // Pricing and inventory
        document.getElementById('product-price').textContent = product.price ? `NT$ ${parseFloat(product.price).toLocaleString()}` : '--';
        document.getElementById('product-cost-price').textContent = product.cost_price ? `NT$ ${parseFloat(product.cost_price).toLocaleString()}` : '--';
        
        // Calculate margin
        if (product.price && product.cost_price) {
            const margin = ((product.price - product.cost_price) / product.price * 100).toFixed(1);
            document.getElementById('product-margin').textContent = `${margin}%`;
        } else {
            document.getElementById('product-margin').textContent = '--';
        }
        
        // Stock information
        const stockElement = document.getElementById('product-stock');
        const stockQuantity = product.stock_quantity || 0;
        const lowStockThreshold = product.low_stock_threshold || 0;
        
        stockElement.textContent = stockQuantity.toString();
        if (stockQuantity <= lowStockThreshold && lowStockThreshold > 0) {
            stockElement.className = 'text-2xl font-bold text-red-600';
        } else {
            stockElement.className = 'text-2xl font-bold text-green-600';
        }
        
        document.getElementById('product-unit').textContent = product.unit_name || '--';
        document.getElementById('product-low-stock').textContent = lowStockThreshold.toString();
        
        // Specifications
        document.getElementById('product-weight').textContent = product.weight ? `${product.weight} kg` : '--';
        document.getElementById('product-dimensions').textContent = product.dimensions || '--';
        
        // Product image
        const imageContainer = document.getElementById('product-image-container');
        if (product.image_url) {
            imageContainer.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}" class="w-full h-full object-cover rounded-lg">
            `;
        } else {
            imageContainer.innerHTML = `
                <div class="text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">無商品圖片</p>
                </div>
            `;
        }
        
        // Status badges
        const statusBadge = document.getElementById('product-status-badge');
        const statusClass = getStatusBadgeClass(product.status);
        const statusText = getStatusText(product.status);
        statusBadge.className = `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`;
        statusBadge.textContent = statusText;
        
        document.getElementById('product-featured-badge').textContent = product.is_featured ? '是' : '否';
        document.getElementById('product-track-inventory-badge').textContent = product.track_inventory ? '是' : '否';
        
        // Dates
        document.getElementById('product-created-date').textContent = formatDate(product.created_at);
        document.getElementById('product-updated-date').textContent = formatDate(product.updated_at);
    }
    
    // Load recent activity
    function loadRecentActivity(productId) {
        fetch(`/api/products/${productId}/activity`)
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('recent-activity');
                
                if (data.data && data.data.length > 0) {
                    container.innerHTML = data.data.map(activity => `
                        <div class="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex-shrink-0">
                                <div class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm text-gray-900 dark:text-white">${activity.description}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">${formatDate(activity.created_at)}</p>
                            </div>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = `
                        <div class="text-center py-6">
                            <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <p class="text-gray-500 dark:text-gray-400 text-sm">暫無活動記錄</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading activity:', error);
                document.getElementById('recent-activity').innerHTML = `
                    <div class="text-center py-6">
                        <p class="text-red-500 text-sm">載入活動記錄時發生錯誤</p>
                    </div>
                `;
            });
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
    
    function formatDate(dateString) {
        if (!dateString) return '--';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
});
</script>
@endpush
@endsection