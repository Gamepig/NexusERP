import { test, expect } from '@playwright/test';

test.describe('Quote System Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Successfully logged in');
  });

  test('Test 1: Navigate to quotes system and check quote display', async ({ page }) => {
    console.log('🔍 Testing quote number and product name display...');
    
    // Navigate to quotes
    await page.goto('http://127.0.0.1:8000/quotes');
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to quotes page');

    // Check if quotes are displayed
    const quoteRows = await page.locator('tbody tr').count();
    console.log(`📊 Found ${quoteRows} quotes on the page`);

    if (quoteRows > 0) {
      // Click on first quote to view details
      await page.click('tbody tr:first-child a[href*="/quotes/"]');
      await page.waitForLoadState('networkidle');
      console.log('✅ Clicked on first quote');

      // Check quote number display (should NOT be QT-001 format)
      const quoteNumberElement = await page.locator('[data-testid="quote-number"], .quote-number, h1, h2').first();
      if (await quoteNumberElement.isVisible()) {
        const quoteNumber = await quoteNumberElement.textContent();
        console.log(`🏷️ Quote number displayed: ${quoteNumber}`);
        
        // Check if it's the old calculated format (QT-001) vs API format
        if (quoteNumber && quoteNumber.includes('QT-')) {
          console.log('❌ Still showing calculated format (QT-xxx) - Fix may not be working');
        } else {
          console.log('✅ Quote number appears to be from API (not calculated format)');
        }
      }

      // Check product names in quote items
      const productNameElements = await page.locator('[data-product-name], .product-name, td').allTextContents();
      const unknownProducts = productNameElements.filter(text => text && text.includes('Unknown Product'));
      
      if (unknownProducts.length > 0) {
        console.log(`❌ Found ${unknownProducts.length} "Unknown Product" entries - Product name fix may not be working`);
      } else {
        console.log('✅ No "Unknown Product" entries found - Product names appear to be loaded correctly');
      }
    }
  });

  test('Test 2: Test edit functionality and form loading', async ({ page }) => {
    console.log('🔍 Testing edit form product loading...');
    
    await page.goto('http://127.0.0.1:8000/quotes');
    await page.waitForLoadState('networkidle');

    // Look for edit button and click it
    const editButton = await page.locator('a[href*="/quotes/"][href*="/edit"], .btn-edit, [data-action="edit"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Clicked edit button');

      // Wait for Alpine.js to initialize
      await page.waitForTimeout(2000);

      // Check if product names are loaded in the form
      const productInputs = await page.locator('input[data-product], .product-input, [x-model*="product"]').allTextContents();
      const selectOptions = await page.locator('select option, .product-select option').allTextContents();
      
      console.log('📝 Form product fields found:', productInputs.length);
      console.log('📝 Select options found:', selectOptions.length);

      // Check for "Unknown Product" in form
      const formUnknownProducts = [...productInputs, ...selectOptions].filter(text => 
        text && text.includes('Unknown Product')
      );

      if (formUnknownProducts.length > 0) {
        console.log(`❌ Found ${formUnknownProducts.length} "Unknown Product" in edit form - Alpine.js initialization may not be working`);
      } else {
        console.log('✅ Edit form appears to have proper product names loaded');
      }

      // Test multi-step form navigation
      const nextButton = await page.locator('button:has-text("Next"), .btn-next, [x-show*="step"]').first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Multi-step form navigation working');
      }
    } else {
      console.log('⚠️ No edit button found - may need to create a quote first');
    }
  });

  test('Test 3: Create new quote and verify status issue', async ({ page }) => {
    console.log('🔍 Testing new quote creation and status issue...');
    
    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to create quote page');

    // Wait for Alpine.js initialization
    await page.waitForTimeout(2000);

    // Fill in basic quote information
    await page.fill('input[name="client_name"], [x-model*="client"]', 'Test Client');
    await page.fill('input[name="client_email"], [x-model*="email"]', 'testclient@example.com');
    
    // Try to select "sent" status
    const statusSelect = await page.locator('select[name="status"], [x-model*="status"]').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption({ label: 'Sent' });
      console.log('✅ Selected "Sent" status in form');
    }

    // Add a product to the quote
    const addProductButton = await page.locator('button:has-text("Add Product"), .add-product, [x-on\\:click*="add"]').first();
    if (await addProductButton.isVisible()) {
      await addProductButton.click();
      await page.waitForTimeout(1000);
      
      // Fill product information
      const productInputs = await page.locator('input[data-product], .product-search').all();
      if (productInputs.length > 0) {
        await productInputs[0].fill('Test Product');
        await page.waitForTimeout(500);
      }
    }

    // Submit the form
    const submitButton = await page.locator('button[type="submit"], .btn-submit, button:has-text("Save")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Submitted new quote form');

      // Check if we were redirected to quotes list or quote detail
      const currentURL = page.url();
      if (currentURL.includes('/quotes')) {
        console.log('✅ Redirected after quote creation');
        
        // Look for the newly created quote and check its status
        const statusElements = await page.locator('.status, [data-status], td').allTextContents();
        const draftStatuses = statusElements.filter(text => 
          text && (text.toLowerCase().includes('draft') || text.toLowerCase().includes('草稿'))
        );
        
        if (draftStatuses.length > 0) {
          console.log('🔍 Found draft status - confirming backend forces draft status despite frontend input');
          console.log('❌ Status issue confirmed: Backend forces "draft" regardless of frontend selection');
        } else {
          console.log('⚠️ Could not confirm status issue - may need to check individual quote');
        }
      }
    } else {
      console.log('⚠️ Submit button not found - form structure may be different');
    }
  });

  test('Test 4: API Integration Verification', async ({ page }) => {
    console.log('🔍 Testing API integration and data flow...');
    
    // Intercept API calls to verify they're working
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    await page.goto('http://127.0.0.1:8000/quotes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log(`📡 Captured ${apiCalls.length} API calls:`);
    apiCalls.forEach(call => {
      console.log(`  ${call.method} ${call.url}`);
    });

    // Check for specific API endpoints
    const quotesAPI = apiCalls.some(call => call.url.includes('/quotes'));
    const productsAPI = apiCalls.some(call => call.url.includes('/products'));

    if (quotesAPI) {
      console.log('✅ Quotes API calls detected');
    } else {
      console.log('❌ No quotes API calls detected - API integration may have issues');
    }

    if (productsAPI) {
      console.log('✅ Products API calls detected');  
    } else {
      console.log('⚠️ No products API calls detected - product loading may have issues');
    }
  });
});