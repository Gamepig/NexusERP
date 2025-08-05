const { chromium } = require('playwright');

async function testInventoryPage() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000 // 放慢操作便於觀察
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('正在測試庫存水準頁面...');
        
        // 導航到測試頁面
        await page.goto('http://127.0.0.1:8000/test-inventory-levels');
        
        // 等待頁面載入
        await page.waitForTimeout(3000);
        
        // 檢查是否有錯誤
        const errors = [];
        page.on('pageerror', (error) => {
            errors.push(error.message);
        });
        
        // 檢查頁面標題
        const title = await page.title();
        console.log('頁面標題:', title);
        
        // 檢查表格是否存在
        const tableExists = await page.locator('#inventory-levels-table').count() > 0;
        console.log('表格是否存在:', tableExists);
        
        // 檢查是否有數據載入
        await page.waitForTimeout(2000);
        const tableRows = await page.locator('#inventory-levels-tbody tr').count();
        console.log('表格行數:', tableRows);
        
        // 檢查是否有按鈕
        const refreshButton = await page.locator('#refresh-levels').count() > 0;
        console.log('重新整理按鈕是否存在:', refreshButton);
        
        // 截圖保存
        await page.screenshot({ 
            path: 'inventory-levels-screenshot.png',
            fullPage: true 
        });
        console.log('截圖已保存為 inventory-levels-screenshot.png');
        
        // 檢查控制台錯誤
        const consoleLogs = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleLogs.push(msg.text());
            }
        });
        
        // 等待一下看看是否有延遲的錯誤
        await page.waitForTimeout(2000);
        
        console.log('JavaScript 錯誤:', errors);
        console.log('控制台錯誤:', consoleLogs);
        
        // 檢查 Tailwind CSS 是否正確載入
        const hasTableClass = await page.evaluate(() => {
            const table = document.querySelector('#inventory-levels-table');
            return table ? table.className : 'table not found';
        });
        console.log('表格 CSS 類別:', hasTableClass);
        
        // 檢查按鈕樣式
        const buttonClass = await page.evaluate(() => {
            const button = document.querySelector('#refresh-levels');
            return button ? button.className : 'button not found';
        });
        console.log('按鈕 CSS 類別:', buttonClass);
        
    } catch (error) {
        console.error('測試過程中發生錯誤:', error);
    } finally {
        await browser.close();
    }
}

testInventoryPage();