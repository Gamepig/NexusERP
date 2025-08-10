import { test, expect } from '@playwright/test';

/**
 * 驗證報價狀態修復是否成功
 */
test.describe('報價狀態修復驗證', () => {
    
    test.beforeEach(async ({ page }) => {
        // 登入
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('驗證新建立的報價狀態正確顯示為已發送', async ({ page }) => {
        console.log('🧪 驗證報價狀態修復');
        
        // 前往建立頁面
        await page.goto('/quotes/create');
        await page.waitForLoadState('networkidle');
        
        // 快速填寫表單
        await page.selectOption('select[name="customer_id"]', { index: 1 });
        await page.fill('input[name="quote_date"]', '2025-08-08');
        await page.fill('input[name="valid_until"]', '2025-09-08');
        
        // 🎯 關鍵：選擇已發送狀態
        await page.selectOption('select[name="status"]', 'pending');
        console.log('✅ 已選擇狀態為 pending（已發送）');
        
        // 填寫產品
        await page.fill('input[name="items[0][name]"]', '狀態驗證商品');
        await page.fill('input[name="items[0][quantity]"]', '1');
        await page.fill('input[name="items[0][unit_price]"]', '100');
        await page.fill('textarea[name="notes"]', '狀態修復驗證測試');
        
        // 提交表單
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // 檢查跳轉後的URL
        const finalUrl = page.url();
        console.log(`建立後的 URL: ${finalUrl}`);
        
        expect(finalUrl).toContain('/quotes/');
        
        // 截圖新建立的報價詳情
        await page.screenshot({ 
            path: `quote-status-fix-verification-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查狀態顯示
        const pageText = await page.textContent('body');
        
        // 應該顯示"已發送"而不是"草稿"
        if (pageText.includes('已發送') || pageText.includes('Pending')) {
            console.log('✅ 狀態修復成功：顯示為已發送');
        } else if (pageText.includes('草稿') || pageText.includes('Draft')) {
            console.log('❌ 狀態修復失敗：仍顯示為草稿');
            throw new Error('報價狀態仍為草稿，修復未成功');
        }
        
        // 回到列表頁檢查
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 查找最新的報價（通常在第一行）
        const firstRow = page.locator('tbody tr').first();
        if (await firstRow.count() > 0) {
            const rowText = await firstRow.textContent();
            console.log('列表頁第一行報價:', rowText);
            
            // 檢查是否包含"已發送"狀態
            if (rowText.includes('已發送') || rowText.includes('pending')) {
                console.log('✅ 列表頁狀態顯示正確：已發送');
            } else if (rowText.includes('草稿') || rowText.includes('draft')) {
                console.log('❌ 列表頁狀態顯示錯誤：草稿');
                throw new Error('列表頁報價狀態仍為草稿');
            }
        }
        
        console.log('✅ 報價狀態修復驗證完成');
    });
    
    test('驗證已批准狀態也能正確保存', async ({ page }) => {
        console.log('🧪 驗證已批准狀態');
        
        // 前往建立頁面
        await page.goto('/quotes/create');
        await page.waitForLoadState('networkidle');
        
        // 快速填寫表單
        await page.selectOption('select[name="customer_id"]', { index: 1 });
        await page.fill('input[name="quote_date"]', '2025-08-08');
        await page.fill('input[name="valid_until"]', '2025-09-08');
        
        // 🎯 關鍵：選擇已批准狀態
        await page.selectOption('select[name="status"]', 'approved');
        console.log('✅ 已選擇狀態為 approved（已批准）');
        
        // 填寫產品
        await page.fill('input[name="items[0][name]"]', '批准狀態測試');
        await page.fill('input[name="items[0][quantity]"]', '1');
        await page.fill('input[name="items[0][unit_price]"]', '200');
        await page.fill('textarea[name="notes"]', '已批准狀態測試');
        
        // 提交表單
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // 檢查狀態顯示
        const pageText = await page.textContent('body');
        
        if (pageText.includes('已批准') || pageText.includes('Approved')) {
            console.log('✅ 已批准狀態保存成功');
        } else {
            console.log('❌ 已批准狀態未正確保存');
            throw new Error('已批准狀態未正確保存');
        }
        
        console.log('✅ 已批准狀態測試完成');
    });
});