@extends('admin.layouts.app')

@section('title', '使用者管理')

@section('content')
<div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">使用者管理</h1>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">管理所有系統使用者的帳號和資料</p>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <a href="{{ route('admin.users.create') }}" 
               class="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                新增使用者
            </a>
        </div>
    </div>

    <!-- 成功/錯誤訊息 -->
    @if (session('success'))
        <div class="mt-4 rounded-md bg-green-50 p-4 dark:bg-green-900/50">
            <div class="text-sm text-green-700 dark:text-green-300">{{ session('success') }}</div>
        </div>
    @endif

    @if (session('error'))
        <div class="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/50">
            <div class="text-sm text-red-700 dark:text-red-300">{{ session('error') }}</div>
        </div>
    @endif

    <!-- 搜尋表單 -->
    <div class="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">搜尋使用者</h3>
            <form method="GET" action="{{ route('admin.users.index') }}" class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">姓名</label>
                    <input type="text" 
                           name="name" 
                           id="name"
                           value="{{ request('name') }}" 
                           placeholder="搜尋使用者姓名..."
                           class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                </div>

                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">電子郵件</label>
                    <input type="text" 
                           name="email" 
                           id="email"
                           value="{{ request('email') }}" 
                           placeholder="搜尋電子郵件..."
                           class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                </div>

                <div>
                    <label for="business_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">行業類型</label>
                    <select name="business_type" 
                            id="business_type"
                            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        <option value="">所有行業</option>
                        <option value="restaurant" {{ request('business_type') == 'restaurant' ? 'selected' : '' }}>餐飲業</option>
                        <option value="retail" {{ request('business_type') == 'retail' ? 'selected' : '' }}>零售業</option>
                        <option value="manufacturing" {{ request('business_type') == 'manufacturing' ? 'selected' : '' }}>製造業</option>
                        <option value="service" {{ request('business_type') == 'service' ? 'selected' : '' }}>服務業</option>
                        <option value="technology" {{ request('business_type') == 'technology' ? 'selected' : '' }}>科技業</option>
                        <option value="agriculture" {{ request('business_type') == 'agriculture' ? 'selected' : '' }}>農業</option>
                        <option value="other" {{ request('business_type') == 'other' ? 'selected' : '' }}>其他</option>
                    </select>
                </div>

                <div class="flex items-end space-x-2">
                    <button type="submit" 
                            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
                        <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        搜尋
                    </button>
                    
                    @if(request()->hasAny(['name', 'email', 'business_type', 'role']))
                        <a href="{{ route('admin.users.index') }}" 
                           class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
                            清除
                        </a>
                    @endif
                </div>
            </form>
        </div>
    </div>

    <!-- 使用者列表 -->
    <div class="mt-8 flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">使用者</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">電子郵件</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">行業類型</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">角色</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">註冊時間</th>
                                <th scope="col" class="relative px-6 py-3"><span class="sr-only">動作</span></th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            @forelse ($users as $user)
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0 h-10 w-10">
                                                <div class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {{ strtoupper(substr($user->name, 0, 1)) }}
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="ml-4">
                                                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ $user->name }}</div>
                                                @if($user->email_verified_at)
                                                    <div class="text-sm text-green-500">✓ 已驗證</div>
                                                @else
                                                    <div class="text-sm text-red-500">✗ 未驗證</div>
                                                @endif
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ $user->email }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
                                        {{ $roles[$user->role] ?? $user->role ?? '一般使用者' }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {{ $user->created_at->format('Y-m-d H:i') }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div class="flex space-x-2">
                                            <a href="{{ route('admin.users.show', $user->id) }}" 
                                               class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">查看</a>
                                            <a href="{{ route('admin.users.edit', $user->id) }}" 
                                               class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">編輯</a>
                                            <button onclick="confirmDelete('{{ $user->id }}', '{{ $user->name }}')" 
                                                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">刪除</button>
                                        </div>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                        目前沒有使用者資料
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- 分頁 -->
    @if($users->hasPages())
        <div class="mt-6">
            {{ $users->links() }}
        </div>
    @endif
</div>

<!-- 刪除確認彈窗 -->
<div id="deleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-2">確認刪除</h3>
            <div class="mt-2 px-7 py-3">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    您確定要刪除使用者「<span id="deleteUserName" class="font-medium"></span>」嗎？
                    <br><br>
                    <span class="text-red-600 dark:text-red-400 font-medium">此動作無法復原！</span>
                </p>
            </div>
            <div class="items-center px-4 py-3">
                <button id="confirmDeleteBtn" 
                        class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-3 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300">
                    刪除
                </button>
                <button onclick="closeDeleteModal()" 
                        class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md w-24 hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300">
                    取消
                </button>
            </div>
        </div>
    </div>
</div>

<script>
let deleteUserId = null;

function confirmDelete(userId, userName) {
    // 檢查是否為 DEMO 帳號
    @if(session('admin_user') === 'DEMO')
        alert('DEMO 帳號沒有刪除的權限');
        return;
    @endif
    
    deleteUserId = userId;
    document.getElementById('deleteUserName').textContent = userName;
    document.getElementById('deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
    deleteUserId = null;
    document.getElementById('deleteModal').classList.add('hidden');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
    if (deleteUserId) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/users/${deleteUserId}`;
        
        const csrfToken = document.createElement('input');
        csrfToken.type = 'hidden';
        csrfToken.name = '_token';
        csrfToken.value = '{{ csrf_token() }}';
        
        const methodField = document.createElement('input');
        methodField.type = 'hidden';
        methodField.name = '_method';
        methodField.value = 'DELETE';
        
        form.appendChild(csrfToken);
        form.appendChild(methodField);
        document.body.appendChild(form);
        form.submit();
    }
});

// 點擊背景關閉彈窗
document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeDeleteModal();
    }
});
</script>
@endsection