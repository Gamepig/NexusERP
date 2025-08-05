const puppeteer = require('puppeteer');

async function testProductSalesPage() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        console.log('🔍 Starting product sales analysis page test...');
        
        // Navigate to login page
        console.log('📝 Navigating to login page...');
        await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle2' });
        
        // Take initial screenshot
        await page.screenshot({ path: '/tmp/01-login-page.png' });
        
        // Login with test credentials
        console.log('🔐 Logging in with test@example.com...');
        await page.type('input[name="email"]', 'test@example.com');
        await page.type('input[name="password"]', 'password123');
        
        // Submit login form
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // Take screenshot after login
        await page.screenshot({ path: '/tmp/02-after-login.png' });
        
        // Navigate to product sales analysis page
        console.log('📊 Navigating to product sales analysis page...');
        await page.goto('http://127.0.0.1:8000/reports/sales/by-product', { waitUntil: 'networkidle2' });
        
        // Wait for page to load completely
        await page.waitForTimeout(3000);
        
        // Take screenshot of the page
        await page.screenshot({ path: '/tmp/03-product-sales-page.png' });
        
        // Check page title
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        // Check if we're on the correct page
        const currentUrl = page.url();
        console.log(`🔗 Current URL: ${currentUrl}`);
        
        // Check for any JavaScript errors
        const errors = [];
        page.on('pageerror', error => {
            errors.push(error.message);
        });
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console error:', msg.text());
            }
        });
        
        // Check for statistics cards
        console.log('📈 Checking statistics cards...');
        const statsCards = await page.$$('.stats-card, .stat-card, .card, [class*="stat"]');
        console.log(`Found ${statsCards.length} potential stat cards`);
        
        // Get stats values
        const statsData = await page.evaluate(() => {
            const elements = document.querySelectorAll('[class*="stat"], .card, .stats-card');
            const stats = [];
            
            elements.forEach((el, index) => {
                const text = el.textContent.trim();
                if (text && (text.includes('Total') || text.includes('Sales') || text.includes('Revenue') || text.includes('Products'))) {
                    stats.push({
                        index: index,
                        text: text.substring(0, 200) // Limit text length
                    });
                }
            });
            
            return stats;
        });
        
        console.log('📊 Statistics found:', JSON.stringify(statsData, null, 2));
        
        // Check for data table
        console.log('📋 Checking data table...');
        const tables = await page.$$('table, .table, [class*="table"]');
        console.log(`Found ${tables.length} table(s)`);
        
        if (tables.length > 0) {
            const tableData = await page.evaluate(() => {
                const table = document.querySelector('table, .table, [class*="table"]');
                if (!table) return null;
                
                const rows = Array.from(table.querySelectorAll('tr'));
                return rows.slice(0, 5).map((row, index) => {
                    const cells = Array.from(row.querySelectorAll('td, th'));
                    return {
                        row: index + 1,
                        data: cells.map(cell => cell.textContent.trim()).join(' | ')
                    };
                });
            });
            
            console.log('📋 Table data (first 5 rows):');
            tableData?.forEach(row => {
                console.log(`Row ${row.row}: ${row.data}`);
            });
        }
        
        // Check for charts
        console.log('📊 Checking for charts...');
        const charts = await page.$$('canvas, svg, .chart, [class*="chart"]');
        console.log(`Found ${charts.length} potential chart elements`);
        
        // Check if data is actually loaded (not zeros)
        const hasActualData = await page.evaluate(() => {
            const allText = document.body.textContent;
            // Look for non-zero numbers
            const numbers = allText.match(/\d+/g);
            if (!numbers) return false;
            
            // Check if there are numbers other than 0
            const nonZeroNumbers = numbers.filter(num => parseInt(num) > 0);
            return nonZeroNumbers.length > 0;
        });
        
        console.log(`📊 Has actual data (non-zero): ${hasActualData}`);
        
        // Take final screenshot
        await page.screenshot({ path: '/tmp/04-final-page-state.png' });
        
        // Print summary
        console.log('\n=== TEST SUMMARY ===');
        console.log(`✅ Page loaded: ${currentUrl.includes('/reports/sales/by-product')}`);
        console.log(`✅ Page title: ${title}`);
        console.log(`✅ Statistics cards found: ${statsCards.length}`);
        console.log(`✅ Data tables found: ${tables.length}`);
        console.log(`✅ Chart elements found: ${charts.length}`);
        console.log(`✅ Has actual data: ${hasActualData}`);
        console.log(`✅ JavaScript errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('❌ JavaScript errors:');
            errors.forEach(error => console.log(`  - ${error}`));
        }
        
        console.log('\n📸 Screenshots saved:');
        console.log('  - /tmp/01-login-page.png');
        console.log('  - /tmp/02-after-login.png');
        console.log('  - /tmp/03-product-sales-page.png');
        console.log('  - /tmp/04-final-page-state.png');
        
        return {
            success: currentUrl.includes('/reports/sales/by-product'),
            hasData: hasActualData,
            statsCards: statsCards.length,
            tables: tables.length,
            charts: charts.length,
            errors: errors.length
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
testProductSalesPage()
    .then(result => {
        console.log('\n🎉 Test completed successfully!');
        console.log('Result:', JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Test failed with error:', error);
        process.exit(1);
    });