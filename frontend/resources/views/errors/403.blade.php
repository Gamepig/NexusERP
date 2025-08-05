@extends('layouts.app')

@section('title', '403 - 存取被拒絕')

@section('content')
<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <div class="text-center">
            <!-- 403 錯誤圖示 -->
            <div class="mx-auto h-32 w-32 text-red-500 mb-8">
                <svg class="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
                </svg>
            </div>

            <!-- 錯誤標題 -->
            <h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-4">403</h1>
            <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">存取被拒絕</h2>
            
            <!-- 錯誤描述 -->
            <p class="text-gray-600 dark:text-gray-400 text-lg mb-8">
                抱歉，您沒有足夠的權限存取此頁面。<br>
                請聯絡系統管理員或檢查您的角色權限。
            </p>

            <!-- 錯誤詳細資訊 -->
            @if(config('app.debug') && isset($exception))
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 text-left">
                <h3 class="text-red-800 dark:text-red-400 font-semibold mb-2">除錯資訊：</h3>
                <p class="text-red-600 dark:text-red-300 text-sm">{{ $exception->getMessage() ?: '權限不足' }}</p>
                @if(auth()->check())
                <div class="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
                    <p class="text-red-600 dark:text-red-300 text-sm">
                        <strong>目前用戶：</strong> {{ auth()->user()->name ?? auth()->user()->email }}
                    </p>
                    <p class="text-red-600 dark:text-red-300 text-sm">
                        <strong>用戶角色：</strong> {{ implode(', ', auth()->user()->getRoleNames()) ?: '無' }}
                    </p>
                </div>
                @endif
            </div>
            @endif

            <!-- 操作按鈕 -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <!-- 返回上一頁 -->
                <button onclick="history.back()" 
                        class="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                    返回上一頁
                </button>

                <!-- 回到主頁 -->
                <a href="{{ route('dashboard') }}" 
                   class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    回到主頁
                </a>

                @auth
                <!-- 聯絡管理員 -->
                <button onclick="contactAdmin()" 
                        class="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    聯絡管理員
                </button>
                @endauth
            </div>

            <!-- 額外資訊 -->
            <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    如果您認為這是錯誤，請記錄以下資訊並聯絡技術支援：
                </p>
                <div class="mt-2 text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    錯誤代碼: 403 | 時間: {{ now()->format('Y-m-d H:i:s') }} | 請求: {{ request()->url() }}
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
/**
 * 聯絡管理員功能
 */
function contactAdmin() {
    // 準備錯誤報告資料
    const errorReport = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        @auth
        userId: {{ auth()->id() }},
        userName: '{{ auth()->user()->name ?? auth()->user()->email }}',
        userRoles: @json(auth()->user()->getRoleNames()),
        @endauth
    };

    // 可以實作發送錯誤報告到管理員信箱
    // 或者顯示聯絡資訊
    alert('請聯絡系統管理員：\n\n' +
          '信箱：admin@nexuserp.com\n' +
          'Slack：#nexuserp-support\n\n' +
          '錯誤資訊已複製到剪貼簿');
    
    // 複製錯誤資訊到剪貼簿
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2)).catch(() => {
        console.warn('無法複製到剪貼簿');
    });
}

/**
 * 自動重定向（如果有指定）
 */
@if(request()->has('redirect'))
setTimeout(() => {
    window.location.href = '{{ request('redirect') }}';
}, 5000);
@endif
</script>
@endpush
@endsection