@extends('layouts.app')

@section('title', '庫存週轉率報表')

@section('content')
@include('components.reports-style')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">🔄 庫存週轉率報表</h1>
        <p class="nx-text-secondary">庫存週轉效率分析與優化建議</p>
    </div>

    <!-- 週轉率統計 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">平均週轉天數</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">45</p>
            <p class="text-sm nx-text-muted mt-2">天/週轉一次</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">年週轉次數</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-green);">8.1</p>
            <p class="text-sm nx-text-muted mt-2">次/年</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">快速週轉商品</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">24</p>
            <p class="text-sm nx-text-muted mt-2">高效率商品</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">滯銷商品</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-red);">12</p>
            <p class="text-sm nx-text-muted mt-2">需要關注</p>
        </div>
    </div>

    <!-- 週轉率分析圖表 -->
    <div class="nx-card mb-8">
        <h3 class="text-xl font-semibold mb-6 nx-text-primary">月度週轉率趨勢</h3>
        <div class="h-64 rounded">
            <canvas id="turnoverTrendChart"></canvas>
        </div>
    </div>

    <!-- 商品週轉率排行 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 高週轉率商品 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-accent-green);">🚀 高週轉率商品 Top 10</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 nx-bg-green-50 rounded">
                    <div>
                        <div class="font-semibold nx-text-primary">智慧型手機 X1</div>
                        <div class="text-sm nx-text-secondary">週轉天數: 15天</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-green);">24.3次/年</div>
                </div>
                
                <div class="flex justify-between items-center p-3 nx-bg-green-50 rounded">
                    <div>
                        <div class="font-semibold nx-text-primary">無線耳機 A2</div>
                        <div class="text-sm nx-text-secondary">週轉天數: 18天</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-green);">20.3次/年</div>
                </div>
                
                <div class="flex justify-between items-center p-3 nx-bg-green-50 rounded">
                    <div>
                        <div class="font-semibold nx-text-primary">充電線 B3</div>
                        <div class="text-sm nx-text-secondary">週轉天數: 22天</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-green);">16.6次/年</div>
                </div>
            </div>
        </div>

        <!-- 低週轉率商品 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-accent-red);">⚠️ 低週轉率商品 Top 10</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 nx-bg-red-50 rounded">
                    <div>
                        <div class="font-semibold nx-text-primary">高階相機 Z1</div>
                        <div class="text-sm nx-text-secondary">週轉天數: 180天</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-red);">2.0次/年</div>
                </div>
                
                <div class="flex justify-between items-center p-3 nx-bg-red-50 rounded">
                    <div>
                        <div class="font-semibold nx-text-primary">專業顯示器 Y2</div>
                        <div class="text-sm nx-text-secondary">週轉天數: 150天</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-red);">2.4次/年</div>
                </div>
                
                <div class="flex justify-between items-center p-3 nx-bg-red-50 rounded">
                    <div>
                        <div class="font-semibold nx-text-primary">工作站主機 X3</div>
                        <div class="text-sm nx-text-secondary">週轉天數: 120天</div>
                    </div>
                    <div class="font-bold" style="color: var(--nexus-accent-red);">3.0次/年</div>
                </div>
            </div>
        </div>
    </div>

    <!-- 週轉率指標說明 -->
    <div class="mt-8 nx-bg-blue-50 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4" style="color: var(--nexus-accent-blue);">週轉率指標說明</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" style="color: var(--nexus-accent-blue);">
            <div>
                <h5 class="font-semibold mb-2" style="color: var(--nexus-accent-green);">優秀 (>12次/年)</h5>
                <p class="nx-text-secondary">週轉天數少於30天，資金利用效率高</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2" style="color: var(--nexus-accent-orange);">正常 (6-12次/年)</h5>
                <p class="nx-text-secondary">週轉天數30-60天，正常庫存水準</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2" style="color: var(--nexus-accent-red);">需改善 (<6次/年)</h5>
                <p class="nx-text-secondary">週轉天數超過60天，需要優化策略</p>
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

    // 月度週轉率趨勢圖
    const turnoverCtx = document.getElementById('turnoverTrendChart');
    if (turnoverCtx) {
        new Chart(turnoverCtx, {
            type: 'bar',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                datasets: [{
                    label: '週轉次數 (次/月)',
                    data: [2.1, 2.3, 2.8, 2.5, 3.1, 2.9, 3.2, 2.8, 3.0, 2.7, 2.4, 2.6],
                    backgroundColor: [
                        darkTheme.green, darkTheme.green, darkTheme.blue, darkTheme.green,
                        darkTheme.blue, darkTheme.green, darkTheme.blue, darkTheme.green,
                        darkTheme.blue, darkTheme.green, darkTheme.orange, darkTheme.green
                    ],
                    borderColor: darkTheme.textPrimary,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
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
                        borderColor: darkTheme.blue,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return `週轉次數: ${context.parsed.y} 次`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4,
                        ticks: {
                            color: darkTheme.textSecondary,
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value + ' 次';
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
});
</script>
@endpush

@endsection