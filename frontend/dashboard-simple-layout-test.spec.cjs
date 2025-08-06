const { test, expect } = require('@playwright/test');

test.describe('NexusERP Dashboard 佈局測試', () => {
  
  test('完整 Dashboard 佈局驗證', async ({ page }) => {
    // 設定較長的超時時間
    test.setTimeout(90000);
    
    try {
      console.log('開始訪問首頁...');
      await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });
      
      // 拍攝首頁截圖
      await page.screenshot({ path: 'test-01-homepage.png', fullPage: true });
      
      // 檢查是否在登入頁面
      const isLoginPage = await page.locator('input[type="email"]').isVisible({ timeout: 5000 });
      
      if (isLoginPage) {
        console.log('檢測到登入頁面，開始登入...');
        
        // 填寫登入資料
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        
        // 拍攝登入表單截圖
        await page.screenshot({ path: 'test-02-login-form.png', fullPage: true });
        
        // 點擊登入按鈕
        await page.click('button[type="submit"]');
        console.log('已點擊登入按鈕，等待導向...');
        
        // 等待登入完成 - 等待 URL 變化或 Dashboard 元素出現
        await page.waitForFunction(
          () => window.location.pathname.includes('dashboard') || 
                document.querySelector('#dashboardStats') !== null,
          { timeout: 15000 }
        );
        
        console.log('登入完成');
      } else {
        console.log('未檢測到登入頁面，嘗試直接訪問 Dashboard...');
        await page.goto('http://127.0.0.1:8000/dashboard', { waitUntil: 'networkidle' });
      }
      
      // 等待 Dashboard 內容載入
      await page.waitForSelector('#dashboardStats, .dashboard-container', { timeout: 15000 });
      console.log('Dashboard 元素已載入');
      
      // 拍攝成功載入後的截圖
      await page.screenshot({ path: 'test-03-dashboard-loaded.png', fullPage: true });
      
      // 測試不同視窗尺寸的佈局
      const viewports = [
        { name: '桌面版-1920', width: 1920, height: 1080 },
        { name: '桌面版-1280', width: 1280, height: 720 },
        { name: '平板版-768', width: 768, height: 1024 },
        { name: '手機版-375', width: 375, height: 667 }
      ];
      
      for (let viewport of viewports) {
        console.log(`測試 ${viewport.name} 佈局...`);
        
        // 設定視窗大小
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // 等待頁面調整
        await page.waitForTimeout(1500);
        
        // 拍攝不同尺寸的截圖
        await page.screenshot({ 
          path: `dashboard-layout-${viewport.name}.png`,
          fullPage: true 
        });
        
        // 基本可見性檢查
        const dashboardContainer = page.locator('.dashboard-container, #dashboardStats');
        await expect(dashboardContainer).toBeVisible();
        
        // 檢查快速操作區域
        const quickActions = page.locator('.grid.grid-cols-2.md\\:grid-cols-4');
        if (await quickActions.count() > 0) {
          await expect(quickActions).toBeVisible();
          console.log(`✅ ${viewport.name}: 快速操作區域可見`);
          
          // 檢查快速操作卡片
          const quickActionCards = quickActions.locator('.nexus-quick-action-card, .nexus-card');
          const cardCount = await quickActionCards.count();
          console.log(`${viewport.name}: 快速操作卡片數量 = ${cardCount}`);
        }
        
        // 檢查統計區域
        const statsGrid = page.locator('#statsGrid');
        if (await statsGrid.count() > 0) {
          await expect(statsGrid).toBeVisible();
          console.log(`✅ ${viewport.name}: 統計區域可見`);
          
          // 檢查統計卡片
          const statCards = statsGrid.locator('.nexus-card, [data-stat]');
          const statCount = await statCards.count();
          console.log(`${viewport.name}: 統計卡片數量 = ${statCount}`);
        }
        
        // 檢查內容是否會溢出
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const hasHorizontalScroll = bodyWidth > viewport.width + 20; // 允許小幅滾動條
        
        if (!hasHorizontalScroll) {
          console.log(`✅ ${viewport.name}: 無水平滾動條`);
        } else {
          console.log(`⚠️ ${viewport.name}: 可能有水平滾動條 (body寬度: ${bodyWidth}px)`);
        }
      }
      
      // 最終驗證 - 檢查主要組件
      console.log('進行最終組件驗證...');
      
      // 重設為標準桌面尺寸
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(1000);
      
      // 拍攝最終驗證截圖
      await page.screenshot({ 
        path: 'dashboard-final-verification.png',
        fullPage: true 
      });
      
      // 檢查頁面標題
      const title = page.locator('h1');
      if (await title.count() > 0) {
        const titleText = await title.first().textContent();
        console.log(`✅ 頁面標題: ${titleText}`);
      }
      
      // 檢查快速操作標題
      const quickActionTitles = ['新增報價單', '庫存管理', '訂單處理', '客戶管理'];
      let foundQuickActions = 0;
      
      for (let title of quickActionTitles) {
        const element = page.locator(`text=${title}`).first();
        if (await element.isVisible()) {
          foundQuickActions++;
          console.log(`✅ 找到快速操作: ${title}`);
        }
      }
      
      console.log(`快速操作功能: ${foundQuickActions}/4 可見`);
      
      // 檢查統計卡片標題
      const statTitles = ['總營收', '總訂單數', '總客戶數', '待處理報價', '庫存警報', '轉換率'];
      let foundStats = 0;
      
      for (let title of statTitles) {
        const element = page.locator(`text=${title}`).first();
        if (await element.isVisible()) {
          foundStats++;
          console.log(`✅ 找到統計項目: ${title}`);
        }
      }
      
      console.log(`統計項目: ${foundStats}/6 可見`);
      
      // 檢查圖表
      const chartIds = ['revenueChart', 'ordersChart', 'inventoryChart', 'performanceChart'];
      let foundCharts = 0;
      
      for (let chartId of chartIds) {
        const chart = page.locator(`#${chartId}`);
        if (await chart.isVisible()) {
          foundCharts++;
          console.log(`✅ 找到圖表: ${chartId}`);
        }
      }
      
      console.log(`圖表: ${foundCharts}/4 可見`);
      
      // 最終成功報告
      console.log('\n📊 Dashboard 佈局測試完成');
      console.log('=====================================');
      console.log(`✅ 快速操作: ${foundQuickActions}/4`);
      console.log(`✅ 統計項目: ${foundStats}/6`);
      console.log(`✅ 圖表: ${foundCharts}/4`);
      console.log(`✅ 響應式測試: 4個視窗尺寸`);
      console.log('=====================================');
      
      // 基本斷言 - 確保關鍵組件存在
      expect(foundQuickActions).toBeGreaterThanOrEqual(2); // 至少2個快速操作
      expect(foundStats).toBeGreaterThanOrEqual(3); // 至少3個統計項目
      
    } catch (error) {
      console.error('測試過程中發生錯誤:', error);
      
      // 拍攝錯誤狀態截圖
      await page.screenshot({ 
        path: 'test-error-state.png',
        fullPage: true 
      });
      
      // 輸出頁面資訊
      const url = page.url();
      const title = await page.title();
      console.log('錯誤時頁面資訊:');
      console.log(`URL: ${url}`);
      console.log(`標題: ${title}`);
      
      throw error;
    }
  });
});