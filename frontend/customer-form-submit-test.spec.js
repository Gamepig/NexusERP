import { test, expect } from '@playwright/test';

test('客戶表單提交測試', async ({ page }) => {
  console.log('開始客戶表單提交測試...');

  // 登入
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');

  // 直接導航到客戶建立頁面
  await page.goto('http://127.0.0.1:8000/customers/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 填寫表單
  await page.fill('input[name="name"]', '測試客戶公司');
  await page.fill('input[name="email"]', 'test.customer@example.com');
  
  // 檢查聯絡電話欄位是否存在
  const phoneField = page.locator('input[name="phone"]');
  if (await phoneField.isVisible()) {
    await phoneField.fill('0912345678');
    console.log('✅ 已填寫聯絡電話');
  }

  // 截圖填寫完成的表單
  await page.screenshot({ path: 'screenshots/form-submit-test-filled.png', fullPage: true });

  // 尋找並點擊提交按鈕
  const submitButton = page.locator('button:has-text("建立客戶")');
  
  if (await submitButton.isVisible()) {
    console.log('✅ 找到建立客戶按鈕');
    
    // 點擊提交
    await submitButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 截圖提交後結果
    await page.screenshot({ path: 'screenshots/form-submit-test-result.png', fullPage: true });
    
    console.log('✅ 已點擊提交按鈕');
    console.log('當前 URL:', page.url());
    
    // 檢查提交結果
    const successMessage = await page.locator('text=成功, text=客戶已建立, text=已新增').isVisible().catch(() => false);
    const errorMessage = await page.locator('text=錯誤, text=失敗, text=Error').isVisible().catch(() => false);
    
    if (successMessage) {
      console.log('✅ 客戶建立成功');
    } else if (errorMessage) {
      console.log('❌ 客戶建立失敗');
    } else {
      console.log('ℹ️  無明確成功或失敗訊息');
    }
    
  } else {
    console.log('❌ 未找到建立客戶按鈕');
    
    // 列出所有可見按鈕
    const allButtons = await page.locator('button').all();
    console.log(`頁面上共有 ${allButtons.length} 個按鈕:`);
    for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
      const buttonText = await allButtons[i].textContent();
      console.log(`  按鈕 ${i + 1}: "${buttonText}"`);
    }
  }
});