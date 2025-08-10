@extends('layouts.app')

@section('title', '報價單詳情')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">報價單 #{{ $quote['quote_number'] ?? $quoteId }}</h1>
            <p class="text-gray-600 dark:text-gray-400">報價單詳細資料</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('quotes.edit', $quoteId) }}" 
               class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                編輯報價單
            </a>
            <form method="POST" action="{{ route('quotes.convert', $quoteId) }}" class="inline">
                @csrf
                <button type="submit" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
                        onclick="return confirm('確定要將此報價單轉換為訂單嗎？')">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                    轉換為訂單
                </button>
            </form>
            <a href="{{ route('quotes.index') }}" 
               class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回列表
            </a>
        </div>
    </div>

    <!-- Quote Details Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Quote Information -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">報價資訊</h3>
            </div>
            <div class="px-6 py-4 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">報價單號:</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ $quote['quote_number'] ?? 'QT-' . str_pad($quoteId, 3, '0', STR_PAD_LEFT) }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客戶:</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ $quote['customer']['name'] ?? '未知客戶' }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">狀態:</label>
                    @php
                        $status = $quote['status'] ?? 'draft';
                        $statusClasses = [
                            'draft' => 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                            'sent' => 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                            'accepted' => 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                            'approved' => 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                            'rejected' => 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                            'expired' => 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        ];
                        $statusLabels = [
                            'draft' => '草稿',
                            'pending' => '已發送',
                            'sent' => '已發送',
                            'accepted' => '已接受',
                            'approved' => '已批准',
                            'rejected' => '已拒絕',
                            'expired' => '已過期'
                        ];
                    @endphp
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {{ $statusClasses[$status] ?? $statusClasses['draft'] }}">
                        {{ $statusLabels[$status] ?? ucfirst($status) }}
                    </span>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">報價日期:</label>
                    <p class="text-sm text-gray-900 dark:text-white">
                        @if(isset($quote['quote_date']))
                            {{ date('Y-m-d', strtotime($quote['quote_date'])) }}
                        @else
                            --
                        @endif
                    </p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">有效期限:</label>
                    <p class="text-sm text-gray-900 dark:text-white">
                        @if(isset($quote['expiry_date']))
                            {{ date('Y-m-d', strtotime($quote['expiry_date'])) }}
                        @elseif(isset($quote['valid_until']))
                            {{ date('Y-m-d', strtotime($quote['valid_until'])) }}
                        @else
                            --
                        @endif
                    </p>
                </div>
            </div>
        </div>

        <!-- Quote Summary -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">報價摘要</h3>
            </div>
            <div class="px-6 py-4 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">小計:</label>
                    <p class="text-sm text-gray-900 dark:text-white">${{ number_format($quote['subtotal'] ?? 0, 2) }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">折扣:</label>
                    <p class="text-sm text-gray-900 dark:text-white">${{ number_format($quote['discount'] ?? 0, 2) }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">稅額:</label>
                    <p class="text-sm text-gray-900 dark:text-white">${{ number_format($quote['tax'] ?? 0, 2) }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">總計:</label>
                    <p class="text-lg font-bold text-gray-900 dark:text-white">${{ number_format($quote['total_amount'] ?? 0, 2) }}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Quote Items -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">報價項目</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">產品</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">描述</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">數量</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">單價</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">總計</th>
                    </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    @if(isset($quote['items']) && is_array($quote['items']) && count($quote['items']) > 0)
                        @foreach($quote['items'] as $item)
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {{ $item['name'] ?? $item['product_name'] ?? '未知產品' }}
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                    {{ $item['description'] ?? '--' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {{ number_format($item['quantity'] ?? 0, 2) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    ${{ number_format($item['unit_price'] ?? 0, 2) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    ${{ number_format(($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0), 2) }}
                                </td>
                            </tr>
                        @endforeach
                    @else
                        <tr>
                            <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                <div class="flex flex-col items-center">
                                    <svg class="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2m16-7H4m16 0l-2-2m2 2l-2 2M4 13l2-2m-2 2l2 2"/>
                                    </svg>
                                    <p>此報價單沒有項目</p>
                                </div>
                            </td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>

    <!-- Terms & Conditions -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">條款與條件</h3>
        </div>
        <div class="px-6 py-4">
            @if(isset($quote['notes']) && !empty($quote['notes']))
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ $quote['notes'] }}</p>
            @else
                <p class="text-sm text-gray-600 dark:text-gray-400">此報價單自發出之日起30天內有效。所有價格均以新台幣計算，除另行註明外不包含運費。</p>
            @endif
        </div>
    </div>
</div>
@endsection