@extends('layouts.app')

@section('title', '員工出勤統計')

@section('content')
@include('components.reports-style')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <div class="flex items-center mb-4">
            <a href="{{ route('reports.index') }}" class="nx-text-accent hover:nx-text-accent mr-2">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
            </a>
            <nav class="text-sm breadcrumbs">
                <a href="{{ route('reports.index') }}" class="nx-text-accent hover:nx-text-accent">報表中心</a>
                <span class="mx-2 nx-text-muted">></span>
                <span class="nx-text-secondary">員工出勤統計</span>
            </nav>
        </div>
        <h1 class="text-3xl font-bold mb-2 nx-text-primary">⏰ 員工出勤統計</h1>
        <p class="nx-text-secondary">員工出勤時間統計分析與異常管理</p>
    </div>

    <!-- 出勤統計摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">總員工數</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">156</p>
            <p class="text-sm nx-text-muted mt-2">在職員工</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">本月出勤率</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-green);">96.8%</p>
            <p class="text-sm nx-text-muted mt-2">較上月 +1.2%</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">平均工時</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">8.2</p>
            <p class="text-sm nx-text-muted mt-2">小時/天</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">請假申請</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-orange);">23</p>
            <p class="text-sm nx-text-muted mt-2">本月申請數</p>
        </div>
    </div>

    <!-- 出勤分析圖表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 每日出勤趨勢 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 nx-text-primary">每日出勤率趨勢</h3>
            <div class="h-64 rounded">
                <canvas id="attendanceTrendChart"></canvas>
            </div>
        </div>

        <!-- 部門出勤率比較 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 nx-text-primary">部門出勤率比較</h3>
            <div class="h-64 rounded">
                <canvas id="departmentAttendanceChart"></canvas>
            </div>
        </div>
    </div>

    <!-- 部門出勤統計 -->
    <div class="nx-card mb-8">
        <h3 class="text-xl font-semibold mb-6 nx-text-primary">部門出勤統計</h3>
        
        <div class="overflow-x-auto">
            <table class="min-w-full nx-table">
                <thead>
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">部門名稱</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">員工數</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">出勤率</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">平均工時</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">遲到次數</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">早退次數</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">請假天數</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">部門評級</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">研發部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">45</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">98.2%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8.5 小時</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3.5</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">優秀</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">業務部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">28</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">97.5%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8.3 小時</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5.2</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">優秀</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">行政部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">96.8%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8.0 小時</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4.8</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">良好</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">財務部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">98.5%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8.1 小時</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2.5</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">優秀</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">人事部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">95.2%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">7.9 小時</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">6</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8.2</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">待改善</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">客服部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">25</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">94.8%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8.2 小時</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">8</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">5</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12.5</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">待改善</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">IT部</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">20</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">97.8%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8.4 小時</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4.2</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">優秀</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 出勤異常分析 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 出勤異常統計 -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-orange-600">⚠️ 出勤異常統計</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold text-yellow-800">遲到次數</h4>
                        <p class="text-sm text-yellow-700">本月累計遲到</p>
                    </div>
                    <div class="text-right">
                        <div class="text-yellow-600 font-bold text-xl">24</div>
                        <div class="text-sm text-gray-600">次</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold text-orange-800">早退次數</h4>
                        <p class="text-sm text-orange-700">本月累計早退</p>
                    </div>
                    <div class="text-right">
                        <div class="text-orange-600 font-bold text-xl">12</div>
                        <div class="text-sm text-gray-600">次</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold text-red-800">缺勤次數</h4>
                        <p class="text-sm text-red-700">無故缺勤</p>
                    </div>
                    <div class="text-right">
                        <div class="text-red-600 font-bold text-xl">3</div>
                        <div class="text-sm text-gray-600">次</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <div>
                        <h4 class="font-semibold text-purple-800">加班時數</h4>
                        <p class="text-sm text-purple-700">本月總加班</p>
                    </div>
                    <div class="text-right">
                        <div class="text-purple-600 font-bold text-xl">186</div>
                        <div class="text-sm text-gray-600">小時</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 請假類型統計 -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-blue-600">📝 請假類型統計</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span class="font-medium">病假</span>
                    <div class="text-right">
                        <span class="text-blue-600 font-bold text-lg">8</span>
                        <span class="text-sm text-gray-600 ml-1">天</span>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span class="font-medium">事假</span>
                    <div class="text-right">
                        <span class="text-green-600 font-bold text-lg">12</span>
                        <span class="text-sm text-gray-600 ml-1">天</span>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span class="font-medium">年假</span>
                    <div class="text-right">
                        <span class="text-purple-600 font-bold text-lg">15</span>
                        <span class="text-sm text-gray-600 ml-1">天</span>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span class="font-medium">特休</span>
                    <div class="text-right">
                        <span class="text-orange-600 font-bold text-lg">6</span>
                        <span class="text-sm text-gray-600 ml-1">天</span>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-3 bg-yellow-50 rounded">
                    <span class="font-medium">其他</span>
                    <div class="text-right">
                        <span class="text-yellow-600 font-bold text-lg">4</span>
                        <span class="text-sm text-gray-600 ml-1">天</span>
                    </div>
                </div>
            </div>
            
            <div class="mt-6 pt-4 border-t">
                <div class="flex justify-between text-lg font-semibold">
                    <span>總請假天數</span>
                    <span class="text-blue-600">45 天</span>
                </div>
            </div>
        </div>
    </div>

    <!-- 出勤績效排行 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 出勤模範員工 -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-green-600">🏆 出勤模範員工</h3>
            
            <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <span class="text-green-600 font-bold">1</span>
                        </div>
                        <div>
                            <h4 class="font-semibold text-green-800">張小明</h4>
                            <p class="text-sm text-green-700">研發部 - 資深工程師</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-green-600 font-bold">100%</div>
                        <div class="text-xs text-gray-600">全勤</div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span class="text-blue-600 font-bold">2</span>
                        </div>
                        <div>
                            <h4 class="font-semibold text-blue-800">李美華</h4>
                            <p class="text-sm text-blue-700">財務部 - 會計主任</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-blue-600 font-bold">100%</div>
                        <div class="text-xs text-gray-600">全勤</div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <span class="text-purple-600 font-bold">3</span>
                        </div>
                        <div>
                            <h4 class="font-semibold text-purple-800">王大明</h4>
                            <p class="text-sm text-purple-700">IT部 - 系統管理員</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-purple-600 font-bold">99.5%</div>
                        <div class="text-xs text-gray-600">優秀</div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                            <span class="text-orange-600 font-bold">4</span>
                        </div>
                        <div>
                            <h4 class="font-semibold text-orange-800">陳小花</h4>
                            <p class="text-sm text-orange-700">業務部 - 業務經理</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-orange-600 font-bold">99.2%</div>
                        <div class="text-xs text-gray-600">優秀</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 需要關注的員工 -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-orange-600">⚠️ 需要關注的員工</h3>
            
            <div class="space-y-4">
                <div class="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-yellow-800">林小雨</h4>
                            <p class="text-sm text-yellow-700">客服部 - 客服專員</p>
                        </div>
                        <div class="text-yellow-600 font-bold">89.5%</div>
                    </div>
                    <div class="mt-2 text-xs text-yellow-600">
                        <span class="bg-yellow-100 px-2 py-1 rounded mr-1">遲到 5次</span>
                        <span class="bg-yellow-100 px-2 py-1 rounded">請假 8天</span>
                    </div>
                </div>
                
                <div class="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-orange-800">黃志強</h4>
                            <p class="text-sm text-orange-700">人事部 - 人事專員</p>
                        </div>
                        <div class="text-orange-600 font-bold">91.2%</div>
                    </div>
                    <div class="mt-2 text-xs text-orange-600">
                        <span class="bg-orange-100 px-2 py-1 rounded mr-1">遲到 3次</span>
                        <span class="bg-orange-100 px-2 py-1 rounded">早退 2次</span>
                    </div>
                </div>
                
                <div class="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-red-800">許大勇</h4>
                            <p class="text-sm text-red-700">客服部 - 客服專員</p>
                        </div>
                        <div class="text-red-600 font-bold">86.8%</div>
                    </div>
                    <div class="mt-2 text-xs text-red-600">
                        <span class="bg-red-100 px-2 py-1 rounded mr-1">缺勤 2次</span>
                        <span class="bg-red-100 px-2 py-1 rounded">遲到 6次</span>
                    </div>
                    <div class="mt-2 text-sm text-red-800">
                        <strong>建議：</strong>進行個別面談，了解出勤問題原因
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 出勤管理建議 -->
    <div class="mt-8 bg-blue-50 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4 text-blue-800">出勤管理改善建議</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <h5 class="font-semibold mb-2 text-green-600">優化出勤制度</h5>
                <p class="text-sm text-blue-700">建立彈性上班時間，提升員工工作滿意度</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-orange-600">加強異常管理</h5>
                <p class="text-sm text-blue-700">針對出勤異常員工進行輔導，建立改善計劃</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-purple-600">建立獎勵機制</h5>
                <p class="text-sm text-blue-700">設立全勤獎勵，鼓勵員工提升出勤表現</p>
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

    // 每日出勤率趨勢圖
    const attendanceCtx = document.getElementById('attendanceTrendChart');
    if (attendanceCtx) {
        new Chart(attendanceCtx, {
            type: 'line',
            data: {
                labels: ['1/15', '1/16', '1/17', '1/18', '1/19', '1/22', '1/23', '1/24', '1/25', '1/26', '1/29', '1/30'],
                datasets: [{
                    label: '出勤率 (%)',
                    data: [97.5, 96.8, 98.2, 95.4, 97.1, 96.3, 98.5, 97.8, 96.9, 98.1, 97.2, 96.8],
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
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return `出勤率: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 94,
                        max: 100,
                        ticks: {
                            color: darkTheme.textSecondary,
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value + '%';
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

    // 部門出勤率比較圖
    const departmentCtx = document.getElementById('departmentAttendanceChart');
    if (departmentCtx) {
        new Chart(departmentCtx, {
            type: 'bar',
            data: {
                labels: ['研發部', '業務部', '財務部', '人事部', '客服部', '行銷部'],
                datasets: [{
                    label: '出勤率 (%)',
                    data: [98.5, 97.2, 96.8, 97.9, 95.4, 96.1],
                    backgroundColor: [
                        darkTheme.blue,
                        darkTheme.green,
                        darkTheme.purple,
                        darkTheme.orange,
                        darkTheme.red,
                        darkTheme.cyan
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
                                return `出勤率: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 94,
                        max: 100,
                        ticks: {
                            color: darkTheme.textSecondary,
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value + '%';
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