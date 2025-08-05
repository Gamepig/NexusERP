/**
 * NexusERP Sales Order - Detailed Investigation
 * Focus on the critical 500 error and form functionality issues
 */

const { test, expect } = require('@playwright/test');

test.describe('Sales Order Detailed Investigation', () => {
    let errorDetails = [];

    test.beforeEach(async ({ page }) => {
        errorDetails = [];

        // Capture all network responses with detailed error information  
        page.on('response', async response => {
            if (response.status() >= 400) {
                try {
                    const body = await response.text();
                    errorDetails.push({
                        url: response.url(),
                        status: response.status(),
                        statusText: response.statusText(),
                        headers: await response.allHeaders(),
                        body: body.length > 1000 ? body.substring(0, 1000) + '...' : body,
                        timestamp: new Date().toISOString()
                    });
                } catch (e) {
                    errorDetails.push({
                        url: response.url(),
                        status: response.status(),
                        statusText: response.statusText(),
                        error: 'Could not read response body: ' + e.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });
    });

    test('Investigate Sales Order Edit 500 Error', async ({ page }) => {
        console.log('\n🔍 INVESTIGATING: Sales Order Edit 500 Error');
        
        // Login first
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        console.log('✅ Login successful, now testing sales order edit...');

        // Test different sales order IDs to see if it's a specific order issue
        const testOrderIds = [244, 1, 2, 100];
        
        for (const orderId of testOrderIds) {
            console.log(`\n--- Testing Order ID: ${orderId} ---`);
            
            try {
                const response = await page.goto(`http://127.0.0.1:8000/orders/sales/${orderId}/edit`, {
                    waitUntil: 'networkidle',
                    timeout: 10000
                });

                console.log(`Order ${orderId}: ${response.status()} ${response.statusText()}`);
                
                if (response.status() === 200) {
                    // Check if form elements are present
                    const customerDropdown = await page.locator('select[name="customer_id"]').count();
                    const submitButton = await page.locator('button[type="submit"]').count();
                    console.log(`  ✅ Form elements - Customer: ${customerDropdown}, Submit: ${submitButton}`);
                    
                    await page.screenshot({ 
                        path: `screenshots/order-${orderId}-success.png`,
                        fullPage: true 
                    });
                    break; // Found a working order, no need to test more
                }
                
            } catch (error) {
                console.log(`  ❌ Order ${orderId} failed: ${error.message}`);
            }
        }

        // Check if it's a general route issue
        console.log('\n--- Testing Sales Orders List ---');
        try {
            await page.goto('http://127.0.0.1:8000/orders/sales', {
                waitUntil: 'networkidle',
                timeout: 10000
            });
            
            const salesOrderRows = await page.locator('table tbody tr, .order-item, .sales-order').count();
            console.log(`Sales orders list loaded: ${salesOrderRows} orders found`);
            
            // Look for edit buttons/links
            const editLinks = await page.locator('a[href*="/edit"], button:has-text("編輯"), .edit-btn').count();
            console.log(`Edit links found: ${editLinks}`);
            
            if (editLinks > 0) {
                // Try clicking the first edit link
                await page.locator('a[href*="/edit"], button:has-text("編輯"), .edit-btn').first().click();
                await page.waitForTimeout(2000);
                
                const currentUrl = page.url();
                console.log(`After clicking edit: ${currentUrl}`);
            }
            
        } catch (error) {
            console.log(`❌ Sales orders list failed: ${error.message}`);
        }
    });

    test('Investigate Sales Order Create Form Issues', async ({ page }) => {
        console.log('\n📝 INVESTIGATING: Sales Order Create Form Issues');
        
        // Login
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        // Navigate to create form
        await page.goto('http://127.0.0.1:8000/customers/1/orders/create', {
            waitUntil: 'networkidle',
            timeout: 10000
        });

        console.log('✅ Create form loaded, analyzing functionality...');

        // Detailed form analysis
        const formElements = {
            customerDropdown: await page.locator('select[name="customer_id"]').count(),
            orderDateInput: await page.locator('input[name="order_date"]').count(),
            statusDropdown: await page.locator('select[name="status"]').count(),
            notesTextarea: await page.locator('textarea[name="notes"]').count(),
            addItemButton: await page.locator('button:has-text("新增項目"), .add-item, #add-item').count(),
            submitButton: await page.locator('button[type="submit"]').count()
        };

        console.log('Form Elements Analysis:');
        Object.entries(formElements).forEach(([key, count]) => {
            console.log(`  ${key}: ${count}`);
        });

        // Test the "Add Item" functionality
        console.log('\n--- Testing Add Item Functionality ---');
        const addButton = await page.locator('button:has-text("新增項目"), .add-item, #add-item').first();
        
        if (await addButton.count() > 0) {
            console.log('Found add item button, clicking...');
            await addButton.click();
            await page.waitForTimeout(1000);
            
            // Look for new form fields
            const productSelects = await page.locator('select[name*="product"], .product-select').count();
            const quantityInputs = await page.locator('input[name*="quantity"], input[type="number"]').count();
            const priceInputs = await page.locator('input[name*="price"], input[name*="unit_price"]').count();
            
            console.log(`After clicking add:`)
            console.log(`  Product selects: ${productSelects}`);
            console.log(`  Quantity inputs: ${quantityInputs}`);  
            console.log(`  Price inputs: ${priceInputs}`);
            
            // Take screenshot of expanded form
            await page.screenshot({ 
                path: 'screenshots/create-form-expanded.png',
                fullPage: true 
            });
            
            // If we have product dropdown, try to interact with it
            if (productSelects > 0) {
                const productSelect = page.locator('select[name*="product"], .product-select').first();
                const options = await productSelect.locator('option').count();
                console.log(`  Product options available: ${options}`);
                
                if (options > 1) {
                    await productSelect.selectOption({ index: 1 });
                    console.log('  ✅ Product selected');
                }
            }
            
            // Try filling quantity
            if (quantityInputs > 0) {
                await page.locator('input[name*="quantity"], input[type="number"]').first().fill('5');
                console.log('  ✅ Quantity filled');
            }
            
            // Try filling price
            if (priceInputs > 0) {
                await page.locator('input[name*="price"], input[name*="unit_price"]').first().fill('100.00');
                console.log('  ✅ Price filled');
            }
            
        } else {
            console.log('❌ Add item button not found');
        }

        // Test form submission
        console.log('\n--- Testing Form Submission ---');
        if (formElements.submitButton > 0) {
            // Fill required fields first
            if (formElements.customerDropdown > 0) {
                await page.locator('select[name="customer_id"]').selectOption({ index: 1 });
                console.log('  ✅ Customer selected');
            }
            
            console.log('  Attempting form submission...');
            await page.locator('button[type="submit"]').click();
            await page.waitForTimeout(3000);
            
            // Check for validation messages or success/error indicators
            const validationErrors = await page.locator('.alert-danger, .error, .invalid-feedback').count();
            const successMessages = await page.locator('.alert-success, .success').count();
            
            console.log(`  Validation errors: ${validationErrors}`);
            console.log(`  Success messages: ${successMessages}`);
            
            if (validationErrors > 0) {
                const errorTexts = await page.locator('.alert-danger, .error, .invalid-feedback').allTextContents();
                console.log('  Error messages:', errorTexts);
            }
            
            // Take final screenshot
            await page.screenshot({ 
                path: 'screenshots/create-form-after-submit.png',
                fullPage: true 
            });
        }
    });

    test('Test API Endpoints Directly', async ({ page }) => {
        console.log('\n🔌 TESTING: API Endpoints Directly');
        
        // Login to get session
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        const apiTests = [
            {
                name: 'Customers API',
                url: 'http://127.0.0.1:8000/api/customers',
                method: 'GET'
            },
            {
                name: 'Products API', 
                url: 'http://127.0.0.1:8000/api/products',
                method: 'GET'
            },
            {
                name: 'Sales Orders API',
                url: 'http://127.0.0.1:8000/api/sales-orders',
                method: 'GET'
            },
            {
                name: 'Specific Sales Order',
                url: 'http://127.0.0.1:8000/api/sales-orders/244',
                method: 'GET'
            }
        ];

        for (const apiTest of apiTests) {
            console.log(`\n--- Testing ${apiTest.name} ---`);
            
            try {
                const response = await page.request.get(apiTest.url);
                console.log(`${apiTest.name}: ${response.status()} ${response.statusText()}`);
                
                if (response.status() === 200) {
                    const contentType = response.headers()['content-type'];
                    console.log(`  Content-Type: ${contentType}`);
                    
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        if (Array.isArray(data)) {
                            console.log(`  Data: Array with ${data.length} items`);
                            if (data.length > 0) {
                                console.log(`  Sample item keys: ${Object.keys(data[0]).join(', ')}`);
                            }
                        } else {
                            console.log(`  Data: Object with keys: ${Object.keys(data).join(', ')}`);
                        }
                    }
                } else {
                    const errorText = await response.text();
                    console.log(`  Error: ${errorText.substring(0, 200)}`);
                }
                
            } catch (error) {
                console.log(`  ❌ ${apiTest.name} failed: ${error.message}`);
            }
        }
    });

    test.afterEach(async ({ page }) => {
        // Print detailed error information
        if (errorDetails.length > 0) {
            console.log('\n' + '='.repeat(80));
            console.log('📋 DETAILED ERROR ANALYSIS');
            console.log('='.repeat(80));
            
            errorDetails.forEach((error, index) => {
                console.log(`\n${index + 1}. ${error.status} ${error.statusText}`);
                console.log(`   URL: ${error.url}`);
                console.log(`   Time: ${error.timestamp}`);
                
                if (error.headers) {
                    console.log(`   Headers: ${JSON.stringify(error.headers, null, 2)}`);
                }
                
                if (error.body) {
                    console.log(`   Response Body:`);
                    console.log(`   ${error.body}`);
                }
                
                if (error.error) {
                    console.log(`   Error: ${error.error}`);
                }
            });
        }
    });
});