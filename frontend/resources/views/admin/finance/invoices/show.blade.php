@extends('admin.layouts.app')

@section('title', '發票詳細資料')

@section('content')
<div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">發票詳細資料</h1>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">查看發票 #{{ $invoice->invoice_number ?? 'N/A' }} 的詳細資訊</p>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <a href="{{ route('admin.finance.invoices') }}" class="block rounded-md bg-gray-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-500">
                返回列表
            </a>
        </div>
    </div>

    <!-- 發票基本資訊 -->
    <div class="mt-8 overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">基本資訊</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">發票的基本資料和狀態</p>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-600">
            <dl>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">發票號碼</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $invoice->invoice_number ?? 'N/A' }}</dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">發票類型</dt>
                    <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                        @php
                            $typeColors = [
                                'sales' => 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                                'purchase' => 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
                            ];
                            $typeLabels = [
                                'sales' => '銷售發票',
                                'purchase' => '採購發票',
                            ];
                        @endphp
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {{ $typeColors[$invoice->invoice_type ?? 'sales'] ?? 'bg-gray-100 text-gray-800' }}">
                            {{ $typeLabels[$invoice->invoice_type ?? 'sales'] ?? '未知' }}
                        </span>
                    </dd>
                </div>
                @if($invoice->invoice_type === 'sales')
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">客戶名稱</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $invoice->customer_name ?? '未知客戶' }}</dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">客戶電子郵件</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $invoice->customer_email ?? 'N/A' }}</dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">關聯銷售單</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $invoice->sales_order_number ?? 'N/A' }}</dd>
                </div>
                @else
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">供應商名稱</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $invoice->supplier_name ?? '未知供應商' }}</dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">供應商電子郵件</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $invoice->supplier_email ?? 'N/A' }}</dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">關聯採購單</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $invoice->purchase_order_number ?? 'N/A' }}</dd>
                </div>
                @endif
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">發票狀態</dt>
                    <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                        @php
                            $statusColors = [
                                'draft' => 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
                                'sent' => 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                                'paid' => 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                                'overdue' => 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
                                'cancelled' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                            ];
                            $statusLabels = [
                                'draft' => '草稿',
                                'sent' => '已寄出',
                                'paid' => '已付款',
                                'overdue' => '逾期未付',
                                'cancelled' => '已取消',
                            ];
                        @endphp
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {{ $statusColors[$invoice->status ?? 'draft'] ?? 'bg-gray-100 text-gray-800' }}">
                            {{ $statusLabels[$invoice->status ?? 'draft'] ?? '未知' }}
                        </span>
                    </dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">發票金額</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0 font-semibold text-lg text-blue-600 dark:text-blue-400">
                        ${{ number_format($invoice->total_amount ?? 0, 2) }}
                    </dd>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">到期日期</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ $invoice->due_date ? \Carbon\Carbon::parse($invoice->due_date)->format('Y-m-d') : 'N/A' }}
                    </dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">發票日期</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ $invoice->created_at ? \Carbon\Carbon::parse($invoice->created_at)->format('Y-m-d H:i:s') : 'N/A' }}
                    </dd>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">建立時間</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ $invoice->created_at ? \Carbon\Carbon::parse($invoice->created_at)->format('Y-m-d H:i:s') : 'N/A' }}
                    </dd>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">更新時間</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ $invoice->updated_at ? \Carbon\Carbon::parse($invoice->updated_at)->format('Y-m-d H:i:s') : 'N/A' }}
                    </dd>
                </div>
                @if($invoice->notes)
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">備註</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">{{ $invoice->notes }}</dd>
                </div>
                @endif
            </dl>
        </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="mt-6 flex justify-end space-x-3">
        <a href="{{ route('admin.finance.invoices') }}" 
           class="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
            返回列表
        </a>
    </div>
</div>
@endsection