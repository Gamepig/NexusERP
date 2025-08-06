/**
 * Robust Sales Order Edit Page Verification Test
 * 穩健的銷售訂單編輯頁面驗證測試
 * 
 * This test verifies:
 * 1. Customer name display fix
 * 2. Multiple product items display fix
 * 3. Console error monitoring
 * 4. Field population accuracy
 */

import { chromium } from 'playwright';

async function safeGetValue(element, getter, defaultValue = '') {
  try {
    const result = await element[getter]();
    return result || defaultValue;
  } catch (error) {
    console.log(`⚠️ 無法獲取值 (${getter}): ${error.message}`);
    return defaultValue;
  }
}

async function safeGetText(locator, defaultValue = '') {
  try {
    const result = await locator.textContent({ timeout: 5000 });
    return result || defaultValue;
  } catch (error) {
    console.log(`⚠️ 無法獲取文字: ${error.message}`);
    return defaultValue;
  }
}

async function runRobustSalesOrderEditTest() {
  console.log('🚀 啟動穩健的銷售訂單編輯頁面測試...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500,
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
    
    // Filter important messages
    if (msg.type() === 'error' || msg.text().includes('error') || 
        msg.text().includes('customer') || msg.text().includes('product') ||
        msg.text().includes('設定') || msg.text().includes('populateServerData')) {
      console.log(`[Console ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
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
    console.log('等待頁面載入和AJAX請求完成...');
    await page.waitForTimeout(10000); 
    await page.screenshot({ path: 'screenshots/03-edit-page-loaded.png', fullPage: true });
    
    console.log('\n👤 步驟 4: 檢查客戶名稱顯示修復');
    
    // Find customer dropdown with robust error handling
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
      // Get customer dropdown information with timeout handling
      const selectedValue = await safeGetValue(customerDropdown, 'inputValue', '');
      
      // Try different approaches to get selected text
      let selectedText = '';
      try {
        // Method 1: Get checked option text
        const checkedOption = customerDropdown.locator('option:checked');
        selectedText = await safeGetText(checkedOption, '');
      } catch (e1) {
        try {
          // Method 2: Get selected option by value
          if (selectedValue) {
            const selectedOption = customerDropdown.locator(`option[value="${selectedValue}"]`);
            selectedText = await safeGetText(selectedOption, '');
          }
        } catch (e2) {
          console.log('⚠️ 無法獲取選中的客戶文字');
        }
      }
      
      console.log(`客戶選擇狀態:`);
      console.log(`- 選中值: "${selectedValue}"`);
      console.log(`- 顯示文字: "${selectedText}"`);
      
      const isPlaceholder = selectedText && (
        selectedText.includes('請選擇客戶') ||
        selectedText.includes('Select Customer') ||
        selectedText.trim() === '' ||
        selectedText.includes('選擇')
      );
      
      const hasValidSelection = selectedValue && selectedValue !== '' && selectedValue !== '0';
      
      if (hasValidSelection && !isPlaceholder && selectedText) {
        console.log('✅ 客戶名稱顯示修復成功: 顯示實際客戶名稱');
        console.log(`   實際客戶: "${selectedText}"`);
      } else if (hasValidSelection && !selectedText) {
        console.log('⚠️ 客戶名稱顯示部分成功: 有選中值但無法獲取顯示文字');
        console.log(`   客戶ID: ${selectedValue}`);
      } else {
        console.log('❌ 客戶名稱顯示仍有問題: 顯示占位符或無選擇');
      }
      
      // Get all customer options (limit to first 10 to avoid timeout)
      try {
        const allOptions = await page.locator(`${customerSelectorUsed} option`).allTextContents();
        console.log(`可用客戶選項 (前5個): ${JSON.stringify(allOptions.slice(0, 5))}`);
        console.log(`總客戶選項數量: ${allOptions.length}`);
      } catch (e) {
        console.log('⚠️ 無法獲取客戶選項列表');
      }
      
    } else {
      console.log('❌ 未找到客戶下拉選單');
    }
    
    await page.screenshot({ path: 'screenshots/04-customer-check.png', fullPage: true });
    
    console.log('\n🛒 步驟 5: 檢查多個產品項目顯示修復');
    
    let productCount = 0;
    let productSelects = null;
    
    // Try different selectors to find product dropdowns
    const productSelectors = [
      'select[name*="product"]',
      'select[name*="product_id"]',
      '.product-select',
      'select.form-select[name*="product"]'
    ];
    
    for (const selector of productSelectors) {
      try {
        productSelects = page.locator(selector);
        productCount = await productSelects.count();
        if (productCount > 0) {
          console.log(`✅ 找到產品選擇器: ${selector} (數量: ${productCount})`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    console.log(`發現產品選擇器數量: ${productCount}`);
    
    if (productCount > 0 && productSelects) {
      let validProducts = 0;
      let invalidProducts = 0;
      const productDetails = [];
      
      for (let i = 0; i < productCount; i++) {
        console.log(`\n分析產品項目 ${i + 1}:`);
        
        try {
          const productSelect = productSelects.nth(i);
          const selectedValue = await safeGetValue(productSelect, 'inputValue', '');
          
          let selectedText = '';
          try {
            const checkedOption = productSelect.locator('option:checked');
            selectedText = await safeGetText(checkedOption, '');
          } catch (e) {
            if (selectedValue) {
              try {
                const selectedOption = productSelect.locator(`option[value="${selectedValue}"]`);
                selectedText = await safeGetText(selectedOption, '');
              } catch (e2) {
                console.log(`   ⚠️ 無法獲取產品文字`);
              }
            }
          }
          
          const isValid = selectedValue && selectedValue !== '' && selectedValue !== '0';
          const showsPlaceholder = selectedText && (
            selectedText.includes('請選擇產品') ||
            selectedText.includes('Select Product') ||
            selectedText.trim() === '' ||
            selectedText.includes('選擇')
          );
          
          console.log(`   - 值: "${selectedValue}"`);
          console.log(`   - 文字: "${selectedText}"`);
          console.log(`   - 狀態: ${isValid && !showsPlaceholder && selectedText ? '✅ 有效' : '❌ 無效'}`);
          
          if (isValid && !showsPlaceholder && selectedText) {
            validProducts++;
          } else {
            invalidProducts++;
          }
          
          productDetails.push({
            index: i,
            value: selectedValue,
            text: selectedText,
            isValid: isValid,
            showsPlaceholder: showsPlaceholder
          });
          
        } catch (error) {
          console.log(`   ❌ 檢查產品項目 ${i + 1} 時發生錯誤: ${error.message}`);
          invalidProducts++;
        }
      }
      
      console.log(`\n產品項目檢查總結:`);
      console.log(`- 總項目: ${productCount}`);
      console.log(`- 有效產品: ${validProducts}`);
      console.log(`- 無效產品: ${invalidProducts}`);
      
      if (validProducts > 0) {
        const successRate = (validProducts / productCount * 100).toFixed(1);
        console.log(`✅ 多產品項目顯示修復狀況: ${successRate}% 成功率`);
        
        if (validProducts === productCount) {
          console.log('🎉 完美! 所有產品項目都正確顯示產品名稱');
        } else {
          console.log('⚠️ 部分成功: 大部分產品項目正確顯示，但仍有改進空間');
        }
      } else {
        console.log('❌ 多產品項目顯示修復失敗: 沒有項目正確顯示產品名稱');
      }
      
    } else {
      console.log('❌ 未找到任何產品選擇器');
    }
    
    await page.screenshot({ path: 'screenshots/05-products-check.png', fullPage: true });
    
    console.log('\n🔢 步驟 6: 檢查數量和價格欄位');
    
    // Check quantity fields
    try {
      const quantityInputs = page.locator('input[name*="quantity"]');
      const quantityCount = await quantityInputs.count();
      console.log(`數量欄位數量: ${quantityCount}`);
      
      for (let i = 0; i < Math.min(quantityCount, 5); i++) {
        const qtyInput = quantityInputs.nth(i);
        const qtyValue = await safeGetValue(qtyInput, 'inputValue', '');
        console.log(`數量 ${i + 1}: "${qtyValue}"`);
      }
    } catch (e) {
      console.log('⚠️ 檢查數量欄位時發生錯誤');
    }
    
    // Check price fields
    try {
      const priceInputs = page.locator('input[name*="price"], input[name*="unit_price"]');
      const priceCount = await priceInputs.count();
      console.log(`價格欄位數量: ${priceCount}`);
      
      for (let i = 0; i < Math.min(priceCount, 5); i++) {
        const priceInput = priceInputs.nth(i);
        const priceValue = await safeGetValue(priceInput, 'inputValue', '');
        console.log(`價格 ${i + 1}: "${priceValue}"`);
      }
    } catch (e) {
      console.log('⚠️ 檢查價格欄位時發生錯誤');
    }
    
    await page.screenshot({ path: 'screenshots/06-quantities-prices.png', fullPage: true });
    
    console.log('\n🧮 步驟 7: 檢查計算欄位');
    
    // Check calculation fields
    const calculationFields = {
      subtotal: ['input[name*="subtotal"]', '#subtotalAmount', '.subtotal-input'],
      tax: ['input[name*="tax"]', '#taxAmount', '.tax-input'], 
      total: ['input[name*="total"]', '#totalAmount', '.total-input']
    };
    
    for (const [fieldName, selectors] of Object.entries(calculationFields)) {
      let found = false;
      for (const selector of selectors) {
        try {
          const field = page.locator(selector);
          const count = await field.count();
          if (count > 0) {
            const value = await safeGetValue(field.first(), 'inputValue', '');
            console.log(`${fieldName}: "${value}"`);
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      if (!found) {
        console.log(`${fieldName}: 未找到欄位`);
      }
    }
    
    await page.screenshot({ path: 'screenshots/07-calculations.png', fullPage: true });
    
    console.log('\n🐛 步驟 8: 錯誤和控制台分析');
    
    console.log(`JavaScript 錯誤數量: ${jsErrors.length}`);
    if (jsErrors.length > 0) {
      jsErrors.forEach((error, index) => {
        console.log(`JS錯誤 ${index + 1}: ${error.message}`);
      });
    } else {
      console.log('✅ 沒有發現JavaScript錯誤');
    }
    
    // Analyze important console messages
    const customerMessages = consoleMessages.filter(msg => 
      msg.text.includes('customer') || msg.text.includes('客戶')
    );
    
    const productMessages = consoleMessages.filter(msg => 
      msg.text.includes('product') || msg.text.includes('產品') || msg.text.includes('設定產品')
    );
    
    const populateMessages = consoleMessages.filter(msg => 
      msg.text.includes('populateServerData') || msg.text.includes('銷售訂單數據')
    );
    
    console.log(`\n重要控制台訊息分析:`);
    console.log(`- 客戶相關訊息: ${customerMessages.length}`);
    console.log(`- 產品相關訊息: ${productMessages.length}`);
    console.log(`- 數據填充訊息: ${populateMessages.length}`);
    
    // Show key messages
    if (populateMessages.length > 0) {
      console.log('\n數據填充相關訊息:');
      populateMessages.slice(0, 5).forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg.text}`);
      });
    }
    
    if (productMessages.length > 0) {
      console.log('\n產品相關訊息:');
      productMessages.slice(0, 5).forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg.text}`);
      });
    }
    
    await page.screenshot({ path: 'screenshots/08-final-state.png', fullPage: true });
    
    console.log('\n📊 步驟 9: 測試結果總結');
    
    const testResults = {
      pageLoaded: true,
      customerDropdownFound: customerSelectors.some(s => {
        try {
          return page.locator(s).count() > 0;
        } catch {
          return false;
        }
      }),
      productSelectorsFound: productCount > 0,
      jsErrorsCount: jsErrors.length,
      consoleMessagesCount: consoleMessages.length,
      dataPopulationDetected: populateMessages.length > 0
    };
    
    console.log('\n🎯 測試總結報告:');
    console.log('===============================================');
    console.log(`✅ 頁面載入: ${testResults.pageLoaded ? '成功' : '失敗'}`);
    console.log(`✅ 客戶下拉選單: ${testResults.customerDropdownFound ? '找到' : '未找到'}`);
    console.log(`✅ 產品選擇器: ${testResults.productSelectorsFound ? `找到 ${productCount} 個` : '未找到'}`);
    console.log(`✅ JavaScript錯誤: ${testResults.jsErrorsCount === 0 ? '無錯誤' : `${testResults.jsErrorsCount} 個錯誤`}`);
    console.log(`✅ 數據填充: ${testResults.dataPopulationDetected ? '偵測到數據填充' : '未偵測到數據填充'}`);
    
    const overallSuccess = testResults.pageLoaded && 
                          testResults.customerDropdownFound && 
                          testResults.productSelectorsFound && 
                          testResults.jsErrorsCount === 0;
    
    if (overallSuccess) {
      console.log('\n🎉 整體測試結果: ✅ 成功');
      console.log('   - 頁面正常載入');
      console.log('   - 找到所有關鍵表單元素');
      console.log('   - 無JavaScript錯誤');
      console.log('   - 修復狀況良好');
    } else {
      console.log('\n⚠️ 整體測試結果: 部分成功');
      console.log('   可能的問題:');
      if (!testResults.customerDropdownFound) console.log('   - 客戶下拉選單問題');
      if (!testResults.productSelectorsFound) console.log('   - 產品選擇器問題');
      if (testResults.jsErrorsCount > 0) console.log('   - JavaScript錯誤');
    }
    
    console.log('\n📸 截圖已保存到 screenshots/ 目錄');
    console.log('🔍 檢查截圖以查看詳細的視覺化結果');
    
  } catch (error) {
    console.error('\n❌ 測試過程中發生嚴重錯誤:', error.message);
    await page.screenshot({ path: 'screenshots/critical-error-state.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ 測試完成，瀏覽器已關閉');
  }
}

// Run the test
runRobustSalesOrderEditTest().catch(console.error);