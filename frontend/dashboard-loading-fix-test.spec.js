import { test, expect } from '@playwright/test';

test.describe('儀表板載入狀態修復測試', () => {
  test('測試儀表板是否直接顯示內容，不再卡在載入狀態', async ({ page }) => {
    console.log('🔍 開始測試儀表板載入狀態修復...');
    
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
    
    // 3. 檢查載入狀態
    console.log('🔍 檢查載入狀態元素...');
    
    // 等待頁面穩定
    await page.waitForTimeout(1000);
    
    // 檢查載入狀態是否隱藏
    const loadingElements = await page.locator('#loading, .loading, [data-loading]').all();
    console.log(`找到 ${loadingElements.length} 個載入狀態元素`);
    
    for (let i = 0; i < loadingElements.length; i++) {
      const element = loadingElements[i];
      const isVisible = await element.isVisible();
      const classList = await element.getAttribute('class') || '';
      console.log(`載入元素 ${i + 1}: 可見=${isVisible}, class="${classList}"`);
      
      // 載入狀態應該是隱藏的
      expect(isVisible).toBe(false);
    }
    
    // 4. 檢查儀表板內容是否顯示
    console.log('🔍 檢查儀表板內容...');
    
    // 檢查統計卡片
    const statsCards = await page.locator('.card, .stat-card, [data-stats]').all();
    console.log(`找到 ${statsCards.length} 個統計卡片`);
    
    if (statsCards.length > 0) {
      const firstCard = statsCards[0];
      const isVisible = await firstCard.isVisible();
      console.log(`第一個統計卡片可見: ${isVisible}`);
      expect(isVisible).toBe(true);
    }
    
    // 檢查圖表容器
    const chartContainers = await page.locator('[id*="chart"], .chart, [data-chart]').all();
    console.log(`找到 ${chartContainers.length} 個圖表容器`);
    
    // 5. 檢查控制台錯誤
    const logs = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    // 等待一段時間收集錯誤
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log('⚠️ 發現控制台錯誤:');
      logs.forEach(log => console.log(`  - ${log}`));
    } else {
      console.log('✅ 沒有控制台錯誤');
    }
    
    // 6. 測試數據更新功能
    console.log('🔍 測試數據更新功能...');
    
    // 尋找更新按鈕
    const updateButtons = await page.locator('button:has-text("更新"), button:has-text("刷新"), [data-update], .refresh-btn').all();
    console.log(`找到 ${updateButtons.length} 個更新按鈕`);
    
    if (updateButtons.length > 0) {
      const updateBtn = updateButtons[0];
      const isVisible = await updateBtn.isVisible();
      console.log(`第一個更新按鈕可見: ${isVisible}`);
      
      if (isVisible) {
        console.log('🔄 點擊更新按鈕...');
        await updateBtn.click();
        await page.waitForTimeout(1000); // 等待更新
        
        // 檢查是否又出現載入狀態
        const loadingAfterUpdate = await page.locator('#loading, .loading, [data-loading]').first().isVisible();
        console.log(`更新後載入狀態顯示: ${loadingAfterUpdate}`);
      }
    }
    
    // 7. 截圖記錄最終狀態
    await page.screenshot({ 
      path: 'screenshots/dashboard-loading-fix-final.png', 
      fullPage: true 
    });
    
    console.log('✅ 儀表板載入狀態修復測試完成');
  });
});