const { test, expect } = require('@playwright/test');

test.describe('Product Sales Analysis Page Diagnosis', () => {
  test('comprehensive diagnosis of product sales analysis page', async ({ page }) => {
    console.log('🚀 Starting product sales analysis diagnosis...');

    // Enable detailed console logging
    page.on('console', msg => {
      console.log(`📱 CONSOLE [${msg.type()}]:`, msg.text());
    });

    page.on('response', response => {
      if (response.url().includes('api') || response.status() >= 400) {
        console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });

    page.on('requestfailed', request => {
      console.log(`❌ REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });

    try {
      // Step 1: Navigate to homepage
      console.log('📍 Step 1: Navigating to homepage...');
      await page.goto('http://127.0.0.1:8000');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of homepage
      await page.screenshot({ 
        path: 'diagnosis-01-homepage.png', 
        fullPage: true 
      });
      console.log('✅ Homepage loaded successfully');

      // Step 2: Login with test account
      console.log('📍 Step 2: Logging in with test account...');
      
      // Check if login form exists
      const loginForm = await page.locator('form').first();
      if (await loginForm.isVisible()) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        console.log('✅ Login successful');
      } else {
        console.log('ℹ️ Already logged in or no login form found');
      }

      // Take screenshot after login
      await page.screenshot({ 
        path: 'diagnosis-02-after-login.png', 
        fullPage: true 
      });

      // Step 3: Navigate to Reports Center
      console.log('📍 Step 3: Navigating to Reports Center...');
      
      // Look for Reports navigation
      const reportsLink = page.locator('a[href*="reports"], nav a:has-text("報表"), nav a:has-text("Reports")').first();
      if (await reportsLink.isVisible()) {
        await reportsLink.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Navigated to Reports Center');
      } else {
        // Try direct navigation
        console.log('🔄 Direct navigation to reports center...');
        await page.goto('http://127.0.0.1:8000/reports');
        await page.waitForLoadState('networkidle');
      }

      // Take screenshot of reports center
      await page.screenshot({ 
        path: 'diagnosis-03-reports-center.png', 
        fullPage: true 
      });

      // Step 4: Navigate to Sales Reports
      console.log('📍 Step 4: Navigating to Sales Reports...');
      
      const salesReportsLink = page.locator('a[href*="sales"], a:has-text("銷售"), a:has-text("Sales")').first();
      if (await salesReportsLink.isVisible()) {
        await salesReportsLink.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Navigated to Sales Reports');
      } else {
        // Try direct navigation
        console.log('🔄 Direct navigation to sales reports...');
        await page.goto('http://127.0.0.1:8000/reports/sales');
        await page.waitForLoadState('networkidle');
      }

      // Take screenshot of sales reports
      await page.screenshot({ 
        path: 'diagnosis-04-sales-reports.png', 
        fullPage: true 
      });

      // Step 5: Navigate to Product Sales Analysis
      console.log('📍 Step 5: Navigating to Product Sales Analysis...');
      
      const productSalesLink = page.locator('a[href*="products"], a:has-text("產品"), a:has-text("Product")').first();
      if (await productSalesLink.isVisible()) {
        await productSalesLink.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Clicked Product Sales Analysis link');
      } else {
        // Try direct navigation to the specific page
        console.log('🔄 Direct navigation to product sales analysis...');
        await page.goto('http://127.0.0.1:8000/reports/sales/products');
        await page.waitForLoadState('networkidle');
      }

      // Step 6: Wait and analyze the page content
      console.log('📍 Step 6: Analyzing page content...');
      await page.waitForTimeout(3000); // Wait for any async loading

      // Take screenshot of product sales analysis page
      await page.screenshot({ 
        path: 'diagnosis-05-product-sales-analysis.png', 
        fullPage: true 
      });

      // Check for error messages
      const errorMessages = await page.locator('.alert-danger, .error, [class*="error"], .text-red').allTextContents();
      if (errorMessages.length > 0) {
        console.log('🚨 Error messages found:', errorMessages);
      }

      // Check for loading states
      const loadingElements = await page.locator('.loading, .spinner, [class*="loading"]').count();
      console.log('⏳ Loading elements found:', loadingElements);

      // Check page title and URL
      const currentUrl = page.url();
      const pageTitle = await page.title();
      console.log('📊 Current URL:', currentUrl);
      console.log('📋 Page Title:', pageTitle);

      // Check for specific content
      const hasReportContent = await page.locator('.chart, .table, .report, [id*="chart"]').count();
      console.log('📈 Chart/Report elements found:', hasReportContent);

      // Step 7: Test API endpoints directly
      console.log('📍 Step 7: Testing API endpoints...');
      
      // Get the page's context to access cookies/session
      const context = page.context();
      
      // Test the API endpoint that might be causing the issue
      try {
        const apiResponse = await context.request.get('http://127.0.0.1:8000/api/reports/sales/products');
        console.log('📡 API Response Status:', apiResponse.status());
        
        if (apiResponse.ok()) {
          const apiData = await apiResponse.json();
          console.log('📊 API Data Sample:', JSON.stringify(apiData).substring(0, 200) + '...');
        } else {
          const errorText = await apiResponse.text();
          console.log('❌ API Error:', errorText.substring(0, 200) + '...');
        }
      } catch (apiError) {
        console.log('❌ API Request Failed:', apiError.message);
      }

      // Take final screenshot
      await page.screenshot({ 
        path: 'diagnosis-06-final-state.png', 
        fullPage: true 
      });

      // Step 8: Check database connectivity (if possible)
      console.log('📍 Step 8: Checking application health...');
      
      // Check if there are any JavaScript errors in console
      const logs = [];
      page.on('console', msg => logs.push(msg));
      
      // Wait a bit more to capture any delayed errors
      await page.waitForTimeout(2000);
      
      console.log('📝 Console logs captured:', logs.length);
      
      // Check page elements for diagnostic info
      const pageText = await page.textContent('body');
      const hasFailMessage = pageText?.includes('載入產品銷售報表失敗') || pageText?.includes('Failed to load');
      console.log('🔍 Contains fail message:', hasFailMessage);
      
      if (hasFailMessage) {
        console.log('🚨 CONFIRMED: "載入產品銷售報表失敗" message found on page');
      }

      console.log('✅ Diagnosis completed successfully');

    } catch (error) {
      console.error('❌ Error during diagnosis:', error);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'diagnosis-error.png', 
        fullPage: true 
      });
      
      throw error;
    }
  });

  test('direct API endpoint testing', async ({ request }) => {
    console.log('🧪 Testing API endpoints directly...');

    try {
      // Test the main API endpoint
      const response = await request.get('http://127.0.0.1:8000/api/reports/sales/products');
      
      console.log('📡 Direct API Test Results:');
      console.log('Status:', response.status());
      console.log('Headers:', await response.allHeaders());
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ API Success - Data keys:', Object.keys(data));
      } else {
        const errorBody = await response.text();
        console.log('❌ API Error Body:', errorBody);
      }
    } catch (error) {
      console.log('❌ Direct API test failed:', error.message);
    }
  });
});