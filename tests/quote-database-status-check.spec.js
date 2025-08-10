import { test, expect } from '@playwright/test';

/**
 * 檢查資料庫中報價狀態的實際值
 * 驗證我們剛才建立的報價是否有正確的狀態
 */

test.describe('報價狀態資料庫驗證', () => {
    
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

    test('檢查最新建立的報價狀態', async ({ page }) => {
        console.log('📊 檢查報價列表中的狀態顯示');
        
        // 前往報價列表
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // 截圖報價列表
        await page.screenshot({ 
            path: `quote-list-status-check-${Date.now()}.png`, 
            fullPage: true 
        });

        // 查找最新的報價（通常在第一行）
        const firstRow = page.locator('tbody tr').first();
        
        if (await firstRow.count() > 0) {
            // 獲取第一行的所有文字內容
            const rowText = await firstRow.textContent();
            console.log('第一行報價內容:', rowText);
            
            // 查找狀態欄位 - 嘗試不同的選擇器
            const statusSelectors = [
                'td:has(.badge)', 
                'td .status',
                'td .badge',
                '[data-status]',
                'td:nth-child(4)', // 假設狀態在第4列
                'td:nth-child(5)', // 或第5列
                'td:nth-child(6)'  // 或第6列
            ];
            
            let statusFound = false;
            for (const selector of statusSelectors) {
                const statusElement = firstRow.locator(selector);
                if (await statusElement.count() > 0) {
                    const statusText = await statusElement.textContent();
                    console.log(`✅ 找到狀態（${selector}）: ${statusText}`);
                    
                    // 檢查是否包含狀態關鍵字
                    if (statusText.includes('草稿') || statusText.includes('draft') ||
                        statusText.includes('已發送') || statusText.includes('pending') ||
                        statusText.includes('已批准') || statusText.includes('approved')) {
                        console.log(`🎯 狀態內容: ${statusText}`);
                        statusFound = true;
                    }
                }
            }
            
            if (!statusFound) {
                console.log('⚠️ 未找到明確的狀態欄位，檢查整行內容');
                
                // 分析行的各個單元格
                const cells = firstRow.locator('td');
                const cellCount = await cells.count();
                console.log(`行中有 ${cellCount} 個單元格`);
                
                for (let i = 0; i < cellCount; i++) {
                    const cellText = await cells.nth(i).textContent();
                    console.log(`單元格 ${i}: ${cellText}`);
                    
                    // 檢查是否包含狀態關鍵字
                    if (cellText.includes('草稿') || cellText.includes('draft') ||
                        cellText.includes('已發送') || cellText.includes('pending') ||
                        cellText.includes('已批准') || cellText.includes('approved') ||
                        cellText.includes('已拒絕') || cellText.includes('rejected') ||
                        cellText.includes('已過期') || cellText.includes('expired')) {
                        console.log(`🎯 第 ${i} 個單元格包含狀態: ${cellText}`);
                    }
                }
            }
            
            // 點擊第一個報價查看詳細資料
            console.log('🔍 點擊第一個報價查看詳情');
            
            // 查找查看按鈕或點擊行
            const viewButton = firstRow.locator('a[href*="quotes/"], button:has-text("查看"), .btn-view');
            if (await viewButton.count() > 0) {
                await viewButton.first().click();
            } else {
                // 如果沒有找到查看按鈕，嘗試點擊行中的連結
                const links = firstRow.locator('a');
                if (await links.count() > 0) {
                    await links.first().click();
                } else {
                    console.log('❌ 無法找到查看按鈕或連結');
                    return;
                }
            }
            
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            // 截圖報價詳情頁面
            await page.screenshot({ 
                path: `quote-detail-status-check-${Date.now()}.png`, 
                fullPage: true 
            });
            
            // 在詳情頁面中查找狀態
            console.log('📋 檢查報價詳情頁面的狀態');
            
            const currentUrl = page.url();
            console.log(`詳情頁面 URL: ${currentUrl}`);
            
            // 查找狀態顯示
            const detailStatusSelectors = [
                '.status',
                '.badge',
                '[data-status]',
                'dt:has-text("狀態") + dd',
                'dt:has-text("Status") + dd',
                '.quote-status',
                '.status-badge'
            ];
            
            for (const selector of detailStatusSelectors) {
                const statusElement = page.locator(selector);
                if (await statusElement.count() > 0) {
                    const statusText = await statusElement.textContent();
                    console.log(`✅ 詳情頁狀態（${selector}）: ${statusText}`);
                }
            }
            
            // 檢查頁面上所有可能包含狀態的文字
            const pageContent = await page.textContent('body');
            if (pageContent.includes('草稿') || pageContent.includes('Draft')) {
                console.log('⚠️ 頁面包含"草稿"狀態');
            }
            if (pageContent.includes('已發送') || pageContent.includes('Pending')) {
                console.log('✅ 頁面包含"已發送"狀態');
            }
            if (pageContent.includes('已批准') || pageContent.includes('Approved')) {
                console.log('✅ 頁面包含"已批准"狀態');
            }
            
        } else {
            console.log('❌ 報價列表中沒有任何記錄');
        }
        
        console.log('✅ 狀態檢查完成');
    });
    
    test('建立新報價並立即檢查狀態', async ({ page }) => {
        console.log('🔄 建立新報價並立即檢查狀態');
        
        // 監控 API 呼叫（如果有的話）
        page.on('request', request => {
            if (request.url().includes('/api/quotes')) {
                console.log(`API 請求: ${request.method()} ${request.url()}`);
            }
        });
        
        // 前往建立頁面
        await page.goto('/quotes/create');
        await page.waitForLoadState('networkidle');
        
        // 快速填寫表單
        await page.selectOption('select[name="customer_id"]', { index: 1 });
        await page.fill('input[name="quote_date"]', '2025-08-08');
        await page.fill('input[name="valid_until"]', '2025-09-08');
        
        // 🎯 關鍵：選擇非草稿狀態
        await page.selectOption('select[name="status"]', 'pending');
        console.log('✅ 已選擇狀態為 pending（已發送）');
        
        // 填寫產品
        await page.fill('input[name="items[0][name]"]', '狀態測試商品');
        await page.fill('input[name="items[0][quantity]"]', '1');
        await page.fill('input[name="items[0][unit_price]"]', '100');
        
        // 提交表單
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // 檢查跳轉後的URL
        const finalUrl = page.url();
        console.log(`建立後的 URL: ${finalUrl}`);
        
        if (finalUrl.includes('/quotes/')) {
            console.log('✅ 成功跳轉到報價詳情頁');
            
            // 截圖新建立的報價
            await page.screenshot({ 
                path: `quote-new-created-${Date.now()}.png`, 
                fullPage: true 
            });
            
            // 立即檢查狀態顯示
            const pageText = await page.textContent('body');
            
            if (pageText.includes('草稿') || pageText.includes('Draft')) {
                console.log('❌ 新建立的報價狀態仍為草稿');
            }
            if (pageText.includes('已發送') || pageText.includes('Pending')) {
                console.log('✅ 新建立的報價狀態正確顯示為已發送');
            }
            
            console.log('檢查頁面中的狀態相關文字...');
            const statusKeywords = ['草稿', 'Draft', '已發送', 'Pending', '已批准', 'Approved'];
            for (const keyword of statusKeywords) {
                if (pageText.includes(keyword)) {
                    console.log(`🔍 找到狀態關鍵字: ${keyword}`);
                }
            }
            
        } else {
            console.log('❌ 沒有跳轉到報價詳情頁，可能建立失敗');
        }
        
        console.log('✅ 新報價狀態檢查完成');
    });
});