@extends('layouts.app')

@section('title', '供應商產品管理')

@section('content')
<div id="supplier-dashboard" class="container mx-auto px-4 py-6">
    <style>
    /* Supplier Dashboard theme-aware cards */
    #supplier-dashboard .card { background:#ffffff; border:1px solid #e5e7eb; }
    html[data-theme="dark"] #supplier-dashboard .card,
    body.dark #supplier-dashboard .card,
    .dark-theme.dark #supplier-dashboard .card {
        background: linear-gradient(135deg, #0f172a 0%, #1f2937 55%, #111827 100%);
        border: 1px solid #334155;
    }
    html[data-theme="dark"] #supplier-dashboard .card .text-gray-900 { color:#e5e7eb; }
    html[data-theme="dark"] #supplier-dashboard .card .text-gray-600 { color:#cbd5e1; }
    html[data-theme="dark"] #supplier-dashboard .bg-gray-50 { background:#0b1220 !important; }
    html[data-theme="dark"] #supplier-dashboard thead.bg-gray-50 { background:#0b1220 !important; }
    html[data-theme="dark"] #supplier-dashboard tbody.bg-white { background:#0f172a !important; }
    html[data-theme="dark"] #supplier-dashboard .divide-gray-200 { --tw-divide-opacity:1; border-color:rgba(51,65,85,var(--tw-divide-opacity)); }
    html[data-theme="dark"] #supplier-dashboard .border-gray-200 { border-color:#334155 !important; }

    /* Modal dark theme overrides (modal is outside #supplier-dashboard) */
    html[data-theme="dark"] #product-modal .mx-auto,
    body.dark #product-modal .mx-auto,
    .dark-theme.dark #product-modal .mx-auto { background: #0f172a !important; color:#e5e7eb; border:1px solid #334155; }
    html[data-theme="dark"] #product-modal h3,
    body.dark #product-modal h3,
    .dark-theme.dark #product-modal h3,
    html[data-theme="dark"] #product-modal label,
    body.dark #product-modal label,
    .dark-theme.dark #product-modal label { color:#e5e7eb !important; }
    html[data-theme="dark"] #product-modal .text-gray-500,
    body.dark #product-modal .text-gray-500,
    .dark-theme.dark #product-modal .text-gray-500 { color:#94a3b8 !important; }
    html[data-theme="dark"] #product-modal input,
    html[data-theme="dark"] #product-modal textarea,
    html[data-theme="dark"] #product-modal select,
    body.dark #product-modal input,
    body.dark #product-modal textarea,
    body.dark #product-modal select,
    .dark-theme.dark #product-modal input,
    .dark-theme.dark #product-modal textarea,
    .dark-theme.dark #product-modal select { background:#0b1220 !important; border-color:#334155 !important; color:#e5e7eb !important; }
    html[data-theme="dark"] #product-modal input:focus,
    html[data-theme="dark"] #product-modal textarea:focus,
    html[data-theme="dark"] #product-modal select:focus,
    body.dark #product-modal input:focus,
    body.dark #product-modal textarea:focus,
    body.dark #product-modal select:focus,
    .dark-theme.dark #product-modal input:focus,
    .dark-theme.dark #product-modal textarea:focus,
    .dark-theme.dark #product-modal select:focus { outline:none; box-shadow:0 0 0 2px rgba(59,130,246,0.35); border-color:#3b82f6 !important; }
    html[data-theme="dark"] #product-modal .border-gray-300,
    body.dark #product-modal .border-gray-300,
    .dark-theme.dark #product-modal .border-gray-300 { border-color:#334155 !important; }
    html[data-theme="dark"] #product-modal .bg-white,
    body.dark #product-modal .bg-white,
    .dark-theme.dark #product-modal .bg-white { background:#0f172a !important; }
    html[data-theme="dark"] #product-modal .text-gray-900,
    body.dark #product-modal .text-gray-900,
    .dark-theme.dark #product-modal .text-gray-900 { color:#e5e7eb !important; }
    html[data-theme="dark"] #product-modal .text-gray-700,
    body.dark #product-modal .text-gray-700,
    .dark-theme.dark #product-modal .text-gray-700 { color:#cbd5e1 !important; }
    html[data-theme="dark"] #product-modal .border-dashed,
    body.dark #product-modal .border-dashed,
    .dark-theme.dark #product-modal .border-dashed { border-color:#475569 !important; background:#0b1220; }
    </style>
    <!-- 頁面標題 -->
    <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">產品管理</h1>
        <p class="text-gray-600">管理您在 NexusERP 市集的產品清單</p>
    </div>

    <!-- 統計資訊卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="card rounded-lg shadow p-6">
            <div class="flex items-center">
                <div class="p-2 rounded-full bg-blue-100">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                </div>
                <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">總產品數</p>
                    <p class="text-2xl font-semibold text-gray-900" id="total-products">-</p>
                </div>
            </div>
        </div>

        <div class="card rounded-lg shadow p-6">
            <div class="flex items-center">
                <div class="p-2 rounded-full bg-green-100">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">已上架</p>
                    <p class="text-2xl font-semibold text-gray-900" id="active-products">-</p>
                </div>
            </div>
        </div>

        <div class="card rounded-lg shadow p-6">
            <div class="flex items-center">
                <div class="p-2 rounded-full bg-yellow-100">
                    <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">待審核</p>
                    <p class="text-2xl font-semibold text-gray-900" id="pending-products">-</p>
                </div>
            </div>
        </div>

        <div class="card rounded-lg shadow p-6">
            <div class="flex items-center">
                <div class="p-2 rounded-full bg-purple-100">
                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                </div>
                <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">總瀏覽次數</p>
                    <p class="text-2xl font-semibold text-gray-900" id="total-views">-</p>
                </div>
            </div>
        </div>
    </div>

    <!-- 操作區域 -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <!-- 新增產品按鈕 -->
        <div>
            <button id="create-product-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                新增產品
            </button>
        </div>

        <!-- 篩選和搜尋區域 -->
        <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <!-- 狀態篩選 -->
            <select id="status-filter" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">所有狀態</option>
                <option value="draft">草稿</option>
                <option value="pending">待審核</option>
                <option value="approved">已上架</option>
                <option value="rejected">已拒絕</option>
                <option value="inactive">已下架</option>
            </select>

            <!-- 庫存狀態篩選 -->
            <select id="stock-filter" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">所有庫存狀態</option>
                <option value="in_stock">有庫存</option>
                <option value="low_stock">庫存不足</option>
                <option value="out_of_stock">缺貨</option>
            </select>

            <!-- 搜尋框 -->
            <div class="relative">
                <input type="text" id="search-input" placeholder="搜尋產品..." 
                       class="border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64">
                <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
        </div>
    </div>

    <!-- 產品列表 -->
    <div class="card rounded-lg shadow">
        <!-- Loading 狀態 -->
        <div id="loading-spinner" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- 空狀態 -->
        <div id="empty-state" class="hidden text-center py-12 card">
            <svg class="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900">尚無產品</h3>
            <p class="mt-2 text-sm text-gray-500">開始新增您的第一個產品到市集吧！</p>
            <button class="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                新增產品
            </button>
        </div>

        <!-- 產品表格 -->
        <div id="products-table" class="hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">產品</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">價格</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">庫存狀態</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">瀏覽次數</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新時間</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody id="products-tbody" class="bg-white divide-y divide-gray-200">
                        <!-- 產品列表將透過 JavaScript 動態載入 -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 分頁 -->
        <div id="pagination" class="hidden card px-6 py-4 border-t flex items-center justify-between">
            <div class="flex-1 flex justify-between sm:hidden">
                <button id="prev-mobile" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    上一頁
                </button>
                <button id="next-mobile" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    下一頁
                </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-gray-700">
                        顯示 <span id="page-start" class="font-medium">1</span> 到 <span id="page-end" class="font-medium">10</span> 
                        共 <span id="total-count" class="font-medium">20</span> 筆結果
                    </p>
                </div>
                <div>
                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" id="pagination-nav">
                        <!-- 分頁按鈕將透過 JavaScript 動態產生 -->
                    </nav>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 產品操作模態框 -->
