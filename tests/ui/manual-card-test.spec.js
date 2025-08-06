import { test, expect } from '@playwright/test';

test.describe('Manual Card Height Verification', () => {
  test('Manual dashboard inspection and measurement', async ({ page }) => {
    // 設定長超時時間，允許手動檢查
    test.setTimeout(120000);
    
    try {
      // 導航到首頁，然後手動登入
      await page.goto('http://127.0.0.1:8000');
      
      console.log('請手動完成以下步驟：');
      console.log('1. 如果未登入，請登入系統 (test@example.com / password123)');
      console.log('2. 檢查卡片高度是否符合以下要求：');
      console.log('   - 快速操作卡片：桌面 150px，移動 120px');
      console.log('   - 統計卡片：桌面 135px，移動 105px');
      console.log('   - 圖表卡片：桌面 400px，移動 300px');
      console.log('3. 檢查快速操作卡片內容是否垂直置中');
      console.log('4. 按任意鍵繼續截圖...');
      
      // 等待 30 秒讓用戶手動檢查
      await page.waitForTimeout(30000);
      
      // 桌面版本截圖
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(2000);
      
      // 截圖整個頁面
      await page.screenshot({ 
        path: 'test-results/desktop-cards-final.png',
        fullPage: true 
      });
      
      // 移動版本截圖
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'test-results/mobile-cards-final.png',
        fullPage: true 
      });
      
      // 平板版本截圖
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'test-results/tablet-cards-final.png',
        fullPage: true 
      });
      
      console.log('截圖已保存到 test-results/ 目錄');
      
      // 測試快速操作卡片的可見性
      const quickActionCards = page.locator('.nexus-quick-action-card');
      const cardCount = await quickActionCards.count();
      
      console.log(`找到 ${cardCount} 個快速操作卡片`);
      
      // 測試每個快速操作卡片
      for (let i = 0; i < cardCount; i++) {
        const card = quickActionCards.nth(i);
        await expect(card).toBeVisible();
        
        // 測試點擊是否正常工作
        const href = await card.getAttribute('href');
        console.log(`卡片 ${i + 1} 連結到: ${href}`);
      }
      
      // 測試統計卡片
      const statsCards = page.locator('.stats-cards-container .nexus-card');
      const statsCount = await statsCards.count();
      console.log(`找到 ${statsCount} 個統計卡片`);
      
      // 測試圖表卡片
      const chartCards = page.locator('.nexus-chart-card');
      const chartCount = await chartCards.count();
      console.log(`找到 ${chartCount} 個圖表卡片`);
      
      console.log('測試完成！');
      
    } catch (error) {
      console.error('測試過程中發生錯誤:', error);
      
      // 錯誤時也截圖
      await page.screenshot({ 
        path: 'test-results/error-state.png',
        fullPage: true 
      });
      
      throw error;
    }
  });
});