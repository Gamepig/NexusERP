const { test, expect } = require('@playwright/test');

test.describe('NexusERP 登入功能測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設置較長的超時時間
    test.setTimeout(60000);
  });

  test('測試登入功能和客戶管理頁面', async ({ page }) => {
    console.log('=== 開始測試登入功能 ===');
    
    // 1. 訪問登入頁面
    console.log('1. 訪問登入頁面: http://127.0.0.1:8000/login');
    await page.goto('http://127.0.0.1:8000/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 截圖：登入頁面
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    console.log('✓ 登入頁面截圖已保存');
    
    // 檢查登入頁面元素
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    console.log('✓ 登入頁面元素檢查完成');
    
    // 2. 填寫登入表單
    console.log('2. 填寫登入憑證');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 截圖：填寫後的表單
    await page.screenshot({ path: 'screenshots/02-login-filled.png', fullPage: true });
    console.log('✓ 登入表單填寫截圖已保存');
    
    // 3. 提交登入表單
    console.log('3. 提交登入表單');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    // 截圖：登入後狀態
    await page.screenshot({ path: 'screenshots/03-after-login.png', fullPage: true });
    console.log('✓ 登入後截圖已保存');
    
    // 4. 檢查是否成功登入並重定向到儀表板
    console.log('4. 檢查登入結果');
    const currentUrl = page.url();
    console.log(`當前 URL: ${currentUrl}`);
    
    // 檢查是否重定向到儀表板
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/home') || currentUrl === 'http://127.0.0.1:8000/') {
      console.log('✓ 成功重定向到儀表板');
    } else {
      console.log(`⚠️ 未預期的重定向 URL: ${currentUrl}`);
    }
    
    // 檢查頁面是否包含成功登入的跡象
    const bodyText = await page.textContent('body');
    if (bodyText.includes('儀表板') || bodyText.includes('Dashboard') || bodyText.includes('歡迎') || bodyText.includes('Welcome')) {
      console.log('✓ 頁面內容確認登入成功');
    } else {
      console.log('⚠️ 未找到明確的登入成功指示');
    }
    
    // 檢查是否有錯誤訊息
    const errorMessages = await page.locator('.alert-danger, .error, .text-red-500, .text-danger').count();
    if (errorMessages === 0) {
      console.log('✓ 未發現錯誤訊息');
    } else {
      console.log(`⚠️ 發現 ${errorMessages} 個可能的錯誤訊息`);
      try {
        const errorText = await page.locator('.alert-danger, .error, .text-red-500, .text-danger').first().textContent();
        console.log(`錯誤訊息: ${errorText}`);
      } catch (e) {
        console.log('無法讀取錯誤訊息內容');
      }
    }
    
    // 5. 測試客戶管理功能
    console.log('5. 測試客戶管理功能');
    await page.goto('http://127.0.0.1:8000/customers', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 截圖：客戶管理頁面
    await page.screenshot({ path: 'screenshots/04-customers-page.png', fullPage: true });
    console.log('✓ 客戶管理頁面截圖已保存');
    
    // 檢查客戶管理頁面
    const customersUrl = page.url();
    console.log(`客戶管理頁面 URL: ${customersUrl}`);
    
    // 檢查是否有 Authorization header required 錯誤
    const customersBodyText = await page.textContent('body');
    if (customersBodyText.includes('Authorization header required')) {
      console.log('❌ 發現 "Authorization header required" 錯誤');
    } else if (customersBodyText.includes('客戶列表') || customersBodyText.includes('Customers') || customersBodyText.includes('客戶管理')) {
      console.log('✓ 客戶管理頁面正常載入');
    } else {
      console.log('⚠️ 客戶管理頁面內容需要進一步檢查');
    }
    
    // 記錄網路請求狀態
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // 等待一段時間讓 AJAX 請求完成
    await page.waitForTimeout(3000);
    
    if (networkErrors.length > 0) {
      console.log('⚠️ 發現網路錯誤:');
      networkErrors.forEach(error => {
        console.log(`  - ${error.status} ${error.statusText}: ${error.url}`);
      });
    } else {
      console.log('✓ 未發現網路錯誤');
    }
    
    console.log('=== 測試完成 ===');
  });
  
  test('測試無效登入憑證', async ({ page }) => {
    console.log('=== 開始測試無效登入憑證 ===');
    
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    
    // 使用無效憑證
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 截圖：無效登入嘗試
    await page.screenshot({ path: 'screenshots/05-invalid-login-attempt.png', fullPage: true });
    
    // 檢查是否顯示錯誤訊息
    const errorMessages = await page.locator('.alert-danger, .error, .text-red-500, .text-danger').count();
    if (errorMessages > 0) {
      console.log('✓ 無效登入正確顯示錯誤訊息');
      try {
        const errorText = await page.locator('.alert-danger, .error, .text-red-500, .text-danger').first().textContent();
        console.log(`錯誤訊息: ${errorText}`);
      } catch (e) {
        console.log('無法讀取錯誤訊息內容');
      }
    } else {
      console.log('⚠️ 無效登入未顯示錯誤訊息');
    }
    
    console.log('=== 無效登入測試完成 ===');
  });
});