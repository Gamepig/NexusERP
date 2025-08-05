@extends('admin.layouts.app')

@section('title', '編輯訂單')

@section('content')
<div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">編輯訂單</h1>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">編輯訂單 #{{ $order->order_number ?? 'N/A' }} 的資訊</p>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <a href="{{ route('admin.orders.show', $order->id) }}" class="block rounded-md bg-gray-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-500">
                返回詳細頁面
            </a>
        </div>
    </div>

    @if(session('success'))
        <div class="mt-4 rounded-md bg-green-50 dark:bg-green-900/50 p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-green-800 dark:text-green-200">{{ session('success') }}</p>
                </div>
            </div>
        </div>
    @endif

    @if(session('error'))
        <div class="mt-4 rounded-md bg-red-50 dark:bg-red-900/50 p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-red-800 dark:text-red-200">{{ session('error') }}</p>
                </div>
            </div>
        </div>
    @endif

    <!-- 編輯表單 -->
    <div class="mt-8 overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">訂單資訊</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">編輯訂單的基本資料</p>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-600 px-4 py-5 sm:px-6">
            <form method="POST" action="{{ route('admin.orders.update', $order->id) }}">
                @csrf
                @method('PUT')
                
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <!-- 訂單編號 (只讀) -->
                    <div class="sm:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">訂單編號</label>
                        <div class="mt-1">
                            <input type="text" value="{{ $order->order_number ?? 'N/A' }}" readonly
                                   class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        </div>
                    </div>

                    <!-- 客戶資訊 (只讀) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">客戶姓名</label>
                        <div class="mt-1">
                            <input type="text" value="{{ $order->customer_name ?? '未知客戶' }}" readonly
                                   class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">客戶電子郵件</label>
                        <div class="mt-1">
                            <input type="email" value="{{ $order->customer_email ?? '' }}" readonly
                                   class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        </div>
                    </div>

                    <!-- 訂單狀態 -->
                    <div>
                        <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">訂單狀態</label>
                        <div class="mt-1">
                            <select id="status" name="status" required
                                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                <option value="pending" {{ ($order->status ?? '') == 'pending' ? 'selected' : '' }}>待處理</option>
                                <option value="confirmed" {{ ($order->status ?? '') == 'confirmed' ? 'selected' : '' }}>已確認</option>
                                <option value="processing" {{ ($order->status ?? '') == 'processing' ? 'selected' : '' }}>處理中</option>
                                <option value="shipped" {{ ($order->status ?? '') == 'shipped' ? 'selected' : '' }}>已出貨</option>
                                <option value="delivered" {{ ($order->status ?? '') == 'delivered' ? 'selected' : '' }}>已送達</option>
                                <option value="cancelled" {{ ($order->status ?? '') == 'cancelled' ? 'selected' : '' }}>已取消</option>
                            </select>
                        </div>
                        @error('status')
                            <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- 訂單金額 -->
                    <div>
                        <label for="total_amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300">訂單金額</label>
                        <div class="mt-1">
                            <input type="number" id="total_amount" name="total_amount" step="0.01" min="0" 
                                   value="{{ $order->total_amount ?? 0 }}" required
                                   class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        </div>
                        @error('total_amount')
                            <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- 備註 -->
                    <div class="sm:col-span-2">
                        <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">備註</label>
                        <div class="mt-1">
                            <textarea id="notes" name="notes" rows="3" placeholder="輸入訂單備註（選填）"
                                      class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">{{ old('notes', $order->notes ?? '') }}</textarea>
                        </div>
                        @error('notes')
                            <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- 日期資訊 (只讀) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">訂單日期</label>
                        <div class="mt-1">
                            <input type="text" value="{{ \Carbon\Carbon::parse($order->order_date ?? $order->created_at)->format('Y-m-d H:i:s') }}" readonly
                                   class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">最後更新</label>
                        <div class="mt-1">
                            <input type="text" value="{{ \Carbon\Carbon::parse($order->updated_at)->format('Y-m-d H:i:s') }}" readonly
                                   class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        </div>
                    </div>
                </div>

                <!-- 提交按鈕 -->
                <div class="mt-6 flex justify-end space-x-3">
                    <a href="{{ route('admin.orders.show', $order->id) }}" 
                       class="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                        取消
                    </a>
                    <button type="submit" 
                            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                        保存變更
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection