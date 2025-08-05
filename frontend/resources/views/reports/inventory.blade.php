@extends('layouts.app')

@section('title', '庫存報表')

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

.nx-btn-danger {
    background: <?php echo $components['button']['danger']['background']; ?>;
    color: <?php echo $components['button']['danger']['color']; ?>;
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
</style>

<div class="container-fluid mx-auto p-6">
    <!-- 頁面標題 -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2" style="color: var(--nexus-text-primary);">庫存報表</h1>
        <p class="nx-text-accent">詳細的庫存分析和管理</p>
    </div>

    <!-- 過濾器 -->
    <div class="nx-card mb-8">
        <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">篩選條件</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">倉庫</label>
                <select id="warehouse-filter" class="w-full nx-input">
                    <option value="">全部倉庫</option>
                    <!-- 倉庫選項將由 JavaScript 動態載入 -->
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">庫存狀態</label>
                <select id="stock-status-filter" class="w-full nx-input">
                    <option value="">全部狀態</option>
                    <option value="normal">正常</option>
                    <option value="low_stock">低庫存</option>
                    <option value="out_of_stock">缺貨</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">產品類別</label>
                <select id="category-filter" class="w-full nx-input">
                    <option value="">全部類別</option>
                    <!-- 類別選項將由 JavaScript 動態載入 -->
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
        <!-- 庫存摘要卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="nx-card">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold nx-text-accent mb-2">總庫存價值</h4>
                        <p id="total-value" class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">$0</p>
                    </div>
                    <div class="p-3 rounded-full" style="background: rgba(59, 130, 246, 0.1);">
                        <svg class="w-6 h-6" fill="none" stroke="var(--nexus-accent-blue)" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                    </div>
                </div>
                <p id="products-count" class="text-sm nx-text-muted mt-1">0 項產品</p>
            </div>
            <div class="nx-card">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold nx-text-accent mb-2">低庫存警示</h4>
                        <p id="low-stock-count" class="text-3xl font-bold" style="color: var(--nexus-accent-orange);">0</p>
                    </div>
                    <div class="p-3 rounded-full" style="background: rgba(245, 158, 11, 0.1);">
                        <svg class="w-6 h-6" fill="none" stroke="var(--nexus-accent-orange)" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm nx-text-muted mt-1">需要補貨</p>
            </div>
            <div class="nx-card">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold nx-text-accent mb-2">缺貨項目</h4>
                        <p id="out-of-stock-count" class="text-3xl font-bold" style="color: var(--nexus-accent-red);">0</p>
                    </div>
                    <div class="p-3 rounded-full" style="background: rgba(239, 68, 68, 0.1);">
                        <svg class="w-6 h-6" fill="none" stroke="var(--nexus-accent-red)" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm nx-text-muted mt-1">急需處理</p>
            </div>
            <div class="nx-card">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold nx-text-accent mb-2">庫存週轉率</h4>
                        <p id="turnover-rate" class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">0x</p>
                    </div>
                    <div class="p-3 rounded-full" style="background: rgba(139, 92, 246, 0.1);">
                        <svg class="w-6 h-6" fill="none" stroke="var(--nexus-accent-purple)" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm nx-text-muted mt-1">年週轉次數</p>
            </div>
        </div>

        <!-- 圖表區域 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- 庫存狀態分布 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">庫存狀態分布</h3>
                    <p class="text-sm nx-text-accent">產品庫存狀態統計</p>
                </div>
                <div class="h-80">
                    <canvas id="stock-status-chart"></canvas>
                </div>
            </div>

            <!-- 前五大價值產品 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">前五大價值產品</h3>
                    <p class="text-sm nx-text-accent">按庫存價值排名</p>
                </div>
                <div class="h-80">
                    <canvas id="top-value-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- 倉庫庫存分布 -->
        <div class="nx-card mb-8">
            <div class="mb-4">
                <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">各倉庫庫存分布</h3>
                <p class="text-sm nx-text-accent">按倉庫分類的庫存價值</p>
            </div>
            <div class="h-80">
                <canvas id="warehouse-distribution-chart"></canvas>
            </div>
        </div>

        <!-- 詳細資料表格 -->
        <div class="nx-card overflow-hidden">
            <div class="p-6 border-b" style="border-color: var(--nexus-border-primary);">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">庫存明細</h3>
                    <div class="flex space-x-2">
                        <button id="export-excel" class="nx-btn nx-btn-success">
                            匯出 Excel
                        </button>
                        <button id="export-pdf" class="nx-btn nx-btn-danger">
                            匯出 PDF
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y" style="border-color: var(--nexus-border-primary);">
                    <thead style="background: var(--nexus-border-primary);">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">產品名稱</th>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">SKU</th>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">倉庫</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">現有庫存</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">安全庫存</th>
                            <th class="px-6 py-3 text-center text-xs font-medium nx-text-accent uppercase tracking-wider">狀態</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">單價</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">庫存價值</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-table-body" class="divide-y" style="border-color: var(--nexus-border-primary);">
                        <!-- 表格內容將由 JavaScript 動態填充 -->
                    </tbody>
                </table>
            </div>

            <!-- 分頁 -->
            <div class="px-4 py-3 border-t sm:px-6" style="border-color: var(--nexus-border-primary);">
                <div class="flex items-center justify-between">
                    <div class="flex-1 flex justify-between sm:hidden">
                        <button id="prev-page-mobile" class="relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md nx-text-accent hover:nx-bg-hover" style="border-color: var(--nexus-border-primary); background: var(--nexus-card-bg);">
                            上一頁
                        </button>
                        <button id="next-page-mobile" class="ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md nx-text-accent hover:nx-bg-hover" style="border-color: var(--nexus-border-primary); background: var(--nexus-card-bg);">
                            下一頁
                        </button>
                    </div>
                    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p class="text-sm nx-text-accent">
                                顯示第 <span id="start-item" class="font-medium nx-text-primary">1</span> 到 <span id="end-item" class="font-medium nx-text-primary">10</span> 筆，共 <span id="total-items" class="font-medium nx-text-primary">0</span> 筆
                            </p>
                        </div>
                        <div>
                            <nav id="pagination" class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <!-- 分頁按鈕將由 JavaScript 動態生成 -->
                            </nav>
                        </div>
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
// 庫存報表控制器
class InventoryReportController {
    constructor() {
        this.charts = {};
        this.data = null;
        this.currentPage = 1;
        this.pageSize = 20;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadFilters();
        this.loadReport();
    }

    setupEventListeners() {
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.currentPage = 1;
            this.loadReport();
        });

        document.getElementById('export-excel').addEventListener('click', () => {
            this.exportReport('excel');
        });

        document.getElementById('export-pdf').addEventListener('click', () => {
            this.exportReport('pdf');
        });
    }

    async loadFilters() {
        try {
            // 載入倉庫選項
            const warehousesResponse = await fetch('/api/warehouses', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (warehousesResponse.ok) {
                const warehouses = await warehousesResponse.json();
                const warehouseSelect = document.getElementById('warehouse-filter');
                warehouses.forEach(warehouse => {
                    const option = document.createElement('option');
                    option.value = warehouse.id;
                    option.textContent = warehouse.name;
                    warehouseSelect.appendChild(option);
                });
            }

            // 載入產品類別選項
            const categoriesResponse = await fetch('/api/product-categories', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                const categorySelect = document.getElementById('category-filter');
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('載入篩選選項失敗:', error);
        }
    }

    async loadReport() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                use_cache: 'true'
            });

            const warehouseId = document.getElementById('warehouse-filter').value;
            if (warehouseId) params.append('warehouse_id', warehouseId);

            const stockStatus = document.getElementById('stock-status-filter').value;
            if (stockStatus) params.append('stock_status', stockStatus);

            const response = await fetch(`/api/reports/inventory?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('載入庫存報表失敗');
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
        this.renderCharts(summary, details);
        this.renderTable(details);
        this.updateTimestamp();
    }

    renderSummary(summary) {
        document.getElementById('total-value').textContent = this.formatCurrency(summary.total_value || 0);
        document.getElementById('products-count').textContent = `${summary.total_products || 0} 項產品`;
        document.getElementById('low-stock-count').textContent = summary.low_stock_count || 0;
        document.getElementById('out-of-stock-count').textContent = summary.out_of_stock_count || 0;
        document.getElementById('turnover-rate').textContent = `${(summary.inventory_turnover || 0).toFixed(1)}x`;
    }

    renderCharts(summary, details) {
        this.renderStockStatusChart(summary.stock_status_breakdown || {});
        this.renderTopValueChart(summary.top_value_products || []);
        this.renderWarehouseDistributionChart(details);
    }

    renderStockStatusChart(statusBreakdown) {
        const ctx = document.getElementById('stock-status-chart').getContext('2d');

        if (this.charts.stockStatus) {
            this.charts.stockStatus.destroy();
        }

        const labels = [];
        const data = [];
        const colors = [];

        const statusMap = {
            'normal': { label: '正常', color: '#10B981' },
            'low_stock': { label: '低庫存', color: '#F59E0B' },
            'out_of_stock': { label: '缺貨', color: '#EF4444' }
        };

        Object.entries(statusBreakdown).forEach(([status, count]) => {
            if (statusMap[status]) {
                labels.push(statusMap[status].label);
                data.push(count);
                colors.push(statusMap[status].color);
            }
        });

        this.charts.stockStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
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

    renderTopValueChart(topValueProducts) {
        const ctx = document.getElementById('top-value-chart').getContext('2d');

        if (this.charts.topValue) {
            this.charts.topValue.destroy();
        }

        this.charts.topValue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topValueProducts.map(product => product.product_name),
                datasets: [{
                    label: '庫存價值',
                    data: topValueProducts.map(product => product.value),
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
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    },
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

    renderWarehouseDistributionChart(details) {
        const ctx = document.getElementById('warehouse-distribution-chart').getContext('2d');

        if (this.charts.warehouseDistribution) {
            this.charts.warehouseDistribution.destroy();
        }

        // 按倉庫分組計算總價值
        const warehouseValues = {};
        details.forEach(item => {
            if (!warehouseValues[item.warehouse_name]) {
                warehouseValues[item.warehouse_name] = 0;
            }
            warehouseValues[item.warehouse_name] += item.inventory_value;
        });

        const labels = Object.keys(warehouseValues);
        const data = Object.values(warehouseValues);

        this.charts.warehouseDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '庫存價值',
                    data: data,
                    backgroundColor: '#8B5CF6',
                    borderColor: '#7C3AED',
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

    renderTable(details) {
        const tbody = document.getElementById('inventory-table-body');
        
        if (!details || details.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center nx-text-muted">暫無資料</td></tr>';
            return;
        }

        tbody.innerHTML = details.map(item => `
            <tr class="hover:nx-bg-hover">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">
                    ${item.product_name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-accent">
                    ${item.sku}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-accent">
                    ${item.warehouse_name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right" style="color: var(--nexus-text-primary);">
                    ${item.available_quantity}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-accent text-right">
                    ${item.safety_stock}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStockStatusBadgeClass(item.stock_status)}">
                        ${this.getStockStatusText(item.stock_status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right" style="color: var(--nexus-text-primary);">
                    ${this.formatCurrency(item.unit_price)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" style="color: var(--nexus-text-primary);">
                    ${this.formatCurrency(item.inventory_value)}
                </td>
            </tr>
        `).join('');
    }

    getStockStatusBadgeClass(status) {
        const statusClasses = {
            'normal': 'text-white',
            'low_stock': 'text-white',
            'out_of_stock': 'text-white'
        };
        
        const statusColors = {
            'normal': 'background: #10b981;',
            'low_stock': 'background: #f59e0b;',
            'out_of_stock': 'background: #ef4444;'
        };
        
        const baseClass = statusClasses[status] || 'nx-text-muted';
        const colorStyle = statusColors[status] || 'background: #6b7280;';
        
        return baseClass + '" style="' + colorStyle;
    }

    getStockStatusText(status) {
        const statusTexts = {
            'normal': '正常',
            'low_stock': '低庫存',
            'out_of_stock': '缺貨'
        };
        return statusTexts[status] || status;
    }

    updateTimestamp() {
        const timestamp = new Date(this.data.generated_at).toLocaleString('zh-TW');
        document.getElementById('update-timestamp').textContent = timestamp;
    }

    async exportReport(format) {
        try {
            const params = new URLSearchParams({
                format: format
            });

            const warehouseId = document.getElementById('warehouse-filter').value;
            if (warehouseId) params.append('warehouse_id', warehouseId);

            const stockStatus = document.getElementById('stock-status-filter').value;
            if (stockStatus) params.append('stock_status', stockStatus);

            const response = await fetch(`/api/reports/inventory/export?${params}`, {
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
            a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.${format}`;
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
    new InventoryReportController();
});
</script>
@endsection