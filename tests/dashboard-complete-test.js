import { chromium } from 'playwright';

(async () => {
  // 啟動瀏覽器
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // 每個操作間隔 1 秒，方便觀察
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let consoleErrors = [];
  let networkErrors = [];
  let apiResponses = [];
  
  // 監聽控制台錯誤
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const error = msg.text();
      consoleErrors.push(error);
      console.log('❌ JavaScript 錯誤:', error);
    }
  });
  
  // 監聽網路請求失敗
  page.on('requestfailed', request => {
    const error = `${request.url()} - ${request.failure().errorText}`;
    networkErrors.push(error);
    console.log('❌ 網路請求失敗:', error);
  });
  
  // 監聽 API 響應
  page.on('response', response => {
    if (response.url().includes('/api/') || response.url().includes('dashboard')) {
      apiResponses.push({
        url: response.url(),
        status: response.status(),
        ok: response.ok()
      });
    }
  });
  
  try {
    console.log('🚀 開始完整儀表板測試（包含登錄流程）...');
    
    // 1. 導航到首頁
    console.log('📍 1. 導航到首頁...');
    await page.goto('http://127.0.0.1:8000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 2. 檢查是否需要登錄（檢查是否在登錄頁面）
    console.log('🔐 2. 檢查登錄狀態...');
    const isLoginPage = await page.isVisible('input[name="email"]', { timeout: 5000 });
    
    if (isLoginPage) {
      console.log('📝 3. 執行登錄流程...');
      
      // 填寫登錄表單
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // 點擊登錄按鈕
      await page.click('button[type="submit"], .btn-login, [type="submit"]');
      
      // 等待登錄完成和頁面跳轉
      await page.waitForTimeout(3000);
      
      console.log('✅ 登錄完成');
    } else {
      console.log('✅ 已經登錄，跳過登錄步驟');
    }
    
    // 4. 導航到儀表板
    console.log('📊 4. 導航到儀表板...');
    await page.goto('http://127.0.0.1:8000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 等待頁面完全載入
    await page.waitForTimeout(5000);
    
    // 5. 檢查頁面標題
    const title = await page.title();
    console.log('📄 頁面標題:', title);
    
    // 6. 檢查當前 URL
    const currentUrl = page.url();
    console.log('🌐 當前 URL:', currentUrl);
    
    // 7. 檢查是否仍在登錄頁面（表示認證失敗）
    const stillOnLoginPage = await page.isVisible('input[name="email"]', { timeout: 2000 }).catch(() => false);
    if (stillOnLoginPage) {
      console.log('❌ 仍在登錄頁面，認證可能失敗');
      await page.screenshot({ path: 'dashboard-test-login-failed.png', fullPage: true });
      return;
    }
    
    // 8. 檢查載入狀態
    console.log('⏳ 8. 檢查載入狀態...');
    const loadingExists = await page.isVisible('[data-loading="true"], .loading, .spinner', { timeout: 2000 }).catch(() => false);
    if (loadingExists) {
      console.log('⏳ 發現載入指示器，等待載入完成...');
      await page.waitForSelector('[data-loading="true"], .loading, .spinner', { state: 'hidden', timeout: 15000 });
    }
    
    // 9. 檢查統計卡片（多種可能的 selector）
    console.log('📊 9. 檢查統計卡片...');
    const statSelectors = [
      '.stats-card', '.stat-card', '[class*="stat"]', 
      '.card', '.metric', '.widget', 
      '[class*="dashboard-card"]', '[class*="summary"]'
    ];
    
    let totalStats = 0;
    for (const selector of statSelectors) {
      const count = await page.locator(selector).count();
      totalStats += count;
    }
    console.log(`找到 ${totalStats} 個統計相關元素`);
    
    // 10. 檢查圖表元素
    console.log('📈 10. 檢查圖表元素...');
    const chartSelectors = [
      'canvas', '.chart', '[id*="chart"]', 
      '[class*="chart"]', 'svg', '.graph'
    ];
    
    let totalCharts = 0;
    for (const selector of chartSelectors) {
      const count = await page.locator(selector).count();
      totalCharts += count;
    }
    console.log(`找到 ${totalCharts} 個圖表相關元素`);
    
    // 11. 檢查主要內容區域
    console.log('📋 11. 檢查主要內容...');
    const contentSelectors = [
      'main', '.main-content', '.dashboard-content', 
      '.content', '.page-content', '#app'
    ];
    
    let hasMainContent = false;
    for (const selector of contentSelectors) {
      const visible = await page.isVisible(selector);
      if (visible) {
        hasMainContent = true;
        console.log(`✅ 找到主要內容區域: ${selector}`);
        break;
      }
    }
    
    // 12. 檢查導航元素
    console.log('🧭 12. 檢查導航元素...');
    const navExists = await page.isVisible('nav, .navbar, .navigation, .sidebar');
    console.log('導航元素存在:', navExists);
    
    // 13. 檢查是否有文字內容
    console.log('📝 13. 檢查頁面內容...');
    const bodyText = await page.textContent('body');
    const hasContent = bodyText && bodyText.trim().length > 100;
    console.log('頁面有內容:', hasContent);
    console.log('內容長度:', bodyText ? bodyText.length : 0);
    
    // 14. 檢查錯誤元素
    console.log('🚨 14. 檢查錯誤狀態...');
    const errorSelectors = [
      '.error', '.alert-danger', '[class*="error"]',
      '.alert-error', '.message-error', '.notification-error'
    ];
    
    let totalErrors = 0;
    for (const selector of errorSelectors) {
      const count = await page.locator(selector).count();
      totalErrors += count;
    }
    console.log(`發現 ${totalErrors} 個錯誤元素`);
    
    // 15. 截圖保存
    console.log('📸 15. 保存截圖...');
    await page.screenshot({ 
      path: 'dashboard-complete-test-result.png', 
      fullPage: true 
    });
    
    // 16. 等待一段時間以捕獲任何延遲載入的內容
    console.log('⏰ 16. 等待延遲載入內容...');
    await page.waitForTimeout(5000);
    
    // 重新檢查元素數量
    totalStats = 0;
    for (const selector of statSelectors) {
      const count = await page.locator(selector).count();
      totalStats += count;
    }
    
    totalCharts = 0;
    for (const selector of chartSelectors) {
      const count = await page.locator(selector).count();
      totalCharts += count;
    }
    
    // 17. 最終截圖
    await page.screenshot({ 
      path: 'dashboard-complete-test-final.png', 
      fullPage: true 
    });
    
    // 18. 整體功能評估
    console.log('\\n📋 測試結果總結:');
    console.log('====================');
    console.log('✅ 頁面標題:', title);
    console.log('✅ 當前 URL:', currentUrl);
    console.log('✅ 認證狀態: 成功（未被重定向到登錄頁面）');
    console.log('✅ 統計元素數量:', totalStats);
    console.log('✅ 圖表元素數量:', totalCharts);
    console.log('✅ 主要內容存在:', hasMainContent);
    console.log('✅ 導航元素存在:', navExists);
    console.log('✅ 頁面有內容:', hasContent);
    console.log('✅ 錯誤元素數量:', totalErrors);
    console.log('✅ JavaScript 錯誤數量:', consoleErrors.length);
    console.log('✅ 網路錯誤數量:', networkErrors.length);
    console.log('✅ API 響應數量:', apiResponses.length);
    
    // 詳細錯誤報告
    if (consoleErrors.length > 0) {
      console.log('\\n🚨 JavaScript 錯誤詳情:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (networkErrors.length > 0) {
      console.log('\\n🌐 網路錯誤詳情:');
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\\n📡 API 響應記錄:');
    apiResponses.forEach(response => {
      const status = response.ok ? '✅' : '❌';
      console.log(`${status} ${response.status} - ${response.url}`);
    });
    
    // 整體評估
    const hasBasicElements = totalStats > 0 || totalCharts > 0 || hasMainContent;
    const hasNoMajorErrors = consoleErrors.length === 0 && networkErrors.length === 0;
    const isAuthenticated = !stillOnLoginPage && currentUrl.includes('dashboard');
    
    console.log('\\n🎯 整體評估:');
    console.log('===============');
    console.log('認證狀態:', isAuthenticated ? '✅ 成功' : '❌ 失敗');
    console.log('基本元素:', hasBasicElements ? '✅ 存在' : '❌ 缺失');
    console.log('錯誤狀態:', hasNoMajorErrors ? '✅ 無重大錯誤' : '❌ 存在錯誤');
    
    const overallStatus = isAuthenticated && hasBasicElements && hasNoMajorErrors;
    console.log('\\n🏆 最終結果:', overallStatus ? '✅ 儀表板功能正常' : '❌ 儀表板存在問題');
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error.message);
    await page.screenshot({ 
      path: 'dashboard-complete-test-error.png', 
      fullPage: true 
    });
  } finally {
    await browser.close();
    console.log('🏁 測試完成');
  }
})();