import { chromium } from 'playwright';

async function debugDashboard() {
    console.log('🔍 Dashboard Browser Debug Starting...');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        });
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    // Collect network failures
    const networkErrors = [];
    page.on('response', response => {
        if (!response.ok()) {
            networkErrors.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            });
            console.log(`[NETWORK ERROR] ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        // Start Laravel server
        console.log('📡 Starting Laravel server...');
        const { spawn } = await import('child_process');
        const server = spawn('php', ['artisan', 'serve', '--port=8000'], {
            stdio: 'pipe',
            cwd: '/Users/gamepig/projects/NexusERP/frontend'
        });
        
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🌐 Navigating to login page...');
        await page.goto('http://127.0.0.1:8000/login');
        
        // Login with test credentials
        console.log('🔐 Attempting login...');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // Wait for redirect and check if successful
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        console.log(`📍 Current URL after login: ${currentUrl}`);
        
        if (currentUrl.includes('/dashboard')) {
            console.log('✅ Successfully logged in and redirected to dashboard');
            
            // Wait for dashboard to load
            console.log('⏳ Waiting for dashboard to load...');
            await page.waitForTimeout(5000);
            
            // Check for dashboard elements
            const dashboardElement = await page.$('[data-dashboard]');
            const loadingElement = await page.$('#dashboardLoading');
            const errorElement = await page.$('#dashboardError');
            const statsElement = await page.$('#dashboardStats');
            
            console.log('\n📊 Dashboard Element Status:');
            console.log(`   - Dashboard container: ${dashboardElement ? '✅ Found' : '❌ Missing'}`);
            console.log(`   - Loading element: ${loadingElement ? '✅ Found' : '❌ Missing'}`);
            console.log(`   - Error element: ${errorElement ? '✅ Found' : '❌ Missing'}`);
            console.log(`   - Stats element: ${statsElement ? '✅ Found' : '❌ Missing'}`);
            
            // Check loading state
            if (loadingElement) {
                const isLoadingVisible = await loadingElement.isVisible();
                console.log(`   - Loading visible: ${isLoadingVisible ? '⏳ YES (Still Loading)' : '❌ NO'}`);
            }
            
            if (errorElement) {
                const isErrorVisible = await errorElement.isVisible();
                console.log(`   - Error visible: ${isErrorVisible ? '❌ YES (Error State)' : '✅ NO'}`);
                
                if (isErrorVisible) {
                    const errorMessage = await page.textContent('#dashboardErrorMessage');
                    console.log(`   - Error message: "${errorMessage}"`);
                }
            }
            
            if (statsElement) {
                const isStatsVisible = await statsElement.isVisible();
                console.log(`   - Stats visible: ${isStatsVisible ? '✅ YES (Loaded)' : '❌ NO (Hidden)'}`);
            }
            
            // Check for JavaScript errors in DashboardManager
            const dashboardManagerExists = await page.evaluate(() => {
                return typeof window.DashboardManager !== 'undefined';
            });
            
            const dashboardManagerInstance = await page.evaluate(() => {
                return typeof window.dashboardManager !== 'undefined';
            });
            
            console.log('\n🛠️ JavaScript Status:');
            console.log(`   - DashboardManager class: ${dashboardManagerExists ? '✅ Loaded' : '❌ Missing'}`);
            console.log(`   - DashboardManager instance: ${dashboardManagerInstance ? '✅ Created' : '❌ Not Created'}`);
            
        } else if (currentUrl.includes('/login')) {
            console.log('❌ Login failed - still on login page');
            const errorMsg = await page.textContent('.error-message, .alert-danger, .text-red-500').catch(() => null);
            if (errorMsg) {
                console.log(`   Error: ${errorMsg}`);
            } else {
                console.log('   No visible error message found');
            }
        } else {
            console.log(`❓ Unexpected redirect to: ${currentUrl}`);
        }
        
        // Take a screenshot
        await page.screenshot({ path: 'dashboard-debug-screenshot.png', fullPage: true });
        console.log('📸 Screenshot saved as dashboard-debug-screenshot.png');
        
        server.kill();
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
    
    // Summary
    console.log('\n📝 Debug Summary:');
    console.log(`   - Console messages: ${consoleMessages.length}`);
    console.log(`   - Network errors: ${networkErrors.length}`);
    
    if (consoleMessages.length > 0) {
        console.log('\n📜 Console Messages:');
        consoleMessages.forEach(msg => {
            console.log(`   [${msg.type}] ${msg.text}`);
        });
    }
    
    if (networkErrors.length > 0) {
        console.log('\n🌐 Network Errors:');
        networkErrors.forEach(err => {
            console.log(`   ${err.status} ${err.url}`);
        });
    }
    
    await browser.close();
    console.log('🏁 Debug complete!');
}

debugDashboard().catch(console.error);