@extends('layouts.app')

@section('title', $mode === 'create' ? '新增聯絡人' : '編輯聯絡人')

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
                        <a href="{{ route('customers.contacts.index', $customerId) }}" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            聯絡人管理
                        </a>
                    </li>
                    <li>
                        <svg class="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </li>
                    <li>
                        <span class="text-gray-500 dark:text-gray-400">
                            {{ $mode === 'create' ? '新增聯絡人' : '編輯聯絡人' }}
                        </span>
                    </li>
                </ol>
            </nav>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {{ $mode === 'create' ? '新增聯絡人' : '編輯聯絡人' }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
                {{ $mode === 'create' ? '為客戶新增聯絡人' : '修改聯絡人資訊' }}
            </p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('customers.contacts.index', $customerId) }}" 
               class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回列表
            </a>
        </div>
    </div>

    <!-- Form Section -->
    <div class="max-w-2xl mx-auto">
        <form id="contact-form" method="POST">
            @csrf
            @if($mode === 'edit')
                @method('PUT')
            @endif
            
            <!-- Contact Information -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">聯絡人資訊</h3>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">請填寫聯絡人的基本資訊</p>
                </div>
                
                <div class="px-6 py-4 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Contact Name -->
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                姓名 <span class="text-red-500">*</span>
                            </label>
                            <input type="text" 
                                   id="name" 
                                   name="name" 
                                   required
                                   class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="請輸入聯絡人姓名">
                        </div>

                        <!-- Position -->
                        <div>
                            <label for="position" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                職位
                            </label>
                            <input type="text" 
                                   id="position" 
                                   name="position" 
                                   class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="請輸入職位">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Department -->
                        <div>
                            <label for="department" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                部門
                            </label>
                            <input type="text" 
                                   id="department" 
                                   name="department" 
                                   class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="請輸入部門">
                        </div>

                        <!-- Primary Contact -->
                        <div class="flex items-center pt-8">
                            <input type="checkbox" 
                                   id="is_primary" 
                                   name="is_primary" 
                                   value="1"
                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <label for="is_primary" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                設為主要聯絡人
                            </label>
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

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Mobile -->
                        <div>
                            <label for="mobile" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                手機號碼
                            </label>
                            <input type="tel" 
                                   id="mobile" 
                                   name="mobile" 
                                   class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="請輸入手機號碼">
                        </div>

                        <!-- Extension -->
                        <div>
                            <label for="extension" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                分機號碼
                            </label>
                            <input type="text" 
                                   id="extension" 
                                   name="extension" 
                                   class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="請輸入分機號碼">
                        </div>
                    </div>

                    <!-- Notes -->
                    <div>
                        <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            備註
                        </label>
                        <textarea id="notes" 
                                  name="notes" 
                                  rows="3" 
                                  class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                  placeholder="請輸入備註資訊..."></textarea>
                    </div>
                </div>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-3">
                <a href="{{ route('customers.contacts.index', $customerId) }}" 
                   class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    取消
                </a>
                <button type="submit" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    {{ $mode === 'create' ? '建立聯絡人' : '更新聯絡人' }}
                </button>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    const customerId = {{ $customerId }};
    
    // Form validation and submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Basic validation
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        
        if (!name) {
            alert('請輸入聯絡人姓名');
            document.getElementById('name').focus();
            return;
        }
        
        if (!email) {
            alert('請輸入電子郵件');
            document.getElementById('email').focus();
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('請輸入有效的電子郵件地址');
            document.getElementById('email').focus();
            return;
        }
        
        // Submit form via AJAX (TODO: Replace with actual API endpoint)
        const formData = new FormData(form);
        const submitData = Object.fromEntries(formData);
        submitData.customer_id = customerId;
        
        console.log('提交聯絡人資料:', submitData);
        
        // TODO: Implement actual form submission
        alert('{{ $mode === "create" ? "聯絡人建立成功！" : "聯絡人更新成功！" }}');
        window.location.href = `/customers/${customerId}/contacts`;
    });
    
    @if($mode === 'edit' && isset($contactId))
    // Load existing contact data for edit mode
    loadContactData({{ $contactId }});
    @endif
});

function loadContactData(contactId) {
    // TODO: Replace with actual API endpoint
    fetch(`/api/customers/{{ $customerId }}/contacts/${contactId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const contact = data.data;
                
                // Fill form fields
                document.getElementById('name').value = contact.name || '';
                document.getElementById('position').value = contact.position || '';
                document.getElementById('department').value = contact.department || '';
                document.getElementById('email').value = contact.email || '';
                document.getElementById('phone').value = contact.phone || '';
                document.getElementById('mobile').value = contact.mobile || '';
                document.getElementById('extension').value = contact.extension || '';
                document.getElementById('notes').value = contact.notes || '';
                document.getElementById('is_primary').checked = contact.is_primary || false;
            }
        })
        .catch(error => {
            console.error('Error loading contact data:', error);
            alert('載入聯絡人資料時發生錯誤');
        });
}
</script>
@endpush
@endsection