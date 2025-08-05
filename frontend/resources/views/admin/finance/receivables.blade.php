@extends('admin.layouts.app')

@section('title', '應收帳款管理')

@section('content')
<div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">應收帳款管理</h1>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">管理所有應收帳款和客戶付款記錄</p>
        </div>
    </div>

    <!-- 搜尋功能 -->
    <div class="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <form method="GET" action="{{ route('admin.finance.receivables') }}" class="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">發票編號</label>
                <input type="text" name="invoice_number" value="{{ request('invoice_number') }}" 
                       placeholder="搜尋發票編號..."
                       class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">客戶名稱</label>
                <input type="text" name="customer_name" value="{{ request('customer_name') }}" 
                       placeholder="搜尋客戶名稱..."
                       class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">狀態</label>
                <select name="status" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <option value="">全部狀態</option>
                    <option value="draft" {{ request('status') == 'draft' ? 'selected' : '' }}>草稿</option>
                    <option value="sent" {{ request('status') == 'sent' ? 'selected' : '' }}>已寄出</option>
                    <option value="paid" {{ request('status') == 'paid' ? 'selected' : '' }}>已付款</option>
                    <option value="overdue" {{ request('status') == 'overdue' ? 'selected' : '' }}>逾期未付</option>
                </select>
            </div>
            <div class="flex items-end">
                <div class="flex space-x-2">
                    <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
                        搜尋
                    </button>
                    <a href="{{ route('admin.finance.receivables') }}" class="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 dark:hover:bg-gray-500">
                        清除
                    </a>
                </div>
            </div>
        </form>
    </div>

    <!-- 統計卡片 -->
    <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        @php
            $totalReceivables = $receivables->sum('outstanding_amount') ?? 0;
            $overdueReceivables = $receivables->filter(function($item) {
                return \Carbon\Carbon::parse($item->due_date)->isPast() && $item->status !== 'paid';
            })->sum('outstanding_amount') ?? 0;
            $paidReceivables = $receivables->where('status', 'paid')->sum('amount') ?? 0;
            $pendingReceivables = $receivables->where('status', 'pending')->sum('outstanding_amount') ?? 0;
        @endphp

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm">💰</span>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">總應收金額</dt>
                            <dd class="text-lg font-medium text-gray-900 dark:text-white">${{ number_format($totalReceivables, 2) }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm">⚠️</span>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">逾期帳款</dt>
                            <dd class="text-lg font-medium text-red-600 dark:text-red-400">${{ number_format($overdueReceivables, 2) }}</dd>
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
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">已收款</dt>
                            <dd class="text-lg font-medium text-green-600 dark:text-green-400">${{ number_format($paidReceivables, 2) }}</dd>
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
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">待收款</dt>
                            <dd class="text-lg font-medium text-yellow-600 dark:text-yellow-400">${{ number_format($pendingReceivables, 2) }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 應收帳款列表 -->
    <div class="mt-8 flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">發票編號</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">客戶</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">發票金額</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">未收金額</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">到期日</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">狀態</th>
                                <th scope="col" class="relative px-6 py-3"><span class="sr-only">動作</span></th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            @forelse ($receivables as $receivable)
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {{ $receivable->invoice_number ?? 'N/A' }}
                                        @if($receivable->order_number)
                                            <div class="text-xs text-gray-500 dark:text-gray-400">訂單: {{ $receivable->order_number }}</div>
                                        @endif
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {{ $receivable->customer_name ?? '未知客戶' }}
                                        @if($receivable->customer_email)
                                            <div class="text-xs text-gray-500 dark:text-gray-400">{{ $receivable->customer_email }}</div>
                                        @endif
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        ${{ number_format($receivable->amount ?? 0, 2) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        ${{ number_format($receivable->outstanding_amount ?? 0, 2) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        @php
                                            $dueDate = \Carbon\Carbon::parse($receivable->due_date);
                                            $isOverdue = $dueDate->isPast() && $receivable->status !== 'paid';
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
                                                'pending' => '待收款',
                                                'partial' => '部分付款',
                                                'paid' => '已付款',
                                                'overdue' => '逾期',
                                            ];
                                        @endphp
                                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {{ $statusColors[$receivable->status ?? 'pending'] ?? 'bg-gray-100 text-gray-800' }}">
                                            {{ $statusLabels[$receivable->status ?? 'pending'] ?? '未知' }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div class="flex space-x-2">
                                            <a href="{{ route('admin.finance.receivables.show', $receivable->id) }}" 
                                               class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                                查看
                                            </a>
                                            @if($receivable->status !== 'paid')
                                                <button class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" 
                                                        onclick="recordPayment('{{ $receivable->id }}')">
                                                    記錄付款
                                                </button>
                                            @endif
                                        </div>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                        目前沒有應收帳款資料
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
    @if(method_exists($receivables, 'hasPages') && $receivables->hasPages())
        <div class="mt-6">
            {{ $receivables->links() }}
        </div>
    @endif
</div>

<script>
function recordPayment(receivableId) {
    @if(session('admin_user') === 'DEMO')
        alert('DEMO 帳號沒有記錄付款的權限');
        return;
    @endif
    
    // 這裡可以實作付款記錄功能
    alert('付款記錄功能將在後續版本中實作');
}
</script>
@endsection