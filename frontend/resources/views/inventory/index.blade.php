@extends('layouts.app')

@section('title', '庫存管理')

@push('styles')
<style>
    .inventory-card {
        transition: all 0.2s ease-in-out;
    }
    .inventory-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--nexus-shadow-lg);
    }
    .status-badge {
        @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
    }
    .status-in-stock {
        background-color: rgba(34, 197, 94, 0.1);
        color: var(--nexus-accent-green);
    }
    .status-low-stock {
        background-color: rgba(245, 158, 11, 0.1);
        color: var(--nexus-accent-orange);
    }
    .status-out-of-stock {
        background-color: rgba(239, 68, 68, 0.1);
        color: var(--nexus-accent-red);
    }
    .status-excess-stock {
        background-color: rgba(59, 130, 246, 0.1);
        color: var(--nexus-accent-blue);
    }
</style>
@endpush

@section('content')
<div class="min-h-screen nexus-bg-primary py-6">
    <div class="container mx-auto px-4">
        <!-- Header Section -->
        <div class="nexus-card mb-6">
            <div class="p-6 border-b nexus-border-primary">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold nexus-text-primary">庫存管理</h1>
                        <p class="nexus-text-secondary mt-2">管理和監控所有產品庫存狀況</p>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="importInventory()" 
                                class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                            <span>匯入庫存</span>
                        </button>
                        <button onclick="exportInventory()" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>匯出</span>
                        </button>
                        <a href="{{ route('inventory.alerts') }}" 
                           class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span>庫存警報</span>
                        </a>
                    </div>
                </div>
                
                <!-- Search and Filter Bar -->
                <div class="mt-6 flex flex-col md:flex-row gap-4">
                    <div class="flex-1">
                        <div class="relative">
                            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 nexus-text-muted w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" 
                                   id="searchInput" 
                                   placeholder="搜尋商品 (名稱、SKU、類別...)" 
                                   class="nexus-input pl-10 pr-4 py-2 w-full">
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <select id="warehouseFilter" 
                                class="nexus-input px-3 py-2">
                            <option value="">所有倉庫</option>
                            <option value="main">主倉庫</option>
                            <option value="backup">備用倉庫</option>
                            <option value="transit">在途倉庫</option>
                        </select>
                        <select id="categoryFilter" 
                                class="nexus-input px-3 py-2">
                            <option value="">所有分類</option>
                            <option value="electronics">電子產品</option>
                            <option value="clothing">服飾</option>
                            <option value="food">食品</option>
                            <option value="books">書籍</option>
                        </select>
                        <select id="statusFilter" 
                                class="nexus-input px-3 py-2">
                            <option value="">所有狀態</option>
                            <option value="in-stock">有庫存</option>
                            <option value="low-stock">低庫存</option>
                            <option value="out-of-stock">無庫存</option>
                            <option value="excess-stock">超量庫存</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="nexus-card">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: rgba(59, 130, 246, 0.1);">
                        <svg class="w-6 h-6" style="color: var(--nexus-accent-blue);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium nexus-text-secondary">總產品數</p>
                        <p id="totalProducts" class="text-2xl font-bold nexus-text-primary">-</p>
                    </div>
                </div>
            </div>
            
            <div class="nexus-card">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: rgba(34, 197, 94, 0.1);">
                        <svg class="w-6 h-6" style="color: var(--nexus-accent-green);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium nexus-text-secondary">有庫存</p>
                        <p id="inStockProducts" class="text-2xl font-bold nexus-text-primary">-</p>
                    </div>
                </div>
            </div>
            
            <div class="nexus-card">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: rgba(245, 158, 11, 0.1);">
                        <svg class="w-6 h-6" style="color: var(--nexus-accent-orange);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium nexus-text-secondary">低庫存</p>
                        <p id="lowStockProducts" class="text-2xl font-bold nexus-text-primary">-</p>
                    </div>
                </div>
            </div>
            
            <div class="nexus-card">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: rgba(139, 92, 246, 0.1);">
                        <svg class="w-6 h-6" style="color: var(--nexus-accent-purple);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium nexus-text-secondary">庫存總價值</p>
                        <p id="totalValue" class="text-2xl font-bold nexus-text-primary">-</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <a href="{{ route('inventory.levels') }}" class="nexus-card hover:nexus-shadow-xl transition-shadow">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: rgba(99, 102, 241, 0.1);">
                        <svg class="w-5 h-5" style="color: var(--nexus-accent-blue);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium nexus-text-primary">庫存水準</h3>
                        <p class="text-xs nexus-text-secondary">查看詳細庫存水準</p>
                    </div>
                </div>
            </a>

            <a href="{{ route('inventory.transactions') }}" class="nexus-card hover:nexus-shadow-xl transition-shadow">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: rgba(34, 197, 94, 0.1);">
                        <svg class="w-5 h-5" style="color: var(--nexus-accent-green);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium nexus-text-primary">庫存異動</h3>
                        <p class="text-xs nexus-text-secondary">查看庫存異動記錄</p>
                    </div>
                </div>
            </a>

            <a href="{{ route('stocktaking.index') }}" class="nexus-card hover:nexus-shadow-xl transition-shadow">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: rgba(245, 158, 11, 0.1);">
                        <svg class="w-5 h-5" style="color: var(--nexus-accent-orange);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v1m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v14a2 2 0 002 2h2a2 2 0 002-2v-5" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium nexus-text-primary">盤點作業</h3>
                        <p class="text-xs nexus-text-secondary">執行庫存盤點</p>
                    </div>
                </div>
            </a>
        </div>

        <!-- Inventory List -->
        <div class="nexus-card">
            <div class="p-6 border-b nexus-border-primary">
                <div class="flex justify-between items-center">
                    <h2 class="text-xl font-semibold nexus-text-primary">庫存列表</h2>
                    <div class="flex items-center space-x-3">
                        <button id="toggleView" 
                                class="p-2 nexus-text-secondary hover:nexus-text-primary transition-colors">
                            <svg id="gridIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <svg id="listIcon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </button>
                        <span id="resultsCount" class="text-sm nexus-text-secondary">載入中...</span>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div id="loadingState" class="p-8 text-center">
                <div class="inline-flex items-center nexus-text-primary">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5" style="color: var(--nexus-accent-blue);" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    載入庫存資料中...
                </div>
            </div>

            <!-- Grid View -->
            <div id="gridView" class="p-6 hidden">
                <div id="inventoryGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Inventory cards will be populated here -->
                </div>
            </div>

            <!-- Table View -->
            <div id="tableView" class="hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="nexus-bg-secondary">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium nexus-text-secondary uppercase tracking-wider">產品</th>
                                <th class="px-6 py-3 text-left text-xs font-medium nexus-text-secondary uppercase tracking-wider">SKU</th>
                                <th class="px-6 py-3 text-left text-xs font-medium nexus-text-secondary uppercase tracking-wider">分類</th>
                                <th class="px-6 py-3 text-left text-xs font-medium nexus-text-secondary uppercase tracking-wider">倉庫</th>
                                <th class="px-6 py-3 text-left text-xs font-medium nexus-text-secondary uppercase tracking-wider">現有庫存</th>
                                <th class="px-6 py-3 text-left text-xs font-medium nexus-text-secondary uppercase tracking-wider">安全庫存</th>
                                <th class="px-6 py-3 text-left text-xs font-medium nexus-text-secondary uppercase tracking-wider">狀態</th>
                                <th class="px-6 py-3 text-left text-xs font-medium nexus-text-secondary uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryTable" class="nexus-bg-tertiary divide-y nexus-border-primary">
                            <!-- Inventory rows will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Empty State -->
            <div id="emptyState" class="p-8 text-center hidden">
                <svg class="mx-auto h-12 w-12 nexus-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                </svg>
                <h3 class="mt-2 text-sm font-medium nexus-text-primary">暫無庫存資料</h3>
                <p class="mt-1 text-sm nexus-text-secondary">請等待系統載入庫存資訊</p>
            </div>

            <!-- Pagination -->
            <div id="pagination" class="px-6 py-3 border-t nexus-border-primary hidden">
                <div class="flex items-center justify-between">
                    <div class="flex-1 flex justify-between sm:hidden">
                        <button id="prevPageMobile" class="relative inline-flex items-center px-4 py-2 border nexus-border-primary text-sm font-medium rounded-md nexus-text-primary nexus-bg-secondary hover:nexus-bg-tertiary">
                            上一頁
                        </button>
                        <button id="nextPageMobile" class="ml-3 relative inline-flex items-center px-4 py-2 border nexus-border-primary text-sm font-medium rounded-md nexus-text-primary nexus-bg-secondary hover:nexus-bg-tertiary">
                            下一頁
                        </button>
                    </div>
                    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p class="text-sm nexus-text-primary">
                                顯示第 <span id="pageStart" class="font-medium">1</span> 到 <span id="pageEnd" class="font-medium">10</span> 筆，
                                共 <span id="pageTotal" class="font-medium">0</span> 筆結果
                            </p>
                        </div>
                        <div>
                            <nav id="pageNumbers" class="relative z-0 inline-flex rounded-md nexus-shadow-sm -space-x-px" aria-label="Pagination">
                                <!-- Page numbers will be populated here -->
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Inventory Detail Modal -->
<div id="inventoryModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
    <div class="relative top-20 mx-auto p-5 border nexus-border-primary w-11/12 md:w-3/4 lg:w-1/2 nexus-shadow-lg rounded-md nexus-bg-tertiary">
        <div class="mt-3">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium nexus-text-primary" id="modalTitle">產品庫存詳細資訊</h3>
                <button onclick="closeModal()" class="nexus-text-muted hover:nexus-text-primary">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div id="modalContent" class="nexus-text-secondary">
                <!-- Modal content will be populated here -->
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="{{ asset('js/components/inventory/InventoryManagement.js') }}"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    window.inventoryManager = new InventoryManagement();
});
</script>
@endpush