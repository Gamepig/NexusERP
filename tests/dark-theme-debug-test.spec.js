import { test, expect } from '@playwright/test';

test('深色主題下拉選單樣式除錯測試', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('🐛 深色主題下拉選單樣式除錯開始');
    
    // 強制設置深色主題
    await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
    });
    await page.waitForTimeout(500);
    
    // 檢查主題狀態
    const themeCheck = await page.evaluate(() => {
        return {
            htmlHasDark: document.documentElement.classList.contains('dark'),
            bodyHasDark: document.body.classList.contains('dark'),
            computedStyle: window.getComputedStyle(document.documentElement).backgroundColor
        };
    });
    console.log('🌙 主題檢查:', themeCheck);
    
    // 打開下拉選單
    await page.click('#user-menu-trigger');
    await page.waitForTimeout(1000);
    
    // 檢查Alpine.js動態樣式
    const alpineStyleCheck = await page.evaluate(() => {
        const dropdown = document.getElementById('user-dropdown-menu');
        if (!dropdown) return null;
        
        return {
            // Alpine.js :style 檢查
            hasAlpineStyle: dropdown.hasAttribute(':style'),
            alpineStyleAttr: dropdown.getAttribute(':style'),
            
            // 內聯樣式檢查
            inlineStyle: dropdown.getAttribute('style'),
            
            // 計算樣式檢查
            computed: {
                backgroundColor: window.getComputedStyle(dropdown).backgroundColor,
                background: window.getComputedStyle(dropdown).background
            },
            
            // DOM 狀態
            classList: Array.from(dropdown.classList),
            parentClassList: Array.from(dropdown.parentElement?.classList || []),
            
            // 深色主題檢測函數測試
            darkThemeTest: document.documentElement.classList.contains('dark'),
            
            // 直接執行條件檢查
            conditionalBg: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'
        };
    });
    
    console.log('🔍 Alpine.js 樣式除錯:', alpineStyleCheck);
    
    // 嘗試手動強制應用深色樣式
    await page.evaluate(() => {
        const dropdown = document.getElementById('user-dropdown-menu');
        if (dropdown) {
            console.log('🔧 手動強制應用深色樣式');
            dropdown.style.background = '#1f2937';
            dropdown.style.backgroundColor = '#1f2937';
            dropdown.style.border = '2px solid rgba(55, 65, 81, 0.8)';
            
            // 檢查應用後的結果
            const afterApply = {
                backgroundColor: dropdown.style.backgroundColor,
                computedBackgroundColor: window.getComputedStyle(dropdown).backgroundColor
            };
            console.log('💪 強制應用後:', afterApply);
            return afterApply;
        }
        return null;
    });
    
    await page.waitForTimeout(500);
    
    // 最終檢查
    const finalCheck = await page.evaluate(() => {
        const dropdown = document.getElementById('user-dropdown-menu');
        return {
            finalBackgroundColor: window.getComputedStyle(dropdown).backgroundColor,
            finalInlineStyle: dropdown.getAttribute('style')
        };
    });
    
    console.log('🎯 最終樣式檢查:', finalCheck);
    
    await page.screenshot({ path: `dark-theme-debug-${Date.now()}.png` });
});