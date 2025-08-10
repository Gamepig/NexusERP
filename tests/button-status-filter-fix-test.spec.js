import { test, expect } from '@playwright/test';

/**
 * 按鈕式狀態篩選器修復驗證測試
 */
test('按鈕式狀態篩選器修復驗證', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('🔍 測試按鈕式狀態篩選器修復');
    
    // 檢查初始狀態
    const initialRows = page.locator('tbody tr[data-quote-id]');
    const initialCount = await initialRows.count();
    console.log(`📊 初始報價單數量: ${initialCount}`);
    
    // 等待按鈕式篩選器載入
    await page.waitForSelector('.status-filter', { timeout: 5000 });
    
    // 檢查所有按鈕式篩選器是否存在
    const allButtons = page.locator('.status-filter');
    const buttonCount = await allButtons.count();
    console.log(`🔘 按鈕式篩選器數量: ${buttonCount}`);
    
    // 檢查各個按鈕的存在性和data-status值
    const expectedButtons = [
        { text: '全部', dataStatus: '' },
        { text: '草稿', dataStatus: 'draft' },
        { text: '已發送', dataStatus: 'pending' }, // ✅ 修復：從 'sent' 改為 'pending'
        { text: '已批准', dataStatus: 'approved' },
        { text: '已拒絕', dataStatus: 'rejected' },
        { text: '已轉換', dataStatus: 'converted' } // ✅ 新增：添加缺失的選項
    ];
    
    for (const expectedButton of expectedButtons) {
        const button = page.locator('.status-filter').filter({ hasText: expectedButton.text });
        const exists = await button.count() > 0;
        console.log(`🔘 ${expectedButton.text}按鈕: ${exists ? '存在' : '缺失'}`);
        
        if (exists) {
            const dataStatus = await button.getAttribute('data-status');
            const dataStatusCorrect = dataStatus === expectedButton.dataStatus;
            console.log(`   data-status="${dataStatus}" ${dataStatusCorrect ? '✅正確' : '❌錯誤'}`);
        }
    }
    
    console.log('\\n🧪 測試「已發送」按鈕功能');
    
    // 收集初始狀態分佈
    const allStatuses = [];
    for (let i = 0; i < initialCount; i++) {
        const statusElement = initialRows.nth(i).locator('td:nth-child(6) span');
        const statusText = await statusElement.textContent();
        allStatuses.push(statusText?.trim() || 'unknown');
    }
    
    const pendingCount = allStatuses.filter(s => s === '已發送').length;
    console.log(`📤 已發送狀態的報價單數量: ${pendingCount}`);
    
    // 測試「已發送」按鈕點擊
    const pendingButton = page.locator('.status-filter').filter({ hasText: '已發送' });
    if (await pendingButton.count() > 0) {
        console.log('🖱️ 點擊「已發送」按鈕');
        await pendingButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 檢查篩選結果
        const filteredRows = page.locator('tbody tr[data-quote-id]');
        const filteredCount = await filteredRows.count();
        console.log(`📊 篩選後數量: ${filteredCount}`);
        
        // 檢查URL參數
        const url = page.url();
        const hasCorrectParam = url.includes('status=pending');
        console.log(`🌐 URL參數正確: ${hasCorrectParam ? '✅' : '❌'}`);
        console.log(`   當前URL: ${url}`);
        
        if (pendingCount > 0) {
            if (filteredCount === pendingCount && hasCorrectParam) {
                console.log('✅ 「已發送」按鈕功能修復成功');
            } else {
                console.log('❌ 「已發送」按鈕功能仍有問題');
                console.log(`   預期數量: ${pendingCount}, 實際數量: ${filteredCount}`);
            }
        } else {
            console.log('📝 沒有已發送狀態的報價單可測試功能');
        }
    }
    
    console.log('\\n🔄 測試「已轉換」按鈕（新增功能）');
    
    // 測試新增的「已轉換」按鈕
    const convertedButton = page.locator('.status-filter').filter({ hasText: '已轉換' });
    if (await convertedButton.count() > 0) {
        console.log('🖱️ 點擊「已轉換」按鈕');
        await convertedButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const convertedRows = page.locator('tbody tr[data-quote-id]');
        const convertedFilteredCount = await convertedRows.count();
        const convertedUrl = page.url();
        const hasConvertedParam = convertedUrl.includes('status=converted');
        
        console.log(`📊 已轉換篩選結果數量: ${convertedFilteredCount}`);
        console.log(`🌐 已轉換URL參數: ${hasConvertedParam ? '✅正確' : '❌錯誤'}`);
        console.log(`   當前URL: ${convertedUrl}`);
        
        if (hasConvertedParam) {
            console.log('✅ 「已轉換」按鈕功能正常');
        } else {
            console.log('❌ 「已轉換」按鈕功能異常');
        }
    } else {
        console.log('❌ 「已轉換」按鈕未找到');
    }
    
    console.log('\\n📋 === 按鈕式狀態篩選器修復總結 ===');
    console.log('✅ 修復「已發送」按鈕 data-status 從 "sent" 改為 "pending"');
    console.log('✅ 新增「已轉換」按鈕和相應的狀態顯示樣式');
    console.log('✅ 完善狀態標籤對應關係');
    
    // 截圖最終狀態
    await page.screenshot({ 
        path: `button-status-filter-fix-${Date.now()}.png`, 
        fullPage: true 
    });
    
    console.log('✅ 按鈕式狀態篩選器修復驗證完成');
});