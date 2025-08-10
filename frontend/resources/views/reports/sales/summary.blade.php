@extends('layouts.app')

@section('title', '銷售總覽')

@section('content')
@include('components.reports-style')

<div class="container-fluid mx-auto p-6">
    <!-- 頁面標題 -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2" style="color: var(--nexus-text-primary);">銷售總覽</h1>
        <p class="nx-text-accent">詳細的銷售數據分析和趨勢</p>
        
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
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">公司</label>
                <select id="company-select" class="w-full nx-input"></select>
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">開始日期</label>
                <input type="date" id="date-from" class="w-full nx-input">
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">結束日期</label>
                <input type="date" id="date-to" class="w-full nx-input">
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">訂單狀態</label>
                <select id="status-filter" class="w-full nx-input">
                    <option value="">全部狀態</option>
                    <option value="pending">待處理</option>
                    <option value="processing">處理中</option>
                    <option value="shipped">已出貨</option>
                    <option value="delivered">已送達</option>
                    <option value="cancelled">已取消</option>
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
        <!-- 銷售摘要卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="nx-card">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold nx-text-accent mb-2">總銷售額</h4>
                        <p id="total-sales" class="text-3xl font-bold" style="color: var(--nexus-accent-green);">$0</p>
                    </div>
                    <div class="p-3 rounded-full" style="background: rgba(16, 185, 129, 0.1);">
                        <svg class="w-6 h-6" fill="none" stroke="var(--nexus-accent-green)" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                        </svg>
                    </div>
                </div>
                <p id="orders-count" class="text-sm nx-text-muted mt-1">0 筆訂單</p>
            </div>
            <div class="nx-card">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold nx-text-accent mb-2">平均訂單金額</h4>
                        <p id="average-order" class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">$0</p>
                    </div>
                    <div class="p-3 rounded-full" style="background: rgba(59, 130, 246, 0.1);">
                        <svg class="w-6 h-6" fill="none" stroke="var(--nexus-accent-blue)" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm nx-text-muted mt-1">每筆訂單平均</p>
            </div>
            <div class="nx-card">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold nx-text-accent mb-2">成長趨勢</h4>
                        <p id="growth-trend" class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">0%</p>
                    </div>
                    <div class="p-3 rounded-full" style="background: rgba(139, 92, 246, 0.1);">
                        <svg class="w-6 h-6" fill="none" stroke="var(--nexus-accent-purple)" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm nx-text-muted mt-1">相較上期</p>
            </div>
        </div>

        <!-- 圖表區域 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- 銷售趨勢圖 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">銷售趨勢</h3>
                    <p class="text-sm nx-text-accent">銷售金額變化趨勢</p>
                </div>
                <div class="h-80">
                    <canvas id="sales-trend-chart"></canvas>
                </div>
            </div>

            <!-- 前五大客戶 -->
            <div class="nx-card">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">前五大客戶</h3>
                    <p class="text-sm nx-text-accent">按銷售額排名的客戶</p>
                </div>
                <div class="h-80">
                    <canvas id="top-customers-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- 詳細資料表格 -->
        <div class="nx-table">
            <div class="nx-table-header border-b" style="border-color: var(--nexus-border-primary);">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">銷售明細</h3>
                    <div class="flex space-x-2">
                        <button id="export-excel" class="nx-btn nx-btn-success">
                            匯出 Excel
                        </button>
                        <button id="export-pdf" class="nx-btn nx-btn-danger">
                            匯出 PDF
                        </button>
                        <button id="export-csv" class="nx-btn nx-btn-secondary">下載 CSV</button>
                        <button id="export-trend-png" class="nx-btn nx-btn-info">下載趨勢圖 PNG</button>
                    </div>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y" style="border-color: var(--nexus-border-primary);">
                    <thead style="background: var(--nexus-border-primary);">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">訂單編號</th>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">客戶</th>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">訂單日期</th>
                            <th class="px-6 py-3 text-left text-xs font-medium nx-text-accent uppercase tracking-wider">狀態</th>
                            <th class="px-6 py-3 text-right text-xs font-medium nx-text-accent uppercase tracking-wider">金額</th>
                        </tr>
                    </thead>
                    <tbody id="sales-table-body" class="divide-y" style="border-color: var(--nexus-border-primary);">
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
// 銷售報表控制器
class SalesReportController {
    constructor() {
        this.charts = {};
        this.data = null;
        this.currentPage = 1;
        this.pageSize = 20;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.initCompanySelect().then(() => this.loadReport());
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

    setDefaultDates() {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        document.getElementById('date-from').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('date-to').value = today.toISOString().split('T')[0];
    }

    async initCompanySelect() {
        try {
            const sel = document.getElementById('company-select');
            if (!sel) return;
            sel.innerHTML = '<option value="">載入公司中...</option>';
            const resp = await fetch('/api/company-management/companies', { credentials: 'same-origin' });
            const json = await resp.json();
            const companies = json?.companies || json || [];
            sel.innerHTML = '';
            companies.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id || c.company_id || c.company?.id || '';
                opt.textContent = c.name || c.company_name || `公司 ${opt.value}`;
                if ((json.current_company_id && (opt.value == json.current_company_id)) || c.is_current) opt.selected = true;
                sel.appendChild(opt);
            });
            sel.addEventListener('change', async () => {
                await this.switchCompany(sel.value);
                this.loadReport();
            });
        } catch (e) {
            console.warn('載入公司清單失敗', e);
        }
    }

    async switchCompany(companyId) {
        if (!companyId) return;
        try {
            await fetch('/api/company-management/switch-company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                credentials: 'same-origin',
                body: JSON.stringify({ company_id: companyId })
            });
        } catch (e) {
            console.warn('切換公司失敗', e);
        }
    }

    async loadReport() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                date_from: document.getElementById('date-from').value,
                date_to: document.getElementById('date-to').value,
                use_cache: 'true'
            });

            const status = document.getElementById('status-filter').value;
            if (status) params.append('status', status);

    // 調用 Laravel API
            const response = await fetch(`/api/reports/sales?${params}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error('載入銷售報表失敗');
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
        if (!this.data || !this.data.summary || !this.data.data) {
            this.showError('報表資料格式錯誤');
            return;
        }

        // API 已回傳物件，不需再 JSON.parse
        const summary = this.data.summary;
        const details = this.data.data;
        
        this.renderSummary(summary);
        this.renderCharts(summary);
        this.renderTable(details);
        this.updateTimestamp();
    }

    renderSummary(summary) {
        document.getElementById('total-sales').textContent = this.formatCurrency(summary.total_sales || 0);
        document.getElementById('orders-count').textContent = `${summary.order_count || 0} 筆訂單`;
        document.getElementById('average-order').textContent = this.formatCurrency(summary.average_order_size || 0);
        
        // 成長趨勢暫時顯示為 0%，需要歷史數據比較
        document.getElementById('growth-trend').textContent = '0%';
    }

    renderCharts(summary) {
        this.renderTrendChart(summary.sales_by_month || []);
        this.renderCustomersChart(summary.top_customers || []);
    }

    renderTrendChart(salesByMonth) {
        const ctx = document.getElementById('sales-trend-chart').getContext('2d');

        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: salesByMonth.map(item => item.month),
                datasets: [{
                    label: '銷售額',
                    data: salesByMonth.map(item => item.total_sales),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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

    renderCustomersChart(topCustomers) {
        const ctx = document.getElementById('top-customers-chart').getContext('2d');

        if (this.charts.customers) {
            this.charts.customers.destroy();
        }

        this.charts.customers = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: topCustomers.map(customer => customer.customer_name),
                datasets: [{
                    data: topCustomers.map(customer => customer.total_spent),
                    backgroundColor: [
                        '#10B981',
                        '#3B82F6',
                        '#8B5CF6',
                        '#F59E0B',
                        '#EF4444'
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

    renderTable(details) {
        const tbody = document.getElementById('sales-table-body');
        
        if (!details || details.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center nx-text-muted">暫無資料</td></tr>';
            return;
        }

        tbody.innerHTML = details.map(order => `
            <tr class="hover:nx-bg-hover">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">
                    ${order.order_number}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-accent">
                    ${order.customer_name || '未指定'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-accent">
                    ${new Date(order.order_date).toLocaleDateString('zh-TW')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusBadgeClass(order.status)}">
                        ${this.getStatusText(order.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" style="color: var(--nexus-text-primary);">
                    ${this.formatCurrency(order.total_amount)}
                </td>
            </tr>
        `).join('');
    }

    getStatusBadgeClass(status) {
        const statusClasses = {
            'pending': 'text-white',
            'processing': 'text-white',
            'shipped': 'text-white',
            'delivered': 'text-white',
            'cancelled': 'text-white'
        };
        
        const statusColors = {
            'pending': 'background: #f59e0b;',
            'processing': 'background: #3b82f6;',
            'shipped': 'background: #10b981;',
            'delivered': 'background: #8b5cf6;',
            'cancelled': 'background: #ef4444;'
        };
        
        const baseClass = statusClasses[status] || 'nx-text-muted';
        const colorStyle = statusColors[status] || 'background: #6b7280;';
        
        return baseClass + '" style="' + colorStyle;
    }

    getStatusText(status) {
        const statusTexts = {
            'pending': '待處理',
            'processing': '處理中',
            'shipped': '已出貨',
            'delivered': '已送達',
            'cancelled': '已取消'
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
                date_from: document.getElementById('date-from').value,
                date_to: document.getElementById('date-to').value,
                format: format
            });

            const status = document.getElementById('status-filter').value;
            if (status) params.append('status', status);

            const response = await fetch(`/api/reports/sales/export?${params}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error('匯出報表失敗');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales-report-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('匯出失敗：' + error.message);
        }
    }

    bindExtraExports() {
        const csvBtn = document.getElementById('export-csv');
        if (csvBtn) {
            csvBtn.onclick = () => {
                const details = this.data?.data || [];
                const header = 'OrderNumber,OrderDate,Customer,Status,TotalAmount';
                const body = details.map(o => `${o.order_number},${o.order_date},${o.customer_name||''},${o.status},${o.total_amount}`).join('\n');
                const blob = new Blob([header+'\n'+body], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href=url; a.download=`sales-details-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
            };
        }
        const pngBtn = document.getElementById('export-trend-png');
        if (pngBtn) {
            pngBtn.onclick = () => {
                const c = document.getElementById('sales-trend-chart');
                if (!c) return; const url=c.toDataURL('image/png');
                const a=document.createElement('a'); a.href=url; a.download=`sales-trend-${new Date().toISOString().slice(0,10)}.png`; a.click();
            };
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
    const ctrl = new SalesReportController();
    ctrl.bindExtraExports();
});
</script>
@endsection