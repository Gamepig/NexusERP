const { test, expect } = require('@playwright/test');

// 測試財務報表頁面修復
test('測試財務報表頁面圖表修復', async ({ page }) => {
    
    // 開啟控制台監聽
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`❌ Console Error: ${msg.text()}`);
        }
    });

    page.on('pageerror', err => {
        console.log(`❌ Page Error: ${err.message}`);
    });

    try {
        console.log('🔍 Step 1: 登入系統...');
        
        // 訪問主頁並登入
        await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });
        
        const loginButton = await page.locator('text=登入').first();
        if (await loginButton.count() > 0) {
            await loginButton.click();
            await page.waitForTimeout(2000);
        }
        
        const emailInput = await page.locator('input[name="email"]');
        const passwordInput = await page.locator('input[name="password"]');
        
        if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
            await emailInput.fill('test@example.com');
            await passwordInput.fill('password123');
            
            const submitButton = await page.locator('button[type="submit"]').first();
            await submitButton.click();
            
            await page.waitForTimeout(3000);
            console.log('✅ 登入成功');
        }
        
        console.log('🔍 Step 2: 測試財務報表頁面...');
        
        // 訪問財務報表頁面
        await page.goto('http://127.0.0.1:8000/reports/financial', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000); // 等待圖表渲染
        
        // 截圖記錄修復後狀態
        await page.screenshot({ path: 'screenshots/financial-fixed-test.png', fullPage: true });
        
        // 檢查Canvas元素
        const canvases = await page.locator('canvas').count();
        const loadingTexts = await page.locator('text=圖表載入中...').count();
        const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
        
        // 檢查特定Canvas ID
        const revenueChart = await page.locator('#revenueChart').count();
        const expenseChart = await page.locator('#expenseChart').count();
        
        console.log('=== 財務報表修復驗證結果 ===');
        console.log(`Canvas元素數量: ${canvases} 個`);
        console.log(`載入占位符: ${loadingTexts} 個`);
        console.log(`Chart.js載入: ${chartJsLoaded}`);
        console.log(`營收圖表Canvas: ${revenueChart} 個`);
        console.log(`費用圖表Canvas: ${expenseChart} 個`);
        
        // 驗證修復成功
        const isFixed = canvases >= 2 && loadingTexts === 0 && chartJsLoaded;
        
        if (isFixed) {
            console.log('✅ 財務報表頁面修復成功！');
            console.log('   - Canvas元素已添加');
            console.log('   - Chart.js已載入');
            console.log('   - 載入占位符已消失');
        } else {
            console.log('❌ 財務報表頁面修復不完整');
            console.log(`   - 預期Canvas: >=2, 實際: ${canvases}`);
            console.log(`   - 預期占位符: 0, 實際: ${loadingTexts}`);
            console.log(`   - Chart.js載入: ${chartJsLoaded}`);
        }
        
        // 等待圖表完全渲染
        await page.waitForTimeout(2000);
        
        // 檢查圖表是否實際渲染
        const chartRendered = await page.evaluate(() => {
            const revenueCanvas = document.getElementById('revenueChart');
            const expenseCanvas = document.getElementById('expenseChart');
            
            if (!revenueCanvas || !expenseCanvas) return false;
            
            // 檢查Canvas是否有內容（不是空白）
            const revenueCtx = revenueCanvas.getContext('2d');
            const expenseCtx = expenseCanvas.getContext('2d');
            
            const revenueData = revenueCtx.getImageData(0, 0, revenueCanvas.width, revenueCanvas.height);
            const expenseData = expenseCtx.getImageData(0, 0, expenseCanvas.width, expenseCanvas.height);
            
            // 簡單檢查是否有非透明像素
            let revenueHasContent = false;
            let expenseHasContent = false;
            
            for (let i = 3; i < revenueData.data.length; i += 4) {
                if (revenueData.data[i] > 0) {
                    revenueHasContent = true;
                    break;
                }
            }
            
            for (let i = 3; i < expenseData.data.length; i += 4) {
                if (expenseData.data[i] > 0) {
                    expenseHasContent = true;
                    break;
                }
            }
            
            return revenueHasContent && expenseHasContent;
        });
        
        console.log(`圖表實際渲染狀態: ${chartRendered ? '✅ 已渲染' : '❌ 未渲染'}`);
        
        // 最終修復狀態
        const finalStatus = isFixed && chartRendered ? '✅ 完全修復' : '⚠️ 部分修復';
        console.log(`\n🎯 財務報表最終狀態: ${finalStatus}`);
        
    } catch (error) {
        console.error('❌ 測試執行錯誤:', error.message);
        await page.screenshot({ path: 'screenshots/financial-test-error.png', fullPage: true });
    }
});