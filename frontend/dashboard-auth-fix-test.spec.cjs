const { test, expect } = require('@playwright/test');

test('NexusERP 儀表板認證修復測試', async ({ page }) => {
  console.log('🔧 === 認證修復測試開始 ===');

  // 步驟 1: 訪問首頁
  console.log('📍 步驟 1: 訪問首頁');
  await page.goto('http://127.0.0.1:8000');
  await page.waitForTimeout(2000);

  // 檢查是否在登入頁面
  const isLoginPage = await page.locator('input[name="email"]').count() > 0;
  console.log(`🔐 是否為登入頁面: ${isLoginPage}`);

  if (!isLoginPage) {
    // 如果不在登入頁面，嘗試直接訪問登入頁面
    console.log('🔄 重定向到登入頁面');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForTimeout(2000);
  }

  // 截圖登入頁面
  await page.screenshot({ 
    path: 'dashboard-auth-fix-01-login-page.png',
    fullPage: true 
  });

  // 步驟 2: 執行登入
  console.log('📍 步驟 2: 執行登入');
  
  // 等待表單載入
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.waitForSelector('input[name="password"]', { timeout: 10000 });
  
  // 填寫登入表單
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  // 截圖填寫完成的表單
  await page.screenshot({ 
    path: 'dashboard-auth-fix-02-form-filled.png',
    fullPage: true 
  });

  // 點擊登入按鈕
  console.log('🖱️ 點擊登入按鈕');
  await page.click('button[type="submit"]');
  
  // 等待登入處理
  await page.waitForTimeout(3000);

  // 檢查登入後的狀態
  const currentUrl = page.url();
  console.log(`🌐 當前 URL: ${currentUrl}`);

  // 截圖登入後狀態
  await page.screenshot({ 
    path: 'dashboard-auth-fix-03-after-login.png',
    fullPage: true 
  });

  // 步驟 3: 檢查認證狀態
  console.log('📍 步驟 3: 檢查認証狀態');
  
  // 檢查是否有錯誤訊息
  const errorMessage = await page.locator('.alert, .error, [class*="error"]').count();
  console.log(`❌ 錯誤訊息數量: ${errorMessage}`);

  if (errorMessage > 0) {
    const errorText = await page.locator('.alert, .error, [class*="error"]').first().textContent();
    console.log(`❌ 錯誤內容: ${errorText}`);
  }

  // 步驟 4: 強制訪問儀表板
  console.log('📍 步驟 4: 強制訪問儀表板');
  await page.goto('http://127.0.0.1:8000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // 檢查最終頁面狀態
  const finalUrl = page.url();
  console.log(`🎯 最終 URL: ${finalUrl}`);

  // 檢查是否成功進入儀表板
  const isDashboard = finalUrl.includes('/dashboard') && !finalUrl.includes('/login');
  console.log(`📊 是否成功進入儀表板: ${isDashboard}`);

  // 檢查頁面內容
  const pageTitle = await page.title();
  console.log(`📄 頁面標題: ${pageTitle}`);

  // 檢查是否有儀表板內容
  const dashboardContent = await page.locator('h1, .dashboard, [class*="dashboard"]').count();
  console.log(`📋 儀表板內容元素: ${dashboardContent}`);

  // 檢查統計卡片
  const statsCards = await page.locator('.bg-white.rounded-lg.shadow, .card, [class*="card"]').count();
  console.log(`📊 統計卡片數量: ${statsCards}`);

  // 檢查是否還在載入
  const loadingElements = await page.locator('text=載入, text=loading, .loading, [class*="loading"]').count();
  console.log(`⏳ 載入元素數量: ${loadingElements}`);

  // 最終截圖
  await page.screenshot({ 
    path: 'dashboard-auth-fix-04-final-state.png',
    fullPage: true 
  });

  // 步驟 5: 檢查具體載入問題
  if (isDashboard && statsCards === 0) {
    console.log('📍 步驟 5: 分析儀表板載入問題');
    
    // 檢查 JavaScript 載入
    const scripts = await page.locator('script').count();
    console.log(`📜 腳本數量: ${scripts}`);

    // 檢查 CSS 載入
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    console.log(`🎨 樣式表數量: ${stylesheets}`);

    // 檢查是否有 Alpine.js
    const alpineElements = await page.locator('[x-data]').count();
    console.log(`🏔️ Alpine.js 元素: ${alpineElements}`);

    // 嘗試手動執行 JavaScript
    console.log('🔧 嘗試手動觸發載入');
    try {
      await page.evaluate(() => {
        // 檢查是否有載入函數
        if (typeof window.loadDashboard === 'function') {
          window.loadDashboard();
        }
        // 觸發 Alpine.js 重新初始化
        if (window.Alpine) {
          window.Alpine.initTree(document.body);
        }
      });
      
      await page.waitForTimeout(3000);
      
      // 重新檢查統計卡片
      const newStatsCards = await page.locator('.bg-white.rounded-lg.shadow, .card, [class*="card"]').count();
      console.log(`📊 手動觸發後統計卡片: ${newStatsCards}`);
      
      await page.screenshot({ 
        path: 'dashboard-auth-fix-05-after-manual-trigger.png',
        fullPage: true 
      });
      
    } catch (error) {
      console.log(`⚠️ 手動觸發失敗: ${error.message}`);
    }
  }

  // 步驟 6: 檢查 API 連接
  console.log('📍 步驟 6: 檢查 API 連接');
  
  // 監聽網路請求
  const apiRequests = [];
  page.on('response', (response) => {
    if (response.url().includes('/api/')) {
      apiRequests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  // 重新載入頁面觸發 API 請求
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  console.log(`🔌 API 請求數量: ${apiRequests.length}`);
  if (apiRequests.length > 0) {
    console.log('📡 API 請求詳情:');
    apiRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.status} ${req.url}`);
    });
  }

  // 最終診斷結果
  console.log('🎯 === 診斷結果總結 ===');
  console.log(`✅ 登入成功: ${!finalUrl.includes('/login')}`);
  console.log(`✅ 進入儀表板: ${isDashboard}`);
  console.log(`✅ 有統計卡片: ${statsCards > 0}`);
  console.log(`✅ 無載入狀態: ${loadingElements === 0}`);
  console.log(`✅ API 請求: ${apiRequests.length > 0}`);

  // 判定修復狀態
  const isFixed = isDashboard && statsCards > 0 && loadingElements === 0;
  console.log(`🏆 儀表板修復狀態: ${isFixed ? '✅ 已修復' : '❌ 仍有問題'}`);

  // 最終截圖
  await page.screenshot({ 
    path: 'dashboard-auth-fix-06-final-diagnosis.png',
    fullPage: true 
  });

  console.log('🏁 === 認証修復測試完成 ===');
});