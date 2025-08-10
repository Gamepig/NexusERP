const { test, expect } = require('@playwright/test');

test.describe('手動報價單流程測試', () => {
    test('手動執行完整報價建立流程', async ({ page }) => {
        console.log('🧪 開始手動報價單流程測試');
        
        let allNetworkEvents = [];

        // 監控所有相關的網絡活動
        page.on('request', request => {
            const url = request.url();
            if (url.includes('/quotes') || url.includes('/products') || 
                url.includes('/api/') || url.includes('/search')) {
                
                allNetworkEvents.push({
                    type: 'request',
                    method: request.method(),
                    url: url,
                    postData: request.postData(),
                    timestamp: new Date().toISOString()
                });
                
                console.log(`📤 [REQUEST] ${request.method()} ${url}`);
                if (request.postData()) {
                    console.log(`📤 [POST DATA] ${request.postData()}`);
                }
            }
        });

        page.on('response', async response => {
            const url = response.url();
            if (url.includes('/quotes') || url.includes('/products') || 
                url.includes('/api/') || url.includes('/search')) {
                
                let responseBody = '';
                try {
                    responseBody = await response.text();
                } catch (e) {
                    responseBody = `Error reading: ${e.message}`;
                }
                
                allNetworkEvents.push({
                    type: 'response',
                    status: response.status(),
                    url: url,
                    body: responseBody,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`📥 [RESPONSE] ${response.status()} ${url}`);
                
                // 特別記錄產品搜尋響應
                if (url.includes('product') || url.includes('search')) {
                    console.log(`🔍 [PRODUCT RESPONSE] ${responseBody.substring(0, 300)}`);
                }
            }
        });

        // 登入系統
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');

        // 前往報價建立頁面
        await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'manual-01-form-loaded.png', fullPage: true });

        console.log('\n=== 步驟 1: 客戶資訊 ===');

        // 選擇客戶 - 使用精確選擇器
        await page.selectOption('select[name="customer_id"]', { index: 1 });
        console.log('✅ 客戶已選擇');

        // 設定報價日期
        await page.fill('input[name="quote_date"]', '2025-08-10');
        console.log('✅ 報價日期設定');

        // 設定有效期限（由系統預設，但我們可以修改）
        await page.fill('input[name="valid_until"]', '2025-09-10');
        console.log('✅ 有效期限設定');

        // 填寫聯絡人
        await page.fill('input[name="contact_person"]', '張經理');
        console.log('✅ 聯絡人設定');

        // 修改狀態為非預設
        const statusOptions = await page.locator('select[name="status"] option').allTextContents();
        console.log('可用狀態:', statusOptions);
        if (statusOptions.length > 1) {
            await page.selectOption('select[name="status"]', { index: 1 });
            console.log('✅ 狀態修改為非預設');
        }

        // 修改幣別
        const currencyOptions = await page.locator('select[name="currency"] option').allTextContents();
        console.log('可用幣別:', currencyOptions);
        if (currencyOptions.includes('美元 (USD)')) {
            await page.selectOption('select[name="currency"]', 'USD');
            console.log('✅ 幣別設定為美元');
        }

        await page.screenshot({ path: 'manual-02-step1-completed.png', fullPage: true });

        console.log('\n=== 步驟 2: 進入產品選擇 ===');

        // 點擊下一步（使用 first() 避免多個元素問題）
        await page.locator('button:has-text("下一步")').first().click();
        await page.waitForTimeout(2000); // 等待步驟切換
        await page.screenshot({ path: 'manual-03-step2-products.png', fullPage: true });

        console.log('\n=== 步驟 3: 產品搜尋測試 ===');

        // 等待頁面載入完成
        await page.waitForLoadState('domcontentloaded');
        
        // 尋找產品輸入框
        const productInputs = page.locator('input[name*="name"]');
        const inputCount = await productInputs.count();
        console.log(`發現 ${inputCount} 個產品名稱輸入框`);

        if (inputCount > 0) {
            // 嘗試在第一個產品輸入框中搜尋
            const firstProductInput = productInputs.first();
            
            // 檢查輸入框的屬性
            const inputName = await firstProductInput.getAttribute('name');
            const inputPlaceholder = await firstProductInput.getAttribute('placeholder');
            console.log(`測試輸入框: name="${inputName}", placeholder="${inputPlaceholder}"`);

            // 輸入搜尋關鍵字
            await firstProductInput.fill('測試');
            console.log('✅ 已輸入搜尋關鍵字: 測試');

            // 觸發輸入事件
            await firstProductInput.press('ArrowDown');
            await page.waitForTimeout(1000);

            // 等待可能的 API 響應
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'manual-04-product-search.png', fullPage: true });

            // 檢查是否有下拉選單或搜尋結果
            const dropdownOptions = page.locator('.dropdown-menu li, .search-results li, ul li');
            const optionCount = await dropdownOptions.count();
            console.log(`發現 ${optionCount} 個下拉選項`);

            if (optionCount > 0) {
                console.log('✅ 發現產品搜尋結果');
                await dropdownOptions.first().click();
                console.log('✅ 已選擇第一個產品');
                await page.waitForTimeout(1000);
            } else {
                console.log('⚠️ 沒有找到搜尋結果，手動填寫產品資訊');
                
                // 手動填寫產品資訊
                await firstProductInput.fill('測試產品A');
                
                // 填寫價格
                const priceInput = page.locator('input[name*="unit_price"], input[name*="price"]').first();
                if (await priceInput.count() > 0) {
                    await priceInput.fill('1500');
                    console.log('✅ 已填寫產品價格: 1500');
                }
                
                // 填寫數量
                const quantityInput = page.locator('input[name*="quantity"]').first();
                if (await quantityInput.count() > 0) {
                    await quantityInput.fill('2');
                    console.log('✅ 已填寫產品數量: 2');
                }
            }

            await page.screenshot({ path: 'manual-05-product-filled.png', fullPage: true });
        } else {
            console.log('❌ 未找到產品輸入框');
        }

        console.log('\n=== 步驟 4: 進入確認步驟 ===');

        // 前往下一步
        const nextStepButtons = page.locator('button:has-text("下一步")');
        if (await nextStepButtons.count() > 0) {
            await nextStepButtons.first().click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'manual-06-step3-confirmation.png', fullPage: true });
            console.log('✅ 已進入確認步驟');
        }

        console.log('\n=== 步驟 5: 提交報價單 ===');

        // 尋找並點擊提交按鈕
        const submitButtons = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("建立")');
        if (await submitButtons.count() > 0) {
            console.log('發現提交按鈕，準備提交');
            await submitButtons.first().click();
            console.log('✅ 已點擊提交按鈕');
            
            // 等待提交完成
            await page.waitForTimeout(5000);
            await page.screenshot({ path: 'manual-07-after-submit.png', fullPage: true });
        }

        console.log('\n========== 數據流分析報告 ==========');
        
        // 分析所有網絡事件
        const requests = allNetworkEvents.filter(e => e.type === 'request');
        const responses = allNetworkEvents.filter(e => e.type === 'response');
        
        console.log(`\n📊 網絡活動統計:`);
        console.log(`- HTTP 請求總數: ${requests.length}`);
        console.log(`- HTTP 響應總數: ${responses.length}`);

        console.log(`\n📤 詳細請求分析:`);
        requests.forEach((req, index) => {
            console.log(`\n${index + 1}. [${req.timestamp}] ${req.method} ${req.url}`);
            
            if (req.postData) {
                console.log(`   POST 數據: ${req.postData}`);
                
                // 嘗試解析提交的報價數據
                if (req.url.includes('/quotes') && req.method === 'POST') {
                    try {
                        const quoteData = JSON.parse(req.postData);
                        console.log(`   🔍 報價單數據分析:`);
                        console.log(`     - 客戶ID: ${quoteData.customer_id || '❌ 缺失'}`);
                        console.log(`     - 報價日期: ${quoteData.quote_date || '❌ 缺失'}`);
                        console.log(`     - 幣別: ${quoteData.currency || '❌ 缺失'}`);
                        console.log(`     - 狀態: ${quoteData.status || '❌ 缺失'}`);
                        
                        if (quoteData.items && Array.isArray(quoteData.items)) {
                            console.log(`     - 產品項目: ${quoteData.items.length} 項`);
                            
                            quoteData.items.forEach((item, idx) => {
                                console.log(`       項目 ${idx + 1}:`);
                                console.log(`         - product_id: ${item.product_id || '❌ 缺失'}`);
                                console.log(`         - name: ${item.name || '❌ 缺失'}`);
                                console.log(`         - unit_price: ${item.unit_price || '❌ 缺失'}`);
                                console.log(`         - quantity: ${item.quantity || '❌ 缺失'}`);
                                
                                // 標記關鍵問題
                                const issues = [];
                                if (!item.product_id) issues.push('product_id');
                                if (!item.name) issues.push('name');
                                if (!item.unit_price) issues.push('unit_price');
                                if (!item.quantity) issues.push('quantity');
                                
                                if (issues.length > 0) {
                                    console.log(`         🚨 缺失欄位: ${issues.join(', ')}`);
                                }
                            });
                        } else {
                            console.log(`     - 產品項目: ❌ 沒有或格式錯誤`);
                        }
                    } catch (e) {
                        console.log(`     ⚠️ 無法解析報價數據: ${e.message}`);
                    }
                }
            }
        });

        console.log(`\n📥 詳細響應分析:`);
        responses.forEach((res, index) => {
            console.log(`\n${index + 1}. [${res.timestamp}] ${res.status} ${res.url}`);
            console.log(`   內容長度: ${res.body.length} 字符`);
            
            // 特別分析產品搜尋響應
            if (res.url.includes('product') || res.url.includes('search')) {
                console.log(`   🔍 產品搜尋響應:`);
                
                try {
                    const products = JSON.parse(res.body);
                    if (Array.isArray(products)) {
                        console.log(`     - 找到產品數: ${products.length}`);
                        if (products.length > 0) {
                            const sample = products[0];
                            console.log(`     - 產品樣本:`);
                            console.log(`       - id: ${sample.id || '無'}`);
                            console.log(`       - name: ${sample.name || '無'}`);
                            console.log(`       - unit_price: ${sample.unit_price || '無'}`);
                            console.log(`       - 完整結構: ${JSON.stringify(sample, null, 6)}`);
                        }
                    } else {
                        console.log(`     - 響應格式: 非陣列 - ${typeof products}`);
                    }
                } catch (e) {
                    console.log(`     - 無法解析JSON: ${e.message}`);
                    console.log(`     - 原始內容: ${res.body.substring(0, 200)}`);
                }
            }
        });

        console.log(`\n🩺 問題診斷摘要:`);
        
        const productSearches = responses.filter(r => r.url.includes('product') || r.url.includes('search'));
        const quoteSubmissions = requests.filter(r => r.url.includes('/quotes') && r.method === 'POST');
        
        console.log(`- 產品搜尋 API 調用: ${productSearches.length} 次`);
        console.log(`- 報價單提交請求: ${quoteSubmissions.length} 次`);
        
        if (productSearches.length === 0) {
            console.log(`❌ 關鍵問題: 沒有偵測到產品搜尋 API 調用`);
            console.log(`   可能原因:`);
            console.log(`   1. 產品搜尋功能未被觸發`);
            console.log(`   2. JavaScript 搜尋功能有錯誤`);
            console.log(`   3. API 端點路徑與監控的模式不匹配`);
        }
        
        if (quoteSubmissions.length === 0) {
            console.log(`❌ 關鍵問題: 沒有偵測到報價單提交請求`);
            console.log(`   可能原因:`);
            console.log(`   1. 提交按鈕未被觸發`);
            console.log(`   2. 表單驗證失敗`);
            console.log(`   3. JavaScript 提交功能有錯誤`);
        }

        console.log(`\n✅ 測試完成`);
        console.log(`📊 收集的數據: ${requests.length} 請求, ${responses.length} 響應`);
        
        // 基本驗證
        expect(allNetworkEvents.length).toBeGreaterThan(0);
    });
});