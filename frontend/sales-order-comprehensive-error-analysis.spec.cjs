/**
 * NexusERP Sales Order Functionality - Comprehensive Frontend Error Analysis
 * 
 * This test performs systematic analysis of:
 * 1. Sales Order Creation (New Order)
 * 2. Sales Order Edit (Existing Order)
 * 3. API Endpoint Testing
 * 4. Console Error Analysis
 * 
 * Focus: Find every bug and provide actionable technical solutions
 */

const { test, expect } = require('@playwright/test');

test.describe('NexusERP Sales Order Frontend Error Analysis', () => {
    let consoleErrors = [];
    let networkErrors = [];
    let apiResponses = [];

    test.beforeEach(async ({ page }) => {
        // Reset error tracking arrays
        consoleErrors = [];
        networkErrors = [];
        apiResponses = [];

        // Capture console errors
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                consoleErrors.push({
                    type: msg.type(),
                    text: msg.text(),
                    location: msg.location(),
                    timestamp: new Date().toISOString()
                });
                console.log(`🔥 CONSOLE ${msg.type().toUpperCase()}: ${msg.text()}`);
            }
        });

        // Capture network failures
        page.on('response', response => {
            const url = response.url();
            const status = response.status();
            
            if (status >= 400) {
                networkErrors.push({
                    url: url,
                    status: status,
                    statusText: response.statusText(),
                    timestamp: new Date().toISOString()
                });
                console.log(`🚨 NETWORK ERROR: ${status} ${response.statusText()} - ${url}`);
            }

            // Track API responses
            if (url.includes('/api/')) {
                apiResponses.push({
                    url: url,
                    status: status,
                    method: response.request().method(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Capture request failures
        page.on('requestfailed', request => {
            networkErrors.push({
                url: request.url(),
                failure: request.failure()?.errorText || 'Unknown error',
                method: request.method(),
                timestamp: new Date().toISOString()
            });
            console.log(`💥 REQUEST FAILED: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
        });
    });

    test('Part 1: Test Sales Order Creation (New Order)', async ({ page }) => {
        console.log('\n📋 PART 1: Testing Sales Order Creation (New Order)');
        
        try {
            // Step 1: Navigate to login page
            console.log('Step 1: Navigating to login page...');
            await page.goto('http://127.0.0.1:8000/login', { 
                waitUntil: 'networkidle',
                timeout: 10000 
            });
            
            // Take screenshot of login page
            await page.screenshot({ 
                path: 'screenshots/sales-order-test-1-login.png',
                fullPage: true 
            });

            // Step 2: Login with test credentials
            console.log('Step 2: Logging in...');
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');
            
            // Wait for dashboard to load
            await page.waitForURL('**/dashboard', { timeout: 10000 });
            console.log('✅ Login successful');

            // Step 3: Navigate to create new sales order
            console.log('Step 3: Navigating to create new sales order...');
            await page.goto('http://127.0.0.1:8000/customers/1/orders/create', {
                waitUntil: 'networkidle',
                timeout: 10000
            });

            // Take screenshot of create order page
            await page.screenshot({ 
                path: 'screenshots/sales-order-test-2-create-form.png',
                fullPage: true 
            });

            // Step 4: Analyze form elements
            console.log('Step 4: Analyzing form elements...');
            
            // Check if customer dropdown exists and loads
            const customerDropdown = await page.locator('select[name="customer_id"], #customer_id').first();
            const customerExists = await customerDropdown.count() > 0;
            console.log(`Customer dropdown exists: ${customerExists}`);
            
            if (customerExists) {
                const customerOptions = await customerDropdown.locator('option').count();
                console.log(`Customer dropdown options: ${customerOptions}`);
            }

            // Check if product selection elements exist
            const productElements = await page.locator('select[name*="product"], input[name*="product"], .product-selector').count();
            console.log(`Product selection elements: ${productElements}`);

            // Check for quantity and price inputs
            const quantityInputs = await page.locator('input[name*="quantity"], input[type="number"]').count();
            const priceInputs = await page.locator('input[name*="price"], input[name*="amount"]').count();
            console.log(`Quantity inputs: ${quantityInputs}, Price inputs: ${priceInputs}`);

            // Check for submit button
            const submitButton = await page.locator('button[type="submit"], input[type="submit"], .btn-submit').first();
            const submitExists = await submitButton.count() > 0;
            console.log(`Submit button exists: ${submitExists}`);

            // Step 5: Attempt to fill form if possible
            console.log('Step 5: Attempting to fill form...');
            
            if (customerExists) {
                try {
                    await customerDropdown.selectOption({ index: 1 });
                    console.log('✅ Customer selected');
                } catch (error) {
                    console.log(`❌ Customer selection failed: ${error.message}`);
                }
            }

            // Try to add a product if possible
            const addProductBtn = await page.locator('button:has-text("Add Product"), .add-product, #add-item').first();
            if (await addProductBtn.count() > 0) {
                try {
                    await addProductBtn.click();
                    console.log('✅ Add product button clicked');
                    
                    // Wait for product form to appear
                    await page.waitForTimeout(1000);
                } catch (error) {
                    console.log(`❌ Add product failed: ${error.message}`);
                }
            }

            // Step 6: Try to submit form
            console.log('Step 6: Attempting form submission...');
            if (submitExists) {
                try {
                    await submitButton.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ Form submission attempted');
                } catch (error) {
                    console.log(`❌ Form submission failed: ${error.message}`);
                }
            }

            // Take final screenshot
            await page.screenshot({ 
                path: 'screenshots/sales-order-test-3-after-submit.png',
                fullPage: true 
            });

        } catch (error) {
            console.log(`❌ Part 1 failed: ${error.message}`);
            await page.screenshot({ 
                path: 'screenshots/sales-order-test-1-error.png',
                fullPage: true 
            });
        }
    });

    test('Part 2: Test Sales Order Edit (Existing Order)', async ({ page }) => {
        console.log('\n📝 PART 2: Testing Sales Order Edit (Existing Order)');
        
        try {
            // Login first
            console.log('Logging in...');
            await page.goto('http://127.0.0.1:8000/login');
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 10000 });

            // Navigate to edit existing order
            console.log('Navigating to edit existing sales order...');
            await page.goto('http://127.0.0.1:8000/orders/sales/244/edit', {
                waitUntil: 'networkidle',
                timeout: 10000
            });

            // Take screenshot
            await page.screenshot({ 
                path: 'screenshots/sales-order-test-4-edit-form.png',
                fullPage: true 
            });

            // Check if page loads correctly
            const pageTitle = await page.title();
            console.log(`Page title: ${pageTitle}`);

            // Check if customer dropdown loads
            console.log('Checking customer dropdown...');
            const customerDropdown = await page.locator('select[name="customer_id"]').first();
            if (await customerDropdown.count() > 0) {
                const selectedValue = await customerDropdown.inputValue();
                const optionsCount = await customerDropdown.locator('option').count();
                console.log(`Customer dropdown - Selected: ${selectedValue}, Options: ${optionsCount}`);
            } else {
                console.log('❌ Customer dropdown not found');
            }

            // Check if product dropdowns load
            console.log('Checking product dropdowns...');
            const productDropdowns = await page.locator('select[name*="product"]').count();
            console.log(`Product dropdowns found: ${productDropdowns}`);

            // Check if existing data populates
            console.log('Checking if existing data populates...');
            const filledInputs = await page.locator('input[value!=""], select option[selected]').count();
            console.log(`Filled form elements: ${filledInputs}`);

            // Check for any error messages
            const errorMessages = await page.locator('.alert-danger, .error, .text-red-500, .is-invalid').count();
            if (errorMessages > 0) {
                console.log(`⚠️ Error messages found: ${errorMessages}`);
                const errorTexts = await page.locator('.alert-danger, .error, .text-red-500, .is-invalid').allTextContents();
                console.log('Error messages:', errorTexts);
            }

        } catch (error) {
            console.log(`❌ Part 2 failed: ${error.message}`);
            await page.screenshot({ 
                path: 'screenshots/sales-order-test-2-error.png',
                fullPage: true 
            });
        }
    });

    test('Part 3: API Endpoint Testing', async ({ page }) => {
        console.log('\n🔌 PART 3: API Endpoint Testing');
        
        try {
            // Login first
            await page.goto('http://127.0.0.1:8000/login');
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 10000 });

            // Test API endpoints
            const endpoints = [
                { name: 'Customers API', url: 'http://127.0.0.1:8000/api/customers' },
                { name: 'Products API', url: 'http://127.0.0.1:8000/api/products' },
                { name: 'Sales Orders API', url: 'http://127.0.0.1:8000/api/sales-orders' }
            ];

            for (const endpoint of endpoints) {
                console.log(`Testing ${endpoint.name}...`);
                try {
                    const response = await page.request.get(endpoint.url);
                    console.log(`${endpoint.name}: ${response.status()} ${response.statusText()}`);
                    
                    if (response.status() === 200) {
                        const data = await response.json();
                        console.log(`${endpoint.name} data length: ${Array.isArray(data) ? data.length : typeof data}`);
                    } else {
                        const errorText = await response.text();
                        console.log(`${endpoint.name} error: ${errorText.substring(0, 200)}`);
                    }
                } catch (error) {
                    console.log(`${endpoint.name} failed: ${error.message}`);
                }
            }

            // Test POST to sales orders
            console.log('Testing POST to sales orders...');
            try {
                const csrfToken = await page.locator('meta[name="csrf-token"]').getAttribute('content');
                const postData = {
                    customer_id: 1,
                    order_date: new Date().toISOString().split('T')[0],
                    items: [
                        {
                            product_id: 1,
                            quantity: 1,
                            unit_price: 100.00
                        }
                    ]
                };

                const response = await page.request.post('http://127.0.0.1:8000/api/sales-orders', {
                    data: postData,
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`POST sales order: ${response.status()} ${response.statusText()}`);
                if (response.status() !== 200 && response.status() !== 201) {
                    const errorText = await response.text();
                    console.log(`POST error: ${errorText.substring(0, 500)}`);
                }
            } catch (error) {
                console.log(`POST sales order failed: ${error.message}`);
            }

        } catch (error) {
            console.log(`❌ Part 3 failed: ${error.message}`);
        }
    });

    test('Part 4: Console Error Analysis & Detailed Reporting', async ({ page }) => {
        console.log('\n🔍 PART 4: Console Error Analysis & Detailed Reporting');
        
        // Run through all key pages to collect comprehensive error data
        const pagesToTest = [
            { name: 'Login Page', url: 'http://127.0.0.1:8000/login' },
            { name: 'Dashboard', url: 'http://127.0.0.1:8000/dashboard' },
            { name: 'Create Sales Order', url: 'http://127.0.0.1:8000/customers/1/orders/create' },
            { name: 'Edit Sales Order', url: 'http://127.0.0.1:8000/orders/sales/244/edit' },
            { name: 'Sales Orders List', url: 'http://127.0.0.1:8000/orders/sales' }
        ];

        // Login first
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        for (const testPage of pagesToTest) {
            console.log(`\n--- Testing ${testPage.name} ---`);
            try {
                await page.goto(testPage.url, { 
                    waitUntil: 'networkidle',
                    timeout: 10000 
                });
                
                // Wait for any async operations
                await page.waitForTimeout(2000);
                
                // Check for CSRF token issues
                const csrfMeta = await page.locator('meta[name="csrf-token"]').count();
                console.log(`CSRF token meta tag present: ${csrfMeta > 0}`);
                
                // Check for validation errors
                const validationErrors = await page.locator('.alert-danger, .invalid-feedback, .error').count();
                if (validationErrors > 0) {
                    console.log(`⚠️ Validation errors found: ${validationErrors}`);
                }
                
                // Check for loading states
                const loadingElements = await page.locator('.loading, .spinner, [data-loading]').count();
                console.log(`Loading elements: ${loadingElements}`);
                
            } catch (error) {
                console.log(`❌ Failed to test ${testPage.name}: ${error.message}`);
            }
        }

        // Generate comprehensive error report
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE ERROR ANALYSIS REPORT');
        console.log('='.repeat(80));

        // Console Errors Summary
        console.log('\n🔥 CONSOLE ERRORS:');
        if (consoleErrors.length === 0) {
            console.log('✅ No console errors detected');
        } else {
            consoleErrors.forEach((error, index) => {
                console.log(`${index + 1}. [${error.type.toUpperCase()}] ${error.text}`);
                if (error.location) {
                    console.log(`   Location: ${error.location.url}:${error.location.lineNumber}:${error.location.columnNumber}`);
                }
                console.log(`   Time: ${error.timestamp}`);
                console.log('');
            });
        }

        // Network Errors Summary
        console.log('\n🚨 NETWORK ERRORS:');
        if (networkErrors.length === 0) {
            console.log('✅ No network errors detected');
        } else {
            networkErrors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.method || 'GET'} ${error.url}`);
                console.log(`   Status: ${error.status || 'Failed'} ${error.statusText || error.failure || ''}`);
                console.log(`   Time: ${error.timestamp}`);
                console.log('');
            });
        }

        // API Responses Summary
        console.log('\n🔌 API RESPONSES:');
        const apiSummary = apiResponses.reduce((acc, resp) => {
            const key = `${resp.method} ${resp.url}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(resp.status);
            return acc;
        }, {});

        Object.entries(apiSummary).forEach(([endpoint, statuses]) => {
            console.log(`${endpoint}: ${statuses.join(', ')}`);
        });

        // Save detailed error report
        const errorReport = {
            timestamp: new Date().toISOString(),
            summary: {
                consoleErrors: consoleErrors.length,
                networkErrors: networkErrors.length,
                apiCalls: apiResponses.length
            },
            consoleErrors,
            networkErrors,
            apiResponses
        };

        await page.evaluate((report) => {
            console.log('📝 DETAILED ERROR REPORT:', JSON.stringify(report, null, 2));
        }, errorReport);
    });

    test.afterEach(async ({ page }) => {
        // Generate priority-ranked issue summary
        console.log('\n' + '='.repeat(80));
        console.log('🎯 PRIORITY-RANKED ISSUES & RECOMMENDED FIXES');
        console.log('='.repeat(80));

        const issues = [];

        // Critical Issues
        const criticalNetworkErrors = networkErrors.filter(e => e.status >= 500 || e.failure);
        if (criticalNetworkErrors.length > 0) {
            issues.push({
                priority: 'CRITICAL',
                category: 'Server Error',
                description: `${criticalNetworkErrors.length} server errors (5xx) or failed requests`,
                details: criticalNetworkErrors,
                fix: 'Check server logs, database connectivity, and API endpoint implementations'
            });
        }

        // High Priority Issues
        const jsErrors = consoleErrors.filter(e => e.type === 'error');
        if (jsErrors.length > 0) {
            issues.push({
                priority: 'HIGH',
                category: 'JavaScript Error',
                description: `${jsErrors.length} JavaScript errors preventing functionality`,
                details: jsErrors,
                fix: 'Debug JavaScript code, check for undefined variables, missing dependencies'
            });
        }

        const authErrors = networkErrors.filter(e => e.status === 401 || e.status === 403);
        if (authErrors.length > 0) {
            issues.push({
                priority: 'HIGH',
                category: 'Authentication',
                description: `${authErrors.length} authentication/authorization errors`,
                details: authErrors,
                fix: 'Check CSRF tokens, session handling, and user permissions'
            });
        }

        // Medium Priority Issues
        const clientErrors = networkErrors.filter(e => e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 403);
        if (clientErrors.length > 0) {
            issues.push({
                priority: 'MEDIUM',
                category: 'Client Error',
                description: `${clientErrors.length} client-side errors (4xx)`,
                details: clientErrors,
                fix: 'Verify request parameters, API routes, and form validation'
            });
        }

        const warnings = consoleErrors.filter(e => e.type === 'warning');
        if (warnings.length > 0) {
            issues.push({
                priority: 'LOW',
                category: 'Warnings',
                description: `${warnings.length} console warnings`,
                details: warnings,
                fix: 'Review deprecated code, missing elements, or performance issues'
            });
        }

        // Print prioritized issues
        issues.forEach((issue, index) => {
            console.log(`\n${index + 1}. [${issue.priority}] ${issue.category}: ${issue.description}`);
            console.log(`   Recommended Fix: ${issue.fix}`);
            
            if (issue.details && issue.details.length > 0) {
                console.log('   Details:');
                issue.details.slice(0, 3).forEach(detail => {
                    if (detail.text) {
                        console.log(`     - ${detail.text}`);
                    } else if (detail.url) {
                        console.log(`     - ${detail.status} ${detail.url}`);
                    }
                });
                if (issue.details.length > 3) {
                    console.log(`     ... and ${issue.details.length - 3} more`);
                }
            }
        });

        if (issues.length === 0) {
            console.log('\n✅ No critical issues detected in sales order functionality!');
        }

        console.log('\n' + '='.repeat(80));
    });
});