import { test, expect } from '@playwright/test';

test.describe('報價表單產品自動完成功能測試', () => {
  let page;
  let browser;

  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser;
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    
    // 設置控制台監聽器以捕獲 JavaScript 錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // 設置網路監聽器以監控 API 請求
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('API Request:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('API Response:', response.status(), response.url());
      }
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('測試報價表單產品自動完成功能', async () => {
    console.log('開始測試報價表單產品自動完成功能...');

    // 步驟1: 導航到首頁
    console.log('步驟1: 導航到首頁');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'quotes-autocomplete-01-homepage.png', fullPage: true });

    // 步驟2: 執行登入
    console.log('步驟2: 執行登入流程');
    
    // 檢查是否已經登入
    const isLoggedIn = await page.locator('.sidebar, [data-sidebar], nav').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      // 點擊登入按鈕或導航到登入頁面
      await page.click('a[href*="login"], .login-btn, button:has-text("登入")').catch(async () => {
        await page.goto('http://127.0.0.1:8000/login');
      });
      
      await page.waitForLoadState('networkidle');
      
      // 填寫登入表單
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"], input[type="password"]', 'password123');
      
      await page.screenshot({ path: 'quotes-autocomplete-02-login-form.png', fullPage: true });
      
      // 提交登入表單
      await page.click('button[type="submit"], input[type="submit"], .login-submit');
      await page.waitForLoadState('networkidle');
      
      console.log('登入完成');
    }

    await page.screenshot({ path: 'quotes-autocomplete-03-after-login.png', fullPage: true });

    // 步驟3: 導航到報價表單頁面
    console.log('步驟3: 導航到報價表單頁面');
    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForLoadState('networkidle');
    
    // 等待頁面完全載入
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'quotes-autocomplete-04-quotes-form-initial.png', fullPage: true });

    // 步驟4: 分析頁面結構和產品輸入框
    console.log('步驟4: 分析頁面結構');
    
    // 檢查頁面是否載入成功
    const pageTitle = await page.title();
    console.log('頁面標題:', pageTitle);
    
    // 檢查是否有錯誤訊息
    const errorElements = await page.locator('.error, .alert-danger, .text-red').all();
    if (errorElements.length > 0) {
      for (const error of errorElements) {
        const errorText = await error.textContent();
        console.log('發現錯誤訊息:', errorText);
      }
    }

    // 檢查頁面內容
    const bodyText = await page.locator('body').textContent();
    console.log('頁面內容關鍵字檢查:');
    console.log('- 包含"報價":', bodyText.includes('報價'));
    console.log('- 包含"產品":', bodyText.includes('產品'));
    console.log('- 包含"客戶":', bodyText.includes('客戶'));

    // 步驟5: 尋找產品搜尋輸入框
    console.log('步驟5: 尋找產品搜尋輸入框');
    
    // 嘗試多種可能的產品輸入框選擇器
    const productInputSelectors = [
      'input[name*="product"]',
      'input[placeholder*="產品"]',
      'input[placeholder*="搜尋產品"]',
      'input[placeholder*="product"]',
      '.product-search input',
      '.product-input input',
      '#product-search',
      '#product_search',
      'input[data-autocomplete="products"]',
      '.autocomplete input'
    ];

    let productInput = null;
    let usedSelector = '';

    for (const selector of productInputSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          productInput = element;
          usedSelector = selector;
          console.log(`找到產品輸入框，使用選擇器: ${selector}`);
          break;
        }
      } catch (e) {
        // 繼續嘗試下一個選擇器
      }
    }

    if (!productInput) {
      console.log('未找到明確的產品輸入框，列出所有輸入框:');
      const allInputs = await page.locator('input').all();
      for (let i = 0; i < allInputs.length; i++) {
        const input = allInputs[i];
        const name = await input.getAttribute('name') || '';
        const placeholder = await input.getAttribute('placeholder') || '';
        const id = await input.getAttribute('id') || '';
        const type = await input.getAttribute('type') || '';
        console.log(`  輸入框 ${i}: name="${name}", placeholder="${placeholder}", id="${id}", type="${type}"`);
      }
      
      // 嘗試使用第一個可見的文字輸入框
      productInput = page.locator('input[type="text"], input:not([type])').first();
      usedSelector = '第一個文字輸入框';
    }

    // 步驟6: 測試產品自動完成功能
    console.log('步驟6: 測試產品自動完成功能');
    
    if (productInput) {
      // 聚焦輸入框
      await productInput.focus();
      await page.screenshot({ path: 'quotes-autocomplete-05-input-focused.png', fullPage: true });

      // 輸入測試文字以觸發自動完成
      const testSearchTerms = ['產品', 'test', 'product', 'A', '1'];
      
      for (const searchTerm of testSearchTerms) {
        console.log(`測試搜尋關鍵字: "${searchTerm}"`);
        
        // 清空輸入框
        await productInput.clear();
        
        // 輸入搜尋關鍵字
        await productInput.fill(searchTerm);
        
        // 等待一下讓自動完成觸發
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: `quotes-autocomplete-06-search-${searchTerm.replace(/[^a-zA-Z0-9]/g, '_')}.png`, 
          fullPage: true 
        });

        // 檢查是否出現下拉選單
        const dropdownSelectors = [
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
        for (const selector of dropdownSelectors) {
          try {
            const dropdown = page.locator(selector);
            if (await dropdown.isVisible()) {
              console.log(`找到下拉選單: ${selector}`);
              dropdownFound = true;
              
              // 檢查下拉選單內容
              const items = await dropdown.locator('li, .item, .option').all();
              console.log(`下拉選單項目數量: ${items.length}`);
              
              for (let i = 0; i < Math.min(items.length, 3); i++) {
                const itemText = await items[i].textContent();
                console.log(`  項目 ${i + 1}: ${itemText?.trim()}`);
              }
              break;
            }
          } catch (e) {
            // 繼續檢查下一個選擇器
          }
        }

        if (!dropdownFound) {
          console.log('未找到下拉選單');
        }

        // 檢查網路請求
        await page.waitForTimeout(500);
      }

      // 步驟7: 測試選擇產品
      console.log('步驟7: 測試選擇產品功能');
      
      // 重新搜尋並嘗試選擇項目
      await productInput.clear();
      await productInput.fill('產品');
      await page.waitForTimeout(1000);

      // 嘗試點擊第一個建議項目
      const firstSuggestion = page.locator('.dropdown li, .autocomplete-results li, .suggestions li, ul[role="listbox"] li').first();
      if (await firstSuggestion.isVisible()) {
        await firstSuggestion.click();
        await page.waitForTimeout(1000);
        
        console.log('已點擊第一個建議項目');
        await page.screenshot({ path: 'quotes-autocomplete-07-item-selected.png', fullPage: true });
        
        // 檢查輸入框是否被填入
        const inputValue = await productInput.inputValue();
        console.log('選擇後輸入框值:', inputValue);
      }
    }

    // 步驟8: 檢查 JavaScript 控制台錯誤
    console.log('步驟8: 檢查表單其他功能');
    
    // 檢查表單的其他欄位
    const formFields = await page.locator('input, select, textarea').all();
    console.log(`表單總計欄位數: ${formFields.length}`);
    
    for (let i = 0; i < Math.min(formFields.length, 10); i++) {
      const field = formFields[i];
      const name = await field.getAttribute('name') || '';
      const type = await field.getAttribute('type') || '';
      const tagName = await field.evaluate(el => el.tagName.toLowerCase());
      console.log(`  欄位 ${i + 1}: ${tagName} name="${name}" type="${type}"`);
    }

    // 步驟9: 測試響應式設計
    console.log('步驟9: 測試響應式設計');
    
    // 測試平板尺寸
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'quotes-autocomplete-08-tablet-view.png', fullPage: true });

    // 測試手機尺寸
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'quotes-autocomplete-09-mobile-view.png', fullPage: true });

    // 恢復桌面尺寸
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // 步驟10: 最終狀態檢查
    console.log('步驟10: 最終狀態檢查');
    await page.screenshot({ path: 'quotes-autocomplete-10-final-state.png', fullPage: true });

    console.log('報價表單產品自動完成功能測試完成');
  });

  test('測試產品API端點直接存取', async () => {
    console.log('測試產品API端點直接存取...');

    // 先登入取得會話
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // 測試API端點
    const apiEndpoints = [
      '/api/products/search',
      '/api/products/search?q=產品',
      '/api/products/search?term=test',
      '/api/products',
      '/products/search'
    ];

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`測試API端點: ${endpoint}`);
        const response = await page.goto(`http://127.0.0.1:8000${endpoint}`);
        const status = response.status();
        console.log(`  狀態碼: ${status}`);
        
        if (status === 200) {
          const contentType = response.headers()['content-type'] || '';
          console.log(`  Content-Type: ${contentType}`);
          
          if (contentType.includes('application/json')) {
            const jsonData = await response.json();
            console.log(`  JSON 回應長度: ${JSON.stringify(jsonData).length}`);
            console.log(`  回應結構:`, Object.keys(jsonData));
          }
        }
      } catch (e) {
        console.log(`  錯誤: ${e.message}`);
      }
    }
  });
});