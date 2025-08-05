@extends('layouts.app')

@section('title', '員工績效分析')

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
                <span class="mx-2 text-gray-500">></span>
                <span class="text-gray-700">員工績效分析</span>
            </nav>
        </div>
        <h1 class="text-3xl font-bold mb-2 nx-text-primary">🏆 員工績效分析</h1>
        <p class="nx-text-secondary">員工績效評估與發展分析</p>
    </div>

    <!-- 績效統計摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">平均績效評分</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">8.2</p>
            <p class="text-sm nx-text-muted mt-2">滿分 10 分</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">優秀員工比例</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-green);">28%</p>
            <p class="text-sm nx-text-muted mt-2">8.5分以上</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">績效改善率</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">15.3%</p>
            <p class="text-sm nx-text-muted mt-2">較上季提升</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">培訓完成率</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-orange);">92%</p>
            <p class="text-sm nx-text-muted mt-2">訓練課程</p>
        </div>
    </div>

    <!-- 績效分析圖表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 績效分佈圖 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 nx-text-primary">員工績效分佈</h3>
            <div class="h-64 rounded">
                <canvas id="performanceDistributionChart"></canvas>
            </div>
        </div>

        <!-- 部門績效比較 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 nx-text-primary">部門績效比較</h3>
            <div class="h-64 rounded">
                <canvas id="departmentPerformanceChart"></canvas>
            </div>
        </div>
    </div>

    <!-- 部門績效統計 -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-xl font-semibold mb-6">部門績效統計</h3>
        
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部門名稱</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">員工數</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均績效</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">優秀員工</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合格率</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目標達成率</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">改善人數</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部門評級</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">研發部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">45</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">8.8</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18人 (40%)</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">96%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">105%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">優秀</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">業務部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">28</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">8.5</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12人 (43%)</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">93%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">112%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">優秀</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">財務部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">8.3</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4人 (33%)</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">100%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">98%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">良好</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">IT部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">20</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">8.1</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5人 (25%)</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">95%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600">88%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">良好</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">行政部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">7.9</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3人 (17%)</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600">89%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600">85%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">2</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">待改善</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">客服部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">25</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-semibold">7.6</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2人 (8%)</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">84%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">76%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">4</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">待改善</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">人事部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-semibold">7.4</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1人 (13%)</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">75%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">68%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">2</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">需改善</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 績效分析與發展建議 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 高績效員工 -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-green-600">🌟 高績效員工</h3>
            
            <div class="space-y-4">
                <div class="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-green-800">張小明</h4>
                            <p class="text-sm text-green-700">研發部 - 資深工程師</p>
                        </div>
                        <div class="text-green-600 font-bold text-xl">9.5</div>
                    </div>
                    <div class="mt-2 text-xs text-green-600">
                        <span class="bg-green-100 px-2 py-1 rounded mr-1">技術創新</span>
                        <span class="bg-green-100 px-2 py-1 rounded mr-1">團隊領導</span>
                        <span class="bg-green-100 px-2 py-1 rounded">專案管理</span>
                    </div>
                    <div class="mt-2 text-sm text-green-800">
                        <strong>發展建議：</strong>培養成為技術專家，考慮晉升管理職
                    </div>
                </div>
                
                <div class="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-blue-800">李美華</h4>
                            <p class="text-sm text-blue-700">業務部 - 業務經理</p>
                        </div>
                        <div class="text-blue-600 font-bold text-xl">9.2</div>
                    </div>
                    <div class="mt-2 text-xs text-blue-600">
                        <span class="bg-blue-100 px-2 py-1 rounded mr-1">銷售達成</span>
                        <span class="bg-blue-100 px-2 py-1 rounded mr-1">客戶維護</span>
                        <span class="bg-blue-100 px-2 py-1 rounded">團隊建設</span>
                    </div>
                    <div class="mt-2 text-sm text-blue-800">
                        <strong>發展建議：</strong>擴大業務責任範圍，培養跨部門協作能力
                    </div>
                </div>
                
                <div class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-purple-800">王大明</h4>
                            <p class="text-sm text-purple-700">IT部 - 系統架構師</p>
                        </div>
                        <div class="text-purple-600 font-bold text-xl">9.0</div>
                    </div>
                    <div class="mt-2 text-xs text-purple-600">
                        <span class="bg-purple-100 px-2 py-1 rounded mr-1">系統設計</span>
                        <span class="bg-purple-100 px-2 py-1 rounded mr-1">問題解決</span>
                        <span class="bg-purple-100 px-2 py-1 rounded">知識分享</span>
                    </div>
                    <div class="mt-2 text-sm text-purple-800">
                        <strong>發展建議：</strong>強化業務理解，成為技術與業務的橋樑
                    </div>
                </div>
            </div>
        </div>

        <!-- 需要改善的員工 -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-orange-600">📈 待提升員工</h3>
            
            <div class="space-y-4">
                <div class="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-yellow-800">林小雨</h4>
                            <p class="text-sm text-yellow-700">客服部 - 客服專員</p>
                        </div>
                        <div class="text-yellow-600 font-bold text-xl">6.8</div>
                    </div>
                    <div class="mt-2 text-xs text-yellow-600">
                        <span class="bg-yellow-100 px-2 py-1 rounded mr-1">溝通技巧</span>
                        <span class="bg-yellow-100 px-2 py-1 rounded mr-1">服務態度</span>
                        <span class="bg-yellow-100 px-2 py-1 rounded">問題處理</span>
                    </div>
                    <div class="mt-2 text-sm text-yellow-800">
                        <strong>改善計劃：</strong>參加客服技巧訓練，安排導師輔導
                    </div>
                </div>
                
                <div class="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-orange-800">黃志強</h4>
                            <p class="text-sm text-orange-700">人事部 - 人事專員</p>
                        </div>
                        <div class="text-orange-600 font-bold text-xl">6.5</div>
                    </div>
                    <div class="mt-2 text-xs text-orange-600">
                        <span class="bg-orange-100 px-2 py-1 rounded mr-1">工作效率</span>
                        <span class="bg-orange-100 px-2 py-1 rounded mr-1">主動性</span>
                        <span class="bg-orange-100 px-2 py-1 rounded">專業知識</span>
                    </div>
                    <div class="mt-2 text-sm text-orange-800">
                        <strong>改善計劃：</strong>強化人事專業訓練，設定明確工作目標
                    </div>
                </div>
                
                <div class="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-red-800">許大勇</h4>
                            <p class="text-sm text-red-700">行政部 - 行政助理</p>
                        </div>
                        <div class="text-red-600 font-bold text-xl">6.2</div>
                    </div>
                    <div class="mt-2 text-xs text-red-600">
                        <span class="bg-red-100 px-2 py-1 rounded mr-1">工作態度</span>
                        <span class="bg-red-100 px-2 py-1 rounded mr-1">時間管理</span>
                        <span class="bg-red-100 px-2 py-1 rounded">執行力</span>
                    </div>
                    <div class="mt-2 text-sm text-red-800">
                        <strong>改善計劃：</strong>個別輔導，建立績效改善計劃(PIP)
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 績效指標分析 -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-xl font-semibold mb-6">關鍵績效指標分析</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- 工作品質 -->
            <div class="text-center p-4 bg-blue-50 rounded-lg">
                <h4 class="font-semibold text-blue-800 mb-3">工作品質</h4>
                <div class="relative pt-1">
                    <div class="flex mb-2 items-center justify-between">
                        <div>
                            <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                優秀
                            </span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-semibold inline-block text-blue-600">
                                85%
                            </span>
                        </div>
                    </div>
                    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                        <div style="width:85%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                    </div>
                </div>
            </div>
            
            <!-- 工作效率 -->
            <div class="text-center p-4 bg-green-50 rounded-lg">
                <h4 class="font-semibold text-green-800 mb-3">工作效率</h4>
                <div class="relative pt-1">
                    <div class="flex mb-2 items-center justify-between">
                        <div>
                            <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                良好
                            </span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-semibold inline-block text-green-600">
                                78%
                            </span>
                        </div>
                    </div>
                    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                        <div style="width:78%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                    </div>
                </div>
            </div>
            
            <!-- 團隊合作 -->
            <div class="text-center p-4 bg-purple-50 rounded-lg">
                <h4 class="font-semibold text-purple-800 mb-3">團隊合作</h4>
                <div class="relative pt-1">
                    <div class="flex mb-2 items-center justify-between">
                        <div>
                            <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                                優秀
                            </span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-semibold inline-block text-purple-600">
                                88%
                            </span>
                        </div>
                    </div>
                    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                        <div style="width:88%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                    </div>
                </div>
            </div>
            
            <!-- 學習發展 -->
            <div class="text-center p-4 bg-orange-50 rounded-lg">
                <h4 class="font-semibold text-orange-800 mb-3">學習發展</h4>
                <div class="relative pt-1">
                    <div class="flex mb-2 items-center justify-between">
                        <div>
                            <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-orange-600 bg-orange-200">
                                待改善
                            </span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-semibold inline-block text-orange-600">
                                72%
                            </span>
                        </div>
                    </div>
                    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-orange-200">
                        <div style="width:72%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 績效管理建議 -->
    <div class="bg-blue-50 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4 text-blue-800">績效管理改善建議</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <h5 class="font-semibold mb-2 text-green-600">優秀員工培養</h5>
                <p class="text-sm text-blue-700">加強高績效員工的職涯發展規劃，提供更多挑戰與成長機會</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-orange-600">績效改善計劃</h5>
                <p class="text-sm text-blue-700">針對低績效員工建立個別改善計劃，提供必要的培訓與支援</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-purple-600">績效評估優化</h5>
                <p class="text-sm text-blue-700">建立更客觀的績效評估標準，定期檢討評估機制的有效性</p>
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

    // 員工績效分佈圖
    const distributionCtx = document.getElementById('performanceDistributionChart');
    if (distributionCtx) {
        new Chart(distributionCtx, {
            type: 'doughnut',
            data: {
                labels: ['優秀 (8.5+)', '良好 (7.5-8.4)', '合格 (6.5-7.4)', '待改善 (<6.5)'],
                datasets: [{
                    data: [28, 42, 25, 5],
                    backgroundColor: [
                        darkTheme.green,
                        darkTheme.blue,
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

    // 部門績效比較圖
    const departmentCtx = document.getElementById('departmentPerformanceChart');
    if (departmentCtx) {
        new Chart(departmentCtx, {
            type: 'bar',
            data: {
                labels: ['研發部', '業務部', '財務部', 'IT部', '行政部', '客服部', '人事部'],
                datasets: [{
                    label: '平均績效評分',
                    data: [8.8, 8.5, 8.3, 8.1, 7.9, 7.6, 7.4],
                    backgroundColor: [
                        darkTheme.green,
                        darkTheme.green,
                        darkTheme.blue,
                        darkTheme.blue,
                        darkTheme.orange,
                        darkTheme.orange,
                        darkTheme.red
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
                                return `平均績效: ${context.parsed.y} 分`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 6,
                        max: 10,
                        ticks: {
                            color: darkTheme.textSecondary,
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value + ' 分';
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