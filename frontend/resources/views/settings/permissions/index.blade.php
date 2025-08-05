@extends('settings.layout')

@section('settings-content')
<div class="p-6" data-testid="permissions-settings-page">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-8">
        <div>
            <h2 class="text-2xl font-bold text-gray-900">使用者權限管理</h2>
            <p class="mt-2 text-gray-600">管理使用者角色、權限設定和存取控制</p>
        </div>
        <div class="flex space-x-3">
            <a href="{{ route('settings.permissions.roles.create') }}" 
               class="px-4 py-2 bg-green-600 border border-transparent rounded-md text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
               data-testid="create-role-button">
                <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                建立角色
            </a>
            <button type="button" 
                    class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="assign-permissions-button">
                <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                分配權限
            </button>
        </div>
    </div>

    <!-- Permission Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-200" data-testid="total-users-card">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                        </svg>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">總使用者數</dt>
                            <dd class="text-lg font-medium text-gray-900">47</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-200" data-testid="total-roles-card">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                        </svg>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">總角色數</dt>
                            <dd class="text-lg font-medium text-gray-900">8</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-200" data-testid="active-sessions-card">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">活躍會話</dt>
                            <dd class="text-lg font-medium text-gray-900">23</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-200" data-testid="pending-requests-card">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">待審核請求</dt>
                            <dd class="text-lg font-medium text-gray-900">3</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Navigation Tabs -->
    <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8" data-testid="permissions-tabs">
            <a href="{{ route('settings.permissions.index') }}" 
               class="border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
               data-testid="overview-tab">
                總覽
            </a>
            <a href="{{ route('settings.permissions.roles') }}" 
               class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
               data-testid="roles-tab">
                角色管理
            </a>
            <a href="{{ route('settings.permissions.users') }}" 
               class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
               data-testid="users-tab">
                使用者管理
            </a>
        </nav>
    </div>

    <!-- Recent Activities -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Recent Role Changes -->
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">最近角色異動</h3>
            </div>
            <div class="p-6">
                <div class="space-y-4" data-testid="recent-role-changes">
                    <div class="flex items-center space-x-4">
                        <div class="flex-shrink-0">
                            <span class="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm">
                                +
                            </span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900">
                                建立新角色 <span class="font-medium text-blue-600">「倉庫管理員」</span>
                            </p>
                            <p class="text-xs text-gray-500">由 張三 於 2小時前建立</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <div class="flex-shrink-0">
                            <span class="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm">
                                ≡
                            </span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900">
                                修改角色權限 <span class="font-medium text-blue-600">「銷售代表」</span>
                            </p>
                            <p class="text-xs text-gray-500">由 李四 於 5小時前修改</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <div class="flex-shrink-0">
                            <span class="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full text-sm">
                                ↔
                            </span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900">
                                使用者角色異動：王五 從 <span class="font-medium">「員工」</span> 升級為 <span class="font-medium text-blue-600">「主管」</span>
                            </p>
                            <p class="text-xs text-gray-500">由 陳六 於 1天前執行</p>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6">
                    <a href="#" class="text-sm text-blue-600 hover:text-blue-900 font-medium" data-testid="view-all-activities">
                        查看所有活動記錄 →
                    </a>
                </div>
            </div>
        </div>

        <!-- Permission Matrix Quick View -->
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">權限矩陣快覽</h3>
            </div>
            <div class="p-6">
                <div class="overflow-x-auto" data-testid="permission-matrix">
                    <table class="min-w-full">
                        <thead>
                            <tr>
                                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">模組</th>
                                <th class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">管理員</th>
                                <th class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">主管</th>
                                <th class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">員工</th>
                            </tr>
                        </thead>
                        <tbody class="space-y-2">
                            <tr>
                                <td class="text-sm text-gray-900 py-2">庫存管理</td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-green-100 text-green-600 rounded-full text-xs">✓</span>
                                </td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-green-100 text-green-600 rounded-full text-xs">✓</span>
                                </td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-yellow-100 text-yellow-600 rounded-full text-xs">R</span>
                                </td>
                            </tr>
                            <tr>
                                <td class="text-sm text-gray-900 py-2">財務管理</td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-green-100 text-green-600 rounded-full text-xs">✓</span>
                                </td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-yellow-100 text-yellow-600 rounded-full text-xs">R</span>
                                </td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-red-100 text-red-600 rounded-full text-xs">✗</span>
                                </td>
                            </tr>
                            <tr>
                                <td class="text-sm text-gray-900 py-2">使用者管理</td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-green-100 text-green-600 rounded-full text-xs">✓</span>
                                </td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-red-100 text-red-600 rounded-full text-xs">✗</span>
                                </td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-red-100 text-red-600 rounded-full text-xs">✗</span>
                                </td>
                            </tr>
                            <tr>
                                <td class="text-sm text-gray-900 py-2">報表系統</td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-green-100 text-green-600 rounded-full text-xs">✓</span>
                                </td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-green-100 text-green-600 rounded-full text-xs">✓</span>
                                </td>
                                <td class="text-center py-2">
                                    <span class="inline-flex items-center justify-center w-4 h-4 bg-yellow-100 text-yellow-600 rounded-full text-xs">R</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-4 flex justify-between items-center text-xs text-gray-500">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-1">
                            <span class="inline-flex items-center justify-center w-3 h-3 bg-green-100 text-green-600 rounded-full text-xs">✓</span>
                            <span>完整權限</span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <span class="inline-flex items-center justify-center w-3 h-3 bg-yellow-100 text-yellow-600 rounded-full text-xs">R</span>
                            <span>唯讀</span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <span class="inline-flex items-center justify-center w-3 h-3 bg-red-100 text-red-600 rounded-full text-xs">✗</span>
                            <span>無權限</span>
                        </div>
                    </div>
                    <a href="{{ route('settings.permissions.roles') }}" class="text-blue-600 hover:text-blue-900 font-medium" data-testid="view-full-matrix">
                        查看完整矩陣 →
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Handle assign permissions button
    const assignPermissionsButton = document.querySelector('[data-testid="assign-permissions-button"]');
    if (assignPermissionsButton) {
        assignPermissionsButton.addEventListener('click', function() {
            // TODO: Open assign permissions modal or redirect
            alert('權限分配功能開發中');
        });
    }

    // Handle tab navigation
    const tabs = document.querySelectorAll('[data-testid*="-tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active state from all tabs
            tabs.forEach(t => {
                t.classList.remove('border-blue-500', 'text-blue-600');
                t.classList.add('border-transparent', 'text-gray-500');
            });
            
            // Add active state to clicked tab
            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('border-blue-500', 'text-blue-600');
            
            // TODO: Load corresponding content
            console.log('Tab switched to:', this.getAttribute('data-testid'));
        });
    });

    // Handle view all activities link
    const viewAllActivitiesLink = document.querySelector('[data-testid="view-all-activities"]');
    if (viewAllActivitiesLink) {
        viewAllActivitiesLink.addEventListener('click', function(e) {
            e.preventDefault();
            // TODO: Open activities modal or redirect
            alert('活動記錄詳情頁面開發中');
        });
    }

    // Handle view full matrix link
    const viewFullMatrixLink = document.querySelector('[data-testid="view-full-matrix"]');
    if (viewFullMatrixLink) {
        viewFullMatrixLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Will navigate to roles page
        });
    }

    // Auto-refresh stats every 30 seconds
    setInterval(function() {
        // TODO: Fetch and update statistics
        console.log('Refreshing permission statistics...');
    }, 30000);
});
</script>
@endpush