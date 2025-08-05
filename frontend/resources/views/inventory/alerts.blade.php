@extends('layouts.app')

@section('title', '庫存管理')

@section('content')
<div class="min-h-screen nexus-bg-primary p-6">
    <div class="max-w-7xl mx-auto">
        {{-- 頁面標題區域 --}}
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold nexus-text-primary">庫存管理</h1>
            <div class="flex space-x-2">
                <div class="flex space-x-1">
                    <button type="button" class="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors" id="view-alerts">
                        <i class="fas fa-exclamation-triangle mr-1"></i> 庫存警示
                    </button>
                    <button type="button" class="px-3 py-2 text-sm nexus-bg-secondary nexus-text-secondary border nexus-border-primary rounded-md hover:nexus-bg-tertiary transition-colors" id="view-levels">
                        <i class="fas fa-boxes mr-1"></i> 庫存水準
                    </button>
                    <button type="button" class="px-3 py-2 text-sm nexus-bg-secondary nexus-text-secondary border nexus-border-primary rounded-md hover:nexus-bg-tertiary transition-colors" id="view-transactions">
                        <i class="fas fa-exchange-alt mr-1"></i> 交易記錄
                    </button>
                </div>
                <button type="button" class="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors" id="add-inventory">
                    <i class="fas fa-plus mr-1"></i> 新增庫存
                </button>
            </div>
        </div>

        {{-- 統計卡片區域 --}}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            <div class="nexus-card border-l-4 border-yellow-500">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-xs font-semibold text-yellow-600 uppercase mb-1">
                            低庫存警告
                        </div>
                        <div class="text-2xl font-bold nexus-text-primary" id="low-stock-count">
                            <div class="animate-spin w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full inline-block"></div>
                        </div>
                    </div>
                    <div>
                        <i class="fas fa-exclamation-triangle text-3xl text-yellow-500 opacity-75"></i>
                    </div>
                </div>
            </div>
            
            <div class="nexus-card border-l-4 border-red-500">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-xs font-semibold text-red-600 uppercase mb-1">
                            缺貨品項
                        </div>
                        <div class="text-2xl font-bold nexus-text-primary" id="out-of-stock-count">
                            <div class="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full inline-block"></div>
                        </div>
                    </div>
                    <div>
                        <i class="fas fa-times-circle text-3xl text-red-500 opacity-75"></i>
                    </div>
                </div>
            </div>
            
            <div class="nexus-card border-l-4 border-blue-500">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-xs font-semibold text-blue-600 uppercase mb-1">
                            過期風險
                        </div>
                        <div class="text-2xl font-bold nexus-text-primary" id="expiring-count">
                            <div class="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full inline-block"></div>
                        </div>
                    </div>
                    <div>
                        <i class="fas fa-clock text-3xl text-blue-500 opacity-75"></i>
                    </div>
                </div>
            </div>
            
            <div class="nexus-card border-l-4 border-green-500">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-xs font-semibold text-green-600 uppercase mb-1">
                            正常庫存
                        </div>
                        <div class="text-2xl font-bold nexus-text-primary" id="normal-stock-count">
                            <div class="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full inline-block"></div>
                        </div>
                    </div>
                    <div>
                        <i class="fas fa-check-circle text-3xl text-green-500 opacity-75"></i>
                    </div>
                </div>
            </div>
        </div>

        {{-- 主要內容區域 --}}
        <div class="nexus-card">
            <div class="flex justify-between items-center p-4 border-b nexus-border-primary">
                <h6 class="text-lg font-semibold nexus-text-accent">庫存警示清單</h6>
                <div class="flex items-center space-x-2">
                    {{-- 警示類型篩選 --}}
                    <div class="relative inline-block text-left">
                        <button class="px-3 py-2 text-sm nexus-bg-secondary nexus-text-secondary border nexus-border-primary rounded-md hover:nexus-bg-tertiary transition-colors" id="filter-dropdown">
                            <i class="fas fa-filter mr-1"></i> 警示類型
                            <i class="fas fa-chevron-down ml-1"></i>
                        </button>
                    </div>
                    
                    {{-- 重新整理按鈕 --}}
                    <button class="px-3 py-2 text-sm nexus-bg-secondary nexus-text-secondary border nexus-border-primary rounded-md hover:nexus-bg-tertiary transition-colors" id="refresh-alerts">
                        <i class="fas fa-sync-alt mr-1"></i> 重新整理
                    </button>
                </div>
            </div>
            <div class="p-6">
                {{-- React/Vue 組件掛載點 --}}
                <div id="inventory-alerts-app">
                    <div class="text-center py-12">
                        <div class="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p class="nexus-text-secondary">正在載入庫存警示資料...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('styles')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
    .border-left-primary {
        border-left: 0.25rem solid #4e73df !important;
    }
    .border-left-success {
        border-left: 0.25rem solid #1cc88a !important;
    }
    .border-left-warning {
        border-left: 0.25rem solid #f6c23e !important;
    }
    .border-left-info {
        border-left: 0.25rem solid #36b9cc !important;
    }
    .border-left-danger {
        border-left: 0.25rem solid #e74a3b !important;
    }
    .inventory-management-page {
        background-color: #f8f9fc;
        min-height: calc(100vh - 56px);
        padding-top: 1.5rem;
    }
    .alert-level-high {
        background-color: #f8d7da;
        border-left: 4px solid #dc3545;
    }
    .alert-level-medium {
        background-color: #fff3cd;
        border-left: 4px solid #ffc107;
    }
    .alert-level-low {
        background-color: #d1ecf1;
        border-left: 4px solid #17a2b8;
    }
