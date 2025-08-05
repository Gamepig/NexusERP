import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 開始測試採購訂單編輯功能...');
    
    // 1. 登入系統
    console.log('📋 步驟 1: 登入系統');
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL(/\/dashboard|\/home/, { timeout: 10000 });
    console.log('✅ 登入成功');
    
    // 2. 進入採購訂單列表頁面
    console.log('📋 步驟 2: 進入採購訂單列表');
    await page.goto('http://127.0.0.1:8000/orders/purchase');
    await page.waitForLoadState('networkidle');
    
    // 3. 查找第一個採購訂單的編輯按鈕
    console.log('📋 步驟 3: 查找採購訂單');
    const editButtons = await page.locator('a[href*="/orders/purchase/"][href*="/edit"]').all();
    
    if (editButtons.length === 0) {
      console.log('❌ 未找到可編輯的採購訂單');
      return;
    }
    
    const editButton = editButtons[0];
    const editUrl = await editButton.getAttribute('href');
    console.log(`📋 找到編輯連結: ${editUrl}`);
    
    // 4. 進入編輯頁面
    console.log('📋 步驟 4: 進入編輯頁面');
    await editButton.click();
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log(`📋 目前頁面 URL: ${currentUrl}`);
    
    // 5. 監聽網路請求
    console.log('📋 步驟 5: 開始監聽網路請求');
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      if (request.url().includes('/orders/purchase/') || request.url().includes('/api/purchase-orders/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
        console.log(`📤 請求: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/orders/purchase/') || response.url().includes('/api/purchase-orders/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`📥 回應: ${response.status()} ${response.url()}`);
      }
    });
    
    // 6. 嘗試點擊「更新採購訂單」按鈕
    console.log('📋 步驟 6: 點擊更新按鈕');
    
    // 尋找更新按鈕
    const updateButton = await page.locator('button[type="submit"]').or(
      page.locator('input[type="submit"]')
    ).or(
      page.locator('button').filter({ hasText: /更新|Update|提交|Submit/ })
    ).first();
    
    if (await updateButton.count() === 0) {
      console.log('❌ 未找到更新按鈕');
      // 列出所有按鈕
      const allButtons = await page.locator('button, input[type="submit"]').all();
      console.log(`📋 頁面上的所有按鈕 (${allButtons.length} 個):`);
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const type = await allButtons[i].getAttribute('type');
        console.log(`  - 按鈕 ${i + 1}: "${text}" (type: ${type})`);
      }
      return;
    }
    
    console.log('📋 找到更新按鈕，準備點擊...');
    await updateButton.click();
    
    // 7. 等待響應並檢查結果
    console.log('📋 步驟 7: 等待響應並檢查結果');
    await page.waitForTimeout(3000);
    
    // 檢查是否有錯誤訊息
    const errorMessages = await page.locator('.alert-danger, .error, .invalid-feedback').allTextContents();
    const successMessages = await page.locator('.alert-success, .success').allTextContents();
    
    if (errorMessages.length > 0) {
      console.log('❌ 發現錯誤訊息:');
      errorMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    }
    
    if (successMessages.length > 0) {
      console.log('✅ 發現成功訊息:');
      successMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    }
    
    // 8. 輸出網路請求詳情
    console.log('\n📊 網路請求詳情:');
    console.log('請求記錄:');
    requests.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.method} ${req.url}`);
    });
    
    console.log('回應記錄:');
    responses.forEach((res, index) => {
      console.log(`  ${index + 1}. ${res.status} ${res.statusText} - ${res.url}`);
    });
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
  } finally {
    await browser.close();
  }
})();