/**
 * NexusERP Dashboard 簡化佈局測試
 * 測試新的Dashboard佈局基本功能
 */

const { test, expect } = require('@playwright/test');

test.describe('Dashboard 基本佈局測試', () => {
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
        await page.waitForTimeout(2000);
    });

    test('統計卡片Grid佈局驗證', async ({ page }) => {
        // 設置桌面版視窗
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);

        // 驗證統計卡片容器存在
        const statsGrid = await page.locator('#statsGrid');
        await expect(statsGrid).toBeVisible();

        // 檢查統計卡片數量
        const statCards = await page.locator('#statsGrid .stat-card-container');
        const cardCount = await statCards.count();
        console.log(`統計卡片數量: ${cardCount}`);
        expect(cardCount).toBe(6);

        // 檢查Grid CSS 屬性
        const gridStyle = await page.evaluate(() => {
            const grid = document.querySelector('#statsGrid');
            const style = window.getComputedStyle(grid);
            return {
                display: style.display,
                gridTemplateColumns: style.gridTemplateColumns,
                gap: style.gap
            };
        });
        
        console.log('Grid樣式:', gridStyle);
        expect(gridStyle.display).toBe('grid');

        // 截圖記錄佈局
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/dashboard-layout-desktop-test.png',
            fullPage: true 
        });
    });

    test('響應式斷點測試', async ({ page }) => {
        const breakpoints = [
            { name: '桌面版', width: 1920, height: 1080 },
            { name: '平板版', width: 768, height: 1024 },
            { name: '手機版', width: 375, height: 667 }
        ];

        for (const breakpoint of breakpoints) {
            console.log(`測試 ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
            
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.waitForTimeout(500);

            // 驗證統計卡片仍然可見
            const statsGrid = await page.locator('#statsGrid');
            await expect(statsGrid).toBeVisible();

            const statCards = await page.locator('#statsGrid .stat-card-container');
            const cardCount = await statCards.count();
            expect(cardCount).toBe(6);

            // 檢查Grid樣式
            const gridStyle = await page.evaluate(() => {
                const grid = document.querySelector('#statsGrid');
                const style = window.getComputedStyle(grid);
                return style.gridTemplateColumns;
            });
            
            console.log(`${breakpoint.name} Grid佈局:`, gridStyle);
            
            // 截圖記錄不同斷點的佈局
            await page.screenshot({ 
                path: `/Users/gamepig/projects/NexusERP/frontend/dashboard-layout-${breakpoint.name.toLowerCase()}-${breakpoint.width}.png`,
                fullPage: true 
            });
        }
    });

    test('HTML結構驗證', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // 檢查關鍵元素是否存在
        const elementsToCheck = [
            '#dashboardStats',
            '#statsGrid',
            '.stat-card-container',
            '#quickActions'
        ];

        for (const selector of elementsToCheck) {
            const element = await page.locator(selector).first();
            const isVisible = await element.isVisible().catch(() => false);
            console.log(`${selector}: ${isVisible ? '✅ 存在' : '❌ 不存在'}`);
        }

        // 檢查快速操作是否在統計卡片上方
        const quickActionsExists = await page.locator('#quickActions').count() > 0;
        const statsGridExists = await page.locator('#statsGrid').count() > 0;
        
        if (quickActionsExists && statsGridExists) {
            const quickActionsElement = await page.locator('#quickActions').first();
            const statsGridElement = await page.locator('#statsGrid').first();
            
            const quickActionsBox = await quickActionsElement.boundingBox();
            const statsGridBox = await statsGridElement.boundingBox();
            
            if (quickActionsBox && statsGridBox) {
                const isAbove = quickActionsBox.y < statsGridBox.y;
                console.log(`快速操作位置: ${isAbove ? '✅ 在統計卡片上方' : '❌ 位置不正確'}`);
            }
        }

        // 最終截圖
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/dashboard-layout-structure-test.png',
            fullPage: true 
        });
    });
});