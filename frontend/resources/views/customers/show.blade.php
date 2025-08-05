@extends('layouts.app')

@section('title', '客戶詳情')

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
                        <span class="text-gray-500 dark:text-gray-400">客戶詳情</span>
                    </li>
                </ol>
            </nav>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">客戶詳情</h1>
            <p class="text-gray-600 dark:text-gray-400">查看客戶的詳細資訊</p>
        </div>
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0">
            <!-- Customer Navigation -->
            @if(isset($navigation) && $navigation)
            <div class="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                <!-- Previous Customer -->
                @if($navigation['previous'])
                <a href="{{ route('customers.show', $navigation['previous']['id']) }}" 
                   class="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors duration-200"
                   title="上一個客戶: {{ $navigation['previous']['name'] }}">
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
                <a href="{{ route('customers.show', $navigation['next']['id']) }}" 
                   class="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors duration-200"
                   title="下一個客戶: {{ $navigation['next']['name'] }}">
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
                <a href="{{ route('customers.index') }}" 
                   class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                    返回列表
                </a>
                <a href="{{ route('customers.edit', $customerId) }}" 
                   class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    編輯客戶
                </a>
            </div>
        </div>
    </div>

    <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Customer Information -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Basic Info -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">基本資訊</h3>
                    </div>
                    <div class="px-6 py-4">
                        <div id="customer-basic-info" class="space-y-4">
                            <!-- Content will be loaded via JavaScript -->
                            <div class="animate-pulse">
                                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Address Info -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">地址資訊</h3>
                    </div>
                    <div class="px-6 py-4">
                        <div id="customer-address-info" class="space-y-4">
                            <!-- Content will be loaded via JavaScript -->
                            <div class="animate-pulse">
                                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Orders -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white">最近訂單</h3>
                            <a href="{{ route('customers.orders.index', $customerId) }}" 
                               class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                                查看全部
                            </a>
                        </div>
                    </div>
                    <div class="px-6 py-4">
                        <div id="customer-recent-orders">
                            <!-- Content will be loaded via JavaScript -->
                            <div class="animate-pulse space-y-3">
                                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
                <!-- Customer Stats -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">客戶統計</h3>
                    </div>
                    <div class="px-6 py-4">
                        <div id="customer-stats" class="space-y-4">
                            <!-- Content will be loaded via JavaScript -->
                            <div class="animate-pulse space-y-3">
                                <div class="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                <div class="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                <div class="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">快速操作</h3>
                    </div>
                    <div class="px-6 py-4">
                        <div class="space-y-3">
                            <a href="{{ route('customers.orders.create', $customerId) }}" 
                               class="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                建立新訂單
                            </a>
                            <a href="{{ route('customers.quotes.create', $customerId) }}" 
                               class="block w-full bg-green-600 hover:bg-green-700 text-white text-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                建立報價單
                            </a>
                            <a href="{{ route('customers.contacts.index', $customerId) }}" 
                               class="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                管理聯絡人
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Customer Notes -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">備註</h3>
                    </div>
                    <div class="px-6 py-4">
                        <div id="customer-notes">
                            <!-- Content will be loaded via JavaScript -->
                            <div class="animate-pulse">
                                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Keyboard Shortcuts Help -->
    @if(isset($navigation) && $navigation)
    <div class="mt-8 max-w-6xl mx-auto">
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">鍵盤快捷鍵</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                @if($navigation['previous'])
                <div class="flex items-center">
                    <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">←</kbd>
                    <span class="ml-2">上一位客戶</span>
                </div>
                @endif
                @if($navigation['next'])
                <div class="flex items-center">
                    <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">→</kbd>
                    <span class="ml-2">下一位客戶</span>
                </div>
                @endif
                <div class="flex items-center">
                    <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">E</kbd>
                    <span class="ml-2">編輯客戶</span>
                </div>
                <div class="flex items-center">
                    <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">ESC</kbd>
                    <span class="ml-2">返回列表</span>
                </div>
            </div>
        </div>
    </div>
    @endif
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Use server-side passed customer data
    @if(isset($customer))
    const customerData = @json($customer);
    renderCustomerData(customerData);
    @else
    showNotFound();
    @endif

    // Add keyboard navigation support
    @if(isset($navigation) && $navigation)
    document.addEventListener('keydown', function(e) {
        // Only trigger if not in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }
        
        switch(e.key) {
            case 'ArrowLeft':
                @if($navigation['previous'])
                e.preventDefault();
                window.location.href = '{{ route("customers.show", $navigation["previous"]["id"]) }}';
                @endif
                break;
            case 'ArrowRight':
                @if($navigation['next'])
                e.preventDefault();
                window.location.href = '{{ route("customers.show", $navigation["next"]["id"]) }}';
                @endif
                break;
            case 'e':
                // Press 'e' to edit
                e.preventDefault();
                window.location.href = '{{ route("customers.edit", $customerId) }}';
                break;
            case 'Escape':
                // Press 'Esc' to go back to list
                e.preventDefault();
                window.location.href = '{{ route("customers.index") }}';
                break;
        }
    });
    @endif
});

