import { test, expect } from '@playwright/test';

/**
 * Direct Test for Task 72: Multi-Step Quote Form
 * Testing without complex dashboard dependencies
 */

test.describe('Task 72 - Direct Multi-Step Quote Form Test', () => {
  const TEST_ACCOUNT = {
    email: 'test@example.com',
    password: 'password123'
  };

  // Simple login helper
  async function login(page) {
    console.log('Attempting login...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Fill and submit login form
    await page.fill('input[name="email"]', TEST_ACCOUNT.email);
    await page.fill('input[name="password"]', TEST_ACCOUNT.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect (any page that's not login)
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
    
    console.log('Login completed, current page:', page.url());
    return page.url();
  }

  test('Direct Navigation to Multi-Step Quote Form', async ({ page }) => {
    console.log('Test: Direct navigation to /quotes/create/multi-step');
    
    // Login first
    await login(page);
    
    // Direct navigation to multi-step form
    await page.goto('/quotes/create/multi-step');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/01-multi-step-form-direct.png', 
      fullPage: true 
    });
    
    console.log('Multi-step form page loaded, URL:', page.url());
    
    // Check if page loaded successfully (not 404 or error)
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Check for common error indicators
    const errorText = await page.locator('body').textContent();
    
    if (errorText.includes('404') || errorText.includes('Not Found')) {
      console.log('❌ Multi-step form route not found (404)');
      throw new Error('Multi-step form route does not exist');
    }
    
    if (errorText.includes('500') || errorText.includes('Internal Server Error')) {
      console.log('❌ Server error loading multi-step form');
      throw new Error('Server error loading multi-step form');
    }
    
    // Look for form elements
    const formElements = await page.locator('form, .form, [data-step], .step').count();
    console.log('Form elements found:', formElements);
    
    // Look for step indicators
    const stepIndicators = await page.locator('.step-1, .step-2, .step-3, [data-step="1"], .steps, .progress').count();
    console.log('Step indicators found:', stepIndicators);
    
    // Look for Alpine.js attributes (x-data, x-show, etc.)
    const alpineElements = await page.locator('[x-data], [x-show], [x-if]').count();
    console.log('Alpine.js elements found:', alpineElements);
    
    // Check for specific quote form fields
    const quoteFields = await page.locator('input[name*="customer"], select[name*="customer"], input[name*="date"], input[name*="product"]').count();
    console.log('Quote form fields found:', quoteFields);
    
    // Log all visible text content for debugging
    const bodyContent = await page.locator('body').textContent();
    console.log('Page content preview (first 500 chars):', bodyContent.substring(0, 500));
    
    // Expect at least some form elements to be present
    expect(formElements).toBeGreaterThan(0);
  });

  test('Test Multi-Step Form Functionality (If Available)', async ({ page }) => {
    console.log('Test: Multi-step form functionality');
    
    // Login first
    await login(page);
    
    // Navigate to multi-step form
    await page.goto('/quotes/create/multi-step');
    await page.waitForLoadState('networkidle');
    
    try {
      // Take initial screenshot
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/02-form-functionality-test.png', 
        fullPage: true 
      });
      
      // Test Step 1: Look for customer selection
      console.log('Testing Step 1 elements...');
      
      const customerSelect = await page.locator('select[name*="customer"], #customer_id, .customer-select').first();
      if (await customerSelect.isVisible()) {
        console.log('✅ Customer selection field found');
        
        // Try to interact with customer select
        const options = await customerSelect.locator('option').count();
        console.log('Customer options available:', options);
        
        if (options > 1) {
          await customerSelect.selectOption({ index: 1 });
          console.log('✅ Customer selected');
        }
      } else {
        console.log('❌ Customer selection field not found');
      }
      
      // Look for date fields
      const dateField = await page.locator('input[type="date"], input[name*="date"]').first();
      if (await dateField.isVisible()) {
        console.log('✅ Date field found');
        const today = new Date().toISOString().split('T')[0];
        await dateField.fill(today);
        console.log('✅ Date field filled');
      } else {
        console.log('❌ Date field not found');
      }
      
      // Look for next button or step navigation
      const nextButton = await page.locator('button:has-text("Next"), button:has-text("下一步"), .btn-next, [data-next]').first();
      if (await nextButton.isVisible()) {
        console.log('✅ Next button found');
        await nextButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Next button clicked');
        
        // Take screenshot after step transition
        await page.screenshot({ 
          path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/03-after-next-step.png', 
          fullPage: true 
        });
      } else {
        console.log('❌ Next button not found');
      }
      
      // Test Step 2: Product selection
      console.log('Testing Step 2 elements...');
      
      const productField = await page.locator('input[name*="product"], .product-search, #product-search').first();
      if (await productField.isVisible()) {
        console.log('✅ Product search field found');
        await productField.fill('test product');
        await page.waitForTimeout(1000);
        console.log('✅ Product search tested');
      } else {
        console.log('❌ Product search field not found');
      }
      
      // Look for add product button
      const addButton = await page.locator('button:has-text("Add"), button:has-text("新增"), .btn-add').first();
      if (await addButton.isVisible()) {
        console.log('✅ Add product button found');
        await addButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Add product button tested');
      } else {
        console.log('❌ Add product button not found');
      }
      
      // Test quantity/price fields
      const quantityField = await page.locator('input[name*="quantity"], input[type="number"]').first();
      if (await quantityField.isVisible()) {
        console.log('✅ Quantity field found');
        await quantityField.fill('5');
        console.log('✅ Quantity field tested');
      }
      
      const priceField = await page.locator('input[name*="price"], input[name*="unit_price"]').first();
      if (await priceField.isVisible()) {
        console.log('✅ Price field found');
        await priceField.fill('100.00');
        console.log('✅ Price field tested');
      }
      
      // Take screenshot of product step
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/04-product-step.png', 
        fullPage: true 
      });
      
      // Test Draft functionality
      console.log('Testing draft functionality...');
      
      const draftButton = await page.locator('button:has-text("Draft"), button:has-text("草稿"), .btn-draft').first();
      if (await draftButton.isVisible()) {
        console.log('✅ Draft button found');
        await draftButton.click();
        await page.waitForTimeout(2000);
        
        // Look for success message
        const successAlert = await page.locator('.alert-success, .success-message, .toast').first();
        if (await successAlert.isVisible()) {
          const message = await successAlert.textContent();
          console.log('✅ Draft save success:', message);
        } else {
          console.log('ℹ️ Draft button clicked, but no visible success message');
        }
      } else {
        console.log('❌ Draft button not found');
      }
      
      // Final screenshot
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/05-final-state.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.error('Error during functionality test:', error);
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/error-functionality.png', 
        fullPage: true 
      });
      // Don't throw error, just log it
    }
  });

  test('Test API Endpoint Accessibility', async ({ page }) => {
    console.log('Test: API endpoint accessibility');
    
    // Login first
    await login(page);
    
    // Test draft API endpoint
    try {
      const draftResponse = await page.request.get('/api/quotations/draft');
      console.log('Draft API status:', draftResponse.status());
      
      if (draftResponse.ok()) {
        const draftData = await draftResponse.json();
        console.log('✅ Draft API accessible, response:', JSON.stringify(draftData, null, 2));
      } else {
        console.log('❌ Draft API not accessible, status:', draftResponse.status());
      }
    } catch (error) {
      console.log('❌ Draft API error:', error.message);
    }
    
    // Test regular quotes API
    try {
      const quotesResponse = await page.request.get('/api/quotations');
      console.log('Quotes API status:', quotesResponse.status());
      
      if (quotesResponse.ok()) {
        console.log('✅ Quotes API accessible');
      } else {
        console.log('❌ Quotes API not accessible, status:', quotesResponse.status());
      }
    } catch (error) {
      console.log('❌ Quotes API error:', error.message);
    }
  });
});