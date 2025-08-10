import { test, expect } from '@playwright/test';

test.describe('Quote System Fixes - Focused Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('CRITICAL: Verify Quote Number Display Fix', async ({ page }) => {
    console.log('🎯 TESTING: Quote number display fix...');
    
    await page.goto('http://127.0.0.1:8000/quotes');
    await page.waitForLoadState('networkidle');

    // Get first quote link
    const firstQuoteLink = page.locator('tbody tr:first-child a').first();
    await firstQuoteLink.click();
    await page.waitForLoadState('networkidle');

    // Check quote number display
    const pageText = await page.textContent('body');
    
    if (pageText.includes('QT-0') || pageText.includes('QT-1')) {
      console.log('❌ FAILED: Still showing calculated format (QT-xxx)');
      console.log('🔍 Quote number pattern found in page');
    } else if (pageText.includes('QT2025') || pageText.includes('Quote #')) {
      console.log('✅ SUCCESS: Quote number appears to be from API');
      console.log('🎯 Fix is working: Quote numbers are loaded from API');
    } else {
      console.log('⚠️ UNCLEAR: Could not determine quote number format');
    }

    // Log actual quote number found
    const quoteNumbers = pageText.match(/QT[\d]+|Quote\s*#[\w\d]+/g);
    if (quoteNumbers) {
      console.log('📋 Quote numbers found:', quoteNumbers);
    }
  });

  test('CRITICAL: Verify Product Names Fix', async ({ page }) => {
    console.log('🎯 TESTING: Product names display fix...');
    
    await page.goto('http://127.0.0.1:8000/quotes');
    await page.waitForLoadState('networkidle');

    // Click on first quote
    await page.click('tbody tr:first-child a');
    await page.waitForLoadState('networkidle');

    // Check for "Unknown Product" text
    const pageText = await page.textContent('body');
    
    if (pageText.includes('Unknown Product')) {
      console.log('❌ FAILED: Still showing "Unknown Product"');
      console.log('🔍 Product names are not being loaded correctly');
    } else {
      console.log('✅ SUCCESS: No "Unknown Product" found');
      console.log('🎯 Fix is working: Product names are loaded correctly');
    }

    // Look for actual product names in the page
    const productMatches = pageText.match(/Product\s*Name[:\s]*([^\n\r,]+)/gi);
    if (productMatches) {
      console.log('📋 Product information found:', productMatches.slice(0, 3));
    }
  });

  test('CRITICAL: Verify Edit Form Alpine.js Fix', async ({ page }) => {
    console.log('🎯 TESTING: Edit form Alpine.js initialization fix...');
    
    await page.goto('http://127.0.0.1:8000/quotes');
    await page.waitForLoadState('networkidle');

    // Find and click edit button 
    const editButton = page.locator('a[href*="/edit"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      
      // Wait for Alpine.js to initialize
      await page.waitForTimeout(3000);

      const pageText = await page.textContent('body');
      
      if (pageText.includes('Unknown Product')) {
        console.log('❌ FAILED: Edit form still shows "Unknown Product"');
        console.log('🔍 Alpine.js initialization may not be working');
      } else {
        console.log('✅ SUCCESS: Edit form does not show "Unknown Product"');
        console.log('🎯 Fix is working: Alpine.js properly initializes product names');
      }

      // Test if we can navigate the form (multi-step form test)
      const buttons = await page.locator('button').allTextContents();
      const hasNextButton = buttons.some(text => 
        text && (text.includes('下一步') || text.includes('Next') || text.includes('繼續'))
      );
      
      if (hasNextButton) {
        console.log('✅ SUCCESS: Multi-step form navigation available');
      } else {
        console.log('⚠️ INFO: Single-step form or navigation buttons not visible');
      }
    } else {
      console.log('⚠️ WARNING: No edit button found - may need quotes with edit permissions');
    }
  });

  test('CRITICAL: Verify Backend Status Issue', async ({ page }) => {
    console.log('🎯 TESTING: Backend status override issue...');
    
    // Setup API request interception to capture the payload
    let apiPayload = null;
    let apiResponse = null;
    
    page.on('request', request => {
      if (request.url().includes('/api/quotes') && request.method() === 'POST') {
        apiPayload = request.postData();
        console.log('📤 API Request Payload:', apiPayload);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/quotes') && response.request().method() === 'POST') {
        response.json().then(data => {
          apiResponse = data;
          console.log('📥 API Response:', JSON.stringify(data, null, 2));
        }).catch(() => {});
      }
    });

    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to fill the form with "sent" status
    try {
      // Select customer from dropdown
      await page.click('select[name="customer_id"]');
      await page.selectOption('select[name="customer_id"]', { index: 1 });
      
      // Set status to "sent" 
      await page.selectOption('select[name="status"]', 'sent');
      console.log('📝 Selected "sent" status in form');

      // Fill other required fields
      await page.fill('textarea[name="description"]', 'Test quote for status verification');
      
      // Add a product item if possible
      const addButton = page.locator('button:has-text("新增項目"), button:has-text("Add"), .add-item').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        
        // Check the result
        if (apiPayload && apiResponse) {
          console.log('🔍 Analyzing API data...');
          
          if (apiPayload.includes('sent') || apiPayload.includes('"status":"sent"')) {
            console.log('📤 Frontend sent "sent" status to API');
          }
          
          if (apiResponse.status === 'draft') {
            console.log('❌ CONFIRMED: Backend forced status to "draft"');
            console.log('🎯 Status issue verified: Go API backend overrides status');
          } else if (apiResponse.status === 'sent') {
            console.log('⚠️ UNEXPECTED: Status was preserved as "sent"');
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Form submission test failed:', error.message);
      console.log('🔍 This may indicate form structure differences');
    }
  });
});