@extends('layouts.app')

@section('title', '銷售訂單')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">銷售訂單</h1>
            <p class="text-gray-600 dark:text-gray-400">管理您的銷售訂單</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('orders.sales.create') }}" 
               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                建立銷售訂單
            </a>
        </div>
    </div>

    <!-- Sales Orders Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">銷售訂單列表</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">訂單編號</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">客戶名稱</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">訂單日期</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">訂單狀態</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">訂單總額</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">操作功能</th>
                    </tr>
                </thead>
                <tbody id="salesOrdersTable" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <!-- 載入中狀態 -->
                    <tr id="loadingRow">
                        <td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            <div class="flex items-center justify-center space-x-2">
                                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                <span>正在載入銷售訂單...</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    loadSalesOrders();
});

async function loadSalesOrders() {
    try {
        const response = await fetch('/api/sales-orders', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            displaySalesOrders(result.data);
        } else {
            throw new Error(result.message || '載入銷售訂單失敗');
        }
    } catch (error) {
        console.error('Error loading sales orders:', error);
        displayError('載入銷售訂單失敗: ' + error.message);
    }
}

function displaySalesOrders(orders) {
    const tbody = document.getElementById('salesOrdersTable');
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div class="flex flex-col items-center space-y-2">
                        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span>尚無銷售訂單</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                ${order.order_number || order.id}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                ${order.customer_name || '未知客戶'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                ${formatDate(order.order_date)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${getStatusBadge(order.status)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                $${parseFloat(order.total_amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <a href="/orders/sales/${order.id}" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900">檢視詳情</a>
                <a href="/orders/sales/${order.id}/edit" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900">修改訂單</a>
                ${order.status === 'processing' ? `<a href="/orders/sales/${order.id}/ship" class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900">訂單出貨</a>` : ''}
            </td>
        </tr>
    `).join('');
}

function displayError(message) {
    const tbody = document.getElementById('salesOrdersTable');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-8 text-center text-red-500 dark:text-red-400">
                <div class="flex flex-col items-center space-y-2">
                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>${message}</span>
                    <button onclick="loadSalesOrders()" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">重新載入</button>
                </div>
            </td>
        </tr>
    `;
}

function getStatusBadge(status) {
    const statusConfig = {
        'draft': { class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', text: '草稿' },
        'processing': { class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: '處理中' },
        'shipped': { class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white', text: '已出貨' },
        'completed': { class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: '已完成' },
        'cancelled': { class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: '已取消' }
    };
    
    const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-800', text: status };
    
    return `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.class}">${config.text}</span>`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
}
</script>
@endsection