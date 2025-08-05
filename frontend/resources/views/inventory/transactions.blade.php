@extends('layouts.app')

@section('title', '庫存交易記錄')

@section('content')
{{-- 庫存交易記錄表格視圖 --}}
<div class="p-6">
    {{-- 表格工具列 --}}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div class="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                {{-- 日期範圍選擇器 --}}
                <div class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">日期範圍：</label>
                    <div class="flex items-center space-x-2">
                        <input type="date" class="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" id="date-from" value="{{ date('Y-m-01') }}">
                        <span class="text-sm text-gray-500 dark:text-gray-400">至</span>
                        <input type="date" class="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" id="date-to" value="{{ date('Y-m-d') }}">
                    </div>
                </div>
                
                {{-- 交易類型篩選 --}}
                <select class="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" id="transaction-type-filter">
                    <option value="">所有類型</option>
                    <option value="in">入庫</option>
                    <option value="out">出庫</option>
                    <option value="adjustment">調整</option>
                    <option value="transfer">轉移</option>
                    <option value="return">退貨</option>
                </select>
                
                <button type="button" class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700" id="apply-filters">
                    <i class="fas fa-search mr-2"></i>套用篩選
                </button>
            </div>
            <div>
                <button type="button" class="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700" id="export-transactions">
                    <i class="fas fa-file-excel mr-2"></i>匯出報表
                </button>
            </div>
        </div>
    </div>

    {{-- 交易統計摘要 --}}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-sm font-medium text-green-600">總入庫</h3>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white" id="total-in">0</p>
                </div>
                <i class="fas fa-arrow-down text-green-500 text-2xl opacity-50"></i>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-sm font-medium text-red-600">總出庫</h3>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white" id="total-out">0</p>
                </div>
                <i class="fas fa-arrow-up text-red-500 text-2xl opacity-50"></i>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-sm font-medium text-yellow-600">調整數量</h3>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white" id="total-adjustment">0</p>
                </div>
                <i class="fas fa-exchange-alt text-yellow-500 text-2xl opacity-50"></i>
            </div>  
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-sm font-medium text-blue-600">交易次數</h3>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white" id="total-transactions">0</p>
                </div>
                <i class="fas fa-list-alt text-blue-500 text-2xl opacity-50"></i>
            </div>
        </div>
    </div>

    {{-- 主要表格 --}}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700" id="inventory-transactions-table">
            <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sortable" data-sort="date">
                        交易日期
                        <i class="fas fa-sort ml-1"></i>
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">交易編號</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sortable" data-sort="type">
                        類型
                        <i class="fas fa-sort ml-1"></i>
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sortable" data-sort="sku">
                        SKU
                        <i class="fas fa-sort ml-1"></i>
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">產品名稱</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">數量變化</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">之前數量</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">之後數量</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作人員</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">備註</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">詳情</th>
                </tr>
            </thead>
            <tbody id="inventory-transactions-tbody" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {{-- 資料將由 JavaScript 動態填充 --}}
            </tbody>
        </table>
    </div>

    {{-- 分頁控制 --}}
    <div class="flex justify-between items-center mt-4">
        <div class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
            <span>每頁顯示</span>
            <select class="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" id="transactions-per-page">
                <option value="10">10</option>
                <option value="25" selected>25</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
            <span>筆</span>
        </div>
        <nav aria-label="Inventory transactions pagination">
            <div class="flex space-x-1" id="transactions-pagination">
                {{-- 分頁按鈕將由 JavaScript 動態生成 --}}
            </div>
        </nav>
    </div>
</div>

