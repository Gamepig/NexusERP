@extends('layouts.app')

@section('title', '系統儀表板 - NexusERP')

@push('styles')
<!-- Chart.js 樣式已內置在 JS 中，移除額外的 CSS 載入以避免 404 錯誤 -->
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
    
    /* 隱藏載入狀態 - 提高特定性覆蓋 flex 顯示 */
    .dashboard-loading.hidden {
        display: none !important;
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
    
    /* NexusERP 增強卡片樣式 - 高對比度 */
    .nexus-card {
        background: linear-gradient(135deg, #2d3142 0%, #353849 100%) !important;
        border: 2px solid #4b5563 !important;
        border-radius: 1rem !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
        transition: all 0.3s ease;
    }
    
    .nexus-card:hover {
        border-color: #8b5cf6 !important;
        box-shadow: 0 20px 35px -5px rgba(139, 92, 246, 0.2), 0 10px 15px -6px rgba(0, 0, 0, 0.1) !important;
        transform: translateY(-2px);
    }
    
    /* 快速操作卡片增強 */
    .nexus-quick-action-card {
        background: linear-gradient(135deg, #2d3142 0%, #353849 100%) !important;
        border: 2px solid #374151 !important;
        position: relative;
        overflow: hidden;
    }
    
    .nexus-quick-action-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #8b5cf6, #ec4899, #06b6d4, #10b981);
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .nexus-quick-action-card:hover::before {
        opacity: 1;
    }
    
    .nexus-quick-action-card:hover {
        border-color: #6b7280 !important;
        transform: translateY(-4px);
        box-shadow: 0 15px 30px -5px rgba(139, 92, 246, 0.3) !important;
    }
    
    /* 圖表卡片增強 */
    .nexus-chart-card {
        background: linear-gradient(135deg, #2d3142 0%, #343751 100%) !important;
        border: 2px solid #4b5563 !important;
        position: relative;
        overflow: hidden;
    }
    
    .nexus-chart-card::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #10b981, #3b82f6, #f59e0b, #ec4899);
        opacity: 0.8;
    }
    
    .nexus-chart-card:hover {
        border-color: #6366f1 !important;
        box-shadow: 0 20px 35px -5px rgba(99, 102, 241, 0.2) !important;
    }
    
    /* 統計區域增強 */
    #statsGrid {
        background: linear-gradient(135deg, rgba(45, 49, 66, 0.6) 0%, rgba(37, 40, 54, 0.8) 100%) !important;
        border: 2px solid #4b5563 !important;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
    }
    
    #statsGrid::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899);
    }
    
    /* 文字對比度增強 */
    .nexus-text-primary {
        color: #ffffff !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .nexus-text-secondary {
        color: #cbd5e1 !important;
    }
    
    .nexus-text-muted {
        color: #94a3b8 !important;
    }
    
    /* 按鈕增強 */
    .nexus-btn {
        background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
        border: 1px solid #6b7280;
        color: #ffffff;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .nexus-btn:hover {
        background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
        border-color: #8b5cf6;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        transform: translateY(-1px);
    }
    
    .nexus-btn-primary {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        border-color: #8b5cf6;
    }
    
    .nexus-btn-primary:hover {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
    }
    
    /* 響應式設計 */
    @media (max-width: 768px) {
        .dashboard-container {
            padding: 1rem;
        }
        
        .chart-container {
            height: 250px;
        }
        
        .nexus-card {
            border-width: 1px !important;
        }
        
        .nexus-quick-action-card {
            border-width: 1px !important;
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
    <div id="dashboardLoading" class="dashboard-loading hidden">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2" style="border-color: var(--nexus-primary-500);"></div>
        <p class="nexus-text-secondary">載入儀表板數據中...</p>
        <!-- Debug Info -->
        <div class="mt-4 text-xs text-gray-500" id="debugInfo">
            <p>認證狀態: {{ auth()->check() ? '已登入' : '未登入' }}</p>
            <p>使用者: {{ auth()->check() ? auth()->user()->name : 'N/A' }}</p>
            <p>公司 ID: {{ session('current_company_id') ?? 'N/A' }}</p>
            <p>API 端點: /api/dashboard</p>
        </div>
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
    <div id="dashboardStats" class="">
        <!-- 關鍵績效指標卡片 - NexusERP 標準風格 -->
        <div id="statsGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8" style="background: rgba(45, 49, 66, 0.3); border-radius: 1rem; padding: 1.5rem; border: 1px solid #374151;">
            <!-- 總營收統計卡片 -->
            <x-dashboard.stat-card 
                title="總營收"
                :value="81890029"
                :change="27.1"
                change-type="positive"
                icon="currency-dollar"
                icon-color="#10b981"
                prefix="NT$"
                stat-key="totalRevenue"
                :loading="false"
                description="過去30天營收"
            />
            
            <!-- 總訂單數統計卡片 -->
            <x-dashboard.stat-card 
                title="總訂單數"
                :value="1083"
                :change="-27.1"
                change-type="negative"
                icon="shopping-cart"
                icon-color="#3b82f6"
                stat-key="totalOrders"
                :loading="false"
                description="過去30天訂單數"
            />
            
            <!-- 總客戶數統計卡片 -->
            <x-dashboard.stat-card 
                title="總客戶數"
                :value="17"
                :change="0.0"
                change-type="neutral"
                icon="users"
                icon-color="#8b5cf6"
                stat-key="totalCustomers"
                :loading="false"
                description="總客戶數量"
            />
            
            <!-- 待處理報價統計卡片 -->
            <x-dashboard.stat-card 
                title="待處理報價"
                :value="554"
                :change="27.4"
                change-type="positive"
                icon="document-text"
                icon-color="#f59e0b"
                stat-key="pendingQuotes"
                :loading="false"
                description="待處理報價"
            />
            
            <!-- 低庫存警報統計卡片 -->
            <x-dashboard.stat-card 
                title="庫存警報"
                :value="22"
                :change="0"
                change-type="neutral"
                icon="exclamation-triangle"
                icon-color="#ef4444"
                stat-key="lowStockAlerts"
                :loading="false"
                description="庫存警報數量"
            />
            
            <!-- 轉換率統計卡片 -->
            <x-dashboard.stat-card 
                title="轉換率"
                :value="63.7"
                :change="-284.7"
                change-type="negative"
                icon="presentation-chart-line"
                icon-color="#ec4899"
                suffix="%"
                stat-key="conversionRate"
                :loading="false"
                description="客戶轉換率"
            />
        </div>

        <!-- 快速操作區域 - 移到統計卡片下方 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <!-- 新增報價單 -->
            <a href="/quotes/create" class="nexus-card nexus-quick-action-card group hover:shadow-xl transition-all duration-300">
                <div class="p-6 text-center">
                    <div class="w-12 h-12 mx-auto mb-4 bg-purple-500 bg-opacity-20 rounded-xl flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                        <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3 class="font-semibold text-sm nexus-text-primary mb-1">新增報價單</h3>
                    <p class="text-xs nexus-text-secondary">建立新的報價文件</p>
                    <div class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
            </a>

            <!-- 庫存管理 -->
            <a href="/inventory" class="nexus-card nexus-quick-action-card group hover:shadow-xl transition-all duration-300">
                <div class="p-6 text-center">
                    <div class="w-12 h-12 mx-auto mb-4 bg-orange-500 bg-opacity-20 rounded-xl flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                        <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                    </div>
                    <h3 class="font-semibold text-sm nexus-text-primary mb-1">庫存管理</h3>
                    <p class="text-xs nexus-text-secondary">檢視庫存狀況</p>
                    <div class="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">22</div>
                </div>
            </a>

            <!-- 訂單處理 -->
            <a href="/orders" class="nexus-card nexus-quick-action-card group hover:shadow-xl transition-all duration-300">
                <div class="p-6 text-center">
                    <div class="w-12 h-12 mx-auto mb-4 bg-blue-500 bg-opacity-20 rounded-xl flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                        <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                        </svg>
                    </div>
                    <h3 class="font-semibold text-sm nexus-text-primary mb-1">訂單處理</h3>
                    <p class="text-xs nexus-text-secondary">處理待辦訂單</p>
                    <div class="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">1000</div>
                </div>
            </a>

            <!-- 客戶管理 -->
            <a href="/customers" class="nexus-card nexus-quick-action-card group hover:shadow-xl transition-all duration-300">
                <div class="p-6 text-center">
                    <div class="w-12 h-12 mx-auto mb-4 bg-green-500 bg-opacity-20 rounded-xl flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                        <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                    </div>
                    <h3 class="font-semibold text-sm nexus-text-primary mb-1">客戶管理</h3>
                    <p class="text-xs nexus-text-secondary">管理客戶資料</p>
                    <div class="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">17</div>
                </div>
            </a>
        </div>

        <!-- 圖表區域 - 2x2 平衡佈局 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- 營收趨勢圖 -->
            <div class="nexus-card nexus-chart-card">
                <div class="p-6 pb-2">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h3 class="text-lg font-semibold nexus-text-primary mb-1">營收趨勢</h3>
                            <p class="text-sm nexus-text-secondary">過去7天營收表現</p>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold text-green-400" id="totalRevenueDisplay">載入中...</div>
                            <div class="text-xs text-green-400">+12.5% ↗</div>
                        </div>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>

            <!-- 訂單狀態分布 -->
            <div class="nexus-card nexus-chart-card">
                <div class="p-6 pb-2">
                    <h3 class="text-lg font-semibold nexus-text-primary mb-1">訂單狀態分布</h3>
                    <p class="text-sm nexus-text-secondary mb-4">訂單狀態統計</p>
                </div>
                <div class="chart-container">
                    <canvas id="ordersChart"></canvas>
                </div>
            </div>

            <!-- 庫存分析圖 -->
            <div class="nexus-card nexus-chart-card">
                <div class="p-6 pb-2">
                    <h3 class="text-lg font-semibold nexus-text-primary mb-1">庫存分析</h3>
                    <p class="text-sm nexus-text-secondary mb-4">前8名產品庫存量</p>
                </div>
                <div class="chart-container">
                    <canvas id="inventoryChart"></canvas>
                </div>
            </div>

            <!-- 新增：月度業績目標達成率 -->
            <div class="nexus-card nexus-chart-card">
                <div class="p-6 pb-2">
                    <h3 class="text-lg font-semibold nexus-text-primary mb-1">月度目標達成</h3>
                    <p class="text-sm nexus-text-secondary mb-4">本月業績目標進度</p>
                </div>
                <div class="chart-container">
                    <canvas id="performanceChart"></canvas>
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
<!-- Chart.js CDN - 使用穩定版本 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>

<!-- NexusERP Dashboard Charts -->
<script>
// NexusERP 深色主題顏色配置 (基於 style.json)
const NexusColors = {
    primary: {
        background: '#1a1d29',
        cardBackground: '#2d3142',
        secondaryBackground: '#252836',
    },
    accent: {
        purple: '#8b5cf6',
        blue: '#3b82f6',
        pink: '#ec4899',
        cyan: '#06b6d4',
        green: '#10b981',
        orange: '#f59e0b',
        red: '#ef4444'
    },
    text: {
        primary: '#ffffff',
        secondary: '#94a3b8',
        muted: '#64748b'
    },
    border: '#374151'
};

// Chart.js 深色主題默認配置
const nexusChartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: NexusColors.text.primary,
                font: {
                    family: "'Inter', sans-serif",
                    size: 12
                }
            }
        }
    },
    scales: {
        x: {
            ticks: {
                color: NexusColors.text.secondary,
                font: {
                    family: "'Inter', sans-serif"
                }
            },
            grid: {
                color: NexusColors.border,
                borderColor: NexusColors.border
            }
        },
        y: {
            ticks: {
                color: NexusColors.text.secondary,
                font: {
                    family: "'Inter', sans-serif"
                }
            },
            grid: {
                color: NexusColors.border,
                borderColor: NexusColors.border
            }
        }
    }
};

