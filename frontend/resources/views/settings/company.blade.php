@extends('settings.layout')

@section('settings-content')
<div class="p-6" data-testid="company-settings-page">
    <!-- Page Header -->
    <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900">公司資訊</h2>
        <p class="mt-2 text-gray-600">設定您的公司基本資訊和聯絡方式</p>
    </div>

    <!-- Company Information Form -->
    <form class="space-y-6" data-testid="company-form">
        <!-- Basic Information Section -->
        <div class="bg-gray-50 p-6 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">基本資訊</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="company_name" class="block text-sm font-medium text-gray-700 mb-2">公司名稱 *</label>
                    <input type="text" id="company_name" name="company_name" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="輸入公司名稱"
                           data-testid="company-name-input">
                </div>
                <div>
                    <label for="company_code" class="block text-sm font-medium text-gray-700 mb-2">公司代碼</label>
                    <input type="text" id="company_code" name="company_code" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="輸入公司代碼"
                           data-testid="company-code-input">
                </div>
                <div>
                    <label for="tax_id" class="block text-sm font-medium text-gray-700 mb-2">統一編號</label>
                    <input type="text" id="tax_id" name="tax_id" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="輸入統一編號"
                           data-testid="tax-id-input">
                </div>
                <div>
                    <label for="industry" class="block text-sm font-medium text-gray-700 mb-2">行業別</label>
                    <select id="industry" name="industry" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            data-testid="industry-select">
                        <option value="">請選擇行業別</option>
                        <option value="manufacturing">製造業</option>
                        <option value="retail">零售業</option>
                        <option value="wholesale">批發業</option>
                        <option value="services">服務業</option>
                        <option value="technology">科技業</option>
                        <option value="agriculture">農業</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Contact Information Section -->
        <div class="bg-gray-50 p-6 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">聯絡資訊</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="md:col-span-2">
                    <label for="address" class="block text-sm font-medium text-gray-700 mb-2">公司地址</label>
                    <textarea id="address" name="address" rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="輸入完整地址"
                              data-testid="address-input"></textarea>
                </div>
                <div>
                    <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">聯絡電話</label>
                    <input type="tel" id="phone" name="phone" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="輸入聯絡電話"
                           data-testid="phone-input">
                </div>
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
                    <input type="email" id="email" name="email" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="輸入電子郵件"
                           data-testid="email-input">
                </div>
                <div>
                    <label for="website" class="block text-sm font-medium text-gray-700 mb-2">公司網站</label>
                    <input type="url" id="website" name="website" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="https://example.com"
                           data-testid="website-input">
                </div>
                <div>
                    <label for="fax" class="block text-sm font-medium text-gray-700 mb-2">傳真號碼</label>
                    <input type="tel" id="fax" name="fax" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="輸入傳真號碼"
                           data-testid="fax-input">
                </div>
            </div>
        </div>

        <!-- Financial Settings Section -->
        <div class="bg-gray-50 p-6 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">財務設定</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="currency" class="block text-sm font-medium text-gray-700 mb-2">主要貨幣</label>
                    <select id="currency" name="currency" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            data-testid="currency-select">
                        <option value="TWD">新台幣 (TWD)</option>
                        <option value="USD">美元 (USD)</option>
                        <option value="EUR">歐元 (EUR)</option>
                        <option value="JPY">日圓 (JPY)</option>
                        <option value="CNY">人民幣 (CNY)</option>
                    </select>
                </div>
                <div>
                    <label for="fiscal_year_start" class="block text-sm font-medium text-gray-700 mb-2">會計年度開始月份</label>
                    <select id="fiscal_year_start" name="fiscal_year_start" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            data-testid="fiscal-year-select">
                        <option value="1">1月</option>
                        <option value="2">2月</option>
                        <option value="3">3月</option>
                        <option value="4">4月</option>
                        <option value="5">5月</option>
                        <option value="6">6月</option>
                        <option value="7">7月</option>
                        <option value="8">8月</option>
                        <option value="9">9月</option>
                        <option value="10">10月</option>
                        <option value="11">11月</option>
                        <option value="12">12月</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button type="button" 
                    class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="cancel-button">
                取消
            </button>
            <button type="submit" 
                    class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="save-button">
                儲存設定
            </button>
        </div>
    </form>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('[data-testid="company-form"]');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const requiredFields = ['company_name'];
            let isValid = true;
            
            requiredFields.forEach(fieldName => {
                const field = form.querySelector(`[name="${fieldName}"]`);
                if (field && !field.value.trim()) {
                    field.classList.add('border-red-500');
                    isValid = false;
                } else if (field) {
                    field.classList.remove('border-red-500');
                }
            });
            
            if (isValid) {
                // TODO: Implement form submission to API
                alert('公司資訊設定已儲存');
            } else {
                alert('請填寫必要欄位');
            }
        });
    }
});
</script>
@endpush