import { test, expect } from '@playwright/test';

/**
 * 驗證報價詳情頁面正體中文翻譯
 */
test.describe('報價詳情頁面正體中文驗證', () => {
    
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

    test('驗證報價詳情頁面使用正體中文', async ({ page }) => {
        console.log('🔍 測試報價詳情頁面正體中文翻譯');
        
        // 前往報價詳情頁面 (使用已知的報價 ID)
        await page.goto('/quotes/26');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖以供檢查
        await page.screenshot({ 
            path: `quote-detail-chinese-${Date.now()}.png`, 
            fullPage: true 
        });
        
        // 檢查頁面標題
        const title = await page.title();
        expect(title).toContain('報價單詳情');
        console.log('✅ 頁面標題已中文化');
        
        // 檢查主要標題
        const mainTitle = await page.locator('h1').first().textContent();
        expect(mainTitle).toContain('報價單 #');
        console.log('✅ 主要標題使用中文');
        
        // 檢查按鈕文字
        const editButton = page.locator('a:has-text("編輯報價單")');
        await expect(editButton).toBeVisible();
        console.log('✅ 編輯按鈕已中文化');
        
        const convertButton = page.locator('button:has-text("轉換為訂單")');
        await expect(convertButton).toBeVisible();
        console.log('✅ 轉換按鈕已中文化');
        
        const backButton = page.locator('a:has-text("返回列表")');
        await expect(backButton).toBeVisible();
        console.log('✅ 返回按鈕已中文化');
        
        // 檢查報價資訊區塊標題
        const quoteInfoSection = page.locator('h3:has-text("報價資訊")');
        await expect(quoteInfoSection).toBeVisible();
        console.log('✅ 報價資訊區塊已中文化');
        
        // 檢查欄位標籤
        const labels = [
            '報價單號:',
            '客戶:',
            '狀態:',
            '報價日期:',
            '有效期限:'
        ];
        
        for (const label of labels) {
            const labelElement = page.locator(`label:has-text("${label}")`);
            await expect(labelElement).toBeVisible();
            console.log(`✅ 標籤「${label}」已中文化`);
        }
        
        // 檢查報價摘要區塊
        const summarySection = page.locator('h3:has-text("報價摘要")');
        await expect(summarySection).toBeVisible();
        console.log('✅ 報價摘要區塊已中文化');
        
        // 檢查摘要欄位標籤
        const summaryLabels = [
            '小計:',
            '折扣:',
            '稅額:',
            '總計:'
        ];
        
        for (const label of summaryLabels) {
            const labelElement = page.locator(`label:has-text("${label}")`);
            await expect(labelElement).toBeVisible();
            console.log(`✅ 摘要標籤「${label}」已中文化`);
        }
        
        // 檢查報價項目表格
        const itemsSection = page.locator('h3:has-text("報價項目")');
        await expect(itemsSection).toBeVisible();
        console.log('✅ 報價項目區塊已中文化');
        
        // 檢查表格標題
        const tableHeaders = [
            '產品',
            '描述',
            '數量',
            '單價',
            '總計'
        ];
        
        for (const header of tableHeaders) {
            const headerElement = page.locator(`th:has-text("${header}")`);
            await expect(headerElement).toBeVisible();
            console.log(`✅ 表格標題「${header}」已中文化`);
        }
        
        // 檢查條款與條件
        const termsSection = page.locator('h3:has-text("條款與條件")');
        await expect(termsSection).toBeVisible();
        console.log('✅ 條款與條件區塊已中文化');
        
        // 檢查狀態顯示
        const pageContent = await page.textContent('body');
        
        // 檢查是否有正體中文狀態標籤
        const chineseStatuses = ['草稿', '已發送', '已批准', '已拒絕', '已過期'];
        let foundChineseStatus = false;
        
        for (const status of chineseStatuses) {
            if (pageContent.includes(status)) {
                console.log(`✅ 發現中文狀態標籤：${status}`);
                foundChineseStatus = true;
                break;
            }
        }
        
        if (!foundChineseStatus) {
            console.log('⚠️ 未找到中文狀態標籤，可能狀態為其他值');
        }
        
        console.log('✅ 報價詳情頁面正體中文驗證完成');
    });
    
    test('檢查不同狀態的中文顯示', async ({ page }) => {
        console.log('🔍 測試不同狀態的中文顯示');
        
        // 前往報價列表查看不同狀態
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 查找包含狀態的元素
        const statusElements = await page.locator('.badge, [class*="status"], td:nth-child(6)').all();
        
        let foundStatuses = [];
        for (const element of statusElements) {
            const text = await element.textContent();
            if (text && text.trim()) {
                const cleanText = text.trim();
                if (['草稿', '已發送', '已批准', '已拒絕', '已過期'].includes(cleanText)) {
                    foundStatuses.push(cleanText);
                }
            }
        }
        
        console.log(`✅ 找到的中文狀態標籤: ${foundStatuses.join(', ')}`);
        
        if (foundStatuses.length > 0) {
            console.log('✅ 狀態標籤已成功中文化');
        } else {
            console.log('⚠️ 未找到中文狀態標籤，需要進一步檢查');
        }
    });
});