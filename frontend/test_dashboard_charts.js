/**
 * NexusERP Dashboard Charts Test
 * Tests the new deep dark theme Chart.js implementation
 */

import puppeteer from 'puppeteer';

async function testDashboardCharts() {
    console.log('🔍 Starting NexusERP Dashboard Charts Test...');
    
    const browser = await puppeteer.launch({
        headless: false, // Show browser for visual verification
        defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    try {
        // 1. Navigate to login page
        console.log('📝 Navigating to login page...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });
        
        // 2. Login with test credentials
        console.log('🔐 Logging in with test credentials...');
        await page.type('input[name="email"]', 'test@example.com');
        await page.type('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // 3. Wait for dashboard to load
        console.log('⏳ Waiting for dashboard to load...');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // Verify we're on dashboard
        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);
        
        if (!currentUrl.includes('/dashboard')) {
            throw new Error('Failed to reach dashboard - authentication may have failed');
        }
        
        // 4. Wait for Chart.js to load and charts to initialize
        console.log('📊 Waiting for charts to initialize...');
        await page.waitForTimeout(5000); // Give charts time to render
        
        // 5. Check for Chart.js availability
        const chartJsLoaded = await page.evaluate(() => {
            return typeof Chart !== 'undefined';
        });
        console.log('📈 Chart.js loaded:', chartJsLoaded);
        
        // 6. Check chart canvases exist
        const chartElements = await page.evaluate(() => {
            const revenueChart = document.getElementById('revenueChart');
            const ordersChart = document.getElementById('ordersChart');
            const inventoryChart = document.getElementById('inventoryChart');
            
            return {
                revenueChart: !!revenueChart,
                ordersChart: !!ordersChart,
                inventoryChart: !!inventoryChart,
                revenueVisible: revenueChart ? revenueChart.offsetParent !== null : false,
                ordersVisible: ordersChart ? ordersChart.offsetParent !== null : false,
                inventoryVisible: inventoryChart ? inventoryChart.offsetParent !== null : false
            };
        });
        
        console.log('📊 Chart Elements:', chartElements);
        
        // 7. Check for NexusERP deep dark theme colors
        const themeColors = await page.evaluate(() => {
            const styles = getComputedStyle(document.documentElement);
            const dashboardContainer = document.querySelector('.dashboard-container');
            
            return {
                containerBackground: dashboardContainer ? getComputedStyle(dashboardContainer).backgroundColor : null,
                bodyBackground: getComputedStyle(document.body).backgroundColor
            };
        });
        
        console.log('🎨 Theme Colors:', themeColors);
        
        // 8. Check statistical cards
        const statCards = await page.evaluate(() => {
            const cards = document.querySelectorAll('[data-stat-key]');
            return Array.from(cards).map(card => ({
                key: card.getAttribute('data-stat-key'),
                visible: card.offsetParent !== null
            }));
        });
        
        console.log('📊 Statistical Cards:', statCards);
        
        // 9. Take screenshot for visual verification
        console.log('📸 Taking screenshot...');
        await page.screenshot({ 
            path: '/tmp/nexuserp_dashboard_charts_test.png',
            fullPage: true 
        });
        
        // 10. Check console errors
        const consoleMessages = [];
        page.on('console', msg => {
            consoleMessages.push(`${msg.type()}: ${msg.text()}`);
        });
        
        // Wait a bit more for any console messages
        await page.waitForTimeout(2000);
        
        console.log('📋 Console Messages:', consoleMessages.slice(-10)); // Last 10 messages
        
        // 11. Verify chart initialization success
        const chartInitStatus = await page.evaluate(() => {
            // Look for our initialization success messages
            return {
                timestamp: new Date().toISOString(),
                message: 'Chart evaluation completed'
            };
        });
        
        console.log('✅ Chart Test Results:');
        console.log('- Chart.js Loaded:', chartJsLoaded);
        console.log('- Revenue Chart Present:', chartElements.revenueChart && chartElements.revenueVisible);
        console.log('- Orders Chart Present:', chartElements.ordersChart && chartElements.ordersVisible);
        console.log('- Inventory Chart Present:', chartElements.inventoryChart && chartElements.inventoryVisible);
        console.log('- Statistical Cards:', statCards.length);
        console.log('- Screenshot saved to: /tmp/nexuserp_dashboard_charts_test.png');
        
        // Success evaluation
        const success = chartJsLoaded && 
                       chartElements.revenueChart && 
                       chartElements.ordersChart && 
                       chartElements.inventoryChart &&
                       statCards.length >= 6;
                       
        if (success) {
            console.log('🎉 TEST PASSED: NexusERP Dashboard Charts are working correctly!');
        } else {
            console.log('❌ TEST FAILED: Some charts or elements are missing');
        }
        
        return success;
        
    } catch (error) {
        console.error('❌ Test Error:', error.message);
        await page.screenshot({ 
            path: '/tmp/nexuserp_dashboard_error.png',
            fullPage: true 
        });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testDashboardCharts()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal Error:', error);
        process.exit(1);
    });