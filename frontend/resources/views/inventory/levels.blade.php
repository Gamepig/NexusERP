@extends('layouts.app')

@section('title', '庫存水準')

@section('content')
<div class="p-6">
    {{-- 表格工具列 --}}
    <div class="flex justify-between items-center mb-4">
        <div class="flex space-x-2">
            <button type="button" class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700" id="refresh-levels">
                <i class="fas fa-sync-alt mr-2"></i>重新整理
            </button>
            <button type="button" class="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700" id="bulk-edit">
                <i class="fas fa-edit mr-2"></i>批次編輯
            </button>
            <button type="button" class="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700" id="print-levels">
                <i class="fas fa-print mr-2"></i>列印
            </button>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-300">
            顯示 <span id="showing-count">0</span> / <span id="total-count">0</span> 項
        </div>
    </div>

    {{-- 主要表格 --}}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700" id="inventory-levels-table">
            <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th scope="col" class="w-10 px-6 py-3">
                        <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" id="select-all-levels">
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sortable" data-sort="sku">
                        SKU
                        <i class="fas fa-sort ml-1"></i>
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sortable" data-sort="name">
                        產品名稱
                        <i class="fas fa-sort ml-1"></i>
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sortable" data-sort="category">
                        類別
                        <i class="fas fa-sort ml-1"></i>
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sortable" data-sort="location">
                        倉庫位置
                        <i class="fas fa-sort ml-1"></i>
                    </th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sortable" data-sort="quantity">
                        現有數量
                        <i class="fas fa-sort ml-1"></i>
                    </th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sortable" data-sort="reserved">
                        保留數量
                        <i class="fas fa-sort ml-1"></i>
                    </th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sortable" data-sort="available">
                        可用數量
                        <i class="fas fa-sort ml-1"></i>
                    </th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">狀態</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">操作</th>
                </tr>
            </thead>
            <tbody id="inventory-levels-tbody" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {{-- 資料將由 JavaScript 動態填充 --}}
            </tbody>
        </table>
    </div>

    {{-- 分頁控制 --}}
    <div class="flex justify-between items-center mt-4">
        <div class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
            <span>每頁顯示</span>
            <select class="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" id="per-page-select">
                <option value="10">10</option>
                <option value="25" selected>25</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
            <span>筆</span>
        </div>
        <nav aria-label="Inventory levels pagination">
            <div class="flex space-x-1" id="levels-pagination">
                {{-- 分頁按鈕將由 JavaScript 動態生成 --}}
            </div>
        </nav>
    </div>
</div>

{{-- 庫存編輯模態框 --}}
<div class="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 hidden items-center justify-center z-50" id="editInventoryModal">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white" id="editInventoryModalLabel">編輯庫存</h3>
            <button type="button" class="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100" data-close-modal>
                <span class="sr-only">Close</span>
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="px-6 py-4">
            <form id="edit-inventory-form" class="space-y-4">
                <input type="hidden" id="edit-inventory-id">
                <div>
                    <label for="edit-product-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">產品名稱</label>
                    <input type="text" class="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white" id="edit-product-name" readonly>
                </div>
                <div>
                    <label for="edit-sku" class="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU</label>
                    <input type="text" class="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white" id="edit-sku" readonly>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="edit-quantity" class="block text-sm font-medium text-gray-700 dark:text-gray-300">現有數量</label>
                        <input type="number" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" id="edit-quantity" min="0" required>
                    </div>
                    <div>
                        <label for="edit-reserved" class="block text-sm font-medium text-gray-700 dark:text-gray-300">保留數量</label>
                        <input type="number" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" id="edit-reserved" min="0" required>
                    </div>
                </div>
                <div>
                    <label for="edit-location" class="block text-sm font-medium text-gray-700 dark:text-gray-300">倉庫位置</label>
                    <input type="text" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" id="edit-location" required>
                </div>
                <div>
                    <label for="edit-notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">備註</label>
                    <textarea class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" id="edit-notes" rows="3"></textarea>
                </div>
            </form>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3">
            <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500" data-close-modal>取消</button>
            <button type="button" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700" id="save-inventory-changes">儲存變更</button>
        </div>
    </div>
</div>
@endsection

