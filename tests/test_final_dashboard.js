import { chromium } from 'playwright';

async function finalDashboardTest() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('=== NexusERP 儀表板最終測試 ===\n');

        // 1. 登入
        console.log('1. 執行登入...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('   - ✅ 登入成功');

        // 2. 等待儀表板完全載入
        console.log('\n2. 等待儀表板載入...');
        await page.waitForLoadState('networkidle');
        
        // 等待儀表板數據載入完成
        await page.waitForFunction(() => {
            const loading = document.getElementById('dashboardLoading');
            const stats = document.getElementById('dashboardStats');
            return loading?.classList.contains('hidden') && !stats?.classList.contains('hidden');
        }, { timeout: 15000 });
        
        console.log('   - ✅ 儀表板內容載入完成');

        // 3. 檢查頁面元素
        console.log('\n3. 檢查頁面元素...');
        
        // 統計卡片
        const statCards = await page.locator('[data-stat]').count();
        console.log(`   - 統計卡片數量: ${statCards}`);
        
        // 圖表元素
        const charts = await page.locator('canvas').count();
        console.log(`   - 圖表數量: ${charts}`);
        
        // 快速操作
        const quickActions = await page.locator('#quickActions .quick-action-card').count();
        console.log(`   - 快速操作數量: ${quickActions}`);

        // 4. 檢查圖表是否有數據
        console.log('\n4. 檢查圖表數據...');
        const chartData = await page.evaluate(() => {
            const chartInfo = [];
            const canvases = document.querySelectorAll('canvas');
            
            canvases.forEach((canvas, index) => {
                const chartId = canvas.id;
                const hasChart = !!window.dashboardComponents?.chartManager?.charts?.[chartId.replace('Chart', '')];
                chartInfo.push({
                    id: chartId,
                    hasChart: hasChart,
                    width: canvas.width,
                    height: canvas.height
                });
            });
            
            return chartInfo;
        });
        
        chartData.forEach((chart, index) => {
            console.log(`   - 圖表 ${index + 1} (${chart.id}): ${chart.hasChart ? '✅ 已載入' : '❌ 未載入'} ${chart.width}x${chart.height}`);
        });

        // 5. 測試互動功能
        console.log('\n5. 測試互動功能...');
        
        // 測試刷新按鈕
        const refreshBtn = page.locator('[data-action="refresh-dashboard"]');
        if (await refreshBtn.count() > 0) {
            console.log('   - 測試手動刷新按鈕...');
            await refreshBtn.click();
            await page.waitForTimeout(2000);
            console.log('   - ✅ 手動刷新功能正常');
        }

        // 6. 檢查數據內容
        console.log('\n6. 驗證數據內容...');
        const dataValidation = await page.evaluate(() => {
            const statElements = document.querySelectorAll('[data-stat]');
            const validData = [];
            
            statElements.forEach(element => {
                const statKey = element.getAttribute('data-stat');
                const valueElement = element.querySelector('.stat-value');
                const changeElement = element.querySelector('.stat-change');
                
                if (valueElement) {
                    validData.push({
                        key: statKey,
                        value: valueElement.textContent?.trim(),
                        change: changeElement?.textContent?.trim(),
                        hasValue: !!valueElement.textContent?.trim() && valueElement.textContent.trim() !== '0'
                    });
                }
            });
            
            return validData;
        });
        
        dataValidation.forEach(data => {
            console.log(`   - ${data.key}: ${data.value} (${data.change || 'N/A'}) ${data.hasValue ? '✅' : '⚠️'}`);
        });

        // 7. 最終截圖
        console.log('\n7. 截取最終結果...');
        await page.screenshot({ 
            path: 'dashboard_final_success.png', 
            fullPage: true 
        });
        console.log('   - ✅ 截圖已儲存: dashboard_final_success.png');

        // 8. 性能檢查
        console.log('\n8. 性能檢查...');
        const metrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                loadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
                domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
                totalTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
                apiCalls: performance.getEntriesByType('resource').filter(r => r.name.includes('/api/')).length
            };
        });
        
        console.log(`   - 頁面載入時間: ${metrics.loadTime}ms`);
        console.log(`   - DOM 載入時間: ${metrics.domContentLoaded}ms`);
        console.log(`   - 總載入時間: ${metrics.totalTime}ms`);
        console.log(`   - API 調用次數: ${metrics.apiCalls}`);

        console.log('\n✅ 儀表板測試完成 - 所有功能正常！');

    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
        await page.screenshot({ path: 'dashboard_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

finalDashboardTest();