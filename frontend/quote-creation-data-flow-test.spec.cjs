const { test, expect } = require('@playwright/test');

test.describe('報價單建立完整數據流測試', () => {
    let networkRequests = [];
    let networkResponses = [];

    test('完整數據流追蹤 - 產品搜尋到表單提交', async ({ page }) => {
        console.log('🧪 開始執行報價單建立完整數據流測試');
        
        // 清空網絡監控數組
        networkRequests = [];
        networkResponses = [];

        // 監控所有網絡請求
        page.on('request', request => {
            if (request.url().includes('/quotes') || 
                request.url().includes('/products') || 
                request.url().includes('/customers') ||
                request.url().includes('/api/')) {
                networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    headers: request.headers(),
                    postData: request.postData()
                });
                console.log(`📤 API Request: ${request.method()} ${request.url()}`);
                if (request.postData()) {
                    console.log(`📤 Request Data:`, request.postData());
                }
            }
        });

        // 監控所有網絡響應
        page.on('response', async response => {
            if (response.url().includes('/quotes') || 
                response.url().includes('/products') || 
                response.url().includes('/customers') ||
                response.url().includes('/api/')) {
                let responseText = '';
                try {
                    responseText = await response.text();
                } catch (e) {
                    responseText = 'Unable to read response';
                }
                
                networkResponses.push({
                    url: response.url(),
                    status: response.status(),
                    headers: response.headers(),
                    body: responseText
                });
                console.log(`📥 API Response: ${response.status()} ${response.url()}`);
                console.log(`📥 Response Data:`, responseText);
            }
        });

        // 第一步：訪問主頁
        console.log('🔍 步驟 1: 訪問主頁');
        await page.goto('http://127.0.0.1:8000');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'quote-flow-01-homepage.png', fullPage: true });

        // 第二步：登入系統
        console.log('🔍 步驟 2: 登入系統');
        await page.click('a[href*="login"]');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.screenshot({ path: 'quote-flow-02-login-filled.png', fullPage: true });
        
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'quote-flow-03-after-login.png', fullPage: true });

        // 第三步：導航到多步驟表單
        console.log('🔍 步驟 3: 導航到報價建立頁面');
        await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'quote-flow-04-create-page.png', fullPage: true });

        // 第四步：填寫客戶資訊 (選擇 Vic Huang)
        console.log('🔍 步驟 4: 選擇客戶');
        
        // 確保客戶下拉選單可見並點擊
        const customerDropdown = page.locator('select[name="customer_id"]');
        if (await customerDropdown.count() > 0) {
            await expect(customerDropdown).toBeVisible();
            
            // 選擇 Vic Huang (假設他不是第一個選項)
            await customerDropdown.selectOption({ label: 'Vic Huang' });
            console.log('✅ 已選擇客戶: Vic Huang');
        } else {
            console.log('⚠️ 未找到客戶下拉選單');
        }
        
        await page.screenshot({ path: 'quote-flow-05-customer-selected.png', fullPage: true });

        // 第五步：關鍵產品搜尋測試
        console.log('🔍 步驟 5: 產品搜尋測試');
        
        // 尋找產品搜尋輸入框 - 使用更廣泛的選擇器
        const allInputs = page.locator('input');
        const inputCount = await allInputs.count();
        console.log(`發現 ${inputCount} 個輸入框`);
        
        let productInputFound = false;
        
        for (let i = 0; i < inputCount; i++) {
            const input = allInputs.nth(i);
            const placeholder = await input.getAttribute('placeholder');
            const name = await input.getAttribute('name');
            const id = await input.getAttribute('id');
            const type = await input.getAttribute('type');
            
            console.log(`輸入框 ${i}: name="${name}", id="${id}", placeholder="${placeholder}", type="${type}"`);
            
            // 尋找可能是產品搜尋的輸入框
            if (placeholder && (placeholder.includes('產品') || placeholder.includes('product') || placeholder.includes('搜尋')) ||
                name && (name.includes('product') || name.includes('item')) ||
                id && (id.includes('product') || id.includes('search'))) {
                
                console.log(`✅ 找到可能的產品搜尋輸入框: ${i}`);
                
                try {
                    await input.fill('測試');
                    productInputFound = true;
                    
                    // 等待搜尋 API 回應
                    await page.waitForTimeout(2000);
                    await page.screenshot({ path: 'quote-flow-06-product-search.png', fullPage: true });
                    
                    // 檢查是否有搜尋結果下拉選單
                    const searchResults = page.locator('.search-results, .dropdown-menu, .autocomplete-results, ul li');
                    const resultCount = await searchResults.count();
                    console.log(`發現 ${resultCount} 個搜尋結果元素`);
                    
                    if (resultCount > 0) {
                        console.log('✅ 發現搜尋結果下拉選單');
                        
                        // 點擊第一個搜尋結果
                        const firstResult = searchResults.first();
                        if (await firstResult.isVisible()) {
                            await firstResult.click();
                            console.log('✅ 已選擇第一個搜尋結果');
                            await page.screenshot({ path: 'quote-flow-07-product-selected.png', fullPage: true });
                        }
                    }
                    break;
                } catch (e) {
                    console.log(`⚠️ 無法在輸入框 ${i} 中輸入: ${e.message}`);
                }
            }
        }
        
        if (!productInputFound) {
            console.log('⚠️ 未找到產品搜尋輸入框，嘗試填寫任何可用的文本輸入框');
            
            // 嘗試填寫第一個文本輸入框
            const textInputs = page.locator('input[type="text"], input:not([type])');
            const textCount = await textInputs.count();
            
            if (textCount > 0) {
                await textInputs.first().fill('測試產品');
                await page.waitForTimeout(1000);
                await page.screenshot({ path: 'quote-flow-06-fallback-input.png', fullPage: true });
            }
        }

        // 第六步：填寫其他必要欄位
        console.log('🔍 步驟 6: 填寫其他必要欄位');
        
        // 填寫日期
        const dateInput = page.locator('input[type="date"], input[name*="date"]');
        if (await dateInput.count() > 0) {
            await dateInput.first().fill('2025-08-10');
            console.log('✅ 已設定日期: 2025-08-10');
        }
        
        // 設定狀態 (非預設值)
        const statusSelect = page.locator('select[name*="status"]');
        if (await statusSelect.count() > 0) {
            // 取得所有選項
            const options = await statusSelect.locator('option').allTextContents();
            console.log('可用狀態選項:', options);
            
            if (options.includes('sent')) {
                await statusSelect.selectOption('sent');
                console.log('✅ 已設定狀態: sent');
            } else if (options.length > 1) {
                await statusSelect.selectOption({ index: 1 }); // 選擇第二個選項
                console.log('✅ 已設定狀態: 第二個選項');
            }
        }
        
        await page.screenshot({ path: 'quote-flow-08-form-filled.png', fullPage: true });

        // 第七步：表單提交
        console.log('🔍 步驟 7: 提交表單');
        
        const submitButton = page.locator('button[type="submit"], .submit-btn, .btn-primary');
        const submitCount = await submitButton.count();
        console.log(`發現 ${submitCount} 個提交按鈕`);
        
        if (submitCount > 0) {
            await submitButton.first().click();
            console.log('✅ 已點擊提交按鈕');
            
            // 等待提交完成
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'quote-flow-09-after-submit.png', fullPage: true });
        }

        // 第八步：分析數據流
        console.log('🔍 步驟 8: 分析收集到的數據流');
        
        console.log('\n📊 網絡請求摘要:');
        networkRequests.forEach((req, index) => {
            console.log(`\n${index + 1}. ${req.method} ${req.url}`);
            if (req.postData) {
                console.log(`   數據: ${req.postData}`);
                
                // 特別分析提交的 JSON 數據
                try {
                    const jsonData = JSON.parse(req.postData);
                    console.log('   解析的 JSON:');
                    console.log('   - customer_id:', jsonData.customer_id);
                    console.log('   - items:', jsonData.items);
                    if (jsonData.items && Array.isArray(jsonData.items)) {
                        jsonData.items.forEach((item, idx) => {
                            console.log(`     項目 ${idx + 1}:`);
                            console.log(`     - product_id: ${item.product_id}`);
                            console.log(`     - name: ${item.name}`);
                            console.log(`     - unit_price: ${item.unit_price}`);
                            console.log(`     - quantity: ${item.quantity}`);
                        });
                    }
                } catch (e) {
                    console.log('   (非 JSON 數據)');
                }
            }
        });
        
        console.log('\n📊 網絡響應摘要:');
        networkResponses.forEach((res, index) => {
            console.log(`\n${index + 1}. ${res.status} ${res.url}`);
            console.log(`   內容: ${res.body.substring(0, 200)}...`);
            
            // 特別分析產品搜尋的響應
            if (res.url.includes('product') || res.url.includes('search')) {
                console.log('   🔍 產品搜尋響應分析:');
                try {
                    const products = JSON.parse(res.body);
                    if (Array.isArray(products) && products.length > 0) {
                        console.log(`   - 找到 ${products.length} 個產品`);
                        console.log('   - 第一個產品:', JSON.stringify(products[0], null, 4));
                    }
                } catch (e) {
                    console.log('   - 響應不是有效的 JSON');
                }
            }
        });

        // 第九步：生成測試報告
        const testReport = {
            timestamp: new Date().toISOString(),
            testSteps: [
                '1. 訪問主頁',
                '2. 用戶登入',
                '3. 導航到報價建立頁面',
                '4. 選擇客戶',
                '5. 產品搜尋測試',
                '6. 填寫表單欄位',
                '7. 提交表單',
                '8. 數據流分析'
            ],
            networkRequests: networkRequests.length,
            networkResponses: networkResponses.length,
            findings: {
                productSearchWorked: productInputFound,
                apiRequestsCount: networkRequests.length,
                apiResponsesCount: networkResponses.length
            }
        };

        console.log('\n📋 測試報告已生成:', JSON.stringify(testReport, null, 2));
        
        // 驗證關鍵數據點
        expect(networkRequests.length).toBeGreaterThan(0);
        console.log(`✅ 測試完成: 捕獲了 ${networkRequests.length} 個請求和 ${networkResponses.length} 個響應`);
    });
});