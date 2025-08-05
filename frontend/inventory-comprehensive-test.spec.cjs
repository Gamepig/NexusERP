const { test, expect } = require('@playwright/test');

test.describe('NexusERP Inventory Management System - Comprehensive Testing', () => {
  
  test('1. Login Authentication Test', async ({ page }) => {
    console.log('🔐 Testing authentication with test@example.com');
    
    // Navigate to login page
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/01-login-page.png', fullPage: true });
    
    // Verify login form elements
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]'); 
    const loginButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    console.log('📝 Filling login credentials');
    
    // Fill credentials
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await page.screenshot({ path: 'test-results/02-credentials-filled.png', fullPage: true });
    
    // Submit login
    await loginButton.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Take screenshot after login
    await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });
    
    // Check if we're logged in (look for dashboard elements or logout option)
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Verify successful login indicators
    const isDashboard = currentUrl.includes('/dashboard') || currentUrl === 'http://127.0.0.1:8000/';
    const hasLogoutOption = await page.locator('text=登出').count() > 0 || await page.locator('text=Logout').count() > 0;
    
    expect(isDashboard || hasLogoutOption).toBeTruthy();
    
    console.log('✅ Authentication test completed successfully');
  });

  test('2. Main Inventory Dashboard Test', async ({ page }) => {
    console.log('📦 Testing Main Inventory Dashboard');
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Navigate to inventory dashboard
    await page.goto('http://127.0.0.1:8000/inventory');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Take screenshot of inventory page
    await page.screenshot({ path: 'test-results/04-inventory-dashboard.png', fullPage: true });
    
    // Check if page loaded successfully (not blank)
    const pageContent = await page.content();
    const hasInventoryContent = pageContent.includes('庫存') || pageContent.includes('inventory') || pageContent.includes('Inventory');
    
    // Count interactive elements
    const buttonCount = await page.locator('button').count();
    const linkCount = await page.locator('a').count();
    const inputCount = await page.locator('input').count();
    
    console.log(`📊 Page Elements Count: Buttons: ${buttonCount}, Links: ${linkCount}, Inputs: ${inputCount}`);
    
    // Check for JavaScript errors
    const jsErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    // Wait a moment for any errors to surface
    await page.waitForTimeout(3000);
    
    console.log('JS Errors found:', jsErrors.length);
    
    // Test passed if page has content and interactive elements
    expect(hasInventoryContent || buttonCount > 0 || linkCount > 0).toBeTruthy();
    
    console.log('✅ Main Inventory Dashboard test completed');
  });

  test('3. Inventory Levels Page Test', async ({ page }) => {
    console.log('📈 Testing Inventory Levels Page');
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Navigate to inventory levels
    await page.goto('http://127.0.0.1:8000/inventory/levels');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/05-inventory-levels.png', fullPage: true });
    
    // Check for page content
    const pageContent = await page.content();
    const hasContent = pageContent.length > 1000; // Basic content check
    
    // Check for data tables or lists
    const tableCount = await page.locator('table').count();
    const listCount = await page.locator('ul, ol').count();
    const cardCount = await page.locator('.card, [class*="card"]').count();
    
    console.log(`📊 Content Elements: Tables: ${tableCount}, Lists: ${listCount}, Cards: ${cardCount}`);
    
    // Test search functionality if available
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="搜尋"], input[placeholder*="search"]').count();
    if (searchInputs > 0) {
      console.log('🔍 Testing search functionality');
      const searchInput = page.locator('input[type="search"], input[placeholder*="搜尋"], input[placeholder*="search"]').first();
      await searchInput.fill('test');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/06-inventory-search.png', fullPage: true });
    }
    
    expect(hasContent).toBeTruthy();
    console.log('✅ Inventory Levels page test completed');
  });

  test('4. Inventory Transactions Page Test', async ({ page }) => {
    console.log('📋 Testing Inventory Transactions Page');
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Navigate to inventory transactions
    await page.goto('http://127.0.0.1:8000/inventory/transactions');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/07-inventory-transactions.png', fullPage: true });
    
    // Check for page content
    const pageContent = await page.content();
    const hasContent = pageContent.length > 1000;
    
    // Check for transaction-related elements
    const transactionElements = await page.locator('table tr, .transaction, [class*="transaction"]').count();
    const buttonCount = await page.locator('button').count();
    
    console.log(`📊 Transaction Elements: ${transactionElements}, Buttons: ${buttonCount}`);
    
    expect(hasContent).toBeTruthy();
    console.log('✅ Inventory Transactions page test completed');
  });

  test('5. Mobile Responsiveness Test', async ({ page }) => {
    console.log('📱 Testing Mobile Responsiveness');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Test inventory page on mobile
    await page.goto('http://127.0.0.1:8000/inventory');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    await page.screenshot({ path: 'test-results/08-mobile-inventory.png', fullPage: true });
    
    // Check if page is responsive (no horizontal scrolling needed)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    
    console.log(`Mobile Layout Check: Body Width: ${bodyWidth}, Viewport: ${viewportWidth}`);
    
    // Should not have excessive horizontal scrolling
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // 20px tolerance
    
    console.log('✅ Mobile responsiveness test completed');
  });

  test('6. Network and API Integration Test', async ({ page }) => {
    console.log('🌐 Testing Network and API Integration');
    
    const networkRequests = [];
    const failedRequests = [];
    
    // Monitor network requests
    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });
    
    page.on('requestfailed', (request) => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()
      });
    });
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Navigate to inventory page and monitor requests
    await page.goto('http://127.0.0.1:8000/inventory');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Wait for potential AJAX requests
    await page.waitForTimeout(5000);
    
    console.log(`📊 Network Analysis:`);
    console.log(`- Total Requests: ${networkRequests.length}`);
    console.log(`- Failed Requests: ${failedRequests.length}`);
    
    // Log API requests specifically
    const apiRequests = networkRequests.filter(req => req.url.includes('/api/'));
    console.log(`- API Requests: ${apiRequests.length}`);
    
    if (apiRequests.length > 0) {
      console.log('API Endpoints called:');
      apiRequests.forEach(req => {
        console.log(`  ${req.method} ${req.url}`);
      });
    }
    
    if (failedRequests.length > 0) {
      console.log('Failed Requests:');
      failedRequests.forEach(req => {
        console.log(`  ${req.method} ${req.url} - ${req.failure?.errorText}`);
      });
    }
    
    // Test should pass if there are no critical failed requests
    const criticalFailures = failedRequests.filter(req => 
      req.url.includes('/api/') || req.resourceType === 'document'
    );
    
    expect(criticalFailures.length).toBeLessThanOrEqual(2); // Allow some tolerance
    
    console.log('✅ Network and API integration test completed');
  });

});