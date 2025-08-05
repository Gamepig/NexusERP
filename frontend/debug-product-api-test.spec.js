// Debug 產品 API 測試 - 檢查認證和 session 流程
import { test, expect } from '@playwright/test';

test.describe('Debug 產品 API 測試', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1366, height: 768 });
  });

  test('檢查完整的認證和 API 流程', async () => {
    console.log('🔍 開始調試產品 API 認證流程...');
    
    // 1. 登入系統
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 用戶已登入');
    
    // 2. 檢查 Dashboard 頁面載入
    await expect(page).toHaveURL(/dashboard/);
    console.log('✅ Dashboard 頁面載入成功');
    
    // 3. 攔截 API 請求
    let apiRequestCaptured = false;
    let apiResponse = null;
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/products') && response.request().method() === 'GET') {
        apiRequestCaptured = true;
        console.log(`📡 API 請求攔截: ${response.url()}`);
        console.log(`📊 響應狀態: ${response.status()}`);
        
        try {
          apiResponse = await response.json();
          console.log(`📦 API 響應數據: ${JSON.stringify(apiResponse, null, 2)}`);
        } catch (e) {
          const responseText = await response.text();
          console.log(`📦 API 響應 (非 JSON): ${responseText.substring(0, 500)}...`);
        }
        
        // 檢查請求標頭
        const request = response.request();
        const headers = request.headers();
        console.log('📋 請求標頭:');
        console.log(`  Cookie: ${headers.cookie || '無'}`);
        console.log(`  X-CSRF-Token: ${headers['x-csrf-token'] || '無'}`);
        console.log(`  Accept: ${headers.accept || '無'}`);
      }
    });
    
    // 4. 導航到產品頁面 (這會觸發 API 請求)
    await page.goto('http://127.0.0.1:8000/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 確保 API 請求完成
    
    // 5. 截取產品頁面狀態
    await page.screenshot({ 
      path: 'screenshots/debug-api-01-products-page.png',
      fullPage: true 
    });
    
    console.log(`🎯 API 請求是否被攔截: ${apiRequestCaptured}`);
    
    if (apiRequestCaptured && apiResponse) {
      if (apiResponse.success) {
        console.log(`✅ API 成功響應，產品數量: ${apiResponse.data?.length || 0}`);
        if (apiResponse.pagination) {
          console.log(`📊 分頁信息: ${JSON.stringify(apiResponse.pagination)}`);
        }
      } else {
        console.log(`❌ API 響應失敗: ${apiResponse.message || '未知錯誤'}`);
      }
    }
    
    // 6. 直接測試 API 端點
    console.log('🧪 直接測試 API 端點...');
    
    const directApiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/products', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // CSRF token 會自動從 meta 標籤獲取
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'same-origin' // 確保 cookie 被發送
        });
        
        const data = await response.json();
        
        return {
          status: response.status,
          statusText: response.statusText,
          data: data
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    console.log('🔬 直接 API 測試結果:');
    console.log(JSON.stringify(directApiResponse, null, 2));
    
    // 7. 檢查頁面上的實際內容
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('尚無商品資料')) {
      console.log('📋 頁面顯示: 尚無商品資料');
    } else if (pageContent.includes('載入商品資料時發生錯誤')) {
      console.log('❌ 頁面顯示: 載入商品資料時發生錯誤');
    } else {
      console.log('📋 頁面狀態未知');
    }
    
    // 8. 檢查瀏覽器 console 錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 瀏覽器 Console 錯誤: ${msg.text()}`);
      }
    });
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });
});