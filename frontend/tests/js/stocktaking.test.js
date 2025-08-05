// Basic component tests for stocktaking functionality
// This is a simple test framework for browser testing

class TestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('Running Stocktaking Component Tests...');
        
        for (const test of this.tests) {
            try {
                await test.testFn();
                this.results.push({ name: test.name, status: 'PASS' });
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.results.push({ name: test.name, status: 'FAIL', error: error.message });
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }
        
        this.printSummary();
    }

    printSummary() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        console.log('\n=== Test Summary ===');
        console.log(`Total: ${this.results.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        
        if (failed > 0) {
            console.log('\nFailed Tests:');
            this.results.filter(r => r.status === 'FAIL').forEach(r => {
                console.log(`- ${r.name}: ${r.error}`);
            });
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected "${expected}", but got "${actual}"`);
        }
    }

    assertExists(element, message) {
        if (!element) {
            throw new Error(message || 'Element does not exist');
        }
    }
}

// Test suite
const testFramework = new TestFramework();

// Helper function to create a test container
function createTestContainer() {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    return container;
}

function cleanupTestContainer() {
    const container = document.getElementById('test-container');
    if (container) {
        container.remove();
    }
}

// Mock API responses
const mockStocktakingAPI = {
    getOrders: () => Promise.resolve({
        data: [
            {
                id: 1,
                title: 'Test Stocktaking Order',
                reference_number: 'ST-2025-001',
                status_id: 1,
                warehouse: { name: 'Main Warehouse' },
                created_by_user: { name: 'Test User' },
                created_at: '2025-01-01T00:00:00Z'
            }
        ]
    }),
    getOrder: (id) => Promise.resolve({
        id: parseInt(id),
        title: 'Test Stocktaking Order',
        reference_number: 'ST-2025-001',
        status_id: 1,
        warehouse: { name: 'Main Warehouse' },
        created_by_user: { name: 'Test User' },
        created_at: '2025-01-01T00:00:00Z'
    }),
    getOrderItems: () => Promise.resolve([
        {
            id: 1,
            product_id: 1,
            system_quantity: 100,
            counted_quantity: null,
            product: { name: 'Test Product', sku: 'TEST-001' }
        }
    ])
};

// Test StocktakingAPI class
testFramework.test('StocktakingAPI should be defined', () => {
    testFramework.assert(typeof StocktakingAPI === 'function', 'StocktakingAPI class should be defined');
});

testFramework.test('StocktakingState should be defined', () => {
    testFramework.assert(typeof StocktakingState === 'function', 'StocktakingState class should be defined');
});

testFramework.test('StocktakingList should render container', () => {
    const container = createTestContainer();
    
    // Mock the stocktaking state
    window.stocktakingState = {
        subscribe: () => () => {},
        loadOrders: () => {},
        state: { orders: [], loading: false, error: null }
    };
    
    const component = new StocktakingList(container);
    
    testFramework.assertExists(container.querySelector('.stocktaking-list'), 'Stocktaking list container should be rendered');
    testFramework.assertExists(container.querySelector('#create-stocktaking-btn'), 'Create button should be rendered');
    testFramework.assertExists(container.querySelector('#orders-container'), 'Orders container should be rendered');
    
    cleanupTestContainer();
});

testFramework.test('StocktakingList should handle empty orders', () => {
    const container = createTestContainer();
    
    window.stocktakingState = {
        subscribe: () => () => {},
        loadOrders: () => {},
        state: { orders: [], loading: false, error: null }
    };
    
    const component = new StocktakingList(container);
    component.renderOrders([]);
    
    const ordersContainer = container.querySelector('#orders-container');
    testFramework.assert(ordersContainer.textContent.includes('尚無盤點單據'), 'Should display empty state message');
    
    cleanupTestContainer();
});

