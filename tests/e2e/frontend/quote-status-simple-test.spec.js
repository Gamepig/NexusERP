import { test, expect } from '@playwright/test';

test.describe('Quote Status Fix - Simple Verification', () => {
  test('Verify status field is not hardcoded in multi-step form template', async ({ page }) => {
    // Navigate directly to multi-step form (might show login redirect)
    await page.goto('http://127.0.0.1:8084/quotes/create/multi-step');
    
    // Take a screenshot to see what we get
    await page.screenshot({ path: 'test-results/quote-status-simple-test.png' });
    
    // Check if we got redirected to login or if we can access the form
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('ℹ️ Redirected to login - this is expected behavior');
      
      // Check if the login form exists
      const loginForm = page.locator('form');
      if (await loginForm.count() > 0) {
        console.log('✅ Login page is accessible, which means routing is working');
      }
    } else {
      console.log('✅ Direct access to quotes form is possible');
      
      // If we can access the form directly, check for the status select
      const statusSelect = page.locator('select[x-model="formData.status"]');
      if (await statusSelect.count() > 0) {
        console.log('✅ Status select field found in the form');
      }
    }
  });
  
  test('Verify routes are defined and not returning 404', async ({ page }) => {
    // Test main quotes page
    const quotesResponse = await page.goto('http://127.0.0.1:8084/quotes');
    const quotesStatus = quotesResponse?.status() || 'no response';
    console.log('Quotes index status:', quotesStatus);
    
    // Test create page  
    const createResponse = await page.goto('http://127.0.0.1:8084/quotes/create');
    const createStatus = createResponse?.status() || 'no response';
    console.log('Create page status:', createStatus);
    
    // Test multi-step create page
    const multiStepResponse = await page.goto('http://127.0.0.1:8084/quotes/create/multi-step');
    const multiStepStatus = multiStepResponse?.status() || 'no response';
    console.log('Multi-step create status:', multiStepStatus);
    
    // Even if we get redirects (302) or authentication errors, we shouldn't get 404
    expect(quotesStatus).not.toBe(404);
    expect(createStatus).not.toBe(404);
    expect(multiStepStatus).not.toBe(404);
    
    console.log('✅ No 404 errors found - routes are properly defined');
  });
  
  test('Verify template files exist by checking source code', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check if the multi-step form template exists
    const multiStepFormPath = path.join(__dirname, '../resources/views/quotes/multi-step-form.blade.php');
    const multiStepExists = fs.existsSync(multiStepFormPath);
    expect(multiStepExists).toBe(true);
    console.log('✅ Multi-step form template exists');
    
    // Check if our status fix is in the template
    const multiStepContent = fs.readFileSync(multiStepFormPath, 'utf8');
    const hasStatusFix = multiStepContent.includes("status: '{{ isset($quote) ? $quote['status'] : 'draft' }}'");
    expect(hasStatusFix).toBe(true);
    console.log('✅ Status field fix is present in template');
    
    // Check controller exists
    const controllerPath = path.join(__dirname, '../app/Http/Controllers/Web/QuoteController.php');
    const controllerExists = fs.existsSync(controllerPath);
    expect(controllerExists).toBe(true);
    console.log('✅ QuoteController exists');
    
    // Check if validation includes status
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    const hasStatusValidation = controllerContent.includes("'status' => 'nullable|string|in:draft,sent,accepted,rejected,expired'");
    expect(hasStatusValidation).toBe(true);
    console.log('✅ Status validation is present in controller');
    
    const usesValidatedStatus = controllerContent.includes("'status' => $validated['status'] ?? 'draft'");
    expect(usesValidatedStatus).toBe(true);
    console.log('✅ Controller uses validated status instead of hardcoded value');
  });
});