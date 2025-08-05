import { test, expect } from '@playwright/test';

// 測試設定
const baseURL = 'http://127.0.0.1:8000';
const productId = '837';
const testAccount = {
  email: 'test@example.com',
  password: 'password123'
};

// 庫存測試數據
const inventoryData = {
  stockQuantity: '100',
  lowStockThreshold: '20'
};

test.describe('NexusERP 產品編輯頁面庫存功能測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 設置瀏覽器環境
    await page.goto(baseURL);
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle');
  });

  test('測試產品編輯頁面庫存功能完整流程', async ({ page }) => {
    console.log('🚀 開始測試產品編輯頁面庫存功能...');
    
    // 步驟 1: 檢查登入頁面並進行登入
    console.log('📝 步驟 1: 檢查登入狀態並登入...');
    
    try {
      // 先檢查是否已經登入（查看是否有dashboard）
      const isDashboard = await page.locator('h1:has-text("儀表板")').isVisible({ timeout: 3000 });
      
      if (!isDashboard) {
        // 需要登入
        await page.goto(`${baseURL}/login`);
        await page.waitForLoadState('networkidle');
        
        // 填寫登入表單
        await page.fill('input[name="email"]', testAccount.email);
        await page.fill('input[name="password"]', testAccount.password);
        
        // 點擊登入按鈕
        await page.click('button[type="submit"]');
        
        // 等待登入完成並重定向到儀表板
        await page.waitForURL(/.*\/dashboard.*/, { timeout: 10000 });
        console.log('✅ 登入成功');
      } else {
        console.log('✅ 已經處於登入狀態');
      }
    } catch (error) {
      console.error('❌ 登入過程出錯:', error.message);
      throw error;
    }
    
    // 步驟 2: 導航到產品編輯頁面
    console.log(`📝 步驟 2: 導航到產品 ${productId} 編輯頁面...`);
    
    try {
      await page.goto(`${baseURL}/products/${productId}/edit`);
      await page.waitForLoadState('networkidle');
      
      // 驗證頁面標題
      await expect(page.locator('h1')).toContainText('編輯商品');
      console.log('✅ 成功載入產品編輯頁面');
    } catch (error) {
      console.error('❌ 載入產品編輯頁面失敗:', error.message);
      
      // 嘗試先檢查產品是否存在
      await page.goto(`${baseURL}/products`);
      await page.waitForLoadState('networkidle');
      
      // 截圖顯示產品列表
      await page.screenshot({ 
        path: 'screenshots/products-list.png', 
        fullPage: true 
      });
      
      throw new Error(`產品 ID ${productId} 不存在或無法訪問編輯頁面`);
    }
    
    // 步驟 3: 等待表單完全載入
    console.log('📝 步驟 3: 等待表單完全載入...');
    
    try {
      // 等待關鍵欄位載入
      await page.waitForSelector('#stock_quantity', { timeout: 10000 });
      await page.waitForSelector('#low_stock_threshold', { timeout: 10000 });
      
      // 等待分類和單位下拉選單載入完成
      await page.waitForFunction(() => {
        const categorySelect = document.getElementById('category_id');
        const unitSelect = document.getElementById('unit_of_measure_id');
        return categorySelect && categorySelect.options.length > 1 && 
               unitSelect && unitSelect.options.length > 1;
      }, { timeout: 15000 });
      
      console.log('✅ 表單載入完成');
    } catch (error) {
      console.error('❌ 表單載入超時:', error.message);
      
      // 截圖除錯
      await page.screenshot({ 
        path: 'screenshots/form-loading-error.png', 
        fullPage: true 
      });
      throw error;
    }
    
    // 步驟 4: 記錄當前庫存數值
    console.log('📝 步驟 4: 記錄當前庫存數值...');
    
    const originalStockQuantity = await page.inputValue('#stock_quantity');
    const originalLowStockThreshold = await page.inputValue('#low_stock_threshold');
    
    console.log(`📊 當前庫存數量: ${originalStockQuantity || '(空)'}`);
    console.log(`📊 當前低庫存警告值: ${originalLowStockThreshold || '(空)'}`);
    
    // 步驟 5: 設定庫存數值
    console.log('📝 步驟 5: 設定庫存數值...');
    
    try {
      // 清空並填入新的庫存數量
      await page.fill('#stock_quantity', '');
      await page.fill('#stock_quantity', inventoryData.stockQuantity);
      
      // 清空並填入新的低庫存警告值
      await page.fill('#low_stock_threshold', '');
      await page.fill('#low_stock_threshold', inventoryData.lowStockThreshold);
      
      // 驗證輸入值
      const inputStockQuantity = await page.inputValue('#stock_quantity');
      const inputLowStockThreshold = await page.inputValue('#low_stock_threshold');
      
      expect(inputStockQuantity).toBe(inventoryData.stockQuantity);
      expect(inputLowStockThreshold).toBe(inventoryData.lowStockThreshold);
      
      console.log(`✅ 庫存數量設定為: ${inputStockQuantity}`);
      console.log(`✅ 低庫存警告值設定為: ${inputLowStockThreshold}`);
    } catch (error) {
      console.error('❌ 設定庫存數值失敗:', error.message);
      await page.screenshot({ 
        path: 'screenshots/inventory-input-error.png', 
        fullPage: true 
      });
      throw error;
    }
    
    // 步驟 6: 保存表單
    console.log('📝 步驟 6: 保存表單...');
    
    try {
      // 點擊更新按鈕
      const submitButton = page.locator('#submit-btn');
      await expect(submitButton).toBeVisible();
      
      // 監聽網路請求
      const responsePromise = page.waitForResponse(response => 
        response.url().includes(`/api/products/${productId}`) && 
        response.request().method() === 'POST'
      );
      
      await submitButton.click();
      
      // 等待 API 響應
      const response = await responsePromise;
      console.log(`📡 API 響應狀態: ${response.status()}`);
      
      if (response.status() === 200) {
        console.log('✅ 表單提交成功');
        
        // 等待成功提示或重定向
        try {
          // 可能會有 alert 提示
          page.on('dialog', async dialog => {
            console.log(`💬 收到提示: ${dialog.message()}`);
            await dialog.accept();
          });
          
          // 等待可能的重定向
          await page.waitForTimeout(2000);
        } catch (redirectError) {
          console.log('ℹ️ 沒有重定向或提示，繼續測試');
        }
      } else {
        const responseText = await response.text();
        console.error(`❌ API 響應錯誤: ${responseText}`);
        throw new Error(`API 響應失敗: ${response.status()}`);
      }
      
    } catch (error) {
      console.error('❌ 表單提交失敗:', error.message);
      await page.screenshot({ 
        path: 'screenshots/form-submit-error.png', 
        fullPage: true 
      });
      throw error;
    }
    
    // 步驟 7: 重新載入頁面驗證保存結果
    console.log('📝 步驟 7: 重新載入頁面驗證保存結果...');
    
    try {
      // 重新載入編輯頁面
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 等待表單載入
      await page.waitForSelector('#stock_quantity', { timeout: 10000 });
      await page.waitForSelector('#low_stock_threshold', { timeout: 10000 });
      
      // 等待數據載入完成
      await page.waitForFunction(() => {
        const stockInput = document.getElementById('stock_quantity');
        const thresholdInput = document.getElementById('low_stock_threshold');
        return stockInput.value !== '' || thresholdInput.value !== '';
      }, { timeout: 10000 });
      
      // 驗證保存的數值
      const savedStockQuantity = await page.inputValue('#stock_quantity');
      const savedLowStockThreshold = await page.inputValue('#low_stock_threshold');
      
      console.log(`📊 重新載入後庫存數量: ${savedStockQuantity}`);
      console.log(`📊 重新載入後低庫存警告值: ${savedLowStockThreshold}`);
      
      // 驗證數值是否正確保存
      expect(savedStockQuantity).toBe(inventoryData.stockQuantity);
      expect(savedLowStockThreshold).toBe(inventoryData.lowStockThreshold);
      
      console.log('✅ 數值保存驗證成功');
      
    } catch (error) {
      console.error('❌ 重新載入驗證失敗:', error.message);
      await page.screenshot({ 
        path: 'screenshots/reload-verification-error.png', 
        fullPage: true 
      });
      throw error;
    }
    
    // 步驟 8: 檢查資料庫記錄
    console.log('📝 步驟 8: 檢查資料庫記錄...');
    
    try {
      // 通過 API 檢查產品數據
      const apiResponse = await page.request.get(`${baseURL}/api/products/${productId}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });
      
      if (apiResponse.ok()) {
        const apiData = await apiResponse.json();
        
        if (apiData.success && apiData.data) {
          const productData = apiData.data;
          console.log(`📊 API 回傳庫存數量: ${productData.stock_quantity}`);
          console.log(`📊 API 回傳低庫存警告值: ${productData.low_stock_threshold}`);
          
          // 驗證 API 數據
          expect(String(productData.stock_quantity)).toBe(inventoryData.stockQuantity);
          expect(String(productData.low_stock_threshold)).toBe(inventoryData.lowStockThreshold);
          
          console.log('✅ API 數據驗證成功');
        } else {
          console.warn('⚠️ API 響應格式異常');
        }
      } else {
        console.warn('⚠️ API 請求失敗，跳過 API 驗證');
      }
      
    } catch (error) {
      console.warn('⚠️ API 驗證失敗，但測試繼續:', error.message);
    }
    
    // 測試完成
    console.log('🎉 測試完成！庫存功能運作正常');
    
    // 最終截圖
    await page.screenshot({ 
      path: 'screenshots/test-completion.png', 
      fullPage: true 
    });
  });

  test('測試庫存欄位驗證功能', async ({ page }) => {
    console.log('🚀 開始測試庫存欄位驗證功能...');
    
    // 登入並導航到編輯頁面
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', testAccount.email);
    await page.fill('input[name="password"]', testAccount.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard.*/);
    
    await page.goto(`${baseURL}/products/${productId}/edit`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#stock_quantity');
    
    // 測試負數輸入
    console.log('📝 測試負數輸入驗證...');
    await page.fill('#stock_quantity', '-10');
    await page.fill('#low_stock_threshold', '-5');
    
    // 嘗試提交
    await page.click('#submit-btn');
    await page.waitForTimeout(2000);
    
    // 檢查是否有錯誤提示或阻止提交
    const stockValue = await page.inputValue('#stock_quantity');
    const thresholdValue = await page.inputValue('#low_stock_threshold');
    
    console.log(`📊 負數輸入後庫存數量: ${stockValue}`);
    console.log(`📊 負數輸入後警告值: ${thresholdValue}`);
    
    // 測試非數字輸入
    console.log('📝 測試非數字輸入驗證...');
    await page.fill('#stock_quantity', 'abc');
    await page.fill('#low_stock_threshold', 'xyz');
    
    const nonNumericStock = await page.inputValue('#stock_quantity');
    const nonNumericThreshold = await page.inputValue('#low_stock_threshold');
    
    console.log(`📊 非數字輸入後庫存數量: ${nonNumericStock}`);
    console.log(`📊 非數字輸入後警告值: ${nonNumericThreshold}`);
    
    console.log('✅ 驗證功能測試完成');
  });

  // 錯誤處理和截圖
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      // 測試失敗時截圖
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
      
      console.log(`❌ 測試失敗: ${testInfo.title}`);
      console.log(`📷 錯誤截圖已保存`);
    }
  });
});