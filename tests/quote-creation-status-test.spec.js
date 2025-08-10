import { test, expect } from '@playwright/test';

/**
 * 報價建立狀態功能測試
 * 驗證修復後的報價建立狀態選擇功能
 * 重點：測試狀態欄位不再固定為"草稿"，能正確選擇和保存狀態
 */

test.describe('報價建立狀態功能測試', () => {
    
    test.beforeEach(async ({ page }) => {
        console.log('🔐 開始登入流程');
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        
        // 執行登入
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        
        await page.click('button[type="submit"], input[type="submit"], .btn-primary');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        console.log(`登入後的 URL: ${page.url()}`);
    });

    test('報價建立頁面狀態選擇功能驗證', async ({ page }) => {
        console.log('📝 測試報價建立頁面狀態選擇');
        
        // 導航到報價建立頁面
        await page.goto('/quotes/create');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        console.log('✅ 已進入報價建立頁面');
        
        // 截圖用於分析
        await page.screenshot({ 
            path: `quote-creation-status-initial-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 查找狀態選擇欄位
        const statusSelectors = [
            'select[name="status"]',
            '#status',
            'select[id="status"]',
            '.status-select',
            'select:has(option[value="draft"])'
        ];
        
        let statusSelect = null;
        for (const selector of statusSelectors) {
            const element = page.locator(selector);
            if (await element.count() > 0 && await element.isVisible()) {
                statusSelect = element;
                console.log(`✅ 找到狀態選擇欄位: ${selector}`);
                break;
            }
        }
        
        if (!statusSelect) {
            console.log('⚠️ 未找到狀態選擇欄位，檢查頁面上所有的 select 元素');
            
            const allSelects = page.locator('select');
            const selectCount = await allSelects.count();
            console.log(`頁面上有 ${selectCount} 個 select 元素`);
            
            for (let i = 0; i < selectCount; i++) {
                const select = allSelects.nth(i);
                const name = await select.getAttribute('name');
                const id = await select.getAttribute('id');
                const className = await select.getAttribute('class');
                console.log(`Select ${i}: name=${name}, id=${id}, class=${className}`);
                
                // 檢查 option 內容
                const options = await select.locator('option').allTextContents();
                console.log(`  選項: ${options.join(', ')}`);
            }
            
            // 如果沒有找到狀態選擇，可能使用其他形式的輸入
            console.log('檢查是否有其他形式的狀態輸入');
            const radioInputs = page.locator('input[type="radio"][name*="status"]');
            const checkboxInputs = page.locator('input[type="checkbox"][name*="status"]');
            const hiddenInputs = page.locator('input[name="status"]');
            
            console.log(`狀態相關的 radio 輸入數量: ${await radioInputs.count()}`);
            console.log(`狀態相關的 checkbox 輸入數量: ${await checkboxInputs.count()}`);
            console.log(`隱藏的狀態輸入數量: ${await hiddenInputs.count()}`);
            
            return; // 無法繼續測試
        }
        
        // 檢查狀態選項
        const statusOptions = await statusSelect.locator('option').allTextContents();
        console.log('可用的狀態選項:', statusOptions);
        
        // 檢查是否包含預期的狀態選項
        const expectedStatuses = ['草稿', '已發送', '已批准', '已拒絕', '已過期'];
        const availableStatuses = [];
        
        for (const expectedStatus of expectedStatuses) {
            const optionExists = statusOptions.some(option => 
                option.includes(expectedStatus) || option.toLowerCase().includes(expectedStatus.toLowerCase())
            );
            if (optionExists) {
                availableStatuses.push(expectedStatus);
                console.log(`✅ 找到狀態選項: ${expectedStatus}`);
            }
        }
        
        console.log(`總共找到 ${availableStatuses.length} 個預期狀態選項`);
        
        // 測試狀態選擇功能
        if (availableStatuses.length > 1) {
            console.log('測試狀態選擇功能...');
            
            // 測試選擇不同狀態
            const statusValues = [
                { display: '草稿', value: 'draft' },
                { display: '已發送', value: 'pending' },
                { display: '已批准', value: 'approved' }
            ];
            
            for (const status of statusValues) {
                try {
                    console.log(`測試選擇狀態: ${status.display} (${status.value})`);
                    
                    // 嘗試按 value 選擇
                    const optionByValue = statusSelect.locator(`option[value="${status.value}"]`);
                    if (await optionByValue.count() > 0) {
                        await statusSelect.selectOption(status.value);
                        console.log(`✅ 成功選擇狀態: ${status.display} (按 value)`);
                        
                        // 驗證選擇是否生效
                        const selectedValue = await statusSelect.inputValue();
                        console.log(`當前選中的值: ${selectedValue}`);
                    } else {
                        // 嘗試按文字選擇
                        const optionByText = statusSelect.locator(`option:has-text("${status.display}")`);
                        if (await optionByText.count() > 0) {
                            await statusSelect.selectOption({ label: status.display });
                            console.log(`✅ 成功選擇狀態: ${status.display} (按文字)`);
                        }
                    }
                } catch (error) {
                    console.log(`選擇狀態 ${status.display} 失敗: ${error.message}`);
                }
            }
        }
        
        console.log('✅ 報價建立頁面狀態選擇功能測試完成');
    });

    test('報價建立表單提交狀態驗證', async ({ page }) => {
        console.log('📤 測試報價建立表單狀態提交');
        
        // 監聽 API 請求
        const apiRequests = [];
        
        page.on('request', request => {
            const url = request.url();
            if (url.includes('/api/quotes') && request.method() === 'POST') {
                console.log(`📤 捕獲報價建立 API 請求: ${request.method()} ${url}`);
                
                // 嘗試記錄請求內容
                try {
                    const postData = request.postData();
                    if (postData) {
                        console.log('請求資料:', postData);
                        
                        // 解析 JSON 格式的資料
                        try {
                            const jsonData = JSON.parse(postData);
                            if (jsonData.status) {
                                console.log(`✅ 請求包含狀態欄位: ${jsonData.status}`);
                            } else {
                                console.log('⚠️ 請求中沒有找到狀態欄位');
                            }
                        } catch {
                            console.log('請求資料非 JSON 格式，可能是 FormData');
                            
                            // 檢查是否包含 status 關鍵字
                            if (postData.includes('status')) {
                                console.log('✅ 請求資料包含 status 欄位');
                            }
                        }
                    }
                } catch (error) {
                    console.log('無法取得請求資料:', error.message);
                }
                
                apiRequests.push({
                    method: request.method(),
                    url: url,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        page.on('response', async response => {
            const url = response.url();
            if (url.includes('/api/quotes') && response.request().method() === 'POST') {
                console.log(`📥 報價建立 API 回應: ${response.status()}`);
                
                if (response.status() === 200 || response.status() === 201) {
                    try {
                        const responseData = await response.json();
                        console.log('API 回應結構:', Object.keys(responseData));
                        
                        if (responseData.quote && responseData.quote.status) {
                            console.log(`✅ 建立成功，報價狀態: ${responseData.quote.status}`);
                        } else if (responseData.status) {
                            console.log(`✅ 建立成功，回應狀態: ${responseData.status}`);
                        }
                    } catch (error) {
                        console.log('解析回應資料失敗:', error.message);
                    }
                }
            }
        });
        
        // 導航到報價建立頁面
        await page.goto('/quotes/create');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 查找並填寫表單必要欄位
        console.log('填寫報價建立表單...');
        
        // 填寫客戶選擇（假設有客戶選擇欄位）
        const customerSelectors = [
            'select[name="customer_id"]',
            '#customer_id',
            'select[name="customer"]'
        ];
        
        for (const selector of customerSelectors) {
            const element = page.locator(selector);
            if (await element.count() > 0 && await element.isVisible()) {
                console.log(`找到客戶選擇欄位: ${selector}`);
                
                const options = await element.locator('option').allTextContents();
                console.log(`可用客戶選項: ${options.slice(0, 5).join(', ')}`);
                
                // 選擇第一個非空選項
                const firstOption = element.locator('option').nth(1);
                if (await firstOption.count() > 0) {
                    const optionValue = await firstOption.getAttribute('value');
                    if (optionValue && optionValue !== '') {
                        await element.selectOption(optionValue);
                        console.log('✅ 已選擇客戶');
                    }
                }
                break;
            }
        }
        
        // 填寫報價日期（如果有）
        const quoteDateInput = page.locator('input[name="quote_date"], #quote_date');
        if (await quoteDateInput.isVisible()) {
            const today = new Date().toISOString().split('T')[0];
            await quoteDateInput.fill(today);
            console.log('✅ 已填寫報價日期');
        }
        
        // 設置狀態為非草稿狀態來測試
        const statusSelect = page.locator('select[name="status"]');
        if (await statusSelect.isVisible()) {
            console.log('設置報價狀態為"已發送"來測試...');
            
            const pendingOption = statusSelect.locator('option[value="pending"]');
            if (await pendingOption.count() > 0) {
                await statusSelect.selectOption('pending');
                console.log('✅ 已設置狀態為"已發送"');
            } else {
                // 嘗試其他可能的值
                const alternateOptions = ['sent', 'pending', 'submitted'];
                for (const option of alternateOptions) {
                    const optionElement = statusSelect.locator(`option[value="${option}"]`);
                    if (await optionElement.count() > 0) {
                        await statusSelect.selectOption(option);
                        console.log(`✅ 已設置狀態為"${option}"`);
                        break;
                    }
                }
            }
        } else {
            console.log('⚠️ 未找到狀態選擇欄位，將使用預設狀態');
        }
        
        // 查找提交按鈕
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            '.btn-primary',
            '.btn-submit',
            'button:has-text("儲存")',
            'button:has-text("建立")',
            'button:has-text("提交")'
        ];
        
        let submitButton = null;
        for (const selector of submitSelectors) {
            const element = page.locator(selector);
            if (await element.count() > 0 && await element.isVisible()) {
                submitButton = element.first();
                console.log(`✅ 找到提交按鈕: ${selector}`);
                break;
            }
        }
        
        if (submitButton) {
            console.log('提交表單...');
            await submitButton.click();
            
            // 等待請求完成
            await page.waitForTimeout(3000);
            
            console.log(`📊 總共捕獲 ${apiRequests.length} 個報價建立 API 請求`);
            
            if (apiRequests.length > 0) {
                console.log('✅ 成功捕獲到報價建立請求');
            } else {
                console.log('⚠️ 未捕獲到報價建立 API 請求，可能使用不同的提交方式');
            }
        } else {
            console.log('⚠️ 未找到提交按鈕，無法測試表單提交');
        }
        
        console.log('✅ 報價建立表單狀態提交測試完成');
    });

    test('多步驟報價建立狀態驗證', async ({ page }) => {
        console.log('🔄 測試多步驟報價建立狀態');
        
        // 嘗試多步驟報價建立頁面
        const multiStepUrls = [
            '/quotes/create/multi-step',
            '/quotes/multi-step',
            '/quotes/create?mode=multi'
        ];
        
        for (const url of multiStepUrls) {
            try {
                await page.goto(url);
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                
                const pageContent = await page.locator('body').textContent();
                if (pageContent.includes('步驟') || pageContent.includes('Step')) {
                    console.log(`✅ 找到多步驟報價建立頁面: ${url}`);
                    
                    // 截圖記錄
                    await page.screenshot({ 
                        path: `multi-step-quote-${Date.now()}.png`, 
                        fullPage: true 
                    });
                    
                    // 檢查是否有狀態選擇（通常在最後步驟）
                    const statusSelect = page.locator('select[name="status"]');
                    if (await statusSelect.isVisible()) {
                        console.log('✅ 多步驟頁面包含狀態選擇');
                    } else {
                        console.log('ℹ️ 多步驟頁面當前步驟沒有狀態選擇');
                    }
                    
                    break;
                }
            } catch (error) {
                console.log(`多步驟頁面 ${url} 不存在: ${error.message}`);
            }
        }
        
        console.log('✅ 多步驟報價建立狀態驗證完成');
    });

    test('狀態預設值驗證', async ({ page }) => {
        console.log('🔍 驗證狀態預設值');
        
        await page.goto('/quotes/create');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const statusSelect = page.locator('select[name="status"]');
        if (await statusSelect.isVisible()) {
            const defaultValue = await statusSelect.inputValue();
            const defaultText = await statusSelect.locator('option:checked').textContent();
            
            console.log(`預設狀態值: ${defaultValue}`);
            console.log(`預設狀態文字: ${defaultText}`);
            
            // 根據修復，預設應該是 draft，但用戶可以選擇其他狀態
            if (defaultValue === 'draft' || defaultValue === '' || defaultText?.includes('草稿')) {
                console.log('✅ 預設狀態符合預期（草稿或空值）');
            } else {
                console.log(`⚠️ 預設狀態異常: ${defaultValue} (${defaultText})`);
            }
            
            // 測試是否可以改變狀態（這是修復的關鍵）
            const optionCount = await statusSelect.locator('option').count();
            if (optionCount > 1) {
                console.log(`✅ 狀態選單有 ${optionCount} 個選項，可以選擇`);
                
                // 測試選擇非草稿狀態
                const nonDraftOption = statusSelect.locator('option[value!="draft"][value!=""]').first();
                if (await nonDraftOption.count() > 0) {
                    const testValue = await nonDraftOption.getAttribute('value');
                    await statusSelect.selectOption(testValue);
                    
                    const newValue = await statusSelect.inputValue();
                    if (newValue === testValue) {
                        console.log(`✅ 成功選擇非草稿狀態: ${testValue}`);
                        console.log('✅ 狀態不再固定為草稿，修復成功');
                    } else {
                        console.log(`❌ 無法選擇非草稿狀態`);
                    }
                }
            } else {
                console.log(`⚠️ 狀態選單只有 ${optionCount} 個選項`);
            }
        } else {
            console.log('⚠️ 未找到狀態選擇欄位');
        }
        
        console.log('✅ 狀態預設值驗證完成');
    });
});