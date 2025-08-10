const { test, expect } = require('@playwright/test');

test.describe('NexusERP 報表圖表系統全面分析', () => {
    const testCredentials = {
        email: 'test@example.com',
        password: 'password123'
    };

    // 測試用戶登入
    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:8000');
        
        try {
            // 等待並點擊登入按鈕
            await page.waitForSelector('a[href*="login"]', { timeout: 5000 });
            await page.click('a[href*="login"]');
            
            // 填寫登入表單
            await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
            await page.fill('input[type="email"], input[name="email"]', testCredentials.email);
            await page.fill('input[type="password"], input[name="password"]', testCredentials.password);
            
            // 提交登入表單
            await page.click('button[type="submit"], input[type="submit"]');
            
            // 等待登入成功並導向到儀表板
            await page.waitForURL(/dashboard/, { timeout: 10000 });
            console.log('✅ 登入成功');
        } catch (error) {
            console.error('❌ 登入失敗:', error);
            throw error;
        }
    });

    // 1. 測試 Sales 報表圖表 (已實作新組件)
    test('1. Sales 報表圖表功能分析', async ({ page }) => {
        console.log('📊 測試 Sales 報表...');
        
        await page.goto('http://127.0.0.1:8000/reports/sales');
        await page.waitForTimeout(3000);

        // 檢查頁面是否載入
        const pageTitle = await page.textContent('h1');
        console.log(`頁面標題: ${pageTitle}`);

        // 檢查圖表容器
        const chartContainers = await page.$$('canvas');
        console.log(`📈 發現 Canvas 元素數量: ${chartContainers.length}`);

        // 檢查是否有 Chart.js
        const hasChartJS = await page.evaluate(() => typeof window.Chart !== 'undefined');
        console.log(`📚 Chart.js 載入狀態: ${hasChartJS ? '✅ 已載入' : '❌ 未載入'}`);

        // 檢查各個圖表
        const salesTrendChart = await page.$('#sales-trend-chart');
        const topCustomersChart = await page.$('#top-customers-chart');
        
        console.log(`銷售趨勢圖: ${salesTrendChart ? '✅ 存在' : '❌ 不存在'}`);
        console.log(`前五大客戶圖: ${topCustomersChart ? '✅ 存在' : '❌ 不存在'}`);

        // 檢查 JavaScript 錯誤
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.screenshot({ 
            path: `/Users/gamepig/projects/NexusERP/frontend/sales-reports-analysis.png`,
            fullPage: true 
        });

        console.log(`🚨 JavaScript 錯誤數量: ${errors.length}`);
        if (errors.length > 0) {
            console.log('錯誤詳情:', errors);
        }
    });

    // 2. 測試 Inventory 報表圖表 (已實作新組件)
    test('2. Inventory 報表圖表功能分析', async ({ page }) => {
        console.log('📦 測試 Inventory 報表...');
        
        await page.goto('http://127.0.0.1:8000/reports/inventory');
        await page.waitForTimeout(3000);

        const pageTitle = await page.textContent('h1');
        console.log(`頁面標題: ${pageTitle}`);

        const chartContainers = await page.$$('canvas');
        console.log(`📈 發現 Canvas 元素數量: ${chartContainers.length}`);

        const hasChartJS = await page.evaluate(() => typeof window.Chart !== 'undefined');
        console.log(`📚 Chart.js 載入狀態: ${hasChartJS ? '✅ 已載入' : '❌ 未載入'}`);

        // 檢查庫存報表特有的圖表
        const stockStatusChart = await page.$('#stock-status-chart');
        const topValueChart = await page.$('#top-value-chart');
        const warehouseChart = await page.$('#warehouse-distribution-chart');
        
        console.log(`庫存狀態圖: ${stockStatusChart ? '✅ 存在' : '❌ 不存在'}`);
        console.log(`前五大價值產品圖: ${topValueChart ? '✅ 存在' : '❌ 不存在'}`);
        console.log(`倉庫分布圖: ${warehouseChart ? '✅ 存在' : '❌ 不存在'}`);

        await page.screenshot({ 
            path: `/Users/gamepig/projects/NexusERP/frontend/inventory-reports-analysis.png`,
            fullPage: true 
        });
    });

    // 3. 測試 Financial 報表圖表 (需要升級)
    test('3. Financial 報表圖表功能分析', async ({ page }) => {
        console.log('💰 測試 Financial 報表...');
        
        await page.goto('http://127.0.0.1:8000/reports/financial');
        await page.waitForTimeout(3000);

        const pageTitle = await page.textContent('h1');
        console.log(`頁面標題: ${pageTitle}`);

        const chartContainers = await page.$$('canvas');
        console.log(`📈 發現 Canvas 元素數量: ${chartContainers.length}`);

        const hasChartJS = await page.evaluate(() => typeof window.Chart !== 'undefined');
        console.log(`📚 Chart.js 載入狀態: ${hasChartJS ? '✅ 已載入' : '❌ 未載入'}`);

        // 檢查財務報表圖表
        const arAgingChart = await page.$('#ar-aging-chart');
        const cashFlowChart = await page.$('#cash-flow-chart');
        const arApChart = await page.$('#ar-ap-comparison-chart');
        
        console.log(`應收帳款帳齡圖: ${arAgingChart ? '✅ 存在' : '❌ 不存在'}`);
        console.log(`現金流趨勢圖: ${cashFlowChart ? '✅ 存在' : '❌ 不存在'}`);
        console.log(`應收應付比較圖: ${arApChart ? '✅ 存在' : '❌ 不存在'}`);

        await page.screenshot({ 
            path: `/Users/gamepig/projects/NexusERP/frontend/financial-reports-analysis.png`,
            fullPage: true 
        });
    });

    // 4. 測試子報表頁面
    test('4. 子報表頁面圖表分析', async ({ page }) => {
        console.log('📋 測試子報表頁面...');
        
        const subReports = [
            { path: '/reports/sales/summary', name: '銷售摘要' },
            { path: '/reports/sales/trends', name: '銷售趨勢' },
            { path: '/reports/inventory/valuation', name: '庫存評估' },
            { path: '/reports/financial/accounts-receivable', name: '應收帳款' },
            { path: '/reports/financial/accounts-payable', name: '應付帳款' },
            { path: '/reports/financial/profit-loss', name: '損益表' }
        ];

        const results = [];

        for (const report of subReports) {
            try {
                console.log(`測試: ${report.name}`);
                await page.goto(`http://127.0.0.1:8000${report.path}`);
                await page.waitForTimeout(2000);

                const chartContainers = await page.$$('canvas');
                const hasChartJS = await page.evaluate(() => typeof window.Chart !== 'undefined');
                
                results.push({
                    name: report.name,
                    path: report.path,
                    canvasCount: chartContainers.length,
                    hasChartJS: hasChartJS,
                    status: chartContainers.length > 0 && hasChartJS ? '✅ 正常' : '⚠️ 需要檢查'
                });

                console.log(`  Canvas 數量: ${chartContainers.length}, Chart.js: ${hasChartJS ? '✅' : '❌'}`);
            } catch (error) {
                console.log(`  ❌ 載入失敗: ${error.message}`);
                results.push({
                    name: report.name,
                    path: report.path,
                    status: '❌ 載入失敗',
                    error: error.message
                });
            }
        }

        console.log('\n📊 子報表分析總結:');
        results.forEach(result => {
            console.log(`${result.name}: ${result.status}`);
        });
    });

    // 5. 綜合分析報告
    test('5. 標準化圖表組件需求分析', async ({ page }) => {
        console.log('🔍 進行標準化需求分析...');

        const reportPages = [
            { url: '/reports/sales', name: 'Sales 主頁面', priority: 'completed' },
            { url: '/reports/inventory', name: 'Inventory 主頁面', priority: 'completed' },
            { url: '/reports/financial', name: 'Financial 主頁面', priority: 'high' },
            { url: '/reports/purchase', name: 'Purchase 報表', priority: 'high' },
            { url: '/reports/employees/attendance', name: 'Employee Attendance', priority: 'medium' },
            { url: '/reports/employees/performance', name: 'Employee Performance', priority: 'medium' }
        ];

        const analysisResults = [];

        for (const reportPage of reportPages) {
            try {
                await page.goto(`http://127.0.0.1:8000${reportPage.url}`);
                await page.waitForTimeout(2000);

                // 檢查是否使用舊的圖表模式
                const hasOldChartScript = await page.evaluate(() => {
                    const scripts = Array.from(document.querySelectorAll('script'));
                    return scripts.some(script => 
                        script.textContent && 
                        script.textContent.includes('new Chart(') &&
                        !script.textContent.includes('initializeChart')
                    );
                });

                // 檢查是否使用新的標準化組件
                const hasNewChartComponent = await page.evaluate(() => {
                    const scripts = Array.from(document.querySelectorAll('script'));
                    return scripts.some(script => 
                        script.textContent && 
                        (script.textContent.includes('initializeChart') ||
                         script.textContent.includes('SalesReportController') ||
                         script.textContent.includes('InventoryReportController'))
                    );
                });

                const canvasCount = await page.$$eval('canvas', canvases => canvases.length);

                analysisResults.push({
                    name: reportPage.name,
                    url: reportPage.url,
                    priority: reportPage.priority,
                    canvasCount,
                    hasOldChartScript,
                    hasNewChartComponent,
                    needsUpgrade: reportPage.priority !== 'completed' && hasOldChartScript && !hasNewChartComponent
                });

            } catch (error) {
                analysisResults.push({
                    name: reportPage.name,
                    url: reportPage.url,
                    priority: reportPage.priority,
                    error: error.message,
                    needsUpgrade: true
                });
            }
        }

        console.log('\n📋 標準化圖表組件推廣分析結果:');
        console.log('=' .repeat(60));
        
        analysisResults.forEach(result => {
            console.log(`\n🔹 ${result.name}`);
            console.log(`   URL: ${result.url}`);
            console.log(`   優先級: ${result.priority}`);
            if (result.error) {
                console.log(`   狀態: ❌ 無法存取 - ${result.error}`);
            } else {
                console.log(`   Canvas 數量: ${result.canvasCount}`);
                console.log(`   使用舊圖表模式: ${result.hasOldChartScript ? '✅ 是' : '❌ 否'}`);
                console.log(`   使用新標準化組件: ${result.hasNewChartComponent ? '✅ 是' : '❌ 否'}`);
                console.log(`   需要升級: ${result.needsUpgrade ? '🔴 是' : '✅ 否'}`);
            }
        });

        // 生成推廣建議
        const needsUpgrade = analysisResults.filter(r => r.needsUpgrade);
        const completed = analysisResults.filter(r => r.priority === 'completed');

        console.log('\n🎯 推廣建議總結:');
        console.log(`已完成標準化: ${completed.length} 個頁面`);
        console.log(`需要升級: ${needsUpgrade.length} 個頁面`);
        
        if (needsUpgrade.length > 0) {
            console.log('\n📝 建議升級順序:');
            needsUpgrade
                .sort((a, b) => {
                    const priorityOrder = { high: 1, medium: 2, low: 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .forEach((item, index) => {
                    console.log(`${index + 1}. ${item.name} (${item.priority} 優先級)`);
                });
        }
    });
});