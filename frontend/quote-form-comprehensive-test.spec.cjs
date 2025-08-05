const { test, expect } = require('@playwright/test');

test.describe('報價單建立完整流程測試', () => {
  test('完整測試表單提交流程並記錄所有Console輸出', async ({ page }) => {
    console.log('=== 開始報價單建立完整流程測試 ===');
    
    // 監聽 console 訊息
    const consoleMessages = [];
    page.on('console', msg => {
      const timestamp = new Date().toISOString();
      const messageData = {
        timestamp,
        type: msg.type(),
        text: msg.text(),
        args: msg.args().map(arg => arg.toString())
      };
      consoleMessages.push(messageData);
      console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${timestamp}: ${msg.text()}`);
    });

    // 監聽頁面錯誤
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR]: ${error.message}`);
      consoleMessages.push({
        timestamp: new Date().toISOString(),
        type: 'pageerror',
        text: error.message,
        stack: error.stack
      });
    });

    try {
      // 1. 前往報價單建立頁面
      console.log('步驟 1: 前往報價單建立頁面');
      await page.goto('http://127.0.0.1:8000/quotes/create');
      await page.waitForLoadState('networkidle');
      
      // 檢查是否需要登入
      const currentUrl = page.url();
      console.log(`當前 URL: ${currentUrl}`);
      
      if (currentUrl.includes('/login')) {
        console.log('步驟 2: 需要登入，進行登入流程');
        
        // 登入流程
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        // 重新導航到報價單建立頁面
        await page.goto('http://127.0.0.1:8000/quotes/create');
        await page.waitForLoadState('networkidle');
        console.log('登入完成，已重新導航到報價單建立頁面');
      }

      // 等待頁面完全載入
      await page.waitForSelector('#quoteForm', { timeout: 10000 });
      console.log('報價單表單已載入');

      // 3a. 客戶選擇
      console.log('步驟 3a: 測試客戶選擇');
      
      // 等待客戶下拉選單載入
      await page.waitForSelector('#customer_id', { timeout: 5000 });
      
      // 點擊客戶下拉選單
      await page.click('#customer_id');
      await page.waitForTimeout(1000);
      
      // 獲取所有選項
      const customerOptions = await page.$$eval('#customer_id option', options => 
        options.map(option => ({ value: option.value, text: option.textContent.trim() }))
      );
      console.log('客戶選項:', customerOptions);
      
      // 選擇第一個有效的客戶（不是預設的"請選擇客戶"）
      const validCustomer = customerOptions.find(option => option.value && option.value !== '');
      if (validCustomer) {
        await page.selectOption('#customer_id', validCustomer.value);
        console.log(`已選擇客戶: ${validCustomer.text} (值: ${validCustomer.value})`);
        
        // 確認選擇後的值
        const selectedValue = await page.$eval('#customer_id', el => el.value);
        console.log(`選擇後的客戶值: ${selectedValue}`);
      } else {
        console.log('警告: 沒有找到有效的客戶選項');
      }

      // 3b. 產品名稱輸入
      console.log('步驟 3b: 測試產品名稱輸入');
      
      // 等待產品搜尋輸入框
      await page.waitForSelector('.product-search', { timeout: 5000 });
      
      // 清空並輸入產品名稱
      await page.fill('.product-search', '');
      await page.fill('.product-search', '測試產品ABC');
      await page.waitForTimeout(500);
      
      // 確認產品輸入後失焦
      await page.click('body'); // 點擊其他地方以觸發失焦
      await page.waitForTimeout(1000);
      
      console.log('已輸入產品名稱: 測試產品ABC');

      // 3c. 檢查數量和單價
      console.log('步驟 3c: 檢查數量和單價');
      
      // 等待數量和單價輸入框
      await page.waitForSelector('.quantity-input', { timeout: 5000 });
      await page.waitForSelector('.price-input', { timeout: 5000 });
      
      // 檢查預設值並設置
      const quantity = await page.$eval('.quantity-input', el => el.value);
      const price = await page.$eval('.price-input', el => el.value);
      
      console.log(`當前數量: ${quantity}, 當前單價: ${price}`);
      
      // 如果需要，設置數量為 1
      if (quantity !== '1') {
        await page.fill('.quantity-input', '1');
      }
      
      // 如果需要，設置單價為 1000
      if (price !== '1000') {
        await page.fill('.price-input', '1000');
      }

      // 4. 開啟Console並執行檢查
      console.log('步驟 4: 執行頁面Console檢查');
      
      const formCheckResults = await page.evaluate(() => {
        const results = {};
        
        // 檢查所有欄位值
        const customerEl = document.getElementById('customer_id');
        const productEl = document.querySelector('.product-search');
        const quantityEl = document.querySelector('.quantity-input');
        const priceEl = document.querySelector('.price-input');
        
        results.customer = customerEl ? customerEl.value : 'NOT_FOUND';
        results.product = productEl ? productEl.value : 'NOT_FOUND';
        results.quantity = quantityEl ? quantityEl.value : 'NOT_FOUND';
        results.price = priceEl ? priceEl.value : 'NOT_FOUND';
        
        console.log('Customer:', results.customer);
        console.log('Product:', results.product);
        console.log('Quantity:', results.quantity);
        console.log('Price:', results.price);
        
        // 檢查FormData
        const form = document.getElementById('quoteForm');
        const formDataEntries = {};
        
        if (form) {
          const formData = new FormData(form);
          for (let [key, value] of formData.entries()) {
            formDataEntries[key] = value;
            console.log('FormData:', key, '=', value);
          }
        }
        
        results.formData = formDataEntries;
        return results;
      });
      
      console.log('=== 表單檢查結果 ===');
      console.log('客戶:', formCheckResults.customer);
      console.log('產品:', formCheckResults.product);
      console.log('數量:', formCheckResults.quantity);
      console.log('單價:', formCheckResults.price);
      console.log('FormData:', formCheckResults.formData);

      // 5. 截圖記錄當前狀態
      await page.screenshot({ 
        path: 'quote-form-before-submit.png', 
        fullPage: true 
      });
      console.log('已保存提交前截圖: quote-form-before-submit.png');

      // 6. 點擊建立報價單按鈕
      console.log('步驟 5: 點擊建立報價單按鈕');
      
      // 等待並點擊提交按鈕
      const submitButton = await page.waitForSelector('button[type="submit"], .btn-primary, [value="建立報價單"]', { timeout: 5000 });
      
      if (submitButton) {
        await submitButton.click();
        console.log('已點擊建立報價單按鈕');
        
        // 等待響應
        await page.waitForTimeout(3000);
        
        // 檢查提交後的狀態
        const finalUrl = page.url();
        console.log(`提交後的 URL: ${finalUrl}`);
        
        // 截圖記錄最終狀態
        await page.screenshot({ 
          path: 'quote-form-after-submit.png', 
          fullPage: true 
        });
        console.log('已保存提交後截圖: quote-form-after-submit.png');
      } else {
        console.log('錯誤: 找不到提交按鈕');
      }

      // 7. 記錄所有Console輸出
      console.log('=== 完整 Console 輸出記錄 ===');
      consoleMessages.forEach((msg, index) => {
        console.log(`[${index + 1}] ${msg.timestamp} [${msg.type.toUpperCase()}]: ${msg.text}`);
        if (msg.args && msg.args.length > 0) {
          console.log(`    參數: ${msg.args.join(', ')}`);
        }
      });
      
      // 總結測試結果
      console.log('=== 測試總結 ===');
      console.log(`總共記錄了 ${consoleMessages.length} 條Console訊息`);
      
      const errorMessages = consoleMessages.filter(msg => msg.type === 'error' || msg.type === 'pageerror');
      if (errorMessages.length > 0) {
        console.log(`發現 ${errorMessages.length} 個錯誤:`);
        errorMessages.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.text}`);
        });
      } else {
        console.log('沒有發現錯誤訊息');
      }
      
      // 驗證表單資料完整性
      const isDataComplete = formCheckResults.customer && formCheckResults.customer !== 'NOT_FOUND' &&
                             formCheckResults.product && formCheckResults.product !== 'NOT_FOUND' &&
                             formCheckResults.quantity && formCheckResults.quantity !== 'NOT_FOUND' &&
                             formCheckResults.price && formCheckResults.price !== 'NOT_FOUND';
      
      console.log(`表單資料完整性: ${isDataComplete ? '完整' : '不完整'}`);
      
      // 保存詳細報告
      const report = {
        timestamp: new Date().toISOString(),
        testStatus: isDataComplete ? 'PASSED' : 'FAILED',
        formData: formCheckResults,
        consoleMessages: consoleMessages,
        errorCount: errorMessages.length,
        summary: {
          customer: formCheckResults.customer !== 'NOT_FOUND',
          product: formCheckResults.product !== 'NOT_FOUND',
          quantity: formCheckResults.quantity !== 'NOT_FOUND',
          price: formCheckResults.price !== 'NOT_FOUND'
        }
      };
      
      console.log('=== 最終測試報告 ===');
      console.log(JSON.stringify(report, null, 2));

    } catch (error) {
      console.error('測試過程中發生錯誤:', error.message);
      console.error('錯誤堆疊:', error.stack);
      
      // 保存錯誤截圖
      await page.screenshot({ 
        path: 'quote-form-error.png', 
        fullPage: true 
      });
      
      throw error;
    }
  });
});