function renderCustomerData(customer) {
    // Render basic info
    const basicInfo = document.getElementById('customer-basic-info');
    const customerName = customer.name || '';
    const companyName = customer.company_name || customer.company || '';
    const primaryEmail = customer.primary_email || customer.email || '';
    const primaryPhone = customer.primary_phone || customer.phone || '';
    const customerType = customer.customer_type || customer.type || 'individual';
    
    basicInfo.innerHTML = `
        <div class="flex items-center mb-4">
            <div class="flex-shrink-0 h-16 w-16">
                <div class="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                    ${customerName.charAt(0).toUpperCase()}
                </div>
            </div>
            <div class="ml-4">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">${customerName}</h2>
                <p class="text-gray-600 dark:text-gray-400">${companyName || '個人客戶'}</p>
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusBadgeClass(customer.status)}">
                    ${getStatusText(customer.status)}
                </span>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">電子郵件</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">${primaryEmail || '無'}</dd>
            </div>
            <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">聯絡電話</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">${primaryPhone || '無'}</dd>
            </div>
            <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">客戶類型</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">${customerType === 'business' || customerType === 'company' ? '企業客戶' : '個人客戶'}</dd>
            </div>
            <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">建立日期</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">${formatDate(customer.created_at)}</dd>
            </div>
        </div>
    `;

    // Render address info
    const addressInfo = document.getElementById('customer-address-info');
    const addressLine1 = customer.address_line1 || customer.address || '';
    const addressLine2 = customer.address_line2 || '';
    const city = customer.city || '';
    const postalCode = customer.postal_code || '';
    const country = customer.country || '';
    
    if (addressLine1 || city || country) {
        const fullAddress = [addressLine1, addressLine2, city, postalCode, country].filter(Boolean).join(', ');
        addressInfo.innerHTML = `
            <div class="space-y-3">
                <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">完整地址</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                        ${fullAddress || '無地址資訊'}
                    </dd>
                </div>
            </div>
        `;
    } else {
        addressInfo.innerHTML = `
            <p class="text-gray-500 dark:text-gray-400 text-sm">無地址資訊</p>
        `;
    }

    // Render customer stats
    const stats = document.getElementById('customer-stats');
    stats.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">總訂單數</span>
                <span class="text-lg font-semibold text-gray-900 dark:text-white">${customer.orders_count || 0}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">總消費金額</span>
                <span class="text-lg font-semibold text-gray-900 dark:text-white">NT$ ${parseFloat(customer.total_spent || 0).toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">平均訂單金額</span>
                <span class="text-lg font-semibold text-gray-900 dark:text-white">
                    NT$ ${customer.orders_count > 0 ? parseFloat((customer.total_spent || 0) / customer.orders_count).toLocaleString() : '0'}
                </span>
            </div>
        </div>
    `;

    // Render customer notes
    const notes = document.getElementById('customer-notes');
    notes.innerHTML = customer.notes ? 
        `<p class="text-sm text-gray-900 dark:text-white">${customer.notes}</p>` :
        `<p class="text-gray-500 dark:text-gray-400 text-sm italic">無備註</p>`;

    // Render recent orders
    renderRecentOrders(customer.recent_orders || []);
}

function renderRecentOrders(orders) {
    const container = document.getElementById('customer-recent-orders');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-gray-500 dark:text-gray-400 text-sm">尚無訂單記錄</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="space-y-3">
            ${orders.map(order => `
                <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">#${order.id}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${formatDate(order.created_at)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">NT$ ${parseFloat(order.total || 0).toLocaleString()}</p>
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusBadgeClass(order.status)}">
                            ${getOrderStatusText(order.status)}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function showNotFound() {
    // Redirect to 404 or show error message
    window.location.href = '/404';
}

// Helper functions
function getStatusBadgeClass(status) {
    switch(status) {
        case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'active': return '活躍';
        case 'inactive': return '非活躍';
        default: return '未知';
    }
}

function getOrderStatusBadgeClass(status) {
    switch(status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
}

function getOrderStatusText(status) {
    switch(status) {
        case 'pending': return '待處理';
        case 'processing': return '處理中';
        case 'shipped': return '已出貨';
        case 'delivered': return '已送達';
        case 'cancelled': return '已取消';
        default: return '未知';
    }
}

function formatDate(dateString) {
    if (!dateString) return '無';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}
</script>
@endpush
@endsection