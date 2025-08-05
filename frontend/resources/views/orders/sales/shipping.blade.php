@extends('layouts.app')

@section('title', '銷售訂單出貨')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 id="pageTitle" class="text-2xl font-bold text-gray-900 dark:text-white mb-2">銷售訂單出貨</h1>
            <p class="text-gray-600 dark:text-gray-400">處理銷售訂單的出貨作業</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('orders.sales.show', $orderId) }}" 
               class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回訂單詳情
            </a>
        </div>
    </div>

    <!-- 載入中狀態 -->
    <div id="loadingState" class="text-center py-8">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white transition ease-in-out duration-150">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            正在載入訂單資料...
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
                        <button onclick="loadOrderData()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">重新載入</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 主要內容 -->
    <div id="shippingContent" class="hidden space-y-6">
        <!-- 訂單基本資訊 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">訂單基本資訊</h3>
            </div>
            <div class="px-6 py-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">訂單編號:</label>
                        <p id="orderNumber" class="text-sm text-gray-900 dark:text-white">-</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客戶名稱:</label>
                        <p id="customerName" class="text-sm text-gray-900 dark:text-white">-</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">訂單狀態:</label>
                        <span id="orderStatus" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">-</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 出貨項目 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">出貨項目</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">請確認每個項目的出貨數量</p>
            </div>
            <div id="shippingItemsContainer" class="px-6 py-4">
                <div id="shippingItemsList" class="space-y-4">
                    <!-- 動態載入的出貨項目 -->
                </div>
            </div>
        </div>

        <!-- 出貨表單 -->
        <form id="shippingForm" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <!-- 出貨備註 -->
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <label for="shippingNotes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">出貨備註</label>
                <textarea id="shippingNotes" name="notes" rows="3" 
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="輸入出貨相關備註..."></textarea>
            </div>

            <!-- 操作按鈕 -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    <span id="itemCountSummary">共 0 個項目待出貨</span>
                </div>
                <div class="flex space-x-3">
                    <button type="button" onclick="window.location.href='{{ route('orders.sales.show', $orderId) }}'"
                            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        取消
                    </button>
                    <button type="submit" id="shipButton"
                            class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        <span id="shipButtonText">確認出貨</span>
                        <svg id="shipButtonSpinner" class="hidden animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<!-- 出貨項目模板 -->
<template id="shippingItemTemplate">
    <div class="shipping-item border border-gray-200 dark:border-gray-600 rounded-lg p-4">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
            <!-- 產品資訊 -->
            <div class="md:col-span-2">
                <h4 class="font-medium text-gray-900 dark:text-white item-product-name">產品名稱</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 item-product-sku">產品編號</p>
            </div>

            <!-- 訂購數量 -->
            <div class="text-center">
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">訂購數量</label>
                <span class="item-ordered-qty text-lg font-medium text-gray-900 dark:text-white">0</span>
            </div>

            <!-- 可用庫存 -->
            <div class="text-center">
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">可用庫存</label>
                <span class="item-available-stock text-lg font-medium text-blue-600 dark:text-blue-400">0</span>
            </div>

            <!-- 出貨數量輸入 -->
            <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">出貨數量 <span class="text-red-500">*</span></label>
                <input type="number" 
                       class="shipping-quantity w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white" 
                       min="0" 
                       step="0.01" 
                       placeholder="0"
                       required>
                <div class="shipping-quantity-error text-red-500 text-xs mt-1 hidden"></div>
            </div>

            <!-- 狀態指示 -->
            <div class="text-center">
                <span class="item-status inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    待出貨
                </span>
            </div>
        </div>
    </div>
</template>

<script>
const orderId = {{ $orderId }};
let orderData = null;
let inventoryLevels = {};

document.addEventListener('DOMContentLoaded', function() {
    loadOrderData();
});

