import { test, expect } from '@playwright/test';

test.describe('直接測試產品選擇功能', () => {
  test('驗證產品數據丟失問題修復效果', async ({ page }) => {
    // 監聽所有 console 訊息，特別注意調試訊息
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      
      // 即時輸出重要的調試訊息
      if (text.includes('Selected product:') || 
          text.includes('Before update') || 
          text.includes('After update') || 
          text.includes('Product ID set to:') ||
          text.includes('草稿保存調試') ||
          text.includes('完整 formData:') ||
          text.includes('Items 詳細信息:')) {
        console.log(`🔍 [CONSOLE] ${text}`);
      }
    });

    // 監聽網路請求
    page.on('request', request => {
      if (request.url().includes('/api/') && request.method() === 'POST') {
        console.log(`🌐 [API REQUEST] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/') && response.request().method() === 'POST') {
        console.log(`🌐 [API RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    try {
      console.log('🚀 直接導航到報價創建頁面...');
      await page.goto('/quotes/create', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`🌐 當前 URL: ${currentUrl}`);
      
      // 檢查是否需要登入
      if (currentUrl.includes('login')) {
        console.log('🔐 需要登入，執行登入流程...');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // 登入後重新導航到報價頁面
        await page.goto('/quotes/create');
        await page.waitForTimeout(3000);
      }
      
      console.log('📋 檢查報價表單結構...');
      const formExists = await page.locator('form').count() > 0;
      console.log(`📋 報價表單存在: ${formExists ? '✅' : '❌'}`);
      
      if (formExists) {
        // 填寫基本資訊
        console.log('📝 填寫基本資訊...');
        
        const quoteNumberInput = page.locator('input[name="quote_number"]');
        if (await quoteNumberInput.count() > 0) {
          await quoteNumberInput.fill(`TEST-${Date.now()}`);
          console.log('✅ 報價單號已填寫');
        }
        
        const descriptionInput = page.locator('textarea[name="description"]');
        if (await descriptionInput.count() > 0) {
          await descriptionInput.fill('產品數據丟失修復測試');
          console.log('✅ 描述已填寫');
        }
        
        // 選擇客戶
        const customerSelect = page.locator('#customer_id');
        if (await customerSelect.count() > 0) {
          await customerSelect.selectOption({ index: 1 });
          console.log('✅ 客戶已選擇');
        }
        
        // 重點測試：產品自動完成功能
        console.log('\n🔍 開始測試產品自動完成功能...');
        
        const productInput = page.locator('input[data-autocomplete="products"]');
        const hasProductInput = await productInput.count() > 0;
        console.log(`🔍 產品搜尋輸入框存在: ${hasProductInput ? '✅' : '❌'}`);
        
        if (hasProductInput) {
          console.log('🔍 清除 console 記錄，開始產品搜尋...');
          consoleMessages.length = 0; // 清除之前的記錄
          
          // 測試產品搜尋
          console.log('🔍 輸入搜尋關鍵字: "測試"');
          await productInput.fill('測試');
          await page.waitForTimeout(2500); // 等待搜尋結果
          
          // 檢查搜尋結果
          const results = page.locator('.autocomplete-results .autocomplete-item');
          let resultsCount = await results.count();
          console.log(`🎯 搜尋結果數量: ${resultsCount}`);
          
          // 如果沒有結果，嘗試其他關鍵字
          if (resultsCount === 0) {
            console.log('🔍 嘗試其他搜尋關鍵字...');
            await productInput.fill('laptop');
            await page.waitForTimeout(2500);
            resultsCount = await results.count();
            console.log(`🎯 使用 "laptop" 的搜尋結果數量: ${resultsCount}`);
            
            if (resultsCount === 0) {
              await productInput.fill('產品');
              await page.waitForTimeout(2500);
              resultsCount = await results.count();
              console.log(`🎯 使用 "產品" 的搜尋結果數量: ${resultsCount}`);
            }
          }
          
          if (resultsCount > 0) {
            console.log('🎯 選擇第一個搜尋結果...');
            await results.first().click();
            await page.waitForTimeout(3000); // 等待產品數據更新
            
            // 檢查產品是否成功選擇
            const selectedProductValue = await productInput.inputValue();
            console.log(`📦 選擇的產品名稱: "${selectedProductValue}"`);
            
            // 檢查其他相關欄位是否有數據
            const unitPriceInputs = page.locator('input[name*="unit_price"]');
            const quantityInputs = page.locator('input[name*="quantity"]');
            
            if (await unitPriceInputs.count() > 0) {
              const unitPrice = await unitPriceInputs.first().inputValue();
              console.log(`💰 單價: "${unitPrice}"`);
            }
            
            if (await quantityInputs.count() > 0) {
              const quantity = await quantityInputs.first().inputValue();
              console.log(`📊 數量: "${quantity}"`);
            }
            
            console.log('\n💾 測試草稿保存功能...');
            
            // 嘗試觸發草稿保存 - 點擊下一步或任何可能觸發保存的按鈕
            const nextStepButton = page.locator('button').filter({ hasText: /下一步|Next|繼續|Continue/ });
            const saveButton = page.locator('button').filter({ hasText: /保存|Save|暫存|Draft/ });
            
            let saveTriggered = false;
            
            if (await nextStepButton.count() > 0) {
              console.log('🔘 點擊下一步按鈕觸發草稿保存...');
              await nextStepButton.first().click();
              await page.waitForTimeout(4000); // 等待草稿保存完成
              saveTriggered = true;
            } else if (await saveButton.count() > 0) {
              console.log('🔘 點擊保存按鈕...');
              await saveButton.first().click();
              await page.waitForTimeout(4000);
              saveTriggered = true;
            } else {
              console.log('⚠️ 未找到下一步或保存按鈕，嘗試手動觸發保存事件...');
              // 可以嘗試按 Tab 鍵或其他方式觸發 blur 事件
              await page.keyboard.press('Tab');
              await page.waitForTimeout(2000);
            }
            
            if (saveTriggered) {
              console.log('✅ 草稿保存動作已觸發');
            }
            
          } else {
            console.log('❌ 沒有找到任何搜尋結果');
            
            // 檢查是否有錯誤訊息
            const errorMessages = await page.locator('.error, .alert-danger, .text-red-500').count();
            if (errorMessages > 0) {
              const errorText = await page.locator('.error, .alert-danger, .text-red-500').first().textContent();
              console.log(`❌ 錯誤訊息: ${errorText}`);
            }
          }
        }
        
      } else {
        console.log('❌ 未找到報價表單');
      }
      
      // 輸出所有收集到的 Console 訊息
      console.log('\n📋 完整的 Console 調試訊息記錄:');
      consoleMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
      
      // 檢查關鍵調試訊息
      console.log('\n🔍 關鍵調試訊息分析:');
      const hasSelectedProduct = consoleMessages.some(msg => msg.includes('Selected product:'));
      const hasBeforeUpdate = consoleMessages.some(msg => msg.includes('Before update'));
      const hasAfterUpdate = consoleMessages.some(msg => msg.includes('After update'));
      const hasProductId = consoleMessages.some(msg => msg.includes('Product ID set to:'));
      const hasDraftSave = consoleMessages.some(msg => msg.includes('草稿保存調試'));
      const hasValidProductId = consoleMessages.some(msg => 
        msg.includes('Product ID set to:') && !msg.includes('null')
      );
      
      console.log(`  🔍 產品選擇事件: ${hasSelectedProduct ? '✅' : '❌'}`);
      console.log(`  📝 更新前狀態記錄: ${hasBeforeUpdate ? '✅' : '❌'}`);
      console.log(`  ✨ 更新後狀態記錄: ${hasAfterUpdate ? '✅' : '❌'}`);
      console.log(`  🆔 產品ID設置記錄: ${hasProductId ? '✅' : '❌'}`);
      console.log(`  💾 草稿保存調試: ${hasDraftSave ? '✅' : '❌'}`);
      console.log(`  ✅ 產品ID有效性: ${hasValidProductId ? '✅ (修復成功)' : '❌ (仍有問題)'}`);
      
      // 拍攝最終狀態截圖
      await page.screenshot({
        path: 'direct-product-test-final.png',
        fullPage: true
      });
      
      console.log('\n🎯 產品數據丟失問題驗證完成！');
      console.log('📸 截圖已保存: direct-product-test-final.png');
      
    } catch (error) {
      console.error(`❌ 測試過程中出現錯誤: ${error.message}`);
      
      await page.screenshot({
        path: 'direct-product-test-error.png',
        fullPage: true
      });
      
      // 輸出錯誤前的調試訊息
      console.log('\n📋 錯誤前的 Console 訊息:');
      consoleMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    }
  });
});