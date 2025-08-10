import { test, expect } from '@playwright/test';

test.describe('完整報價單建立流程除錯測試', () => {
  test('登入後測試報價單建立並檢查Console除錯信息', async ({ page }) => {
    console.log('=== 開始完整報價單除錯測試 ===');
    
    // 收集所有Console訊息
    const consoleLogs = [];
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      consoleLogs.push(logEntry);
      // 即時輸出Console訊息
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    // 監聽JavaScript錯誤
    page.on('pageerror', error => {
      console.log(`[BROWSER ERROR] ${error.message}`);
      consoleLogs.push({
        type: 'error',
        text: `JavaScript Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    });
    
    // 1. 前往首頁
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    console.log('✓ 已前往首頁');
    
    // 2. 執行登入流程
    console.log('開始登入流程...');
    
    // 檢查是否已在登入頁面
    const isLoginPage = await page.locator('input[name="email"]').isVisible();
    
    if (isLoginPage) {
      console.log('在登入頁面，準備登入...');
      
      // 填寫登入資訊
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // 點擊登入按鈕
      await page.click('button:has-text("LOG IN")');
      await page.waitForLoadState('networkidle');
      console.log('✓ 已完成登入');
    } else {
      console.log('✓ 已登入或無需登入');
    }
    
    // 3. 等待並確認登入成功
    await page.waitForTimeout(2000);
    
    // 4. 直接前往報價單建立頁面
    console.log('前往報價單建立頁面...');
    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForLoadState('networkidle');
    
    // 5. 等待頁面載入並確認正確頁面
    try {
      await page.waitForSelector('h1', { timeout: 10000 });
      const pageTitle = await page.locator('h1').first().textContent();
      console.log(`✓ 頁面載入成功，標題: ${pageTitle}`);
    } catch (e) {
      console.log('⚠️ 未找到h1標題，檢查頁面內容...');
      const currentUrl = page.url();
      console.log(`當前URL: ${currentUrl}`);
      
      // 如果又被重新導向到登入頁面
      if (currentUrl.includes('/login')) {
        console.log('被重新導向到登入頁面，重新登入...');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button:has-text("LOG IN")');
        await page.waitForLoadState('networkidle');
        
        // 重新前往報價單頁面
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
      }
    }
    
    // 6. 等待表單載入
    await page.waitForTimeout(2000);
    
    // 7. 檢查並填寫客戶
    console.log('\n=== 開始填寫表單 ===');
    console.log('處理客戶選擇...');
    
    const customerSelect = page.locator('select').first();
    await customerSelect.waitFor({ state: 'visible', timeout: 5000 });
    
    // 獲取客戶選項
    const customerOptions = await customerSelect.locator('option').allTextContents();
    console.log('可用客戶選項:', customerOptions);
    
    // 選擇 Final Test Customer
    if (customerOptions.includes('Final Test Customer')) {
      await customerSelect.selectOption({ label: 'Final Test Customer' });
      console.log('✓ 已選擇客戶: Final Test Customer');
    } else {
      // 選擇第一個非空選項
      await customerSelect.selectOption({ index: 1 });
      const selectedText = await customerSelect.locator('option:checked').textContent();
      console.log(`✓ 已選擇客戶: ${selectedText}`);
    }
    
    await page.waitForTimeout(500);
    
    // 8. 處理產品名稱輸入
    console.log('處理產品名稱...');
    
    // 尋找產品輸入框
    const productInputSelectors = [
      'input[list]',
      'input.form-control',
      'input[type="text"]',
      'input[placeholder*="產品"]'
    ];
    
    let productInput = null;
    for (const selector of productInputSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible()) {
          productInput = input;
          console.log(`✓ 找到產品輸入框: ${selector}`);
          break;
        }
      } catch (e) {
        // 繼續尋找
      }
    }
    
    if (productInput) {
      await productInput.click();
      await productInput.fill('測試產品ABC');
      console.log('✓ 已填寫產品名稱: 測試產品ABC');
    } else {
      console.log('⚠️ 未找到產品輸入框');
    }
    
    await page.waitForTimeout(500);
    
    // 9. 處理數量和單價
    console.log('檢查數量和單價欄位...');
    
    const numberInputs = await page.locator('input[type="number"]').all();
    console.log(`找到 ${numberInputs.length} 個數字輸入框`);
    
    if (numberInputs.length >= 1) {
      const quantityValue = await numberInputs[0].inputValue();
      console.log(`數量欄位當前值: ${quantityValue}`);
      if (quantityValue !== '1') {
        await numberInputs[0].fill('1');
        console.log('✓ 已設定數量為 1');
      }
    }
    
    if (numberInputs.length >= 2) {
      const priceValue = await numberInputs[1].inputValue();
      console.log(`單價欄位當前值: ${priceValue}`);
      if (priceValue !== '1000') {
        await numberInputs[1].fill('1000');
        console.log('✓ 已設定單價為 1000');
      }
    }
    
    await page.waitForTimeout(1000);
    
    // 10. 表單填寫完成狀態檢查
    console.log('\n=== 表單填寫完成狀態 ===');
    
    const customerValue = await customerSelect.inputValue();
    console.log(`客戶ID: ${customerValue}`);
    
    if (productInput) {
      const productValue = await productInput.inputValue();
      console.log(`產品名稱: "${productValue}"`);
    }
    
    if (numberInputs.length >= 1) {
      const quantityValue = await numberInputs[0].inputValue();
      console.log(`數量: ${quantityValue}`);
    }
    
    if (numberInputs.length >= 2) {
      const priceValue = await numberInputs[1].inputValue();
      console.log(`單價: ${priceValue}`);
    }
    
    // 11. 準備提交 - 清空Console logs準備收集提交時的訊息
    console.log('\n=== 準備提交表單，開始重點監聽Console ===');
    consoleLogs.length = 0;
    
    // 12. 尋找並點擊提交按鈕
    const submitSelectors = [
      'button:has-text("建立報價單")',
      'button:has-text("建立")',
      'button:has-text("提交")',
      'button[type="submit"]'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible()) {
          submitButton = btn;
          console.log(`✓ 找到提交按鈕: ${selector}`);
          break;
        }
      } catch (e) {
        // 繼續尋找
      }
    }
    
    if (submitButton) {
      console.log('🔥 點擊"建立報價單"按鈕...');
      await submitButton.click();
      console.log('✓ 已點擊提交按鈕');
    } else {
      console.log('❌ 未找到提交按鈕');
    }
    
    // 13. 等待提交處理並收集Console訊息
    console.log('等待表單提交處理...');
    await page.waitForTimeout(5000);
    
    // 14. 輸出提交時的Console除錯信息
    console.log('\n🔍 === 表單提交時的 Console 除錯信息 ===');
    if (consoleLogs.length > 0) {
      console.log(`檢測到 ${consoleLogs.length} 條Console訊息:`);
      consoleLogs.forEach((log, index) => {
        console.log(`[${index + 1}] [${log.type.toUpperCase()}] ${log.text}`);
      });
    } else {
      console.log('❌ 提交時沒有檢測到Console訊息');
    }
    
    // 15. 檢查頁面回應
    console.log('\n=== 檢查提交後頁面狀態 ===');
    
    const currentUrl = page.url();
    console.log(`當前URL: ${currentUrl}`);
    
    // 檢查頁面訊息
    const alertSelectors = ['.alert', '.error', '.success', '.message', '.notification', '[role="alert"]'];
    let foundMessages = false;
    
    for (const selector of alertSelectors) {
      try {
        const messages = await page.locator(selector).all();
        for (let i = 0; i < messages.length; i++) {
          const messageText = await messages[i].textContent();
          if (messageText && messageText.trim()) {
            console.log(`頁面訊息 [${selector}]: ${messageText.trim()}`);
            foundMessages = true;
          }
        }
      } catch (e) {
        // 繼續檢查下一個
      }
    }
    
    if (!foundMessages) {
      console.log('沒有找到明顯的成功/錯誤訊息');
    }
    
    // 16. 檢查表單清除狀態
    console.log('\n=== 檢查表單清除狀態 ===');
    
    if (productInput) {
      const postProductValue = await productInput.inputValue().catch(() => '');
      console.log(`提交後產品名稱: "${postProductValue}"`);
    }
    
    if (numberInputs.length >= 1) {
      const postQuantityValue = await numberInputs[0].inputValue().catch(() => '');
      console.log(`提交後數量: ${postQuantityValue}`);
    }
    
    if (numberInputs.length >= 2) {
      const postPriceValue = await numberInputs[1].inputValue().catch(() => '');
      console.log(`提交後單價: ${postPriceValue}`);
    }
    
    // 17. 最終截圖
    await page.screenshot({ 
      path: 'tests/screenshots/quote-full-debug-final.png', 
      fullPage: true 
    });
    console.log('✓ 已儲存最終截圖到 tests/screenshots/quote-full-debug-final.png');
    
    console.log('\n🎯 === 測試完成總結 ===');
    console.log(`總共收集到 ${consoleLogs.length} 條Console訊息`);
    console.log(`最終URL: ${currentUrl}`);
    
    // 保持頁面開啟一段時間以便觀察
    await page.waitForTimeout(3000);
  });
});