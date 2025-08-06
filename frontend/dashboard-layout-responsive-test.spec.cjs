const { test, expect } = require('@playwright/test');

test.describe('NexusERP Dashboard Layout Test', () => {
  test.beforeEach(async ({ page }) => {
    // 設定較長的超時時間
    test.setTimeout(60000);
    
    // 訪問登入頁面
    await page.goto('http://127.0.0.1:8000');
    
    // 檢查是否需要登入
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    
    if (isLoginPage) {
      // 進行登入
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // 等待登入完成
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  });

  test('Dashboard Layout - 桌面版 (1920px)', async ({ page }) => {
    // 設定桌面版視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.dashboard-stats', { timeout: 10000 });
    
    // 拍攝桌面版截圖
    await page.screenshot({ 
      path: 'dashboard-layout-桌面版-1920.png',
      fullPage: true 
    });
    
    // 檢查快速操作區域是否在統計卡片上方
    const quickActions = page.locator('.quick-actions');
    const statsCards = page.locator('.dashboard-stats');
    
    await expect(quickActions).toBeVisible();
    await expect(statsCards).toBeVisible();
    
    // 檢查快速操作區域位置
    const quickActionsBox = await quickActions.boundingBox();
    const statsBox = await statsCards.boundingBox();
    
    // 快速操作應該在統計卡片上方
    expect(quickActionsBox.y).toBeLessThan(statsBox.y);
    
    // 檢查統計卡片佈局 (3列)
    const cards = page.locator('.stat-card');
    const cardCount = await cards.count();
    expect(cardCount).toBe(6);
    
    // 檢查第一行的卡片 (應該有3個)
    const firstRowCards = cards.first().locator('..').locator('.stat-card');
    // 驗證卡片是否呈現3列佈局
    const firstCard = await cards.nth(0).boundingBox();
    const secondCard = await cards.nth(1).boundingBox();
    const thirdCard = await cards.nth(2).boundingBox();
    
    // 檢查前三個卡片是否在同一行
    expect(Math.abs(firstCard.y - secondCard.y)).toBeLessThan(10);
    expect(Math.abs(secondCard.y - thirdCard.y)).toBeLessThan(10);
  });

  test('Dashboard Layout - 平板版 (768px)', async ({ page }) => {
    // 設定平板版視窗大小
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.dashboard-stats', { timeout: 10000 });
    
    // 拍攝平板版截圖
    await page.screenshot({ 
      path: 'dashboard-layout-平板版-768.png',
      fullPage: true 
    });
    
    // 檢查快速操作區域和統計卡片
    const quickActions = page.locator('.quick-actions');
    const statsCards = page.locator('.dashboard-stats');
    
    await expect(quickActions).toBeVisible();
    await expect(statsCards).toBeVisible();
    
    // 檢查統計卡片在平板版應該是2列佈局
    const cards = page.locator('.stat-card');
    const cardCount = await cards.count();
    expect(cardCount).toBe(6);
    
    // 檢查卡片響應式佈局
    const firstCard = await cards.nth(0).boundingBox();
    const secondCard = await cards.nth(1).boundingBox();
    const thirdCard = await cards.nth(2).boundingBox();
    
    // 在平板版，第三個卡片應該在第二行
    expect(thirdCard.y).toBeGreaterThan(firstCard.y + 50);
  });

  test('Dashboard Layout - 手機版 (375px)', async ({ page }) => {
    // 設定手機版視窗大小
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.dashboard-stats', { timeout: 10000 });
    
    // 拍攝手機版截圖
    await page.screenshot({ 
      path: 'dashboard-layout-手機版-375.png',
      fullPage: true 
    });
    
    // 檢查快速操作區域和統計卡片
    const quickActions = page.locator('.quick-actions');
    const statsCards = page.locator('.dashboard-stats');
    
    await expect(quickActions).toBeVisible();
    await expect(statsCards).toBeVisible();
    
    // 檢查統計卡片在手機版應該是1列佈局
    const cards = page.locator('.stat-card');
    const cardCount = await cards.count();
    expect(cardCount).toBe(6);
    
    // 檢查卡片是否垂直排列
    const firstCard = await cards.nth(0).boundingBox();
    const secondCard = await cards.nth(1).boundingBox();
    
    // 在手機版，第二個卡片應該在第一個卡片下方
    expect(secondCard.y).toBeGreaterThan(firstCard.y + 50);
  });

  test('Dashboard Layout Structure Test', async ({ page }) => {
    // 設定標準桌面視窗
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.dashboard-stats', { timeout: 10000 });
    
    // 拍攝結構測試截圖
    await page.screenshot({ 
      path: 'dashboard-layout-structure-test.png',
      fullPage: true 
    });
    
    // 檢查頁面結構
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    
    // 檢查快速操作按鈕
    const quickActionButtons = page.locator('.quick-actions .btn, .quick-actions .button, .quick-actions a');
    const buttonCount = await quickActionButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(4); // 至少4個快速操作按鈕
    
    // 檢查統計卡片內容
    const statCards = page.locator('.stat-card');
    const statsCount = await statCards.count();
    expect(statsCount).toBe(6); // 應該有6個統計卡片
    
    // 檢查每個統計卡片是否有內容
    for (let i = 0; i < statsCount; i++) {
      const card = statCards.nth(i);
      await expect(card).toBeVisible();
      
      // 檢查卡片內是否有數字或文字內容
      const cardText = await card.textContent();
      expect(cardText.trim().length).toBeGreaterThan(0);
    }
    
    // 檢查主題顏色是否正確 (NexusERP深色主題)
    const bodyStyle = await page.evaluate(() => {
      return window.getComputedStyle(document.body);
    });
    
    // 檢查是否使用了深色主題
    const isDarkTheme = await page.evaluate(() => {
      const body = document.body;
      return body.classList.contains('dark') || 
             body.style.backgroundColor.includes('rgb(17, 24, 39)') ||
             body.style.backgroundColor.includes('#111827');
    });
    
    console.log('Dark theme detected:', isDarkTheme);
  });

  test('Dashboard Cards Content and Spacing Test', async ({ page }) => {
    // 設定標準視窗
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.dashboard-stats', { timeout: 10000 });
    
    // 拍攝內容測試截圖
    await page.screenshot({ 
      path: 'dashboard-cards-content-test.png',
      fullPage: true 
    });
    
    // 檢查統計卡片的高度一致性
    const statCards = page.locator('.stat-card');
    const cardHeights = [];
    
    for (let i = 0; i < await statCards.count(); i++) {
      const cardBox = await statCards.nth(i).boundingBox();
      cardHeights.push(cardBox.height);
    }
    
    // 檢查所有卡片高度是否相近 (允許小幅差異)
    const avgHeight = cardHeights.reduce((a, b) => a + b) / cardHeights.length;
    cardHeights.forEach(height => {
      expect(Math.abs(height - avgHeight)).toBeLessThan(20); // 允許20px內的差異
    });
    
    // 檢查卡片內文字是否清晰可讀
    for (let i = 0; i < await statCards.count(); i++) {
      const card = statCards.nth(i);
      const cardText = await card.textContent();
      
      // 檢查文字內容不為空且長度合理
      expect(cardText.trim().length).toBeGreaterThan(0);
      expect(cardText.trim().length).toBeLessThan(200); // 避免文字過長導致擠壓
    }
    
    // 檢查卡片間距
    if (await statCards.count() >= 2) {
      const firstCard = await statCards.nth(0).boundingBox();
      const secondCard = await statCards.nth(1).boundingBox();
      
      // 檢查卡片之間的間距
      const horizontalGap = Math.abs(secondCard.x - (firstCard.x + firstCard.width));
      expect(horizontalGap).toBeGreaterThan(10); // 至少10px間距
      expect(horizontalGap).toBeLessThan(50); // 不超過50px間距
    }
  });
});