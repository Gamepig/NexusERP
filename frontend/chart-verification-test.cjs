const { chromium } = require('playwright');

async function verifyAllChartPages() {
    console.log('🔍 開始驗證所有報表頁面的圖表渲染...\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 登入
        console.log('📋 執行登入流程...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        console.log('✅ 登入成功\n');
        
        // 待驗證的報表頁面清單
        const reportPages = [
            {
                name: '財務報表',
                url: 'http://127.0.0.1:8000/reports/financial',
                canvasIds: ['revenueChart', 'expenseChart']
            },
            {
                name: '庫存週轉率報表',
                url: 'http://127.0.0.1:8000/reports/inventory/turnover',
                canvasIds: ['turnoverTrendChart']
            },
            {
                name: '庫存老化報表',
                url: 'http://127.0.0.1:8000/reports/inventory/aging',
                canvasIds: ['agingDistributionChart']
            },
            {
                name: '庫存異動記錄報表',
                url: 'http://127.0.0.1:8000/reports/inventory/movements',
                canvasIds: ['movementTrendChart']
            },
            {
                name: '員工出勤統計',
                url: 'http://127.0.0.1:8000/reports/employees/attendance',
                canvasIds: ['attendanceTrendChart', 'departmentAttendanceChart']
            },
            {
                name: '員工績效分析',
                url: 'http://127.0.0.1:8000/reports/employees/performance',
                canvasIds: ['performanceDistributionChart', 'departmentPerformanceChart']
            },
            {
                name: '供應商採購分析',
                url: 'http://127.0.0.1:8000/reports/purchase/by-supplier',
                canvasIds: ['supplierAmountChart', 'supplierRatingChart']
            }
        ];
        
        let allPassed = true;
        let summary = {
            total: reportPages.length,
            passed: 0,
            failed: 0,
            details: []
        };
        
        // 逐一驗證每個報表頁面
        for (const report of reportPages) {
            console.log(`📊 檢查頁面: ${report.name}`);
            console.log(`🔗 URL: ${report.url}`);
            
            try {
                await page.goto(report.url);
                await page.waitForTimeout(3000); // 等待圖表載入
                
                let pageResults = {
                    name: report.name,
                    url: report.url,
                    charts: [],
                    status: 'passed'
                };
                
                // 檢查是否還有"圖表載入中..."的文字
                const loadingTexts = await page.locator('text=圖表載入中...').count();
                if (loadingTexts > 0) {
                    console.log(`❌ 發現 ${loadingTexts} 個"圖表載入中..."佔位符`);
                    pageResults.status = 'failed';
                    pageResults.error = `發現 ${loadingTexts} 個未修復的圖表佔位符`;
                    allPassed = false;
                }
                
                // 檢查每個Canvas元素
                for (const canvasId of report.canvasIds) {
                    const canvas = await page.locator(`#${canvasId}`);
                    const canvasExists = await canvas.count() > 0;
                    
                    let chartResult = {
                        id: canvasId,
                        exists: canvasExists,
                        status: canvasExists ? 'found' : 'missing'
                    };
                    
                    if (canvasExists) {
                        console.log(`  ✅ Canvas元素 #${canvasId} 存在`);
                        
                        // 檢查Canvas是否有內容（不只是空白）
                        const canvasContent = await page.evaluate((id) => {
                            const canvas = document.getElementById(id);
                            if (!canvas) return false;
                            const ctx = canvas.getContext('2d');
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            // 檢查是否有非透明像素
                            for (let i = 3; i < imageData.data.length; i += 4) {
                                if (imageData.data[i] !== 0) return true;
                            }
                            return false;
                        }, canvasId);
                        
                        chartResult.hasContent = canvasContent;
                        if (canvasContent) {
                            console.log(`  🎨 Canvas #${canvasId} 有圖表內容`);
                        } else {
                            console.log(`  ⚠️  Canvas #${canvasId} 存在但可能為空白`);
                        }
                    } else {
                        console.log(`  ❌ Canvas元素 #${canvasId} 不存在`);
                        pageResults.status = 'failed';
                        allPassed = false;
                    }
                    
                    pageResults.charts.push(chartResult);
                }
                
                summary.details.push(pageResults);
                if (pageResults.status === 'passed') {
                    summary.passed++;
                    console.log(`✅ ${report.name} - 驗證通過\n`);
                } else {
                    summary.failed++;
                    console.log(`❌ ${report.name} - 驗證失敗\n`);
                }
                
            } catch (error) {
                console.log(`❌ 頁面載入失敗: ${error.message}`);
                summary.failed++;
                summary.details.push({
                    name: report.name,
                    url: report.url,
                    status: 'error',
                    error: error.message
                });
                allPassed = false;
            }
        }
        
        // 顯示測試總結
        console.log('📋 測試總結:');
        console.log('=====================================');
        console.log(`總頁面數: ${summary.total}`);
        console.log(`通過: ${summary.passed}`);
        console.log(`失敗: ${summary.failed}`);
        console.log(`成功率: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);
        
        if (allPassed) {
            console.log('\n🎉 所有報表頁面圖表驗證通過！');
        } else {
            console.log('\n⚠️  部分報表頁面需要進一步檢查');
            
            // 顯示失敗詳情
            const failedPages = summary.details.filter(p => p.status !== 'passed');
            if (failedPages.length > 0) {
                console.log('\n失敗頁面詳情:');
                failedPages.forEach(page => {
                    console.log(`- ${page.name}: ${page.error || '圖表元素缺失'}`);
                });
            }
        }
        
        return allPassed;
        
    } catch (error) {
        console.error('測試執行錯誤:', error);
        return false;
    } finally {
        await browser.close();
    }
}

// 執行驗證
verifyAllChartPages().then(success => {
    process.exit(success ? 0 : 1);
});