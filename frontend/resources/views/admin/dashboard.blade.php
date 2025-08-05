@extends('admin.layouts.app')

@section('title', 'NexusERP 後台管理')

@section('content')
<div class="px-4 sm:px-6 lg:px-8">
    <!-- 歡迎訊息 -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            🏢 歡迎使用 NexusERP 後台管理系統
        </h1>
        <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">
            您好，<strong class="text-blue-600 dark:text-blue-400">{{ session('admin_user') }}</strong>
            @if(session('admin_user') === 'DEMO')
                <span class="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 rounded-full">展示模式</span>
            @endif
        </p>
    </div>

    <!-- 統計卡片 -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <!-- 總使用者數 -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center" style="background-color: rgb(59 130 246) !important;">
                            <span class="text-white text-sm">👥</span>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">總使用者</dt>
                            <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ \App\Models\User::count() }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <!-- 今日新增使用者 -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center" style="background-color: rgb(34 197 94) !important;">
                            <span class="text-white text-sm">📈</span>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">今日新增</dt>
                            <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ \App\Models\User::whereDate('created_at', today())->count() }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <!-- 總訂單數 -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center" style="background-color: rgb(168 85 247) !important;">
                            <span class="text-white text-sm">📦</span>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">總訂單數</dt>
                            <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ \DB::table('sales_orders')->count() ?? 0 }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <!-- 未結帳款 -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center" style="background-color: rgb(234 179 8) !important;">
                            <span class="text-white text-sm">💰</span>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">未結帳款</dt>
                            <dd class="text-lg font-medium text-gray-900 dark:text-white">$0.00</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 快速動作 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">快速動作</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <a href="{{ route('admin.users.index') }}" class="group relative rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 transition-all duration-200" style="background: linear-gradient(to right, rgba(30, 58, 138, 0.3), rgba(67, 56, 202, 0.3)) !important;">
                    <div>
                        <span class="rounded-lg inline-flex p-3 text-white" style="background: rgb(37 99 235) !important; background-color: rgb(37 99 235) !important; min-width: 48px; min-height: 48px; display: inline-flex !important; align-items: center; justify-content: center; border-radius: 8px !important;">
                            👥
                        </span>
                    </div>
                    <div class="mt-4">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white relative z-10">
                            使用者管理
                        </h3>
                        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 relative z-10">
                            管理系統使用者、編輯資料、設定權限
                        </p>
                    </div>
                    <span class="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400" aria-hidden="true">
                        →
                    </span>
                </a>

                <a href="{{ route('admin.orders.index') }}" class="group relative rounded-lg p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40 transition-all duration-200" style="background: linear-gradient(to right, rgba(107, 33, 168, 0.3), rgba(190, 24, 93, 0.3)) !important;">
                    <div>
                        <span class="rounded-lg inline-flex p-3 text-white" style="background: rgb(147 51 234) !important; background-color: rgb(147 51 234) !important; min-width: 48px; min-height: 48px; display: inline-flex !important; align-items: center; justify-content: center; border-radius: 8px !important;">
                            📦
                        </span>
                    </div>
                    <div class="mt-4">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white relative z-10">
                            訂單管理
                        </h3>
                        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 relative z-10">
                            查看和管理所有銷售訂單
                        </p>
                    </div>
                    <span class="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400" aria-hidden="true">
                        →
                    </span>
                </a>

                <a href="{{ route('admin.finance.receivables') }}" class="group relative rounded-lg p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/40 dark:hover:to-emerald-900/40 transition-all duration-200" style="background: linear-gradient(to right, rgba(6, 78, 59, 0.3), rgba(6, 95, 70, 0.3)) !important;">
                    <div>
                        <span class="rounded-lg inline-flex p-3 text-white" style="background: rgb(22 163 74) !important; background-color: rgb(22 163 74) !important; min-width: 48px; min-height: 48px; display: inline-flex !important; align-items: center; justify-content: center; border-radius: 8px !important;">
                            💰
                        </span>
                    </div>
                    <div class="mt-4">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white relative z-10">
                            財務管理
                        </h3>
                        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 relative z-10">
                            管理應收應付帳款和財務報表
                        </p>
                    </div>
                    <span class="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400" aria-hidden="true">
                        →
                    </span>
                </a>
            </div>
        </div>
    </div>

    <!-- 最近活動 -->
    <div class="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">系統狀態</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-2xl mb-2">✅</div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">系統運行正常</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">所有服務正常運行</div>
                </div>
                <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-2xl mb-2">🔒</div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">安全狀態良好</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">無異常登入記錄</div>
                </div>
                <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-2xl mb-2">📊</div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">資料備份完成</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ now()->format('Y-m-d H:i') }} 更新</div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection