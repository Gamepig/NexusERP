import { test, expect } from '@playwright/test';

/**
 * 模擬用戶實際操作流程測試狀態篩選
 */
test.describe('用戶狀態篩選操作流程測試', () => {
    
    test.beforeEach(async ({ page }) => {
        // 登入系統
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('模擬用戶點擊「已發送」選項的完整流程', async ({ page }) => {
        console.log('👤 模擬真實用戶操作「已發送」篩選');
        
        // 前往報價列表頁面
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖初始狀態
        await page.screenshot({ 
            path: `user-workflow-initial-${Date.now()}.png`, 
            fullPage: true 
        });
        
        console.log('📊 步驟1: 記錄初始狀態');
        const initialRows = page.locator('tbody tr[data-quote-id]');
        const initialCount = await initialRows.count();
        console.log(`總報價單數: ${initialCount}`);
        
        // 收集初始狀態分佈
        const initialStatuses = [];
        for (let i = 0; i < initialCount; i++) {
            const statusElement = initialRows.nth(i).locator('td:nth-child(6) span');
            const statusText = await statusElement.textContent();
            initialStatuses.push(statusText?.trim() || 'unknown');
        }
        const statusDistribution = {};
        initialStatuses.forEach(status => {
            statusDistribution[status] = (statusDistribution[status] || 0) + 1;
        });
        console.log('狀態分佈:', statusDistribution);
        
        console.log('📊 步驟2: 用戶點擊狀態下拉選單');
        const statusSelect = page.locator('select[name="status"]');
        
        // 檢查選項是否存在
        const options = await statusSelect.locator('option').allTextContents();
        console.log('可用選項:', options);
        
        // 模擬用戶點擊下拉選單
        await statusSelect.click();
        await page.waitForTimeout(500);
        
        console.log('📊 步驟3: 用戶選擇「已發送」選項');
        // 找到「已發送」選項並選擇
        const pendingOption = statusSelect.locator('option').filter({ hasText: '已發送' });
        const optionExists = await pendingOption.count() > 0;
        console.log(`「已發送」選項存在: ${optionExists}`);
        
        if (optionExists) {
            const optionValue = await pendingOption.getAttribute('value');
            console.log(`「已發送」選項的value: ${optionValue}`);
            
            // 選擇該選項
            await statusSelect.selectOption(optionValue);
            
            // 確認選中狀態
            const selectedValue = await statusSelect.inputValue();
            console.log(`實際選中的值: ${selectedValue}`);
        }
        
        console.log('📊 步驟4: 檢查是否需要手動提交表單');
        
        // 檢查是否有自動提交機制
        const hasOnChangeSubmit = await statusSelect.evaluate(el => 
            el.hasAttribute('onchange') && el.getAttribute('onchange').includes('submit')
        );
        console.log(`下拉選單有自動提交: ${hasOnChangeSubmit}`);
        
        if (hasOnChangeSubmit) {
            console.log('✨ 自動提交觸發中...');
            // 等待自動提交
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
        } else {
            console.log('👆 需要手動點擊搜尋按鈕');
            
            // 用戶需要手動點擊搜尋按鈕
            const searchButton = page.locator('button[type="submit"]').filter({ hasText: '搜尋' });
            const buttonExists = await searchButton.count() > 0;
            console.log(`搜尋按鈕存在: ${buttonExists}`);
            
            if (buttonExists) {
                console.log('點擊搜尋按鈕...');
                await searchButton.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);
            }
        }
        
        console.log('📊 步驟5: 檢查篩選後的結果');
        
        // 檢查URL是否已更新
        const currentUrl = page.url();
        console.log(`當前URL: ${currentUrl}`);
        
        const hasStatusParam = currentUrl.includes('status=');
        console.log(`URL包含狀態參數: ${hasStatusParam}`);
        
        // 檢查篩選結果
        const filteredRows = page.locator('tbody tr[data-quote-id]');
        const filteredCount = await filteredRows.count();
        console.log(`篩選後數量: ${filteredCount}`);
        
        // 截圖最終結果
        await page.screenshot({ 
            path: `user-workflow-final-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查篩選是否生效
        if (filteredCount < initialCount) {
            console.log('✅ 篩選生效 - 結果數量減少');
            
            // 檢查結果中的狀態
            const resultStatuses = [];
            for (let i = 0; i < filteredCount; i++) {
                const statusElement = filteredRows.nth(i).locator('td:nth-child(6) span');
                const statusText = await statusElement.textContent();
                resultStatuses.push(statusText?.trim() || 'unknown');
            }
            
            const uniqueResultStatuses = [...new Set(resultStatuses)];
            console.log(`篩選後狀態: ${uniqueResultStatuses.join(', ')}`);
            
            if (uniqueResultStatuses.length === 1 && uniqueResultStatuses[0] === '已發送') {
                console.log('✅ 篩選完全正確 - 只顯示「已發送」狀態');
            } else {
                console.log('⚠️ 篩選可能不完全正確');
            }
        } else if (filteredCount === initialCount) {
            console.log('⚠️ 篩選可能無效 - 數量未變化');
            
            // 檢查是否所有項目本來就是「已發送」狀態
            const allPendingInitially = initialStatuses.every(status => status === '已發送');
            if (allPendingInitially) {
                console.log('✅ 所有項目本來就是「已發送」狀態，篩選正常');
            } else {
                console.log('❌ 篩選確實無效 - 應該過濾掉其他狀態');
            }
        }
        
        console.log('✅ 用戶操作流程測試完成');
    });
    
    test('測試不同狀態篩選的用戶體驗', async ({ page }) => {
        console.log('🔄 測試各種狀態篩選的用戶體驗');
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        const testCases = [
            { status: 'draft', expectedText: '草稿' },
            { status: 'pending', expectedText: '已發送' },
            { status: 'approved', expectedText: '已批准' }
        ];
        
        for (const testCase of testCases) {
            console.log(`\n🧪 測試狀態: ${testCase.expectedText}`);
            
            // 選擇狀態
            const statusSelect = page.locator('select[name="status"]');
            await statusSelect.selectOption(testCase.status);
            
            // 檢查選中狀態的視覺反饋
            const selectedOption = await statusSelect.locator(`option[value="${testCase.status}"]`).textContent();
            console.log(`選中的選項文字: ${selectedOption}`);
            
            // 提交篩選
            const searchButton = page.locator('button[type="submit"]').filter({ hasText: '搜尋' });
            await searchButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1500);
            
            // 檢查結果
            const resultCount = await page.locator('tbody tr[data-quote-id]').count();
            console.log(`${testCase.expectedText} 狀態的報價單數量: ${resultCount}`);
            
            // 如果有結果，檢查狀態是否正確
            if (resultCount > 0) {
                const firstStatusElement = page.locator('tbody tr[data-quote-id]').first().locator('td:nth-child(6) span');
                const firstStatus = await firstStatusElement.textContent();
                console.log(`第一個結果的狀態: ${firstStatus?.trim()}`);
                
                if (firstStatus?.trim() === testCase.expectedText) {
                    console.log('✅ 狀態篩選正確');
                } else {
                    console.log('⚠️ 狀態篩選可能有問題');
                }
            } else {
                console.log('📝 該狀態無資料');
            }
        }
        
        console.log('✅ 狀態篩選用戶體驗測試完成');
    });
    
    test('檢查狀態篩選的即時反饋', async ({ page }) => {
        console.log('⚡ 測試狀態篩選的即時反饋機制');
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        const statusSelect = page.locator('select[name="status"]');
        
        // 測試是否有即時篩選功能
        console.log('檢查是否有自動提交機制...');
        
        // 監聽網路請求
        let requestCount = 0;
        page.on('request', request => {
            if (request.url().includes('/quotes') && request.method() === 'GET') {
                requestCount++;
                console.log(`📡 網路請求 #${requestCount}: ${request.url()}`);
            }
        });
        
        // 選擇草稿狀態
        await statusSelect.selectOption('draft');
        await page.waitForTimeout(1000); // 等待可能的自動提交
        
        // 檢查是否自動發送請求
        if (requestCount > 0) {
            console.log('✅ 狀態選擇後自動發送請求');
        } else {
            console.log('📝 需要手動提交表單');
            
            // 手動點擊搜尋按鈕
            const searchButton = page.locator('button[type="submit"]').filter({ hasText: '搜尋' });
            await searchButton.click();
            await page.waitForTimeout(1000);
        }
        
        console.log(`總共發送了 ${requestCount} 個網路請求`);
        console.log('✅ 即時反饋測試完成');
    });
});