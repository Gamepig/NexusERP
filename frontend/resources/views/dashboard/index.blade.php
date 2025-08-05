@extends('layouts.app')

@section('title', '系統儀表板 - NexusERP')

@push('styles')
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.css">
<style>
    /* P1.3 儀表板樣式 */
    .dashboard-container {
        background: var(--nexus-background-primary);
        min-height: calc(100vh - 4rem);
        padding: 1.5rem;
    }
    
    .dashboard-header {
        margin-bottom: 2rem;
    }
    
    .dashboard-updated {
        animation: dashboardUpdateFlash 0.5s ease-in-out;
    }
    
    @keyframes dashboardUpdateFlash {
        0% { background-color: rgba(var(--nexus-primary-rgb), 0.1); }
        50% { background-color: rgba(var(--nexus-primary-rgb), 0.2); }
        100% { background-color: transparent; }
    }
    
    .chart-container {
        position: relative;
        height: 300px;
        margin-top: 1rem;
        background: var(--nexus-background-secondary);
        border-radius: 0.75rem;
        padding: 1rem;
    }
    
    .quick-action-card {
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .quick-action-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(var(--nexus-primary-rgb), 0.15);
    }
    
    .refresh-indicator {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .refreshing .refresh-indicator {
        opacity: 1;
    }
    
    /* 載入狀態 */
    .dashboard-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        flex-direction: column;
        gap: 1rem;
    }
    
    /* 錯誤狀態 */
    .dashboard-error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: var(--nexus-text-error);
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }
    
    /* 響應式設計 */
    @media (max-width: 768px) {
        .dashboard-container {
            padding: 1rem;
        }
        
        .chart-container {
            height: 250px;
        }
    }
</style>
@endpush

