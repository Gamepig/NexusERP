import { chromium } from 'playwright';

async function testDashboard() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('=== NexusERP 儀表板測試報告 ===\n');

        // 1. 導航到登入頁面
        console.log('1. 導航到登入頁面...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        // 檢查登入頁面
        const loginTitle = await page.title();
        console.log(`   - 頁面標題: ${loginTitle}`);
        
        // 2. 執行登入
        console.log('\n2. 執行登入測試...');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        
        // 點擊登入按鈕並等待響應
        const [response] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/login')),
            page.click('button[type="submit"]')
        ]);
        
        console.log(`   - 登入請求狀態: ${response.status()}`);
        
        // 等待重定向
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('   - ✅ 成功重定向到儀表板');

        // 3. 檢查儀表板頁面載入
        console.log('\n3. 檢查儀表板頁面載入...');
        await page.waitForLoadState('networkidle');
        
        const dashboardTitle = await page.title();
        console.log(`   - 儀表板頁面標題: ${dashboardTitle}`);

        // 4. 監聽網路請求
        console.log('\n4. 監聽 API 請求...');
        const apiRequests = [];
        
        page.on('response', response => {
            if (response.url().includes('/api/')) {
                apiRequests.push({
                    url: response.url(),
                    status: response.status(),
                    headers: response.headers()
                });
            }
        });

        // 等待 API 請求
        await page.waitForTimeout(5000);

        // 5. 檢查 JavaScript 錯誤
        console.log('\n5. 檢查 JavaScript 錯誤...');
        const jsErrors = await page.evaluate(() => {
            const errors = [];
            const originalError = window.console.error;
            window.console.error = function(...args) {
                errors.push(args.join(' '));
                originalError.apply(console, args);
            };
            return errors;
        });

        if (jsErrors.length > 0) {
            console.log('   - ⚠️ JavaScript 錯誤:');
            jsErrors.forEach(error => console.log(`     ${error}`));
        } else {
            console.log('   - ✅ 無 JavaScript 錯誤');
        }

        // 6. 檢查 API 請求結果
        console.log('\n6. API 請求結果:');
        if (apiRequests.length > 0) {
            apiRequests.forEach(req => {
                console.log(`   - ${req.url}: ${req.status}`);
            });
        } else {
            console.log('   - ⚠️ 未檢測到 API 請求');
        }

        // 7. 檢查頁面元素
        console.log('\n7. 檢查頁面元素...');
        
        // 檢查卡片元素
        const cards = await page.locator('.card, .dashboard-card, [class*="card"]').count();
        console.log(`   - 儀表板卡片數量: ${cards}`);
        
        // 檢查圖表元素
        const charts = await page.locator('canvas, .chart, [class*="chart"]').count();
        console.log(`   - 圖表元素數量: ${charts}`);

        // 8. 檢查資料載入
        console.log('\n8. 檢查資料載入狀態...');
        const dataStatus = await page.evaluate(() => {
            return {
                hasDashboardData: typeof window.dashboardData !== 'undefined',
                hasLoading: !!document.querySelector('.loading, .spinner, [class*="loading"]'),
                visibleContent: document.querySelectorAll('.card:not(.d-none), .dashboard-card:not(.d-none)').length
            };
        });
        
        console.log(`   - 儀表板資料: ${dataStatus.hasDashboardData ? '✅ 已載入' : '⚠️ 未載入'}`);
        console.log(`   - 載入狀態: ${dataStatus.hasLoading ? '⚠️ 仍在載入' : '✅ 載入完成'}`);
        console.log(`   - 可見內容數量: ${dataStatus.visibleContent}`);

        // 9. 截圖
        console.log('\n9. 截取畫面...');
        await page.screenshot({ path: 'dashboard_test_result.png', fullPage: true });
        console.log('   - ✅ 截圖已儲存: dashboard_test_result.png');

        // 10. 檢查控制台日誌
        console.log('\n10. 瀏覽器控制台日誌:');
        const logs = await page.evaluate(() => {
            return window.console._logs || [];
        });
        
        if (logs.length > 0) {
            logs.forEach(log => console.log(`   - ${log}`));
        } else {
            console.log('   - 無特殊控制台日誌');
        }

        console.log('\n=== 測試完成 ===');

    } catch (error) {
        console.error('測試過程中發生錯誤:', error);
    } finally {
        await browser.close();
    }
}

testDashboard();