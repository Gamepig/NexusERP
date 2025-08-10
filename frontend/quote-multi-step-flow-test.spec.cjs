const { test, expect } = require('@playwright/test');

test.describe('報價單多步驟流程完整測試', () => {
    let networkRequests = [];
    let networkResponses = [];

    test('多步驟報價單建立完整數據流', async ({ page }) => {
        console.log('🧪 開始多步驟報價單建立測試');
        
        // 清空網絡監控
        networkRequests = [];
        networkResponses = [];

        // 監控網絡請求
        page.on('request', request => {
            if (request.url().includes('/quotes') || 
                request.url().includes('/products') || 
                request.url().includes('/customers') ||
                request.url().includes('/api/') ||
                request.url().includes('/search')) {
                
                const requestInfo = {
                    url: request.url(),
                    method: request.method(),
                    headers: request.headers(),
                    postData: request.postData(),
                    timestamp: new Date().toISOString()
                };
                
                networkRequests.push(requestInfo);
                console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
                
                if (request.postData()) {
                    console.log(`📤 POST DATA:`, request.postData());
                }
            }
        });

        // 監控網絡響應
        page.on('response', async response => {
            if (response.url().includes('/quotes') || 
                response.url().includes('/products') || 
                response.url().includes('/customers') ||
                response.url().includes('/api/') ||
                response.url().includes('/search')) {
                
                let responseText = '';
                try {
                    responseText = await response.text();
                } catch (e) {
                    responseText = `Error reading response: ${e.message}`;
                }
                
                const responseInfo = {
                    url: response.url(),
                    status: response.status(),
                    headers: response.headers(),
                    body: responseText,
                    timestamp: new Date().toISOString()
                };
                
                networkResponses.push(responseInfo);
                console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
                
                // 特別分析產品搜尋響應
                if (response.url().includes('product') || response.url().includes('search')) {
                    console.log(`🔍 PRODUCT SEARCH RESPONSE:`, responseText);
                    
                    try {
                        const products = JSON.parse(responseText);
                        if (Array.isArray(products)) {
                            console.log(`✅ 找到 ${products.length} 個產品`);
                            if (products.length > 0) {
                                console.log('🔍 第一個產品:', JSON.stringify(products[0], null, 2));
                            }
                        }
                    } catch (e) {
                        console.log('⚠️ 產品響應不是有效 JSON');
                    }
                }
            }
        });

        // Step 1: 登入
        console.log('🔍 Step 1: 用戶登入');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'multi-step-01-logged-in.png', fullPage: true });

        // Step 2: 前往多步驟表單
        console.log('🔍 Step 2: 前往多步驟報價建立頁面');
        await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'multi-step-02-initial-form.png', fullPage: true });

        // Step 3: 填寫客戶資訊（步驟1）
        console.log('🔍 Step 3: 填寫客戶資訊');
        
        // 選擇客戶
        const customerDropdown = page.locator('select[name="customer_id"]');
        if (await customerDropdown.count() > 0) {
            // 取得所有客戶選項
            const options = await customerDropdown.locator('option').allTextContents();
            console.log('可用客戶:', options);
            
            // 選擇 Vic Huang 或第二個選項（非預設）
            const vicOption = options.find(opt => opt.includes('Vic Huang'));
            if (vicOption) {
                await customerDropdown.selectOption({ label: vicOption });
                console.log('✅ 已選擇客戶: Vic Huang');
            } else if (options.length > 1) {
                await customerDropdown.selectOption({ index: 1 });
                console.log('✅ 已選擇第二個客戶選項');
            }
        }
        
        // 設定非預設日期
        const quoteDateInput = page.locator('input[name="quote_date"]');
        if (await quoteDateInput.count() > 0) {
            await quoteDateInput.fill('2025-08-10');
            console.log('✅ 設定報價日期: 2025-08-10');
        }
        
        const validUntilInput = page.locator('input[name="valid_until"]');
        if (await validUntilInput.count() > 0) {
            await validUntilInput.fill('2025-09-10');
            console.log('✅ 設定有效期限: 2025-09-10');
        }
        
        // 設定聯絡人
        const contactInput = page.locator('input[name="contact_person"]');
        if (await contactInput.count() > 0) {
            await contactInput.fill('張經理');
            console.log('✅ 設定聯絡人: 張經理');
        }
        
        // 設定狀態為非預設值
        const statusSelect = page.locator('select[name="status"]');
        if (await statusSelect.count() > 0) {
            const statusOptions = await statusSelect.locator('option').allTextContents();
            console.log('可用狀態:', statusOptions);
            
            // 選擇 'sent' 或第二個選項
            if (statusOptions.includes('已發送')) {
                await statusSelect.selectOption({ label: '已發送' });
                console.log('✅ 設定狀態: 已發送');
            } else if (statusOptions.length > 1) {
                await statusSelect.selectOption({ index: 1 });
                console.log('✅ 設定狀態: 第二個選項');
            }
        }
        
        // 設定幣別為非預設值
        const currencySelect = page.locator('select[name="currency"]');
        if (await currencySelect.count() > 0) {
            const currencyOptions = await currencySelect.locator('option').allTextContents();
            console.log('可用幣別:', currencyOptions);
            
            if (currencyOptions.includes('美元 (USD)')) {
                await currencySelect.selectOption({ label: '美元 (USD)' });
                console.log('✅ 設定幣別: 美元');
            } else if (currencyOptions.length > 1) {
                await currencySelect.selectOption({ index: 1 });
                console.log('✅ 設定幣別: 非預設選項');
            }
        }
        
        await page.screenshot({ path: 'multi-step-03-step1-filled.png', fullPage: true });

        // Step 4: 前往步驟2（產品選擇）
        console.log('🔍 Step 4: 前往產品選擇步驟');
        const nextButton = page.locator('button:has-text("下一步"), .btn-next, button[type="button"]:has-text("下一步")');
        if (await nextButton.count() > 0) {
            await nextButton.click();
            await page.waitForTimeout(2000); // 等待步驟切換
            await page.screenshot({ path: 'multi-step-04-step2-products.png', fullPage: true });
        } else {
            console.log('⚠️ 未找到下一步按鈕');
        }

        // Step 5: 產品搜尋測試
        console.log('🔍 Step 5: 測試產品搜尋功能');
        
        // 嘗試找到產品搜尋輸入框
        await page.waitForTimeout(1000); // 確保頁面完全載入
        
        const productInput = page.locator('input[name*="name"], input[placeholder*="產品"], input[placeholder*="搜尋"]');
        const productInputCount = await productInput.count();
        
        console.log(`發現 ${productInputCount} 個產品輸入框`);
        
        if (productInputCount > 0) {
            console.log('✅ 找到產品搜尋輸入框');
            
            // 輸入搜尋關鍵字
            await productInput.first().fill('測試');
            console.log('✅ 已輸入搜尋關鍵字: 測試');
            
            // 等待搜尋API回應
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'multi-step-05-product-search.png', fullPage: true });
            
            // 尋找搜尋結果
            const searchResults = page.locator('.dropdown-menu li, .search-results li, ul li, .autocomplete-item');
            const resultCount = await searchResults.count();
            
            console.log(`找到 ${resultCount} 個搜尋結果`);
            
            if (resultCount > 0) {
                console.log('✅ 發現產品搜尋結果');
                
                // 點擊第一個結果
                const firstResult = searchResults.first();
                if (await firstResult.isVisible()) {
                    await firstResult.click();
                    console.log('✅ 已選擇第一個產品');
                    await page.waitForTimeout(1000);
                    await page.screenshot({ path: 'multi-step-06-product-selected.png', fullPage: true });
                }
            } else {
                console.log('⚠️ 未找到產品搜尋結果');
                
                // 手動設定產品資訊用於測試
                const nameInput = page.locator('input[name*="name"]').first();
                const priceInput = page.locator('input[name*="price"]').first();
                const quantityInput = page.locator('input[name*="quantity"]').first();
                
                if (await nameInput.count() > 0) {
                    await nameInput.fill('測試產品A');
                    console.log('✅ 手動設定產品名稱');
                }
                
                if (await priceInput.count() > 0) {
                    await priceInput.fill('1500');
                    console.log('✅ 手動設定產品價格');
                }
                
                if (await quantityInput.count() > 0) {
                    await quantityInput.fill('2');
                    console.log('✅ 手動設定產品數量');
                }
            }
        } else {
            console.log('⚠️ 未找到產品搜尋輸入框');
        }

        // Step 6: 前往確認提交步驟
        console.log('🔍 Step 6: 前往確認提交');
        const nextButton2 = page.locator('button:has-text("下一步"), .btn-next');
        if (await nextButton2.count() > 0) {
            await nextButton2.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'multi-step-07-step3-confirm.png', fullPage: true });
        }

        // Step 7: 最終提交
        console.log('🔍 Step 7: 提交報價單');
        const submitButton = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("建立報價單")');
        if (await submitButton.count() > 0) {
            await submitButton.click();
            console.log('✅ 已點擊提交按鈕');
            
            // 等待提交處理
            await page.waitForTimeout(5000);
            await page.screenshot({ path: 'multi-step-08-after-submit.png', fullPage: true });
        }

        // Step 8: 數據流分析
        console.log('📊 數據流分析結果:');
        console.log(`總請求數: ${networkRequests.length}`);
        console.log(`總響應數: ${networkResponses.length}`);
        
        console.log('\n🔍 詳細請求分析:');
        networkRequests.forEach((req, index) => {
            console.log(`\n${index + 1}. ${req.method} ${req.url}`);
            console.log(`   時間: ${req.timestamp}`);
            
            if (req.postData) {
                console.log(`   POST 數據: ${req.postData}`);
                
                // 解析 JSON 數據
                try {
                    const jsonData = JSON.parse(req.postData);
                    console.log(`   解析後的數據:`);
                    
                    if (jsonData.customer_id) {
                        console.log(`     - 客戶ID: ${jsonData.customer_id}`);
                    }
                    
                    if (jsonData.items && Array.isArray(jsonData.items)) {
                        console.log(`     - 產品項目數: ${jsonData.items.length}`);
                        jsonData.items.forEach((item, idx) => {
                            console.log(`       項目 ${idx + 1}:`);
                            console.log(`         - product_id: ${item.product_id || '缺失'}`);
                            console.log(`         - name: ${item.name || '缺失'}`);
                            console.log(`         - unit_price: ${item.unit_price || '缺失'}`);
                            console.log(`         - quantity: ${item.quantity || '缺失'}`);
                            
                            // 檢查關鍵欄位是否遺失
                            if (!item.product_id) {
                                console.log(`         ⚠️ product_id 遺失`);
                            }
                            if (!item.name) {
                                console.log(`         ⚠️ name 遺失`);
                            }
                        });
                    }
                    
                    if (jsonData.quote_date) {
                        console.log(`     - 報價日期: ${jsonData.quote_date}`);
                    }
                    
                    if (jsonData.currency) {
                        console.log(`     - 幣別: ${jsonData.currency}`);
                    }
                    
                } catch (e) {
                    console.log(`   (非JSON數據或解析失敗)`);
                }
            }
        });
        
        console.log('\n🔍 詳細響應分析:');
        networkResponses.forEach((res, index) => {
            console.log(`\n${index + 1}. ${res.status} ${res.url}`);
            console.log(`   時間: ${res.timestamp}`);
            console.log(`   內容長度: ${res.body.length} 字符`);
            
            if (res.url.includes('product') || res.url.includes('search')) {
                console.log(`   🔍 產品搜尋響應詳情:`);
                try {
                    const data = JSON.parse(res.body);
                    if (Array.isArray(data)) {
                        console.log(`     - 產品數量: ${data.length}`);
                        if (data.length > 0) {
                            const sample = data[0];
                            console.log(`     - 樣本產品結構:`);
                            console.log(`       - id: ${sample.id || '無'}`);
                            console.log(`       - name: ${sample.name || '無'}`);
                            console.log(`       - unit_price: ${sample.unit_price || '無'}`);
                            console.log(`       - 完整結構: ${JSON.stringify(sample, null, 6)}`);
                        }
                    }
                } catch (e) {
                    console.log(`     - 不是有效的JSON: ${res.body.substring(0, 100)}`);
                }
            }
        });

        // 生成問題診斷報告
        console.log('\n🩺 問題診斷:');
        
        const productSearchResponses = networkResponses.filter(res => 
            res.url.includes('product') || res.url.includes('search')
        );
        
        const quoteSubmissionRequests = networkRequests.filter(req => 
            req.url.includes('/quotes') && req.method === 'POST'
        );
        
        console.log(`- 產品搜尋API調用: ${productSearchResponses.length} 次`);
        console.log(`- 報價單提交請求: ${quoteSubmissionRequests.length} 次`);
        
        if (quoteSubmissionRequests.length > 0) {
            const lastSubmission = quoteSubmissionRequests[quoteSubmissionRequests.length - 1];
            console.log(`- 最後提交的數據: ${lastSubmission.postData}`);
            
            // 檢查關鍵問題
            try {
                const submittedData = JSON.parse(lastSubmission.postData);
                if (submittedData.items && submittedData.items.length > 0) {
                    const firstItem = submittedData.items[0];
                    
                    if (!firstItem.product_id) {
                        console.log(`❌ 關鍵問題: product_id 欄位遺失`);
                    }
                    
                    if (!firstItem.name) {
                        console.log(`❌ 關鍵問題: name 欄位遺失`);
                    }
                    
                    if (!firstItem.unit_price) {
                        console.log(`❌ 關鍵問題: unit_price 欄位遺失`);
                    }
                } else {
                    console.log(`❌ 關鍵問題: 沒有產品項目被提交`);
                }
            } catch (e) {
                console.log(`❌ 無法解析提交數據`);
            }
        }

        // 驗證測試完成
        expect(networkRequests.length).toBeGreaterThan(0);
        console.log(`\n✅ 測試完成 - 收集了 ${networkRequests.length} 個請求和 ${networkResponses.length} 個響應`);
    });
});