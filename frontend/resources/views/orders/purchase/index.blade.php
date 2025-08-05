@extends('layouts.app')

@section('title', '採購訂單')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">採購訂單</h1>
            <p class="text-gray-600 dark:text-gray-400">管理您的採購訂單</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('orders.purchase.create') }}" 
               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                建立採購訂單
            </a>
        </div>
    </div>

    <!-- Purchase Orders Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">採購訂單列表</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">訂單編號</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">供應商</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">日期</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">狀態</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">總計</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">預期交貨</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody id="purchase-orders-tbody" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <!-- 載入中狀態 -->
                    <tr id="loading-row">
                        <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            <div class="flex items-center justify-center">
                                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                載入採購訂單...
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection

<script>
document.addEventListener('DOMContentLoaded', function() {
    loadPurchaseOrders();
    
    function loadPurchaseOrders() {
        fetch('/api/purchase-orders')
            .then(response => response.json())
            .then(data => {
                const tbody = document.getElementById('purchase-orders-tbody');
                const loadingRow = document.getElementById('loading-row');
                
                if (loadingRow) {
                    loadingRow.remove();
                }
                
                // 處理分頁格式的數據
                const orders = data.data && data.data.data ? data.data.data : (data.data || []);
                
                if (data.success && orders && orders.length > 0) {
                    tbody.innerHTML = '';
                    
                    orders.forEach(order => {
                        const row = createOrderRow(order);
                        tbody.appendChild(row);
                    });
                } else {
                    // 沒有資料時顯示空狀態
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                <div class="text-center">
                                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                    </svg>
                                    <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">尚無採購訂單</h3>
                                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">開始創建您的第一個採購訂單。</p>
                                    <div class="mt-6">
                                        <a href="{{ route('orders.purchase.create') }}" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                            建立採購訂單
                                        </a>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            })
            .catch(error => {
                console.error('載入採購訂單失敗:', error);
                const tbody = document.getElementById('purchase-orders-tbody');
                const loadingRow = document.getElementById('loading-row');
                
                if (loadingRow) {
                    loadingRow.remove();
                }
                
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-6 py-8 text-center text-red-500 dark:text-red-400">
                            載入採購訂單時發生錯誤，請重新整理頁面或稍後再試。
                        </td>
                    </tr>
                `;
            });
    }
    
    function createOrderRow(order) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';
        
        // 狀態樣式映射
        const statusStyles = {
            'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
            'pending_approval': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white',
            'approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'partially_received': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            'received': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
            'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
        
        // 狀態中文對照
        const statusLabels = {
            'draft': '草稿',
            'pending_approval': '待核准',
            'approved': '已核准',
            'partially_received': '部分收貨',
            'received': '已完成',
            'cancelled': '已取消'
        };
        
        const statusClass = statusStyles[order.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        const statusLabel = statusLabels[order.status] || order.status;
        
        // 格式化日期
        const orderDate = new Date(order.order_date).toLocaleDateString('zh-TW');
        const deliveryDate = order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString('zh-TW') : '-';
        
        // 格式化金額
        const totalAmount = order.total_amount ? `$${parseFloat(order.total_amount).toFixed(2)}` : '-';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${order.po_number || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${order.supplier ? order.supplier.name : '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${orderDate}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                    ${statusLabel}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${totalAmount}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${deliveryDate}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <a href="/orders/purchase/${order.id}" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">檢視</a>
                ${canEdit(order.status) ? `<a href="/orders/purchase/${order.id}/edit" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">編輯</a>` : ''}
                ${canDelete(order.status) ? `<button onclick="deleteOrder(${order.id}, '${order.po_number}')" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">刪除</button>` : ''}
            </td>
        `;
        
        return row;
    }

    // 檢查是否可以編輯
    function canEdit(status) {
        return ['draft', 'pending_approval'].includes(status);
    }

    // 檢查是否可以刪除
    function canDelete(status) {
        return ['draft', 'cancelled'].includes(status);
    }

});

// 刪除採購訂單 - 全域函數
function deleteOrder(orderId, poNumber) {
    if (confirm(`確定要刪除採購訂單 ${poNumber} 嗎？此操作無法復原。`)) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/orders/purchase/${orderId}`;
        
        const methodInput = document.createElement('input');
        methodInput.type = 'hidden';
        methodInput.name = '_method';
        methodInput.value = 'DELETE';
        
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = '_token';
        tokenInput.value = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        form.appendChild(methodInput);
        form.appendChild(tokenInput);
        document.body.appendChild(form);
        form.submit();
    }
}
</script>