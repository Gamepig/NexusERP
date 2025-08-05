const { test, expect } = require('@playwright/test');

test('NexusERP 儀表板 JavaScript 調試測試', async ({ page }) => {
  console.log('🔧 === JavaScript 調試測試開始 ===');

  // 監聽 console 訊息
  const consoleMessages = [];
  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    // 即時輸出重要的 console 訊息
    if (msg.type() === 'error' || msg.text().includes('Dashboard')) {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });

  // 監聽 JavaScript 錯誤
  const jsErrors = [];
  page.on('pageerror', (error) => {
    jsErrors.push(error.message);
    console.log(`[JS Error] ${error.message}`);
  });

  // 步驟 1: 登入
  console.log('📍 步驟 1: 登入系統');
  await page.goto('http://127.0.0.1:8000/login');
  await page.waitForSelector('input[name="email"]');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // 步驟 2: 訪問儀表板
  console.log('📍 步驟 2: 訪問儀表板');
  await page.goto('http://127.0.0.1:8000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // 步驟 3: 檢查 JavaScript 載入狀態
  console.log('📍 步驟 3: 檢查 JavaScript 載入狀態');
  
  const jsChecks = await page.evaluate(() => {
    return {
      hasDashboardManager: typeof DashboardManager !== 'undefined',
      hasWindowDashboardManager: typeof window.dashboardManager !== 'undefined',
      hasChart: typeof Chart !== 'undefined',
      hasDashboardDiv: !!document.querySelector('[data-dashboard]'),
      hasStatsDiv: !!document.querySelector('#dashboardStats'),
      hasLoadingDiv: !!document.querySelector('#dashboardLoading'),
      loadingDivVisible: !document.querySelector('#dashboardLoading')?.classList.contains('hidden'),
      statsVisible: !document.querySelector('#dashboardStats')?.classList.contains('hidden'),
      statCards: document.querySelectorAll('[data-stat]').length,
      allStatCards: document.querySelectorAll('.bg-white.rounded-lg.shadow').length
    };
  });

  console.log('🔍 JavaScript 狀態檢查:');
  Object.entries(jsChecks).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  // 步驟 4: 手動執行 DashboardManager
  console.log('📍 步驟 4: 手動初始化 DashboardManager');
  
  try {
    const manualInit = await page.evaluate(async () => {
      // 檢查是否已經有 DashboardManager
      if (typeof DashboardManager === 'undefined') {
        return { success: false, error: 'DashboardManager 未定義' };
      }

      // 手動創建實例
      if (!window.dashboardManager) {
        window.dashboardManager = new DashboardManager();
        
        // 等待初始化
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return { 
          success: true, 
          hasInstance: !!window.dashboardManager,
          isLoading: window.dashboardManager?.isLoading,
          statistics: window.dashboardManager?.statistics?.size || 0
        };
      }

      return { 
        success: true, 
        alreadyExists: true,
        isLoading: window.dashboardManager?.isLoading,
        statistics: window.dashboardManager?.statistics?.size || 0
      };
    });

    console.log('🔧 手動初始化結果:', manualInit);

  } catch (error) {
    console.log('❌ 手動初始化失敗:', error.message);
  }

  // 等待更長時間讓 API 請求完成
  await page.waitForTimeout(5000);

  // 步驟 5: 檢查最終狀態
  console.log('📍 步驟 5: 檢查最終狀態');
  
  const finalState = await page.evaluate(() => {
    const loadingDiv = document.querySelector('#dashboardLoading');
    const statsDiv = document.querySelector('#dashboardStats');
    const errorDiv = document.querySelector('#dashboardError');
    
    return {
      loadingVisible: loadingDiv && !loadingDiv.classList.contains('hidden'),
      statsVisible: statsDiv && !statsDiv.classList.contains('hidden'),
      errorVisible: errorDiv && !errorDiv.classList.contains('hidden'),
      errorMessage: errorDiv?.querySelector('#dashboardErrorMessage')?.textContent,
      statCards: document.querySelectorAll('[data-stat]').length,
      hasManagerInstance: !!window.dashboardManager,
      managerStats: window.dashboardManager?.statistics?.size || 0,
      lastUpdate: window.dashboardManager?.lastUpdate?.toString()
    };
  });

  console.log('🎯 最終狀態:');
  Object.entries(finalState).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  // 步驟 6: 嘗試手動觸發 API 請求
  console.log('📍 步驟 6: 手動觸發 API 請求');
  
  const apiResult = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
      });

      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        dataSuccess: data?.success,
        hasStatistics: !!data?.statistics,
        statisticsKeys: data?.statistics ? Object.keys(data.statistics) : []
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  console.log('🌐 API 請求結果:');
  console.log(JSON.stringify(apiResult, null, 2));

  // 步驟 7: 如果 API 成功，手動更新統計
  if (apiResult.success && apiResult.dataSuccess) {
    console.log('📍 步驟 7: 手動更新統計數據');
    
    const updateResult = await page.evaluate((data) => {
      try {
        // 手動顯示內容並隱藏載入狀態
        const loadingDiv = document.querySelector('#dashboardLoading');
        const statsDiv = document.querySelector('#dashboardStats');
        const errorDiv = document.querySelector('#dashboardError');
        
        if (loadingDiv) loadingDiv.classList.add('hidden');
        if (statsDiv) statsDiv.classList.remove('hidden');
        if (errorDiv) errorDiv.classList.add('hidden');
        
        // 觸發 dashboard-loaded 事件
        const event = new CustomEvent('dashboard-loaded', {
          detail: { data: data.data },
          bubbles: true
        });
        document.dispatchEvent(event);
        
        return {
          success: true,
          statsVisible: statsDiv && !statsDiv.classList.contains('hidden'),
          loadingHidden: loadingDiv && loadingDiv.classList.contains('hidden')
        };
        
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }, apiResult);

    console.log('🔄 手動更新結果:', updateResult);
    
    // 等待更新完成
    await page.waitForTimeout(2000);
  }

  // 最終截圖
  await page.screenshot({ 
    path: 'dashboard-js-debug-final.png',
    fullPage: true 
  });

  // 步驟 8: 總結診斷結果
  console.log('📍 步驟 8: 總結診斷結果');
  
  console.log('📋 Console 訊息摘要:');
  const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
  const dashboardMessages = consoleMessages.filter(msg => msg.text.includes('Dashboard'));
  
  console.log(`   - 錯誤訊息: ${errorMessages.length} 個`);
  console.log(`   - Dashboard 相關: ${dashboardMessages.length} 個`);
  
  if (errorMessages.length > 0) {
    console.log('❌ 錯誤訊息:');
    errorMessages.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.text}`);
    });
  }

  if (dashboardMessages.length > 0) {
    console.log('📊 Dashboard 訊息:');
    dashboardMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.type}] ${msg.text}`);
    });
  }

  if (jsErrors.length > 0) {
    console.log('💥 JavaScript 錯誤:');
    jsErrors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  // 判斷問題類型
  let problemType = '未知問題';
  let solutions = [];

  if (!jsChecks.hasDashboardManager) {
    problemType = 'DashboardManager 未載入';
    solutions.push('檢查 DashboardManager.js 檔案路徑');
    solutions.push('確認檔案是否正確載入');
  } else if (!apiResult.success) {
    problemType = 'API 認證或回應問題';
    solutions.push('檢查用戶認證狀態');
    solutions.push('確認 API 路由和控制器');
  } else if (jsChecks.loadingDivVisible) {
    problemType = '載入狀態未正確更新';
    solutions.push('檢查事件監聽器');
    solutions.push('確認 DOM 元素選擇器');
  }

  console.log(`🎯 問題類型: ${problemType}`);
  console.log('🔧 建議解決方案:');
  solutions.forEach((solution, index) => {
    console.log(`   ${index + 1}. ${solution}`);
  });

  console.log('🏁 === JavaScript 調試測試完成 ===');
});