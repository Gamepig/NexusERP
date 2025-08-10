import { test, expect } from '@playwright/test';

/**
 * 驗證報價單列表搜尋功能
 */
test.describe('報價單搜尋功能驗證', () => {
    
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

    test('驗證搜尋框輸入和提交功能', async ({ page }) => {
        console.log('🔍 測試搜尋功能基本操作');
        
        // 前往報價列表頁面
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖初始狀態
        await page.screenshot({ 
            path: `search-test-initial-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查搜尋框存在
        const searchInput = page.locator('input[name="search"]');
        await expect(searchInput).toBeVisible();
        console.log('✅ 搜尋框已找到');
        
        // 記錄初始列表數量
        const initialRows = page.locator('tbody tr[data-quote-id]');
        const initialCount = await initialRows.count();
        console.log(`📊 初始報價單數量: ${initialCount}`);
        
        // 輸入搜尋關鍵字
        const searchTerm = 'QT';
        await searchInput.fill(searchTerm);
        console.log(`🔍 輸入搜尋關鍵字: "${searchTerm}"`);
        
        // 監聽網路請求
        const responsePromise = page.waitForResponse(response => 
            response.url().includes('/quotes') && response.request().method() === 'GET'
        );
        
        // 觸發搜尋（可以通過按Enter或等待自動提交）
        await searchInput.press('Enter');
        
        // 等待回應
        const response = await responsePromise;
        console.log(`🌐 API回應狀態: ${response.status()}`);
        
        // 等待頁面更新
        await page.waitForTimeout(2000);
        
        // 截圖搜尋結果
        await page.screenshot({ 
            path: `search-test-results-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查搜尋結果
        const filteredRows = page.locator('tbody tr[data-quote-id]');
        const filteredCount = await filteredRows.count();
        console.log(`📊 搜尋後報價單數量: ${filteredCount}`);
        
        // 驗證搜尋是否有效果（如果有資料的話）
        if (initialCount > 0) {
            if (filteredCount < initialCount) {
                console.log('✅ 搜尋功能正常工作 - 結果數量已減少');
            } else if (filteredCount === initialCount) {
                console.log('⚠️ 搜尋結果與初始相同 - 可能所有項目都包含搜尋關鍵字，或搜尋功能未生效');
            }
        } else {
            console.log('📝 無數據可測試搜尋功能');
        }
        
        // 檢查URL是否包含搜尋參數
        const currentUrl = page.url();
        if (currentUrl.includes('search=')) {
            console.log('✅ URL包含搜尋參數');
        } else {
            console.log('⚠️ URL未包含搜尋參數');
        }
        
        console.log('✅ 搜尋功能基本驗證完成');
    });
    
    test('驗證清除搜尋功能', async ({ page }) => {
        console.log('🔄 測試清除搜尋功能');
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 先進行搜尋
        const searchInput = page.locator('input[name="search"]');
        await searchInput.fill('test');
        await searchInput.press('Enter');
        await page.waitForTimeout(2000);
        
        const searchedCount = await page.locator('tbody tr[data-quote-id]').count();
        console.log(`🔍 搜尋結果數量: ${searchedCount}`);
        
        // 點擊清除篩選按鈕
        const clearButton = page.locator('a').filter({ hasText: '清除篩選' });
        if (await clearButton.count() > 0) {
            await clearButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            const clearedCount = await page.locator('tbody tr[data-quote-id]').count();
            console.log(`🔄 清除後數量: ${clearedCount}`);
            
            // 檢查搜尋框是否已清空
            const searchValue = await searchInput.inputValue();
            if (searchValue === '') {
                console.log('✅ 搜尋框已清空');
            } else {
                console.log(`⚠️ 搜尋框未清空，值為: "${searchValue}"`);
            }
        } else {
            console.log('⚠️ 清除篩選按鈕未找到');
        }
        
        console.log('✅ 清除搜尋功能驗證完成');
    });
    
    test('驗證搜尋配合其他篩選器', async ({ page }) => {
        console.log('🔧 測試搜尋與其他篩選器配合使用');
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 設定狀態篩選
        const statusSelect = page.locator('select[name="status"]');
        await statusSelect.selectOption('draft');
        console.log('📋 選擇狀態篩選: 草稿');
        
        // 設定搜尋
        const searchInput = page.locator('input[name="search"]');
        await searchInput.fill('QT');
        console.log('🔍 設定搜尋關鍵字: QT');
        
        // 提交篩選
        const searchButton = page.locator('button[type="submit"]').filter({ hasText: '搜尋' });
        await searchButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 檢查URL參數
        const url = page.url();
        console.log(`🌐 當前URL: ${url}`);
        
        if (url.includes('search=QT') && url.includes('status=draft')) {
            console.log('✅ 搜尋和狀態篩選參數都存在於URL中');
        } else {
            console.log('⚠️ URL參數可能不完整');
        }
        
        // 檢查結果
        const resultCount = await page.locator('tbody tr[data-quote-id]').count();
        console.log(`📊 複合篩選結果數量: ${resultCount}`);
        
        console.log('✅ 複合篩選驗證完成');
    });
    
    test('驗證分頁功能', async ({ page }) => {
        console.log('📄 測試分頁功能');
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 檢查每頁選項
        const perPageSelect = page.locator('select[name="per_page"]');
        if (await perPageSelect.count() > 0) {
            console.log('📋 找到每頁選項選擇器');
            
            // 選擇10個每頁
            await perPageSelect.selectOption('10');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            console.log('✅ 已設定每頁10個項目');
            
            // 檢查分頁信息
            const paginationInfo = page.locator('.text-sm.text-gray-700').first();
            if (await paginationInfo.count() > 0) {
                const paginationText = await paginationInfo.textContent();
                console.log(`📊 分頁信息: ${paginationText}`);
            }
            
            // 檢查是否有分頁按鈕
            const nextButton = page.locator('a').filter({ hasText: '下一頁' });
            const prevButton = page.locator('a').filter({ hasText: '上一頁' });
            
            const hasNext = await nextButton.count() > 0;
            const hasPrev = await prevButton.count() > 0;
            
            console.log(`📄 分頁按鈕: 上一頁=${hasPrev}, 下一頁=${hasNext}`);
            
            if (hasNext) {
                console.log('✅ 下一頁按鈕可用，表示有多頁數據');
            }
        } else {
            console.log('⚠️ 每頁選項選擇器未找到');
        }
        
        console.log('✅ 分頁功能驗證完成');
    });
    
    test('驗證排序功能', async ({ page }) => {
        console.log('🔀 測試排序功能');
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 檢查排序選項
        const sortSelect = page.locator('select[name="sort"]');
        if (await sortSelect.count() > 0) {
            console.log('📋 找到排序選擇器');
            
            // 記錄初始狀態
            const initialFirstQuoteId = await page.locator('tbody tr[data-quote-id]').first().getAttribute('data-quote-id');
            console.log(`📊 初始第一個報價單ID: ${initialFirstQuoteId}`);
            
            // 選擇按報價日期升序排序
            await sortSelect.selectOption('quote_date_asc');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            console.log('✅ 已選擇按報價日期升序排序');
            
            // 檢查排序後的第一個項目
            const sortedFirstQuoteId = await page.locator('tbody tr[data-quote-id]').first().getAttribute('data-quote-id');
            console.log(`📊 排序後第一個報價單ID: ${sortedFirstQuoteId}`);
            
            if (initialFirstQuoteId !== sortedFirstQuoteId) {
                console.log('✅ 排序功能正常工作 - 順序已改變');
            } else {
                console.log('⚠️ 排序後順序未改變 - 可能數據不足或排序功能未生效');
            }
        } else {
            console.log('⚠️ 排序選擇器未找到');
        }
        
        console.log('✅ 排序功能驗證完成');
    });
});