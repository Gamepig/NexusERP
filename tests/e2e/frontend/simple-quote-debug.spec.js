/**
 * 🧠 簡化版系統性調試測試 - 追蹤報價數據流
 */

import { test, expect } from '@playwright/test';

test.describe('🧠 簡化報價調試 - 數據流追蹤', () => {
    
    test.beforeEach(async ({ page }) => {
        console.log('🔐 開始登入流程...');
        await page.goto('/login');
        
        // 等待登入頁面完全載入
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        
        // 截圖登入前狀態
        await page.screenshot({ path: 'debug-login-before.png', fullPage: true });
        
        await page.click('button[type="submit"]');
        
        // 等待登入完成 - 檢查是否重導向到儀表板或其他頁面
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        
        console.log('✅ 登入成功，當前URL:', page.url());
    });

    test('🔍 檢查現有報價資料', async ({ page }) => {
        console.log('🚀 檢查現有報價資料...');
        
        // 導航到報價列表
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 截圖列表頁面
        await page.screenshot({ path: 'debug-quotes-list.png', fullPage: true });
        
        // 檢查頁面是否載入成功
        const title = await page.title();
        console.log('📄 頁面標題:', title);
        
        // 檢查是否有報價資料
        const rows = await page.locator('tbody tr').count();
        console.log('📊 報價記錄數量:', rows);
        
        if (rows > 0) {
            console.log('📋 分析第一筆報價記錄...');
            
            // 提取第一行的數據
            const firstRow = page.locator('tbody tr').first();
            
            const quote_number = await firstRow.locator('td:nth-child(1)').textContent();
            const customer_name = await firstRow.locator('td:nth-child(2)').textContent();
            const quote_date = await firstRow.locator('td:nth-child(3)').textContent();
            const valid_until = await firstRow.locator('td:nth-child(4)').textContent();
            const total_amount = await firstRow.locator('td:nth-child(5)').textContent();
            const status = await firstRow.locator('td:nth-child(6)').textContent();
            
            const listData = {
                quote_number: quote_number?.trim(),
                customer_name: customer_name?.trim(), 
                quote_date: quote_date?.trim(),
                valid_until: valid_until?.trim(),
                total_amount: total_amount?.trim(),
                status: status?.trim()
            };
            
            console.log('📊 列表頁顯示數據:', listData);
            
            // 點擊查看詳情
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            
            // 截圖詳情頁面
            await page.screenshot({ path: 'debug-quote-detail.png', fullPage: true });
            
            // 提取詳情頁面數據
            const detailData = await extractDetailData(page);
            console.log('📊 詳情頁顯示數據:', detailData);
            
            // 比較列表頁vs詳情頁數據
            compareData(listData, detailData);
            
        } else {
            console.log('❌ 沒有找到報價記錄，需要先建立測試資料');
        }
    });

    test('🔍 測試搜尋功能', async ({ page }) => {
        console.log('🚀 測試搜尋功能...');
        
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 截圖初始狀態
        await page.screenshot({ path: 'debug-search-initial.png', fullPage: true });
        
        // 測試日期搜尋
        console.log('📅 測試日期搜尋...');
        await page.fill('input[name="date_from"]', '2025-08-01');
        await page.fill('input[name="date_to"]', '2025-08-31');
        await page.click('button[type="submit"]:has-text("搜尋")');
        await page.waitForLoadState('networkidle');
        
        // 截圖日期搜尋結果
        await page.screenshot({ path: 'debug-search-date.png', fullPage: true });
        
        const dateSearchResults = await page.locator('tbody tr').count();
        console.log('📊 日期搜尋結果數量:', dateSearchResults);
        
        // 清除搜尋
        await page.click('a:has-text("清除篩選")');
        await page.waitForLoadState('networkidle');
        
        // 測試狀態搜尋
        console.log('🔍 測試狀態搜尋...');
        await page.selectOption('select[name="status"]', 'draft');
        await page.click('button[type="submit"]:has-text("搜尋")');
        await page.waitForLoadState('networkidle');
        
        // 截圖狀態搜尋結果
        await page.screenshot({ path: 'debug-search-status.png', fullPage: true });
        
        const statusSearchResults = await page.locator('tbody tr').count();
        console.log('📊 狀態搜尋結果數量:', statusSearchResults);
    });

    test('🔍 測試分頁功能', async ({ page }) => {
        console.log('🚀 測試分頁功能...');
        
        await page.goto('/quotes?per_page=10');
        await page.waitForLoadState('networkidle');
        
        // 截圖分頁初始狀態
        await page.screenshot({ path: 'debug-pagination-initial.png', fullPage: true });
        
        // 檢查分頁資訊
        const paginationInfo = await page.locator('.text-sm:has-text("筆")').first();
        if (await paginationInfo.isVisible()) {
            const infoText = await paginationInfo.textContent();
            console.log('📄 分頁資訊:', infoText?.trim());
        }
        
        // 檢查分頁按鈕
        const nextButton = page.locator('a:has-text("下一頁")');
        if (await nextButton.isVisible()) {
            console.log('📄 測試下一頁按鈕...');
            await nextButton.click();
            await page.waitForLoadState('networkidle');
            
            // 截圖下一頁結果
            await page.screenshot({ path: 'debug-pagination-next.png', fullPage: true });
            
            const newUrl = page.url();
            console.log('📄 下一頁URL:', newUrl);
            
            const hasPageParam = newUrl.includes('page=');
            console.log('✅ URL是否包含page參數:', hasPageParam);
        } else {
            console.log('📄 沒有下一頁按鈕(記錄不足)');
        }
        
        // 測試每頁數量切換
        const perPageSelect = page.locator('select[name="per_page"]');
        if (await perPageSelect.isVisible()) {
            console.log('📄 測試每頁數量切換...');
            await perPageSelect.selectOption('20');
            await page.waitForLoadState('networkidle');
            
            // 截圖每頁20筆結果
            await page.screenshot({ path: 'debug-pagination-per-page-20.png', fullPage: true });
            
            const newRowCount = await page.locator('tbody tr').count();
            console.log('📊 切換到每頁20筆後的記錄數量:', newRowCount);
        }
    });
});