<div id="product-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
            <!-- 模態框標題 -->
            <div class="flex justify-between items-center mb-4">
                <h3 id="modal-title" class="text-lg font-medium text-gray-900">新增產品</h3>
                <button id="close-modal" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <!-- 產品表單 -->
            <form id="product-form" class="space-y-4">
                <input type="hidden" id="product-id" name="id">
                
                <!-- 產品名稱 -->
                <div>
                    <label for="product-name" class="block text-sm font-medium text-gray-700">產品名稱 *</label>
                    <input type="text" id="product-name" name="name" required
                           class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>

                <!-- SKU -->
                <div>
                    <label for="product-sku" class="block text-sm font-medium text-gray-700">SKU *</label>
                    <input type="text" id="product-sku" name="sku" required
                           class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>

                <!-- 描述 -->
                <div>
                    <label for="product-description" class="block text-sm font-medium text-gray-700">產品描述</label>
                    <textarea id="product-description" name="description" rows="3"
                              class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>

                <!-- 價格和最小訂購量 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="product-price" class="block text-sm font-medium text-gray-700">價格 *</label>
                        <input type="number" id="product-price" name="price" step="0.01" min="0" required
                               class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label for="product-min-quantity" class="block text-sm font-medium text-gray-700">最小訂購量 *</label>
                        <input type="number" id="product-min-quantity" name="minimum_order_quantity" min="1" required
                               class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                </div>

                <!-- 品牌和產品類別 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="product-brand" class="block text-sm font-medium text-gray-700">品牌</label>
                        <input type="text" id="product-brand" name="brand"
                               class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label for="product-category" class="block text-sm font-medium text-gray-700">產品類別</label>
                        <select id="product-category" name="category_id"
                                class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">選擇類別</option>
                            <!-- 類別選項將透過 JavaScript 動態載入 -->
                        </select>
                    </div>
                </div>

                <!-- 庫存資訊 -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label for="product-stock-quantity" class="block text-sm font-medium text-gray-700">庫存數量</label>
                        <input type="number" id="product-stock-quantity" name="stock_quantity" min="0"
                               class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label for="product-low-stock-threshold" class="block text-sm font-medium text-gray-700">低庫存警戒值</label>
                        <input type="number" id="product-low-stock-threshold" name="low_stock_threshold" min="0"
                               class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label for="product-stock-status" class="block text-sm font-medium text-gray-700">庫存狀態</label>
                        <select id="product-stock-status" name="stock_status"
                                class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="in_stock">有庫存</option>
                            <option value="low_stock">庫存不足</option>
                            <option value="out_of_stock">缺貨</option>
                        </select>
                    </div>
                </div>

                <!-- 產品圖片上傳 -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">產品圖片</label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div class="text-center">
                            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <div class="mt-4">
                                <label for="file-upload" class="cursor-pointer">
                                    <span class="mt-2 block text-sm font-medium text-gray-900">
                                        拖放圖片或
                                        <span class="text-blue-600">點擊選擇</span>
                                    </span>
                                    <input id="file-upload" name="images" type="file" class="sr-only" multiple accept="image/*">
                                </label>
                                <p class="mt-1 text-xs text-gray-500">
                                    PNG, JPG, JPEG 格式，最大 10MB
                                </p>
                            </div>
                        </div>
                    </div>
                    <!-- 預覽區域 -->
                    <div id="image-preview" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 hidden">
                        <!-- 圖片預覽將透過 JavaScript 動態產生 -->
                    </div>
                </div>

                <!-- 表單按鈕 -->
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" id="cancel-btn" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        取消
                    </button>
                    <button type="submit" id="save-btn" class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        儲存
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

