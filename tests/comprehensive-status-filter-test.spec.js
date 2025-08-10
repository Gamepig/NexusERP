import { test, expect } from '@playwright/test';

test('全面狀態篩選測試', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('🔍 全面測試所有狀態篩選');
    
    // 記錄初始狀態分佈
    const initialRows = page.locator('tbody tr[data-quote-id]');
    const initialCount = await initialRows.count();
    console.log(`📊 初始報價單總數: ${initialCount}`);
    
    const allStatuses = [];
    for (let i = 0; i < initialCount; i++) {
        const statusElement = initialRows.nth(i).locator('td:nth-child(6) span');
        const statusText = await statusElement.textContent();
        allStatuses.push(statusText?.trim() || 'unknown');
    }
    
    const statusDistribution = {};
    allStatuses.forEach(status => {
        statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });
    console.log('📋 初始狀態分佈:', statusDistribution);
    
    // 測試各種狀態篩選
    const statusTests = [
        { value: '', label: '全部狀態', expectedCount: initialCount },
        { value: 'draft', label: '草稿', expectedCount: statusDistribution['草稿'] || 0 },
        { value: 'pending', label: '已發送', expectedCount: statusDistribution['已發送'] || 0 },
        { value: 'approved', label: '已批准', expectedCount: statusDistribution['已批准'] || 0 }
    ];
    
    for (const testCase of statusTests) {
        console.log(`\\n🧪 測試狀態: ${testCase.label} (value: ${testCase.value})`);
        
        const statusSelect = page.locator('select[name="status"]');
        await statusSelect.selectOption(testCase.value);
        
        // 等待自動提交和頁面更新
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const filteredRows = page.locator('tbody tr[data-quote-id]');
        const filteredCount = await filteredRows.count();
        console.log(`📊 篩選結果數量: ${filteredCount}`);
        
        if (testCase.expectedCount > 0) {
            console.log(`📋 預期數量: ${testCase.expectedCount}`);
            
            // 檢查篩選後的狀態是否正確
            const filteredStatuses = [];
            for (let i = 0; i < Math.min(filteredCount, 10); i++) {
                const statusElement = filteredRows.nth(i).locator('td:nth-child(6) span');
                const statusText = await statusElement.textContent();
                filteredStatuses.push(statusText?.trim() || 'unknown');
            }
            
            const uniqueFilteredStatuses = [...new Set(filteredStatuses)];
            console.log(`📋 篩選後狀態: ${uniqueFilteredStatuses.join(', ')}`);
            
            // 驗證篩選邏輯
            if (testCase.value === '') {
                // 全部狀態應該顯示所有記錄
                if (filteredCount === testCase.expectedCount) {
                    console.log('✅ 全部狀態篩選正確');
                } else {
                    console.log(`❌ 全部狀態篩選錯誤: 期望${testCase.expectedCount}, 實際${filteredCount}`);
                }
            } else {
                // 特定狀態篩選
                const expectedLabel = testCase.label;
                const correctStatusFilter = uniqueFilteredStatuses.every(s => 
                    s === expectedLabel || (testCase.value === 'pending' && s === '已發送')
                );
                
                if (correctStatusFilter && filteredCount === testCase.expectedCount) {
                    console.log(`✅ ${testCase.label}狀態篩選正確`);
                } else {
                    console.log(`❌ ${testCase.label}狀態篩選有問題`);
                    console.log(`   狀態正確: ${correctStatusFilter}`);
                    console.log(`   數量正確: ${filteredCount === testCase.expectedCount}`);
                }
            }
        } else {
            console.log(`📝 沒有${testCase.label}狀態的報價單`);
        }
        
        // 檢查 URL 參數
        const url = page.url();
        if (testCase.value && !url.includes(`status=${testCase.value}`)) {
            console.log(`⚠️ URL 參數不正確: ${url}`);
        }
    }
    
    console.log('\\n✅ 狀態篩選全面測試完成');
    
    // 截圖最終狀態
    await page.screenshot({ 
        path: `comprehensive-status-filter-test-${Date.now()}.png`, 
        fullPage: true 
    });
});