// 輔助函數：提取詳情頁面數據
async function extractDetailData(page) {
    const data = {};
    
    // 嘗試多種選擇器來找到數據
    const selectors = {
        subtotal: [
            'label:has-text("Subtotal") + p',
            'p:has-text("Subtotal")',
            'span:has-text("Subtotal")',
            '.subtotal'
        ],
        total: [
            'label:has-text("Total") + p',
            'p:has-text("Total")',
            'span:has-text("Total")',
            '.total'
        ],
        status: [
            'label:has-text("Status") + span',
            'span.inline-flex',
            '.status'
        ]
    };
    
    for (const [key, selectorList] of Object.entries(selectors)) {
        for (const selector of selectorList) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible({ timeout: 1000 })) {
                    data[key] = await element.textContent();
                    break;
                }
            } catch (e) {
                // 繼續嘗試下一個選擇器
            }
        }
    }
    
    return data;
}

// 輔助函數：比較數據
function compareData(listData, detailData) {
    console.log('\n🔍 數據一致性分析:');
    console.log('================');
    
    // 解析金額
    const listTotal = parseAmount(listData.total_amount);
    const detailSubtotal = parseAmount(detailData.subtotal);
    const detailTotal = parseAmount(detailData.total);
    
    console.log(`💰 列表頁總額: ${listTotal}`);
    console.log(`💰 詳情頁小計: ${detailSubtotal}`);  
    console.log(`💰 詳情頁總額: ${detailTotal}`);
    
    // 檢查問題
    const issues = [];
    
    if (detailSubtotal === 0 && detailTotal > 0) {
        issues.push('🚨 問題: 小計顯示$0.00但總計顯示' + detailTotal);
    }
    
    if (Math.abs(listTotal - detailTotal) > 0.01) {
        issues.push('🚨 問題: 列表頁總額與詳情頁總額不一致');
    }
    
    if (detailSubtotal > 0 && Math.abs(detailSubtotal - detailTotal) > 0.01) {
        console.log('⚠️  警告: 小計與總計不匹配，可能存在稅費或折扣未顯示');
    }
    
    if (issues.length > 0) {
        console.log('\n🚨 發現的數據問題:');
        issues.forEach(issue => console.log(`  ${issue}`));
    } else {
        console.log('✅ 數據一致性檢查通過');
    }
    
    console.log('================\n');
}

// 輔助函數：解析金額
function parseAmount(amountStr) {
    if (!amountStr) return 0;
    const match = amountStr.replace(/[$,\s]/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
}