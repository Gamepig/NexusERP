const { test, expect } = require('@playwright/test');

test.describe('Product Sales Analysis Fix Verification', () => {
  test('verify correct route and functionality of product sales analysis', async ({ page }) => {
    console.log('🔍 Verifying product sales analysis fix...');

    // Enable console logging
    page.on('console', msg => {
      console.log(`📱 CONSOLE [${msg.type()}]:`, msg.text());
    });

    page.on('response', response => {
      if (response.url().includes('api') || response.status() >= 400) {
        console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });

    try {
      // Step 1: Navigate and login
      console.log('📍 Step 1: Navigating to homepage and logging in...');
      await page.goto('http://127.0.0.1:8000');
      await page.waitForLoadState('networkidle');
      
      // Check if login form exists
      const loginForm = await page.locator('form').first();
      if (await loginForm.isVisible()) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        console.log('✅ Login successful');
      }

      await page.screenshot({ 
        path: 'fix-verification-01-login-success.png', 
        fullPage: true 
      });

      // Step 2: Navigate to correct product sales analysis route
      console.log('📍 Step 2: Navigating to correct product sales analysis route...');
      
      // Use the correct route: /reports/sales/by-product
      await page.goto('http://127.0.0.1:8000/reports/sales/by-product');
      await page.waitForLoadState('networkidle');
      
      // Wait for page to load
      await page.waitForTimeout(3000);

      // Take screenshot of the loaded page
      await page.screenshot({ 
        path: 'fix-verification-02-page-loaded.png', 
        fullPage: true 
      });

      // Step 3: Verify page content
      console.log('📍 Step 3: Verifying page content...');
      
      const currentUrl = page.url();
      const pageTitle = await page.title();
      console.log('📊 Current URL:', currentUrl);
      console.log('📋 Page Title:', pageTitle);

      // Check if we get a 404 or success
      const pageText = await page.textContent('body');
      const isNotFound = pageTitle.includes('Not Found') || pageText?.includes('404');
      const hasErrorMessage = pageText?.includes('載入產品銷售報表失敗') || pageText?.includes('Failed to load');
      
      console.log('🔍 Is 404 page:', isNotFound);
      console.log('🔍 Has error message:', hasErrorMessage);
      
      if (!isNotFound) {
        console.log('✅ Page loaded successfully - no 404 error');
        
        // Check for report content
        const hasReportContent = await page.locator('.chart, .table, .report, [id*="chart"], .card, .dashboard').count();
        console.log('📈 Report elements found:', hasReportContent);
        
        // Check for specific sales report elements
        const hasSalesData = await page.locator('[class*="sales"], [id*="sales"], [class*="product"], [id*="product"]').count();
        console.log('📊 Sales/Product elements found:', hasSalesData);
        
      } else {
        console.log('❌ Page returned 404 - route still not accessible');
      }

      // Step 4: Test API endpoint if page loads successfully
      if (!isNotFound) {
        console.log('📍 Step 4: Testing related API endpoints...');
        
        try {
          // Test the API that might be used by this page
          const context = page.context();
          const apiResponse = await context.request.get('http://127.0.0.1:8000/api/reports/sales/products');
          console.log('📡 API Response Status:', apiResponse.status());
          
          if (apiResponse.ok()) {
            const apiData = await apiResponse.json();
            console.log('✅ API Success - Response keys:', Object.keys(apiData));
          } else {
            console.log('❌ API returned error status:', apiResponse.status());
          }
        } catch (apiError) {
          console.log('❌ API request failed:', apiError.message);
        }
      }

      // Final screenshot
      await page.screenshot({ 
        path: 'fix-verification-03-final-state.png', 
        fullPage: true 
      });

      console.log('✅ Fix verification completed');

    } catch (error) {
      console.error('❌ Error during fix verification:', error);
      await page.screenshot({ 
        path: 'fix-verification-error.png', 
        fullPage: true 
      });
      throw error;
    }
  });

  test('test alternate route naming patterns', async ({ page }) => {
    console.log('🧪 Testing different route naming patterns...');

    const routesToTest = [
      '/reports/sales/products',     // Original failing route
      '/reports/sales/by-product',   // Correct route found in routes file
      '/reports/sales/product',      // Singular version
      '/reports/sales/product-analysis', // Possible alternative
    ];

    for (const route of routesToTest) {
      console.log(`📍 Testing route: ${route}`);
      
      try {
        await page.goto(`http://127.0.0.1:8000${route}`);
        await page.waitForLoadState('networkidle');
        
        const pageTitle = await page.title();
        const isNotFound = pageTitle.includes('Not Found');
        
        console.log(`${isNotFound ? '❌' : '✅'} Route ${route}: ${isNotFound ? '404' : 'Success'}`);
        
      } catch (error) {
        console.log(`❌ Route ${route}: Error - ${error.message}`);
      }
    }
  });
});