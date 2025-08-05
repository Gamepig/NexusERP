@extends('layouts.app')

@section('title', '採購商品分析')

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
                <span class="nx-text-secondary">商品分析</span>
            </nav>
        </div>
        <h1 class="text-3xl font-bold mb-2">📦 採購商品分析</h1>
        <p class="nx-text-secondary">採購商品統計與成本分析</p>
    </div>

    <!-- 採購商品統計摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">採購商品類別</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">8</p>
            <p class="text-sm nx-text-muted mt-2">主要商品類別</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">採購商品數量</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-green);">2,156</p>
            <p class="text-sm nx-text-muted mt-2">本月採購</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">平均單價</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">$8,560</p>
            <p class="text-sm nx-text-muted mt-2">商品平均成本</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">成本節省</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-orange);">8.3%</p>
            <p class="text-sm nx-text-muted mt-2">較去年同期</p>
        </div>
    </div>

    <!-- 採購商品圖表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 商品採購金額排行 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 nx-text-primary">商品採購金額 Top 10</h3>
            <div class="h-64 rounded">
                <canvas id="productAmountChart"></canvas>
            </div>
        </div>

        <!-- 商品分類成本佔比 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 nx-text-primary">商品分類成本佔比</h3>
            <div class="h-64 rounded">
                <canvas id="productCategoryChart"></canvas>
            </div>
        </div>
    </div>

    <!-- 商品採購詳細分析 -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-xl font-semibold mb-6">商品採購詳細分析</h3>
        
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名稱</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品分類</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">採購數量</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均單價</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">總採購金額</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">主要供應商</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成本趨勢</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">佔比</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">iPhone 15 Pro Max</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">智慧型手機</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">420</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$32,100</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$13,482,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Apple Inc.</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="text-green-600 font-semibold">↗ -2.5%</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18.7%</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">MacBook Pro 16"</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">筆記型電腦</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">150</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$67,900</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$10,185,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Apple Inc.</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="text-red-600 font-semibold">↗ +3.2%</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">14.1%</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Samsung 4K Monitor</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">顯示器</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">480</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$15,800</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$7,584,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Samsung</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="text-green-600 font-semibold">↗ -5.8%</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10.5%</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Dell OptiPlex 7090</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">桌上型電腦</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">320</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$18,500</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$5,920,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dell</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="text-green-600 font-semibold">↗ -4.1%</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8.2%</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">iPad Pro 12.9"</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">平板電腦</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">280</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$31,900</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$8,932,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Apple Inc.</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="text-green-600 font-semibold">↗ -1.8%</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12.4%</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Microsoft Surface Pro</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">平板電腦</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">180</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$28,900</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">$5,202,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Microsoft</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="text-yellow-600 font-semibold">→ ±0%</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">7.2%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 成本分析與策略建議 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 成本節省商品 -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-green-600">💰 成本節省明星商品</h3>
            
            <div class="space-y-4">
                <div class="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-green-800">Samsung 4K Monitor</h4>
                            <p class="text-sm text-green-700">成本降低 5.8%，節省 $465,000</p>
                        </div>
                        <div class="text-green-600 font-bold">↗ -5.8%</div>
                    </div>
                    <div class="mt-2 text-xs text-green-600">
                        <span class="bg-green-100 px-2 py-1 rounded mr-1">價格談判成功</span>
                        <span class="bg-green-100 px-2 py-1 rounded">規模經濟</span>
                    </div>
                </div>
                
                <div class="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-blue-800">Dell OptiPlex 7090</h4>
                            <p class="text-sm text-blue-700">成本降低 4.1%，節省 $252,000</p>
                        </div>
                        <div class="text-blue-600 font-bold">↗ -4.1%</div>
                    </div>
                    <div class="mt-2 text-xs text-blue-600">
                        <span class="bg-blue-100 px-2 py-1 rounded mr-1">供應商競爭</span>
                        <span class="bg-blue-100 px-2 py-1 rounded">長期合約</span>
                    </div>
                </div>
                
                <div class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-purple-800">iPhone 15 Pro Max</h4>
                            <p class="text-sm text-purple-700">成本降低 2.5%，節省 $345,000</p>
                        </div>
                        <div class="text-purple-600 font-bold">↗ -2.5%</div>
                    </div>
                    <div class="mt-2 text-xs text-purple-600">
                        <span class="bg-purple-100 px-2 py-1 rounded mr-1">品牌合作</span>
                        <span class="bg-purple-100 px-2 py-1 rounded">大量採購</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 成本上升商品 -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-orange-600">⚠️ 成本上升需關注商品</h3>
            
            <div class="space-y-4">
                <div class="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-red-800">MacBook Pro 16"</h4>
                            <p class="text-sm text-red-700">成本上升 3.2%，增加 $318,000</p>
                        </div>
                        <div class="text-red-600 font-bold">↗ +3.2%</div>
                    </div>
                    <div class="mt-2 text-xs text-red-600">
                        <span class="bg-red-100 px-2 py-1 rounded mr-1">原物料漲價</span>
                        <span class="bg-red-100 px-2 py-1 rounded">新技術成本</span>
                    </div>
                    <div class="mt-2 text-sm text-red-800">
                        <strong>應對策略：</strong>評估替代方案，重新談判價格
                    </div>
                </div>
                
                <div class="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-yellow-800">Microsoft Surface Pro</h4>
                            <p class="text-sm text-yellow-700">成本持平，需監控市場動態</p>
                        </div>
                        <div class="text-yellow-600 font-bold">→ ±0%</div>
                    </div>
                    <div class="mt-2 text-xs text-yellow-600">
                        <span class="bg-yellow-100 px-2 py-1 rounded mr-1">價格穩定</span>
                        <span class="bg-yellow-100 px-2 py-1 rounded">競爭激烈</span>
                    </div>
                    <div class="mt-2 text-sm text-yellow-800">
                        <strong>應對策略：</strong>維持現有供應關係，探索優化空間
                    </div>
                </div>
                
                <div class="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-blue-800">Intel Core i7 處理器</h4>
                            <p class="text-sm text-blue-700">成本上升 2.8%，關鍵零組件</p>
                        </div>
                        <div class="text-blue-600 font-bold">↗ +2.8%</div>
                    </div>
                    <div class="mt-2 text-xs text-blue-600">
                        <span class="bg-blue-100 px-2 py-1 rounded mr-1">供需失衡</span>
                        <span class="bg-blue-100 px-2 py-1 rounded">技術升級</span>
                    </div>
                    <div class="mt-2 text-sm text-blue-800">
                        <strong>應對策略：</strong>鎖定長期價格，考慮 AMD 替代方案
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 商品分類成本分析 -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-xl font-semibold mb-6">商品分類成本分析</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-4 bg-blue-50 rounded-lg text-center">
                <h4 class="font-semibold text-blue-800 mb-2">智慧型手機</h4>
                <div class="text-2xl font-bold text-blue-600 mb-1">$13,482,000</div>
                <div class="text-sm text-gray-600">18.7% 佔比</div>
                <div class="text-xs text-green-600 mt-1">↗ -2.5% 成本下降</div>
            </div>
            
            <div class="p-4 bg-purple-50 rounded-lg text-center">
                <h4 class="font-semibold text-purple-800 mb-2">筆記型電腦</h4>
                <div class="text-2xl font-bold text-purple-600 mb-1">$10,185,000</div>
                <div class="text-sm text-gray-600">14.1% 佔比</div>
                <div class="text-xs text-red-600 mt-1">↗ +3.2% 成本上升</div>
            </div>
            
            <div class="p-4 bg-green-50 rounded-lg text-center">
                <h4 class="font-semibold text-green-800 mb-2">平板電腦</h4>
                <div class="text-2xl font-bold text-green-600 mb-1">$14,134,000</div>
                <div class="text-sm text-gray-600">19.6% 佔比</div>
                <div class="text-xs text-green-600 mt-1">↗ -1.8% 成本下降</div>
            </div>
            
            <div class="p-4 bg-orange-50 rounded-lg text-center">
                <h4 class="font-semibold text-orange-800 mb-2">顯示器</h4>
                <div class="text-2xl font-bold text-orange-600 mb-1">$7,584,000</div>
                <div class="text-sm text-gray-600">10.5% 佔比</div>
                <div class="text-xs text-green-600 mt-1">↗ -5.8% 成本下降</div>
            </div>
        </div>
    </div>

    <!-- 採購策略建議 -->
    <div class="bg-blue-50 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4 text-blue-800">採購商品策略建議</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <h5 class="font-semibold mb-2 text-green-600">成本優化商品</h5>
                <p class="text-sm text-blue-700">持續推動Samsung顯示器、Dell電腦等成本節省商品的策略</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-orange-600">成本上升應對</h5>
                <p class="text-sm text-blue-700">針對MacBook等成本上升商品，評估替代方案並重新談判</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-purple-600">採購組合優化</h5>
                <p class="text-sm text-blue-700">平衡高價值和成本效益商品，優化整體採購組合</p>
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

    // 商品採購金額排行圖
    const productAmountCtx = document.getElementById('productAmountChart');
    if (productAmountCtx) {
        new Chart(productAmountCtx, {
            type: 'bar',
            data: {
                labels: ['iPhone 15 Pro Max', 'MacBook Pro 16"', 'iPad Pro 12.9"', 'Samsung 4K Monitor', 'Dell OptiPlex 7090', 'Microsoft Surface Pro'],
                datasets: [{
                    label: '採購金額 (USD)',
                    data: [13482000, 10185000, 8932000, 7584000, 5920000, 5202000],
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
                            },
                            maxRotation: 45,
                            minRotation: 45
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

    // 商品分類成本佔比圓餅圖
    const categoryCtx = document.getElementById('productCategoryChart');
    if (categoryCtx) {
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['智慧型手機', '平板電腦', '筆記型電腦', '顯示器', '桌上型電腦', '其他'],
                datasets: [{
                    data: [18.7, 19.6, 14.1, 10.5, 8.2, 28.9],
                    backgroundColor: [
                        darkTheme.green,
                        darkTheme.blue,
                        darkTheme.purple,
                        darkTheme.orange,
                        darkTheme.cyan,
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