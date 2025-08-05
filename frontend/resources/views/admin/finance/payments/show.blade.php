@extends('admin.layouts.app')

@section('title', '付款記錄詳細資料')

@section('content')
<div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">付款記錄詳細資料</h1>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">查看付款記錄 #{{ $payment->payment_number ?? 'N/A' }} 的詳細資訊</p>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <a href="{{ route('admin.finance.payments') }}" class="block rounded-md bg-gray-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-500">
                返回列表
            </a>
        </div>
    </div>

    <!-- 付款記錄基本資訊 -->
    <div class="mt-8 overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">基本資訊</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">付款記錄的基本資料</p>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-600">
            <dl>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">付款編號</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $payment->payment_number ?? 'N/A' }}</dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">供應商名稱</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $payment->supplier_name ?? '未知供應商' }}</dd>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">供應商電子郵件</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $payment->supplier_email ?? 'N/A' }}</dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">付款金額</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0 font-semibold text-lg text-green-600 dark:text-green-400">
                        ${{ number_format($payment->total_amount ?? 0, 2) }}
                    </dd>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">付款方式</dt>
                    <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                        @php
                            $methodColors = [
                                'cash' => 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                                'bank_transfer' => 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                                'credit_card' => 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
                                'check' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                            ];
                            $methodLabels = [
                                'cash' => '現金',
                                'bank_transfer' => '銀行轉帳',
                                'credit_card' => '信用卡',
                                'check' => '支票',
                            ];
                        @endphp
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {{ $methodColors[$payment->payment_method ?? 'cash'] ?? 'bg-gray-100 text-gray-800' }}">
                            {{ $methodLabels[$payment->payment_method ?? 'cash'] ?? '未知' }}
                        </span>
                    </dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">付款日期</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ $payment->payment_date ? \Carbon\Carbon::parse($payment->payment_date)->format('Y-m-d') : 'N/A' }}
                    </dd>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">參考編號</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $payment->reference_number ?? 'N/A' }}</dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">銀行帳號</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $payment->bank_account ?? 'N/A' }}</dd>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">付款狀態</dt>
                    <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                        @php
                            $statusColors = [
                                'pending' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                                'completed' => 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                                'failed' => 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
                                'cancelled' => 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
                            ];
                            $statusLabels = [
                                'pending' => '待處理',
                                'completed' => '已完成',
                                'failed' => '失敗',
                                'cancelled' => '已取消',
                            ];
                        @endphp
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {{ $statusColors[$payment->status ?? 'completed'] ?? 'bg-green-100 text-green-800' }}">
                            {{ $statusLabels[$payment->status ?? 'completed'] ?? '未知' }}
                        </span>
                    </dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">建立時間</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ $payment->created_at ? \Carbon\Carbon::parse($payment->created_at)->format('Y-m-d H:i:s') : 'N/A' }}
                    </dd>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">更新時間</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ $payment->updated_at ? \Carbon\Carbon::parse($payment->updated_at)->format('Y-m-d H:i:s') : 'N/A' }}
                    </dd>
                </div>
                @if($payment->notes)
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">備註</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $payment->notes }}</dd>
                </div>
                @endif
            </dl>
        </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="mt-6 flex justify-end space-x-3">
        <a href="{{ route('admin.finance.payments') }}" 
           class="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
            返回列表
        </a>
    </div>
</div>
@endsection