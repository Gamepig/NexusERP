import { test, expect } from '@playwright/test';

test('Measure Card Heights and Check Vertical Centering', async ({ page }) => {
  // 導航到登入頁面
  await page.goto('http://127.0.0.1:8000/login');
  
  // 登入
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // 等待儀表板載入
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(3000); // 確保所有樣式載入完成
  
  // 設置桌面視窗大小
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(1000);
  
  // 截圖記錄當前狀態
  await page.screenshot({ 
    path: 'test-results/dashboard-current-state.png',
    fullPage: true 
  });
  
  // 測量所有卡片
  const cards = await page.locator('.card');
  const cardCount = await cards.count();
  
  console.log(`Found ${cardCount} cards on dashboard`);
  
  // 分析每個卡片
  for (let i = 0; i < cardCount; i++) {
    const card = cards.nth(i);
    const boundingBox = await card.boundingBox();
    const classes = await card.getAttribute('class');
    
    console.log(`Card ${i + 1}:`);
    console.log(`  Classes: ${classes}`);
    console.log(`  Size: ${boundingBox.width}x${boundingBox.height}px`);
    
    // 檢查卡片內容
    const cardBody = card.locator('.card-body, .card-content');
    const hasCardBody = await cardBody.count() > 0;
    
    if (hasCardBody) {
      const bodyBox = await cardBody.first().boundingBox();
      console.log(`  Body size: ${bodyBox.width}x${bodyBox.height}px`);
    }
    
    // 檢查是否有快速操作相關的類或內容
    const isQuickAction = classes && (
      classes.includes('quick') || 
      classes.includes('action') ||
      classes.includes('btn') ||
      await card.locator('button, .btn, .action-btn').count() > 0
    );
    
    if (isQuickAction) {
      console.log(`  -> Identified as Quick Action card`);
      
      // 檢查垂直對齊
      const computedStyle = await card.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          alignItems: style.alignItems,
          justifyContent: style.justifyContent,
          flexDirection: style.flexDirection
        };
      });
      
      console.log(`  Alignment styles:`, computedStyle);
    }
  }
  
  // 測試移動版本
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'test-results/dashboard-mobile-state.png',
    fullPage: true 
  });
  
  console.log('Mobile view captured');
});