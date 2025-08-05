@extends('layouts.app')

@section('title', '庫存估價報表')

@section('content')
@include('components.reports-style')
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">💰 庫存估價報表</h1>
        <p class="nx-text-secondary">庫存商品當前市值與價值分析</p>
    </div>

    <!-- 統計摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">總庫存價值</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-green);">$2,450,000</p>
            <p class="text-sm nx-text-muted mt-2">基於當前成本計算</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">市場估值</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">$2,890,000</p>
            <p class="text-sm nx-text-muted mt-2">基於市場價格計算</p>
        </div>

        <div class="nx-card">
            <h3 class="text-lg font-semibold mb-4 nx-text-primary">估值差異</h3>
            <p class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">+17.9%</p>
            <p class="text-sm nx-text-muted mt-2">市值vs成本差異</p>
        </div>
    </div>

    <!-- 詳細估價表 -->
    <div class="nx-card">
        <h3 class="text-xl font-semibold mb-6 nx-text-primary">商品估價明細</h3>
        
        <div class="overflow-x-auto">
            <table class="nx-table min-w-full">
                <thead>
                    <tr>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">商品名稱</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">庫存數量</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">單位成本</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">總成本</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">市場價格</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">市場價值</th>
                        <th class="nx-table px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">價值差異</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium nx-text-primary">筆記型電腦 A1</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">150</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$1,200</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$180,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$1,350</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$202,500</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-accent-green);">+12.5%</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium nx-text-primary">智慧型手機 B2</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">300</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$800</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$240,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$750</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$225,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-accent-red);">-6.3%</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium nx-text-primary">平板電腦 C3</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">200</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$600</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$120,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$720</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm nx-text-secondary">$144,000</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--nexus-accent-green);">+20.0%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 估價方法說明 -->
    <div class="mt-8 nx-bg-blue-50 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4" style="color: var(--nexus-accent-blue);">估價方法說明</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm nx-text-secondary">
            <div>
                <h5 class="font-semibold mb-2 nx-text-primary">成本法估價</h5>
                <p>基於商品實際採購成本計算，反映庫存的會計價值</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2 nx-text-primary">市場法估價</h5>
                <p>基於當前市場售價計算，反映庫存的潛在市場價值</p>
            </div>
        </div>
    </div>
</div>
@endsection