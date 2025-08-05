@extends('layouts.app')

@section('title', '員工管理')

@section('content')
<!-- 讀取風格指南配置 -->
<?php
$stylePath = public_path('style/style.json');
if (file_exists($stylePath)) {
    $style = json_decode(file_get_contents($stylePath), true);
    $colors = $style['style_guide']['colors'] ?? [];
    $components = $style['style_guide']['components'] ?? [];
} else {
    // 預設樣式配置
    $colors = [
        'primary' => ['background' => '#1f2937', 'card_background' => '#374151'],
        'text' => ['primary' => '#f9fafb', 'secondary' => '#d1d5db'],
        'accent' => ['purple' => '#8b5cf6', 'blue' => '#3b82f6', 'green' => '#10b981', 'orange' => '#f59e0b', 'red' => '#ef4444'],
        'border' => ['primary' => '#4b5563']
    ];
    $components = [
        'card' => ['default' => ['border_radius' => '8px', 'padding' => '1.5rem', 'box_shadow' => '0 4px 6px -1px rgba(0, 0, 0, 0.1)']],
        'button' => ['primary' => ['border_radius' => '6px', 'padding' => '0.75rem 1rem']]
    ];
}
?>

<style>
/* NexusERP 深色主題樣式 */
:root {
    --nexus-primary-bg: <?php echo $colors['primary']['background']; ?>;
    --nexus-secondary-bg: <?php echo $colors['primary']['secondary_background'] ?? $colors['primary']['card_background']; ?>;
    --nexus-card-bg: <?php echo $colors['primary']['card_background']; ?>;
    --nexus-text-primary: <?php echo $colors['text']['primary']; ?>;
    --nexus-text-secondary: <?php echo $colors['text']['secondary']; ?>;
    --nexus-text-muted: <?php echo $colors['text']['muted'] ?? $colors['text']['secondary']; ?>;
    --nexus-accent-purple: <?php echo $colors['accent']['purple']; ?>;
    --nexus-accent-blue: <?php echo $colors['accent']['blue']; ?>;
    --nexus-accent-green: <?php echo $colors['accent']['green']; ?>;
    --nexus-accent-orange: <?php echo $colors['accent']['orange']; ?>;
    --nexus-accent-red: <?php echo $colors['accent']['red']; ?>;
    --nexus-border-primary: <?php echo $colors['border']['primary']; ?>;
}

body {
    background-color: var(--nexus-primary-bg);
    color: var(--nexus-text-primary);
}

.nx-card {
    background: var(--nexus-card-bg);
    border: 1px solid var(--nexus-border-primary);
    border-radius: <?php echo $components['card']['default']['border_radius']; ?>;
    box-shadow: <?php echo $components['card']['default']['box_shadow']; ?>;
}

.employee-card {
    transition: all 0.2s ease-in-out;
    background: var(--nexus-card-bg);
    border: 1px solid var(--nexus-border-primary);
}
.employee-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}
.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
}
.status-active {
    background: rgba(16, 185, 129, 0.2);
    color: var(--nexus-accent-green);
    border: 1px solid rgba(16, 185, 129, 0.3);
}
.status-inactive {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
    border: 1px solid rgba(107, 114, 128, 0.3);
}
.status-terminated {
    background: rgba(239, 68, 68, 0.2);
    color: var(--nexus-accent-red);
    border: 1px solid rgba(239, 68, 68, 0.3);
}
.status-on_leave {
    background: rgba(245, 158, 11, 0.2);
    color: var(--nexus-accent-orange);
    border: 1px solid rgba(245, 158, 11, 0.3);
}

.nx-input {
    background: var(--nexus-card-bg);
    border: 1px solid var(--nexus-border-primary);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    color: var(--nexus-text-primary);
}

.nx-input:focus {
    outline: none;
    border-color: var(--nexus-accent-purple);
    box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
}

.nx-btn {
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    font-weight: 500;
    transition: all 0.2s;
}

.nx-btn-primary {
    background: var(--nexus-accent-purple);
    color: white;
    border: none;
}

.nx-btn-primary:hover {
    background: #7c3aed;
}

.nx-btn-secondary {
    background: var(--nexus-accent-blue);
    color: white;
    border: none;
}

.nx-btn-secondary:hover {
    background: #2563eb;
}
</style>

