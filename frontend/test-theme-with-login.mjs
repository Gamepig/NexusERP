import { chromium } from 'playwright';

async function testThemeWithLogin() {
    console.log('🚀 開始測試主題切換功能（含登入）...');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 前往登入頁面
        console.log('🔐 前往登入頁面...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        // 檢查是否有登入表單
        const loginForm = await page.locator('form').count() > 0;
        if (loginForm) {
            // 嘗試使用測試帳號登入
            console.log('📝 填寫登入資訊...');
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            
            console.log('👆 點擊登入按鈕...');
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
        }
        
        // 前往報表頁面
        console.log('📍 前往損益表頁面...');
        await page.goto('http://127.0.0.1:8000/reports/financial/profit-loss');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // 檢查是否成功進入報表頁面
        const currentUrl = page.url();
        console.log('🌐 當前頁面 URL:', currentUrl);
        
        if (currentUrl.includes('/login')) {
            console.log('❌ 仍在登入頁面，登入失敗');
            
            // 嘗試直接訪問儀表板
            console.log('🏠 嘗試訪問儀表板...');
            await page.goto('http://127.0.0.1:8000/dashboard');
            await page.waitForLoadState('networkidle');
            
            const dashboardUrl = page.url();
            console.log('🌐 儀表板 URL:', dashboardUrl);
            
            if (dashboardUrl.includes('/login')) {
                console.log('❌ 需要有效的登入憑證');
                return;
            }
        }
        
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
            console.log('✅ 找到主題切換按鈕，測試點擊...');
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
            
            const themeChanged = JSON.stringify(currentTheme) !== JSON.stringify(newTheme);
            console.log('🔄 主題是否發生變化:', themeChanged);
        }
        
        // 檢查 CSS 變數和 JavaScript 載入
        const diagnostics = await page.evaluate(() => {
            const computedStyle = getComputedStyle(document.documentElement);
            return {
                cssVariables: {
                    nexusTextPrimary: computedStyle.getPropertyValue('--nexus-text-primary').trim(),
                    nexusBgPrimary: computedStyle.getPropertyValue('--nexus-bg-primary').trim(),
                },
                jsLoaded: {
                    nexusTheme: typeof nexusTheme !== 'undefined',
                    NexusThemeManager: typeof NexusThemeManager !== 'undefined'
                },
                localStorage: {
                    nexusTheme: localStorage.getItem('nexus-theme'),
                    theme: localStorage.getItem('theme')
                }
            };
        });
        
        console.log('🧪 診斷資訊:', diagnostics);
        
    } catch (error) {
        console.error('❌ 測試失敗:', error);
    } finally {
        await browser.close();
    }
}

testThemeWithLogin();