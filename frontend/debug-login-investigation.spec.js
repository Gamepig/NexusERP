import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:8000';

test('🔍 登入頁面狀況調查', async ({ page }) => {
  console.log('🕵️ 開始調查登入頁面狀況...');
  
  // 前往首頁
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  // 截圖當前狀態
  await page.screenshot({ path: 'debug-login-01-homepage.png', fullPage: true });
  
  // 檢查頁面標題
  const title = await page.title();
  console.log(`📄 頁面標題: ${title}`);
  
  // 檢查當前 URL
  const currentUrl = page.url();
  console.log(`🔗 當前 URL: ${currentUrl}`);
  
  // 檢查是否有登入表單
  const emailInput = await page.locator('input[name="email"]').count();
  const passwordInput = await page.locator('input[name="password"]').count();
  const loginForm = await page.locator('form').count();
  
  console.log(`📧 郵箱輸入框數量: ${emailInput}`);
  console.log(`🔒 密碼輸入框數量: ${passwordInput}`);
  console.log(`📋 表單數量: ${loginForm}`);
  
  // 檢查是否已經登入
  const isDashboard = currentUrl.includes('/dashboard');
  const hasLogoutButton = await page.locator('a:has-text("登出"), a:has-text("Logout"), .logout').count() > 0;
  
  console.log(`🎛️ 是否在儀表板: ${isDashboard}`);
  console.log(`🚪 是否有登出按鈕: ${hasLogoutButton}`);
  
  // 如果已經登入，嘗試登出
  if (hasLogoutButton) {
    console.log('👋 檢測到已登入，嘗試登出...');
    const logoutButton = await page.locator('a:has-text("登出"), a:has-text("Logout"), .logout').first();
    await logoutButton.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-login-02-after-logout.png', fullPage: true });
  }
  
  // 檢查頁面內容
  const bodyText = await page.locator('body').textContent();
  console.log(`📝 頁面內容摘要: ${bodyText.substring(0, 200)}...`);
  
  // 檢查所有輸入框
  const allInputs = await page.locator('input').count();
  console.log(`🔍 總輸入框數量: ${allInputs}`);
  
  if (allInputs > 0) {
    for (let i = 0; i < Math.min(allInputs, 5); i++) {
      const input = page.locator('input').nth(i);
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`  輸入框 ${i + 1}: type=${type}, name=${name}, placeholder=${placeholder}`);
    }
  }
  
  // 檢查是否需要手動導航到登入頁面
  if (emailInput === 0 && !isDashboard) {
    console.log('🔄 嘗試導航到登入頁面...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-login-03-login-page.png', fullPage: true });
    
    const loginEmailInput = await page.locator('input[name="email"]').count();
    console.log(`📧 登入頁面郵箱輸入框數量: ${loginEmailInput}`);
  }
  
  console.log('✅ 登入頁面調查完成');
});