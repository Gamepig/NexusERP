import { test, expect } from '@playwright/test';

/**
 * 簡化的分頁功能測試
 */
test.describe('簡化分頁功能測試', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('檢查分頁功能存在性和手機版問題', async ({ page }) => {
        console.log('🔍 檢查分頁功能基本存在性');
        
        // 桌面版檢查
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/quotes?per_page=10');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖桌面版
        await page.screenshot({ 
            path: `pagination-check-desktop-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查桌面版分頁區域
        const desktopPaginationInfo = page.locator('div:has-text("顯示第")').first();
        const desktopPaginationExists = await desktopPaginationInfo.count() > 0;
        console.log(`🖥️ 桌面版分頁資訊存在: ${desktopPaginationExists}`);
        
        if (desktopPaginationExists) {
            const paginationText = await desktopPaginationInfo.textContent();
            console.log(`📊 桌面版分頁資訊: ${paginationText}`);
        }
        
        // 檢查桌面版分頁按鈕
        const desktopNextButton = page.locator('a:has-text("下一頁")');
        const desktopPrevButton = page.locator('a:has-text("上一頁")');
        const desktopPageNumbers = page.locator('a').filter({ hasText: /^[0-9]+$/ });
        
        const hasDesktopNext = await desktopNextButton.count() > 0;
        const hasDesktopPrev = await desktopPrevButton.count() > 0;
        const hasDesktopPageNumbers = await desktopPageNumbers.count() > 0;
        
        console.log(`🖥️ 桌面版分頁按鈕: 上一頁=${hasDesktopPrev}, 下一頁=${hasDesktopNext}, 頁碼=${hasDesktopPageNumbers}`);
        
        // 手機版檢查
        console.log('\\n📱 切換到手機版檢查');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖手機版
        await page.screenshot({ 
            path: `pagination-check-mobile-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查手機版分頁
        const mobilePaginationInfo = page.locator('.block.md\\:hidden div:has-text("顯示第")').first();
        const mobilePaginationExists = await mobilePaginationInfo.count() > 0;
        console.log(`📱 手機版專用分頁存在: ${mobilePaginationExists}`);
        
        // 檢查桌面版分頁在手機版是否可見
        const desktopPaginationInMobile = await desktopPaginationInfo.isVisible();
        console.log(`🖥️→📱 桌面版分頁在手機版可見: ${desktopPaginationInMobile}`);
        
        // 分析問題
        if (desktopPaginationExists && !mobilePaginationExists) {
            if (desktopPaginationInMobile) {
                console.log('⚠️ 問題診斷: 手機版使用桌面版分頁，可能響應式設計有問題');
            } else {
                console.log('❌ 問題診斷: 手機版無分頁功能！這是主要問題');
            }
        } else if (desktopPaginationExists && mobilePaginationExists) {
            console.log('✅ 桌面版和手機版都有分頁功能');
        } else {
            console.log('📝 無分頁（數據不足一頁）');
        }
        
        // 檢查手機版卡片數量
        const mobileCards = page.locator('.block.md\\:hidden .space-y-4 > div');
        const cardCount = await mobileCards.count();
        console.log(`📱 手機版卡片數量: ${cardCount}`);
        
        // 檢查總數據量
        const tableRows = page.locator('tbody tr[data-quote-id]');
        const rowCount = await tableRows.count();
        console.log(`📊 桌面版表格行數: ${rowCount}`);
        
        console.log('\\n📋 問題總結:');
        if (!mobilePaginationExists && desktopPaginationExists) {
            console.log('❌ 主要問題: 手機版缺少分頁控制項');
        }
        if (!desktopPaginationInMobile && desktopPaginationExists) {
            console.log('❌ 響應式問題: 桌面版分頁在手機版被隱藏');
        }
    });
    
    test('測試現有分頁功能運作', async ({ page }) => {
        console.log('🔧 測試現有分頁功能');
        
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/quotes?per_page=10&page=1');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 檢查當前頁面資訊
        const paginationInfo = page.locator('div:has-text("顯示第")').first();
        if (await paginationInfo.count() > 0) {
            const paginationText = await paginationInfo.textContent();
            console.log(`📊 當前分頁狀態: ${paginationText}`);
            
            // 測試下一頁功能
            const nextButton = page.locator('a:has-text("下一頁")');
            if (await nextButton.count() > 0) {
                console.log('🔄 測試下一頁功能...');
                
                // 記錄當前第一個項目
                const currentFirstItem = await page.locator('tbody tr[data-quote-id]').first().getAttribute('data-quote-id');
                console.log(`📄 第一頁第一項: ${currentFirstItem}`);
                
                await nextButton.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);
                
                // 記錄第二頁第一個項目
                const nextPageFirstItem = await page.locator('tbody tr[data-quote-id]').first().getAttribute('data-quote-id');
                console.log(`📄 第二頁第一項: ${nextPageFirstItem}`);
                
                if (currentFirstItem !== nextPageFirstItem) {
                    console.log('✅ 下一頁功能正常');
                } else {
                    console.log('⚠️ 下一頁可能有問題');
                }
                
                // 測試上一頁功能
                const prevButton = page.locator('a:has-text("上一頁")');
                if (await prevButton.count() > 0) {
                    console.log('🔄 測試上一頁功能...');
                    
                    await prevButton.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(2000);
                    
                    const backToFirstItem = await page.locator('tbody tr[data-quote-id]').first().getAttribute('data-quote-id');
                    console.log(`📄 回到第一頁第一項: ${backToFirstItem}`);
                    
                    if (currentFirstItem === backToFirstItem) {
                        console.log('✅ 上一頁功能正常');
                    } else {
                        console.log('⚠️ 上一頁可能有問題');
                    }
                }
            } else {
                console.log('📝 只有一頁數據，無下一頁按鈕');
            }
        } else {
            console.log('📝 無分頁資訊顯示');
        }
    });
});