async function loadOrderData() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const shippingContent = document.getElementById('shippingContent');
    
    // 顯示載入狀態
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    shippingContent.classList.add('hidden');
    
    try {
        // 載入訂單資料
        const response = await fetch(`/api/sales-orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            orderData = result.data;
            
            // 檢查訂單狀態是否可以出貨
            if (!['processing', 'confirmed'].includes(orderData.status)) {
                throw new Error('此訂單狀態不允許出貨操作');
            }
            
            await loadInventoryLevels();
            displayOrderInfo();
            displayShippingItems();
            setupEventListeners();
            
            loadingState.classList.add('hidden');
            shippingContent.classList.remove('hidden');
        } else {
            throw new Error(result.message || '載入訂單資料失敗');
        }
    } catch (error) {
        console.error('Error loading order data:', error);
        displayError(error.message);
    }
}

async function loadInventoryLevels() {
    // 獲取所有產品的庫存資訊
    const productIds = orderData.items.map(item => item.product_id);
    
    for (const productId of productIds) {
        try {
            const response = await fetch(`/api/inventory/levels?product_id=${productId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`Product ${productId} inventory response:`, result);
                if (result.success && result.data.length > 0) {
                    // 使用第一個倉庫的庫存資料，支援多種字段名稱
                    const inventoryData = result.data[0];
                    const availableStock = inventoryData.quantity_available || 
                                         inventoryData.available_quantity || 
                                         inventoryData.current_quantity || 0;
                    inventoryLevels[productId] = availableStock;
                    console.log(`Product ${productId} available stock: ${availableStock}`);
                } else {
                    console.log(`No inventory data for product ${productId}`);
                    inventoryLevels[productId] = 0;
                }
            } else {
                console.error(`Failed to fetch inventory for product ${productId}, status: ${response.status}`);
                inventoryLevels[productId] = 0;
            }
        } catch (error) {
            console.warn(`Failed to load inventory for product ${productId}:`, error);
            inventoryLevels[productId] = 0;
        }
    }
}

function displayOrderInfo() {
    document.getElementById('pageTitle').textContent = `銷售訂單出貨 - ${orderData.order_number || orderData.id}`;
    document.getElementById('orderNumber').textContent = orderData.order_number || `SO-${orderData.id}`;
    document.getElementById('customerName').textContent = orderData.customer_name || '未知客戶';
    
    const statusElement = document.getElementById('orderStatus');
    const statusInfo = getStatusInfo(orderData.status);
    statusElement.textContent = statusInfo.text;
    statusElement.className = `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`;
}

