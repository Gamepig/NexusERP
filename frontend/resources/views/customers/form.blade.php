@extends('layouts.app')

@section('title', $mode === 'create' ? '新增客戶' : '編輯客戶')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <nav class="flex mb-2" aria-label="Breadcrumb">
                <ol role="list" class="flex items-center space-x-2">
                    <li>
                        <a href="{{ route('customers.index') }}" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            客戶管理
                        </a>
                    </li>
                    <li>
                        <svg class="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </li>
                    <li>
                        <span class="text-gray-500 dark:text-gray-400">
                            {{ $mode === 'create' ? '新增客戶' : '編輯客戶' }}
                        </span>
                    </li>
                </ol>
            </nav>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {{ $mode === 'create' ? '新增客戶' : '編輯客戶' }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
                {{ $mode === 'create' ? '建立新的客戶資料' : '修改現有客戶資訊' }}
            </p>
        </div>
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0">
            <!-- Customer Navigation (only for edit mode) -->
            @if($mode === 'edit' && isset($navigation) && $navigation)
            <div class="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                <!-- Previous Customer -->
                @if($navigation['previous'])
                <a href="{{ route('customers.edit', $navigation['previous']['id']) }}" 
                   class="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors duration-200"
                   title="編輯上一個客戶: {{ $navigation['previous']['name'] }}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                </a>
                @else
                <span class="text-gray-300 dark:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                </span>
                @endif
                
                <!-- Position indicator -->
                <span class="text-sm text-gray-600 dark:text-gray-300 font-medium px-2">
                    {{ $navigation['current_position'] }} / {{ $navigation['total_customers'] }}
                </span>
                
                <!-- Next Customer -->
                @if($navigation['next'])
                <a href="{{ route('customers.edit', $navigation['next']['id']) }}" 
                   class="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors duration-200"
                   title="編輯下一個客戶: {{ $navigation['next']['name'] }}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </a>
                @else
                <span class="text-gray-300 dark:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </span>
                @endif
            </div>
            @endif
            
            <!-- Action Buttons -->
            <div class="flex space-x-3">
                @if($mode === 'edit')
                <a href="{{ route('customers.show', $customerId) }}" 
                   class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    查看客戶
                </a>
                @endif
                <a href="{{ route('customers.index') }}" 
                   class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                    返回列表
                </a>
            </div>
        </div>
    </div>

    <!-- Form Section -->
    <div class="max-w-4xl mx-auto">
        <form id="customer-form" method="POST" action="{{ $mode === 'create' ? route('customers.store') : route('customers.update', $customerId ?? 0) }}">
            @csrf
            @if($mode === 'edit')
                @method('PUT')
            @endif
            
            <!-- Basic Information -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">基本資訊</h3>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">請填寫客戶的基本資訊</p>
                </div>
                
                <div class="px-6 py-4 space-y-6">
                    <!-- Customer Type -->
                    <div>
                        <label class="text-base font-medium text-gray-900 dark:text-white">客戶類型</label>
                        <p class="text-sm leading-5 text-gray-500 dark:text-gray-400">選擇客戶的類型</p>
                        <fieldset class="mt-4">
                            <div class="space-y-4">
                                <div class="flex items-center">
                                    <input id="type_individual" name="type" type="radio" value="individual" checked class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300">
                                    <label for="type_individual" class="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        個人客戶
                                    </label>
                                </div>
                                <div class="flex items-center">
                                    <input id="type_company" name="type" type="radio" value="company" class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300">
                                    <label for="type_company" class="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        企業客戶
                                    </label>
                                </div>
                            </div>
                        </fieldset>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Customer Name -->
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                客戶姓名 <span class="text-red-500">*</span>
                            </label>
                            <input type="text" 
                                   id="name" 
                                   name="name" 
                                   required
                                   class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="請輸入客戶姓名">
                        </div>

                        <!-- Company Name (shown only for company type) -->
                        <div id="company_field" style="display: none;">
                            <label for="company" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                公司名稱
                            </label>
                            <input type="text" 
                                   id="company" 
                                   name="company" 
                                   class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="請輸入公司名稱">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Email -->
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                電子郵件 <span class="text-red-500">*</span>
                            </label>
                            <input type="email" 
                                   id="email" 
                                   name="email" 
                                   required
                                   class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="請輸入電子郵件">
                        </div>

                        <!-- Phone -->
                        <div>
                            <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                聯絡電話
                            </label>
                            <input type="tel" 
                                   id="phone" 
                                   name="phone" 
                                   class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="請輸入聯絡電話">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Address Information -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">地址資訊</h3>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">客戶的聯絡地址資訊</p>
                </div>
                
                <div class="px-6 py-4 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Country -->
                        <div>
                            <label for="country" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                國家/地區
                            </label>
                            <select id="country" 
                                    name="country" 
                                    class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                                <option value="">請選擇</option>
                                <option value="TW" selected>台灣</option>
                                <option value="CN">中國</option>
                                <option value="HK">香港</option>
                                <option value="US">美國</option>
                                <option value="JP">日本</option>
                            </select>
                        </div>

                        <!-- City -->
                        <div>
                            <label for="city" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                城市
                            </label>
                            <input type="text" 
                                   id="city" 
                                   name="city" 
                                   class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="請輸入城市">
                        </div>

                        <!-- Postal Code -->
                        <div>
                            <label for="postal_code" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                郵遞區號
                            </label>
                            <input type="text" 
                                   id="postal_code" 
                                   name="postal_code" 
                                   class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="請輸入郵遞區號">
                        </div>
                    </div>

                    <!-- Address -->
                    <div>
                        <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            詳細地址
                        </label>
                        <textarea id="address" 
                                  name="address" 
                                  rows="3" 
                                  class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                  placeholder="請輸入詳細地址"></textarea>
                    </div>
                </div>
            </div>

            <!-- Additional Information -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">其他資訊</h3>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">額外的客戶資訊</p>
                </div>
                
                <div class="px-6 py-4 space-y-6">
                    <!-- Notes -->
                    <div>
                        <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            備註
                        </label>
                        <textarea id="notes" 
                                  name="notes" 
                                  rows="4" 
                                  class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                  placeholder="請輸入客戶相關備註..."></textarea>
                    </div>

                    <!-- Status -->
                    <div>
                        <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            狀態
                        </label>
                        <select id="status" 
                                name="status" 
                                class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                            <option value="active" selected>活躍</option>
                            <option value="inactive">非活躍</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-3">
                <a href="{{ route('customers.index') }}" 
                   class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    取消
                </a>
                <button type="submit" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    {{ $mode === 'create' ? '建立客戶' : '更新客戶' }}
                </button>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Handle customer type change
    const typeRadios = document.querySelectorAll('input[name="type"]');
    const companyField = document.getElementById('company_field');
    
    typeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'company') {
                companyField.style.display = 'block';
                document.getElementById('company').required = true;
            } else {
                companyField.style.display = 'none';
                document.getElementById('company').required = false;
            }
        });
    });
    
    // Form validation
    const form = document.getElementById('customer-form');
    form.addEventListener('submit', function(e) {
        // Basic validation
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        
        if (!name) {
            e.preventDefault();
            alert('請輸入客戶姓名');
            document.getElementById('name').focus();
            return;
        }
        
        if (!email) {
            e.preventDefault();
            alert('請輸入電子郵件');
            document.getElementById('email').focus();
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            e.preventDefault();
            alert('請輸入有效的電子郵件地址');
            document.getElementById('email').focus();
            return;
        }
        
        // If all validation passes, let the form submit normally
        console.log('客戶資料驗證通過，正在提交...');
    });
    
    @if($mode === 'edit' && isset($customer))
    // Load existing customer data for edit mode
    fillCustomerData(@json($customer));
    @endif
});

