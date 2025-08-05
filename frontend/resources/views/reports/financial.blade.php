@extends('layouts.app')

@section('title', '財務報表')

@section('content')
<!-- 讀取風格指南配置 -->
<?php
$style = json_decode(file_get_contents(public_path('style/style.json')), true);
$colors = $style['style_guide']['colors'];
$components = $style['style_guide']['components'];
?>

<style>
/* NexusERP 深色主題樣式 */
:root {
    --nexus-primary-bg: <?php echo $colors['primary']['background']; ?>;
    --nexus-card-bg: <?php echo $colors['primary']['card_background']; ?>;
    --nexus-text-primary: <?php echo $colors['text']['primary']; ?>;
    --nexus-text-secondary: <?php echo $colors['text']['secondary']; ?>;
    --nexus-text-muted: <?php echo $colors['text']['muted']; ?>;
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
    font-family: <?php echo $style['style_guide']['typography']['font_family']['primary']; ?>;
}

.nx-card {
    background: var(--nexus-card-bg);
    border: 1px solid var(--nexus-border-primary);
    border-radius: <?php echo $components['card']['default']['border_radius']; ?>;
    padding: <?php echo $components['card']['default']['padding']; ?>;
    box-shadow: <?php echo $components['card']['default']['box_shadow']; ?>;
}

.nx-btn {
    border-radius: <?php echo $components['button']['primary']['border_radius']; ?>;
    padding: <?php echo $components['button']['primary']['padding']; ?>;
    font-weight: <?php echo $components['button']['primary']['font_weight']; ?>;
    transition: <?php echo $components['button']['primary']['transition']; ?>;
}

.nx-btn-primary {
    background: <?php echo $components['button']['primary']['background']; ?>;
    color: <?php echo $components['button']['primary']['color']; ?>;
    border: none;
    box-shadow: <?php echo $components['button']['primary']['box_shadow']; ?>;
}

.nx-btn-success {
    background: <?php echo $components['button']['success']['background']; ?>;
    color: <?php echo $components['button']['success']['color']; ?>;
    border: none;
}

.nx-input {
    background: <?php echo $components['input']['default']['background']; ?>;
    border: <?php echo $components['input']['default']['border']; ?>;
    border-radius: <?php echo $components['input']['default']['border_radius']; ?>;
    padding: <?php echo $components['input']['default']['padding']; ?>;
    color: <?php echo $components['input']['default']['color']; ?>;
    font-size: <?php echo $components['input']['default']['font_size']; ?>;
}

.nx-input:focus {
    border-color: <?php echo $components['input']['focus']['border_color']; ?>;
    box-shadow: <?php echo $components['input']['focus']['box_shadow']; ?>;
    outline: none;
}

.nx-text-accent { color: var(--nexus-text-secondary); }
.nx-text-muted { color: var(--nexus-text-muted); }

.nx-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: var(--nexus-accent-red);
    border-radius: <?php echo $style['style_guide']['border_radius']['md']; ?>;
}

.nx-loading {
    color: var(--nexus-text-secondary);
}

.hover\:nx-bg-hover:hover {
    background: rgba(55, 65, 81, 0.5);
}

.tab-button {
    color: var(--nexus-text-secondary);
    border-color: transparent;
}

.tab-button.active {
    border-bottom-color: var(--nexus-accent-blue);
    color: var(--nexus-accent-blue);
}

.tab-button:hover {
    color: var(--nexus-text-primary);
    border-color: var(--nexus-border-primary);
}
</style>

