import { chromium } from 'playwright';

async function debugApiIssues() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('🔍 開始 API 偵錯測試...');
        
        // 設定請求攔截器，記錄所有 API 請求
        await page.route('**/api/**', route => {
            console.log(`📤 API 請求: ${route.request().method()} ${route.request().url()}`);
            console.log(`📤 Headers:`, route.request().headers());
            route.continue();
        });

        // 設定回應攔截器，記錄所有 API 回應
        page.on('response', response => {
            if (response.url().includes('/api/')) {
                console.log(`📥 API 回應: ${response.status()} ${response.url()}`);
                if (!response.ok()) {
                    console.log(`❌ API 錯誤詳情: ${response.status()} - ${response.statusText()}`);
                }
            }
        });

        // 1. 登入
        console.log('📍 Step 1: 登入系統');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        console.log('✅ 登入完成');

        // 2. 導航到銷售報表頁面並監控網路請求
        console.log('📍 Step 2: 導航到銷售報表總覽頁面');
        await page.goto('http://127.0.0.1:8000/reports/sales');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000); // 等待 AJAX 請求完成

        // 3. 檢查控制台錯誤
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleLogs.push(`❌ Console Error: ${msg.text()}`);
                console.log(`❌ Console Error: ${msg.text()}`);
            }
        });

        // 4. 執行 JavaScript 來直接測試 API 呼叫
        console.log('📍 Step 3: 執行前端 JavaScript API 測試');
        const apiTestResult = await page.evaluate(async () => {
            try {
                // 測試直接 API 呼叫
                const response = await fetch('/api/reports/sales', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });
                
                const data = await response.json();
                
                return {
                    status: response.status,
                    ok: response.ok,
                    data: data,
                    headers: Object.fromEntries(response.headers.entries())
                };
            } catch (error) {
                return {
                    error: error.message,
                    stack: error.stack
                };
            }
        });

        console.log('📊 API 測試結果:', JSON.stringify(apiTestResult, null, 2));

        // 5. 檢查產品銷售分析 API
        console.log('📍 Step 4: 測試產品銷售分析 API');
        await page.goto('http://127.0.0.1:8000/reports/sales/by-product');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000);

        const productApiTestResult = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/reports/sales/by-product', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });
                
                const data = await response.json();
                
                return {
                    status: response.status,
                    ok: response.ok,
                    data: data
                };
            } catch (error) {
                return {
                    error: error.message
                };
            }
        });

        console.log('📊 產品 API 測試結果:', JSON.stringify(productApiTestResult, null, 2));

        // 6. 截圖保存現狀
        await page.screenshot({ path: 'api_debug_final.png', fullPage: true });
        console.log('📸 API 偵錯截圖已保存');

        console.log('🎉 API 偵錯測試完成！');
        console.log('📋 Console 錯誤總結:', consoleLogs);

    } catch (error) {
        console.error('❌ 偵錯測試過程中發生錯誤:', error);
        await page.screenshot({ path: 'api_debug_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

debugApiIssues();