import { chromium } from 'playwright';

async function testChartDirect() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('=== Chart.js 直接測試 ===\n');

        // 1. 登入
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ 登入成功');

        // 2. 等待頁面載入
        await page.waitForLoadState('networkidle');
        
        // 3. 逐步檢查 Chart.js 狀態
        console.log('\n檢查 Chart.js 載入狀態:');
        
        const checkSteps = [
            { delay: 1000, name: '1秒後' },
            { delay: 3000, name: '3秒後' },
            { delay: 5000, name: '5秒後' },
            { delay: 8000, name: '8秒後' },
            { delay: 10000, name: '10秒後' }
        ];
        
        for (const step of checkSteps) {
            await page.waitForTimeout(step.delay - (checkSteps.indexOf(step) > 0 ? checkSteps[checkSteps.indexOf(step) - 1].delay : 0));
            
            const status = await page.evaluate(() => {
                return {
                    chartDefined: typeof Chart !== 'undefined',
                    chartVersion: typeof Chart !== 'undefined' ? Chart.version : 'N/A',
                    windowChart: !!window.Chart,
                    documentReady: document.readyState,
                    scriptsLoaded: Array.from(document.querySelectorAll('script[src*="chart"]')).length,
                    bodyScripts: document.body.querySelectorAll('script').length,
                    headScripts: document.head.querySelectorAll('script').length
                };
            });
            
            console.log(`${step.name}: Chart=${status.chartDefined ? '✅' : '❌'} v${status.chartVersion} ready=${status.documentReady} scripts=${status.scriptsLoaded}`);
        }
        
        // 4. 手動注入 Chart.js 測試
        console.log('\n手動注入 Chart.js 測試:');
        const manualInject = await page.evaluate(() => {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js';
                script.onload = () => {
                    setTimeout(() => {
                        resolve({
                            success: true,
                            chartAvailable: typeof Chart !== 'undefined',
                            version: typeof Chart !== 'undefined' ? Chart.version : 'N/A'
                        });
                    }, 100);
                };
                script.onerror = () => resolve({ success: false, error: 'Script load failed' });
                document.head.appendChild(script);
            });
        });
        
        console.log('手動注入結果:', manualInject);
        
        // 5. 測試圖表建立
        if (manualInject.chartAvailable) {
            console.log('\n測試圖表建立:');
            const chartTest = await page.evaluate(() => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.id = 'testChart';
                    document.body.appendChild(canvas);
                    
                    const ctx = canvas.getContext('2d');
                    const chart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ['A', 'B', 'C'],
                            datasets: [{
                                label: 'Test',
                                data: [1, 2, 3],
                                borderColor: 'rgb(75, 192, 192)',
                                tension: 0.1
                            }]
                        }
                    });
                    
                    const success = !!chart;
                    if (success) chart.destroy();
                    document.body.removeChild(canvas);
                    
                    return { success: true, chartCreated: success };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            });
            
            console.log('圖表建立測試:', chartTest);
        }

        console.log('\n=== 測試完成 ===');

    } catch (error) {
        console.error('測試過程中發生錯誤:', error);
    } finally {
        await browser.close();
    }
}

testChartDirect();