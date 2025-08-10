import { test, expect } from '@playwright/test';

/**
 * 調試分頁 API 回應結構
 */
test.describe('分頁 API 調試', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('檢查 Go API 回應的分頁結構', async ({ page }) => {
        console.log('🔍 檢查 Go API 分頁資料結構');
        
        // 攔截 API 請求
        let apiResponse = null;
        
        page.on('response', async (response) => {
            if (response.url().includes('/api/quotes') && response.request().method() === 'GET') {
                try {
                    const responseData = await response.json();
                    apiResponse = responseData;
                    console.log('📡 Go API 完整回應:', JSON.stringify(responseData, null, 2));
                    
                    // 檢查分頁相關欄位
                    console.log('\\n🔍 分頁欄位檢查:');
                    console.log(`- quotes: ${responseData.quotes ? 'exists' : 'missing'}`);
                    console.log(`- data: ${responseData.data ? 'exists' : 'missing'}`);
                    console.log(`- items: ${responseData.items ? 'exists' : 'missing'}`);
                    console.log(`- total: ${responseData.total || responseData.total_count || 'missing'}`);
                    console.log(`- current_page: ${responseData.current_page || responseData.page || 'missing'}`);
                    console.log(`- per_page: ${responseData.per_page || responseData.page_size || 'missing'}`);
                    console.log(`- last_page: ${responseData.last_page || responseData.total_pages || 'missing'}`);
                    
                    // 計算應該的總頁數
                    const total = responseData.total || responseData.total_count || 0;
                    const perPage = responseData.per_page || responseData.page_size || 20;
                    const calculatedPages = Math.ceil(total / perPage);
                    console.log(`\\n📊 計算結果:`);
                    console.log(`- 總數據量: ${total}`);
                    console.log(`- 每頁數量: ${perPage}`);  
                    console.log(`- 計算總頁數: ${calculatedPages}`);
                    console.log(`- API 返回總頁數: ${responseData.last_page || responseData.total_pages || 'missing'}`);
                    
                } catch (e) {
                    console.log('⚠️ 無法解析 API 回應:', e.message);
                }
            }
        });
        
        // 觸發 API 請求
        await page.goto('/quotes?per_page=10');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // 檢查前端接收到的資料
        await page.evaluate(() => {
            // 嘗試從窗口或全域變數中獲取資料（如果有的話）
            if (window.quotesData) {
                console.log('🖥️ 前端資料:', window.quotesData);
            }
        });
        
        // 檢查頁面是否有分頁
        const paginationExists = await page.locator('div:has-text("顯示第")').count() > 0;
        console.log(`\\n🖥️ 前端分頁顯示: ${paginationExists ? '存在' : '不存在'}`);
        
        if (!paginationExists && apiResponse) {
            console.log('\\n❌ 問題診斷:');
            
            // 檢查是否有足夠資料顯示分頁
            const dataCount = apiResponse.quotes?.length || apiResponse.data?.length || apiResponse.items?.length || 0;
            console.log(`- API 返回資料數量: ${dataCount}`);
            
            const total = apiResponse.total || apiResponse.total_count || 0;
            const lastPage = apiResponse.last_page || apiResponse.total_pages || 1;
            
            if (total > 10 && lastPage === 1) {
                console.log('❌ 問題: Go API 沒有正確計算 last_page');
            } else if (total <= 10) {
                console.log('📝 無問題: 數據量不足一頁，不需要分頁');
            } else if (lastPage > 1) {
                console.log('❌ 問題: Laravel 控制器處理分頁資料時出錯');
            }
        }
        
        console.log('\\n✅ API 調試完成');
    });
    
    test('直接測試 Go API 端點', async ({ page }) => {
        console.log('🔧 直接測試 Go API');
        
        // 先登入取得認證資訊
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');
        
        // 使用瀏覽器發送直接 API 請求
        const apiResponse = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/quotes?per_page=5&page=1', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                });
                
                const data = await response.json();
                return {
                    status: response.status,
                    data: data
                };
            } catch (e) {
                return {
                    error: e.message
                };
            }
        });
        
        if (apiResponse.error) {
            console.log('❌ API 請求失敗:', apiResponse.error);
        } else {
            console.log('📡 直接 API 回應狀態:', apiResponse.status);
            console.log('📊 直接 API 資料:', JSON.stringify(apiResponse.data, null, 2));
            
            // 詳細分析
            const data = apiResponse.data;
            if (data) {
                console.log('\\n🔍 直接 API 分析:');
                console.log(`- 狀態碼: ${apiResponse.status}`);
                console.log(`- 是否有 quotes 欄位: ${!!data.quotes}`);
                console.log(`- 是否有 total 欄位: ${!!data.total}`);
                console.log(`- 是否有 last_page 欄位: ${!!data.last_page}`);
                
                if (data.total && data.last_page) {
                    console.log(`- 總資料量: ${data.total}`);
                    console.log(`- 總頁數: ${data.last_page}`);
                    console.log(`- 每頁數量: ${data.per_page || 'unknown'}`);
                    
                    if (data.total > (data.per_page || 10) && data.last_page === 1) {
                        console.log('❌ 發現問題: last_page 計算錯誤');
                    }
                }
            }
        }
    });
});