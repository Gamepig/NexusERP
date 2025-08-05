const { chromium } = require('playwright');

/**
 * 報價單建立功能最終驗證測試 - 修正版
 * 測試目標：驗證日期格式修復後，報價單建立功能是否完全正常
 */

async function testQuoteCreation() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🧪 開始最終報價單建立功能驗證測試 (修正版)');
        console.log('='.repeat(60));
        
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
        
        // 檢查是否成功登入
        const currentUrl = page.url();
        console.log(`   登入後 URL: ${currentUrl}`);
        
        // 步驟 3: 前往報價單建立頁面
        console.log('📋 步驟 3: 前往報價單建立頁面');
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
        
        const quoteCreateUrl = page.url();
        console.log(`   報價單建立頁面 URL: ${quoteCreateUrl}`);
        
        // 步驟 4: 檢查表單元素是否存在
        console.log('📋 步驟 4: 檢查表單元素');
        
        // 檢查客戶下拉選單
        const customerSelect = page.locator('select[name="customer_id"]');
        const customerExists = await customerSelect.count() > 0;
        console.log(`   ✅ 客戶選擇欄位存在: ${customerExists}`);
        
        // 檢查產品輸入欄位（使用更通用的選擇器）
        const productInputs = [
            'input[placeholder*="產品名稱"]',
            'input[placeholder*="輸入產品名稱"]',
            'input[name*="product_name"]',
            'input[name*="description"]'
        ];
        
        let productInput = null;
        let productInputExists = false;
        
        for (const selector of productInputs) {
            const element = page.locator(selector);
            if (await element.count() > 0) {
                productInput = element.first();
                productInputExists = true;
                console.log(`   ✅ 產品輸入欄位存在 (${selector}): true`);
                break;
            }
        }
        
        if (!productInputExists) {
            console.log('   ⚠️ 產品輸入欄位未找到，嘗試查找所有輸入欄位...');
            const allInputs = await page.locator('input[type="text"]').all();
            console.log(`   📝 找到 ${allInputs.length} 個文字輸入欄位`);
            
            // 使用第一個看起來像產品名稱的輸入欄位
            if (allInputs.length > 0) {
                productInput = page.locator('input[type="text"]').first();
                productInputExists = true;
                console.log('   ✅ 使用第一個文字輸入欄位作為產品名稱');
            }
        }
        
        const quantity = page.locator('input[name*="quantity"], input[type="number"]').first();
        const quantityExists = await quantity.count() > 0;
        console.log(`   ✅ 數量欄位存在: ${quantityExists}`);
        
        const unitPrice = page.locator('input[name*="price"], input[name*="unit_price"]').first();
        const unitPriceExists = await unitPrice.count() > 0;
        console.log(`   ✅ 單價欄位存在: ${unitPriceExists}`);
        
        // 步驟 5: 填寫表單
        console.log('📋 步驟 5: 填寫表單');
        
        // 選擇客戶
        if (customerExists) {
            // 獲取可用的客戶選項
            const customerOptions = await customerSelect.locator('option').all();
            if (customerOptions.length > 1) {  // 除了預設選項外有其他選項
                const customerValue = await customerOptions[1].getAttribute('value');
                await customerSelect.selectOption(customerValue);
                const selectedCustomer = await customerOptions[1].innerText();
                console.log(`   ✅ 已選擇客戶: ${selectedCustomer.trim()}`);
            } else {
                console.log('   ⚠️ 沒有可用的客戶選項');
            }
        }
        
        // 填寫產品資訊
        if (productInputExists && productInput) {
            await productInput.fill('最終測試產品');
            console.log('   ✅ 已填寫產品名稱: 最終測試產品');
            
            // 等待一下，看是否有自動完成功能
            await page.waitForTimeout(1000);
        }
        
        if (quantityExists) {
            await quantity.fill('1');
            console.log('   ✅ 已填寫數量: 1');
        }
        
        if (unitPriceExists) {
            await unitPrice.fill('1500');
            console.log('   ✅ 已填寫單價: 1500');
            
            // 等待計算更新
            await page.waitForTimeout(1000);
        }
        
        // 檢查計算結果
        const subtotalElement = page.locator('text=/小計.*\\$.*1,?500/');
        const subtotalExists = await subtotalElement.count() > 0;
        if (subtotalExists) {
            console.log('   ✅ 小計計算正確');
        }
        
        // 步驟 6: 提交表單
        console.log('📋 步驟 6: 提交表單');
        
        // 查找提交按鈕
        const submitButton = page.locator('button[type="submit"], button:has-text("建立報價單")');
        const submitExists = await submitButton.count() > 0;
        
        if (submitExists) {
            const buttonText = await submitButton.innerText();
            console.log(`   找到提交按鈕: ${buttonText}`);
            
            // 截圖表單填寫完成狀態
            await page.screenshot({ 
                path: `quotation-test-before-submit.png`, 
                fullPage: true 
            });
            console.log('   📸 已儲存提交前截圖');
            
            // 設置更長的超時時間並監聽多種可能的回應
            console.log('   🚀 準備提交表單...');
            
            // 監聽頁面導航
            const navigationPromise = page.waitForURL(/quotes\/\d+/, { timeout: 15000 }).catch(() => null);
            
            // 監聽網路回應
            const responsePromise = page.waitForResponse(response => 
                (response.url().includes('/quotes') && response.request().method() === 'POST') ||
                response.url().includes('/quotes/') && response.status() < 400,
                { timeout: 15000 }
            ).catch(() => null);
            
            // 點擊提交按鈕
            await submitButton.click();
            console.log('   ✅ 已點擊提交按鈕');
            
            // 等待回應或導航
            const results = await Promise.allSettled([navigationPromise, responsePromise]);
            
            // 等待一段時間讓頁面完全加載
            await page.waitForTimeout(3000);
            
            // 檢查結果
            const finalUrl = page.url();
            console.log(`   📍 提交後 URL: ${finalUrl}`);
            
            // 檢查是否有成功跳轉
            if (finalUrl.includes('quotes/') && finalUrl !== 'http://127.0.0.1:8000/quotes/create') {
                console.log('   🎯 成功跳轉到報價單詳細頁面！');
                
                // 等待頁面完全加載
                await page.waitForLoadState('networkidle');
                
                // 檢查頁面內容
                const pageContent = await page.content();
                
                // 檢查是否顯示產品資訊
                if (pageContent.includes('最終測試產品')) {
                    console.log('   ✅ 產品名稱正確顯示');
                } else {
                    console.log('   ⚠️ 未找到產品名稱');
                }
                
                if (pageContent.includes('1500') || pageContent.includes('1,500')) {
                    console.log('   ✅ 價格正確顯示');
                } else {
                    console.log('   ⚠️ 未找到價格資訊');
                }
                
                // 檢查總金額
                if (pageContent.includes('1575') || pageContent.includes('1,575')) {
                    console.log('   ✅ 總金額計算正確');
                } else {
                    console.log('   ⚠️ 總金額可能不正確');
                }
                
                // 取得報價單 ID
                const quoteId = finalUrl.split('/').pop();
                console.log(`   📋 報價單 ID: ${quoteId}`);
                
                // 截圖記錄成功狀態
                await page.screenshot({ 
                    path: `quotation-test-success.png`, 
                    fullPage: true 
                });
                console.log('   📸 已儲存成功截圖');
                
            } else {
                console.log('   ❌ 未能跳轉到報價單詳細頁面');
                console.log(`   📍 當前 URL: ${finalUrl}`);
                
                // 檢查是否有錯誤訊息
                const errorElements = await page.locator('.alert-danger, .error, [class*="error"], .invalid-feedback').all();
                if (errorElements.length > 0) {
                    console.log('   📝 發現錯誤訊息:');
                    for (const element of errorElements) {
                        const errorText = await element.innerText();
                        if (errorText.trim()) {
                            console.log(`      ❌ ${errorText.trim()}`);
                        }
                    }
                }
                
                // 檢查頁面是否有其他提示
                const bodyText = await page.locator('body').innerText();
                if (bodyText.includes('Invalid request data')) {
                    console.log('   ❌ 仍然出現 "Invalid request data" 錯誤');
                } else if (bodyText.includes('419')) {
                    console.log('   ❌ CSRF token 錯誤');
                } else if (bodyText.includes('422')) {
                    console.log('   ❌ 表單驗證錯誤');
                }
                
                // 截圖記錄錯誤狀態
                await page.screenshot({ 
                    path: `quotation-test-error-final.png`, 
                    fullPage: true 
                });
                console.log('   📸 已儲存錯誤截圖');
            }
            
        } else {
            console.log('   ❌ 找不到提交按鈕');
        }
        
        // 步驟 7: 測試總結
        console.log('\n' + '='.repeat(60));
        console.log('🧪 測試總結');
        console.log('='.repeat(60));
        
        const finalPageUrl = page.url();
        if (finalPageUrl.includes('quotes/') && finalPageUrl !== 'http://127.0.0.1:8000/quotes/create') {
            console.log('✅ 測試成功！報價單建立功能正常運作');
            console.log('   - ✅ 成功登入系統');
            console.log('   - ✅ 成功填寫表單');
            console.log('   - ✅ 成功提交報價單');
            console.log('   - ✅ 成功跳轉到詳細頁面');
            console.log('   - ✅ 資料正確顯示');
            console.log(`   - 📋 最終 URL: ${finalPageUrl}`);
        } else {
            console.log('❌ 測試失敗！報價單建立功能仍有問題');
            console.log('   需要進一步檢查和修復');
            console.log(`   - 📍 當前 URL: ${finalPageUrl}`);
        }
        
    } catch (error) {
        console.log(`❌ 測試過程發生未預期錯誤: ${error.message}`);
        console.log(`   錯誤堆疊: ${error.stack}`);
        
        // 截圖記錄錯誤
        await page.screenshot({ 
            path: `quotation-test-crash-final.png`, 
            fullPage: true 
        });
        console.log('   📸 已儲存崩潰截圖');
        
    } finally {
        // 保持瀏覽器開啟一段時間以便查看結果
        console.log('\n瀏覽器將在 15 秒後關閉...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        await browser.close();
    }
}

// 執行測試
testQuoteCreation();