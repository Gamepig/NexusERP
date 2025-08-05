@extends('layouts.app')

@section('title', '應收帳款報表')

@include('components.reports-style')

@section('content')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <div class="flex items-center mb-4">
            <a href="{{ route('reports.financial.index') }}" class="text-blue-400 hover:text-blue-300 mr-2">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
            </a>
            <nav class="text-sm breadcrumbs">
                <a href="{{ route('reports.index') }}" class="text-blue-400 hover:text-blue-300">報表中心</a>
                <span class="mx-2" style="color: var(--nexus-text-muted);">></span>
                <a href="{{ route('reports.financial.index') }}" class="text-blue-400 hover:text-blue-300">財務報表</a>
                <span class="mx-2" style="color: var(--nexus-text-muted);">></span>
                <span style="color: var(--nexus-text-secondary);">應收帳款</span>
            </nav>
        </div>
        <h1 class="text-3xl font-bold mb-2" style="color: var(--nexus-text-primary);">📈 應收帳款報表</h1>
        <p class="nx-text-secondary">客戶應收帳款管理與帳齡分析</p>
    </div>

    <!-- 應收帳款統計摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">應收帳款總額</h3>
            <p class="text-3xl font-bold text-blue-600">$1,355,000</p>
            <p class="text-sm nx-text-muted mt-2">較上月 +8.5%</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">逾期帳款</h3>
            <p class="text-3xl font-bold text-red-600">$125,000</p>
            <p class="text-sm nx-text-muted mt-2">佔總額 9.2%</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">平均收款天數</h3>
            <p class="text-3xl font-bold text-purple-600">15.2</p>
            <p class="text-sm nx-text-muted mt-2">天/平均收款</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">回收率</h3>
            <p class="text-3xl font-bold text-green-600">96.8%</p>
            <p class="text-sm nx-text-muted mt-2">成功回收比例</p>
        </div>
    </div>

    <!-- 帳齡分析 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 帳齡分佈圖 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">應收帳款帳齡分佈</h3>
            <div class="h-64 flex items-center justify-center rounded" style="background-color: var(--nexus-bg-secondary);">
                <canvas id="receivable-age-chart" style="max-height: 250px;"></canvas>
            </div>
        </div>

        <!-- 帳齡明細 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">帳齡分析明細</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-4 rounded-lg" style="background-color: rgba(34, 197, 94, 0.1); border-left: 4px solid #22c55e;">
                    <div>
                        <h4 class="font-semibold text-green-400">30天內</h4>
                        <p class="text-sm text-green-300">正常收款期</p>
                    </div>
                    <div class="text-right">
                        <div class="text-green-400 font-bold text-xl">$890,000</div>
                        <div class="text-sm nx-text-muted">65.7%</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 rounded-lg" style="background-color: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308;">
                    <div>
                        <h4 class="font-semibold text-yellow-400">31-60天</h4>
                        <p class="text-sm text-yellow-300">需要關注</p>
                    </div>
                    <div class="text-right">
                        <div class="text-yellow-400 font-bold text-xl">$340,000</div>
                        <div class="text-sm nx-text-muted">25.1%</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 rounded-lg" style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444;">
                    <div>
                        <h4 class="font-semibold text-red-400">60天以上</h4>
                        <p class="text-sm text-red-300">逾期帳款</p>
                    </div>
                    <div class="text-right">
                        <div class="text-red-400 font-bold text-xl">$125,000</div>
                        <div class="text-sm nx-text-muted">9.2%</div>
                    </div>
                </div>
            </div>
            
            <div class="mt-6 pt-4" style="border-top: 1px solid var(--nexus-border-primary);">
                <div class="flex justify-between text-lg font-semibold">
                    <span style="color: var(--nexus-text-primary);">應收帳款總計</span>
                    <span class="text-blue-400">$1,355,000</span>
                </div>
            </div>
        </div>
    </div>

    <!-- 客戶應收帳款明細 -->
    <div class="nx-card mb-8">
        <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">客戶應收帳款明細</h3>
        
        <div class="overflow-x-auto">
            <table class="min-w-full" style="border-collapse: separate; border-spacing: 0;">
                <thead style="background-color: var(--nexus-secondary-bg);">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-secondary); border-bottom: 1px solid var(--nexus-border-primary);">客戶名稱</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-secondary); border-bottom: 1px solid var(--nexus-border-primary);">聯絡人</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-secondary); border-bottom: 1px solid var(--nexus-border-primary);">應收金額</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-secondary); border-bottom: 1px solid var(--nexus-border-primary);">逾期天數</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-secondary); border-bottom: 1px solid var(--nexus-border-primary);">信用等級</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-secondary); border-bottom: 1px solid var(--nexus-border-primary);">最後收款日</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-secondary); border-bottom: 1px solid var(--nexus-border-primary);">風險等級</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-secondary); border-bottom: 1px solid var(--nexus-border-primary);">動作</th>
                    </tr>
                </thead>
                <tbody style="background-color: transparent;">
                    <tr style="border-bottom: 1px solid var(--nexus-border-primary);">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">台積電股份有限公司</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">張經理</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">$450,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">15天</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-800 text-green-200">AAA</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">2024-01-10</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-800 text-green-200">低</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <button class="text-blue-400 hover:text-blue-300">查看詳情</button>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--nexus-border-primary);">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">鴻海精密工業</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">李主任</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">$320,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">45天</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-800 text-blue-200">AA</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">2023-12-15</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-800 text-yellow-200">中</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <button class="text-orange-400 hover:text-orange-300">催收提醒</button>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--nexus-border-primary);">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">中華電信股份有限公司</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">王協理</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">$280,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">8天</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-800 text-green-200">AAA</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">2024-01-20</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-800 text-green-200">低</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <button class="text-blue-400 hover:text-blue-300">查看詳情</button>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--nexus-border-primary);">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">宏達國際電子</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">陳副總</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">$125,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-red-400 font-semibold">75天</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-800 text-yellow-200">A</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">2023-11-15</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-800 text-red-200">高</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <button class="text-red-400 hover:text-red-300">法律催收</button>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--nexus-border-primary);">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">聯發科技股份有限公司</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">黃經理</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">$180,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">22天</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-800 text-green-200">AAA</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">2024-01-05</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-800 text-green-200">低</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <button class="text-blue-400 hover:text-blue-300">查看詳情</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 催收建議與行動 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 催收行動建議 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 text-orange-400">📞 催收行動建議</h3>
            
            <div class="space-y-4">
                <div class="p-4 rounded-lg" style="background-color: rgba(34, 197, 94, 0.1); border-left: 4px solid #22c55e;">
                    <h4 class="font-semibold text-green-400 mb-2">30天內 ($890,000)</h4>
                    <p class="text-sm text-green-300">正常收款期，持續追蹤即可</p>
                    <div class="mt-2">
                        <span class="text-xs bg-green-800 text-green-200 px-2 py-1 rounded">例行追蹤</span>
                    </div>
                </div>
                
                <div class="p-4 rounded-lg" style="background-color: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308;">
                    <h4 class="font-semibold text-yellow-400 mb-2">31-60天 ($340,000)</h4>
                    <p class="text-sm text-yellow-300">電話提醒，發送催收通知書</p>
                    <div class="mt-2">
                        <span class="text-xs bg-yellow-800 text-yellow-200 px-2 py-1 rounded">電話催收</span>
                        <span class="text-xs bg-yellow-800 text-yellow-200 px-2 py-1 rounded ml-1">書面通知</span>
                    </div>
                </div>
                
                <div class="p-4 rounded-lg" style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444;">
                    <h4 class="font-semibold text-red-400 mb-2">60天以上 ($125,000)</h4>
                    <p class="text-sm text-red-300">停止出貨，考慮法律途徑催收</p>
                    <div class="mt-2">
                        <span class="text-xs bg-red-800 text-red-200 px-2 py-1 rounded">停止信用</span>
                        <span class="text-xs bg-red-800 text-red-200 px-2 py-1 rounded ml-1">法律催收</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 應收帳款趨勢 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6 text-blue-400">📊 應收帳款趨勢</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(59, 130, 246, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">本月新增應收</span>
                    <span class="text-blue-400 font-bold">$2,100,000</span>
                </div>
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(34, 197, 94, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">本月已收回</span>
                    <span class="text-green-400 font-bold">$1,950,000</span>
                </div>
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(147, 51, 234, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">淨增加額</span>
                    <span class="text-purple-400 font-bold">$150,000</span>
                </div>
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(249, 115, 22, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">週轉天數</span>
                    <span class="text-orange-400 font-bold">24.1天</span>
                </div>
            </div>
            
            <div class="mt-6">
                <h4 class="font-semibold mb-3" style="color: var(--nexus-text-primary);">風險評估</h4>
                <div class="w-full rounded-full h-2" style="background-color: var(--nexus-border-primary);">
                    <div class="bg-green-500 h-2 rounded-full" style="width: 87%"></div>
                </div>
                <div class="flex justify-between text-xs mt-1" style="color: var(--nexus-text-muted);">
                    <span>低風險</span>
                    <span>高風險</span>
                </div>
                <p class="text-sm mt-2" style="color: var(--nexus-text-secondary);">整體風險評估：<span class="font-semibold text-green-400">良好</span></p>
            </div>
        </div>
    </div>

    <!-- 應收帳款管理建議 -->
    <div class="mt-8 nx-card" style="background-color: rgba(59, 130, 246, 0.05); border-left: 4px solid #3b82f6;">
        <h4 class="text-lg font-semibold mb-4 text-blue-400">應收帳款管理建議</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <h5 class="font-semibold mb-2 text-green-400">信用管理強化</h5>
                <p class="text-sm" style="color: var(--nexus-text-secondary);">建立客戶信用評估機制，定期檢討信用額度與條件</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-orange-400">催收流程優化</h5>
                <p class="text-sm" style="color: var(--nexus-text-secondary);">建立階段性催收機制，提高收款效率降低壞帳風險</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-purple-400">預警系統建置</h5>
                <p class="text-sm" style="color: var(--nexus-text-secondary);">設定帳齡預警機制，提前發現潛在收款問題</p>
            </div>
        </div>
    </div>
</div>
@endsection