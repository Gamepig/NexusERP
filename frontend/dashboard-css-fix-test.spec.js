import { test, expect } from '@playwright/test';

test.describe('儀表板 CSS 修復測試', () => {
  test('測試 CSS 特定性修復是否解決載入狀態顯示問題', async ({ page }) => {
    console.log('🛠️ 開始測試 CSS 特定性修復...');
    
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
    
    // 3. 等待頁面完全載入
    await page.waitForTimeout(3000);
    
    // 4. 檢查載入狀態
    const loadingElement = page.locator('#dashboardLoading');
    const statsElement = page.locator('#dashboardStats');
    
    // 取得元素的 class 和 computed style
    const loadingInfo = await page.evaluate(() => {
      const el = document.getElementById('dashboardLoading');
      if (!el) return null;
      
      const computedStyle = window.getComputedStyle(el);
      return {
        classList: Array.from(el.classList),
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        offsetWidth: el.offsetWidth,
        offsetHeight: el.offsetHeight,
        isVisible: el.offsetWidth > 0 && el.offsetHeight > 0
      };
    });
    
    const statsInfo = await page.evaluate(() => {
      const el = document.getElementById('dashboardStats');
      if (!el) return null;
      
      const computedStyle = window.getComputedStyle(el);
      return {
        classList: Array.from(el.classList),
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        offsetWidth: el.offsetWidth,
        offsetHeight: el.offsetHeight,
        isVisible: el.offsetWidth > 0 && el.offsetHeight > 0
      };
    });
    
    console.log('🔍 載入元素詳細狀態:');
    console.log(JSON.stringify(loadingInfo, null, 2));
    
    console.log('🔍 統計元素詳細狀態:');
    console.log(JSON.stringify(statsInfo, null, 2));
    
    // 5. 使用 Playwright 的可見性檢查
    const loadingVisible = await loadingElement.isVisible();
    const statsVisible = await statsElement.isVisible();
    
    console.log('📊 Playwright 可見性檢查:');
    console.log(`- 載入元素可見: ${loadingVisible}`);
    console.log(`- 統計元素可見: ${statsVisible}`);
    
    // 6. 驗證修復效果
    if (loadingInfo && loadingInfo.classList.includes('hidden')) {
      console.log('✅ 載入元素包含 hidden 類別');
      
      if (loadingInfo.display === 'none') {
        console.log('✅ CSS 修復生效：display 為 none');
      } else {
        console.log(`❌ CSS 修復未生效：display 為 ${loadingInfo.display}`);
      }
      
      if (!loadingInfo.isVisible) {
        console.log('✅ 載入元素實際不可見');
      } else {
        console.log('❌ 載入元素仍然可見');
      }
    }
    
    // 7. 檢查統計內容是否正常顯示
    const statCards = await page.locator('[data-stat]').all();
    console.log(`📈 找到 ${statCards.length} 個統計卡片`);
    
    if (statCards.length > 0) {
      const firstCardVisible = await statCards[0].isVisible();
      console.log(`📊 第一個統計卡片可見: ${firstCardVisible}`);
    }
    
    // 8. 截圖記錄修復結果
    await page.screenshot({ 
      path: 'screenshots/dashboard-css-fix-result.png', 
      fullPage: true 
    });
    
    // 9. 最終驗證
    console.log('🎯 最終驗證結果:');
    
    if (loadingInfo && loadingInfo.classList.includes('hidden') && loadingInfo.display === 'none' && !loadingVisible) {
      console.log('✅ CSS 修復成功！載入狀態已正確隱藏');
    } else {
      console.log('❌ CSS 修復未完全生效，需要進一步調查');
    }
    
    if (statsVisible && statCards.length > 0) {
      console.log('✅ 儀表板內容正常顯示');
    } else {
      console.log('❌ 儀表板內容顯示異常');
    }
    
    // 10. 斷言驗證
    expect(loadingVisible).toBe(false);
    expect(statsVisible).toBe(true);
    
    console.log('🎉 CSS 修復測試完成');
  });
});