@include('partials.app-config')

<script>
// 極簡 Toast：避免 DEMO 出現阻塞式 alert 視窗
if (!window.nxToast) {
  window.nxToast = function(message, type='info') {
    let host = document.getElementById('nx-toast');
    if (!host) {
      host = document.createElement('div');
      host.id = 'nx-toast';
      host.style.position='fixed';host.style.top='16px';host.style.right='16px';
      host.style.zIndex='2147483647';host.style.display='flex';host.style.flexDirection='column';host.style.gap='8px';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    const isDark = document.documentElement.getAttribute('data-theme')==='dark' || document.body.classList.contains('dark');
    el.textContent = message; el.style.padding='10px 12px'; el.style.borderRadius='10px'; el.style.fontSize='13px'; el.style.boxShadow='0 6px 20px rgba(0,0,0,0.15)'; el.style.backdropFilter='blur(6px)';
    if (type==='success'){ el.style.background=isDark?'rgba(34,197,94,0.18)':'rgba(16,185,129,0.15)'; el.style.color=isDark?'#bbf7d0':'#065f46'; el.style.border='1px solid rgba(16,185,129,0.35)'; }
    else if (type==='error'){ el.style.background=isDark?'rgba(239,68,68,0.14)':'rgba(254,226,226,0.9)'; el.style.color=isDark?'#fecaca':'#7f1d1d'; el.style.border='1px solid rgba(239,68,68,0.35)'; }
    else { el.style.background=isDark?'rgba(99,102,241,0.18)':'rgba(99,102,241,0.12)'; el.style.color=isDark?'#c7d2fe':'#3730a3'; el.style.border='1px solid rgba(99,102,241,0.35)'; }
    host.appendChild(el);
    setTimeout(()=>{el.style.opacity='0'; el.style.transition='opacity .3s';},2200);
    setTimeout(()=>el.remove(),2600);
  }
}
</script>

<script src="{{ asset('js/components/marketplace/SupplierProductManagement.js') }}"></script>
@endsection