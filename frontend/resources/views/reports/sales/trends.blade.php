@extends('layouts.app')

@section('title', '銷售趨勢分析')

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
    --nexus-secondary-bg: <?php echo $colors['primary']['secondary_background']; ?>;
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

.nx-btn-secondary {
    background: var(--nexus-secondary-bg);
    color: var(--nexus-text-primary);
    border: 1px solid var(--nexus-border-primary);
}

.nx-btn-secondary.active {
    background: var(--nexus-accent-purple);
    color: white;
    border-color: var(--nexus-accent-purple);
}

.nx-input {
    background: <?php echo $components['input']['default']['background']; ?>;
    border: <?php echo $components['input']['default']['border']; ?>;
    border-radius: <?php echo $components['input']['default']['border_radius']; ?>;
    padding: <?php echo $components['input']['default']['padding']; ?>;
    color: <?php echo $components['input']['default']['color']; ?>;
}

.nx-text-accent { color: var(--nexus-text-secondary); }
.nx-text-muted { color: var(--nexus-text-muted); }

.nx-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: var(--nexus-accent-red);
    border-radius: <?php echo $style['style_guide']['border_radius']['md']; ?>;
}

.nx-loading { color: var(--nexus-text-secondary); }

.trend-indicator {
    display: inline-flex;
    align-items: center;
    font-size: 0.875rem;
    font-weight: 600;
}

.trend-up {
    color: var(--nexus-accent-green);
}

.trend-down {
    color: var(--nexus-accent-red);
}

.trend-neutral {
    color: var(--nexus-text-muted);
}
</style>

<div class="container-fluid mx-auto p-6">
    <!-- 頁面標題 -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2" style="color: var(--nexus-text-primary);">銷售趨勢分析</h1>
        <p class="nx-text-accent">時間軸銷售趨勢和預測分析</p>
        
        <!-- 返回按鈕 -->
        <div class="mt-4">
            <a href="{{ route('reports.sales.index') }}" class="nx-btn nx-btn-primary">
                ← 返回報表選擇
            </a>
        </div>
    </div>

    <!-- 時間範圍選擇器 -->
    <div class="nx-card mb-8">
        <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">時間範圍與週期</h3>
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
                <label class="block text-sm font-medium nx-text-accent mb-2">分析週期</label>
                <select id="period-select" class="w-full nx-input">
                    <option value="daily">每日</option>
                    <option value="weekly">每週</option>
                    <option value="monthly" selected>每月</option>
                    <option value="quarterly">每季</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">快速選擇</label>
                <div class="flex space-x-2">
                    <button id="quick-7days" class="nx-btn nx-btn-secondary text-xs">7天</button>
                    <button id="quick-30days" class="nx-btn nx-btn-secondary text-xs active">30天</button>
                    <button id="quick-90days" class="nx-btn nx-btn-secondary text-xs">90天</button>
                </div>
            </div>
            <div class="flex items-end">
                <button id="apply-filters" class="w-full nx-btn nx-btn-primary">
                    更新分析
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
        <!-- 趨勢摘要 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="nx-card">
                <h4 class="text-lg font-semibold nx-text-accent mb-2">總成長率</h4>
                <p id="total-growth" class="text-3xl font-bold mb-1" style="color: var(--nexus-accent-green);">0%</p>
                <div id="growth-indicator" class="trend-indicator">
                    <span class="text-sm">相較前期</span>
                </div>
            </div>
            <div class="nx-card">
                <h4 class="text-lg font-semibold nx-text-accent mb-2">平均增長</h4>
                <p id="avg-growth" class="text-3xl font-bold mb-1" style="color: var(--nexus-accent-blue);">0%</p>
                <div class="text-sm nx-text-muted">每期平均增長</div>
            </div>
            <div class="nx-card">
                <h4 class="text-lg font-semibold nx-text-accent mb-2">最佳表現期</h4>
                <p id="best-period" class="text-2xl font-bold mb-1" style="color: var(--nexus-accent-purple);">-</p>
                <div id="best-period-value" class="text-sm nx-text-muted">NT$ 0</div>
            </div>
            <div class="nx-card">
                <h4 class="text-lg font-semibold nx-text-accent mb-2">預測下期</h4>
                <p id="forecast-next" class="text-3xl font-bold mb-1" style="color: var(--nexus-accent-orange);">NT$ 0</p>
                <div class="text-sm nx-text-muted">基於趨勢預測</div>
            </div>
        </div>

        <!-- 主要趨勢圖表 -->
        <div class="nx-card mb-8">
            <div class="mb-6">
                <h3 class="text-xl font-semibold mb-2" style="color: var(--nexus-text-primary);">銷售趨勢圖表</h3>
                <p class="text-sm nx-text-accent">銷售額隨時間變化趨勢及預測</p>
            </div>
            <div class="h-96">
                <canvas id="trends-chart"></canvas>
            </div>
        </div>

        <!-- 詳細分析圖表 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- 增長率分析 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">增長率分析</h3>
                    <p class="text-sm nx-text-accent">各期間增長率變化</p>
                </div>
                <div class="h-80">
                    <canvas id="growth-rate-chart"></canvas>
                </div>
            </div>

            <!-- 週期性分析 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">週期性分析</h3>
                    <p class="text-sm nx-text-accent">各週期平均表現</p>
                </div>
                <div class="h-80">
                    <canvas id="seasonality-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- 趨勢分析表格 -->
        <div class="nx-card">
            <div class="mb-4 border-b pb-4" style="border-color: var(--nexus-border-primary);">
                <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">趨勢分析明細</h3>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y" style="border-color: var(--nexus-border-primary);">
                    <thead style="background: var(--nexus-border-primary);">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">期間</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">銷售額</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">訂單數</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">環比增長</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">同比增長</th>
                            <th class="px-6 py-3 text-center text-xs font-medium nx-text-accent uppercase tracking-wider">趨勢</th>
                        </tr>
                    </thead>
                    <tbody id="trends-table-body" class="divide-y" style="border-color: var(--nexus-border-primary);">
                        <!-- 表格內容將由 JavaScript 動態填充 -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Chart.js CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