{{-- 交易詳情模態框 --}}
<div class="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 hidden items-center justify-center z-50" id="transactionDetailModal">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div class="flex justify-between items-center px-6 py-4 border-b">
            <h3 class="text-lg font-medium text-gray-900" id="transactionDetailModalLabel">交易詳情</h3>
            <button type="button" class="text-gray-400 hover:text-gray-600" data-close-modal>
                <span class="sr-only">Close</span>
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="px-6 py-4">
            <div class="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <h4 class="text-sm font-medium text-gray-500 mb-3">基本資訊</h4>
                    <dl class="space-y-2">
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-700">交易編號：</dt>
                            <dd class="text-sm text-gray-900" id="detail-transaction-id">-</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-700">交易日期：</dt>
                            <dd class="text-sm text-gray-900" id="detail-date">-</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-700">交易類型：</dt>
                            <dd class="text-sm text-gray-900" id="detail-type">-</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-700">操作人員：</dt>
                            <dd class="text-sm text-gray-900" id="detail-operator">-</dd>
                        </div>
                    </dl>
                </div>
                <div>
                    <h4 class="text-sm font-medium text-gray-500 mb-3">產品資訊</h4>
                    <dl class="space-y-2">
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-700">SKU：</dt>
                            <dd class="text-sm text-gray-900" id="detail-sku">-</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-700">產品名稱：</dt>
                            <dd class="text-sm text-gray-900" id="detail-product-name">-</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-700">數量變化：</dt>
                            <dd class="text-sm text-gray-900" id="detail-quantity-change">-</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-700">單位成本：</dt>
                            <dd class="text-sm text-gray-900" id="detail-unit-cost">-</dd>
                        </div>
                    </dl>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h4 class="text-sm font-medium text-gray-500 mb-3">相關文件</h4>
                <dl class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-700">採購單號：</dt>
                        <dd class="text-sm text-gray-900" id="detail-po-number">-</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-700">銷售單號：</dt>
                        <dd class="text-sm text-gray-900" id="detail-so-number">-</dd>
                    </div>
                    <div class="flex justify-between lg:col-span-1">
                        <dt class="text-sm font-medium text-gray-700">備註：</dt>
                        <dd class="text-sm text-gray-900" id="detail-notes">-</dd>
                    </div>
                </dl>
            </div>
        </div>
        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
            <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" data-close-modal>關閉</button>
            <button type="button" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700" id="print-transaction">
                <i class="fas fa-print mr-2"></i>列印
            </button>
        </div>
    </div>
</div>
@endsection

@push('styles')
<style>
    .sortable:hover {
        background-color: rgba(0, 0, 0, 0.03);
    }
    .sortable i {
        font-size: 0.8em;
        color: #6b7280;
    }
    .transaction-type-in {
        @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800;
    }
    .transaction-type-out {
        @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800;
    }
    .transaction-type-adjustment {
        @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800;
    }
    .transaction-type-transfer {
        @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800;
    }
    .transaction-type-return {
        @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800;
    }
    .quantity-positive {
        @apply text-green-600 font-semibold;
    }
    .quantity-negative {
        @apply text-red-600 font-semibold;
    }
</style>
@endpush

