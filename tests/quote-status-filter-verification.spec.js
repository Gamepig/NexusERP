import { test, expect } from '@playwright/test';

/**
 * 驗證報價單狀態篩選功能
 */
test.describe('報價單狀態篩選功能驗證', () => {
    
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

    test('驗證所有狀態選項和實際篩選效果', async ({ page }) => {
        console.log('🔍 測試狀態篩選功能');
        
        // 前往報價列表頁面
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖初始狀態
        await page.screenshot({ 
            path: `status-filter-initial-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 記錄初始狀態
        const initialRows = page.locator('tbody tr[data-quote-id]');
        const initialCount = await initialRows.count();
        console.log(`📊 初始報價單數量: ${initialCount}`);
        
        // 收集所有目前顯示的狀態
        const initialStatuses = [];
        for (let i = 0; i < Math.min(initialCount, 10); i++) {
            const statusElement = initialRows.nth(i).locator('td:nth-child(6) span');
            const statusText = await statusElement.textContent();
            initialStatuses.push(statusText?.trim() || 'unknown');
        }
        console.log(`📋 初始狀態分佈: ${[...new Set(initialStatuses)].join(', ')}`);
        
        // 測試每個狀態篩選選項
        const statusOptions = [
            { value: '', text: '全部狀態' },
            { value: 'draft', text: '草稿' },
            { value: 'pending', text: '已發送' },
            { value: 'approved', text: '已批准' },
            { value: 'rejected', text: '已拒絕' },
            { value: 'expired', text: '已過期' }
        ];
        
        for (const option of statusOptions) {
            console.log(`\n🔄 測試狀態篩選: ${option.text} (value: ${option.value})`);
            
            // 選擇狀態
            const statusSelect = page.locator('select[name="status"]');
            await statusSelect.selectOption(option.value);
            
            // 監聽網路請求
            const responsePromise = page.waitForResponse(response => 
                response.url().includes('/quotes') && response.request().method() === 'GET'
            );
            
            // 提交表單
            const searchButton = page.locator('button[type="submit"]').filter({ hasText: '搜尋' });
            await searchButton.click();
            
            // 等待回應和頁面更新
            await responsePromise;
            await page.waitForTimeout(2000);
            
            // 檢查URL參數
            const currentUrl = page.url();
            if (option.value) {
                if (currentUrl.includes(`status=${option.value}`)) {
                    console.log(`✅ URL包含正確的狀態參數: status=${option.value}`);
                } else {
                    console.log(`⚠️ URL未包含預期的狀態參數: status=${option.value}`);
                    console.log(`📝 實際URL: ${currentUrl}`);
                }
            }
            
            // 檢查篩選後的結果
            const filteredRows = page.locator('tbody tr[data-quote-id]');
            const filteredCount = await filteredRows.count();
            console.log(`📊 篩選後數量: ${filteredCount}`);
            
            // 檢查篩選後的狀態是否符合預期
            if (filteredCount > 0) {
                const filteredStatuses = [];
                for (let i = 0; i < Math.min(filteredCount, 5); i++) {
                    const statusElement = filteredRows.nth(i).locator('td:nth-child(6) span');
                    const statusText = await statusElement.textContent();
                    filteredStatuses.push(statusText?.trim() || 'unknown');
                }
                console.log(`📋 篩選後狀態: ${[...new Set(filteredStatuses)].join(', ')}`);
                
                // 驗證篩選邏輯
                if (option.value && option.value !== '') {
                    const expectedStatus = getExpectedStatusText(option.value);
                    const hasCorrectStatus = filteredStatuses.some(status => 
                        status === expectedStatus || 
                        (option.value === 'pending' && (status === '已發送' || status === 'pending'))
                    );
                    
                    if (hasCorrectStatus) {
                        console.log(`✅ 狀態篩選正確: 找到預期的狀態 ${expectedStatus}`);
                    } else {
                        console.log(`⚠️ 狀態篩選可能有問題: 預期 ${expectedStatus}, 實際 ${[...new Set(filteredStatuses)].join(', ')}`);
                    }
                }
            } else if (option.value !== '') {
                console.log(`📝 無此狀態的報價單: ${option.text}`);
            }
            
            // 截圖此狀態的篩選結果
            await page.screenshot({ 
                path: `status-filter-${option.value || 'all'}-${Date.now()}.png`, 
                fullPage: true 
            });
        }
        
        console.log('✅ 狀態篩選功能測試完成');
    });
    
    test('驗證「已發送」狀態篩選的具體問題', async ({ page }) => {
        console.log('🎯 專門測試「已發送」狀態篩選');
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 選擇「已發送」狀態
        const statusSelect = page.locator('select[name="status"]');
        await statusSelect.selectOption('pending'); // 根據代碼，已發送對應pending值
        
        // 監聽API請求
        const [response] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/quotes')),
            page.locator('button[type="submit"]').filter({ hasText: '搜尋' }).click()
        ]);
        
        await page.waitForTimeout(2000);
        
        // 檢查請求URL
        const requestUrl = response.url();
        console.log(`🌐 API請求URL: ${requestUrl}`);
        
        if (requestUrl.includes('status=pending')) {
            console.log('✅ 前端正確發送了 status=pending 參數');
        } else {
            console.log('⚠️ 前端未發送 status=pending 參數');
        }
        
        // 檢查API回應
        const responseStatus = response.status();
        console.log(`📡 API回應狀態: ${responseStatus}`);
        
        if (response.ok()) {
            try {
                const responseData = await response.json();
                console.log(`📊 API回應資料結構: ${Object.keys(responseData).join(', ')}`);
                if (responseData.quotes) {
                    console.log(`📝 回應包含 ${responseData.quotes.length} 個報價單`);
                }
            } catch (e) {
                console.log('⚠️ 無法解析API回應為JSON');
            }
        }
        
        // 檢查前端顯示的結果
        const resultRows = page.locator('tbody tr[data-quote-id]');
        const resultCount = await resultRows.count();
        console.log(`📊 前端顯示的結果數量: ${resultCount}`);
        
        // 檢查顯示的狀態
        if (resultCount > 0) {
            const displayedStatuses = [];
            for (let i = 0; i < Math.min(resultCount, 10); i++) {
                const statusElement = resultRows.nth(i).locator('td:nth-child(6) span');
                const statusText = await statusElement.textContent();
                displayedStatuses.push(statusText?.trim() || 'unknown');
            }
            
            const uniqueStatuses = [...new Set(displayedStatuses)];
            console.log(`📋 顯示的狀態: ${uniqueStatuses.join(', ')}`);
            
            // 檢查是否都是「已發送」狀態
            const allPending = displayedStatuses.every(status => status === '已發送');
            if (allPending) {
                console.log('✅ 篩選結果都是「已發送」狀態');
            } else {
                console.log('⚠️ 篩選結果包含其他狀態，可能篩選無效');
            }
        } else {
            console.log('📝 沒有「已發送」狀態的報價單');
        }
        
        console.log('✅ 「已發送」狀態篩選測試完成');
    });
    
    test('測試狀態映射的一致性', async ({ page }) => {
        console.log('🔄 測試前後端狀態映射一致性');
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 測試不同的狀態值
        const testStatuses = ['draft', 'pending', 'approved', 'rejected'];
        
        for (const status of testStatuses) {
            console.log(`\n🧪 測試狀態值: ${status}`);
            
            // 直接通過URL設置狀態參數
            await page.goto(`/quotes?status=${status}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            // 檢查選中的選項是否正確
            const statusSelect = page.locator('select[name="status"]');
            const selectedValue = await statusSelect.inputValue();
            console.log(`📋 選中的狀態值: ${selectedValue}`);
            
            // 檢查URL參數
            const currentUrl = page.url();
            console.log(`🌐 當前URL: ${currentUrl}`);
            
            // 檢查結果數量
            const rows = page.locator('tbody tr[data-quote-id]');
            const count = await rows.count();
            console.log(`📊 結果數量: ${count}`);
        }
        
        console.log('✅ 狀態映射一致性測試完成');
    });
});

function getExpectedStatusText(statusValue) {
    const statusMapping = {
        'draft': '草稿',
        'pending': '已發送',
        'approved': '已批准',
        'rejected': '已拒絕',
        'expired': '已過期'
    };
    return statusMapping[statusValue] || statusValue;
}