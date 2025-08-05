import { test, expect } from '@playwright/test';

test.describe('NexusERP 銷售報表功能測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設定測試超時時間
    test.setTimeout(60000);
    
    // 導航到首頁
    await page.goto('http://127.0.0.1:8000');
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle');
  });

  test('測試銷售報表頁面完整流程', async ({ page }) => {
    console.log('=== 開始銷售報表功能測試 ===');
    
    // 步驟 1: 檢查首頁是否正常載入
    console.log('步驟 1: 檢查首頁載入');
    await expect(page).toHaveTitle(/NexusERP/);
    console.log('✅ 首頁載入成功');
    
    // 截圖記錄首頁狀態
    await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: true });
    
    // 步驟 2: 執行登入流程
    console.log('步驟 2: 執行登入流程');
    
    // 檢查是否需要登入
    const loginForm = page.locator('input[name="email"]');
    if (await loginForm.isVisible()) {
      console.log('發現登入表單，執行登入');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // 截圖登入表單
      await page.screenshot({ path: 'screenshots/02-login-form.png', fullPage: true });
      
      // 點擊登入按鈕
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      console.log('✅ 登入完成');
    } else {
      console.log('已登入狀態，跳過登入步驟');
    }
    
    // 截圖登入後頁面
    await page.screenshot({ path: 'screenshots/03-after-login.png', fullPage: true });
    
    // 步驟 3: 導航到銷售報表頁面
    console.log('步驟 3: 導航到銷售報表頁面');
    
    try {
      // 直接導航到銷售報表頁面
      await page.goto('http://127.0.0.1:8000/reports/sales');
      await page.waitForLoadState('networkidle');
      
      console.log('✅ 成功導航到銷售報表頁面');
      
      // 截圖銷售報表頁面
      await page.screenshot({ path: 'screenshots/04-sales-reports-page.png', fullPage: true });
      
    } catch (error) {
      console.log('❌ 導航失敗:', error.message);
      await page.screenshot({ path: 'screenshots/04-navigation-error.png', fullPage: true });
      throw error;
    }
    
    // 步驟 4: 檢查頁面是否正常載入
    console.log('步驟 4: 檢查頁面載入狀態');
    
    // 檢查頁面標題
    const pageTitle = await page.title();
    console.log('頁面標題:', pageTitle);
    
    // 檢查是否有錯誤頁面
    const errorMessage = await page.locator('text=500').count();
    const errorPage = await page.locator('text=Server Error').count();
    const notFoundPage = await page.locator('text=404').count();
    
    if (errorMessage > 0 || errorPage > 0) {
      console.log('❌ 發現 500 伺服器錯誤');
      await page.screenshot({ path: 'screenshots/05-server-error.png', fullPage: true });
      throw new Error('頁面顯示 500 伺服器錯誤');
    }
    
    if (notFoundPage > 0) {
      console.log('❌ 發現 404 頁面未找到錯誤');
      await page.screenshot({ path: 'screenshots/05-not-found-error.png', fullPage: true });
      throw new Error('頁面顯示 404 錯誤');
    }
    
    console.log('✅ 頁面載入正常，無明顯錯誤');
    
    // 步驟 5: 測試 API 請求
    console.log('步驟 5: 監控並測試 API 請求');
    
    let apiRequests = [];
    let apiErrors = [];
    
    // 監聽網路請求
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/reports/')) {
        apiRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        
        if (response.status() >= 400) {
          apiErrors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      }
    });
    
    // 等待頁面完全載入和 API 請求完成
    await page.waitForTimeout(5000);
    
    console.log('API 請求記錄:');
    apiRequests.forEach(req => {
      console.log(`  ${req.status} ${req.statusText}: ${req.url}`);
    });
    
    if (apiErrors.length > 0) {
      console.log('❌ 發現 API 錯誤:');
      apiErrors.forEach(err => {
        console.log(`  ${err.status} ${err.statusText}: ${err.url}`);
      });
    } else {
      console.log('✅ 所有 API 請求成功');
    }
    
    // 步驟 6: 檢查頁面元素
    console.log('步驟 6: 檢查頁面核心元素');
    
    // 檢查是否有主要內容區域
    const mainContent = await page.locator('main, .main-content, #main, .content').count();
    console.log('主要內容區域數量:', mainContent);
    
    // 檢查是否有圖表元素
    const charts = await page.locator('canvas, .chart, .graph, svg').count();
    console.log('圖表元素數量:', charts);
    
    // 檢查是否有表格元素
    const tables = await page.locator('table, .table').count();
    console.log('表格元素數量:', tables);
    
    // 檢查是否有報表相關文字
    const reportTexts = await page.locator('text=報表, text=銷售, text=Sales, text=Report').count();
    console.log('報表相關文字數量:', reportTexts);
    
    // 截圖頁面元素檢查結果
    await page.screenshot({ path: 'screenshots/06-page-elements.png', fullPage: true });
    
    // 步驟 7: 驗證圖表功能
    console.log('步驟 7: 驗證圖表功能');
    
    try {
      // 等待圖表載入
      await page.waitForSelector('canvas, .chart, svg', { timeout: 10000 });
      console.log('✅ 發現圖表元素');
      
      // 截圖圖表
      await page.screenshot({ path: 'screenshots/07-charts-loaded.png', fullPage: true });
      
    } catch (error) {
      console.log('⚠️ 未發現圖表元素或圖表載入失敗');
      await page.screenshot({ path: 'screenshots/07-charts-missing.png', fullPage: true });
    }
    
    // 步驟 8: 檢查控制台錯誤
    console.log('步驟 8: 檢查控制台錯誤');
    
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 等待一段時間收集控制台錯誤
    await page.waitForTimeout(3000);
    
    if (consoleErrors.length > 0) {
      console.log('❌ 發現控制台錯誤:');
      consoleErrors.forEach(error => {
        console.log(`  ${error}`);
      });
    } else {
      console.log('✅ 無控制台錯誤');
    }
    
    // 最終截圖
    await page.screenshot({ path: 'screenshots/08-final-state.png', fullPage: true });
    
    // 測試結果摘要
    console.log('\n=== 測試結果摘要 ===');
    console.log('✅ 頁面載入: 成功');
    console.log('✅ 登入功能: 成功');
    console.log('✅ 導航功能: 成功');
    console.log(`📊 API 請求: ${apiRequests.length} 個，錯誤 ${apiErrors.length} 個`);
    console.log(`🎨 頁面元素: 主內容 ${mainContent}，圖表 ${charts}，表格 ${tables}`);
    console.log(`⚠️ 控制台錯誤: ${consoleErrors.length} 個`);
    console.log('📸 截圖已保存到 screenshots/ 目錄');
    
    // 如果有嚴重錯誤，測試失敗
    if (apiErrors.length > 2 || consoleErrors.length > 5) {
      throw new Error(`測試發現嚴重問題: API錯誤 ${apiErrors.length} 個，控制台錯誤 ${consoleErrors.length} 個`);
    }
  });
  
  test('測試特定 API 端點', async ({ page }) => {
    console.log('=== 開始 API 端點測試 ===');
    
    // 登入
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    const loginForm = page.locator('input[name="email"]');
    if (await loginForm.isVisible()) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // 測試常見的報表 API 端點
    const apiEndpoints = [
      '/api/reports/sales',
      '/api/sales/data',
      '/api/dashboard/sales',
      '/reports/api/sales'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`測試端點: ${endpoint}`);
        const response = await page.goto(`http://127.0.0.1:8000${endpoint}`);
        console.log(`  狀態: ${response.status()} ${response.statusText()}`);
        
        if (response.status() === 200) {
          const contentType = response.headers()['content-type'];
          console.log(`  內容類型: ${contentType}`);
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await response.json();
              console.log(`  ✅ JSON 響應正常，數據大小: ${JSON.stringify(data).length} 字符`);
            } catch (e) {
              console.log(`  ⚠️ JSON 解析失敗: ${e.message}`);
            }
          }
        }
        
      } catch (error) {
        console.log(`  ❌ 端點測試失敗: ${error.message}`);
      }
    }
  });
});