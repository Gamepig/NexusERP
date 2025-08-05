<!DOCTYPE html>
<html lang="zh-TW" class="h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>NexusERP 後台管理 - 登入</title>
    
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    
    <style>
        .glass-effect {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body class="h-full">
    <div class="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <!-- 標題區域 -->
            <div class="text-center">
                <div class="glass-effect rounded-2xl p-6 mb-8">
                    <h1 class="text-4xl font-bold text-white mb-2">
                        🏢 NexusERP
                    </h1>
                    <p class="text-blue-200 text-lg font-medium">後台管理系統</p>
                    <div class="mt-4 h-1 w-24 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
                </div>
            </div>

            <!-- 登入表單 -->
            <div class="glass-effect rounded-2xl p-8 shadow-2xl">
                <div class="text-center mb-6">
                    <h2 class="text-2xl font-bold text-white">管理員登入</h2>
                    <p class="text-blue-200 mt-2">請輸入您的管理員帳號密碼</p>
                </div>

                <!-- 錯誤訊息 -->
                @if ($errors->any())
                    <div class="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
                        <div class="text-red-100 text-sm">
                            @foreach ($errors->all() as $error)
                                <p>{{ $error }}</p>
                            @endforeach
                        </div>
                    </div>
                @endif

                <!-- 成功訊息 -->
                @if (session('success'))
                    <div class="mb-4 p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
                        <p class="text-green-100 text-sm">{{ session('success') }}</p>
                    </div>
                @endif

                <form method="POST" action="{{ route('admin.login.submit') }}" class="space-y-6">
                    @csrf
                    
                    <!-- 使用者名稱 -->
                    <div>
                        <label for="username" class="block text-sm font-medium text-blue-100 mb-2">
                            使用者名稱
                        </label>
                        <input 
                            id="username" 
                            name="username" 
                            type="text" 
                            required 
                            value="admin"
                            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg !text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            placeholder="請輸入使用者名稱"
                            style="color: white !important;"
                        >
                    </div>

                    <!-- 密碼 -->
                    <div>
                        <label for="password" class="block text-sm font-medium text-blue-100 mb-2">
                            密碼
                        </label>
                        <input 
                            id="password" 
                            name="password" 
                            type="password" 
                            required 
                            value="admin"
                            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg !text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            placeholder="請輸入密碼"
                            style="color: white !important;"
                        >
                    </div>

                    <!-- 登入按鈕 -->
                    <button 
                        type="submit" 
                        class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-all duration-200 transform hover:scale-105"
                    >
                        <span class="flex items-center">
                            🔐 
                            <span class="ml-2">登入後台</span>
                        </span>
                    </button>
                </form>

                <!-- 帳號說明 -->
                <div class="mt-8 pt-6 border-t border-white/20">
                    <div class="text-center">
                        <h3 class="text-sm font-medium text-blue-100 mb-3">測試帳號</h3>
                        <div class="space-y-2 text-xs text-blue-200">
                            <div class="p-3 bg-white/5 rounded-lg">
                                <p><strong>管理員帳號:</strong> admin / admin</p>
                                <p class="text-xs opacity-75">具備完整管理權限，已預先填入表單</p>
                            </div>
                            <div class="p-3 bg-white/5 rounded-lg">
                                <p><strong>展示帳號:</strong> DEMO / DEMO</p>
                                <p class="text-xs opacity-75">僅供展示，無編輯權限</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 返回前台連結 -->
            <div class="text-center">
                <a 
                    href="{{ route('dashboard') }}" 
                    class="inline-flex items-center text-blue-200 hover:text-white transition-colors duration-200"
                >
                    ← 返回前台系統
                </a>
            </div>
        </div>
    </div>
</body>
</html>