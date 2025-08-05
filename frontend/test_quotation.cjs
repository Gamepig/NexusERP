const { chromium } = require('playwright');

(async () => {
  console.log('🚀 開始自動化報價單建立功能測試...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 步驟1: 直接前往登入頁面
    console.log('📍 步驟1: 前往登入頁面 http://127.0.0.1:8000/login');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForTimeout(2000);
    
    // 檢查是否需要登入
    const loginFields = await page.locator('input[name="email"], input[type="email"]').count();
    
    if (loginFields > 0) {
      console.log('🔐 步驟2: 進行登入');
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"], input[type="password"]', 'password123');
      
      // 尋找登入按鈕
      const loginButton = await page.locator('button:has-text("LOG IN"), button[type="submit"], input[type="submit"]').first();
      if (await loginButton.count() > 0) {
        await loginButton.click();
        console.log('✅ 點擊登入按鈕');
      } else {
        console.log('❌ 未找到登入按鈕');
      }
      
      await page.waitForTimeout(5000); // 增加等待時間
      
      // 檢查是否成功登入
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.log('❌ 登入失敗，可能需要註冊或密碼錯誤');
        throw new Error('登入失敗');
      } else {
        console.log('✅ 登入成功');
      }
    } else {
      console.log('✅ 步驟2: 已登入狀態');
    }
    
    // 步驟3: 直接訪問報價單建立頁面
    console.log('📋 步驟3: 訪問報價單建立頁面');
    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForTimeout(3000);
    
    // 檢查頁面是否正確載入
    const pageTitle = await page.title();
    console.log(`頁面標題: ${pageTitle}`);
    
    // 檢查頁面內容
    const bodyText = await page.locator('body').textContent();
    console.log('頁面內容關鍵字檢查:');
    console.log('  - 包含"報價":', bodyText.includes('報價'));
    console.log('  - 包含"建立":', bodyText.includes('建立'));
    console.log('  - 包含"客戶":', bodyText.includes('客戶'));
    
    // 步驟4: 填寫表單
    console.log('📝 步驟4: 開始填寫表單');
    
    // 檢查客戶選擇器
    const customerSelect = await page.locator('select[name="customer_id"], select[name="customer"]').count();
    if (customerSelect > 0) {
      console.log('找到客戶選擇器，選擇客戶: Final Test Customer');
      const options = await page.locator('select[name="customer_id"] option, select[name="customer"] option').all();
      
      for (const option of options) {
        const text = await option.textContent();
        if (text && text.includes('Final Test Customer')) {
          await page.selectOption('select[name="customer_id"], select[name="customer"]', await option.getAttribute('value'));
          console.log('✅ 成功選擇客戶');
          break;
        }
      }
      await page.waitForTimeout(1000);
    } else {
      console.log('❌ 未找到客戶選擇器');
    }
    
    // 檢查產品名稱輸入框
    console.log('🔍 步驟5: 檢查產品名稱輸入框');
    const productNameInput = await page.locator('input[name="items[0][name]"]').first();
    
    if (await productNameInput.count() > 0) {
      // 檢查佔位符文字
      const placeholder = await productNameInput.getAttribute('placeholder');
      console.log(`產品名稱輸入框佔位符: ${placeholder}`);
      
      // 檢查佔位符是否包含新的文字
      if (placeholder && placeholder.includes('可搜尋或手動輸入')) {
        console.log('✅ 佔位符文字已更新，包含"可搜尋或手動輸入"');
      } else {
        console.log('⚠️ 佔位符文字可能未更新');
      }
      
      // 手動輸入產品名稱
      console.log('✏️ 手動輸入產品名稱: 測試產品ABC');
      await productNameInput.fill('測試產品ABC');
      await page.waitForTimeout(1000);
      
      // 檢查輸入值
      const inputValue = await productNameInput.inputValue();
      console.log(`輸入的產品名稱: ${inputValue}`);
    } else {
      console.log('❌ 未找到產品名稱輸入框');
    }
    
    // 填寫數量
    const quantityInput = await page.locator('input[name="items[0][quantity]"]').first();
    if (await quantityInput.count() > 0) {
      console.log('輸入數量: 1');
      await quantityInput.fill('1');
      await page.waitForTimeout(500);
    } else {
      console.log('❌ 未找到數量輸入框');
    }
    
    // 填寫單價
    const priceInput = await page.locator('input[name="items[0][unit_price]"]').first();
    if (await priceInput.count() > 0) {
      console.log('輸入單價: 1000');
      await priceInput.fill('1000');
      await page.waitForTimeout(500);
    } else {
      console.log('❌ 未找到單價輸入框');
    }
    
    // 步驟6: 點擊建立按鈕
    console.log('🚀 步驟6: 點擊建立報價單按鈕');
    const submitButton = await page.locator('button[type="submit"], input[type="submit"], button').filter({ hasText: /建立|創建|提交|submit/i }).first();
    
    if (await submitButton.count() > 0) {
      const buttonText = await submitButton.textContent();
      console.log(`找到提交按鈕: ${buttonText}`);
      
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      // 檢查結果
      const currentUrl = page.url();
      console.log(`提交後的URL: ${currentUrl}`);
      
      // 檢查是否有錯誤訊息
      const errorMessages = await page.locator('.alert-danger, .error, .text-danger, [class*="error"]').allTextContents();
      if (errorMessages.length > 0) {
        console.log('❌ 發現錯誤訊息:');
        errorMessages.forEach(msg => console.log(`  - ${msg}`));
      } else {
        console.log('✅ 未發現錯誤訊息');
      }
      
      // 檢查是否成功跳轉
      if (currentUrl.includes('/quotes/') && !currentUrl.includes('/create')) {
        console.log('✅ 成功建立報價單並跳轉到詳細頁面');
      } else {
        console.log('⚠️ 可能未成功跳轉，仍在建立頁面');
      }
      
    } else {
      console.log('❌ 未找到提交按鈕');
    }
    
    // 截圖記錄
    await page.screenshot({ path: 'quotation-test-result.png', fullPage: true });
    console.log('📸 測試結果截圖已保存為 quotation-test-result.png');
    
    console.log('\n🎯 測試完成！');
    
    // 保持瀏覽器開啟3秒以供查看
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    await page.screenshot({ path: 'quotation-test-error.png', fullPage: true });
    console.log('📸 錯誤截圖已保存為 quotation-test-error.png');
  } finally {
    await browser.close();
  }
})();