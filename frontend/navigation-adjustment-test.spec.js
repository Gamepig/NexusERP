import { test, expect } from '@playwright/test';

test('驗證導航列調整效果', async ({ page }) => {
    try {
        console.log('🧪 開始導航列調整驗證測試');
        
        // 桌面版測試 (1920x1080)
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('http://127.0.0.1:8000');
        await page.waitForLoadState('networkidle');
        
        // 截圖調整後的桌面版效果
        await page.screenshot({ 
            path: 'navigation-adjusted-desktop-1920.png', 
            fullPage: false 
        });
        
        // 檢查導航佈局
        const navigation = page.locator('nav[role="navigation"][aria-label="主要導航"]');
        await expect(navigation).toBeVisible();
        
        // 檢查主導航是否右對齊
        const mainNavContainer = page.locator('.hidden.lg\\:flex.flex-1.justify-end');
        await expect(mainNavContainer).toBeVisible();
        console.log('✅ 主導航右對齊佈局正確');
        
        // 檢查導航項目
        const navItems = page.locator('.nexus-multi-nav li');
        const itemCount = await navItems.count();
        console.log(`📊 導航項目數量: ${itemCount}`);
        
        // 檢查導航項目樣式
        if (itemCount > 0) {
            const firstNavItem = navItems.first().locator('button, a').first();
            
            // 檢查文字大小
            const fontSize = await firstNavItem.evaluate((el) => {
                return window.getComputedStyle(el).fontSize;
            });
            console.log(`📏 導航文字大小: ${fontSize}`);
            
            // 檢查背景色
            const backgroundColor = await firstNavItem.evaluate((el) => {
                return window.getComputedStyle(el).backgroundColor;
            });
            console.log(`🎨 導航背景色: ${backgroundColor}`);
            
            // 檢查邊框
            const border = await firstNavItem.evaluate((el) => {
                return window.getComputedStyle(el).border;
            });
            console.log(`🔲 導航邊框: ${border}`);
        }
        
        // 測試懸停效果
        if (itemCount > 0) {
            console.log('🔄 測試懸停效果...');
            await navItems.first().locator('button, a').first().hover();
            await page.waitForTimeout(500);
            
            await page.screenshot({ 
                path: 'navigation-adjusted-hover-effect.png' 
            });
            console.log('✅ 懸停效果截圖完成');
        }
        
        // 平板版測試 (768x1024)
        console.log('📱 開始平板版測試...');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
            path: 'navigation-adjusted-tablet-768.png' 
        });
        
        // 手機版測試 (375x667)
        console.log('📱 開始手機版測試...');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
            path: 'navigation-adjusted-mobile-375.png' 
        });
        
        // 回到桌面版進行功能測試
        console.log('💻 回到桌面版進行功能測試...');
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);
        
        // 測試主題切換功能
        const themeToggle = page.locator('[data-theme-toggle]');
        if (await themeToggle.isVisible()) {
            console.log('🎨 測試主題切換功能...');
            await themeToggle.click();
            await page.waitForTimeout(1000);
            
            await page.screenshot({ 
                path: 'navigation-adjusted-theme-switched.png' 
            });
            console.log('✅ 主題切換測試完成');
        }
        
        // 測試使用者選單
        const userMenu = page.locator('.nexus-user-trigger-modern');
        if (await userMenu.isVisible()) {
            console.log('👤 測試使用者選單...');
            await userMenu.click();
            await page.waitForTimeout(1000);
            
            await page.screenshot({ 
                path: 'navigation-adjusted-user-menu.png' 
            });
            console.log('✅ 使用者選單測試完成');
        }
        
        // 最終完整頁面截圖
        await page.screenshot({ 
            path: 'navigation-adjusted-final-result.png', 
            fullPage: true 
        });
        
        console.log('🎉 導航列調整驗證測試完成！');
        console.log('📸 已生成截圖：');
        console.log('   - navigation-adjusted-desktop-1920.png (桌面版效果)');
        console.log('   - navigation-adjusted-hover-effect.png (懸停效果)');
        console.log('   - navigation-adjusted-tablet-768.png (平板版效果)');
        console.log('   - navigation-adjusted-mobile-375.png (手機版效果)');
        console.log('   - navigation-adjusted-theme-switched.png (主題切換效果)');
        console.log('   - navigation-adjusted-user-menu.png (使用者選單效果)');
        console.log('   - navigation-adjusted-final-result.png (最終效果)');
        
    } catch (error) {
        console.error('❌ 導航列調整測試失敗:', error);
        await page.screenshot({ path: 'navigation-adjustment-error.png' });
        throw error;
    }
});