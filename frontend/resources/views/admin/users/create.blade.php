@extends('admin.layouts.app')

@section('title', '新增使用者')

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
                        <span class="ml-4 text-sm font-medium text-gray-500 dark:text-gray-400">新增使用者</span>
                    </div>
                </li>
            </ol>
        </nav>
    </div>

    <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
            <h2 class="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">新增使用者</h2>
        </div>
    </div>

    <div class="mt-8">
        <div class="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700 sm:rounded-xl">
            <form method="POST" action="{{ route('admin.users.store') }}" class="px-4 py-6 sm:p-8">
                @csrf
                
                <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <!-- 姓名 -->
                    <div class="sm:col-span-3">
                        <label for="name" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">姓名 *</label>
                        <div class="mt-2">
                            <input type="text" name="name" id="name" required 
                                   value="{{ old('name') }}"
                                   class="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
                        </div>
                        @error('name')
                            <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- 電子郵件 -->
                    <div class="sm:col-span-3">
                        <label for="email" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">電子郵件 *</label>
                        <div class="mt-2">
                            <input type="email" name="email" id="email" required 
                                   value="{{ old('email') }}"
                                   class="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
                        </div>
                        @error('email')
                            <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- 密碼 -->
                    <div class="sm:col-span-3">
                        <label for="password" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">密碼 *</label>
                        <div class="mt-2">
                            <input type="password" name="password" id="password" required 
                                   class="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
                        </div>
                        @error('password')
                            <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- 確認密碼 -->
                    <div class="sm:col-span-3">
                        <label for="password_confirmation" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">確認密碼 *</label>
                        <div class="mt-2">
                            <input type="password" name="password_confirmation" id="password_confirmation" required 
                                   class="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
                        </div>
                    </div>

                    <!-- 行業類型 -->
                    <div class="sm:col-span-3">
                        <label for="business_type" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">行業類型</label>
                        <div class="mt-2">
                            <select name="business_type" id="business_type" 
                                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
                                <option value="">請選擇行業類型</option>
                                <option value="retail" {{ old('business_type') === 'retail' ? 'selected' : '' }}>零售業</option>
                                <option value="manufacturing" {{ old('business_type') === 'manufacturing' ? 'selected' : '' }}>製造業</option>
                                <option value="service" {{ old('business_type') === 'service' ? 'selected' : '' }}>服務業</option>
                                <option value="technology" {{ old('business_type') === 'technology' ? 'selected' : '' }}>科技業</option>
                                <option value="restaurant" {{ old('business_type') === 'restaurant' ? 'selected' : '' }}>餐飲業</option>
                                <option value="agriculture" {{ old('business_type') === 'agriculture' ? 'selected' : '' }}>農業</option>
                                <option value="other" {{ old('business_type') === 'other' ? 'selected' : '' }}>其他</option>
                            </select>
                        </div>
                        @error('business_type')
                            <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- 角色 -->
                    <div class="sm:col-span-3">
                        <label for="role" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">角色</label>
                        <div class="mt-2">
                            <select name="role" id="role" 
                                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
                                <option value="">請選擇角色</option>
                                <option value="admin" {{ old('role') === 'admin' ? 'selected' : '' }}>系統管理員</option>
                                <option value="restaurant_owner" {{ old('role') === 'restaurant_owner' ? 'selected' : '' }}>餐飲業主</option>
                                <option value="shop_owner" {{ old('role') === 'shop_owner' ? 'selected' : '' }}>零售業主</option>
                                <option value="factory_owner" {{ old('role') === 'factory_owner' ? 'selected' : '' }}>製造業主</option>
                                <option value="service_provider" {{ old('role') === 'service_provider' ? 'selected' : '' }}>服務業者</option>
                                <option value="farmer" {{ old('role') === 'farmer' ? 'selected' : '' }}>農業經營者</option>
                                <option value="business_owner" {{ old('role') === 'business_owner' ? 'selected' : '' }}>企業經營者</option>
                                <option value="accountant" {{ old('role') === 'accountant' ? 'selected' : '' }}>會計人員</option>
                                <option value="employee" {{ old('role') === 'employee' ? 'selected' : '' }}>一般員工</option>
                            </select>
                        </div>
                        @error('role')
                            <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                <!-- DEMO 帳號限制提示 -->
                @if(session('admin_user') === 'DEMO')
                    <div class="mt-6 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/50">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-yellow-800 dark:text-yellow-300">
                                    <strong>注意：</strong>您正在使用 DEMO 帳號，無法建立新使用者。此功能僅供展示。
                                </p>
                            </div>
                        </div>
                    </div>
                @endif

                <!-- 表單按鈕 -->
                <div class="mt-8 flex">
                    <button type="submit" 
                            @if(session('admin_user') === 'DEMO') disabled @endif
                            class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        建立使用者
                    </button>
                    <a href="{{ route('admin.users.index') }}" 
                       class="ml-3 rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                        取消
                    </a>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection