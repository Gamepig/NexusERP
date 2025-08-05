@extends('layouts.app')

@section('title', 'NexusERP - Test Page')

@section('content')
<div class="min-h-screen flex flex-col justify-center items-center">
    <div class="text-center">
        <h1 class="text-4xl font-bold mb-6 text-[#1b1b18]">
            歡迎使用 NexusERP
        </h1>
        
        <div class="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h2 class="text-2xl font-semibold mb-4 text-[#1b1b18]">
                系統狀態
            </h2>
            
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <span class="text-[#706f6c]">Laravel:</span>
                    <span class="text-green-600 font-medium">{{ app()->version() }}</span>
                </div>
                
                <div class="flex items-center justify-between">
                    <span class="text-[#706f6c]">PHP:</span>
                    <span class="text-green-600 font-medium">{{ PHP_VERSION }}</span>
                </div>
                
                <div class="flex items-center justify-between">
                    <span class="text-[#706f6c]">Vite:</span>
                    <span class="text-green-600 font-medium">配置完成</span>
                </div>
                
                <div class="flex items-center justify-between">
                    <span class="text-[#706f6c]">Tailwind CSS:</span>
                    <span class="text-green-600 font-medium">v4.0</span>
                </div>
            </div>
        </div>
        
        <div class="mt-8">
            <p class="text-[#706f6c]">
                Laravel 應用程式已成功建立並配置完成
            </p>
        </div>
    </div>
</div>
@endsection