</style>
@endpush

@push('scripts')
{{-- 載入 InventoryAlerts.js 組件 --}}
<script>
// 庫存警示管理 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 模擬資料
    const mockAlerts = [
        {
            id: 1,
            product_name: '電子零件 A001',
            sku: 'ELEC-A001',
            current_stock: 5,
            minimum_stock: 20,
            alert_type: 'low_stock',
            alert_level: 'high',
            location: '倉庫A-01',
            last_updated: '2025-07-23 10:30:00'
        },
        {
            id: 2,
            product_name: '電路板 B202',
            sku: 'PCB-B202',
            current_stock: 0,
            minimum_stock: 10,
            alert_type: 'out_of_stock',
            alert_level: 'high',
            location: '倉庫B-15',
            last_updated: '2025-07-23 09:15:00'
        },
        {
            id: 3,
            product_name: '電容器 C305',
            sku: 'CAP-C305',
            current_stock: 15,
            minimum_stock: 30,
            alert_type: 'low_stock',
            alert_level: 'medium',
            location: '倉庫A-12',
            last_updated: '2025-07-23 08:45:00'
        },
        {
            id: 4,
            product_name: '電阻器 R150',
            sku: 'RES-R150',
            current_stock: 25,
            minimum_stock: 50,
            alert_type: 'low_stock',
            alert_level: 'low',
            location: '倉庫C-03',
            last_updated: '2025-07-23 07:20:00'
        }
    ];

    // 更新統計數據
    function updateStatistics() {
        const lowStockCount = mockAlerts.filter(alert => alert.alert_type === 'low_stock').length;
        const outOfStockCount = mockAlerts.filter(alert => alert.alert_type === 'out_of_stock').length;
        const expiringCount = mockAlerts.filter(alert => alert.alert_type === 'expiring').length;
        const normalStockCount = 50 - lowStockCount - outOfStockCount; // 假設總共50個品項

        document.getElementById('low-stock-count').innerHTML = lowStockCount;
        document.getElementById('out-of-stock-count').innerHTML = outOfStockCount;
        document.getElementById('expiring-count').innerHTML = expiringCount;
        document.getElementById('normal-stock-count').innerHTML = normalStockCount;
    }

    // 渲染警示清單
    function renderAlerts(alerts) {
        const container = document.getElementById('inventory-alerts-app');
        
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                    <h5 class="text-muted">目前沒有庫存警示</h5>
                    <p class="text-muted">所有產品庫存狀況良好</p>
                </div>
            `;
            return;
        }

        const alertsHtml = alerts.map(alert => {
            const alertBorderColor = {
                'high': 'border-l-4 border-red-500 bg-red-50',
                'medium': 'border-l-4 border-yellow-500 bg-yellow-50',
                'low': 'border-l-4 border-blue-500 bg-blue-50'
            }[alert.alert_level] || 'border-l-4 border-gray-500';

            const alertTypeText = {
                'low_stock': '低庫存',
                'out_of_stock': '缺貨',
                'expiring': '即將過期'
            }[alert.alert_type] || '未知';

            const alertIcon = {
                'low_stock': 'fas fa-exclamation-triangle text-yellow-600',
                'out_of_stock': 'fas fa-times-circle text-red-600',
                'expiring': 'fas fa-clock text-blue-600'
            }[alert.alert_type] || 'fas fa-question-circle';

            const badgeColor = {
                'high': 'bg-red-100 text-red-800',
                'medium': 'bg-yellow-100 text-yellow-800',
                'low': 'bg-blue-100 text-blue-800'
            }[alert.alert_level] || 'bg-gray-100 text-gray-800';

            return `
                <div class="nexus-card mb-4 ${alertBorderColor}">
                    <div class="flex items-center p-4">
                        <div class="flex-shrink-0 mr-4">
                            <i class="${alertIcon} text-3xl"></i>
                        </div>
                        <div class="flex-1">
                            <h5 class="text-lg font-semibold nexus-text-primary mb-1">${alert.product_name}</h5>
                            <p class="text-sm nexus-text-secondary mb-2">SKU: ${alert.sku} | 位置: ${alert.location}</p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div>
                                    <strong>目前庫存:</strong> ${alert.current_stock} 件
                                </div>
                                <div>
                                    <strong>最低庫存:</strong> ${alert.minimum_stock} 件
                                </div>
                            </div>
                        </div>
                        <div class="flex-shrink-0 text-center mr-4">
                            <span class="px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}">
                                ${alertTypeText}
                            </span>
                            <div class="text-xs nexus-text-secondary mt-1">${alert.last_updated}</div>
                        </div>
                        <div class="flex-shrink-0">
                            <div class="flex space-x-2">
                                <button class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" onclick="editStock(${alert.id})">
                                    <i class="fas fa-edit mr-1"></i> 調整
                                </button>
                                <button class="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors" onclick="resolveAlert(${alert.id})">
                                    <i class="fas fa-check mr-1"></i> 解決
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = alertsHtml;
    }

    // 初始化頁面
    setTimeout(() => {
        updateStatistics();
        renderAlerts(mockAlerts);
    }, 1000);

    // 事件監聽器
    document.getElementById('refresh-alerts').addEventListener('click', function() {
        document.getElementById('inventory-alerts-app').innerHTML = `
            <div class="text-center py-12">
                <div class="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p class="nexus-text-secondary">正在重新載入庫存警示資料...</p>
            </div>
        `;
        setTimeout(() => {
            updateStatistics();
            renderAlerts(mockAlerts);
        }, 1500);
    });

    // 視圖切換按鈕
    document.getElementById('view-levels').addEventListener('click', function() {
        window.location.href = '/inventory/levels';
    });

    document.getElementById('view-transactions').addEventListener('click', function() {
        window.location.href = '/inventory/transactions';
    });
});

// 全域函數
function editStock(alertId) {
    alert('編輯庫存功能 - Alert ID: ' + alertId);
}

function resolveAlert(alertId) {
    if (confirm('確定要標記此警示為已解決嗎？')) {
        alert('警示已標記為解決 - Alert ID: ' + alertId);
    }
}
</script>
@endpush