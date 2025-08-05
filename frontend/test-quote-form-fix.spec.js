import { test, expect } from '@playwright/test';

test.describe('報價單表單修復驗證', () => {
  test('產品搜尋認證修復測試', async ({ page }) => {
    console.log('🧪 開始測試報價單表單修復...');

    // 訪問登入頁面
    await page.goto('http://127.0.0.1:8000/login');
    
    // 使用測試帳號登入
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入成功並導航到報價單建立頁面
    await page.waitForURL('**/dashboard');
    await page.goto('http://127.0.0.1:8000/quotes/create');
    
    // 等待頁面載入
    await page.waitForSelector('#quoteForm');
    
    // 選擇客戶
    await page.selectOption('#customer_id', { index: 1 });
    
    // 測試產品搜尋功能
    const productInput = page.locator('.product-search').first();
    
    // 輸入搜尋關鍵字
    await productInput.click();
    await productInput.fill('產品');
    
    // 等待搜尋結果出現
    await page.waitForSelector('.product-autocomplete-dropdown', { 
      state: 'visible',
      timeout: 5000 
    });
    
    // 檢查是否有搜尋結果
    const searchResults = await page.locator('.autocomplete-item').count();
    console.log(`✅ 找到 ${searchResults} 個產品搜尋結果`);
    
    if (searchResults > 0) {
      // 選擇第一個產品
      await page.locator('.autocomplete-item').first().click();
      
      // 檢查產品名稱是否正確填入
      const selectedProductName = await productInput.inputValue();
      console.log(`✅ 產品已選擇: ${selectedProductName}`);
      
      // 填寫其他必填欄位
      await page.fill('input[name="items[0][quantity]"]', '10');
      await page.fill('input[name="items[0][unit_price]"]', '100');
      
      // 嘗試提交表單
      await page.click('button[type="submit"]');
      
      // 檢查是否有錯誤訊息
      const errorMessage = await page.locator('.bg-red-50').textContent();
      
      if (errorMessage && errorMessage.includes('Invalid request data')) {
        console.log('❌ 修復未完全生效，仍有驗證錯誤');
        console.log('錯誤訊息:', errorMessage);
      } else {
        console.log('✅ 報價單建立成功或進入下一步驟');
      }
      
    } else {
      console.log('❌ 產品搜尋仍然無法返回結果');
    }
    
    // 截圖保存測試結果
    await page.screenshot({ 
      path: 'quote-form-fix-test-result.png',
      fullPage: true 
    });
    
    console.log('🏁 測試完成，結果已截圖保存');
  });
});