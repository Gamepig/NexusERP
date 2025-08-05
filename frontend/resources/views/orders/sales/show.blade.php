@extends('layouts.app')

@section('title', '銷售訂單詳情')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 id="orderTitle" class="text-2xl font-bold text-gray-900 dark:text-white mb-2">正在載入訂單...</h1>
            <p class="text-gray-600 dark:text-gray-400">銷售訂單詳細資料</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a id="editButton" href="{{ route('orders.sales.edit', $orderId) }}" 
               class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                修改訂單
            </a>
            <a id="shipButton" href="{{ route('orders.sales.ship', $orderId) }}" 
               class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center hidden">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                訂單出貨
            </a>
            <a href="{{ route('orders.sales.index') }}" 
               class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回列表
            </a>
        </div>
    </div>

    <!-- 錯誤或成功提醒 -->
    @if(session('error'))
        <div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">無法編輯訂單</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <p>{{ session('error') }}</p>
                    </div>
                </div>
            </div>
        </div>
    @endif

    @if(session('success'))
        <div class="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-green-800">操作成功</h3>
                    <div class="mt-2 text-sm text-green-700">
                        <p>{{ session('success') }}</p>
                    </div>
                </div>
            </div>
        </div>
    @endif

    <!-- 載入中狀態 -->
    <div id="loadingState" class="text-center py-8">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white transition ease-in-out duration-150">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            正在載入訂單詳情...
        </div>
    </div>

    <!-- 錯誤狀態 -->
    <div id="errorState" class="hidden">
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">載入失敗</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <p id="errorMessage">無法載入訂單資料，請稍後重試。</p>
                    </div>
                    <div class="mt-4">
                        <button onclick="loadOrderDetails()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">重新載入</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 訂單內容 -->
    <div id="orderContent" class="hidden">
        <!-- Order Details Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Order Information -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">訂單基本資料</h3>
                </div>
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">訂單編號:</label>
                        <p id="orderNumber" class="text-sm text-gray-900 dark:text-white font-mono">-</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客戶名稱:</label>
                        <p id="customerName" class="text-sm text-gray-900 dark:text-white">-</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客戶電郵:</label>
                        <p id="customerEmail" class="text-sm text-gray-900 dark:text-white">-</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">訂單狀態:</label>
                        <span id="orderStatus" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">-</span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">訂單日期:</label>
                        <p id="orderDate" class="text-sm text-gray-900 dark:text-white">-</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">建立者:</label>
                        <p id="createdBy" class="text-sm text-gray-900 dark:text-white">-</p>
                    </div>
                </div>
            </div>

            <!-- Order Summary -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">訂單金額摘要</h3>
                </div>
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">小計:</label>
                        <p id="subtotal" class="text-sm text-gray-900 dark:text-white">$0.00</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">稅額 (5%):</label>
                        <p id="taxAmount" class="text-sm text-gray-900 dark:text-white">$0.00</p>
                    </div>
                    <div class="pt-2 border-t border-gray-200 dark:border-gray-600">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">總計:</label>
                        <p id="totalAmount" class="text-lg font-bold text-gray-900 dark:text-white">$0.00</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Order Items -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">訂單項目明細</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">產品名稱</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">產品編號</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">數量</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">單價</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">小計</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">狀態</th>
                        </tr>
                    </thead>
                    <tbody id="orderItemsTable" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <!-- 動態載入 -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<script>
const orderId = {{ $orderId }};

document.addEventListener('DOMContentLoaded', function() {
    loadOrderDetails();
});

async function loadOrderDetails() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const orderContent = document.getElementById('orderContent');
    
    // 顯示載入狀態
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    orderContent.classList.add('hidden');
    
    try {
        const response = await fetch(`/api/sales-orders/${orderId}`, {
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
            displayOrderDetails(result.data);
        } else {
            throw new Error(result.message || '載入訂單詳情失敗');
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        displayError(error.message);
    }
}

function displayOrderDetails(order) {
    // 隱藏載入狀態，顯示內容
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.getElementById('orderContent').classList.remove('hidden');
    
    // 更新頁面標題
    document.getElementById('orderTitle').textContent = `銷售訂單 ${order.order_number || order.id}`;
    
    // 填入基本資料
    document.getElementById('orderNumber').textContent = order.order_number || `SO-${order.id}`;
    document.getElementById('customerName').textContent = order.customer_name || '未知客戶';
    document.getElementById('customerEmail').textContent = order.customer_email || '-';
    document.getElementById('orderDate').textContent = formatDate(order.order_date);
    document.getElementById('createdBy').textContent = order.created_by || '-';
    
    // 更新狀態
    const statusElement = document.getElementById('orderStatus');
    const statusInfo = getStatusInfo(order.status);
    statusElement.textContent = statusInfo.text;
    statusElement.className = `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`;
    
    // 顯示或隱藏出貨按鈕
    const shipButton = document.getElementById('shipButton');
    if (order.status === 'processing') {
        shipButton.classList.remove('hidden');
    } else {
        shipButton.classList.add('hidden');
    }
    
    // 控制修改訂單按鈕：已出貨、已完成、已取消的訂單不能修改
    const editButton = document.getElementById('editButton');
    if (order.status === 'shipped' || order.status === 'completed' || order.status === 'cancelled') {
        // 改變按鈕樣式為禁用狀態
        editButton.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
        editButton.classList.add('bg-gray-400', 'cursor-not-allowed');
        editButton.removeAttribute('href'); // 移除連結
        
        // 添加點擊事件顯示提醒
        editButton.addEventListener('click', function(event) {
            event.preventDefault();
            const statusText = {
                'shipped': '已出貨',
                'completed': '已完成',
                'cancelled': '已取消'
            }[order.status] || order.status;
            alert(`訂單狀態為「${statusText}」，不允許修改。`);
        });
        
        // 更新按鈕文字
        editButton.innerHTML = `
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/>
            </svg>
            無法修改
        `;
    } else {
        // 確保按鈕處於可用狀態
        editButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
        editButton.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        if (!editButton.getAttribute('href')) {
            editButton.setAttribute('href', `/orders/sales/${order.id}/edit`);
        }
    }
    
    // 計算金額
    const totalAmount = parseFloat(order.total_amount || 0);
    const taxRate = 0.05; // 5% 稅率
    const subtotal = totalAmount / (1 + taxRate);
    const taxAmount = totalAmount - subtotal;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('taxAmount').textContent = `$${taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('totalAmount').textContent = `$${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    // 顯示訂單項目
    displayOrderItems(order.items || []);
}

function displayOrderItems(items) {
    const tbody = document.getElementById('orderItemsTable');
    
    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    此訂單尚無項目
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                ${item.product_name || '未知產品'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                ${item.product_sku || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                ${parseFloat(item.quantity).toLocaleString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                $${parseFloat(item.unit_price).toLocaleString('en-US', {minimumFractionDigits: 2})}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                $${parseFloat(item.total_price).toLocaleString('en-US', {minimumFractionDigits: 2})}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${getItemStatusBadge(item.status)}
            </td>
        </tr>
    `).join('');
}

function displayError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('orderContent').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

function getStatusInfo(status) {
    const statusConfig = {
        'draft': { class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', text: '草稿' },
        'processing': { class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: '處理中' },
        'shipped': { class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: '已出貨' },
        'completed': { class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: '已完成' },
        'cancelled': { class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: '已取消' }
    };
    
    return statusConfig[status] || { class: 'bg-gray-100 text-gray-800', text: status };
}

function getItemStatusBadge(status) {
    const statusInfo = getStatusInfo(status);
    return `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}">${statusInfo.text}</span>`;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
}
</script>
@endsection