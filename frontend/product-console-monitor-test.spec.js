import { test, expect } from '@playwright/test';

test.describe('產品選擇 Console 監控測試', () => {
  test('監控產品數據丟失問題修復效果', async ({ page }) => {
    // 監聽所有 console 訊息
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      
      // 即時輸出關鍵調試訊息
      if (text.includes('Selected product:') || 
          text.includes('Before update') || 
          text.includes('After update') || 
          text.includes('Product ID set to:') ||
          text.includes('草稿保存調試') ||
          text.includes('完整 formData:') ||
          text.includes('Items 詳細信息:')) {
        console.log(`🔍 [重要] ${text}`);
      }
    });

    // 監聽 JavaScript 錯誤
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.log(`❌ [JS ERROR] ${error.message}`);
    });

    try {
      console.log('🚀 導航到報價創建頁面...');
      await page.goto('/quotes/create', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      // 檢查是否需要登入
      if (page.url().includes('login')) {
        console.log('🔐 執行登入...');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        await page.goto('/quotes/create');
        await page.waitForTimeout(3000);
      }
      
      console.log('✅ 頁面載入完成');
      
      // 填寫基本資訊（確保表單有效）
      console.log('📝 填寫基本資訊...');
      const customerSelect = page.locator('#customer_id');
      if (await customerSelect.count() > 0) {
        await customerSelect.selectOption({ index: 1 });
        console.log('✅ 客戶已選擇');
      }
      
      // 根據截圖，產品輸入框的 placeholder 是「輸入產品名稱（可搜尋或手動輸入）」
      // 讓我找到正確的產品輸入框選擇器
      console.log('🔍 尋找產品輸入框...');
      
      let productInput = null;
      
      // 嘗試多種可能的選擇器
      const selectors = [
        'input[placeholder*="產品名稱"]',
        'input[placeholder*="可搜尋"]',
        'input[name*="product"]',
        'input[data-autocomplete="products"]',
        '.autocomplete-input',
        'input[type="text"]'
      ];
      
      for (const selector of selectors) {
        const input = page.locator(selector).first();
        if (await input.count() > 0) {
          const placeholder = await input.getAttribute('placeholder');
          console.log(`🔍 找到輸入框: ${selector} (placeholder: "${placeholder}")`);
          if (placeholder && (placeholder.includes('產品') || placeholder.includes('搜尋'))) {
            productInput = input;
            console.log(`✅ 確認產品輸入框: ${selector}`);
            break;
          }
        }
      }
      
      if (!productInput) {
        // 最後嘗試：查找所有文字輸入框
        const allTextInputs = page.locator('input[type="text"]');
        const count = await allTextInputs.count();
        console.log(`🔍 找到 ${count} 個文字輸入框，檢查每一個...`);
        
        for (let i = 0; i < count; i++) {
          const input = allTextInputs.nth(i);
          const placeholder = await input.getAttribute('placeholder');
          const name = await input.getAttribute('name');
          console.log(`  輸入框 ${i}: placeholder="${placeholder}", name="${name}"`);
          
          if (placeholder && placeholder.includes('產品')) {
            productInput = input;
            console.log(`✅ 通過 placeholder 找到產品輸入框`);
            break;
          }
        }
      }
      
      if (productInput) {
        console.log('\n🎯 開始測試產品自動完成功能...');
        
        // 清除之前的 console 記錄
        consoleMessages.length = 0;
        console.log('🔍 清除 console 記錄，準備監控產品選擇過程...');
        
        // 測試產品搜尋
        console.log('🔍 輸入搜尋關鍵字: "測試"');
        await productInput.click(); // 確保輸入框獲得焦點
        await productInput.fill('測試');
        await page.waitForTimeout(3000); // 等待搜尋結果
        
        // 檢查搜尋結果
        const resultSelectors = [
          '.autocomplete-results .autocomplete-item',
          '.autocomplete-dropdown .item',
          '.search-results .result-item',
          '.dropdown-menu .dropdown-item',
          '[role="listbox"] [role="option"]'
        ];
        
        let results = null;
        let resultsCount = 0;
        
        for (const resultSelector of resultSelectors) {
          results = page.locator(resultSelector);
          resultsCount = await results.count();
          if (resultsCount > 0) {
            console.log(`🎯 使用選擇器 "${resultSelector}" 找到 ${resultsCount} 個搜尋結果`);
            break;
          }
        }
        
        if (resultsCount === 0) {
          console.log('🔍 嘗試其他搜尋關鍵字...');
          await productInput.fill('laptop');
          await page.waitForTimeout(3000);
          
          // 再次檢查結果
          for (const resultSelector of resultSelectors) {
            results = page.locator(resultSelector);
            resultsCount = await results.count();
            if (resultsCount > 0) {
              console.log(`🎯 使用 "laptop" 找到 ${resultsCount} 個搜尋結果`);
              break;
            }
          }
        }
        
        if (resultsCount > 0) {
          console.log('🎯 選擇第一個搜尋結果...');
          await results.first().click();
          await page.waitForTimeout(4000); // 等待產品數據更新
          
          // 檢查產品選擇結果
          const selectedValue = await productInput.inputValue();
          console.log(`📦 選擇後的產品值: "${selectedValue}"`);
          
        } else {
          console.log('⚠️ 沒有找到搜尋結果，嘗試手動觸發事件...');
          
          // 手動輸入產品名稱並觸發 blur 事件
          await productInput.fill('測試產品');
          await page.keyboard.press('Tab'); // 觸發 blur 事件
          await page.waitForTimeout(2000);
        }
        
        console.log('\n💾 嘗試觸發草稿保存...');
        
        // 嘗試多種方式觸發草稿保存
        const triggerButtons = [
          'button:has-text("下一步")',
          'button:has-text("繼續")',
          'button:has-text("保存")',
          'button:has-text("暫存")',
          'button[type="button"]'
        ];
        
        let saveTriggered = false;
        for (const buttonSelector of triggerButtons) {
          const button = page.locator(buttonSelector);
          if (await button.count() > 0) {
            console.log(`🔘 點擊按鈕: ${buttonSelector}`);
            await button.first().click();
            await page.waitForTimeout(4000);
            saveTriggered = true;
            break;
          }
        }
        
        if (!saveTriggered) {
          console.log('🔘 嘗試按 Tab 鍵觸發保存...');
          await page.keyboard.press('Tab');
          await page.waitForTimeout(3000);
        }
        
      } else {
        console.log('❌ 無法找到產品輸入框');
      }
      
      // 分析 Console 訊息
      console.log('\n📋 完整的 Console 調試訊息 (最後 20 條):');
      const recentMessages = consoleMessages.slice(-20);
      recentMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
      
      // 關鍵調試訊息分析
      console.log('\n🔍 關鍵調試訊息分析:');
      const hasSelectedProduct = consoleMessages.some(msg => msg.includes('Selected product:'));
      const hasBeforeUpdate = consoleMessages.some(msg => msg.includes('Before update'));
      const hasAfterUpdate = consoleMessages.some(msg => msg.includes('After update'));
      const hasProductId = consoleMessages.some(msg => msg.includes('Product ID set to:'));
      const hasDraftSave = consoleMessages.some(msg => msg.includes('草稿保存調試'));
      const hasValidProductId = consoleMessages.some(msg => 
        msg.includes('Product ID set to:') && !msg.includes('null')
      );
      
      console.log(`  🔍 產品選擇事件: ${hasSelectedProduct ? '✅ 檢測到' : '❌ 未檢測到'}`);
      console.log(`  📝 更新前狀態記錄: ${hasBeforeUpdate ? '✅ 有記錄' : '❌ 無記錄'}`);
      console.log(`  ✨ 更新後狀態記錄: ${hasAfterUpdate ? '✅ 有記錄' : '❌ 無記錄'}`);
      console.log(`  🆔 產品ID設置記錄: ${hasProductId ? '✅ 有記錄' : '❌ 無記錄'}`);
      console.log(`  💾 草稿保存調試: ${hasDraftSave ? '✅ 有記錄' : '❌ 無記錄'}`);
      console.log(`  ✅ 產品ID有效性: ${hasValidProductId ? '✅ 修復成功' : '❌ 仍有問題或未觸發'}`);
      
      // JavaScript 錯誤報告
      if (jsErrors.length > 0) {
        console.log('\n❌ JavaScript 錯誤:');
        jsErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      } else {
        console.log('\n✅ 沒有 JavaScript 錯誤');
      }
      
      // 拍攝最終截圖
      await page.screenshot({
        path: 'product-console-monitor-final.png',
        fullPage: true
      });
      
      console.log('\n🎯 產品數據丟失問題監控測試完成！');
      console.log('📸 最終截圖: product-console-monitor-final.png');
      
    } catch (error) {
      console.error(`❌ 測試過程中出現錯誤: ${error.message}`);
      
      await page.screenshot({
        path: 'product-console-monitor-error.png',
        fullPage: true
      });
      
      console.log('\n📋 錯誤前的調試訊息:');
      consoleMessages.slice(-10).forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
      
      throw error;
    }
  });
});