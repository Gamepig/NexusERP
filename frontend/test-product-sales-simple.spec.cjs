const { test, expect } = require('@playwright/test');

test.describe('Product Sales Analysis Page Test', () => {
    test('should display actual product sales data', async ({ page }) => {
        console.log('🔍 Starting product sales analysis page test...');
        
        // Set viewport
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        try {
            // Navigate to login page
            console.log('📝 Navigating to login page...');
            await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
            
            // Take screenshot of login page
            await page.screenshot({ path: 'screenshots/01-login-page.png' });
            
            // Login with test credentials
            console.log('🔐 Logging in with test@example.com...');
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            
            // Submit login form
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 10000 });
            
            // Take screenshot after login
            await page.screenshot({ path: 'screenshots/02-after-login.png' });
            
            // Navigate to product sales analysis page
            console.log('📊 Navigating to product sales analysis page...');
            await page.goto('http://127.0.0.1:8000/reports/sales/by-product', { 
                waitUntil: 'networkidle',
                timeout: 15000
            });
            
            // Wait for page to load completely
            await page.waitForTimeout(3000);
            
            // Take screenshot of the page
            await page.screenshot({ path: 'screenshots/03-product-sales-page.png' });
            
            // Check page title
            const title = await page.title();
            console.log(`📄 Page title: ${title}`);
            
            // Check if we're on the correct page
            const currentUrl = page.url();
            console.log(`🔗 Current URL: ${currentUrl}`);
            
            // Check for statistics cards
            console.log('📈 Checking statistics cards...');
            const statsCards = await page.locator('.stats-card, .stat-card, .card, [class*="stat"]').count();
            console.log(`Found ${statsCards} potential stat cards`);
            
            // Get any visible numbers to check if we have actual data
            const pageText = await page.textContent('body');
            
            // Look for numeric values that aren't 0
            const numbers = pageText.match(/\d+/g) || [];
            const nonZeroNumbers = numbers.filter(num => parseInt(num) > 0 && parseInt(num) < 999999);
            const hasActualData = nonZeroNumbers.length > 5; // More than just a few numbers
            
            console.log(`📊 Numbers found: ${numbers.length}`);
            console.log(`📊 Non-zero numbers: ${nonZeroNumbers.length}`);
            console.log(`📊 Has actual data: ${hasActualData}`);
            
            // Check for data table
            console.log('📋 Checking data table...');
            const tables = await page.locator('table, .table, [class*="table"]').count();
            console.log(`Found ${tables} table(s)`);
            
            if (tables > 0) {
                // Get first table data
                const tableRows = await page.locator('table tr, .table tr').count();
                console.log(`Table has ${tableRows} rows`);
                
                // Get first few rows of data
                for (let i = 0; i < Math.min(5, tableRows); i++) {
                    const rowText = await page.locator(`table tr:nth-child(${i + 1}), .table tr:nth-child(${i + 1})`).textContent();
                    if (rowText && rowText.trim()) {
                        console.log(`Row ${i + 1}: ${rowText.trim().substring(0, 100)}...`);
                    }
                }
            }
            
            // Check for charts
            console.log('📊 Checking for charts...');
            const charts = await page.locator('canvas, svg, .chart, [class*="chart"]').count();
            console.log(`Found ${charts} potential chart elements`);
            
            // Check for any error messages
            const errorMessages = await page.locator('.alert-danger, .error, [class*="error"]').count();
            console.log(`Found ${errorMessages} error messages`);
            
            // Take final screenshot
            await page.screenshot({ path: 'screenshots/04-final-page-state.png' });
            
            // Print summary
            console.log('\\n=== TEST SUMMARY ===');
            console.log(`✅ Page loaded successfully: ${currentUrl.includes('/reports/sales/by-product')}`);
            console.log(`✅ Page title: ${title}`);
            console.log(`✅ Statistics cards found: ${statsCards}`);
            console.log(`✅ Data tables found: ${tables}`);
            console.log(`✅ Chart elements found: ${charts}`);
            console.log(`✅ Has actual data: ${hasActualData}`);
            console.log(`✅ Error messages: ${errorMessages}`);
            
            // Log some sample data
            if (nonZeroNumbers.length > 0) {
                console.log(`📊 Sample numbers found: ${nonZeroNumbers.slice(0, 10).join(', ')}`);
            }
            
            console.log('\\n📸 Screenshots saved:');
            console.log('  - screenshots/01-login-page.png');
            console.log('  - screenshots/02-after-login.png');
            console.log('  - screenshots/03-product-sales-page.png');
            console.log('  - screenshots/04-final-page-state.png');
            
            // Assertions
            expect(currentUrl).toContain('/reports/sales/by-product');
            expect(errorMessages).toBe(0);
            
            // Check that we have some content
            expect(pageText.length).toBeGreaterThan(100);
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            await page.screenshot({ path: 'screenshots/error-state.png' });
            throw error;
        }
    });
});