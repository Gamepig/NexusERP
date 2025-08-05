<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/css/nexus-theme.css', 'resources/js/app.js', 'resources/js/theme-toggle.js'])
        
        <!-- Page Styles -->
        @stack('styles')
    </head>
    <body class="font-sans antialiased bg-gray-100 dark:bg-gray-900" style="background-color: var(--nexus-bg-primary); color: var(--nexus-text-primary);">
        <div class="min-h-screen bg-gray-100 dark:bg-gray-900" style="background-color: var(--nexus-bg-primary);">
            <!-- 頂部導航 -->
            <x-layouts.enhanced-navigation />
            
            <!-- 主內容區域 - 移除側邊欄後的全寬設計 -->
            <div class="nexus-main-layout-no-sidebar">
                <!-- 麵包屑導航 - 已移除
                @if(request()->route()->getName() !== 'dashboard')
                    <x-navigation.breadcrumb />
                @endif -->

                <!-- Page Heading -->
                @if(isset($header))
                    <header class="bg-white dark:bg-gray-800 shadow" style="background-color: var(--nexus-bg-secondary); box-shadow: var(--nexus-shadow-md);">
                        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                            {{ $header }}
                        </div>
                    </header>
                @endif
                @hasSection('header')
                    <header class="bg-white dark:bg-gray-800 shadow" style="background-color: var(--nexus-bg-secondary); box-shadow: var(--nexus-shadow-md);">
                        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                            @yield('header')
                        </div>
                    </header>
                @endif

                <!-- Page Content -->
                <main class="nexus-main-content-no-sidebar">
                    @isset($slot)
                        {{ $slot }}
                    @else
                        @yield('content')
                    @endisset
                </main>
            </div>
        </div>
        
        <!-- Page Scripts -->
        @stack('scripts')
        
    </body>
</html>
