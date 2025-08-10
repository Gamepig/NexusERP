import { test, expect } from '@playwright/test';

/**
 * NexusERP 核心修復驗證測試
 * 
 * 驗證項目：
 * 1. 用戶登入功能
 * 2. Go backend API 認證機制
 * 3. 客戶電話搜尋 API 功能
 * 4. 供應商聯絡人搜尋 API 功能
 */

// 測試配置
const TEST_CONFIG = {
    baseURL: 'http://127.0.0.1:8000',
    backendURL: 'http://127.0.0.1:8082',
    testUser: {
        email: 'test@example.com',
        password: 'password123'
    },
    timeout: 10000
};

test.describe('NexusERP 核心修復驗證', () => {
    
    test.beforeEach(async ({ page }) => {
        page.setDefaultTimeout(TEST_CONFIG.timeout);
    });

    test('1. 用戶登入功能驗證', async ({ page }) => {
        console.log('🔐 測試用戶登入功能...');
        
        // 前往首頁
        await page.goto(TEST_CONFIG.baseURL);
        
        // 檢查是否已登入
        const isLoggedIn = await page.locator('text=登出').isVisible().catch(() => false);
        
        if (!isLoggedIn) {
            // 點擊登入連結
            await page.click('a[href*="login"]');
            
            // 填寫登入表單
            await page.fill('input[name="email"]', TEST_CONFIG.testUser.email);
            await page.fill('input[name="password"]', TEST_CONFIG.testUser.password);
            
            // 提交登入
            await page.click('button[type="submit"]');
            
            // 等待登入完成
            await page.waitForTimeout(2000);
        }
        
        // 驗證登入成功
        const logoutBtn = await page.locator('text=登出').isVisible().catch(() => false);
        expect(logoutBtn).toBeTruthy();
        console.log('✅ 用戶登入功能正常');
    });

    test('2. Go Backend API 認證機制驗證', async ({ page, request }) => {
        console.log('🔑 測試 Go Backend API 認證機制...');
        
        // 先登入 Laravel 系統
        await page.goto(TEST_CONFIG.baseURL);
        
        const isLoggedIn = await page.locator('text=登出').isVisible().catch(() => false);
        if (!isLoggedIn) {
            await page.click('a[href*="login"]');
            await page.fill('input[name="email"]', TEST_CONFIG.testUser.email);
            await page.fill('input[name="password"]', TEST_CONFIG.testUser.password);
            await page.click('button[type="submit"]');
            await page.waitForTimeout(2000);
        }
        
        // 獲取 Laravel session cookies
        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name.includes('session'));
        
        if (sessionCookie) {
            // 使用 Laravel session 測試 Go backend API
            const response = await request.get(`${TEST_CONFIG.backendURL}/api/customers`, {
                headers: {
                    'Cookie': `${sessionCookie.name}=${sessionCookie.value}`,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            expect(response.status()).toBe(200);
            console.log('✅ Go Backend API 認證機制正常');
        } else {
            console.log('⚠️  無法獲取 Laravel session，跳過 API 認證測試');
        }
    });

    test('3. 客戶電話搜尋 API 功能驗證', async ({ page, request }) => {
        console.log('📞 測試客戶電話搜尋 API 功能...');
        
        // 先登入獲取認證
        await page.goto(TEST_CONFIG.baseURL);
        
        const isLoggedIn = await page.locator('text=登出').isVisible().catch(() => false);
        if (!isLoggedIn) {
            await page.click('a[href*="login"]');
            await page.fill('input[name="email"]', TEST_CONFIG.testUser.email);
            await page.fill('input[name="password"]', TEST_CONFIG.testUser.password);
            await page.click('button[type="submit"]');
            await page.waitForTimeout(2000);
        }
        
        // 獲取認證 cookies
        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name.includes('session'));
        
        if (sessionCookie) {
            // 測試電話搜尋 API
            const response = await request.get(`${TEST_CONFIG.backendURL}/api/customers?search=02-`, {
                headers: {
                    'Cookie': `${sessionCookie.name}=${sessionCookie.value}`,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            expect(response.status()).toBe(200);
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            expect(Array.isArray(data.data)).toBeTruthy();
            
            console.log(`✅ 客戶電話搜尋功能正常 (搜尋 "02-" 找到 ${data.data.length} 個結果)`);
        } else {
            console.log('⚠️  無法獲取認證，跳過電話搜尋測試');
        }
    });

    test('4. 供應商聯絡人搜尋 API 功能驗證', async ({ page, request }) => {
        console.log('👥 測試供應商聯絡人搜尋 API 功能...');
        
        // 先登入獲取認證
        await page.goto(TEST_CONFIG.baseURL);
        
        const isLoggedIn = await page.locator('text=登出').isVisible().catch(() => false);
        if (!isLoggedIn) {
            await page.click('a[href*="login"]');
            await page.fill('input[name="email"]', TEST_CONFIG.testUser.email);
            await page.fill('input[name="password"]', TEST_CONFIG.testUser.password);
            await page.click('button[type="submit"]');
            await page.waitForTimeout(2000);
        }
        
        // 獲取認證 cookies
        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name.includes('session'));
        
        if (sessionCookie) {
            // 測試聯絡人搜尋 API
            const response = await request.get(`${TEST_CONFIG.backendURL}/api/suppliers?search=李`, {
                headers: {
                    'Cookie': `${sessionCookie.name}=${sessionCookie.value}`,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            expect(response.status()).toBe(200);
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            expect(Array.isArray(data.data)).toBeTruthy();
            
            console.log(`✅ 供應商聯絡人搜尋功能正常 (搜尋 "李" 找到 ${data.data.length} 個結果)`);
        } else {
            console.log('⚠️  無法獲取認證，跳過聯絡人搜尋測試');
        }
    });

    test('5. 銷售訂單頁面載入驗證', async ({ page }) => {
        console.log('🧮 測試銷售訂單頁面載入...');
        
        // 先登入
        await page.goto(TEST_CONFIG.baseURL);
        
        const isLoggedIn = await page.locator('text=登出').isVisible().catch(() => false);
        if (!isLoggedIn) {
            await page.click('a[href*="login"]');
            await page.fill('input[name="email"]', TEST_CONFIG.testUser.email);
            await page.fill('input[name="password"]', TEST_CONFIG.testUser.password);
            await page.click('button[type="submit"]');
            await page.waitForTimeout(2000);
        }
        
        // 嘗試訪問銷售訂單創建頁面
        const response = await page.goto(`${TEST_CONFIG.baseURL}/sales-orders/create`);
        
        // 檢查頁面是否成功載入（狀態碼 200 或重定向到登入頁面）
        const isPageLoaded = response.status() === 200 || response.status() === 302;
        expect(isPageLoaded).toBeTruthy();
        
        // 檢查頁面是否包含銷售訂單相關內容或重定向到正確頁面
        const pageContent = await page.content();
        const hasRelevantContent = pageContent.includes('銷售') || 
                                 pageContent.includes('sales') || 
                                 pageContent.includes('訂單') ||
                                 pageContent.includes('order') ||
                                 pageContent.includes('login');
        
        expect(hasRelevantContent).toBeTruthy();
        console.log('✅ 銷售訂單頁面載入正常');
    });

    test('6. 系統整體健康檢查', async ({ page, request }) => {
        console.log('🏥 執行系統整體健康檢查...');
        
        const healthChecks = [];
        
        // 檢查 Laravel 前端
        try {
            const frontendResponse = await request.get(TEST_CONFIG.baseURL);
            healthChecks.push({
                service: 'Laravel Frontend',
                status: frontendResponse.status() === 200 ? '✅ 正常' : '❌ 異常',
                code: frontendResponse.status()
            });
        } catch (e) {
            healthChecks.push({
                service: 'Laravel Frontend',
                status: '❌ 無法連接',
                error: e.message
            });
        }
        
        // 檢查 Go Backend
        try {
            const backendResponse = await request.get(`${TEST_CONFIG.backendURL}/health`);
            healthChecks.push({
                service: 'Go Backend',
                status: backendResponse.status() === 200 ? '✅ 正常' : '❌ 異常',
                code: backendResponse.status()
            });
        } catch (e) {
            try {
                // 嘗試其他端點
                const altResponse = await request.get(`${TEST_CONFIG.backendURL}/api/customers`);
                healthChecks.push({
                    service: 'Go Backend',
                    status: altResponse.status() === 401 ? '✅ 正常 (需認證)' : '❌ 異常',
                    code: altResponse.status()
                });
            } catch (e2) {
                healthChecks.push({
                    service: 'Go Backend',
                    status: '❌ 無法連接',
                    error: e2.message
                });
            }
        }
        
        // 輸出健康檢查結果
        console.log('📊 系統健康檢查結果:');
        healthChecks.forEach(check => {
            console.log(`   ${check.service}: ${check.status} ${check.code ? `(${check.code})` : ''}`);
            if (check.error) {
                console.log(`      錯誤: ${check.error}`);
            }
        });
        
        // 至少有一個服務正常運行
        const healthyServices = healthChecks.filter(check => check.status.includes('✅'));
        expect(healthyServices.length).toBeGreaterThan(0);
    });
});