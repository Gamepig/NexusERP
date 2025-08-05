@extends('layouts.app')

@section('title', $mode === 'create' ? '建立銷售訂單' : '修改銷售訂單')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {{ $mode === 'create' ? '建立銷售訂單' : '修改銷售訂單' }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
                {{ $mode === 'create' ? '新增銷售訂單資料' : '修改現有銷售訂單' }}
            </p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            @if(isset($customerId))
                <a href="{{ route('customers.show', $customerId) }}" 
                   class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                    返回客戶
                </a>
            @else
                <a href="{{ route('orders.sales.index') }}" 
                   class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                    返回列表
                </a>
            @endif
        </div>
    </div>

    @if(isset($debugInfo))
    <!-- 調試信息 -->
    <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <strong>調試信息:</strong> {{ $debugInfo }}
    </div>
    @endif

    <!-- 載入中狀態 -->
    <div id="loadingState" class="hidden text-center py-8">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white transition ease-in-out duration-150">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            正在載入資料...
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
                        <p id="errorMessage">無法載入資料，請稍後重試。</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 表單內容 -->
    <div id="formContent" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <form id="salesOrderForm" class="space-y-6">
            @csrf
            <!-- 基本資料區塊 -->
            <div class="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">基本資料</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- 客戶選擇 -->
                    <div>
                        <label for="customer_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            客戶 <span class="text-red-500">*</span>
                        </label>
                        <select id="customer_id" name="customer_id" required 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                            <option value="">請選擇客戶</option>
                            <!-- 動態載入客戶選項 -->
                        </select>
                        <div class="text-red-500 text-sm mt-1 hidden" id="customer_id_error"></div>
                    </div>

                    <!-- 訂單日期 -->
                    <div>
                        <label for="order_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            訂單日期 <span class="text-red-500">*</span>
                        </label>
                        <input type="date" id="order_date" name="order_date" required
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                        <div class="text-red-500 text-sm mt-1 hidden" id="order_date_error"></div>
                    </div>

                    <!-- 訂單狀態 -->
                    <div>
                        <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            訂單狀態 <span class="text-red-500">*</span>
                        </label>
                        <select id="status" name="status" required 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                            <option value="draft">草稿</option>
                            <option value="processing">處理中</option>
                            <option value="shipped">已出貨</option>
                            <option value="completed">已完成</option>
                            <option value="cancelled">已取消</option>
                        </select>
                        <div class="text-red-500 text-sm mt-1 hidden" id="status_error"></div>
                    </div>
                </div>

                <!-- 備註 -->
                <div class="mt-6">
                    <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">備註</label>
                    <textarea id="notes" name="notes" rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                              placeholder="輸入訂單備註資訊..."></textarea>
                </div>
            </div>

            <!-- 訂單項目區塊 -->
            <div class="px-6 py-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">訂單項目</h3>
                    <button type="button" id="addItemBtn" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        新增項目
                    </button>
                </div>

                <!-- 項目列表 -->
                <div id="itemsList" class="space-y-4">
                    <!-- 動態新增的項目會顯示在這裡 -->
                </div>

                <!-- 空狀態 -->
                <div id="emptyState" class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p>尚無訂單項目，請點擊「新增項目」開始建立</p>
                </div>
            </div>

            <!-- 金額摘要 -->
            <div class="px-6 py-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <div class="max-w-md ml-auto">
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">小計:</span>
                            <span id="subtotalAmount" class="text-gray-900 dark:text-white">$0.00</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">稅額 (5%):</span>
                            <span id="taxAmount" class="text-gray-900 dark:text-white">$0.00</span>
                        </div>
                        <div class="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
                            <span class="text-gray-900 dark:text-white">總計:</span>
                            <span id="totalAmount" class="text-gray-900 dark:text-white">$0.00</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 操作按鈕 -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3">
                <button type="button" onclick="window.location.href='{{ route('orders.sales.index') }}'"
                        class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    取消
                </button>
                <button type="submit" id="submitBtn"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    <span id="submitText">{{ $mode === 'create' ? '建立訂單' : '更新訂單' }}</span>
                    <svg id="submitSpinner" class="hidden animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </button>
            </div>
        </form>
    </div>
</div>

<!-- 項目模板 -->
<template id="itemTemplate">
    <div class="item-row border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <!-- 產品選擇 -->
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    產品 <span class="text-red-500">*</span>
                </label>
                <select name="items[INDEX][product_id]" class="product-select w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white" required>
                    <option value="">請選擇產品</option>
                    <!-- 動態載入產品選項 -->
                </select>
            </div>

            <!-- 數量 -->
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    數量 <span class="text-red-500">*</span>
                </label>
                <input type="number" name="items[INDEX][quantity]" class="quantity-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white" 
                       min="0.01" step="0.01" placeholder="1" required>
            </div>

            <!-- 單價 -->
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    單價 <span class="text-red-500">*</span>
                </label>
                <input type="number" name="items[INDEX][unit_price]" class="price-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white" 
                       min="0" step="0.01" placeholder="0.00" required>
            </div>

            <!-- 刪除按鈕 -->
            <div class="flex justify-end">
                <button type="button" class="remove-item bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- 小計顯示 -->
        <div class="mt-4 text-right">
            <span class="text-sm text-gray-600 dark:text-gray-400">小計: </span>
            <span class="item-subtotal text-lg font-medium text-gray-900 dark:text-white">$0.00</span>
        </div>
    </div>
</template>

<script>
const mode = '{{ $mode }}';
const orderId = {{ isset($orderId) ? $orderId : 'null' }};
const customerId = {{ isset($customerId) ? $customerId : 'null' }};

let customers = [];
let products = [];
let itemIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

async function initializePage() {
    try {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('formContent').classList.add('hidden');
        
        console.log('=== initializePage 開始 ===');
        
        // 檢查是否有伺服器傳來的數據
        @if(isset($customers) && isset($products))
            // 伺服器已提供數據，直接使用
            customers = @json($customers);
            products = @json($products);
            console.log('使用伺服器提供的數據');
            console.log('客戶數量:', customers.length);
            console.log('產品數量:', products.length);
            
            // 立即填充客戶下拉選單
            populateCustomerSelect();
        @else
            console.log('從 API 載入數據');
            // 載入客戶和產品資料
            try {
                await Promise.all([loadCustomers(), loadProducts()]);
                console.log('API 數據載入完成');
            } catch (error) {
                console.error('API 數據載入失敗:', error);
                // 即使失敗也要繼續，避免阻塞整個初始化過程
            }
        @endif
        
        // 確保產品數據載入完成後填充客戶選項
        populateCustomerSelect();
        
        // 設定預設日期
        if (!orderId) {
            document.getElementById('order_date').value = new Date().toISOString().split('T')[0];
        }
        
        // 如果是編輯模式且有伺服器數據，直接載入
        @if(isset($salesOrder) && isset($orderItems))
            console.log('編輯模式 - 使用伺服器數據');
            // 延遲執行確保 DOM 完全就緒和產品數據載入完成
            setTimeout(() => {
                populateServerData();
            }, 200); // 增加延遲時間確保產品數據載入完成
        @else
            // 如果是編輯模式但沒有伺服器數據，載入現有訂單資料
            if (mode === 'edit' && orderId) {
                console.log('編輯模式 - 從 API 載入數據');
                try {
                    await loadOrderData();
                } catch (error) {
                    console.error('訂單數據載入失敗:', error);
                    displayError('載入訂單數據失敗: ' + error.message);
                    return;
                }
            }
        @endif
        
        setupEventListeners();
        
        // 初始化時觸發現有項目的小計計算
        document.querySelectorAll('.item-row').forEach(itemElement => {
            updateItemSubtotal(itemElement);
        });
        
        // 初始化時觸發一次總計計算（處理現有項目）
        updateTotals();
        
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('formContent').classList.remove('hidden');
        
    } catch (error) {
        console.error('Initialize page error:', error);
        showError('載入頁面失敗: ' + error.message);
    }
}

async function loadCustomers() {
    try {
        const response = await fetch('/api/customers', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            customers = result.data;
            populateCustomerSelect();
        } else {
            throw new Error(result.message || '載入客戶資料失敗');
        }
    } catch (error) {
        console.error('Load customers error:', error);
        throw error;
    }
}

async function loadProducts() {
    try {
        console.log('=== loadProducts 開始載入 ===');
        const response = await fetch('/api/products?paginate=false', {
            method: 'GET', 
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        console.log('API 回應狀態:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API 回應結果:', result);
        
        if (result.success) {
            products = result.data;
            console.log('產品載入成功，數量:', products.length);
            console.log('產品列表:', products.slice(0, 3)); // 顯示前3個產品供調試
        } else {
            throw new Error(result.message || '載入產品資料失敗');
        }
    } catch (error) {
        console.error('Load products error:', error);
        // 如果 API 失敗，嘗試使用空陣列避免阻塞其他功能
        products = [];
        throw error;
    }
}

async function loadOrderData() {
    try {
        const response = await fetch(`/api/sales-orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            populateFormData(result.data);
        } else {
            throw new Error(result.message || '載入訂單資料失敗');
        }
    } catch (error) {
        console.error('Load order data error:', error);
        throw error;
    }
}

function populateCustomerSelect() {
    const customerSelect = document.getElementById('customer_id');
    customerSelect.innerHTML = '<option value="">請選擇客戶</option>';
    
    // 檢查是否有伺服器傳來的客戶數據
    @if(isset($customers))
        const serverCustomers = @json($customers);
        serverCustomers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            
            // 如果是編輯模式且匹配當前訂單的客戶，標記為選中
            @if(isset($salesOrder) && isset($salesOrder->customer_id))
                if (customer.id == {{ $salesOrder->customer_id }}) {
                    option.selected = true;
                }
            @endif
            
            customerSelect.appendChild(option);
        });
    @else
        // 回到原來的 API 載入方式
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            
            // 如果是創建模式且有指定客戶ID，預設選擇該客戶
            if (mode === 'create' && customerId && customer.id == customerId) {
                option.selected = true;
            }
            
            customerSelect.appendChild(option);
        });
    @endif
}

function populateProductSelect(selectElement) {
    console.log('=== populateProductSelect 開始 ===');
    selectElement.innerHTML = '<option value="">請選擇產品</option>';
    
    // 檢查是否有伺服器傳來的產品數據
    @if(isset($products))
        const serverProducts = @json($products);
        console.log('使用伺服器產品數據，數量:', serverProducts.length);
        serverProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.sku || 'N/A'})`;
            option.dataset.price = product.selling_price || product.unit_price || product.price || 0;
            selectElement.appendChild(option);
        });
    @else
        // 回到原來的 API 載入方式
        console.log('使用 API 產品數據，數量:', products ? products.length : 0);
        if (products && products.length > 0) {
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (${product.sku || 'N/A'})`;
                option.dataset.price = product.selling_price || product.unit_price || product.price || 0;
                selectElement.appendChild(option);
            });
        } else {
            console.warn('產品數據為空或未載入');
            // 添加一個調試選項以確認函數有執行
            const debugOption = document.createElement('option');
            debugOption.value = '';
            debugOption.textContent = '(產品載入中...)';
            debugOption.disabled = true;
            selectElement.appendChild(debugOption);
        }
    @endif
    
    console.log('產品選擇器填充完成，選項數量:', selectElement.options.length);
}

function populateServerData() {
    console.log('populateServerData() 被調用');
    @if(isset($salesOrder))
        const salesOrder = @json($salesOrder);
        
        console.log('銷售訂單數據:', salesOrder);
        console.log('產品數據是否存在:', @if(isset($products)) true @else false @endif);
        
        @if(isset($products))
            const serverProducts = @json($products);
            console.log('伺服器產品數據:', serverProducts);
            console.log('產品數量:', serverProducts.length);
        @endif
        
        // 確保客戶下拉選單先填充完成
        populateCustomerSelect();
        
        // 延遲設定客戶選擇，確保選項已加載
        setTimeout(() => {
            const customerSelect = document.getElementById('customer_id');
            if (customerSelect) {
                customerSelect.value = salesOrder.customer_id || '';
                console.log('設定客戶ID:', salesOrder.customer_id, '實際值:', customerSelect.value);
                
                // 如果還是沒有選中，嘗試手動觸發選擇
                if (customerSelect.value !== salesOrder.customer_id) {
                    // 尋找對應的選項並標記為選中
                    const options = customerSelect.querySelectorAll('option');
                    options.forEach(option => {
                        if (option.value == salesOrder.customer_id) {
                            option.selected = true;
                            customerSelect.value = option.value;
                        }
                    });
                }
            }
        }, 100);
        
        const orderDateInput = document.getElementById('order_date');
        if (orderDateInput) {
            orderDateInput.value = salesOrder.order_date || '';
        }
        
        const notesInput = document.getElementById('notes');
        if (notesInput) {
            notesInput.value = salesOrder.notes || '';
        }
        
        // 設定訂單狀態
        const statusSelect = document.getElementById('status');
        if (statusSelect) {
            statusSelect.value = salesOrder.status || 'draft';
        }
        
        // 添加訂單項目
        @if(isset($orderItems))
            const orderItems = @json($orderItems);
            console.log('訂單項目數據:', orderItems);
            console.log('訂單項目數量:', orderItems.length);
            
            // 清空現有項目列表以避免重複
            const itemsList = document.getElementById('itemsList');
            itemsList.innerHTML = '';
            
            // 逐個添加項目，每個項目之間有延遲確保正確處理
            orderItems.forEach((item, index) => {
                console.log(`準備添加項目 ${index + 1}:`, item);
                setTimeout(() => {
                    addItem({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        product_name: item.product_name,
                        product_sku: item.product_sku
                    });
                }, index * 50); // 每個項目延遲50ms
            });
        @endif
        
        updateTotals();
    @endif
}

function populateFormData(orderData) {
    // 確保客戶下拉選單已載入完成後才設定值
    setTimeout(() => {
        const customerSelect = document.getElementById('customer_id');
        if (customerSelect) {
            customerSelect.value = orderData.customer_id || '';
        }
    }, 100);
    
    // 填入基本資料
    const orderDateInput = document.getElementById('order_date');
    if (orderDateInput) {
        orderDateInput.value = orderData.order_date || '';
    }
    
    const notesInput = document.getElementById('notes');
    if (notesInput) {
        notesInput.value = orderData.notes || '';
    }
    
    // 設定訂單狀態
    const statusSelect = document.getElementById('status');
    if (statusSelect) {
        statusSelect.value = orderData.status || 'draft';
    }
    
    // 添加訂單項目
    if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach(item => {
            addItem(item);
        });
    }
    
    updateTotals();
}

function setupEventListeners() {
    // 新增項目按鈕
    document.getElementById('addItemBtn').addEventListener('click', () => addItem());
    
    // 表單提交
    document.getElementById('salesOrderForm').addEventListener('submit', handleSubmit);
    
    // 為現有項目設置事件監聽器
    document.querySelectorAll('.item-row').forEach(itemElement => {
        setupItemEventListeners(itemElement);
    });
}

function addItem(itemData = null) {
    console.log('=== addItem 被調用 ===');
    console.log('項目數據:', itemData);
    console.log('當前產品列表長度:', products.length);
    
    const template = document.getElementById('itemTemplate');
    const clone = template.content.cloneNode(true);
    
    // 更新索引
    const currentIndex = itemIndex++;
    console.log('當前索引:', currentIndex);
    
    // 替換模板中的 INDEX 標記
    clone.querySelectorAll('[name*="INDEX"]').forEach(element => {
        element.name = element.name.replace('INDEX', currentIndex);
    });
    
    // 先添加到 DOM，這樣後續的選擇器才能正確工作
    document.getElementById('itemsList').appendChild(clone);
    
    // 獲取剛添加的元素
    const itemsList = document.getElementById('itemsList');
    const addedElement = itemsList.lastElementChild;
    
    if (!addedElement) {
        console.error('無法找到新添加的元素');
        return;
    }
    
    // 設定產品下拉選單
    const productSelect = addedElement.querySelector('.product-select');
    if (productSelect) {
        populateProductSelect(productSelect);
        console.log('產品下拉選單已填充，選項數量:', productSelect.options.length);
    }
    
    // 設定事件監聽器
    setupItemEventListeners(addedElement);
    
    // 如果有提供項目資料，填入表單
    if (itemData) {
        console.log('設定項目數據...');
        // 直接設置值，不需要延遲
        if (productSelect && itemData.product_id) {
            
            if (!addedElement) {
                console.error('無法找到新添加的元素');
                return;
            }
            
            const productSelectAdded = addedElement.querySelector('.product-select');
            const quantityInputAdded = addedElement.querySelector('.quantity-input');
            const priceInputAdded = addedElement.querySelector('.price-input');
            
            console.log('設定項目數據:', itemData);
            
            if (productSelectAdded) {
                console.log('產品選擇器選項數量:', productSelectAdded.options.length);
                
                // 檢查產品選項是否存在，如果不存在，嘗試手動添加
                const existingOption = Array.from(productSelectAdded.options).find(option => option.value == itemData.product_id);
                console.log('檢查產品選項 - ID:', itemData.product_id, '存在:', !!existingOption, '產品名稱:', itemData.product_name);
                console.log('產品選擇器所有選項:', Array.from(productSelectAdded.options).map(opt => ({value: opt.value, text: opt.textContent})));
                
                if (!existingOption && itemData.product_name) {
                    console.log('產品選項不存在，手動添加:', itemData.product_name, 'SKU:', itemData.product_sku);
                    const newOption = document.createElement('option');
                    newOption.value = itemData.product_id;
                    newOption.textContent = `${itemData.product_name} (${itemData.product_sku || 'N/A'})`;
                    newOption.dataset.price = itemData.unit_price || 0;
                    productSelectAdded.appendChild(newOption);
                    console.log('產品選項已添加，新選項數量:', productSelectAdded.options.length);
                } else if (!existingOption) {
                    console.warn('產品選項不存在且沒有產品名稱 - ID:', itemData.product_id, '所有項目數據:', itemData);
                    console.warn('所有可用產品:', typeof products !== 'undefined' ? products : '未定義');
                }
                
                // 設置產品選擇值，添加重試機制
                productSelectAdded.value = itemData.product_id || '';
                console.log('設定產品ID:', itemData.product_id, '實際值:', productSelectAdded.value);
                
                // 如果設置失敗，嘗試手動觸發選擇
                if (productSelectAdded.value != itemData.product_id) {
                    console.log('設置失敗，嘗試手動觸發選擇');
                    const targetOption = Array.from(productSelectAdded.options).find(option => option.value == itemData.product_id);
                    if (targetOption) {
                        targetOption.selected = true;
                        productSelectAdded.value = targetOption.value;
                        console.log('手動選擇成功:', productSelectAdded.value);
                    } else {
                        console.warn('找不到目標選項 ID:', itemData.product_id);
                        // 列出所有可用選項供調試
                        console.log('可用選項:', Array.from(productSelectAdded.options).map(opt => ({value: opt.value, text: opt.textContent})));
                    }
                }
            }
            
            if (quantityInputAdded) {
                quantityInputAdded.value = itemData.quantity || '';
            }
            
            if (priceInputAdded) {
                priceInputAdded.value = itemData.unit_price || '';
            }
            
            // 觸發小計計算
            updateItemSubtotal(addedElement);
        }
    }
    
    // 隱藏空狀態
    document.getElementById('emptyState').classList.add('hidden');
    
    updateTotals();
}

function setupItemEventListeners(itemElement) {
    // 產品選擇變更
    const productSelect = itemElement.querySelector('.product-select');
    if (productSelect) {
        productSelect.addEventListener('change', function() {
            const currentItemElement = this.closest('.item-row');
            const selectedOption = this.options[this.selectedIndex];
            const priceInput = currentItemElement.querySelector('.price-input');
            if (selectedOption && selectedOption.dataset.price && priceInput) {
                priceInput.value = selectedOption.dataset.price;
                // 確保數量欄位有預設值
                const quantityInput = currentItemElement.querySelector('.quantity-input');
                if (quantityInput && !quantityInput.value) {
                    quantityInput.value = '1';
                }
            }
            updateItemSubtotal(currentItemElement);
        });
    }
    
    // 數量或價格變更
    const quantityInput = itemElement.querySelector('.quantity-input');
    const priceInput = itemElement.querySelector('.price-input');
    
    if (quantityInput) {
        quantityInput.addEventListener('input', function() {
            updateItemSubtotal(this.closest('.item-row'));
        });
        quantityInput.addEventListener('change', function() {
            updateItemSubtotal(this.closest('.item-row'));
        });
    }
    
    if (priceInput) {
        priceInput.addEventListener('input', function() {
            updateItemSubtotal(this.closest('.item-row'));
        });
        priceInput.addEventListener('change', function() {
            updateItemSubtotal(this.closest('.item-row'));
        });
    }
    
    // 刪除項目
    const removeButton = itemElement.querySelector('.remove-item');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            itemElement.remove();
            updateTotals();
            
            // 如果沒有項目了，顯示空狀態
            if (document.getElementById('itemsList').children.length === 0) {
                document.getElementById('emptyState').classList.remove('hidden');
            }
        });
    }
}

function updateItemSubtotal(itemElement) {
    const quantityInput = itemElement.querySelector('.quantity-input');
    const priceInput = itemElement.querySelector('.price-input');
    const subtotalElement = itemElement.querySelector('.item-subtotal');
    
    // 檢查必要元素是否存在
    if (!quantityInput || !priceInput || !subtotalElement) {
        console.warn('Missing required elements in item row for subtotal calculation');
        return;
    }
    
    const quantity = parseFloat(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const subtotal = quantity * price;
    
    subtotalElement.textContent = `$${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    
    updateTotals();
}

function updateTotals() {
    let subtotal = 0;
    
    document.querySelectorAll('.item-row').forEach(itemElement => {
        const quantityInput = itemElement.querySelector('.quantity-input');
        const priceInput = itemElement.querySelector('.price-input');
        
        if (quantityInput && priceInput && quantityInput.value !== '' && priceInput.value !== '') {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            
            if (quantity > 0 && price >= 0) {
                subtotal += quantity * price;
            }
        }
    });
    
    const taxRate = 0.05; // 5% 稅率
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    const subtotalElement = document.getElementById('subtotalAmount');
    const taxElement = document.getElementById('taxAmount');
    const totalElement = document.getElementById('totalAmount');
    
    if (subtotalElement) {
        subtotalElement.textContent = `$${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    if (taxElement) {
        taxElement.textContent = `$${taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    if (totalElement) {
        totalElement.textContent = `$${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    
    // 清除錯誤訊息
    clearErrors();
    
    // 驗證表單
    if (!validateForm()) {
        return;
    }
    
    // 顯示載入狀態
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitSpinner.classList.remove('hidden');
    
    try {
        const formData = collectFormData();
        const url = mode === 'create' ? '/api/sales-orders' : `/api/sales-orders/${orderId}`;
        const method = mode === 'create' ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 成功訊息
            alert(mode === 'create' ? '銷售訂單建立成功！' : '銷售訂單更新成功！');
            // 導向到訂單詳情頁面
            window.location.href = `/orders/sales/${result.data.id}`;
        } else {
            throw new Error(result.message || '操作失敗');
        }
        
    } catch (error) {
        console.error('Submit error:', error);
        alert('操作失敗: ' + error.message);
    } finally {
        // 恢復按鈕狀態
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitSpinner.classList.add('hidden');
    }
}

function validateForm() {
    let isValid = true;
    
    // 驗證客戶
    const customerId = document.getElementById('customer_id').value;
    if (!customerId) {
        showFieldError('customer_id', '請選擇客戶');
        isValid = false;
    }
    
    // 驗證訂單日期
    const orderDate = document.getElementById('order_date').value;
    if (!orderDate) {
        showFieldError('order_date', '請選擇訂單日期');
        isValid = false;
    }
    
    // 驗證項目
    const items = document.querySelectorAll('.item-row');
    if (items.length === 0) {
        alert('請至少新增一個訂單項目');
        isValid = false;
    }
    
    // 驗證每個項目
    items.forEach((item, index) => {
        const productSelect = item.querySelector('.product-select');
        const quantityInput = item.querySelector('.quantity-input');
        const priceInput = item.querySelector('.price-input');
        
        if (!productSelect.value) {
            alert(`項目 ${index + 1}: 請選擇產品`);
            isValid = false;
        }
        
        if (!quantityInput.value || parseFloat(quantityInput.value) <= 0) {
            alert(`項目 ${index + 1}: 請輸入有效的數量`);
            isValid = false;
        }
        
        if (!priceInput.value || parseFloat(priceInput.value) < 0) {
            alert(`項目 ${index + 1}: 請輸入有效的單價`);
            isValid = false;
        }
    });
    
    return isValid;
}

function collectFormData() {
    const formData = {
        customer_id: document.getElementById('customer_id').value,
        order_date: document.getElementById('order_date').value,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value,
        items: []
    };
    
    document.querySelectorAll('.item-row').forEach(item => {
        const itemData = {
            product_id: item.querySelector('.product-select').value,
            quantity: parseFloat(item.querySelector('.quantity-input').value),
            unit_price: parseFloat(item.querySelector('.price-input').value)
        };
        formData.items.push(itemData);
    });
    
    return formData;
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}_error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

function clearErrors() {
    document.querySelectorAll('[id$="_error"]').forEach(element => {
        element.classList.add('hidden');
        element.textContent = '';
    });
}

function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('formContent').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}
</script>
@endsection