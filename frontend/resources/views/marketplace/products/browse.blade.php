@extends('layouts.app')

@section('title', 'NexusERP 市集')

@section('content')
<!-- 讀取風格指南配置 -->
<?php
$stylePath = public_path('style/style.json');
if (file_exists($stylePath)) {
    $style = json_decode(file_get_contents($stylePath), true);
    $colors = $style['style_guide']['colors'] ?? [];
    $components = $style['style_guide']['components'] ?? [];
} else {
    // 預設樣式配置
    $colors = [
        'primary' => ['background' => '#1f2937', 'card_background' => '#374151'],
        'text' => ['primary' => '#f9fafb', 'secondary' => '#d1d5db'],
        'accent' => ['purple' => '#8b5cf6', 'blue' => '#3b82f6', 'green' => '#10b981', 'orange' => '#f59e0b', 'red' => '#ef4444'],
        'border' => ['primary' => '#4b5563']
    ];
    $components = [
        'card' => ['default' => ['border_radius' => '8px', 'padding' => '1.5rem', 'box_shadow' => '0 4px 6px -1px rgba(0, 0, 0, 0.1)']],
        'button' => ['primary' => ['border_radius' => '6px', 'padding' => '0.75rem 1rem']]
    ];
}
?>

<style>
/* NexusERP 深色主題樣式 */
:root {
    --nexus-primary-bg: <?php echo $colors['primary']['background']; ?>;
    --nexus-secondary-bg: <?php echo $colors['primary']['secondary_background'] ?? $colors['primary']['card_background']; ?>;
    --nexus-card-bg: <?php echo $colors['primary']['card_background']; ?>;
    --nexus-text-primary: <?php echo $colors['text']['primary']; ?>;
    --nexus-text-secondary: <?php echo $colors['text']['secondary']; ?>;
    --nexus-text-muted: <?php echo $colors['text']['muted'] ?? $colors['text']['secondary']; ?>;
    --nexus-accent-purple: <?php echo $colors['accent']['purple']; ?>;
    --nexus-accent-blue: <?php echo $colors['accent']['blue']; ?>;
    --nexus-accent-green: <?php echo $colors['accent']['green']; ?>;
    --nexus-accent-orange: <?php echo $colors['accent']['orange']; ?>;
    --nexus-accent-red: <?php echo $colors['accent']['red']; ?>;
    --nexus-border-primary: <?php echo $colors['border']['primary']; ?>;
}

body {
    background-color: var(--nexus-primary-bg);
    color: var(--nexus-text-primary);
}

.nx-card {
    background: var(--nexus-card-bg);
    border: 1px solid var(--nexus-border-primary);
    border-radius: <?php echo $components['card']['default']['border_radius']; ?>;
    box-shadow: <?php echo $components['card']['default']['box_shadow']; ?>;
}

.nx-input {
    background: var(--nexus-card-bg);
    border: 1px solid var(--nexus-border-primary);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    color: var(--nexus-text-primary);
}

.nx-input:focus {
    outline: none;
    border-color: var(--nexus-accent-purple);
    box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
}

.nx-select {
    background: var(--nexus-card-bg);
    border: 1px solid var(--nexus-border-primary);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    color: var(--nexus-text-primary);
}

.nx-btn {
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    font-weight: 500;
    transition: all 0.2s;
}

.nx-btn-primary {
    background: var(--nexus-accent-blue);
    color: white;
    border: none;
}

.nx-btn-primary:hover {
    background: #2563eb;
}

.nx-btn-secondary {
    background: var(--nexus-border-primary);
    color: var(--nexus-text-primary);
    border: 1px solid var(--nexus-border-primary);
}

.nx-btn-secondary:hover {
    background: #6b7280;
}
</style>

