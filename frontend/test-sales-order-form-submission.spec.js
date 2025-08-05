import { test, expect } from '@playwright/test';

test.describe('Sales Order Form Submission Test', () => {
  
  test('should successfully submit sales order form after company_id fix', async ({ page }) => {
    console.log('🟢 Testing sales order form submission after RLS fix');

    // Listen for console messages
    page.on('console', msg => {
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });

    // Listen for network requests
    page.on('request', request => {
      if (request.url().includes('/api/sales-orders')) {
        console.log(`Network Request: ${request.method()} ${request.url()}`);
      }
    });

    // Listen for response
    page.on('response', response => {
      if (response.url().includes('/api/sales-orders')) {
        console.log(`Network Response: ${response.status()} ${response.url()}`);
      }
    });

    // Step 1: Navigate to login page
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');

    // Step 2: Login
    if (await page.locator('input[name="email"]').isVisible()) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    // Step 3: Navigate to sales order creation page
    await page.goto('http://127.0.0.1:8000/customers/1/orders/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 4: Fill form data
    console.log('Filling form data...');
    
    // Select customer
    await page.locator('select[name="customer_id"]').selectOption({ index: 1 });
    
    // Add item
    await page.locator('button:has-text("新增項目")').click();
    await page.waitForTimeout(2000);
    
    // Select product
    await page.locator('select[name*="[product_id]"]').first().selectOption({ index: 1 });
    await page.waitForTimeout(2000);
    
    // Enter quantity
    await page.locator('input[name*="[quantity]"]').first().fill('3');
    
    // Check if price is auto-filled, if not, fill manually
    const priceInput = page.locator('input[name*="[unit_price]"]').first();
    const priceValue = await priceInput.inputValue();
    if (!priceValue || priceValue === '0.00') {
      await priceInput.fill('150.00');
    }

    console.log('Form filled, attempting submission...');

    // Take screenshot before submission
    await page.screenshot({ path: 'test-results/before-submission.png', fullPage: true });

    // Step 5: Submit form
    await page.locator('button:has-text("建立訂單")').click();
    
    // Wait for response
    await page.waitForTimeout(5000);

    // Take screenshot after submission
    await page.screenshot({ path: 'test-results/after-submission.png', fullPage: true });

    // Check the result
    const currentUrl = page.url();
    console.log(`URL after submission: ${currentUrl}`);

    // Check for success indicators
    const successIndicators = page.locator('.alert-success, .success-message, .flash-success');
    const errorIndicators = page.locator('.alert-danger, .error-message, .flash-error, .alert-error');

    const hasSuccess = await successIndicators.count() > 0;
    const hasError = await errorIndicators.count() > 0;

    if (hasSuccess) {
      const successMessage = await successIndicators.first().textContent();
      console.log(`✅ Success: ${successMessage}`);
    } else if (hasError) {
      const errorMessage = await errorIndicators.first().textContent();
      console.log(`❌ Error: ${errorMessage}`);
    } else if (currentUrl.includes('/orders/sales') && !currentUrl.includes('/create')) {
      console.log('✅ Success: Redirected to orders list');
    } else {
      console.log('⚠️ Status unclear - checking for any visible feedback');
    }

    // Additional validation: check if we're no longer on the create page
    const isOnCreatePage = currentUrl.includes('/create');
    const hasFormElements = await page.locator('form').count() > 0;
    
    console.log(`Still on create page: ${isOnCreatePage}`);
    console.log(`Has form elements: ${hasFormElements}`);

    // The test should pass if we're not still on the create page OR if there's a success message
    expect(!isOnCreatePage || hasSuccess).toBeTruthy();
  });
});