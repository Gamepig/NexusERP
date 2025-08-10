const { test, expect } = require('@playwright/test');

test.describe('報價單數據流監控測試', () => {
    let networkRequests = [];
    let networkResponses = [];
    let productSearchData = [];

    test('報價單數據流完整監控 - 基礎版', async ({ page }) => {
        console.log('🧪 開始報價單數據流監控測試');
        
        // 初始化監控數組
        networkRequests = [];
        networkResponses = [];
        productSearchData = [];

        // 全面的網絡請求監控
        page.on('request', request => {
            const url = request.url();
            const isRelevant = url.includes('/quotes') || 
                             url.includes('/products') || 
                             url.includes('/customers') ||
                             url.includes('/api/') ||
                             url.includes('/search') ||
                             url.includes('search-products');
                             
            if (isRelevant) {
                const requestInfo = {
                    url,
                    method: request.method(),
                    headers: request.headers(),
                    postData: request.postData(),
                    timestamp: new Date().toISOString(),
                    type: 'request'
                };
                
                networkRequests.push(requestInfo);
                console.log(`📤 [REQUEST] ${request.method()} ${url}`);
                
                if (request.postData()) {
                    console.log(`📤 [REQUEST DATA] ${request.postData().substring(0, 200)}...`);
                }
            }
        });

        // 網絡響應監控
        page.on('response', async response => {
            const url = response.url();
            const isRelevant = url.includes('/quotes') || 
                             url.includes('/products') || 
                             url.includes('/customers') ||
                             url.includes('/api/') ||
                             url.includes('/search') ||
                             url.includes('search-products');
                             
            if (isRelevant) {
                let responseText = '';
                try {
                    responseText = await response.text();
                } catch (e) {
                    responseText = `Cannot read response: ${e.message}`;
                }
                
                const responseInfo = {
                    url,
                    status: response.status(),
                    statusText: response.statusText(),
                    headers: response.headers(),
                    body: responseText,
                    timestamp: new Date().toISOString(),
                    type: 'response'
                };
                
                networkResponses.push(responseInfo);
                console.log(`📥 [RESPONSE] ${response.status()} ${url}`);
                
                // 特別處理產品搜尋響應
                if (url.includes('product') || url.includes('search')) {
                    console.log(`🔍 [PRODUCT SEARCH] ${url}`);
                    console.log(`🔍 [SEARCH RESPONSE] ${responseText.substring(0, 300)}...`);
                    
                    try {
                        const data = JSON.parse(responseText);
                        if (Array.isArray(data)) {
                            productSearchData.push({
                                url,
                                productCount: data.length,
                                products: data,
                                timestamp: new Date().toISOString()
                            });
                            
                            console.log(`✅ [PARSED] ${data.length} products found`);
                            if (data.length > 0) {
                                const sample = data[0];
                                console.log(`🔬 [SAMPLE] Product structure:`, JSON.stringify(sample, null, 2));
                            }
                        }
                    } catch (e) {
                        console.log(`⚠️ [PARSE ERROR] Cannot parse product response: ${e.message}`);
                    }
                }
            }
        });

        // Step 1: 登入系統
        console.log('🔍 [STEP 1] 登入系統');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'data-flow-01-login.png', fullPage: true });

        // Step 2: 直接訪問多步驟表單
        console.log('🔍 [STEP 2] 前往報價建立頁面');
        await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'data-flow-02-form-loaded.png', fullPage: true });

        // Step 3: 簡化表單填寫 - 僅使用索引選擇
        console.log('🔍 [STEP 3] 簡化表單填寫');
        
        try {
            // 選擇客戶（使用索引避免文字問題）
            const customerSelect = page.locator('select[name="customer_id"]');
            if (await customerSelect.count() > 0) {
                await customerSelect.selectOption({ index: 1 }); // 第二個選項
                console.log('✅ 客戶已選擇（索引1）');
            }

            // 設定日期
            const quoteDateInput = page.locator('input[name="quote_date"]');
            if (await quoteDateInput.count() > 0) {
                await quoteDateInput.fill('2025-08-10');
                console.log('✅ 報價日期已設定');
            }

            // 填寫聯絡人
            const contactInput = page.locator('input[name="contact_person"]');
            if (await contactInput.count() > 0) {
                await contactInput.fill('測試聯絡人');
                console.log('✅ 聯絡人已設定');
            }

            await page.screenshot({ path: 'data-flow-03-form-basic-filled.png', fullPage: true });
        } catch (e) {
            console.log(`⚠️ 表單填寫問題: ${e.message}`);
        }

        // Step 4: 嘗試觸發產品搜尋
        console.log('🔍 [STEP 4] 嘗試觸發產品搜尋');
        
        try {
            // 點擊下一步或尋找產品輸入框
            const nextButton = page.locator('button:has-text("下一步"), .btn-next');
            if (await nextButton.count() > 0) {
                await nextButton.click();
                await page.waitForTimeout(2000);
                console.log('✅ 已點擊下一步');
                await page.screenshot({ path: 'data-flow-04-next-step.png', fullPage: true });
            }

            // 尋找並測試產品搜尋功能
            await page.waitForTimeout(1000);
            
            // 更廣泛的產品輸入框搜尋
            const possibleSelectors = [
                'input[name*="name"]',
                'input[placeholder*="產品"]',
                'input[placeholder*="搜尋"]',
                'input[x-model*="name"]',
                '.product-search input',
                'input[type="text"]'
            ];

            let productInputFound = false;
            
            for (const selector of possibleSelectors) {
                const inputs = page.locator(selector);
                const count = await inputs.count();
                
                if (count > 0) {
                    console.log(`發現 ${count} 個可能的產品輸入框: ${selector}`);
                    
                    for (let i = 0; i < count; i++) {
                        try {
                            const input = inputs.nth(i);
                            const placeholder = await input.getAttribute('placeholder');
                            const name = await input.getAttribute('name');
                            
                            console.log(`測試輸入框 ${i}: name="${name}", placeholder="${placeholder}"`);
                            
                            // 嘗試在這個輸入框中搜尋
                            await input.fill('測試');
                            console.log(`✅ 成功在輸入框中輸入搜尋關鍵字`);
                            
                            // 等待可能的API回應
                            await page.waitForTimeout(3000);
                            
                            productInputFound = true;
                            break;
                        } catch (e) {
                            console.log(`⚠️ 輸入框 ${i} 測試失敗: ${e.message}`);
                            continue;
                        }
                    }
                    
                    if (productInputFound) break;
                }
            }

            await page.screenshot({ path: 'data-flow-05-product-search-attempt.png', fullPage: true });

            if (!productInputFound) {
                console.log('⚠️ 未能成功觸發產品搜尋，但繼續監控');
            }

        } catch (e) {
            console.log(`⚠️ 產品搜尋階段錯誤: ${e.message}`);
        }

        // Step 5: 嘗試提交測試（如果可能）
        console.log('🔍 [STEP 5] 嘗試觸發提交流程');
        
        try {
            // 尋找提交相關按鈕
            const submitSelectors = [
                'button[type="submit"]',
                'button:has-text("提交")',
                'button:has-text("建立")',
                'button:has-text("送出")',
                '.btn-primary',
                '.submit-btn'
            ];

            for (const selector of submitSelectors) {
                const buttons = page.locator(selector);
                const count = await buttons.count();
                
                if (count > 0) {
                    console.log(`發現 ${count} 個可能的提交按鈕: ${selector}`);
                    
                    try {
                        await buttons.first().click();
                        console.log('✅ 已點擊提交按鈕');
                        await page.waitForTimeout(3000);
                        break;
                    } catch (e) {
                        console.log(`⚠️ 提交按鈕點擊失敗: ${e.message}`);
                    }
                }
            }

            await page.screenshot({ path: 'data-flow-06-after-submit-attempt.png', fullPage: true });

        } catch (e) {
            console.log(`⚠️ 提交階段錯誤: ${e.message}`);
        }

        // Step 6: 等待所有網絡活動完成
        console.log('🔍 [STEP 6] 等待網絡活動完成');
        await page.waitForTimeout(5000);

        // Step 7: 詳細數據分析
        console.log('\n📊 ========== 完整數據流分析報告 ==========');
        
        console.log(`\n📈 統計摘要:`);
        console.log(`- 總HTTP請求數: ${networkRequests.length}`);
        console.log(`- 總HTTP響應數: ${networkResponses.length}`);
        console.log(`- 產品搜尋響應數: ${productSearchData.length}`);

        console.log(`\n📤 所有HTTP請求詳情:`);
        networkRequests.forEach((req, index) => {
            console.log(`\n${index + 1}. [${req.timestamp}] ${req.method} ${req.url}`);
            
            if (req.postData) {
                console.log(`   📝 POST Data: ${req.postData.substring(0, 300)}...`);
                
                // 嘗試解析JSON
                try {
                    const parsed = JSON.parse(req.postData);
                    console.log(`   🔍 解析後的數據結構:`);
                    
                    // 檢查關鍵欄位
                    if (parsed.customer_id) console.log(`     ✓ customer_id: ${parsed.customer_id}`);
                    if (parsed.quote_date) console.log(`     ✓ quote_date: ${parsed.quote_date}`);
                    if (parsed.currency) console.log(`     ✓ currency: ${parsed.currency}`);
                    if (parsed.status) console.log(`     ✓ status: ${parsed.status}`);
                    
                    if (parsed.items) {
                        console.log(`     ✓ items: ${Array.isArray(parsed.items) ? parsed.items.length : 'not array'} 項目`);
                        
                        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
                            parsed.items.forEach((item, idx) => {
                                console.log(`       項目 ${idx + 1}:`);
                                console.log(`         - product_id: ${item.product_id || '❌ 缺失'}`);
                                console.log(`         - name: ${item.name || '❌ 缺失'}`);
                                console.log(`         - unit_price: ${item.unit_price || '❌ 缺失'}`);
                                console.log(`         - quantity: ${item.quantity || '❌ 缺失'}`);
                                
                                // 標記問題
                                if (!item.product_id) console.log(`         🚨 ISSUE: product_id missing`);
                                if (!item.name) console.log(`         🚨 ISSUE: name missing`);
                            });
                        }
                    }
                } catch (e) {
                    console.log(`   ⚠️ 無法解析為JSON: ${e.message}`);
                }
            }
        });

        console.log(`\n📥 所有HTTP響應詳情:`);
        networkResponses.forEach((res, index) => {
            console.log(`\n${index + 1}. [${res.timestamp}] ${res.status} ${res.url}`);
            console.log(`   📏 內容長度: ${res.body.length} 字符`);
            
            if (res.body.length < 1000) {
                console.log(`   📄 完整內容: ${res.body}`);
            } else {
                console.log(`   📄 內容預覽: ${res.body.substring(0, 200)}...`);
            }
        });

        console.log(`\n🔍 產品搜尋專項分析:`);
        if (productSearchData.length > 0) {
            productSearchData.forEach((search, index) => {
                console.log(`\n搜尋 ${index + 1}: ${search.url}`);
                console.log(`時間: ${search.timestamp}`);
                console.log(`找到產品數: ${search.productCount}`);
                
                if (search.products.length > 0) {
                    console.log(`產品樣本:`);
                    const sample = search.products[0];
                    console.log(`  - ID: ${sample.id || '無'}`);
                    console.log(`  - Name: ${sample.name || '無'}`);  
                    console.log(`  - Unit Price: ${sample.unit_price || '無'}`);
                    console.log(`  - 完整結構:`, JSON.stringify(sample, null, 4));
                }
            });
        } else {
            console.log('❌ 沒有捕獲到產品搜尋活動');
        }

        // 問題診斷
        console.log(`\n🩺 問題診斷報告:`);
        
        const quoteSubmissions = networkRequests.filter(req => 
            req.url.includes('/quotes') && req.method === 'POST' && req.postData
        );
        
        console.log(`📋 發現 ${quoteSubmissions.length} 個報價單提交請求`);
        
        if (quoteSubmissions.length > 0) {
            const lastSubmission = quoteSubmissions[quoteSubmissions.length - 1];
            console.log(`\n🔍 最後一次提交分析:`);
            console.log(`URL: ${lastSubmission.url}`);
            console.log(`數據: ${lastSubmission.postData}`);
            
            try {
                const data = JSON.parse(lastSubmission.postData);
                
                // 檢查數據完整性
                const issues = [];
                
                if (!data.customer_id) issues.push('customer_id missing');
                if (!data.items || !Array.isArray(data.items)) issues.push('items not array');
                if (data.items && data.items.length === 0) issues.push('no items in submission');
                
                if (data.items && data.items.length > 0) {
                    data.items.forEach((item, idx) => {
                        if (!item.product_id) issues.push(`item ${idx + 1}: product_id missing`);
                        if (!item.name) issues.push(`item ${idx + 1}: name missing`);
                        if (!item.unit_price) issues.push(`item ${idx + 1}: unit_price missing`);
                    });
                }
                
                if (issues.length > 0) {
                    console.log(`\n🚨 發現的問題:`);
                    issues.forEach(issue => console.log(`  - ${issue}`));
                } else {
                    console.log(`\n✅ 數據結構看起來正常`);
                }
                
            } catch (e) {
                console.log(`❌ 無法解析提交數據: ${e.message}`);
            }
        }

        const productSearchResponses = networkResponses.filter(res => 
            res.url.includes('product') || res.url.includes('search')
        );
        
        console.log(`\n📊 產品搜尋API統計:`);
        console.log(`- 產品搜尋響應數: ${productSearchResponses.length}`);
        
        if (productSearchResponses.length === 0) {
            console.log(`❌ 關鍵問題: 沒有捕獲到任何產品搜尋API調用`);
            console.log(`   可能原因:`);
            console.log(`   1. 產品搜尋功能未觸發`);
            console.log(`   2. API端點與預期不同`);
            console.log(`   3. 搜尋功能存在前端JavaScript錯誤`);
        }

        // 最終驗證
        console.log(`\n✅ 測試完成`);
        console.log(`📊 數據收集摘要: ${networkRequests.length} 請求, ${networkResponses.length} 響應`);
        
        // 至少應該有一些網絡活動
        expect(networkRequests.length).toBeGreaterThan(0);
    });
});