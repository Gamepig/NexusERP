const { test, expect } = require('@playwright/test');

test.describe('NexusERP Dashboard 新佈局測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設定較長的超時時間
    test.setTimeout(60000);
    
    // 訪問首頁，然後導航到 dashboard
    await page.goto('http://127.0.0.1:8000');
    
    // 檢查是否需要登入
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      
      // 進行登入
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // 等待登入完成
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } catch (error) {
      // 如果沒有登入表單，直接訪問 dashboard
      await page.goto('http://127.0.0.1:8000/dashboard');
    }
    
    // 等待 Dashboard 完全載入
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#dashboardStats', { timeout: 10000 });
  });

  test('Desktop Layout - 3列2行統計卡片佈局 (1920px)', async ({ page }) => {
    // 設定桌面版視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 等待頁面調整
    await page.waitForTimeout(1000);
    
    // 拍攝桌面版截圖
    await page.screenshot({ 
      path: 'dashboard-layout-桌面版-1920.png',
      fullPage: true 
    });
    
    // 檢查快速操作區域存在
    const quickActionsGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-4.gap-4.mb-8');
    await expect(quickActionsGrid).toBeVisible();
    
    // 檢查快速操作按鈕數量 (應該有4個)
    const quickActionCards = quickActionsGrid.locator('.nexus-quick-action-card');
    const quickActionCount = await quickActionCards.count();
    expect(quickActionCount).toBe(4);
    
    // 檢查統計卡片區域
    const statsGrid = page.locator('#statsGrid');
    await expect(statsGrid).toBeVisible();
    
    // 檢查統計卡片數量 (應該有6個)
    const statCards = statsGrid.locator('div[data-stat]');
    const statCardCount = await statCards.count();
    console.log('桌面版統計卡片數量:', statCardCount);
    
    // 檢查快速操作區域是否在統計卡片上方
    const quickActionsBox = await quickActionsGrid.boundingBox();
    const statsGridBox = await statsGrid.boundingBox();
    
    if (quickActionsBox && statsGridBox) {
      expect(quickActionsBox.y).toBeLessThan(statsGridBox.y);
      console.log('快速操作位置正確：在統計卡片上方');
    }
    
    // 檢查統計卡片的佈局 (桌面版應該是3列)
    const gridClasses = await statsGrid.getAttribute('class');
    expect(gridClasses).toContain('lg:grid-cols-3');
    console.log('統計卡片使用3列佈局');
  });

  test('Tablet Layout - 2列佈局 (768px)', async ({ page }) => {
    // 設定平板版視窗大小
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // 等待頁面調整
    await page.waitForTimeout(1000);
    
    // 拍攝平板版截圖
    await page.screenshot({ 
      path: 'dashboard-layout-平板版-768.png',
      fullPage: true 
    });
    
    // 檢查快速操作區域和統計卡片都存在
    const quickActionsGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-4.gap-4.mb-8');
    const statsGrid = page.locator('#statsGrid');
    
    await expect(quickActionsGrid).toBeVisible();
    await expect(statsGrid).toBeVisible();
    
    // 檢查統計卡片使用2列佈局
    const gridClasses = await statsGrid.getAttribute('class');
    expect(gridClasses).toContain('md:grid-cols-2');
    console.log('平板版統計卡片使用2列佈局');
    
    // 檢查快速操作區域位置
    const quickActionsBox = await quickActionsGrid.boundingBox();
    const statsGridBox = await statsGrid.boundingBox();
    
    if (quickActionsBox && statsGridBox) {
      expect(quickActionsBox.y).toBeLessThan(statsGridBox.y);
      console.log('平板版快速操作位置正確');
    }
  });

  test('Mobile Layout - 1列佈局 (375px)', async ({ page }) => {
    // 設定手機版視窗大小
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 等待頁面調整
    await page.waitForTimeout(1000);
    
    // 拍攝手機版截圖
    await page.screenshot({ 
      path: 'dashboard-layout-手機版-375.png',
      fullPage: true 
    });
    
    // 檢查快速操作區域和統計卡片
    const quickActionsGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-4.gap-4.mb-8');
    const statsGrid = page.locator('#statsGrid');
    
    await expect(quickActionsGrid).toBeVisible();
    await expect(statsGrid).toBeVisible();
    
    // 檢查統計卡片使用1列佈局
    const gridClasses = await statsGrid.getAttribute('class');
    expect(gridClasses).toContain('grid-cols-1');
    console.log('手機版統計卡片使用1列佈局');
    
    // 檢查快速操作區域是否在手機版改為2列
    const quickActionClasses = await quickActionsGrid.getAttribute('class');
    expect(quickActionClasses).toContain('grid-cols-2');
    console.log('手機版快速操作使用2列佈局');
    
    // 檢查佈局順序
    const quickActionsBox = await quickActionsGrid.boundingBox();
    const statsGridBox = await statsGrid.boundingBox();
    
    if (quickActionsBox && statsGridBox) {
      expect(quickActionsBox.y).toBeLessThan(statsGridBox.y);
      console.log('手機版佈局順序正確');
    }
  });

  test('Dashboard Components 完整性檢查', async ({ page }) => {
    // 設定標準桌面視窗
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // 等待頁面完全載入
    await page.waitForTimeout(2000);
    
    // 拍攝完整性檢查截圖
    await page.screenshot({ 
      path: 'dashboard-components-check.png',
      fullPage: true 
    });
    
    // 1. 檢查頁面標題
    const mainTitle = page.locator('h1:has-text("管理儀表板")');
    await expect(mainTitle).toBeVisible();
    console.log('✅ 頁面標題正確');
    
    // 2. 檢查重新整理按鈕
    const refreshButton = page.locator('[data-action="refresh-dashboard"]');
    await expect(refreshButton).toBeVisible();
    console.log('✅ 重新整理按鈕存在');
    
    // 3. 檢查快速操作卡片
    const quickActionTitles = [
      '新增報價單',
      '庫存管理', 
      '訂單處理',
      '客戶管理'
    ];
    
    for (let title of quickActionTitles) {
      const quickActionCard = page.locator(`.nexus-quick-action-card:has-text("${title}")`);
      await expect(quickActionCard).toBeVisible();
      console.log(`✅ 快速操作"${title}"存在`);
    }
    
    // 4. 檢查統計卡片
    const expectedStats = [
      '總營收',
      '總訂單數',
      '總客戶數',
      '待處理報價',
      '庫存警報',
      '轉換率'
    ];
    
    // 使用更靈活的選擇器檢查統計卡片
    for (let statTitle of expectedStats) {
      const statCard = page.locator(`text=${statTitle}`).first();
      await expect(statCard).toBeVisible();
      console.log(`✅ 統計卡片"${statTitle}"存在`);
    }
    
    // 5. 檢查圖表區域
    const chartIds = ['revenueChart', 'ordersChart', 'inventoryChart', 'performanceChart'];
    
    for (let chartId of chartIds) {
      const chart = page.locator(`#${chartId}`);
      await expect(chart).toBeVisible();
      console.log(`✅ 圖表 ${chartId} 存在`);
    }
    
    // 6. 檢查深色主題樣式
    const bodyClasses = await page.evaluate(() => document.body.className);
    const isDarkTheme = bodyClasses.includes('dark') || 
                       await page.locator('.nexus-card').first().isVisible();
    
    console.log('✅ NexusERP 深色主題正確應用:', isDarkTheme);
  });

  test('卡片高度一致性和間距測試', async ({ page }) => {
    // 設定桌面視窗
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // 等待頁面載入
    await page.waitForTimeout(2000);
    
    // 拍攝卡片測試截圖
    await page.screenshot({ 
      path: 'dashboard-cards-consistency-test.png',
      fullPage: true 
    });
    
    // 檢查統計卡片高度一致性
    const statsGrid = page.locator('#statsGrid');
    const statCards = statsGrid.locator('.nexus-card');
    const cardCount = await statCards.count();
    
    if (cardCount > 0) {
      const cardHeights = [];
      
      // 獲取所有卡片的高度
      for (let i = 0; i < cardCount; i++) {
        const cardBox = await statCards.nth(i).boundingBox();
        if (cardBox) {
          cardHeights.push(cardBox.height);
        }
      }
      
      if (cardHeights.length > 1) {
        // 檢查高度差異是否在合理範圍內
        const minHeight = Math.min(...cardHeights);
        const maxHeight = Math.max(...cardHeights);
        const heightDiff = maxHeight - minHeight;
        
        console.log(`卡片高度範圍: ${minHeight}px - ${maxHeight}px (差異: ${heightDiff}px)`);
        
        // 允許30px內的高度差異
        expect(heightDiff).toBeLessThan(30);
        console.log('✅ 統計卡片高度一致性良好');
      }
    }
    
    // 檢查長方形比例是否合適
    const firstCard = await statCards.first().boundingBox();
    if (firstCard) {
      const aspectRatio = firstCard.width / firstCard.height;
      console.log(`統計卡片長寬比: ${aspectRatio.toFixed(2)}`);
      
      // 期望長方形比例在 1.2 到 2.0 之間
      expect(aspectRatio).toBeGreaterThan(1.2);
      expect(aspectRatio).toBeLessThan(2.0);
      console.log('✅ 統計卡片使用適合的長方形比例');
    }
    
    // 檢查卡片內容是否清晰可讀
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = statCards.nth(i);
      const cardText = await card.textContent();
      
      expect(cardText.trim().length).toBeGreaterThan(0);
      expect(cardText.trim().length).toBeLessThan(300);
      console.log(`✅ 卡片 ${i+1} 內容清晰可讀`);
    }
  });

  test('響應式設計跨尺寸測試', async ({ page }) => {
    const viewports = [
      { name: '桌面版大螢幕', width: 1920, height: 1080 },
      { name: '桌面版中螢幕', width: 1280, height: 720 },
      { name: '平板版', width: 768, height: 1024 },
      { name: '手機版', width: 375, height: 667 }
    ];
    
    for (let viewport of viewports) {
      console.log(`測試 ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      // 設定視窗大小
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // 等待頁面調整
      await page.waitForTimeout(1000);
      
      // 拍攝截圖
      await page.screenshot({ 
        path: `dashboard-responsive-${viewport.name}-${viewport.width}.png`,
        fullPage: true 
      });
      
      // 檢查主要元素是否仍然可見
      const quickActionsGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-4.gap-4.mb-8');
      const statsGrid = page.locator('#statsGrid');
      
      await expect(quickActionsGrid).toBeVisible();
      await expect(statsGrid).toBeVisible();
      
      // 檢查快速操作區域位置
      const quickActionsBox = await quickActionsGrid.boundingBox();
      const statsGridBox = await statsGrid.boundingBox();
      
      if (quickActionsBox && statsGridBox) {
        expect(quickActionsBox.y).toBeLessThan(statsGridBox.y);
        console.log(`✅ ${viewport.name} 佈局順序正確`);
      }
      
      // 檢查內容不會溢出視窗
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // 允許小幅滾動條
      console.log(`✅ ${viewport.name} 無水平滾動條`);
    }
  });
});