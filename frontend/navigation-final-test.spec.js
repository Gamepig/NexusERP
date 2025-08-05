import { test, expect } from '@playwright/test';

test('最終導航調整效果驗證', async ({ page }) => {
    try {
        console.log('🎯 最終導航調整效果驗證');
        
        // 設定視窗大小為桌面版
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // 前往登入頁面並登入
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        const emailInput = page.locator('input[name="email"], input[type="email"]');
        const passwordInput = page.locator('input[name="password"], input[type="password"]');
        const loginButton = page.locator('button[type="submit"], input[type="submit"]');
        
        if (await emailInput.isVisible()) {
            await emailInput.fill('test@example.com');
            await passwordInput.fill('password123');
            await loginButton.click();
            await page.waitForLoadState('networkidle');
            console.log('✅ 成功登入');
        }
        
        // 截圖整個頁面（登入後）
        await page.screenshot({ 
            path: 'navigation-final-01-full-page.png', 
            fullPage: true 
        });
        
        // 檢查桌面版主導航（使用 ID 選擇器避免衝突）
        const mainNavigation = page.locator('#main-navigation');
        await expect(mainNavigation).toBeVisible();
        console.log('✅ 主導航可見');
        
        // 截圖主導航區域
        await mainNavigation.screenshot({ 
            path: 'navigation-final-02-main-nav.png' 
        });
        
        // 檢查導航容器的右對齊設定
        const navContainer = page.locator('.hidden.lg\\:flex.flex-1.justify-end');
        if (await navContainer.count() > 0) {
            console.log('✅ 導航容器右對齊設定已應用');
            await navContainer.screenshot({ 
                path: 'navigation-final-03-nav-container.png' 
            });
        } else {
            console.log('❌ 導航容器右對齊設定未找到');
        }
        
        // 檢查導航項目的樣式
        const navItems = mainNavigation.locator('li');
        const itemCount = await navItems.count();
        console.log(`📊 主導航項目數量: ${itemCount}`);
        
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
            const borderRadius = await firstNavItem.evaluate((el) => {
                return window.getComputedStyle(el).borderRadius;
            });
            console.log(`🔲 導航邊框圓角: ${borderRadius}`);
            
            // 測試懸停效果
            console.log('🔄 測試懸停效果...');
            await firstNavItem.hover();
            await page.waitForTimeout(1000);
            
            await page.screenshot({ 
                path: 'navigation-final-04-hover-effect.png' 
            });
            
            // 檢查懸停後的背景色
            const hoverBackgroundColor = await firstNavItem.evaluate((el) => {
                return window.getComputedStyle(el).backgroundColor;
            });
            console.log(`🎨 懸停背景色: ${hoverBackgroundColor}`);
        }
        
        // 檢查整體頁面佈局 - 導航是否正確右對齊
        const headerContainer = page.locator('header').first();
        if (await headerContainer.isVisible()) {
            await headerContainer.screenshot({ 
                path: 'navigation-final-05-full-header.png' 
            });
            console.log('✅ 完整頁首截圖完成');
        }
        
        // 響應式測試 - 平板版
        console.log('📱 開始平板版測試...');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1500);
        
        await page.screenshot({ 
            path: 'navigation-final-06-tablet.png' 
        });
        
        // 響應式測試 - 手機版
        console.log('📱 開始手機版測試...');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1500);
        
        await page.screenshot({ 
            path: 'navigation-final-07-mobile.png' 
        });
        
        // 回到桌面版測試功能
        console.log('💻 回到桌面版測試功能...');
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1500);
        
        // 測試主題切換功能
        const themeToggle = page.locator('[data-theme-toggle]');
        if (await themeToggle.isVisible()) {
            console.log('🎨 測試主題切換功能...');
            await themeToggle.click();
            await page.waitForTimeout(1500);
            
            await page.screenshot({ 
                path: 'navigation-final-08-dark-theme.png' 
            });
            console.log('✅ 深色主題測試完成');
            
            // 切換回亮色主題
            await themeToggle.click();
            await page.waitForTimeout(1500);
        }
        
        // 測試使用者選單
        const userMenu = page.locator('.nexus-user-trigger-modern');
        if (await userMenu.isVisible()) {
            console.log('👤 測試使用者選單...');
            await userMenu.click();
            await page.waitForTimeout(1000);
            
            await page.screenshot({ 
                path: 'navigation-final-09-user-menu.png' 
            });
            console.log('✅ 使用者選單測試完成');
        }
        
        // 最終完整效果截圖
        await page.screenshot({ 
            path: 'navigation-final-10-complete-result.png', 
            fullPage: true 
        });
        
        console.log('🎉 導航調整效果驗證完成！');
        console.log('📸 已生成截圖：');
        console.log('   01. navigation-final-01-full-page.png - 完整頁面');
        console.log('   02. navigation-final-02-main-nav.png - 主導航區域');
        console.log('   03. navigation-final-03-nav-container.png - 導航容器');
        console.log('   04. navigation-final-04-hover-effect.png - 懸停效果');
        console.log('   05. navigation-final-05-full-header.png - 完整頁首');
        console.log('   06. navigation-final-06-tablet.png - 平板版效果');
        console.log('   07. navigation-final-07-mobile.png - 手機版效果');
        console.log('   08. navigation-final-08-dark-theme.png - 深色主題');
        console.log('   09. navigation-final-09-user-menu.png - 使用者選單');
        console.log('   10. navigation-final-10-complete-result.png - 最終效果');
        
    } catch (error) {
        console.error('❌ 測試失敗:', error);
        await page.screenshot({ path: 'navigation-final-error.png' });
        throw error;
    }
});