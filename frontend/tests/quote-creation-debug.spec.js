import { test, expect } from '@playwright/test';

test.describe('報價單建立功能除錯測試', () => {
  test.beforeEach(async ({ page }) => {
    // 開啟開發者工具Console監聽
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });
    
    // 將console logs存到page context中以便後續存取
    page.consoleLogs = consoleLogs;
  });

  test('測試報價單建立功能並檢查Console除錯信息', async ({ page }) => {
    console.log('=== 開始報價單建立除錯測試 ===');
    
    // 1. 前往主頁面
    await page.goto('http://127.0.0.1:8000');
    console.log('✓ 已前往首頁');
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle');
    
    // 2. 檢查是否需要登入
    const needLogin = await page.locator('input[name="email"]').isVisible().catch(() => false);
    
    if (needLogin) {
      console.log('需要登入系統...');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      console.log('✓ 已完成登入');
    } else {
      console.log('✓ 無需登入或已登入');
    }
    
    // 3. 導航到報價管理
    console.log('導航到報價管理...');
    
    // 尋找報價管理相關連結
    const quoteLinks = [
      'a[href*="quote"]',
      'a[href*="報價"]',
      'text=報價管理',
      'text=報價單',
      'text=Quote'
    ];
    
    let quoteNavFound = false;
    for (const selector of quoteLinks) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          console.log(`✓ 點擊了導航元素: ${selector}`);
          quoteNavFound = true;
          break;
        }
      } catch (e) {
        // 繼續嘗試下一個選擇器
      }
    }
    
    if (!quoteNavFound) {
      // 嘗試直接前往報價頁面
      await page.goto('http://127.0.0.1:8000/quotes');
      console.log('✓ 直接前往報價頁面');
    }
    
    await page.waitForLoadState('networkidle');
    
    // 4. 尋找建立報價單按鈕或連結
    console.log('尋找建立報價單功能...');
    
    const createButtons = [
      'text=建立報價單',
      'text=新增報價單',
      'text=Create Quote',
      'a[href*="create"]',
      'button:has-text("建立")',
      'button:has-text("新增")',
      '.btn-primary',
      '.btn-success'
    ];
    
    let createFound = false;
    for (const selector of createButtons) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          console.log(`✓ 點擊了建立按鈕: ${selector}`);
          createFound = true;
          break;
        }
      } catch (e) {
        // 繼續嘗試下一個選擇器
      }
    }
    
    if (!createFound) {
      // 嘗試直接前往建立頁面
      await page.goto('http://127.0.0.1:8000/quotes/create');
      console.log('✓ 直接前往報價單建立頁面');
    }
    
    await page.waitForLoadState('networkidle');
    
    // 5. 檢查頁面是否正確載入
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`目前頁面 URL: ${currentUrl}`);
    
    // 6. 填寫表單
    console.log('開始填寫表單...');
    
    // 客戶選擇
    console.log('選擇客戶...');
    const customerSelectors = [
      'select[name="customer_id"]',
      '#customer_id',
      'select:has(option:text("Final Test Customer"))',
      'select'
    ];
    
    let customerSelected = false;
    for (const selector of customerSelectors) {
      try {
        const customerSelect = page.locator(selector).first();
        if (await customerSelect.isVisible()) {
          // 檢查是否有 "Final Test Customer" 選項
          const hasTestCustomer = await customerSelect.locator('option:text("Final Test Customer")').count() > 0;
          if (hasTestCustomer) {
            await customerSelect.selectOption({ label: 'Final Test Customer' });
            console.log('✓ 已選擇客戶: Final Test Customer');
            customerSelected = true;
            break;
          } else {
            // 選擇第一個可用的客戶
            const options = await customerSelect.locator('option').all();
            if (options.length > 1) {
              await customerSelect.selectOption({ index: 1 });
              const selectedValue = await customerSelect.inputValue();
              console.log(`✓ 已選擇客戶 (index 1): ${selectedValue}`);
              customerSelected = true;
              break;
            }
          }
        }
      } catch (e) {
        console.log(`嘗試客戶選擇器失敗: ${selector}`);
      }
    }
    
    // 產品名稱
    console.log('填寫產品名稱...');
    const productSelectors = [
      'input[name="product_name"]',
      '#product_name',
      'input[placeholder*="產品"]',
      'input[type="text"]'
    ];
    
    for (const selector of productSelectors) {
      try {
        const productInput = page.locator(selector).first();
        if (await productInput.isVisible()) {
          await productInput.fill('測試產品ABC');
          console.log('✓ 已填寫產品名稱: 測試產品ABC');
          break;
        }
      } catch (e) {
        // 繼續下一個
      }
    }
    
    // 數量
    console.log('填寫數量...');
    const quantitySelectors = [
      'input[name="quantity"]',
      '#quantity',
      'input[type="number"]'
    ];
    
    for (const selector of quantitySelectors) {
      try {
        const quantityInput = page.locator(selector).first();
        if (await quantityInput.isVisible()) {
          await quantityInput.fill('1');
          console.log('✓ 已設定數量: 1');
          break;
        }
      } catch (e) {
        // 繼續下一個
      }
    }
    
    // 單價
    console.log('填寫單價...');
    const priceSelectors = [
      'input[name="unit_price"]',
      'input[name="price"]',
      '#unit_price',
      '#price'
    ];
    
    for (const selector of priceSelectors) {
      try {
        const priceInput = page.locator(selector).first();
        if (await priceInput.isVisible()) {
          await priceInput.fill('1000');
          console.log('✓ 已設定單價: 1000');
          break;
        }
      } catch (e) {
        // 繼續下一個
      }
    }
    
    await page.waitForTimeout(1000);
    
    // 7. 開啟開發者工具並切換到Console (模擬)
    console.log('=== 準備提交表單，開始監聽Console ===');
    
    // 清空之前的console logs
    page.consoleLogs = [];
    
    // 8. 點擊提交按鈕
    const submitSelectors = [
      'button:has-text("建立報價單")',
      'button:has-text("建立")',
      'button:has-text("提交")',
      'button[type="submit"]',
      '.btn-primary',
      'input[type="submit"]'
    ];
    
    let submitClicked = false;
    for (const selector of submitSelectors) {
      try {
        const submitBtn = page.locator(selector).first();
        if (await submitBtn.isVisible()) {
          console.log(`準備點擊提交按鈕: ${selector}`);
          await submitBtn.click();
          console.log('✓ 已點擊提交按鈕');
          submitClicked = true;
          break;
        }
      } catch (e) {
        console.log(`提交按鈕嘗試失敗: ${selector}`);
      }
    }
    
    if (!submitClicked) {
      console.log('⚠️ 未找到提交按鈕');
    }
    
    // 9. 等待並收集Console訊息
    await page.waitForTimeout(3000);
    
    // 10. 輸出所有Console除錯信息
    console.log('\n=== Console 除錯信息 ===');
    if (page.consoleLogs && page.consoleLogs.length > 0) {
      page.consoleLogs.forEach((log, index) => {
        console.log(`[${index + 1}] [${log.type.toUpperCase()}] ${log.timestamp}: ${log.text}`);
      });
    } else {
      console.log('沒有檢測到Console訊息');
    }
    
    // 11. 檢查頁面是否有錯誤訊息或成功訊息
    console.log('\n=== 檢查頁面訊息 ===');
    
    const messageSelectors = [
      '.alert',
      '.error',
      '.success',
      '.message',
      '.notification',
      '[class*="alert"]',
      '[class*="error"]',
      '[class*="success"]'
    ];
    
    for (const selector of messageSelectors) {
      try {
        const messages = await page.locator(selector).all();
        for (let i = 0; i < messages.length; i++) {
          const messageText = await messages[i].textContent();
          if (messageText && messageText.trim()) {
            console.log(`頁面訊息 [${selector}]: ${messageText.trim()}`);
          }
        }
      } catch (e) {
        // 繼續下一個
      }
    }
    
    // 12. 檢查表單是否被清除
    console.log('\n=== 檢查表單狀態 ===');
    
    try {
      const productValue = await page.locator('input[name="product_name"]').first().inputValue().catch(() => '');
      const quantityValue = await page.locator('input[name="quantity"]').first().inputValue().catch(() => '');
      const priceValue = await page.locator('input[name="unit_price"], input[name="price"]').first().inputValue().catch(() => '');
      
      console.log(`產品名稱欄位值: "${productValue}"`);
      console.log(`數量欄位值: "${quantityValue}"`);
      console.log(`單價欄位值: "${priceValue}"`);
      
      if (!productValue && !quantityValue && !priceValue) {
        console.log('✓ 表單已被清除');
      } else {
        console.log('表單未被清除或部分清除');
      }
    } catch (e) {
      console.log('檢查表單狀態時發生錯誤');
    }
    
    // 13. 截圖以供參考
    await page.screenshot({ path: 'tests/screenshots/quote-creation-debug.png', fullPage: true });
    console.log('✓ 已儲存截圖到 tests/screenshots/quote-creation-debug.png');
    
    console.log('\n=== 測試完成 ===');
  });
});