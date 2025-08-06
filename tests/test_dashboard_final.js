import { chromium } from 'playwright';

async function testDashboardFinal() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 監聽控制台訊息
  page.on('console', (msg) => {
    if (msg.text().includes('[Dashboard]')) {
      console.log('🎯 Dashboard Log:', msg.text());
    }
  });

  // 監聽錯誤
  page.on('pageerror', (error) => {
    console.error('❌ Page Error:', error.message);
  });

  try {
    console.log('🔄 Step 1: 清除快取並導航到儀表板...');
    
    // 清除快取
    await context.clearCookies();
    await context.clearPermissions();
    
    // 導航到儀表板
    await page.goto('http://127.0.0.1:8000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('⏱️ Step 2: 等待 10 秒讓 JavaScript 完全執行...');
    await page.waitForTimeout(10000);

    console.log('🔍 Step 3: 檢查載入指示器狀態...');
    
    // 檢查載入指示器是否已隱藏
    const loadingIndicator = await page.$('#dashboard-loading');
    const isLoadingHidden = loadingIndicator ? await loadingIndicator.isHidden() : true;
    console.log('📊 載入指示器已隱藏:', isLoadingHidden);

    // 檢查內容容器是否可見
    const contentDiv = await page.$('#dashboard-content');
    const isContentVisible = contentDiv ? await contentDiv.isVisible() : false;
    console.log('📊 內容容器可見:', isContentVisible);

    console.log('🔍 Step 4: 檢查統計卡片...');
    
    // 檢查統計卡片
    const statCards = await page.$$('.stat-card');
    console.log('📊 統計卡片數量:', statCards.length);
    
    for (let i = 0; i < statCards.length; i++) {
      const isVisible = await statCards[i].isVisible();
      const text = await statCards[i].textContent();
      console.log(`📊 統計卡片 ${i + 1} 可見: ${isVisible}, 內容: ${text?.substring(0, 50)}...`);
    }

    console.log('🔍 Step 5: 檢查圖表容器...');
    
    // 檢查圖表
    const chartContainers = await page.$$('[id*="chart"], .chart-container');
    console.log('📊 圖表容器數量:', chartContainers.length);
    
    for (let i = 0; i < chartContainers.length; i++) {
      const isVisible = await chartContainers[i].isVisible();
      const id = await chartContainers[i].getAttribute('id');
      console.log(`📊 圖表容器 ${i + 1} (${id}) 可見: ${isVisible}`);
    }

    console.log('🔍 Step 6: 檢查快速操作按鈕...');
    
    // 檢查快速操作
    const quickActions = await page.$$('.quick-action, .btn');
    console.log('📊 快速操作按鈕數量:', quickActions.length);
    
    let visibleActions = 0;
    for (const action of quickActions) {
      const isVisible = await action.isVisible();
      if (isVisible) visibleActions++;
    }
    console.log('📊 可見快速操作按鈕:', visibleActions);

    console.log('🔍 Step 7: 檢查頁面完整性...');
    
    // 檢查頁面標題
    const title = await page.title();
    console.log('📊 頁面標題:', title);
    
    // 檢查是否有錯誤訊息
    const errorElements = await page.$$('.alert-danger, .error');
    console.log('📊 錯誤訊息數量:', errorElements.length);

    // 執行最終狀態檢查
    const finalCheck = await page.evaluate(() => {
      const loading = document.getElementById('dashboard-loading');
      const content = document.getElementById('dashboard-content');
      
      return {
        loadingDisplay: loading ? window.getComputedStyle(loading).display : 'none',
        contentDisplay: content ? window.getComputedStyle(content).display : 'none',
        bodyClass: document.body.className,
        dashboardReadyEvent: window.dashboardReady || false
      };
    });
    
    console.log('📊 最終狀態檢查:', JSON.stringify(finalCheck, null, 2));

    // 總結測試結果
    console.log('\n🎯 ===== 儀表板最終驗證結果 =====');
    console.log('✅ 載入指示器已隱藏:', isLoadingHidden);
    console.log('✅ 內容容器可見:', isContentVisible);
    console.log('✅ 統計卡片數量:', statCards.length);
    console.log('✅ 圖表容器數量:', chartContainers.length);
    console.log('✅ 可見快速操作:', visibleActions);
    console.log('✅ 錯誤數量:', errorElements.length);
    console.log('✅ 最終載入狀態:', finalCheck.loadingDisplay === 'none' ? '隱藏' : '顯示');
    console.log('✅ 最終內容狀態:', finalCheck.contentDisplay !== 'none' ? '顯示' : '隱藏');

    // 判斷測試是否成功
    const testSuccess = isLoadingHidden && isContentVisible && statCards.length > 0 && errorElements.length === 0;
    console.log('\n🏆 整體測試結果:', testSuccess ? '✅ 成功' : '❌ 失敗');

    await page.waitForTimeout(5000); // 等待 5 秒以便觀察

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
}

testDashboardFinal().catch(console.error);