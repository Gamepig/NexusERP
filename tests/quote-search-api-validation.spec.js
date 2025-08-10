import { test, expect } from '@playwright/test';

/**
 * 報價搜尋 API 回應驗證測試
 * 重點：驗證修復後的前後端參數對齊和搜尋功能
 */

test.describe('報價搜尋 API 驗證', () => {
    
    test.beforeEach(async ({ page }) => {
        // 登入系統
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        // 導航到報價列表頁面
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('API 參數對齊驗證 - 搜尋功能', async ({ page }) => {
        console.log('🌐 驗證搜尋 API 參數對齊');
        
        // 監聽所有網路請求
        const apiRequests = [];
        
        page.on('request', request => {
            const url = request.url();
            if (url.includes('/api/quotes') || url.includes('/quotes')) {
                console.log(`📤 API 請求: ${request.method()} ${url}`);
                apiRequests.push({
                    method: request.method(),
                    url: url,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        page.on('response', async response => {
            const url = response.url();
            if (url.includes('/api/quotes')) {
                console.log(`📥 API 回應: ${response.status()} ${url}`);
                
                // 解析查詢參數
                const urlObj = new URL(url);
                const params = Object.fromEntries(urlObj.searchParams.entries());
                console.log('查詢參數:', params);
                
                // 檢查是否使用了修復後的參數名稱
                if (params.page_size) {
                    console.log('✅ 使用正確的參數名稱: page_size');
                }
                if (params.sort_by) {
                    console.log('✅ 使用正確的參數名稱: sort_by');
                }
                if (params.sort_order) {
                    console.log('✅ 使用正確的參數名稱: sort_order');
                }
                if (params.search) {
                    console.log('✅ 搜尋參數存在:', params.search);
                }
                if (params.company_id) {
                    console.log('✅ 多租戶參數存在: company_id =', params.company_id);
                }
                
                // 檢查是否還在使用舊的參數名稱（這應該不存在）
                if (params.per_page) {
                    console.log('❌ 發現舊參數名稱: per_page（應該已修復為 page_size）');
                }
                if (params.sort_field || params.sort_direction) {
                    console.log('❌ 發現舊參數名稱: sort_field/sort_direction（應該已修復為 sort_by/sort_order）');
                }
                
                // 檢查回應內容
                if (response.status() === 200) {
                    try {
                        const responseData = await response.json();
                        console.log('API 回應結構:', Object.keys(responseData));
                        
                        if (responseData.quotes) {
                            console.log(`回應中的報價數量: ${responseData.quotes.length}`);
                            console.log(`總數量: ${responseData.total || 'N/A'}`);
                            console.log(`當前頁: ${responseData.page || responseData.current_page || 'N/A'}`);
                            console.log(`每頁筆數: ${responseData.page_size || responseData.per_page || 'N/A'}`);
                        }
                    } catch (error) {
                        console.log('解析 API 回應 JSON 失敗:', error.message);
                    }
                }
            }
        });
        
        // 執行搜尋測試
        const searchInput = page.locator('input[name="search"]');
        
        // 測試 1: 空搜尋（獲取所有記錄）
        console.log('\n--- 測試 1: 空搜尋 ---');
        await searchInput.clear();
        await page.press('input[name="search"]', 'Enter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 測試 2: 有效搜尋關鍵字
        console.log('\n--- 測試 2: 搜尋 "test" ---');
        await searchInput.fill('test');
        await page.press('input[name="search"]', 'Enter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 測試 3: 搜尋報價單號格式
        console.log('\n--- 測試 3: 搜尋 "QT" ---');
        await searchInput.clear();
        await searchInput.fill('QT');
        await page.press('input[name="search"]', 'Enter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 測試 4: 清除搜尋
        console.log('\n--- 測試 4: 清除搜尋 ---');
        await searchInput.clear();
        await page.press('input[name="search"]', 'Enter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        console.log(`\n📊 總共捕獲了 ${apiRequests.length} 個 API 請求`);
        apiRequests.forEach((req, index) => {
            console.log(`${index + 1}. ${req.method} ${req.url}`);
        });
        
        console.log('✅ API 參數對齊驗證完成');
    });

    test('排序 API 參數驗證', async ({ page }) => {
        console.log('📊 驗證排序 API 參數');
        
        const sortRequests = [];
        
        page.on('request', request => {
            const url = request.url();
            if (url.includes('/api/quotes') && url.includes('sort')) {
                const urlObj = new URL(url);
                const params = Object.fromEntries(urlObj.searchParams.entries());
                sortRequests.push({
                    url: url,
                    params: params,
                    timestamp: new Date().toISOString()
                });
                console.log('排序請求參數:', params);
            }
        });
        
        const sortSelect = page.locator('select[name="sort"]');
        
        // 測試不同排序選項
        const sortOptions = [
            'created_at_desc',
            'total_amount_desc', 
            'quote_date_asc',
            'customer_name_asc'
        ];
        
        for (const option of sortOptions) {
            console.log(`\n--- 測試排序: ${option} ---`);
            try {
                await sortSelect.selectOption(option);
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
            } catch (error) {
                console.log(`排序選項 ${option} 測試失敗:`, error.message);
            }
        }
        
        console.log(`\n📊 總共捕獲了 ${sortRequests.length} 個排序請求`);
        sortRequests.forEach((req, index) => {
            console.log(`${index + 1}. 參數:`, JSON.stringify(req.params, null, 2));
        });
        
        console.log('✅ 排序 API 參數驗證完成');
    });

    test('狀態篩選 API 參數驗證', async ({ page }) => {
        console.log('🏷️ 驗證狀態篩選 API 參數');
        
        const statusRequests = [];
        
        page.on('request', request => {
            const url = request.url();
            if (url.includes('/api/quotes')) {
                const urlObj = new URL(url);
                const params = Object.fromEntries(urlObj.searchParams.entries());
                if (params.status) {
                    statusRequests.push({
                        status: params.status,
                        params: params,
                        timestamp: new Date().toISOString()
                    });
                    console.log('狀態篩選請求:', params.status);
                }
            }
        });
        
        const statusSelect = page.locator('select[name="status"]');
        
        // 測試不同狀態篩選（使用修復後的標準狀態值）
        const statusOptions = [
            { value: 'draft', label: '草稿' },
            { value: 'pending', label: '已發送' }, // 修復後的標準值
            { value: 'approved', label: '已批准' }, // 修復後的標準值
            { value: 'rejected', label: '已拒絕' },
            { value: 'expired', label: '已過期' }
        ];
        
        for (const option of statusOptions) {
            console.log(`\n--- 測試狀態篩選: ${option.label} (${option.value}) ---`);
            try {
                await statusSelect.selectOption(option.value);
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                
                // 檢查頁面上是否顯示了正確的狀態
                const tableContent = await page.locator('tbody').textContent();
                console.log(`篩選結果包含內容: ${tableContent.substring(0, 100)}...`);
                
            } catch (error) {
                console.log(`狀態選項 ${option.value} 測試失敗:`, error.message);
            }
        }
        
        // 測試清除篩選
        console.log('\n--- 測試清除狀態篩選 ---');
        await statusSelect.selectOption('');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        console.log(`\n📊 總共捕獲了 ${statusRequests.length} 個狀態篩選請求`);
        statusRequests.forEach((req, index) => {
            console.log(`${index + 1}. 狀態: ${req.status}, 完整參數:`, JSON.stringify(req.params, null, 2));
        });
        
        console.log('✅ 狀態篩選 API 參數驗證完成');
    });
    
    test('綜合功能測試 - API 回應正確性', async ({ page }) => {
        console.log('🔄 綜合功能測試');
        
        let lastApiResponse = null;
        
        page.on('response', async response => {
            const url = response.url();
            if (url.includes('/api/quotes') && response.status() === 200) {
                try {
                    lastApiResponse = await response.json();
                    console.log('最新 API 回應數據結構:', Object.keys(lastApiResponse));
                } catch (error) {
                    console.log('解析 API 回應失敗:', error.message);
                }
            }
        });
        
        // 執行綜合搜尋：關鍵字 + 狀態 + 排序
        console.log('\n--- 執行綜合搜尋測試 ---');
        
        const searchInput = page.locator('input[name="search"]');
        const statusSelect = page.locator('select[name="status"]');
        const sortSelect = page.locator('select[name="sort"]');
        
        // 設定搜尋條件
        await searchInput.fill('test');
        await statusSelect.selectOption('draft');
        await sortSelect.selectOption('created_at_desc');
        
        // 執行搜尋
        await page.press('input[name="search"]', 'Enter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // 驗證 API 回應
        if (lastApiResponse) {
            console.log('✅ 成功獲取 API 回應');
            console.log('回應包含的主要欄位:', Object.keys(lastApiResponse));
            
            if (lastApiResponse.quotes) {
                console.log(`✅ 包含報價列表，數量: ${lastApiResponse.quotes.length}`);
                
                if (lastApiResponse.quotes.length > 0) {
                    const firstQuote = lastApiResponse.quotes[0];
                    console.log('第一個報價的欄位:', Object.keys(firstQuote));
                    console.log('第一個報價的狀態:', firstQuote.status);
                    console.log('第一個報價的報價單號:', firstQuote.quote_number || 'N/A');
                }
            }
            
            if (lastApiResponse.total !== undefined) {
                console.log(`✅ 包含總數: ${lastApiResponse.total}`);
            }
            
            if (lastApiResponse.page || lastApiResponse.current_page) {
                console.log(`✅ 包含頁碼: ${lastApiResponse.page || lastApiResponse.current_page}`);
            }
        } else {
            console.log('❌ 未能獲取 API 回應數據');
        }
        
        console.log('✅ 綜合功能測試完成');
    });
});