function fillCustomerData(customer) {
    // Set customer type FIRST before filling other fields
    let customerType = 'individual'; // default
    if (customer.customer_type === 'business' || customer.type === 'company') {
        customerType = 'company';
    }
    
    const typeRadio = document.querySelector(`input[name="type"][value="${customerType}"]`);
    if (typeRadio) {
        typeRadio.checked = true;
        typeRadio.dispatchEvent(new Event('change'));
    }
    
    // Fill form fields with existing customer data (after type is set)
    document.getElementById('name').value = customer.name || '';
    document.getElementById('email').value = customer.primary_email || customer.email || '';
    document.getElementById('phone').value = customer.primary_phone || customer.phone || '';
    
    // Fill company name (now the field should be visible if customer type is company)
    const companyField = document.getElementById('company');
    if (companyField) {
        companyField.value = customer.company_name || customer.company || '';
    }
    
    document.getElementById('country').value = customer.country || 'TW';
    document.getElementById('city').value = customer.city || '';
    document.getElementById('postal_code').value = customer.postal_code || '';
    document.getElementById('address').value = customer.address_line1 || customer.address || '';
    document.getElementById('notes').value = customer.notes || '';
    document.getElementById('status').value = customer.status || 'active';
    
    console.log('客戶資料已預填', customer);
}
</script>
@endpush
@endsection