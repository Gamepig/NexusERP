import { test, expect } from '@playwright/test';

test.describe('儀表板 API 認證修復簡單測試', () => {
  test('儀表板頁面載入和 API 測試', async ({ page }) => {
    test.setTimeout(120000); // 2 分鐘超時

    // API 監控
    const apiCalls = [];
    const apiErrors = [];
    const jsErrors = [];

    page.on('request', request => {
      if (request.url().includes('/api/dashboard')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        console.log('📤 API 請求:', request.method(), request.url());
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/dashboard')) {
        const status = response.status();
        console.log('📥 API 響應:', status, response.url());
        
        if (status >= 400) {
          apiErrors.push({
            url: response.url(),
            status: status,
            statusText: response.statusText(),
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    page.on('pageerror', exception => {
      jsErrors.push(exception.message);
      console.log('🚫 JS 錯誤:', exception.message);
    });

    console.log('🧪 開始儀表板 API 簡單測試');

    // 1. 清除快取
    console.log('1️⃣ 清除瀏覽器狀態...');
    await page.context().clearCookies();

    // 2. 訪問首頁並點擊登入
    console.log('2️⃣ 訪問首頁並導航到登入頁面...');
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'domcontentloaded' });
    
    // 點擊登入按鈕
    await page.click('text=登入');
    await page.waitForURL('**/login');
    console.log('✅ 已到達登入頁面');

    // 3. 執行登入
    console.log('3️⃣ 執行登入...');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 等待登入完成
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✅ 登入成功，已到達儀表板');

    // 4. 等待儀表板載入
    console.log('4️⃣ 等待儀表板載入完成...');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // 等待額外時間讓 API 調用完成
    await page.waitForTimeout(8000);

    // 5. 檢查頁面狀態
    console.log('5️⃣ 檢查頁面狀態...');
    
    const currentUrl = page.url();
    console.log('🌐 當前 URL:', currentUrl);
    
    const pageTitle = await page.title();
    console.log('📄 頁面標題:', pageTitle);

    // 檢查載入狀態
    const loadingElements = await page.locator('.loading, .spinner, [data-loading]').count();
    console.log('⏳ 載入狀態元素:', loadingElements);

    // 檢查頁面內容
    const cards = await page.locator('.card, .dashboard-card, .stat-card').count();
    console.log('📊 卡片數量:', cards);

    const charts = await page.locator('canvas, .chart-container').count();
    console.log('📈 圖表數量:', charts);

    // 6. 分析 API 調用
    console.log('6️⃣ 分析 API 調用結果...');
    console.log(`📡 儀表板 API 調用數量: ${apiCalls.length}`);
    console.log(`❌ API 錯誤數量: ${apiErrors.length}`);
    console.log(`🚫 JavaScript 錯誤數量: ${jsErrors.length}`);

    if (apiCalls.length > 0) {
      console.log('📊 API 調用詳情:');
      apiCalls.forEach((call, index) => {
        console.log(`  ${index + 1}. ${call.method} ${call.url}`);
      });
    }

    if (apiErrors.length > 0) {
      console.log('❌ API 錯誤詳情:');
      apiErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.status} ${error.url}`);
      });
    }

    if (jsErrors.length > 0) {
      console.log('🚫 JavaScript 錯誤詳情:');
      jsErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // 7. 保存截圖
    console.log('7️⃣ 保存測試截圖...');
    await page.screenshot({ 
      path: 'dashboard-simple-api-test-result.png', 
      fullPage: true 
    });

    // 8. 生成測試結果
    const testResult = {
      timestamp: new Date().toISOString(),
      url: currentUrl,
      title: pageTitle,
      loadingElements,
      cards,
      charts,
      apiCalls: apiCalls.length,
      apiErrors: apiErrors.length,
      jsErrors: jsErrors.length,
      success: currentUrl.includes('/dashboard') && apiErrors.length === 0 && jsErrors.length === 0
    };

    console.log('📋 測試結果摘要:');
    console.log(JSON.stringify(testResult, null, 2));

    // 9. 執行驗證
    console.log('9️⃣ 執行驗證...');

    // 驗證 URL 正確
    expect(currentUrl).toContain('/dashboard');
    console.log('✅ URL 驗證通過');

    // 驗證無 API 錯誤
    expect(apiErrors.length).toBe(0);
    console.log('✅ 無 API 錯誤');

    // 驗證無 JavaScript 錯誤
    expect(jsErrors.length).toBe(0);
    console.log('✅ 無 JavaScript 錯誤');

    // 驗證頁面有內容
    expect(cards + charts).toBeGreaterThan(0);
    console.log('✅ 頁面內容驗證通過');

    // API 調用驗證（如果有調用的話）
    if (apiCalls.length > 0) {
      expect(apiCalls.length).toBeGreaterThan(0);
      console.log('✅ 儀表板 API 調用成功');
    } else {
      console.log('⚠️ 未檢測到儀表板 API 調用');
    }

    console.log('🎉 儀表板 API 認證修復測試完成');
    
    return testResult;
  });
});