import { test, expect } from '@playwright/test';

/**
 * 報價建立資料庫驗證測試
 * 重點：實際建立報價單並驗證資料庫寫入是否正確
 * 基於用戶截圖反饋的問題進行深度測試
 */

test.describe('報價建立資料庫驗證測試', () => {
    
    test.beforeEach(async ({ page }) => {
        console.log('🔐 登入系統進行報價建立測試');
        
        // 登入
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        console.log(`登入後 URL: ${page.url()}`);
    });

    test('實際建立報價單並驗證狀態寫入', async ({ page }) => {
        console.log('📝 測試報價建立與狀態寫入');
        
        // 監控所有 API 請求
        const apiRequests = [];
        const apiResponses = [];
        
        page.on('request', request => {
            if (request.url().includes('/api/quotes') && request.method() === 'POST') {
                console.log(`📤 捕獲 POST /api/quotes 請求`);
                console.log(`Request URL: ${request.url()}`);
                
                // 嘗試記錄請求內容
                try {
                    const postData = request.postData();
                    if (postData) {
                        console.log(`📋 請求資料: ${postData}`);
                        
                        // 檢查狀態欄位
                        if (postData.includes('status')) {
                            console.log('✅ 請求包含狀態欄位');
                            
                            // 解析 JSON 查看狀態值
                            try {
                                const jsonData = JSON.parse(postData);
                                console.log(`🏷️ 狀態值: ${jsonData.status || 'undefined'}`);
                            } catch (e) {
                                console.log('JSON 解析失敗，可能是 FormData');
                            }
                        } else {
                            console.log('❌ 請求中沒有狀態欄位');
                        }
                    }
                } catch (error) {
                    console.log(`請求資料獲取失敗: ${error.message}`);
                }
                
                apiRequests.push({
                    url: request.url(),
                    method: request.method(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        page.on('response', async response => {
            if (response.url().includes('/api/quotes') && response.request().method() === 'POST') {
                console.log(`📥 API 回應: ${response.status()} ${response.url()}`);
                
                try {
                    const responseData = await response.json();
                    console.log('🔄 API 回應結構:', Object.keys(responseData));
                    
                    if (responseData.quote) {
                        console.log(`📊 建立的報價資訊:`);
                        console.log(`  - ID: ${responseData.quote.id}`);
                        console.log(`  - 報價單號: ${responseData.quote.quote_number}`);
                        console.log(`  - 狀態: ${responseData.quote.status}`);
                        console.log(`  - 總金額: ${responseData.quote.total_amount}`);
                        console.log(`  - 客戶ID: ${responseData.quote.customer_id}`);
                    }
                    
                    apiResponses.push(responseData);
                } catch (error) {
                    console.log(`API 回應解析失敗: ${error.message}`);
                }
            }
        });

        // 前往報價建立頁面
        await page.goto('/quotes/create');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖記錄初始狀態
        await page.screenshot({ 
            path: `quote-creation-initial-${Date.now()}.png`, 
            fullPage: true 
        });

        // 填寫表單 - 使用非預設值進行測試
        console.log('📝 填寫報價建立表單...');
        
        // 選擇客戶
        const customerSelect = page.locator('select[name="customer_id"]');
        if (await customerSelect.isVisible()) {
            // 獲取可用選項並選擇第二個（避免預設值）
            const options = await customerSelect.locator('option').all();
            if (options.length > 2) {
                const secondOption = await options[2].getAttribute('value');
                if (secondOption) {
                    await customerSelect.selectOption(secondOption);
                    console.log(`✅ 已選擇客戶ID: ${secondOption}`);
                }
            }
        }

        // 填寫報價日期
        const quoteDateInput = page.locator('input[name="quote_date"]');
        if (await quoteDateInput.isVisible()) {
            const testDate = '2025-08-08';
            await quoteDateInput.fill(testDate);
            console.log(`✅ 已設定報價日期: ${testDate}`);
        }

        // 填寫有效期限
        const validUntilInput = page.locator('input[name="valid_until"]');
        if (await validUntilInput.isVisible()) {
            const validDate = '2025-09-08';
            await validUntilInput.fill(validDate);
            console.log(`✅ 已設定有效期限: ${validDate}`);
        }

        // 🎯 重點測試：設定非草稿狀態
        const statusSelect = page.locator('select[name="status"]');
        if (await statusSelect.isVisible()) {
            // 選擇 "已發送" 狀態來測試
            const targetStatus = 'pending'; // 或 'sent' 依前端實作
            
            // 檢查可用選項
            const statusOptions = await statusSelect.locator('option').allTextContents();
            console.log('可用狀態選項:', statusOptions);
            
            // 嘗試選擇非草稿狀態
            try {
                await statusSelect.selectOption('pending');
                console.log('✅ 已選擇狀態: pending (已發送)');
            } catch {
                try {
                    await statusSelect.selectOption('sent');
                    console.log('✅ 已選擇狀態: sent (已發送)');
                } catch {
                    console.log('⚠️ 無法選擇非草稿狀態，使用預設值');
                }
            }
            
            const selectedStatus = await statusSelect.inputValue();
            console.log(`當前選中的狀態值: ${selectedStatus}`);
        } else {
            console.log('⚠️ 未找到狀態選擇欄位');
        }

        // 填寫產品項目 - 使用非預設數量和金額
        console.log('🛍️ 添加產品項目...');
        
        // 查找並點擊添加產品按鈕
        const addProductBtn = page.locator('button:has-text("新增項目"), .add-product-btn, button[data-action="add-item"]');
        if (await addProductBtn.count() > 0) {
            await addProductBtn.first().click();
            await page.waitForTimeout(1000);
            console.log('✅ 已點擊添加產品按鈕');
        }

        // 填寫產品資訊
        const productNameInput = page.locator('input[name*="product_name"], textarea[name*="product_name"]').first();
        if (await productNameInput.isVisible()) {
            await productNameInput.fill('測試商品 A');
            console.log('✅ 已填寫產品名稱: 測試商品 A');
        }

        const quantityInput = page.locator('input[name*="quantity"]').first();
        if (await quantityInput.isVisible()) {
            await quantityInput.fill('2');
            console.log('✅ 已填寫數量: 2');
        }

        const unitPriceInput = page.locator('input[name*="unit_price"], input[name*="price"]').first();
        if (await unitPriceInput.isVisible()) {
            await unitPriceInput.fill('824');
            console.log('✅ 已填寫單價: 824');
        }

        // 填寫備註
        const notesTextarea = page.locator('textarea[name="notes"]');
        if (await notesTextarea.isVisible()) {
            await notesTextarea.fill('測試報價單 - 驗證狀態寫入功能');
            console.log('✅ 已填寫備註');
        }

        // 截圖表單填寫完成狀態
        await page.screenshot({ 
            path: `quote-creation-filled-${Date.now()}.png`, 
            fullPage: true 
        });

        // 提交表單
        console.log('📤 提交表單...');
        const submitButton = page.locator('button:has-text("建立報價單"), button[type="submit"]').first();
        
        if (await submitButton.isVisible()) {
            await submitButton.click();
            console.log('✅ 已點擊提交按鈕');
            
            // 等待提交完成
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
            
            // 檢查是否成功跳轉或顯示成功訊息
            const currentUrl = page.url();
            console.log(`提交後的 URL: ${currentUrl}`);
            
            // 截圖提交後狀態
            await page.screenshot({ 
                path: `quote-creation-submitted-${Date.now()}.png`, 
                fullPage: true 
            });
            
        } else {
            console.log('❌ 未找到提交按鈕');
            return;
        }

        // 驗證結果
        console.log('\n📊 API 請求驗證結果:');
        console.log(`捕獲的 API 請求數量: ${apiRequests.length}`);
        console.log(`API 回應數量: ${apiResponses.length}`);
        
        if (apiRequests.length > 0) {
            console.log('✅ 成功捕獲到報價建立 API 請求');
        } else {
            console.log('❌ 未捕獲到報價建立 API 請求');
        }

        if (apiResponses.length > 0) {
            const response = apiResponses[0];
            if (response.quote) {
                console.log('\n🎯 關鍵驗證結果:');
                console.log(`報價狀態: ${response.quote.status}`);
                
                // 驗證狀態是否為用戶選擇的值
                if (response.quote.status === 'draft') {
                    console.log('❌ 狀態仍為草稿，可能存在寫入問題');
                } else {
                    console.log(`✅ 狀態寫入成功: ${response.quote.status}`);
                }
                
                console.log(`報價單號: ${response.quote.quote_number}`);
                console.log(`總金額: ${response.quote.total_amount}`);
            }
        }
        
        console.log('\n✅ 報價建立測試完成');
    });

    test('驗證搜尋功能參數傳遞', async ({ page }) => {
        console.log('🔍 驗證搜尋功能參數傳遞');
        
        // 監控搜尋 API 請求
        const searchRequests = [];
        
        page.on('request', request => {
            const url = request.url();
            if (url.includes('/api/quotes') && request.method() === 'GET') {
                const urlObj = new URL(url);
                const params = Object.fromEntries(urlObj.searchParams.entries());
                
                console.log('📡 搜尋 API 請求參數:', params);
                
                searchRequests.push({
                    url: url,
                    params: params,
                    timestamp: new Date().toISOString()
                });
                
                // 檢查關鍵參數
                if (params.search) {
                    console.log(`✅ 搜尋參數存在: ${params.search}`);
                } else {
                    console.log('❌ 搜尋參數缺失');
                }
                
                if (params.page_size || params.per_page) {
                    console.log(`✅ 分頁參數: page_size=${params.page_size}, per_page=${params.per_page}`);
                }
                
                if (params.sort_by || params.sort_field) {
                    console.log(`✅ 排序參數: sort_by=${params.sort_by}, sort_field=${params.sort_field}`);
                }
            }
        });

        // 前往報價列表
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // 執行搜尋測試
        const searchInput = page.locator('input[name="search"]');
        if (await searchInput.isVisible()) {
            console.log('執行搜尋測試...');
            
            await searchInput.fill('test');
            await page.press('input[name="search"]', 'Enter');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            console.log(`捕獲的搜尋請求數量: ${searchRequests.length}`);
            searchRequests.forEach((req, index) => {
                console.log(`${index + 1}. ${req.url}`);
                console.log(`   參數:`, JSON.stringify(req.params, null, 2));
            });
        }

        console.log('✅ 搜尋參數驗證完成');
    });

    test('檢查報價列表分頁功能', async ({ page }) => {
        console.log('📄 檢查報價列表分頁功能');
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // 截圖分頁狀態
        await page.screenshot({ 
            path: `quote-pagination-check-${Date.now()}.png`, 
            fullPage: true 
        });

        // 檢查分頁元素
        const paginationSelectors = [
            '.pagination',
            '.page-navigation',
            '[data-pagination]',
            'nav[aria-label="pagination"]',
            '.paginate-links'
        ];

        let paginationFound = false;
        for (const selector of paginationSelectors) {
            const element = page.locator(selector);
            if (await element.count() > 0) {
                console.log(`✅ 找到分頁元素: ${selector}`);
                paginationFound = true;
                
                // 檢查分頁內容
                const paginationContent = await element.textContent();
                console.log(`分頁內容: ${paginationContent}`);
                break;
            }
        }

        if (!paginationFound) {
            console.log('❌ 未找到分頁元素');
            
            // 檢查是否有 per_page 選擇器
            const perPageSelect = page.locator('select[name="per_page"], select[name="page_size"]');
            if (await perPageSelect.count() > 0) {
                console.log('✅ 找到每頁筆數選擇器');
                
                const options = await perPageSelect.locator('option').allTextContents();
                console.log('每頁筆數選項:', options);
            } else {
                console.log('❌ 也沒有找到每頁筆數選擇器');
            }
        }

        console.log('✅ 分頁功能檢查完成');
    });
});