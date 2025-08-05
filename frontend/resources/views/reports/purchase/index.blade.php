@extends('layouts.app')

@section('title', '採購報表總覽')

@section('content')
@include('components.reports-style')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <div class="flex items-center mb-4">
            <a href="{{ route('reports.index') }}" class="text-blue-600 hover:text-blue-800 mr-2">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
            </a>
            <nav class="text-sm breadcrumbs">
                <a href="{{ route('reports.index') }}" class="text-blue-600 hover:text-blue-800">報表中心</a>
                <span class="mx-2 nx-text-muted">></span>
                <span class="nx-text-secondary">採購報表</span>
            </nav>
        </div>
        <h1 class="text-3xl font-bold mb-2">🛒 採購報表總覽</h1>
        <p class="nx-text-secondary">採購訂單統計與供應商分析</p>
    </div>

    <!-- 採購統計摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">總採購金額</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">$18,450,000</p>
            <p class="text-sm nx-text-muted mt-2">較上月 +12.8%</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">採購訂單數</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">856</p>
            <p class="text-sm nx-text-muted mt-2">本月訂單</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">平均訂單金額</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-green);">$21,560</p>
            <p class="text-sm nx-text-muted mt-2">每筆訂單平均</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">活躍供應商</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-orange);">45</p>
            <p class="text-sm nx-text-muted mt-2">合作供應商</p>
        </div>
    </div>

    <!-- 快速導航 -->
    <div class="nx-card mb-8">
        <h3 class="text-xl font-semibold mb-6 nx-text-primary">採購報表分類</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="{{ route('reports.purchase.index') }}" class="nx-bg-purple-50 hover:opacity-80 p-6 rounded-lg text-center transition-colors border-2" style="border-color: var(--nexus-accent-purple);">
                <div class="font-semibold text-lg mb-2" style="color: var(--nexus-accent-purple);">採購總覽</div>
                <div class="text-sm nx-text-secondary">綜合採購統計分析</div>
            </a>
            <a href="{{ route('reports.purchase.by-supplier') }}" class="nx-bg-green-50 hover:opacity-80 p-6 rounded-lg text-center transition-colors">
                <div class="font-semibold text-lg mb-2" style="color: var(--nexus-accent-green);">供應商分析</div>
                <div class="text-sm nx-text-secondary">供應商採購統計</div>
            </a>
            <a href="{{ route('reports.purchase.by-product') }}" class="nx-bg-orange-50 hover:opacity-80 p-6 rounded-lg text-center transition-colors">
                <div class="font-semibold text-lg mb-2" style="color: var(--nexus-accent-orange);">商品分析</div>
                <div class="text-sm nx-text-secondary">採購商品統計</div>
            </a>
        </div>
    </div>

    <!-- 採購趨勢圖表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 採購金額趨勢 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 nx-text-primary">月度採購金額趨勢</h3>
            <div class="h-64 rounded">
                <canvas id="purchaseTrendChart"></canvas>
            </div>
        </div>

        <!-- 採購分類佔比 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 nx-text-primary">採購商品分類佔比</h3>
            <div class="h-64 rounded">
                <canvas id="categoryPieChart"></canvas>
            </div>
        </div>
    </div>

    <!-- Top 供應商與商品 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Top 5 供應商 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-accent-green);">🏆 Top 5 供應商</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-4 nx-bg-green-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold" style="color: var(--nexus-accent-green);">Apple Inc.</h4>
                        <p class="text-sm nx-text-secondary">消費電子產品</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold" style="color: var(--nexus-accent-green);">$4,280,000</div>
                        <div class="text-sm nx-text-muted">23.2%</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 nx-bg-blue-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold" style="color: var(--nexus-accent-blue);">Samsung Electronics</h4>
                        <p class="text-sm nx-text-secondary">顯示器與零組件</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold" style="color: var(--nexus-accent-blue);">$3,150,000</div>
                        <div class="text-sm nx-text-muted">17.1%</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 nx-bg-purple-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold" style="color: var(--nexus-accent-purple);">Intel Corporation</h4>
                        <p class="text-sm nx-text-secondary">處理器與晶片</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold" style="color: var(--nexus-accent-purple);">$2,890,000</div>
                        <div class="text-sm nx-text-muted">15.7%</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 nx-bg-orange-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold" style="color: var(--nexus-accent-orange);">Dell Technologies</h4>
                        <p class="text-sm nx-text-secondary">電腦與伺服器</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold" style="color: var(--nexus-accent-orange);">$2,340,000</div>
                        <div class="text-sm nx-text-muted">12.7%</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 nx-bg-yellow-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold" style="color: var(--nexus-accent-orange);">Microsoft Corporation</h4>
                        <p class="text-sm nx-text-secondary">軟體與授權</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold" style="color: var(--nexus-accent-orange);">$1,950,000</div>
                        <div class="text-sm nx-text-muted">10.6%</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Top 5 採購商品 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-accent-blue);">📦 Top 5 採購商品</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-4 nx-bg-blue-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold" style="color: var(--nexus-accent-blue);">iPhone 15 系列</h4>
                        <p class="text-sm nx-text-secondary">智慧型手機</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold" style="color: var(--nexus-accent-blue);">$3,450,000</div>
                        <div class="text-sm nx-text-muted">420 台</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 nx-bg-purple-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold" style="color: var(--nexus-accent-purple);">MacBook Pro</h4>
                        <p class="text-sm nx-text-secondary">筆記型電腦</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold" style="color: var(--nexus-accent-purple);">$2,680,000</div>
                        <div class="text-sm nx-text-muted">150 台</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 nx-bg-green-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold" style="color: var(--nexus-accent-green);">iPad Pro</h4>
                        <p class="text-sm nx-text-secondary">平板電腦</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold" style="color: var(--nexus-accent-green);">$1,950,000</div>
                        <div class="text-sm nx-text-muted">280 台</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 nx-bg-orange-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold" style="color: var(--nexus-accent-orange);">Dell OptiPlex</h4>
                        <p class="text-sm nx-text-secondary">桌上型電腦</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold" style="color: var(--nexus-accent-orange);">$1,580,000</div>
                        <div class="text-sm nx-text-muted">320 台</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 nx-bg-red-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold" style="color: var(--nexus-accent-red);">Samsung Monitor</h4>
                        <p class="text-sm nx-text-secondary">顯示器</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold" style="color: var(--nexus-accent-red);">$1,120,000</div>
                        <div class="text-sm nx-text-muted">480 台</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 採購訂單狀態分析 -->
    <div class="nx-card mb-8">
        <h3 class="text-xl font-semibold mb-6 nx-text-primary">採購訂單狀態分析</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div class="text-center">
                <div class="rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-3" style="background-color: rgba(245, 158, 11, 0.2);">
                    <span class="text-2xl font-bold" style="color: var(--nexus-accent-orange);">156</span>
                </div>
                <h4 class="font-semibold" style="color: var(--nexus-accent-orange);">待確認</h4>
                <p class="text-sm nx-text-muted">$3,240,000</p>
            </div>
            
            <div class="text-center">
                <div class="rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-3" style="background-color: rgba(59, 130, 246, 0.2);">
                    <span class="text-2xl font-bold" style="color: var(--nexus-accent-blue);">298</span>
                </div>
                <h4 class="font-semibold" style="color: var(--nexus-accent-blue);">進行中</h4>
                <p class="text-sm nx-text-muted">$6,890,000</p>
            </div>
            
            <div class="text-center">
                <div class="rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-3" style="background-color: rgba(245, 158, 11, 0.2);">
                    <span class="text-2xl font-bold" style="color: var(--nexus-accent-orange);">189</span>
                </div>
                <h4 class="font-semibold" style="color: var(--nexus-accent-orange);">待收貨</h4>
                <p class="text-sm nx-text-muted">$4,250,000</p>
            </div>
            
            <div class="text-center">
                <div class="rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-3" style="background-color: rgba(16, 185, 129, 0.2);">
                    <span class="text-2xl font-bold" style="color: var(--nexus-accent-green);">198</span>
                </div>
                <h4 class="font-semibold" style="color: var(--nexus-accent-green);">已完成</h4>
                <p class="text-sm nx-text-muted">$3,850,000</p>
            </div>
            
            <div class="text-center">
                <div class="rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-3" style="background-color: rgba(239, 68, 68, 0.2);">
                    <span class="text-2xl font-bold" style="color: var(--nexus-accent-red);">15</span>
                </div>
                <h4 class="font-semibold" style="color: var(--nexus-accent-red);">已取消</h4>
                <p class="text-sm nx-text-muted">$220,000</p>
            </div>
        </div>
    </div>

    <!-- 採購績效指標 -->
    <div class="nx-bg-blue-50 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4" style="color: var(--nexus-accent-blue);">採購績效指標</h4>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="text-center">
                <div class="text-2xl font-bold mb-2" style="color: var(--nexus-accent-green);">96.8%</div>
                <div class="text-sm nx-text-secondary">準時交貨率</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold mb-2" style="color: var(--nexus-accent-blue);">98.2%</div>
                <div class="text-sm nx-text-secondary">品質合格率</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold mb-2" style="color: var(--nexus-accent-purple);">12.5天</div>
                <div class="text-sm nx-text-secondary">平均交期</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold mb-2" style="color: var(--nexus-accent-orange);">8.3%</div>
                <div class="text-sm nx-text-secondary">成本節省率</div>
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
    Chart.defaults.plugins.legend.labels.color = darkTheme.textPrimary;
    Chart.defaults.scales.linear.ticks.color = darkTheme.textSecondary;
    Chart.defaults.scales.category.ticks.color = darkTheme.textSecondary;
    Chart.defaults.scales.linear.grid.color = 'rgba(148, 163, 184, 0.1)';
    Chart.defaults.scales.category.grid.color = 'rgba(148, 163, 184, 0.1)';

    // 月度採購金額趨勢圖
    const purchaseTrendCtx = document.getElementById('purchaseTrendChart');
    if (purchaseTrendCtx) {
        new Chart(purchaseTrendCtx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                datasets: [{
                    label: '採購金額 (萬元)',
                    data: [1245, 1380, 1560, 1420, 1680, 1750, 1890, 1845, 1920, 1680, 1750, 1845],
                    borderColor: darkTheme.purple,
                    backgroundColor: `${darkTheme.purple}20`,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: darkTheme.purple,
                    pointBorderColor: darkTheme.textPrimary,
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: darkTheme.textPrimary,
                            font: {
                                size: 14,
                                weight: '500'
                            },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: darkTheme.cardBg,
                        titleColor: darkTheme.textPrimary,
                        bodyColor: darkTheme.textSecondary,
                        borderColor: darkTheme.purple,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: darkTheme.textSecondary,
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return '$' + value + '萬';
                            }
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: darkTheme.textSecondary,
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // 採購商品分類佔比圓餅圖
    const categoryPieCtx = document.getElementById('categoryPieChart');
    if (categoryPieCtx) {
        new Chart(categoryPieCtx, {
            type: 'doughnut',
            data: {
                labels: ['消費電子', '辦公設備', '工業設備', '軟體授權', '其他'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        darkTheme.blue,
                        darkTheme.green,
                        darkTheme.purple,
                        darkTheme.orange,
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
                        borderColor: darkTheme.purple,
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