@extends('layouts.app')

@section('title', '客戶報價')

@section('content')
<div class="container mx-auto px-4 py-6">
    <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">客戶報價管理</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-8">此功能正在開發中...</p>
        <a href="{{ route('customers.show', $customerId) }}" 
           class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
            返回客戶詳情
        </a>
    </div>
</div>
@endsection