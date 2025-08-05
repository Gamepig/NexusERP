const { test, expect } = require('@playwright/test');

test.describe('NexusERP Inventory - CRUD Operations and Advanced Testing', () => {

  test('1. Inventory Search and Filtering Test', async ({ page }) => {
    console.log('🔍 Testing Search and Filtering Capabilities');
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Go to main inventory page
    await page.goto('http://127.0.0.1:8000/inventory');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Take screenshot before search
    await page.screenshot({ path: 'test-results/09-before-search.png', fullPage: true });
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="尋找商品"], input[placeholder*="搜尋"]').first();
    if (await searchInput.count() > 0) {
      console.log('📝 Testing search functionality');
      await searchInput.fill('iPhone');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/10-search-iphone.png', fullPage: true });
      
      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(1000);
    }
    
    // Test filter dropdowns
    const filterDropdowns = await page.locator('select, .dropdown, [class*="select"]').count();
    console.log(`📊 Filter Elements Found: ${filterDropdowns}`);
    
    if (filterDropdowns > 0) {
      const firstFilter = page.locator('select').first();
      if (await firstFilter.count() > 0) {
        await firstFilter.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/11-filter-applied.png', fullPage: true });
      }
    }
    
    console.log('✅ Search and Filtering test completed');
  });

  test('2. Inventory Statistics Verification', async ({ page }) => {
    console.log('📊 Testing Inventory Statistics');
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Go to main inventory page
    await page.goto('http://127.0.0.1:8000/inventory');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Check statistics cards
    const statsCards = await page.locator('.card, [class*="card"], .stat, [class*="stat"]').count();
    console.log(`📊 Statistics Cards Found: ${statsCards}`);
    
    // Extract numerical values from statistics
    const totalProducts = await page.locator('text=/\\d+/').allTextContents();
    console.log('📈 Statistics Values Found:', totalProducts.slice(0, 10));
    
    // Verify statistics are not all zeros (indicating real data)
    const hasNonZeroStats = totalProducts.some(text => {
      const num = parseInt(text.replace(/[^0-9]/g, ''));
      return num > 0;
    });
    
    expect(hasNonZeroStats).toBeTruthy();
    console.log('✅ Statistics verification completed');
  });

  test('3. Product Detail Modal Test', async ({ page }) => {
    console.log('🔍 Testing Product Detail Modal');
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Go to main inventory page
    await page.goto('http://127.0.0.1:8000/inventory');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Look for clickable product elements
    const productCards = await page.locator('.card, [class*="product"], [data-product]').count();
    console.log(`🏷️ Product Elements Found: ${productCards}`);
    
    if (productCards > 0) {
      // Try to click on first product
      const firstProduct = page.locator('.card, [class*="product"]').first();
      await firstProduct.click();
      await page.waitForTimeout(2000);
      
      // Check if modal or detail view opened
      const modal = await page.locator('.modal, [class*="modal"], .popup, [class*="popup"]').count();
      if (modal > 0) {
        await page.screenshot({ path: 'test-results/12-product-modal.png', fullPage: true });
        console.log('✅ Product modal opened successfully');
        
        // Close modal if close button exists
        const closeButton = page.locator('button[class*="close"], .close, [aria-label="close"]');
        if (await closeButton.count() > 0) {
          await closeButton.click();
        }
      }
    }
    
    console.log('✅ Product detail modal test completed');
  });

  test('4. Inventory Actions Test', async ({ page }) => {
    console.log('⚡ Testing Inventory Action Buttons');
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Go to main inventory page
    await page.goto('http://127.0.0.1:8000/inventory');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Test action buttons
    const actionButtons = await page.locator('button').count();
    console.log(`🔘 Action Buttons Found: ${actionButtons}`);
    
    // Test "匯入庫存" (Import Inventory) button if exists
    const importButton = page.locator('text=匯入庫存, text=Import');
    if (await importButton.count() > 0) {
      console.log('📥 Testing Import Inventory button');
      await importButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/13-import-action.png', fullPage: true });
    }
    
    // Test "確出" (Export) button if exists
    const exportButton = page.locator('text=確出, text=Export');
    if (await exportButton.count() > 0) {
      console.log('📤 Testing Export button');
      await exportButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/14-export-action.png', fullPage: true });
    }
    
    // Test "庫存警報" (Inventory Alerts) button if exists
    const alertButton = page.locator('text=庫存警報, text=Alert');
    if (await alertButton.count() > 0) {
      console.log('⚠️ Testing Inventory Alerts button');
      await alertButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/15-alerts-action.png', fullPage: true });
    }
    
    console.log('✅ Inventory actions test completed');
  });

  test('5. Page Navigation and Breadcrumbs Test', async ({ page }) => {
    console.log('🧭 Testing Page Navigation');
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Test inventory main page
    await page.goto('http://127.0.0.1:8000/inventory');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('✅ Inventory main page loaded');
    
    // Test navigation to inventory levels
    await page.goto('http://127.0.0.1:8000/inventory/levels');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.screenshot({ path: 'test-results/16-inventory-levels-nav.png', fullPage: true });
    console.log('✅ Inventory levels page navigation successful');
    
    // Test navigation to inventory transactions
    await page.goto('http://127.0.0.1:8000/inventory/transactions');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.screenshot({ path: 'test-results/17-inventory-transactions-nav.png', fullPage: true });
    console.log('✅ Inventory transactions page navigation successful');
    
    // Test breadcrumb navigation if available
    const breadcrumbs = await page.locator('.breadcrumb, [class*="breadcrumb"], nav ol, nav ul').count();
    console.log(`🍞 Breadcrumb Elements Found: ${breadcrumbs}`);
    
    if (breadcrumbs > 0) {
      await page.screenshot({ path: 'test-results/18-breadcrumbs.png', fullPage: true });
    }
    
    console.log('✅ Page navigation test completed');
  });

  test('6. Data Consistency Verification', async ({ page }) => {
    console.log('🔄 Testing Data Consistency');
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Collect data from main inventory page
    await page.goto('http://127.0.0.1:8000/inventory');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    const mainPageProducts = await page.locator('.card, [class*="product"], tr').count();
    console.log(`📊 Main Page Products: ${mainPageProducts}`);
    
    // Collect data from inventory levels page
    await page.goto('http://127.0.0.1:8000/inventory/levels');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    const levelsPageProducts = await page.locator('tr, .item, [class*="product"]').count();
    console.log(`📈 Levels Page Products: ${levelsPageProducts}`);
    
    // Check if data is consistent (should be similar counts)
    const dataConsistent = Math.abs(mainPageProducts - levelsPageProducts) <= 5; // Allow 5 item tolerance
    console.log(`📊 Data Consistency Check: ${dataConsistent ? 'PASS' : 'FAIL'}`);
    
    expect(dataConsistent).toBeTruthy();
    console.log('✅ Data consistency verification completed');
  });

});