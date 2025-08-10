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

<!-- Light theme overrides for Marketplace homepage -->
<style>
:root.light-theme,
html[data-theme="light"],
body[data-theme="light"] {
    --nexus-primary-bg: #f5f7fb;      /* 舒適淡灰底 */
    --nexus-secondary-bg: #eef2f7;    /* 區塊底色 */
    --nexus-card-bg: #ffffff;         /* 卡片白底 */
    --nexus-text-primary: #0f172a;    /* 文字主色 */
    --nexus-text-secondary: #334155;  /* 次要文字 */
    --nexus-text-muted: #64748b;      /* 淡化文字 */
    --nexus-accent-purple: #7c3aed;
    --nexus-accent-blue: #2563eb;
    --nexus-accent-green: #059669;
    --nexus-accent-orange: #f59e0b;
    --nexus-accent-red: #dc2626;
    --nexus-border-primary: #cbd5e1;  /* 邊框顏色 */
}

/* 淺色主題下具體元件背景與邊框 */
html[data-theme="light"] body,
body[data-theme="light"] { background-color: var(--nexus-primary-bg); color: var(--nexus-text-primary); }
html[data-theme="light"] .nx-card,
body[data-theme="light"] .nx-card { background: var(--nexus-card-bg); border: 1px solid var(--nexus-border-primary); }
html[data-theme="light"] .nx-input,
body[data-theme="light"] .nx-input,
html[data-theme="light"] .nx-select,
body[data-theme="light"] .nx-select { background: #ffffff; color: var(--nexus-text-primary); border-color: var(--nexus-border-primary); }
html[data-theme="light"] .nx-btn-secondary,
body[data-theme="light"] .nx-btn-secondary { background: #f1f5f9; color: var(--nexus-text-primary); border-color: var(--nexus-border-primary); }
html[data-theme="light"] .nx-btn-secondary:hover,
body[data-theme="light"] .nx-btn-secondary:hover { background: #e2e8f0; }

/* 頁面頂部內容容器（你截圖中的上方區塊） */
html[data-theme="light"] .min-h-screen > .nx-card.border-b,
body[data-theme="light"] .min-h-screen > .nx-card.border-b { 
    background: linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.92) 60%, rgba(245,247,251,0.96) 100%);
    border-color: var(--nexus-border-primary) !important;
}

/* 深色主題 Banner 背景（修正目前過亮問題） */
html[data-theme="dark"] .min-h-screen > .nx-card.border-b,
body[data-theme="dark"] .min-h-screen > .nx-card.border-b,
:root.dark-theme .min-h-screen > .nx-card.border-b {
    background:
      radial-gradient(700px 280px at 15% 0%, rgba(99,102,241,0.14), transparent 60%),
      radial-gradient(600px 240px at 85% 40%, rgba(14,165,233,0.12), transparent 55%),
      linear-gradient(135deg, rgba(17,24,39,0.92) 0%, rgba(31,41,55,0.88) 50%, rgba(2,6,23,0.94) 100%);
    border-color: #334155 !important;
}
 
/* 右側主列表外層背景過深問題 */
html[data-theme="light"] .container,
body[data-theme="light"] .container { background: transparent; }
html[data-theme="light"] .container > .flex > .lg\:w-3\/4,
body[data-theme="light"] .container > .flex > .lg\:w-3\/4 { background: transparent; }
</style>

<style>
/* 保護 Banner/標題列水平排列不換行 */
.marketplace-hero-row{display:flex!important;flex-direction:row!important;align-items:center!important;flex-wrap:nowrap!important}
</style>

<div class="min-h-screen" style="background-color: var(--nexus-primary-bg);">
    <!-- 頁面標題區域 -->
    <div class="nx-card border-b" style="border-color: var(--nexus-border-primary);">
        <div class="container mx-auto px-4 py-6">
            <div class="flex justify-between items-start md:items-center marketplace-hero-row">
                <div>
                    <!-- 麵包屑 -->
                    <nav class="text-xs mb-2" aria-label="Breadcrumb" style="color: var(--nexus-text-secondary);">
                        <ol class="inline-flex items-center space-x-1">
                            <li><a href="/marketplace" class="hover:underline" style="color: var(--nexus-text-secondary);">市集</a></li>
                            <li>/</li>
                            <li class="text-xs" style="color: var(--nexus-text-primary);">商品列表</li>
                        </ol>
                    </nav>
                    <h1 class="text-3xl font-bold" style="color: var(--nexus-text-primary);">NexusERP 市集</h1>
                    <p class="mt-2" style="color: var(--nexus-text-secondary);">尋找好貨，也能賣好貨！直接從 ERP 一鍵上架到市集，庫存與訂單集中管理。</p>
                    <div class="mt-3 flex items-center space-x-2">
                        <span class="text-xs px-2 py-1 rounded" style="background: var(--nexus-accent-orange); color: #fff;">DEMO</span>
                        <span class="text-xs" style="color: var(--nexus-text-secondary);">此頁為展示用途，所有下單/付款/提交操作已停用</span>
                    </div>
                </div>
                <div class="mt-4 md:mt-0">
                    <div class="flex items-center text-sm gap-4" style="color: var(--nexus-text-secondary);">
                        <a href="/marketplace/cart" class="relative inline-flex items-center nx-btn nx-btn-secondary" title="前往購物車">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mr-2">
                                <path d="M2.25 3a.75.75 0 000 1.5h1.386c.17 0 .32.114.36.28l.334 1.337 1.574 6.291A2.25 2.25 0 008.089 14.5H16.5a2.25 2.25 0 002.197-1.72l1.18-4.72A.75.75 0 0019.156 7H6.223l-.24-.96A1.875 1.875 0 004.636 4.5H2.25z" />
                                <path d="M8.25 20.25a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.75 20.25a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                            </svg>
                            購物車
                            <span id="nx-cart-count" class="absolute -top-2 -right-2 hidden text-xs px-1.5 py-0.5 rounded-full" style="background: var(--nexus-accent-red); color:#fff;">0</span>
                        </a>
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
                <!-- 最近瀏覽 -->
                <div id="recent-viewed-section" class="nx-card p-4 mb-6 hidden">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-md font-semibold" style="color: var(--nexus-text-primary);">最近瀏覽</h3>
                        <button class="text-xs" style="color: var(--nexus-text-secondary);" onclick="localStorage.removeItem('nx_recent_products'); document.getElementById('recent-viewed-section').classList.add('hidden');">清除</button>
                    </div>
                    <div id="recent-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"></div>
                </div>

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
                <div>
                    <nav id="product-detail-breadcrumb" class="text-xs mb-1" aria-label="Breadcrumb" style="color: var(--nexus-text-secondary);"></nav>
                    <h3 id="product-detail-title" class="text-xl font-semibold" style="color: var(--nexus-text-primary);">產品詳情</h3>
                </div>
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

<script src="{{ asset('js/components/marketplace/Cart.js') }}"></script>
<script src="{{ asset('js/components/marketplace/ProductBrowser.js') }}"></script>
<script>
document.addEventListener('DOMContentLoaded', ()=>{
  demoCart.updateBadge('nx-cart-count');
});
</script>
@endsection