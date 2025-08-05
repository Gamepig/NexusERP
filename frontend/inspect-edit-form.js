import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 檢查採購訂單編輯表單...');
    
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
    
    // 3. 檢查表單結構
    console.log('📋 步驟 3: 檢查表單結構');
    
    // 查找表單元素
    const forms = await page.locator('form').count();
    console.log(`📋 表單數量: ${forms}`);
    
    if (forms > 0) {
      // 檢查每個表單
      for (let i = 0; i < forms; i++) {
        const form = page.locator('form').nth(i);
        const action = await form.getAttribute('action');
        const method = await form.getAttribute('method');
        
        console.log(`📋 表單 ${i + 1}:`);
        console.log(`  - action: ${action}`);
        console.log(`  - method: ${method}`);
        
        // 檢查隱藏的方法字段
        const methodInput = form.locator('input[name="_method"]');
        if (await methodInput.count() > 0) {
          const hiddenMethod = await methodInput.getAttribute('value');
          console.log(`  - _method: ${hiddenMethod}`);
        }
        
        // 檢查 CSRF token
        const csrfInput = form.locator('input[name="_token"]');
        if (await csrfInput.count() > 0) {
          console.log(`  - _token: 存在`);
        }
        
        // 檢查提交按鈕
        const submitButtons = await form.locator('button[type="submit"], input[type="submit"]').count();
        console.log(`  - 提交按鈕數量: ${submitButtons}`);
        
        if (submitButtons > 0) {
          for (let j = 0; j < submitButtons; j++) {
            const button = form.locator('button[type="submit"], input[type="submit"]').nth(j);
            const buttonText = await button.textContent();
            const buttonValue = await button.getAttribute('value');
            console.log(`    * 按鈕 ${j + 1}: "${buttonText}" (value: ${buttonValue})`);
          }
        }
      }
    }
    
    // 4. 檢查頁面是否有 JavaScript 錯誤
    console.log('📋 步驟 4: 檢查 JavaScript 錯誤');
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
        console.log(`❌ JS 錯誤: ${msg.text()}`);
      }
    });
    
    // 等待一段時間讓 JS 加載完成
    await page.waitForTimeout(3000);
    
    if (jsErrors.length === 0) {
      console.log('✅ 無 JavaScript 錯誤');
    } else {
      console.log(`❌ 發現 ${jsErrors.length} 個 JavaScript 錯誤`);
    }
    
    // 等待使用者查看
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ 檢查過程中發生錯誤:', error);
  } finally {
    await browser.close();
  }
})();