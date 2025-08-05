@extends('admin.layouts.app')

@section('title', '應付帳款管理')

@section('content')
<div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">應付帳款管理</h1>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">管理所有應付帳款和供應商付款記錄</p>
        </div>
    </div>

    <!-- 統計卡片 -->
    <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        @php
            $totalPayables = is_countable($payables) ? $payables->sum('outstanding_amount') ?? 0 : 0;
            $overduePayables = 0;
            $paidPayables = 0;
            $pendingPayables = 0;
            
            if (is_countable($payables)) {
                $overduePayables = $payables->filter(function($item) {
                    return \Carbon\Carbon::parse($item->due_date)->isPast() && $item->status !== 'paid';
                })->sum('outstanding_amount') ?? 0;
                $paidPayables = $payables->where('status', 'paid')->sum('amount') ?? 0;
                $pendingPayables = $payables->where('status', 'pending')->sum('outstanding_amount') ?? 0;
            }
        @endphp

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm">💳</span>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">總應付金額</dt>
                            <dd class="text-lg font-medium text-gray-900 dark:text-white">${{ number_format($totalPayables, 2) }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm">⚠️</span>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">逾期帳款</dt>
                            <dd class="text-lg font-medium text-red-600 dark:text-red-400">${{ number_format($overduePayables, 2) }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm">✅</span>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">已付款</dt>
                            <dd class="text-lg font-medium text-green-600 dark:text-green-400">${{ number_format($paidPayables, 2) }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm">⏳</span>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">待付款</dt>
                            <dd class="text-lg font-medium text-yellow-600 dark:text-yellow-400">${{ number_format($pendingPayables, 2) }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 搜尋表單 -->
    <div class="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">搜尋應付帳款</h3>
            <form method="GET" action="{{ route('admin.finance.payables') }}" class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                    <label for="invoice_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300">發票編號</label>
                    <input type="text" 
                           name="invoice_number" 
                           id="invoice_number"
                           value="{{ request('invoice_number') }}" 
                           placeholder="搜尋發票編號..."
                           class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                </div>

                <div>
                    <label for="supplier_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">供應商名稱</label>
                    <input type="text" 
                           name="supplier_name" 
                           id="supplier_name"
                           value="{{ request('supplier_name') }}" 
                           placeholder="搜尋供應商名稱..."
                           class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                </div>

                <div>
                    <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">狀態</label>
                    <select name="status" 
                            id="status"
                            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        <option value="">所有狀態</option>
                        <option value="draft" {{ request('status') == 'draft' ? 'selected' : '' }}>草稿</option>
                        <option value="sent" {{ request('status') == 'sent' ? 'selected' : '' }}>已寄出</option>
                        <option value="paid" {{ request('status') == 'paid' ? 'selected' : '' }}>已付款</option>
                        <option value="overdue" {{ request('status') == 'overdue' ? 'selected' : '' }}>逾期未付</option>
                    </select>
                </div>

                <div class="flex items-end space-x-2">
                    <button type="submit" 
                            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
                        <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        搜尋
                    </button>
                    
                    @if(request()->hasAny(['invoice_number', 'supplier_name', 'status']))
                        <a href="{{ route('admin.finance.payables') }}" 
                           class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
                            清除
                        </a>
                    @endif
                </div>
            </form>
        </div>
    </div>

    <!-- 應付帳款列表 -->
    <div class="mt-8 flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">發票編號</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">供應商</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">發票金額</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">未付金額</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">到期日</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">狀態</th>
                                <th scope="col" class="relative px-6 py-3"><span class="sr-only">動作</span></th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            @forelse ($payables as $payable)
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {{ $payable->invoice_number ?? 'N/A' }}
                                        @if($payable->order_number)
                                            <div class="text-xs text-gray-500 dark:text-gray-400">訂單: {{ $payable->order_number }}</div>
                                        @endif
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {{ $payable->supplier_name ?? '未知供應商' }}
                                        @if($payable->supplier_email)
                                            <div class="text-xs text-gray-500 dark:text-gray-400">{{ $payable->supplier_email }}</div>
                                        @endif
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        ${{ number_format($payable->amount ?? 0, 2) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        ${{ number_format($payable->outstanding_amount ?? 0, 2) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        @php
                                            $dueDate = \Carbon\Carbon::parse($payable->due_date);
                                            $isOverdue = $dueDate->isPast() && $payable->status !== 'paid';
                                        @endphp
                                        <span class="{{ $isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : '' }}">
                                            {{ $dueDate->format('Y-m-d') }}
                                            @if($isOverdue)
                                                <span class="text-xs">(逾期)</span>
                                            @endif
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        @php
                                            $statusColors = [
                                                'pending' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                                                'partial' => 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                                                'paid' => 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                                                'overdue' => 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
                                            ];
                                            $statusLabels = [
                                                'pending' => '待付款',
                                                'partial' => '部分付款',
                                                'paid' => '已付款',
                                                'overdue' => '逾期',
                                            ];
                                        @endphp
                                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {{ $statusColors[$payable->status ?? 'pending'] ?? 'bg-gray-100 text-gray-800' }}">
                                            {{ $statusLabels[$payable->status ?? 'pending'] ?? '未知' }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div class="flex space-x-2">
                                            <a href="{{ route('admin.finance.payables.show', $payable->id) }}" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                                查看
                                            </a>
                                            @if($payable->status !== 'paid')
                                                <button class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" 
                                                        onclick="recordPayment('{{ $payable->id }}')">
                                                    記錄付款
                                                </button>
                                            @endif
                                        </div>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                        目前沒有應付帳款資料
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- 分頁 -->
    @if(method_exists($payables, 'hasPages') && $payables->hasPages())
        <div class="mt-6">
            {{ $payables->links() }}
        </div>
    @endif
</div>

<script>
function recordPayment(payableId) {
    @if(session('admin_user') === 'DEMO')
        alert('DEMO 帳號沒有記錄付款的權限');
        return;
    @endif
    
    // 這裡可以實作付款記錄功能
    alert('付款記錄功能將在後續版本中實作');
}
</script>
@endsection