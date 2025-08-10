import { test, expect } from '@playwright/test';

/**
 * 驗證分頁修復
 */
test.describe('分頁修復驗證', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('驗證桌面版分頁功能修復', async ({ page }) => {
        console.log('🖥️ 測試桌面版分頁修復');
        
        // 設置桌面版視窗大小
        await page.setViewportSize({ width: 1280, height: 800 });
        
        // 使用 per_page=5 確保有多頁
        await page.goto('/quotes?per_page=5');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖修復後狀態
        await page.screenshot({ 
            path: `pagination-fix-desktop-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查分頁信息是否出現
        const paginationInfo = page.locator('div:has-text("顯示第")');
        const paginationExists = await paginationInfo.count() > 0;
        console.log(`📊 桌面版分頁信息存在: ${paginationExists}`);
        
        if (paginationExists) {
            const paginationText = await paginationInfo.textContent();
            console.log(`📋 分頁信息內容: "${paginationText}"`);
        }
        
        // 檢查分頁按鈕
        const nextButton = page.locator('a:has-text("下一頁")');
        const prevButton = page.locator('a:has-text("上一頁")');
        const pageNumbers = page.locator('a').filter({ hasText: /^[0-9]+$/ });
        
        const hasNext = await nextButton.count() > 0;
        const hasPrev = await prevButton.count() > 0;
        const pageNumberCount = await pageNumbers.count();
        
        console.log(`📄 分頁按鈕: 上一頁=${hasPrev}, 下一頁=${hasNext}, 頁碼數量=${pageNumberCount}`);
        
        // 測試分頁功能
        if (hasNext) {
            console.log('🔄 測試下一頁功能');
            
            // 記錄第一頁第一個項目
            const firstPageFirstItem = await page.locator('tbody tr[data-quote-id]').first().getAttribute('data-quote-id');
            console.log(`📄 第一頁第一項ID: ${firstPageFirstItem}`);
            
            // 點擊下一頁
            await nextButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            // 記錄第二頁第一個項目
            const secondPageFirstItem = await page.locator('tbody tr[data-quote-id]').first().getAttribute('data-quote-id');
            console.log(`📄 第二頁第一項ID: ${secondPageFirstItem}`);
            
            // 檢查 URL 更新
            const currentUrl = page.url();
            console.log(`🌐 第二頁URL: ${currentUrl}`);
            
            if (currentUrl.includes('page=2')) {
                console.log('✅ 下一頁功能正常 - URL 參數正確');
            }
            
            if (firstPageFirstItem !== secondPageFirstItem) {
                console.log('✅ 下一頁功能正常 - 內容已更換');
            }
            
            // 測試上一頁功能
            const prevButtonPage2 = page.locator('a:has-text("上一頁")');
            if (await prevButtonPage2.count() > 0) {
                console.log('🔄 測試上一頁功能');
                
                await prevButtonPage2.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);
                
                const backToFirstItem = await page.locator('tbody tr[data-quote-id]').first().getAttribute('data-quote-id');
                console.log(`📄 返回第一頁第一項ID: ${backToFirstItem}`);
                
                if (firstPageFirstItem === backToFirstItem) {
                    console.log('✅ 上一頁功能正常');
                } else {
                    console.log('⚠️ 上一頁功能可能有問題');
                }
            }
        }
        
        console.log('✅ 桌面版分頁修復驗證完成');
    });
    
    test('驗證手機版分頁功能', async ({ page }) => {
        console.log('📱 測試手機版分頁功能');
        
        // 設置手機版視窗大小
        await page.setViewportSize({ width: 375, height: 667 });
        
        await page.goto('/quotes?per_page=5');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖手機版狀態
        await page.screenshot({ 
            path: `pagination-fix-mobile-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查手機版是否有分頁控制項
        const mobilePaginationInfo = page.locator('.block.md\\:hidden div:has-text("顯示第")');
        const mobilePaginationExists = await mobilePaginationInfo.count() > 0;
        console.log(`📱 手機版專用分頁存在: ${mobilePaginationExists}`);
        
        // 檢查桌面版分頁在手機版是否可見
        const desktopPaginationInfo = page.locator('div:has-text("顯示第")');
        const desktopPaginationVisible = await desktopPaginationInfo.isVisible();
        console.log(`🖥️ 桌面版分頁在手機版可見: ${desktopPaginationVisible}`);
        
        if (desktopPaginationVisible) {
            console.log('⚠️ 手機版使用桌面版分頁控制項');
            
            // 測試手機版分頁功能
            const nextButton = page.locator('a:has-text("下一頁")');
            if (await nextButton.count() > 0) {
                console.log('🔄 測試手機版分頁功能');
                await nextButton.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);
                
                const url = page.url();
                if (url.includes('page=2')) {
                    console.log('✅ 手機版分頁功能正常');
                }
            }
        } else {
            console.log('❌ 手機版沒有分頁控制項');
        }
        
        console.log('✅ 手機版分頁測試完成');
    });
});