function displayShippingItems() {
    const container = document.getElementById('shippingItemsList');
    const template = document.getElementById('shippingItemTemplate');
    
    container.innerHTML = '';
    
    if (!orderData.items || orderData.items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                此訂單沒有項目可以出貨
            </div>
        `;
        return;
    }
    
    orderData.items.forEach((item, index) => {
        const clone = template.content.cloneNode(true);
        
        // 填入產品資訊
        clone.querySelector('.item-product-name').textContent = item.product_name || '未知產品';
        clone.querySelector('.item-product-sku').textContent = item.product_sku || 'N/A';
        clone.querySelector('.item-ordered-qty').textContent = parseFloat(item.quantity).toLocaleString();
        
        // 填入庫存資訊
        const availableStock = inventoryLevels[item.product_id] || 0;
        clone.querySelector('.item-available-stock').textContent = availableStock.toLocaleString();
        
        // 設定出貨數量輸入
        const quantityInput = clone.querySelector('.shipping-quantity');
        quantityInput.dataset.itemId = item.id;
        quantityInput.dataset.productId = item.product_id;
        quantityInput.dataset.maxQuantity = item.quantity;
        quantityInput.dataset.availableStock = availableStock;
        quantityInput.value = item.quantity; // 預設為訂購數量
        quantityInput.max = Math.min(item.quantity, availableStock);
        
        // 如果庫存不足，顯示警告
        if (availableStock < item.quantity) {
            const stockElement = clone.querySelector('.item-available-stock');
            stockElement.classList.add('text-red-600', 'dark:text-red-400');
            stockElement.classList.remove('text-blue-600', 'dark:text-blue-400');
            
            quantityInput.value = availableStock;
        }
        
        container.appendChild(clone);
    });
    
    updateItemCountSummary();
}

function setupEventListeners() {
    // 出貨數量變更監聽
    document.addEventListener('input', function(event) {
        if (event.target.classList.contains('shipping-quantity')) {
            validateShippingQuantity(event.target);
            updateItemCountSummary();
        }
    });
    
    // 表單提交
    document.getElementById('shippingForm').addEventListener('submit', handleShipping);
}

function validateShippingQuantity(input) {
    const errorElement = input.parentElement.querySelector('.shipping-quantity-error');
    const maxQuantity = parseFloat(input.dataset.maxQuantity);
    const availableStock = parseFloat(input.dataset.availableStock);
    const quantity = parseFloat(input.value) || 0;
    
    errorElement.classList.add('hidden');
    errorElement.textContent = '';
    
    if (quantity < 0) {
        showQuantityError(input, '出貨數量不能為負數');
        return false;
    }
    
    if (quantity > maxQuantity) {
        showQuantityError(input, `出貨數量不能超過訂購數量 (${maxQuantity})`);
        return false;
    }
    
    if (quantity > availableStock) {
        showQuantityError(input, `出貨數量不能超過可用庫存 (${availableStock})`);
        return false;
    }
    
    return true;
}

function showQuantityError(input, message) {
    const errorElement = input.parentElement.querySelector('.shipping-quantity-error');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

function updateItemCountSummary() {
    const shippingInputs = document.querySelectorAll('.shipping-quantity');
    let totalItems = 0;
    let itemsWithQuantity = 0;
    
    shippingInputs.forEach(input => {
        totalItems++;
        if (parseFloat(input.value) > 0) {
            itemsWithQuantity++;
        }
    });
    
    document.getElementById('itemCountSummary').textContent = 
        `共 ${totalItems} 個項目，${itemsWithQuantity} 個有出貨數量`;
}

async function handleShipping(event) {
    event.preventDefault();
    
    const shipButton = document.getElementById('shipButton');
    const shipButtonText = document.getElementById('shipButtonText');
    const shipButtonSpinner = document.getElementById('shipButtonSpinner');
    
    // 驗證所有出貨數量
    const shippingInputs = document.querySelectorAll('.shipping-quantity');
    let isValid = true;
    const shippingItems = [];
    
    shippingInputs.forEach(input => {
        if (!validateShippingQuantity(input)) {
            isValid = false;
            return;
        }
        
        const quantity = parseFloat(input.value) || 0;
        if (quantity > 0) {
            shippingItems.push({
                item_id: input.dataset.itemId,
                quantity_shipped: quantity
            });
        }
    });
    
    if (!isValid) {
        alert('請修正出貨數量錯誤後再試');
        return;
    }
    
    if (shippingItems.length === 0) {
        alert('請至少設定一個項目的出貨數量');
        return;
    }
    
    // 顯示載入狀態
    shipButton.disabled = true;
    shipButtonText.classList.add('hidden');
    shipButtonSpinner.classList.remove('hidden');
    
    try {
        const shippingData = {
            shipping_items: shippingItems,
            notes: document.getElementById('shippingNotes').value
        };
        
        const response = await fetch(`/api/sales-orders/${orderId}/ship`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
            body: JSON.stringify(shippingData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('銷售訂單出貨處理成功！');
            window.location.href = `/orders/sales/${orderId}`;
        } else {
            throw new Error(result.message || '出貨處理失敗');
        }
        
    } catch (error) {
        console.error('Shipping error:', error);
        alert('出貨處理失敗: ' + error.message);
    } finally {
        // 恢復按鈕狀態
        shipButton.disabled = false;
        shipButtonText.classList.remove('hidden');
        shipButtonSpinner.classList.add('hidden');
    }
}

function displayError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('shippingContent').classList.add('hidden');
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
</script>
@endsection