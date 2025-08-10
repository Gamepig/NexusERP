import { test, expect } from '@playwright/test';

/**
 * 測試分頁功能的實際問題
 */
test.describe('分頁功能測試', () => {
    
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

    test('檢查桌面版分頁功能', async ({ page }) => {
        console.log('🖥️ 測試桌面版分頁功能');
        
        // 設置桌面版視窗大小
        await page.setViewportSize({ width: 1280, height: 800 });
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 設置少量每頁顯示項目以確保有多頁
        const perPageSelect = page.locator('select[name="per_page"]');
        await perPageSelect.selectOption('5');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖初始狀態
        await page.screenshot({ 
            path: `pagination-desktop-initial-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查分頁區域是否存在
        const paginationSection = page.locator('div:has-text("顯示第")').first();
        const paginationExists = await paginationSection.count() > 0;
        console.log(`📊 桌面版分頁區域存在: ${paginationExists}`);
        
        if (paginationExists) {
            const paginationText = await paginationSection.textContent();
            console.log(`📋 分頁資訊: ${paginationText}`);
            
            // 檢查分頁按鈕
            const nextButton = page.locator('a:has-text("下一頁")');
            const prevButton = page.locator('a:has-text("上一頁")');
            
            const hasNext = await nextButton.count() > 0;
            const hasPrev = await prevButton.count() > 0;
            
            console.log(`📄 分頁按鈕: 上一頁=${hasPrev}, 下一頁=${hasNext}`);
            
            // 如果有下一頁，測試點擊
            if (hasNext) {
                console.log('🔄 測試點擊下一頁...');
                await nextButton.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);
                
                // 截圖第二頁
                await page.screenshot({ 
                    path: `pagination-desktop-page2-${Date.now()}.png`, 
                    fullPage: true 
                });
                
                // 檢查URL是否包含page參數
                const currentUrl = page.url();
                console.log(`🌐 第二頁URL: ${currentUrl}`);
                
                if (currentUrl.includes('page=2')) {
                    console.log('✅ 分頁功能正常工作');
                } else {
                    console.log('⚠️ 分頁URL參數可能有問題');
                }
            }
        } else {
            console.log('📝 沒有分頁（可能數據不足）');
        }
    });
    
    test('檢查手機版分頁功能', async ({ page }) => {
        console.log('📱 測試手機版分頁功能');
        
        // 設置手機版視窗大小
        await page.setViewportSize({ width: 375, height: 667 });
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 設置少量每頁顯示項目
        const perPageSelect = page.locator('select[name="per_page"]');
        await perPageSelect.selectOption('5');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖手機版初始狀態
        await page.screenshot({ 
            path: `pagination-mobile-initial-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查手機版是否有分頁控制
        const mobilePaginationSection = page.locator('.block.md\\:hidden div:has-text("顯示第")').first();
        const mobilePaginationExists = await mobilePaginationSection.count() > 0;
        console.log(`📱 手機版分頁區域存在: ${mobilePaginationExists}`);
        
        // 檢查桌面版分頁在手機版是否隱藏
        const desktopPagination = page.locator('div:has-text("顯示第")').first();
        const desktopPaginationVisible = await desktopPagination.isVisible();
        console.log(`🖥️ 桌面版分頁在手機版是否可見: ${desktopPaginationVisible}`);
        
        if (!mobilePaginationExists && !desktopPaginationVisible) {
            console.log('❌ 手機版無分頁功能 - 這是問題所在！');
        } else if (desktopPaginationVisible) {
            console.log('⚠️ 手機版顯示桌面版分頁 - 可能響應式設計有問題');
        } else {
            console.log('✅ 手機版有專用分頁功能');
        }
        
        // 檢查手機版卡片數量
        const mobileCards = page.locator('.block.md\\:hidden .bg-white.dark\\:bg-gray-800');
        const cardCount = await mobileCards.count();
        console.log(`📱 手機版顯示卡片數量: ${cardCount}`);
    });
    
    test('測試分頁數據一致性', async ({ page }) => {
        console.log('🔄 測試分頁數據一致性');
        
        await page.goto('/quotes?per_page=10');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 記錄第一頁的第一個報價單
        const firstPageFirstItem = await page.locator('tbody tr[data-quote-id]').first().getAttribute('data-quote-id');
        console.log(`📄 第一頁第一個項目ID: ${firstPageFirstItem}`);
        
        // 檢查是否有下一頁
        const nextButton = page.locator('a:has-text("下一頁")');
        const hasNext = await nextButton.count() > 0;
        
        if (hasNext) {
            // 前往第二頁
            await nextButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            // 記錄第二頁的第一個報價單
            const secondPageFirstItem = await page.locator('tbody tr[data-quote-id]').first().getAttribute('data-quote-id');
            console.log(`📄 第二頁第一個項目ID: ${secondPageFirstItem}`);
            
            // 檢查是否不同
            if (firstPageFirstItem !== secondPageFirstItem) {
                console.log('✅ 分頁數據一致性正常');
            } else {
                console.log('⚠️ 分頁可能顯示重複數據');
            }
            
            // 測試回到第一頁
            const prevButton = page.locator('a:has-text("上一頁")');
            if (await prevButton.count() > 0) {
                await prevButton.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);
                
                const backToFirstItem = await page.locator('tbody tr[data-quote-id]').first().getAttribute('data-quote-id');
                console.log(`📄 返回第一頁第一個項目ID: ${backToFirstItem}`);
                
                if (firstPageFirstItem === backToFirstItem) {
                    console.log('✅ 上一頁功能正常');
                } else {
                    console.log('⚠️ 上一頁功能可能有問題');
                }
            }
        } else {
            console.log('📝 只有一頁數據，無法測試分頁功能');
        }
    });
});