import { test, expect } from '@playwright/test';

test.describe('報價單Console除錯測試', () => {
  test('手動填寫報價單並檢查Console除錯信息', async ({ page }) => {
    console.log('=== 開始報價單Console除錯測試 ===');
    
    // 收集Console訊息
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
      // 即時輸出Console訊息
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    // 監聽JavaScript錯誤
    page.on('pageerror', error => {
      console.log(`[BROWSER ERROR] ${error.message}`);
    });
    
    // 1. 直接前往報價單建立頁面
    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForLoadState('networkidle');
    console.log('✓ 已前往報價單建立頁面');
    
    // 2. 等待頁面完全載入
    await page.waitForSelector('h1:has-text("建立報價單")', { timeout: 10000 });
    console.log('✓ 頁面標題已載入');
    
    // 3. 選擇客戶 - 使用更精確的選擇器
    console.log('選擇客戶：Final Test Customer...');
    const customerSelect = page.locator('select[name="customer_id"]').first();
    await customerSelect.waitFor({ state: 'visible' });
    
    // 檢查客戶選項
    const customerOptions = await customerSelect.locator('option').allTextContents();
    console.log('可用客戶選項:', customerOptions);
    
    // 選擇 Final Test Customer
    if (customerOptions.includes('Final Test Customer')) {
      await customerSelect.selectOption({ label: 'Final Test Customer' });
      console.log('✓ 已選擇客戶: Final Test Customer');
    } else {
      console.log('⚠️ 未找到 Final Test Customer，選擇第一個可用客戶');
      await customerSelect.selectOption({ index: 1 });
    }
    
    await page.waitForTimeout(1000);
    
    // 4. 填寫產品資訊 - 找到正確的產品輸入框
    console.log('填寫產品名稱...');
    
    // 尋找產品輸入框 (可能是combobox或input)
    const productInput = page.locator('input[list], input.form-control').first();
    if (await productInput.isVisible()) {
      await productInput.click();
      await productInput.fill('測試產品ABC');
      console.log('✓ 已填寫產品名稱: 測試產品ABC');
    } else {
      console.log('⚠️ 未找到產品輸入框');
    }
    
    await page.waitForTimeout(500);
    
    // 5. 確認數量和單價
    console.log('檢查數量和單價...');
    
    const quantityInput = page.locator('input[type="number"]').first();
    const priceInput = page.locator('input[type="number"]').nth(1);
    
    if (await quantityInput.isVisible()) {
      const quantityValue = await quantityInput.inputValue();
      console.log(`數量欄位值: ${quantityValue}`);
      if (quantityValue !== '1') {
        await quantityInput.fill('1');
        console.log('✓ 已設定數量為 1');
      }
    }
    
    if (await priceInput.isVisible()) {
      const priceValue = await priceInput.inputValue();
      console.log(`單價欄位值: ${priceValue}`);
      if (priceValue !== '1000') {
        await priceInput.fill('1000');
        console.log('✓ 已設定單價為 1000');
      }
    }
    
    await page.waitForTimeout(1000);
    
    // 6. 檢查當前表單狀態
    console.log('\n=== 提交前表單狀態 ===');
    const customerValue = await customerSelect.inputValue();
    const productValue = await productInput.inputValue().catch(() => '');
    const quantityValue = await quantityInput.inputValue().catch(() => '');
    const priceValue = await priceInput.inputValue().catch(() => '');
    
    console.log(`客戶ID: ${customerValue}`);
    console.log(`產品名稱: "${productValue}"`);
    console.log(`數量: ${quantityValue}`);
    console.log(`單價: ${priceValue}`);
    
    // 7. 點擊提交按鈕前先清空之前的Console logs
    consoleLogs.length = 0;
    console.log('\n=== 準備提交表單 ===');
    
    // 8. 找到並點擊提交按鈕
    const submitButton = page.locator('button:has-text("建立報價單")').first();
    await submitButton.waitFor({ state: 'visible' });
    
    console.log('點擊"建立報價單"按鈕...');
    await submitButton.click();
    
    // 9. 等待並收集提交後的訊息
    await page.waitForTimeout(3000);
    
    // 10. 輸出所有Console除錯信息
    console.log('\n=== 提交後 Console 除錯信息 ===');
    if (consoleLogs.length > 0) {
      consoleLogs.forEach((log, index) => {
        console.log(`[${index + 1}] [${log.type.toUpperCase()}] ${log.text}`);
      });
    } else {
      console.log('提交後沒有檢測到新的Console訊息');
    }
    
    // 11. 檢查頁面回應
    console.log('\n=== 檢查頁面狀態 ===');
    
    // 檢查URL是否改變
    const currentUrl = page.url();
    console.log(`當前URL: ${currentUrl}`);
    
    // 檢查是否有錯誤或成功訊息
    const alertMessages = await page.locator('.alert, .error, .success, .message').allTextContents();
    if (alertMessages.length > 0) {
      console.log('頁面訊息:');
      alertMessages.forEach((msg, index) => {
        console.log(`  [${index + 1}] ${msg.trim()}`);
      });
    } else {
      console.log('沒有找到頁面訊息');
    }
    
    // 12. 檢查表單是否被清除
    console.log('\n=== 檢查表單清除狀態 ===');
    const postProductValue = await productInput.inputValue().catch(() => '');
    const postQuantityValue = await quantityInput.inputValue().catch(() => '');
    const postPriceValue = await priceInput.inputValue().catch(() => '');
    
    console.log(`提交後產品名稱: "${postProductValue}"`);
    console.log(`提交後數量: ${postQuantityValue}`);
    console.log(`提交後單價: ${postPriceValue}`);
    
    if (!postProductValue && postQuantityValue === '1' && postPriceValue === '1000') {
      console.log('✓ 表單部分清除 (產品名稱已清除，數量和單價保持預設值)');
    } else if (!postProductValue && !postQuantityValue && !postPriceValue) {
      console.log('✓ 表單完全清除');
    } else {
      console.log('表單未被清除或僅部分清除');
    }
    
    // 13. 最終截圖
    await page.screenshot({ path: 'tests/screenshots/quote-console-debug-final.png', fullPage: true });
    console.log('✓ 已儲存最終截圖');
    
    console.log('\n=== 測試完成 ===');
    
    // 保持頁面開啟一段時間以便觀察
    await page.waitForTimeout(2000);
  });
});