@section('content')
<div class="dashboard-container" data-dashboard>
    <!-- 頁面標題和控制項 -->
    <div class="dashboard-header flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-bold nexus-text-primary mb-2">管理儀表板</h1>
            <p class="nexus-text-secondary">總覽您的業務營運狀況</p>
        </div>
        <div class="flex items-center space-x-3">
            <div class="text-sm nexus-text-muted" id="lastUpdateTime">
                最後更新: 載入中...
            </div>
            <button data-action="refresh-dashboard" 
                    class="nexus-btn nexus-btn-primary flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>重新整理</span>
            </button>
        </div>
    </div>

    <!-- 載入狀態 -->
    <div id="dashboardLoading" class="dashboard-loading">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2" style="border-color: var(--nexus-primary-500);"></div>
        <p class="nexus-text-secondary">載入儀表板數據中...</p>
    </div>

    <!-- 錯誤狀態 -->
    <div id="dashboardError" class="dashboard-error hidden">
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span id="dashboardErrorMessage">載入失敗</span>
        </div>
    </div>

    <!-- 儀表板內容 -->
    <div id="dashboardStats" class="hidden">
        <!-- 關鍵績效指標卡片 -->
        <div id="statsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <!-- 總營收統計卡片 -->
            <x-dashboard.stat-card 
                title="總營收"
                :value="0"
                :change="0"
                change-type="neutral"
                icon="currency-dollar"
                icon-color="var(--nexus-accent-green)"
                prefix="$"
                stat-key="totalRevenue"
                :loading="true"
                description="過去30天營收"
            />
            
            <!-- 總訂單數統計卡片 -->
            <x-dashboard.stat-card 
                title="總訂單數"
                :value="0"
                :change="0"
                change-type="neutral"
                icon="shopping-cart"
                icon-color="var(--nexus-accent-blue)"
                stat-key="totalOrders"
                :loading="true"
                description="過去30天訂單數"
            />
            
            <!-- 總客戶數統計卡片 -->
            <x-dashboard.stat-card 
                title="總客戶數"
                :value="0"
                :change="0"
                change-type="neutral"
                icon="users"
                icon-color="var(--nexus-accent-purple)"
                stat-key="totalCustomers"
                :loading="true"
                description="總客戶數量"
            />
            
            <!-- 待處理報價統計卡片 -->
            <x-dashboard.stat-card 
                title="待處理報價"
                :value="0"
                :change="0"
                change-type="neutral"
                icon="document-text"
                icon-color="var(--nexus-accent-orange)"
                stat-key="pendingQuotes"
                :loading="true"
                description="待處理報價"
            />
            
            <!-- 低庫存警報統計卡片 -->
            <x-dashboard.stat-card 
                title="庫存警報"
                :value="0"
                :change="0"
                change-type="neutral"
                icon="exclamation-triangle"
                icon-color="var(--nexus-accent-red)"
                stat-key="lowStockAlerts"
                :loading="true"
                description="庫存警報數量"
            />
            
            <!-- 轉換率統計卡片 -->
            <x-dashboard.stat-card 
                title="轉換率"
                :value="0"
                :change="0"
                change-type="neutral"
                icon="chart-line"
                icon-color="var(--nexus-primary-500)"
                suffix="%"
                stat-key="conversionRate"
                :loading="true"
                description="客戶轉換率"
            />
        </div>

        <!-- 圖表區域 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- 營收趨勢圖 -->
            <div class="nexus-card">
                <div class="p-6 pb-2">
                    <h3 class="text-lg font-semibold nexus-text-primary mb-1">營收趨勢</h3>
                    <p class="text-sm nexus-text-secondary mb-4">過去7天營收表現</p>
                </div>
                <div class="chart-container">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>

            <!-- 訂單狀態分布 -->
            <div class="nexus-card">
                <div class="p-6 pb-2">
                    <h3 class="text-lg font-semibold nexus-text-primary mb-1">訂單狀態分布</h3>
                    <p class="text-sm nexus-text-secondary mb-4">訂單狀態統計</p>
                </div>
                <div class="chart-container">
                    <canvas id="ordersChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- 庫存圖表和快速操作 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- 庫存分析圖 -->
            <div class="nexus-card">
                <div class="p-6 pb-2">
                    <h3 class="text-lg font-semibold nexus-text-primary mb-1">庫存分析</h3>
                    <p class="text-sm nexus-text-secondary mb-4">前10名產品庫存量</p>
                </div>
                <div class="chart-container">
                    <canvas id="inventoryChart"></canvas>
                </div>
            </div>
            
            <!-- 快速操作區域 -->
            <div class="nexus-card">
                <div class="p-6">
                    <h3 class="text-lg font-semibold nexus-text-primary mb-1">快速操作</h3>
                    <p class="text-sm nexus-text-secondary mb-4">常用功能快捷入口</p>
                    <div id="quickActions" class="grid grid-cols-2 gap-3">
                        <!-- 快速操作將由 JavaScript 動態填充 -->
                    </div>
                </div>
            </div>
        </div>

    </div>
    
    <!-- 活動和通知 -->
    <div id="dashboardNotifications" class="hidden mb-6">
        <!-- 通知將由 JavaScript 動態填充 -->
    </div>
</div>
@endsection

@push('scripts')
<!-- Chart.js CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js"></script>

<!-- Dashboard Manager -->
<script src="{{ asset('js/components/dashboard/DashboardManager.js') }}"></script>

