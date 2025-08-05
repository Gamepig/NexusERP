@extends('layouts.app')

@section('title', '現金流量表')

@section('content')
@php
    // 提供預設值，以防控制器沒有提供資料
    $cashFlowData = $cashFlowData ?? [
        'operating' => [
            'total' => 3200000,
            'net_income' => 3770000,
            'depreciation' => 850000,
            'accounts_receivable_change' => -320000,
            'inventory_change' => -450000,
            'accounts_payable_change' => 280000,
            'tax_paid' => -754000,
            'other_operating' => -176000,
        ],
        'investing' => [
            'total' => -1500000,
            'fixed_assets_purchase' => -1200000,
            'investments' => -500000,
            'asset_disposal' => 80000,
            'investment_return' => 120000,
        ],
        'financing' => [
            'total' => -450000,
            'loan_change' => -300000,
            'dividends_paid' => -200000,
            'other_financing' => 50000,
        ],
        'beginning_cash' => 2500000,
        'net_cash_flow' => 1250000,
        'ending_cash' => 3750000,
    ];
    
    $previousCashFlowData = $previousCashFlowData ?? [
        'operating' => [
            'total' => 2270000,
            'net_income' => 2350000,
            'depreciation' => 820000,
            'accounts_receivable_change' => -180000,
            'inventory_change' => -280000,
            'accounts_payable_change' => 150000,
            'tax_paid' => -470000,
            'other_operating' => -120000,
        ],
        'investing' => [
            'total' => -1050000,
            'fixed_assets_purchase' => -800000,
            'investments' => -300000,
            'asset_disposal' => 50000,
            'investment_return' => 0,
        ],
        'financing' => [
            'total' => 370000,
            'loan_change' => 500000,
            'dividends_paid' => -150000,
            'other_financing' => 20000,
        ],
        'beginning_cash' => 910000,
        'net_cash_flow' => 1590000,
        'ending_cash' => 2500000,
    ];
    
    $cashFlowComparison = $cashFlowComparison ?? [
        'operating' => [
            'total' => ['amount' => 930000, 'percentage' => 41.0],
            'net_income' => ['amount' => 1420000, 'percentage' => 60.4],
            'depreciation' => ['amount' => 30000, 'percentage' => 3.7],
            'accounts_receivable_change' => ['amount' => -140000, 'percentage' => 77.8],
            'inventory_change' => ['amount' => -170000, 'percentage' => 60.7],
            'accounts_payable_change' => ['amount' => 130000, 'percentage' => 86.7],
            'tax_paid' => ['amount' => -284000, 'percentage' => 60.4],
            'other_operating' => ['amount' => -56000, 'percentage' => 46.7],
        ],
        'investing' => [
            'total' => ['amount' => -450000, 'percentage' => 42.9],
            'fixed_assets_purchase' => ['amount' => -400000, 'percentage' => 50.0],
            'investments' => ['amount' => -200000, 'percentage' => 66.7],
            'asset_disposal' => ['amount' => 30000, 'percentage' => 60.0],
            'investment_return' => ['amount' => 120000, 'percentage' => 0],
        ],
        'financing' => [
            'total' => ['amount' => -820000, 'percentage' => -221.6],
            'loan_change' => ['amount' => -800000, 'percentage' => -160.0],
            'dividends_paid' => ['amount' => -50000, 'percentage' => 33.3],
            'other_financing' => ['amount' => 30000, 'percentage' => 150.0],
        ],
        'net_cash_flow' => ['amount' => -340000, 'percentage' => -21.4],
        'beginning_cash' => ['amount' => 1590000, 'percentage' => 174.7],
        'ending_cash' => ['amount' => 1250000, 'percentage' => 50.0],
    ];