<div class="min-h-screen py-6" style="background-color: var(--nexus-primary-bg);">
    <div class="container mx-auto px-4">
        <!-- Header Section -->
        <div class="nx-card mb-6">
            <div class="p-6 border-b" style="border-color: var(--nexus-border-primary);">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold" style="color: var(--nexus-text-primary);">員工管理</h1>
                        <p class="mt-2" style="color: var(--nexus-text-secondary);">管理和查看所有員工資訊</p>
                    </div>
                    <div class="flex space-x-3">
                        <a href="{{ route('employees.create') }}" 
                           class="nx-btn nx-btn-primary flex items-center space-x-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>新增員工</span>
                        </a>
                        <button onclick="exportEmployees()" 
                                class="nx-btn nx-btn-secondary flex items-center space-x-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>匯出</span>
                        </button>
                    </div>
                </div>
                
                <!-- Search and Filter Bar -->
                <div class="mt-6 flex flex-col md:flex-row gap-4">
                    <div class="flex-1">
                        <div class="relative">
                            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nexus-text-secondary);">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" 
                                   id="searchInput" 
                                   placeholder="搜尋員工 (姓名、工號、部門...)" 
                                   class="pl-10 pr-4 py-2 w-full nx-input">
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <select id="departmentFilter" class="px-3 py-2 nx-input">
                            <option value="">所有部門</option>
                            <option value="hr">人力資源部</option>
                            <option value="it">資訊技術部</option>
                            <option value="finance">財務部</option>
                            <option value="sales">業務部</option>
                            <option value="operations">營運部</option>
                        </select>
                        <select id="statusFilter" class="px-3 py-2 nx-input">
                            <option value="">所有狀態</option>
                            <option value="active">在職</option>
                            <option value="inactive">停職</option>
                            <option value="on_leave">請假</option>
                            <option value="terminated">離職</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="nx-card p-6">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: rgba(16, 185, 129, 0.2);">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nexus-accent-green);">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium" style="color: var(--nexus-text-secondary);">總員工數</p>
                        <p id="totalEmployees" class="text-2xl font-bold" style="color: var(--nexus-text-primary);">-</p>
                    </div>
                </div>
            </div>
            
            <div class="nx-card p-6">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: rgba(59, 130, 246, 0.2);">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nexus-accent-blue);">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium" style="color: var(--nexus-text-secondary);">在職員工</p>
                        <p id="activeEmployees" class="text-2xl font-bold" style="color: var(--nexus-text-primary);">-</p>
                    </div>
                </div>
            </div>
            
            <div class="nx-card p-6">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: rgba(245, 158, 11, 0.2);">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nexus-accent-orange);">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium" style="color: var(--nexus-text-secondary);">請假中</p>
                        <p id="onLeaveEmployees" class="text-2xl font-bold" style="color: var(--nexus-text-primary);">-</p>
                    </div>
                </div>
            </div>
            
            <div class="nx-card p-6">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: rgba(139, 92, 246, 0.2);">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nexus-accent-purple);">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium" style="color: var(--nexus-text-secondary);">部門數量</p>
                        <p id="departmentCount" class="text-2xl font-bold" style="color: var(--nexus-text-primary);">-</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Employee List -->
        <div class="nx-card">
            <div class="p-6 border-b" style="border-color: var(--nexus-border-primary);">
                <div class="flex justify-between items-center">
                    <h2 class="text-xl font-semibold" style="color: var(--nexus-text-primary);">員工列表</h2>
                    <div class="flex items-center space-x-3">
                        <button id="toggleView" 
                                class="p-2 transition-colors" style="color: var(--nexus-text-secondary);" onmouseover="this.style.color='var(--nexus-text-primary)'" onmouseout="this.style.color='var(--nexus-text-secondary)'">
                            <svg id="gridIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <svg id="listIcon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </button>
                        <span id="resultsCount" class="text-sm" style="color: var(--nexus-text-secondary);">載入中...</span>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div id="loadingState" class="p-8 text-center">
                <div class="inline-flex items-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="color: var(--nexus-accent-purple);">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span style="color: var(--nexus-text-primary);">載入員工資料中...</span>
                </div>
            </div>

            <!-- Grid View -->
            <div id="gridView" class="p-6 hidden">
                <div id="employeeGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Employee cards will be populated here -->
                </div>
            </div>

            <!-- Table View -->
            <div id="tableView" class="hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">員工</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工號</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部門</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">職位</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">到職日期</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody id="employeeTable" class="bg-white divide-y divide-gray-200">
                            <!-- Employee rows will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Empty State -->
            <div id="emptyState" class="p-8 text-center hidden">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">暫無員工資料</h3>
                <p class="mt-1 text-sm text-gray-500">開始新增第一位員工吧</p>
                <div class="mt-6">
                    <a href="{{ route('employees.create') }}" 
                       class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                        <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        新增員工
                    </a>
                </div>
            </div>

            <!-- Pagination -->
            <div id="pagination" class="px-6 py-3 border-t border-gray-200 hidden">
                <div class="flex items-center justify-between">
                    <div class="flex-1 flex justify-between sm:hidden">
                        <button id="prevPageMobile" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            上一頁
                        </button>
                        <button id="nextPageMobile" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            下一頁
                        </button>
                    </div>
                    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p class="text-sm text-gray-700">
                                顯示第 <span id="pageStart" class="font-medium">1</span> 到 <span id="pageEnd" class="font-medium">10</span> 筆，
                                共 <span id="pageTotal" class="font-medium">100</span> 筆結果
                            </p>
                        </div>
                        <div>
                            <nav id="pageNumbers" class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <!-- Page numbers will be populated here -->
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Employee Detail Modal -->
<div id="employeeModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900" id="modalTitle">員工詳細資訊</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div id="modalContent" class="text-gray-600">
                <!-- Modal content will be populated here -->
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="{{ asset('js/components/employees/EmployeeManagement.js') }}"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    window.employeeManager = new EmployeeManagement();
});
</script>
@endpush