import { test, expect } from '@playwright/test';

test.describe('報價表單產品自動完成功能詳細測試', () => {
  test('詳細測試報價表單產品自動完成功能', async ({ page }) => {
    console.log('=== 開始詳細測試報價表單產品自動完成功能 ===');

    // 設置控制台監聽器
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ JavaScript 錯誤:', msg.text());
      } else if (msg.type() === 'warning') {
        console.log('⚠️ JavaScript 警告:', msg.text());
      } else if (msg.type() === 'log') {
        console.log('📝 JavaScript 日誌:', msg.text());
      }
    });

    // 設置網路監聽器
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('🔗 API 請求:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('📡 API 回應:', response.status(), response.url());
        if (response.status() >= 400) {
          console.log('❌ API 錯誤回應:', response.statusText());
        }
      }
    });

    try {
      // 步驟 1: 導航到首頁
      console.log('\n--- 步驟 1: 導航到首頁 ---');
      await page.goto('http://127.0.0.1:8000');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'quotes-detailed-01-homepage.png', fullPage: true });

      // 步驟 2: 檢查是否需要登入
      console.log('\n--- 步驟 2: 檢查登入狀態 ---');
      const loginButton = page.locator('a[href*="login"], .login-btn, button:has-text("登入")');
      const isLoginButtonVisible = await loginButton.isVisible().catch(() => false);
      
      if (isLoginButtonVisible) {
        console.log('需要登入，點擊登入按鈕');
        await loginButton.click();
        await page.waitForLoadState('networkidle');
      } else {
        console.log('嘗試直接導航到登入頁面');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
      }

      await page.screenshot({ path: 'quotes-detailed-02-login-page.png', fullPage: true });

      // 步驟 3: 執行登入
      console.log('\n--- 步驟 3: 執行登入流程 ---');
      
      // 等待登入表單元素
      await page.waitForSelector('input[name="email"], input[type="email"]');
      await page.waitForSelector('input[name="password"], input[type="password"]');
      
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"], input[type="password"]', 'password123');
      
      await page.screenshot({ path: 'quotes-detailed-03-login-filled.png', fullPage: true });
      
      await page.click('button[type="submit"], input[type="submit"], .login-submit');
      
      // 等待登入完成 - 可能會重定向到 dashboard
      await page.waitForLoadState('networkidle');
      console.log('登入完成，當前 URL:', page.url());
      
      await page.screenshot({ path: 'quotes-detailed-04-after-login.png', fullPage: true });

      // 步驟 4: 導航到報價建立頁面
      console.log('\n--- 步驟 4: 導航到報價建立頁面 ---');
      
      // 嘗試多種方式導航到報價頁面
      try {
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
        console.log('直接導航到報價建立頁面成功');
      } catch (error) {
        console.log('直接導航失敗，嘗試通過選單導航');
        
        // 尋找報價相關的選單項目
        const quoteMenuSelectors = [
          'a[href*="quotes"]',
          'nav a:has-text("報價")',
          'a:has-text("報價單")',
          '.sidebar a:has-text("報價")',
          '.navigation a:has-text("報價")'
        ];
        
        let quoteLinkFound = false;
        for (const selector of quoteMenuSelectors) {
          const link = page.locator(selector).first();
          if (await link.isVisible()) {
            await link.click();
            await page.waitForLoadState('networkidle');
            quoteLinkFound = true;
            console.log('通過選單導航到報價頁面成功');
            break;
          }
        }
        
        if (!quoteLinkFound) {
          console.log('無法找到報價選單，嘗試手動導航');
          await page.goto('http://127.0.0.1:8000/quotes/create');
          await page.waitForLoadState('networkidle');
        }
      }

      await page.screenshot({ path: 'quotes-detailed-05-quotes-page.png', fullPage: true });

      // 步驟 5: 分析報價表單頁面
      console.log('\n--- 步驟 5: 分析報價表單頁面 ---');
      
      const currentUrl = page.url();
      console.log('當前頁面 URL:', currentUrl);
      
      const pageTitle = await page.title();
      console.log('頁面標題:', pageTitle);
      
      // 檢查頁面內容
      const bodyText = await page.textContent('body');
      console.log('頁面包含關鍵字:');
      console.log('- "報價":', bodyText.includes('報價'));
      console.log('- "產品":', bodyText.includes('產品'));
      console.log('- "客戶":', bodyText.includes('客戶'));
      console.log('- "建立":', bodyText.includes('建立'));

      // 檢查是否有錯誤訊息
      const errorMessages = await page.locator('.error, .alert-danger, .text-red-500, .bg-red-50').allTextContents();
      if (errorMessages.length > 0) {
        console.log('❌ 發現錯誤訊息:', errorMessages);
      }

      // 步驟 6: 尋找並測試產品搜尋輸入框
      console.log('\n--- 步驟 6: 測試產品搜尋輸入框 ---');
      
      // 尋找產品輸入框的多種可能選擇器
      const productInputSelectors = [
        '.product-search-input',
        'input[name*="items"][name*="name"]',
        'input[placeholder*="產品"]',
        'input[placeholder*="搜尋產品"]',
        'input[placeholder*="product"]',
        '.item-row input[type="text"]',
        '#itemsList input[type="text"]'
      ];

      let productInput = null;
      let foundSelector = '';

      for (const selector of productInputSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            productInput = element;
            foundSelector = selector;
            console.log(`✅ 找到產品輸入框: ${selector}`);
            break;
          }
        } catch (e) {
          // 繼續嘗試下一個選擇器
        }
      }

      if (!productInput) {
        console.log('❌ 未找到產品輸入框，列出所有可見的輸入框:');
        const allInputs = await page.locator('input[type="text"], input:not([type])').all();
        for (let i = 0; i < allInputs.length; i++) {
          const input = allInputs[i];
          const isVisible = await input.isVisible();
          if (isVisible) {
            const name = await input.getAttribute('name') || '';
            const placeholder = await input.getAttribute('placeholder') || '';
            const id = await input.getAttribute('id') || '';
            const className = await input.getAttribute('class') || '';
            console.log(`  輸入框 ${i}: name="${name}", placeholder="${placeholder}", id="${id}", class="${className}"`);
          }
        }
        
        // 如果還是找不到，嘗試使用第一個可見的文字輸入框
        const firstTextInput = page.locator('input[type="text"], input:not([type])').first();
        if (await firstTextInput.isVisible()) {
          productInput = firstTextInput;
          foundSelector = '第一個文字輸入框';
          console.log('🔄 使用第一個可見的文字輸入框作為產品輸入框');
        }
      }

      if (productInput) {
        // 聚焦輸入框
        await productInput.focus();
        console.log('✅ 產品輸入框已聚焦');
        
        await page.screenshot({ path: 'quotes-detailed-06-input-focused.png', fullPage: true });

        // 步驟 7: 測試產品搜尋功能
        console.log('\n--- 步驟 7: 測試產品搜尋功能 ---');
        
        const searchTerms = ['產品', 'test', 'A', '電腦', 'laptop'];
        
        for (const term of searchTerms) {
          console.log(`\n🔍 測試搜尋關鍵字: "${term}"`);
          
          // 清空並輸入搜尋關鍵字
          await productInput.clear();
          await productInput.fill(term);
          
          // 等待搜尋請求和結果
          await page.waitForTimeout(1500);
          
          await page.screenshot({ 
            path: `quotes-detailed-07-search-${term.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
            fullPage: true 
          });

          // 檢查是否出現下拉選單
          const dropdownSelectors = [
            '.product-autocomplete-dropdown',
            '.dropdown',
            '.autocomplete-dropdown',
            '.search-dropdown',
            '.suggestions',
            '.autocomplete-results',
            'ul[role="listbox"]',
            '.product-list',
            '.search-results'
          ];

          let dropdownFound = false;
          let dropdownContent = [];

          for (const selector of dropdownSelectors) {
            try {
              const dropdown = page.locator(selector);
              if (await dropdown.isVisible({ timeout: 500 })) {
                console.log(`✅ 找到下拉選單: ${selector}`);
                dropdownFound = true;
                
                // 獲取下拉選單內容
                const items = await dropdown.locator('div, li, .item, .option').all();
                console.log(`   下拉選單項目數量: ${items.length}`);
                
                for (let i = 0; i < Math.min(items.length, 3); i++) {
                  const itemText = await items[i].textContent();
                  console.log(`   項目 ${i + 1}: ${itemText?.trim().substring(0, 100)}`);
                  dropdownContent.push(itemText?.trim());
                }
                
                // 嘗試點擊第一個項目
                if (items.length > 0) {
                  console.log('   嘗試點擊第一個項目...');
                  try {
                    await items[0].click();
                    await page.waitForTimeout(500);
                    console.log('   ✅ 成功點擊第一個項目');
                    
                    // 檢查輸入框是否被填入
                    const inputValue = await productInput.inputValue();
                    console.log(`   輸入框新值: "${inputValue}"`);
                    
                    await page.screenshot({ 
                      path: `quotes-detailed-08-selected-${term.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
                      fullPage: true 
                    });
                  } catch (clickError) {
                    console.log('   ❌ 點擊項目失敗:', clickError.message);
                  }
                }
                break;
              }
            } catch (e) {
              // 繼續檢查下一個選擇器
            }
          }

          if (!dropdownFound) {
            console.log('   ❌ 未找到下拉選單');
          }
        }

        // 步驟 8: 測試 API 端點
        console.log('\n--- 步驟 8: 測試產品搜尋 API 端點 ---');
        
        try {
          const apiResponse = await page.request.get('http://127.0.0.1:8000/api/products/search?q=產品');
          console.log('產品搜尋 API 狀態:', apiResponse.status());
          
          if (apiResponse.ok()) {
            const apiData = await apiResponse.json();
            console.log('API 回應結構:', Object.keys(apiData));
            if (apiData.products && Array.isArray(apiData.products)) {
              console.log('API 回應產品數量:', apiData.products.length);
            }
          } else {
            console.log('❌ API 回應錯誤');
          }
        } catch (apiError) {
          console.log('❌ API 測試失敗:', apiError.message);
        }

      } else {
        console.log('❌ 無法找到產品輸入框，跳過輸入測試');
      }

      // 步驟 9: 檢查 JavaScript 載入狀態
      console.log('\n--- 步驟 9: 檢查 JavaScript 載入狀態 ---');
      
      // 檢查 ProductAutocomplete 是否載入
      const productAutocompleteLoaded = await page.evaluate(() => {
        return typeof window.ProductAutocomplete !== 'undefined';
      });
      console.log('ProductAutocomplete 類別已載入:', productAutocompleteLoaded);

      // 檢查相關的 JavaScript 函數
      const jsFunctions = await page.evaluate(() => {
        return {
          addQuoteItem: typeof addQuoteItem !== 'undefined',
          removeQuoteItem: typeof removeQuoteItem !== 'undefined',
          updateItemSubtotal: typeof updateItemSubtotal !== 'undefined',
          updateTotals: typeof updateTotals !== 'undefined'
        };
      });
      console.log('JavaScript 函數載入狀態:', jsFunctions);

      // 步驟 10: 測試響應式設計
      console.log('\n--- 步驟 10: 測試響應式設計 ---');
      
      const viewports = [
        { name: 'Desktop', width: 1280, height: 720 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Mobile', width: 375, height: 667 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500);
        await page.screenshot({ 
          path: `quotes-detailed-09-responsive-${viewport.name}.png`,
          fullPage: true 
        });
        console.log(`✅ ${viewport.name} 視圖截圖完成`);
      }

      // 恢復原始視窗大小
      await page.setViewportSize({ width: 1280, height: 720 });

      // 步驟 11: 最終狀態截圖
      console.log('\n--- 步驟 11: 最終狀態檢查 ---');
      await page.screenshot({ path: 'quotes-detailed-10-final-state.png', fullPage: true });

      console.log('\n=== 測試完成 ===');
      console.log('✅ 報價表單產品自動完成功能詳細測試完成');

    } catch (error) {
      console.log('❌ 測試過程中發生錯誤:', error.message);
      await page.screenshot({ path: 'quotes-detailed-error-state.png', fullPage: true });
      throw error;
    }
  });

  test('測試產品搜尋 API 端點直接存取', async ({ page }) => {
    console.log('\n=== 測試產品搜尋 API 端點直接存取 ===');

    // 先登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // 測試各種 API 端點
    const apiEndpoints = [
      { url: '/api/products/search?q=產品', name: '產品搜尋 API (含查詢)' },
      { url: '/api/products/search?q=test', name: '產品搜尋 API (英文查詢)' },
      { url: '/api/products/search?q=A', name: '產品搜尋 API (單字元查詢)' },
      { url: '/api/products?paginate=false&limit=5', name: '產品列表 API' },
      { url: '/api/customers', name: '客戶列表 API' }
    ];

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`\n🔗 測試 ${endpoint.name}: ${endpoint.url}`);
        
        const response = await page.request.get(`http://127.0.0.1:8000${endpoint.url}`);
        const status = response.status();
        console.log(`   狀態碼: ${status}`);
        
        if (status === 200) {
          const contentType = response.headers()['content-type'] || '';
          console.log(`   Content-Type: ${contentType}`);
          
          if (contentType.includes('application/json')) {
            try {
              const jsonData = await response.json();
              console.log(`   JSON 回應鍵值:`, Object.keys(jsonData));
              
              if (jsonData.products && Array.isArray(jsonData.products)) {
                console.log(`   ✅ 搜尋產品數量: ${jsonData.products.length}`);
                if (jsonData.products.length > 0) {
                  const firstProduct = jsonData.products[0];
                  console.log(`   📦 第一個產品:`, {
                    id: firstProduct.id,
                    name: firstProduct.name,
                    sku: firstProduct.sku,
                    unit_price: firstProduct.unit_price
                  });
                }
              }
              
              if (jsonData.data && Array.isArray(jsonData.data)) {
                console.log(`   ✅ 資料數量: ${jsonData.data.length}`);
                if (jsonData.data.length > 0) {
                  const firstItem = jsonData.data[0];
                  console.log(`   📦 第一個項目:`, {
                    id: firstItem.id,
                    name: firstItem.name || firstItem.company_name,
                    sku: firstItem.sku || 'N/A'
                  });
                }
              }
              
              if (jsonData.success !== undefined) {
                console.log(`   🎯 API 成功狀態: ${jsonData.success}`);
              }
              
            } catch (jsonError) {
              console.log(`   ❌ JSON 解析失敗: ${jsonError.message}`);
            }
          }
        } else if (status === 422) {
          console.log(`   ⚠️ 驗證錯誤 (422)`);
          try {
            const errorData = await response.json();
            console.log(`   驗證錯誤詳情:`, errorData);
          } catch (e) {
            console.log(`   無法解析驗證錯誤詳情`);
          }
        } else if (status === 500) {
          console.log(`   ❌ 伺服器內部錯誤 (500)`);
          try {
            const errorText = await response.text();
            console.log(`   錯誤詳情: ${errorText.substring(0, 200)}...`);
          } catch (e) {
            console.log(`   無法讀取錯誤詳情`);
          }
        } else {
          console.log(`   ❌ HTTP 錯誤: ${status}`);
        }
        
      } catch (error) {
        console.log(`   ❌ 請求失敗: ${error.message}`);
      }
    }

    console.log('\n✅ API 端點測試完成');
  });
});