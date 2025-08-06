const { chromium } = require('playwright');

async function testCustomerPageAuth() {
    console.log('🧪 開始測試客戶管理頁面認證問題...');
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // 監聽控制台消息
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        });
        console.log(`📝 Console [${msg.type()}]: ${msg.text()}`);
    });
    
    // 監聽網路請求
    const networkRequests = [];
    page.on('request', request => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            timestamp: new Date().toISOString()
        });
    });
    
    // 監聽網路響應
    const networkResponses = [];
    page.on('response', response => {
        networkResponses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            timestamp: new Date().toISOString()
        });
        if (response.status() >= 400) {
            console.log(`❌ HTTP Error [${response.status()}]: ${response.url()}`);
        }
    });
    
    try {
        console.log('🔗 步驟 1: 導航到登入頁面...');
        await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
        
        // 截圖 - 登入頁面
        await page.screenshot({ 
            path: './screenshots/step1_login_page.png',
            fullPage: true 
        });
        console.log('📸 已保存登入頁面截圖: ./screenshots/step1_login_page.png');
        
        console.log('🔑 步驟 2: 執行登入...');
        // 填寫登入表單
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        
        // 點擊登入按鈕
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        // 截圖 - 登入後
        await page.screenshot({ 
            path: './screenshots/step2_after_login.png',
            fullPage: true 
        });
        console.log('📸 已保存登入後截圖: ./screenshots/step2_after_login.png');
        
        console.log('🏠 步驟 3: 導航到客戶管理頁面...');
        await page.goto('http://127.0.0.1:8000/customers', { waitUntil: 'networkidle' });
        
        // 等待頁面加載
        await page.waitForTimeout(3000);
        
        // 截圖 - 客戶頁面
        await page.screenshot({ 
            path: './screenshots/step3_customers_page.png',
            fullPage: true 
        });
        console.log('📸 已保存客戶頁面截圖: ./screenshots/step3_customers_page.png');
        
        // 檢查頁面標題
        const title = await page.title();
        console.log(`📋 頁面標題: ${title}`);
        
        // 檢查是否有錯誤訊息
        const errorElements = await page.$$('.alert-danger, .error, .text-danger');
        if (errorElements.length > 0) {
            console.log('⚠️  發現錯誤元素:');
            for (const element of errorElements) {
                const text = await element.textContent();
                console.log(`   - ${text}`);
            }
        }
        
        // 檢查是否有 API 調用
        const apiRequests = networkRequests.filter(req => req.url.includes('/api/'));
        console.log(`🌐 找到 ${apiRequests.length} 個 API 請求:`);
        apiRequests.forEach(req => {
            console.log(`   - ${req.method} ${req.url}`);
        });
        
        // 檢查是否有失敗的 API 響應
        const failedApiResponses = networkResponses.filter(res => 
            res.url.includes('/api/') && res.status >= 400
        );
        console.log(`❌ 找到 ${failedApiResponses.length} 個失敗的 API 響應:`);
        failedApiResponses.forEach(res => {
            console.log(`   - ${res.status} ${res.statusText}: ${res.url}`);
        });
        
        // 檢查是否有 JavaScript 錯誤
        const jsErrors = consoleMessages.filter(msg => msg.type === 'error');
        console.log(`🐛 找到 ${jsErrors.length} 個 JavaScript 錯誤:`);
        jsErrors.forEach(error => {
            console.log(`   - ${error.text}`);
        });
        
        // 檢查頁面內容
        const bodyText = await page.textContent('body');
        if (bodyText.includes('Authorization header required')) {
            console.log('🚨 確認發現 "Authorization header required" 錯誤');
        }
        if (bodyText.includes('Unauthorized')) {
            console.log('🚨 確認發現 "Unauthorized" 錯誤');
        }
        
        // 生成詳細報告
        const report = {
            timestamp: new Date().toISOString(),
            pageTitle: title,
            url: page.url(),
            consoleMessages: consoleMessages,
            networkRequests: apiRequests,
            failedResponses: failedApiResponses,
            screenshots: [
                './screenshots/step1_login_page.png',
                './screenshots/step2_after_login.png', 
                './screenshots/step3_customers_page.png'
            ]
        };
        
        // 保存報告
        require('fs').writeFileSync(
            './test_customer_auth_report.json', 
            JSON.stringify(report, null, 2)
        );
        console.log('📊 已保存詳細報告: ./test_customer_auth_report.json');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
        
        // 錯誤截圖
        await page.screenshot({ 
            path: './screenshots/error_screenshot.png',
            fullPage: true 
        });
        console.log('📸 已保存錯誤截圖: ./screenshots/error_screenshot.png');
    } finally {
        await browser.close();
    }
}

// 執行測試
testCustomerPageAuth().catch(console.error);