// 銷售趨勢分析控制器
class SalesTrendsReportController {
    constructor() {
        this.charts = {};
        this.data = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDateRange();
        this.loadReport();
    }

    setupEventListeners() {
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.loadReport();
        });

        // 快速日期選擇
        document.getElementById('quick-7days').addEventListener('click', () => {
            this.setQuickDateRange(7);
            this.updateActiveQuickButton('quick-7days');
        });

        document.getElementById('quick-30days').addEventListener('click', () => {
            this.setQuickDateRange(30);
            this.updateActiveQuickButton('quick-30days');
        });

        document.getElementById('quick-90days').addEventListener('click', () => {
            this.setQuickDateRange(90);
            this.updateActiveQuickButton('quick-90days');
        });
    }

    setDefaultDateRange() {
        this.setQuickDateRange(30);
    }

    setQuickDateRange(days) {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days);

        document.getElementById('date-from').value = startDate.toISOString().split('T')[0];
        document.getElementById('date-to').value = today.toISOString().split('T')[0];
    }

    updateActiveQuickButton(activeId) {
        ['quick-7days', 'quick-30days', 'quick-90days'].forEach(id => {
            const btn = document.getElementById(id);
            if (id === activeId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    async loadReport() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                date_from: document.getElementById('date-from').value,
                date_to: document.getElementById('date-to').value,
                period: document.getElementById('period-select').value,
                report_type: 'trends'
            });

            const response = await fetch(`/api/reports/sales/trends?${params}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('載入銷售趨勢報表失敗');
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
    }

    showError(message) {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
    }

    renderReport() {
        if (!this.data) {
            this.showError('報表資料格式錯誤');
            return;
        }

        this.renderSummary();
        this.renderCharts();
        this.renderTable();
    }

    renderSummary() {
        const summary = this.data.summary || {};
        const trends = this.data.trends || [];
        
        document.getElementById('total-growth').textContent = `${summary.total_growth || 0}%`;
        document.getElementById('avg-growth').textContent = `${summary.average_growth || 0}%`;
        
        const bestPeriod = trends.length > 0 ? trends[0] : null;
        document.getElementById('best-period').textContent = bestPeriod ? bestPeriod.period : '-';
        document.getElementById('best-period-value').textContent = bestPeriod 
            ? this.formatCurrency(bestPeriod.sales_amount) 
            : 'NT$ 0';
            
        document.getElementById('forecast-next').textContent = this.formatCurrency(summary.forecast_next || 0);

        // 更新增長指示器
        this.updateGrowthIndicator(summary.total_growth || 0);
    }

    updateGrowthIndicator(growth) {
        const indicator = document.getElementById('growth-indicator');
        const arrow = growth > 0 ? '↗' : growth < 0 ? '↘' : '→';
        const className = growth > 0 ? 'trend-up' : growth < 0 ? 'trend-down' : 'trend-neutral';
        
        indicator.innerHTML = `<span class="${className}">${arrow} ${Math.abs(growth)}%</span>`;
    }

    renderCharts() {
        const trends = this.data.trends || [];
        
        this.renderTrendsChart(trends);
        this.renderGrowthRateChart(trends);
        this.renderSeasonalityChart();
    }

    renderTrendsChart(trends) {
        const ctx = document.getElementById('trends-chart').getContext('2d');

        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trends.map(t => t.period),
                datasets: [
                    {
                        label: '實際銷售額',
                        data: trends.map(t => t.sales_amount),
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: '趨勢線',
                        data: trends.map(t => t.trend_value),
                        borderColor: '#3B82F6',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
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

    renderGrowthRateChart(trends) {
        const ctx = document.getElementById('growth-rate-chart').getContext('2d');

        if (this.charts.growth) {
            this.charts.growth.destroy();
        }

        this.charts.growth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: trends.map(t => t.period),
                datasets: [{
                    label: '增長率 (%)',
                    data: trends.map(t => t.growth_rate || 0),
                    backgroundColor: trends.map(t => 
                        (t.growth_rate || 0) > 0 ? '#10B981' : '#EF4444'
                    ),
                    borderColor: trends.map(t => 
                        (t.growth_rate || 0) > 0 ? '#059669' : '#DC2626'
                    ),
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
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    }
                }
            }
        });
    }

    renderSeasonalityChart() {
        const seasonality = this.data.seasonality || [];
        const ctx = document.getElementById('seasonality-chart').getContext('2d');

        if (this.charts.seasonality) {
            this.charts.seasonality.destroy();
        }

        this.charts.seasonality = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: seasonality.map(s => s.cycle_name),
                datasets: [{
                    label: '平均銷售表現',
                    data: seasonality.map(s => s.average_performance),
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    borderWidth: 2
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
                    r: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderTable() {
        const trends = this.data.trends || [];
        const tbody = document.getElementById('trends-table-body');
        
        if (trends.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center nx-text-muted">暫無資料</td></tr>';
            return;
        }

        tbody.innerHTML = trends.map(trend => `
            <tr class="hover:nx-bg-hover">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">
                    ${trend.period}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" style="color: var(--nexus-text-primary);">
                    ${this.formatCurrency(trend.sales_amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right nx-text-accent">
                    ${trend.order_count || 0}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span class="${this.getGrowthClass(trend.mom_growth)}">
                        ${this.formatPercentage(trend.mom_growth)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span class="${this.getGrowthClass(trend.yoy_growth)}">
                        ${this.formatPercentage(trend.yoy_growth)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    ${this.getTrendIcon(trend.trend_direction)}
                </td>
            </tr>
        `).join('');
    }

    getGrowthClass(growth) {
        if (!growth) return 'nx-text-muted';
        return growth > 0 ? 'trend-up' : growth < 0 ? 'trend-down' : 'trend-neutral';
    }

    formatPercentage(value) {
        if (!value) return '0%';
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    }

    getTrendIcon(direction) {
        const icons = {
            'up': '<span class="trend-up">📈</span>',
            'down': '<span class="trend-down">📉</span>',
            'stable': '<span class="trend-neutral">➡️</span>'
        };
        return icons[direction] || icons['stable'];
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    }
}

// 頁面載入完成後初始化報表
document.addEventListener('DOMContentLoaded', function() {
    new SalesTrendsReportController();
});
</script>
@endsection