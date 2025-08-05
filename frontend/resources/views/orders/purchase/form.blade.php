@extends('layouts.app')

@section('title', $mode === 'create' ? '建立採購訂單' : '編輯採購訂單')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{{ $mode === 'create' ? '建立採購訂單' : '編輯採購訂單' }}</h1>
            <p class="text-gray-600 dark:text-gray-400">{{ $mode === 'create' ? '建立新的採購訂單' : '編輯採購訂單' }}</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('orders.purchase.index') }}" 
               class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回列表
            </a>
        </div>
    </div>

    <form class="space-y-6" id="purchase-order-form" method="POST" action="{{ $mode === 'create' ? '/api/purchase-orders' : '/api/purchase-orders/' . ($orderId ?? '') }}">
        @csrf
        @if($mode === 'edit')
            @method('PUT')
        @endif
        <!-- Order Information Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Order Information -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">訂單資訊</h3>
                </div>
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label for="po_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">採購單號</label>
                        <input type="text" id="po_number" name="po_number" 
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                               value="{{ $mode === 'edit' && isset($purchaseOrder) ? $purchaseOrder->po_number : '' }}" 
                               {{ $mode === 'create' ? 'readonly' : '' }} placeholder="將自動產生">
                    </div>

                    <div>
                        <label for="supplier_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">供應商</label>
                        <select id="supplier_id" name="supplier_id" 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                            <option value="">選擇供應商</option>
                            @if(isset($suppliers))
                                @foreach($suppliers as $supplier)
                                    <option value="{{ $supplier->id }}" 
                                        {{ ($mode === 'edit' && isset($purchaseOrder) && $purchaseOrder->supplier_id == $supplier->id) ? 'selected' : '' }}>
                                        {{ $supplier->name }}
                                    </option>
                                @endforeach
                            @endif
                        </select>
                    </div>

                    <div>
                        <label for="order_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">訂單日期</label>
                        <input type="date" id="order_date" name="order_date" 
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                               value="{{ ($mode === 'edit' && isset($purchaseOrder)) ? $purchaseOrder->order_date->format('Y-m-d') : date('Y-m-d') }}" required>
                    </div>

                    <div>
                        <label for="expected_delivery_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">預期交貨日期</label>
                        <input type="date" id="expected_delivery_date" name="expected_delivery_date" 
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               value="{{ ($mode === 'edit' && isset($purchaseOrder) && $purchaseOrder->expected_delivery_date) ? $purchaseOrder->expected_delivery_date->format('Y-m-d') : '' }}">
                    </div>

                    <div>
                        <label for="currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">貨幣</label>
                        <select id="currency" name="currency" 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            @php
                                $currentCurrency = ($mode === 'edit' && isset($purchaseOrder)) ? $purchaseOrder->currency : 'USD';
                            @endphp
                            <option value="USD" {{ $currentCurrency === 'USD' ? 'selected' : '' }}>USD</option>
                            <option value="TWD" {{ $currentCurrency === 'TWD' ? 'selected' : '' }}>TWD</option>
                            <option value="EUR" {{ $currentCurrency === 'EUR' ? 'selected' : '' }}>EUR</option>
                            <option value="JPY" {{ $currentCurrency === 'JPY' ? 'selected' : '' }}>JPY</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Order Status -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">訂單狀態</h3>
                </div>
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">狀態</label>
                        <select id="status" name="status" 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            @php
                                $currentStatus = ($mode === 'edit' && isset($purchaseOrder)) ? $purchaseOrder->status : 'draft';
                                $statusOptions = \App\Models\PurchaseOrder::getStatuses();
                            @endphp
                            @foreach($statusOptions as $statusValue => $statusLabel)
                                <option value="{{ $statusValue }}" {{ $currentStatus === $statusValue ? 'selected' : '' }}>
                                    {{ $statusLabel }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div>
                        <label for="payment_terms" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">付款條件</label>
                        <input type="text" id="payment_terms" name="payment_terms" 
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                               value="{{ ($mode === 'edit' && isset($purchaseOrder)) ? $purchaseOrder->payment_terms : '' }}"
                               placeholder="例如：Net 30 days">
                    </div>

                    <div>
                        <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">備註</label>
                        <textarea id="notes" name="notes" rows="4" 
                                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                  placeholder="此採購單的額外備註...">{{ ($mode === 'edit' && isset($purchaseOrder)) ? $purchaseOrder->notes : '' }}</textarea>
                    </div>
                </div>
            </div>
        </div>

        <!-- Order Items -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">訂單項目</h3>
            </div>
            <div class="px-6 py-4">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">產品</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">數量</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">單價</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">總計</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody id="order-items" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" name="items[0][product_id]">
                                        <option value="">選擇產品</option>
                                        @if(isset($products))
                                            @foreach($products as $product)
                                                <option value="{{ $product->id }}" data-price="{{ $product->price ?? 0 }}">
                                                    {{ $product->name }} ({{ $product->sku ?? 'N/A' }})
                                                </option>
                                            @endforeach
                                        @endif
                                    </select>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <input type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" name="items[0][quantity]" min="1" value="1">
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <input type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" name="items[0][unit_price]" step="0.01" min="0">
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    <span class="item-total">$0.00</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <button type="button" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">移除</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="mt-4">
                    <button type="button" class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        新增項目
                    </button>
                </div>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3">
            <a href="{{ route('orders.purchase.index') }}" 
               class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                取消
            </a>
            <button type="submit" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                {{ $mode === 'create' ? '建立採購訂單' : '更新採購訂單' }}
            </button>
        </div>
    </form>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('purchase-order-form');
    const addItemBtn = document.querySelector('button[type="button"]');
    const orderItemsTable = document.getElementById('order-items');
    let itemIndex = 1;
    
    // 載入供應商和產品數據
    loadSuppliers();
    loadProductsForItems();
    
    // 編輯模式：預填採購訂單項目
    @if($mode === 'edit' && isset($purchaseOrder) && $purchaseOrder->items->count() > 0)
        loadExistingItems();
    @endif
    
    // 添加項目按鈕事件
    addItemBtn.addEventListener('click', function() {
        addOrderItem();
    });
    
    // 表單提交處理
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // 阻止原生提交
        submitPurchaseOrder(); // 使用 AJAX 提交
    });
    
    // 動態計算小計
    orderItemsTable.addEventListener('input', function(e) {
        if (e.target.name && (e.target.name.includes('[quantity]') || e.target.name.includes('[unit_price]'))) {
            updateLineTotal(e.target);
        }
    });
    
    // 刪除項目事件委派
    orderItemsTable.addEventListener('click', function(e) {
        if (e.target.textContent === 'Remove') {
            e.preventDefault();
            e.target.closest('tr').remove();
            updateFormTotals();
        }
    });
    
    function loadSuppliers() {
        const supplierSelect = document.getElementById('supplier_id');
        // 保存當前選中的供應商 ID（編輯模式）
        const currentSelectedId = supplierSelect.value;
        
        fetch('/api/suppliers')
            .then(response => response.json())
            .then(data => {
                supplierSelect.innerHTML = '<option value="">選擇供應商</option>';
                
                if (data.data && data.data.length > 0) {
                    data.data.forEach(supplier => {
                        const option = document.createElement('option');
                        option.value = supplier.id;
                        option.textContent = supplier.name;
                        supplierSelect.appendChild(option);
                    });
                    
                    // 重新設定之前選中的供應商（編輯模式）
                    if (currentSelectedId) {
                        supplierSelect.value = currentSelectedId;
                    }
                }
            })
            .catch(error => {
                console.error('載入供應商失敗:', error);
                showAlert('載入供應商數據失敗', 'error');
            });
    }
    
    function loadProductsForItems() {
        fetch('/api/products')
            .then(response => response.json())
            .then(data => {
                window.productsData = data.data || [];
                updateProductSelects();
            })
            .catch(error => {
                console.error('載入產品失敗:', error);
                window.productsData = [];
            });
    }
    
    function updateProductSelects() {
        const productSelects = document.querySelectorAll('select[name*="[product_id]"]');
        productSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">選擇產品</option>';
            
            if (window.productsData && window.productsData.length > 0) {
                window.productsData.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = `${product.sku} - ${product.name}`;
                    option.dataset.price = product.cost_price || 0;
                    select.appendChild(option);
                });
            }
            
            select.value = currentValue;
        });
    }
    
    function addOrderItem() {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" name="items[${itemIndex}][product_id]" required>
                    <option value="">選擇產品</option>
                </select>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <input type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" name="items[${itemIndex}][quantity]" min="1" value="1" required>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <input type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" name="items[${itemIndex}][unit_price]" step="0.01" min="0" required>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                <span class="item-total">$0.00</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button type="button" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">Remove</button>
            </td>
        `;
        
        orderItemsTable.appendChild(newRow);
        itemIndex++;
        
        // 更新新添加項目的產品選項
        updateProductSelects();
    }
    
    function updateLineTotal(input) {
        const row = input.closest('tr');
        const quantityInput = row.querySelector('input[name*="[quantity]"]');
        const priceInput = row.querySelector('input[name*="[unit_price]"]');
        const totalSpan = row.querySelector('.item-total');
        
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;
        
        totalSpan.textContent = `$${total.toFixed(2)}`;
        updateFormTotals();
    }
    
    function updateFormTotals() {
        let subtotal = 0;
        document.querySelectorAll('.item-total').forEach(span => {
            const value = parseFloat(span.textContent.replace('$', '')) || 0;
            subtotal += value;
        });
        
        // 顯示總額（這裡可以添加稅金計算）
        console.log('Subtotal:', subtotal);
    }
    
    
    function submitPurchaseOrder() {
        const originalFormData = new FormData(form);
        const items = [];
        
        // 收集項目數據
        const itemRows = orderItemsTable.querySelectorAll('tr');
        itemRows.forEach((row, index) => {
            const productSelect = row.querySelector('select[name*="[product_id]"]');
            const quantityInput = row.querySelector('input[name*="[quantity]"]');
            const priceInput = row.querySelector('input[name*="[unit_price]"]');
            
            if (productSelect && quantityInput && priceInput && 
                productSelect.value && quantityInput.value && priceInput.value) {
                items.push({
                    product_id: parseInt(productSelect.value),
                    quantity: parseInt(quantityInput.value),
                    unit_price: parseFloat(priceInput.value)
                });
            }
        });
        
        // 驗證必填項目
        if (!originalFormData.get('supplier_id')) {
            showAlert('請選擇供應商', 'error');
            return;
        }
        
        if (items.length === 0) {
            showAlert('請至少添加一個訂單項目', 'error');
            return;
        }
        
        // 構建提交數據
        const submitData = {
            supplier_id: parseInt(originalFormData.get('supplier_id')),
            order_date: originalFormData.get('order_date'),
            expected_delivery_date: originalFormData.get('expected_delivery_date'),
            currency: originalFormData.get('currency'),
            payment_terms: originalFormData.get('payment_terms'),
            notes: originalFormData.get('notes'),
            status: originalFormData.get('status'),
            items: items
        };
        
        // 添加 po_number（如果是編輯模式）
        if (originalFormData.get('po_number')) {
            submitData.po_number = originalFormData.get('po_number');
        }
        
        console.log('提交數據:', submitData);
        
        // 發送 API 請求
        const url = form.action;
        const method = form.querySelector('input[name="_method"]') ? 'PUT' : 'POST';
        
        showLoading(true);
        
        // 取得 CSRF token
        const csrfToken = form.querySelector('input[name="_token"]')?.value || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        console.log('CSRF Token found:', !!csrfToken, 'Value:', csrfToken?.substring(0, 10) + '...');
        
        if (!csrfToken) {
            console.error('CSRF token not found!');
            showAlert('CSRF token 錯誤', 'error');
            showLoading(false);
            return;
        }

        // 準備請求標頭
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        };

        // 如果是 PUT 請求，添加到數據中
        if (method === 'PUT') {
            submitData._method = 'PUT';
        }

        console.log('提交數據 (JSON):', JSON.stringify(submitData, null, 2));
        console.log('請求標頭:', headers);

        fetch(url, {
            method: 'POST', // 總是使用 POST，PUT 通過 _method 處理
            headers: headers,
            body: JSON.stringify(submitData)
        })
        .then(response => response.json())
        .then(data => {
            showLoading(false);
            
            if (data.success) {
                showAlert('採購單創建成功！', 'success');
                setTimeout(() => {
                    window.location.href = '/orders/purchase';
                }, 2000);
            } else {
                showAlert(data.message || '創建失敗，請檢查輸入數據', 'error');
                
                // 顯示驗證錯誤
                if (data.errors) {
                    Object.keys(data.errors).forEach(field => {
                        const input = document.querySelector(`[name="${field}"]`);
                        if (input) {
                            input.classList.add('border-red-500');
                            showFieldError(input, data.errors[field][0]);
                        }
                    });
                }
            }
        })
        .catch(error => {
            showLoading(false);
            console.error('提交錯誤:', error);
            showAlert('提交失敗，請稍後再試', 'error');
        });
    }
    
    function showAlert(message, type = 'info') {
        // 創建通知元素
        const alert = document.createElement('div');
        alert.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
        }`;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        // 3秒後自動移除
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 3000);
    }
    
    function showFieldError(input, message) {
        // 移除現有錯誤
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // 添加錯誤訊息
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-red-500 text-sm mt-1';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }
    
    function showLoading(show) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (show) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="animate-spin mr-2">⟳</span>處理中...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '{{ $mode === "create" ? "創建採購單" : "更新採購單" }}';
        }
    }
    
    @if($mode === 'edit' && isset($purchaseOrder))
    function loadExistingItems() {
        // 清空現有的第一行
        const existingRow = orderItemsTable.querySelector('tr');
        if (existingRow) {
            existingRow.remove();
        }
        
        // 預填現有項目
        const existingItems = @json($purchaseOrder->items);
        itemIndex = 0;
        
        existingItems.forEach((item, index) => {
            addOrderItemWithData(item, index);
        });
        
        if (existingItems.length === 0) {
            addOrderItem(); // 如果沒有項目，添加一個空白行
        }
    }
    
    function addOrderItemWithData(itemData, index) {
        const row = document.createElement('tr');
        
        // 構建產品選擇器選項
        let productOptions = '<option value="">選擇產品</option>';
        @if(isset($products))
            @foreach($products as $product)
                productOptions += `<option value="{{ $product->id }}" data-price="{{ $product->price ?? 0 }}" ${itemData.product_id == {{ $product->id }} ? 'selected' : ''}>{{ $product->name }} ({{ $product->sku ?? 'N/A' }})</option>`;
            @endforeach
        @endif
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" name="items[${index}][product_id]">
                    ${productOptions}
                </select>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <input type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" name="items[${index}][quantity]" min="1" value="${itemData.quantity}">
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <input type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" name="items[${index}][unit_price]" step="0.01" min="0" value="${itemData.unit_price}">
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                <span class="item-total">$${(itemData.quantity * itemData.unit_price).toFixed(2)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button type="button" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">移除</button>
            </td>
        `;
        
        orderItemsTable.appendChild(row);
        itemIndex = Math.max(itemIndex, index + 1);
    }
    @endif
    
    // 初始化：更新第一行的小計
    updateLineTotal(document.querySelector('input[name*="[quantity]"]'));
});
</script>

@endsection