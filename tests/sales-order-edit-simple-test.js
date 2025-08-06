/**
 * Simple Sales Order Edit Page Verification Test
 * 簡單的銷售訂單編輯頁面驗證測試
 * 
 * This test verifies:
 * 1. Customer name display fix
 * 2. Multiple product items display fix
 * 3. Console error monitoring
 */

import { chromium } from 'playwright';

async function runSalesOrderEditTest() {
  console.log('🚀 啟動銷售訂單編輯頁面測試...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // Monitor console messages and errors
  const consoleMessages = [];
  const jsErrors = [];
  
  page.on('console', msg => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleMessages.push(message);
    console.log(`[Console ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log(`[JS ERROR] ${error.message}`);
  });
  
  try {
    console.log('\n📝 步驟 1: 導航到登入頁面');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    
    console.log('\n🔐 步驟 2: 執行登入');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/02-after-login.png', fullPage: true });
    
    console.log('\n🌐 步驟 3: 導航到銷售訂單編輯頁面');
    const editUrl = 'http://127.0.0.1:8000/orders/sales/7246/edit';
    console.log(`前往: ${editUrl}`);
    
    await page.goto(editUrl);
    await page.waitForTimeout(8000); // Wait for AJAX requests to complete
    await page.screenshot({ path: 'screenshots/03-edit-page-loaded.png', fullPage: true });
    
    console.log('\n👤 步驟 4: 檢查客戶名稱顯示修復');
    
    // Find customer dropdown
    const customerSelectors = [
      'select[name="customer_id"]',
      'select[name*="customer"]',
      '#customer_id',
      '.customer-select'
    ];
    
    let customerDropdown = null;
    let customerSelectorUsed = '';
    
    for (const selector of customerSelectors) {
      try {
        const element = page.locator(selector);
        const count = await element.count();
        if (count > 0) {
          customerDropdown = element;
          customerSelectorUsed = selector;
          console.log(`✅ 找到客戶下拉選單: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (customerDropdown) {
      const selectedValue = await customerDropdown.inputValue();
      const selectedText = await customerDropdown.locator('option:checked').textContent();
      
      console.log(`客戶選擇狀態:`);
      console.log(`- 選中值: "${selectedValue}"`);
      console.log(`- 顯示文字: "${selectedText}"`);
      
      const isPlaceholder = selectedText && (
        selectedText.includes('請選擇客戶') ||
        selectedText.includes('Select Customer') ||
        selectedText.trim() === ''
      );
      
      const hasValidSelection = selectedValue && selectedValue !== '' && selectedValue !== '0';
      
      if (hasValidSelection && !isPlaceholder) {
        console.log('✅ 客戶名稱顯示修復成功: 顯示實際客戶名稱');
      } else {
        console.log('❌ 客戶名稱顯示仍有問題: 顯示占位符或無選擇');
      }
      
      // Get all customer options
      const allOptions = await page.locator(`${customerSelectorUsed} option`).allTextContents();
      console.log(`可用客戶選項: ${JSON.stringify(allOptions.slice(0, 5))}...`);
      
    } else {
      console.log('❌ 未找到客戶下拉選單');
    }
    
    await page.screenshot({ path: 'screenshots/04-customer-check.png', fullPage: true });
    
    console.log('\n🛒 步驟 5: 檢查多個產品項目顯示修復');
    
    // Find all product dropdowns
    const productSelects = page.locator('select[name*="product"]');
    const productCount = await productSelects.count();
    
    console.log(`發現產品選擇器數量: ${productCount}`);
    
    if (productCount > 0) {
      let validProducts = 0;
      let invalidProducts = 0;
      
      for (let i = 0; i < productCount; i++) {
        const productSelect = productSelects.nth(i);
        const selectedValue = await productSelect.inputValue();
        const selectedText = await productSelect.locator('option:checked').textContent();
        
        const isValid = selectedValue && selectedValue !== '' && selectedValue !== '0';
        const showsPlaceholder = selectedText && (
          selectedText.includes('請選擇產品') ||
          selectedText.includes('Select Product') ||
          selectedText.trim() === ''
        );
        
        console.log(`產品項目 ${i + 1}:`);
        console.log(`- 值: "${selectedValue}"`);
        console.log(`- 文字: "${selectedText}"`);
        console.log(`- 狀態: ${isValid && !showsPlaceholder ? '✅ 有效' : '❌ 無效'}`);
        
        if (isValid && !showsPlaceholder) {
          validProducts++;
        } else {
          invalidProducts++;
        }
      }
      
      console.log(`\n產品項目檢查總結:`);
      console.log(`- 總項目: ${productCount}`);
      console.log(`- 有效產品: ${validProducts}`);
      console.log(`- 無效產品: ${invalidProducts}`);
      
      if (validProducts === productCount && productCount > 0) {
        console.log('✅ 多產品項目顯示修復成功: 所有項目都顯示正確產品名稱');
      } else {
        console.log('❌ 多產品項目顯示仍有問題: 部分項目未正確顯示');
      }
      
    } else {
      console.log('❌ 未找到任何產品選擇器');
    }
    
    await page.screenshot({ path: 'screenshots/05-products-check.png', fullPage: true });
    
    console.log('\n🔢 步驟 6: 檢查數量和價格欄位');
    
    // Check quantity fields
    const quantityInputs = page.locator('input[name*="quantity"]');
    const quantityCount = await quantityInputs.count();
    console.log(`數量欄位數量: ${quantityCount}`);
    
    for (let i = 0; i < Math.min(quantityCount, 5); i++) {
      const qtyInput = quantityInputs.nth(i);
      const qtyValue = await qtyInput.inputValue();
      console.log(`數量 ${i + 1}: "${qtyValue}"`);
    }
    
    // Check price fields
    const priceInputs = page.locator('input[name*="price"], input[name*="unit_price"]');
    const priceCount = await priceInputs.count();
    console.log(`價格欄位數量: ${priceCount}`);
    
    for (let i = 0; i < Math.min(priceCount, 5); i++) {
      const priceInput = priceInputs.nth(i);
      const priceValue = await priceInput.inputValue();
      console.log(`價格 ${i + 1}: "${priceValue}"`);
    }
    
    await page.screenshot({ path: 'screenshots/06-quantities-prices.png', fullPage: true });
    
    console.log('\n🧮 步驟 7: 檢查計算欄位');
    
    // Check calculation fields
    const calculationFields = {
      subtotal: 'input[name*="subtotal"], #subtotalAmount',
      tax: 'input[name*="tax"], #taxAmount', 
      total: 'input[name*="total"], #totalAmount'
    };
    
    for (const [fieldName, selector] of Object.entries(calculationFields)) {
      try {
        const field = page.locator(selector);
        const count = await field.count();
        if (count > 0) {
          const value = await field.first().inputValue();
          console.log(`${fieldName}: "${value}"`);
        } else {
          console.log(`${fieldName}: 未找到欄位`);
        }
      } catch (e) {
        console.log(`${fieldName}: 檢查失敗`);
      }
    }
    
    await page.screenshot({ path: 'screenshots/07-calculations.png', fullPage: true });
    
    console.log('\n🐛 步驟 8: 錯誤和控制台分析');
    
    console.log(`JavaScript 錯誤數量: ${jsErrors.length}`);
    if (jsErrors.length > 0) {
      jsErrors.forEach((error, index) => {
        console.log(`JS錯誤 ${index + 1}: ${error.message}`);
      });
    }
    
    // Filter important console messages
    const importantMessages = consoleMessages.filter(msg => 
      msg.text.includes('error') || 
      msg.text.includes('warning') ||
      msg.text.includes('customer') ||
      msg.text.includes('product') ||
      msg.text.includes('failed') ||
      msg.text.includes('success')
    );
    
    console.log(`重要控制台訊息數量: ${importantMessages.length}`);
    importantMessages.slice(0, 10).forEach((msg, index) => {
      console.log(`控制台 ${index + 1}: [${msg.type}] ${msg.text}`);
    });
    
    await page.screenshot({ path: 'screenshots/08-final-state.png', fullPage: true });
    
    console.log('\n📊 步驟 9: 測試結果總結');
    
    const testResults = {
      pageLoaded: true,
      customerDropdownFound: customerDropdown !== null,
      productSelectorsFound: productCount > 0,
      jsErrorsCount: jsErrors.length,
      consoleMessagesCount: consoleMessages.length
    };
    
    console.log('測試結果:');
    Object.entries(testResults).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });
    
    if (testResults.customerDropdownFound && testResults.productSelectorsFound && testResults.jsErrorsCount === 0) {
      console.log('✅ 整體測試: 成功 - 頁面載入正常，找到關鍵元素，無JavaScript錯誤');
    } else {
      console.log('⚠️ 整體測試: 部分成功 - 可能仍有問題需要解決');
    }
    
    console.log('\n🎯 測試完成! 檢查 screenshots/ 目錄查看截圖');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
runSalesOrderEditTest().catch(console.error);