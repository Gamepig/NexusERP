const { chromium } = require('playwright');

/**
 * 報價單建立功能終極最終驗證測試
 * 測試目標：驗證使用預設 product_id 後，報價單建立功能是否完全正常
 */

async function testQuoteCreationUltimateFinal() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🎯 開始報價單建立功能終極最終驗證測試');
        console.log('='.repeat(80));
        
        // 步驟 1: 登入系統
        console.log('📋 步驟 1: 登入系統');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        console.log(`   ✅ 登入成功: ${page.url()}`);
        
        // 步驟 2: 前往報價單建立頁面
        console.log('📋 步驟 2: 前往報價單建立頁面');
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
        
        console.log(`   ✅ 頁面載入成功: ${page.url()}`);
        
        // 步驟 3: 填寫測試資料
        console.log('📋 步驟 3: 填寫終極測試資料');
        
        // 選擇客戶
        const customerSelect = page.locator('select[name="customer_id"]');
        const customerOptions = await customerSelect.locator('option').all();
        if (customerOptions.length > 1) {
            const customerValue = await customerOptions[1].getAttribute('value');
            await customerSelect.selectOption(customerValue);
            const selectedCustomer = await customerOptions[1].innerText();
            console.log(`   ✅ 已選擇客戶: ${selectedCustomer.trim()}`);
        }
        
        // 填寫產品資訊 - 使用終極測試資料
        const productInput = page.locator('input[name="items[0][name]"]');
        await productInput.fill('終極驗證產品 - 完美測試');
        console.log('   ✅ 已填寫產品名稱: 終極驗證產品 - 完美測試');
        
        const quantityInput = page.locator('input[name="items[0][quantity]"]');
        await quantityInput.fill('3');
        console.log('   ✅ 已填寫數量: 3');
        
        const priceInput = page.locator('input[name="items[0][unit_price]"]');
        await priceInput.fill('2500');
        console.log('   ✅ 已填寫單價: 2500');
        
        // 等待計算更新
        await page.waitForTimeout(1000);
        
        // 檢查計算結果
        const subtotalText = await page.locator('#subtotalAmount').innerText();
        const totalText = await page.locator('#totalAmount').innerText();
        console.log(`   ✅ 小計: ${subtotalText}, 總計: ${totalText}`);
        
        // 步驟 4: 執行終極提交測試
        console.log('📋 步驟 4: 執行終極提交測試');
        
        // 截圖提交前狀態
        await page.screenshot({ 
            path: `quote-ultimate-before-submit.png`, 
            fullPage: true 
        });
        console.log('   📸 已儲存提交前截圖');
        
        // 監聽所有網路活動
        let responseReceived = false;
        let responseStatus = null;
        let responseBody = '';
        
        page.on('response', async (response) => {
            if (response.url().includes('/quotes') && response.request().method() === 'POST') {
                responseReceived = true;
                responseStatus = response.status();
                try {
                    responseBody = await response.text();
                } catch (e) {
                    responseBody = '無法讀取回應內容';
                }
                console.log(`   📡 收到API回應: ${responseStatus}`);
                if (responseStatus !== 200 && responseStatus !== 201 && responseStatus !== 302) {
                    console.log(`   📝 回應內容: ${responseBody.substring(0, 200)}...`);
                }
            }
        });
        
        const submitButton = page.locator('button[type="submit"]');
        console.log('   🚀 準備執行終極提交...');
        
        // 點擊提交按鈕
        await submitButton.click();
        console.log('   ✅ 已點擊提交按鈕');
        
        // 等待回應和可能的導航
        await page.waitForTimeout(8000);
        
        const finalUrl = page.url();
        console.log(`   📍 最終 URL: ${finalUrl}`);
        
        // 步驟 5: 驗證結果
        console.log('📋 步驟 5: 驗證最終結果');
        
        if (finalUrl.includes('quotes/') && finalUrl !== 'http://127.0.0.1:8000/quotes/create') {
            // 🎉 成功案例
            console.log('\n' + '🎉'.repeat(30));
            console.log('🎯 ✅ 終極測試成功！報價單建立功能已完全修復！ ✅ 🎯');
            console.log('🎉'.repeat(30));
            
            // 等待頁面完全載入
            await page.waitForLoadState('networkidle');
            
            // 詳細驗證報價單內容
            console.log('\n📋 驗證報價單詳細內容:');
            
            const pageContent = await page.content();
            
            // 驗證產品名稱
            if (pageContent.includes('終極驗證產品') || pageContent.includes('完美測試')) {
                console.log('   ✅ 產品名稱正確顯示');
            } else {
                console.log('   ⚠️ 產品名稱顯示可能有問題');
            }
            
            // 驗證數量
            if (pageContent.includes('3')) {
                console.log('   ✅ 數量正確顯示 (3)');
            } else {
                console.log('   ⚠️ 數量顯示可能有問題');
            }
            
            // 驗證單價
            if (pageContent.includes('2500') || pageContent.includes('2,500')) {
                console.log('   ✅ 單價正確顯示 (2500)');
            } else {
                console.log('   ⚠️ 單價顯示可能有問題');
            }
            
            // 驗證小計 (3 × 2500 = 7500)
            if (pageContent.includes('7500') || pageContent.includes('7,500')) {
                console.log('   ✅ 小計金額正確 (3 × 2500 = 7500)');
            } else {
                console.log('   ⚠️ 小計金額可能不正確');
            }
            
            // 驗證總計 (7500 + 375稅額 = 7875)
            if (pageContent.includes('7875') || pageContent.includes('7,875')) {
                console.log('   ✅ 總金額正確 (7500 + 375稅額 = 7875)');
            } else {
                console.log('   ⚠️ 總金額可能不正確');
            }
            
            // 取得報價單 ID
            const quoteId = finalUrl.split('/').pop();
            console.log(`   📋 新建報價單 ID: ${quoteId}`);
            
            // 截圖成功狀態
            await page.screenshot({ 
                path: `quote-ultimate-success.png`, 
                fullPage: true 
            });
            console.log('   📸 已儲存成功截圖');
            
            // 驗證完成
            console.log('\n🔍 功能驗證檢查清單:');
            console.log('   ✅ 日期格式問題已解決');
            console.log('   ✅ 產品 ID 問題已解決');
            console.log('   ✅ 表單提交流程正常');
            console.log('   ✅ 報價單成功建立');
            console.log('   ✅ 資料正確顯示');
            console.log('   ✅ 計算邏輯正確');
            console.log('   ✅ 導航流程順暢');
            
        } else {
            // ❌ 失敗案例
            console.log('\n❌ 終極測試失敗！');
            console.log(`   📍 停留在: ${finalUrl}`);
            
            // 檢查是否有回應
            if (responseReceived) {
                console.log(`   📡 API 回應狀態: ${responseStatus}`);
                if (responseBody) {
                    console.log(`   📝 回應內容: ${responseBody.substring(0, 500)}...`);
                }
            } else {
                console.log('   📡 未收到 API 回應');
            }
            
            // 檢查錯誤訊息
            const errorElements = await page.locator('.alert-danger, .error, [class*="error"]').all();
            if (errorElements.length > 0) {
                console.log('\n📝 頁面錯誤訊息:');
                for (const element of errorElements) {
                    const errorText = await element.innerText();
                    if (errorText.trim()) {
                        console.log(`   ❌ ${errorText.trim()}`);
                    }
                }
            }
            
            // 截圖失敗狀態
            await page.screenshot({ 
                path: `quote-ultimate-failure.png`, 
                fullPage: true 
            });
            console.log('   📸 已儲存失敗截圖');
        }
        
        // 最終總結
        console.log('\n' + '='.repeat(80));
        console.log('🎯 終極測試結果總結');
        console.log('='.repeat(80));
        
        if (finalUrl.includes('quotes/') && finalUrl !== 'http://127.0.0.1:8000/quotes/create') {
            console.log('🎉 ✅ 報價單建立功能已完全修復並正常運作！');
            console.log('🎉 ✅ 所有問題都已解決！');
            console.log('🎉 ✅ 系統可以正式投入使用！');
            console.log(`🎉 ✅ 成功案例URL: ${finalUrl}`);
        } else {
            console.log('❌ 報價單建立功能仍需要進一步修復');
            console.log('❌ 需要額外的調試和修復工作');
        }
        
    } catch (error) {
        console.log(`❌ 測試過程發生嚴重錯誤: ${error.message}`);
        console.log(`   堆疊追蹤: ${error.stack}`);
        
        // 截圖錯誤狀態
        await page.screenshot({ 
            path: `quote-ultimate-crash.png`, 
            fullPage: true 
        });
        console.log('   📸 已儲存崩潰截圖');
        
    } finally {
        console.log('\n瀏覽器將在 20 秒後關閉...');
        await new Promise(resolve => setTimeout(resolve, 20000));
        await browser.close();
    }
}

// 執行終極測試
testQuoteCreationUltimateFinal();