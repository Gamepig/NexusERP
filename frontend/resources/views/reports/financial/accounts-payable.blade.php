@extends('layouts.app')

@section('title', '應付帳款報表')

@include('components.reports-style')

@section('content')
<div class="container-fluid mx-auto p-6" style="background-color: var(--nexus-bg-primary); min-height: 100vh;">
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
                <span style="color: var(--nexus-text-secondary);">應付帳款</span>
            </nav>
        </div>
        <h1 class="text-3xl font-bold mb-2" style="color: var(--nexus-text-primary);">📉 應付帳款報表</h1>
        <p style="color: var(--nexus-text-secondary);">供應商應付帳款管理與付款計劃</p>
    </div>

    <!-- 應付帳款統計摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="rounded-lg shadow p-6" style="background-color: var(--nexus-card-bg); border: 1px solid var(--nexus-border-primary);">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">應付帳款總額</h3>
            <p class="text-3xl font-bold text-orange-500">$995,000</p>
            <p class="text-sm mt-2" style="color: var(--nexus-text-muted);">較上月 +5.2%</p>
        </div>

        <div class="rounded-lg shadow p-6" style="background-color: var(--nexus-card-bg); border: 1px solid var(--nexus-border-primary);">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">逾期應付款</h3>
            <p class="text-3xl font-bold text-red-500">$95,000</p>
            <p class="text-sm mt-2" style="color: var(--nexus-text-muted);">佔總額 9.5%</p>
        </div>

        <div class="rounded-lg shadow p-6" style="background-color: var(--nexus-card-bg); border: 1px solid var(--nexus-border-primary);">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">平均付款天數</h3>
            <p class="text-3xl font-bold text-purple-500">28.5</p>
            <p class="text-sm mt-2" style="color: var(--nexus-text-muted);">天/平均付款</p>
        </div>

        <div class="rounded-lg shadow p-6" style="background-color: var(--nexus-card-bg); border: 1px solid var(--nexus-border-primary);">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">供應商數量</h3>
            <p class="text-3xl font-bold text-blue-500">45</p>
            <p class="text-sm mt-2" style="color: var(--nexus-text-muted);">活躍供應商</p>
        </div>
    </div>

    <!-- 帳期分析 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 帳期分佈圖 -->
        <div class="rounded-lg shadow p-6" style="background-color: var(--nexus-card-bg); border: 1px solid var(--nexus-border-primary);">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">應付帳款帳期分佈</h3>
            <div class="h-64 flex items-center justify-center rounded" style="background-color: var(--nexus-bg-secondary);">
                <canvas id="payable-age-chart" style="max-height: 250px;"></canvas>
            </div>
        </div>

        <!-- 帳期明細 -->
        <div class="rounded-lg shadow p-6" style="background-color: var(--nexus-card-bg); border: 1px solid var(--nexus-border-primary);">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">帳期分析明細</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-4 rounded-lg" style="background-color: rgba(34, 197, 94, 0.1);">
                    <div>
                        <h4 class="font-semibold text-green-400">30天內</h4>
                        <p class="text-sm text-green-300">正常付款期</p>
                    </div>
                    <div class="text-right">
                        <div class="text-green-400 font-bold text-xl">$620,000</div>
                        <div class="text-sm" style="color: var(--nexus-text-muted);">62.3%</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 rounded-lg" style="background-color: rgba(251, 191, 36, 0.1);">
                    <div>
                        <h4 class="font-semibold text-yellow-400">31-60天</h4>
                        <p class="text-sm text-yellow-300">需要安排</p>
                    </div>
                    <div class="text-right">
                        <div class="text-yellow-400 font-bold text-xl">$280,000</div>
                        <div class="text-sm" style="color: var(--nexus-text-muted);">28.1%</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-4 rounded-lg" style="background-color: rgba(239, 68, 68, 0.1);">
                    <div>
                        <h4 class="font-semibold text-red-400">60天以上</h4>
                        <p class="text-sm text-red-300">逾期應付</p>
                    </div>
                    <div class="text-right">
                        <div class="text-red-400 font-bold text-xl">$95,000</div>
                        <div class="text-sm" style="color: var(--nexus-text-muted);">9.5%</div>
                    </div>
                </div>
            </div>
            
            <div class="mt-6 pt-4" style="border-top: 1px solid var(--nexus-border-primary);">
                <div class="flex justify-between text-lg font-semibold">
                    <span style="color: var(--nexus-text-primary);">應付帳款總計</span>
                    <span class="text-orange-400">$995,000</span>
                </div>
            </div>
        </div>
    </div>

    <!-- 供應商應付帳款明細 -->
    <div class="rounded-lg shadow p-6 mb-8" style="background-color: var(--nexus-card-bg); border: 1px solid var(--nexus-border-primary);">
        <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">供應商應付帳款明細</h3>
        
        <div class="overflow-x-auto">
            <table class="min-w-full" style="border-collapse: collapse;">
                <thead style="background-color: var(--nexus-primary-bg);">
                    <tr style="border-bottom: 1px solid var(--nexus-border-primary);">
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-muted);">供應商名稱</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-muted);">聯絡人</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-muted);">應付金額</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-muted);">付款期限</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-muted);">剩餘天數</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-muted);">付款條件</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-muted);">優先級</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--nexus-text-muted);">動作</th>
                    </tr>
                </thead>
                <tbody style="background-color: var(--nexus-card-bg);">
                    <tr style="border-bottom: 1px solid var(--nexus-border-primary);">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">Apple Inc.</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">Johnson Smith</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-500">$285,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">2024-02-15</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-400">18天</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">NET 30</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full text-red-300" style="background-color: rgba(239, 68, 68, 0.2);">高</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <button class="text-blue-400 hover:text-blue-300">安排付款</button>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--nexus-border-primary);">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">Samsung Electronics</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">Kim Lee</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-500">$180,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">2024-02-10</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-400">13天</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">NET 45</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full text-red-300" style="background-color: rgba(239, 68, 68, 0.2);">高</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <button class="text-blue-400 hover:text-blue-300">安排付款</button>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--nexus-border-primary);">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">Intel Corporation</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">David Chen</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-500">$220,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">2024-02-28</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-400">31天</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">NET 30</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full text-yellow-300" style="background-color: rgba(251, 191, 36, 0.2);">中</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <button class="text-orange-400 hover:text-orange-300">預約付款</button>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--nexus-border-primary);">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">Dell Technologies</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">Maria Garcia</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-500">$95,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-red-400">2023-12-20</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-red-400 font-semibold">逾期35天</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">NET 30</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full" style="color: var(--nexus-text-muted); background-color: rgba(107, 114, 128, 0.2);">低</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <button class="text-red-400 hover:text-red-300">立即付款</button>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--nexus-border-primary);">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--nexus-text-primary);">Microsoft Corporation</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">John Wilson</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-500">$215,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">2024-03-05</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-400">38天</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-text-secondary);">NET 60</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full text-yellow-300" style="background-color: rgba(251, 191, 36, 0.2);">中</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <button class="text-green-400 hover:text-green-300">正常追蹤</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 付款計劃與現金流管理 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 付款優先級管理 -->
        <div class="rounded-lg shadow p-6" style="background-color: var(--nexus-card-bg); border: 1px solid var(--nexus-border-primary);">
            <h3 class="text-xl font-semibold mb-6 text-red-400">⚠️ 付款優先級管理</h3>
            
            <div class="space-y-4">
                <div class="p-4 rounded-lg" style="background-color: rgba(239, 68, 68, 0.1);">
                    <h4 class="font-semibold text-red-400 mb-2">緊急付款 ($95,000)</h4>
                    <p class="text-sm text-red-300">逾期款項，影響信用評級</p>
                    <div class="mt-2">
                        <span class="text-xs px-2 py-1 rounded text-red-300" style="background-color: rgba(239, 68, 68, 0.2);">立即處理</span>
                        <span class="text-xs px-2 py-1 rounded ml-1 text-red-300" style="background-color: rgba(239, 68, 68, 0.2);">1-3天內</span>
                    </div>
                </div>
                
                <div class="p-4 rounded-lg" style="background-color: rgba(249, 115, 22, 0.1);">
                    <h4 class="font-semibold text-orange-400 mb-2">高優先級 ($465,000)</h4>
                    <p class="text-sm text-orange-300">重要供應商，維持良好關係</p>
                    <div class="mt-2">
                        <span class="text-xs px-2 py-1 rounded text-orange-300" style="background-color: rgba(249, 115, 22, 0.2);">7天內付款</span>
                        <span class="text-xs px-2 py-1 rounded ml-1 text-orange-300" style="background-color: rgba(249, 115, 22, 0.2);">按時付款</span>
                    </div>
                </div>
                
                <div class="p-4 rounded-lg" style="background-color: rgba(251, 191, 36, 0.1);">
                    <h4 class="font-semibold text-yellow-400 mb-2">中等優先級 ($435,000)</h4>
                    <p class="text-sm text-yellow-300">一般供應商，正常付款週期</p>
                    <div class="mt-2">
                        <span class="text-xs px-2 py-1 rounded text-yellow-300" style="background-color: rgba(251, 191, 36, 0.2);">30天內</span>
                        <span class="text-xs px-2 py-1 rounded ml-1 text-yellow-300" style="background-color: rgba(251, 191, 36, 0.2);">彈性安排</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 現金流量預測 -->
        <div class="rounded-lg shadow p-6" style="background-color: var(--nexus-card-bg); border: 1px solid var(--nexus-border-primary);">
            <h3 class="text-xl font-semibold mb-6 text-blue-400">💰 現金流量預測</h3>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(59, 130, 246, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">7天內需付款</span>
                    <span class="text-blue-400 font-bold">$320,000</span>
                </div>
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(147, 51, 234, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">30天內需付款</span>
                    <span class="text-purple-400 font-bold">$785,000</span>
                </div>
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(34, 197, 94, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">可用現金餘額</span>
                    <span class="text-green-400 font-bold">$3,750,000</span>
                </div>
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(249, 115, 22, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">預期現金流入</span>
                    <span class="text-orange-400 font-bold">$1,890,000</span>
                </div>
            </div>
            
            <div class="mt-6">
                <h4 class="font-semibold mb-3" style="color: var(--nexus-text-primary);">資金充足度分析</h4>
                <div class="w-full rounded-full h-3" style="background-color: var(--nexus-border-primary);">
                    <div class="bg-green-500 h-3 rounded-full" style="width: 95%"></div>
                </div>
                <div class="flex justify-between text-xs mt-1" style="color: var(--nexus-text-muted);">
                    <span>資金不足</span>
                    <span>資金充足</span>
                </div>
                <p class="text-sm mt-2" style="color: var(--nexus-text-secondary);">資金狀況：<span class="font-semibold text-green-400">充足</span></p>
            </div>
        </div>
    </div>

    <!-- 付款管理建議 -->
    <div class="mt-8 rounded-lg p-6" style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid var(--nexus-border-primary);">
        <h4 class="text-lg font-semibold mb-4 text-blue-400">應付帳款管理建議</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <h5 class="font-semibold mb-2 text-green-400">付款期程優化</h5>
                <p class="text-sm" style="color: var(--nexus-text-secondary);">合理安排付款時程，充分利用供應商提供的付款條件</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-orange-400">供應商關係維護</h5>
                <p class="text-sm" style="color: var(--nexus-text-secondary);">按時付款維持良好信用，爭取更優惠的採購條件</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 text-purple-400">現金流量管控</h5>
                <p class="text-sm" style="color: var(--nexus-text-secondary);">平衡付款時程與現金流量，確保營運資金充足</p>
            </div>
        </div>
    </div>
</div>
@endsection