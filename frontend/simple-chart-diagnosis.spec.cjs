const { test, expect } = require('@playwright/test');

// 簡化版圖表診斷測試
test.describe('簡化版圖表診斷', () => {
    
    test('檢查服務器運行狀態和頁面結構', async ({ page }) => {
        
        // 開啟控制台監聽
        page.on('console', msg => {
            console.log(`Console: ${msg.text()}`);
        });

        page.on('pageerror', err => {
            console.log(`Page Error: ${err.message}`);
        });

        try {
            // 訪問主頁
            console.log('🔍 正在訪問主頁...');
            await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });
            await page.screenshot({ path: 'screenshots/01-homepage-check.png', fullPage: true });
            
            // 檢查是否有登入表單
            const emailInput = await page.locator('input[name="email"]').count();
            const passwordInput = await page.locator('input[name="password"]').count();
            console.log(`Email input: ${emailInput}, Password input: ${passwordInput}`);
            
            if (emailInput > 0 && passwordInput > 0) {
                console.log('✅ 找到登入表單，正在登入...');
                
                await page.fill('input[name="email"]', 'test@example.com');
                await page.fill('input[name="password"]', 'password123');
                await page.click('button[type="submit"]');
                await page.waitForTimeout(3000); // 等待登入完成
                
                await page.screenshot({ path: 'screenshots/02-after-login.png', fullPage: true });
            }
            
            // 直接測試財務報表頁面（已知有Canvas實現）
            console.log('🔍 測試財務報表頁面...');
            await page.goto('http://127.0.0.1:8000/reports/financial', { waitUntil: 'networkidle' });
            await page.screenshot({ path: 'screenshots/03-financial-page.png', fullPage: true });
            
            const financialCanvases = await page.locator('canvas').count();
            const financialLoading = await page.locator('text=圖表載入中...').count();
            const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
            
            console.log('=== 財務報表頁面診斷 ===');
            console.log(`Canvas元素數量: ${financialCanvases}`);
            console.log(`載入占位符: ${financialLoading}`);
            console.log(`Chart.js載入: ${chartJsLoaded}`);
            
            // 測試庫存週轉率頁面（已知僅有占位符）
            console.log('🔍 測試庫存週轉率頁面...');
            await page.goto('http://127.0.0.1:8000/reports/inventory/turnover', { waitUntil: 'networkidle' });
            await page.screenshot({ path: 'screenshots/04-turnover-page.png', fullPage: true });
            
            const turnoverCanvases = await page.locator('canvas').count();
            const turnoverLoading = await page.locator('text=圖表載入中...').count();
            const turnoverChartJs = await page.evaluate(() => typeof Chart !== 'undefined');
            
            console.log('=== 庫存週轉率頁面診斷 ===');
            console.log(`Canvas元素數量: ${turnoverCanvases}`);
            console.log(`載入占位符: ${turnoverLoading}`);
            console.log(`Chart.js載入: ${turnoverChartJs}`);
            
            // 測試庫存老化頁面
            console.log('🔍 測試庫存老化頁面...');
            await page.goto('http://127.0.0.1:8000/reports/inventory/aging', { waitUntil: 'networkidle' });
            await page.screenshot({ path: 'screenshots/05-aging-page.png', fullPage: true });
            
            const agingCanvases = await page.locator('canvas').count();
            const agingLoading = await page.locator('text=圖表載入中...').count();
            const agingChartJs = await page.evaluate(() => typeof Chart !== 'undefined');
            
            console.log('=== 庫存老化頁面診斷 ===');
            console.log(`Canvas元素數量: ${agingCanvases}`);
            console.log(`載入占位符: ${agingLoading}`);
            console.log(`Chart.js載入: ${agingChartJs}`);
            
            // 生成問題總結
            console.log('\n🔍 === 前端圖表渲染問題診斷總結 ===');
            console.log('時間:', new Date().toLocaleString());
            console.log('');
            
            const pages = [
                { name: '財務報表', canvases: financialCanvases, loading: financialLoading, chartJs: chartJsLoaded },
                { name: '庫存週轉率', canvases: turnoverCanvases, loading: turnoverLoading, chartJs: turnoverChartJs },
                { name: '庫存老化', canvases: agingCanvases, loading: agingLoading, chartJs: agingChartJs }
            ];
            
            pages.forEach((page, index) => {
                const status = page.canvases > 0 ? '✅ 有Canvas實現' : '❌ 僅佔位符';
                console.log(`${index + 1}. ${page.name}: ${status}`);
                console.log(`   Canvas: ${page.canvases}, 載入中: ${page.loading}, Chart.js: ${page.chartJs}`);
            });
            
            // 確認問題模式
            const pagesWithoutCharts = pages.filter(p => p.canvases === 0);
            const pagesWithCharts = pages.filter(p => p.canvases > 0);
            
            console.log('\n📊 問題分析:');
            console.log(`✅ 有圖表實現的頁面: ${pagesWithCharts.length} 個`);
            console.log(`❌ 僅有佔位符的頁面: ${pagesWithoutCharts.length} 個`);
            
            if (pagesWithoutCharts.length > 0) {
                console.log('\n🚨 根本問題: 多個報表頁面缺少Canvas元素和圖表初始化代碼');
                console.log('需要修復的問題頁面:');
                pagesWithoutCharts.forEach(page => {
                    console.log(`   - ${page.name}: 需要添加Canvas元素和圖表初始化`);
                });
            }
            
        } catch (error) {
            console.error('❌ 測試執行錯誤:', error.message);
            await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
        }
    });
});