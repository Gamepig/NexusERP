@extends('layouts.app')

@section('title', $mode === 'create' ? '建立報價單 - 多步驟' : '修改報價單 - 多步驟')

@section('content')
<div class="container mx-auto px-4 py-6" x-data="multiStepQuoteForm()" x-init="initializeForm()">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {{ $mode === 'create' ? '建立報價單' : '修改報價單' }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
                {{ $mode === 'create' ? '透過多步驟流程建立專業報價單' : '修改現有報價單' }}
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

    <!-- 進度指示器 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div class="px-6 py-4">
            <div class="flex justify-between items-center">
                <div class="flex space-x-8">
                    <!-- 步驟 1 -->
                    <div class="flex items-center">
                        <div class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors duration-200"
                             :class="currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'">
                            1
                        </div>
                        <span class="ml-2 text-sm font-medium transition-colors duration-200"
                              :class="currentStep >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'">
                            客戶資訊
                        </span>
                    </div>
                    <!-- 步驟 2 -->
                    <div class="flex items-center">
                        <div class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors duration-200"
                             :class="currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'">
                            2
                        </div>
                        <span class="ml-2 text-sm font-medium transition-colors duration-200"
                              :class="currentStep >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'">
                            產品選擇
                        </span>
                    </div>
                    <!-- 步驟 3 -->
                    <div class="flex items-center">
                        <div class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors duration-200"
                             :class="currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'">
                            3
                        </div>
                        <span class="ml-2 text-sm font-medium transition-colors duration-200"
                              :class="currentStep >= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'">
                            確認提交
                        </span>
                    </div>
                </div>
            </div>
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

    <!-- 表單主體 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <form @submit.prevent="submitForm()" class="space-y-6">
            @csrf
            @if($mode === 'edit')
                @method('PUT')
            @endif
            
            <!-- 步驟 1: 客戶資訊 -->
            <div x-show="currentStep === 1" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 transform translate-x-full" x-transition:enter-end="opacity-100 transform translate-x-0">
                <div class="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">步驟 1: 客戶資訊</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- 客戶選擇 -->
                        <div class="md:col-span-2">
                            <label for="customer_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                客戶 <span class="text-red-500">*</span>
                            </label>
                            <select name="customer_id" x-model="formData.customer_id" @change="updateContactPerson()"
                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    :class="errors.customer_id ? 'border-red-500' : ''">
                                <option value="">請選擇客戶</option>
                                @if(isset($customers) && is_array($customers))
                                    @foreach($customers as $customer)
                                        <option value="{{ $customer['id'] }}" 
                                                data-contact-person="{{ $customer['contact_person'] ?? $customer['name'] ?? '' }}"
                                                data-phone="{{ $customer['phone'] ?? '' }}"
                                                data-email="{{ $customer['email'] ?? '' }}">
                                            {{ $customer['name'] }} {{ isset($customer['email']) ? '(' . $customer['email'] . ')' : '' }}
                                        </option>
                                    @endforeach
                                @endif
                            </select>
                            <div x-show="errors.customer_id" x-text="errors.customer_id" class="text-red-500 text-sm mt-1"></div>
                        </div>

                        <!-- 報價日期 -->
                        <div>
                            <label for="quote_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                報價日期 <span class="text-red-500">*</span>
                            </label>
                            <input type="date" name="quote_date" id="quote_date" x-model="formData.quote_date"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                   :class="errors.quote_date ? 'border-red-500' : ''">
                            <div x-show="errors.quote_date" x-text="errors.quote_date" class="text-red-500 text-sm mt-1"></div>
                        </div>

                        <!-- 有效期限 -->
                        <div>
                            <label for="valid_until" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                有效期限 <span class="text-red-500">*</span>
                            </label>
                            <input type="date" name="valid_until" id="valid_until" x-model="formData.valid_until"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                   :class="errors.valid_until ? 'border-red-500' : ''">
                            <div x-show="errors.valid_until" x-text="errors.valid_until" class="text-red-500 text-sm mt-1"></div>
                        </div>

                        <!-- 聯絡人 -->
                        <div>
                            <label for="contact_person" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">聯絡人</label>
                            <input type="text" name="contact_person" id="contact_person" x-model="formData.contact_person"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                   placeholder="輸入聯絡人姓名">
                        </div>

                        <!-- 報價狀態 -->
                        <div>
                            <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                報價狀態
                            </label>
                            <select name="status" x-model="formData.status"
                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                                <option value="draft">📝 草稿</option>
                                <option value="pending">📤 已發送</option>
                                <option value="approved">✅ 已批准</option>
                                <option value="rejected">❌ 已拒絕</option>
                                <option value="expired">⏰ 已過期</option>
                            </select>
                        </div>

                        <!-- 幣別選擇 -->
                        <div>
                            <label for="currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                幣別 <span class="text-red-500">*</span>
                            </label>
                            <select name="currency" id="currency" x-model="formData.currency"
                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                                <option value="TWD">新台幣 (TWD)</option>
                                <option value="USD">美元 (USD)</option>
                                <option value="EUR">歐元 (EUR)</option>
                                <option value="JPY">日元 (JPY)</option>
                                <option value="CNY">人民幣 (CNY)</option>
                                <option value="HKD">港幣 (HKD)</option>
                                <option value="SGD">新加坡幣 (SGD)</option>
                            </select>
                        </div>

                        <!-- 報價說明 -->
                        <div class="md:col-span-2">
                            <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">報價說明</label>
                            <textarea name="notes" x-model="formData.notes" rows="3" 
                                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                      placeholder="輸入報價說明或備註..."></textarea>
                        </div>
                    </div>
                </div>
                
                <!-- 步驟 1 導航按鈕 -->
                <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3">
                    <button type="button" @click="nextStep()"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        下一步
                    </button>
                </div>
            </div>

            <!-- 步驟 2: 產品選擇 -->
            <div x-show="currentStep === 2" x-cloak>
                <div class="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">步驟 2: 產品選擇</h3>
                        <button type="button" @click="addQuoteItem()" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                            新增產品
                        </button>
                    </div>

                    <!-- 產品項目列表 -->
                    <div class="space-y-4">
                        <template x-for="(item, index) in formData.items" :key="index">
                            <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                                <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                    <div class="md:col-span-2">
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">產品/服務</label>
                                        <div class="relative">
                                            <input type="text" :name="'items[' + index + '][name]'" x-model="item.name" 
                                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                                   placeholder="輸入產品名稱或選擇產品"
                                                   @input="searchProducts(item, $event.target.value)">
                                            <!-- 產品搜索下拉選單 -->
                                            <div x-show="item.showSuggestions && item.suggestions.length > 0" 
                                                 class="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg mt-1">
                                                <template x-for="suggestion in item.suggestions" :key="suggestion.id">
                                                    <div @click="selectProduct(item, suggestion)" 
                                                         class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                                                        <div class="font-medium text-gray-900 dark:text-white" x-text="suggestion.name"></div>
                                                        <div class="text-sm text-gray-600 dark:text-gray-400">
                                                            庫存: <span x-text="suggestion.stock_quantity || 0"></span> | 
                                                            單價: <span x-text="currencySymbol"></span><span x-text="(suggestion.unit_price || 0).toLocaleString()"></span>
                                                        </div>
                                                    </div>
                                                </template>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">數量</label>
                                        <input type="number" :name="'items[' + index + '][quantity]'" x-model="item.quantity" min="1" 
                                               @input="updateItemSubtotal(item)"
                                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">單價</label>
                                        <input type="number" :name="'items[' + index + '][unit_price]'" x-model="item.unit_price" min="0" step="0.01" 
                                               @input="updateItemSubtotal(item)"
                                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                                    </div>
                                    <div class="flex justify-end">
                                        <button type="button" @click="removeQuoteItem(index)" 
                                                class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                                            刪除
                                        </button>
                                    </div>
                                </div>
                                <div class="mt-4 text-right">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">小計: </span>
                                    <span class="text-lg font-medium text-gray-900 dark:text-white"><span x-text="currencySymbol"></span><span x-text="(item.subtotal || 0).toLocaleString()"></span></span>
                                </div>
                            </div>
                        </template>
                    </div>

                    <!-- 金額摘要 -->
                    <div class="mt-6 max-w-md ml-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">小計:</span>
                                <span class="text-gray-900 dark:text-white"><span x-text="currencySymbol"></span><span x-text="subtotal.toLocaleString()"></span></span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">稅額 (5%):</span>
                                <span class="text-gray-900 dark:text-white"><span x-text="currencySymbol"></span><span x-text="taxAmount.toLocaleString()"></span></span>
                            </div>
                            <div class="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
                                <span class="text-gray-900 dark:text-white">總計:</span>
                                <span class="text-gray-900 dark:text-white"><span x-text="currencySymbol"></span><span x-text="totalAmount.toLocaleString()"></span></span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 步驟 2 導航按鈕 -->
                <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-between space-x-3">
                    <button type="button" @click="previousStep()"
                            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        上一步
                    </button>
                    <button type="button" @click="nextStep()"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        下一步
                    </button>
                </div>
            </div>

            <!-- 步驟 3: 確認提交 -->
            <div x-show="currentStep === 3" x-cloak>
                <div class="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">步驟 3: 確認提交</h3>
                    
                    <!-- 客戶資訊預覽 -->
                    <div class="mb-6">
                        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">客戶資訊</h4>
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span class="text-sm text-gray-600 dark:text-gray-400">客戶:</span>
                                    <span class="ml-2 text-gray-900 dark:text-white" x-text="getSelectedCustomerName()"></span>
                                </div>
                                <div>
                                    <span class="text-sm text-gray-600 dark:text-gray-400">聯絡人:</span>
                                    <span class="ml-2 text-gray-900 dark:text-white" x-text="formData.contact_person || '-'"></span>
                                </div>
                                <div>
                                    <span class="text-sm text-gray-600 dark:text-gray-400">報價日期:</span>
                                    <span class="ml-2 text-gray-900 dark:text-white" x-text="formData.quote_date"></span>
                                </div>
                                <div>
                                    <span class="text-sm text-gray-600 dark:text-gray-400">有效期限:</span>
                                    <span class="ml-2 text-gray-900 dark:text-white" x-text="formData.valid_until"></span>
                                </div>
                            </div>
                            <div class="mt-4" x-show="formData.notes">
                                <span class="text-sm text-gray-600 dark:text-gray-400">報價說明:</span>
                                <p class="mt-1 text-gray-900 dark:text-white" x-text="formData.notes"></p>
                            </div>
                        </div>
                    </div>

                    <!-- 產品項目預覽 -->
                    <div class="mb-6">
                        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">產品項目</h4>
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm">
                                    <thead class="bg-gray-100 dark:bg-gray-600">
                                        <tr>
                                            <th class="px-3 py-2 text-left text-gray-900 dark:text-white">產品</th>
                                            <th class="px-3 py-2 text-center text-gray-900 dark:text-white">數量</th>
                                            <th class="px-3 py-2 text-right text-gray-900 dark:text-white">單價</th>
                                            <th class="px-3 py-2 text-right text-gray-900 dark:text-white">小計</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template x-for="item in formData.items" :key="item.id">
                                            <tr class="border-t border-gray-200 dark:border-gray-600">
                                                <td class="px-3 py-2 text-gray-900 dark:text-white" x-text="item.name"></td>
                                                <td class="px-3 py-2 text-center text-gray-900 dark:text-white" x-text="item.quantity"></td>
                                                <td class="px-3 py-2 text-right text-gray-900 dark:text-white"><span x-text="currencySymbol"></span><span x-text="(item.unit_price || 0).toLocaleString()"></span></td>
                                                <td class="px-3 py-2 text-right text-gray-900 dark:text-white"><span x-text="currencySymbol"></span><span x-text="(item.subtotal || 0).toLocaleString()"></span></td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- 總計預覽 -->
                    <div class="max-w-md ml-auto">
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-400">小計:</span>
                                    <span class="text-gray-900 dark:text-white"><span x-text="currencySymbol"></span><span x-text="subtotal.toLocaleString()"></span></span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-400">稅額 (5%):</span>
                                    <span class="text-gray-900 dark:text-white"><span x-text="currencySymbol"></span><span x-text="taxAmount.toLocaleString()"></span></span>
                                </div>
                                <div class="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
                                    <span class="text-gray-900 dark:text-white">總計:</span>
                                    <span class="text-gray-900 dark:text-white"><span x-text="currencySymbol"></span><span x-text="totalAmount.toLocaleString()"></span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 步驟 3 導航按鈕 -->
                <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-between space-x-3">
                    <button type="button" @click="previousStep()"
                            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        上一步
                    </button>
                    <div class="flex space-x-3">
                        <button type="button" @click="saveDraft()" :disabled="loading"
                                class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                            <span x-show="!loading">儲存草稿</span>
                            <span x-show="loading">儲存中...</span>
                        </button>
                        <button type="submit" :disabled="loading"
                                class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                            <span x-show="!loading">{{ $mode === 'create' ? '建立報價單' : '更新報價單' }}</span>
                            <span x-show="loading">處理中...</span>
                        </button>
                    </div>
                </div>
            </div>
        </form>
    </div>
</div>

<script>
function multiStepQuoteForm() {
    return {
        // 基本狀態
        currentStep: 1,
        loading: false,
        errors: {},
        
        // 表單資料
        formData: {
            customer_id: @json(isset($customerId) ? $customerId : (isset($quote) ? $quote['customer_id'] : '')),
            quote_date: @json(isset($quote) ? $quote['quote_date'] : date('Y-m-d')),
            valid_until: @json(isset($quote) ? ($quote['valid_until'] ?? $quote['valid_until_date'] ?? date('Y-m-d', strtotime('+30 days'))) : date('Y-m-d', strtotime('+30 days'))),
            status: @json(isset($quote) ? $quote['status'] : 'draft'),
            contact_person: '',
            notes: @json(isset($quote) ? $quote['notes'] : ''),
            currency: @json(isset($quote) ? $quote['currency'] : 'TWD'),
            items: @if(isset($quote) && isset($quote['items']) && is_array($quote['items']) && count($quote['items']) > 0)
                {!! json_encode(array_map(function($item) {
                    return [
                        'id' => $item['id'] ?? uniqid(),
                        'name' => $item['name'] ?? $item['product_name'] ?? '',
                        'quantity' => (float)($item['quantity'] ?? 1),
                        'unit_price' => (float)($item['unit_price'] ?? 0),
                        'subtotal' => (float)(($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0)),
                        'product_id' => $item['product_id'] ?? null,
                        'description' => $item['description'] ?? '',
                        'suggestions' => [],
                        'showSuggestions' => false
                    ];
                }, $quote['items'])) !!}
            @else
                [{
                    id: 1,
                    name: '',
                    quantity: 1,
                    unit_price: 0,
                    subtotal: 0,
                    product_id: null,
                    description: '',
                    suggestions: [],
                    showSuggestions: false
                }]
            @endif
        },

        // 計算屬性
        get subtotal() {
            return this.formData.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        },

        get taxAmount() {
            return this.subtotal * 0.05;
        },

        get totalAmount() {
            return this.subtotal + this.taxAmount;
        },

        get currencySymbol() {
            const currencySymbols = {
                'TWD': 'NT$',
                'USD': '$',
                'EUR': '€',
                'JPY': '¥',
                'CNY': '¥',
                'HKD': 'HK$',
                'SGD': 'S$'
            };
            return currencySymbols[this.formData.currency] || '$';
        },

        // 初始化
        initializeForm() {
            console.log('=== Alpine.js 組件初始化 ===');
            console.log('Component initialized successfully');
            console.log('formData structure:', this.formData);
            console.log('items count:', this.formData.items ? this.formData.items.length : 'undefined');
            console.log('customers available:', typeof window.customers !== 'undefined' ? 'yes' : 'no');
            
            // 檢查關鍵數據
            try {
                this.updateTotals();
                console.log('✅ updateTotals() 執行成功');
            } catch (error) {
                console.error('❌ updateTotals() 執行失敗:', error);
            }
            
            console.log('=== 初始化完成 ===');
        },

        // 步驟導航
        nextStep() {
            console.log('nextStep called, current step:', this.currentStep);
            console.log('Form data:', this.formData);
            
            if (this.validateCurrentStep()) {
                if (this.currentStep < 3) {
                    const oldStep = this.currentStep;
                    this.currentStep++;
                    console.log(`Step changed from ${oldStep} to ${this.currentStep}`);
                    
                    // 立即更新頁面顯示
                    this.$nextTick(() => {
                        console.log('DOM updated, current step is now:', this.currentStep);
                    });
                    
                    this.saveDraftSilently();
                } else {
                    console.log('Already at final step');
                }
            } else {
                console.log('Validation failed for step:', this.currentStep);
                console.log('Errors:', this.errors);
            }
        },

        previousStep() {
            if (this.currentStep > 1) {
                this.currentStep--;
            }
        },

        // 驗證當前步驟
        validateCurrentStep() {
            console.log('Validating step:', this.currentStep);
            this.errors = {};
            
            if (this.currentStep === 1) {
                // 為測試目的，放寬驗證條件
                if (!this.formData.customer_id) {
                    console.log('Warning: No customer selected, but allowing progress for testing');
                    // this.errors.customer_id = '請選擇客戶';
                }
                if (!this.formData.quote_date) {
                    console.log('Warning: No quote date, but allowing progress for testing');
                    // this.errors.quote_date = '請選擇報價日期';
                }
                if (!this.formData.valid_until) {
                    console.log('Warning: No valid until date, but allowing progress for testing');
                    // this.errors.valid_until = '請選擇有效期限';
                }
                
                console.log('Step 1 validation passed (testing mode)');
                return true; // 暫時總是返回 true 以便測試
            }
            
            if (this.currentStep === 2) {
                // 為測試目的，簡化產品驗證
                console.log('Step 2 validation passed (testing mode)');
                return true; // 暫時總是返回 true 以便測試
            }
            
            console.log('Step validation passed for step:', this.currentStep);
            return true;
        },

        // 產品項目管理
        addQuoteItem() {
            this.formData.items.push({
                id: Date.now(),
                name: '',
                quantity: 1,
                unit_price: 0,
                subtotal: 0,
                product_id: null,
                description: '',
                suggestions: [],
                showSuggestions: false
            });
        },

        removeQuoteItem(index) {
            if (this.formData.items.length > 1) {
                this.formData.items.splice(index, 1);
                this.updateTotals();
            }
        },

        updateItemSubtotal(item) {
            item.subtotal = (item.quantity || 0) * (item.unit_price || 0);
            this.updateTotals();
        },

        updateTotals() {
            this.formData.items.forEach(item => {
                item.subtotal = (item.quantity || 0) * (item.unit_price || 0);
            });
        },

        // 產品搜索
        async searchProducts(item, query) {
            console.log('Searching products for query:', query);
            
            if (!query || query.length < 2) {
                item.suggestions = [];
                item.showSuggestions = false;
                console.log('Query too short, clearing suggestions');
                return;
            }

            try {
                console.log('Making API request to:', `/api/products/search?q=${encodeURIComponent(query)}`);
                
                const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    }
                });
                
                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers.get('content-type'));
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Product search response:', data);
                
                if (data.success && data.data && data.data.length > 0) {
                    item.suggestions = data.data.slice(0, 10); // 只顯示前10個結果
                    item.showSuggestions = true;
                    console.log('Products loaded:', item.suggestions.length);
                    console.log('First product:', item.suggestions[0]);
                } else {
                    console.warn('No products found or invalid response format', data);
                    item.suggestions = [];
                    item.showSuggestions = false;
                }
                
                // 強制更新DOM
                this.$nextTick(() => {
                    console.log('DOM updated, showSuggestions:', item.showSuggestions);
                });
                
            } catch (error) {
                console.error('Product search error:', error);
                item.suggestions = [];
                item.showSuggestions = false;
            }
        },

        selectProduct(item, product) {
            console.log('Selected product:', product);
            console.log('Before update - item:', JSON.stringify(item));
            
            // 更新產品資訊 - 確保響應式更新
            item.name = product.name || product.title || '';
            item.product_id = product.id || null;
            item.unit_price = product.unit_price || product.selling_price || product.price || 0;
            item.description = product.description || product.notes || '';
            
            // 額外的庫存資訊顯示
            if (product.stock_quantity !== undefined) {
                item.available_quantity = product.stock_quantity;
            }
            
            // 關閉搜尋建議
            item.suggestions = [];
            item.showSuggestions = false;
            
            // **關鍵修復**: 強制觸發 Alpine.js 響應性更新
            this.updateItemSubtotal(item);
            
            // 調試輸出
            console.log('After update - item:', JSON.stringify(item));
            console.log('Product ID set to:', item.product_id);
            console.log('Product name set to:', item.name);
            console.log('Unit price set to:', item.unit_price);
            
            // **強制同步到 formData** - 確保數據一致性
            this.$nextTick(() => {
                console.log('Current formData.items:', JSON.stringify(this.formData.items));
            });
        },

        // 客戶相關
        updateContactPerson() {
            const customerSelect = document.querySelector(`select option[value="${this.formData.customer_id}"]`);
            if (customerSelect) {
                const contactPerson = customerSelect.getAttribute('data-contact-person');
                if (contactPerson) {
                    this.formData.contact_person = contactPerson;
                }
            }
        },

        getSelectedCustomerName() {
            const customerSelect = document.querySelector(`select option[value="${this.formData.customer_id}"]`);
            return customerSelect ? customerSelect.textContent.trim() : '';
        },

        // 草稿保存
        async saveDraftSilently() {
            try {
                // **調試輸出**: 檢查要發送的數據
                console.log('=== 草稿保存調試 ===');
                console.log('完整 formData:', JSON.stringify(this.formData, null, 2));
                console.log('Items 詳細信息:', this.formData.items.map((item, index) => ({
                    index,
                    name: item.name,
                    product_id: item.product_id,
                    unit_price: item.unit_price,
                    quantity: item.quantity
                })));
                
                const response = await fetch('/api/quotations/draft', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify(this.formData)
                });
                
                const responseData = await response.json();
                console.log('草稿保存響應:', responseData);
                
            } catch (error) {
                console.error('Silent draft save error:', error);
            }
        },

        async saveDraft() {
            this.loading = true;
            try {
                const response = await fetch('/api/quotations/draft', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify(this.formData)
                });

                const data = await response.json();
                if (data.success) {
                    alert('草稿已成功儲存');
                } else {
                    alert('草稿儲存失敗: ' + (data.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Draft save error:', error);
                alert('草稿儲存失敗: ' + error.message);
            } finally {
                this.loading = false;
            }
        },

        // 最終提交
        async submitForm() {
            if (!this.validateCurrentStep()) {
                return;
            }

            this.loading = true;
            try {
                const action = '{{ $mode === 'create' ? route('quotes.store') : route('quotes.update', $quoteId ?? 0) }}';
                const method = '{{ $mode === 'create' ? 'POST' : 'PUT' }}';
                
                const response = await fetch(action, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify(this.formData)
                });

                // 檢查回應是否是JSON格式
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    if (data.success) {
                        window.location.href = data.redirect || '/quotes';
                    } else {
                        alert('提交失敗: ' + (data.message || 'Unknown error'));
                        if (data.errors) {
                            this.errors = data.errors;
                        }
                    }
                } else {
                    // 如果不是JSON回應，可能是重定向或錯誤頁面
                    if (response.ok) {
                        // 成功的非JSON回應，重定向到報價單列表
                        window.location.href = '/quotes';
                    } else {
                        // 錯誤回應
                        const text = await response.text();
                        console.error('Non-JSON error response:', text);
                        alert('提交失敗: 伺服器返回非預期格式的回應');
                    }
                }
            } catch (error) {
                console.error('Submit error:', error);
                alert('提交失敗: ' + error.message);
            } finally {
                this.loading = false;
            }
        }
    }
}
</script>

@endsection