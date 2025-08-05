import { chromium } from 'playwright';

async function testProductEdit() {
    console.log('🚀 開始產品編輯數據一致性測試...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000  // 減慢操作速度以便觀察
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 監聽網路請求
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
        if (request.url().includes('/api/products/857')) {
            requests.push({
                url: request.url(),
                method: request.method(),
                postData: request.postData(),
                headers: request.headers()
            });
            console.log(`📤 API 請求: ${request.method()} ${request.url()}`);
            if (request.postData()) {
                console.log(`📝 請求內容: ${request.postData()}`);
            }
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('/api/products/857')) {
            responses.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            });
            console.log(`📥 API 回應: ${response.status()} ${response.statusText()}`);
        }
    });
    
    try {
        // 步驟 1: 登入
        console.log('📝 步驟 1: 登入系統...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        // 檢查是否成功登入
        const currentUrl = page.url();
        console.log(`✅ 登入後當前 URL: ${currentUrl}`);
        
        // 步驟 2: 導航到產品編輯頁面
        console.log('📝 步驟 2: 導航到產品 857 編輯頁面...');
        await page.goto('http://127.0.0.1:8000/products/857/edit');
        await page.waitForLoadState('networkidle');
        
        // 截取編輯頁面截圖
        await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/product_edit_before.png', fullPage: true });
        console.log('📸 已截取編輯頁面截圖: product_edit_before.png');
        
        // 步驟 3: 記錄當前顯示的數據
        console.log('📝 步驟 3: 檢查當前顯示的數據...');
        
        const currentStock = await page.inputValue('input[name="current_stock"]');
        const lowStockThreshold = await page.inputValue('input[name="low_stock_threshold"]');
        
        console.log(`📊 當前庫存數量: ${currentStock}`);
        console.log(`⚠️ 當前低庫存閾值: ${lowStockThreshold}`);
        
        // 步驟 4: 更新數據
        console.log('📝 步驟 4: 更新數據為 290/20...');
        
        await page.fill('input[name="current_stock"]', '290');
        await page.fill('input[name="low_stock_threshold"]', '20');
        
        // 確認輸入值
        const newStock = await page.inputValue('input[name="current_stock"]');
        const newThreshold = await page.inputValue('input[name="low_stock_threshold"]');
        console.log(`✏️ 輸入後庫存數量: ${newStock}`);
        console.log(`✏️ 輸入後低庫存閾值: ${newThreshold}`);
        
        // 點擊更新按鈕
        console.log('🔄 點擊更新商品按鈕...');
        await page.click('button[type="submit"]');
        
        // 等待響應
        await page.waitForTimeout(3000);
        
        // 步驟 5: 檢查成功訊息
        console.log('📝 步驟 5: 檢查更新結果...');
        
        // 檢查是否有成功訊息
        const successMessage = await page.locator('.alert-success, .toast-success, [class*="success"]').first();
        if (await successMessage.isVisible()) {
            const messageText = await successMessage.textContent();
            console.log(`✅ 成功訊息: ${messageText}`);
        } else {
            console.log('❌ 未找到成功訊息');
        }
        
        // 檢查是否有錯誤訊息
        const errorMessage = await page.locator('.alert-danger, .toast-error, [class*="error"]').first();
        if (await errorMessage.isVisible()) {
            const messageText = await errorMessage.textContent();
            console.log(`❌ 錯誤訊息: ${messageText}`);
        }
        
        // 步驟 6: 重新載入頁面驗證數據
        console.log('📝 步驟 6: 重新載入頁面驗證數據...');
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const finalStock = await page.inputValue('input[name="current_stock"]');
        const finalThreshold = await page.inputValue('input[name="low_stock_threshold"]');
        
        console.log(`🔍 重新載入後庫存數量: ${finalStock}`);
        console.log(`🔍 重新載入後低庫存閾值: ${finalThreshold}`);
        
        // 截取更新後截圖
        await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/product_edit_after.png', fullPage: true });
        console.log('📸 已截取更新後截圖: product_edit_after.png');
        
        // 步驟 7: 檢查產品列表中的數據
        console.log('📝 步驟 7: 檢查產品列表中的數據...');
        await page.goto('http://127.0.0.1:8000/products');
        await page.waitForLoadState('networkidle');
        
        // 尋找產品 857 的行
        const productRow = page.locator('tr').filter({ hasText: '857' });
        if (await productRow.count() > 0) {
            const stockCell = await productRow.locator('td').nth(4).textContent(); // 假設庫存在第5列
            console.log(`📋 產品列表中顯示的庫存: ${stockCell}`);
        } else {
            console.log('❌ 在產品列表中未找到產品 857');
        }
        
        // 總結報告
        console.log('\n📊 測試結果總結:');
        console.log('='.repeat(50));
        console.log(`原始庫存: ${currentStock} → 期望: 290 → 實際: ${finalStock}`);
        console.log(`原始閾值: ${lowStockThreshold} → 期望: 20 → 實際: ${finalThreshold}`);
        
        if (finalStock === '290' && finalThreshold === '20') {
            console.log('✅ 數據一致性測試通過！');
        } else {
            console.log('❌ 數據一致性測試失敗！');
        }
        
        // 輸出網路請求詳情
        console.log('\n🌐 網路請求詳情:');
        console.log('='.repeat(50));
        requests.forEach((req, index) => {
            console.log(`請求 ${index + 1}:`);
            console.log(`  方法: ${req.method}`);
            console.log(`  URL: ${req.url}`);
            if (req.postData) {
                console.log(`  數據: ${req.postData}`);
            }
        });
        
        console.log('\n📥 回應詳情:');
        responses.forEach((res, index) => {
            console.log(`回應 ${index + 1}: ${res.status} ${res.statusText}`);
        });
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
        await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/error_screenshot.png', fullPage: true });
    } finally {
        console.log('\n🔚 測試完成，關閉瀏覽器...');
        await browser.close();
    }
}

// 執行測試
testProductEdit().catch(console.error);