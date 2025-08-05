import { test, expect } from '@playwright/test';

test('手動登入測試 - 診斷認證問題', async ({ page }) => {
  console.log('🔍 開始手動登入診斷...');
  
  // 前往登入頁面
  await page.goto('http://127.0.0.1:8000/login');
  await page.waitForLoadState('networkidle');
  
  console.log('📍 當前 URL:', page.url());
  
  // 截圖登入頁面
  await page.screenshot({ path: 'screenshots/manual-01-login-page.png', fullPage: true });
  
  // 檢查是否有測試帳號提示
  const testAccountInfo = await page.locator('text="測試帳號可以使用測試帳號登入"').count();
  console.log('🔐 找到測試帳號提示:', testAccountInfo > 0);
  
  // 填寫登入資訊
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  // 截圖填寫完成
  await page.screenshot({ path: 'screenshots/manual-02-form-filled.png', fullPage: true });
  
  // 監聽網路請求
  const responses = [];
  page.on('response', response => {
    if (response.url().includes('/login') || response.url().includes('/auth')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });
  
  // 提交表單
  console.log('📤 提交登入表單...');
  await page.click('button[type="submit"]');
  
  // 等待 5 秒看看發生什麼
  await page.waitForTimeout(5000);
  
  console.log('📍 提交後 URL:', page.url());
  
  // 截圖提交後狀態
  await page.screenshot({ path: 'screenshots/manual-03-after-submit.png', fullPage: true });
  
  // 檢查網路請求
  console.log('🌐 登入相關網路請求:');
  responses.forEach(response => {
    console.log(`  ${response.status} ${response.statusText} - ${response.url}`);
  });
  
  // 檢查是否有錯誤訊息
  const errorMessages = await page.locator('.alert-danger, .error, .text-red-500').allTextContents();
  if (errorMessages.length > 0) {
    console.log('❌ 錯誤訊息:', errorMessages);
  }
  
  // 檢查是否重定向成功
  if (page.url().includes('/dashboard') || page.url().includes('/home')) {
    console.log('✅ 登入成功，已重定向到:', page.url());
    
    // 測試客戶頁面
    await page.goto('http://127.0.0.1:8000/customers');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 客戶頁面 URL:', page.url());
    
    // 截圖客戶頁面
    await page.screenshot({ path: 'screenshots/manual-04-customers-page.png', fullPage: true });
    
    // 檢查認證錯誤
    const authError = await page.locator('text="Authorization header required"').count();
    const unauthorizedError = await page.locator('text="Unauthorized"').count();
    
    console.log('🔒 認證錯誤檢查:');
    console.log('  Authorization header required:', authError);
    console.log('  Unauthorized:', unauthorizedError);
    
    if (authError === 0 && unauthorizedError === 0) {
      console.log('✅ API 認證問題已修復！');
    } else {
      console.log('❌ API 認證問題仍然存在');
    }
    
  } else if (page.url().includes('/login')) {
    console.log('❌ 登入失敗，仍在登入頁面');
    
    // 檢查可能的驗證錯誤
    const validationErrors = await page.locator('.invalid-feedback, .error-message').allTextContents();
    if (validationErrors.length > 0) {
      console.log('🚫 表單驗證錯誤:', validationErrors);
    }
  } else {
    console.log('⚠️ 未預期的重定向到:', page.url());
  }
});