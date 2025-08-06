import { chromium } from 'playwright';

async function testDashboardAPI() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('=== NexusERP API 詳細測試報告 ===\n');

        // 監聽所有網路請求
        const allRequests = [];
        page.on('request', request => {
            allRequests.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                timestamp: new Date().toISOString()
            });
        });

        // 監聽所有響應
        const allResponses = [];
        page.on('response', response => {
            allResponses.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText(),
                headers: response.headers(),
                timestamp: new Date().toISOString()
            });
        });

        // 監聽控制台日誌
        const consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString()
            });
        });

        // 監聽錯誤
        const pageErrors = [];
        page.on('pageerror', error => {
            pageErrors.push({
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

        // 2. 等待頁面完全載入並監聽 API 請求
        console.log('\n2. 等待 API 請求...');
        await page.waitForTimeout(10000); // 等待10秒讓 API 請求完成

        // 3. 分析網路請求
        console.log('\n3. 網路請求分析:');
        const apiRequests = allRequests.filter(req => req.url.includes('/api/'));
        const apiResponses = allResponses.filter(res => res.url.includes('/api/'));

        if (apiRequests.length === 0) {
            console.log('   - ⚠️ 未發現任何 API 請求');
        } else {
            console.log(`   - 發現 ${apiRequests.length} 個 API 請求:`);
            apiRequests.forEach((req, index) => {
                const response = apiResponses.find(res => res.url === req.url);
                console.log(`     ${index + 1}. ${req.method} ${req.url}`);
                if (response) {
                    console.log(`        響應: ${response.status} ${response.statusText}`);
                } else {
                    console.log('        響應: 未收到響應或已逾時');
                }
            });
        }

        // 4. 檢查控制台日誌
        console.log('\n4. 控制台日誌:');
        if (consoleLogs.length === 0) {
            console.log('   - 無控制台日誌');
        } else {
            consoleLogs.forEach((log, index) => {
                console.log(`   ${index + 1}. [${log.type}] ${log.text}`);
            });
        }

        // 5. 檢查頁面錯誤
        console.log('\n5. 頁面錯誤:');
        if (pageErrors.length === 0) {
            console.log('   - ✅ 無頁面錯誤');
        } else {
            pageErrors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.message}`);
                if (error.stack) {
                    console.log(`      Stack: ${error.stack.split('\n')[0]}`);
                }
            });
        }

        // 6. 手動觸發 API 請求檢查
        console.log('\n6. 手動測試 API 端點...');
        const manualApiTest = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/dashboard', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    }
                });
                
                const responseText = await response.text();
                let responseData;
                try {
                    responseData = JSON.parse(responseText);
                } catch (e) {
                    responseData = responseText;
                }
                
                return {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    data: responseData
                };
            } catch (error) {
                return {
                    error: error.message,
                    stack: error.stack
                };
            }
        });

        if (manualApiTest.error) {
            console.log(`   - ❌ API 請求失敗: ${manualApiTest.error}`);
        } else {
            console.log(`   - API 響應狀態: ${manualApiTest.status} ${manualApiTest.statusText}`);
            console.log(`   - 響應內容類型: ${manualApiTest.headers['content-type'] || 'unknown'}`);
            if (typeof manualApiTest.data === 'object') {
                console.log(`   - 響應資料: ${JSON.stringify(manualApiTest.data, null, 2)}`);
            } else {
                console.log(`   - 響應內容: ${manualApiTest.data.substring(0, 200)}...`);
            }
        }

        // 7. 檢查當前頁面狀態
        console.log('\n7. 頁面狀態檢查:');
        const pageState = await page.evaluate(() => {
            return {
                url: window.location.href,
                title: document.title,
                csrfToken: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                hasJQuery: typeof $ !== 'undefined',
                hasAxios: typeof axios !== 'undefined',
                hasDashboardManager: typeof DashboardManager !== 'undefined',
                loadingElements: document.querySelectorAll('.loading, .spinner, [class*="loading"]').length,
                errorElements: document.querySelectorAll('.error, .alert-danger, [class*="error"]').length
            };
        });

        Object.entries(pageState).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

        console.log('\n=== 測試完成 ===');

    } catch (error) {
        console.error('測試過程中發生錯誤:', error);
    } finally {
        await browser.close();
    }
}

testDashboardAPI();