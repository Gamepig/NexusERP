import { test, expect } from '@playwright/test';

test.describe('產品自動完成 API 測試', () => {
  test('檢查產品搜尋 API 端點', async ({ page }) => {
    console.log('🔍 開始測試產品自動完成 API');

    // 設置登入和認證
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 獲取認證資訊
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(cookie => cookie.name.includes('session'));
    const csrfToken = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="csrf-token"]');
      return meta ? meta.getAttribute('content') : null;
    });

    console.log('🔐 認證資訊已獲取');
    console.log('Session Cookie:', sessionCookie ? 'Found' : 'Not found');
    console.log('CSRF Token:', csrfToken ? 'Found' : 'Not found');

    // 測試產品搜尋 API
    const searchTerms = ['A', '產品', 'test', 'laptop'];
    
    for (const term of searchTerms) {
      console.log(`🔍 測試搜尋關鍵字: ${term}`);
      
      try {
        const response = await page.request.get(`http://127.0.0.1:8000/api/products/search?q=${encodeURIComponent(term)}`, {
          headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        console.log(`📊 API 回應狀態 (${term}):`, response.status());
        
        if (response.ok()) {
          const data = await response.json();
          console.log(`✅ 搜尋 "${term}" 成功:`, data);
          console.log(`📦 找到 ${Array.isArray(data) ? data.length : (data.data ? data.data.length : 0)} 個產品`);
        } else {
          const text = await response.text();
          console.log(`❌ 搜尋 "${term}" 失敗:`, response.status(), text);
        }
      } catch (error) {
        console.log(`💥 搜尋 "${term}" 發生錯誤:`, error.message);
      }
    }

    // 測試不同的 API 路徑
    const apiPaths = [
      '/api/products/search',
      '/products/search',
      '/api/products',
      '/products/autocomplete'
    ];

    for (const path of apiPaths) {
      console.log(`🛤️ 測試 API 路徑: ${path}`);
      
      try {
        const response = await page.request.get(`http://127.0.0.1:8000${path}?q=test`, {
          headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        console.log(`📊 路徑 ${path} 回應狀態:`, response.status());
        
        if (response.ok()) {
          console.log(`✅ 路徑 ${path} 可用`);
        } else {
          console.log(`❌ 路徑 ${path} 不可用:`, response.status());
        }
      } catch (error) {
        console.log(`💥 路徑 ${path} 測試錯誤:`, error.message);
      }
    }
  });

  test('檢查頁面 JavaScript 功能', async ({ page }) => {
    console.log('📜 檢查頁面 JavaScript 功能');

    // 監聽控制台訊息
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    // 監聽網路請求
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('product') || request.url().includes('search')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: Object.fromEntries(request.headers())
        });
      }
    });

    // 監聽網路回應
    const networkResponses = [];
    page.on('response', response => {
      if (response.url().includes('product') || response.url().includes('search')) {
        networkResponses.push({
          url: response.url(),
          status: response.status(),
          headers: Object.fromEntries(response.headers())
        });
      }
    });

    // 登入並訪問報價頁面
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForTimeout(3000);

    // 檢查 JavaScript 狀態
    const jsStatus = await page.evaluate(() => {
      return {
        hasProductAutocomplete: typeof window.ProductAutocomplete !== 'undefined',
        hasInitFunction: typeof window.initializeProductAutocomplete !== 'undefined',
        hasJQuery: typeof $ !== 'undefined',
        hasBootstrap: typeof bootstrap !== 'undefined',
        documentReady: document.readyState,
        productInputs: document.querySelectorAll('input[placeholder*="產品"]').length
      };
    });

    console.log('📜 JavaScript 狀態:', jsStatus);

    // 模擬產品輸入
    const productInput = await page.$('input[placeholder*="產品"]');
    if (productInput) {
      console.log('🎯 找到產品輸入框，開始測試');
      
      await productInput.focus();
      await productInput.fill('A');
      await page.waitForTimeout(2000);

      console.log('🌐 網路請求記錄:', networkRequests);
      console.log('📡 網路回應記錄:', networkResponses);
      console.log('💬 控制台訊息:', consoleMessages.filter(msg => msg.type === 'error'));
    } else {
      console.log('❌ 未找到產品輸入框');
    }

    await page.screenshot({ path: 'product-autocomplete-js-test.png' });
  });
});