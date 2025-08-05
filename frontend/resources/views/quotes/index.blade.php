@extends('layouts.app')

@section('title', '報價單管理 - NexusERP')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">報價單管理</h1>
            <p class="text-gray-600 dark:text-gray-400">管理您的報價單</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            <a href="{{ route('quotes.create') }}" 
               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                建立報價單
            </a>
        </div>
    </div>

    <!-- 搜尋和篩選區塊 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">搜尋和篩選</h3>
        </div>
        
        <form method="GET" action="{{ route('quotes.index') }}" class="p-6" id="searchForm">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- 搜尋關鍵字 -->
                <div>
                    <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        搜尋關鍵字
                    </label>
                    <input type="text" 
                           id="search" 
                           name="search" 
                           value="{{ request('search') }}" 
                           placeholder="報價編號、客戶名稱..."
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                </div>

                <!-- 狀態篩選 -->
                <div>
                    <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        狀態
                    </label>
                    <select id="status" 
                            name="status"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                        <option value="">全部狀態</option>
                        <option value="draft" {{ request('status') === 'draft' ? 'selected' : '' }}>草稿</option>
                        <option value="sent" {{ request('status') === 'sent' ? 'selected' : '' }}>已發送</option>
                        <option value="approved" {{ request('status') === 'approved' ? 'selected' : '' }}>已批准</option>
                        <option value="rejected" {{ request('status') === 'rejected' ? 'selected' : '' }}>已拒絕</option>
                    </select>
                </div>

                <!-- 日期範圍 -->
                <div>
                    <label for="date_from" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        開始日期
                    </label>
                    <input type="date" 
                           id="date_from" 
                           name="date_from" 
                           value="{{ request('date_from') }}"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                </div>

                <div>
                    <label for="date_to" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        結束日期
                    </label>
                    <input type="date" 
                           id="date_to" 
                           name="date_to" 
                           value="{{ request('date_to') }}"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                </div>
            </div>

            <div class="flex items-center justify-between mt-6">
                <div class="flex space-x-3">
                    <button type="submit" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        搜尋
                    </button>
                    <a href="{{ route('quotes.index') }}" 
                       class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                        清除篩選
                    </a>
                </div>
                
                <!-- 排序選項 -->
                <div class="flex items-center space-x-2">
                    <label for="sort" class="text-sm font-medium text-gray-700 dark:text-gray-300">排序：</label>
                    <select id="sort" 
                            name="sort" 
                            onchange="this.form.submit()"
                            class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                        <option value="created_at_desc" {{ request('sort', 'created_at_desc') === 'created_at_desc' ? 'selected' : '' }}>最新建立</option>
                        <option value="created_at_asc" {{ request('sort') === 'created_at_asc' ? 'selected' : '' }}>最舊建立</option>
                        <option value="quote_date_desc" {{ request('sort') === 'quote_date_desc' ? 'selected' : '' }}>報價日期 (新→舊)</option>
                        <option value="quote_date_asc" {{ request('sort') === 'quote_date_asc' ? 'selected' : '' }}>報價日期 (舊→新)</option>
                        <option value="total_amount_desc" {{ request('sort') === 'total_amount_desc' ? 'selected' : '' }}>金額 (高→低)</option>
                        <option value="total_amount_asc" {{ request('sort') === 'total_amount_asc' ? 'selected' : '' }}>金額 (低→高)</option>
                    </select>
                </div>
            </div>
        </form>
    </div>

    <!-- 報價列表表格 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">報價單列表</h3>
            @if(isset($quotes['total']))
                <span class="text-sm text-gray-500 dark:text-gray-400">
                    共 {{ $quotes['total'] }} 筆報價單
                </span>
            @endif
        </div>
        
        <div class="overflow-x-auto">
            <table class="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            報價編號
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            客戶名稱
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            報價日期
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            有效期限
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            總金額
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            狀態
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            操作
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    @if(isset($quotes['quotes']) && count($quotes['quotes']) > 0)
                        @foreach($quotes['quotes'] as $quote)
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {{ $quote['quote_number'] ?? 'QT-' . str_pad($quote['id'], 4, '0', STR_PAD_LEFT) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {{ $quote['customer']['name'] ?? '未知客戶' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {{ isset($quote['quote_date']) ? date('Y-m-d', strtotime($quote['quote_date'])) : '--' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {{ isset($quote['valid_until']) ? date('Y-m-d', strtotime($quote['valid_until'])) : '--' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    ${{ number_format($quote['total_amount'] ?? 0, 2) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                        @switch($quote['status'])
                                            @case('draft')
                                                bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300
                                                @break
                                            @case('sent')
                                                bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-300
                                                @break
                                            @case('approved')
                                                bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-300
                                                @break
                                            @case('rejected')
                                                bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-300
                                                @break
                                            @default
                                                bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300
                                        @endswitch">
                                        @switch($quote['status'])
                                            @case('draft') 草稿 @break
                                            @case('sent') 已發送 @break
                                            @case('approved') 已批准 @break
                                            @case('rejected') 已拒絕 @break
                                            @default {{ $quote['status'] }}
                                        @endswitch
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <a href="{{ route('quotes.show', $quote['id']) }}" 
                                       class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                        檢視
                                    </a>
                                    <a href="{{ route('quotes.edit', $quote['id']) }}" 
                                       class="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300">
                                        編輯
                                    </a>
                                    @if($quote['status'] === 'draft')
                                        <form method="POST" action="{{ route('quotes.destroy', $quote['id']) }}" class="inline">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" 
                                                    onclick="return confirm('確定要刪除這個報價單嗎？')"
                                                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                                刪除
                                            </button>
                                        </form>
                                    @elseif($quote['status'] === 'sent')
                                        <form method="POST" action="{{ route('quotes.approve', $quote['id']) }}" class="inline mr-2">
                                            @csrf
                                            <button type="submit" 
                                                    onclick="return confirm('確定要批准這個報價單嗎？')"
                                                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                                                批准
                                            </button>
                                        </form>
                                        <form method="POST" action="{{ route('quotes.reject', $quote['id']) }}" class="inline">
                                            @csrf
                                            <button type="submit" 
                                                    onclick="return confirm('確定要拒絕這個報價單嗎？')"
                                                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                                拒絕
                                            </button>
                                        </form>
                                    @elseif($quote['status'] === 'approved')
                                        <a href="{{ route('quotes.convert', $quote['id']) }}" 
                                           class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                           onclick="return confirm('確定要將此報價單轉換為銷售訂單嗎？')">
                                            轉換為訂單
                                        </a>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    @else
                        <tr>
                            <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                @if(isset($quotes['quotes']))
                                    <div class="flex flex-col items-center">
                                        <svg class="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                        <p class="text-lg font-medium mb-2">目前沒有報價單</p>
                                        <p class="text-sm">開始建立您的第一個報價單</p>
                                        <a href="{{ route('quotes.create') }}" 
                                           class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                            建立報價單
                                        </a>
                                    </div>
                                @else
                                    <div class="flex flex-col items-center">
                                        <svg class="w-8 h-8 animate-spin text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"/>
                                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"/>
                                        </svg>
                                        <p>載入報價單資料中...</p>
                                    </div>
                                @endif
                            </td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>

        <!-- 分頁 -->
        @if(isset($quotes['quotes']) && count($quotes['quotes']) > 0 && isset($quotes['last_page']) && $quotes['last_page'] > 1)
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-700 dark:text-gray-300">
                        顯示第 {{ ($quotes['current_page'] - 1) * $quotes['per_page'] + 1 }} 到 
                        {{ min($quotes['current_page'] * $quotes['per_page'], $quotes['total']) }} 筆，
                        共 {{ $quotes['total'] }} 筆資料
                    </div>
                    
                    <div class="flex space-x-2">
                        <!-- 上一頁 -->
                        @if($quotes['current_page'] > 1)
                            <a href="{{ request()->fullUrlWithQuery(['page' => $quotes['current_page'] - 1]) }}" 
                               class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                                上一頁
                            </a>
                        @endif

                        <!-- 頁碼 -->
                        @for($i = max(1, $quotes['current_page'] - 2); $i <= min($quotes['last_page'], $quotes['current_page'] + 2); $i++)
                            <a href="{{ request()->fullUrlWithQuery(['page' => $i]) }}" 
                               class="px-3 py-2 text-sm font-medium rounded-md
                                   @if($i === $quotes['current_page'])
                                       text-white bg-blue-600 border border-blue-600
                                   @else
                                       text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600
                                   @endif">
                                {{ $i }}
                            </a>
                        @endfor

                        <!-- 下一頁 -->
                        @if($quotes['current_page'] < $quotes['last_page'])
                            <a href="{{ request()->fullUrlWithQuery(['page' => $quotes['current_page'] + 1]) }}" 
                               class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                                下一頁
                            </a>
                        @endif
                    </div>
                </div>
            </div>
        @endif
    </div>

    <!-- 手機版卡片檢視 (隱藏在桌面版) -->
    <div class="block md:hidden space-y-4">
        @if(isset($quotes['quotes']) && count($quotes['quotes']) > 0)
            @foreach($quotes['quotes'] as $quote)
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div class="flex justify-between items-start mb-3">
                        <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                            {{ $quote['quote_number'] ?? 'QT-' . str_pad($quote['id'], 4, '0', STR_PAD_LEFT) }}
                        </h4>
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                            @switch($quote['status'])
                                @case('draft')
                                    bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300
                                    @break
                                @case('sent')
                                    bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-300
                                    @break
                                @case('approved')
                                    bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-300
                                    @break
                                @case('rejected')
                                    bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-300
                                    @break
                                @default
                                    bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300
                            @endswitch">
                            @switch($quote['status'])
                                @case('draft') 草稿 @break
                                @case('sent') 已發送 @break
                                @case('approved') 已批准 @break
                                @case('rejected') 已拒絕 @break
                                @default {{ $quote['status'] }}
                            @endswitch
                        </span>
                    </div>
                    
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500 dark:text-gray-400">客戶:</span>
                            <span class="text-gray-900 dark:text-white">{{ $quote['customer']['name'] ?? '未知客戶' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500 dark:text-gray-400">報價日期:</span>
                            <span class="text-gray-900 dark:text-white">{{ isset($quote['quote_date']) ? date('Y-m-d', strtotime($quote['quote_date'])) : '--' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500 dark:text-gray-400">總金額:</span>
                            <span class="text-gray-900 dark:text-white font-medium">${{ number_format($quote['total_amount'] ?? 0, 2) }}</span>
                        </div>
                    </div>
                    
                    <div class="flex space-x-2 mt-4">
                        <a href="{{ route('quotes.show', $quote['id']) }}" 
                           class="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium">
                            檢視
                        </a>
                        <a href="{{ route('quotes.edit', $quote['id']) }}" 
                           class="flex-1 text-center bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm font-medium">
                            編輯
                        </a>
                    </div>
                </div>
            @endforeach
        @endif
    </div>
</div>

<!-- 顯示成功或錯誤訊息 -->
@if(session('success'))
    <div class="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50" id="successAlert">
        {{ session('success') }}
    </div>
@endif

@if(session('error'))
    <div class="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50" id="errorAlert">
        {{ session('error') }}
    </div>
@endif

<script>
// 自動隱藏提示訊息
setTimeout(function() {
    const alerts = document.querySelectorAll('#successAlert, #errorAlert');
    alerts.forEach(alert => {
        if (alert) {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }
    });
}, 5000);
</script>

@endsection