testFramework.test('StocktakingList should render order cards', () => {
    const container = createTestContainer();
    
    window.stocktakingState = {
        subscribe: () => () => {},
        loadOrders: () => {},
        state: { orders: [], loading: false, error: null }
    };
    
    const component = new StocktakingList(container);
    const mockOrders = [{
        id: 1,
        title: 'Test Order',
        reference_number: 'ST-001',
        status_id: 1,
        warehouse: { name: 'Test Warehouse' },
        created_by_user: { name: 'Test User' },
        created_at: '2025-01-01T00:00:00Z'
    }];
    
    component.renderOrders(mockOrders);
    
    const orderCard = container.querySelector('.order-card');
    testFramework.assertExists(orderCard, 'Order card should be rendered');
    testFramework.assert(orderCard.textContent.includes('Test Order'), 'Order title should be displayed');
    testFramework.assert(orderCard.textContent.includes('ST-001'), 'Reference number should be displayed');
    
    cleanupTestContainer();
});

testFramework.test('StocktakingDetail should render container', () => {
    const container = createTestContainer();
    
    window.stocktakingState = {
        subscribe: () => () => {},
        loadOrder: () => {},
        loadOrderItems: () => {},
        state: { currentOrder: null, orderItems: [], loading: false, error: null }
    };
    
    const component = new StocktakingDetail(container, 1);
    
    testFramework.assertExists(container.querySelector('.stocktaking-detail'), 'Stocktaking detail container should be rendered');
    testFramework.assertExists(container.querySelector('#back-btn'), 'Back button should be rendered');
    testFramework.assertExists(container.querySelector('#order-info'), 'Order info section should be rendered');
    testFramework.assertExists(container.querySelector('#items-container'), 'Items container should be rendered');
    
    cleanupTestContainer();
});

testFramework.test('InventoryAlerts should render container', () => {
    const container = createTestContainer();
    
    window.stocktakingState = {
        subscribe: () => () => {},
        loadInventoryAlerts: () => {},
        state: { inventoryAlerts: [], loading: false, error: null }
    };
    
    const component = new InventoryAlerts(container);
    
    testFramework.assertExists(container.querySelector('.inventory-alerts'), 'Inventory alerts container should be rendered');
    testFramework.assertExists(container.querySelector('#refresh-alerts'), 'Refresh button should be rendered');
    testFramework.assertExists(container.querySelector('#alerts-container'), 'Alerts container should be rendered');
    testFramework.assertExists(container.querySelector('#critical-count'), 'Critical count should be rendered');
    
    cleanupTestContainer();
});

testFramework.test('InventoryAlerts should handle empty alerts', () => {
    const container = createTestContainer();
    
    window.stocktakingState = {
        subscribe: () => () => {},
        loadInventoryAlerts: () => {},
        state: { inventoryAlerts: [], loading: false, error: null }
    };
    
    const component = new InventoryAlerts(container);
    component.renderAlerts([]);
    
    const alertsContainer = container.querySelector('#alerts-container');
    testFramework.assert(alertsContainer.textContent.includes('暫無警示'), 'Should display empty state message');
    
    cleanupTestContainer();
});

// Global utility tests
testFramework.test('NexusERP utilities should be defined', () => {
    testFramework.assert(typeof window.NexusERP === 'object', 'NexusERP utilities should be defined');
    testFramework.assert(typeof window.NexusERP.formatCurrency === 'function', 'formatCurrency should be defined');
    testFramework.assert(typeof window.NexusERP.formatDate === 'function', 'formatDate should be defined');
    testFramework.assert(typeof window.NexusERP.showNotification === 'function', 'showNotification should be defined');
});

testFramework.test('formatCurrency should format numbers correctly', () => {
    const result = window.NexusERP.formatCurrency(1000);
    testFramework.assert(result.includes('1,000'), 'Should format currency with commas');
});

// Run tests when page loads (for manual testing)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only run tests if in test environment
        if (window.location.search.includes('test=true')) {
            setTimeout(() => {
                testFramework.run();
            }, 1000);
        }
    });
}

// Export for Node.js testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testFramework, TestFramework };
}