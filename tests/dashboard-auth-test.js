import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🚀 開始認證和儀表板測試...');
    
    // 1. 導航到登錄頁面
    console.log('📍 1. 導航到登錄頁面...');
    await page.goto('http://127.0.0.1:8000/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 2. 填寫登錄表單
    console.log('📝 2. 填寫登錄表單...');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 截圖：填寫表單後
    await page.screenshot({ path: 'dashboard-auth-test-01-form-filled.png', fullPage: true });
    
    // 3. 提交表單
    console.log('🔐 3. 提交登錄表單...');
    await page.click('button[type="submit"]');
    
    // 等待響應
    await page.waitForTimeout(5000);
    
    // 4. 檢查登錄後的狀態
    console.log('✅ 4. 檢查登錄結果...');
    const currentUrl = page.url();
    console.log('當前 URL:', currentUrl);
    
    // 截圖：登錄後
    await page.screenshot({ path: 'dashboard-auth-test-02-after-login.png', fullPage: true });
    
    // 5. 如果成功登錄，導航到儀表板
    if (!currentUrl.includes('/login')) {
      console.log('📊 5. 登錄成功，導航到儀表板...');
      await page.goto('http://127.0.0.1:8000/dashboard', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      await page.waitForTimeout(5000);
      
      // 檢查儀表板內容
      const dashboardUrl = page.url();
      console.log('儀表板 URL:', dashboardUrl);
      
      // 檢查是否有任何內容
      const bodyText = await page.textContent('body');
      console.log('頁面內容長度:', bodyText.length);
      console.log('前100個字符:', bodyText.substring(0, 100));
      
      // 檢查統計卡片
      const statsCards = await page.locator('.card, .stats-card, .stat-card, [class*="stat"]').count();
      console.log('統計卡片數量:', statsCards);
      
      // 檢查圖表
      const charts = await page.locator('canvas, .chart, [id*="chart"]').count();
      console.log('圖表數量:', charts);
      
      // 最終截圖
      await page.screenshot({ path: 'dashboard-auth-test-03-final-dashboard.png', fullPage: true });
      
      console.log('\\n🎯 測試結果:');
      console.log('認證狀態: ✅ 成功');
      console.log('儀表板訪問: ✅ 成功');
      console.log('統計卡片:', statsCards > 0 ? '✅ 存在' : '❌ 缺失');
      console.log('圖表元素:', charts > 0 ? '✅ 存在' : '❌ 缺失');
      
    } else {
      console.log('❌ 登錄失敗，仍在登錄頁面');
      
      // 檢查是否有錯誤消息
      const errorMessage = await page.textContent('.alert-danger, .error, .invalid-feedback').catch(() => '');
      if (errorMessage) {
        console.log('錯誤消息:', errorMessage);
      }
    }
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error.message);
    await page.screenshot({ path: 'dashboard-auth-test-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🏁 測試完成');
  }
})();