<div class="container-fluid mx-auto p-6">
    <!-- 頁面標題 -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2" style="color: var(--nexus-text-primary);">財務報表</h1>
        <p class="nx-text-accent">應收應付帳款及現金流分析</p>
    </div>

    <!-- 過濾器 -->
    <div class="nx-card mb-8">
        <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">篩選條件</h3>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">開始日期</label>
                <input type="date" id="date-from" class="w-full nx-input">
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">結束日期</label>
                <input type="date" id="date-to" class="w-full nx-input">
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">應收帳款狀態</label>
                <select id="ar-status-filter" class="w-full nx-input">
                    <option value="">全部狀態</option>
                    <option value="current">正常</option>
                    <option value="due_soon">即將到期</option>
                    <option value="overdue">逾期</option>
                    <option value="paid">已付款</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">應付帳款狀態</label>
                <select id="ap-status-filter" class="w-full nx-input">
                    <option value="">全部狀態</option>
                    <option value="current">正常</option>
                    <option value="due_soon">即將到期</option>
                    <option value="overdue">逾期</option>
                    <option value="paid">已付款</option>
                </select>
            </div>
            <div class="flex items-end">
                <button id="apply-filters" class="w-full nx-btn nx-btn-primary">
                    套用篩選
                </button>
            </div>
        </div>
    </div>

    <!-- 載入狀態 -->
    <div id="loading" class="text-center py-8 nx-loading">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style="border-color: var(--nexus-accent-purple);"></div>
        <p class="mt-2">載入中...</p>
    </div>

    <!-- 錯誤訊息 -->
    <div id="error" class="hidden nx-error px-4 py-3 rounded mb-4">
        <p id="error-message"></p>
    </div>

    <!-- 報表內容 -->
    <div id="report-content" class="hidden">
        <!-- 財務摘要卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="nx-card">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold nx-text-accent mb-2">應收帳款總額</h4>
                        <p id="total-ar" class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">$0</p>
                    </div>
                    <div class="p-3 rounded-full" style="background: rgba(139, 92, 246, 0.1);">
                        <svg class="w-6 h-6" fill="none" stroke="var(--nexus-accent-purple)" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                </div>
                <p id="ar-trend" class="text-sm nx-text-muted mt-1">較上期</p>
            </div>
            <div class="nx-card">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold nx-text-accent mb-2">應付帳款總額</h4>
                        <p id="total-ap" class="text-3xl font-bold" style="color: var(--nexus-accent-orange);">$0</p>
                    </div>
                    <div class="p-3 rounded-full" style="background: rgba(245, 158, 11, 0.1);">
                        <svg class="w-6 h-6" fill="none" stroke="var(--nexus-accent-orange)" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                </div>
                <p id="ap-trend" class="text-sm nx-text-muted mt-1">較上期</p>
            </div>
            <div class="nx-card">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold nx-text-accent mb-2">逾期應收帳款</h4>
                        <p id="overdue-ar" class="text-3xl font-bold" style="color: var(--nexus-accent-red);">$0</p>
                    </div>
                    <div class="p-3 rounded-full" style="background: rgba(239, 68, 68, 0.1);">
                        <svg class="w-6 h-6" fill="none" stroke="var(--nexus-accent-red)" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
                <p id="overdue-ar-percent" class="text-sm nx-text-muted mt-1">占總AR比例</p>
            </div>
            <div class="nx-card">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold nx-text-accent mb-2">淨現金流</h4>
                        <p id="cash-flow" class="text-3xl font-bold" style="color: var(--nexus-accent-green);">$0</p>
                    </div>
                    <div class="p-3 rounded-full" style="background: rgba(16, 185, 129, 0.1);">
                        <svg class="w-6 h-6" fill="none" stroke="var(--nexus-accent-green)" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                    </div>
                </div>
                <p id="cash-flow-trend" class="text-sm nx-text-muted mt-1">AR - AP</p>
            </div>
        </div>

        <!-- 圖表區域 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- 應收帳款帳齡分析 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">應收帳款帳齡分析</h3>
                    <p class="text-sm nx-text-accent">按帳齡區間分析應收帳款</p>
                </div>
                <div class="h-80">
                    <canvas id="ar-aging-chart"></canvas>
                </div>
            </div>

            <!-- 現金流趨勢 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">現金流趨勢</h3>
                    <p class="text-sm nx-text-accent">每月現金流入流出變化</p>
                </div>
                <div class="h-80">
                    <canvas id="cash-flow-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- 應收應付帳款比較 -->
        <div class="nx-card mb-8">
            <div class="mb-4">
                <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">應收應付帳款比較</h3>
                <p class="text-sm nx-text-accent">總額與逾期金額對比</p>
            </div>
            <div class="h-80">
                <canvas id="ar-ap-comparison-chart"></canvas>
            </div>
        </div>

        <!-- 標籤式內容區域 -->
        <div class="nx-card overflow-hidden">
            <!-- 標籤導航 -->
            <div class="border-b" style="border-color: var(--nexus-border-primary);">
                <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                    <button id="tab-ar" class="tab-button whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none active">
                        應收帳款明細
                    </button>
                    <button id="tab-ap" class="tab-button whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none">
                        應付帳款明細
                    </button>
                </nav>
            </div>

            <!-- 標籤內容 -->
            <div class="p-6">
                <!-- 應收帳款表格 -->
                <div id="ar-content" class="tab-content">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-lg font-medium" style="color: var(--nexus-text-primary);">應收帳款明細</h4>
                        <div class="flex space-x-2">
                            <button id="export-ar-excel" class="nx-btn nx-btn-success">
                                匯出 Excel
                            </button>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y" style="border-color: var(--nexus-border-primary);">
                            <thead style="background: var(--nexus-border-primary);">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">發票編號</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">客戶</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">應收金額</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">未收金額</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">到期日</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium nx-text-accent uppercase tracking-wider">狀態</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">逾期天數</th>
                                </tr>
                            </thead>
                            <tbody id="ar-table-body" class="divide-y" style="border-color: var(--nexus-border-primary);">
                                <!-- 表格內容將由 JavaScript 動態填充 -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 應付帳款表格 -->
                <div id="ap-content" class="tab-content hidden">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-lg font-medium" style="color: var(--nexus-text-primary);">應付帳款明細</h4>
                        <div class="flex space-x-2">
                            <button id="export-ap-excel" class="nx-btn nx-btn-success">
                                匯出 Excel
                            </button>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y" style="border-color: var(--nexus-border-primary);">
                            <thead style="background: var(--nexus-border-primary);">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">發票編號</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">供應商</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">應付金額</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">未付金額</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">到期日</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium nx-text-accent uppercase tracking-wider">狀態</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">逾期天數</th>
                                </tr>
                            </thead>
                            <tbody id="ap-table-body" class="divide-y" style="border-color: var(--nexus-border-primary);">
                                <!-- 表格內容將由 JavaScript 動態填充 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 資料更新時間 -->
    <div id="last-updated" class="text-center text-sm nx-text-muted mt-8 hidden">
        最後更新：<span id="update-timestamp"></span>
    </div>