<div class="min-h-screen" style="background-color: var(--nexus-primary-bg);">
    <!-- 頁面標題區域 -->
    <div class="nx-card border-b" style="border-color: var(--nexus-border-primary);">
        <div class="container mx-auto px-4 py-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 class="text-3xl font-bold" style="color: var(--nexus-text-primary);">NexusERP 市集</h1>
                    <p class="mt-2" style="color: var(--nexus-text-secondary);">發現優質供應商和產品</p>
                </div>
                <div class="mt-4 md:mt-0">
                    <div class="flex items-center text-sm" style="color: var(--nexus-text-secondary);">
                        <span id="total-products-count">載入中...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col lg:flex-row gap-6">
            <!-- 左側篩選區域 -->
            <div class="lg:w-1/4">
                <div class="nx-card p-6 sticky top-6">
                    <h3 class="text-lg font-medium mb-4" style="color: var(--nexus-text-primary);">篩選條件</h3>
                    
                    <!-- 搜尋 -->
                    <div class="mb-6">
                        <label for="search" class="block text-sm font-medium mb-2" style="color: var(--nexus-text-secondary);">搜尋產品</label>
                        <div class="relative">
                            <input type="text" id="search" placeholder="輸入關鍵字..." 
                                   class="w-full nx-input pl-10 pr-4 py-2">
                            <svg class="w-5 h-5 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nexus-text-secondary);">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                    </div>

                    <!-- 產品類別 -->
                    <div class="mb-6">
                        <label for="category" class="block text-sm font-medium mb-2" style="color: var(--nexus-text-secondary);">產品類別</label>
                        <select id="category" class="w-full nx-select">
                            <option value="">所有類別</option>
                            <!-- 類別選項將透過 JavaScript 動態載入 -->
                        </select>
                    </div>

                    <!-- 價格範圍 -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2" style="color: var(--nexus-text-secondary);">價格範圍</label>
                        <div class="grid grid-cols-2 gap-2">
                            <input type="number" id="price-min" placeholder="最低價" class="nx-input">
                            <input type="number" id="price-max" placeholder="最高價" class="nx-input">
                        </div>
                    </div>

                    <!-- 品牌 -->
                    <div class="mb-6">
                        <label for="brand" class="block text-sm font-medium mb-2" style="color: var(--nexus-text-secondary);">品牌</label>
                        <input type="text" id="brand" placeholder="輸入品牌名稱..." class="w-full nx-input">
                    </div>

                    <!-- 庫存狀態 -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2" style="color: var(--nexus-text-secondary);">庫存狀態</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" id="stock-in" value="in_stock" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm" style="color: var(--nexus-text-secondary);">有庫存</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" id="stock-low" value="low_stock" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm" style="color: var(--nexus-text-secondary);">庫存不足</span>
                            </label>
                        </div>
                    </div>

                    <!-- 特殊標籤 -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2" style="color: var(--nexus-text-secondary);">特殊標籤</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" id="featured" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm" style="color: var(--nexus-text-secondary);">精選產品</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" id="new-arrival" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm" style="color: var(--nexus-text-secondary);">新品上市</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" id="bestseller" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm" style="color: var(--nexus-text-secondary);">熱銷商品</span>
                            </label>
                        </div>
                    </div>

                    <!-- 重置按鈕 -->
                    <button id="reset-filters" class="w-full nx-btn nx-btn-secondary">
                        重置篩選
                    </button>
                </div>
            </div>

            <!-- 右側產品列表區域 -->
            <div class="lg:w-3/4">
                <!-- 排序和顯示選項 -->
                <div class="nx-card p-4 mb-6">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                        <div class="flex items-center space-x-4">
                            <span class="text-sm" style="color: var(--nexus-text-secondary);">排序方式:</span>
                            <select id="sort-by" class="nx-select">
                                <option value="created_at">最新上架</option>
                                <option value="price">價格低到高</option>
                                <option value="-price">價格高到低</option>
                                <option value="name">名稱 A-Z</option>
                                <option value="-name">名稱 Z-A</option>
                                <option value="view_count">最多瀏覽</option>
                            </select>
                        </div>
                        
                        <div class="flex items-center space-x-4">
                            <span class="text-sm" style="color: var(--nexus-text-secondary);">顯示:</span>
                            <select id="page-size" class="nx-select">
                                <option value="12">12 個產品</option>
                                <option value="24">24 個產品</option>
                                <option value="48">48 個產品</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Loading 狀態 -->
                <div id="loading" class="flex justify-center items-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2" style="border-color: var(--nexus-accent-purple);"></div>
                </div>

                <!-- 空狀態 -->
                <div id="empty-state" class="hidden nx-card p-12 text-center">
                    <svg class="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--nexus-text-muted);">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h3 class="mt-4 text-lg font-medium" style="color: var(--nexus-text-primary);">找不到符合條件的產品</h3>
                    <p class="mt-2 text-sm" style="color: var(--nexus-text-secondary);">請嘗試調整篩選條件或搜尋關鍵字</p>
                </div>

                <!-- 產品網格 -->
                <div id="products-grid" class="hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- 產品卡片將透過 JavaScript 動態載入 -->
                </div>

                <!-- 分頁 -->
                <div id="pagination" class="hidden mt-8 flex justify-center">
                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" id="pagination-nav">
                        <!-- 分頁按鈕將透過 JavaScript 動態產生 -->
                    </nav>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 產品詳情模態框 -->
<div id="product-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
    <div class="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md nx-card">
        <div class="mt-3">
            <!-- 模態框標題 -->
            <div class="flex justify-between items-center mb-4">
                <h3 id="product-detail-title" class="text-xl font-semibold" style="color: var(--nexus-text-primary);">產品詳情</h3>
                <button id="close-detail-modal" class="transition-colors" style="color: var(--nexus-text-secondary);" onmouseover="this.style.color='var(--nexus-text-primary)'" onmouseout="this.style.color='var(--nexus-text-secondary)'">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <!-- 產品詳情內容 -->
            <div id="product-detail-content">
                <!-- 內容將透過 JavaScript 動態載入 -->
            </div>
        </div>
    </div>
</div>

@include('partials.app-config')

<script src="{{ asset('js/components/marketplace/ProductBrowser.js') }}"></script>
@endsection