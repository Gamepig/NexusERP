@extends('layouts.app')

@section('title', '庫存報表總覽')

@section('content')
@include('components.reports-style')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">📦 庫存報表總覽</h1>
        <p class="nx-text-secondary">庫存水平與管理分析</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">總庫存價值</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">$2,450,000</p>
            <p class="text-sm nx-text-muted mt-2">較上月增長 5.2%</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">庫存商品數量</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-green);">1,245</p>
            <p class="text-sm nx-text-muted mt-2">活躍商品項目</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">週轉天數</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">45</p>
            <p class="text-sm nx-text-muted mt-2">平均庫存週轉</p>
        </div>
    </div>

    <!-- 庫存圖表區域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <!-- 庫存分類分布圖 -->
        <div class="nx-card">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold nx-text-primary">庫存分類分布</h3>
                <div class="text-sm nx-text-muted">按商品類別統計</div>
            </div>
            <div class="h-80 flex items-center justify-center">
                <canvas id="inventory-category-chart"></canvas>
            </div>
        </div>

        <!-- 庫存水平趨勢圖 -->
        <div class="nx-card">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold nx-text-primary">庫存水平趨勢</h3>
                <div class="text-sm nx-text-muted">最近6個月變化</div>
            </div>
            <div class="h-80 flex items-center justify-center">
                <canvas id="inventory-trend-chart"></canvas>
            </div>
        </div>
    </div>

    <!-- 載入狀態和錯誤處理 -->
    <div id="loading" class="text-center py-8" style="display: none;">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-2"></div>
        <p class="nx-text-muted">載入庫存數據中...</p>
    </div>

    <div id="error" class="text-center py-8" style="display: none;">
        <div class="text-red-500 text-4xl mb-2">⚠️</div>
        <p class="nx-text-muted">載入失敗，請重新整理頁面</p>
        <button onclick="location.reload()" class="mt-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
            重新載入
        </button>
    </div>

    <div class="mt-8 nx-card">
        <h3 class="text-lg font-semibold mb-4 nx-text-primary">快速導航</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="{{ route('reports.inventory.valuation') }}" class="nx-bg-blue-50 hover:opacity-80 p-4 rounded-lg text-center transition-colors">
                <div class="font-semibold" style="color: var(--nexus-accent-blue);">庫存估價</div>
            </a>
            <a href="{{ route('reports.inventory.turnover') }}" class="nx-bg-green-50 hover:opacity-80 p-4 rounded-lg text-center transition-colors">
                <div class="font-semibold" style="color: var(--nexus-accent-green);">週轉率分析</div>
            </a>
            <a href="{{ route('reports.inventory.aging') }}" class="nx-bg-orange-50 hover:opacity-80 p-4 rounded-lg text-center transition-colors">
                <div class="font-semibold" style="color: var(--nexus-accent-orange);">庫存老化</div>
            </a>
            <a href="{{ route('reports.inventory.movements') }}" class="nx-bg-purple-50 hover:opacity-80 p-4 rounded-lg text-center transition-colors">
                <div class="font-semibold" style="color: var(--nexus-accent-purple);">異動記錄</div>
            </a>
        </div>
    </div>
</div>

<!-- Chart.js 和相依腳本 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="{{ asset('js/chart-themes.js') }}"></script>

<script>
class InventoryReportController {
    constructor() {
        this.charts = {};
        this.data = null;
        this.init();
    }

    async init() {
        this.showLoading();
        try {
            await this.loadData();
            this.hideLoading();
            this.renderCharts();
        } catch (error) {
            console.error('載入庫存數據失敗:', error);
            this.showError();
        }
    }

    async loadData() {
        // 暫時使用模擬數據，後續需要實現真實的 API
        await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬網路延遲
        
        this.data = {
            categories: {
                '電子產品': 350,
                '服飾配件': 280,
                '家居用品': 220,
                '食品飲料': 195,
                '運動用品': 150,
                '其他': 50
            },
            trends: [
                { month: '2024-02', value: 1180 },
                { month: '2024-03', value: 1220 },
                { month: '2024-04', value: 1195 },
                { month: '2024-05', value: 1240 },
                { month: '2024-06', value: 1280 },
                { month: '2024-07', value: 1245 }
            ]
        };
    }

    renderCharts() {
        this.renderCategoryChart();
        this.renderTrendChart();
    }

    renderCategoryChart() {
        const ctx = document.getElementById('inventory-category-chart');
        if (!ctx || !this.data) return;

        const labels = Object.keys(this.data.categories);
        const data = Object.values(this.data.categories);

        const chartConfig = NexusChartTheme.createDoughnutChart({
            labels: labels,
            datasets: [{
                label: '庫存數量',
                data: data,
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',   // 藍色 - 電子產品
                    'rgba(34, 197, 94, 0.8)',    // 綠色 - 服飾配件
                    'rgba(251, 191, 36, 0.8)',   // 黃色 - 家居用品
                    'rgba(239, 68, 68, 0.8)',    // 紅色 - 食品飲料
                    'rgba(168, 85, 247, 0.8)',   // 紫色 - 運動用品
                    'rgba(107, 114, 128, 0.8)'   // 灰色 - 其他
                ],
                borderColor: [
                    'rgb(99, 102, 241)', 'rgb(34, 197, 94)', 'rgb(251, 191, 36)',
                    'rgb(239, 68, 68)', 'rgb(168, 85, 247)', 'rgb(107, 114, 128)'
                ],
                borderWidth: 2
            }]
        });

        // 自定義選項
        chartConfig.options.plugins.legend.position = 'bottom';
        chartConfig.options.plugins.tooltip = {
            callbacks: {
                label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ${value} 件 (${percentage}%)`;
                }
            }
        };

        this.charts.category = new Chart(ctx, chartConfig);
    }

    renderTrendChart() {
        const ctx = document.getElementById('inventory-trend-chart');
        if (!ctx || !this.data) return;

        const labels = this.data.trends.map(item => {
            const date = new Date(item.month + '-01');
            return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short' });
        });
        const data = this.data.trends.map(item => item.value);

        const chartConfig = NexusChartTheme.createLineChart({
            labels: labels,
            datasets: [{
                label: '庫存總量',
                data: data,
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: 'rgb(99, 102, 241)',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }]
        });

        // 自定義選項
        chartConfig.options.scales.y.beginAtZero = false;
        chartConfig.options.plugins.tooltip = {
            callbacks: {
                label: function(context) {
                    return `庫存總量: ${context.parsed.y.toLocaleString()} 件`;
                }
            }
        };

        this.charts.trend = new Chart(ctx, chartConfig);
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('error').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showError() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
    }

    // 銷毀圖表（用於清理）
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryReportController = new InventoryReportController();
});

// 頁面離開時清理
window.addEventListener('beforeunload', () => {
    if (window.inventoryReportController) {
        window.inventoryReportController.destroy();
    }
});
</script>
@endsection