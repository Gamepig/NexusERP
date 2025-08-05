const { test, expect } = require('@playwright/test');

test('Scroll down to see full product sales page', async ({ page }) => {
    console.log('🔍 Testing full product sales page with scrolling...');
    
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
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
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/scroll-01-initial.png' });
    
    // Scroll down to see more content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Take screenshot after scrolling
    await page.screenshot({ path: 'screenshots/scroll-02-scrolled-down.png' });
    
    // Check for table content
    const tableContent = await page.evaluate(() => {
        const table = document.querySelector('table');
        if (table) {
            const rows = Array.from(table.querySelectorAll('tr'));
            return rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td, th'));
                return cells.map(cell => cell.textContent.trim()).join(' | ');
            });
        }
        return [];
    });
    
    console.log('📋 Table content found:');
    tableContent.forEach((row, index) => {
        console.log(`Row ${index + 1}: ${row}`);
    });
    
    // Get all visible text to analyze data
    const fullPageText = await page.textContent('body');
    console.log('\\n📊 Page analysis:');
    console.log('- Page contains "暫無資料":', fullPageText.includes('暫無資料'));
    console.log('- Page contains "Total":', fullPageText.includes('Total'));
    console.log('- Page contains "NT$":', fullPageText.includes('NT$'));
    
    // Look for specific sales data indicators
    const salesIndicators = [
        '銷售數量', '銷售金額', '平均單價', '產品名稱',
        'sales', 'revenue', 'product', 'amount'
    ];
    
    salesIndicators.forEach(indicator => {
        console.log(`- Contains "${indicator}": ${fullPageText.includes(indicator)}`);
    });
    
    // Final screenshot
    await page.screenshot({ path: 'screenshots/scroll-03-final-analysis.png', fullPage: true });
    
    console.log('\\n✅ Scroll test completed');
});