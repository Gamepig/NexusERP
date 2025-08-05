@extends('layouts.app')

@section('title', '客戶聯絡人')

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
                        <a href="{{ route('customers.show', $customerId) }}" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            客戶詳情
                        </a>
                    </li>
                    <li>
                        <svg class="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </li>
                    <li>
                        <span class="text-gray-500 dark:text-gray-400">聯絡人管理</span>
                    </li>
                </ol>
            </nav>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">客戶聯絡人</h1>
            <p class="text-gray-600 dark:text-gray-400">管理客戶的聯絡人資訊</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('customers.show', $customerId) }}" 
               class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回客戶
            </a>
            <a href="{{ route('customers.contacts.create', $customerId) }}" 
               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                新增聯絡人
            </a>
        </div>
    </div>

    <!-- Customer Info Banner -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
        <div id="customer-info" class="flex items-center">
            <div class="animate-pulse flex items-center">
                <div class="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div class="ml-4">
                    <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                    <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Contacts List -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">聯絡人清單</h3>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500 dark:text-gray-400">共 0 位聯絡人</span>
                </div>
            </div>
        </div>
        
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            聯絡人資訊
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            職位
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            聯絡方式
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            主要聯絡人
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            操作
                        </th>
                    </tr>
                </thead>
                <tbody id="contacts-table-body" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <!-- Data will be loaded via JavaScript -->
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center">
                            <div class="flex flex-col items-center">
                                <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                                <p class="text-gray-500 dark:text-gray-400 text-lg mb-2">尚無聯絡人資料</p>
                                <p class="text-gray-400 dark:text-gray-500 text-sm mb-4">開始新增客戶的聯絡人</p>
                                <a href="{{ route('customers.contacts.create', $customerId) }}" 
                                   class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                    新增聯絡人
                                </a>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const customerId = {{ $customerId }};
    
    // Load customer info and contacts
    loadCustomerInfo(customerId);
    loadContacts(customerId);
});

function loadCustomerInfo(customerId) {
    // Temporarily disabled - API not implemented yet
    // Show placeholder customer info for now
    const placeholderCustomer = {
        name: '客戶名稱載入中...',
        company: '公司資訊載入中...',
        email: 'email@example.com'
    };
    renderCustomerInfo(placeholderCustomer);
}

function renderCustomerInfo(customer) {
    const container = document.getElementById('customer-info');
    container.innerHTML = `
        <div class="flex items-center">
            <div class="flex-shrink-0 h-12 w-12">
                <div class="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    ${customer.name.charAt(0).toUpperCase()}
                </div>
            </div>
            <div class="ml-4">
                <h2 class="text-lg font-semibold text-blue-900 dark:text-blue-100">${customer.name}</h2>
                <p class="text-blue-700 dark:text-blue-200 text-sm">${customer.company || '個人客戶'} • ${customer.email}</p>
            </div>
        </div>
    `;
}

function loadContacts(customerId) {
    // Temporarily disabled - API not implemented yet
    // Show development in progress message
    showEmptyState('聯絡人管理功能開發中');
}

function renderContactsTable(contacts) {
    const tbody = document.getElementById('contacts-table-body');
    
    if (contacts.length === 0) {
        showEmptyState();
        return;
    }
    
    tbody.innerHTML = contacts.map(contact => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium">
                            ${contact.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                            ${contact.name}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            ${contact.department || ''}
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                ${contact.position || '無職位'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">${contact.email}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">${contact.phone || '無電話'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${contact.is_primary ? 
                    '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">主要聯絡人</span>' : 
                    '<span class="text-gray-400 text-sm">-</span>'
                }
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <a href="/customers/{{ $customerId }}/contacts/${contact.id}/edit" 
                       class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                        編輯
                    </a>
                    <button onclick="deleteContact(${contact.id})" 
                            class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                        刪除
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Update count
    document.querySelector('.px-4.py-3 .text-sm').textContent = `共 ${contacts.length} 位聯絡人`;
}

function showEmptyState(message = '尚無聯絡人資料') {
    const tbody = document.getElementById('contacts-table-body');
    const isDevelopment = message.includes('開發中');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center">
                    <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${isDevelopment ? 
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>' :
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>'
                        }
                    </svg>
                    <p class="text-gray-500 dark:text-gray-400 text-lg mb-2">${message}</p>
                    ${!isDevelopment && message === '尚無聯絡人資料' ? `
                        <p class="text-gray-400 dark:text-gray-500 text-sm mb-4">開始新增客戶的聯絡人</p>
                        <a href="/customers/{{ $customerId }}/contacts/create" 
                           class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                            新增聯絡人
                        </a>
                    ` : isDevelopment ? `
                        <p class="text-gray-400 dark:text-gray-500 text-sm mb-4">此功能即將推出</p>
                        <a href="{{ route('customers.show', $customerId) }}" 
                           class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                            返回客戶詳情
                        </a>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
}

// Global functions
window.deleteContact = function(contactId) {
    alert('聯絡人管理功能開發中，暫時無法使用刪除功能。');
};
</script>
@endpush
@endsection