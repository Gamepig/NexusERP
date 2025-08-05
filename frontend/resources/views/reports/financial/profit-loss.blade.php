@extends('layouts.app')

@section('title', '損益表')

@include('components.reports-style')

@section('content')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2" style="color: var(--nexus-text-primary);">📊 損益表</h1>
        <p class="nx-text-secondary">收入支出與獲利能力分析</p>
    </div>

    <!-- 期間選擇 -->
    <div class="nx-card mb-8">
        <h3 class="text-xl font-semibold mb-4" style="color: var(--nexus-text-primary);">報表期間設定</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-sm font-medium nx-text-secondary mb-2">開始日期</label>
                <input type="date" class="nx-input w-full" value="2024-01-01">
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-secondary mb-2">結束日期</label>
                <input type="date" class="nx-input w-full" value="2024-12-31">
            </div>
            <div>
                <label class="block text-sm font-medium nx-text-secondary mb-2">比較期間</label>
                <select class="nx-input w-full">
                    <option value="previous_year">去年同期</option>
                    <option value="previous_quarter">上季同期</option>
                    <option value="previous_month">上月同期</option>
                </select>
            </div>
            <div class="flex items-end">
                <button class="nx-btn nx-btn-primary w-full">更新報表</button>
            </div>
        </div>
    </div>

    <!-- 損益表主體 -->
    <div class="nx-card mb-8">
        <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">損益表明細</h3>
        
        <div class="overflow-x-auto">
            <table class="min-w-full">
                <thead>
                    <tr style="border-bottom: 2px solid var(--nexus-border-primary);">
                        <th class="text-left py-3 px-4 font-semibold nx-text-primary">項目</th>
                        <th class="text-right py-3 px-4 font-semibold nx-text-primary">本期金額</th>
                        <th class="text-right py-3 px-4 font-semibold nx-text-primary">比較期間</th>
                        <th class="text-right py-3 px-4 font-semibold nx-text-primary">差異</th>
                        <th class="text-right py-3 px-4 font-semibold nx-text-primary">差異%</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- 營業收入 -->
                    <tr style="background-color: rgba(34, 197, 94, 0.1);">
                        <td class="py-3 px-4 font-semibold text-green-400">營業收入</td>
                        <td class="py-3 px-4 text-right font-semibold text-green-400">$29,400,000</td>
                        <td class="py-3 px-4 text-right" style="color: var(--nexus-text-muted);">$26,100,000</td>
                        <td class="py-3 px-4 text-right text-green-500">+$3,300,000</td>
                        <td class="py-3 px-4 text-right text-green-500">+12.6%</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 nx-text-muted">　商品銷售收入</td>
                        <td class="py-2 px-4 text-right nx-text-muted">$27,500,000</td>
                        <td class="py-2 px-4 text-right nx-text-muted">$24,800,000</td>
                        <td class="py-2 px-4 text-right text-green-500">+$2,700,000</td>
                        <td class="py-2 px-4 text-right text-green-500">+10.9%</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 nx-text-muted">　服務收入</td>
                        <td class="py-2 px-4 text-right nx-text-muted">$1,900,000</td>
                        <td class="py-2 px-4 text-right nx-text-muted">$1,300,000</td>
                        <td class="py-2 px-4 text-right text-green-500">+$600,000</td>
                        <td class="py-2 px-4 text-right text-green-500">+46.2%</td>
                    </tr>
                    
                    <!-- 營業成本 -->
                    <tr style="background-color: rgba(239, 68, 68, 0.1); border-top: 1px solid var(--nexus-border-primary);">
                        <td class="py-3 px-4 font-semibold text-red-400">營業成本</td>
                        <td class="py-3 px-4 text-right font-semibold text-red-400">($18,130,000)</td>
                        <td class="py-3 px-4 text-right nx-text-muted">($16,900,000)</td>
                        <td class="py-3 px-4 text-right text-red-500">-$1,230,000</td>
                        <td class="py-3 px-4 text-right text-red-500">+7.3%</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 nx-text-muted">　商品成本</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($16,800,000)</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($15,600,000)</td>
                        <td class="py-2 px-4 text-right text-red-500">-$1,200,000</td>
                        <td class="py-2 px-4 text-right text-red-500">+7.7%</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 nx-text-muted">　服務成本</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($1,330,000)</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($1,300,000)</td>
                        <td class="py-2 px-4 text-right text-red-500">-$30,000</td>
                        <td class="py-2 px-4 text-right text-red-500">+2.3%</td>
                    </tr>
                    
                    <!-- 毛利 -->
                    <tr style="background-color: rgba(59, 130, 246, 0.1); border-top: 1px solid var(--nexus-border-primary);">
                        <td class="py-3 px-4 font-semibold text-blue-400">毛利</td>
                        <td class="py-3 px-4 text-right font-semibold text-blue-400">$11,270,000</td>
                        <td class="py-3 px-4 text-right nx-text-muted">$9,200,000</td>
                        <td class="py-3 px-4 text-right text-blue-500">+$2,070,000</td>
                        <td class="py-3 px-4 text-right text-blue-500">+22.5%</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 nx-text-muted">毛利率</td>
                        <td class="py-2 px-4 text-right text-blue-500 font-medium">38.3%</td>
                        <td class="py-2 px-4 text-right nx-text-muted">35.2%</td>
                        <td class="py-2 px-4 text-right text-blue-500">+3.1%</td>
                        <td class="py-2 px-4 text-right text-blue-500">+8.8%</td>
                    </tr>
                    
                    <!-- 營業費用 -->
                    <tr style="background-color: rgba(249, 115, 22, 0.1); border-top: 1px solid var(--nexus-border-primary);">
                        <td class="py-3 px-4 font-semibold text-orange-400">營業費用</td>
                        <td class="py-3 px-4 text-right font-semibold text-orange-400">($7,560,000)</td>
                        <td class="py-3 px-4 text-right nx-text-muted">($6,890,000)</td>
                        <td class="py-3 px-4 text-right text-orange-500">-$670,000</td>
                        <td class="py-3 px-4 text-right text-orange-500">+9.7%</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 nx-text-muted">　人事費用</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($4,200,000)</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($3,800,000)</td>
                        <td class="py-2 px-4 text-right text-orange-500">-$400,000</td>
                        <td class="py-2 px-4 text-right text-orange-500">+10.5%</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 nx-text-muted">　租金費用</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($1,800,000)</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($1,750,000)</td>
                        <td class="py-2 px-4 text-right text-orange-500">-$50,000</td>
                        <td class="py-2 px-4 text-right text-orange-500">+2.9%</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 nx-text-muted">　行銷費用</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($980,000)</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($820,000)</td>
                        <td class="py-2 px-4 text-right text-orange-500">-$160,000</td>
                        <td class="py-2 px-4 text-right text-orange-500">+19.5%</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 nx-text-muted">　其他費用</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($580,000)</td>
                        <td class="py-2 px-4 text-right nx-text-muted">($520,000)</td>
                        <td class="py-2 px-4 text-right text-orange-500">-$60,000</td>
                        <td class="py-2 px-4 text-right text-orange-500">+11.5%</td>
                    </tr>
                    
                    <!-- 營業利益 -->
                    <tr style="background-color: rgba(147, 51, 234, 0.1); border-top: 1px solid var(--nexus-border-primary);">
                        <td class="py-3 px-4 font-semibold text-purple-400">營業利益</td>
                        <td class="py-3 px-4 text-right font-semibold text-purple-400">$3,710,000</td>
                        <td class="py-3 px-4 text-right nx-text-muted">$2,310,000</td>
                        <td class="py-3 px-4 text-right text-purple-500">+$1,400,000</td>
                        <td class="py-3 px-4 text-right text-purple-500">+60.6%</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 nx-text-muted">營業利益率</td>
                        <td class="py-2 px-4 text-right text-purple-500 font-medium">12.6%</td>
                        <td class="py-2 px-4 text-right nx-text-muted">8.9%</td>
                        <td class="py-2 px-4 text-right text-purple-500">+3.7%</td>
                        <td class="py-2 px-4 text-right text-purple-500">+41.6%</td>
                    </tr>
                    
                    <!-- 營業外收支 -->
                    <tr style="border-top: 1px solid var(--nexus-border-primary);">
                        <td class="py-3 px-4 font-semibold nx-text-secondary">營業外收入</td>
                        <td class="py-3 px-4 text-right nx-text-secondary">$180,000</td>
                        <td class="py-3 px-4 text-right nx-text-muted">$150,000</td>
                        <td class="py-3 px-4 text-right text-green-500">+$30,000</td>
                        <td class="py-3 px-4 text-right text-green-500">+20.0%</td>
                    </tr>
                    <tr>
                        <td class="py-3 px-4 font-semibold nx-text-secondary">營業外支出</td>
                        <td class="py-3 px-4 text-right nx-text-secondary">($120,000)</td>
                        <td class="py-3 px-4 text-right nx-text-muted">($110,000)</td>
                        <td class="py-3 px-4 text-right text-red-500">-$10,000</td>
                        <td class="py-3 px-4 text-right text-red-500">+9.1%</td>
                    </tr>
                    
                    <!-- 稅前淨利 -->
                    <tr class="nx-bg-secondary-50 border-t-2" style="border-color: var(--nexus-border-primary);">
                        <td class="py-3 px-4 font-bold nx-text-primary">稅前淨利</td>
                        <td class="py-3 px-4 text-right font-bold nx-text-primary">$3,770,000</td>
                        <td class="py-3 px-4 text-right nx-text-muted">$2,350,000</td>
                        <td class="py-3 px-4 text-right text-green-600 font-bold">+$1,420,000</td>
                        <td class="py-3 px-4 text-right text-green-600 font-bold">+60.4%</td>
                    </tr>
                    
                    <!-- 所得稅 -->
                    <tr>
                        <td class="py-3 px-4 font-semibold nx-text-secondary">所得稅費用</td>
                        <td class="py-3 px-4 text-right nx-text-secondary">($754,000)</td>
                        <td class="py-3 px-4 text-right nx-text-muted">($470,000)</td>
                        <td class="py-3 px-4 text-right text-red-500">-$284,000</td>
                        <td class="py-3 px-4 text-right text-red-500">+60.4%</td>
                    </tr>
                    
                    <!-- 稅後淨利 -->
                    <tr style="background-color: rgba(34, 197, 94, 0.15); border-top: 2px solid var(--nexus-border-primary);">
                        <td class="py-4 px-4 font-bold text-green-400 text-lg">稅後淨利</td>
                        <td class="py-4 px-4 text-right font-bold text-green-400 text-lg">$3,016,000</td>
                        <td class="py-4 px-4 text-right nx-text-muted">$1,880,000</td>
                        <td class="py-4 px-4 text-right text-green-500 font-bold">+$1,136,000</td>
                        <td class="py-4 px-4 text-right text-green-500 font-bold">+60.4%</td>
                    </tr>
                    <tr style="background-color: rgba(34, 197, 94, 0.15);">
                        <td class="py-2 px-8 text-green-400 font-medium">淨利率</td>
                        <td class="py-2 px-4 text-right text-green-400 font-bold">10.3%</td>
                        <td class="py-2 px-4 text-right nx-text-muted">7.2%</td>
                        <td class="py-2 px-4 text-right text-green-500 font-medium">+3.1%</td>
                        <td class="py-2 px-4 text-right text-green-500 font-medium">+43.1%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 獲利分析 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 獲利趨勢圖 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">月度獲利趨勢</h3>
            <div class="h-64 flex items-center justify-center rounded" style="background-color: var(--nexus-bg-secondary);">
                <canvas id="profit-trend-chart" style="max-height: 250px;"></canvas>
            </div>
        </div>

        <!-- 關鍵指標分析 -->
        <div class="nx-card">
            <h3 class="text-xl font-semibold mb-6" style="color: var(--nexus-text-primary);">關鍵獲利指標</h3>
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(34, 197, 94, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">毛利率</span>
                    <span class="text-green-500 font-bold">38.3%</span>
                </div>
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(59, 130, 246, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">營業利益率</span>
                    <span class="text-blue-500 font-bold">12.6%</span>
                </div>
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(147, 51, 234, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">淨利率</span>
                    <span class="text-purple-500 font-bold">10.3%</span>
                </div>
                <div class="flex justify-between items-center p-3 rounded" style="background-color: rgba(249, 115, 22, 0.1);">
                    <span class="font-medium" style="color: var(--nexus-text-primary);">費用率</span>
                    <span class="text-orange-500 font-bold">25.7%</span>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection