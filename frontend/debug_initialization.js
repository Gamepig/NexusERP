import { chromium } from 'playwright';

async function debugInitialization() {
    console.log('🔍 Debugging product selection initialization issue...\n');
    
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 500,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Enable console logging with detailed tracking
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`🌐 CONSOLE [${type.toUpperCase()}]: ${text}`);
    });
    
    // Monitor network requests
    page.on('request', request => {
        if (request.url().includes('/api/')) {
            console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('/api/')) {
            console.log(`📨 RESPONSE: ${response.status()} ${response.url()}`);
        }
    });
    
    // Monitor page errors
    page.on('pageerror', error => {
        console.log(`❌ PAGE ERROR: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    });
    
    try {
        console.log('=== STEP 1: LOGIN ===');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForTimeout(2000);
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        console.log('\n=== STEP 2: NAVIGATE TO ORDER CREATE PAGE ===');
        await page.goto('http://127.0.0.1:8000/customers/1/orders/create');
        
        // Wait for all network activity to settle
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        console.log('\n=== STEP 3: CHECK INITIALIZATION STATE ===');
        
        // Check if initializePage function completed
        const initializationState = await page.evaluate(() => {
            return {
                // Check global variables
                productsArrayExists: typeof window.products !== 'undefined',
                customersArrayExists: typeof window.customers !== 'undefined',
                productsData: window.products,
                customersData: window.customers,
                
                // Check if elements are in the correct state
                loadingStateHidden: document.getElementById('loadingState')?.classList.contains('hidden'),
                formContentVisible: !document.getElementById('formContent')?.classList.contains('hidden'),
                
                // Check function availability
                functionsAvailable: {
                    initializePage: typeof window.initializePage === 'function',
                    loadProducts: typeof window.loadProducts === 'function',
                    loadCustomers: typeof window.loadCustomers === 'function',
                    addItem: typeof window.addItem === 'function'
                },
                
                // Check DOM state
                itemsListChildren: document.getElementById('itemsList')?.children.length || 0,
                addItemButtonExists: !!document.getElementById('addItemBtn'),
                
                // Check if page finished loading
                readyState: document.readyState
            };
        });
        
        console.log('Initialization State Analysis:');
        console.log('- Products array exists:', initializationState.productsArrayExists);
        console.log('- Customers array exists:', initializationState.customersArrayExists);
        console.log('- Products data:', initializationState.productsData ? `Array[${initializationState.productsData.length}]` : 'null/undefined');
        console.log('- Customers data:', initializationState.customersData ? `Array[${initializationState.customersData.length}]` : 'null/undefined');
        console.log('- Loading state hidden:', initializationState.loadingStateHidden);
        console.log('- Form content visible:', initializationState.formContentVisible);
        console.log('- Functions available:', initializationState.functionsAvailable);
        console.log('- Items list children:', initializationState.itemsListChildren);
        console.log('- Add item button exists:', initializationState.addItemButtonExists);
        console.log('- Document ready state:', initializationState.readyState);
        
        console.log('\n=== STEP 4: TEST MANUAL FUNCTION CALLS ===');
        
        // Try to manually call the load functions and see what happens
        const manualCallResults = await page.evaluate(async () => {
            const results = {
                loadCustomersResult: null,
                loadProductsResult: null,
                errors: []
            };
            
            try {
                console.log('Manually calling loadCustomers()...');
                await window.loadCustomers();
                results.loadCustomersResult = {
                    success: true,
                    customersAfterCall: window.customers ? window.customers.length : 'still undefined'
                };
            } catch (error) {
                results.errors.push(`loadCustomers error: ${error.message}`);
                results.loadCustomersResult = { success: false, error: error.message };
            }
            
            try {
                console.log('Manually calling loadProducts()...');
                await window.loadProducts();
                results.loadProductsResult = {
                    success: true,
                    productsAfterCall: window.products ? window.products.length : 'still undefined'
                };
            } catch (error) {
                results.errors.push(`loadProducts error: ${error.message}`);
                results.loadProductsResult = { success: false, error: error.message };
            }
            
            return results;
        });
        
        console.log('Manual Function Call Results:');
        console.log('- loadCustomers result:', manualCallResults.loadCustomersResult);
        console.log('- loadProducts result:', manualCallResults.loadProductsResult);
        console.log('- Errors:', manualCallResults.errors);
        
        console.log('\n=== STEP 5: CHECK FINAL STATE AFTER MANUAL CALLS ===');
        
        const finalState = await page.evaluate(() => {
            return {
                productsNow: window.products ? `Array[${window.products.length}]` : 'still undefined',
                customersNow: window.customers ? `Array[${window.customers.length}]` : 'still undefined',
                firstProductSample: window.products ? window.products[0] : null,
                firstCustomerSample: window.customers ? window.customers[0] : null
            };
        });
        
        console.log('Final State After Manual Calls:');
        console.log('- Products now:', finalState.productsNow);
        console.log('- Customers now:', finalState.customersNow);
        console.log('- First product sample:', finalState.firstProductSample);
        console.log('- First customer sample:', finalState.firstCustomerSample);
        
        console.log('\n=== STEP 6: TEST ADD ITEM FUNCTIONALITY ===');
        
        // Now try to add an item and see if it works
        await page.click('#addItemBtn');
        await page.waitForTimeout(1000);
        
        const addItemResult = await page.evaluate(() => {
            const itemsList = document.getElementById('itemsList');
            const items = itemsList ? itemsList.children : [];
            const selectElements = document.querySelectorAll('select[name*="product"]');
            
            let productSelectHasOptions = false;
            let optionCount = 0;
            
            if (selectElements.length > 0) {
                const firstProductSelect = selectElements[0];
                optionCount = firstProductSelect.options.length;
                productSelectHasOptions = optionCount > 1; // More than just placeholder
            }
            
            return {
                itemsAdded: items.length,
                productSelectsFound: selectElements.length,
                productSelectHasOptions,
                optionCount,
                sampleOptions: selectElements.length > 0 ? 
                    Array.from(selectElements[0].options).slice(0, 3).map(opt => opt.text) : []
            };
        });
        
        console.log('Add Item Test Results:');
        console.log('- Items added to list:', addItemResult.itemsAdded);
        console.log('- Product selects found:', addItemResult.productSelectsFound);
        console.log('- Product select has options:', addItemResult.productSelectHasOptions);
        console.log('- Option count:', addItemResult.optionCount);
        console.log('- Sample options:', addItemResult.sampleOptions);
        
        // Take screenshot for visual verification
        await page.screenshot({ path: 'debug-final-state.png', fullPage: true });
        console.log('\n📸 Screenshot saved as debug-final-state.png');
        
        console.log('\n🎯 DEBUGGING COMPLETE');
        console.log('='.repeat(50));
        
        // Keep browser open for manual inspection
        console.log('\n⏸️  Browser will remain open for manual inspection...');
        console.log('   Press Ctrl+C to close and exit');
        
    } catch (error) {
        console.error(`❌ Critical error: ${error.message}`);
        console.error(error.stack);
    }
    
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

// Run the debugging script
debugInitialization().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});