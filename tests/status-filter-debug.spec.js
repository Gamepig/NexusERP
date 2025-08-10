import { test, expect } from '@playwright/test';

test('檢查已發送狀態篩選問題', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('🔍 測試已發送狀態篩選');
    
    // 檢查初始狀態
    const initialRows = page.locator('tbody tr[data-quote-id]');
    const initialCount = await initialRows.count();
    console.log(`📊 初始報價單數量: ${initialCount}`);
    
    // 收集所有狀態
    const allStatuses = [];
    for (let i = 0; i < initialCount; i++) {
        const statusElement = initialRows.nth(i).locator('td:nth-child(6) span');
        const statusText = await statusElement.textContent();
        allStatuses.push(statusText?.trim() || 'unknown');
    }
    console.log(`📋 所有狀態: ${[...new Set(allStatuses)].join(', ')}`);
    
    // 檢查是否有「已發送」狀態的報價單
    const pendingCount = allStatuses.filter(s => s === '已發送').length;
    console.log(`📤 已發送狀態的報價單數量: ${pendingCount}`);
    
    // 選擇「已發送」狀態
    const statusSelect = page.locator('select[name="status"]');
    await statusSelect.selectOption('pending');
    
    // 檢查是否會自動提交
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 檢查篩選後結果
    const filteredRows = page.locator('tbody tr[data-quote-id]');
    const filteredCount = await filteredRows.count();
    console.log(`📊 篩選後數量: ${filteredCount}`);
    
    // 檢查篩選後的狀態
    const filteredStatuses = [];
    for (let i = 0; i < filteredCount; i++) {
        const statusElement = filteredRows.nth(i).locator('td:nth-child(6) span');
        const statusText = await statusElement.textContent();
        filteredStatuses.push(statusText?.trim() || 'unknown');
    }
    console.log(`📋 篩選後狀態: ${[...new Set(filteredStatuses)].join(', ')}`);
    
    // 檢查URL參數
    const url = page.url();
    console.log(`🌐 當前URL: ${url}`);
    
    if (pendingCount > 0) {
        if (filteredCount === pendingCount && filteredStatuses.every(s => s === '已發送')) {
            console.log('✅ 已發送狀態篩選正常工作');
        } else {
            console.log('❌ 已發送狀態篩選有問題');
            console.log(`   預期數量: ${pendingCount}, 實際數量: ${filteredCount}`);
        }
    } else {
        console.log('📝 沒有已發送狀態的報價單可測試');
    }
    
    await page.screenshot({ 
        path: `status-filter-debug-${Date.now()}.png`, 
        fullPage: true 
    });
});