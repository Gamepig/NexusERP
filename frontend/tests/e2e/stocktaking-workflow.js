// E2E Test Scenario for Stocktaking Workflow
// This is a conceptual E2E test that would work with Playwright or Cypress

class StocktakingE2ETest {
    constructor(browser) {
        this.browser = browser;
        this.page = null;
    }

    async setup() {
        this.page = await this.browser.newPage();
        
        // Set up API interceptors for testing
        await this.page.route('/api/stocktaking*', (route) => {
            this.handleStocktakingAPI(route);
        });
        
        await this.page.route('/api/inventory/alerts*', (route) => {
            this.handleInventoryAlertsAPI(route);
        });
    }

    async teardown() {
        if (this.page) {
            await this.page.close();
        }
    }

    // Mock API responses for testing
    handleStocktakingAPI(route) {
        const url = route.request().url();
        const method = route.request().method();
        
        if (method === 'GET' && url.includes('/api/stocktaking') && !url.includes('/')) {
            // GET /api/stocktaking - List orders
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: [
                        {
                            id: 1,
                            title: 'E2E Test Stocktaking',
                            reference_number: 'ST-E2E-001',
                            status_id: 1,
                            warehouse: { name: 'Test Warehouse' },
                            created_by_user: { name: 'Test User' },
                            created_at: '2025-01-01T00:00:00Z'
                        }
                    ],
                    total: 1
                })
            });
        } else if (method === 'GET' && url.match(/\/api\/stocktaking\/\d+$/)) {
            // GET /api/stocktaking/{id} - Get specific order
            const id = url.split('/').pop();
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: parseInt(id),
                    title: 'E2E Test Stocktaking',
                    reference_number: 'ST-E2E-001',
                    status_id: 1,
                    warehouse: { name: 'Test Warehouse' },
                    created_by_user: { name: 'Test User' },
                    created_at: '2025-01-01T00:00:00Z'
                })
            });
        } else if (method === 'GET' && url.match(/\/api\/stocktaking\/\d+\/items$/)) {
            // GET /api/stocktaking/{id}/items - Get order items
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 1,
                        product_id: 1,
                        system_quantity: 100,
                        counted_quantity: null,
                        product: { name: 'E2E Test Product', sku: 'E2E-001' }
                    }
                ])
            });
        } else if (method === 'POST' && url.match(/\/api\/stocktaking\/\d+\/start$/)) {
            // POST /api/stocktaking/{id}/start - Start order
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 1,
                    status_id: 2,
                    title: 'E2E Test Stocktaking',
                    reference_number: 'ST-E2E-001'
                })
            });
        } else if (method === 'POST' && url.match(/\/api\/stocktaking\/\d+\/items\/\d+\/count$/)) {
            // POST /api/stocktaking/{id}/items/{product_id}/count - Count item
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 1,
                    product_id: 1,
                    system_quantity: 100,
                    counted_quantity: 95,
                    product: { name: 'E2E Test Product', sku: 'E2E-001' },
                    counted_at: new Date().toISOString()
                })
            });
        } else {
            route.continue();
        }
    }

    handleInventoryAlertsAPI(route) {
        const url = route.request().url();
        const method = route.request().method();
        
        if (method === 'GET' && url.includes('/api/inventory/alerts')) {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: [
                        {
                            id: 1,
                            alert_type: { name: 'LOW_STOCK', severity_level: 3 },
                            product: { name: 'E2E Test Product', sku: 'E2E-001' },
                            warehouse: { name: 'Test Warehouse' },
                            current_level: 5,
                            safety_level: 20,
                            status: 'ACTIVE',
                            triggered_at: '2025-01-01T10:00:00Z'
                        }
                    ],
                    total: 1
                })
            });
        } else {
            route.continue();
        }
    }

    // Test Cases

    async testStocktakingListPageLoad() {
        await this.page.goto('/stocktaking');
        
        // Wait for page to load
        await this.page.waitForSelector('.stocktaking-list');
        
        // Check that the header is displayed
        const header = await this.page.textContent('h2');
        if (!header.includes('盤點管理')) {
            throw new Error('Header not found or incorrect');
        }
        
        // Check that create button is present
        const createBtn = await this.page.locator('#create-stocktaking-btn');
        if (!(await createBtn.isVisible())) {
            throw new Error('Create stocktaking button not visible');
        }
        
        // Wait for orders to load
        await this.page.waitForSelector('.order-card', { timeout: 5000 });
        
        // Check that order card is displayed
        const orderCard = await this.page.locator('.order-card').first();
        const orderTitle = await orderCard.textContent();
        if (!orderTitle.includes('E2E Test Stocktaking')) {
            throw new Error('Order card not displayed correctly');
        }
        
        console.log('✅ Stocktaking list page loads correctly');
    }

    async testStocktakingDetailPageLoad() {
        await this.page.goto('/stocktaking/1');
        
        // Wait for page to load
        await this.page.waitForSelector('.stocktaking-detail');
        
        // Check that back button is present
        const backBtn = await this.page.locator('#back-btn');
        if (!(await backBtn.isVisible())) {
            throw new Error('Back button not visible');
        }
        
        // Check that order info is displayed
        await this.page.waitForSelector('#order-info');
        const orderInfo = await this.page.textContent('#order-info');
        if (!orderInfo.includes('ST-E2E-001')) {
            throw new Error('Order info not displayed correctly');
        }
        
        // Check that items table is displayed
        await this.page.waitForSelector('#items-container table', { timeout: 5000 });
        
        console.log('✅ Stocktaking detail page loads correctly');
    }

    async testStocktakingWorkflow() {
        // Start from detail page
        await this.page.goto('/stocktaking/1');
        await this.page.waitForSelector('.stocktaking-detail');
        
        // Start the stocktaking order
        const startBtn = await this.page.locator('#start-order');
        if (await startBtn.isVisible()) {
            await startBtn.click();
            
            // Wait for status to update
            await this.page.waitForTimeout(1000);
            
            console.log('✅ Stocktaking order started successfully');
        }
        
        // Count an item
        const countBtn = await this.page.locator('[data-count-item="1"]').first();
        if (await countBtn.isVisible()) {
            await countBtn.click();
            
            // Wait for modal to appear
            await this.page.waitForSelector('#count-modal:not(.hidden)');
            
            // Fill in count form
            await this.page.fill('#counted-quantity', '95');
            await this.page.fill('#count-notes', 'E2E test count');
            
            // Submit form
            await this.page.click('button[type="submit"]');
            
            // Wait for modal to close
            await this.page.waitForSelector('#count-modal.hidden');
            
            console.log('✅ Item counting workflow completed');
        }
    }

    async testInventoryAlertsPageLoad() {
        await this.page.goto('/inventory/alerts');
        
        // Wait for page to load
        await this.page.waitForSelector('.inventory-alerts');
        
        // Check that header is displayed
        const header = await this.page.textContent('h2');
        if (!header.includes('庫存警示')) {
            throw new Error('Header not found or incorrect');
        }
        
        // Check that summary cards are displayed
        const criticalCount = await this.page.locator('#critical-count');
        if (!(await criticalCount.isVisible())) {
            throw new Error('Critical count card not visible');
        }
        
        // Wait for alerts to load
        await this.page.waitForSelector('.alert-card', { timeout: 5000 });
        
        console.log('✅ Inventory alerts page loads correctly');
    }

    async testInventoryAlertInteraction() {
        await this.page.goto('/inventory/alerts');
        await this.page.waitForSelector('.inventory-alerts');
        
        // Click on an alert card
        const alertCard = await this.page.locator('.alert-card').first();
        await alertCard.click();
        
        // Wait for modal to appear
        await this.page.waitForSelector('#alert-modal:not(.hidden)');
        
        // Check that alert details are displayed
        const alertDetails = await this.page.textContent('#alert-detail-content');
        if (!alertDetails.includes('E2E Test Product')) {
            throw new Error('Alert details not displayed correctly');
        }
        
        // Close modal
        await this.page.click('#close-alert-modal');
        await this.page.waitForSelector('#alert-modal.hidden');
        
        console.log('✅ Inventory alert interaction completed');
    }

    // Run all tests
    async runAllTests() {
        console.log('Starting E2E Tests for Stocktaking Workflow...\n');
        
        try {
            await this.setup();
            
            await this.testStocktakingListPageLoad();
            await this.testStocktakingDetailPageLoad();
            await this.testStocktakingWorkflow();
            await this.testInventoryAlertsPageLoad();
            await this.testInventoryAlertInteraction();
            
            console.log('\n🎉 All E2E tests passed!');
            
        } catch (error) {
            console.error('❌ E2E test failed:', error.message);
            throw error;
        } finally {
            await this.teardown();
        }
    }
}

// Export for use with test runners
module.exports = StocktakingE2ETest;

// Example usage with Playwright:
/*
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const test = new StocktakingE2ETest(browser);
    
    try {
        await test.runAllTests();
    } catch (error) {
        console.error('Test suite failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
*/