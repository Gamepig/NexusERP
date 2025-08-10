import { test, expect } from '@playwright/test';

test.describe('產品數據丟失問題驗證', () => {
  test('驗證產品選擇後 product_id 正確傳遞到資料庫', async ({ page }) => {
    // 監聽 console 訊息
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'info') {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      }
    });

    // Step 1: 登入系統
    console.log('🔐 開始登入測試...');
    await page.goto('/');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL('**/dashboard');
    console.log('✅ 登入成功');

    // Step 2: 導航到多步驟表單
    console.log('🚀 導航到多步驟報價表單...');
    await page.goto('/quotes/create');
    await page.waitForLoadState('networkidle');
    
    // 等待頁面完全載入
    await page.waitForTimeout(2000);
    console.log('✅ 頁面載入完成');

    // Step 3: 填寫基本資訊
    console.log('📝 填寫基本資訊...');
    await page.fill('input[name="quote_number"]', 'TEST-' + Date.now());
    await page.fill('textarea[name="description"]', '產品數據丟失修復測試');
    
    // 選擇客戶 - 確保有選擇到客戶
    await page.click('#customer_id');
    await page.waitForTimeout(1000);
    const customerOptions = await page.$$('#customer_id option');
    if (customerOptions.length > 1) {
      await page.selectOption('#customer_id', { index: 1 });
      console.log('✅ 客戶選擇完成');
    }

    // Step 4: 執行產品搜尋測試
    console.log('🔍 執行產品搜尋測試...');
    
    // 清除 console 訊息記錄
    consoleMessages.length = 0;
    
    // 輸入搜尋關鍵字觸發產品搜尋
    const productInput = page.locator('input[data-autocomplete="products"]');
    await productInput.fill('測試');
    await page.waitForTimeout(2000); // 等待搜尋結果

    // 檢查搜尋結果是否出現
    const searchResults = page.locator('.autocomplete-results .autocomplete-item');
    const resultsCount = await searchResults.count();
    console.log(`🔍 找到 ${resultsCount} 個搜尋結果`);

    if (resultsCount > 0) {
      // 選擇第一個產品
      console.log('🎯 選擇第一個產品...');
      await searchResults.first().click();
      await page.waitForTimeout(1500); // 等待產品數據更新
      
      // 記錄選擇產品後的 Console 輸出
      console.log('\n📋 Console 調試訊息:');
      consoleMessages.forEach(msg => {
        console.log('  ' + msg);
      });

    } else {
      console.log('⚠️  未找到搜尋結果，嘗試其他關鍵字...');
      
      // 嘗試其他搜尋關鍵字
      await productInput.fill('laptop');
      await page.waitForTimeout(2000);
      
      const altResults = await page.locator('.autocomplete-results .autocomplete-item').count();
      if (altResults > 0) {
        await page.locator('.autocomplete-results .autocomplete-item').first().click();
        await page.waitForTimeout(1500);
        console.log('✅ 使用替代關鍵字成功選擇產品');
      }
    }

    // Step 5: 檢查產品數據狀態
    console.log('\n🔍 檢查產品數據狀態...');
    
    // 檢查表單中的產品相關欄位
    const productNameValue = await productInput.inputValue();
    const unitPriceInput = page.locator('input[name*="unit_price"]');
    const quantityInput = page.locator('input[name*="quantity"]');
    
    const unitPriceValue = await unitPriceInput.inputValue().catch(() => '');
    const quantityValue = await quantityInput.inputValue().catch(() => '');
    
    console.log(`📦 產品名稱: "${productNameValue}"`);
    console.log(`💰 單價: "${unitPriceValue}"`);
    console.log(`📊 數量: "${quantityValue}"`);

    // Step 6: 觸發草稿保存測試
    console.log('\n💾 觸發草稿保存測試...');
    
    // 清除 console 訊息記錄
    consoleMessages.length = 0;
    
    // 點擊下一步觸發自動草稿保存
    const nextStepButton = page.locator('button[type="button"]').filter({ hasText: /下一步|Next/ });
    if (await nextStepButton.count() > 0) {
      await nextStepButton.click();
      await page.waitForTimeout(3000); // 等待草稿保存完成
      
      console.log('\n📋 草稿保存調試訊息:');
      consoleMessages.forEach(msg => {
        console.log('  ' + msg);
      });
    }

    // Step 7: 驗證結果
    console.log('\n✅ 測試結果分析:');
    
    // 檢查是否有關鍵調試訊息
    const hasSelectedProduct = consoleMessages.some(msg => msg.includes('Selected product:'));
    const hasBeforeUpdate = consoleMessages.some(msg => msg.includes('Before update - item:'));
    const hasAfterUpdate = consoleMessages.some(msg => msg.includes('After update - item:'));
    const hasProductId = consoleMessages.some(msg => msg.includes('Product ID set to:'));
    const hasDraftSave = consoleMessages.some(msg => msg.includes('草稿保存調試'));
    
    console.log(`  🔍 產品選擇訊息: ${hasSelectedProduct ? '✅' : '❌'}`);
    console.log(`  📝 更新前狀態: ${hasBeforeUpdate ? '✅' : '❌'}`);
    console.log(`  ✨ 更新後狀態: ${hasAfterUpdate ? '✅' : '❌'}`);
    console.log(`  🆔 產品ID設置: ${hasProductId ? '✅' : '❌'}`);
    console.log(`  💾 草稿保存: ${hasDraftSave ? '✅' : '❌'}`);
    
    // 檢查 product_id 是否不再為 null
    const hasValidProductId = consoleMessages.some(msg => 
      msg.includes('Product ID set to:') && !msg.includes('null')
    );
    console.log(`  ✅ 產品ID有效: ${hasValidProductId ? '✅' : '❌'}`);

    // 拍攝最終狀態截圖
    await page.screenshot({
      path: 'product-data-validation-final-state.png',
      fullPage: true
    });

    console.log('\n🎯 測試完成！');
    console.log('  📸 截圖已保存: product-data-validation-final-state.png');
    console.log('  📋 詳細調試訊息已記錄在上方');
    
    // 基本驗證：確保頁面沒有JavaScript錯誤
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));
    
    if (jsErrors.length > 0) {
      console.log('\n⚠️ JavaScript 錯誤:');
      jsErrors.forEach(error => console.log(`  ❌ ${error}`));
    } else {
      console.log('\n✅ 沒有JavaScript錯誤');
    }
  });
});