import { test, expect } from '@playwright/test';

test('檢查應用程式內的導航狀況', async ({ page }) => {
    try {
        console.log('🔍 檢查應用程式內導航狀況');
        
        // 設定視窗大小
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // 先前往登入頁面
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        // 截圖登入頁面
        await page.screenshot({ path: 'navigation-app-01-login.png' });
        
        // 嘗試登入（使用之前創建的測試帳號）
        const emailInput = page.locator('input[name="email"], input[type="email"]');
        const passwordInput = page.locator('input[name="password"], input[type="password"]');
        const loginButton = page.locator('button[type="submit"], input[type="submit"]');
        
        if (await emailInput.isVisible()) {
            await emailInput.fill('test@example.com');
            await passwordInput.fill('password123');
            
            // 截圖填寫後的登入表單
            await page.screenshot({ path: 'navigation-app-02-login-filled.png' });
            
            await loginButton.click();
            await page.waitForLoadState('networkidle');
            
            // 截圖登入後的頁面
            await page.screenshot({ path: 'navigation-app-03-after-login.png' });
            
            console.log('✅ 成功登入');
            
            // 檢查是否有我們修改的導航
            const enhancedNav = page.locator('[x-data*="enhancedNavigation"]');
            if (await enhancedNav.count() > 0) {
                console.log('✅ 找到 enhancedNavigation 元素');
                await enhancedNav.screenshot({ path: 'navigation-app-enhanced-nav.png' });
            } else {
                console.log('❌ 未找到 enhancedNavigation 元素');
            }
            
            // 檢查 multi-level-nav 元素
            const multiNav = page.locator('.nexus-multi-nav');
            if (await multiNav.count() > 0) {
                console.log('✅ 找到 nexus-multi-nav 元素');
                await multiNav.screenshot({ path: 'navigation-app-multi-nav.png' });
                
                // 檢查導航項目
                const navItems = await multiNav.locator('li').count();
                console.log(`📊 導航項目數量: ${navItems}`);
                
                // 檢查是否右對齊
                const navContainer = page.locator('.hidden.lg\\:flex.flex-1.justify-end');
                if (await navContainer.count() > 0) {
                    console.log('✅ 導航容器右對齊設定存在');
                } else {
                    console.log('❌ 導航容器右對齊設定未找到');
                }
                
            } else {
                console.log('❌ 未找到 nexus-multi-nav 元素');
            }
            
        } else {
            console.log('❌ 未找到登入表單，嘗試直接訪問儀表板');
            
            // 嘗試直接訪問儀表板
            await page.goto('http://127.0.0.1:8000/dashboard');
            await page.waitForLoadState('networkidle');
            
            // 截圖儀表板頁面
            await page.screenshot({ path: 'navigation-app-04-dashboard.png' });
        }
        
        // 無論如何，截圖當前頁面
        await page.screenshot({ 
            path: 'navigation-app-05-current-page.png', 
            fullPage: true 
        });
        
        console.log('✅ 應用程式導航檢查完成');
        
    } catch (error) {
        console.error('❌ 檢查失敗:', error);
        await page.screenshot({ path: 'navigation-app-error.png' });
        throw error;
    }
});