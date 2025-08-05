import { test, expect } from '@playwright/test';

test.describe('報價單產品輸入框值獲取測試', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // 設定視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('專注測試產品輸入框的值獲取', async () => {
    // 1. 前往首頁
    console.log('🔄 前往首頁...');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 2. 檢查是否需要登入
    const currentUrl = page.url();
    console.log('📍 當前URL:', currentUrl);
    
    if (currentUrl.includes('/login') || await page.locator('input[name="email"]').isVisible()) {
      console.log('🔐 需要登入，開始登入流程...');
      
      // 填寫登入表單
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // 點擊登入按鈕
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      console.log('✅ 登入完成');
    }

    // 3. 前往報價單建立頁面
    console.log('🔄 前往報價單建立頁面...');
    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // 等待頁面完全載入

    // 4. 截圖：初始狀態
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/quotes-input-value-01-initial.png',
      fullPage: true 
    });

    // 5. 開啟瀏覽器 Console 並設定監聽
    await page.addScriptTag({
      content: `
        console.log('=== Console 監聽已啟動 ===');
        window.debugInfo = [];
        
        // 監聽表單提交
        document.addEventListener('submit', function(e) {
          console.log('📋 表單提交事件觸發');
          const formData = new FormData(e.target);
          for (let [key, value] of formData.entries()) {
            console.log('FormData:', key, '=', value);
            window.debugInfo.push({type: 'formData', key, value});
          }
        });
      `
    });

    // 6. 選擇客戶
    console.log('👤 選擇客戶...');
    const customerSelect = page.locator('select[name="customer_id"]');
    await customerSelect.waitFor({ state: 'visible' });
    
    // 檢查客戶選項
    const customerOptions = await customerSelect.locator('option').allTextContents();
    console.log('📋 可用客戶選項:', customerOptions);
    
    // 選擇第一個非空選項
    const validOptions = await customerSelect.locator('option:not([value=""])').all();
    if (validOptions.length > 0) {
      const firstValidOption = validOptions[0];
      const customerValue = await firstValidOption.getAttribute('value');
      await customerSelect.selectOption(customerValue);
      console.log('✅ 已選擇客戶ID:', customerValue);
    } else {
      console.log('⚠️ 沒有可用的客戶選項');
    }

    // 7. 專注測試產品輸入框
    console.log('🎯 開始測試產品輸入框...');
    
    // 尋找產品輸入框
    const productInput = page.locator('.product-search');
    await productInput.waitFor({ state: 'visible' });
    
    console.log('✅ 找到產品輸入框');

    // 檢查輸入框初始狀態
    const initialValue = await productInput.inputValue();
    const initialPlaceholder = await productInput.getAttribute('placeholder');
    console.log('📝 初始值:', initialValue);
    console.log('📝 Placeholder:', initialPlaceholder);

    // 8. 逐字輸入產品名稱
    console.log('⌨️ 開始逐字輸入"測試產品ABC"...');
    
    // 先清空輸入框
    await productInput.clear();
    
    // 逐字輸入
    const testProductName = '測試產品ABC';
    for (let i = 0; i < testProductName.length; i++) {
      await productInput.type(testProductName[i]);
      await page.waitForTimeout(100); // 每個字符間隔100ms
    }
    
    console.log('✅ 輸入完成');

    // 9. 檢查輸入後的值
    const afterInputValue = await productInput.inputValue();
    console.log('📝 輸入後的值:', afterInputValue);

    // 10. 點擊頁面其他地方確保失焦
    console.log('👆 點擊其他地方確保失焦...');
    await page.click('body'); // 點擊頁面背景
    await page.waitForTimeout(500);

    // 11. 再次檢查值
    const afterBlurValue = await productInput.inputValue();
    console.log('📝 失焦後的值:', afterBlurValue);

    // 12. 截圖：產品輸入完成狀態
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/quotes-input-value-02-product-filled.png',
      fullPage: true 
    });

    // 13. 填寫其他必要欄位
    console.log('📝 填寫其他欄位...');
    
    // 數量
    const quantityInput = page.locator('input[name="items[0][quantity]"]');
    await quantityInput.clear();
    await quantityInput.fill('1');
    
    // 單價
    const priceInput = page.locator('input[name="items[0][unit_price]"]');
    await priceInput.clear();
    await priceInput.fill('1000');

    console.log('✅ 其他欄位填寫完成');

    // 14. 在控制台中執行詳細檢查
    const consoleCheck = await page.evaluate(() => {
      const results = {
        querySelector: document.querySelector('.product-search')?.value || 'NOT_FOUND',
        name: document.querySelector('.product-search')?.name || 'NO_NAME',
        id: document.querySelector('.product-search')?.id || 'NO_ID',
        allInputs: [],
        formElements: []
      };
      
      // 檢查所有相關輸入框
      const allInputs = document.querySelectorAll('input, select, textarea');
      allInputs.forEach(input => {
        if (input.name && input.name.includes('name')) {
          results.allInputs.push({
            tag: input.tagName,
            name: input.name,
            value: input.value,
            type: input.type || 'unknown'
          });
        }
      });

      // 檢查表單結構
      const form = document.querySelector('form');
      if (form) {
        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
          if (key.includes('name')) {
            results.formElements.push({key, value});
          }
        }
      }

      return results;
    });

    console.log('🔍 控制台檢查結果:', JSON.stringify(consoleCheck, null, 2));

    // 15. 截圖：準備提交狀態
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/quotes-input-value-03-ready-submit.png',
      fullPage: true 
    });

    // 16. 在 Console 中添加調試腳本
    await page.addScriptTag({
      content: `
        console.log('=== 提交前的最終檢查 ===');
        
        const productInput = document.querySelector('.product-search');
        console.log('Product Input Element:', productInput);
        console.log('Product 1: value="' + (productInput ? productInput.value : 'ELEMENT_NOT_FOUND') + '"');
        console.log('Product 1: name="' + (productInput ? productInput.name : 'NO_NAME') + '"');
        
        // 檢查所有相關欄位
        const allNameInputs = document.querySelectorAll('input[name*="name"], input[name*="product"]');
        allNameInputs.forEach((input, index) => {
          console.log('Name Input ' + index + ':', input.name, '=', input.value);
        });
        
        // 檢查表單資料
        const form = document.querySelector('form');
        if (form) {
          console.log('=== FormData 內容 ===');
          const formData = new FormData(form);
          for (let [key, value] of formData.entries()) {
            console.log('FormData:', key, '=', value);
          }
        }
      `
    });

    // 17. 點擊建立報價單按鈕
    console.log('🚀 點擊建立報價單...');
    
    // 等待並點擊提交按鈕
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: 'visible' });
    
    // 在點擊前先暫停，讓我們能夠看到 console 輸出
    await page.waitForTimeout(1000);
    
    await submitButton.click();
    
    // 18. 等待響應並截圖
    await page.waitForTimeout(3000);
    
    // 最終截圖
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/quotes-input-value-04-after-submit.png',
      fullPage: true 
    });

    // 19. 獲取最終的控制台資訊
    const finalDebugInfo = await page.evaluate(() => {
      return window.debugInfo || [];
    });

    console.log('🏁 最終調試資訊:', JSON.stringify(finalDebugInfo, null, 2));

    console.log('✅ 測試完成');
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });
});