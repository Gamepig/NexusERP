const { chromium } = require('playwright');

async function testInventoryPages() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('正在測試庫存相關頁面...');
        
        // 監聽所有網路請求
        page.on('request', request => {
            console.log('請求:', request.method(), request.url());
        });
        
        page.on('response', response => {
            console.log('回應:', response.status(), response.url());
        });
        
        // 監聽控制台訊息
        page.on('console', msg => {
            console.log('控制台:', msg.type(), msg.text());
        });
        
        // 監聽錯誤
        page.on('pageerror', error => {
            console.log('頁面錯誤:', error.message);
        });
        
        // 1. 先登入
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForTimeout(2000);
        
        // 使用測試帳號登入
        await page.fill('input[type="email"], input[name="email"]', 'test@nexuserp.com');
        await page.fill('input[type="password"], input[name="password"]', 'password123');
        await page.click('button[type="submit"], input[type="submit"], .login-btn, .btn-login');
        await page.waitForTimeout(3000);
        
        // 2. 測試庫存水準頁面
        console.log('=== 測試庫存水準頁面 ===');
        await page.goto('http://127.0.0.1:8000/inventory/levels');
        await page.waitForTimeout(3000);
        
        const levelsTitle = await page.title();
        console.log('庫存水準頁面標題:', levelsTitle);
        
        // 截圖保存
        await page.screenshot({ 
            path: 'inventory-levels-page.png',
            fullPage: true 
        });
        console.log('庫存水準頁面截圖已保存');
        
        // 3. 測試交易記錄頁面  
        console.log('=== 測試交易記錄頁面 ===');
        await page.goto('http://127.0.0.1:8000/inventory/transactions');
        await page.waitForTimeout(3000);
        
        const transactionsTitle = await page.title();
        console.log('交易記錄頁面標題:', transactionsTitle);
        
        // 截圖保存
        await page.screenshot({ 
            path: 'inventory-transactions-page.png',
            fullPage: true 
        });
        console.log('交易記錄頁面截圖已保存');
        
    } catch (error) {
        console.error('測試錯誤:', error);
    } finally {
        // 保持瀏覽器開啟以便檢查
        console.log('測試完成，瀏覽器保持開啟 15 秒...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        await browser.close();
    }
}

testInventoryPages();