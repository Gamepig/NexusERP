const { test, expect } = require('@playwright/test');

test.describe('儀表板 API 認證修復測試', () => {
  test('測試儀表板載入和 API 請求', async ({ page, context }) => {
    // 設定請求攔截來監控 API 請求
    const apiRequests = [];
    const apiResponses = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/dashboard') || request.url().includes('/dashboard')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
        console.log('📤 API 請求:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/dashboard')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log('📥 API 響應:', response.status(), response.url());
      }
    });

    // 監控網路錯誤
    const networkErrors = [];
    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        failure: request.failure()
      });
      console.log('❌ 網路錯誤:', request.url(), request.failure());
    });

    // 監控 JavaScript 錯誤
    const jsErrors = [];
    page.on('pageerror', exception => {
      jsErrors.push(exception.message);
      console.log('🚫 JavaScript 錯誤:', exception.message);
    });

    // 監控控制台訊息
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 控制台錯誤:', msg.text());
      }
    });

    console.log('🧪 開始測試 - 儀表板 API 認證修復');

    // 1. 清除瀏覽器快取
    console.log('1️⃣ 清除瀏覽器快取...');
    await context.clearCookies();
    await page.goto('about:blank');

    // 2. 導航到儀表板頁面
    console.log('2️⃣ 導航到儀表板頁面...');
    await page.goto('http://127.0.0.1:8000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // 3. 等待頁面完全載入
    console.log('3️⃣ 等待頁面完全載入...');
    await page.waitForLoadState('domcontentloaded');
    
    // 檢查是否存在載入狀態元素
    const loadingElements = await page.locator('.loading, .spinner, [data-loading]').count();
    console.log(`📊 發現 ${loadingElements} 個載入狀態元素`);

    // 4. 等待 API 請求完成
    console.log('4️⃣ 等待 API 請求完成...');
    await page.waitForTimeout(3000); // 給 API 請求時間

    // 5. 檢查頁面標題
    const pageTitle = await page.title();
    console.log('📄 頁面標題:', pageTitle);

    // 6. 檢查是否有認證相關的重定向
    const currentUrl = page.url();
    console.log('🌐 當前 URL:', currentUrl);

    // 7. 檢查儀表板內容是否存在
    console.log('5️⃣ 檢查儀表板內容...');
    
    // 檢查統計卡片
    const statsCards = await page.locator('.stat-card, .stats-card, .card').count();
    console.log(`📊 統計卡片數量: ${statsCards}`);

    // 檢查圖表容器
    const chartContainers = await page.locator('canvas, .chart-container, #chart').count();
    console.log(`📈 圖表容器數量: ${chartContainers}`);

    // 檢查表格
    const tables = await page.locator('table').count();
    console.log(`🗃️ 表格數量: ${tables}`);

    // 8. 檢查 API 請求結果
    console.log('6️⃣ 分析 API 請求結果...');
    console.log(`📡 總共發送了 ${apiRequests.length} 個相關 API 請求`);
    console.log(`📨 收到了 ${apiResponses.length} 個 API 響應`);

    // 檢查是否有成功的 dashboard API 請求
    const dashboardApiResponse = apiResponses.find(resp => resp.url.includes('/api/dashboard'));
    if (dashboardApiResponse) {
      console.log('✅ Dashboard API 響應狀態:', dashboardApiResponse.status);
      expect(dashboardApiResponse.status).toBe(200);
    } else {
      console.log('⚠️ 未發現 Dashboard API 請求');
    }

    // 9. 檢查錯誤情況
    console.log('7️⃣ 檢查錯誤情況...');
    console.log(`🚫 JavaScript 錯誤數量: ${jsErrors.length}`);
    console.log(`❌ 網路錯誤數量: ${networkErrors.length}`);

    if (jsErrors.length > 0) {
      console.log('JavaScript 錯誤詳情:', jsErrors);
    }

    if (networkErrors.length > 0) {
      console.log('網路錯誤詳情:', networkErrors);
    }

    // 10. 生成測試報告
    const testReport = {
      pageTitle,
      currentUrl,
      statsCards,
      chartContainers,
      tables,
      apiRequestsCount: apiRequests.length,
      apiResponsesCount: apiResponses.length,
      jsErrorsCount: jsErrors.length,
      networkErrorsCount: networkErrors.length,
      dashboardApiStatus: dashboardApiResponse?.status || 'N/A'
    };

    console.log('📋 測試報告:', JSON.stringify(testReport, null, 2));

    // 基本斷言
    expect(currentUrl).toContain('/dashboard');
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);

    // 截圖保存
    await page.screenshot({ 
      path: 'dashboard-test-result.png', 
      fullPage: true 
    });
    console.log('📸 已保存頁面截圖: dashboard-test-result.png');
  });
});