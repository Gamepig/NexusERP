import { test, expect } from '@playwright/test';

/**
 * 調試分頁數據結構問題
 */
test.describe('分頁數據結構調試', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('分析分頁數據結構問題', async ({ page }) => {
        console.log('🔍 調試分頁數據結構');
        
        // 觸發 Laravel 日志記錄
        await page.goto('/quotes?per_page=10');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 使用頁面腳本檢查實際傳遞給 Blade 模板的數據
        const pageData = await page.evaluate(() => {
            // 嘗試從各種可能的地方獲取數據
            const metaElements = document.querySelectorAll('meta[name]');
            const result = {
                meta: {},
                url: window.location.href,
                urlParams: new URLSearchParams(window.location.search)
            };
            
            metaElements.forEach(meta => {
                result.meta[meta.name] = meta.content;
            });
            
            return result;
        });
        
        console.log('📊 頁面數據:', JSON.stringify(pageData, null, 2));
        
        // 檢查分頁元素是否存在
        const paginationInfo = page.locator('div:has-text("顯示第")');
        const paginationExists = await paginationInfo.count() > 0;
        console.log(`📄 分頁信息元素存在: ${paginationExists}`);
        
        if (paginationExists) {
            const paginationText = await paginationInfo.textContent();
            console.log(`📊 分頁信息內容: "${paginationText}"`);
        }
        
        // 檢查分頁按鈕
        const nextButton = page.locator('a:has-text("下一頁")');
        const prevButton = page.locator('a:has-text("上一頁")'); 
        const pageNumbers = page.locator('a').filter({ hasText: /^[0-9]+$/ });
        
        const hasNext = await nextButton.count() > 0;
        const hasPrev = await prevButton.count() > 0;
        const hasPageNumbers = await pageNumbers.count() > 0;
        
        console.log(`📄 分頁按鈕: 上一頁=${hasPrev}, 下一頁=${hasNext}, 頁碼=${hasPageNumbers}`);
        
        // 檢查條件判斷邏輯
        const totalRecords = await page.locator('.text-slate-600:has-text("共")').textContent().catch(() => null);
        console.log(`📊 總記錄數顯示: "${totalRecords}"`);
        
        // 模擬分頁條件檢查
        const tableRows = page.locator('tbody tr[data-quote-id]');
        const rowCount = await tableRows.count();
        console.log(`📊 實際顯示行數: ${rowCount}`);
        
        // 檢查 URL 參數
        const currentUrl = page.url();
        const urlObj = new URL(currentUrl);
        console.log(`🌐 當前 URL 參數:`, Object.fromEntries(urlObj.searchParams));
        
        console.log('\\n🔍 問題診斷:');
        console.log(`1. 頁面有 ${rowCount} 行數據`);
        console.log(`2. 分頁控制項存在: ${paginationExists}`);
        console.log(`3. URL 中 per_page=${urlObj.searchParams.get('per_page') || '默認20'}`);
        
        if (rowCount >= 10 && !paginationExists) {
            console.log('❌ 問題確認: 有足夠的數據但沒有分頁控制項');
            console.log('   可能原因: Laravel 控制器中的分頁數據結構問題');
        }
        
        // 截圖當前狀態
        await page.screenshot({ 
            path: `pagination-debug-${Date.now()}.png`, 
            fullPage: true 
        });
        
        console.log('✅ 調試完成');
    });
    
    test('強制觸發分頁條件', async ({ page }) => {
        console.log('🧪 強制觸發分頁條件測試');
        
        // 嘗試使用不同的 per_page 值
        const testCases = [
            { perPage: 5, description: '每頁5個（應該有多頁）' },
            { perPage: 10, description: '每頁10個' },
            { perPage: 15, description: '每頁15個' }
        ];
        
        for (const testCase of testCases) {
            console.log(`\\n📋 測試: ${testCase.description}`);
            
            await page.goto(`/quotes?per_page=${testCase.perPage}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            const rowCount = await page.locator('tbody tr[data-quote-id]').count();
            const paginationExists = await page.locator('div:has-text("顯示第")').count() > 0;
            
            console.log(`   顯示行數: ${rowCount}, 分頁控制項: ${paginationExists}`);
            
            if (paginationExists) {
                const paginationText = await page.locator('div:has-text("顯示第")').textContent();
                console.log(`   分頁信息: ${paginationText}`);
                break; // 找到有分頁的情況就停止
            }
        }
        
        console.log('✅ 強制觸發測試完成');
    });
});