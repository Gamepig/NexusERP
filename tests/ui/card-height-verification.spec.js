/**
 * 卡片高度驗證測試
 * 測試調整後的卡片高度配置
 */

import { test, expect } from '@playwright/test';

test.describe('Card Height Verification Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // 登入系統
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待儀表板載入
    await page.waitForSelector('.dashboard-grid', { timeout: 10000 });
    await page.waitForTimeout(2000); // 等待樣式完全載入
  });

  test('Desktop - Verify All Card Heights', async ({ page }) => {
    // 設置桌面視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    // 測試 Quick Action Cards 高度 (~150px)
    const quickActionCards = await page.locator('.card.quick-action-card');
    const quickActionCount = await quickActionCards.count();
    
    if (quickActionCount > 0) {
      for (let i = 0; i < quickActionCount; i++) {
        const card = quickActionCards.nth(i);
        const boundingBox = await card.boundingBox();
        console.log(`Quick Action Card ${i + 1} height: ${boundingBox.height}px`);
        
        // 驗證高度在 140-160px 範圍內 (允許 ±10px 誤差)
        expect(boundingBox.height).toBeGreaterThanOrEqual(140);
        expect(boundingBox.height).toBeLessThanOrEqual(160);
      }
    }

    // 測試 Statistics Cards 高度 (~135px)
    const statisticsCards = await page.locator('.card.statistics-card');
    const statisticsCount = await statisticsCards.count();
    
    if (statisticsCount > 0) {
      for (let i = 0; i < statisticsCount; i++) {
        const card = statisticsCards.nth(i);
        const boundingBox = await card.boundingBox();
        console.log(`Statistics Card ${i + 1} height: ${boundingBox.height}px`);
        
        // 驗證高度在 125-145px 範圍內 (允許 ±10px 誤差)
        expect(boundingBox.height).toBeGreaterThanOrEqual(125);
        expect(boundingBox.height).toBeLessThanOrEqual(145);
      }
    }

    // 測試 Chart Cards 高度 (~400px)
    const chartCards = await page.locator('.card.chart-card');
    const chartCount = await chartCards.count();
    
    if (chartCount > 0) {
      for (let i = 0; i < chartCount; i++) {
        const card = chartCards.nth(i);
        const boundingBox = await card.boundingBox();
        console.log(`Chart Card ${i + 1} height: ${boundingBox.height}px`);
        
        // 驗證高度在 380-420px 範圍內 (允許 ±20px 誤差)
        expect(boundingBox.height).toBeGreaterThanOrEqual(380);
        expect(boundingBox.height).toBeLessThanOrEqual(420);
      }
    }

    // 截圖記錄桌面版配置
    await page.screenshot({ 
      path: 'test-results/card-heights-desktop.png',
      fullPage: true 
    });
  });

  test('Mobile - Verify All Card Heights', async ({ page }) => {
    // 設置移動設備視窗大小
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // 測試 Quick Action Cards 高度 (~120px)
    const quickActionCards = await page.locator('.card.quick-action-card');
    const quickActionCount = await quickActionCards.count();
    
    if (quickActionCount > 0) {
      for (let i = 0; i < quickActionCount; i++) {
        const card = quickActionCards.nth(i);
        const boundingBox = await card.boundingBox();
        console.log(`Mobile Quick Action Card ${i + 1} height: ${boundingBox.height}px`);
        
        // 驗證高度在 110-130px 範圍內 (允許 ±10px 誤差)
        expect(boundingBox.height).toBeGreaterThanOrEqual(110);
        expect(boundingBox.height).toBeLessThanOrEqual(130);
      }
    }

    // 測試 Statistics Cards 高度 (~105px)
    const statisticsCards = await page.locator('.card.statistics-card');
    const statisticsCount = await statisticsCards.count();
    
    if (statisticsCount > 0) {
      for (let i = 0; i < statisticsCount; i++) {
        const card = statisticsCards.nth(i);
        const boundingBox = await card.boundingBox();
        console.log(`Mobile Statistics Card ${i + 1} height: ${boundingBox.height}px`);
        
        // 驗證高度在 95-115px 範圍內 (允許 ±10px 誤差)
        expect(boundingBox.height).toBeGreaterThanOrEqual(95);
        expect(boundingBox.height).toBeLessThanOrEqual(115);
      }
    }

    // 測試 Chart Cards 高度 (~300px)
    const chartCards = await page.locator('.card.chart-card');
    const chartCount = await chartCards.count();
    
    if (chartCount > 0) {
      for (let i = 0; i < chartCount; i++) {
        const card = chartCards.nth(i);
        const boundingBox = await card.boundingBox();
        console.log(`Mobile Chart Card ${i + 1} height: ${boundingBox.height}px`);
        
        // 驗證高度在 280-320px 範圍內 (允許 ±20px 誤差)
        expect(boundingBox.height).toBeGreaterThanOrEqual(280);
        expect(boundingBox.height).toBeLessThanOrEqual(320);
      }
    }

    // 截圖記錄移動版配置
    await page.screenshot({ 
      path: 'test-results/card-heights-mobile.png',
      fullPage: true 
    });
  });

  test('Content Visibility Verification', async ({ page }) => {
    // 設置桌面視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    // 驗證所有卡片內容是否可見且格式正確
    const allCards = await page.locator('.card');
    const cardCount = await allCards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = allCards.nth(i);
      
      // 檢查卡片是否可見
      await expect(card).toBeVisible();
      
      // 檢查卡片標題是否可見
      const title = card.locator('.card-title, .card-header h3, .card-header h4, .card-header h5');
      const titleCount = await title.count();
      if (titleCount > 0) {
        await expect(title.first()).toBeVisible();
      }
      
      // 檢查卡片內容是否可見
      const content = card.locator('.card-body, .card-content');
      const contentCount = await content.count();
      if (contentCount > 0) {
        await expect(content.first()).toBeVisible();
      }
    }

    // 截圖記錄內容可見性
    await page.screenshot({ 
      path: 'test-results/card-content-visibility.png',
      fullPage: true 
    });
  });

  test('Width Unchanged Verification', async ({ page }) => {
    // 設置桌面視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    // 檢查卡片寬度是否保持不變
    const cards = await page.locator('.card');
    const cardCount = await cards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const boundingBox = await card.boundingBox();
      
      console.log(`Card ${i + 1} width: ${boundingBox.width}px, height: ${boundingBox.height}px`);
      
      // 確保寬度合理 (根據網格系統，應該有適當的寬度)
      expect(boundingBox.width).toBeGreaterThan(200); // 最小寬度檢查
    }
  });

  test('Card Class Detection', async ({ page }) => {
    // 設置桌面視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    // 檢測所有卡片類型
    const quickActionCards = await page.locator('.card.quick-action-card, .card[class*="quick"], .card[class*="action"]').count();
    const statisticsCards = await page.locator('.card.statistics-card, .card[class*="statistics"], .card[class*="stat"]').count();
    const chartCards = await page.locator('.card.chart-card, .card[class*="chart"]').count();
    const generalCards = await page.locator('.card').count();

    console.log(`Found cards: Quick Action (${quickActionCards}), Statistics (${statisticsCards}), Chart (${chartCards}), Total (${generalCards})`);

    // 如果找不到特定類型的卡片，檢查一般卡片的分布
    if (quickActionCards === 0 && statisticsCards === 0 && chartCards === 0) {
      console.log('No specific card types found, checking general cards...');
      
      // 分析一般卡片的高度分布
      const cards = await page.locator('.card');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const boundingBox = await card.boundingBox();
        const classes = await card.getAttribute('class');
        
        console.log(`Card ${i + 1}: height=${boundingBox.height}px, classes="${classes}"`);
      }
    }

    // 截圖記錄卡片分布
    await page.screenshot({ 
      path: 'test-results/card-class-detection.png',
      fullPage: true 
    });
  });
});