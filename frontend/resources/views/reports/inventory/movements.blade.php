@extends('layouts.app')

@section('title', '庫存異動記錄報表')

@section('content')
@include('components.reports-style')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">📊 庫存異動記錄報表</h1>
        <p class="text-gray-600">庫存進出異動追蹤與分析</p>
    </div>

    <!-- 異動統計摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">本月進貨</h3>
            <p class="text-3xl font-bold text-green-600">1,254</p>
            <p class="text-sm text-gray-500 mt-2">件商品</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">本月出貨</h3>
            <p class="text-3xl font-bold text-blue-600">1,186</p>
            <p class="text-sm text-gray-500 mt-2">件商品</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">庫存調整</h3>
            <p class="text-3xl font-bold text-orange-600">23</p>
            <p class="text-sm text-gray-500 mt-2">次調整</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">淨增長</h3>
            <p class="text-3xl font-bold text-purple-600">+68</p>
            <p class="text-sm text-gray-500 mt-2">件商品</p>
        </div>
    </div>

    <!-- 異動趨勢圖表 -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-xl font-semibold mb-6">每日異動趨勢</h3>
        <div class="h-64 rounded">
            <canvas id="movementTrendChart"></canvas>
        </div>
    </div>

    <!-- 篩選控制 -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-xl font-semibold mb-6">異動記錄篩選</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">異動類型</label>
                <select class="w-full border border-gray-300 rounded-md p-2">
                    <option value="">全部類型</option>
                    <option value="in">進貨入庫</option>
                    <option value="out">銷售出庫</option>
                    <option value="adjust">庫存調整</option>
                    <option value="transfer">調撥</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">商品類別</label>
                <select class="w-full border border-gray-300 rounded-md p-2">
                    <option value="">全部類別</option>
                    <option value="electronics">電子產品</option>
                    <option value="accessories">配件</option>
                    <option value="software">軟體</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">開始日期</label>
                <input type="date" class="w-full border border-gray-300 rounded-md p-2">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">結束日期</label>
                <input type="date" class="w-full border border-gray-300 rounded-md p-2">
            </div>
        </div>
        
        <div class="mt-4">
            <button class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">查詢</button>
            <button class="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 ml-2">重置</button>
        </div>
    </div>

    <!-- 詳細異動記錄 -->
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-xl font-semibold mb-6">庫存異動詳細記錄</h3>
        
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期時間</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名稱</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">異動類型</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">異動數量</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">異動前庫存</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">異動後庫存</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人員</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">備註</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-15 14:30</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">筆記型電腦 A1</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">進貨入庫</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">+50</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">150</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">張小明</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">採購單 #PO001</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-15 16:45</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">智慧型手機 B2</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">銷售出庫</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">-15</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">300</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">285</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">李小華</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">銷售單 #SO001</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-16 09:15</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">平板電腦 C3</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">庫存調整</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">-2</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">200</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">198</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">王大明</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">盤點發現短缺</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-16 11:30</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">無線滑鼠 D4</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">調撥</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-orange-600">-25/+25</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">500</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">475</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">陳小花</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">調撥至台中倉</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- 分頁控制 -->
        <div class="mt-6 flex justify-between items-center">
            <div class="text-sm text-gray-700">
                顯示 1-20 筆，共 156 筆記錄
            </div>
            <div class="flex space-x-2">
                <button class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">上一頁</button>
                <button class="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
                <button class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">2</button>
                <button class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">3</button>
                <button class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">下一頁</button>
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

    // 每日異動趨勢圖
    const movementCtx = document.getElementById('movementTrendChart');
    if (movementCtx) {
        new Chart(movementCtx, {
            type: 'line',
            data: {
                labels: ['1/10', '1/11', '1/12', '1/13', '1/14', '1/15', '1/16', '1/17', '1/18', '1/19', '1/20', '1/21'],
                datasets: [{
                    label: '進貨',
                    data: [45, 52, 38, 67, 73, 58, 49, 61, 54, 69, 48, 63],
                    borderColor: darkTheme.green,
                    backgroundColor: `${darkTheme.green}20`,
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: darkTheme.green,
                    pointBorderColor: darkTheme.textPrimary,
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }, {
                    label: '出貨',
                    data: [42, 48, 35, 63, 71, 55, 46, 58, 51, 66, 45, 60],
                    borderColor: darkTheme.blue,
                    backgroundColor: `${darkTheme.blue}20`,
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: darkTheme.blue,
                    pointBorderColor: darkTheme.textPrimary,
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }, {
                    label: '調整',
                    data: [2, 1, 3, 0, 2, 4, 1, 2, 0, 1, 3, 2],
                    borderColor: darkTheme.orange,
                    backgroundColor: `${darkTheme.orange}20`,
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: darkTheme.orange,
                    pointBorderColor: darkTheme.textPrimary,
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
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
                                return value + ' 件';
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