@endphp
<div class="container-fluid mx-auto p-6">
    <div class="mb-8">
        <div class="flex items-center mb-4">
            <a href="{{ route('reports.financial.index') }}" class="text-blue-600 hover:text-blue-800 mr-2">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
            </a>
            <nav class="text-sm breadcrumbs">
                <a href="{{ route('reports.index') }}" class="text-blue-600 hover:text-blue-800">報表中心</a>
                <span class="mx-2 text-gray-500">></span>
                <a href="{{ route('reports.financial.index') }}" class="text-blue-600 hover:text-blue-800">財務報表</a>
                <span class="mx-2 text-gray-500">></span>
                <span class="text-gray-700">現金流量表</span>
            </nav>
        </div>
        <h1 class="text-3xl font-bold mb-2">💰 現金流量表</h1>
        <p class="text-gray-600">企業現金流入流出及資金運用分析</p>
    </div>

    <!-- 現金流摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">營業活動現金流</h3>
            <p class="text-3xl font-bold {{ ($cashFlowData['operating']['total'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }}">
                ${{ number_format(abs($cashFlowData['operating']['total'] ?? 0), 0) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                較上期 {{ ($cashFlowComparison['operating']['total']['percentage'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($cashFlowComparison['operating']['total']['percentage'] ?? 0, 1) }}%
            </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">投資活動現金流</h3>
            <p class="text-3xl font-bold {{ ($cashFlowData['investing']['total'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400' }}">
                {{ ($cashFlowData['investing']['total'] ?? 0) >= 0 ? '' : '-' }}${{ number_format(abs($cashFlowData['investing']['total'] ?? 0), 0) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                @if(($cashFlowData['investing']['fixed_assets_purchase'] ?? 0) < 0)
                    設備投資支出
                @else
                    投資回收
                @endif
            </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">籌資活動現金流</h3>
            <p class="text-3xl font-bold {{ ($cashFlowData['financing']['total'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400' }}">
                {{ ($cashFlowData['financing']['total'] ?? 0) >= 0 ? '' : '-' }}${{ number_format(abs($cashFlowData['financing']['total'] ?? 0), 0) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                @if(($cashFlowData['financing']['loan_change'] ?? 0) < 0)
                    償還借款
                @else
                    新增融資
                @endif
            </p>
        </div>
    </div>

    <!-- 現金流量表主體 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h3 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">現金流量表明細</h3>
        
        <div class="overflow-x-auto">
            <table class="min-w-full">
                <thead>
                    <tr class="border-b-2 border-gray-200 dark:border-gray-700">
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">項目</th>
                        <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">本期金額</th>
                        <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">上期金額</th>
                        <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">變動金額</th>
                        <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">變動%</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- 營業活動現金流量 -->
                    <tr class="bg-green-50 dark:bg-green-900/20" style="background-color: rgba(34, 197, 94, 0.1);">
                        <td class="py-3 px-4 font-semibold text-green-600 dark:text-green-400" colspan="5" style="color: var(--nexus-accent-green, #10b981);">營業活動現金流量</td>
                    </tr>
                    <tr>
                        <td class="py-2 px-8 text-gray-600 dark:text-gray-400">　稅前淨利</td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">${{ number_format($cashFlowData['operating']['net_income'] ?? 0, 0) }}</td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">${{ number_format($previousCashFlowData['operating']['net_income'] ?? 0, 0) }}</td>
                        <td class="py-2 px-4 text-right {{ ($cashFlowComparison['operating']['net_income']['amount'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }}">
                            {{ ($cashFlowComparison['operating']['net_income']['amount'] ?? 0) >= 0 ? '+' : '' }}${{ number_format(abs($cashFlowComparison['operating']['net_income']['amount'] ?? 0), 0) }}
                        </td>
                        <td class="py-2 px-4 text-right {{ ($cashFlowComparison['operating']['net_income']['percentage'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }}">
                            {{ ($cashFlowComparison['operating']['net_income']['percentage'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($cashFlowComparison['operating']['net_income']['percentage'] ?? 0, 1) }}%
                        </td>
                    </tr>
                    @php
                        $operatingItems = [
                            ['key' => 'depreciation', 'label' => '折舊與攤銷'],
                            ['key' => 'accounts_receivable_change', 'label' => '應收帳款增減'],
                            ['key' => 'inventory_change', 'label' => '存貨增減'],
                            ['key' => 'accounts_payable_change', 'label' => '應付帳款增減'],
                            ['key' => 'tax_paid', 'label' => '所得稅支付'],
                            ['key' => 'other_operating', 'label' => '其他營業項目']
                        ];
                    @endphp
                    
                    @foreach($operatingItems as $item)
                    <tr>
                        <td class="py-2 px-8 text-gray-600 dark:text-gray-400">　{{ $item['label'] }}</td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">
                            @if(($cashFlowData['operating'][$item['key']] ?? 0) < 0)
                                (${{ number_format(abs($cashFlowData['operating'][$item['key']] ?? 0), 0) }})
                            @else
                                ${{ number_format($cashFlowData['operating'][$item['key']] ?? 0, 0) }}
                            @endif
                        </td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">
                            @if(($previousCashFlowData['operating'][$item['key']] ?? 0) < 0)
                                (${{ number_format(abs($previousCashFlowData['operating'][$item['key']] ?? 0), 0) }})
                            @else
                                ${{ number_format($previousCashFlowData['operating'][$item['key']] ?? 0, 0) }}
                            @endif
                        </td>
                        <td class="py-2 px-4 text-right {{ ($cashFlowComparison['operating'][$item['key']]['amount'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }}">
                            {{ ($cashFlowComparison['operating'][$item['key']]['amount'] ?? 0) >= 0 ? '+' : '-' }}${{ number_format(abs($cashFlowComparison['operating'][$item['key']]['amount'] ?? 0), 0) }}
                        </td>
                        <td class="py-2 px-4 text-right {{ ($cashFlowComparison['operating'][$item['key']]['percentage'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }}">
                            {{ ($cashFlowComparison['operating'][$item['key']]['percentage'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($cashFlowComparison['operating'][$item['key']]['percentage'] ?? 0, 1) }}%
                        </td>
                    </tr>
                    @endforeach
                    
                    <tr class="bg-green-100 dark:bg-green-900/30 border-t dark:border-gray-700" style="background-color: rgba(34, 197, 94, 0.2); border-top: 1px solid rgba(34, 197, 94, 0.3);">
                        <td class="py-3 px-4 font-semibold text-green-800 dark:text-green-400" style="color: var(--nexus-accent-green, #10b981);">營業活動現金流入淨額</td>
                        <td class="py-3 px-4 text-right font-semibold text-green-800 dark:text-green-400">${{ number_format($cashFlowData['operating']['total'] ?? 0, 0) }}</td>
                        <td class="py-3 px-4 text-right text-gray-600 dark:text-gray-400">${{ number_format($previousCashFlowData['operating']['total'] ?? 0, 0) }}</td>
                        <td class="py-3 px-4 text-right text-green-600 dark:text-green-400 font-semibold">
                            {{ ($cashFlowComparison['operating']['total']['amount'] ?? 0) >= 0 ? '+' : '' }}${{ number_format(abs($cashFlowComparison['operating']['total']['amount'] ?? 0), 0) }}
                        </td>
                        <td class="py-3 px-4 text-right text-green-600 dark:text-green-400 font-semibold">
                            {{ ($cashFlowComparison['operating']['total']['percentage'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($cashFlowComparison['operating']['total']['percentage'] ?? 0, 1) }}%
                        </td>
                    </tr>

                    <!-- 投資活動現金流量 -->
                    <tr class="bg-orange-50 dark:bg-orange-900/20 border-t dark:border-gray-700" style="background-color: rgba(249, 115, 22, 0.1); border-top: 1px solid rgba(107, 114, 128, 0.3);">
                        <td class="py-3 px-4 font-semibold text-orange-800 dark:text-orange-400" colspan="5" style="color: var(--nexus-accent-orange, #f59e0b);">投資活動現金流量</td>
                    </tr>
                    @php
                        $investingItems = [
                            ['key' => 'fixed_assets_purchase', 'label' => '取得固定資產'],
                            ['key' => 'investments', 'label' => '投資理財產品'],
                            ['key' => 'asset_disposal', 'label' => '處分資產收入'],
                            ['key' => 'investment_return', 'label' => '收回投資']
                        ];
                    @endphp
                    
                    @foreach($investingItems as $item)
                    <tr>
                        <td class="py-2 px-8 text-gray-600 dark:text-gray-400">　{{ $item['label'] }}</td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">
                            @if(($cashFlowData['investing'][$item['key']] ?? 0) < 0)
                                (${{ number_format(abs($cashFlowData['investing'][$item['key']] ?? 0), 0) }})
                            @else
                                ${{ number_format($cashFlowData['investing'][$item['key']] ?? 0, 0) }}
                            @endif
                        </td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">
                            @if(($previousCashFlowData['investing'][$item['key']] ?? 0) < 0)
                                (${{ number_format(abs($previousCashFlowData['investing'][$item['key']] ?? 0), 0) }})
                            @else
                                ${{ number_format($previousCashFlowData['investing'][$item['key']] ?? 0, 0) }}
                            @endif
                        </td>
                        <td class="py-2 px-4 text-right {{ ($cashFlowComparison['investing'][$item['key']]['amount'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }}">
                            {{ ($cashFlowComparison['investing'][$item['key']]['amount'] ?? 0) >= 0 ? '+' : '-' }}${{ number_format(abs($cashFlowComparison['investing'][$item['key']]['amount'] ?? 0), 0) }}
                        </td>
                        <td class="py-2 px-4 text-right {{ ($cashFlowComparison['investing'][$item['key']]['percentage'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }}">
                            @if($previousCashFlowData['investing'][$item['key']] ?? 0 == 0)
                                -
                            @else
                                {{ ($cashFlowComparison['investing'][$item['key']]['percentage'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($cashFlowComparison['investing'][$item['key']]['percentage'] ?? 0, 1) }}%
                            @endif
                        </td>
                    </tr>
                    @endforeach
                    
                    <tr class="bg-orange-100 dark:bg-orange-900/30 border-t dark:border-gray-700" style="background-color: rgba(249, 115, 22, 0.2); border-top: 1px solid rgba(249, 115, 22, 0.3);">
                        <td class="py-3 px-4 font-semibold text-orange-800 dark:text-orange-400" style="color: var(--nexus-accent-orange, #f59e0b);">投資活動現金流出淨額</td>
                        <td class="py-3 px-4 text-right font-semibold text-orange-800 dark:text-orange-400">
                            @if(($cashFlowData['investing']['total'] ?? 0) < 0)
                                (${{ number_format(abs($cashFlowData['investing']['total'] ?? 0), 0) }})
                            @else
                                ${{ number_format($cashFlowData['investing']['total'] ?? 0, 0) }}
                            @endif
                        </td>
                        <td class="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                            @if(($previousCashFlowData['investing']['total'] ?? 0) < 0)
                                (${{ number_format(abs($previousCashFlowData['investing']['total'] ?? 0), 0) }})
                            @else
                                ${{ number_format($previousCashFlowData['investing']['total'] ?? 0, 0) }}
                            @endif
                        </td>
                        <td class="py-3 px-4 text-right text-orange-600 dark:text-orange-400 font-semibold">
                            {{ ($cashFlowComparison['investing']['total']['amount'] ?? 0) >= 0 ? '+' : '-' }}${{ number_format(abs($cashFlowComparison['investing']['total']['amount'] ?? 0), 0) }}
                        </td>
                        <td class="py-3 px-4 text-right text-orange-600 dark:text-orange-400 font-semibold">
                            {{ ($cashFlowComparison['investing']['total']['percentage'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($cashFlowComparison['investing']['total']['percentage'] ?? 0, 1) }}%
                        </td>
                    </tr>

                    <!-- 籌資活動現金流量 -->
                    <tr class="bg-blue-50 dark:bg-blue-900/20 border-t dark:border-gray-700" style="background-color: rgba(59, 130, 246, 0.1); border-top: 1px solid rgba(107, 114, 128, 0.3);">
                        <td class="py-3 px-4 font-semibold text-blue-800 dark:text-blue-400" colspan="5" style="color: var(--nexus-accent-blue, #3b82f6);">籌資活動現金流量</td>
                    </tr>
                    @php
                        $financingItems = [
                            ['key' => 'loan_change', 'label' => '銀行借款增減'],
                            ['key' => 'dividends_paid', 'label' => '股利發放'],
                            ['key' => 'other_financing', 'label' => '其他籌資活動']
                        ];
                    @endphp
                    
                    @foreach($financingItems as $item)
                    <tr>
                        <td class="py-2 px-8 text-gray-600 dark:text-gray-400">　{{ $item['label'] }}</td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">
                            @if(($cashFlowData['financing'][$item['key']] ?? 0) < 0)
                                (${{ number_format(abs($cashFlowData['financing'][$item['key']] ?? 0), 0) }})
                            @else
                                ${{ number_format($cashFlowData['financing'][$item['key']] ?? 0, 0) }}
                            @endif
                        </td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">
                            @if(($previousCashFlowData['financing'][$item['key']] ?? 0) < 0)
                                (${{ number_format(abs($previousCashFlowData['financing'][$item['key']] ?? 0), 0) }})
                            @else
                                ${{ number_format($previousCashFlowData['financing'][$item['key']] ?? 0, 0) }}
                            @endif
                        </td>
                        <td class="py-2 px-4 text-right {{ ($cashFlowComparison['financing'][$item['key']]['amount'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }}">
                            {{ ($cashFlowComparison['financing'][$item['key']]['amount'] ?? 0) >= 0 ? '+' : '-' }}${{ number_format(abs($cashFlowComparison['financing'][$item['key']]['amount'] ?? 0), 0) }}
                        </td>
                        <td class="py-2 px-4 text-right {{ ($cashFlowComparison['financing'][$item['key']]['percentage'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }}">
                            {{ ($cashFlowComparison['financing'][$item['key']]['percentage'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($cashFlowComparison['financing'][$item['key']]['percentage'] ?? 0, 1) }}%
                        </td>
                    </tr>
                    @endforeach
                    
                    <tr class="bg-blue-100 dark:bg-blue-900/30 border-t dark:border-gray-700" style="background-color: rgba(59, 130, 246, 0.2); border-top: 1px solid rgba(59, 130, 246, 0.3);">
                        <td class="py-3 px-4 font-semibold text-blue-800 dark:text-blue-400" style="color: var(--nexus-accent-blue, #3b82f6);">籌資活動現金流出淨額</td>
                        <td class="py-3 px-4 text-right font-semibold text-blue-800 dark:text-blue-400">
                            @if(($cashFlowData['financing']['total'] ?? 0) < 0)
                                (${{ number_format(abs($cashFlowData['financing']['total'] ?? 0), 0) }})
                            @else
                                ${{ number_format($cashFlowData['financing']['total'] ?? 0, 0) }}
                            @endif
                        </td>
                        <td class="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                            @if(($previousCashFlowData['financing']['total'] ?? 0) < 0)
                                (${{ number_format(abs($previousCashFlowData['financing']['total'] ?? 0), 0) }})
                            @else
                                ${{ number_format($previousCashFlowData['financing']['total'] ?? 0, 0) }}
                            @endif
                        </td>
                        <td class="py-3 px-4 text-right text-blue-600 dark:text-blue-400 font-semibold">
                            {{ ($cashFlowComparison['financing']['total']['amount'] ?? 0) >= 0 ? '+' : '-' }}${{ number_format(abs($cashFlowComparison['financing']['total']['amount'] ?? 0), 0) }}
                        </td>
                        <td class="py-3 px-4 text-right text-blue-600 dark:text-blue-400 font-semibold">
                            {{ ($cashFlowComparison['financing']['total']['percentage'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($cashFlowComparison['financing']['total']['percentage'] ?? 0, 1) }}%
                        </td>
                    </tr>

                    <!-- 現金淨增減 -->
                    <tr class="bg-gray-100 dark:bg-gray-700 border-t-2 dark:border-gray-600" style="background-color: rgba(107, 114, 128, 0.2); border-top: 2px solid rgba(107, 114, 128, 0.5);">
                        <td class="py-4 px-4 font-bold text-gray-800 dark:text-gray-200 text-lg" style="color: var(--nexus-text-primary, #ffffff);">本期現金淨增減</td>
                        <td class="py-4 px-4 text-right font-bold text-gray-800 dark:text-gray-200 text-lg">${{ number_format($cashFlowData['net_cash_flow'] ?? 0, 0) }}</td>
                        <td class="py-4 px-4 text-right text-gray-600 dark:text-gray-400">${{ number_format($previousCashFlowData['net_cash_flow'] ?? 0, 0) }}</td>
                        <td class="py-4 px-4 text-right {{ ($cashFlowComparison['net_cash_flow']['amount'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }} font-bold">
                            {{ ($cashFlowComparison['net_cash_flow']['amount'] ?? 0) >= 0 ? '+' : '-' }}${{ number_format(abs($cashFlowComparison['net_cash_flow']['amount'] ?? 0), 0) }}
                        </td>
                        <td class="py-4 px-4 text-right {{ ($cashFlowComparison['net_cash_flow']['percentage'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }} font-bold">
                            {{ ($cashFlowComparison['net_cash_flow']['percentage'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($cashFlowComparison['net_cash_flow']['percentage'] ?? 0, 1) }}%
                        </td>
                    </tr>
                    <tr class="bg-gray-100 dark:bg-gray-700" style="background-color: rgba(107, 114, 128, 0.15);">
                        <td class="py-2 px-4 text-gray-700 dark:text-gray-300" style="color: var(--nexus-text-secondary, #94a3b8);">期初現金餘額</td>
                        <td class="py-2 px-4 text-right text-gray-700 dark:text-gray-300">${{ number_format($cashFlowData['beginning_cash'] ?? 0, 0) }}</td>
                        <td class="py-2 px-4 text-right text-gray-600 dark:text-gray-400">${{ number_format($previousCashFlowData['beginning_cash'] ?? 0, 0) }}</td>
                        <td class="py-2 px-4 text-right {{ ($cashFlowComparison['beginning_cash']['amount'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }}">
                            {{ ($cashFlowComparison['beginning_cash']['amount'] ?? 0) >= 0 ? '+' : '' }}${{ number_format(abs($cashFlowComparison['beginning_cash']['amount'] ?? 0), 0) }}
                        </td>
                        <td class="py-2 px-4 text-right {{ ($cashFlowComparison['beginning_cash']['percentage'] ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }}">
                            {{ ($cashFlowComparison['beginning_cash']['percentage'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($cashFlowComparison['beginning_cash']['percentage'] ?? 0, 1) }}%
                        </td>
                    </tr>
                    <tr class="bg-green-100 dark:bg-green-900/30 border-t dark:border-gray-700" style="background-color: rgba(34, 197, 94, 0.25); border-top: 1px solid rgba(34, 197, 94, 0.4);">
                        <td class="py-4 px-4 font-bold text-green-800 dark:text-green-400 text-lg" style="color: var(--nexus-accent-green, #10b981);">期末現金餘額</td>
                        <td class="py-4 px-4 text-right font-bold text-green-800 dark:text-green-400 text-lg">${{ number_format($cashFlowData['ending_cash'] ?? 0, 0) }}</td>
                        <td class="py-4 px-4 text-right text-gray-600 dark:text-gray-400">${{ number_format($previousCashFlowData['ending_cash'] ?? 0, 0) }}</td>
                        <td class="py-4 px-4 text-right text-green-600 dark:text-green-400 font-bold">
                            {{ ($cashFlowComparison['ending_cash']['amount'] ?? 0) >= 0 ? '+' : '' }}${{ number_format(abs($cashFlowComparison['ending_cash']['amount'] ?? 0), 0) }}
                        </td>
                        <td class="py-4 px-4 text-right text-green-600 dark:text-green-400 font-bold">
                            {{ ($cashFlowComparison['ending_cash']['percentage'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($cashFlowComparison['ending_cash']['percentage'] ?? 0, 1) }}%
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 現金流分析圖表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 現金流趨勢 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">現金流趨勢分析</h3>
            <div class="h-64 bg-gray-50 dark:bg-gray-700 rounded p-4">
                <canvas id="cashFlowChart" width="400" height="200"></canvas>
            </div>
        </div>

        <!-- 現金流結構 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">現金流結構分析</h3>
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded" style="background-color: rgba(34, 197, 94, 0.15);">
                    <span class="font-medium text-gray-700 dark:text-gray-300" style="color: var(--nexus-text-secondary, #94a3b8);">營業活動現金流</span>
                    <span class="text-green-600 dark:text-green-400 font-bold" style="color: var(--nexus-accent-green, #10b981);">${{ number_format($cashFlowData['operating']['total'] ?? 0, 0) }}</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded" style="background-color: rgba(249, 115, 22, 0.15);">
                    <span class="font-medium text-gray-700 dark:text-gray-300" style="color: var(--nexus-text-secondary, #94a3b8);">投資活動現金流</span>
                    <span class="text-orange-600 dark:text-orange-400 font-bold" style="color: var(--nexus-accent-orange, #f59e0b);">
                        {{ ($cashFlowData['investing']['total'] ?? 0) < 0 ? '-' : '' }}${{ number_format(abs($cashFlowData['investing']['total'] ?? 0), 0) }}
                    </span>
                </div>
                <div class="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded" style="background-color: rgba(59, 130, 246, 0.15);">
                    <span class="font-medium text-gray-700 dark:text-gray-300" style="color: var(--nexus-text-secondary, #94a3b8);">籌資活動現金流</span>
                    <span class="text-blue-600 dark:text-blue-400 font-bold" style="color: var(--nexus-accent-blue, #3b82f6);">
                        {{ ($cashFlowData['financing']['total'] ?? 0) < 0 ? '-' : '' }}${{ number_format(abs($cashFlowData['financing']['total'] ?? 0), 0) }}
                    </span>
                </div>
                <div class="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded border-t-2 dark:border-gray-600" style="background-color: rgba(107, 114, 128, 0.2); border-top: 2px solid rgba(107, 114, 128, 0.4);">
                    <span class="font-bold text-gray-800 dark:text-gray-200" style="color: var(--nexus-text-primary, #ffffff);">現金淨增減</span>
                    <span class="text-gray-800 dark:text-gray-200 font-bold" style="color: var(--nexus-text-primary, #ffffff);">${{ number_format($cashFlowData['net_cash_flow'] ?? 0, 0) }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- 現金流健康指標 -->
    <div class="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-400">現金流健康指標</h4>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="text-center">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {{ $cashFlowData['net_cash_flow'] != 0 ? round(($cashFlowData['operating']['total'] / abs($cashFlowData['net_cash_flow'])) * 100) : 0 }}%
                </div>
                <div class="text-sm text-blue-700 dark:text-blue-300">營業現金流佔比</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">4.2</div>
                <div class="text-sm text-blue-700 dark:text-blue-300">現金週轉率</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">68天</div>
                <div class="text-sm text-blue-700 dark:text-blue-300">現金週期</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">12.8%</div>
                <div class="text-sm text-blue-700 dark:text-blue-300">現金收益率</div>
            </div>
        </div>
    </div>
</div>

@push('styles')
<style>
    #cashFlowChart {
        max-height: 200px;
    }
</style>
@endpush

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('cashFlowChart').getContext('2d');
    
    // 模擬6個月的現金流數據
    const months = ['7月', '8月', '9月', '10月', '11月', '12月'];
    const operatingData = [2800000, 3100000, 2900000, 3200000, 3000000, {{ $cashFlowData['operating']['total'] ?? 3200000 }}];
    const investingData = [-800000, -1200000, -900000, -1100000, -1300000, {{ $cashFlowData['investing']['total'] ?? -1500000 }}];
    const financingData = [500000, -200000, 300000, -100000, 200000, {{ $cashFlowData['financing']['total'] ?? -450000 }}];
    
    // 計算淨現金流
    const netCashFlow = operatingData.map((val, index) => 
        val + investingData[index] + financingData[index]
    );
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: '營業活動現金流',
                data: operatingData,
                borderColor: 'rgba(34, 197, 94, 1)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 2,
                fill: false
            }, {
                label: '投資活動現金流',
                data: investingData,
                borderColor: 'rgba(249, 115, 22, 1)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderWidth: 2,
                fill: false
            }, {
                label: '籌資活動現金流',
                data: financingData,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: false
            }, {
                label: '淨現金流',
                data: netCashFlow,
                borderColor: 'rgba(107, 114, 128, 1)',
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') || '#94a3b8',
                        font: {
                            size: 11
                        },
                        padding: 15
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(107, 114, 128, 0.1)'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') || '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(107, 114, 128, 0.1)'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') || '#94a3b8',
                        callback: function(value) {
                            return '$' + (value / 1000000).toFixed(1) + 'M';
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    // 深色模式支援
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const isDark = document.documentElement.classList.contains('dark') || 
                             document.body.classList.contains('dark');
                
                chart.options.plugins.legend.labels.color = isDark ? '#94a3b8' : '#6b7280';
                chart.options.scales.x.ticks.color = isDark ? '#94a3b8' : '#6b7280';
                chart.options.scales.y.ticks.color = isDark ? '#94a3b8' : '#6b7280';
                chart.options.scales.x.grid.color = isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)';
                chart.options.scales.y.grid.color = isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)';
                chart.update();
            }
        });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.body, { attributes: true });
});
</script>
@endpush

@endsection