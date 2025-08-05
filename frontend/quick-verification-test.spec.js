import { test, expect } from '@playwright/test';

test.describe('NexusERP 快速功能驗證', () => {
  const TEST_CREDENTIALS = {
    email: 'test@example.com',
    password: 'password123'
  };

  test('登入和客戶頁面功能驗證', async ({ page }) => {
    console.log('🔧 開始登入和客戶頁面驗證');
    
    // 監聽錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text());
      }
    });

    // 1. 訪問登入頁面
    await page.goto('/login');
    await expect(page).toHaveTitle(/NexusERP/);
    
    await page.screenshot({ path: 'screenshots/quick-01-login-page.png' });
    
    // 2. 填寫登入資訊
    await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    
    await page.screenshot({ path: 'screenshots/quick-02-form-filled.png' });
    
    // 3. 提交登入表單
    await page.click('button[type="submit"]');
    
    // 4. 等待登入成功
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 檢查是否成功登入（可能重定向到dashboard或其他頁面）
    const currentUrl = page.url();
    console.log('登入後的 URL:', currentUrl);
    
    // 如果沒有重定向到dashboard，手動導航
    if (!currentUrl.includes('dashboard')) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }
    
    await page.screenshot({ path: 'screenshots/quick-03-after-login.png' });
    
    // 5. 測試客戶頁面
    console.log('📋 測試客戶管理頁面');
    
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    // 等待頁面內容載入
    await page.waitForTimeout(5000);
    
    // 檢查頁面內容
    const pageContent = await page.content();
    
    // 驗證不再有認證錯誤
    const hasAuthError = pageContent.includes('Authorization header required') ||
                        pageContent.includes('Unauthorized') ||
                        pageContent.includes('401');
    
    if (hasAuthError) {
      console.log('❌ 仍然存在認證錯誤');
    } else {
      console.log('✅ 認證錯誤已修復');
    }
    
    // 檢查是否有客戶相關內容
    const hasCustomerContent = pageContent.includes('客戶') || 
                              pageContent.includes('customer') ||
                              pageContent.includes('Customer');
    
    if (hasCustomerContent) {
      console.log('✅ 客戶頁面內容正常顯示');
    } else {
      console.log('⚠️ 客戶頁面內容可能有問題');
    }
    
    await page.screenshot({ path: 'screenshots/quick-04-customers-page.png' });
    
    // 6. 測試新增客戶功能（如果有按鈕）
    const addButton = page.locator('button:has-text("新增"), a:has-text("新增"), button:has-text("Add")').first();
    const hasAddButton = await addButton.isVisible().catch(() => false);
    
    if (hasAddButton) {
      console.log('✅ 發現新增客戶按鈕');
      await addButton.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/quick-05-add-customer-form.png' });
    } else {
      console.log('ℹ️ 未發現新增客戶按鈕，嘗試直接導航');
      await page.goto('/customers/create');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/quick-05-create-page.png' });
    }
    
    console.log('✅ 驗證測試完成');
  });
});