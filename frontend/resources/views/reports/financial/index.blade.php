@extends('layouts.app')

@section('title', '財務報表總覽')

@section('content')
@include('components.reports-style')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2" style="color: var(--nexus-text-primary);">💼 財務報表總覽</h1>
        <p class="nx-text-accent">企業財務狀況綜合分析</p>
    </div>

    <!-- 財務指標摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">本月營收</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-green);">$2,450,000</p>
            <p class="text-sm nx-text-muted mt-2">較上月 +12.5%</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">本月支出</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-red);">$1,890,000</p>
            <p class="text-sm nx-text-muted mt-2">較上月 +8.3%</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">淨利潤</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">$560,000</p>
            <p class="text-sm nx-text-muted mt-2">利潤率 22.9%</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">現金流</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">$1,200,000</p>
            <p class="text-sm nx-text-muted mt-2">可用資金</p>
        </div>
    </div>

    <!-- 財務圖表概覽 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 營收趨勢 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">營收與利潤趨勢</h3>
            <div class="h-64 rounded">
                <canvas id="revenueChart"></canvas>
            </div>
        </div>

        <!-- 費用結構 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">費用結構分析</h3>
            <div class="h-64 rounded">
                <canvas id="expenseChart"></canvas>
            </div>
        </div>
    </div>

    <!-- 應收應付款摘要 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 應收帳款 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-accent-blue);">📈 應收帳款狀況</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 nx-bg-blue-50 rounded">
                    <div>
                        <div class="font-semibold" style="color: var(--nexus-text-primary);">30天內</div>
                        <div class="text-sm nx-text-muted">正常收款期</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-blue);">$890,000</div>
                </div>
                
                <div class="flex justify-between items-center p-3 nx-bg-yellow-50 rounded">
                    <div>
                        <div class="font-semibold" style="color: var(--nexus-text-primary);">31-60天</div>
                        <div class="text-sm nx-text-muted">需要關注</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-orange);">$340,000</div>
                </div>
                
                <div class="flex justify-between items-center p-3 nx-bg-red-50 rounded">
                    <div>
                        <div class="font-semibold" style="color: var(--nexus-text-primary);">60天以上</div>
                        <div class="text-sm nx-text-muted">逾期帳款</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-red);">$125,000</div>
                </div>
            </div>
            
            <div class="mt-4 pt-4" style="border-top: 1px solid var(--nexus-border-primary);">
                <div class="flex justify-between text-lg font-semibold">
                    <span style="color: var(--nexus-text-primary);">應收帳款總計</span>
                    <span style="color: var(--nexus-accent-blue);">$1,355,000</span>
                </div>
            </div>
        </div>

        <!-- 應付帳款 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-accent-orange);">📉 應付帳款狀況</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 nx-bg-green-50 rounded">
                    <div>
                        <div class="font-semibold" style="color: var(--nexus-text-primary);">30天內</div>
                        <div class="text-sm nx-text-muted">正常付款期</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-green);">$620,000</div>
                </div>
                
                <div class="flex justify-between items-center p-3 nx-bg-yellow-50 rounded">
                    <div>
                        <div class="font-semibold" style="color: var(--nexus-text-primary);">31-60天</div>
                        <div class="text-sm nx-text-muted">需要安排</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-orange);">$280,000</div>
                </div>
                
                <div class="flex justify-between items-center p-3 nx-bg-red-50 rounded">
                    <div>
                        <div class="font-semibold" style="color: var(--nexus-text-primary);">60天以上</div>
                        <div class="text-sm nx-text-muted">逾期應付</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-red);">$95,000</div>
                </div>
            </div>
            
            <div class="mt-4 pt-4" style="border-top: 1px solid var(--nexus-border-primary);">
                <div class="flex justify-between text-lg font-semibold">
                    <span style="color: var(--nexus-text-primary);">應付帳款總計</span>
                    <span style="color: var(--nexus-accent-orange);">$995,000</span>
                </div>
            </div>
        </div>
    </div>

    <!-- 快速導航 -->
    <div class="nx-card">
        <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">財務報表快速導航</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="{{ route('reports.financial.profit-loss') }}" class="nx-bg-green-50 hover:opacity-80 p-4 rounded-lg text-center transition-colors">
                <div class="font-semibold" style="color: var(--nexus-accent-green);">損益表</div>
                <div class="text-sm nx-text-muted mt-1">收入支出分析</div>
            </a>
            <a href="{{ route('reports.financial.cash-flow') }}" class="nx-bg-blue-50 hover:opacity-80 p-4 rounded-lg text-center transition-colors">
                <div class="font-semibold" style="color: var(--nexus-accent-blue);">現金流量表</div>
                <div class="text-sm nx-text-muted mt-1">資金流動分析</div>
            </a>
            <a href="{{ route('reports.financial.accounts-receivable') }}" class="nx-bg-purple-50 hover:opacity-80 p-4 rounded-lg text-center transition-colors">
                <div class="font-semibold" style="color: var(--nexus-accent-purple);">應收帳款</div>
                <div class="text-sm nx-text-muted mt-1">客戶欠款管理</div>
            </a>
            <a href="{{ route('reports.financial.accounts-payable') }}" class="nx-bg-orange-50 hover:opacity-80 p-4 rounded-lg text-center transition-colors">
                <div class="font-semibold" style="color: var(--nexus-accent-orange);">應付帳款</div>
                <div class="text-sm nx-text-muted mt-1">供應商付款管理</div>
            </a>
        </div>
    </div>

    <!-- 財務健康指標 -->
    <div class="mt-8 nx-bg-blue-50 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4" style="color: var(--nexus-accent-blue);">財務健康度指標</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
                <div class="text-2xl font-bold mb-2" style="color: var(--nexus-accent-green);">A-</div>
                <div class="text-sm nx-text-muted">整體財務評級</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold mb-2" style="color: var(--nexus-accent-blue);">1.36</div>
                <div class="text-sm nx-text-muted">流動比率</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold mb-2" style="color: var(--nexus-accent-purple);">15.2天</div>
                <div class="text-sm nx-text-muted">平均收款期</div>
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

    // 營收與利潤趨勢圖
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                datasets: [{
                    label: '營收 (萬元)',
                    data: [245, 220, 280, 310, 295, 340, 285, 315, 350, 320, 365, 245],
                    borderColor: darkTheme.green,
                    backgroundColor: `${darkTheme.green}20`,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: darkTheme.green,
                    pointBorderColor: darkTheme.textPrimary,
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: '利潤 (萬元)',
                    data: [45, 38, 62, 78, 65, 85, 68, 75, 89, 82, 95, 56],
                    borderColor: darkTheme.blue,
                    backgroundColor: `${darkTheme.blue}20`,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: darkTheme.blue,
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
                        borderColor: darkTheme.green,
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

    // 費用結構分析圓餅圖
    const expenseCtx = document.getElementById('expenseChart');
    if (expenseCtx) {
        new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: ['營運費用', '人事成本', '行銷費用', '管理費用', '其他費用'],
                datasets: [{
                    data: [35, 28, 20, 12, 5],
                    backgroundColor: [
                        darkTheme.blue,
                        darkTheme.orange,
                        darkTheme.purple,
                        darkTheme.green,
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
                        borderColor: darkTheme.blue,
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