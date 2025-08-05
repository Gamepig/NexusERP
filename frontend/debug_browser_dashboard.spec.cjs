// Dashboard Browser Debug Test
// Tests the actual dashboard loading issue in real browser

const { test, expect } = require('@playwright/test');

test('Debug Dashboard Loading Issue', async ({ page }) => {
    console.log('🔍 Starting Dashboard Debug Test...');
    
    // Collect console messages and network requests
    const consoleMessages = [];
    const networkRequests = [];
    const networkErrors = [];
    
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        });
        console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    page.on('request', request => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers()
        });
        if (request.url().includes('/api/dashboard')) {
            console.log(`[NETWORK REQUEST] ${request.method()} ${request.url()}`);
            console.log('[HEADERS]', JSON.stringify(request.headers(), null, 2));
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('/api/dashboard')) {
            console.log(`[NETWORK RESPONSE] ${response.status()} ${response.url()}`);
            if (!response.ok()) {
                networkErrors.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText()
                });
            }
        }
    });
    
    try {
        // Step 1: Navigate to login page
        console.log('📍 Step 1: Navigate to login page');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForTimeout(2000);
        
        // Step 2: Login with test credentials
        console.log('📍 Step 2: Login with test credentials');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // Wait for redirect
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`📍 Current URL after login: ${currentUrl}`);
        
        if (!currentUrl.includes('/dashboard')) {
            console.log('❌ Login failed - not redirected to dashboard');
            await page.screenshot({ path: 'login-failed.png' });
            throw new Error('Login failed');
        }
        
        console.log('✅ Successfully logged in and redirected to dashboard');
        
        // Step 3: Wait for dashboard and analyze loading state
        console.log('📍 Step 3: Analyze dashboard loading state');
        
        // Check for debug info we added
        const debugInfo = await page.textContent('#debugInfo').catch(() => null);
        if (debugInfo) {
            console.log('🔍 Debug Info from page:', debugInfo);
        }
        
        // Wait longer to see if dashboard loads
        console.log('⏳ Waiting 10 seconds for dashboard to load...');
        await page.waitForTimeout(10000);
        
        // Check current state
        const loadingVisible = await page.isVisible('#dashboardLoading');
        const errorVisible = await page.isVisible('#dashboardError');
        const statsVisible = await page.isVisible('#dashboardStats');
        
        console.log('📊 Dashboard State Analysis:');
        console.log(`   - Loading visible: ${loadingVisible}`);
        console.log(`   - Error visible: ${errorVisible}`);
        console.log(`   - Stats visible: ${statsVisible}`);
        
        if (errorVisible) {
            const errorMessage = await page.textContent('#dashboardErrorMessage').catch(() => 'Unknown error');
            console.log(`   - Error message: "${errorMessage}"`);
        }
        
        // Check for DashboardManager
        const dashboardManagerExists = await page.evaluate(() => {
            return typeof window.DashboardManager !== 'undefined';
        });
        
        const dashboardManagerInstance = await page.evaluate(() => {
            return typeof window.dashboardManager !== 'undefined';
        });
        
        console.log('🛠️ JavaScript Objects:');
        console.log(`   - DashboardManager class: ${dashboardManagerExists ? 'EXISTS' : 'MISSING'}`);
        console.log(`   - dashboardManager instance: ${dashboardManagerInstance ? 'EXISTS' : 'MISSING'}`);
        
        // Check CSRF token
        const csrfToken = await page.evaluate(() => {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            return token || 'MISSING';
        });
        console.log(`🔐 CSRF Token: ${csrfToken.substring(0, 20)}...`);
        
        // Manual API test from browser
        console.log('📍 Step 4: Manual API test from browser');
        const apiResponse = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/dashboard', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    credentials: 'same-origin'
                });
                
                return {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    data: response.ok ? await response.json() : await response.text()
                };
            } catch (error) {
                return {
                    ok: false,
                    status: 0,
                    statusText: 'Network Error',
                    error: error.message
                };
            }
        });
        
        console.log('🌐 Manual API Test Result:');
        console.log(`   - Status: ${apiResponse.status} ${apiResponse.statusText}`);
        console.log(`   - Success: ${apiResponse.ok}`);
        if (apiResponse.error) {
            console.log(`   - Error: ${apiResponse.error}`);
        }
        if (typeof apiResponse.data === 'object') {
            console.log(`   - Data keys: ${Object.keys(apiResponse.data).join(', ')}`);
        } else {
            console.log(`   - Response: ${String(apiResponse.data).substring(0, 200)}...`);
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'dashboard-debug-final.png', fullPage: true });
        console.log('📸 Screenshot saved: dashboard-debug-final.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: 'dashboard-debug-error.png' });
    }
    
    // Summary
    console.log('\n📝 Debug Summary:');
    console.log(`   - Console messages: ${consoleMessages.length}`);
    console.log(`   - Network requests: ${networkRequests.length}`);
    console.log(`   - Network errors: ${networkErrors.length}`);
    
    if (networkErrors.length > 0) {
        console.log('\n🚨 Network Errors:');
        networkErrors.forEach(err => {
            console.log(`   ${err.status} ${err.statusText} - ${err.url}`);
        });
    }
    
    if (consoleMessages.length > 0) {
        console.log('\n📜 Recent Console Messages:');
        consoleMessages.slice(-10).forEach(msg => {
            console.log(`   [${msg.type}] ${msg.text}`);
        });
    }
    
    console.log('\n🏁 Dashboard debug test complete!');
});