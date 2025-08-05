import { test, expect } from '@playwright/test';

test('簡單登入測試', async ({ page }) => {
  console.log('🚀 開始簡單登入測試...');
  
  // 導航到登入頁面
  await page.goto('http://127.0.0.1:8000/login');
  console.log('📍 當前 URL:', page.url());
  
  // 等待頁面載入
  await page.waitForLoadState('domcontentloaded');
  
  // 檢查是否有登入表單
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');
  
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible();
  await expect(submitButton).toBeVisible();
  
  console.log('✅ 找到登入表單元素');
  
  // 填寫登入資訊
  await emailInput.fill('test@example.com');
  await passwordInput.fill('password123');
  
  console.log('✅ 填寫登入資訊完成');
  
  // 提交登入
  await submitButton.click();
  
  // 等待頁面跳轉
  await page.waitForTimeout(3000);
  console.log('📍 登入後 URL:', page.url());
  
  // 檢查是否成功登入（檢查 URL 或特定元素）
  if (page.url().includes('dashboard') || page.url().includes('home') || !page.url().includes('login')) {
    console.log('✅ 登入成功');
  } else {
    console.log('❌ 登入可能失敗');
    // 檢查是否有錯誤訊息
    const errorElements = await page.locator('.error, .alert-error, .text-red').count();
    if (errorElements > 0) {
      const errorText = await page.locator('.error, .alert-error, .text-red').first().textContent();
      console.log('❌ 錯誤訊息:', errorText);
    }
  }
});