@extends('layouts.app')

@section('title', '產品銷售分析')

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

.hover\:nx-bg-hover:hover {
    background: rgba(55, 65, 81, 0.5);
}
</style>

<div class="container-fluid mx-auto p-6">
    <!-- 頁面標題 -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2" style="color: var(--nexus-text-primary);">產品銷售分析</h1>
        <p class="nx-text-accent">各產品的銷售績效分析</p>
        
        <!-- 返回按鈕 -->
        <div class="mt-4">
            <a href="{{ route('reports.sales.index') }}" class="nx-btn nx-btn-primary">
                ← 返回報表選擇
            </a>
        </div>
    </div>

    <!-- 過濾器 -->
    <div class="nx-card mb-8">
        <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">篩選條件</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">開始日期</label>
                <input type="date" id="date-from" class="w-full nx-input">
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">結束日期</label>
                <input type="date" id="date-to" class="w-full nx-input">
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">產品類別</label>
                <select id="category-filter" class="w-full nx-input">
                    <option value="">全部類別</option>
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
        <!-- 產品銷售摘要 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="nx-card">
                <h4 class="text-lg font-semibold nx-text-accent mb-2">總產品數</h4>
                <p id="total-products" class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">0</p>
                <p class="text-sm nx-text-muted mt-1">已售出產品</p>
            </div>
            <div class="nx-card">
                <h4 class="text-lg font-semibold nx-text-accent mb-2">最佳銷售產品</h4>
                <p id="top-product" class="text-2xl font-bold" style="color: var(--nexus-accent-green);">-</p>
                <p id="top-product-sales" class="text-sm nx-text-muted mt-1">NT$ 0</p>
            </div>
            <div class="nx-card">
                <h4 class="text-lg font-semibold nx-text-accent mb-2">平均產品銷售額</h4>
                <p id="avg-product-sales" class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">NT$ 0</p>
                <p class="text-sm nx-text-muted mt-1">每項產品平均</p>
            </div>
        </div>

        <!-- 圖表區域 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- 產品銷售排名 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">產品銷售排名</h3>
                    <p class="text-sm nx-text-accent">前十大銷售產品</p>
                </div>
                <div class="h-80">
                    <canvas id="product-ranking-chart"></canvas>
                </div>
            </div>

            <!-- 類別銷售分佈 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">類別銷售分佈</h3>
                    <p class="text-sm nx-text-accent">各類別銷售占比</p>
                </div>
                <div class="h-80">
                    <canvas id="category-distribution-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- 詳細資料表格 -->
        <div class="nx-card">
            <div class="mb-4 border-b pb-4" style="border-color: var(--nexus-border-primary);">
                <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">產品銷售明細</h3>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y" style="border-color: var(--nexus-border-primary);">
                    <thead style="background: var(--nexus-border-primary);">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">產品名稱</th>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">類別</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">銷售數量</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">銷售金額</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">平均單價</th>
                        </tr>
                    </thead>
                    <tbody id="products-table-body" class="divide-y" style="border-color: var(--nexus-border-primary);">
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
// 產品銷售分析控制器
class ProductSalesReportController {
    constructor() {
        this.charts = {};
        this.data = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.loadCategories();
        this.loadReport();
    }

    setupEventListeners() {
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.loadReport();
        });
    }

    setDefaultDates() {
        const today = new Date();
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setDate(today.getDate() - 30);

        document.getElementById('date-from').value = oneMonthAgo.toISOString().split('T')[0];
        document.getElementById('date-to').value = today.toISOString().split('T')[0];
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/marketplace/categories', {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                const categories = result.data || [];
                const select = document.getElementById('category-filter');
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.log('無法載入產品類別:', error.message);
        }
    }

    async loadReport() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                date_from: document.getElementById('date-from').value,
                date_to: document.getElementById('date-to').value,
                report_type: 'by_product'
            });

            const category = document.getElementById('category-filter').value;
            if (category) params.append('category_id', category);

            const response = await fetch(`/api/reports/sales/by-product?${params}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('載入產品銷售報表失敗');
            }

            const apiResponse = await response.json();
            // 直接使用 API 回應數據，無需 JSON.parse()
            this.data = apiResponse;
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
        const products = this.data.products || [];
        const totalProducts = products.length;
        const topProduct = products.find(p => p.rank === 1);
        const avgSales = products.length > 0 
            ? products.reduce((sum, p) => sum + (p.total_sales || 0), 0) / products.length
            : 0;

        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('top-product').textContent = topProduct ? topProduct.product_name : '-';
        document.getElementById('top-product-sales').textContent = topProduct 
            ? this.formatCurrency(topProduct.total_sales) 
            : 'NT$ 0';
        document.getElementById('avg-product-sales').textContent = this.formatCurrency(avgSales);
    }

    renderCharts() {
        const products = this.data.products || [];
        const top10Products = products.slice(0, 10);
        
        this.renderProductRankingChart(top10Products);
        this.renderCategoryDistributionChart();
    }

    renderProductRankingChart(products) {
        const ctx = document.getElementById('product-ranking-chart').getContext('2d');

        if (this.charts.ranking) {
            this.charts.ranking.destroy();
        }

        this.charts.ranking = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: products.map(p => p.product_name),
                datasets: [{
                    label: '銷售金額',
                    data: products.map(p => p.total_sales),
                    backgroundColor: '#3B82F6',
                    borderColor: '#1D4ED8',
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

    renderCategoryDistributionChart() {
        const categories = this.data.categories || [];
        const ctx = document.getElementById('category-distribution-chart').getContext('2d');

        if (this.charts.categories) {
            this.charts.categories.destroy();
        }

        this.charts.categories = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(c => c.category_name),
                datasets: [{
                    data: categories.map(c => c.total_sales),
                    backgroundColor: [
                        '#10B981',
                        '#3B82F6',
                        '#8B5CF6',
                        '#F59E0B',
                        '#EF4444',
                        '#6B7280'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderTable() {
        const products = this.data.products || [];
        const tbody = document.getElementById('products-table-body');
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center nx-text-muted">暫無資料</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr class="hover:nx-bg-hover">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">
                    ${product.product_name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-accent">
                    ${product.category_name || '未分類'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right nx-text-accent">
                    ${product.quantity_sold || 0}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" style="color: var(--nexus-text-primary);">
                    ${this.formatCurrency(product.total_sales)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right nx-text-accent">
                    ${this.formatCurrency(product.average_price)}
                </td>
            </tr>
        `).join('');
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
    new ProductSalesReportController();
});
</script>
@endsection