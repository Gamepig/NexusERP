@extends('layouts.app')

@section('title', '供應商採購分析')

@section('content')
@include('components.reports-style')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <div class="flex items-center mb-4">
            <a href="{{ route('reports.purchase.index') }}" class="text-blue-600 hover:text-blue-800 mr-2">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
            </a>
            <nav class="text-sm breadcrumbs">
                <a href="{{ route('reports.index') }}" class="text-blue-600 hover:text-blue-800">報表中心</a>
                <span class="mx-2 nx-text-muted">></span>
                <a href="{{ route('reports.purchase.index') }}" class="text-blue-600 hover:text-blue-800">採購報表</a>
                <span class="mx-2 nx-text-muted">></span>
                <span class="nx-text-secondary">供應商分析</span>
            </nav>
        </div>
        <h1 class="text-3xl font-bold mb-2">🏢 供應商採購分析</h1>
        <p class="nx-text-secondary">供應商績效評估與合作關係分析</p>
    </div>

    <!-- 供應商統計摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">合作供應商數</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">45</p>
            <p class="text-sm nx-text-muted mt-2">活躍供應商</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">最大供應商佔比</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-green);">23.2%</p>
            <p class="text-sm nx-text-muted mt-2">Apple Inc.</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">平均交貨天數</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">12.5</p>
            <p class="text-sm nx-text-muted mt-2">天/平均交期</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">供應商評級</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-orange);">A+</p>
            <p class="text-sm nx-text-muted mt-2">整體平均評級</p>
        </div>
    </div>

    <!-- 供應商績效圖表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 供應商採購金額排行 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 nx-text-primary">供應商採購金額排行</h3>
            <div class="h-64 rounded">
                <canvas id="supplierAmountChart"></canvas>
            </div>
        </div>

        <!-- 供應商績效評分 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 nx-text-primary">供應商績效評分分佈</h3>
            <div class="h-64 rounded">
                <canvas id="supplierRatingChart"></canvas>
            </div>
        </div>
    </div>

    <!-- 供應商詳細分析 -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-xl font-semibold mb-6">供應商績效詳細分析</h3>
        
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">供應商名稱</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">採購金額</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">佔比</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">訂單數</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">準時交貨率</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">品質評分</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均交期</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">綜合評級</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Apple Inc.</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$4,280,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">23.2%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">156</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">98.5%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">9.2/10</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8天</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">A+</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Samsung Electronics</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$3,150,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">17.1%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">189</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">96.8%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">8.8/10</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12天</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">A</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Intel Corporation</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$2,890,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15.7%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">142</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">97.2%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">9.0/10</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10天</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">A+</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Dell Technologies</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$2,340,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12.7%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">98</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">94.5%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">8.2/10</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15天</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">B+</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Microsoft Corporation</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$1,950,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10.6%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">78</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">99.2%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">9.5/10</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5天</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">A+</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">HP Inc.</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$1,650,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8.9%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">112</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">92.8%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">7.8/10</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18天</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">B</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 供應商風險評估 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 高績效供應商 -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-green-600">⭐ 優秀供應商</h3>
            
            <div class="space-y-4">
                <div class="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-green-800">Apple Inc.</h4>
                            <p class="text-sm text-green-700">準時交貨率 98.5%，品質評分 9.2/10</p>
                        </div>
                        <div class="text-green-600 font-bold">A+</div>
                    </div>
                    <div class="mt-2 text-xs text-green-600">
                        <span class="bg-green-100 px-2 py-1 rounded mr-1">穩定供應</span>
                        <span class="bg-green-100 px-2 py-1 rounded mr-1">優質產品</span>
                        <span class="bg-green-100 px-2 py-1 rounded">快速交貨</span>
                    </div>
                </div>
                
                <div class="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-blue-800">Intel Corporation</h4>
                            <p class="text-sm text-blue-700">準時交貨率 97.2%，品質評分 9.0/10</p>
                        </div>
                        <div class="text-blue-600 font-bold">A+</div>
                    </div>
                    <div class="mt-2 text-xs text-blue-600">
                        <span class="bg-blue-100 px-2 py-1 rounded mr-1">技術領先</span>
                        <span class="bg-blue-100 px-2 py-1 rounded mr-1">可靠夥伴</span>
                        <span class="bg-blue-100 px-2 py-1 rounded">創新產品</span>
                    </div>
                </div>
                
                <div class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-purple-800">Microsoft Corporation</h4>
                            <p class="text-sm text-purple-700">準時交貨率 99.2%，品質評分 9.5/10</p>
                        </div>
                        <div class="text-purple-600 font-bold">A+</div>
                    </div>
                    <div class="mt-2 text-xs text-purple-600">
                        <span class="bg-purple-100 px-2 py-1 rounded mr-1">軟體專家</span>
                        <span class="bg-purple-100 px-2 py-1 rounded mr-1">服務優秀</span>
                        <span class="bg-purple-100 px-2 py-1 rounded">快速響應</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 需要改善的供應商 -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-orange-600">⚠️ 需要改善的供應商</h3>
            
            <div class="space-y-4">
                <div class="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-yellow-800">HP Inc.</h4>
                            <p class="text-sm text-yellow-700">準時交貨率 92.8%，品質評分 7.8/10</p>
                        </div>
                        <div class="text-yellow-600 font-bold">B</div>
                    </div>
                    <div class="mt-2 text-xs text-yellow-600">
                        <span class="bg-yellow-100 px-2 py-1 rounded mr-1">交期延遲</span>
                        <span class="bg-yellow-100 px-2 py-1 rounded mr-1">品質待改善</span>
                    </div>
                    <div class="mt-2 text-sm text-yellow-800">
                        <strong>改善建議：</strong>加強交期管控，提升品質標準
                    </div>
                </div>
                
                <div class="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-orange-800">Dell Technologies</h4>
                            <p class="text-sm text-orange-700">準時交貨率 94.5%，交期較長</p>
                        </div>
                        <div class="text-orange-600 font-bold">B+</div>
                    </div>
                    <div class="mt-2 text-xs text-orange-600">
                        <span class="bg-orange-100 px-2 py-1 rounded mr-1">交期較長</span>
                        <span class="bg-orange-100 px-2 py-1 rounded mr-1">成本偏高</span>
                    </div>
                    <div class="mt-2 text-sm text-orange-800">
                        <strong>改善建議：</strong>縮短交期，優化成本結構
                    </div>
                </div>
                
                <div class="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-red-800">ABC Electronics</h4>
                            <p class="text-sm text-red-700">準時交貨率 85.2%，需密切關注</p>
                        </div>
                        <div class="text-red-600 font-bold">C+</div>
                    </div>
                    <div class="mt-2 text-xs text-red-600">
                        <span class="bg-red-100 px-2 py-1 rounded mr-1">高風險</span>
                        <span class="bg-red-100 px-2 py-1 rounded mr-1">頻繁延遲</span>
                    </div>
                    <div class="mt-2 text-sm text-red-800">
                        <strong>改善建議：</strong>考慮更換供應商或加強管理
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 供應商管理建議 -->
    <div class="bg-blue-50 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4 text-blue-800">供應商管理建議</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <h5 class="font-semibold mb-2 text-green-600">優秀供應商維護</h5>
                <p class="text-sm text-blue-700">加強與 A+ 級供應商的戰略合作關係，給予更多業務機會</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-orange-600">供應商輔導改善</h5>
                <p class="text-sm text-blue-700">協助 B 級供應商改善品質和交期，建立改善計劃</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-purple-600">供應鏈風險管控</h5>
                <p class="text-sm text-blue-700">建立供應商多元化策略，降低單一供應商依賴風險</p>
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

    // 供應商採購金額排行圖
    const amountCtx = document.getElementById('supplierAmountChart');
    if (amountCtx) {
        new Chart(amountCtx, {
            type: 'bar',
            data: {
                labels: ['Apple Inc.', 'Samsung', 'Intel Corp.', 'Dell Tech.', 'Microsoft', 'HP Inc.'],
                datasets: [{
                    label: '採購金額 (USD)',
                    data: [4280000, 3150000, 2890000, 2340000, 1950000, 1650000],
                    backgroundColor: [
                        darkTheme.green,
                        darkTheme.blue,
                        darkTheme.purple,
                        darkTheme.orange,
                        darkTheme.cyan,
                        darkTheme.pink
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
                        display: false
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
                                return `採購金額: $${context.parsed.y.toLocaleString()}`;
                            }
                        }
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
                                return '$' + (value / 1000000).toFixed(1) + 'M';
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

    // 供應商績效評分分佈圖
    const ratingCtx = document.getElementById('supplierRatingChart');
    if (ratingCtx) {
        new Chart(ratingCtx, {
            type: 'doughnut',
            data: {
                labels: ['A+ 等級', 'A 等級', 'B+ 等級', 'B 等級', 'C+ 等級'],
                datasets: [{
                    data: [35, 28, 22, 12, 3],
                    backgroundColor: [
                        darkTheme.green,
                        darkTheme.blue,
                        darkTheme.cyan,
                        darkTheme.orange,
                        darkTheme.red
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