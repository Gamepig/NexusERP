import { test, expect } from '@playwright/test';

test.describe('儀表板完整診斷（含登入）', () => {
  test('登入後檢查儀表板功能', async ({ page }) => {
    console.log('開始完整儀表板診斷（含登入）...');

    // 設置控制台和錯誤監聽
    const consoleMessages = [];
    const networkRequests = [];
    const errors = [];

    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
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

    // Step 1: 導航到儀表板（會自動重定向到登入頁面）
    await page.goto('http://127.0.0.1:8000/dashboard');
    console.log('已導航到儀表板頁面');

    // 等待頁面載入
    await page.waitForTimeout(2000);

    // 檢查是否被重定向到登入頁面
    const currentUrl = page.url();
    console.log(`當前URL: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('✓ 正確重定向到登入頁面');

      // Step 2: 進行登入
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      console.log('已填入登入資訊');
      
      // 點擊登入按鈕
      await page.click('button[type="submit"]');
      console.log('已點擊登入按鈕');

      // 等待登入處理
      await page.waitForTimeout(3000);

      // 檢查登入後的URL
      const afterLoginUrl = page.url();
      console.log(`登入後URL: ${afterLoginUrl}`);

      if (afterLoginUrl.includes('/dashboard')) {
        console.log('✓ 登入成功，已重定向到儀表板');

        // Step 3: 檢查儀表板載入狀態
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

        // Step 4: 手動檢查 API 請求（已登入狀態）
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

        console.log('已登入狀態的 API 響應詳情:');
        console.log('狀態:', apiResponse.status);
        console.log('狀態文字:', apiResponse.statusText);
        console.log('響應體:', apiResponse.body.substring(0, 200) + '...');
        
        if (apiResponse.error) {
          console.log('API 錯誤:', apiResponse.error);
        }

        // Step 5: 檢查 dashboard-loaded 事件
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

        // Step 6: 嘗試手動切換載入狀態
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

        // Step 7: 檢查頁面最終狀態
        await page.waitForTimeout(2000);
        
        const finalLoadingState = await page.locator('#loading-overlay').isVisible();
        const finalContentState = await page.locator('#main-content').isVisible();
        
        console.log(`最終載入覆蓋層狀態: ${finalLoadingState}`);
        console.log(`最終主要內容狀態: ${finalContentState}`);

        // 截圖記錄最終狀態
        await page.screenshot({ 
          path: 'dashboard-complete-diagnosis-result.png',
          fullPage: true 
        });

      } else {
        console.log('✗ 登入失敗或未正確重定向');
        await page.screenshot({ 
          path: 'dashboard-login-failed.png',
          fullPage: true 
        });
      }
    } else {
      console.log('✗ 未正確重定向到登入頁面');
    }

    // 總結診斷結果
    console.log('\n=== 完整診斷總結 ===');
    console.log(`控制台訊息數量: ${consoleMessages.length}`);
    console.log(`API 請求數量: ${networkRequests.length}`);
    console.log(`JavaScript 錯誤數量: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\nJavaScript 錯誤:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    if (consoleMessages.length > 0) {
      console.log('\n重要控制台訊息:');
      consoleMessages.slice(-10).forEach(msg => console.log(`  - ${msg}`));
    }
  });
});