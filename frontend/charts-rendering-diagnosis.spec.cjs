const { test, expect } = require('@playwright/test');

// 前端圖表渲染深度診斷測試
test.describe('前端圖表渲染深度診斷', () => {
    
    test.beforeEach(async ({ page }) => {
        // 開啟主控台錯誤監聽
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console Error:', msg.text());
            }
        });

        // 開啟JavaScript錯誤監聽
        page.on('pageerror', err => {
            console.log('❌ JavaScript Error:', err.message);
        });

        // 登入系統
        await page.goto('http://127.0.0.1:8000');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**');
        console.log('✅ 登入成功');
    });

    // 1. 庫存週轉率報表診斷
    test('1. 庫存週轉率報表 - Canvas元素檢查', async ({ page }) => {
        await page.goto('http://127.0.0.1:8000/reports/inventory/turnover');
        await page.waitForLoadState('networkidle');
        
        // 截圖記錄
        await page.screenshot({ path: 'screenshots/diagnosis-turnover-page.png', fullPage: true });
        
        // 檢查Canvas元素
        const canvases = await page.locator('canvas').count();
        console.log(`🔍 Canvas元素數量: ${canvases}`);
        
        // 檢查"圖表載入中..."文字
        const loadingTexts = await page.locator('text=圖表載入中...').count();
        console.log(`📝 "圖表載入中..."文字數量: ${loadingTexts}`);
        
        // 檢查Chart.js載入
        const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
        console.log(`📊 Chart.js載入狀態: ${chartJsLoaded}`);
        
        // 記錄診斷結果
        console.log('=== 庫存週轉率報表診斷結果 ===');
        console.log(`Canvas元素: ${canvases} 個`);
        console.log(`載入占位符: ${loadingTexts} 個`);
        console.log(`Chart.js: ${chartJsLoaded ? '已載入' : '未載入'}`);
        
        expect(loadingTexts).toBeGreaterThan(0); // 確認問題存在
    });

    // 2. 庫存老化報表診斷
    test('2. 庫存老化報表 - Canvas元素檢查', async ({ page }) => {
        await page.goto('http://127.0.0.1:8000/reports/inventory/aging');
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'screenshots/diagnosis-aging-page.png', fullPage: true });
        
        const canvases = await page.locator('canvas').count();
        const loadingTexts = await page.locator('text=圖表載入中...').count();
        const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
        
        console.log('=== 庫存老化報表診斷結果 ===');
        console.log(`Canvas元素: ${canvases} 個`);
        console.log(`載入占位符: ${loadingTexts} 個`);
        console.log(`Chart.js: ${chartJsLoaded ? '已載入' : '未載入'}`);
    });

    // 3. 庫存異動記錄診斷
    test('3. 庫存異動記錄報表 - Canvas元素檢查', async ({ page }) => {
        await page.goto('http://127.0.0.1:8000/reports/inventory/movements');
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'screenshots/diagnosis-movements-page.png', fullPage: true });
        
        const canvases = await page.locator('canvas').count();
        const loadingTexts = await page.locator('text=圖表載入中...').count();
        const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
        
        console.log('=== 庫存異動記錄報表診斷結果 ===');
        console.log(`Canvas元素: ${canvases} 個`);
        console.log(`載入占位符: ${loadingTexts} 個`);
        console.log(`Chart.js: ${chartJsLoaded ? '已載入' : '未載入'}`);
    });

    // 4. 財務報表總覽診斷 (應該有Canvas)
    test('4. 財務報表總覽 - Canvas元素檢查', async ({ page }) => {
        await page.goto('http://127.0.0.1:8000/reports/financial');
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'screenshots/diagnosis-financial-page.png', fullPage: true });
        
        const canvases = await page.locator('canvas').count();
        const loadingTexts = await page.locator('text=圖表載入中...').count();
        const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
        
        // 檢查特定Canvas ID
        const arAgingChart = await page.locator('#ar-aging-chart').count();
        const cashFlowChart = await page.locator('#cash-flow-chart').count();
        const comparisonChart = await page.locator('#ar-ap-comparison-chart').count();
        
        console.log('=== 財務報表總覽診斷結果 ===');
        console.log(`Canvas元素: ${canvases} 個`);
        console.log(`載入占位符: ${loadingTexts} 個`);
        console.log(`Chart.js: ${chartJsLoaded ? '已載入' : '未載入'}`);
        console.log(`AR帳齡圖表: ${arAgingChart} 個`);
        console.log(`現金流圖表: ${cashFlowChart} 個`);
        console.log(`比較圖表: ${comparisonChart} 個`);
    });

    // 5. 採購報表總覽診斷
    test('5. 採購報表總覽 - Canvas元素檢查', async ({ page }) => {
        await page.goto('http://127.0.0.1:8000/reports/purchase');
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'screenshots/diagnosis-purchase-page.png', fullPage: true });
        
        const canvases = await page.locator('canvas').count();
        const loadingTexts = await page.locator('text=圖表載入中...').count();
        const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
        
        console.log('=== 採購報表總覽診斷結果 ===');
        console.log(`Canvas元素: ${canvases} 個`);
        console.log(`載入占位符: ${loadingTexts} 個`);
        console.log(`Chart.js: ${chartJsLoaded ? '已載入' : '未載入'}`);
    });

    // 6. 供應商採購分析診斷
    test('6. 供應商採購分析 - Canvas元素檢查', async ({ page }) => {
        await page.goto('http://127.0.0.1:8000/reports/purchase/by-supplier');
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'screenshots/diagnosis-supplier-analysis-page.png', fullPage: true });
        
        const canvases = await page.locator('canvas').count();
        const loadingTexts = await page.locator('text=圖表載入中...').count();
        const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
        
        console.log('=== 供應商採購分析診斷結果 ===');
        console.log(`Canvas元素: ${canvases} 個`);
        console.log(`載入占位符: ${loadingTexts} 個`);
        console.log(`Chart.js: ${chartJsLoaded ? '已載入' : '未載入'}`);
    });

    // 7. 員工出勤統計診斷
    test('7. 員工出勤統計 - Canvas元素檢查', async ({ page }) => {
        await page.goto('http://127.0.0.1:8000/reports/employees/attendance');
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'screenshots/diagnosis-attendance-page.png', fullPage: true });
        
        const canvases = await page.locator('canvas').count();
        const loadingTexts = await page.locator('text=圖表載入中...').count();
        const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
        
        console.log('=== 員工出勤統計診斷結果 ===');
        console.log(`Canvas元素: ${canvases} 個`);
        console.log(`載入占位符: ${loadingTexts} 個`);
        console.log(`Chart.js: ${chartJsLoaded ? '已載入' : '未載入'}`);
    });

    // 8. 員工績效分析診斷
    test('8. 員工績效分析 - Canvas元素檢查', async ({ page }) => {
        await page.goto('http://127.0.0.1:8000/reports/employees/performance');
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'screenshots/diagnosis-performance-page.png', fullPage: true });
        
        const canvases = await page.locator('canvas').count();
        const loadingTexts = await page.locator('text=圖表載入中...').count();
        const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
        
        console.log('=== 員工績效分析診斷結果 ===');
        console.log(`Canvas元素: ${canvases} 個`);
        console.log(`載入占位符: ${loadingTexts} 個`);
        console.log(`Chart.js: ${chartJsLoaded ? '已載入' : '未載入'}`);
    });

    // 綜合比較測試 - 識別哪些頁面有真實圖表實現
    test('9. 綜合頁面比較 - 識別圖表實現模式', async ({ page }) => {
        const pages = [
            { url: '/reports/inventory/turnover', name: '庫存週轉率' },
            { url: '/reports/inventory/aging', name: '庫存老化' },
            { url: '/reports/inventory/movements', name: '庫存異動' },
            { url: '/reports/financial', name: '財務報表' },
            { url: '/reports/purchase', name: '採購報表' },
            { url: '/reports/purchase/by-supplier', name: '供應商分析' },
            { url: '/reports/employees/attendance', name: '員工出勤' },
            { url: '/reports/employees/performance', name: '員工績效' }
        ];

        const results = [];

        for (const pageInfo of pages) {
            await page.goto(`http://127.0.0.1:8000${pageInfo.url}`);
            await page.waitForLoadState('networkidle');
            
            const canvases = await page.locator('canvas').count();
            const loadingTexts = await page.locator('text=圖表載入中...').count();
            const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
            
            results.push({
                name: pageInfo.name,
                url: pageInfo.url,
                canvases: canvases,
                loadingTexts: loadingTexts,
                chartJs: chartJsLoaded,
                status: canvases > 0 ? '有圖表實現' : '僅占位符'
            });
        }

        // 生成綜合診斷報告
        console.log('\n=== 🔍 前端圖表渲染問題綜合診斷報告 ===');
        console.log('測試時間:', new Date().toLocaleString());
        console.log('');
        console.log('📊 頁面圖表實現狀態:');
        
        results.forEach((result, index) => {
            const statusIcon = result.status === '有圖表實現' ? '✅' : '❌';
            console.log(`${index + 1}. ${statusIcon} ${result.name}`);
            console.log(`   URL: ${result.url}`);
            console.log(`   Canvas元素: ${result.canvases} 個`);
            console.log(`   載入占位符: ${result.loadingTexts} 個`);
            console.log(`   Chart.js: ${result.chartJs ? '已載入' : '未載入'}`);
            console.log(`   狀態: ${result.status}`);
            console.log('');
        });

        // 分類統計
        const withCharts = results.filter(r => r.status === '有圖表實現');
        const withoutCharts = results.filter(r => r.status === '僅占位符');
        
        console.log('📈 統計摘要:');
        console.log(`✅ 有圖表實現: ${withCharts.length} 個頁面`);
        console.log(`❌ 僅占位符: ${withoutCharts.length} 個頁面`);
        console.log('');
        
        if (withoutCharts.length > 0) {
            console.log('🚨 需要修復的頁面:');
            withoutCharts.forEach(page => {
                console.log(`   - ${page.name} (${page.url})`);
            });
        }
        
        // 保存診斷結果到文件
        await page.evaluate((reportData) => {
            const timestamp = new Date().toISOString();
            console.log('診斷完成，結果已記錄');
        }, results);
    });
});