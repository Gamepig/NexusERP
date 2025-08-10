import { test, expect } from '@playwright/test';

test.describe('產品數據問題快速驗證', () => {
  test('檢查產品選擇和數據傳遞', async ({ page }) => {
    // 監聽所有 console 訊息
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // 監聽 JavaScript 錯誤
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    try {
      console.log('🌐 訪問首頁...');
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // 檢查頁面是否正確載入
      await page.waitForTimeout(2000);
      const title = await page.title();
      console.log(`📄 頁面標題: ${title}`);
      
      // 嘗試找到登入表單
      const loginForm = page.locator('form').first();
      const hasLoginForm = await loginForm.count() > 0;
      console.log(`🔐 登入表單存在: ${hasLoginForm ? '✅' : '❌'}`);
      
      if (hasLoginForm) {
        // 檢查登入表單元素
        const emailInput = page.locator('input[name="email"], input[type="email"]');
        const passwordInput = page.locator('input[name="password"], input[type="password"]');
        
        const hasEmail = await emailInput.count() > 0;
        const hasPassword = await passwordInput.count() > 0;
        
        console.log(`📧 Email 輸入框: ${hasEmail ? '✅' : '❌'}`);
        console.log(`🔒 密碼輸入框: ${hasPassword ? '✅' : '❌'}`);
        
        if (hasEmail && hasPassword) {
          console.log('🔐 開始登入...');
          await emailInput.fill('test@example.com');
          await passwordInput.fill('password123');
          
          const submitButton = page.locator('button[type="submit"]');
          await submitButton.click();
          
          // 等待登入完成或錯誤
          await page.waitForTimeout(3000);
          
          const currentUrl = page.url();
          console.log(`🌐 當前 URL: ${currentUrl}`);
          
          // 如果成功登入，嘗試導航到報價頁面
          if (currentUrl.includes('dashboard') || !currentUrl.includes('login')) {
            console.log('✅ 登入成功！導航到報價創建頁面...');
            
            await page.goto('/quotes/create');
            await page.waitForTimeout(3000);
            
            // 檢查多步驟表單是否載入
            const formExists = await page.locator('form').count() > 0;
            console.log(`📋 報價表單存在: ${formExists ? '✅' : '❌'}`);
            
            if (formExists) {
              // 檢查產品自動完成輸入框
              const productInput = page.locator('input[data-autocomplete="products"]');
              const hasProductInput = await productInput.count() > 0;
              console.log(`🔍 產品搜尋輸入框: ${hasProductInput ? '✅' : '❌'}`);
              
              if (hasProductInput) {
                console.log('🔍 測試產品搜尋功能...');
                
                // 清除之前的 console 訊息
                consoleMessages.length = 0;
                
                // 輸入搜尋關鍵字
                await productInput.fill('測試');
                await page.waitForTimeout(2000);
                
                // 檢查搜尋結果
                const results = page.locator('.autocomplete-results .autocomplete-item');
                const resultsCount = await results.count();
                console.log(`🎯 搜尋結果數量: ${resultsCount}`);
                
                if (resultsCount > 0) {
                  console.log('🎯 選擇第一個搜尋結果...');
                  await results.first().click();
                  await page.waitForTimeout(2000);
                  
                  // 檢查產品數據是否正確填入
                  const productValue = await productInput.inputValue();
                  console.log(`📦 選擇的產品: ${productValue}`);
                  
                } else {
                  console.log('⚠️ 沒有搜尋結果，嘗試其他關鍵字...');
                  await productInput.fill('laptop');
                  await page.waitForTimeout(2000);
                  
                  const altResults = await page.locator('.autocomplete-results .autocomplete-item').count();
                  console.log(`🎯 替代搜尋結果數量: ${altResults}`);
                }
              }
            }
          } else {
            console.log('❌ 登入失敗或重定向錯誤');
          }
        }
      } else {
        console.log('❌ 未找到登入表單，可能已經登入或頁面結構不同');
      }
      
      // 輸出所有 Console 訊息
      console.log('\n📋 Console 訊息記錄:');
      consoleMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
      
      // 輸出 JavaScript 錯誤
      if (jsErrors.length > 0) {
        console.log('\n❌ JavaScript 錯誤:');
        jsErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      } else {
        console.log('\n✅ 沒有 JavaScript 錯誤');
      }
      
      // 拍攝最終狀態截圖
      await page.screenshot({
        path: 'simple-product-test-final.png',
        fullPage: true
      });
      
      console.log('\n🎯 測試完成！截圖已保存: simple-product-test-final.png');
      
    } catch (error) {
      console.error(`❌ 測試過程中出現錯誤: ${error.message}`);
      
      // 在錯誤時也拍攝截圖
      await page.screenshot({
        path: 'simple-product-test-error.png',
        fullPage: true
      });
      
      // 仍然輸出收集到的訊息
      console.log('\n📋 錯誤前的 Console 訊息:');
      consoleMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    }
  });
});