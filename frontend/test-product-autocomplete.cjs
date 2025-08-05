/**
 * 產品自動完成功能測試腳本
 * 測試報價單中的產品搜尋和自動完成功能
 */

const { chromium } = require('playwright');

const TEST_CONFIG = {
    baseUrl: 'http://127.0.0.1:8000',
    testAccount: {
        email: 'test@example.com',
        password: 'password123'
    },
    timeout: 10000
};

async function runProductAutocompleteTest() {
    const browser = await chromium.launch({ 
        headless: false,  // 設為 false 以便觀察測試過程
        slowMo: 1000     // 減慢操作以便觀察
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 監聽控制台錯誤
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
            console.log('❌ Console Error:', msg.text());
        }
    });
    
    // 監聽網路請求
    const networkRequests = [];
    page.on('request', request => {
        if (request.url().includes('/api/products/search')) {
            networkRequests.push({
                url: request.url(),
                method: request.method(),
                timestamp: new Date().toISOString()
            });
            console.log('🌐 API Request:', request.url());
        }
    });
    
    // 監聽網路回應
    page.on('response', response => {
        if (response.url().includes('/api/products/search')) {
            console.log('📡 API Response:', response.status(), response.url());
        }
    });

    try {
        console.log('🚀 開始產品自動完成測試...');
        
        // 1. 登入系統
        console.log('📝 Step 1: 登入測試帳號');
        await page.goto(`${TEST_CONFIG.baseUrl}/login`);
        await page.waitForSelector('input[name="email"]', { timeout: TEST_CONFIG.timeout });
        
        await page.fill('input[name="email"]', TEST_CONFIG.testAccount.email);
        await page.fill('input[name="password"]', TEST_CONFIG.testAccount.password);
        await page.click('button[type="submit"]');
        
        // 等待登入成功
        await page.waitForURL(/.*\/dashboard/, { timeout: TEST_CONFIG.timeout });
        console.log('✅ 登入成功');
        
        // 2. 導航到報價單創建頁面
        console.log('📝 Step 2: 導航到報價單創建頁面');
        await page.goto(`${TEST_CONFIG.baseUrl}/quotes/create`);
        await page.waitForLoadState('networkidle');
        
        // 3. 檢查 ProductAutocomplete JavaScript 是否已載入
        console.log('📝 Step 3: 檢查 ProductAutocomplete 類別是否存在');
        const hasProductAutocomplete = await page.evaluate(() => {
            return typeof window.ProductAutocomplete !== 'undefined';
        });
        
        if (hasProductAutocomplete) {
            console.log('✅ ProductAutocomplete 類別已載入');
        } else {
            console.log('❌ ProductAutocomplete 類別未載入');
        }
        
        // 4. 找到產品搜尋輸入框
        console.log('📝 Step 4: 尋找產品搜尋輸入框');
        const productInputExists = await page.locator('.product-search').count() > 0;
        
        if (!productInputExists) {
            console.log('❌ 找不到產品搜尋輸入框 (.product-search)');
            return;
        }
        
        console.log('✅ 找到產品搜尋輸入框');
        
        // 5. 測試產品搜尋功能
        console.log('📝 Step 5: 測試產品搜尋自動完成');
        const productInput = page.locator('.product-search').first();
        
        // 點擊輸入框並輸入搜尋關鍵字
        await productInput.click();
        await page.waitForTimeout(500);
        
        console.log('⌨️ 輸入搜尋關鍵字: "test"');
        await productInput.fill('test');
        
        // 等待 API 請求完成
        await page.waitForTimeout(2000);
        
        // 6. 檢查下拉選單是否出現
        console.log('📝 Step 6: 檢查自動完成下拉選單');
        const dropdownExists = await page.locator('.product-autocomplete-dropdown').count() > 0;
        
        if (dropdownExists) {
            console.log('✅ 自動完成下拉選單已出現');
            
            // 檢查下拉選單是否可見
            const isVisible = await page.locator('.product-autocomplete-dropdown').isVisible();
            console.log(`📋 下拉選單可見性: ${isVisible ? '✅ 可見' : '❌ 不可見'}`);
            
            // 檢查下拉選單內容
            const dropdownContent = await page.locator('.product-autocomplete-dropdown').innerHTML();
            console.log('📋 下拉選單內容預覽:', dropdownContent.substring(0, 200) + '...');
            
        } else {
            console.log('❌ 自動完成下拉選單未出現');
        }
        
        // 7. 拍攝截圖
        console.log('📝 Step 7: 拍攝測試結果截圖');
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/product-autocomplete-test-result.png',
            fullPage: true 
        });
        
        // 8. 測試結果摘要
        console.log('\n📊 測試結果摘要:');
        console.log('='.repeat(50));
        console.log(`✅ 登入成功: ${true}`);
        console.log(`✅ 頁面載入成功: ${true}`);
        console.log(`✅ ProductAutocomplete 類別載入: ${hasProductAutocomplete}`);
        console.log(`✅ 產品搜尋輸入框存在: ${productInputExists}`);
        console.log(`✅ 自動完成下拉選單: ${dropdownExists}`);
        console.log(`🌐 API 請求次數: ${networkRequests.length}`);
        console.log(`❌ 控制台錯誤數量: ${consoleErrors.length}`);
        
        if (networkRequests.length > 0) {
            console.log('\n🌐 API 請求詳情:');
            networkRequests.forEach((req, index) => {
                console.log(`${index + 1}. ${req.method} ${req.url} (${req.timestamp})`);
            });
        }
        
        if (consoleErrors.length > 0) {
            console.log('\n❌ 控制台錯誤:');
            consoleErrors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('❌ 測試執行失敗:', error.message);
        
        // 拍攝錯誤截圖
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/product-autocomplete-test-error.png',
            fullPage: true 
        });
        
    } finally {
        await browser.close();
    }
}

// 執行測試
runProductAutocompleteTest().catch(console.error);