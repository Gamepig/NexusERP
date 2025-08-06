const { chromium } = require('playwright');

async function testInventoryPageDetailed() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('正在詳細測試庫存水準頁面...');
        
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
        
        // 導航到測試頁面
        await page.goto('http://127.0.0.1:8000/test-inventory-levels');
        
        // 等待表格載入
        await page.waitForSelector('#inventory-levels-table', { timeout: 10000 });
        console.log('表格已載入');
        
        // 等待 JavaScript 完全執行
        await page.waitForTimeout(5000);
        
        // 檢查是否有數據載入
        const tableRows = await page.locator('#inventory-levels-tbody tr').count();
        console.log('表格行數:', tableRows);
        
        // 檢查 API 請求是否成功
        const apiResponse = await page.goto('http://127.0.0.1:8000/api/inventory/levels');
        console.log('API 回應狀態:', await apiResponse.status());
        
        // 回到庫存頁面
        await page.goto('http://127.0.0.1:8000/test-inventory-levels');
        await page.waitForTimeout(3000);
        
        // 手動觸發重新整理按鈕
        await page.click('#refresh-levels');
        console.log('已點擊重新整理按鈕');
        
        await page.waitForTimeout(3000);
        
        // 再次檢查行數
        const finalRows = await page.locator('#inventory-levels-tbody tr').count();
        console.log('最終表格行數:', finalRows);
        
        // 檢查表格內容
        const tableContent = await page.locator('#inventory-levels-tbody').innerHTML();
        console.log('表格內容:', tableContent.substring(0, 200) + '...');
        
        // 最終截圖
        await page.screenshot({ 
            path: 'inventory-levels-final.png',
            fullPage: true 
        });
        console.log('最終截圖已保存');
        
    } catch (error) {
        console.error('測試錯誤:', error);
    } finally {
        await browser.close();
    }
}

testInventoryPageDetailed();