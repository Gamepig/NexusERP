import { test, expect } from '@playwright/test';

test.describe('儀表板 API 認證修復驗證', () => {
  test('完整儀表板載入和 API 測試', async ({ page }) => {
    test.setTimeout(90000); // 90 秒超時

    // 設定請求和響應監控
    const apiRequests = [];
    const apiResponses = [];
    const networkErrors = [];
    const jsErrors = [];

    // 監控所有請求
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/dashboard')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        console.log('🔴 請求:', request.method(), request.url());
      }
    });

    // 監控所有響應
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/dashboard')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
        console.log('🟢 響應:', response.status(), response.url());
      }
    });

    // 監控網路錯誤
    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        failure: request.failure(),
        timestamp: new Date().toISOString()
      });
      console.log('❌ 網路錯誤:', request.url(), request.failure());
    });

    // 監控 JavaScript 錯誤
    page.on('pageerror', exception => {
      jsErrors.push({
        message: exception.message,
        stack: exception.stack,
        timestamp: new Date().toISOString()
      });
      console.log('🚫 JavaScript 錯誤:', exception.message);
    });

    // 監控控制台錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 控制台錯誤:', msg.text());
      }
    });

    console.log('🧪 === 開始儀表板 API 認證修復測試 ===');

    // 1. 清除瀏覽器狀態
    console.log('1️⃣ 清除瀏覽器快取和 Cookie...');
    await page.context().clearCookies();
    
    // 2. 訪問首頁
    console.log('2️⃣ 訪問首頁...');
    await page.goto('http://127.0.0.1:8000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 檢查是否被重定向到登入頁面
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('🌐 當前 URL:', currentUrl);

    // 3. 登入系統
    console.log('3️⃣ 執行登入流程...');
    
    // 填寫登入表單
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    
    // 提交登入表單
    await page.click('button[type="submit"], .btn-primary');
    
    // 等待登入完成
    await page.waitForTimeout(3000);
    
    // 4. 導航到儀表板
    console.log('4️⃣ 導航到儀表板頁面...');
    await page.goto('http://127.0.0.1:8000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // 5. 等待頁面載入完成
    console.log('5️⃣ 等待儀表板頁面完全載入...');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000); // 給 API 請求足夠時間

    // 6. 檢查頁面內容
    console.log('6️⃣ 分析頁面內容...');
    
    const pageTitle = await page.title();
    console.log('📄 頁面標題:', pageTitle);
    
    const finalUrl = page.url();
    console.log('🌐 最終 URL:', finalUrl);

    // 檢查載入狀態
    const loadingElements = await page.locator('.loading, .spinner, [data-loading="true"]').count();
    console.log('⏳ 載入狀態元素數量:', loadingElements);

    // 檢查統計卡片
    const statsCards = await page.locator('.card, .stat-card, .stats-card, .dashboard-card').count();
    console.log('📊 統計卡片數量:', statsCards);

    // 檢查圖表
    const charts = await page.locator('canvas, .chart-container, #chart, [data-chart]').count();
    console.log('📈 圖表數量:', charts);

    // 7. 分析 API 請求
    console.log('7️⃣ 分析 API 請求狀況...');
    
    console.log(`📡 總 API 請求數: ${apiRequests.length}`);
    console.log(`📨 總 API 響應數: ${apiResponses.length}`);
    console.log(`❌ 網路錯誤數: ${networkErrors.length}`);
    console.log(`🚫 JavaScript 錯誤數: ${jsErrors.length}`);

    // 尋找儀表板 API 請求
    const dashboardApiRequests = apiRequests.filter(req => req.url.includes('/api/dashboard'));
    const dashboardApiResponses = apiResponses.filter(resp => resp.url.includes('/api/dashboard'));
    
    console.log(`🎯 儀表板 API 請求數: ${dashboardApiRequests.length}`);
    console.log(`🎯 儀表板 API 響應數: ${dashboardApiResponses.length}`);

    if (dashboardApiResponses.length > 0) {
      dashboardApiResponses.forEach(resp => {
        console.log(`📊 儀表板 API 狀態: ${resp.status} - ${resp.url}`);
      });
    }

    // 8. 截圖記錄
    console.log('8️⃣ 保存測試截圖...');
    await page.screenshot({ 
      path: 'dashboard-api-verification-result.png', 
      fullPage: true 
    });

    // 9. 生成測試報告
    const testReport = {
      timestamp: new Date().toISOString(),
      pageTitle,
      finalUrl,
      loadingElements,
      statsCards,
      charts,
      totalApiRequests: apiRequests.length,
      totalApiResponses: apiResponses.length,
      dashboardApiRequests: dashboardApiRequests.length,
      dashboardApiResponses: dashboardApiResponses.length,
      networkErrors: networkErrors.length,
      jsErrors: jsErrors.length,
      success: networkErrors.length === 0 && jsErrors.length === 0 && finalUrl.includes('/dashboard'),
      apiRequestDetails: apiRequests,
      apiResponseDetails: apiResponses,
      errorDetails: {
        networkErrors,
        jsErrors
      }
    };

    console.log('📋 === 測試報告 ===');
    console.log(JSON.stringify(testReport, null, 2));

    // 10. 驗證關鍵指標
    console.log('🔍 === 驗證關鍵指標 ===');
    
    // 驗證 URL 正確
    expect(finalUrl).toContain('/dashboard');
    console.log('✅ URL 驗證通過');
    
    // 驗證無網路錯誤
    expect(networkErrors.length).toBe(0);
    console.log('✅ 無網路錯誤');
    
    // 驗證無 JavaScript 錯誤
    expect(jsErrors.length).toBe(0);
    console.log('✅ 無 JavaScript 錯誤');
    
    // 驗證頁面有內容（至少有卡片或圖表）
    expect(statsCards + charts).toBeGreaterThan(0);
    console.log('✅ 頁面內容驗證通過');

    // 如果有儀表板 API 請求，驗證狀態碼
    if (dashboardApiResponses.length > 0) {
      const successfulApiCalls = dashboardApiResponses.filter(resp => resp.status === 200);
      console.log(`📈 成功的儀表板 API 調用: ${successfulApiCalls.length}/${dashboardApiResponses.length}`);
      
      if (dashboardApiResponses.length > 0) {
        expect(successfulApiCalls.length).toBeGreaterThan(0);
        console.log('✅ 儀表板 API 調用成功');
      }
    }

    console.log('🎉 === 儀表板 API 認證修復測試完成 ===');
  });
});