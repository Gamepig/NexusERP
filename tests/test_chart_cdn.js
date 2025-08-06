import { chromium } from 'playwright';

async function testChartCDN() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('=== Chart.js CDN 測試報告 ===\n');

        // 監聽網路請求
        const networkRequests = [];
        page.on('request', request => {
            if (request.url().includes('chart')) {
                networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // 監聽響應
        const networkResponses = [];
        page.on('response', response => {
            if (response.url().includes('chart')) {
                networkResponses.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText(),
                    headers: response.headers(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // 監聽 JavaScript 錯誤
        const jsErrors = [];
        page.on('pageerror', error => {
            jsErrors.push({
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });

        // 1. 登入
        console.log('1. 執行登入...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('   - ✅ 登入成功');

        // 2. 等待頁面載入完成
        console.log('\n2. 等待頁面載入和資源載入...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000); // 額外等待 CDN 載入

        // 3. 檢查 Chart.js 載入狀態
        console.log('\n3. 檢查 Chart.js 載入狀態:');
        const chartStatus = await page.evaluate(() => {
            return {
                isChartDefined: typeof Chart !== 'undefined',
                chartVersion: typeof Chart !== 'undefined' ? Chart.version : 'N/A',
                hasChartJS: !!window.Chart,
                documentReady: document.readyState,
                scriptTags: Array.from(document.querySelectorAll('script[src*="chart"]')).map(script => ({
                    src: script.src,
                    loaded: script.dataset.loaded || 'unknown'
                }))
            };
        });

        console.log('   - Chart 是否已定義:', chartStatus.isChartDefined ? '✅ 是' : '❌ 否');
        console.log('   - Chart 版本:', chartStatus.chartVersion);
        console.log('   - Document 狀態:', chartStatus.documentReady);
        console.log('   - Chart.js 腳本標籤:');
        chartStatus.scriptTags.forEach((script, index) => {
            console.log(`     ${index + 1}. ${script.src}`);
        });

        // 4. 檢查網路請求
        console.log('\n4. Chart.js 相關網路請求:');
        if (networkRequests.length === 0) {
            console.log('   - ⚠️ 未發現 Chart.js 相關網路請求');
        } else {
            networkRequests.forEach((req, index) => {
                const response = networkResponses.find(res => res.url === req.url);
                console.log(`   ${index + 1}. ${req.method} ${req.url}`);
                if (response) {
                    console.log(`      響應: ${response.status} ${response.statusText}`);
                } else {
                    console.log('      響應: 未收到響應');
                }
            });
        }

        // 5. 檢查 JavaScript 錯誤
        console.log('\n5. JavaScript 錯誤:');
        if (jsErrors.length === 0) {
            console.log('   - ✅ 無 JavaScript 錯誤');
        } else {
            jsErrors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.message}`);
            });
        }

        // 6. 手動測試 CDN 載入
        console.log('\n6. 手動測試 CDN 載入:');
        const cdnTest = await page.evaluate(async () => {
            try {
                // 測試直接載入 Chart.js CDN
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js';
                
                return new Promise((resolve) => {
                    script.onload = () => {
                        resolve({
                            success: true,
                            chartDefined: typeof Chart !== 'undefined',
                            chartVersion: typeof Chart !== 'undefined' ? Chart.version : 'N/A',
                            message: 'CDN 載入成功'
                        });
                    };
                    
                    script.onerror = () => {
                        resolve({
                            success: false,
                            message: 'CDN 載入失敗'
                        });
                    };
                    
                    document.head.appendChild(script);
                    
                    // 5秒超時
                    setTimeout(() => {
                        resolve({
                            success: false,
                            message: 'CDN 載入超時'
                        });
                    }, 5000);
                });
            } catch (error) {
                return {
                    success: false,
                    message: 'CDN 測試異常: ' + error.message
                };
            }
        });

        console.log('   - CDN 測試結果:', cdnTest.success ? '✅ 成功' : '❌ 失敗');
        if (cdnTest.message) {
            console.log('   - 詳細信息:', cdnTest.message);
        }
        if (cdnTest.chartDefined) {
            console.log('   - Chart 版本:', cdnTest.chartVersion);
        }

        // 7. 檢查是否有同步載入問題
        console.log('\n7. 檢查載入時序問題:');
        const timingIssue = await page.evaluate(() => {
            return {
                domContentLoaded: !!window.domContentLoadedTime,
                chartScriptInHead: !!document.querySelector('head script[src*="chart"]'),
                chartScriptInBody: !!document.querySelector('body script[src*="chart"]'),
                dashboardScriptPosition: Array.from(document.querySelectorAll('script')).findIndex(script => 
                    script.textContent && script.textContent.includes('DashboardManager')
                )
            };
        });

        console.log('   - Chart.js 腳本位置 (head):', timingIssue.chartScriptInHead ? '✅ 是' : '❌ 否');
        console.log('   - Chart.js 腳本位置 (body):', timingIssue.chartScriptInBody ? '✅ 是' : '❌ 否');
        console.log('   - Dashboard 腳本位置索引:', timingIssue.dashboardScriptPosition);

        console.log('\n=== 測試完成 ===');

    } catch (error) {
        console.error('測試過程中發生錯誤:', error);
    } finally {
        await browser.close();
    }
}

testChartCDN();