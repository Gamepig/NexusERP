@extends('admin.layouts.app')

@section('title', '訂單詳細資料')

@section('content')
<div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">訂單詳細資料</h1>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">查看訂單 #{{ $order->order_number ?? 'N/A' }} 的詳細資訊</p>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <a href="{{ route('admin.orders.index') }}" class="block rounded-md bg-gray-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-500">
                返回列表
            </a>
        </div>
    </div>

    <!-- 訂單基本資訊 -->
    <div class="mt-8 overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">基本資訊</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">訂單的基本資料和狀態</p>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-600">
            <dl>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">訂單編號</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $order->order_number ?? 'N/A' }}</dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">客戶姓名</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $order->customer_name ?? '未知客戶' }}</dd>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">客戶電子郵件</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $order->customer_email ?? 'N/A' }}</dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">客戶電話</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $order->customer_phone ?? 'N/A' }}</dd>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">訂單狀態</dt>
                    <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                        @php
                            $statusColors = [
                                'pending' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                                'confirmed' => 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                                'processing' => 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
                                'shipped' => 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
                                'delivered' => 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                                'cancelled' => 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
                            ];
                            $statusLabels = [
                                'pending' => '待處理',
                                'confirmed' => '已確認',
                                'processing' => '處理中',
                                'shipped' => '已出貨',
                                'delivered' => '已送達',
                                'cancelled' => '已取消',
                            ];
                        @endphp
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {{ $statusColors[$order->status ?? 'pending'] ?? 'bg-gray-100 text-gray-800' }}">
                            {{ $statusLabels[$order->status ?? 'pending'] ?? '未知' }}
                        </span>
                    </dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">訂單金額</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0 font-semibold text-lg">
                        ${{ number_format($order->total_amount ?? 0, 2) }}
                    </dd>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">訂單日期</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ \Carbon\Carbon::parse($order->order_date ?? $order->created_at)->format('Y-m-d H:i:s') }}
                    </dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">建立時間</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ \Carbon\Carbon::parse($order->created_at)->format('Y-m-d H:i:s') }}
                    </dd>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">更新時間</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ \Carbon\Carbon::parse($order->updated_at)->format('Y-m-d H:i:s') }}
                    </dd>
                </div>
            </dl>
        </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="mt-6 flex justify-end space-x-3">
        <a href="{{ route('admin.orders.edit', $order->id) }}" 
           class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            編輯訂單
        </a>
        <button onclick="confirmDelete('{{ $order->id }}', '{{ $order->order_number }}')" 
                class="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">
            刪除訂單
        </button>
    </div>
</div>

<script>
function confirmDelete(orderId, orderNumber) {
    @if(session('admin_user') === 'DEMO')
        alert('DEMO 帳號沒有刪除的權限');
        return;
    @endif
    
    if (confirm(`確定要刪除訂單 ${orderNumber} 嗎？此動作無法復原。`)) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/orders/${orderId}`;
        
        const csrfToken = document.createElement('input');
        csrfToken.type = 'hidden';
        csrfToken.name = '_token';
        csrfToken.value = '{{ csrf_token() }}';
        
        const methodField = document.createElement('input');
        methodField.type = 'hidden';
        methodField.name = '_method';
        methodField.value = 'DELETE';
        
        form.appendChild(csrfToken);
        form.appendChild(methodField);
        document.body.appendChild(form);
        form.submit();
    }
}
</script>
@endsection