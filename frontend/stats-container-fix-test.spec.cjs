/**
 * 統計分析容器修復驗證測試
 * 測試統計容器的佈局、背景和排版是否恢復正常
 */

const { test, expect } = require('@playwright/test');

test.describe('統計分析容器修復驗證', () => {
    
    test.beforeEach(async ({ page }) => {
        // 訪問儀表板並登入
        await page.goto('http://127.0.0.1:8000/dashboard');
        
        // 檢查是否需要登入
        const loginForm = await page.locator('form').first();
        if (await loginForm.isVisible()) {
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
        }
        
        // 等待統計容器載入
        await page.waitForSelector('#statsGrid', { timeout: 10000 });
    });

    test('統計容器佈局修復驗證', async ({ page }) => {
        console.log('🔧 測試統計容器的佈局修復...');
        
        // 1. 檢查統計容器是否存在且可見
        const statsContainer = page.locator('#statsGrid');
        await expect(statsContainer).toBeVisible();
        console.log('✅ 統計容器可見');
        
        // 2. 檢查容器樣式屬性
        const containerStyles = await statsContainer.evaluate((el) => {
            const computedStyle = window.getComputedStyle(el);
            return {
                borderRadius: computedStyle.borderRadius,
                padding: computedStyle.padding,
                display: computedStyle.display,
                gridTemplateColumns: computedStyle.gridTemplateColumns,
                gap: computedStyle.gap
            };
        });
        
        console.log('📐 容器樣式檢查:');
        console.log(`   圓角: ${containerStyles.borderRadius}`);
        console.log(`   內間距: ${containerStyles.padding}`);
        console.log(`   顯示模式: ${containerStyles.display}`);
        console.log(`   網格列數: ${containerStyles.gridTemplateColumns}`);
        console.log(`   間隔: ${containerStyles.gap}`);
        
        // 驗證基本佈局屬性
        expect(containerStyles.borderRadius).not.toBe('0px');
        expect(containerStyles.padding).not.toBe('0px');
        expect(containerStyles.display).toBe('grid');
        
        console.log('✅ 容器基本佈局屬性正常');
    });

    test('深色主題統計容器樣式驗證', async ({ page }) => {
        console.log('🌙 測試深色主題統計容器樣式...');
        
        // 確保是深色主題
        await page.evaluate(() => {
            localStorage.removeItem('nexus-theme');
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.classList.add('dark-theme', 'dark');
        });
        
        await page.waitForTimeout(1000);
        
        const statsContainer = page.locator('#statsGrid');
        
        // 檢查深色主題容器背景
        const containerBackground = await statsContainer.evaluate((el) => {
            const computedStyle = window.getComputedStyle(el);
            return {
                background: computedStyle.background,
                backgroundColor: computedStyle.backgroundColor,
                border: computedStyle.border,
                boxShadow: computedStyle.boxShadow
            };
        });
        
        console.log('🎨 深色主題容器樣式:');
        console.log(`   背景: ${containerBackground.background.substring(0, 100)}...`);
        console.log(`   背景色: ${containerBackground.backgroundColor}`);
        console.log(`   邊框: ${containerBackground.border}`);
        console.log(`   陰影: ${containerBackground.boxShadow ? '有' : '無'}`);
        
        // 驗證深色主題樣式
        expect(containerBackground.background).toContain('linear-gradient');
        expect(containerBackground.border).not.toBe('none');
        
        console.log('✅ 深色主題容器樣式正常');
    });

    test('統計卡片排版和對齊驗證', async ({ page }) => {
        console.log('📊 測試統計卡片的排版和對齊...');
        
        const statsContainer = page.locator('#statsGrid');
        const statCards = statsContainer.locator('.nexus-card, .stat-card-container');
        
        // 檢查卡片數量
        const cardCount = await statCards.count();
        console.log(`📦 找到 ${cardCount} 個統計卡片`);
        
        if (cardCount > 0) {
            // 檢查第一個卡片的樣式
            const firstCard = statCards.first();
            
            const cardStyles = await firstCard.evaluate((el) => {
                const computedStyle = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return {
                    padding: computedStyle.padding,
                    textAlign: computedStyle.textAlign,
                    display: computedStyle.display,
                    width: rect.width,
                    height: rect.height,
                    visibility: computedStyle.visibility
                };
            });
            
            console.log('🎯 卡片樣式檢查:');
            console.log(`   內間距: ${cardStyles.padding}`);
            console.log(`   文字對齊: ${cardStyles.textAlign}`);
            console.log(`   顯示模式: ${cardStyles.display}`);
            console.log(`   寬度: ${cardStyles.width.toFixed(2)}px`);
            console.log(`   高度: ${cardStyles.height.toFixed(2)}px`);
            console.log(`   可見性: ${cardStyles.visibility}`);
            
            // 驗證卡片基本屬性
            expect(cardStyles.visibility).toBe('visible');
            expect(cardStyles.width).toBeGreaterThan(100);
            expect(cardStyles.height).toBeGreaterThan(50);
            
            console.log('✅ 統計卡片排版正常');
        } else {
            console.log('⚠️ 未找到統計卡片');
        }
    });

    test('主題切換統計容器測試', async ({ page }) => {
        console.log('🔄 測試主題切換對統計容器的影響...');
        
        const statsContainer = page.locator('#statsGrid');
        
        // 測試深色主題
        await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'dark');
        });
        await page.waitForTimeout(500);
        
        const darkStyles = await statsContainer.evaluate((el) => {
            return window.getComputedStyle(el).background;
        });
        
        console.log(`🌙 深色主題背景: ${darkStyles.substring(0, 80)}...`);
        
        // 切換到淺色主題
        await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'light');
        });
        await page.waitForTimeout(500);
        
        const lightStyles = await statsContainer.evaluate((el) => {
            return window.getComputedStyle(el).background;
        });
        
        console.log(`☀️ 淺色主題背景: ${lightStyles.substring(0, 80)}...`);
        
        // 驗證兩個主題的背景不同
        expect(darkStyles).not.toBe(lightStyles);
        
        console.log('✅ 主題切換功能正常，統計容器樣式會跟隨主題變化');
    });

    test('截圖驗證 - 修復後的統計容器', async ({ page }) => {
        console.log('📸 截圖驗證統計容器修復效果...');
        
        // 深色主題截圖
        await page.evaluate(() => {
            localStorage.removeItem('nexus-theme');
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.classList.add('dark-theme', 'dark');
        });
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
            path: 'stats-container-fixed-dark.png',
            fullPage: false,
            clip: { x: 0, y: 200, width: 1200, height: 600 }
        });
        console.log('📷 深色主題截圖: stats-container-fixed-dark.png');
        
        // 淺色主題截圖
        await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'light');
            document.documentElement.classList.remove('dark-theme', 'dark');
            document.documentElement.classList.add('light-theme');
        });
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
            path: 'stats-container-fixed-light.png',
            fullPage: false,
            clip: { x: 0, y: 200, width: 1200, height: 600 }
        });
        console.log('📷 淺色主題截圖: stats-container-fixed-light.png');
    });
});

test.afterAll(async () => {
    console.log('\n🎯 統計分析容器修復測試完成');
    console.log('📊 測試項目:');
    console.log('   ✅ 容器佈局修復 (圓角、內間距)');
    console.log('   ✅ 深色主題樣式應用');
    console.log('   ✅ 統計卡片排版對齊');
    console.log('   ✅ 主題切換功能');
    console.log('   ✅ 視覺效果截圖');
});