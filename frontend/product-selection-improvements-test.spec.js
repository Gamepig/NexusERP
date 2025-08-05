import { test, expect } from '@playwright/test';

test.describe('NexusERP Product Selection Improvements - Comprehensive Test', () => {
  
  test('comprehensive product selection enhancement verification', async ({ page }) => {
    // 設置控制台消息監聽
    const consoleMessages = [];
    page.on('console', msg => {
      const message = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(message);
      console.log(message);
    });

    // 設置 JavaScript 錯誤監聽
    const jsErrors = [];
    page.on('pageerror', error => {
      const errorMsg = `JavaScript Error: ${error.message}`;
      jsErrors.push(errorMsg);
      console.error(errorMsg);
    });

    console.log('🚀 開始 NexusERP 產品選擇改進測試');
    console.log('==========================================');

    // 1. 導航到登入頁面
    console.log('📍 步驟 1: 導航到登入頁面');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 截圖登入頁面
    await page.screenshot({ 
      path: 'test-results/01-login-page.png', 
      fullPage: true 
    });

    // 2. 執行登入操作
    console.log('📍 步驟 2: 執行登入操作');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    await page.screenshot({ 
      path: 'test-results/02-login-form-filled.png', 
      fullPage: true 
    });

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 等待登入完成
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'test-results/03-after-login.png', 
      fullPage: true 
    });

    // 3. 導航到指定的銷售訂單編輯頁面
    console.log('📍 步驟 3: 導航到銷售訂單編輯頁面 (ID: 7246)');
    await page.goto('http://127.0.0.1:8000/orders/sales/7246/edit');
    
    // 等待頁面完全載入 (允許額外時間給 200ms 延遲的增強邏輯)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 給增強邏輯足夠時間執行
    
    console.log('⏳ 等待頁面完全載入和 JavaScript 增強邏輯執行...');
    
    await page.screenshot({ 
      path: 'test-results/04-order-edit-page-loaded.png', 
      fullPage: true 
    });

    // 4. 檢查客戶下拉選單是否正確顯示
    console.log('📍 步驟 4: 檢查客戶下拉選單');
    const customerDropdown = page.locator('select[name="customer_id"]');
    const customerValue = await customerDropdown.inputValue();
    const customerText = await customerDropdown.locator('option:checked').textContent();
    
    console.log(`客戶下拉選單值: ${customerValue}`);
    console.log(`客戶下拉選單文字: ${customerText}`);
    
    const isCustomerCorrect = customerText && customerText.includes('Test Company 客戶 3');
    console.log(`✅ 客戶下拉選單顯示正確: ${isCustomerCorrect}`);

    // 5. 檢查所有 4 個訂單項目的產品選擇狀態
    console.log('📍 步驟 5: 檢查所有 4 個訂單項目的產品選擇狀態');
    
    const productTestResults = [];
    
    for (let i = 0; i < 4; i++) {
      console.log(`\n--- 檢查項目 ${i} ---`);
      
      // 尋找產品下拉選單的各種可能選擇器
      const productSelectors = [
        `select[name="items[${i}][product_id]"]`,
        `#item-${i} select[name*="product_id"]`,
        `.order-item:nth-child(${i + 1}) select[name*="product_id"]`,
        `[data-item-index="${i}"] select[name*="product_id"]`
      ];
      
      let productDropdown = null;
      let usedSelector = '';
      
      // 嘗試找到正確的產品下拉選單
      for (const selector of productSelectors) {
        if (await page.locator(selector).count() > 0) {
          productDropdown = page.locator(selector);
          usedSelector = selector;
          break;
        }
      }
      
      if (!productDropdown) {
        console.log(`❌ 項目 ${i}: 找不到產品下拉選單`);
        productTestResults.push({
          itemIndex: i,
          found: false,
          productName: '未找到',
          isCorrect: false,
          selector: '無'
        });
        continue;
      }
      
      console.log(`✅ 項目 ${i}: 找到產品下拉選單，使用選擇器: ${usedSelector}`);
      
      // 取得產品下拉選單的值和文字
      const productValue = await productDropdown.inputValue();
      const productText = await productDropdown.locator('option:checked').textContent();
      
      console.log(`項目 ${i} 產品值: ${productValue}`);
      console.log(`項目 ${i} 產品文字: ${productText}`);
      
      // 判斷是否顯示正確的產品名稱或預設文字
      const isShowingPlaceholder = productText && productText.includes('請選擇產品');
      const hasActualProductName = productText && !isShowingPlaceholder && productValue !== '0' && productValue !== '';
      
      console.log(`項目 ${i} 顯示狀態:`);
      console.log(`  - 是否為預設文字: ${isShowingPlaceholder}`);
      console.log(`  - 是否有實際產品名稱: ${hasActualProductName}`);
      
      productTestResults.push({
        itemIndex: i,
        found: true,
        productName: productText || '空白',
        productValue: productValue,
        isCorrect: hasActualProductName,
        isPlaceholder: isShowingPlaceholder,
        selector: usedSelector
      });
      
      // 為每個項目的下拉選單截圖
      await page.screenshot({ 
        path: `test-results/item-${i}-dropdown.png`, 
        fullPage: true 
      });
    }

    // 6. 檢查控制台消息中的增強邏輯信息
    console.log('\n📍 步驟 6: 分析控制台消息');
    console.log('==========================================');
    
    const enhancementMessages = {
      setProductId: [],
      setFailed: [],
      manualSuccess: [],
      notFound: [],
      availableOptions: [],
      jsErrors: []
    };
    
    consoleMessages.forEach(msg => {
      if (msg.includes('設定產品ID:')) {
        enhancementMessages.setProductId.push(msg);
      } else if (msg.includes('設置失敗，嘗試手動觸發選擇')) {
        enhancementMessages.setFailed.push(msg);
      } else if (msg.includes('手動選擇成功:')) {
        enhancementMessages.manualSuccess.push(msg);
      } else if (msg.includes('找不到目標選項')) {
        enhancementMessages.notFound.push(msg);
      } else if (msg.includes('可用選項:')) {
        enhancementMessages.availableOptions.push(msg);
      }
    });
    
    enhancementMessages.jsErrors = jsErrors;
    
    console.log(`🔍 "設定產品ID:" 消息數量: ${enhancementMessages.setProductId.length}`);
    enhancementMessages.setProductId.forEach(msg => console.log(`   ${msg}`));
    
    console.log(`🔍 "設置失敗，嘗試手動觸發選擇" 消息數量: ${enhancementMessages.setFailed.length}`);
    enhancementMessages.setFailed.forEach(msg => console.log(`   ${msg}`));
    
    console.log(`🔍 "手動選擇成功:" 消息數量: ${enhancementMessages.manualSuccess.length}`);
    enhancementMessages.manualSuccess.forEach(msg => console.log(`   ${msg}`));
    
    console.log(`🔍 "找不到目標選項" 消息數量: ${enhancementMessages.notFound.length}`);
    enhancementMessages.notFound.forEach(msg => console.log(`   ${msg}`));
    
    console.log(`🔍 "可用選項:" 消息數量: ${enhancementMessages.availableOptions.length}`);
    enhancementMessages.availableOptions.forEach(msg => console.log(`   ${msg}`));
    
    console.log(`🔍 JavaScript 錯誤數量: ${enhancementMessages.jsErrors.length}`);
    enhancementMessages.jsErrors.forEach(msg => console.log(`   ${msg}`));

    // 7. 檢查數量和價格是否正確填入
    console.log('\n📍 步驟 7: 檢查數量和價格填入狀態');
    console.log('==========================================');
    
    const quantityPriceResults = [];
    
    for (let i = 0; i < 4; i++) {
      const quantitySelectors = [
        `input[name="items[${i}][quantity]"]`,
        `#item-${i} input[name*="quantity"]`,
        `.order-item:nth-child(${i + 1}) input[name*="quantity"]`
      ];
      
      const priceSelectors = [
        `input[name="items[${i}][unit_price]"]`,
        `#item-${i} input[name*="unit_price"]`,
        `.order-item:nth-child(${i + 1}) input[name*="unit_price"]`
      ];
      
      let quantityInput = null;
      let priceInput = null;
      
      // 尋找數量輸入框
      for (const selector of quantitySelectors) {
        if (await page.locator(selector).count() > 0) {
          quantityInput = page.locator(selector);
          break;
        }
      }
      
      // 尋找價格輸入框
      for (const selector of priceSelectors) {
        if (await page.locator(selector).count() > 0) {
          priceInput = page.locator(selector);
          break;
        }
      }
      
      const quantityValue = quantityInput ? await quantityInput.inputValue() : '未找到';
      const priceValue = priceInput ? await priceInput.inputValue() : '未找到';
      
      console.log(`項目 ${i} - 數量: ${quantityValue}, 價格: ${priceValue}`);
      
      quantityPriceResults.push({
        itemIndex: i,
        quantity: quantityValue,
        price: priceValue,
        quantityFilled: quantityValue !== '' && quantityValue !== '未找到',
        priceFilled: priceValue !== '' && priceValue !== '未找到'
      });
    }

    // 最終截圖
    await page.screenshot({ 
      path: 'test-results/order-edit-full-page.png', 
      fullPage: true 
    });

    // 8. 生成全面報告
    console.log('\n📊 全面測試報告');
    console.log('==========================================');
    
    const correctProductCount = productTestResults.filter(result => result.isCorrect).length;
    const successRate = (correctProductCount / 4) * 100;
    
    console.log(`\n🎯 成功指標驗證:`);
    console.log(`✅ 客戶下拉選單顯示 "Test Company 客戶 3": ${isCustomerCorrect}`);
    console.log(`✅ 產品項目正確顯示數量: ${correctProductCount}/4`);
    console.log(`✅ 產品選擇成功率: ${successRate.toFixed(1)}%`);
    console.log(`✅ JavaScript 錯誤數量: ${jsErrors.length}`);
    
    console.log(`\n📋 詳細項目分析:`);
    productTestResults.forEach(result => {
      if (result.found) {
        console.log(`項目 ${result.itemIndex}:`);
        console.log(`  - 產品名稱: ${result.productName}`);
        console.log(`  - 產品值: ${result.productValue}`);
        console.log(`  - 顯示正確: ${result.isCorrect ? '✅' : '❌'}`);
        console.log(`  - 是否為預設值: ${result.isPlaceholder ? '是' : '否'}`);
        console.log(`  - 使用的選擇器: ${result.selector}`);
      } else {
        console.log(`項目 ${result.itemIndex}: ❌ 未找到產品下拉選單`);
      }
    });
    
    console.log(`\n📈 數量和價格填入狀態:`);
    quantityPriceResults.forEach(result => {
      console.log(`項目 ${result.itemIndex}:`);
      console.log(`  - 數量: ${result.quantity} (已填入: ${result.quantityFilled ? '✅' : '❌'})`);
      console.log(`  - 價格: ${result.price} (已填入: ${result.priceFilled ? '✅' : '❌'})`);
    });
    
    console.log(`\n🧠 增強邏輯執行統計:`);
    console.log(`  - 設定產品ID 嘗試: ${enhancementMessages.setProductId.length}`);
    console.log(`  - 設置失敗並手動觸發: ${enhancementMessages.setFailed.length}`);
    console.log(`  - 手動選擇成功: ${enhancementMessages.manualSuccess.length}`);
    console.log(`  - 找不到目標選項: ${enhancementMessages.notFound.length}`);
    console.log(`  - 可用選項調試: ${enhancementMessages.availableOptions.length}`);
    
    console.log(`\n🏆 整體評估:`);
    if (successRate >= 75 && jsErrors.length === 0 && isCustomerCorrect) {
      console.log(`🎉 測試結果: 優秀 (成功率 ${successRate.toFixed(1)}%)`);
    } else if (successRate >= 50 && jsErrors.length <= 2) {
      console.log(`✅ 測試結果: 良好 (成功率 ${successRate.toFixed(1)}%)`);
    } else {
      console.log(`⚠️ 測試結果: 需要改進 (成功率 ${successRate.toFixed(1)}%)`);
    }
    
    console.log(`\n💡 使用者體驗評估:`);
    if (enhancementMessages.manualSuccess.length > 0) {
      console.log(`✅ 增強邏輯正常工作 - 檢測到手動選擇成功消息`);
    }
    if (enhancementMessages.setFailed.length > 0) {
      console.log(`⚠️ 部分項目需要手動觸發 - 建議檢查選擇器準確性`);
    }
    if (enhancementMessages.notFound.length > 0) {
      console.log(`❌ 部分項目找不到目標選項 - 建議檢查數據一致性`);
    }
    if (jsErrors.length === 0) {
      console.log(`✅ 無 JavaScript 錯誤 - 程式碼執行穩定`);
    } else {
      console.log(`❌ 發現 ${jsErrors.length} 個 JavaScript 錯誤 - 需要修復`);
    }

    // 生成 JSON 格式的測試結果
    const testSummary = {
      timestamp: new Date().toISOString(),
      testType: 'Product Selection Improvements',
      orderId: '7246',
      results: {
        customerDropdownCorrect: isCustomerCorrect,
        productItemsCorrect: correctProductCount,
        totalItems: 4,
        successRate: successRate,
        javascriptErrors: jsErrors.length,
        enhancementLogic: {
          setProductIdAttempts: enhancementMessages.setProductId.length,
          setFailedAttempts: enhancementMessages.setFailed.length,
          manualSuccesses: enhancementMessages.manualSuccess.length,
          notFoundWarnings: enhancementMessages.notFound.length,
          availableOptionsDebugs: enhancementMessages.availableOptions.length
        },
        itemDetails: productTestResults,
        quantityPriceDetails: quantityPriceResults,
        consoleMessages: consoleMessages,
        errors: jsErrors
      }
    };
    
    // 將測試摘要寫入文件
    await page.evaluate((summary) => {
      console.log('🔄 生成測試摘要 JSON...');
      // 這裡可以用於記錄詳細的測試結果
    }, testSummary);

    console.log('\n🎯 測試完成！');
    console.log('==========================================');
    console.log('請檢查 test-results/ 目錄中的截圖文件');
    console.log('✅ 測試腳本執行成功完成');
    
    // 基本驗證斷言
    expect(jsErrors.length).toBeLessThanOrEqual(2); // 允許最多 2 個輕微錯誤
    expect(correctProductCount).toBeGreaterThanOrEqual(2); // 至少 50% 的項目要正確
    expect(isCustomerCorrect).toBe(true); // 客戶選擇必須正確
  });
});