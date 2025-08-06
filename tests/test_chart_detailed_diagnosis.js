import { chromium } from 'playwright';

async function diagnoseChart() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('=== Chart.js 詳細診斷 ===\n');

        // 監聽所有網路請求
        const requests = [];
        page.on('request', request => {
            requests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                timestamp: new Date().toISOString()
            });
        });

        // 監聽失敗請求
        const failures = [];
        page.on('requestfailed', request => {
            failures.push({
                url: request.url(),
                failure: request.failure(),
                timestamp: new Date().toISOString()
            });
        });

        // 監聽響應
        const responses = [];
        page.on('response', response => {
            responses.push({
                url: response.url(),
                status: response.status(),
                headers: response.headers(),
                timestamp: new Date().toISOString()
            });
        });

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
        await page.waitForTimeout(5000);
        
        // 3. 分析網路請求
        console.log('\n網路請求分析:');
        const chartRequests = requests.filter(req => req.url.includes('chart') || req.url.includes('Chart'));
        const chartResponses = responses.filter(res => res.url.includes('chart') || res.url.includes('Chart'));
        const chartFailures = failures.filter(fail => fail.url.includes('chart') || fail.url.includes('Chart'));

        console.log(`Chart.js 相關請求: ${chartRequests.length}`);
        chartRequests.forEach((req, i) => {
            const resp = chartResponses.find(r => r.url === req.url);
            const fail = chartFailures.find(f => f.url === req.url);
            console.log(`  ${i+1}. ${req.method} ${req.url}`);
            console.log(`     類型: ${req.resourceType}`);
            if (resp) {
                console.log(`     響應: ${resp.status}`);
            }
            if (fail) {
                console.log(`     失敗: ${fail.failure?.errorText || 'Unknown error'}`);
            }
        });

        // 4. 檢查 CSP 和安全策略
        console.log('\n安全策略檢查:');
        const securityInfo = await page.evaluate(() => {
            const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content');
            const xfo = document.querySelector('meta[http-equiv="X-Frame-Options"]')?.getAttribute('content');
            
            return {
                csp: csp || 'No CSP found',
                xfo: xfo || 'No X-Frame-Options found',
                location: window.location.href,
                userAgent: navigator.userAgent,
                onLine: navigator.onLine
            };
        });

        Object.entries(securityInfo).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });

        // 5. 手動測試腳本載入
        console.log('\n手動腳本載入測試:');
        const manualTest = await page.evaluate(async () => {
            const results = [];
            
            const testUrls = [
                'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.min.js',
                'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js',
                'https://unpkg.com/chart.js@4.4.0/dist/chart.umd.js'
            ];
            
            for (const url of testUrls) {
                const result = await new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = url;
                    
                    const timeout = setTimeout(() => {
                        resolve({ url, status: 'timeout', chart: false });
                    }, 5000);
                    
                    script.onload = () => {
                        clearTimeout(timeout);
                        setTimeout(() => {
                            resolve({ 
                                url, 
                                status: 'loaded',
                                chart: typeof Chart !== 'undefined',
                                chartType: typeof Chart,
                                version: typeof Chart !== 'undefined' && Chart.version ? Chart.version : 'N/A'
                            });
                        }, 100);
                    };
                    
                    script.onerror = (error) => {
                        clearTimeout(timeout);
                        resolve({ url, status: 'error', chart: false, error: error.message || 'Script error' });
                    };
                    
                    document.head.appendChild(script);
                });
                
                results.push(result);
                
                // 清理之前的 Chart 變數
                if (typeof Chart !== 'undefined') {
                    delete window.Chart;
                }
            }
            
            return results;
        });

        manualTest.forEach((result, i) => {
            console.log(`  ${i+1}. ${result.url}`);
            console.log(`     狀態: ${result.status}`);
            console.log(`     Chart: ${result.chart ? '✅' : '❌'}`);
            if (result.version) console.log(`     版本: ${result.version}`);
            if (result.error) console.log(`     錯誤: ${result.error}`);
        });

        // 6. 檢查其他 JavaScript 庫衝突
        console.log('\n JavaScript 環境檢查:');
        const jsEnv = await page.evaluate(() => {
            return {
                jQuery: typeof $ !== 'undefined',
                axios: typeof axios !== 'undefined',
                Chart: typeof Chart !== 'undefined',
                globalThis: typeof globalThis !== 'undefined',
                window: typeof window !== 'undefined',
                scriptTags: document.querySelectorAll('script').length,
                errors: window.errors || []
            };
        });

        Object.entries(jsEnv).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });

        console.log('\n=== 診斷完成 ===');

    } catch (error) {
        console.error('診斷過程中發生錯誤:', error);
    } finally {
        await browser.close();
    }
}

diagnoseChart();