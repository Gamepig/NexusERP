@extends('layouts.app')

@section('title', '庫存估價報表')

@section('content')
@include('components.reports-style')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8 flex items-center justify-between">
        <div class="flex items-end space-x-4">
            <div>
                <h1 class="text-3xl font-bold mb-2">💰 庫存估價報表</h1>
                <p class="nx-text-secondary">庫存商品當前市值與價值分析</p>
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-accent mb-2">公司</label>
                <select id="company-select" class="nx-input"></select>
            </div>
        </div>
        <div class="space-x-2">
            <button id="export-distribution-png" class="nx-btn nx-btn-secondary">下載分佈 PNG</button>
            <button id="export-comparison-png" class="nx-btn nx-btn-info">下載對比 PNG</button>
        </div>
    </div>

    <!-- 統計摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">總庫存價值（成本）</h3>
            <p id="total-cost" class="text-3xl font-bold" style="color: var(--nexus-accent-green);">$0</p>
            <p class="text-sm nx-text-muted mt-2">基於當前成本計算</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">總庫存估值（市價）</h3>
            <p id="total-market" class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">$0</p>
            <p class="text-sm nx-text-muted mt-2">基於市場價格計算</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">估值差異</h3>
            <p id="valuation-diff" class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">0%</p>
            <p class="text-sm nx-text-muted mt-2">市值 vs 成本 差異</p>
        </div>
    </div>

    <!-- 圖表區域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 價值分佈圖 -->
        <div class="nx-card">
            <div class="mb-4">
                <h3 class="text-lg font-semibold nx-text-primary">庫存價值分佈</h3>
                <p class="text-sm nx-text-muted">各產品類別價值佔比</p>
            </div>
            <div class="h-80">
                <canvas id="valuation-distribution-chart"></canvas>
            </div>
        </div>

        <!-- 價值差異分析 -->
        <div class="nx-card">
            <div class="mb-4">
                <h3 class="text-lg font-semibold nx-text-primary">價值差異分析</h3>
                <p class="text-sm nx-text-muted">成本價 vs 市場價對比</p>
            </div>
            <div class="h-80">
                <canvas id="valuation-comparison-chart"></canvas>
            </div>
        </div>
    </div>

    <!-- 詳細估價表 -->
    <div class="nx-card">
        <h3 class="text-xl font-semibold mb-6 nx-text-primary">商品估價明細</h3>
        
        <div class="overflow-x-auto">
            <table class="nx-table min-w-full">
                <thead>
                    <tr>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">商品名稱</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">庫存數量</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">單位成本</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">總成本</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">市場價格</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">市場價值</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">價值差異</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium nx-text-primary">筆記型電腦 A1</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">150</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$1,200</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$180,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$1,350</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$202,500</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-accent-green);">+12.5%</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium nx-text-primary">智慧型手機 B2</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">300</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$800</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$240,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$750</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$225,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-accent-red);">-6.3%</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium nx-text-primary">平板電腦 C3</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">200</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$600</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$120,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$720</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$144,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-accent-green);">+20.0%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 估價方法說明 -->
    <div class="mt-8 nx-bg-blue-50 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4" style="color: var(--nexus-accent-blue);">估價方法說明</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm nx-text-secondary">
            <div>
                <h5 class="font-semibold mb-2 nx-text-primary">成本法估價</h5>
                <p>基於商品實際採購成本計算，反映庫存的會計價值</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 nx-text-primary">市場法估價</h5>
                <p>基於當前市場售價計算，反映庫存的潛在市場價值</p>
            </div>
        </div>
    </div>
</div>

<!-- Chart.js CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
// 庫存估價報表控制器
class InventoryValuationController {
    constructor() {
        this.charts = {};
        this.data = null;
        this.init();
    }

    init() {
        this.initCompanySelect().then(()=>this.loadReport());
    }

    async loadReport() {
        try {
            const resp = await fetch('/api/inventory/levels', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            if (!resp.ok) throw new Error('載入庫存資料失敗');
            const json = await resp.json();
            const items = (json.data || []).map(i => ({
                category: i.category_name || '未分類',
                qty: Number(i.current_quantity || 0),
                unit_cost: Number(i.unit_cost || 0),
                market_price: Number(i.market_price || 0)
            }));
            const categoryMap = new Map();
            for (const it of items) {
                const m = categoryMap.get(it.category) || { cost: 0, market: 0 };
                m.cost += it.qty * it.unit_cost;
                m.market += it.qty * it.market_price;
                categoryMap.set(it.category, m);
            }
            const labels = Array.from(categoryMap.keys());
            const costValues = labels.map(l => Math.round(categoryMap.get(l).cost));
            const marketValues = labels.map(l => Math.round(categoryMap.get(l).market));
            this.data = { labels, costValues, marketValues };
            // 更新摘要
            const totalCost = costValues.reduce((a,b)=>a+b,0);
            const totalMarket = marketValues.reduce((a,b)=>a+b,0);
            document.getElementById('total-cost').textContent = this.formatCurrency(totalCost);
            document.getElementById('total-market').textContent = this.formatCurrency(totalMarket);
            const diff = totalCost > 0 ? ((totalMarket-totalCost)/totalCost*100).toFixed(1) : '0.0';
            document.getElementById('valuation-diff').textContent = `${diff}%`;
            this.renderCharts();
            this.bindPngExports();
        } catch (error) {
            console.error('載入庫存估價數據失敗:', error);
        }
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

    renderCharts() {
        this.renderDistributionChart();
        this.renderComparisonChart();
    }

    renderDistributionChart() {
        const ctx = document.getElementById('valuation-distribution-chart');
        if (!ctx) return;

        // 銷毀現有圖表
        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }

        const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#14B8A6', '#F97316'];
        
        this.charts.distribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.data.labels,
                datasets: [{
                    label: '市場價值',
                    data: this.data.marketValues,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color + '80'),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-primary') || '#374151',
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderComparisonChart() {
        const ctx = document.getElementById('valuation-comparison-chart');
        if (!ctx) return;

        // 銷毀現有圖表
        if (this.charts.comparison) {
            this.charts.comparison.destroy();
        }

        this.charts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.data.labels,
                datasets: [
                    {
                        label: '成本估值',
                        data: this.data.costValues,
                        backgroundColor: '#3B82F6',
                        borderColor: '#2563EB',
                        borderWidth: 1
                    },
                    {
                        label: '市場估值',
                        data: this.data.marketValues,
                        backgroundColor: '#10B981',
                        borderColor: '#059669',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') || '#6B7280',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-border-primary') || '#E5E7EB'
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') || '#6B7280'
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-border-primary') || '#E5E7EB'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-primary') || '#374151',
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }

    bindPngExports() {
        const dl = (canvasId, fname) => {
            const c = document.getElementById(canvasId); if (!c) return;
            const url = c.toDataURL('image/png'); const a = document.createElement('a');
            a.href = url; a.download = `${fname}-${new Date().toISOString().slice(0,10)}.png`; a.click();
        };
        document.getElementById('export-distribution-png')?.addEventListener('click', ()=>dl('valuation-distribution-chart','inventory-distribution'));
        document.getElementById('export-comparison-png')?.addEventListener('click', ()=>dl('valuation-comparison-chart','inventory-comparison'));
    }

    // 清理資源
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }

    formatCurrency(n) {
        return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
    }
}

// 頁面載入完成後初始化報表
document.addEventListener('DOMContentLoaded', function() {
    new InventoryValuationController();
});
</script>
@endsection