const { chromium } = require('playwright');

async function testThemeToggle() {
    console.log('🚀 開始測試主題切換功能...');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 前往報表頁面
        console.log('📍 前往損益表頁面...');
        await page.goto('http://127.0.0.1:8000/reports/financial/profit-loss');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 檢查當前主題狀態
        const currentTheme = await page.evaluate(() => {
            return {
                hasLightTheme: document.documentElement.classList.contains('light-theme'),
                hasDarkTheme: document.documentElement.classList.contains('dark-theme'),
                hasNxTheme: document.documentElement.classList.contains('dark'),
                backgroundColor: getComputedStyle(document.body).backgroundColor,
                textColor: getComputedStyle(document.body).color
            };
        });
        
        console.log('🎨 當前主題狀態:', currentTheme);
        
        // 檢查主題切換按鈕是否存在
        const toggleButton = await page.locator('[data-theme-toggle]').first();
        const buttonExists = await toggleButton.count() > 0;
        console.log('🔘 主題切換按鈕存在:', buttonExists);
        
        if (buttonExists) {
            // 嘗試點擊主題切換按鈕
            console.log('👆 點擊主題切換按鈕...');
            await toggleButton.click();
            await page.waitForTimeout(1000);
            
            // 檢查主題是否變化
            const newTheme = await page.evaluate(() => {
                return {
                    hasLightTheme: document.documentElement.classList.contains('light-theme'),
                    hasDarkTheme: document.documentElement.classList.contains('dark-theme'),
                    hasNxTheme: document.documentElement.classList.contains('dark'),
                    backgroundColor: getComputedStyle(document.body).backgroundColor,
                    textColor: getComputedStyle(document.body).color
                };
            });
            
            console.log('🎨 切換後主題狀態:', newTheme);
            
            // 檢查是否有變化
            const themeChanged = JSON.stringify(currentTheme) !== JSON.stringify(newTheme);
            console.log('🔄 主題是否發生變化:', themeChanged);
        }
        
        // 檢查 JavaScript 錯誤
        const jsErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                jsErrors.push(msg.text());
            }
        });
        
        // 檢查 CSS 變數是否正確載入
        const cssVariables = await page.evaluate(() => {
            const computedStyle = getComputedStyle(document.documentElement);
            return {
                nexusTextPrimary: computedStyle.getPropertyValue('--nexus-text-primary').trim(),
                nexusBgPrimary: computedStyle.getPropertyValue('--nexus-bg-primary').trim(),
                nexusCardBg: computedStyle.getPropertyValue('--nexus-card-bg').trim(),
                nxTextPrimary: computedStyle.getPropertyValue('--nx-text-primary').trim(),
                nxBgPrimary: computedStyle.getPropertyValue('--nx-bg-primary').trim()
            };
        });
        
        console.log('🎛️ CSS 變數狀況:', cssVariables);
        
        // 檢查主題切換 JS 是否載入
        const themeManagerExists = await page.evaluate(() => {
            return typeof window.NexusTheme !== 'undefined' && typeof nexusTheme !== 'undefined';
        });
        
        console.log('🔧 主題管理器是否載入:', themeManagerExists);
        
        if (jsErrors.length > 0) {
            console.log('❌ JavaScript 錯誤:', jsErrors);
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error);
    } finally {
        await browser.close();
    }
}

testThemeToggle();