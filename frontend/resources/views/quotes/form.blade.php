@extends('layouts.app')

@section('title', $mode === 'create' ? '建立報價單' : '修改報價單')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {{ $mode === 'create' ? '建立報價單' : '修改報價單' }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
                {{ $mode === 'create' ? '新增報價單資料' : '修改現有報價單' }}
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
                <a href="{{ route('quotes.index') }}" 
                   class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                    回報價單列表
                </a>
            @endif
        </div>
    </div>


    <!-- 成功/錯誤訊息 -->
    @if(session('success'))
        <div class="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-green-700">{{ session('success') }}</p>
                </div>
            </div>
        </div>
    @endif

    @if(session('error'))
        <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-red-700">{{ session('error') }}</p>
                </div>
            </div>
        </div>
    @endif

    @if($errors->any())
        <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">發現以下錯誤：</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <ul class="list-disc pl-5 space-y-1">
                            @foreach($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    @endif

    <!-- 表單內容 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <form id="quoteForm" method="POST" action="{{ $mode === 'create' ? route('quotes.store') : route('quotes.update', $quoteId ?? 0) }}" class="space-y-6">
            @csrf
            @if($mode === 'edit')
                @method('PUT')
            @endif
            <!-- 基本資料區塊 -->
            <div class="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">基本資料</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- 客戶選擇 -->
                    <div>
                        <label for="customer_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            客戶 <span class="text-red-500">*</span>
                        </label>
                        <select id="customer_id" name="customer_id" required onchange="updateContactPerson(this)"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                            <option value="">請選擇客戶</option>
                            @if(isset($customers) && is_array($customers))
                                    @foreach($customers as $customer)
                                        @php
                                            $selected = false;
                                            if (isset($customerId) && (string)$customerId === (string)$customer['id']) {
                                                $selected = true;
                                            } elseif (isset($quote) && is_array($quote)) {
                                                // 依序嘗試不同來源的 customer_id（normalize 後可能放在 original.customer_id 或 customer.id）
                                                $cid1 = $quote['customer_id'] ?? null;
                                                $cid2 = $quote['original']['customer_id'] ?? null;
                                                $cid3 = $quote['customer']['id'] ?? null;
                                                if ((string)($cid1 ?? $cid2 ?? $cid3) === (string)$customer['id']) {
                                                    $selected = true;
                                                }
                                            }
                                        @endphp
                                        <option value="{{ $customer['id'] }}" 
                                                data-contact-person="{{ $customer['contact_person'] ?? $customer['name'] ?? '' }}"
                                                data-phone="{{ $customer['phone'] ?? '' }}"
                                                data-email="{{ $customer['email'] ?? '' }}"
                                                {{ $selected ? 'selected' : '' }}>
                                            {{ $customer['name'] }} {{ isset($customer['email']) ? '(' . $customer['email'] . ')' : '' }}
                                        </option>
                                    @endforeach
                            @endif
                        </select>
                    </div>

                    <!-- 報價日期 -->
                    <div>
                        <label for="quote_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            報價日期 <span class="text-red-500">*</span>
                        </label>
                        <input type="date" id="quote_date" name="quote_date" required
                               value="{{ isset($quote) && isset($quote['quote_date']) ? date('Y-m-d', strtotime($quote['quote_date'])) : date('Y-m-d') }}"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                    </div>

                    <!-- 有效期限 -->
                    <div>
                        <label for="valid_until" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            有效期限 <span class="text-red-500">*</span>
                        </label>
                        <input type="date" id="valid_until" name="valid_until" required
                               value="@if(isset($quote) && (isset($quote['expiry_date']) || isset($quote['valid_until']))){{ date('Y-m-d', strtotime($quote['expiry_date'] ?? $quote['valid_until'])) }}@else{{ date('Y-m-d', strtotime('+30 days')) }}@endif"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <!-- 報價狀態 -->
                    <div>
                        <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            報價狀態
                        </label>
                        <select id="status" name="status" 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                            @php 
                                $currentStatus = $quote['status'] ?? 'draft';
                                // 後端到前端的映射，用於顯示選中狀態
                                $displayStatusMapping = [
                                    'pending' => 'pending',
                                    'approved' => 'approved',
                                    'sent' => 'pending',      // 向後兼容
                                    'accepted' => 'approved', // 向後兼容
                                ];
                                $mappedStatus = $displayStatusMapping[$currentStatus] ?? $currentStatus;
                            @endphp
                            <option value="draft" {{ $mappedStatus === 'draft' ? 'selected' : '' }}>📝 草稿</option>
                            <option value="pending" {{ $mappedStatus === 'pending' ? 'selected' : '' }}>📤 已發送</option>
                            <option value="approved" {{ $mappedStatus === 'approved' ? 'selected' : '' }}>✅ 已批准</option>
                            <option value="rejected" {{ $mappedStatus === 'rejected' ? 'selected' : '' }}>❌ 已拒絕</option>
                            <option value="expired" {{ $mappedStatus === 'expired' ? 'selected' : '' }}>⏰ 已過期</option>
                        </select>
                    </div>

                    <!-- 聯絡人 -->
                    <div>
                        <label for="contact_person" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">聯絡人</label>
                        <input type="text" id="contact_person" name="contact_person"
                               value="{{ $quote['contact_person'] ?? '' }}"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                               placeholder="輸入聯絡人姓名">
                    </div>
                </div>

                <!-- 報價說明 -->
                <div class="mt-6">
                    <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">報價說明</label>
                    <textarea id="notes" name="notes" rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                              placeholder="輸入報價說明或備註...">{{ isset($quote) ? $quote['notes'] : '' }}</textarea>
                </div>
            </div>

            <!-- 報價項目區塊 -->
            <div class="px-6 py-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">報價項目</h3>
                    <button type="button" onclick="addQuoteItem()" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        新增項目
                    </button>
                </div>

                <!-- 項目列表 -->
                <div id="itemsList" class="space-y-4">
                    @if(isset($quote) && isset($quote['items']) && is_array($quote['items']) && count($quote['items']) > 0)
                        @foreach($quote['items'] as $index => $item)
                            <div class="item-row border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                                <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                    <div class="md:col-span-2">
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">產品/服務</label>
                                        <div class="relative">
                                            <input type="text" name="items[{{ $index }}][name]" 
                                                   value="{{ $item['name'] ?? ($item['product']['name'] ?? ($item['product_name'] ?? '')) }}"
                                                   class="product-search w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                                   placeholder="輸入產品名稱（可搜尋或手動輸入）"
                                                   data-item-index="{{ $index }}">
                                            <input type="hidden" name="items[{{ $index }}][product_id]" class="product-id-input" value="{{ $item['product_id'] ?? '' }}">
                                            <input type="hidden" name="items[{{ $index }}][description]" class="product-description-input" value="{{ $item['description'] ?? '' }}">
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">數量</label>
                                        <input type="number" name="items[{{ $index }}][quantity]" value="{{ $item['quantity'] ?? 1 }}" min="1" 
                                               class="quantity-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                               onchange="updateItemSubtotal(this)">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">單價</label>
                                        <input type="number" name="items[{{ $index }}][unit_price]" value="{{ $item['unit_price'] ?? 0 }}" min="0" step="0.01" 
                                               class="price-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                               onchange="updateItemSubtotal(this)">
                                    </div>
                                    <div class="flex justify-end">
                                        <button type="button" onclick="removeQuoteItem(this)" 
                                                class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                                            刪除
                                        </button>
                                    </div>
                                </div>
                                <div class="mt-4 text-right">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">小計: </span>
                                    <span class="item-subtotal text-lg font-medium text-gray-900 dark:text-white">${{ number_format(($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0), 2) }}</span>
                                </div>
                            </div>
                        @endforeach
                    @else
                        <!-- 預設項目 -->
                        <div class="item-row border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                            <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">產品/服務</label>
                                    <div class="relative">
                                            <input type="text" name="items[0][name]" 
                                               class="product-search w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                               placeholder="輸入產品名稱（可搜尋或手動輸入）"
                                               data-item-index="0">
                                        <input type="hidden" name="items[0][product_id]" class="product-id-input" value="">
                                        <input type="hidden" name="items[0][description]" class="product-description-input" value="">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">數量</label>
                                    <input type="number" name="items[0][quantity]" value="1" min="1" 
                                           class="quantity-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                           onchange="updateItemSubtotal(this)">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">單價</label>
                                    <input type="number" name="items[0][unit_price]" value="1000" min="0" step="0.01" 
                                           class="price-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                           onchange="updateItemSubtotal(this)">
                                </div>
                                <div class="flex justify-end">
                                    <button type="button" onclick="removeQuoteItem(this)" 
                                            class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                                        刪除
                                    </button>
                                </div>
                            </div>
                            <div class="mt-4 text-right">
                                <span class="text-sm text-gray-600 dark:text-gray-400">小計: </span>
                                <span class="item-subtotal text-lg font-medium text-gray-900 dark:text-white">$1,000.00</span>
                            </div>
                        </div>
                    @endif
                </div>
            </div>

            <!-- 金額摘要 -->
            <div class="px-6 py-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <div class="max-w-md ml-auto">
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">小計:</span>
                            <span id="subtotalAmount" class="text-gray-900 dark:text-white">$1,000.00</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">稅額 (5%):</span>
                            <span id="taxAmount" class="text-gray-900 dark:text-white">$50.00</span>
                        </div>
                        <div class="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
                            <span class="text-gray-900 dark:text-white">總計:</span>
                            <span id="totalAmount" class="text-gray-900 dark:text-white">$1,050.00</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 操作按鈕 -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3">
                @if(isset($customerId))
                    <button type="button" onclick="window.location.href='{{ route('customers.show', $customerId) }}'"
                            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        取消
                    </button>
                @else
                    <button type="button" onclick="window.location.href='{{ route('customers.index') }}'"
                            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        取消
                    </button>
                @endif
                <button type="submit" onclick="return validateForm()"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    {{ $mode === 'create' ? '建立報價單' : '更新報價單' }}
                </button>
            </div>
        </form>
    </div>
</div>

<!-- 載入 ProductAutocomplete 組件 -->
<script src="{{ asset('js/components/product-autocomplete.js') }}"></script>

<script>
@if(isset($quote) && isset($quote['items']) && is_array($quote['items']))
let itemIndex = {{ count($quote['items']) }};
@else
let itemIndex = 1;
@endif

function addQuoteItem() {
    const itemsList = document.getElementById('itemsList');
    const newItem = document.createElement('div');
    newItem.className = 'item-row border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800';
    newItem.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">產品/服務</label>
                <div class="relative">
                    <input type="text" name="items[${itemIndex}][name]" 
                           class="product-search w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                           placeholder="輸入產品名稱（可搜尋或手動輸入）"
                           data-item-index="${itemIndex}">
                    <input type="hidden" name="items[${itemIndex}][product_id]" class="product-id-input" value="">
                    <input type="hidden" name="items[${itemIndex}][description]" class="product-description-input" value="">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">數量</label>
                <input type="number" name="items[${itemIndex}][quantity]" value="1" min="1" 
                       class="quantity-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                       onchange="updateItemSubtotal(this)">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">單價</label>
                <input type="number" name="items[${itemIndex}][unit_price]" value="0" min="0" step="0.01" 
                       class="price-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                       onchange="updateItemSubtotal(this)">
            </div>
            <div class="flex justify-end">
                <button type="button" onclick="removeQuoteItem(this)" 
                        class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                    刪除
                </button>
            </div>
        </div>
        <div class="mt-4 text-right">
            <span class="text-sm text-gray-600 dark:text-gray-400">小計: </span>
            <span class="item-subtotal text-lg font-medium text-gray-900 dark:text-white">$0.00</span>
        </div>
    `;
    itemsList.appendChild(newItem);
    itemIndex++;
}

function removeQuoteItem(button) {
    const itemRow = button.closest('.item-row');
    itemRow.remove();
    updateTotals();
}

function updateItemSubtotal(input) {
    const itemRow = input.closest('.item-row');
    const quantityInput = itemRow.querySelector('.quantity-input');
    const priceInput = itemRow.querySelector('.price-input');
    const subtotalElement = itemRow.querySelector('.item-subtotal');
    
    const quantity = parseFloat(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const subtotal = quantity * price;
    
    subtotalElement.textContent = '$' + subtotal.toLocaleString('en-US', {minimumFractionDigits: 2});
    updateTotals();
}

function updateTotals() {
    let subtotal = 0;
    
    document.querySelectorAll('.item-row').forEach(itemRow => {
        const quantityInput = itemRow.querySelector('.quantity-input');
        const priceInput = itemRow.querySelector('.price-input');
        
        if (quantityInput && priceInput) {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            subtotal += quantity * price;
        }
    });
    
    const taxRate = 0.05; // 5% 稅率
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    document.getElementById('subtotalAmount').textContent = '$' + subtotal.toLocaleString('en-US', {minimumFractionDigits: 2});
    document.getElementById('taxAmount').textContent = '$' + taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2});
    document.getElementById('totalAmount').textContent = '$' + total.toLocaleString('en-US', {minimumFractionDigits: 2});
}

// 更新聯絡人資訊
function updateContactPerson(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const contactPersonInput = document.getElementById('contact_person');
    
    if (selectedOption && selectedOption.value && contactPersonInput) {
        const contactPerson = selectedOption.getAttribute('data-contact-person');
        if (contactPerson) {
            contactPersonInput.value = contactPerson;
        }
    }
}


// 初始化產品自動完成組件
function initializeProductAutocomplete(input) {
    const itemIndex = input.getAttribute('data-item-index');
    const itemRow = input.closest('.item-row');
    const quantityInput = itemRow.querySelector('.quantity-input');
    const priceInput = itemRow.querySelector('.price-input');
    const productIdInput = itemRow.querySelector('.product-id-input');
    const descriptionInput = itemRow.querySelector('.product-description-input');
    
    new ProductAutocomplete(input, {
        onSelect: function(product) {
            // 設置產品名稱到輸入框（最重要！）
            input.value = product.name || product.title || '';
            
            // 自動填入產品資訊
            if (productIdInput) productIdInput.value = product.id;
            if (descriptionInput) descriptionInput.value = product.description || '';
            if (priceInput) priceInput.value = product.unit_price || 0;
            
            // 觸發金額重新計算
            updateItemSubtotal(priceInput);
            
            console.log('Product selected:', product);
        },
        onError: function(error) {
            console.error('Product search error:', error);
        }
    });
}

// 初始化頁面時計算總計和設置自動完成
document.addEventListener('DOMContentLoaded', function() {
    updateTotals();
    
    // 初始化現有的產品搜尋輸入框
    const existingInputs = document.querySelectorAll('.product-search');
    existingInputs.forEach(input => {
        initializeProductAutocomplete(input);
        
        // 添加輸入事件監聽器，清除錯誤樣式
        input.addEventListener('input', function() {
            if (this.value.trim()) {
                this.style.borderColor = ''; // 清除紅色邊框
            }
        });
    });
    
    // 如果有預選客戶，自動觸發聯絡人更新
    const customerSelect = document.getElementById('customer_id');
    if (customerSelect && customerSelect.value) {
        updateContactPerson(customerSelect);
    }
});

// 修改 addQuoteItem 函數以初始化新添加項目的自動完成
const originalAddQuoteItem = addQuoteItem;
addQuoteItem = function() {
    originalAddQuoteItem();
    
    // 找到剛添加的產品輸入框並初始化自動完成
    const newProductInput = document.querySelector(`input[data-item-index="${itemIndex - 1}"]`);
    if (newProductInput) {
        initializeProductAutocomplete(newProductInput);
        
        // 為新項目添加輸入事件監聽器，清除錯誤樣式
        newProductInput.addEventListener('input', function() {
            if (this.value.trim()) {
                this.style.borderColor = ''; // 清除紅色邊框
            }
        });
    }
};

// 表單驗證函數
function validateForm() {
    let isValid = true;
    let errors = [];
    
    // 檢查客戶選擇
    const customerSelect = document.getElementById('customer_id');
    console.log('Customer value:', customerSelect.value, 'selectedIndex:', customerSelect.selectedIndex);
    if (!customerSelect.value || customerSelect.value === '') {
        errors.push('請選擇客戶');
        customerSelect.style.borderColor = '#ef4444'; // 添加紅色邊框
        isValid = false;
    } else {
        customerSelect.style.borderColor = ''; // 清除錯誤樣式
    }
    
    // 檢查報價日期
    const quoteDate = document.getElementById('quote_date');
    console.log('Quote date:', quoteDate.value);
    if (!quoteDate.value) {
        errors.push('請選擇報價日期');
        isValid = false;
    }
    
    // 檢查有效期限
    const validUntil = document.getElementById('valid_until');
    console.log('Valid until:', validUntil.value);
    if (!validUntil.value) {
        errors.push('請選擇有效期限');
        isValid = false;
    }
    
    // 檢查產品項目
    const productInputs = document.querySelectorAll('.product-search');
    let hasValidItem = false;
    
    productInputs.forEach((input, index) => {
        const value = input.value.trim();
        const placeholder = input.getAttribute('placeholder');
        console.log(`Product ${index + 1}: value="${value}", placeholder="${placeholder}", length=${value.length}`);
        
        // 允許手動輸入產品名稱（至少2個字元）
        if (value && value !== placeholder && value.length >= 2) {
            hasValidItem = true;
            // 清除錯誤樣式
            input.style.borderColor = '';
            
            // 檢查對應的數量和單價
            const itemRow = input.closest('.item-row');
            const quantityInput = itemRow.querySelector('.quantity-input');
            const priceInput = itemRow.querySelector('.price-input');
            
            console.log(`Item ${index + 1} - Quantity:`, quantityInput.value, 'Price:', priceInput.value);
            
            if (!quantityInput.value || parseFloat(quantityInput.value) <= 0) {
                errors.push(`產品項目 ${index + 1} 的數量必須大於 0`);
                isValid = false;
            }
            
            if (!priceInput.value || parseFloat(priceInput.value) < 0) {
                errors.push(`產品項目 ${index + 1} 的單價不能為負數`);
                isValid = false;
            }
        } else {
            errors.push(`產品項目 ${index + 1} 的名稱不能為空且需至少2個字元`);
            input.style.borderColor = '#ef4444'; // 紅色邊框
            isValid = false;
        }
    });
    
    if (!hasValidItem) {
        errors.push('至少需要一個有效的產品項目');
        isValid = false;
    }
    
    // 顯示錯誤訊息或提交表單
    if (!isValid) {
        console.log('Validation errors:', errors);
        alert('請修正以下錯誤：\n' + errors.join('\n'));
        return false;
    }
    
    console.log('Validation passed, submitting form...');
    
    // 記錄所有表單數據用於除錯
    const formData = new FormData(document.getElementById('quoteForm'));
    console.log('Form data being submitted:');
    for (let [key, value] of formData.entries()) {
        console.log(key, ':', value);
    }
    
    return true;
}
</script>

@endsection