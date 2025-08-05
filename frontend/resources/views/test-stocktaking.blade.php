@extends('layouts.app')

@section('title', 'Stocktaking Component Tests')

@section('content')
<div class="container mx-auto px-4 py-6">
    <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4">Stocktaking Component Tests</h2>
        
        <div class="mb-4">
            <button id="run-tests" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                執行測試
            </button>
        </div>
        
        <div id="test-results" class="bg-gray-100 p-4 rounded">
            <p>點擊「執行測試」開始測試...</p>
        </div>
        
        <div class="mt-6">
            <h3 class="text-lg font-semibold mb-2">測試組件預覽</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Stocktaking List Preview -->
                <div class="border rounded-lg p-4">
                    <h4 class="font-semibold mb-2">盤點清單組件</h4>
                    <div id="stocktaking-list-test" class="h-64 overflow-auto border">
                        <!-- Component will be rendered here -->
                    </div>
                </div>
                
                <!-- Inventory Alerts Preview -->
                <div class="border rounded-lg p-4">
                    <h4 class="font-semibold mb-2">庫存警示組件</h4>
                    <div id="inventory-alerts-test" class="h-64 overflow-auto border">
                        <!-- Component will be rendered here -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="{{ asset('tests/js/stocktaking.test.js') }}"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
    // Initialize test components
    initTestComponents();
    
    // Bind test runner
    document.getElementById('run-tests').addEventListener('click', runTests);
});

function initTestComponents() {
    // Mock stocktaking state for testing
    window.stocktakingState = {
        subscribe: (callback) => {
            // Return unsubscribe function
            return () => {};
        },
        loadOrders: () => {
            // Simulate loading orders
            setTimeout(() => {
                const mockOrders = [
                    {
                        id: 1,
                        title: '測試盤點單',
                        reference_number: 'ST-2025-001',
                        status_id: 1,
                        warehouse: { name: '主倉庫' },
                        created_by_user: { name: '測試用戶' },
                        created_at: '2025-01-01T00:00:00Z',
                        description: '這是一個測試盤點單'
                    },
                    {
                        id: 2,
                        title: '月度盤點',
                        reference_number: 'ST-2025-002',
                        status_id: 2,
                        warehouse: { name: '分倉庫' },
                        created_by_user: { name: '盤點員' },
                        created_at: '2025-01-02T00:00:00Z'
                    }
                ];
                this.state.orders = mockOrders;
                this.state.loading = false;
                this.notify();
            }, 500);
        },
        loadInventoryAlerts: () => {
            // Simulate loading alerts
            setTimeout(() => {
                const mockAlerts = [
                    {
                        id: 1,
                        alert_type: { name: 'LOW_STOCK', severity_level: 3 },
                        product: { name: '測試產品A', sku: 'TEST-001' },
                        warehouse: { name: '主倉庫' },
                        current_level: 5,
                        safety_level: 20,
                        status: 'ACTIVE',
                        triggered_at: '2025-01-01T10:00:00Z',
                        alert_message: '庫存量低於安全庫存'
                    },
                    {
                        id: 2,
                        alert_type: { name: 'OUT_OF_STOCK', severity_level: 5 },
                        product: { name: '測試產品B', sku: 'TEST-002' },
                        warehouse: { name: '主倉庫' },
                        current_level: 0,
                        safety_level: 10,
                        status: 'ACTIVE',
                        triggered_at: '2025-01-01T12:00:00Z',
                        alert_message: '商品已無庫存'
                    }
                ];
                this.state.inventoryAlerts = mockAlerts;
                this.state.loading = false;
                this.notify();
            }, 500);
        },
        state: {
            orders: [],
            inventoryAlerts: [],
            loading: false,
            error: null
        },
        listeners: [],
        notify() {
            this.listeners.forEach(listener => listener(this.state));
        }
    };
    
    // Initialize stocktaking list component
    const stocktakingContainer = document.getElementById('stocktaking-list-test');
    if (stocktakingContainer && typeof StocktakingList !== 'undefined') {
        window.testStocktakingList = new StocktakingList(stocktakingContainer);
    }
    
    // Initialize inventory alerts component
    const alertsContainer = document.getElementById('inventory-alerts-test');
    if (alertsContainer && typeof InventoryAlerts !== 'undefined') {
        window.testInventoryAlerts = new InventoryAlerts(alertsContainer);
    }
}

async function runTests() {
    const resultsDiv = document.getElementById('test-results');
    resultsDiv.innerHTML = '<p>執行測試中...</p>';
    
    // Capture console output
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
    };
    
    try {
        // Run the test framework
        await testFramework.run();
        
        // Display results
        resultsDiv.innerHTML = `
            <div class="space-y-2">
                <h4 class="font-semibold">測試結果:</h4>
                <pre class="text-sm bg-gray-800 text-green-400 p-4 rounded overflow-auto">${logs.join('\n')}</pre>
            </div>
        `;
    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="text-red-600">
                <h4 class="font-semibold">測試執行錯誤:</h4>
                <p>${error.message}</p>
            </div>
        `;
    } finally {
        // Restore console.log
        console.log = originalLog;
    }
}
</script>
@endpush