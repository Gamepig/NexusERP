import { test, expect } from '@playwright/test';

test.describe('Quote Form Critical Fixes Testing', () => {
  test('TEST 1 & 2: Customer Pre-selection and Form Submission Fixes', async ({ page }) => {
    console.log('🔍 開始測試兩個關鍵的報價表單修復...');
    
    // 監聽所有網路請求
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/quotes')) {
        console.log(`📤 Request: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/quotes')) {
        console.log(`📥 Response: ${response.status()} ${response.url()}`);
      }
    });

    // 監聽控制台錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🖥️ Browser Console [error]: ${msg.text()}`);
      } else if (msg.type() === 'log') {
        console.log(`🖥️ Browser Console [log]: ${msg.text()}`);
      }
    });

    // 步驟 1: 登入系統
    console.log('📍 步驟1: 登入系統');
    await page.goto('http://127.0.0.1:8000');
    
    // 檢查是否已登入
    const isLoggedIn = await page.locator('text=Dashboard').isVisible();
    
    if (!isLoggedIn) {
      // 需要登入
      await page.goto('http://127.0.0.1:8000/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ 登入完成');

    // 步驟 2: 導航到客戶列表頁面
    console.log('📍 步驟2: 導航到客戶列表');
    await page.goto('http://127.0.0.1:8000/customers');
    await page.waitForLoadState('networkidle');
    
    // 等待客戶列表載入
    await page.waitForSelector('table, .customer-card, .customer-item', { timeout: 10000 });
    
    // 尋找任何可用的客戶
    const customerLinks = await page.locator('a[href*="/customers/"]:not([href*="/create"])').all();
    expect(customerLinks.length).toBeGreaterThan(0);
    
    console.log(`✅ 找到 ${customerLinks.length} 個客戶`);

    // 步驟 3: 點擊第一個客戶進入詳情頁面
    console.log('📍 步驟3: 進入客戶詳情頁面');
    await customerLinks[0].click();
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log(`🌐 客戶詳情頁面URL: ${currentUrl}`);
    
    // 確認我們在客戶詳情頁面
    expect(currentUrl).toMatch(/\/customers\/\d+$/);
    
    // 步驟 4: 點擊"建立報價單"按鈕 (TEST 1 開始)
    console.log('📍 步驟4: 點擊建立報價單按鈕 (TEST 1)');
    
    // 尋找建立報價單按鈕的不同可能選擇器
    const createQuoteButton = await page.locator('a:has-text("建立報價單"), button:has-text("建立報價單"), [data-action="create-quote"], .btn:has-text("報價")').first();
    await expect(createQuoteButton).toBeVisible({ timeout: 10000 });
    
    // 截圖客戶詳情頁面
    await page.screenshot({ path: 'customer-detail-page.png', fullPage: true });
    console.log('📸 客戶詳情頁面截圖已保存');
    
    await createQuoteButton.click();
    await page.waitForLoadState('networkidle');
    
    // 步驟 5: 驗證報價表單 URL 和客戶預選 (TEST 1 驗證)
    console.log('📍 步驟5: 驗證客戶預選功能 (TEST 1 驗證)');
    
    const quoteFormUrl = page.url();
    console.log(`🌐 報價表單URL: ${quoteFormUrl}`);
    
    // 驗證 URL 格式
    const urlMatch = quoteFormUrl.match(/\/customers\/(\d+)\/quotes\/create/);
    expect(urlMatch).toBeTruthy();
    const customerId = urlMatch[1];
    console.log(`✅ URL 格式正確，客戶ID: ${customerId}`);
    
    // 等待表單載入
    await page.waitForSelector('form, .quote-form', { timeout: 10000 });
    
    // 檢查客戶下拉選單是否預選
    const customerSelect = await page.locator('select[name="customer_id"], #customer_id, [data-field="customer"]').first();
    await expect(customerSelect).toBeVisible({ timeout: 5000 });
    
    const selectedValue = await customerSelect.inputValue();
    console.log(`🎯 客戶下拉選單選中值: ${selectedValue}`);
    console.log(`🎯 預期客戶ID: ${customerId}`);
    
    // 驗證客戶是否預選
    expect(selectedValue).toBe(customerId);
    console.log('✅ TEST 1 通過: 客戶已正確預選');
    
    // 截圖顯示預選的客戶
    await page.screenshot({ path: 'quote-form-customer-preselected.png', fullPage: true });
    console.log('📸 客戶預選截圖已保存');

    // 步驟 6: 填寫報價表單 (TEST 2 準備)
    console.log('📍 步驟6: 填寫報價表單 (TEST 2 準備)');
    
    // 填寫報價日期
    const quoteDateField = await page.locator('input[name="quote_date"], #quote_date, [data-field="date"]').first();
    if (await quoteDateField.isVisible()) {
      const today = new Date().toISOString().split('T')[0];
      await quoteDateField.fill(today);
      console.log(`✅ 填寫報價日期: ${today}`);
    }
    
    // 填寫有效期
    const validUntilField = await page.locator('input[name="valid_until"], #valid_until, [data-field="valid_until"]').first();
    if (await validUntilField.isVisible()) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      await validUntilField.fill(futureDateStr);
      console.log(`✅ 填寫有效期: ${futureDateStr}`);
    }
    
    // 嘗試添加產品項目
    console.log('🛍️ 嘗試添加產品項目...');
    
    // 尋找產品相關欄位
    const productField = await page.locator('input[name*="product"], select[name*="product"], [data-field="product"]').first();
    if (await productField.isVisible()) {
      if (await productField.getAttribute('type') === 'text') {
        await productField.fill('測試產品');
      }
      console.log('✅ 已填寫產品資訊');
    }
    
    // 填寫數量
    const quantityField = await page.locator('input[name*="quantity"], [data-field="quantity"]').first();
    if (await quantityField.isVisible()) {
      await quantityField.fill('1');
      console.log('✅ 已填寫數量');
    }
    
    // 填寫價格
    const priceField = await page.locator('input[name*="price"], [data-field="price"]').first();
    if (await priceField.isVisible()) {
      await priceField.fill('1000');
      console.log('✅ 已填寫價格');
    }
    
    // 填寫備註
    const notesField = await page.locator('textarea[name="notes"], #notes, [data-field="notes"]').first();
    if (await notesField.isVisible()) {
      await notesField.fill('測試報價單 - 驗證表單提交功能');
      console.log('✅ 已填寫備註');
    }
    
    // 截圖填寫完成的表單
    await page.screenshot({ path: 'quote-form-filled.png', fullPage: true });
    console.log('📸 已填寫表單截圖已保存');

    // 步驟 7: 提交表單 (TEST 2 執行)
    console.log('📍 步驟7: 提交報價表單 (TEST 2 執行)');
    
    // 記錄提交前的狀態
    console.log('📋 表單提交前狀態檢查...');
    
    // 尋找提交按鈕
    const submitButton = await page.locator('button[type="submit"], .btn-primary:has-text("建立"), .btn:has-text("提交"), .btn:has-text("儲存")').first();
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    
    console.log('✅ 找到提交按鈕');
    
    // 監聽任何表單錯誤
    let hasInvalidTokenError = false;
    let hasSubmissionError = false;
    
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`🚨 HTTP 錯誤: ${response.status()} ${response.url()}`);
        hasSubmissionError = true;
      }
    });
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Invalid token') || text.includes('CSRF')) {
        console.log(`🚨 發現 Invalid token 錯誤: ${text}`);
        hasInvalidTokenError = true;
      }
      if (text.includes('error') || text.includes('Error')) {
        console.log(`🚨 發現錯誤: ${text}`);
      }
    });
    
    // 點擊提交按鈕
    await submitButton.click();
    
    // 等待提交處理
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    // 步驟 8: 驗證提交結果 (TEST 2 驗證)
    console.log('📍 步驟8: 驗證提交結果 (TEST 2 驗證)');
    
    const finalUrl = page.url();
    console.log(`🌐 提交後URL: ${finalUrl}`);
    
    // 檢查是否有錯誤訊息
    const errorMessages = await page.locator('.alert-danger, .error, .text-red-500, [role="alert"]').all();
    
    if (errorMessages.length > 0) {
      console.log('🚨 發現錯誤訊息:');
      for (const error of errorMessages) {
        const errorText = await error.textContent();
        console.log(`   - ${errorText}`);
        if (errorText.includes('Invalid token')) {
          hasInvalidTokenError = true;
        }
      }
    }
    
    // 檢查是否成功重定向或顯示成功訊息
    const successIndicators = await page.locator('.alert-success, .success, .text-green-500, [data-success]').all();
    const isRedirected = !finalUrl.includes('/create') || finalUrl.includes('/quotes/') && !finalUrl.includes('/create');
    
    console.log(`📊 測試結果總結:`);
    console.log(`   📍 Invalid Token 錯誤: ${hasInvalidTokenError ? '❌ 發現' : '✅ 無'}`);
    console.log(`   📍 提交錯誤: ${hasSubmissionError ? '❌ 發現' : '✅ 無'}`);
    console.log(`   📍 成功指示器: ${successIndicators.length} 個`);
    console.log(`   📍 頁面重定向: ${isRedirected ? '✅ 是' : '❌ 否'}`);
    
    // 最終截圖
    await page.screenshot({ path: 'quote-form-submission-result.png', fullPage: true });
    console.log('📸 提交結果截圖已保存');
    
    // TEST 2 驗證
    expect(hasInvalidTokenError).toBe(false);
    console.log('✅ TEST 2 通過: 沒有 Invalid token 錯誤');
    
    // 整體測試成功
    console.log('🎉 兩個關鍵修復測試完成:');
    console.log('   ✅ TEST 1: 客戶預選功能正常');
    console.log('   ✅ TEST 2: 表單提交無 Invalid token 錯誤');
  });
});