// 前端圖表修復驗證測試
import { test, expect } from '@playwright/test';

test.describe('前端圖表修復驗證', () => {
    test('Chart.js 載入和圖表渲染驗證', async ({ page }) => {
        test.setTimeout(60000); // 1分鐘超時
        
        console.log('🔧 開始前端圖表修復驗證');

        // 1. 登入系統
        console.log('🔑 步驟 1: 系統登入');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');

        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            page.click('button[type="submit"]')
        ]);

        console.log('✅ 登入成功');

        // 2. 測試庫存報表圖表修復
        console.log('📊 步驟 2: 測試庫存報表圖表');
        await page.goto('http://127.0.0.1:8000/reports/inventory');
        await page.waitForTimeout(5000); // 等待圖表載入

        // 檢查 Chart.js 是否載入成功
        const chartJsLoaded = await page.evaluate(() => {
            return typeof Chart !== 'undefined';
        });

        console.log(`Chart.js 載入狀態: ${chartJsLoaded ? '✅ 成功' : '❌ 失敗'}`);

        // 檢查圖表元素
        const canvasElements = await page.locator('canvas').count();
        console.log(`Canvas 元素數量: ${canvasElements}`);

        // 檢查具體的圖表 ID
        const categoryChart = await page.locator('#inventory-category-chart').count();
        const trendChart = await page.locator('#inventory-trend-chart').count();
        
        console.log(`庫存分類圖表: ${categoryChart > 0 ? '✅ 存在' : '❌ 缺失'}`);
        console.log(`庫存趨勢圖表: ${trendChart > 0 ? '✅ 存在' : '❌ 缺失'}`);

        // 檢查 JavaScript 錯誤
        const jsErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                jsErrors.push(msg.text());
            }
        });

        // 重新載入以捕獲任何錯誤
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);

        console.log(`JavaScript 錯誤數量: ${jsErrors.length}`);
        if (jsErrors.length > 0) {
            console.log('❌ JavaScript 錯誤:', jsErrors);
        }

        // 3. 測試銷售報表圖表
        console.log('📈 步驟 3: 測試銷售報表圖表');
        await page.goto('http://127.0.0.1:8000/reports/sales');
        await page.waitForTimeout(5000);

        const salesCanvasCount = await page.locator('canvas').count();
        console.log(`銷售報表 Canvas 數量: ${salesCanvasCount}`);

        // 4. 測試財務報表圖表
        console.log('💰 步驟 4: 測試財務報表圖表');
        await page.goto('http://127.0.0.1:8000/reports/financial/profit-loss');
        await page.waitForTimeout(5000);

        const financialCanvasCount = await page.locator('canvas').count();
        console.log(`財務報表 Canvas 數量: ${financialCanvasCount}`);

        // 5. 截圖驗證
        await page.screenshot({ 
            path: 'screenshots/chart-fix-verification.png',
            fullPage: true 
        });

        // 6. 驗證結果
        expect(chartJsLoaded).toBe(true);
        expect(canvasElements).toBeGreaterThan(0);
        expect(categoryChart).toBe(1);
        expect(trendChart).toBe(1);

        console.log('🎉 前端圖表修復驗證完成！');
        
        // 總結報告
        const report = {
            chartJsLoaded: chartJsLoaded,
            inventoryCharts: canvasElements,
            salesCharts: salesCanvasCount,
            financialCharts: financialCanvasCount,
            jsErrors: jsErrors.length,
            status: chartJsLoaded && canvasElements > 0 ? '✅ 修復成功' : '❌ 仍有問題'
        };

        console.log('📋 修復驗證報告:', JSON.stringify(report, null, 2));
        
        return report;
    });
});