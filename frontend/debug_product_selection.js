import { chromium } from 'playwright';

async function debugProductSelectionUI() {
    console.log('🔍 Starting comprehensive debugging of product selection UI...\n');
    
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`🌐 CONSOLE [${type.toUpperCase()}]: ${text}`);
    });
    
    // Monitor network requests
    page.on('request', request => {
        if (request.url().includes('/api/') || request.url().includes('products') || request.url().includes('customers')) {
            console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('/api/') || response.url().includes('products') || response.url().includes('customers')) {
            console.log(`📨 RESPONSE: ${response.status()} ${response.url()}`);
        }
    });
    
    // Monitor page errors
    page.on('pageerror', error => {
        console.log(`❌ PAGE ERROR: ${error.message}`);
    });
    
    try {
        console.log('=== PART 1: LOGIN AND NAVIGATION ===');
        
        // Navigate to login page
        console.log('1. Navigating to login page...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForTimeout(2000);
        
        // Login
        console.log('2. Logging in with test credentials...');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Check if login was successful
        const currentUrl = page.url();
        console.log(`   Current URL after login: ${currentUrl}`);
        
        // Navigate to order creation page
        console.log('3. Navigating to order creation page...');
        await page.goto('http://127.0.0.1:8000/customers/1/orders/create');
        await page.waitForTimeout(3000);
        
        console.log('\n=== PART 2: JAVASCRIPT CONSOLE ERROR ANALYSIS ===');
        
        // Wait for page to fully load
        await page.waitForLoadState('networkidle');
        
        // Check for JavaScript errors in console
        console.log('4. Analyzing JavaScript console errors...');
        
        // Get all console messages that have occurred so far
        const consoleLogs = [];
        page.on('console', msg => consoleLogs.push(msg));
        
        // Execute some JavaScript to check page state
        const jsAnalysis = await page.evaluate(() => {
            const analysis = {
                errors: [],
                loadProductsCalled: false,
                loadCustomersCalled: false,
                productsArray: null,
                customersArray: null,
                windowFunctions: []
            };
            
            // Check if functions exist in window
            if (typeof window.loadProducts === 'function') {
                analysis.windowFunctions.push('loadProducts');
            }
            if (typeof window.loadCustomers === 'function') {
                analysis.windowFunctions.push('loadCustomers');
            }
            if (typeof window.addItem === 'function') {
                analysis.windowFunctions.push('addItem');
            }
            
            // Check if global variables exist
            if (typeof window.products !== 'undefined') {
                analysis.productsArray = window.products;
            }
            if (typeof window.customers !== 'undefined') {
                analysis.customersArray = window.customers;
            }
            
            return analysis;
        });
        
        console.log('   JavaScript Analysis Results:');
        console.log('   - Available window functions:', jsAnalysis.windowFunctions);
        console.log('   - Products array:', jsAnalysis.productsArray ? `Array with ${jsAnalysis.productsArray.length} items` : 'Not found');
        console.log('   - Customers array:', jsAnalysis.customersArray ? `Array with ${jsAnalysis.customersArray.length} items` : 'Not found');
        
        console.log('\n=== PART 3: API ENDPOINT DIRECT TESTING ===');
        
        // Test API endpoints directly
        console.log('5. Testing API endpoints directly...');
        
        // Test /api/products
        try {
            console.log('   Testing /api/products...');
            const productsResponse = await page.goto('http://127.0.0.1:8000/api/products');
            const productsStatus = productsResponse.status();
            const productsHeaders = productsResponse.headers();
            console.log(`   - Status: ${productsStatus}`);
            console.log(`   - Content-Type: ${productsHeaders['content-type'] || 'Not set'}`);
            
            if (productsStatus === 200) {
                const productsText = await productsResponse.text();
                console.log(`   - Response preview: ${productsText.substring(0, 200)}...`);
            }
        } catch (error) {
            console.log(`   - Error accessing /api/products: ${error.message}`);
        }
        
        // Test /api/customers
        try {
            console.log('   Testing /api/customers...');
            const customersResponse = await page.goto('http://127.0.0.1:8000/api/customers');
            const customersStatus = customersResponse.status();
            const customersHeaders = customersResponse.headers();
            console.log(`   - Status: ${customersStatus}`);
            console.log(`   - Content-Type: ${customersHeaders['content-type'] || 'Not set'}`);
            
            if (customersStatus === 200) {
                const customersText = await customersResponse.text();
                console.log(`   - Response preview: ${customersText.substring(0, 200)}...`);
            }
        } catch (error) {
            console.log(`   - Error accessing /api/customers: ${error.message}`);
        }
        
        // Navigate back to order creation page
        await page.goto('http://127.0.0.1:8000/customers/1/orders/create');
        await page.waitForTimeout(2000);
        
        console.log('\n=== PART 4: DOM ELEMENT INVESTIGATION ===');
        
        // Check DOM elements
        console.log('6. Investigating DOM elements...');
        
        const domAnalysis = await page.evaluate(() => {
            const elements = {
                addItemBtn: null,
                itemTemplate: null,
                itemsList: null,
                other: []
            };
            
            // Check for specific elements
            const addItemBtn = document.getElementById('addItemBtn');
            if (addItemBtn) {
                elements.addItemBtn = {
                    exists: true,
                    visible: addItemBtn.offsetParent !== null,
                    text: addItemBtn.textContent.trim(),
                    onclick: addItemBtn.onclick ? 'Has onclick handler' : 'No onclick handler'
                };
            } else {
                elements.addItemBtn = { exists: false };
            }
            
            const itemTemplate = document.getElementById('itemTemplate');
            if (itemTemplate) {
                elements.itemTemplate = {
                    exists: true,
                    type: itemTemplate.tagName,
                    content: itemTemplate.innerHTML.length > 0 ? 'Has content' : 'Empty'
                };
            } else {
                elements.itemTemplate = { exists: false };
            }
            
            const itemsList = document.getElementById('itemsList');
            if (itemsList) {
                elements.itemsList = {
                    exists: true,
                    children: itemsList.children.length,
                    visible: itemsList.offsetParent !== null
                };
            } else {
                elements.itemsList = { exists: false };
            }
            
            // Look for other relevant elements
            const buttons = document.querySelectorAll('button');
            const selects = document.querySelectorAll('select');
            const forms = document.querySelectorAll('form');
            
            elements.other = [
                `Buttons found: ${buttons.length}`,
                `Select elements found: ${selects.length}`,
                `Forms found: ${forms.length}`
            ];
            
            return elements;
        });
        
        console.log('   DOM Analysis Results:');
        console.log('   - Add Item Button:', JSON.stringify(domAnalysis.addItemBtn, null, 2));
        console.log('   - Item Template:', JSON.stringify(domAnalysis.itemTemplate, null, 2));
        console.log('   - Items List:', JSON.stringify(domAnalysis.itemsList, null, 2));
        console.log('   - Other elements:', domAnalysis.other);
        
        console.log('\n=== PART 5: MANUAL BUTTON INTERACTION TESTING ===');
        
        // Try to click the "新增項目" button if it exists
        console.log('7. Testing manual button interaction...');
        
        try {
            const addButton = await page.locator('#addItemBtn');
            const buttonExists = await addButton.count() > 0;
            
            if (buttonExists) {
                console.log('   - Add Item button found, attempting click...');
                await addButton.click();
                await page.waitForTimeout(1000);
                
                // Check for DOM changes after click
                const afterClickAnalysis = await page.evaluate(() => {
                    const itemsList = document.getElementById('itemsList');
                    return {
                        itemsListChildren: itemsList ? itemsList.children.length : 'itemsList not found',
                        newElements: document.querySelectorAll('[data-item-index]').length
                    };
                });
                
                console.log('   - DOM state after click:', afterClickAnalysis);
            } else {
                console.log('   - Add Item button not found');
                
                // Look for alternative buttons
                const alternativeButtons = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.map(btn => ({
                        text: btn.textContent.trim(),
                        id: btn.id,
                        className: btn.className
                    })).filter(btn => btn.text.includes('新增') || btn.text.includes('添加') || btn.text.includes('Add'));
                });
                
                console.log('   - Alternative buttons found:', alternativeButtons);
                
                if (alternativeButtons.length > 0) {
                    console.log('   - Attempting to click first alternative button...');
                    await page.click(`button:has-text("${alternativeButtons[0].text}")`);
                    await page.waitForTimeout(1000);
                }
            }
        } catch (error) {
            console.log(`   - Error during button interaction: ${error.message}`);
        }
        
        console.log('\n=== PART 6: MANUAL JAVASCRIPT TESTING ===');
        
        // Manual JavaScript testing in browser console
        console.log('8. Performing manual JavaScript testing...');
        
        const manualJsResults = await page.evaluate(() => {
            const results = {
                globalVariables: {},
                functionTests: {},
                domState: {}
            };
            
            // Check global variables
            results.globalVariables.products = typeof window.products !== 'undefined' ? 
                (Array.isArray(window.products) ? `Array[${window.products.length}]` : typeof window.products) : 
                'undefined';
            
            results.globalVariables.customers = typeof window.customers !== 'undefined' ? 
                (Array.isArray(window.customers) ? `Array[${window.customers.length}]` : typeof window.customers) : 
                'undefined';
            
            // Test functions
            try {
                if (typeof window.loadProducts === 'function') {
                    results.functionTests.loadProducts = 'Function exists';
                    // Don't actually call it as it might cause side effects
                } else {
                    results.functionTests.loadProducts = 'Function not found';
                }
            } catch (e) {
                results.functionTests.loadProducts = `Error: ${e.message}`;
            }
            
            try {
                if (typeof window.loadCustomers === 'function') {
                    results.functionTests.loadCustomers = 'Function exists';
                } else {
                    results.functionTests.loadCustomers = 'Function not found';
                }
            } catch (e) {
                results.functionTests.loadCustomers = `Error: ${e.message}`;
            }
            
            try {
                if (typeof window.addItem === 'function') {
                    results.functionTests.addItem = 'Function exists';
                } else {
                    results.functionTests.addItem = 'Function not found';
                }
            } catch (e) {
                results.functionTests.addItem = `Error: ${e.message}`;
            }
            
            // DOM state
            results.domState.itemsInList = document.querySelectorAll('#itemsList [data-item-index]').length;
            results.domState.selectElements = document.querySelectorAll('select[name*="product"]').length;
            results.domState.productOptions = document.querySelectorAll('select option').length;
            
            return results;
        });
        
        console.log('   Manual JavaScript Results:');
        console.log('   - Global Variables:', manualJsResults.globalVariables);
        console.log('   - Function Tests:', manualJsResults.functionTests);
        console.log('   - DOM State:', manualJsResults.domState);
        
        console.log('\n=== PART 7: NETWORK MONITORING SUMMARY ===');
        
        // Let's make some API calls to see what happens
        console.log('9. Testing network requests...');
        
        try {
            // Try to trigger API calls through JavaScript
            await page.evaluate(async () => {
                // Try to make fetch requests
                try {
                    console.log('Testing fetch to /api/products...');
                    const response = await fetch('/api/products');
                    console.log('Products API response status:', response.status);
                } catch (e) {
                    console.log('Error fetching products:', e.message);
                }
                
                try {
                    console.log('Testing fetch to /api/customers...');
                    const response = await fetch('/api/customers');
                    console.log('Customers API response status:', response.status);
                } catch (e) {
                    console.log('Error fetching customers:', e.message);
                }
            });
        } catch (error) {
            console.log(`   - Error during network testing: ${error.message}`);
        }
        
        // Final page screenshot for visual debugging
        console.log('\n=== FINAL ANALYSIS ===');
        await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
        console.log('10. Screenshot saved as debug-screenshot.png');
        
        // Get page source for analysis
        const pageContent = await page.content();
        console.log(`11. Page content length: ${pageContent.length} characters`);
        
        // Check if specific JavaScript is loaded
        const scriptAnalysis = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            return {
                totalScripts: scripts.length,
                hasJQuery: typeof $ !== 'undefined',
                hasAxios: typeof axios !== 'undefined',
                inlineScripts: scripts.filter(s => !s.src).length,
                externalScripts: scripts.filter(s => s.src).map(s => s.src)
            };
        });
        
        console.log('12. Script Analysis:', scriptAnalysis);
        
        console.log('\n🎯 DEBUGGING SUMMARY COMPLETE');
        console.log('   - Check console output above for detailed findings');
        console.log('   - Screenshot saved for visual reference');
        console.log('   - All major debugging areas covered');
        
    } catch (error) {
        console.error(`❌ Critical error during debugging: ${error.message}`);
        console.error(error.stack);
    } finally {
        // Keep browser open for manual inspection
        console.log('\n⏸️  Browser will remain open for manual inspection...');
        console.log('   Press Ctrl+C to close and exit');
        
        // Wait for manual intervention
        await new Promise(resolve => {
            process.on('SIGINT', () => {
                console.log('\n👋 Closing browser...');
                browser.close().then(() => {
                    console.log('✅ Browser closed successfully');
                    resolve();
                });
            });
        });
    }
}

// Run the debugging script
debugProductSelectionUI().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});