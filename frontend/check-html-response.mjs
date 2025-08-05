import { chromium } from 'playwright';

async function checkHtmlResponse() {
    console.log('🔍 檢查實際的 HTML 響應...');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        await page.goto('http://127.0.0.1:8000/reports/financial/profit-loss');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 檢查導航中是否有主題切換按鈕
        const navigationHtml = await page.locator('nav').innerHTML();
        console.log('🧭 導航 HTML 中包含 theme-toggle 的部分:');
        
        const themeToggleMatch = navigationHtml.match(/data-theme-toggle[\s\S]*?<\/button>/);
        if (themeToggleMatch) {
            console.log(themeToggleMatch[0]);
        } else {
            console.log('❌ 找不到 data-theme-toggle 按鈕');
        }
        
        // 檢查是否有 theme-toggle.js
        const scripts = await page.locator('script[src*="theme-toggle"]').count();
        console.log(`🔧 theme-toggle.js 腳本數量: ${scripts}`);
        
        // 檢查控制台錯誤
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        await page.waitForTimeout(1000);
        
        if (errors.length > 0) {
            console.log('❌ 控制台錯誤:');
            errors.forEach(error => console.log(`  ${error}`));
        } else {
            console.log('✅ 沒有控制台錯誤');
        }
        
        // 檢查是否有 nexusTheme 全域變數
        const nexusThemeExists = await page.evaluate(() => {
            return {
                windowNexusTheme: typeof window.NexusTheme !== 'undefined',
                nexusThemeVar: typeof nexusTheme !== 'undefined',
                NexusThemeManagerClass: typeof NexusThemeManager !== 'undefined'
            };
        });
        
        console.log('🎛️ JavaScript 變數狀況:', nexusThemeExists);
        
        // 試著手動執行主題切換
        const manualToggle = await page.evaluate(() => {
            const button = document.querySelector('[data-theme-toggle]');
            if (button) {
                return 'Button found';
            } else {
                return 'Button not found';
            }
        });
        
        console.log('👆 手動查找按鈕結果:', manualToggle);
        
    } catch (error) {
        console.error('❌ 檢查失敗:', error);
    } finally {
        await browser.close();
    }
}

checkHtmlResponse();