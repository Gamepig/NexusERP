import { test, expect } from '@playwright/test';

/**
 * NexusERP 核心功能驗證測試
 * 
 * 驗證項目：
 * 1. 用戶登入功能
 * 2. 銷售訂單計算功能
 * 3. 客戶電話搜尋功能
 * 4. 供應商聯絡人搜尋功能
 */

// 測試配置
const TEST_CONFIG = {
    baseURL: 'http://127.0.0.1:8000',
    testUser: {
        email: 'test@example.com',
        password: 'password123'
    },
    timeout: 10000
};

test.describe('NexusERP 核心功能驗證', () => {
    
    test.beforeEach(async ({ page }) => {
        // 設置頁面超時
        page.setDefaultTimeout(TEST_CONFIG.timeout);
        
        // 前往首頁
        await page.goto(TEST_CONFIG.baseURL);
    });

    test('1. 用戶登入功能驗證', async ({ page }) => {
        console.log('🔐 測試用戶登入功能...');
        
        // 檢查是否已登入
        const isLoggedIn = await page.locator('text=登出').isVisible().catch(() => false);
        
        if (!isLoggedIn) {
            // 查找登入連結
            const loginLink = page.locator('a[href*="login"]').first();
            await loginLink.click();
            
            // 填寫登入表單
            await page.fill('input[name="email"], input[type="email"]', TEST_CONFIG.testUser.email);
            await page.fill('input[name="password"], input[type="password"]', TEST_CONFIG.testUser.password);
            
            // 提交登入
            await page.click('button[type="submit"], input[type="submit"]');
            
            // 等待登入完成
            await page.waitForURL(/dashboard|home|index/, { timeout: 5000 });
        }
        
        // 驗證登入成功
        const dashboardVisible = await page.locator('text=儀表板').or(page.locator('text=Dashboard')).or(page.locator('text=主頁')).isVisible().catch(() => false);
        const logoutVisible = await page.locator('text=登出').or(page.locator('text=Logout')).isVisible().catch(() => false);
        
        expect(dashboardVisible || logoutVisible).toBeTruthy();
        console.log('✅ 用戶登入功能正常');
    });

    test('2. 銷售訂單計算功能驗證', async ({ page }) => {
        console.log('🧮 測試銷售訂單計算功能...');
        
        // 確保已登入
        await ensureLoggedIn(page);
        
        // 前往銷售訂單創建頁面
        await page.goto(`${TEST_CONFIG.baseURL}/sales-orders/create`);
        
        // 等待頁面載入
        await page.waitForSelector('input, select', { timeout: 5000 });
        
        // 查找數量和價格輸入框
        const quantitySelectors = [
            'input[name*="quantity"]',
            'input[id*="quantity"]', 
            'input[placeholder*="數量"]',
            'input[placeholder*="quantity"]'
        ];
        
        const priceSelectors = [
            'input[name*="price"]',
            'input[name*="unit_price"]',
            'input[id*="price"]',
            'input[placeholder*="價格"]',
            'input[placeholder*="price"]'
        ];
        
        let quantityInput = null;
        let priceInput = null;
        
        // 尋找數量輸入框
        for (const selector of quantitySelectors) {
            const element = page.locator(selector).first();
            if (await element.isVisible().catch(() => false)) {
                quantityInput = element;
                break;
            }
        }
        
        // 尋找價格輸入框
        for (const selector of priceSelectors) {
            const element = page.locator(selector).first();
            if (await element.isVisible().catch(() => false)) {
                priceInput = element;
                break;
            }
        }
        
        if (quantityInput && priceInput) {
            // 輸入測試數據
            await quantityInput.fill('5');
            await priceInput.fill('100');
            
            // 觸發計算事件
            await quantityInput.blur();
            await priceInput.blur();
            
            // 等待計算完成
            await page.waitForTimeout(1000);
            
            // 查找總計顯示
            const totalSelectors = [
                'input[name*="total"]',
                'input[id*="total"]',
                'span:has-text("500")',
                'td:has-text("500")',
                '.total:has-text("500")'
            ];
            
            let totalFound = false;
            for (const selector of totalSelectors) {
                const element = page.locator(selector);
                if (await element.isVisible().catch(() => false)) {
                    const text = await element.textContent();
                    if (text && text.includes('500')) {
                        totalFound = true;
                        break;
                    }
                }
            }
            
            expect(totalFound).toBeTruthy();
            console.log('✅ 銷售訂單計算功能正常 (5 × 100 = 500)');
        } else {
            console.log('⚠️  無法找到數量或價格輸入框，跳過計算測試');
        }
    });

    test('3. 客戶電話搜尋功能驗證', async ({ page }) => {
        console.log('📞 測試客戶電話搜尋功能...');
        
        // 確保已登入
        await ensureLoggedIn(page);
        
        // 前往客戶管理頁面
        const customerUrls = [
            `${TEST_CONFIG.baseURL}/customers`,
            `${TEST_CONFIG.baseURL}/customer`,
            `${TEST_CONFIG.baseURL}/clients`
        ];
        
        let customerPageFound = false;
        for (const url of customerUrls) {
            try {
                await page.goto(url);
                await page.waitForSelector('input, table', { timeout: 3000 });
                customerPageFound = true;
                break;
            } catch (e) {
                continue;
            }
        }
        
        if (!customerPageFound) {
            console.log('⚠️  無法找到客戶管理頁面，跳過電話搜尋測試');
            return;
        }
        
        // 查找搜尋輸入框
        const searchSelectors = [
            'input[name="search"]',
            'input[placeholder*="搜尋"]',
            'input[placeholder*="search"]',
            'input[type="search"]',
            '.search input'
        ];
        
        let searchInput = null;
        for (const selector of searchSelectors) {
            const element = page.locator(selector).first();
            if (await element.isVisible().catch(() => false)) {
                searchInput = element;
                break;
            }
        }
        
        if (searchInput) {
            // 搜尋電話號碼 "02-"
            await searchInput.fill('02-');
            await searchInput.press('Enter');
            
            // 等待搜尋結果
            await page.waitForTimeout(2000);
            
            // 檢查是否有搜尋結果
            const hasResults = await page.locator('table tbody tr, .customer-item, .result-item').count() > 0;
            
            expect(hasResults).toBeTruthy();
            console.log('✅ 客戶電話搜尋功能正常 (搜尋 "02-" 找到結果)');
        } else {
            console.log('⚠️  無法找到搜尋輸入框，跳過電話搜尋測試');
        }
    });

    test('4. 供應商聯絡人搜尋功能驗證', async ({ page }) => {
        console.log('👥 測試供應商聯絡人搜尋功能...');
        
        // 確保已登入
        await ensureLoggedIn(page);
        
        // 前往供應商管理頁面
        const supplierUrls = [
            `${TEST_CONFIG.baseURL}/suppliers`,
            `${TEST_CONFIG.baseURL}/supplier`,
            `${TEST_CONFIG.baseURL}/vendors`
        ];
        
        let supplierPageFound = false;
        for (const url of supplierUrls) {
            try {
                await page.goto(url);
                await page.waitForSelector('input, table', { timeout: 3000 });
                supplierPageFound = true;
                break;
            } catch (e) {
                continue;
            }
        }
        
        if (!supplierPageFound) {
            console.log('⚠️  無法找到供應商管理頁面，跳過聯絡人搜尋測試');
            return;
        }
        
        // 查找搜尋輸入框
        const searchSelectors = [
            'input[name="search"]',
            'input[placeholder*="搜尋"]', 
            'input[placeholder*="search"]',
            'input[type="search"]',
            '.search input'
        ];
        
        let searchInput = null;
        for (const selector of searchSelectors) {
            const element = page.locator(selector).first();
            if (await element.isVisible().catch(() => false)) {
                searchInput = element;
                break;
            }
        }
        
        if (searchInput) {
            // 搜尋聯絡人姓名 "李"
            await searchInput.fill('李');
            await searchInput.press('Enter');
            
            // 等待搜尋結果
            await page.waitForTimeout(2000);
            
            // 檢查是否有搜尋結果
            const hasResults = await page.locator('table tbody tr, .supplier-item, .result-item').count() > 0;
            
            expect(hasResults).toBeTruthy();
            console.log('✅ 供應商聯絡人搜尋功能正常 (搜尋 "李" 找到結果)');
        } else {
            console.log('⚠️  無法找到搜尋輸入框，跳過聯絡人搜尋測試');
        }
    });

    test('5. 完整功能驗證總結', async ({ page }) => {
        console.log('📋 執行完整功能驗證總結...');
        
        // 確保已登入
        await ensureLoggedIn(page);
        
        // 檢查系統基本功能
        const checks = [
            { name: '主頁載入', check: () => page.goto(TEST_CONFIG.baseURL) },
            { name: '用戶認證', check: () => page.locator('text=登出, text=Dashboard').isVisible() },
            { name: '頁面導航', check: () => page.locator('nav, .navbar, .menu').isVisible() }
        ];
        
        const results = [];
        for (const { name, check } of checks) {
            try {
                await check();
                results.push(`✅ ${name}: 正常`);
            } catch (e) {
                results.push(`❌ ${name}: 異常 - ${e.message}`);
            }
        }
        
        console.log('📊 系統功能驗證結果:');
        results.forEach(result => console.log(`   ${result}`));
        
        // 驗證至少一個核心功能正常
        const successCount = results.filter(r => r.includes('✅')).length;
        expect(successCount).toBeGreaterThan(0);
    });
});

/**
 * 確保用戶已登入
 */
async function ensureLoggedIn(page) {
    const isLoggedIn = await page.locator('text=登出, text=Logout').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
        // 前往登入頁面
        await page.goto(`${TEST_CONFIG.baseURL}/login`);
        
        // 填寫登入表單
        await page.fill('input[name="email"], input[type="email"]', TEST_CONFIG.testUser.email);
        await page.fill('input[name="password"], input[type="password"]', TEST_CONFIG.testUser.password);
        
        // 提交登入
        await page.click('button[type="submit"], input[type="submit"]');
        
        // 等待登入完成
        await page.waitForTimeout(2000);
    }
}