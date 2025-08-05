@extends('layouts.app')

@section('title', '庫存老化報表')

@section('content')
@include('components.reports-style')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">⏰ 庫存老化報表</h1>
        <p class="nx-text-secondary">長期庫存商品分析與風險評估</p>
    </div>

    <!-- 老化統計摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">30天內</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-green);">68%</p>
            <p class="text-sm nx-text-muted mt-2">$1,666,000</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">31-90天</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-orange);">20%</p>
            <p class="text-sm nx-text-muted mt-2">$490,000</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">91-180天</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-orange);">8%</p>
            <p class="text-sm nx-text-muted mt-2">$196,000</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">180天以上</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-red);">4%</p>
            <p class="text-sm nx-text-muted mt-2">$98,000</p>
        </div>
    </div>

    <!-- 老化分析圖表 -->
    <div class="nx-card mb-8">
        <h3 class="text-xl font-semibold mb-6 nx-text-primary">庫存老化分佈圖</h3>
        <div class="h-64 rounded">
            <canvas id="agingDistributionChart"></canvas>
        </div>
    </div>

    <!-- 風險商品清單 -->
    <div class="nx-card mb-8">
        <h3 class="text-xl font-semibold mb-6 text-red-600">🚨 高風險老化商品</h3>
        
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名稱</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">庫存天數</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">庫存數量</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">單價</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">庫存價值</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">風險等級</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">建議動作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">舊款平板 X1</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">245天</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">45</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$400</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$18,000</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="nx-badge-error">極高</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">清倉促銷</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">過時筆電 Y2</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">198天</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$800</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$9,600</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="nx-badge-error">極高</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">返廠處理</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">舊版手機 Z3</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">165天</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">28</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$300</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$8,400</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="nx-badge-warning">高</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">折扣銷售</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 處理建議 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 短期行動建議 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-accent-orange);">⚡ 短期行動建議</h3>
            
            <div class="space-y-4">
                <div class="p-4 nx-bg-orange-50 rounded-lg">
                    <h4 class="font-semibold text-orange-800 mb-2">立即清倉商品 (180天+)</h4>
                    <p class="text-sm text-orange-700">價值 $98,000，建議50-70%折扣快速清倉</p>
                </div>
                
                <div class="p-4 nx-bg-yellow-50 rounded-lg">
                    <h4 class="font-semibold text-yellow-800 mb-2">促銷推廣商品 (91-180天)</h4>
                    <p class="text-sm text-yellow-700">價值 $196,000，建議30-50%折扣促銷</p>
                </div>
                
                <div class="p-4 nx-bg-blue-50 rounded-lg">
                    <h4 class="font-semibold text-blue-800 mb-2">密切關注商品 (31-90天)</h4>
                    <p class="text-sm text-blue-700">價值 $490,000，加強行銷推廣</p>
                </div>
            </div>
        </div>

        <!-- 長期策略建議 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-accent-blue);">📋 長期策略建議</h3>
            
            <div class="space-y-4">
                <div class="p-4 nx-bg-blue-50 rounded-lg">
                    <h4 class="font-semibold text-blue-800 mb-2">優化採購策略</h4>
                    <p class="text-sm text-blue-700">建立更精準的需求預測模型，減少過度採購</p>
                </div>
                
                <div class="p-4 nx-bg-green-50 rounded-lg">
                    <h4 class="font-semibold text-green-800 mb-2">建立預警機制</h4>
                    <p class="text-sm text-green-700">設定30天預警，及時調整庫存和銷售策略</p>
                </div>
                
                <div class="p-4 nx-bg-purple-50 rounded-lg">
                    <h4 class="font-semibold text-purple-800 mb-2">供應商合作</h4>
                    <p class="text-sm text-purple-700">與供應商建立退貨或調換機制，降低滯銷風險</p>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    // 深色主題配色
    const darkTheme = {
        primary: '#1a1d29',
        secondary: '#2d3142',
        cardBg: '#2d3142',
        textPrimary: '#ffffff',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        purple: '#8b5cf6',
        blue: '#3b82f6',
        green: '#10b981',
        orange: '#f59e0b',
        red: '#ef4444',
        pink: '#ec4899',
        cyan: '#06b6d4'
    };

    // Chart.js 深色主題默認配置
    Chart.defaults.color = darkTheme.textSecondary;
    Chart.defaults.backgroundColor = darkTheme.cardBg;
    Chart.defaults.borderColor = darkTheme.textMuted;

    // 庫存老化分佈圖
    const agingCtx = document.getElementById('agingDistributionChart');
    if (agingCtx) {
        new Chart(agingCtx, {
            type: 'doughnut',
            data: {
                labels: ['30天內', '31-90天', '91-180天', '180天以上'],
                datasets: [{
                    data: [68, 20, 8, 4],
                    backgroundColor: [
                        darkTheme.green,
                        darkTheme.orange,
                        darkTheme.red,
                        darkTheme.pink
                    ],
                    borderColor: darkTheme.secondary,
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: darkTheme.textPrimary,
                            font: {
                                size: 14,
                                weight: '500'
                            },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: darkTheme.cardBg,
                        titleColor: darkTheme.textPrimary,
                        bodyColor: darkTheme.textSecondary,
                        borderColor: darkTheme.green,
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                return `${label}: ${value}%`;
                            }
                        }
                    }
                },
                cutout: '50%',
                interaction: {
                    intersect: false
                }
            }
        });
    }
});
</script>
@endpush

@endsection