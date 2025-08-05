@extends('layouts.app')

@section('title', $mode === 'edit' ? '編輯供應商' : '新增供應商')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {{ $mode === 'edit' ? '編輯供應商' : '新增供應商' }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
                {{ $mode === 'edit' ? '修改供應商的詳細資訊' : '建立新的供應商資料' }}
            </p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('suppliers.index') }}" 
               class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回列表
            </a>
        </div>
    </div>

    <!-- Supplier Form -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">供應商資訊</h3>
        </div>
        
        <form id="supplier-form" class="p-6">
            @csrf
            @if($mode === 'edit')
                @method('PUT')
                <input type="hidden" id="supplier-id" value="{{ $supplierId ?? '' }}">
            @endif

            <!-- Loading state -->
            <div id="form-loading" class="hidden text-center py-8">
                <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white transition ease-in-out duration-150">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    載入中...
                </div>
            </div>

            <!-- Form content -->
            <div id="form-content">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Company Information -->
                    <div class="space-y-6">
                        <h4 class="text-lg font-medium text-gray-900 dark:text-white">公司資訊</h4>
                        
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                公司名稱 <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="name" name="name" required
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                   placeholder="請輸入公司名稱">
                        </div>

                        <div>
                            <label for="code" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                供應商代碼 <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="code" name="code" required
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                   placeholder="請輸入供應商代碼">
                        </div>

                        <!-- 供應商類型欄位已移除，因為資料庫表中不存在 type 欄位 -->

                        <div>
                            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                描述
                            </label>
                            <textarea id="description" name="description" rows="3"
                                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                      placeholder="請輸入供應商描述"></textarea>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div class="space-y-6">
                        <h4 class="text-lg font-medium text-gray-900 dark:text-white">聯絡資訊</h4>
                        
                        <div>
                            <label for="contact_person" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                聯絡人
                            </label>
                            <input type="text" id="contact_person" name="contact_person"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                   placeholder="請輸入聯絡人姓名">
                        </div>

                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                電子郵件
                            </label>
                            <input type="email" id="email" name="email"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                   placeholder="請輸入電子郵件">
                        </div>

                        <div>
                            <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                電話
                            </label>
                            <input type="tel" id="phone" name="phone"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                   placeholder="請輸入電話號碼">
                        </div>

                        <div>
                            <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                地址
                            </label>
                            <textarea id="address" name="address" rows="3"
                                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                      placeholder="請輸入地址"></textarea>
                        </div>
                    </div>
                </div>

                <!-- Business Information -->
                <div class="mt-8 space-y-6">
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white">商務資訊</h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label for="payment_terms" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                付款條件
                            </label>
                            <input type="text" id="payment_terms" name="payment_terms"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                   placeholder="例如：現金、30天、45天">
                        </div>

                        <div>
                            <label for="credit_limit" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                信用額度
                            </label>
                            <input type="number" id="credit_limit" name="credit_limit" min="0" step="0.01"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                   placeholder="請輸入信用額度">
                        </div>

                        <div>
                            <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                狀態
                            </label>
                            <select id="status" name="status"
                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                                <option value="active" selected>啟用</option>
                                <option value="inactive">停用</option>
                                <option value="pending">待審核</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Submit buttons -->
                <div class="mt-8 flex flex-col sm:flex-row gap-3">
                    <button type="submit" id="submit-btn"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        {{ $mode === 'edit' ? '更新供應商' : '建立供應商' }}
                    </button>
                    
                    <button type="button" onclick="window.location.href='{{ route('suppliers.index') }}'"
                            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        取消
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const mode = '{{ $mode }}';
    const form = document.getElementById('supplier-form');
    const submitBtn = document.getElementById('submit-btn');
    
    // If edit mode, load supplier data
    if (mode === 'edit') {
        loadSupplierData();
    }
    
    // Form submission
    form.addEventListener('submit', handleFormSubmit);
    
    async function loadSupplierData() {
        const supplierId = document.getElementById('supplier-id').value;
        if (!supplierId) return;
        
        const API_BASE_URL = 'http://127.0.0.1:8082';
        
        // Show loading
        document.getElementById('form-loading').classList.remove('hidden');
        document.getElementById('form-content').classList.add('hidden');
        
        try {
            const token = getAuthToken();
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/suppliers/${supplierId}`, {
                method: 'GET',
                credentials: 'include',
                headers: headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const supplier = data.data || data;
            
            // Populate form fields
            populateForm(supplier);
            
            // Hide loading, show form
            document.getElementById('form-loading').classList.add('hidden');
            document.getElementById('form-content').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error loading supplier data:', error);
            alert('載入供應商資料時發生錯誤: ' + error.message);
            
            // Hide loading, show form anyway
            document.getElementById('form-loading').classList.add('hidden');
            document.getElementById('form-content').classList.remove('hidden');
        }
    }
    
    // Enhanced address parsing function
    function parseAddressForDisplay(address) {
        if (!address) return '';
        
        if (typeof address === 'string') {
            try {
                address = JSON.parse(address);
            } catch (e) {
                return address; // If not JSON, use as plain text
            }
        }
        
        if (typeof address === 'object' && address !== null) {
            // Handle {"address": "value"} format (simple wrapper)
            if (address.address && typeof address.address === 'string') {
                return address.address;
            }
            
            // Handle structured address format
            if (address.street || address.city || address.state) {
                const parts = [];
                if (address.street) parts.push(address.street);
                if (address.city) parts.push(address.city);
                if (address.state) parts.push(address.state);
                if (address.zip || address.post_code) parts.push(address.zip || address.post_code);
                if (address.country) parts.push(address.country);
                return parts.join(', ');
            }
            
            // Handle other object formats - extract meaningful string values
            const values = Object.values(address).filter(v => v && typeof v === 'string');
            if (values.length > 0) {
                return values.join(', ');
            }
            
            // Final fallback: formatted JSON
            return JSON.stringify(address, null, 2);
        }
        
        return address.toString();
    }
    
    function populateForm(supplier) {
        document.getElementById('name').value = supplier.name || supplier.company_name || '';
        document.getElementById('code').value = supplier.code || supplier.supplier_code || '';
        // type 欄位已移除
        document.getElementById('description').value = supplier.description || supplier.notes || '';
        document.getElementById('contact_person').value = supplier.contact_person || '';
        document.getElementById('email').value = supplier.email || supplier.contact_email || '';
        document.getElementById('phone').value = supplier.phone || supplier.contact_phone || '';
        // Handle JSON address data correctly with improved parsing
        let addressValue = '';
        if (supplier.address) {
            addressValue = parseAddressForDisplay(supplier.address);
        }
        document.getElementById('address').value = addressValue;
        document.getElementById('payment_terms').value = supplier.payment_terms || '';
        document.getElementById('credit_limit').value = supplier.credit_limit || '';
        
        // Fix status mapping: is_active (boolean) -> status (string)
        const statusValue = (supplier.is_active === true || supplier.is_active === 1 || supplier.is_active === '1') ? 'active' : 'inactive';
        document.getElementById('status').value = statusValue;
    }
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const API_BASE_URL = 'http://127.0.0.1:8082';
        const supplierId = mode === 'edit' ? document.getElementById('supplier-id').value : null;
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ${mode === 'edit' ? '更新中...' : '建立中...'}
        `;
        
        try {
            // Collect form data
            const addressText = document.getElementById('address').value;
            let addressData = null;
            
            // Parse address data intelligently
            if (addressText.trim()) {
                try {
                    // If it looks like JSON, try to parse it
                    if (addressText.trim().startsWith('{')) {
                        addressData = JSON.parse(addressText);
                    } else {
                        // Try to parse comma-separated address into structured format
                        const parts = addressText.split(',').map(part => part.trim());
                        if (parts.length >= 2) {
                            addressData = {
                                street: parts[0] || '',
                                city: parts[1] || '',
                                state: parts[2] || '',
                                zip: parts[3] || '',
                                country: parts[4] || ''
                            };
                            // Remove empty fields
                            Object.keys(addressData).forEach(key => {
                                if (!addressData[key]) delete addressData[key];
                            });
                        } else {
                            // Single line address
                            addressData = { address: addressText };
                        }
                    }
                } catch (e) {
                    // If parsing fails, use as simple address object
                    addressData = { address: addressText };
                }
            }
            
            const formData = {
                name: document.getElementById('name').value,
                code: document.getElementById('code').value,
                // type 欄位已移除
                description: document.getElementById('description').value,
                contact_person: document.getElementById('contact_person').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: addressData,
                payment_terms: document.getElementById('payment_terms').value,
                credit_limit: parseFloat(document.getElementById('credit_limit').value) || 0,
                // Fix status mapping: status (string) -> is_active (boolean)
                is_active: document.getElementById('status').value === 'active'
            };
            
            // Get CSRF token and auth token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                             document.querySelector('input[name="_token"]')?.value;
            const token = getAuthToken();
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }
            
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }
            
            // API request
            const url = mode === 'edit' 
                ? `${API_BASE_URL}/api/suppliers/${supplierId}`
                : `${API_BASE_URL}/api/suppliers/`;
            
            const method = mode === 'edit' ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                headers: headers,
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Supplier saved:', result);
            
            // Success - redirect to suppliers list
            alert(`供應商${mode === 'edit' ? '更新' : '建立'}成功！`);
            window.location.href = '{{ route("suppliers.index") }}';
            
        } catch (error) {
            console.error('Error saving supplier:', error);
            alert(`${mode === 'edit' ? '更新' : '建立'}供應商時發生錯誤: ` + error.message);
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                ${mode === 'edit' ? '更新供應商' : '建立供應商'}
            `;
        }
    }
    
    // Get auth token - same as in other pages
    function getAuthToken() {
        const user = getUserFromSession();
        if (user) {
            return btoa(unescape(encodeURIComponent(JSON.stringify({
                user_id: user.id || 1191,
                email: user.email || 'test@example.com',
                name: user.name || 'Test User',
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
            }))));
        }
        return '';
    }
    
    function getUserFromSession() {
        return {
            id: 1191,
            email: 'test@example.com',
            name: 'Test User'
        };
    }
});
</script>
@endpush
@endsection