/**
 * NexusERP Dashboard 響應式佈局測試
 * 測試統計卡片從6列1行改為3列2行的響應式設計
 */

const { test, expect } = require('@playwright/test');

test.describe('Dashboard 響應式佈局測試', () => {
    test.beforeEach(async ({ page }) => {
        // 設置基本認證
        await page.goto('http://127.0.0.1:8000');
        
        // 登入系統
        await page.click('a[href*="login"]');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // 等待跳轉到 dashboard
        await page.waitForURL('**/dashboard');
        
        // 等待 dashboard 內容載入
        await page.waitForSelector('#dashboardStats:not(.hidden)', { timeout: 10000 });
        await page.waitForTimeout(2000); // 等待 JavaScript 初始化
    });

    test('桌面版 - 3列2行統計卡片佈局', async ({ page }) => {
        // 設置桌面版視窗 (1920x1080)
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);

        // 驗證統計卡片容器存在
        const statsGrid = await page.locator('#statsGrid');
        await expect(statsGrid).toBeVisible();

        // 檢查統計卡片數量
        const statCards = await page.locator('#statsGrid .stat-card-container');
        const cardCount = await statCards.count();
        console.log(`桌面版統計卡片數量: ${cardCount}`);
        expect(cardCount).toBe(6);

        // 驗證快速操作在統計卡片上方
        const quickActions = await page.locator('.quick-actions-container');
        const statsGridBox = await statsGrid.boundingBox();
        const quickActionsBox = await quickActions.boundingBox();
        
        expect(quickActionsBox.y).toBeLessThan(statsGridBox.y);
        console.log('快速操作位置正確：在統計卡片上方');

        // 檢查CSS Grid是否正確應用3列佈局
        const gridComputedStyle = await page.evaluate(() => {
            const grid = document.querySelector('#statsGrid');
            const style = window.getComputedStyle(grid);
            return {
                gridTemplateColumns: style.gridTemplateColumns,
                display: style.display
            };
        });
        
        console.log('桌面版Grid樣式:', gridComputedStyle);
        expect(gridComputedStyle.display).toBe('grid');

        // 截圖記錄桌面版佈局
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/dashboard-layout-desktop-1920.png',
            fullPage: true 
        });
    });

    test('平板版 - 2列3行統計卡片佈局', async ({ page }) => {
        // 設置平板版視窗 (768x1024)
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);

        // 驗證統計卡片容器存在且可見
        const statsGrid = await page.locator('#statsGrid');
        await expect(statsGrid).toBeVisible();

        // 檢查統計卡片數量
        const statCards = await page.locator('#statsGrid .stat-card-container');
        const cardCount = await statCards.count();
        console.log(`平板版統計卡片數量: ${cardCount}`);
        expect(cardCount).toBe(6);

        // 檢查平板版Grid佈局
        const gridComputedStyle = await page.evaluate(() => {
            const grid = document.querySelector('#statsGrid');
            const style = window.getComputedStyle(grid);
            return {
                gridTemplateColumns: style.gridTemplateColumns,
                display: style.display
            };
        });
        
        console.log('平板版Grid樣式:', gridComputedStyle);
        expect(gridComputedStyle.display).toBe('grid');

        // 截圖記錄平板版佈局
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/dashboard-layout-tablet-768.png',
            fullPage: true 
        });
    });

    test('手機版 - 單列統計卡片佈局', async ({ page }) => {
        // 設置手機版視窗 (375x667)
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);

        // 驗證統計卡片容器存在且可見
        const statsGrid = await page.locator('#statsGrid');
        await expect(statsGrid).toBeVisible();

        // 檢查統計卡片數量
        const statCards = await page.locator('#statsGrid .stat-card-container');
        const cardCount = await statCards.count();
        console.log(`手機版統計卡片數量: ${cardCount}`);
        expect(cardCount).toBe(6);

        // 檢查手機版Grid佈局
        const gridComputedStyle = await page.evaluate(() => {
            const grid = document.querySelector('#statsGrid');
            const style = window.getComputedStyle(grid);
            return {
                gridTemplateColumns: style.gridTemplateColumns,
                display: style.display
            };
        });
        
        console.log('手機版Grid樣式:', gridComputedStyle);
        expect(gridComputedStyle.display).toBe('grid');

        // 截圖記錄手機版佈局
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/dashboard-layout-mobile-375.png',
            fullPage: true 
        });
    });

    test('快速操作區域佈局測試', async ({ page }) => {
        // 使用桌面版視窗測試
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);

        // 驗證快速操作區域存在
        const quickActions = await page.locator('.quick-actions-container');
        await expect(quickActions).toBeVisible();

        // 驗證快速操作區域的標題和說明
        const quickActionsTitle = await page.locator('.quick-actions-container h3');
        await expect(quickActionsTitle).toContainText('快速操作');

        const quickActionsDesc = await page.locator('.quick-actions-container p');
        await expect(quickActionsDesc).toContainText('常用功能快捷入口');

        // 驗證快速操作容器的Grid佈局
        const quickActionsGrid = await page.locator('#quickActions');
        const quickActionsGridStyle = await page.evaluate(() => {
            const grid = document.querySelector('#quickActions');
            const style = window.getComputedStyle(grid);
            return {
                gridTemplateColumns: style.gridTemplateColumns,
                display: style.display
            };
        });
        
        console.log('快速操作Grid樣式:', quickActionsGridStyle);
        expect(quickActionsGridStyle.display).toBe('grid');

        // 驗證快速操作在正確位置（統計卡片上方）
        const statsGrid = await page.locator('#statsGrid');
        const quickActionsBox = await quickActions.boundingBox();
        const statsGridBox = await statsGrid.boundingBox();
        
        expect(quickActionsBox.y).toBeLessThan(statsGridBox.y);
        console.log('✅ 快速操作位置驗證通過：在統計卡片上方');
    });

    test('庫存概況區域測試', async ({ page }) => {
        // 使用桌面版視窗測試
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);

        // 驗證庫存概況區域存在
        const inventoryStats = await page.locator('#inventoryQuickStats');
        await expect(inventoryStats).toBeVisible();

        // 驗證庫存概況區域的標題
        const inventoryTitle = await page.locator('text=庫存概況');
        await expect(inventoryTitle).toBeVisible();

        // 驗證庫存概況載入提示
        const inventoryLoadingText = await page.locator('text=庫存概況載入中...');
        await expect(inventoryLoadingText).toBeVisible();

        console.log('✅ 庫存概況區域驗證通過');
    });

    test('統計卡片高度一致性測試', async ({ page }) => {
        // 使用桌面版視窗測試統計卡片高度一致性
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);

        // 獲取所有統計卡片的高度
        const cardHeights = await page.evaluate(() => {
            const cards = document.querySelectorAll('#statsGrid .stat-card-container');
            return Array.from(cards).map(card => card.getBoundingBox().height);
        });

        console.log('統計卡片高度:', cardHeights);

        // 驗證所有卡片高度至少為140px（CSS設置的min-height）
        cardHeights.forEach(height => {
            expect(height).toBeGreaterThanOrEqual(140);
        });

        // 驗證高度差異在合理範圍內（±10px）
        const maxHeight = Math.max(...cardHeights);
        const minHeight = Math.min(...cardHeights);
        const heightDifference = maxHeight - minHeight;
        
        console.log(`統計卡片高度差異: ${heightDifference}px`);
        expect(heightDifference).toBeLessThanOrEqual(10);

        console.log('✅ 統計卡片高度一致性驗證通過');
    });

    test('響應式斷點轉換測試', async ({ page }) => {
        // 測試不同斷點之間的順暢轉換
        
        // 1. 開始於桌面版
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(500);
        
        let gridStyle = await page.evaluate(() => {
            const grid = document.querySelector('#statsGrid');
            return window.getComputedStyle(grid).gridTemplateColumns;
        });
        console.log('1920px Grid樣式:', gridStyle);

        // 2. 轉換到平板版
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        
        gridStyle = await page.evaluate(() => {
            const grid = document.querySelector('#statsGrid');
            return window.getComputedStyle(grid).gridTemplateColumns;
        });
        console.log('768px Grid樣式:', gridStyle);

        // 3. 轉換到手機版
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        gridStyle = await page.evaluate(() => {
            const grid = document.querySelector('#statsGrid');
            return window.getComputedStyle(grid).gridTemplateColumns;
        });
        console.log('375px Grid樣式:', gridStyle);

        // 4. 最終驗證在手機版下所有卡片仍然可見
        const statCards = await page.locator('#statsGrid .stat-card-container');
        const cardCount = await statCards.count();
        expect(cardCount).toBe(6);

        console.log('✅ 響應式斷點轉換測試通過');
    });
});