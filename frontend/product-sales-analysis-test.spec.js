import { test, expect } from '@playwright/test';

/**
 * Product Sales Analysis Page Testing
 * Following CLAUDE_CODE_RULES.md requirements for actual testing
 * Testing the page that shows "載入產品銷售報表失敗" error
 */

test.describe('Product Sales Analysis Page Investigation', () => {
  
  test('1. Login and Access Product Sales Analysis Page', async ({ page }) => {
    console.log('=== Starting Product Sales Analysis Investigation ===');
    
    // Step 1: Navigate to login page
    await page.goto('http://127.0.0.1:8000');
    await page.screenshot({ path: 'investigation-01-homepage.png' });
    
    // Check if redirected to login page
    if (page.url().includes('/login')) {
      console.log('Redirected to login page as expected');
      await page.screenshot({ path: 'investigation-02-login-page.png' });
      
      // Fill login form using test credentials from CLAUDE.md
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.screenshot({ path: 'investigation-03-login-filled.png' });
      
      // Submit login
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000); // Wait for redirect
      await page.screenshot({ path: 'investigation-04-after-login.png' });
    }
    
    // Step 2: Navigate to Reports Center
    console.log('Navigating to Reports Center...');
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'investigation-05-reports-center.png' });
    
    // Step 3: Navigate to Sales Reports
    console.log('Navigating to Sales Reports...');
    await page.goto('http://127.0.0.1:8000/reports/sales');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'investigation-06-sales-reports.png' });
    
    // Step 4: Navigate to Product Sales Analysis (by-product)
    console.log('Navigating to Product Sales Analysis...');
    await page.goto('http://127.0.0.1:8000/reports/sales/by-product');
    await page.waitForTimeout(3000); // Allow time for page to load and any AJAX calls
    await page.screenshot({ path: 'investigation-07-product-sales-analysis.png' });
    
    // Step 5: Capture page content and errors
    console.log('Analyzing page content...');
    
    // Check for error messages
    const errorMessages = await page.locator('.alert-danger, .error, [class*="error"]').allTextContents();
    console.log('Error messages found:', errorMessages);
    
    // Check for "載入產品銷售報表失敗" message
    const failureMessage = await page.locator('text=載入產品銷售報表失敗').count();
    console.log('Found failure message count:', failureMessage);
    
    // Check page title and heading
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log('Page headings:', headings);
    
    // Check for loading states
    const loadingElements = await page.locator('[class*="loading"], .spinner, text=載入中').count();
    console.log('Loading elements count:', loadingElements);
    
    // Check browser console for JavaScript errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`Console Error: ${msg.text()}`);
      }
    });
    
    // Wait a bit more to capture any console errors
    await page.waitForTimeout(2000);
    console.log('Console errors:', logs);
    
    // Check network failures
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });
    
    // Reload page to capture network errors
    await page.reload();
    await page.waitForTimeout(3000);
    console.log('Network errors:', networkErrors);
    
    await page.screenshot({ path: 'investigation-08-final-state.png' });
  });
  
  test('2. Test API Endpoints Directly', async ({ page }) => {
    console.log('=== Testing API Endpoints Directly ===');
    
    // First login to get session
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Test Sales API endpoint
    const salesApiResponse = await page.goto('http://127.0.0.1:8000/api/reports/sales');
    console.log('Sales API Status:', salesApiResponse.status());
    const salesApiText = await page.textContent('body');
    console.log('Sales API Response:', salesApiText.substring(0, 500));
    
    // Test Product Sales API endpoint
    const productSalesApiResponse = await page.goto('http://127.0.0.1:8000/api/reports/sales/by-product');
    console.log('Product Sales API Status:', productSalesApiResponse.status());
    const productSalesApiText = await page.textContent('body');
    console.log('Product Sales API Response:', productSalesApiText.substring(0, 500));
    
    await page.screenshot({ path: 'investigation-09-api-test.png' });
  });
  
  test('3. Database Connectivity Test', async ({ page }) => {
    console.log('=== Testing Database Connectivity ===');
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Test simpler endpoints that should work if database is connected
    await page.goto('http://127.0.0.1:8000/api/products');
    const productsResponse = await page.textContent('body');
    console.log('Products API Response:', productsResponse.substring(0, 300));
    
    await page.goto('http://127.0.0.1:8000/api/sales-orders');
    const salesOrdersResponse = await page.textContent('body');
    console.log('Sales Orders API Response:', salesOrdersResponse.substring(0, 300));
    
    await page.screenshot({ path: 'investigation-10-database-test.png' });
  });
  
});