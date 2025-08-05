import { test, expect } from '@playwright/test';

test.describe('供應商調試測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    
    // 監聽控制台訊息和錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ JavaScript 錯誤: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.log(`⚠️ JavaScript 警告: ${msg.text()}`);
      } else {
        console.log(`控制台 ${msg.type()}: ${msg.text()}`);
      }
    });
    
    // 監聽頁面錯誤
    page.on('pageerror', error => {
      console.log(`❌ 頁面錯誤: ${error.message}`);
    });
    
    // 監聽網路請求
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`請求: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`回應: ${response.status()} ${response.url()}`);
      }
    });
  });

  test('調試供應商創建問題', async ({ page }) => {
    console.log('🔍 開始調試供應商創建...');

    // 登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/(dashboard|home|\/)$/);
    console.log('✅ 登入成功');

    // 訪問供應商創建頁面
    await page.goto('http://127.0.0.1:8000/suppliers/create');
    await expect(page.locator('#supplier-form')).toBeVisible({ timeout: 10000 });
    console.log('✅ 成功導航到供應商創建頁面');

    // 等待頁面完全載入
    await page.waitForTimeout(2000);

    // 填寫表單
    await page.locator('input[name="name"]').fill('測試供應商調試');
    await page.locator('input[name="contact_person"]').fill('測試聯絡人');
    await page.locator('input[name="email"]').fill('debug-test@supplier.com');
    await page.locator('input[name="phone"]').fill('0912345678');
    
    console.log('✅ 表單填寫完成');

    // 等待一下，然後點擊提交
    await page.waitForTimeout(1000);
    
    // 檢查提交按鈕
    const submitButton = page.locator('button[type="submit"]');
    const submitButtonCount = await submitButton.count();
    console.log(`找到 ${submitButtonCount} 個提交按鈕`);
    
    if (submitButtonCount === 0) {
      console.log('❌ 找不到提交按鈕！');
      // 查看所有按鈕
      const allButtons = await page.locator('button').count();
      console.log(`頁面上總共有 ${allButtons} 個按鈕`);
      for (let i = 0; i < allButtons; i++) {
        const buttonText = await page.locator('button').nth(i).textContent();
        const buttonType = await page.locator('button').nth(i).getAttribute('type');
        console.log(`按鈕 ${i + 1}: "${buttonText}" (type: ${buttonType})`);
      }
      return;
    }
    
    // 監聽所有網路活動
    const allRequests = [];
    page.on('request', request => {
      allRequests.push(`${request.method()} ${request.url()}`);
    });
    
    // 執行 JavaScript 來觸發表單提交事件
    await page.evaluate(() => {
      const form = document.getElementById('supplier-form');
      if (form) {
        console.log('找到表單，準備提交');
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      } else {
        console.log('找不到表單！');
      }
    });
    
    await submitButton.click();
    console.log('✅ 點擊了提交按鈕');

    // 等待 5 秒看是否有任何請求
    await page.waitForTimeout(5000);
    
    console.log('📊 所有請求記錄:');
    allRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req}`);
    });

    // 檢查頁面是否有錯誤訊息
    const alerts = await page.locator('div[role="alert"], .alert, .error').count();
    if (alerts > 0) {
      console.log(`發現 ${alerts} 個警告或錯誤訊息`);
      for (let i = 0; i < alerts; i++) {
        const alertText = await page.locator('div[role="alert"], .alert, .error').nth(i).textContent();
        console.log(`錯誤 ${i + 1}: ${alertText}`);
      }
    }

    // 截圖
    await page.screenshot({ path: 'supplier-debug-screenshot.png', fullPage: true });
    console.log('📸 已保存截圖: supplier-debug-screenshot.png');

    console.log('🔍 調試完成');
  });
});