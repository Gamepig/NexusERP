import { chromium } from 'playwright';

async function testProductEdit() {
    console.log('🚀 開始產品編輯數據一致性測試...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 監聽網路請求
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
        if (request.url().includes('/api/products/857')) {
            const requestData = {
                url: request.url(),
                method: request.method(),
                postData: request.postData(),
                headers: request.headers()
            };
            requests.push(requestData);
            console.log(`📤 API 請求: ${request.method()} ${request.url()}`);
            if (request.postData()) {
                console.log(`📝 請求內容: ${request.postData()}`);
            }
        }
    });
    
    page.on('response', async response => {
        if (response.url().includes('/api/products/857')) {
            const responseData = {
                url: response.url(),
                status: response.status(),
                statusText: response.statusText(),
                body: null
            };
            
            try {
                responseData.body = await response.text();
            } catch (error) {
                responseData.body = '無法讀取回應內容';
            }
            
            responses.push(responseData);
            console.log(`📥 API 回應: ${response.status()} ${response.statusText()}`);
            if (responseData.body) {
                console.log(`📄 回應內容: ${responseData.body.substring(0, 500)}...`);
            }
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
        
        console.log(`✅ 登入後當前 URL: ${page.url()}`);
        
        // 步驟 2: 導航到產品編輯頁面
        console.log('📝 步驟 2: 導航到產品 857 編輯頁面...');
        await page.goto('http://127.0.0.1:8000/products/857/edit');
        await page.waitForLoadState('networkidle');
        
        // 截取編輯頁面截圖
        await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/product_edit_before.png', fullPage: true });
        console.log('📸 已截取編輯頁面截圖: product_edit_before.png');
        
        // 步驟 3: 記錄當前顯示的數據
        console.log('📝 步驟 3: 檢查當前顯示的數據...');
        
        const currentStock = await page.inputValue('input[name="stock_quantity"]');
        const lowStockThreshold = await page.inputValue('input[name="low_stock_threshold"]');
        
        console.log(`📊 當前庫存數量: ${currentStock}`);
        console.log(`⚠️ 當前低庫存閾值: ${lowStockThreshold}`);
        
        // 步驟 4: 更新數據
        console.log('📝 步驟 4: 更新數據為 290/20...');
        
        // 清空並重新輸入
        await page.fill('input[name="stock_quantity"]', '');
        await page.fill('input[name="stock_quantity"]', '290');
        
        await page.fill('input[name="low_stock_threshold"]', '');
        await page.fill('input[name="low_stock_threshold"]', '20');
        
        // 確認輸入值
        const newStock = await page.inputValue('input[name="stock_quantity"]');
        const newThreshold = await page.inputValue('input[name="low_stock_threshold"]');
        console.log(`✏️ 輸入後庫存數量: ${newStock}`);
        console.log(`✏️ 輸入後低庫存閾值: ${newThreshold}`);
        
        // 等待一下確保數據穩定
        await page.waitForTimeout(1000);
        
        // 點擊更新按鈕
        console.log('🔄 點擊更新商品按鈕...');
        await page.click('button[type="submit"]');
        
        // 等待響應和頁面處理
        await page.waitForTimeout(5000);
        
        // 步驟 5: 檢查成功訊息和錯誤
        console.log('📝 步驟 5: 檢查更新結果...');
        
        // 檢查成功訊息
        try {
            const successSelectors = [
                '.alert-success',
                '.toast-success', 
                '[class*="success"]',
                '.notification.is-success',
                '.bg-green-100',
                '.text-green-800'
            ];
            
            for (const selector of successSelectors) {
                const element = page.locator(selector);
                if (await element.count() > 0 && await element.first().isVisible()) {
                    const messageText = await element.first().textContent();
                    console.log(`✅ 成功訊息 (${selector}): ${messageText}`);
                    break;
                }
            }
        } catch (error) {
            console.log('⚠️ 檢查成功訊息時發生錯誤:', error.message);
        }
        
        // 檢查錯誤訊息
        try {
            const errorSelectors = [
                '.alert-danger',
                '.toast-error',
                '[class*="error"]',
                '.notification.is-danger',
                '.bg-red-100',
                '.text-red-800',
                '.border-red-500'
            ];
            
            for (const selector of errorSelectors) {
                const element = page.locator(selector);
                if (await element.count() > 0 && await element.first().isVisible()) {
                    const messageText = await element.first().textContent();
                    console.log(`❌ 錯誤訊息 (${selector}): ${messageText}`);
                }
            }
        } catch (error) {
            console.log('⚠️ 檢查錯誤訊息時發生錯誤:', error.message);
        }
        
        // 檢查當前 URL 是否有變化
        const currentUrl = page.url();
        console.log(`🔍 當前 URL: ${currentUrl}`);
        
        // 步驟 6: 重新載入頁面驗證數據
        console.log('📝 步驟 6: 重新載入頁面驗證數據...');
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const finalStock = await page.inputValue('input[name="stock_quantity"]');
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
        
        // 搜尋產品 857
        try {
            // 嘗試找包含 857 的行
            const rows = await page.$$('tr');
            let found = false;
            
            for (const row of rows) {
                const text = await row.textContent();
                if (text.includes('857') || text.includes('TEST-PROD-015')) {
                    console.log(`📋 找到產品行: ${text}`);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                console.log('❌ 在產品列表中未找到產品 857');
            }
        } catch (error) {
            console.log('⚠️ 檢查產品列表時發生錯誤:', error.message);
        }
        
        // 總結報告
        console.log('\n📊 測試結果總結:');
        console.log('='.repeat(50));
        console.log(`原始庫存: ${currentStock} → 期望: 290 → 實際: ${finalStock}`);
        console.log(`原始閾值: ${lowStockThreshold} → 期望: 20 → 實際: ${finalThreshold}`);
        
        const stockMatches = finalStock === '290';
        const thresholdMatches = finalThreshold === '20';
        
        if (stockMatches && thresholdMatches) {
            console.log('✅ 數據一致性測試通過！');
        } else {
            console.log('❌ 數據一致性測試失敗！');
            if (!stockMatches) console.log(`  ❌ 庫存數量不匹配: 期望 290, 實際 ${finalStock}`);
            if (!thresholdMatches) console.log(`  ❌ 低庫存閾值不匹配: 期望 20, 實際 ${finalThreshold}`);
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
            if (res.body && res.body.length > 0) {
                console.log(`  內容預覽: ${res.body.substring(0, 200)}...`);
            }
        });
        
        // 保持瀏覽器開啓以供檢查
        console.log('\n🔍 瀏覽器將保持開啟 10 秒以供檢查...');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
        await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/error_screenshot.png', fullPage: true });
        console.log('📸 已截取錯誤截圖: error_screenshot.png');
    } finally {
        console.log('\n🔚 測試完成，關閉瀏覽器...');
        await browser.close();
    }
}

// 執行測試
testProductEdit().catch(console.error);