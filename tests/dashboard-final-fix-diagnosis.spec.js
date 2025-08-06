import { test, expect } from '@playwright/test';

test.describe('儀表板最終修復診斷', () => {
  test('完整診斷儀表板載入狀態機制', async ({ page }) => {
    console.log('開始儀表板最終修復診斷...');

    // 設置控制台和錯誤監聽
    const consoleMessages = [];
    const errors = [];

    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`頁面錯誤: ${error.message}`);
    });

    // Step 1: 導航並登入
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }

    // Step 2: 檢查實際的載入元素
    console.log('\n=== 檢查實際載入元素 ===');
    
    // 檢查正確的載入和內容元素
    const dashboardLoadingVisible = await page.locator('#dashboardLoading').isVisible();
    const dashboardStatsVisible = await page.locator('#dashboardStats').isVisible();
    const dashboardErrorVisible = await page.locator('#dashboardError').isVisible();
    
    console.log(`dashboardLoading 可見: ${dashboardLoadingVisible}`);
    console.log(`dashboardStats 可見: ${dashboardStatsVisible}`);
    console.log(`dashboardError 可見: ${dashboardErrorVisible}`);

    // Step 3: 檢查 stateManager 是否存在
    const stateManagerCheck = await page.evaluate(() => {
      return {
        dashboardComponentsExists: typeof window.dashboardComponents !== 'undefined',
        stateManagerExists: window.dashboardComponents && typeof window.dashboardComponents.stateManager !== 'undefined',
        stateManagerMethods: window.dashboardComponents?.stateManager ? Object.keys(window.dashboardComponents.stateManager) : null
      };
    });
    
    console.log('\nStateManager 狀態:');
    console.log(JSON.stringify(stateManagerCheck, null, 2));

    // Step 4: 檢查 dashboard-loaded 事件是否觸發
    const eventTriggered = await page.evaluate(() => {
      return new Promise((resolve) => {
        let loadedEventFired = false;
        let loadingStartEventFired = false;
        
        // 監聽所有相關事件
        document.addEventListener('dashboard-loaded', (e) => {
          console.log('[Test] dashboard-loaded 事件觸發:', e.detail);
          loadedEventFired = true;
        });
        
        document.addEventListener('dashboard-loading-start', (e) => {
          console.log('[Test] dashboard-loading-start 事件觸發');
          loadingStartEventFired = true;
        });
        
        // 10秒後回報結果
        setTimeout(() => {
          resolve({ loadedEventFired, loadingStartEventFired });
        }, 10000);
      });
    });

    console.log(`\nDashboard 事件狀態:`, eventTriggered);

    // Step 5: 手動觸發 stateManager 方法
    console.log('\n=== 測試手動狀態切換 ===');
    
    if (stateManagerCheck.stateManagerExists) {
      // 測試手動顯示內容
      const manualShowContent = await page.evaluate(() => {
        try {
          if (window.dashboardComponents?.stateManager?.showContent) {
            window.dashboardComponents.stateManager.showContent();
            return '成功執行 showContent()';
          }
          return 'showContent 方法不存在';
        } catch (error) {
          return `執行 showContent() 失敗: ${error.message}`;
        }
      });
      
      console.log('手動 showContent 結果:', manualShowContent);
      
      // 等待狀態更新
      await page.waitForTimeout(2000);
      
      // 再次檢查狀態
      const afterManualCheck = {
        dashboardLoadingVisible: await page.locator('#dashboardLoading').isVisible(),
        dashboardStatsVisible: await page.locator('#dashboardStats').isVisible(),
        dashboardErrorVisible: await page.locator('#dashboardError').isVisible()
      };
      
      console.log('手動切換後狀態:', afterManualCheck);
    }

    // Step 6: 檢查具體的 CSS 類別
    const elementClasses = await page.evaluate(() => {
      const elements = {
        dashboardLoading: document.getElementById('dashboardLoading'),
        dashboardStats: document.getElementById('dashboardStats'), 
        dashboardError: document.getElementById('dashboardError')
      };
      
      return {
        dashboardLoading: elements.dashboardLoading ? {
          exists: true,
          classes: elements.dashboardLoading.className,
          hidden: elements.dashboardLoading.classList.contains('hidden')
        } : { exists: false },
        dashboardStats: elements.dashboardStats ? {
          exists: true,
          classes: elements.dashboardStats.className,
          hidden: elements.dashboardStats.classList.contains('hidden')
        } : { exists: false },
        dashboardError: elements.dashboardError ? {
          exists: true,
          classes: elements.dashboardError.className,
          hidden: elements.dashboardError.classList.contains('hidden')
        } : { exists: false }
      };
    });
    
    console.log('\n=== 元素 CSS 類別詳情 ===');
    console.log(JSON.stringify(elementClasses, null, 2));

    // Step 7: 截圖記錄最終狀態
    await page.screenshot({ 
      path: 'dashboard-final-fix-diagnosis-result.png',
      fullPage: true 
    });

    // Step 8: 檢查 DashboardManager 狀態
    const dashboardManagerStatus = await page.evaluate(() => {
      if (window.dashboardManager) {
        return {
          exists: true,
          isLoading: window.dashboardManager.isLoading,
          statistics: window.dashboardManager.statistics ? window.dashboardManager.statistics.size : 0,
          charts: window.dashboardManager.charts ? window.dashboardManager.charts.size : 0,
          lastUpdate: window.dashboardManager.lastUpdate
        };
      }
      return { exists: false };
    });
    
    console.log('\nDashboardManager 狀態:', JSON.stringify(dashboardManagerStatus, null, 2));

    // 總結診斷結果
    console.log('\n=== 最終診斷總結 ===');
    console.log(`控制台訊息數量: ${consoleMessages.length}`);
    console.log(`JavaScript 錯誤數量: ${errors.length}`);
    console.log(`StateManager 存在: ${stateManagerCheck.stateManagerExists}`);
    console.log(`DashboardManager 存在: ${dashboardManagerStatus.exists}`);
    console.log(`載入中狀態: ${elementClasses.dashboardLoading?.hidden === false}`);
    console.log(`內容顯示狀態: ${elementClasses.dashboardStats?.hidden === false}`);
    
    // 重要發現
    if (elementClasses.dashboardLoading?.hidden === false && elementClasses.dashboardStats?.hidden === true) {
      console.log('\n🔥 核心問題：儀表板卡在載入狀態');
      console.log('   原因：stateManager.showContent() 沒有被正確觸發');
      console.log('   解決方案：修復 dashboard-loaded 事件處理或手動觸發 showContent()');
    }

    if (errors.length > 0) {
      console.log('\nJavaScript 錯誤:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
  });
});