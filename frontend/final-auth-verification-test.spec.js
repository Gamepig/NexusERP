import { test, expect } from '@playwright/test';

test('最終認證修復驗證', async ({ page }) => {
  console.log('🎯 開始最終認證修復驗證...');
  
  // 1. 前往登入頁面
  await page.goto('http://127.0.0.1:8000/login');
  await page.waitForLoadState('networkidle');
  
  console.log('📍 登入頁面載入完成');
  await page.screenshot({ path: 'screenshots/final-01-login-page.png', fullPage: true });
  
  // 2. 填寫並提交登入表單
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  console.log('📝 登入表單填寫完成');
  await page.screenshot({ path: 'screenshots/final-02-form-filled.png', fullPage: true });
  
  // 監聽登入請求
  let loginSuccess = false;
  page.on('response', response => {
    if (response.url().includes('/login') && response.status() === 302) {
      loginSuccess = true;
      console.log('✅ 登入請求成功 (302 重定向)'); 
    }
  });
  
  await page.click('button[type="submit"]');
  
  // 等待登入處理
  await page.waitForTimeout(3000);
  
  console.log('📍 登入後 URL:', page.url());
  await page.screenshot({ path: 'screenshots/final-03-after-login.png', fullPage: true });
  
  // 3. 直接前往客戶頁面測試 API 認證
  console.log('👥 導航到客戶頁面...');
  await page.goto('http://127.0.0.1:8000/customers');
  await page.waitForLoadState('networkidle');
  
  // 等待頁面內容載入
  await page.waitForTimeout(5000);
  
  console.log('📍 客戶頁面 URL:', page.url());
  await page.screenshot({ path: 'screenshots/final-04-customers-page.png', fullPage: true });
  
  // 4. 檢查認證錯誤
  const authErrorCount = await page.locator('text="Authorization header required"').count();
  const unauthorizedCount = await page.locator('text="Unauthorized"').count();
  const error401Count = await page.locator('text="401"').count();
  
  console.log('🔍 認證錯誤檢查結果:');
  console.log(`  "Authorization header required": ${authErrorCount}`);
  console.log(`  "Unauthorized": ${unauthorizedCount}`);
  console.log(`  "401": ${error401Count}`);
  
  // 5. 檢查客戶資料
  const customerRows = await page.locator('tbody tr').count();
  const noDataMessage = await page.locator('text="共 0 位客戶"').count();
  
  console.log('📊 客戶資料檢查結果:');
  console.log(`  客戶行數: ${customerRows}`);
  console.log(`  無資料訊息: ${noDataMessage}`);
  
  // 6. 檢查頁面標題
  const pageTitle = await page.locator('h1, h2, .page-title').first().textContent();
  console.log(`📄 頁面標題: "${pageTitle}"`);
  
  // 7. 最終評估
  const authFixed = authErrorCount === 0 && unauthorizedCount === 0 && error401Count === 0;
  const pageLoaded = pageTitle && pageTitle.includes('客戶');
  
  console.log('\n🎯 最終評估結果:');
  console.log('========================');
  console.log(`✅ API 認證修復: ${authFixed ? '成功' : '失敗'}`);
  console.log(`✅ 頁面載入: ${pageLoaded ? '成功' : '失敗'}`);
  console.log(`✅ 登入功能: ${loginSuccess || page.url().includes('/dashboard') || page.url().includes('/customers') ? '成功' : '失敗'}`);
  
  // 最終截圖
  await page.screenshot({ path: 'screenshots/final-05-final-state.png', fullPage: true });
  
  // 斷言關鍵功能
  expect(authFixed, 'API 認證錯誤應該已修復').toBe(true);
  expect(pageLoaded, '客戶頁面應該正常載入').toBe(true);
  
  console.log('🎉 認證修復驗證完成！');
});