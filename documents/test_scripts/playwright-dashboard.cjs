const { chromium } = require('playwright');

async function testDashboardPage() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('正在測試 Dashboard 頁面...');
        
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
        
        // 導航到 Dashboard
        await page.goto('http://127.0.0.1:8000/dashboard');
        
        // 等待頁面載入
        await page.waitForTimeout(5000);
        
        // 檢查頁面內容
        const title = await page.title();
        console.log('頁面標題:', title);
        
        // 檢查頁面是否正常載入
        const hasContent = await page.locator('body').count() > 0;
        console.log('頁面是否有內容:', hasContent);
        
        // 截圖保存
        await page.screenshot({ 
            path: 'dashboard-page.png',
            fullPage: true 
        });
        console.log('Dashboard 截圖已保存為 dashboard-page.png');
        
    } catch (error) {
        console.error('測試錯誤:', error);
    } finally {
        await browser.close();
    }
}

testDashboardPage();