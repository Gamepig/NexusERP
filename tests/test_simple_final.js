import { chromium } from 'playwright';

async function simpleFinalTest() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('=== 儀表板簡單最終測試 ===\n');

        // 1. 登入
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ 登入成功');

        // 2. 等待並檢查狀態變化
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(10000); // 等待 10 秒讓數據載入
        
        // 3. 檢查當前狀態
        const currentState = await page.evaluate(() => {
            const loading = document.getElementById('dashboardLoading');
            const stats = document.getElementById('dashboardStats');
            const error = document.getElementById('dashboardError');
            
            return {
                loadingVisible: loading && !loading.classList.contains('hidden'),
                statsVisible: stats && !stats.classList.contains('hidden'),
                errorVisible: error && !error.classList.contains('hidden'),
                loadingClasses: loading ? Array.from(loading.classList) : [],
                statsClasses: stats ? Array.from(stats.classList) : [],
                errorClasses: error ? Array.from(error.classList) : []
            };
        });
        
        console.log('頁面狀態:');
        console.log('  載入中:', currentState.loadingVisible ? '✅ 顯示' : '❌ 隱藏');
        console.log('  統計內容:', currentState.statsVisible ? '✅ 顯示' : '❌ 隱藏');
        console.log('  錯誤狀態:', currentState.errorVisible ? '⚠️ 顯示' : '✅ 隱藏');
        
        // 4. 截圖
        await page.screenshot({ path: 'dashboard_simple_final.png', fullPage: true });
        console.log('截圖已儲存: dashboard_simple_final.png');

        // 5. 檢查控制台日誌
        const logs = await page.evaluate(() => {
            return window.consoleHistory || [];
        });
        
        console.log(`控制台日誌: ${logs.length} 條`);

        console.log('\n測試完成');

    } catch (error) {
        console.error('測試錯誤:', error);
    } finally {
        await browser.close();
    }
}

simpleFinalTest();