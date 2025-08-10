import { test, expect } from '@playwright/test';

/**
 * 報價建立問題專項調試
 * 重點：找出為什麼提交不成功的具體原因
 */

test.describe('報價建立專項調試', () => {
    
    test.beforeEach(async ({ page }) => {
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

    test('詳細調試報價建立流程', async ({ page }) => {
        console.log('🔧 開始詳細調試報價建立流程');
        
        // 監控所有控制台輸出
        page.on('console', msg => {
            console.log(`Browser Console [${msg.type()}]: ${msg.text()}`);
        });
        
        // 監控所有 API 請求
        const allRequests = [];
        page.on('request', request => {
            allRequests.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                timestamp: new Date().toISOString()
            });
            
            if (request.url().includes('/api/quotes') && request.method() === 'POST') {
                console.log(`🎯 捕獲報價建立請求: ${request.url()}`);
                
                try {
                    const postData = request.postData();
                    if (postData) {
                        console.log(`📋 請求內容: ${postData}`);
                        
                        // 解析狀態欄位
                        try {
                            const jsonData = JSON.parse(postData);
                            console.log(`🏷️ 解析出的狀態: ${jsonData.status}`);
                            console.log(`📊 完整請求數據:`, JSON.stringify(jsonData, null, 2));
                        } catch (e) {
                            console.log('⚠️ 請求不是 JSON 格式');
                        }
                    }
                } catch (error) {
                    console.log(`❌ 無法獲取請求內容: ${error.message}`);
                }
            }
        });

        // 前往建立頁面
        await page.goto('/quotes/create');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        console.log('📝 開始填寫表單');

        // 1. 客戶選擇 - 詳細調試
        const customerSelect = page.locator('select[name="customer_id"]');
        if (await customerSelect.isVisible()) {
            const options = await customerSelect.locator('option').all();
            console.log(`客戶選項數量: ${options.length}`);
            
            if (options.length > 1) {
                // 選擇第二個選項（跳過空白選項）
                const selectedValue = await options[1].getAttribute('value');
                await customerSelect.selectOption(selectedValue);
                console.log(`✅ 已選擇客戶: ${selectedValue}`);
            }
        }

        // 2. 日期設定
        await page.fill('input[name="quote_date"]', '2025-08-08');
        await page.fill('input[name="valid_until"]', '2025-09-08');
        console.log('✅ 已填寫日期');

        // 3. 狀態選擇 - 關鍵測試點
        const statusSelect = page.locator('select[name="status"]');
        if (await statusSelect.isVisible()) {
            const statusOptions = await statusSelect.locator('option').allTextContents();
            console.log('所有狀態選項:', statusOptions);
            
            // 選擇 "已發送" 狀態
            await statusSelect.selectOption('pending');
            const selectedStatus = await statusSelect.inputValue();
            console.log(`✅ 已選擇狀態: ${selectedStatus}`);
        }

        // 4. 產品項目 - 填寫現有的第一項
        const productNameInput = page.locator('input[name="items[0][name]"]').first();
        if (await productNameInput.isVisible()) {
            await productNameInput.fill('測試商品 A');
            console.log('✅ 已填寫產品名稱');
        }

        const quantityInput = page.locator('input[name="items[0][quantity]"]').first();
        if (await quantityInput.isVisible()) {
            await quantityInput.fill('2');
            console.log('✅ 已填寫數量: 2');
        }

        const priceInput = page.locator('input[name="items[0][unit_price]"]').first();
        if (await priceInput.isVisible()) {
            await priceInput.fill('824');
            console.log('✅ 已填寫單價: 824');
        }

        // 5. 填寫備註
        await page.fill('textarea[name="notes"]', '測試報價單 - 調試用');
        console.log('✅ 已填寫備註');

        // 截圖表單完成狀態
        await page.screenshot({ 
            path: `quote-debug-form-filled-${Date.now()}.png`, 
            fullPage: true 
        });

        // 6. 調試提交按鈕
        console.log('🔍 尋找提交按鈕...');
        
        const submitSelectors = [
            'button[type="submit"]',
            'button:has-text("建立報價單")',
            'button:has-text("更新報價單")',
            '.bg-blue-600[type="submit"]',
            'form#quoteForm button[type="submit"]'
        ];

        let submitButton = null;
        for (const selector of submitSelectors) {
            const elements = page.locator(selector);
            const count = await elements.count();
            
            console.log(`選擇器 "${selector}": 找到 ${count} 個元素`);
            
            if (count > 0) {
                for (let i = 0; i < count; i++) {
                    const element = elements.nth(i);
                    const isVisible = await element.isVisible();
                    const text = await element.textContent();
                    console.log(`  元素 ${i}: 可見=${isVisible}, 文字="${text}"`);
                    
                    if (isVisible && !submitButton) {
                        submitButton = element;
                        console.log(`✅ 選定提交按鈕: "${selector}"`);
                    }
                }
            }
        }

        if (!submitButton) {
            console.log('❌ 未找到可見的提交按鈕');
            
            // 檢查表單元素
            const form = page.locator('form#quoteForm');
            const formExists = await form.count();
            console.log(`表單存在: ${formExists > 0}`);
            
            if (formExists > 0) {
                const formAction = await form.getAttribute('action');
                const formMethod = await form.getAttribute('method');
                console.log(`表單 action: ${formAction}`);
                console.log(`表單 method: ${formMethod}`);
            }
            
            return;
        }

        // 7. 檢查表單驗證函數
        console.log('🧪 測試表單驗證');
        
        const validationResult = await page.evaluate(() => {
            if (typeof validateForm === 'function') {
                console.log('找到 validateForm 函數');
                const result = validateForm();
                console.log('validateForm 回傳:', result);
                return result;
            } else {
                console.log('validateForm 函數不存在');
                return null;
            }
        });
        
        console.log(`表單驗證結果: ${validationResult}`);
        
        if (validationResult === false) {
            console.log('❌ 表單驗證失敗，無法提交');
            
            // 檢查具體驗證錯誤
            const formData = await page.evaluate(() => {
                const form = document.getElementById('quoteForm');
                if (!form) return null;
                
                const data = {};
                const formDataObj = new FormData(form);
                for (let [key, value] of formDataObj.entries()) {
                    data[key] = value;
                }
                return data;
            });
            
            console.log('當前表單數據:', formData);
            return;
        }

        // 8. 嘗試提交表單
        console.log('📤 嘗試提交表單...');
        
        // 點擊提交按鈕
        await submitButton.click();
        console.log('✅ 已點擊提交按鈕');

        // 等待回應
        await page.waitForTimeout(5000);
        
        // 檢查頁面變化
        const currentUrl = page.url();
        console.log(`提交後 URL: ${currentUrl}`);
        
        // 截圖最終狀態
        await page.screenshot({ 
            path: `quote-debug-after-submit-${Date.now()}.png`, 
            fullPage: true 
        });

        // 9. 檢查 API 請求結果
        console.log('\n📊 API 請求總結:');
        console.log(`總共捕獲 ${allRequests.length} 個請求`);
        
        const postRequests = allRequests.filter(req => 
            req.method === 'POST' && req.url.includes('/api/quotes')
        );
        
        console.log(`POST /api/quotes 請求數量: ${postRequests.length}`);
        
        if (postRequests.length === 0) {
            console.log('❌ 沒有捕獲到報價建立 API 請求');
            console.log('可能原因:');
            console.log('  - 表單驗證失敗');
            console.log('  - JavaScript 錯誤阻止提交');
            console.log('  - 提交按鈕點擊無效');
            console.log('  - 路由問題');
        } else {
            console.log('✅ 成功捕獲到報價建立請求');
        }

        console.log('✅ 調試完成');
    });

    test('檢查搜尋功能 API 呼叫', async ({ page }) => {
        console.log('🔍 調試搜尋功能');
        
        const searchRequests = [];
        
        page.on('request', request => {
            if (request.url().includes('/api/quotes') && request.method() === 'GET') {
                const url = new URL(request.url());
                const params = Object.fromEntries(url.searchParams.entries());
                
                searchRequests.push({
                    url: request.url(),
                    params: params
                });
                
                console.log('🔎 搜尋請求:', request.url());
                console.log('📋 參數:', JSON.stringify(params, null, 2));
            }
        });

        // 前往列表頁面
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // 檢查搜尋框是否存在
        const searchInput = page.locator('input[name="search"]');
        const searchExists = await searchInput.count();
        console.log(`搜尋框存在: ${searchExists > 0}`);
        
        if (searchExists > 0) {
            console.log('📝 執行搜尋測試');
            
            // 輸入搜尋關鍵字
            await searchInput.fill('test');
            
            // 觸發搜尋 - 嘗試不同方法
            console.log('🔄 觸發搜尋...');
            
            // 方法1: 按 Enter
            await page.press('input[name="search"]', 'Enter');
            await page.waitForTimeout(2000);
            
            // 方法2: 如果有搜尋按鈕，點擊它
            const searchButton = page.locator('button[type="submit"], .search-btn, button:has-text("搜尋")');
            if (await searchButton.count() > 0) {
                console.log('找到搜尋按鈕，點擊它');
                await searchButton.first().click();
                await page.waitForTimeout(2000);
            }
            
            // 方法3: 表單自動提交（檢查是否有自動提交腳本）
            await page.evaluate(() => {
                const form = document.querySelector('#searchForm, form[action*="quotes"]');
                if (form) {
                    console.log('找到搜尋表單，手動提交');
                    form.submit();
                }
            });
            await page.waitForTimeout(2000);
            
        } else {
            console.log('❌ 未找到搜尋框');
        }

        console.log(`\n📊 捕獲的搜尋請求數量: ${searchRequests.length}`);
        
        if (searchRequests.length === 0) {
            console.log('❌ 搜尋沒有觸發任何 API 請求');
            console.log('可能原因:');
            console.log('  - 搜尋表單沒有正確配置');
            console.log('  - JavaScript 搜尋邏輯有問題');
            console.log('  - 路由配置錯誤');
            console.log('  - 前端沒有正確呼叫 API');
        } else {
            console.log('✅ 搜尋功能有呼叫 API');
            searchRequests.forEach((req, index) => {
                console.log(`${index + 1}. ${req.url}`);
                console.log(`   參數:`, JSON.stringify(req.params));
            });
        }

        console.log('✅ 搜尋調試完成');
    });
});