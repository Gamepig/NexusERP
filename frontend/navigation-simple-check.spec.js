import { test, expect } from '@playwright/test';

test('簡單檢查導航狀況', async ({ page }) => {
    try {
        console.log('🔍 簡單檢查導航狀況');
        
        // 設定視窗大小
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // 前往首頁
        await page.goto('http://127.0.0.1:8000');
        await page.waitForLoadState('networkidle');
        
        // 截圖整個頁面
        await page.screenshot({ 
            path: 'navigation-check-full-page.png', 
            fullPage: true 
        });
        
        // 檢查頁面標題
        const title = await page.title();
        console.log(`📄 頁面標題: ${title}`);
        
        // 檢查所有導航相關元素
        const navElements = await page.locator('nav').count();
        console.log(`🧭 找到 ${navElements} 個 nav 元素`);
        
        // 檢查是否有 enhanced-navigation 相關的元素
        const enhancedNav = page.locator('[x-data*="enhancedNavigation"]');
        if (await enhancedNav.count() > 0) {
            console.log('✅ 找到 enhancedNavigation 元素');
            await enhancedNav.screenshot({ path: 'navigation-enhanced-nav.png' });
        } else {
            console.log('❌ 未找到 enhancedNavigation 元素');
        }
        
        // 檢查 multi-level-nav 元素
        const multiNav = page.locator('.nexus-multi-nav');
        if (await multiNav.count() > 0) {
            console.log('✅ 找到 nexus-multi-nav 元素');
            await multiNav.screenshot({ path: 'navigation-multi-nav.png' });
        } else {
            console.log('❌ 未找到 nexus-multi-nav 元素');
        }
        
        // 列出所有可見的導航相關元素
        const allNavs = await page.locator('nav, [class*="nav"], [class*="navigation"]').all();
        console.log(`🔍 找到 ${allNavs.length} 個導航相關元素`);
        
        for (let i = 0; i < Math.min(allNavs.length, 5); i++) {
            const className = await allNavs[i].getAttribute('class');
            const role = await allNavs[i].getAttribute('role');
            const ariaLabel = await allNavs[i].getAttribute('aria-label');
            console.log(`   元素 ${i + 1}: class="${className}", role="${role}", aria-label="${ariaLabel}"`);
        }
        
        console.log('✅ 簡單檢查完成');
        
    } catch (error) {
        console.error('❌ 檢查失敗:', error);
        await page.screenshot({ path: 'navigation-check-error.png' });
        throw error;
    }
});