</div>

<!-- Chart.js CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
// 財務報表控制器
class FinancialReportController {
    constructor() {
        this.charts = {};
        this.data = null;
        this.currentTab = 'ar';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.loadReport();
    }

    setupEventListeners() {
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.loadReport();
        });

        // 標籤切換
        document.getElementById('tab-ar').addEventListener('click', () => {
            this.switchTab('ar');
        });

        document.getElementById('tab-ap').addEventListener('click', () => {
            this.switchTab('ap');
        });

        // 匯出功能
        document.getElementById('export-ar-excel').addEventListener('click', () => {
            this.exportReport('ar', 'excel');
        });

        document.getElementById('export-ap-excel').addEventListener('click', () => {
            this.exportReport('ap', 'excel');
        });
    }

    setDefaultDates() {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        document.getElementById('date-from').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('date-to').value = today.toISOString().split('T')[0];
    }

    switchTab(tab) {
        // 更新標籤樣式
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        document.getElementById(`tab-${tab}`).classList.add('active', 'border-blue-500', 'text-blue-600');
        document.getElementById(`tab-${tab}`).classList.remove('border-transparent', 'text-gray-500');

        // 切換內容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        document.getElementById(`${tab}-content`).classList.remove('hidden');
        
        this.currentTab = tab;
    }

    async loadReport() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                date_from: document.getElementById('date-from').value,
                date_to: document.getElementById('date-to').value,
                use_cache: 'true'
            });

            const arStatus = document.getElementById('ar-status-filter').value;
            if (arStatus) params.append('ar_status', arStatus);

            const apStatus = document.getElementById('ap-status-filter').value;
            if (apStatus) params.append('ap_status', apStatus);

            const response = await fetch(`/api/reports/financial?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('載入財務報表失敗');
            }

            this.data = await response.json();
            this.hideLoading();
            this.renderReport();
        } catch (error) {
            this.showError(error.message);
        }
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('report-content').classList.add('hidden');
        document.getElementById('error').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('report-content').classList.remove('hidden');
        document.getElementById('last-updated').classList.remove('hidden');
    }

    showError(message) {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
    }

    renderReport() {
        const summary = JSON.parse(this.data.summary);
        const details = JSON.parse(this.data.data);
        
        this.renderSummary(summary);
        this.renderCharts(summary);
        this.renderTables(details);
        this.updateTimestamp();
    }

    renderSummary(summary) {
        document.getElementById('total-ar').textContent = this.formatCurrency(summary.total_ar || 0);
        document.getElementById('total-ap').textContent = this.formatCurrency(summary.total_ap || 0);
        document.getElementById('overdue-ar').textContent = this.formatCurrency(summary.overdue_ar || 0);
        
        // 計算逾期比例
        const overduePercent = summary.total_ar > 0 ? ((summary.overdue_ar || 0) / summary.total_ar * 100).toFixed(1) : 0;
        document.getElementById('overdue-ar-percent').textContent = `${overduePercent}% 逾期`;

        // 現金流
        const cashFlow = summary.cash_flow || 0;
        const cashFlowElement = document.getElementById('cash-flow');
        cashFlowElement.textContent = this.formatCurrency(cashFlow);
        
        if (cashFlow > 0) {
            cashFlowElement.classList.remove('text-red-600');
            cashFlowElement.classList.add('text-green-600');
        } else if (cashFlow < 0) {
            cashFlowElement.classList.remove('text-green-600');
            cashFlowElement.classList.add('text-red-600');
        }
    }

    renderCharts(summary) {
        this.renderAgingChart(summary.aging_buckets || {});
        this.renderCashFlowChart();
        this.renderARAPComparisonChart(summary);
    }

    renderAgingChart(agingBuckets) {
        const ctx = document.getElementById('ar-aging-chart').getContext('2d');

        if (this.charts.aging) {
            this.charts.aging.destroy();
        }

        const labels = ['0-30天', '31-60天', '61-90天', '90天+'];
        const data = [
            agingBuckets['0-30'] || 0,
            agingBuckets['31-60'] || 0,
            agingBuckets['61-90'] || 0,
            agingBuckets['90+'] || 0
        ];

        const colors = ['#10B981', '#F59E0B', '#EF4444', '#7C2D12'];

        this.charts.aging = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '應收帳款',
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
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
    }

    renderCashFlowChart() {
        const ctx = document.getElementById('cash-flow-chart').getContext('2d');

        if (this.charts.cashFlow) {
            this.charts.cashFlow.destroy();
        }

        // 模擬現金流趨勢數據（實際應該從後端獲取）
        const labels = ['1月', '2月', '3月', '4月', '5月', '6月'];
        const cashFlowData = [50000, 75000, -20000, 30000, 60000, 45000];

        this.charts.cashFlow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '現金流',
                    data: cashFlowData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    renderARAPComparisonChart(summary) {
        const ctx = document.getElementById('ar-ap-comparison-chart').getContext('2d');

        if (this.charts.comparison) {
            this.charts.comparison.destroy();
        }

        this.charts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['應收帳款', '應付帳款'],
                datasets: [{
                    label: '總額',
                    data: [summary.total_ar || 0, summary.total_ap || 0],
                    backgroundColor: ['#8B5CF6', '#F59E0B'],
                    borderWidth: 1
                }, {
                    label: '逾期',
                    data: [summary.overdue_ar || 0, summary.overdue_ap || 0],
                    backgroundColor: ['#EF4444', '#DC2626'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
    }

    renderTables(details) {
        this.renderARTable(details.accounts_receivable || []);
        this.renderAPTable(details.accounts_payable || []);
    }

    renderARTable(arData) {
        const tbody = document.getElementById('ar-table-body');
        
        if (!arData || arData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center nx-text-muted">暫無資料</td></tr>';
            return;
        }

        tbody.innerHTML = arData.map(ar => `
            <tr class="hover:nx-bg-hover">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">
                    ${ar.invoice_number}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-accent">
                    ${ar.customer_name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right" style="color: var(--nexus-text-primary);">
                    ${this.formatCurrency(ar.original_amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" style="color: var(--nexus-text-primary);">
                    ${this.formatCurrency(ar.outstanding_amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-accent">
                    ${new Date(ar.due_date).toLocaleDateString('zh-TW')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusBadgeClass(ar.status)}">
                        ${this.getStatusText(ar.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right" style="color: var(--nexus-text-primary);">
                    ${ar.days_overdue > 0 ? Math.floor(ar.days_overdue) : 0}
                </td>
            </tr>
        `).join('');
    }

    renderAPTable(apData) {
        const tbody = document.getElementById('ap-table-body');
        
        if (!apData || apData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center nx-text-muted">暫無資料</td></tr>';
            return;
        }

        tbody.innerHTML = apData.map(ap => `
            <tr class="hover:nx-bg-hover">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">
                    ${ap.invoice_number}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-accent">
                    ${ap.supplier_name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right" style="color: var(--nexus-text-primary);">
                    ${this.formatCurrency(ap.original_amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" style="color: var(--nexus-text-primary);">
                    ${this.formatCurrency(ap.outstanding_amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-accent">
                    ${new Date(ap.due_date).toLocaleDateString('zh-TW')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusBadgeClass(ap.status)}">
                        ${this.getStatusText(ap.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right" style="color: var(--nexus-text-primary);">
                    ${ap.days_overdue > 0 ? Math.floor(ap.days_overdue) : 0}
                </td>
            </tr>
        `).join('');
    }

    getStatusBadgeClass(status) {
        const statusClasses = {
            'current': 'text-white',
            'due_soon': 'text-white',
            'overdue': 'text-white',
            'paid': 'text-white'
        };
        
        const statusColors = {
            'current': 'background: #10b981;',
            'due_soon': 'background: #f59e0b;',
            'overdue': 'background: #ef4444;',
            'paid': 'background: #3b82f6;'
        };
        
        const baseClass = statusClasses[status] || 'nx-text-muted';
        const colorStyle = statusColors[status] || 'background: #6b7280;';
        
        return baseClass + '" style="' + colorStyle;
    }

    getStatusText(status) {
        const statusTexts = {
            'current': '正常',
            'due_soon': '即將到期',
            'overdue': '逾期',
            'paid': '已付款'
        };
        return statusTexts[status] || status;
    }

    updateTimestamp() {
        const timestamp = new Date(this.data.generated_at).toLocaleString('zh-TW');
        document.getElementById('update-timestamp').textContent = timestamp;
    }

    async exportReport(type, format) {
        try {
            const params = new URLSearchParams({
                date_from: document.getElementById('date-from').value,
                date_to: document.getElementById('date-to').value,
                format: format,
                type: type
            });

            const statusFilter = type === 'ar' ? 
                document.getElementById('ar-status-filter').value : 
                document.getElementById('ap-status-filter').value;
                
            if (statusFilter) params.append(`${type}_status`, statusFilter);

            const response = await fetch(`/api/reports/financial/export?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('匯出報表失敗');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('匯出失敗：' + error.message);
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// 頁面載入完成後初始化報表
document.addEventListener('DOMContentLoaded', function() {
    new FinancialReportController();
});
</script>

@endsection