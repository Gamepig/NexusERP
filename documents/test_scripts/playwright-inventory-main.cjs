const { chromium } = require('playwright');

async function testInventoryMainPage() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('正在測試庫存主頁面 /inventory...');
        
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
        
        // 導航到庫存主頁面
        await page.goto('http://127.0.0.1:8000/inventory');
        
        // 等待頁面載入
        await page.waitForTimeout(5000);
        
        // 檢查頁面內容
        const title = await page.title();
        console.log('頁面標題:', title);
        
        // 檢查是否有庫存管理標題
        const hasTitle = await page.locator('h1:has-text("庫存管理")').count() > 0;
        console.log('是否有庫存管理標題:', hasTitle);
        
        // 檢查統計卡片
        const statsCards = await page.locator('.bg-white.rounded-lg.shadow-lg.p-6').count();
        console.log('統計卡片數量:', statsCards);
        
        // 檢查是否有載入狀態
        const loadingState = await page.locator('#loadingState').isVisible();
        console.log('是否顯示載入狀態:', loadingState);
        
        // 檢查是否有空狀態
        const emptyState = await page.locator('#emptyState').isVisible();
        console.log('是否顯示空狀態:', emptyState);
        
        // 檢查是否有庫存資料
        const hasInventoryData = await page.locator('#inventoryGrid .inventory-card').count();
        console.log('庫存卡片數量:', hasInventoryData);
        
        // 截圖保存
        await page.screenshot({ 
            path: 'inventory-main-page.png',
            fullPage: true 
        });
        console.log('截圖已保存為 inventory-main-page.png');
        
        // 等待更多時間看是否有延遲載入
        await page.waitForTimeout(5000);
        
        // 再次檢查庫存資料
        const finalInventoryData = await page.locator('#inventoryGrid .inventory-card').count();
        console.log('最終庫存卡片數量:', finalInventoryData);
        
    } catch (error) {
        console.error('測試錯誤:', error);
    } finally {
        await browser.close();
    }
}

testInventoryMainPage();