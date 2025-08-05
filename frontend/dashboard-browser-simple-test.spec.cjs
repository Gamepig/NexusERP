/**
 * NexusERP Dashboard 簡化瀏覽器兼容性測試
 */

const { test, expect } = require('@playwright/test');

test.describe('Dashboard 瀏覽器兼容性測試', () => {
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

    test('CSS Grid 兼容性測試', async ({ page }) => {
        // 設置桌面版視窗
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);

        // 檢查CSS Grid支援
        const gridSupport = await page.evaluate(() => {
            const testEl = document.createElement('div');
            testEl.style.display = 'grid';
            return testEl.style.display === 'grid';
        });
        
        console.log('瀏覽器CSS Grid支援:', gridSupport ? '✅ 支援' : '❌ 不支援');
        expect(gridSupport).toBe(true);

        // 檢查統計卡片Grid佈局
        const statsGrid = await page.locator('#statsGrid');
        await expect(statsGrid).toBeVisible();

        const gridStyle = await page.evaluate(() => {
            const grid = document.querySelector('#statsGrid');
            const style = window.getComputedStyle(grid);
            return {
                display: style.display,
                gridTemplateColumns: style.gridTemplateColumns,
                gap: style.gap
            };
        });
        
        console.log('Grid佈局樣式:', gridStyle);
        expect(gridStyle.display).toBe('grid');
        expect(gridStyle.gridTemplateColumns).toBeTruthy();
    });

    test('CSS變數支援測試', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // 檢查CSS自定義變數支援
        const cssVariableSupport = await page.evaluate(() => {
            if (typeof CSS === 'undefined' || !CSS.supports) return false;
            return CSS.supports('color', 'var(--fake-var)');
        });
        
        console.log('CSS變數支援:', cssVariableSupport ? '✅ 支援' : '⚠️ 部分支援');

        // 檢查實際的Nexus主題變數是否生效
        const themeVariables = await page.evaluate(() => {
            const root = document.documentElement;
            const computedStyle = window.getComputedStyle(root);
            return {
                primary: computedStyle.getPropertyValue('--nexus-primary-500'),
                background: computedStyle.getPropertyValue('--nexus-background-primary'),
                accent: computedStyle.getPropertyValue('--nexus-accent-blue')
            };
        });
        
        console.log('主題變數:', themeVariables);
    });

    test('Flexbox兼容性測試', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // 檢查Flexbox支援
        const flexSupport = await page.evaluate(() => {
            const testEl = document.createElement('div');
            testEl.style.display = 'flex';
            return testEl.style.display === 'flex';
        });
        
        console.log('Flexbox支援:', flexSupport ? '✅ 支援' : '❌ 不支援');
        expect(flexSupport).toBe(true);

        // 檢查快速操作卡片的flex佈局
        const quickActionCards = await page.locator('.quick-action-card');
        const cardCount = await quickActionCards.count();
        
        if (cardCount > 0) {
            const flexStyles = await quickActionCards.first().evaluate(el => {
                const style = window.getComputedStyle(el);
                return {
                    display: style.display,
                    flexDirection: style.flexDirection,
                    alignItems: style.alignItems
                };
            });
            
            console.log('快速操作Flex樣式:', flexStyles);
        }
    });

    test('響應式Media Query測試', async ({ page }) => {
        const breakpoints = [
            { name: '桌面版', width: 1920, height: 1080 },
            { name: '平板版', width: 768, height: 1024 },
            { name: '手機版', width: 375, height: 667 }
        ];

        for (const breakpoint of breakpoints) {
            console.log(`測試 ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
            
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.waitForTimeout(500);

            // 檢查媒體查詢是否正確觸發
            const mediaQueryResult = await page.evaluate((width) => {
                // 檢查不同斷點的媒體查詢
                const queries = {
                    mobile: window.matchMedia('(max-width: 768px)').matches,
                    tablet: window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches,
                    desktop: window.matchMedia('(min-width: 1024px)').matches
                };
                return queries;
            }, breakpoint.width);
            
            console.log(`${breakpoint.name} 媒體查詢結果:`, mediaQueryResult);

            // 檢查統計卡片在該斷點的顯示
            const statsGrid = await page.locator('#statsGrid');
            await expect(statsGrid).toBeVisible();
            
            const statCards = await page.locator('#statsGrid .stat-card-container');
            const cardCount = await statCards.count();
            expect(cardCount).toBe(6);
        }
    });

    test('CSS Transition動畫兼容性測試', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // 檢查CSS Transition支援
        const transitionSupport = await page.evaluate(() => {
            const testEl = document.createElement('div');
            testEl.style.transition = 'all 0.3s ease';
            return testEl.style.transition === 'all 0.3s ease';
        });
        
        console.log('CSS Transition支援:', transitionSupport ? '✅ 支援' : '❌ 不支援');
        expect(transitionSupport).toBe(true);

        // 測試快速操作卡片的hover動畫
        const quickActionCards = await page.locator('.quick-action-card');
        const quickActionCount = await quickActionCards.count();
        
        if (quickActionCount > 0) {
            const firstCard = quickActionCards.first();
            
            // 檢查transition屬性
            const transitionStyle = await firstCard.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.transition;
            });
            
            console.log('卡片transition樣式:', transitionStyle);
            expect(transitionStyle).toContain('duration');
        }
    });

    test('總體兼容性評估', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // 綜合檢查所有關鍵元素是否正常顯示
        const elementsCheck = await page.evaluate(() => {
            const elements = {
                dashboardStats: !!document.querySelector('#dashboardStats'),
                statsGrid: !!document.querySelector('#statsGrid'),
                statCards: document.querySelectorAll('#statsGrid .stat-card-container').length,
                quickActions: !!document.querySelector('#quickActions'),
                quickActionCards: document.querySelectorAll('.quick-action-card').length
            };
            return elements;
        });
        
        console.log('元素檢查結果:', elementsCheck);
        
        // 驗證關鍵元素都存在
        expect(elementsCheck.dashboardStats).toBe(true);
        expect(elementsCheck.statsGrid).toBe(true);
        expect(elementsCheck.statCards).toBe(6);
        expect(elementsCheck.quickActions).toBe(true);
        expect(elementsCheck.quickActionCards).toBeGreaterThan(0);

        // 最終截圖
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/dashboard-browser-compatibility-final.png',
            fullPage: true 
        });
        
        console.log('✅ 瀏覽器兼容性測試通過');
    });
});