@extends('layouts.app')

@section('title', '採購訂單詳情')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">採購訂單 #{{ $purchaseOrder->po_number }}</h1>
            <p class="text-gray-600 dark:text-gray-400">採購訂單詳細資料</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
            @if($purchaseOrder->status === 'pending_approval')
                <button id="approveBtn" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span id="approveBtnText">核准訂單</span>
                </button>
            @endif
            
            @if(in_array($purchaseOrder->status, ['draft', 'pending_approval']))
                <a href="{{ route('orders.purchase.edit', $orderId) }}" 
                   class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    編輯訂單
                </a>
            @endif
            
            <a href="{{ route('orders.purchase.index') }}" 
               class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回列表
            </a>
        </div>
    </div>

    <!-- Order Details Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Order Information -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">訂單資訊</h3>
            </div>
            <div class="px-6 py-4 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">訂單編號：</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ $purchaseOrder->po_number }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">供應商：</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ $purchaseOrder->supplier->name ?? '未指定供應商' }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">狀態：</label>
                    @php
                        $statusColors = [
                            'draft' => 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                            'pending_approval' => 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white',
                            'approved' => 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                            'partially_received' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                            'received' => 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
                            'cancelled' => 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        ];
                        $statusLabels = [
                            'draft' => '草稿',
                            'pending_approval' => '待核准',  
                            'approved' => '已核准',
                            'partially_received' => '部分收貨',
                            'received' => '已完成',
                            'cancelled' => '已取消'
                        ];
                        $statusClass = $statusColors[$purchaseOrder->status] ?? 'bg-gray-100 text-gray-800';
                        $statusLabel = $statusLabels[$purchaseOrder->status] ?? $purchaseOrder->status;
                    @endphp
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {{ $statusClass }}">
                        {{ $statusLabel }}
                    </span>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">訂單日期：</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ $purchaseOrder->order_date->format('Y-m-d') }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">預期交貨：</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ $purchaseOrder->expected_delivery_date?->format('Y-m-d') ?? '未指定' }}</p>
                </div>
            </div>
        </div>

        <!-- Order Summary -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">訂單摘要</h3>
            </div>
            <div class="px-6 py-4 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">幣別：</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ $purchaseOrder->currency ?? 'USD' }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">付款條件：</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ $purchaseOrder->payment_terms ?? '未指定' }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">小計：</label>
                    <p class="text-sm text-gray-900 dark:text-white">${{ number_format($purchaseOrder->subtotal, 2) }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">稅金：</label>
                    <p class="text-sm text-gray-900 dark:text-white">${{ number_format($purchaseOrder->tax_amount, 2) }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">總計：</label>
                    <p class="text-lg font-bold text-gray-900 dark:text-white">${{ number_format($purchaseOrder->total_amount, 2) }}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Order Items -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">訂單項目</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">產品</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">數量</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">單價</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">總計</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">狀態</th>
                    </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    @forelse($purchaseOrder->items as $item)
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {{ $item->product->name ?? $item->product_name ?? '未知產品' }}
                                @if($item->product_sku)
                                    <br><span class="text-xs text-gray-500">SKU: {{ $item->product_sku }}</span>
                                @endif
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ $item->quantity }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${{ number_format($item->unit_price, 2) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${{ number_format($item->line_total, 2) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                @php
                                    $receivedPercent = $item->quantity > 0 ? ($item->quantity_received / $item->quantity) * 100 : 0;
                                    if ($receivedPercent == 0) {
                                        $statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
                                        $statusText = '待收貨';
                                    } elseif ($receivedPercent < 100) {
                                        $statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                                        $statusText = '部分收貨';
                                    } else {
                                        $statusClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                                        $statusText = '已收貨';
                                    }
                                @endphp
                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {{ $statusClass }}">
                                    {{ $statusText }}
                                </span>
                                @if($item->quantity_received > 0)
                                    <div class="text-xs text-gray-500 mt-1">已收: {{ $item->quantity_received }}</div>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                此採購訂單尚無項目
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <!-- Notes -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">備註</h3>
        </div>
        <div class="px-6 py-4">
            @if($purchaseOrder->notes)
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ $purchaseOrder->notes }}</p>
            @else
                <p class="text-sm text-gray-500 dark:text-gray-500 italic">無備註</p>
            @endif
        </div>
    </div>
</div>

<!-- Approve Purchase Order Modal -->
<div id="approveModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">核准採購訂單</h3>
            <div class="mt-2 px-7 py-3">
                <p class="text-sm text-gray-500 dark:text-gray-400">確定要核准此採購訂單嗎？</p>
                <div class="mt-4">
                    <textarea id="approveNotes" placeholder="核准備註（選填）" 
                              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white" 
                              rows="3"></textarea>
                </div>
            </div>
            <div class="items-center px-4 py-3">
                <button id="confirmApprove" 
                        class="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md w-24 shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 mr-2">
                    <span id="confirmApproveText">核准</span>
                </button>
                <button id="cancelApprove" 
                        class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500">
                    取消
                </button>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const approveBtn = document.getElementById('approveBtn');
    const approveModal = document.getElementById('approveModal');
    const confirmApprove = document.getElementById('confirmApprove');
    const cancelApprove = document.getElementById('cancelApprove');
    const approveNotes = document.getElementById('approveNotes');
    const confirmApproveText = document.getElementById('confirmApproveText');
    const approveBtnText = document.getElementById('approveBtnText');
    
    if (approveBtn) {
        approveBtn.addEventListener('click', function() {
            approveModal.classList.remove('hidden');
        });
    }

    if (cancelApprove) {
        cancelApprove.addEventListener('click', function() {
            approveModal.classList.add('hidden');
            approveNotes.value = '';
        });
    }

    // Close modal when clicking outside
    approveModal.addEventListener('click', function(e) {
        if (e.target === approveModal) {
            approveModal.classList.add('hidden');
            approveNotes.value = '';
        }
    });

    if (confirmApprove) {
        confirmApprove.addEventListener('click', async function() {
            try {
                // Show loading state
                confirmApproveText.textContent = '處理中...';
                confirmApprove.disabled = true;
                
                // Get authentication token
                const token = getAuthToken();
                console.log('Approval request - Token:', token ? 'exists' : 'missing');
                console.log('Approval request - Token length:', token ? token.length : 0);
                
                const orderId = {{ $orderId }};
                const headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                };
                
                if (token && token.length > 0) {
                    headers['Authorization'] = 'Bearer ' + token;
                    console.log('Approval request - Authorization header set:', headers['Authorization'].substring(0, 50) + '...');
                } else {
                    console.error('No valid token available for approval request');
                    alert('無法取得認證 token，請重新載入頁面');
                    return;
                }
                
                console.log('Request headers:', headers);
                
                const response = await fetch(`http://localhost:8082/api/purchase-orders/${orderId}/approve`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        notes: approveNotes.value.trim()
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Success - show success message and reload page
                    alert('採購訂單已成功核准！');
                    window.location.reload();
                } else {
                    // Error handling
                    console.error('Approval failed:', data);
                    let errorMessage = '核准失敗：';
                    if (data.error) {
                        errorMessage += data.error;
                    } else {
                        errorMessage += '未知錯誤';
                    }
                    alert(errorMessage);
                }
            } catch (error) {
                console.error('Network error:', error);
                alert('網路錯誤，請稍後再試');
            } finally {
                // Reset button state
                confirmApproveText.textContent = '核准';
                confirmApprove.disabled = false;
                approveModal.classList.add('hidden');
                approveNotes.value = '';
            }
        });
    }

    // Get auth token - simple approach for MVP
    function getAuthToken() {
        try {
            // For MVP, create a simple token from user session
            const user = getUserFromSession();
            if (!user) {
                console.error('No user data available');
                return null;
            }
            
            const tokenData = {
                user_id: user.id || 1191,
                email: user.email || 'test@example.com',
                name: user.name || 'Test User', // Use English to avoid encoding issues
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
            };
            
            console.log('Token data:', tokenData);
            
            // Use UTF-8 safe base64 encoding
            const token = btoa(unescape(encodeURIComponent(JSON.stringify(tokenData))));
            console.log('Generated token length:', token.length);
            return token;
        } catch (error) {
            console.error('Error generating token:', error);
            return null;
        }
    }
    
    // Get user info from current session (simplified)
    function getUserFromSession() {
        // For demo purposes, return mock user data
        // In production, this would come from Laravel session or API
        return {
            id: 1191, // Correct user ID from database
            email: 'test@example.com',
            name: 'Test User'
        };
    }
});
</script>
@endsection