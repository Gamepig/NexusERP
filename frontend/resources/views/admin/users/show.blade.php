@extends('admin.layouts.app')

@section('title', '查看使用者')

@section('content')
<div class="px-4 sm:px-6 lg:px-8">
    <div class="mb-8">
        <nav class="flex" aria-label="Breadcrumb">
            <ol role="list" class="flex items-center space-x-4">
                <li>
                    <div class="flex">
                        <a href="{{ route('admin.dashboard') }}" class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">主控台</a>
                    </div>
                </li>
                <li>
                    <div class="flex items-center">
                        <svg class="flex-shrink-0 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                        </svg>
                        <a href="{{ route('admin.users.index') }}" class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">使用者管理</a>
                    </div>
                </li>
                <li>
                    <div class="flex items-center">
                        <svg class="flex-shrink-0 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                        </svg>
                        <span class="ml-4 text-sm font-medium text-gray-500 dark:text-gray-400">查看使用者</span>
                    </div>
                </li>
            </ol>
        </nav>
    </div>

    <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
            <h2 class="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">使用者詳細資訊</h2>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
            <a href="{{ route('admin.users.edit', $user->id) }}" 
               class="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                編輯使用者
            </a>
            <a href="{{ route('admin.users.index') }}" 
               class="ml-3 inline-flex items-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                返回列表
            </a>
        </div>
    </div>

    <div class="mt-8">
        <div class="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700 sm:rounded-xl">
            <div class="px-4 py-6 sm:p-8">
                <dl class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                    <!-- 基本資訊 -->
                    <div class="sm:col-span-2">
                        <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">基本資訊</h3>
                    </div>
                    
                    <!-- 姓名 -->
                    <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">姓名</dt>
                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ $user->name }}</dd>
                    </div>

                    <!-- 電子郵件 -->
                    <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">電子郵件</dt>
                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ $user->email }}</dd>
                    </div>

                    <!-- 行業類型 -->
                    <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">行業類型</dt>
                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                            @php
                                $businessTypes = [
                                    'restaurant' => '餐飲業',
                                    'retail' => '零售業',
                                    'manufacturing' => '製造業',
                                    'service' => '服務業',
                                    'technology' => '科技業',
                                    'agriculture' => '農業',
                                    'other' => '其他'
                                ];
                            @endphp
                            {{ $businessTypes[$user->business_type] ?? $user->business_type ?? '未設定' }}
                        </dd>
                    </div>

                    <!-- 角色 -->
                    <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">角色</dt>
                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                            @php
                                $roles = [
                                    'admin' => '系統管理員',
                                    'restaurant_owner' => '餐飲業主',
                                    'shop_owner' => '零售業主',
                                    'factory_owner' => '製造業主',
                                    'service_provider' => '服務業者',
                                    'farmer' => '農業經營者',
                                    'business_owner' => '企業經營者',
                                    'accountant' => '會計人員',
                                    'employee' => '一般員工'
                                ];
                            @endphp
                            {{ $roles[$user->role] ?? $user->role ?? '未設定' }}
                        </dd>
                    </div>

                    <!-- 電子郵件驗證狀態 -->
                    <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">電子郵件驗證</dt>
                        <dd class="mt-1 text-sm">
                            @if($user->email_verified_at)
                                <span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/50 dark:text-green-300 dark:ring-green-600/30">
                                    已驗證
                                </span>
                                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {{ $user->email_verified_at->format('Y-m-d H:i:s') }}
                                </div>
                            @else
                                <span class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/50 dark:text-red-300 dark:ring-red-600/30">
                                    未驗證
                                </span>
                            @endif
                        </dd>
                    </div>

                    <!-- 帳號狀態 -->
                    <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">帳號狀態</dt>
                        <dd class="mt-1 text-sm">
                            <span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/50 dark:text-green-300 dark:ring-green-600/30">
                                正常
                            </span>
                        </dd>
                    </div>

                    <!-- 時間資訊 -->
                    <div class="sm:col-span-2 mt-8">
                        <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">時間資訊</h3>
                    </div>

                    <!-- 註冊時間 -->
                    <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">註冊時間</dt>
                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ $user->created_at->format('Y-m-d H:i:s') }}</dd>
                    </div>

                    <!-- 最後更新時間 -->
                    <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">最後更新</dt>
                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ $user->updated_at->format('Y-m-d H:i:s') }}</dd>
                    </div>
                </dl>
            </div>
        </div>
    </div>
</div>
@endsection