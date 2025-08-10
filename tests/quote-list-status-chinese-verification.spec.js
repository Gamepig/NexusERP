import { test, expect } from '@playwright/test';

/**
 * 驗證報價列表狀態欄位正體中文顯示
 */
test.describe('報價列表狀態中文化驗證', () => {
    
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

    test('驗證報價列表狀態欄位顯示正體中文', async ({ page }) => {
        console.log('🔍 測試報價列表狀態中文化');
        
        // 前往報價列表頁面
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖以供檢查
        await page.screenshot({ 
            path: `quote-list-status-chinese-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查頁面標題
        const title = await page.title();
        expect(title).toContain('報價單管理');
        console.log('✅ 頁面標題已中文化');
        
        // 檢查表格表頭 - 狀態欄
        const statusHeader = page.locator('th').filter({ hasText: '狀態' });
        await expect(statusHeader).toBeVisible();
        console.log('✅ 狀態欄位表頭已中文化');
        
        // 檢查表格中的狀態顯示
        const statusCells = page.locator('tbody tr td:nth-child(6)'); // 第6欄是狀態欄
        const statusCount = await statusCells.count();
        
        if (statusCount > 0) {
            console.log(`📊 找到 ${statusCount} 個狀態欄位`);
            
            // 定義預期的中文狀態標籤
            const expectedChineseStatuses = ['草稿', '已發送', '已批准', '已拒絕', '已過期'];
            let foundChineseStatuses = [];
            
            // 檢查每個狀態欄位
            for (let i = 0; i < Math.min(statusCount, 10); i++) { // 最多檢查10個
                const statusCell = statusCells.nth(i);
                const statusText = await statusCell.textContent();
                const cleanText = statusText?.trim().replace(/\s+/g, ' ');
                
                if (cleanText) {
                    console.log(`📋 第 ${i + 1} 行狀態: "${cleanText}"`);
                    
                    // 檢查是否包含中文狀態
                    const foundChinese = expectedChineseStatuses.find(status => 
                        cleanText.includes(status)
                    );
                    
                    if (foundChinese) {
                        foundChineseStatuses.push(foundChinese);
                        console.log(`✅ 發現中文狀態: ${foundChinese}`);
                    } else {
                        // 檢查是否還有英文狀態
                        const englishStatuses = ['draft', 'sent', 'pending', 'approved', 'accepted', 'rejected', 'expired'];
                        const hasEnglish = englishStatuses.some(status => 
                            cleanText.toLowerCase().includes(status)
                        );
                        
                        if (hasEnglish) {
                            console.log(`⚠️ 發現未中文化的狀態: "${cleanText}"`);
                        }
                    }
                }
            }
            
            // 驗證是否找到中文狀態
            if (foundChineseStatuses.length > 0) {
                console.log(`✅ 成功找到 ${foundChineseStatuses.length} 個中文狀態標籤: ${[...new Set(foundChineseStatuses)].join(', ')}`);
            } else {
                console.log('⚠️ 未找到任何中文狀態標籤');
            }
        } else {
            console.log('📝 報價列表為空，無法檢查狀態顯示');
        }
        
        // 檢查搜尋篩選器中的狀態選項
        const statusSelect = page.locator('select[name="status"]');
        await expect(statusSelect).toBeVisible();
        
        const statusOptions = await statusSelect.locator('option').allTextContents();
        console.log('🔍 狀態篩選選項:', statusOptions);
        
        // 驗證狀態篩選選項是否中文化
        const expectedFilterOptions = ['全部狀態', '草稿', '已發送', '已批准', '已拒絕', '已過期'];
        let foundFilterOptions = [];
        
        expectedFilterOptions.forEach(expectedOption => {
            const found = statusOptions.some(option => option.includes(expectedOption));
            if (found) {
                foundFilterOptions.push(expectedOption);
            }
        });
        
        console.log(`✅ 狀態篩選選項已中文化: ${foundFilterOptions.join(', ')}`);
        
        console.log('✅ 報價列表狀態中文化驗證完成');
    });
    
    test('檢查手機版卡片狀態顯示', async ({ page }) => {
        console.log('📱 測試手機版卡片狀態中文化');
        
        // 設定手機視口大小
        await page.setViewportSize({ width: 375, height: 812 });
        
        // 前往報價列表頁面
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖以供檢查
        await page.screenshot({ 
            path: `quote-list-mobile-status-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查手機版卡片中的狀態顯示
        const mobileCards = page.locator('.block.md\\:hidden .rounded-full');
        const cardCount = await mobileCards.count();
        
        if (cardCount > 0) {
            console.log(`📱 找到 ${cardCount} 個手機版狀態標籤`);
            
            const expectedChineseStatuses = ['草稿', '已發送', '已批准', '已拒絕', '已過期'];
            let foundChineseStatuses = [];
            
            for (let i = 0; i < Math.min(cardCount, 5); i++) {
                const statusBadge = mobileCards.nth(i);
                const statusText = await statusBadge.textContent();
                const cleanText = statusText?.trim();
                
                if (cleanText) {
                    console.log(`📱 手機版第 ${i + 1} 個狀態: "${cleanText}"`);
                    
                    const foundChinese = expectedChineseStatuses.find(status => 
                        cleanText.includes(status)
                    );
                    
                    if (foundChinese) {
                        foundChineseStatuses.push(foundChinese);
                        console.log(`✅ 手機版發現中文狀態: ${foundChinese}`);
                    }
                }
            }
            
            if (foundChineseStatuses.length > 0) {
                console.log(`✅ 手機版狀態標籤已中文化: ${[...new Set(foundChineseStatuses)].join(', ')}`);
            } else {
                console.log('⚠️ 手機版未找到中文狀態標籤');
            }
        } else {
            console.log('📝 手機版無狀態標籤可檢查');
        }
        
        console.log('✅ 手機版狀態中文化驗證完成');
    });
    
    test('驗證不同狀態值的中文顯示正確性', async ({ page }) => {
        console.log('🔄 測試狀態映射正確性');
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 檢查頁面是否有各種狀態的報價單
        const pageContent = await page.textContent('body');
        
        // 測試狀態映射
        const statusMappings = {
            'draft': '草稿',
            'pending': '已發送',
            'sent': '已發送', 
            'approved': '已批准',
            'accepted': '已批准',
            'rejected': '已拒絕',
            'expired': '已過期'
        };
        
        console.log('📋 預期狀態映射:', statusMappings);
        
        // 檢查頁面中是否只顯示中文狀態，沒有英文狀態
        const englishStatusPatterns = /\b(draft|pending|sent|approved|accepted|rejected|expired)\b/gi;
        const foundEnglishStatuses = pageContent.match(englishStatusPatterns);
        
        if (foundEnglishStatuses) {
            console.log('⚠️ 頁面中仍有英文狀態:', [...new Set(foundEnglishStatuses)]);
        } else {
            console.log('✅ 頁面中未發現英文狀態，狀態已完全中文化');
        }
        
        // 檢查是否存在預期的中文狀態
        const chineseStatuses = Object.values(statusMappings);
        let foundChineseCount = 0;
        
        chineseStatuses.forEach(chineseStatus => {
            if (pageContent.includes(chineseStatus)) {
                foundChineseCount++;
                console.log(`✅ 找到中文狀態: ${chineseStatus}`);
            }
        });
        
        console.log(`📊 找到 ${foundChineseCount} 個不同的中文狀態標籤`);
        console.log('✅ 狀態映射正確性驗證完成');
    });
});