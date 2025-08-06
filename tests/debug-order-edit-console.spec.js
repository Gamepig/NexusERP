import { test, expect } from '@playwright/test';

test.describe('Order Edit Console Debug Test', () => {
  test('Debug order edit page console logs for items 0 and 1 issues', async ({ page }) => {
    // Array to store all console messages
    const consoleMessages = [];
    
    // Enhanced console listener that captures all types of console output
    page.on('console', async (msg) => {
      const timestamp = new Date().toISOString();
      const type = msg.type();
      const text = msg.text();
      
      // Store the message
      consoleMessages.push({
        timestamp,
        type,
        text
      });
      
      // Log important messages immediately
      if (
        text.includes('訂單項目數據:') ||
        text.includes('設定項目數據:') ||
        text.includes('檢查產品選項 - ID:') ||
        text.includes('產品選項不存在，手動添加:') ||
        text.includes('所有項目數據') ||
        text.includes('警告') ||
        text.includes('錯誤') ||
        text.includes('Error') ||
        text.includes('Warning') ||
        type === 'error' ||
        type === 'warning'
      ) {
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${text}`);
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      console.log(`[PAGE ERROR] ${error.message}`);
      consoleMessages.push({
        timestamp: new Date().toISOString(),
        type: 'pageerror',
        text: error.message
      });
    });

    // Step 1: Navigate to login page
    console.log('=== Step 1: Navigating to login page ===');
    await page.goto('http://127.0.0.1:8000/login', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for login form to be visible
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    // Step 2: Login with test credentials
    console.log('=== Step 2: Logging in ===');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for successful login (redirect to dashboard or any authenticated page)
    await page.waitForURL(/127\.0\.0\.1:8000(?!\/login)/, { timeout: 15000 });
    console.log('Login successful');
    
    // Step 3: Navigate to the specific order edit page
    console.log('=== Step 3: Navigating to order edit page ===');
    await page.goto('http://127.0.0.1:8000/orders/sales/7246/edit', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Step 4: Wait for page to load and monitor console activity
    console.log('=== Step 4: Waiting for page load and console activity ===');
    
    // Wait for the main content to be visible
    await page.waitForSelector('.container, .main-content, [data-order-id], .order-edit', { 
      timeout: 15000,
      state: 'visible'
    });
    
    // Wait for any Vue.js or JavaScript initialization
    await page.waitForTimeout(2000);
    
    // Check for loading indicators and wait for them to disappear
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '.fa-spinner',
      '[data-loading]',
      '.overlay'
    ];
    
    for (const selector of loadingSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000, state: 'hidden' });
        console.log(`Loading indicator ${selector} disappeared`);
      } catch (e) {
        // Loading indicator might not exist, which is fine
      }
    }
    
    // Wait for any dynamic content to load
    await page.waitForLoadState('networkidle');
    
    // Additional wait for staggered loading and async operations
    console.log('Waiting for staggered loading to complete...');
    await page.waitForTimeout(5000);
    
    // Try to trigger any lazy-loaded content by scrolling
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);
    
    // Look for product dropdowns or selects that might need time to populate
    const productSelectors = [
      'select[name*="product"]',
      '.product-select',
      '[data-product-select]',
      '.order-item select',
      '.item-row select'
    ];
    
    for (const selector of productSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`Found product selector: ${selector}`);
        
        // Wait for options to be populated
        await page.waitForFunction(
          (sel) => {
            const select = document.querySelector(sel);
            return select && select.options.length > 1;
          },
          selector,
          { timeout: 5000 }
        );
        console.log(`Product selector ${selector} populated with options`);
      } catch (e) {
        console.log(`Product selector ${selector} not found or not populated`);
      }
    }
    
    // Final wait to ensure all async operations are complete
    console.log('Final wait for all operations to complete...');
    await page.waitForTimeout(3000);
    
    // Step 5: Capture page state and trigger any remaining console output
    console.log('=== Step 5: Capturing final state ===');
    
    // Get page title and URL to confirm we're on the right page
    const pageTitle = await page.title();
    const currentUrl = page.url();
    console.log(`Page Title: ${pageTitle}`);
    console.log(`Current URL: ${currentUrl}`);
    
    // Try to interact with elements that might trigger more console output
    try {
      // Click on any product dropdowns to trigger console logs
      const productDropdowns = await page.$$('select[name*="product"]');
      for (let i = 0; i < productDropdowns.length && i < 4; i++) {
        console.log(`Clicking product dropdown ${i}...`);
        await productDropdowns[i].click();
        await page.waitForTimeout(500);
        await productDropdowns[i].blur();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('Could not interact with product dropdowns:', e.message);
    }
    
    // Final wait to capture any delayed console output
    await page.waitForTimeout(2000);
    
    console.log('=== Console Log Analysis ===');
    console.log(`Total console messages captured: ${consoleMessages.length}`);
    
    // Filter and analyze important messages
    const orderItemsData = consoleMessages.filter(msg => msg.text.includes('訂單項目數據:'));
    const itemDataSetup = consoleMessages.filter(msg => msg.text.includes('設定項目數據:'));
    const productOptionChecks = consoleMessages.filter(msg => msg.text.includes('檢查產品選項 - ID:'));
    const manuallyAdded = consoleMessages.filter(msg => msg.text.includes('產品選項不存在，手動添加:'));
    const allItemsData = consoleMessages.filter(msg => msg.text.includes('所有項目數據'));
    const warnings = consoleMessages.filter(msg => 
      msg.type === 'warning' || 
      msg.text.includes('警告') || 
      msg.text.includes('Warning')
    );
    const errors = consoleMessages.filter(msg => 
      msg.type === 'error' || 
      msg.text.includes('錯誤') || 
      msg.text.includes('Error')
    );
    
    // Detailed analysis output
    console.log('\n=== DETAILED CONSOLE LOG ANALYSIS ===');
    
    console.log('\n📊 ORDER ITEMS DATA:');
    orderItemsData.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.timestamp}] ${msg.text}`);
    });
    
    console.log('\n🔧 ITEM DATA SETUP:');
    itemDataSetup.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.timestamp}] ${msg.text}`);
    });
    
    console.log('\n🔍 PRODUCT OPTION CHECKS:');
    productOptionChecks.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.timestamp}] ${msg.text}`);
    });
    
    console.log('\n➕ MANUALLY ADDED PRODUCTS:');
    manuallyAdded.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.timestamp}] ${msg.text}`);
    });
    
    console.log('\n📋 ALL ITEMS DATA OUTPUT:');
    allItemsData.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.timestamp}] ${msg.text}`);
    });
    
    console.log('\n⚠️ WARNINGS:');
    warnings.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.timestamp}] [${msg.type}] ${msg.text}`);
    });
    
    console.log('\n❌ ERRORS:');
    errors.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.timestamp}] [${msg.type}] ${msg.text}`);
    });
    
    console.log('\n=== FULL CONSOLE LOG (Chronological) ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.timestamp}] [${msg.type}] ${msg.text}`);
    });
    
    // Analysis and recommendations
    console.log('\n=== 🕵️ DEBUGGING ANALYSIS ===');
    
    if (orderItemsData.length === 0) {
      console.log('❌ No "訂單項目數據:" messages found - JavaScript might not be loading');
    } else {
      console.log(`✅ Found ${orderItemsData.length} order items data message(s)`);
    }
    
    if (itemDataSetup.length < 4) {
      console.log(`⚠️ Only found ${itemDataSetup.length} "設定項目數據:" messages, expected 4`);
    } else {
      console.log(`✅ Found all 4 "設定項目數據:" messages`);
    }
    
    if (manuallyAdded.length > 0) {
      console.log(`🔧 Found ${manuallyAdded.length} products that were manually added to dropdowns`);
    }
    
    if (errors.length > 0) {
      console.log(`❌ Found ${errors.length} error(s) that might be causing issues`);
    }
    
    if (warnings.length > 0) {
      console.log(`⚠️ Found ${warnings.length} warning(s) that might indicate issues`);
    }
    
    // Pattern analysis for items 0 and 1
    console.log('\n=== 🎯 ITEMS 0 & 1 SPECIFIC ANALYSIS ===');
    const item0Messages = consoleMessages.filter(msg => 
      msg.text.includes('項目 0') || 
      msg.text.includes('Item 0') ||
      msg.text.includes('index: 0')
    );
    
    const item1Messages = consoleMessages.filter(msg => 
      msg.text.includes('項目 1') || 
      msg.text.includes('Item 1') ||
      msg.text.includes('index: 1')
    );
    
    console.log('\n📝 Item 0 Related Messages:');
    item0Messages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.timestamp}] ${msg.text}`);
    });
    
    console.log('\n📝 Item 1 Related Messages:');
    item1Messages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.timestamp}] ${msg.text}`);
    });
    
    // Verify the test ran successfully
    expect(consoleMessages.length).toBeGreaterThan(0);
    console.log('\n✅ Test completed successfully');
  });
});