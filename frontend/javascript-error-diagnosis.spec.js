import { test, expect } from '@playwright/test';

test.describe('JavaScript 錯誤深度診斷', () => {
    
    test('檢查銷售報表 JavaScript 語法錯誤', async ({ page }) => {
        console.log('🔍 檢查 JavaScript 語法錯誤...');

        // 監聽所有錯誤
        const errors = [];
        const consoleMessages = [];
        
        page.on('pageerror', error => {
            errors.push({
                type: 'pageerror',
                message: error.message,
                stack: error.stack
            });
            console.log('🚨 Page Error:', error.message);
            if (error.stack) {
                console.log('🔍 Stack Trace:', error.stack);
            }
        });

        page.on('console', msg => {
            consoleMessages.push({
                type: msg.type(),
                text: msg.text(),
                location: msg.location()
            });
            if (msg.type() === 'error') {
                console.log('🔴 Console Error:', msg.text());
                console.log('📍 Location:', msg.location());
            }
        });

        // 登入
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/dashboard/);

        // 訪問銷售報表頁面並等待載入
        console.log('📊 訪問銷售報表頁面...');
        await page.goto('http://127.0.0.1:8000/reports/sales');
        
        // 等待更長時間確保所有資源載入
        await page.waitForTimeout(5000);

        // 檢查頁面內容
        const bodyContent = await page.textContent('body');
        console.log('📝 Body 內容長度:', bodyContent.length);
        console.log('📝 Body 內容摘要:', bodyContent.substring(0, 200));

        // 檢查是否有 HTML 內容
        const htmlContent = await page.content();
        console.log('📄 HTML 內容長度:', htmlContent.length);

        // 檢查是否有腳本標籤
        const scripts = await page.locator('script').count();
        console.log('📜 Script 標籤數量:', scripts);

        // 檢查 Chart.js 是否載入
        const chartJsStatus = await page.evaluate(() => {
            return {
                chartLoaded: typeof window.Chart !== 'undefined',
                jqueryLoaded: typeof window.$ !== 'undefined',
                windowKeys: Object.keys(window).filter(key => key.toLowerCase().includes('chart')),
                documentReadyState: document.readyState
            };
        });
        console.log('📊 JavaScript 載入狀態:', chartJsStatus);

        // 檢查錯誤摘要
        console.log('📋 錯誤摘要:');
        console.log('  - Page Errors:', errors.length);
        console.log('  - Console Messages:', consoleMessages.length);
        
        if (errors.length > 0) {
            console.log('🚨 詳細錯誤:');
            errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.message}`);
                if (error.stack) {
                    console.log(`     Stack: ${error.stack.split('\n')[0]}`);
                }
            });
        }

        const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
        if (errorMessages.length > 0) {
            console.log('🔴 控制台錯誤:');
            errorMessages.forEach((msg, index) => {
                console.log(`  ${index + 1}. ${msg.text}`);
                console.log(`     位置: ${JSON.stringify(msg.location)}`);
            });
        }

        // 檢查特定的 HTML 元素
        const elementCheck = await page.evaluate(() => {
            return {
                hasTitle: !!document.querySelector('title'),
                hasBody: !!document.body,
                hasHead: !!document.head,
                bodyChildren: document.body ? document.body.children.length : 0,
                headChildren: document.head ? document.head.children.length : 0
            };
        });
        console.log('🏗️ HTML 結構檢查:', elementCheck);

        // 截圖以記錄狀態
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/screenshots/javascript-error-diagnosis.png',
            fullPage: true 
        });

        console.log('✅ 診斷完成');
    });
});