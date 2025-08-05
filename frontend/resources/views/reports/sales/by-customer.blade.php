@extends('layouts.app')

@section('title', '客戶銷售分析')

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

.customer-tier {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
}

.tier-vip {
    background: rgba(245, 158, 11, 0.2);
    color: var(--nexus-accent-orange);
}

.tier-premium {
    background: rgba(139, 92, 246, 0.2);
    color: var(--nexus-accent-purple);
}

.tier-regular {
    background: rgba(59, 130, 246, 0.2);
    color: var(--nexus-accent-blue);
}

.tier-new {
    background: rgba(16, 185, 129, 0.2);
    color: var(--nexus-accent-green);
}
</style>

<div class="container-fluid mx-auto p-6">
    <!-- 頁面標題 -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2" style="color: var(--nexus-text-primary);">客戶銷售分析</h1>
        <p class="nx-text-accent">各客戶的購買行為分析</p>
        
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
                <label class="block text-sm font-medium nx-text-accent mb-2">客戶等級</label>
                <select id="tier-filter" class="w-full nx-input">
                    <option value="">全部等級</option>
                    <option value="vip">VIP 客戶</option>
                    <option value="premium">優質客戶</option>
                    <option value="regular">一般客戶</option>
                    <option value="new">新客戶</option>
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
        <!-- 客戶摘要 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="nx-card">
                <h4 class="text-lg font-semibold nx-text-accent mb-2">總客戶數</h4>
                <p id="total-customers" class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">0</p>
                <p class="text-sm nx-text-muted mt-1">活躍客戶</p>
            </div>
            <div class="nx-card">
                <h4 class="text-lg font-semibold nx-text-accent mb-2">最佳客戶</h4>
                <p id="top-customer" class="text-xl font-bold" style="color: var(--nexus-accent-green);">-</p>
                <p id="top-customer-sales" class="text-sm nx-text-muted mt-1">NT$ 0</p>
            </div>
            <div class="nx-card">
                <h4 class="text-lg font-semibold nx-text-accent mb-2">客均消費</h4>
                <p id="avg-customer-value" class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">NT$ 0</p>
                <p class="text-sm nx-text-muted mt-1">每位客戶平均</p>
            </div>
            <div class="nx-card">
                <h4 class="text-lg font-semibold nx-text-accent mb-2">新客戶</h4>
                <p id="new-customers" class="text-3xl font-bold" style="color: var(--nexus-accent-orange);">0</p>
                <p class="text-sm nx-text-muted mt-1">本期新增</p>
            </div>
        </div>

        <!-- 圖表區域 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- 客戶價值分佈 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">客戶價值分佈</h3>
                    <p class="text-sm nx-text-accent">前十大價值客戶</p>
                </div>
                <div class="h-80">
                    <canvas id="customer-value-chart"></canvas>
                </div>
            </div>

            <!-- 客戶等級分佈 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">客戶等級分佈</h3>
                    <p class="text-sm nx-text-accent">各等級客戶占比</p>
                </div>
                <div class="h-80">
                    <canvas id="customer-tier-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- 詳細資料表格 -->
        <div class="nx-card">
            <div class="mb-4 border-b pb-4" style="border-color: var(--nexus-border-primary);">
                <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">客戶銷售明細</h3>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y" style="border-color: var(--nexus-border-primary);">
                    <thead style="background: var(--nexus-border-primary);">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">客戶名稱</th>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">等級</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">訂單數</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">總消費</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">平均訂單</th>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">最後購買</th>
                        </tr>
                    </thead>
                    <tbody id="customers-table-body" class="divide-y" style="border-color: var(--nexus-border-primary);">
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
// 客戶銷售分析控制器
class CustomerSalesReportController {
    constructor() {
        this.charts = {};
        this.data = null;
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
    }

    setDefaultDates() {
        const today = new Date();
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setDate(today.getDate() - 30);

        document.getElementById('date-from').value = oneMonthAgo.toISOString().split('T')[0];
        document.getElementById('date-to').value = today.toISOString().split('T')[0];
    }

    async loadReport() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                date_from: document.getElementById('date-from').value,
                date_to: document.getElementById('date-to').value,
                report_type: 'by_customer'
            });

            const tier = document.getElementById('tier-filter').value;
            if (tier) params.append('tier', tier);

            const response = await fetch(`/api/reports/sales/by-customer?${params}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('載入客戶銷售報表失敗');
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
        const customers = this.data.customers || [];
        const totalCustomers = customers.length;
        const topCustomer = customers.find(c => c.rank === 1);
        const avgValue = customers.length > 0 
            ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length
            : 0;
        const newCustomers = customers.filter(c => c.tier === 'new').length;

        document.getElementById('total-customers').textContent = totalCustomers;
        document.getElementById('top-customer').textContent = topCustomer ? topCustomer.customer_name : '-';
        document.getElementById('top-customer-sales').textContent = topCustomer 
            ? this.formatCurrency(topCustomer.total_spent) 
            : 'NT$ 0';
        document.getElementById('avg-customer-value').textContent = this.formatCurrency(avgValue);
        document.getElementById('new-customers').textContent = newCustomers;
    }

    renderCharts() {
        const customers = this.data.customers || [];
        const top10Customers = customers.slice(0, 10);
        
        this.renderCustomerValueChart(top10Customers);
        this.renderCustomerTierChart();
    }

    renderCustomerValueChart(customers) {
        const ctx = document.getElementById('customer-value-chart').getContext('2d');

        if (this.charts.value) {
            this.charts.value.destroy();
        }

        this.charts.value = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: customers.map(c => c.customer_name),
                datasets: [{
                    label: '總消費金額',
                    data: customers.map(c => c.total_spent),
                    backgroundColor: '#10B981',
                    borderColor: '#059669',
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

    renderCustomerTierChart() {
        const tiers = this.data.tiers || [];
        const ctx = document.getElementById('customer-tier-chart').getContext('2d');

        if (this.charts.tiers) {
            this.charts.tiers.destroy();
        }

        this.charts.tiers = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: tiers.map(t => this.getTierLabel(t.tier)),
                datasets: [{
                    data: tiers.map(t => t.customer_count),
                    backgroundColor: [
                        '#F59E0B', // VIP - Orange
                        '#8B5CF6', // Premium - Purple
                        '#3B82F6', // Regular - Blue
                        '#10B981'  // New - Green
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
        const customers = this.data.customers || [];
        const tbody = document.getElementById('customers-table-body');
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center nx-text-muted">暫無資料</td></tr>';
            return;
        }

        tbody.innerHTML = customers.map(customer => `
            <tr class="hover:nx-bg-hover">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">
                    ${customer.customer_name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="customer-tier tier-${customer.tier}">
                        ${this.getTierLabel(customer.tier)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right nx-text-accent">
                    ${customer.order_count || 0}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" style="color: var(--nexus-text-primary);">
                    ${this.formatCurrency(customer.total_spent)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right nx-text-accent">
                    ${this.formatCurrency(customer.average_order_value)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-accent">
                    ${customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString('zh-TW') : '無紀錄'}
                </td>
            </tr>
        `).join('');
    }

    getTierLabel(tier) {
        const labels = {
            'vip': 'VIP 客戶',
            'premium': '優質客戶',
            'regular': '一般客戶',
            'new': '新客戶'
        };
        return labels[tier] || tier;
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
    new CustomerSalesReportController();
});
</script>
@endsection