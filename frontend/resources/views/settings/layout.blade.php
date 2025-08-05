@extends('layouts.app')

@section('title', '系統設定')

@section('content')
<div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-6">
        <!-- Settings Header -->
        <div class="mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">系統設定</h1>
                    <p class="mt-2 text-gray-600">管理您的公司設定、使用者權限和系統配置</p>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-500">{{ Auth::user()->name }}</span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        已登入
                    </span>
                </div>
            </div>
        </div>

        <div class="flex flex-col lg:flex-row lg:space-x-8">
            <!-- Settings Sidebar Navigation -->
            <div class="lg:w-64 mb-6 lg:mb-0">
                <nav class="bg-white rounded-lg shadow-sm border border-gray-200" data-testid="settings-layout">
                    <div class="p-4">
                        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">基本設定</h2>
                        <ul class="space-y-1">
                            <li>
                                <a href="{{ route('settings.company') }}" 
                                   class="flex items-center px-3 py-2 text-sm font-medium rounded-md {{ request()->routeIs('settings.company') ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-50' }}"
                                   data-testid="company-nav">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                    </svg>
                                    公司資訊
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('settings.units') }}" 
                                   class="flex items-center px-3 py-2 text-sm font-medium rounded-md {{ request()->routeIs('settings.units') ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-50' }}"
                                   data-testid="units-nav">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                                    </svg>
                                    計量單位
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('settings.categories') }}" 
                                   class="flex items-center px-3 py-2 text-sm font-medium rounded-md {{ request()->routeIs('settings.categories') ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-50' }}"
                                   data-testid="categories-nav">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                                    </svg>
                                    產品類別
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('settings.warehouses.index') }}" 
                                   class="flex items-center px-3 py-2 text-sm font-medium rounded-md {{ request()->routeIs('settings.warehouses.*') ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-50' }}"
                                   data-testid="warehouses-nav">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"/>
                                    </svg>
                                    倉庫管理
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div class="p-4 border-t border-gray-200">
                        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">權限管理</h2>
                        <ul class="space-y-1">
                            <li>
                                <a href="{{ route('settings.permissions.index') }}" 
                                   class="flex items-center px-3 py-2 text-sm font-medium rounded-md {{ request()->routeIs('settings.permissions.*') ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-50' }}"
                                   data-testid="permissions-nav">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                    </svg>
                                    使用者權限
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div class="p-4 border-t border-gray-200">
                        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">系統設定</h2>
                        <ul class="space-y-1">
                            <li>
                                <a href="{{ route('settings.system.general') }}" 
                                   class="flex items-center px-3 py-2 text-sm font-medium rounded-md {{ request()->routeIs('settings.system.general') ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-50' }}"
                                   data-testid="system-general-nav">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    一般設定
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('settings.taxes') }}" 
                                   class="flex items-center px-3 py-2 text-sm font-medium rounded-md {{ request()->routeIs('settings.taxes') ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-50' }}"
                                   data-testid="taxes-nav">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                                    </svg>
                                    稅務設定
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
            </div>

            <!-- Main Content Area -->
            <div class="flex-1">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 min-h-screen">
                    @yield('settings-content')
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // 高亮顯示當前頁面的導航項目
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('[data-testid*="-nav"]');
    
    navLinks.forEach(link => {
        if (link.href && currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('bg-blue-50', 'text-blue-700', 'border-r-2', 'border-blue-700');
            link.classList.remove('text-gray-700', 'hover:bg-gray-50');
        }
    });
});
</script>
@endpush