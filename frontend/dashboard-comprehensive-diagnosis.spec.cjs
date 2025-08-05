const { test, expect } = require('@playwright/test');

test('NexusERP 儀表板完整診斷測試', async ({ page }) => {
  // 開啟開發者工具記錄 console 和 network
  const consoleMessages = [];
  const networkRequests = [];
  const networkErrors = [];

  // 監聽 console 訊息
  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // 監聽網路請求
  page.on('request', (request) => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers()
    });
  });

  // 監聽網路回應錯誤
  page.on('response', (response) => {
    if (!response.ok()) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  console.log('🌟 === NexusERP 儀表板診斷測試開始 ===');

  // 步驟 1: 訪問首頁檢查基本載入
  console.log('📍 步驟 1: 訪問首頁');
  await page.goto('http://127.0.0.1:8000');
  await page.waitForTimeout(3000);
  
  // 截圖首頁狀態
  await page.screenshot({ 
    path: 'dashboard-diagnosis-01-homepage.png',
    fullPage: true 
  });

  // 步驟 2: 檢查是否需要登入
  console.log('📍 步驟 2: 檢查登入狀態');
  const isLoginPage = await page.locator('input[name="email"]').count() > 0;
  
  if (isLoginPage) {
    console.log('🔐 需要登入，使用測試帳號');
    
    // 填寫登入表單
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 提交登入
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }

  // 步驟 3: 導航到儀表板
  console.log('📍 步驟 3: 導航到儀表板');
  await page.goto('http://127.0.0.1:8000/dashboard');
  await page.waitForTimeout(5000);
  
  // 截圖儀表板初始狀態
  await page.screenshot({ 
    path: 'dashboard-diagnosis-02-initial-state.png',
    fullPage: true 
  });

  // 步驟 4: 檢查頁面載入狀態
  console.log('📍 步驟 4: 檢查頁面載入狀態');
  
  // 檢查是否還在載入狀態
  const loadingText = await page.locator('text=載入儀表板數據中').count();
  console.log(`🔄 載入狀態元素數量: ${loadingText}`);
  
  // 檢查統計卡片是否存在
  const statsCards = await page.locator('.bg-white.rounded-lg.shadow').count();
  console.log(`📊 統計卡片數量: ${statsCards}`);

  // 檢查圖表容器是否存在
  const chartContainers = await page.locator('canvas').count();
  console.log(`📈 圖表畫布數量: ${chartContainers}`);

  // 步驟 5: 檢查 JavaScript 錯誤
  console.log('📍 步驟 5: JavaScript 錯誤分析');
  console.log('🐛 Console 訊息統計:');
  
  const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
  const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');
  
  console.log(`   - 錯誤: ${errorMessages.length} 個`);
  console.log(`   - 警告: ${warningMessages.length} 個`);
  console.log(`   - 總訊息: ${consoleMessages.length} 個`);

  // 詳細列出錯誤
  if (errorMessages.length > 0) {
    console.log('❌ JavaScript 錯誤詳情:');
    errorMessages.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.text}`);
      console.log(`      位置: ${error.location?.url || 'N/A'}:${error.location?.lineNumber || 'N/A'}`);
    });
  }

  // 步驟 6: 檢查網路請求狀態
  console.log('📍 步驟 6: 網路請求分析');
  console.log(`🌐 總請求數: ${networkRequests.length}`);
  console.log(`❌ 失敗請求: ${networkErrors.length}`);

  if (networkErrors.length > 0) {
    console.log('🚨 網路錯誤詳情:');
    networkErrors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.url}`);
      console.log(`      狀態: ${error.status} ${error.statusText}`);
    });
  }

  // 檢查關鍵 API 請求
  const apiRequests = networkRequests.filter(req => req.url.includes('/api/'));
  console.log(`🔌 API 請求數: ${apiRequests.length}`);
  
  if (apiRequests.length > 0) {
    console.log('📡 API 請求詳情:');
    apiRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.method} ${req.url}`);
    });
  }

  // 步驟 7: 檢查 DOM 結構
  console.log('📍 步驟 7: DOM 結構分析');
  
  // 檢查頁面標題
  const pageTitle = await page.title();
  console.log(`📄 頁面標題: ${pageTitle}`);

  // 檢查主要容器
  const mainContainer = await page.locator('main, .main-content, #app').count();
  console.log(`🏠 主容器數量: ${mainContainer}`);

  // 檢查 Alpine.js 初始化
  const alpineElements = await page.locator('[x-data]').count();
  console.log(`🏔️ Alpine.js 元素數量: ${alpineElements}`);

  // 步驟 8: 等待更長時間檢查延遲載入
  console.log('📍 步驟 8: 等待延遲載入 (10秒)');
  await page.waitForTimeout(10000);
  
  // 再次檢查載入狀態
  const finalLoadingText = await page.locator('text=載入儀表板數據中').count();
  const finalStatsCards = await page.locator('.bg-white.rounded-lg.shadow').count();
  const finalChartContainers = await page.locator('canvas').count();
  
  console.log(`🔄 最終載入狀態: ${finalLoadingText}`);
  console.log(`📊 最終統計卡片: ${finalStatsCards}`);
  console.log(`📈 最終圖表畫布: ${finalChartContainers}`);

  // 最終截圖
  await page.screenshot({ 
    path: 'dashboard-diagnosis-03-final-state.png',
    fullPage: true 
  });

  // 步驟 9: 嘗試手動觸發載入 (如果還在載入中)
  if (finalLoadingText > 0) {
    console.log('📍 步驟 9: 嘗試手動觸發載入');
    
    // 嘗試重新整理頁面
    await page.reload();
    await page.waitForTimeout(5000);
    
    // 檢查重新整理後的狀態
    const reloadedLoadingText = await page.locator('text=載入儀表板數據中').count();
    const reloadedStatsCards = await page.locator('.bg-white.rounded-lg.shadow').count();
    
    console.log(`🔄 重新整理後載入狀態: ${reloadedLoadingText}`);
    console.log(`📊 重新整理後統計卡片: ${reloadedStatsCards}`);
    
    await page.screenshot({ 
      path: 'dashboard-diagnosis-04-after-reload.png',
      fullPage: true 
    });
  }

  // 步驟 10: 生成診斷報告
  console.log('📍 步驟 10: 生成診斷報告');
  
  const diagnosticReport = {
    timestamp: new Date().toISOString(),
    pageTitle: pageTitle,
    loadingState: {
      initial: loadingText,
      final: finalLoadingText,
      stillLoading: finalLoadingText > 0
    },
    elements: {
      statsCards: finalStatsCards,
      chartContainers: finalChartContainers,
      alpineElements: alpineElements,
      mainContainers: mainContainer
    },
    errors: {
      jsErrors: errorMessages.length,
      networkErrors: networkErrors.length,
      totalConsoleMessages: consoleMessages.length
    },
    requests: {
      total: networkRequests.length,
      apiRequests: apiRequests.length,
      failedRequests: networkErrors.length
    },
    detailedErrors: {
      jsErrors: errorMessages,
      networkErrors: networkErrors
    }
  };

  console.log('📋 === 診斷報告 ===');
  console.log(JSON.stringify(diagnosticReport, null, 2));

  // 判定問題嚴重程度
  let severity = '🟢 正常';
  let issues = [];

  if (finalLoadingText > 0) {
    severity = '🔴 嚴重';
    issues.push('頁面卡在載入狀態');
  }

  if (errorMessages.length > 0) {
    severity = severity === '🟢 正常' ? '🟡 警告' : severity;
    issues.push(`發現 ${errorMessages.length} 個 JavaScript 錯誤`);
  }

  if (networkErrors.length > 0) {
    severity = severity === '🟢 正常' ? '🟡 警告' : severity;
    issues.push(`發現 ${networkErrors.length} 個網路錯誤`);
  }

  if (finalStatsCards === 0) {
    severity = '🔴 嚴重';
    issues.push('統計卡片未載入');
  }

  console.log(`🎯 問題嚴重程度: ${severity}`);
  if (issues.length > 0) {
    console.log('⚠️ 發現的問題:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  console.log('🏁 === 診斷測試完成 ===');
});