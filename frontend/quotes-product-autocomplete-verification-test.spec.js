import { test, expect } from '@playwright/test';

test.describe('報價建立頁面產品自動完成功能驗證', () => {
  test('詳細測試產品自動完成功能', async ({ page }) => {
    console.log('🚀 開始測試報價建立頁面產品自動完成功能');

    // 設置視窗大小和較長的超時時間
    await page.setViewportSize({ width: 1400, height: 900 });
    
    try {
      // 步驟1：訪問登入頁面
      console.log('📋 步驟1：訪問登入頁面');
      await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
      await page.screenshot({ path: 'quotes-autocomplete-verification-01-login-page.png', fullPage: true });

      // 步驟2：執行登入
      console.log('📋 步驟2：執行登入');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // 等待登入完成
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.screenshot({ path: 'quotes-autocomplete-verification-02-after-login.png', fullPage: true });
      console.log('✅ 登入成功');

      // 步驟3：直接訪問報價建立頁面
      console.log('📋 步驟3：訪問報價建立頁面');
      await page.goto('http://127.0.0.1:8000/quotes/create', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000); // 等待頁面載入完成
      
      // 檢查頁面是否正確載入
      const currentUrl = page.url();
      console.log(`📍 當前URL: ${currentUrl}`);
      
      if (!currentUrl.includes('/quotes/create')) {
        console.log('❌ 未能正確訪問報價建立頁面，檢查重定向');
        throw new Error('無法訪問報價建立頁面');
      }
      
      await page.screenshot({ path: 'quotes-autocomplete-verification-03-quotes-create-page.png', fullPage: true });

      // 步驟4：檢查頁面結構和產品輸入框
      console.log('📋 步驟4：檢查頁面結構和產品輸入框');
      
      // 等待並檢查產品輸入框是否存在
      const productSelectors = [
        'input[id^="product_"]',
        'input[placeholder*="產品"]',
        'input[placeholder*="Product"]',
        'input[name*="product"]',
        '.product-autocomplete input',
        '.autocomplete-input'
      ];

      let productInput = null;
      for (const selector of productSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          productInput = await page.$(selector);
          if (productInput) {
            console.log(`✅ 找到產品輸入框: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`⏸️ 選擇器 ${selector} 未找到`);
        }
      }

      if (!productInput) {
        console.log('❌ 未找到產品輸入框，檢查頁面結構');
        
        // 分析頁面結構
        const pageText = await page.textContent('body');
        console.log('📄 頁面內容摘要:', pageText.substring(0, 500));
        
        // 檢查是否有表單
        const forms = await page.$$('form');
        console.log(`📄 頁面表單數量: ${forms.length}`);
        
        // 檢查所有輸入框
        const inputs = await page.$$eval('input', inputs => 
          inputs.map(input => ({
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            className: input.className
          }))
        );
        console.log('📄 頁面所有輸入框:', JSON.stringify(inputs, null, 2));

        throw new Error('未找到產品輸入框');
      }

      // 步驟5：測試產品輸入框交互
      console.log('📋 步驟5：測試產品輸入框交互');
      
      // 聚焦到產品輸入框
      await productInput.click();
      await page.screenshot({ path: 'quotes-autocomplete-verification-04-input-focused.png', fullPage: true });

      // 步驟6：測試自動完成功能 - 搜尋 "A"
      console.log('📋 步驟6：測試自動完成功能 - 搜尋 "A"');
      await productInput.fill('A');
      await page.waitForTimeout(1500); // 等待自動完成響應
      
      await page.screenshot({ path: 'quotes-autocomplete-verification-05-search-A.png', fullPage: true });

      // 檢查是否出現下拉選單
      const dropdownSelectors = [
        '.autocomplete-dropdown',
        '.dropdown-menu',
        '.suggestions',
        '.autocomplete-results',
        'ul[role="listbox"]',
        '.product-list'
      ];

      let dropdownFound = false;
      for (const selector of dropdownSelectors) {
        const dropdown = await page.$(selector);
        if (dropdown) {
          const isVisible = await dropdown.isVisible();
          if (isVisible) {
            console.log(`✅ 找到下拉選單: ${selector}`);
            dropdownFound = true;
            break;
          }
        }
      }

      if (!dropdownFound) {
        console.log('⚠️ 未找到下拉選單，檢查控制台錯誤');
        
        // 檢查 JavaScript 控制台錯誤
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        // 檢查網路請求
        const requests = [];
        page.on('request', request => {
          if (request.url().includes('product') || request.url().includes('search')) {
            requests.push({
              url: request.url(),
              method: request.method()
            });
          }
        });

        await page.waitForTimeout(2000);
        console.log('🔍 JavaScript 錯誤:', consoleErrors);
        console.log('🌐 相關網路請求:', requests);
      }

      // 步驟7：測試不同搜尋關鍵字
      console.log('📋 步驟7：測試不同搜尋關鍵字');
      
      const searchTerms = ['產品', 'test', 'laptop'];
      
      for (const term of searchTerms) {
        console.log(`🔍 測試搜尋關鍵字: ${term}`);
        await productInput.fill('');
        await page.waitForTimeout(500);
        await productInput.fill(term);
        await page.waitForTimeout(1500);
        
        await page.screenshot({ 
          path: `quotes-autocomplete-verification-06-search-${term}.png`, 
          fullPage: true 
        });
      }

      // 步驟8：檢查新增項目按鈕的產品自動完成
      console.log('📋 步驟8：檢查新增項目按鈕的產品自動完成');
      
      const addItemButtons = await page.$$('button');
      let addButton = null;
      
      for (const button of addItemButtons) {
        const text = await button.textContent();
        if (text && (text.includes('新增') || text.includes('Add') || text.includes('項目'))) {
          addButton = button;
          console.log(`✅ 找到新增按鈕: ${text}`);
          break;
        }
      }

      if (addButton) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // 尋找新增的產品輸入框
        const newProductInputs = await page.$$('input[id^="product_"]');
        if (newProductInputs.length > 1) {
          console.log(`✅ 找到 ${newProductInputs.length} 個產品輸入框`);
          
          // 測試第二個輸入框的自動完成
          const secondInput = newProductInputs[1];
          await secondInput.click();
          await secondInput.fill('test');
          await page.waitForTimeout(1500);
          
          await page.screenshot({ 
            path: 'quotes-autocomplete-verification-07-second-input-test.png', 
            fullPage: true 
          });
        }
      }

      // 步驟9：最終狀態截圖
      console.log('📋 步驟9：最終狀態檢查');
      await page.screenshot({ path: 'quotes-autocomplete-verification-08-final-state.png', fullPage: true });

      // 步驟10：檢查 JavaScript 控制台錯誤
      console.log('📋 步驟10：檢查 JavaScript 控制台錯誤');
      
      const finalConsoleErrors = await page.evaluate(() => {
        return window.console._errors || [];
      });
      
      console.log('🔍 最終控制台錯誤檢查:', finalConsoleErrors);

      console.log('✅ 產品自動完成功能測試完成');

    } catch (error) {
      console.error('❌ 測試過程中發生錯誤:', error.message);
      await page.screenshot({ path: 'quotes-autocomplete-verification-error.png', fullPage: true });
      throw error;
    }
  });

  test('檢查 ProductAutocomplete 組件載入狀態', async ({ page }) => {
    console.log('🔍 檢查 ProductAutocomplete 組件載入狀態');

    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForTimeout(3000);

    // 檢查組件是否存在
    const componentCheck = await page.evaluate(() => {
      // 檢查是否有 ProductAutocomplete 相關的 JavaScript 函數或物件
      const hasProductAutocomplete = typeof window.ProductAutocomplete !== 'undefined';
      const hasAutocompleteElements = document.querySelectorAll('.autocomplete, .product-autocomplete').length > 0;
      const hasVueComponents = typeof Vue !== 'undefined' && Vue.version;
      
      return {
        hasProductAutocomplete,
        hasAutocompleteElements,
        hasVueComponents,
        windowKeys: Object.keys(window).filter(key => key.toLowerCase().includes('product') || key.toLowerCase().includes('autocomplete'))
      };
    });

    console.log('🔍 組件檢查結果:', componentCheck);
    
    await page.screenshot({ path: 'quotes-autocomplete-component-check.png', fullPage: true });
  });
});