<!-- P1.3 儀表板初始化和圖表管理 -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Dashboard] P1.3 儀表板初始化開始');
    
    // 等待 DashboardManager 載入
    if (typeof DashboardManager === 'undefined') {
        console.error('[Dashboard] DashboardManager 未找到');
        return;
    }
    
    // 初始化圖表管理器
    const chartManager = {
        charts: {},
        
        // 初始化所有圖表
        initCharts() {
            this.initRevenueChart();
            this.initOrdersChart();
            this.initInventoryChart();
        },
        
        // 營收趨勢圖
        initRevenueChart() {
            const ctx = document.getElementById('revenueChart');
            if (!ctx) return;
            
            this.charts.revenue = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '營收',
                        data: [],
                        borderColor: 'var(--nexus-accent-green)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        },
        
        // 訂單狀態圖
        initOrdersChart() {
            const ctx = document.getElementById('ordersChart');
            if (!ctx) return;
            
            this.charts.orders = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            'var(--nexus-accent-green)',
                            'var(--nexus-accent-blue)',
                            'var(--nexus-accent-orange)',
                            'var(--nexus-accent-red)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        },
        
        // 庫存分析圖
        initInventoryChart() {
            const ctx = document.getElementById('inventoryChart');
            if (!ctx) return;
            
            this.charts.inventory = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: '庫存量',
                        data: [],
                        backgroundColor: 'var(--nexus-accent-purple)',
                        borderColor: 'var(--nexus-accent-purple)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        },
        
        // 更新圖表數據
        updateCharts(chartsData) {
            if (chartsData.revenue && this.charts.revenue) {
                this.charts.revenue.data.labels = chartsData.revenue.labels;
                this.charts.revenue.data.datasets[0].data = chartsData.revenue.values;
                this.charts.revenue.update();
            }
            
            if (chartsData.orders && this.charts.orders) {
                this.charts.orders.data.labels = chartsData.orders.labels;
                this.charts.orders.data.datasets[0].data = chartsData.orders.values;
                this.charts.orders.update();
            }
            
            if (chartsData.inventory && this.charts.inventory) {
                this.charts.inventory.data.labels = chartsData.inventory.labels;
                this.charts.inventory.data.datasets[0].data = chartsData.inventory.values;
                this.charts.inventory.update();
            }
        }
    };
    
    // 快速操作管理器
    const quickActionsManager = {
        // 渲染快速操作
        renderQuickActions(actions) {
            const container = document.getElementById('quickActions');
            if (!container || !actions) return;
            
            container.innerHTML = actions.map(action => `
                <a href="${action.url}" class="quick-action-card nexus-card p-4 text-center transition-all duration-200 hover:shadow-lg relative">
                    <div class="flex flex-col items-center space-y-2">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-1" style="background: ${action.iconBg};">
                            <svg class="w-5 h-5" style="color: ${action.iconColor};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <!-- 圖標將根據 action.icon 動態載入 -->
                            </svg>
                        </div>
                        <div>
                            <div class="font-medium text-sm nexus-text-primary">${action.title}</div>
                            <div class="text-xs nexus-text-secondary">${action.subtitle}</div>
                        </div>
                    </div>
                    ${action.badge ? `<span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">${action.badge}</span>` : ''}
                </a>
            `).join('');
        }
    };
    
    // 狀態管理器
    const stateManager = {
        // 顯示載入狀態
        showLoading() {
            document.getElementById('dashboardLoading')?.classList.remove('hidden');
            document.getElementById('dashboardStats')?.classList.add('hidden');
            document.getElementById('dashboardError')?.classList.add('hidden');
        },
        
        // 顯示內容
        showContent() {
            document.getElementById('dashboardLoading')?.classList.add('hidden');
            document.getElementById('dashboardStats')?.classList.remove('hidden');
            document.getElementById('dashboardError')?.classList.add('hidden');
        },
        
        // 顯示錯誤
        showError(message) {
            document.getElementById('dashboardLoading')?.classList.add('hidden');
            document.getElementById('dashboardStats')?.classList.add('hidden');
            const errorEl = document.getElementById('dashboardError');
            const errorMsgEl = document.getElementById('dashboardErrorMessage');
            if (errorEl && errorMsgEl) {
                errorEl.classList.remove('hidden');
                errorMsgEl.textContent = message;
            }
        }
    };
    
    // 初始化圖表
    chartManager.initCharts();
    
    // 監聽 Dashboard Manager 事件
    document.addEventListener('dashboard-loaded', function(event) {
        console.log('[Dashboard] 數據載入完成', event.detail);
        const { data } = event.detail;
        
        // 更新圖表
        if (data.charts) {
            chartManager.updateCharts(data.charts);
        }
        
        // 更新快速操作
        if (data.quickActions) {
            quickActionsManager.renderQuickActions(data.quickActions);
        }
        
        // 顯示內容
        stateManager.showContent();
    });
    
    document.addEventListener('dashboard-error', function(event) {
        console.error('[Dashboard] 錯誤:', event.detail);
        stateManager.showError(event.detail.error || '載入失敗');
    });
    
    document.addEventListener('dashboard-loading-start', function() {
        stateManager.showLoading();
    });
    
    // 保存到全域以供調試
    window.dashboardComponents = {
        chartManager,
        quickActionsManager,
        stateManager
    };
    
    console.log('[Dashboard] P1.3 儀表板初始化完成');
});
</script>
@endpush