@push('styles')
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
<style>
    .sortable:hover {
        background-color: rgba(0, 0, 0, 0.03);
    }
    .sortable i {
        font-size: 0.8em;
        color: #6b7280;
    }
    .status-normal {
        @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800;
    }
    .status-low {
        @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800;
    }
    .status-out {
        @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800;
    }
</style>
@endpush

@push('scripts')
<script src="/js/components/common/nx-table.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    // 初始化庫存水準表格
    const levelsTable = new NXTable({
        tableId: 'inventory-levels-table',
        apiEndpoint: '/api/inventory/levels',
        pageSize: 25,
        columns: [
            {
                field: 'sku'
            },
            {
                field: 'product_name'
            },
            {
                field: 'category_name'
            },
            {
                field: 'warehouse_location'
            },
            {
                field: 'current_quantity',
                type: 'number'
            },
            {
                field: 'reserved_quantity',
                type: 'number'
            },
            {
                field: 'available_quantity',
                type: 'number'
            },
            {
                field: 'status',
                formatter: function(value) {
                    const statuses = {
                        'normal': { label: '正常', class: 'status-normal' },
                        'low': { label: '低庫存', class: 'status-low' },
                        'out': { label: '缺貨', class: 'status-out' }
                    };
                    const status = statuses[value] || { label: value, class: '' };
                    return `<span class="${status.class}">${status.label}</span>`;
                }
            },
            {
                field: 'actions',
                formatter: function(value, row) {
                    return `
                        <div class="flex space-x-2 justify-center">
                            <button type="button" class="text-blue-600 hover:text-blue-900 text-sm" 
                                    onclick="editInventory('${row.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="text-gray-600 hover:text-gray-900 text-sm" 
                                    onclick="viewHistory('${row.id}')">
                                <i class="fas fa-history"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        sortable: true,
        searchable: false,
        filterable: false,
        pageable: true,
        selectable: true,
        refreshable: true,
        exportable: true
    });

    // 綁定工具列按鈕
    document.getElementById('refresh-levels').addEventListener('click', function() {
        levelsTable.refresh();
    });

    document.getElementById('bulk-edit').addEventListener('click', function() {
        const selectedRows = levelsTable.getSelectedRows();
        if (selectedRows.length === 0) {
            alert('請先選擇要編輯的項目');
            return;
        }
        console.log('批次編輯:', selectedRows);
    });

    document.getElementById('print-levels').addEventListener('click', function() {
        window.print();
    });

    // 模態框控制
    const modal = document.getElementById('editInventoryModal');
    const closeButtons = modal.querySelectorAll('[data-close-modal]');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    });

    // 編輯庫存功能
    window.editInventory = function(inventoryId) {
        fetch(`/api/inventory/levels/${inventoryId}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('edit-inventory-id').value = data.id;
                document.getElementById('edit-product-name').value = data.product_name;
                document.getElementById('edit-sku').value = data.sku;
                document.getElementById('edit-quantity').value = data.current_quantity;
                document.getElementById('edit-reserved').value = data.reserved_quantity;
                document.getElementById('edit-location').value = data.warehouse_location;
                document.getElementById('edit-notes').value = data.notes || '';

                modal.classList.remove('hidden');
                modal.classList.add('flex');
            })
            .catch(error => {
                console.error('Error loading inventory detail:', error);
                alert('載入庫存詳情時發生錯誤');
            });
    };

    // 查看歷史功能
    window.viewHistory = function(inventoryId) {
        window.location.href = `/inventory/transactions?product_id=${inventoryId}`;
    };

    // 儲存編輯變更
    document.getElementById('save-inventory-changes').addEventListener('click', function() {
        const formData = {
            id: document.getElementById('edit-inventory-id').value,
            current_quantity: document.getElementById('edit-quantity').value,
            reserved_quantity: document.getElementById('edit-reserved').value,
            warehouse_location: document.getElementById('edit-location').value,
            notes: document.getElementById('edit-notes').value
        };

        fetch(`/api/inventory/levels/${formData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                levelsTable.refresh();
                alert('庫存資料已更新');
            } else {
                alert('更新失敗：' + (data.message || '未知錯誤'));
            }
        })
        .catch(error => {
            console.error('Error updating inventory:', error);
            alert('更新庫存時發生錯誤');
        });
    });
});
</script>
@endpush