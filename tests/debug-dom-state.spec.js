import { test, expect } from '@playwright/test';

test.describe('Order Edit DOM State Debug Test', () => {
  test('Debug DOM state vs JavaScript state for items 0 and 1', async ({ page }) => {
    // Array to store all console messages
    const consoleMessages = [];
    
    // Enhanced console listener
    page.on('console', async (msg) => {
      const timestamp = new Date().toISOString();
      const type = msg.type();
      const text = msg.text();
      
      consoleMessages.push({ timestamp, type, text });
      
      // Log important messages immediately
      if (
        text.includes('訂單項目數據:') ||
        text.includes('設定項目數據:') ||
        text.includes('檢查產品選項 - ID:') ||
        text.includes('產品選項不存在，手動添加:') ||
        text.includes('所有項目數據') ||
        type === 'error' ||
        type === 'warning'
      ) {
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${text}`);
      }
    });

    // Step 1: Navigate and login
    console.log('=== Step 1: Login ===');
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/127\.0\.0\.1:8000(?!\/login)/, { timeout: 15000 });

    // Step 2: Navigate to order edit page
    console.log('=== Step 2: Navigate to order edit page ===');
    await page.goto('http://127.0.0.1:8000/orders/sales/7246/edit', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Step 3: Wait for page load
    await page.waitForSelector('.container, .main-content, [data-order-id], .order-edit', { 
      timeout: 15000,
      state: 'visible'
    });
    
    // Wait for JavaScript initialization
    await page.waitForTimeout(5000);

    console.log('=== Step 3: Capturing DOM State ===');
    
    // Capture all product dropdowns
    const productSelects = await page.$$('select[name*="product"]');
    console.log(`Found ${productSelects.length} product select elements`);

    // Analyze each dropdown
    for (let i = 0; i < productSelects.length; i++) {
      console.log(`\n📋 ANALYZING ITEM ${i}:`);
      
      try {
        // Get the select element
        const select = productSelects[i];
        
        // Get current selected value
        const selectedValue = await select.evaluate(el => el.value);
        const selectedText = await select.evaluate(el => el.options[el.selectedIndex]?.text || 'No selection');
        
        // Get all options
        const options = await select.evaluate(el => {
          return Array.from(el.options).map(option => ({
            value: option.value,
            text: option.text,
            selected: option.selected
          }));
        });
        
        // Get visual properties
        const isVisible = await select.isVisible();
        const isEnabled = await select.isEnabled();
        const boundingBox = await select.boundingBox();
        
        // Check parent container
        const parentInfo = await select.evaluate(el => {
          const parent = el.closest('.item-row, .order-item, tr, div');
          return {
            className: parent?.className || 'no-parent',
            style: parent?.style.cssText || 'no-style',
            hidden: parent?.hidden || false
          };
        });
        
        console.log(`   Current Value: "${selectedValue}"`);
        console.log(`   Selected Text: "${selectedText}"`);
        console.log(`   Total Options: ${options.length}`);
        console.log(`   Visible: ${isVisible}`);
        console.log(`   Enabled: ${isEnabled}`);
        console.log(`   Position: ${boundingBox ? `${boundingBox.x},${boundingBox.y} (${boundingBox.width}x${boundingBox.height})` : 'not positioned'}`);
        console.log(`   Parent Class: ${parentInfo.className}`);
        console.log(`   Parent Style: ${parentInfo.style || 'none'}`);
        console.log(`   Parent Hidden: ${parentInfo.hidden}`);
        
        // Find options with actual product data
        const productOptions = options.filter(opt => opt.value && opt.value !== '' && !isNaN(opt.value));
        console.log(`   Product Options: ${productOptions.length}`);
        
        if (productOptions.length > 0) {
          console.log(`   First 3 Products:`);
          productOptions.slice(0, 3).forEach((opt, idx) => {
            console.log(`     ${idx + 1}. Value: ${opt.value}, Text: "${opt.text}", Selected: ${opt.selected}`);
          });
        }
        
        // Check if this item should be selected based on console logs
        const expectedValues = [843, 856, 832, 833]; // From console logs
        const expectedValue = expectedValues[i];
        if (expectedValue) {
          const shouldBeSelected = selectedValue == expectedValue;
          console.log(`   Expected Value: ${expectedValue}`);
          console.log(`   Matches Expected: ${shouldBeSelected ? '✅ YES' : '❌ NO'}`);
          
          if (!shouldBeSelected) {
            console.log(`   🚨 MISMATCH DETECTED for Item ${i}!`);
            
            // Try to find the expected option
            const expectedOption = options.find(opt => opt.value == expectedValue);
            if (expectedOption) {
              console.log(`   Expected Option Found: "${expectedOption.text}"`);
              console.log(`   Expected Option Selected: ${expectedOption.selected}`);
            } else {
              console.log(`   ❌ Expected Option NOT FOUND in dropdown!`);
            }
          }
        }
        
        // Screenshot of this specific dropdown
        await select.screenshot({ path: `test-results/item-${i}-dropdown.png` });
        console.log(`   Screenshot saved: item-${i}-dropdown.png`);
        
      } catch (error) {
        console.log(`   ❌ Error analyzing item ${i}: ${error.message}`);
      }
    }

    // Step 4: Test interactions
    console.log('\n=== Step 4: Testing Interactions ===');
    
    for (let i = 0; i < Math.min(productSelects.length, 4); i++) {
      console.log(`\n🔄 Testing interactions on Item ${i}:`);
      
      try {
        const select = productSelects[i];
        
        // Try to click and interact
        await select.click();
        await page.waitForTimeout(500);
        
        // Get state after click
        const valueAfterClick = await select.evaluate(el => el.value);
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        
        console.log(`   Value after click: "${valueAfterClick}"`);
        console.log(`   Focused element: ${focusedElement}`);
        
        // Try to select the first available product option
        const firstProductOption = await select.evaluate(el => {
          const options = Array.from(el.options);
          const productOption = options.find(opt => opt.value && opt.value !== '' && !isNaN(opt.value));
          return productOption ? productOption.value : null;
        });
        
        if (firstProductOption) {
          console.log(`   Trying to select option: ${firstProductOption}`);
          await select.selectOption(firstProductOption);
          await page.waitForTimeout(500);
          
          const newValue = await select.evaluate(el => el.value);
          console.log(`   Value after selection: "${newValue}"`);
          console.log(`   Selection successful: ${newValue == firstProductOption ? '✅ YES' : '❌ NO'}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Interaction error on item ${i}: ${error.message}`);
      }
    }

    // Step 5: Final state capture
    console.log('\n=== Step 5: Final State Summary ===');
    
    // Take full page screenshot
    await page.screenshot({ path: 'test-results/order-edit-full-page.png', fullPage: true });
    console.log('Full page screenshot saved: order-edit-full-page.png');
    
    // Get final console messages related to our debugging
    const debugMessages = consoleMessages.filter(msg => 
      msg.text.includes('設定項目數據:') || 
      msg.text.includes('檢查產品選項') ||
      msg.text.includes('訂單項目數據:')
    );
    
    console.log('\n📊 Console Debug Messages:');
    debugMessages.forEach((msg, idx) => {
      console.log(`${idx + 1}. [${msg.timestamp}] ${msg.text}`);
    });

    // Summary
    console.log('\n🏁 DEBUGGING SUMMARY:');
    console.log('This test captured:');
    console.log('- DOM state of all product dropdowns');
    console.log('- Visual rendering information');
    console.log('- Interaction capabilities');
    console.log('- Screenshots for visual analysis');
    console.log('- Console logs for data flow verification');
    
    expect(productSelects.length).toBeGreaterThan(0);
  });
});