// 圖表初始化函數
function initNexusCharts() {
    console.log('[NexusERP] 開始初始化深色主題圖表...');
    
    // 檢查 Chart.js 是否可用
    if (typeof Chart === 'undefined') {
        console.error('[NexusERP] Chart.js 未載入');
        return;
    }

    // 1. 營收趨勢圖
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
                datasets: [{
                    label: '營收 (NT$)',
                    data: [120000, 190000, 85000, 150000, 95000, 145000, 180000],
                    borderColor: NexusColors.accent.green,
                    backgroundColor: NexusColors.accent.green + '20',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: NexusColors.accent.green,
                    pointBorderColor: NexusColors.primary.cardBackground,
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                ...nexusChartDefaults,
                plugins: {
                    ...nexusChartDefaults.plugins,
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: NexusColors.primary.cardBackground,
                        titleColor: NexusColors.text.primary,
                        bodyColor: NexusColors.text.secondary,
                        borderColor: NexusColors.border,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return '營收: NT$' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    ...nexusChartDefaults.scales,
                    y: {
                        ...nexusChartDefaults.scales.y,
                        ticks: {
                            ...nexusChartDefaults.scales.y.ticks,
                            callback: function(value) {
                                return 'NT$' + (value / 1000) + 'K';
                            }
                        }
                    }
                }
            }
        });
        console.log('[NexusERP] ✅ 營收趨勢圖已初始化');
    }

    // 2. 訂單狀態分布圖
    const ordersCtx = document.getElementById('ordersChart');
    if (ordersCtx) {
        new Chart(ordersCtx, {
            type: 'doughnut',
            data: {
                labels: ['已完成', '處理中', '待確認', '已取消'],
                datasets: [{
                    data: [650, 250, 80, 20],
                    backgroundColor: [
                        NexusColors.accent.green,
                        NexusColors.accent.blue,
                        NexusColors.accent.orange,
                        NexusColors.accent.red
                    ],
                    borderColor: NexusColors.primary.cardBackground,
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: NexusColors.text.primary,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12
                            },
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: NexusColors.primary.cardBackground,
                        titleColor: NexusColors.text.primary,
                        bodyColor: NexusColors.text.secondary,
                        borderColor: NexusColors.border,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
        console.log('[NexusERP] ✅ 訂單狀態圖已初始化');
    }

    // 3. 庫存分析圖
    const inventoryCtx = document.getElementById('inventoryChart');
    if (inventoryCtx) {
        new Chart(inventoryCtx, {
            type: 'bar',
            data: {
                labels: ['筆記型電腦', '印表機', '螢幕', '鍵盤', '滑鼠', '耳機', 'USB', '記憶卡'],
                datasets: [{
                    label: '庫存量',
                    data: [120, 95, 87, 63, 45, 78, 234, 156],
                    backgroundColor: [
                        NexusColors.accent.purple + 'CC',
                        NexusColors.accent.blue + 'CC',
                        NexusColors.accent.green + 'CC',
                        NexusColors.accent.orange + 'CC',
                        NexusColors.accent.pink + 'CC',
                        NexusColors.accent.cyan + 'CC',
                        NexusColors.accent.red + 'CC',
                        NexusColors.accent.purple + '99'
                    ],
                    borderColor: [
                        NexusColors.accent.purple,
                        NexusColors.accent.blue,
                        NexusColors.accent.green,
                        NexusColors.accent.orange,
                        NexusColors.accent.pink,
                        NexusColors.accent.cyan,
                        NexusColors.accent.red,
                        NexusColors.accent.purple
                    ],
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                ...nexusChartDefaults,
                plugins: {
                    ...nexusChartDefaults.plugins,
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: NexusColors.primary.cardBackground,
                        titleColor: NexusColors.text.primary,
                        bodyColor: NexusColors.text.secondary,
                        borderColor: NexusColors.border,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y + ' 件';
                            }
                        }
                    }
                },
                scales: {
                    ...nexusChartDefaults.scales,
                    x: {
                        ...nexusChartDefaults.scales.x,
                        ticks: {
                            ...nexusChartDefaults.scales.x.ticks,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: {
                        ...nexusChartDefaults.scales.y,
                        ticks: {
                            ...nexusChartDefaults.scales.y.ticks,
                            callback: function(value) {
                                return value + ' 件';
                            }
                        }
                    }
                }
            }
        });
        console.log('[NexusERP] ✅ 庫存分析圖已初始化');
    }

    // 4. 月度業績目標達成圖
    const performanceCtx = document.getElementById('performanceChart');
    if (performanceCtx) {
        new Chart(performanceCtx, {
            type: 'doughnut',
            data: {
                labels: ['已達成', '剩餘目標'],
                datasets: [{
                    label: '業績達成率',
                    data: [67.2, 32.8],
                    backgroundColor: [
                        NexusColors.accent.purple,
                        NexusColors.primary.cardBackground + '60'
                    ],
                    borderColor: [
                        NexusColors.accent.purple,
                        NexusColors.border
                    ],
                    borderWidth: 2,
                    cutout: '70%'
                }]
            },
            options: {
                ...nexusChartDefaults,
                plugins: {
                    ...nexusChartDefaults.plugins,
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: NexusColors.text.secondary,
                            font: {
                                size: 12,
                                family: "'Inter', sans-serif"
                            },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: NexusColors.primary.cardBackground,
                        titleColor: NexusColors.text.primary,
                        bodyColor: NexusColors.text.secondary,
                        borderColor: NexusColors.border,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed.toFixed(1) + '%';
                            }
                        }
                    }
                },
                elements: {
                    arc: {
                        borderWidth: 2,
                        borderRadius: 4
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function(chart) {
                    const ctx = chart.ctx;
                    const data = chart.data.datasets[0].data;
                    const percentage = data[0].toFixed(1);
                    
                    ctx.save();
                    ctx.font = 'bold 24px Inter, sans-serif';
                    ctx.fillStyle = NexusColors.text.primary;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
                    const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
                    
                    ctx.fillText(percentage + '%', centerX, centerY - 5);
                    
                    ctx.font = '12px Inter, sans-serif';
                    ctx.fillStyle = NexusColors.text.secondary;
                    ctx.fillText('達成率', centerX, centerY + 15);
                    
                    ctx.restore();
                }
            }]
        });
        console.log('[NexusERP] ✅ 月度業績目標達成圖已初始化');
    }

    console.log('[NexusERP] 🎉 所有圖表初始化完成');
}

// NexusERP 儀表板初始化 - 使用真實資料庫數據
document.addEventListener('DOMContentLoaded', function() {
    console.log('[NexusERP] DOM 載入完成，準備載入真實數據...');
    
    // 檢查 Chart.js 是否已載入並初始化系統
    function checkAndInitSystem() {
        if (typeof Chart !== 'undefined') {
            console.log('[NexusERP] Chart.js 可用，載入儀表板數據...');
            loadDashboardData();
        } else {
            console.log('[NexusERP] 等待 Chart.js 載入...');
            setTimeout(checkAndInitSystem, 100);
        }
    }
    
    checkAndInitSystem();
});

// 載入儀表板數據主函數
async function loadDashboardData() {
    try {
        console.log('[NexusERP] 開始載入 API 數據...');
        
        // 取得 CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        const response = await fetch('/api/dashboard', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken || ''
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`API 回應錯誤: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[NexusERP] API 數據載入成功:', data);

        if (data.success) {
            // 更新統計卡片
            updateStatCards(data.statistics);
            
            // 初始化圖表（使用真實數據）
            initChartsWithRealData(data.charts);
            
            // 更新最後更新時間
            updateLastRefreshTime();
            
            console.log('[NexusERP] ✅ 儀表板初始化完成');
        } else {
            throw new Error(data.message || '未知錯誤');
        }
        
    } catch (error) {
        console.error('[NexusERP] ❌ 載入數據失敗:', error);
        
        // 顯示錯誤訊息
        showErrorMessage('無法載入儀表板數據: ' + error.message);
        
        // 使用備用的示例數據
        console.log('[NexusERP] 使用備用示例數據...');
        initChartsWithFallbackData();
    }
}

// 更新統計卡片
function updateStatCards(statistics) {
    if (!statistics) return;
    
    console.log('[NexusERP] 更新統計卡片:', statistics);
    
    // 更新各統計卡片的值和變化
    Object.keys(statistics).forEach(key => {
        const stat = statistics[key];
        const cardElement = document.querySelector(`[data-stat="${key}"]`);
        
        if (cardElement && stat) {
            // 更新數值
            const valueElement = cardElement.querySelector('.stat-value');
            if (valueElement) {
                let displayValue = stat.value;
                
                // 根據統計類型格式化數值
                if (key === 'totalRevenue') {
                    displayValue = 'NT$' + Number(stat.value).toLocaleString();
                } else if (key === 'conversionRate') {
                    displayValue = Number(stat.value).toFixed(1) + '%';
                } else {
                    displayValue = Number(stat.value).toLocaleString();
                }
                
                valueElement.textContent = displayValue;
            }
            
            // 更新變化指標
            const changeElement = cardElement.querySelector('.stat-change');
            if (changeElement && stat.change !== undefined) {
                const changeText = (stat.change > 0 ? '+' : '') + stat.change.toFixed(1) + '%';
                changeElement.textContent = changeText;
                
                // 更新變化樣式
                changeElement.className = changeElement.className.replace(/(text-\w+-\d+|bg-\w+-\d+|border-\w+-\d+)/g, '');
                
                if (stat.change > 0) {
                    changeElement.classList.add('text-green-600', 'bg-green-100', 'border-green-200');
                } else if (stat.change < 0) {
                    changeElement.classList.add('text-red-600', 'bg-red-100', 'border-red-200');
                } else {
                    changeElement.classList.add('text-gray-600', 'bg-gray-100', 'border-gray-200');
                }
            }
        }
    });
}

// 使用真實數據初始化圖表
function initChartsWithRealData(chartsData) {
    console.log('[NexusERP] 使用真實數據初始化圖表:', chartsData);
    console.log('[NexusERP] Charts數據包含的鍵值:', Object.keys(chartsData || {}));
    
    if (!chartsData) {
        console.warn('[NexusERP] 無圖表數據，使用備用數據');
        initChartsWithFallbackData();
        return;
    }
    
    // 1. 營收趨勢圖
    if (chartsData.revenue) {
        initRevenueChartWithData(chartsData.revenue);
    }
    
    // 2. 訂單狀態圖
    if (chartsData.orders) {
        initOrdersChartWithData(chartsData.orders);
    }
    
    // 3. 庫存分析圖
    if (chartsData.inventory) {
        initInventoryChartWithData(chartsData.inventory);
    }
    
    // 4. 月度業績目標達成圖
    if (chartsData.performance) {
        initPerformanceChartWithData(chartsData.performance);
    } else {
        console.log('[NexusERP] Performance chart data missing, using fallback');
        initPerformanceChartWithData({
            labels: ['已達成', '剩餘目標'],
            values: [67.2, 32.8],
            target: 1000000,
            achieved: 672000
        });
    }
}

// 營收圖表 - 真實數據
function initRevenueChartWithData(revenueData) {
    const revenueCtx = document.getElementById('revenueChart');
    if (!revenueCtx) return;
    
    new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: revenueData.labels || [],
            datasets: [{
                label: '營收 (NT$)',
                data: revenueData.values || [],
                borderColor: NexusColors.accent.green,
                backgroundColor: NexusColors.accent.green + '20',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: NexusColors.accent.green,
                pointBorderColor: NexusColors.primary.cardBackground,
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            ...nexusChartDefaults,
            plugins: {
                ...nexusChartDefaults.plugins,
                legend: { display: false },
                tooltip: {
                    backgroundColor: NexusColors.primary.cardBackground,
                    titleColor: NexusColors.text.primary,
                    bodyColor: NexusColors.text.secondary,
                    borderColor: NexusColors.border,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return '營收: NT$' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                ...nexusChartDefaults.scales,
                y: {
                    ...nexusChartDefaults.scales.y,
                    ticks: {
                        ...nexusChartDefaults.scales.y.ticks,
                        callback: function(value) {
                            return 'NT$' + (value >= 1000 ? (value/1000).toFixed(0) + 'K' : value);
                        }
                    }
                }
            }
        }
    });
    console.log('[NexusERP] ✅ 營收圖表已初始化（真實數據）');
}

// 訂單狀態圖表 - 真實數據
function initOrdersChartWithData(ordersData) {
    const ordersCtx = document.getElementById('ordersChart');
    if (!ordersCtx) return;
    
    new Chart(ordersCtx, {
        type: 'doughnut',
        data: {
            labels: ordersData.labels || [],
            datasets: [{
                data: ordersData.values || [],
                backgroundColor: [
                    NexusColors.accent.green,
                    NexusColors.accent.blue,
                    NexusColors.accent.orange,
                    NexusColors.accent.red,
                    NexusColors.accent.purple,
                    NexusColors.accent.cyan
                ],
                borderColor: NexusColors.primary.cardBackground,
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: NexusColors.text.primary,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        },
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: NexusColors.primary.cardBackground,
                    titleColor: NexusColors.text.primary,
                    bodyColor: NexusColors.text.secondary,
                    borderColor: NexusColors.border,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
    console.log('[NexusERP] ✅ 訂單狀態圖已初始化（真實數據）');
}

// 庫存分析圖表 - 真實數據
function initInventoryChartWithData(inventoryData) {
    const inventoryCtx = document.getElementById('inventoryChart');
    if (!inventoryCtx) return;
    
    new Chart(inventoryCtx, {
        type: 'bar',
        data: {
            labels: inventoryData.labels || [],
            datasets: [{
                label: '庫存量',
                data: inventoryData.values || [],
                backgroundColor: [
                    NexusColors.accent.purple + 'CC',
                    NexusColors.accent.blue + 'CC',
                    NexusColors.accent.green + 'CC',
                    NexusColors.accent.orange + 'CC',
                    NexusColors.accent.pink + 'CC',
                    NexusColors.accent.cyan + 'CC',
                    NexusColors.accent.red + 'CC',
                    NexusColors.accent.purple + '99'
                ],
                borderColor: [
                    NexusColors.accent.purple,
                    NexusColors.accent.blue,
                    NexusColors.accent.green,
                    NexusColors.accent.orange,
                    NexusColors.accent.pink,
                    NexusColors.accent.cyan,
                    NexusColors.accent.red,
                    NexusColors.accent.purple
                ],
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            ...nexusChartDefaults,
            plugins: {
                ...nexusChartDefaults.plugins,
                legend: { display: false },
                tooltip: {
                    backgroundColor: NexusColors.primary.cardBackground,
                    titleColor: NexusColors.text.primary,
                    bodyColor: NexusColors.text.secondary,
                    borderColor: NexusColors.border,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' 件';
                        }
                    }
                }
            },
            scales: {
                ...nexusChartDefaults.scales,
                x: {
                    ...nexusChartDefaults.scales.x,
                    ticks: {
                        ...nexusChartDefaults.scales.x.ticks,
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    ...nexusChartDefaults.scales.y,
                    ticks: {
                        ...nexusChartDefaults.scales.y.ticks,
                        callback: function(value) {
                            return value + ' 件';
                        }
                    }
                }
            }
        }
    });
    console.log('[NexusERP] ✅ 庫存分析圖已初始化（真實數據）');
}

// 月度業績目標達成圖 - 真實數據
function initPerformanceChartWithData(performanceData) {
    const performanceCtx = document.getElementById('performanceChart');
    if (!performanceCtx) return;
    
    new Chart(performanceCtx, {
        type: 'doughnut',
        data: {
            labels: performanceData.labels || ['已達成', '剩餘目標'],
            datasets: [{
                label: '業績達成率',
                data: performanceData.values || [67, 33],
                backgroundColor: [
                    NexusColors.accent.purple,
                    NexusColors.primary.cardBackground + '60'
                ],
                borderColor: [
                    NexusColors.accent.purple,
                    NexusColors.border
                ],
                borderWidth: 2,
                cutout: '70%'
            }]
        },
        options: {
            ...nexusChartDefaults,
            plugins: {
                ...nexusChartDefaults.plugins,
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: NexusColors.text.secondary,
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: NexusColors.primary.cardBackground,
                    titleColor: NexusColors.text.primary,
                    bodyColor: NexusColors.text.secondary,
                    borderColor: NexusColors.border,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + percentage + '%';
                        }
                    }
                }
            },
            elements: {
                arc: {
                    borderWidth: 2,
                    borderRadius: 4
                }
            }
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function(chart) {
                const ctx = chart.ctx;
                const data = chart.data.datasets[0].data;
                const total = data.reduce((a, b) => a + b, 0);
                const percentage = ((data[0] / total) * 100).toFixed(1);
                
                ctx.save();
                ctx.font = 'bold 24px Inter, sans-serif';
                ctx.fillStyle = NexusColors.text.primary;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
                const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
                
                ctx.fillText(percentage + '%', centerX, centerY - 5);
                
                ctx.font = '12px Inter, sans-serif';
                ctx.fillStyle = NexusColors.text.secondary;
                ctx.fillText('達成率', centerX, centerY + 15);
                
                ctx.restore();
            }
        }]
    });
    console.log('[NexusERP] ✅ 月度業績目標達成圖已初始化（真實數據）');
}

// 備用示例數據初始化
function initChartsWithFallbackData() {
    console.log('[NexusERP] 使用備用示例數據初始化圖表...');
    
    // 使用之前的示例數據邏輯
    initNexusCharts();
}

// 更新最後刷新時間
function updateLastRefreshTime() {
    const timeElement = document.getElementById('lastUpdateTime');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = '最後更新: ' + now.toLocaleTimeString('zh-TW');
    }
}

// 顯示錯誤訊息
function showErrorMessage(message) {
    const errorElement = document.getElementById('dashboardError');
    const errorMessageElement = document.getElementById('dashboardErrorMessage');
    
    if (errorElement && errorMessageElement) {
        errorElement.classList.remove('hidden');
        errorMessageElement.textContent = message;
        
        // 3秒後自動隱藏
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 3000);
    }
}

// 手動刷新功能
document.addEventListener('click', function(e) {
    if (e.target.matches('[data-action="refresh-dashboard"]') || e.target.closest('[data-action="refresh-dashboard"]')) {
        e.preventDefault();
        console.log('[NexusERP] 手動刷新儀表板...');
        loadDashboardData();
    }
});

// NexusERP 深色主題圖表系統完成
</script>
@endpush