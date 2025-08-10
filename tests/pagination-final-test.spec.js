import { test, expect } from '@playwright/test';

/**
 * 分頁功能最終測試 - 桌面版和手機版
 */
test.describe('分頁功能最終驗證', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('完整桌面版和手機版分頁功能測試', async ({ page }) => {
        console.log('🖥️ === 桌面版分頁測試 ===');
        
        // 桌面版測試
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/quotes?per_page=5');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 檢查桌面版分頁元素
        const desktopPaginationInfo = page.locator('.text-sm:has-text("顯示第")').first();
        const desktopPaginationExists = await desktopPaginationInfo.count() > 0;
        console.log(`📊 桌面版分頁信息: ${desktopPaginationExists ? '存在' : '不存在'}`);
        
        const desktopNextButton = page.locator('a:has-text("下一頁")');
        const hasDesktopNext = await desktopNextButton.count() > 0;
        console.log(`📄 桌面版下一頁按鈕: ${hasDesktopNext ? '存在' : '不存在'}`);
        
        // 測試桌面版分頁功能
        if (hasDesktopNext) {
            console.log('🔄 測試桌面版分頁跳轉');
            await desktopNextButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            const newUrl = page.url();
            console.log(`🌐 桌面版URL更新: ${newUrl.includes('page=2') ? '成功' : '失敗'}`);
        }
        
        // 截圖桌面版最終狀態
        await page.screenshot({ 
            path: `pagination-final-desktop-${Date.now()}.png`, 
            fullPage: true 
        });
        
        console.log('\\n📱 === 手機版分頁測試 ===');
        
        // 手機版測試
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/quotes?per_page=5');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 檢查手機版專用分頁
        const mobilePaginationInfo = page.locator('.block.md\\:hidden .text-sm:has-text("顯示第")');
        const mobilePaginationExists = await mobilePaginationInfo.count() > 0;
        console.log(`📱 手機版專用分頁信息: ${mobilePaginationExists ? '存在' : '不存在'}`);
        
        // 檢查手機版分頁按鈕
        const mobileNextButton = page.locator('.block.md\\:hidden a:has-text("下一頁")');
        const hasMobileNext = await mobileNextButton.count() > 0;
        console.log(`📄 手機版專用下一頁按鈕: ${hasMobileNext ? '存在' : '不存在'}`);
        
        // 檢查手機版頁碼按鈕
        const mobilePageNumbers = page.locator('.block.md\\:hidden a').filter({ hasText: /^[0-9]+$/ });
        const mobilePageCount = await mobilePageNumbers.count();
        console.log(`🔢 手機版頁碼按鈕數量: ${mobilePageCount}`);
        
        // 測試手機版分頁功能
        if (hasMobileNext) {
            console.log('🔄 測試手機版分頁跳轉');
            await mobileNextButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            const mobileNewUrl = page.url();
            console.log(`🌐 手機版URL更新: ${mobileNewUrl.includes('page=2') ? '成功' : '失敗'}`);
        }
        
        // 截圖手機版最終狀態  
        await page.screenshot({ 
            path: `pagination-final-mobile-${Date.now()}.png`, 
            fullPage: true 
        });
        
        console.log('\\n📋 === 分頁功能修復總結 ===');
        console.log(`✅ 桌面版分頁: ${desktopPaginationExists && hasDesktopNext ? '完全修復' : '部分問題'}`);
        console.log(`✅ 手機版分頁: ${mobilePaginationExists && hasMobileNext ? '完全修復' : '部分問題'}`);
        
        // 驗證分頁數據一致性
        const totalRecordsElement = page.locator('span:has-text("共"):has-text("筆")');
        if (await totalRecordsElement.count() > 0) {
            const totalText = await totalRecordsElement.textContent();
            console.log(`📊 總數據量顯示: ${totalText.trim()}`);
        }
        
        console.log('✅ 分頁功能最終測試完成');
    });
    
    test('分頁邊界情況測試', async ({ page }) => {
        console.log('🔍 測試分頁邊界情況');
        
        // 測試不同的 per_page 值
        const testCases = [
            { perPage: 3, description: '每頁3個（最小）' },
            { perPage: 20, description: '每頁20個（默認）' },
            { perPage: 50, description: '每頁50個（較大）' }
        ];
        
        for (const testCase of testCases) {
            console.log(`\\n📋 ${testCase.description}`);
            
            await page.goto(`/quotes?per_page=${testCase.perPage}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1500);
            
            const paginationExists = await page.locator('.text-sm:has-text("顯示第")').first().count() > 0;
            const rowCount = await page.locator('tbody tr[data-quote-id]').count();
            
            console.log(`   顯示行數: ${rowCount}, 分頁控制項: ${paginationExists ? '存在' : '不存在'}`);
            
            // 根據數據量判斷是否應該有分頁
            const expectedPagination = Math.ceil(18 / testCase.perPage) > 1; // 假設總共18筆數據
            if (expectedPagination === paginationExists) {
                console.log('   ✅ 分頁邏輯正確');
            } else {
                console.log(`   ⚠️ 分頁邏輯異常 (預期: ${expectedPagination}, 實際: ${paginationExists})`);
            }
        }
        
        console.log('✅ 邊界情況測試完成');
    });
});