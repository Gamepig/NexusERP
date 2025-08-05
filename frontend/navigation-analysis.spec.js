import { test, expect } from '@playwright/test';

test('分析當前導航列狀態', async ({ page }) => {
    try {
        // 設定視窗大小為桌面版
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // 前往首頁
        await page.goto('http://127.0.0.1:8000');
        
        // 等待頁面完全載入
        await page.waitForLoadState('networkidle');
        
        // 截圖整個頁面
        await page.screenshot({ 
            path: 'navigation-current-full-page.png', 
            fullPage: true 
        });
        
        // 截圖導航區域
        const navigation = page.locator('nav[role="navigation"][aria-label="主要導航"]');
        if (await navigation.isVisible()) {
            await navigation.screenshot({ 
                path: 'navigation-current-header-only.png' 
            });
        }
        
        // 分析導航結構
        console.log('=== 導航結構分析 ===');
        
        // 檢查 Logo 和品牌
        const logo = page.locator('x-application-logo');
        if (await logo.isVisible()) {
            console.log('✅ Logo 元素存在');
        }
        
        // 檢查主導航
        const mainNav = page.locator('.nexus-multi-nav');
        if (await mainNav.isVisible()) {
            console.log('✅ 主導航存在');
            const navItems = mainNav.locator('li');
            const itemCount = await navItems.count();
            console.log(`📊 導航項目數量: ${itemCount}`);
        }
        
        // 檢查主題切換按鈕
        const themeToggle = page.locator('[data-theme-toggle]');
        if (await themeToggle.isVisible()) {
            console.log('✅ 主題切換按鈕存在');
        }
        
        // 檢查使用者選單
        const userMenu = page.locator('.nexus-user-trigger-modern');
        if (await userMenu.isVisible()) {
            console.log('✅ 使用者選單存在');
        }
        
        // 測試響應式設計
        console.log('\n=== 響應式測試 ===');
        
        // 平板版測試
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.screenshot({ 
            path: 'navigation-current-tablet.png' 
        });
        
        // 手機版測試
        await page.setViewportSize({ width: 375, height: 667 });
        await page.screenshot({ 
            path: 'navigation-current-mobile.png' 
        });
        
        console.log('✅ 導航分析完成');
        console.log('📸 截圖已保存：');
        console.log('   - navigation-current-full-page.png');
        console.log('   - navigation-current-header-only.png');
        console.log('   - navigation-current-tablet.png');
        console.log('   - navigation-current-mobile.png');
        
    } catch (error) {
        console.error('❌ 導航分析失敗:', error);
        throw error;
    }
});