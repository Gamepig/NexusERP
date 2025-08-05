import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 2000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 手動測試採購訂單表單提交...');
    
    // 1. 登入系統
    console.log('📋 步驟 1: 登入系統');
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL(/\/dashboard|\/home/, { timeout: 10000 });
    console.log('✅ 登入成功');
    
    // 2. 進入編輯頁面
    console.log('📋 步驟 2: 進入編輯頁面');
    await page.goto('http://127.0.0.1:8000/orders/purchase/675/edit');
    await page.waitForLoadState('networkidle');
    
    // 3. 監聽網路請求
    console.log('📋 步驟 3: 開始監聽網路請求');
    const networkLogs = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/purchase-orders/')) {
        networkLogs.push({
          type: 'request',
          method: request.method(),
          url: request.url(),
          headers: Object.fromEntries(Object.entries(request.headers())),
          postData: request.postData()
        });
        console.log(`📤 請求: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', async response => {
      if (response.url().includes('/api/purchase-orders/')) {
        const responseBody = await response.text().catch(() => 'Unable to read response body');
        networkLogs.push({
          type: 'response',
          status: response.status(),
          statusText: response.statusText(),
          url: response.url(),
          body: responseBody
        });
        console.log(`📥 回應: ${response.status()} ${response.statusText()}`);
        console.log(`📄 回應內容: ${responseBody.substring(0, 200)}...`);
      }
    });
    
    // 4. 手動點擊提交按鈕
    console.log('📋 步驟 4: 準備點擊提交按鈕...');
    console.log('⏳ 等待 5 秒讓用戶準備...');
    await page.waitForTimeout(5000);
    
    const submitButton = page.locator('form').nth(2).locator('button[type="submit"]');
    await submitButton.click();
    
    console.log('✅ 已點擊提交按鈕');
    
    // 5. 等待響應
    console.log('📋 步驟 5: 等待響應...');
    await page.waitForTimeout(5000);
    
    // 6. 輸出完整的網路日誌
    console.log('\n📊 完整網路日誌:');
    networkLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.type.toUpperCase()}:`);
      if (log.type === 'request') {
        console.log(`   Method: ${log.method}`);
        console.log(`   URL: ${log.url}`);
        console.log(`   Headers:`, JSON.stringify(log.headers, null, 2));
        if (log.postData) {
          console.log(`   Post Data: ${log.postData.substring(0, 500)}...`);
        }
      } else {
        console.log(`   Status: ${log.status} ${log.statusText}`);
        console.log(`   URL: ${log.url}`);
        console.log(`   Body: ${log.body.substring(0, 500)}...`);
      }
    });
    
    // 等待使用者查看結果
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
  } finally {
    await browser.close();
  }
})();