@push('scripts')
<script src="/js/components/common/nx-table.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    // 初始化庫存交易記錄表格
    const transactionsTable = new NXTable({
        tableId: 'inventory-transactions-table',
        apiEndpoint: '/api/inventory/transactions',
        pageSize: 25,
        columns: [
            {
                field: 'transaction_date',
                type: 'date'
            },
            {
                field: 'transaction_number'
            },
            {
                field: 'type',
                formatter: function(value) {
                    const types = {
                        'in': { label: '入庫', class: 'transaction-type-in' },
                        'out': { label: '出庫', class: 'transaction-type-out' },
                        'adjustment': { label: '調整', class: 'transaction-type-adjustment' },
                        'transfer': { label: '轉移', class: 'transaction-type-transfer' },
                        'return': { label: '退貨', class: 'transaction-type-return' }
                    };
                    const type = types[value] || { label: value, class: '' };
                    return `<span class="${type.class}">${type.label}</span>`;
                }
            },
            {
                field: 'sku'
            },
            {
                field: 'product_name'
            },
            {
                field: 'quantity_change',
                formatter: function(value) {
                    const prefix = value > 0 ? '+' : '';
                    const className = value > 0 ? 'quantity-positive' : 'quantity-negative';
                    return `<span class="${className}">${prefix}${value}</span>`;
                }
            },
            {
                field: 'quantity_before',
                type: 'number'
            },
            {
                field: 'quantity_after',
                type: 'number'
            },
            {
                field: 'operator_name'
            },
            {
                field: 'notes'
            },
            {
                field: 'actions',
                formatter: function(value, row) {
                    return `
                        <button type="button" class="text-blue-600 hover:text-blue-900 text-sm" 
                                onclick="viewTransactionDetail('${row.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    `;
                }
            }
        ],
        sortable: true,
        searchable: false, // 使用自訂篩選器
        filterable: true,
        pageable: true,
        refreshable: true,
        exportable: true
    });

    // 綁定篩選器事件
    document.getElementById('date-from').setAttribute('data-table-filter', 'inventory-transactions-table');
    document.getElementById('date-from').setAttribute('data-filter-name', 'date_from');
    
    document.getElementById('date-to').setAttribute('data-table-filter', 'inventory-transactions-table');
    document.getElementById('date-to').setAttribute('data-filter-name', 'date_to');
    
    document.getElementById('transaction-type-filter').setAttribute('data-table-filter', 'inventory-transactions-table');
    document.getElementById('transaction-type-filter').setAttribute('data-filter-name', 'type');

    // 套用篩選按鈕
    document.getElementById('apply-filters').addEventListener('click', function() {
        transactionsTable.loadData();
        updateStatistics();
    });

    // 更新統計資料
    function updateStatistics() {
        const filters = transactionsTable.filters;
        fetch('/api/inventory/transactions/statistics?' + new URLSearchParams(filters))
            .then(response => response.json())
            .then(data => {
                document.getElementById('total-in').textContent = data.total_in || 0;
                document.getElementById('total-out').textContent = data.total_out || 0;
                document.getElementById('total-adjustment').textContent = data.total_adjustment || 0;
                document.getElementById('total-transactions').textContent = data.total_transactions || 0;
            })
            .catch(error => {
                console.error('Error loading statistics:', error);
            });
    }

    // 模態框控制
    const modal = document.getElementById('transactionDetailModal');
    const closeButtons = modal.querySelectorAll('[data-close-modal]');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    });

    // 查看交易詳情
    window.viewTransactionDetail = function(transactionId) {
        fetch(`/api/inventory/transactions/${transactionId}`)
            .then(response => response.json())
            .then(data => {
                // 填充模態框數據
                document.getElementById('detail-transaction-id').textContent = data.transaction_number || '-';
                document.getElementById('detail-date').textContent = new Date(data.transaction_date).toLocaleDateString('zh-TW') || '-';
                document.getElementById('detail-type').textContent = getTransactionTypeName(data.type) || '-';
                document.getElementById('detail-operator').textContent = data.operator_name || '-';
                document.getElementById('detail-sku').textContent = data.sku || '-';
                document.getElementById('detail-product-name').textContent = data.product_name || '-';
                document.getElementById('detail-quantity-change').textContent = (data.quantity_change > 0 ? '+' : '') + data.quantity_change || '-';
                document.getElementById('detail-unit-cost').textContent = data.unit_cost ? `$${data.unit_cost}` : '-';
                document.getElementById('detail-po-number').textContent = data.po_number || '-';
                document.getElementById('detail-so-number').textContent = data.so_number || '-';
                document.getElementById('detail-notes').textContent = data.notes || '-';

                // 顯示模態框
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            })
            .catch(error => {
                console.error('Error loading transaction detail:', error);
                alert('載入交易詳情時發生錯誤');
            });
    };

    function getTransactionTypeName(type) {
        const types = {
            'in': '入庫',
            'out': '出庫',
            'adjustment': '調整',
            'transfer': '轉移',
            'return': '退貨'
        };
        return types[type] || type;
    }

    // 初始載入統計資料
    updateStatistics();
});
</script>
@endpush