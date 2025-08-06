import { chromium } from 'playwright';

async function finalDashboardTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 監聽控制台訊息
  page.on('console', (msg) => {
    if (msg.text().includes('[Dashboard]') || msg.text().includes('[DashboardManager]')) {
      console.log('🎯 Dashboard Log:', msg.text());
    }
  });

  // 監聽錯誤
  page.on('pageerror', (error) => {
    console.error('❌ Page Error:', error.message);
  });

  try {
    console.log('🚀 執行儀表板最終驗證測試...');
    
    // 步驟 1: 登入並導航到儀表板
    console.log('🔐 Step 1: 登入系統...');
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // 確保在儀表板頁面
    if (!page.url().includes('/dashboard')) {
      await page.goto('http://127.0.0.1:8000/dashboard');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('📍 當前 URL:', page.url());
    
    // 步驟 2: 等待 JavaScript 完全執行
    console.log('⏱️ Step 2: 等待 10 秒讓所有 JavaScript 完全執行...');
    await page.waitForTimeout(10000);
    
    // 步驟 3: 檢查正確的儀表板元素狀態
    console.log('🔍 Step 3: 檢查儀表板元素狀態...');
    
    const dashboardState = await page.evaluate(() => {
      const loading = document.getElementById('dashboardLoading');
      const stats = document.getElementById('dashboardStats');
      const error = document.getElementById('dashboardError');
      
      return {
        loading: {
          exists: !!loading,
          visible: loading ? !loading.classList.contains('hidden') : false,
          display: loading ? window.getComputedStyle(loading).display : 'none'
        },
        stats: {
          exists: !!stats,
          visible: stats ? !stats.classList.contains('hidden') : false,
          display: stats ? window.getComputedStyle(stats).display : 'none'
        },
        error: {
          exists: !!error,
          visible: error ? !error.classList.contains('hidden') : false,
          display: error ? window.getComputedStyle(error).display : 'none'
        }
      };
    });
    
    console.log('📊 儀表板狀態檢查:', JSON.stringify(dashboardState, null, 2));
    
    // 步驟 4: 檢查統計卡片
    console.log('🔍 Step 4: 檢查統計卡片...');
    
    const statCards = await page.$$('[data-stat]');
    console.log('📊 統計卡片數量:', statCards.length);
    
    let visibleStatCards = 0;
    for (const card of statCards) {
      const isVisible = await card.isVisible();
      if (isVisible) visibleStatCards++;
      
      const statKey = await card.getAttribute('data-stat');
      const cardHTML = await card.innerHTML();
      const hasValue = cardHTML.includes('stat-value');
      
      console.log(`📊 卡片 ${statKey}: 可見=${isVisible}, 有數值=${hasValue}`);
    }
    
    console.log('📊 可見統計卡片總數:', visibleStatCards);
    
    // 步驟 5: 檢查圖表
    console.log('🔍 Step 5: 檢查圖表...');
    
    const charts = await page.$$('canvas[id*="Chart"]');
    console.log('📊 圖表畫布數量:', charts.length);
    
    let visibleCharts = 0;
    for (const chart of charts) {
      const isVisible = await chart.isVisible();
      if (isVisible) visibleCharts++;
      
      const chartId = await chart.getAttribute('id');
      console.log(`📊 圖表 ${chartId}: 可見=${isVisible}`);
    }
    
    console.log('📊 可見圖表總數:', visibleCharts);
    
    // 步驟 6: 檢查快速操作
    console.log('🔍 Step 6: 檢查快速操作...');
    
    const quickActions = await page.$('#quickActions');
    const quickActionsVisible = quickActions ? await quickActions.isVisible() : false;
    const quickActionsContent = quickActions ? await quickActions.innerHTML() : '';
    const hasQuickActionItems = quickActionsContent.includes('quick-action-card');
    
    console.log('📊 快速操作區域可見:', quickActionsVisible);
    console.log('📊 快速操作有內容:', hasQuickActionItems);
    console.log('📊 快速操作內容長度:', quickActionsContent.length);
    
    // 步驟 7: 檢查頁面更新時間
    console.log('🔍 Step 7: 檢查其他狀態...');
    
    const lastUpdateTime = await page.$eval('#lastUpdateTime', el => el.textContent).catch(() => '未找到');
    console.log('📊 最後更新時間:', lastUpdateTime);
    
    // 步驟 8: 總結測試結果
    console.log('\n🎯 ===== 儀表板最終驗證結果 =====');
    console.log('✅ 載入元素狀態:', dashboardState.loading.visible ? '顯示' : '隱藏');
    console.log('✅ 統計內容狀態:', dashboardState.stats.visible ? '顯示' : '隱藏');
    console.log('✅ 錯誤狀態:', dashboardState.error.visible ? '顯示' : '隱藏');
    console.log('✅ 統計卡片數量:', visibleStatCards, '/', statCards.length);
    console.log('✅ 圖表數量:', visibleCharts, '/', charts.length);
    console.log('✅ 快速操作可見:', quickActionsVisible);
    console.log('✅ 最後更新時間:', lastUpdateTime);
    
    // 判斷測試是否成功
    const testSuccess = 
      !dashboardState.loading.visible && // 載入狀態已隱藏
      dashboardState.stats.visible && // 統計內容已顯示
      !dashboardState.error.visible && // 錯誤狀態已隱藏
      visibleStatCards >= 6 && // 至少有6個統計卡片
      visibleCharts >= 3 && // 至少有3個圖表
      quickActionsVisible && // 快速操作可見
      !lastUpdateTime.includes('載入中'); // 更新時間不是載入狀態
    
    console.log('\n🏆 整體測試結果:', testSuccess ? '✅ 成功 - 儀表板完全正常！' : '❌ 需要檢查');
    
    if (testSuccess) {
      console.log('🎉 恭喜！儀表板狀態切換和所有功能都正常運作！');
      console.log('🔧 所有強化的備用方案都在正常工作');
      console.log('📊 數據載入、圖表渲染、狀態管理都正常');
    } else {
      console.log('⚠️ 某些功能可能需要進一步檢查');
    }
    
    // 保持頁面開啟以便觀察
    console.log('\n🔍 保持頁面開啟 10 秒以便觀察...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
}

finalDashboardTest().catch(console.error);