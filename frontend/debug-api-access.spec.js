import { test, expect } from '@playwright/test';

test.describe('API 存取偵錯測試', () => {
  test('檢查客戶頁面 API 調用問題', async ({ page }) => {
    console.log('🔧 開始 API 存取偵錯');
    
    // 攔截 API 請求
    page.on('request', request => {
      console.log('Request:', request.method(), request.url());
      if (request.url().includes('/api/')) {
        console.log('API Request Headers:', request.headers());
      }
    });
    
    page.on('response', response => {
      console.log('Response:', response.status(), response.url());
      if (response.url().includes('/api/') || response.status() >= 400) {
        console.log('Response Headers:', response.headers());
      }
    });

    // 1. 登入
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('登入後的 URL:', page.url());
    
    // 2. 訪問客戶頁面
    console.log('📋 導航到客戶頁面');
    await page.goto('/customers');
    
    // 等待頁面完成載入
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 3. 檢查頁面內容
    const content = await page.content();
    
    if (content.includes('Authorization header required')) {
      console.log('❌ 發現認證錯誤');
      
      // 檢查網路請求
      const requests = [];
      page.on('request', request => {
        requests.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers()
        });
      });
      
      // 重新載入頁面觀察網路活動
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      console.log('網路請求記錄:', requests.length, '個請求');
      
      requests.forEach((req, index) => {
        if (req.url.includes('/api/') || req.url.includes('/customers')) {
          console.log(`請求 ${index + 1}:`, req.method, req.url);
          if (req.headers.authorization) {
            console.log('  - Authorization 標頭存在');
          } else {
            console.log('  - ❌ 缺少 Authorization 標頭');
          }
        }
      });
    } else if (content.includes('客戶')) {
      console.log('✅ 客戶頁面正常顯示');
    } else {
      console.log('⚠️ 未知的頁面狀態');
    }
    
    await page.screenshot({ path: 'screenshots/debug-api-access.png' });
    
    console.log('✅ API 存取偵錯完成');
  });
});