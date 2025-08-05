import { test, expect } from '@playwright/test';

// 測試設定
const baseURL = 'http://127.0.0.1:8000';
const testAccount = {
  email: 'test@example.com',
  password: 'password123'
};

test.describe('NexusERP 產品列表庫存顯示測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 設置瀏覽器環境
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
  });

  test('檢查產品列表頁面庫存顯示狀況', async ({ page }) => {
    console.log('🚀 開始檢查產品列表頁面庫存顯示...');
    
    // 步驟 1: 登入系統
    console.log('📝 步驟 1: 登入系統...');
    
    try {
      // 檢查是否已經登入
      const isDashboard = await page.locator('h1:has-text("儀表板")').isVisible({ timeout: 3000 });
      
      if (!isDashboard) {
        await page.goto(`${baseURL}/login`);
        await page.waitForLoadState('networkidle');
        
        // 填寫登入表單
        await page.fill('input[name="email"]', testAccount.email);
        await page.fill('input[name="password"]', testAccount.password);
        
        // 點擊登入按鈕
        await page.click('button[type="submit"]');
        
        // 等待登入完成
        await page.waitForURL(/.*\/dashboard.*/, { timeout: 10000 });
        console.log('✅ 登入成功');
      } else {
        console.log('✅ 已經處於登入狀態');
      }
    } catch (error) {
      console.error('❌ 登入過程出錯:', error.message);
      throw error;
    }
    
    // 步驟 2: 導航到產品列表頁面
    console.log('📝 步驟 2: 導航到產品列表頁面...');
    
    await page.goto(`${baseURL}/products`);
    await page.waitForLoadState('networkidle');
    
    // 等待產品表格載入
    await page.waitForSelector('table', { timeout: 10000 });
    console.log('✅ 產品列表頁面載入完成');
    
    // 步驟 3: 截取產品列表頁面截圖
    console.log('📝 步驟 3: 截取產品列表頁面截圖...');
    
    await page.screenshot({ 
      path: 'screenshots/product-list-inventory-display.png', 
      fullPage: true 
    });
    console.log('📷 產品列表頁面截圖已保存');
    
    // 步驟 4: 檢查表格標題行
    console.log('📝 步驟 4: 檢查表格標題行...');
    
    const tableHeaders = await page.locator('table thead tr th').allTextContents();
    console.log('📊 表格標題列:', tableHeaders);
    
    // 檢查是否包含庫存相關欄位
    const hasStockColumn = tableHeaders.some(header => 
      header.includes('庫存') || header.includes('數量') || header.includes('Stock')
    );
    console.log(`📊 是否包含庫存欄位: ${hasStockColumn}`);
    
    // 步驟 5: 檢查產品數據行
    console.log('📝 步驟 5: 檢查產品數據行...');
    
    const productRows = await page.locator('table tbody tr').count();
    console.log(`📊 產品總數: ${productRows}`);
    
    if (productRows > 0) {
      // 檢查前5個產品的庫存顯示
      for (let i = 0; i < Math.min(5, productRows); i++) {
        const row = page.locator('table tbody tr').nth(i);
        const rowData = await row.locator('td').allTextContents();
        console.log(`📊 產品 ${i + 1} 行數據:`, rowData);
        
        // 特別關注產品857（如果存在）
        const productName = rowData[1] || ''; // 通常產品名稱在第二列
        const productId = rowData[0] || ''; // 通常產品ID在第一列
        
        if (productId.includes('857') || productName.includes('857')) {
          console.log(`🎯 找到產品857，完整行數據:`, rowData);
        }
      }
    }
    
    // 步驟 6: 攔截並記錄 API 請求
    console.log('📝 步驟 6: 攔截並記錄 API 請求...');
    
    // 設置 API 請求攔截
    let apiResponses = [];
    
    page.on('response', async response => {
      if (response.url().includes('/api/products') && response.request().method() === 'GET') {
        try {
          const responseData = await response.json();
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            data: responseData
          });
          console.log(`📡 攔截到 API 請求: ${response.url()}`);
          console.log(`📡 響應狀態: ${response.status()}`);
        } catch (error) {
          console.warn('⚠️ 無法解析 API 響應:', error.message);
        }
      }
    });
    
    // 重新載入頁面以觸發 API 請求
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 等待 API 請求完成
    
    // 步驟 7: 分析 API 響應數據
    console.log('📝 步驟 7: 分析 API 響應數據...');
    
    if (apiResponses.length > 0) {
      for (const apiResponse of apiResponses) {
        console.log(`\n📡 API 響應分析 - ${apiResponse.url}:`);
        console.log(`狀態碼: ${apiResponse.status}`);
        
        if (apiResponse.data && apiResponse.data.data) {
          const products = Array.isArray(apiResponse.data.data) ? 
            apiResponse.data.data : 
            (apiResponse.data.data.data || []);
          
          console.log(`產品數量: ${products.length}`);
          
          // 檢查每個產品的庫存欄位
          products.forEach((product, index) => {
            if (index < 5) { // 只顯示前5個產品
              console.log(`\n產品 ${index + 1}:`);
              console.log(`  ID: ${product.id}`);
              console.log(`  名稱: ${product.name}`);
              console.log(`  庫存數量: ${product.stock_quantity}`);
              console.log(`  低庫存警告: ${product.low_stock_threshold}`);
              
              // 特別關注產品857
              if (product.id == 857 || String(product.id).includes('857')) {
                console.log(`🎯 重點關注 - 產品857 詳細資訊:`);
                console.log(`  完整數據:`, JSON.stringify(product, null, 2));
              }
            }
          });
        }
      }
    } else {
      console.warn('⚠️ 沒有攔截到任何 API 請求');
    }
    
    // 步驟 8: 檢查特定產品的庫存顯示
    console.log('📝 步驟 8: 檢查特定產品的庫存顯示...');
    
    // 嘗試找到產品857的行
    try {
      const product857Row = await page.locator('table tbody tr:has-text("857")').first();
      if (await product857Row.isVisible()) {
        const product857Data = await product857Row.locator('td').allTextContents();
        console.log('🎯 產品857 頁面顯示數據:', product857Data);
        
        // 截圖該行
        await product857Row.screenshot({ 
          path: 'screenshots/product-857-row.png' 
        });
        console.log('📷 產品857行截圖已保存');
      } else {
        console.log('⚠️ 在頁面上未找到產品857');
      }
    } catch (error) {
      console.log('⚠️ 搜尋產品857時發生錯誤:', error.message);
    }
    
    // 步驟 9: 直接 API 測試
    console.log('📝 步驟 9: 直接 API 測試...');
    
    try {
      const directApiResponse = await page.request.get(`${baseURL}/api/products`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });
      
      if (directApiResponse.ok()) {
        const apiData = await directApiResponse.json();
        console.log('📡 直接 API 請求成功');
        console.log('📡 響應結構:', Object.keys(apiData));
        
        if (apiData.data) {
          const products = Array.isArray(apiData.data) ? 
            apiData.data : 
            (apiData.data.data || []);
          
          console.log(`📊 API 返回產品數量: ${products.length}`);
          
          // 尋找產品857
          const product857 = products.find(p => p.id == 857);
          if (product857) {
            console.log('🎯 API 中的產品857 完整資訊:');
            console.log(JSON.stringify(product857, null, 2));
          } else {
            console.log('⚠️ API 響應中未找到產品857');
          }
          
          // 顯示所有產品的庫存狀況摘要
          console.log('\n📊 所有產品庫存狀況摘要:');
          products.forEach(product => {
            console.log(`產品 ${product.id}: 庫存=${product.stock_quantity}, 警告值=${product.low_stock_threshold}`);
          });
        }
      } else {
        console.error('❌ 直接 API 請求失敗:', directApiResponse.status());
      }
    } catch (error) {
      console.error('❌ 直接 API 請求出錯:', error.message);
    }
    
    console.log('🎉 產品列表庫存顯示檢查完成！');
  });

  // 錯誤處理和截圖
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
      console.log(`❌ 測試失敗: ${testInfo.title}`);
    }
  });
});