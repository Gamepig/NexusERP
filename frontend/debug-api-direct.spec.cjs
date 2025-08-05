const { test, expect } = require('@playwright/test');

test('Debug API calls directly', async ({ page }) => {
    console.log('🔍 Testing API calls directly...');
    
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Enable console logging
    page.on('console', msg => {
        if (msg.type() !== 'warning') {
            console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
        }
    });
    
    // Intercept network requests
    page.on('response', response => {
        if (response.url().includes('/api/')) {
            console.log(`[API] ${response.status()} ${response.url()}`);
        }
    });
    
    // Navigate to login page
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    
    // Login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to product sales page
    await page.goto('http://127.0.0.1:8000/reports/sales/by-product', { 
        waitUntil: 'networkidle',
        timeout: 15000
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Test API call directly in browser
    const apiResponse = await page.evaluate(async () => {
        try {
            // Get CSRF token
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch('/api/reports/sales/by-product', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });
            
            const data = await response.text();
            
            return {
                status: response.status,
                statusText: response.statusText,
                data: data,
                isJson: response.headers.get('content-type')?.includes('application/json')
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    });
    
    console.log('\\n=== API RESPONSE DEBUG ===');
    console.log('Status:', apiResponse.status);
    console.log('Status Text:', apiResponse.statusText);
    console.log('Is JSON:', apiResponse.isJson);
    console.log('Response data length:', apiResponse.data?.length || 0);
    
    if (apiResponse.isJson && apiResponse.data) {
        try {
            const jsonData = JSON.parse(apiResponse.data);
            console.log('\\n=== PARSED JSON DATA ===');
            console.log('Products count:', jsonData.products?.length || 0);
            console.log('Categories count:', jsonData.categories?.length || 0);
            
            if (jsonData.products?.length > 0) {
                console.log('\\nFirst 3 products:');
                jsonData.products.slice(0, 3).forEach((product, index) => {
                    console.log(`${index + 1}. ${product.product_name}: ${product.total_sales} (${product.quantity_sold} sold)`);
                });
            } else {
                console.log('\\nNo products found in API response');
            }
            
            if (jsonData.error) {
                console.log('\\nAPI Error:', jsonData.error);
                console.log('API Message:', jsonData.message);
            }
        } catch (e) {
            console.log('Failed to parse JSON:', e.message);
            console.log('Raw response (first 500 chars):', apiResponse.data?.substring(0, 500));
        }
    } else {
        console.log('\\nRaw response (first 500 chars):', apiResponse.data?.substring(0, 500));
    }
    
    // Check database connection by testing another simpler API
    const simpleApiResponse = await page.evaluate(async () => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch('/api/reports/sales', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });
            
            const data = await response.text();
            
            return {
                status: response.status,
                data: data.substring(0, 200)
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    });
    
    console.log('\\n=== SIMPLE API TEST ===');
    console.log('Sales API Status:', simpleApiResponse.status);
    console.log('Sales API Response preview:', simpleApiResponse.data);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/debug-api-direct.png' });
    
    console.log('\\n✅ API debug test completed');
});