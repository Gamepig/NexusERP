import { test, expect } from '@playwright/test';

test.describe('NexusERP 銷售報表功能修復驗證測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設定測試超時時間
    test.setTimeout(120000);
  });

  test('完整的銷售報表功能測試流程', async ({ page }) => {
    console.log('=== 開始 NexusERP 銷售報表功能修復驗證測試 ===');
    
    // 步驟 1: 檢查首頁載入
    console.log('步驟 1: 檢查首頁載入狀態');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 驗證首頁載入
    await expect(page).toHaveTitle(/NexusERP/);
    await page.screenshot({ path: 'screenshots/repair-test-01-homepage.png', fullPage: true });
    console.log('✅ 首頁載入成功');
    
    // 步驟 2: 點擊登入按鈕進入登入頁面
    console.log('步驟 2: 進入登入頁面');
    
    // 尋找登入按鈕（根據首頁截圖，有一個"登入"按鈕）
    const loginButton = page.locator('text=登入').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ 成功點擊登入按鈕');
    } else {
      // 如果沒有找到登入按鈕，直接導航到登入頁面
      await page.goto('http://127.0.0.1:8000/login');
      await page.waitForLoadState('networkidle');
      console.log('✅ 直接導航到登入頁面');
    }
    
    await page.screenshot({ path: 'screenshots/repair-test-02-login-page.png', fullPage: true });
    
    // 步驟 3: 執行登入流程
    console.log('步驟 3: 執行登入流程');
    
    // 等待登入表單載入
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    // 填寫登入資訊
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    await page.screenshot({ path: 'screenshots/repair-test-03-login-filled.png', fullPage: true });
    
    // 點擊登入按鈕
    await page.click('button[type="submit"], button:has-text("LOG IN"), .btn:has-text("登入")');
    
    // 等待登入完成
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 額外等待確保頁面完全載入
    
    await page.screenshot({ path: 'screenshots/repair-test-04-after-login.png', fullPage: true });
    console.log('✅ 登入流程完成');
    
    // 步驟 4: 檢查登入是否成功
    console.log('步驟 4: 驗證登入狀態');
    
    const currentUrl = page.url();
    console.log('當前 URL:', currentUrl);
    
    // 檢查是否成功登入（不再在登入頁面）
    const isStillOnLoginPage = currentUrl.includes('/login');
    if (isStillOnLoginPage) {
      // 如果還在登入頁面，檢查是否有錯誤訊息
      const errorMessages = await page.locator('.alert-danger, .error, .text-red-500').allTextContents();
      console.log('❌ 登入失敗，錯誤訊息:', errorMessages);
      
      // 嘗試其他登入方式 - 使用郵箱註冊功能
      console.log('嘗試註冊新帳號...');
      await page.click('text=Register, text=註冊');
      await page.waitForLoadState('networkidle');
      
      // 填寫註冊資訊
      await page.fill('input[name="name"]', '測試使用者');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="password_confirmation"]', 'password123');
      
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    await page.screenshot({ path: 'screenshots/repair-test-05-login-verification.png', fullPage: true });
    
    // 步驟 5: 導航到銷售報表頁面
    console.log('步驟 5: 導航到銷售報表頁面');
    
    try {
      await page.goto('http://127.0.0.1:8000/reports/sales');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // 等待內容載入
      
      console.log('✅ 成功導航到銷售報表頁面');
      
    } catch (error) {
      console.log('❌ 導航到銷售報表頁面失敗:', error.message);
    }
    
    await page.screenshot({ path: 'screenshots/repair-test-06-reports-page.png', fullPage: true });
    
    // 步驟 6: 詳細分析報表頁面內容
    console.log('步驟 6: 分析報表頁面內容');
    
    const currentPageUrl = page.url();
    console.log('當前頁面 URL:', currentPageUrl);
    
    // 檢查頁面內容
    const pageTitle = await page.title();
    console.log('頁面標題:', pageTitle);
    
    // 檢查是否有錯誤頁面
    const has500Error = await page.locator('text=500').count() > 0;
    const has404Error = await page.locator('text=404').count() > 0;
    const hasServerError = await page.locator('text=Server Error').count() > 0;
    const hasNotFound = await page.locator('text=Not Found').count() > 0;
    
    console.log('錯誤檢查結果:');
    console.log('  500 錯誤:', has500Error);
    console.log('  404 錯誤:', has404Error);
    console.log('  伺服器錯誤:', hasServerError);
    console.log('  未找到錯誤:', hasNotFound);
    
    // 檢查頁面元素
    const hasMainContent = await page.locator('main, .main-content, #app, .container').count();
    const hasCharts = await page.locator('canvas, .chart, svg, .graph').count();
    const hasTables = await page.locator('table, .table').count();
    const hasReportContent = await page.locator('text=報表, text=銷售, text=Sales, text=Report, text=Analytics').count();
    
    console.log('頁面元素檢查:');
    console.log('  主要內容區域:', hasMainContent);
    console.log('  圖表元素:', hasCharts);
    console.log('  表格元素:', hasTables);
    console.log('  報表相關內容:', hasReportContent);
    
    // 步驟 7: 網路請求分析
    console.log('步驟 7: 監控網路請求');
    
    let apiRequests = [];
    let apiErrors = [];
    
    // 設定網路監聽
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      
      if (url.includes('/api/') || url.includes('/reports/') || url.includes('/sales')) {
        apiRequests.push({
          url: url,
          status: status,
          statusText: response.statusText()
        });
        
        if (status >= 400) {
          apiErrors.push({
            url: url,
            status: status,
            statusText: response.statusText()
          });
        }
      }
    });
    
    // 重新載入頁面以觸發 API 請求
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    console.log('API 請求記錄:');
    apiRequests.forEach(req => {
      console.log(`  ${req.status} ${req.statusText}: ${req.url}`);
    });
    
    if (apiErrors.length > 0) {
      console.log('❌ API 錯誤記錄:');
      apiErrors.forEach(err => {
        console.log(`  ${err.status} ${err.statusText}: ${err.url}`);
      });
    } else {
      console.log('✅ 所有 API 請求正常');
    }
    
    await page.screenshot({ path: 'screenshots/repair-test-07-final-analysis.png', fullPage: true });
    
    // 步驟 8: 嘗試其他報表相關路徑
    console.log('步驟 8: 測試其他報表路徑');
    
    const reportPaths = [
      '/reports',
      '/dashboard',
      '/analytics',
      '/sales',
      '/admin/reports',
      '/api/reports/sales'
    ];
    
    for (const path of reportPaths) {
      try {
        console.log(`測試路徑: ${path}`);
        await page.goto(`http://127.0.0.1:8000${path}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        const url = page.url();
        const title = await page.title();
        console.log(`  結果: ${url} - ${title}`);
        
      } catch (error) {
        console.log(`  錯誤: ${error.message}`);
      }
    }
    
    // 步驟 9: 控制台錯誤檢查
    console.log('步驟 9: 檢查控制台錯誤');
    
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 重新載入以收集控制台錯誤
    await page.goto('http://127.0.0.1:8000/reports/sales');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    if (consoleErrors.length > 0) {
      console.log('❌ 控制台錯誤:');
      consoleErrors.forEach(error => {
        console.log(`  ${error}`);
      });
    } else {
      console.log('✅ 無控制台錯誤');
    }
    
    await page.screenshot({ path: 'screenshots/repair-test-08-final-state.png', fullPage: true });
    
    // 步驟 10: 測試結果摘要
    console.log('\n=== 銷售報表功能修復驗證結果 ===');
    console.log(`✅ 首頁載入: 成功`);
    console.log(`${isStillOnLoginPage ? '❌' : '✅'} 登入功能: ${isStillOnLoginPage ? '失敗' : '成功'}`);
    console.log(`${currentPageUrl.includes('/reports/sales') ? '✅' : '❌'} 報表頁面導航: ${currentPageUrl.includes('/reports/sales') ? '成功' : '失敗'}`);
    console.log(`${has500Error || hasServerError ? '❌' : '✅'} 頁面錯誤狀態: ${has500Error || hasServerError ? '發現錯誤' : '正常'}`);
    console.log(`📊 API 請求統計: 總計 ${apiRequests.length} 個，錯誤 ${apiErrors.length} 個`);
    console.log(`🎨 頁面元素: 主內容 ${hasMainContent}，圖表 ${hasCharts}，表格 ${hasTables}，報表內容 ${hasReportContent}`);
    console.log(`⚠️ 控制台錯誤: ${consoleErrors.length} 個`);
    console.log('📸 詳細截圖已保存到 screenshots/ 目錄');
    
    // 修復狀態評估
    const isFixed = !has500Error && !hasServerError && currentPageUrl.includes('/reports/sales') && apiErrors.length === 0;
    console.log(`\n🔧 修復狀態: ${isFixed ? '✅ 已修復' : '❌ 仍有問題'}`);
    
    if (!isFixed) {
      console.log('\n🔍 需要注意的問題:');
      if (has500Error || hasServerError) console.log('  - 頁面顯示伺服器錯誤');
      if (!currentPageUrl.includes('/reports/sales')) console.log('  - 無法正確導航到報表頁面');
      if (apiErrors.length > 0) console.log(`  - 發現 ${apiErrors.length} 個 API 錯誤`);
      if (consoleErrors.length > 0) console.log(`  - 發現 ${consoleErrors.length} 個控制台錯誤`);
    }
  });
  
  test('直接 API 端點測試', async ({ page }) => {
    console.log('\n=== API 端點直接測試 ===');
    
    // 先登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 測試各種可能的 API 端點
    const endpoints = [
      '/api/reports/sales',
      '/api/sales/report',
      '/api/reports',
      '/reports/sales/data',
      '/reports/api/sales',
      '/admin/api/reports/sales'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`測試端點: ${endpoint}`);
        const response = await page.goto(`http://127.0.0.1:8000${endpoint}`);
        const status = response.status();
        const contentType = response.headers()['content-type'] || '';
        
        console.log(`  狀態: ${status} ${response.statusText()}`);
        console.log(`  內容類型: ${contentType}`);
        
        if (status === 200 && contentType.includes('application/json')) {
          try {
            const data = await response.text();
            console.log(`  ✅ JSON 響應長度: ${data.length} 字符`);
            
            // 嘗試解析 JSON
            const jsonData = JSON.parse(data);
            if (jsonData.data || jsonData.sales || jsonData.reports) {
              console.log(`  ✅ 包含銷售數據`);
            }
          } catch (e) {
            console.log(`  ⚠️ JSON 解析失敗: ${e.message}`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ 端點測試失敗: ${error.message}`);
      }
    }
  });
});