import { test, expect } from '@playwright/test';

test.describe('儀表板深入診斷', () => {
  test('診斷儀表板載入問題', async ({ page }) => {
    console.log('開始診斷儀表板載入問題...');

    // 設置控制台和錯誤監聽
    const consoleMessages = [];
    const networkRequests = [];
    const errors = [];

    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });

    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });

    page.on('response', response => {
      if (response.url().includes('/api/dashboard')) {
        console.log(`API響應狀態: ${response.status()}`);
        console.log(`API響應URL: ${response.url()}`);
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`頁面錯誤: ${error.message}`);
    });

    // 導航到儀表板
    await page.goto('http://127.0.0.1:8000/dashboard');
    console.log('已導航到儀表板頁面');

    // 等待頁面載入
    await page.waitForTimeout(5000);

    // 檢查 dashboardManager 是否存在
    const dashboardManagerExists = await page.evaluate(() => {
      return typeof window.dashboardManager !== 'undefined';
    });
    console.log(`window.dashboardManager 存在: ${dashboardManagerExists}`);

    if (dashboardManagerExists) {
      // 檢查 dashboardManager 的狀態
      const dashboardManagerState = await page.evaluate(() => {
        if (window.dashboardManager) {
          return {
            hasInit: typeof window.dashboardManager.init === 'function',
            hasLoadData: typeof window.dashboardManager.loadData === 'function',
            hasToggleLoading: typeof window.dashboardManager.toggleLoading === 'function'
          };
        }
        return null;
      });
      console.log('DashboardManager 狀態:', JSON.stringify(dashboardManagerState, null, 2));
    }

    // 檢查載入狀態
    const loadingElement = await page.locator('#loading-overlay').isVisible();
    console.log(`載入覆蓋層可見: ${loadingElement}`);

    // 檢查主要內容
    const contentElement = await page.locator('#main-content').isVisible();
    console.log(`主要內容可見: ${contentElement}`);

    // 手動檢查 API 請求
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        const status = response.status;
        const text = await response.text();
        
        return {
          status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: text,
          ok: response.ok
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });

    console.log('API 響應詳情:');
    console.log('狀態:', apiResponse.status);
    console.log('狀態文字:', apiResponse.statusText);
    console.log('響應體:', apiResponse.body);
    
    if (apiResponse.error) {
      console.log('API 錯誤:', apiResponse.error);
    }

    // 檢查 dashboard-loaded 事件
    const eventCheck = await page.evaluate(() => {
      return new Promise((resolve) => {
        let eventFired = false;
        
        // 監聽 dashboard-loaded 事件
        document.addEventListener('dashboard-loaded', () => {
          eventFired = true;
          resolve(true);
        });
        
        // 手動觸發載入（如果可能）
        if (window.dashboardManager && typeof window.dashboardManager.loadData === 'function') {
          window.dashboardManager.loadData();
        }
        
        // 5秒後超時
        setTimeout(() => {
          resolve(eventFired);
        }, 5000);
      });
    });

    console.log(`dashboard-loaded 事件是否觸發: ${eventCheck}`);

    // 嘗試手動切換載入狀態
    const manualToggleResult = await page.evaluate(() => {
      if (window.dashboardManager && typeof window.dashboardManager.toggleLoading === 'function') {
        try {
          window.dashboardManager.toggleLoading(false);
          return '成功切換載入狀態';
        } catch (error) {
          return `切換載入狀態失敗: ${error.message}`;
        }
      }
      return 'dashboardManager.toggleLoading 不可用';
    });

    console.log('手動切換結果:', manualToggleResult);

    // 截圖記錄最終狀態
    await page.screenshot({ 
      path: 'dashboard-diagnosis-result.png',
      fullPage: true 
    });

    // 總結診斷結果
    console.log('\n=== 診斷總結 ===');
    console.log(`控制台訊息數量: ${consoleMessages.length}`);
    console.log(`網路請求數量: ${networkRequests.length}`);
    console.log(`JavaScript 錯誤數量: ${errors.length}`);
    console.log(`API 響應狀態: ${apiResponse.status}`);
    console.log(`載入覆蓋層可見: ${loadingElement}`);
    console.log(`主要內容可見: ${contentElement}`);

    if (errors.length > 0) {
      console.log('\nJavaScript 錯誤:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    if (consoleMessages.length > 0) {
      console.log('\n控制台訊息:');
      consoleMessages.forEach(msg => console.log(`  - ${msg}`));
    }
  });
});