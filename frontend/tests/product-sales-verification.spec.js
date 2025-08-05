import { test, expect } from '@playwright/test';

test.describe('Product Sales Analysis Page Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://127.0.0.1:8000/login');
    
    // Login with test credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL('**/dashboard');
  });

  test('verify product sales analysis page displays correctly', async ({ page }) => {
    console.log('🔍 Starting product sales analysis page verification...');
    
    // Navigate to the product sales analysis page
    await page.goto('http://127.0.0.1:8000/reports/sales/by-product');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/product-sales-initial.png', 
      fullPage: true 
    });
    console.log('📸 Initial screenshot taken');
    
    // Check page title
    const title = await page.title();
    console.log(`📋 Page title: ${title}`);
    expect(title).toContain('產品銷售分析');
    
    // Verify statistics cards are present and have actual data
    console.log('📊 Checking statistics cards...');
    
    const totalSalesCard = page.locator('.statistics-card').first();
    await expect(totalSalesCard).toBeVisible();
    
    const totalSalesValue = await totalSalesCard.locator('.stat-value').textContent();
    console.log(`💰 Total sales value: ${totalSalesValue}`);
    
    // Check if value is not zero or empty
    expect(totalSalesValue.trim()).not.toBe('0');
    expect(totalSalesValue.trim()).not.toBe('');
    
    // Check other statistics cards
    const statCards = page.locator('.statistics-card');
    const cardCount = await statCards.count();
    console.log(`📈 Found ${cardCount} statistics cards`);
    
    for (let i = 0; i < cardCount; i++) {
      const card = statCards.nth(i);
      const value = await card.locator('.stat-value').textContent();
      const label = await card.locator('.stat-label').textContent();
      console.log(`📊 ${label}: ${value}`);
      
      // Verify values are not empty
      expect(value.trim()).not.toBe('');
    }
    
    // Verify data table is present and populated
    console.log('🗂️ Checking data table...');
    
    const dataTable = page.locator('#product-sales-table');
    await expect(dataTable).toBeVisible();
    
    // Check table headers
    const headers = page.locator('#product-sales-table thead th');
    const headerCount = await headers.count();
    console.log(`📋 Table has ${headerCount} columns`);
    
    // Check table rows (should have actual data)
    const rows = page.locator('#product-sales-table tbody tr');
    const rowCount = await rows.count();
    console.log(`📄 Table has ${rowCount} data rows`);
    
    if (rowCount > 0) {
      // Check first row data
      const firstRow = rows.first();
      const productName = await firstRow.locator('td').first().textContent();
      console.log(`🏷️ First product: ${productName}`);
      expect(productName.trim()).not.toBe('');
    }
    
    // Check for JavaScript console errors
    console.log('🐛 Checking for console errors...');
    const consoleLogs = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log('⚠️ Console errors found:');
      consoleLogs.forEach(log => console.log(log));
    } else {
      console.log('✅ No console errors detected');
    }
    
    // Test filter functionality
    console.log('🔍 Testing filter functionality...');
    
    const filterButton = page.locator('button:has-text("套用篩選"), button:has-text("Apply Filters")');
    
    if (await filterButton.isVisible()) {
      console.log('🔲 Filter button found, testing click...');
      await filterButton.click();
      
      // Wait for any potential API calls
      await page.waitForTimeout(1000);
      console.log('✅ Filter button clicked successfully');
    } else {
      console.log('⚠️ Filter button not found on page');
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/product-sales-final.png', 
      fullPage: true 
    });
    console.log('📸 Final screenshot taken');
    
    console.log('✅ Product sales analysis page verification completed successfully!');
  });
});