import { test, expect } from '@playwright/test';

test.describe('儀表板載入狀態詳細診斷', () => {
  test('診斷載入狀態顯示的原因', async ({ page }) => {
    console.log('🔍 開始詳細診斷載入狀態問題...');
    
    // 監聽所有控制台訊息
    const consoleLogs = [];
    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // 1. 訪問登入頁面
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 2. 登入
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待導向儀表板
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✅ 成功登入並導向儀表板');
    
    // 3. 等待頁面載入完成
    await page.waitForTimeout(1000);
    
    // 4. 檢查載入狀態元素的初始狀態
    console.log('🔍 檢查載入狀態元素的初始狀態...');
    
    const loadingElement = page.locator('#dashboardLoading');
    const statsElement = page.locator('#dashboardStats');
    const errorElement = page.locator('#dashboardError');
    
    // 取得元素的 class 屬性
    const loadingClasses = await loadingElement.getAttribute('class') || '';
    const statsClasses = await statsElement.getAttribute('class') || '';
    const errorClasses = await errorElement.getAttribute('class') || '';
    
    console.log('初始元素狀態:');
    console.log(`- 載入元素: class="${loadingClasses}"`);
    console.log(`- 統計元素: class="${statsClasses}"`);
    console.log(`- 錯誤元素: class="${errorClasses}"`);
    
    // 檢查元素可見性
    const loadingVisible = await loadingElement.isVisible();
    const statsVisible = await statsElement.isVisible(); 
    const errorVisible = await errorElement.isVisible();
    
    console.log('初始可見性:');
    console.log(`- 載入元素可見: ${loadingVisible}`);
    console.log(`- 統計元素可見: ${statsVisible}`);
    console.log(`- 錯誤元素可見: ${errorVisible}`);
    
    // 5. 等待一段時間觀察變化
    console.log('⏳ 等待5秒觀察狀態變化...');
    await page.waitForTimeout(5000);
    
    // 再次檢查狀態
    const loadingClasses2 = await loadingElement.getAttribute('class') || '';
    const statsClasses2 = await statsElement.getAttribute('class') || '';
    const errorClasses2 = await errorElement.getAttribute('class') || '';
    
    const loadingVisible2 = await loadingElement.isVisible();
    const statsVisible2 = await statsElement.isVisible();
    const errorVisible2 = await errorElement.isVisible();
    
    console.log('5秒後元素狀態:');
    console.log(`- 載入元素: class="${loadingClasses2}" 可見=${loadingVisible2}`);
    console.log(`- 統計元素: class="${statsClasses2}" 可見=${statsVisible2}`);
    console.log(`- 錯誤元素: class="${errorClasses2}" 可見=${errorVisible2}`);
    
    // 6. 檢查 JavaScript 控制台訊息
    console.log('📋 JavaScript 控制台訊息:');
    consoleLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
    
    // 7. 檢查是否有 DashboardManager 相關的錯誤
    const dashboardErrors = consoleLogs.filter(log => 
      log.includes('DashboardManager') || 
      log.includes('dashboard') ||
      log.includes('API') ||
      log.includes('載入') ||
      log.includes('error')
    );
    
    console.log('🚨 儀表板相關訊息:');
    dashboardErrors.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
    
    // 8. 檢查網路請求
    console.log('🌐 檢查 API 請求狀態...');
    
    // 手動觸發 API 請求來檢查
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/dashboard', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          credentials: 'include'
        });
        
        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          data: response.ok ? await response.json() : null
        };
      } catch (error) {
        return {
          ok: false,
          error: error.message
        };
      }
    });
    
    console.log('API 響應:', apiResponse);
    
    // 9. 檢查 DOM 操作函數是否正常
    console.log('🔧 檢查 DOM 操作函數...');
    
    const domCheckResult = await page.evaluate(() => {
      const checkResult = {
        dashboardManager: typeof window.dashboardManager !== 'undefined',
        dashboardComponents: typeof window.dashboardComponents !== 'undefined',
        showLoadingExists: false,
        hideLoadingExists: false
      };
      
      if (window.dashboardComponents && window.dashboardComponents.stateManager) {
        checkResult.showLoadingExists = typeof window.dashboardComponents.stateManager.showLoading === 'function';
        checkResult.hideLoadingExists = typeof window.dashboardComponents.stateManager.showContent === 'function';
      }
      
      return checkResult;
    });
    
    console.log('DOM 功能檢查:', domCheckResult);
    
    // 10. 手動測試狀態切換
    console.log('🔄 手動測試狀態切換...');
    
    await page.evaluate(() => {
      const loadingEl = document.getElementById('dashboardLoading');
      const statsEl = document.getElementById('dashboardStats');
      
      console.log('[Manual Test] 手動隱藏載入狀態...');
      if (loadingEl) {
        loadingEl.classList.add('hidden');
        console.log('[Manual Test] 載入狀態已隱藏');
      }
      
      if (statsEl) {
        statsEl.classList.remove('hidden');
        console.log('[Manual Test] 統計內容已顯示');
      }
    });
    
    // 等待一下讓變化生效
    await page.waitForTimeout(1000);
    
    // 最終檢查
    const finalLoadingVisible = await loadingElement.isVisible();
    const finalStatsVisible = await statsElement.isVisible();
    
    console.log('手動切換後狀態:');
    console.log(`- 載入元素可見: ${finalLoadingVisible}`);
    console.log(`- 統計元素可見: ${finalStatsVisible}`);
    
    // 11. 截圖記錄
    await page.screenshot({ 
      path: 'screenshots/dashboard-detailed-diagnosis-final.png', 
      fullPage: true 
    });
    
    console.log('✅ 詳細診斷完成');
    
    // 12. 驗證修復是否生效
    if (finalLoadingVisible) {
      console.log('❌ 載入狀態仍然顯示，需要進一步修復');
    } else {
      console.log('✅ 載入狀態已正確隱藏');
    }
  });
});