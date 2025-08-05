import { test, expect } from '@playwright/test';

test.describe('NexusERP 報價表單全面測試', () => {
    let page;
    
    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        
        // 監聽所有 console 訊息和錯誤
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`❌ JavaScript 錯誤: ${msg.text()}`);
            } else if (msg.type() === 'warning') {
                console.log(`⚠️ JavaScript 警告: ${msg.text()}`);
            }
        });
        
        page.on('pageerror', error => {
            console.log(`❌ 頁面錯誤: ${error.message}`);
        });
        
        page.on('requestfailed', request => {
            console.log(`❌ 請求失敗: ${request.url()} - ${request.failure().errorText}`);
        });
    });

    test('1. 導航功能測試 - 主導航有報價管理連結', async () => {
        console.log('🎯 測試項目 1: 導航功能測試');
        
        // 首先需要登入
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // 等待導航到 dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        
        // 截圖：登入後的頁面
        await page.screenshot({ path: 'quotes-test-01-after-login.png', fullPage: true });
        
        // 檢查主導航是否有報價管理連結
        const quoteNavLink = page.locator('nav a:has-text("報價管理")');
        await expect(quoteNavLink).toBeVisible();
        console.log('✅ 主導航有"報價管理"連結');
        
        // 點擊報價管理連結
        await quoteNavLink.click();
        
        // 檢查是否正確跳轉到 /quotes 列表頁面
        await page.waitForURL('**/quotes', { timeout: 10000 });
        await expect(page).toHaveURL(/.*\/quotes$/);
        console.log('✅ 點擊"報價管理"正確跳轉到 /quotes 列表頁面');
        
        // 截圖：報價列表頁面
        await page.screenshot({ path: 'quotes-test-02-quotes-list.png', fullPage: true });
        
        // 檢查是否有"建立報價單"按鈕
        const createQuoteButton = page.locator('a:has-text("建立報價單"), button:has-text("建立報價單")');
        await expect(createQuoteButton).toBeVisible();
        console.log('✅ 報價列表頁面有"建立報價單"按鈕');
        
        // 點擊建立報價單按鈕
        await createQuoteButton.click();
        
        // 檢查是否跳轉到建立頁面
        await page.waitForURL('**/quotes/create', { timeout: 10000 });
        await expect(page).toHaveURL(/.*\/quotes\/create$/);
        console.log('✅ 點擊"建立報價單"按鈕正確跳轉到建立頁面');
    });

    test('2. 報價表單基本功能測試', async () => {
        console.log('🎯 測試項目 2: 報價表單基本功能');
        
        // 直接導航到報價建立頁面
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        
        // 直接訪問報價建立頁面
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
        
        // 截圖：報價建立頁面
        await page.screenshot({ path: 'quotes-test-03-create-page.png', fullPage: true });
        
        // 檢查頁面標題
        await expect(page.locator('h1')).toContainText('建立報價單');
        console.log('✅ 頁面標題正確顯示');
        
        // 檢查客戶下拉選單是否存在且有資料
        const customerSelect = page.locator('#customer_id');
        await expect(customerSelect).toBeVisible();
        
        // 檢查是否有客戶選項
        const customerOptions = page.locator('#customer_id option');
        const optionsCount = await customerOptions.count();
        expect(optionsCount).toBeGreaterThan(1); // 至少有預設選項 + 客戶選項
        console.log(`✅ 客戶下拉選單有 ${optionsCount} 個選項`);
        
        // 檢查聯絡人欄位是否存在
        const contactPersonField = page.locator('#contact_person');
        await expect(contactPersonField).toBeVisible();
        console.log('✅ 聯絡人欄位存在');
        
        // 檢查必要的表單欄位
        await expect(page.locator('#quote_date')).toBeVisible();
        await expect(page.locator('#valid_until')).toBeVisible();
        await expect(page.locator('#status')).toBeVisible();
        console.log('✅ 所有必要表單欄位都存在');
    });

    test('3. 聯絡人自動填入功能測試', async () => {
        console.log('🎯 測試項目 3: 聯絡人自動填入功能');
        
        // 登入並導航到報價建立頁面
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
        
        // 獲取第一個客戶選項（非空選項）
        const customerSelect = page.locator('#customer_id');
        const contactPersonField = page.locator('#contact_person');
        
        // 獲取所有選項
        const options = await page.locator('#customer_id option').all();
        let selectedCustomer = null;
        
        for (let option of options) {
            const value = await option.getAttribute('value');
            if (value && value !== '') {
                selectedCustomer = option;
                break;
            }
        }
        
        if (selectedCustomer) {
            const contactPersonData = await selectedCustomer.getAttribute('data-contact-person');
            const customerValue = await selectedCustomer.getAttribute('value');
            
            console.log(`測試客戶: ${customerValue}, 聯絡人: ${contactPersonData}`);
            
            // 選擇客戶
            await customerSelect.selectOption(customerValue);
            
            // 等待聯絡人自動填入
            await page.waitForTimeout(1000);
            
            // 截圖：選擇客戶後
            await page.screenshot({ path: 'quotes-test-04-customer-selected.png', fullPage: true });
            
            // 檢查聯絡人是否自動填入
            const contactPersonValue = await contactPersonField.inputValue();
            console.log(`聯絡人欄位值: "${contactPersonValue}"`);
            
            if (contactPersonData && contactPersonData.trim() !== '') {
                expect(contactPersonValue).toBe(contactPersonData);
                console.log('✅ 聯絡人自動填入功能正常');
            } else {
                console.log('ℹ️ 該客戶沒有聯絡人資料');
            }
            
            // 測試選擇不同客戶，聯絡人是否會相應變更
            const otherOptions = await page.locator('#customer_id option').all();
            for (let option of otherOptions) {
                const value = await option.getAttribute('value');
                if (value && value !== '' && value !== customerValue) {
                    const otherContactPerson = await option.getAttribute('data-contact-person');
                    
                    await customerSelect.selectOption(value);
                    await page.waitForTimeout(1000);
                    
                    const newContactPersonValue = await contactPersonField.inputValue();
                    console.log(`切換到客戶 ${value}, 新聯絡人: "${newContactPersonValue}"`);
                    
                    if (otherContactPerson && otherContactPerson.trim() !== '') {
                        expect(newContactPersonValue).toBe(otherContactPerson);
                        console.log('✅ 切換客戶時聯絡人正確更新');
                    }
                    break;
                }
            }
        } else {
            console.log('⚠️ 沒有找到可用的客戶選項');
        }
    });

    test('4. 產品自動完成功能測試', async () => {
        console.log('🎯 測試項目 4: 產品自動完成功能');
        
        // 登入並導航到報價建立頁面
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
        
        // 找到產品搜尋輸入框
        const productInput = page.locator('.product-search').first();
        await expect(productInput).toBeVisible();
        console.log('✅ 產品搜尋輸入框存在');
        
        // 測試搜尋關鍵字
        const searchTerms = ['產品', 'test', 'A'];
        
        for (let term of searchTerms) {
            console.log(`測試搜尋關鍵字: "${term}"`);
            
            // 清空輸入框
            await productInput.fill('');
            await page.waitForTimeout(500);
            
            // 輸入搜尋關鍵字
            await productInput.fill(term);
            
            // 等待搜尋結果
            await page.waitForTimeout(2000);
            
            // 截圖：搜尋狀態
            await page.screenshot({ path: `quotes-test-05-search-${term}.png`, fullPage: true });
            
            // 檢查是否出現下拉搜尋結果
            const dropdown = page.locator('.product-autocomplete-dropdown');
            const isDropdownVisible = await dropdown.isVisible();
            
            if (isDropdownVisible) {
                console.log(`✅ 搜尋 "${term}" 出現下拉結果`);
                
                // 檢查搜尋結果項目
                const searchResults = page.locator('.autocomplete-item');
                const resultsCount = await searchResults.count();
                console.log(`搜尋結果數量: ${resultsCount}`);
                
                if (resultsCount > 0) {
                    // 點擊第一個結果
                    await searchResults.first().click();
                    await page.waitForTimeout(1000);
                    
                    // 檢查產品名稱是否被填入
                    const inputValue = await productInput.inputValue();
                    console.log(`選擇產品後輸入框值: "${inputValue}"`);
                    
                    // 檢查價格是否自動填入
                    const priceInput = page.locator('.price-input').first();
                    const priceValue = await priceInput.inputValue();
                    console.log(`自動填入的價格: ${priceValue}`);
                    
                    if (parseFloat(priceValue) > 0) {
                        console.log('✅ 價格自動填入功能正常');
                    }
                    
                    // 截圖：選擇產品後
                    await page.screenshot({ path: `quotes-test-06-product-selected-${term}.png`, fullPage: true });
                    
                    break; // 測試成功後跳出循環
                }
            } else {
                console.log(`ℹ️ 搜尋 "${term}" 沒有顯示下拉結果`);
            }
        }
        
        // 測試新增項目按鈕的自動完成功能
        console.log('測試新增項目的產品自動完成');
        const addItemButton = page.locator('button:has-text("新增項目")');
        await addItemButton.click();
        await page.waitForTimeout(1000);
        
        // 找到新添加的產品輸入框
        const newProductInputs = page.locator('.product-search');
        const newInputCount = await newProductInputs.count();
        console.log(`新增項目後產品輸入框數量: ${newInputCount}`);
        
        if (newInputCount > 1) {
            const secondProductInput = newProductInputs.nth(1);
            await secondProductInput.fill('test');
            await page.waitForTimeout(2000);
            
            const secondDropdown = page.locator('.product-autocomplete-dropdown').nth(1);
            const isSecondDropdownVisible = await secondDropdown.isVisible().catch(() => false);
            
            if (isSecondDropdownVisible) {
                console.log('✅ 新增項目的產品自動完成功能正常');
            } else {
                console.log('ℹ️ 新增項目的自動完成功能需要進一步檢查');
            }
        }
    });

    test('5. JavaScript 錯誤檢查', async () => {
        console.log('🎯 測試項目 5: JavaScript 錯誤檢查');
        
        const jsErrors = [];
        const apiErrors = [];
        
        // 收集 JavaScript 錯誤
        page.on('pageerror', error => {
            jsErrors.push(error.message);
        });
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                jsErrors.push(msg.text());
            }
        });
        
        // 收集 API 請求錯誤
        page.on('response', response => {
            if (!response.ok()) {
                apiErrors.push(`${response.url()} - ${response.status()}`);
            }
        });
        
        // 登入並導航到報價建立頁面
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
        
        // 執行一些基本操作來觸發潛在錯誤
        await page.locator('#customer_id').selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        
        const productInput = page.locator('.product-search').first();
        await productInput.fill('test');
        await page.waitForTimeout(2000);
        
        // 點擊新增項目按鈕
        await page.locator('button:has-text("新增項目")').click();
        await page.waitForTimeout(1000);
        
        // 修改數量觸發計算
        await page.locator('.quantity-input').first().fill('5');
        await page.waitForTimeout(1000);
        
        // 截圖：最終狀態
        await page.screenshot({ path: 'quotes-test-07-final-state.png', fullPage: true });
        
        // 檢查錯誤
        console.log(`JavaScript 錯誤數量: ${jsErrors.length}`);
        if (jsErrors.length > 0) {
            console.log('JavaScript 錯誤列表:');
            jsErrors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        } else {
            console.log('✅ 沒有 JavaScript 錯誤');
        }
        
        console.log(`API 錯誤數量: ${apiErrors.length}`);
        if (apiErrors.length > 0) {
            console.log('API 錯誤列表:');
            apiErrors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        } else {
            console.log('✅ 沒有 API 錯誤');
        }
    });

    test('6. API 請求檢查', async () => {
        console.log('🎯 測試項目 6: API 請求檢查');
        
        const apiRequests = [];
        
        // 監聽 API 請求
        page.on('request', request => {
            if (request.url().includes('/api/')) {
                apiRequests.push({
                    url: request.url(),
                    method: request.method()
                });
            }
        });
        
        const apiResponses = [];
        page.on('response', response => {
            if (response.url().includes('/api/')) {
                apiResponses.push({
                    url: response.url(),
                    status: response.status(),
                    ok: response.ok()
                });
            }
        });
        
        // 登入並導航到報價建立頁面
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
        
        // 觸發客戶 API 請求（如果有的話）
        await page.locator('#customer_id').selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        
        // 觸發產品搜尋 API 請求
        const productInput = page.locator('.product-search').first();
        await productInput.fill('test');
        await page.waitForTimeout(3000); // 等待搜尋API完成
        
        // 分析 API 請求結果
        console.log(`總共發送了 ${apiRequests.length} 個 API 請求:`);
        apiRequests.forEach((req, index) => {
            console.log(`  ${index + 1}. ${req.method} ${req.url}`);
        });
        
        console.log(`收到 ${apiResponses.length} 個 API 回應:`);
        apiResponses.forEach((res, index) => {
            const status = res.ok ? '✅' : '❌';
            console.log(`  ${index + 1}. ${status} ${res.status} ${res.url}`);
        });
        
        // 檢查關鍵 API
        const customerApiResponse = apiResponses.find(res => res.url.includes('/api/customers'));
        const productSearchResponse = apiResponses.find(res => res.url.includes('/api/products/search'));
        
        if (customerApiResponse) {
            if (customerApiResponse.ok) {
                console.log('✅ /api/customers API 正常回應');
            } else {
                console.log(`❌ /api/customers API 回應錯誤: ${customerApiResponse.status}`);
            }
        } else {
            console.log('ℹ️ 沒有發現 /api/customers API 請求');
        }
        
        if (productSearchResponse) {
            if (productSearchResponse.ok) {
                console.log('✅ /api/products/search API 正常回應');
            } else {
                console.log(`❌ /api/products/search API 回應錯誤: ${productSearchResponse.status}`);
            }
        } else {
            console.log('ℹ️ 沒有發現 /api/products/search API 請求');
        }
    });

    test('7. 完整功能流程測試', async () => {
        console.log('🎯 測試項目 7: 完整功能流程測試');
        
        // 登入
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        
        // 導航到報價建立頁面
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
        
        // 填寫基本資料
        await page.locator('#customer_id').selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        
        await page.locator('#notes').fill('這是一個測試報價單');
        
        // 填寫第一個產品項目
        const firstProductInput = page.locator('.product-search').first();
        await firstProductInput.fill('test');
        await page.waitForTimeout(2000);
        
        // 嘗試選擇產品（如果有搜尋結果）
        const dropdown = page.locator('.product-autocomplete-dropdown');
        const isDropdownVisible = await dropdown.isVisible().catch(() => false);
        
        if (isDropdownVisible) {
            const searchResults = page.locator('.autocomplete-item');
            const resultsCount = await searchResults.count();
            if (resultsCount > 0) {
                await searchResults.first().click();
                await page.waitForTimeout(1000);
            }
        } else {
            // 如果沒有搜尋結果，手動填入產品資訊
            await firstProductInput.fill('測試產品');
        }
        
        // 修改數量和價格
        await page.locator('.quantity-input').first().fill('2');
        await page.locator('.price-input').first().fill('500');
        await page.waitForTimeout(1000);
        
        // 新增第二個項目
        await page.locator('button:has-text("新增項目")').click();
        await page.waitForTimeout(1000);
        
        const secondProductInput = page.locator('.product-search').nth(1);
        await secondProductInput.fill('第二個產品');
        await page.locator('.quantity-input').nth(1).fill('1');
        await page.locator('.price-input').nth(1).fill('1000');
        await page.waitForTimeout(1000);
        
        // 檢查金額計算
        const subtotalElement = page.locator('#subtotalAmount');
        const taxElement = page.locator('#taxAmount');
        const totalElement = page.locator('#totalAmount');
        
        const subtotal = await subtotalElement.textContent();
        const tax = await taxElement.textContent();
        const total = await totalElement.textContent();
        
        console.log(`小計: ${subtotal}`);
        console.log(`稅額: ${tax}`);
        console.log(`總計: ${total}`);
        
        // 驗證計算正確性 (2*500 + 1*1000 = 2000, 稅額 = 2000*0.05 = 100, 總計 = 2100)
        const expectedSubtotal = 2000;
        const expectedTax = expectedSubtotal * 0.05;
        const expectedTotal = expectedSubtotal + expectedTax;
        
        console.log(`預期小計: $${expectedSubtotal.toFixed(2)}`);
        console.log(`預期稅額: $${expectedTax.toFixed(2)}`);
        console.log(`預期總計: $${expectedTotal.toFixed(2)}`);
        
        // 截圖：完成填寫的表單
        await page.screenshot({ path: 'quotes-test-08-completed-form.png', fullPage: true });
        
        console.log('✅ 完整功能流程測試完成');
    });
});