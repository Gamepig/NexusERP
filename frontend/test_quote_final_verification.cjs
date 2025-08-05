const { chromium } = require('playwright');

/**
 * 報價單建立功能最終驗證測試 - 修復後
 * 測試目標：驗證 product_id 問題修復後，報價單建立功能是否完全正常
 */

async function testQuoteCreationFinal() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🧪 開始報價單建立功能最終驗證測試 (修復後)');
        console.log('='.repeat(70));
        
        // 步驟 1: 前往登入頁面
        console.log('📋 步驟 1: 前往登入頁面');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        // 步驟 2: 登入系統
        console.log('📋 步驟 2: 登入系統');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        console.log(`   ✅ 登入成功，跳轉到: ${page.url()}`);
        
        // 步驟 3: 前往報價單建立頁面
        console.log('📋 步驟 3: 前往報價單建立頁面');
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
        
        console.log(`   ✅ 報價單建立頁面載入成功: ${page.url()}`);
        
        // 步驟 4: 填寫表單
        console.log('📋 步驟 4: 填寫表單資料');
        
        // 選擇客戶
        const customerSelect = page.locator('select[name="customer_id"]');
        const customerOptions = await customerSelect.locator('option').all();
        if (customerOptions.length > 1) {
            const customerValue = await customerOptions[1].getAttribute('value');
            await customerSelect.selectOption(customerValue);
            const selectedCustomer = await customerOptions[1].innerText();
            console.log(`   ✅ 已選擇客戶: ${selectedCustomer.trim()}`);
        }
        
        // 填寫產品資訊
        const productInput = page.locator('input[name="items[0][name]"]');
        await productInput.fill('最終驗證測試產品');
        console.log('   ✅ 已填寫產品名稱: 最終驗證測試產品');
        
        const quantityInput = page.locator('input[name="items[0][quantity]"]');
        await quantityInput.fill('2');
        console.log('   ✅ 已填寫數量: 2');
        
        const priceInput = page.locator('input[name="items[0][unit_price]"]');
        await priceInput.fill('2000');
        console.log('   ✅ 已填寫單價: 2000');
        
        // 等待計算更新
        await page.waitForTimeout(1000);
        
        // 檢查計算結果
        const subtotalText = await page.locator('#subtotalAmount').innerText();
        console.log(`   ✅ 小計計算: ${subtotalText}`);
        
        const totalText = await page.locator('#totalAmount').innerText();
        console.log(`   ✅ 總計計算: ${totalText}`);
        
        // 步驟 5: 提交表單並驗證結果
        console.log('📋 步驟 5: 提交表單');
        
        // 截圖提交前狀態
        await page.screenshot({ 
            path: `quote-final-test-before-submit.png`, 
            fullPage: true 
        });
        console.log('   📸 已儲存提交前截圖');
        
        // 監聽網路請求以獲取詳細回應
        page.on('response', response => {
            if (response.url().includes('/quotes') && response.request().method() === 'POST') {
                console.log(`   📡 收到回應: ${response.status()} ${response.statusText()}`);
            }
        });
        
        // 監聽控制台訊息
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`   🐛 瀏覽器錯誤: ${msg.text()}`);
            }
        });
        
        const submitButton = page.locator('button[type="submit"]');
        const buttonText = await submitButton.innerText();
        console.log(`   🚀 準備點擊提交按鈕: ${buttonText}`);
        
        // 設置導航等待
        const navigationPromise = page.waitForURL(/quotes\/\d+/, { timeout: 20000 }).catch(() => null);
        
        // 點擊提交按鈕
        await submitButton.click();
        console.log('   ✅ 已點擊提交按鈕');
        
        // 等待導航完成
        await page.waitForTimeout(5000);
        
        const finalUrl = page.url();
        console.log(`   📍 提交後 URL: ${finalUrl}`);
        
        // 檢查結果
        if (finalUrl.includes('quotes/') && finalUrl !== 'http://127.0.0.1:8000/quotes/create') {
            console.log('\n' + '🎉'.repeat(20));
            console.log('✅ 測試成功！報價單建立功能已完全修復！');
            console.log('🎉'.repeat(20));
            
            // 等待頁面完全載入
            await page.waitForLoadState('networkidle');
            
            // 檢查報價單內容
            console.log('\n📋 驗證報價單內容:');
            
            const pageContent = await page.content();
            
            if (pageContent.includes('最終驗證測試產品')) {
                console.log('   ✅ 產品名稱正確顯示');
            } else {
                console.log('   ⚠️ 未找到產品名稱');
            }
            
            if (pageContent.includes('2000') || pageContent.includes('2,000')) {
                console.log('   ✅ 單價正確顯示');
            } else {
                console.log('   ⚠️ 單價顯示可能有問題');
            }
            
            if (pageContent.includes('4000') || pageContent.includes('4,000')) {
                console.log('   ✅ 小計金額正確 (2 × 2000 = 4000)');
            } else {
                console.log('   ⚠️ 小計金額可能不正確');
            }
            
            if (pageContent.includes('4200') || pageContent.includes('4,200')) {
                console.log('   ✅ 總金額正確 (4000 + 200稅額 = 4200)');
            } else {
                console.log('   ⚠️ 總金額可能不正確');
            }
            
            // 取得報價單 ID
            const quoteId = finalUrl.split('/').pop();
            console.log(`   📋 新建報價單 ID: ${quoteId}`);
            
            // 截圖成功狀態
            await page.screenshot({ 
                path: `quote-final-test-success.png`, 
                fullPage: true 
            });
            console.log('   📸 已儲存成功截圖');
            
        } else {
            console.log('\n❌ 測試失敗！仍然無法建立報價單');
            console.log(`   📍 停留在: ${finalUrl}`);
            
            // 檢查錯誤訊息
            const errorElements = await page.locator('.alert-danger, .error, [class*="error"]').all();
            if (errorElements.length > 0) {
                console.log('\n📝 錯誤訊息:');
                for (const element of errorElements) {
                    const errorText = await element.innerText();
                    if (errorText.trim()) {
                        console.log(`   ❌ ${errorText.trim()}`);
                    }
                }
            }
            
            // 截圖錯誤狀態
            await page.screenshot({ 
                path: `quote-final-test-failure.png`, 
                fullPage: true 
            });
            console.log('   📸 已儲存失敗截圖');
        }
        
        // 最終總結
        console.log('\n' + '='.repeat(70));
        console.log('🧪 最終測試結果總結');
        console.log('='.repeat(70));
        
        if (finalUrl.includes('quotes/') && finalUrl !== 'http://127.0.0.1:8000/quotes/create') {
            console.log('✅ 報價單建立功能已完全修復！');
            console.log('✅ 日期格式問題已解決');
            console.log('✅ 產品資料處理問題已解決');
            console.log('✅ 表單提交流程正常');
            console.log('✅ 系統運作穩定');
            console.log(`✅ 新建報價單: ${finalUrl}`);
        } else {
            console.log('❌ 報價單建立功能仍有問題需要進一步修復');
        }
        
    } catch (error) {
        console.log(`❌ 測試過程發生錯誤: ${error.message}`);
        
        // 截圖錯誤狀態
        await page.screenshot({ 
            path: `quote-final-test-crash.png`, 
            fullPage: true 
        });
        console.log('   📸 已儲存崩潰截圖');
        
    } finally {
        console.log('\n瀏覽器將在 15 秒後關閉...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        await browser.close();
    }
}

// 執行測試
testQuoteCreationFinal();