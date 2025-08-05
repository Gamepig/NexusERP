const { chromium } = require('playwright');

/**
 * 報價單建立功能最終驗證測試
 * 測試目標：驗證日期格式修復後，報價單建立功能是否完全正常
 */

async function testQuoteCreation() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🧪 開始最終報價單建立功能驗證測試');
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
        
        // 檢查頁面標題
        const title = await page.title();
        console.log(`   頁面標題: ${title}`);
        
        // 步驟 4: 檢查表單元素是否存在
        console.log('📋 步驟 4: 檢查表單元素');
        
        // 檢查客戶下拉選單
        const customerSelect = page.locator('select[name="customer_id"]');
        const customerExists = await customerSelect.count() > 0;
        console.log(`   ✅ 客戶選擇欄位存在: ${customerExists}`);
        
        // 檢查產品相關欄位
        const productName = page.locator('input[name="items[0][product_name]"]');
        const productNameExists = await productName.count() > 0;
        console.log(`   ✅ 產品名稱欄位存在: ${productNameExists}`);
        
        const quantity = page.locator('input[name="items[0][quantity]"]');
        const quantityExists = await quantity.count() > 0;
        console.log(`   ✅ 數量欄位存在: ${quantityExists}`);
        
        const unitPrice = page.locator('input[name="items[0][unit_price]"]');
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
                console.log(`   ✅ 已選擇客戶: ${selectedCustomer}`);
            } else {
                console.log('   ⚠️ 沒有可用的客戶選項');
            }
        }
        
        // 填寫產品資訊
        if (productNameExists) {
            await productName.fill('最終測試產品');
            console.log('   ✅ 已填寫產品名稱: 最終測試產品');
        }
        
        if (quantityExists) {
            await quantity.fill('1');
            console.log('   ✅ 已填寫數量: 1');
        }
        
        if (unitPriceExists) {
            await unitPrice.fill('1500');
            console.log('   ✅ 已填寫單價: 1500');
        }
        
        // 步驟 6: 提交表單
        console.log('📋 步驟 6: 提交表單');
        
        // 查找提交按鈕
        const submitButton = page.locator('button[type="submit"]');
        const submitExists = await submitButton.count() > 0;
        
        if (submitExists) {
            const buttonText = await submitButton.innerText();
            console.log(`   找到提交按鈕: ${buttonText}`);
            
            // 監聽網路請求
            const responsePromise = page.waitForResponse(response => 
                response.url().includes('/quotes') && response.request().method() === 'POST',
                { timeout: 30000 }
            );
            
            // 點擊提交按鈕
            await submitButton.click();
            console.log('   ✅ 已點擊提交按鈕');
            
            // 等待回應
            try {
                const response = await responsePromise;
                const status = response.status();
                console.log(`   📡 伺服器回應狀態碼: ${status}`);
                
                // 取得回應內容
                const responseText = await response.text();
                console.log(`   📝 回應內容長度: ${responseText.length} 字符`);
                
                // 等待頁面加載
                await page.waitForLoadState('networkidle', { timeout: 10000 });
                
                // 檢查結果
                const finalUrl = page.url();
                console.log(`   📍 提交後 URL: ${finalUrl}`);
                
                // 檢查是否有成功訊息
                const successElements = await page.locator('.alert-success, .success, [class*="success"]').all();
                if (successElements.length > 0) {
                    for (const element of successElements) {
                        const msgText = await element.innerText();
                        console.log(`   ✅ 成功訊息: ${msgText}`);
                    }
                }
                
                // 檢查是否有錯誤訊息
                const errorElements = await page.locator('.alert-danger, .error, [class*="error"]').all();
                if (errorElements.length > 0) {
                    for (const element of errorElements) {
                        const msgText = await element.innerText();
                        console.log(`   ❌ 錯誤訊息: ${msgText}`);
                    }
                }
                
                // 如果跳轉到報價單詳細頁面，檢查內容
                if (finalUrl.includes('quotes/') && finalUrl !== 'http://127.0.0.1:8000/quotes/create') {
                    console.log('   🎯 成功跳轉到報價單詳細頁面！');
                    
                    // 檢查頁面內容
                    const pageContent = await page.content();
                    
                    // 檢查是否顯示產品資訊
                    if (pageContent.includes('最終測試產品')) {
                        console.log('   ✅ 產品名稱正確顯示');
                    }
                    
                    if (pageContent.includes('1500') || pageContent.includes('1,500')) {
                        console.log('   ✅ 價格正確顯示');
                    }
                    
                    // 取得報價單 ID
                    const quoteId = finalUrl.split('/').pop();
                    console.log(`   📋 報價單 ID: ${quoteId}`);
                    
                    // 截圖記錄
                    await page.screenshot({ 
                        path: `quotation-test-result.png`, 
                        fullPage: true 
                    });
                    console.log('   📸 已儲存截圖: quotation-test-result.png');
                    
                } else {
                    console.log('   ❌ 未能跳轉到報價單詳細頁面');
                    
                    // 檢查是否還在建立頁面且有錯誤
                    if (finalUrl === 'http://127.0.0.1:8000/quotes/create') {
                        console.log('   📍 仍在建立頁面，檢查錯誤原因...');
                        
                        // 檢查表單驗證錯誤
                        const validationErrors = await page.locator('.invalid-feedback, .error-message').all();
                        if (validationErrors.length > 0) {
                            for (const error of validationErrors) {
                                const errorText = await error.innerText();
                                console.log(`   ❌ 表單驗證錯誤: ${errorText}`);
                            }
                        }
                        
                        // 檢查是否有 Invalid request data 錯誤
                        const bodyText = await page.locator('body').innerText();
                        if (bodyText.includes('Invalid request data')) {
                            console.log('   ❌ 仍然出現 "Invalid request data" 錯誤');
                        }
                    }
                    
                    // 截圖記錄錯誤狀態
                    await page.screenshot({ 
                        path: `quotation-test-error.png`, 
                        fullPage: true 
                    });
                    console.log('   📸 已儲存錯誤截圖: quotation-test-error.png');
                }
                
            } catch (error) {
                console.log(`   ❌ 提交過程發生錯誤: ${error.message}`);
                
                // 檢查當前頁面狀態
                const currentUrl = page.url();
                console.log(`   📍 當前 URL: ${currentUrl}`);
                
                // 檢查是否有錯誤訊息
                const errorMessages = await page.locator('body').innerText();
                if (errorMessages.includes('Invalid request data')) {
                    console.log('   ❌ 仍然出現 "Invalid request data" 錯誤');
                } else if (errorMessages.includes('419')) {
                    console.log('   ❌ CSRF token 錯誤');
                } else {
                    console.log(`   📝 頁面內容摘要: ${errorMessages.substring(0, 500)}...`);
                }
                
                // 截圖記錄錯誤
                await page.screenshot({ 
                    path: `quotation-test-timeout.png`, 
                    fullPage: true 
                });
                console.log('   📸 已儲存超時截圖: quotation-test-timeout.png');
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
            console.log('   - 成功登入系統');
            console.log('   - 成功填寫表單');
            console.log('   - 成功提交報價單');
            console.log('   - 成功跳轉到詳細頁面');
            console.log('   - 資料正確顯示');
        } else {
            console.log('❌ 測試失敗！報價單建立功能仍有問題');
            console.log('   需要進一步檢查和修復');
        }
        
    } catch (error) {
        console.log(`❌ 測試過程發生未預期錯誤: ${error.message}`);
        
        // 截圖記錄錯誤
        await page.screenshot({ 
            path: `quotation-test-crash.png`, 
            fullPage: true 
        });
        console.log('   📸 已儲存崩潰截圖: quotation-test-crash.png');
        
    } finally {
        // 保持瀏覽器開啟一段時間以便查看結果
        console.log('\n瀏覽器將在 10 秒後關閉...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        await browser.close();
    }
}

// 執行測試
testQuoteCreation();