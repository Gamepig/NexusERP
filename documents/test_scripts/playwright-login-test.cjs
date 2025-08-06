const { chromium } = require('playwright');

async function testLoginAndDashboard() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('正在測試登入和 Dashboard...');
        
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
        
        // 1. 先到登入頁面
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForTimeout(2000);
        
        // 2. 檢查是否有一般登入表單（非 OAuth）
        const hasEmailInput = await page.locator('input[type="email"], input[name="email"]').count() > 0;
        console.log('是否有 Email 輸入框:', hasEmailInput);
        
        if (hasEmailInput) {
            // 使用測試帳號登入
            await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
            await page.fill('input[type="password"], input[name="password"]', 'password123');
            
            // 點擊登入按鈕
            await page.click('button[type="submit"], input[type="submit"], .login-btn, .btn-login');
            
            // 等待登入完成
            await page.waitForTimeout(3000);
        } else {
            console.log('沒有找到標準登入表單，嘗試其他方式...');
        }
        
        // 3. 檢查是否已經登入成功並導航到 Dashboard
        const currentUrl = page.url();
        console.log('當前 URL:', currentUrl);
        
        // 4. 導航到 Dashboard
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForTimeout(3000);
        
        // 5. 檢查 Dashboard 內容
        const title = await page.title();
        console.log('Dashboard 頁面標題:', title);
        
        // 檢查是否有歡迎訊息
        const hasWelcome = await page.locator('h2:has-text("歡迎回來")').count() > 0;
        console.log('是否有歡迎訊息:', hasWelcome);
        
        // 檢查是否有統計卡片
        const statsCards = await page.locator('.nexus-card').count();
        console.log('統計卡片數量:', statsCards);
        
        // 檢查快速動作按鈕
        const quickActions = await page.locator('a[href*="inventory"]').count();
        console.log('庫存相關快速動作按鈕數量:', quickActions);
        
        // 截圖保存
        await page.screenshot({ 
            path: 'dashboard-with-login.png',
            fullPage: true 
        });
        console.log('Dashboard 登入後截圖已保存');
        
        // 6. 嘗試點擊庫存管理按鈕
        const inventoryBtn = await page.locator('a[href*="inventory"]').first();
        if (await inventoryBtn.count() > 0) {
            console.log('找到庫存管理按鈕，點擊測試...');
            await inventoryBtn.click();
            await page.waitForTimeout(3000);
            
            const inventoryUrl = page.url();
            console.log('庫存頁面 URL:', inventoryUrl);
            
            // 截圖庫存頁面
            await page.screenshot({ 
                path: 'inventory-page-after-login.png',
                fullPage: true 
            });
            console.log('庫存頁面截圖已保存');
        }
        
    } catch (error) {
        console.error('測試錯誤:', error);
    } finally {
        // 保持瀏覽器開啟以便檢查
        console.log('測試完成，瀏覽器保持開啟 30 秒...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        await browser.close();
    }
}

testLoginAndDashboard();