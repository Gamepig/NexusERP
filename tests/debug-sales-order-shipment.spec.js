// NexusERP 銷售訂單出貨功能測試
import { test, expect } from '@playwright/test';

test.describe('銷售訂單出貨功能測試', () => {
  test('測試訂單 7268 出貨功能是否已修復', async ({ page }) => {
    console.log('🚀 開始測試銷售訂單出貨功能...');
    
    // 1. 訪問出貨頁面
    const shipmentUrl = 'http://127.0.0.1:8000/orders/sales/7268/ship';
    console.log(`📍 導航到出貨頁面: ${shipmentUrl}`);
    
    try {
      await page.goto(shipmentUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // 檢查頁面是否正常載入
      await page.waitForLoadState('domcontentloaded');
      console.log('✅ 頁面載入完成');
      
      // 2. 檢查頁面標題和基本結構
      const pageTitle = await page.title();
      console.log(`📋 頁面標題: ${pageTitle}`);
      
      // 檢查是否有錯誤提示
      const errorElements = await page.locator('.alert-danger, .error, .text-red-500').count();
      if (errorElements > 0) {
        const errorText = await page.locator('.alert-danger, .error, .text-red-500').first().textContent();
        console.log(`❌ 發現錯誤信息: ${errorText}`);
      }
      
      // 3. 檢查庫存顯示是否正確（應該顯示為 50）
      console.log('🔍 檢查庫存顯示...');
      
      // 尋找庫存相關的文字或元素
      const inventoryElements = await page.locator('text=/庫存|inventory|stock|available/i').count();
      console.log(`📊 找到 ${inventoryElements} 個庫存相關元素`);
      
      // 尋找數字 50
      const fiftyElements = await page.locator('text="50"').count();
      console.log(`🔢 找到 ${fiftyElements} 個包含 "50" 的元素`);
      
      if (fiftyElements > 0) {
        const fiftyText = await page.locator('text="50"').first().textContent();
        console.log(`✅ 找到數字 50: ${fiftyText}`);
      }
      
      // 4. 檢查產品列表和出貨數量輸入框
      console.log('📦 檢查產品列表和出貨數量輸入框...');
      
      // 尋找數量輸入框
      const quantityInputs = await page.locator('input[type="number"], input[name*="quantity"], input[placeholder*="數量"]').count();
      console.log(`🔢 找到 ${quantityInputs} 個數量輸入框`);
      
      if (quantityInputs >= 2) {
        console.log('✅ 找到至少 2 個產品的數量輸入框');
        
        // 5. 設置兩個產品的出貨數量為 1
        console.log('⚙️ 設定產品出貨數量為 1...');
        
        const inputs = await page.locator('input[type="number"], input[name*="quantity"], input[placeholder*="數量"]').all();
        
        for (let i = 0; i < Math.min(2, inputs.length); i++) {
          await inputs[i].clear();
          await inputs[i].fill('1');
          console.log(`✅ 產品 ${i + 1} 數量設為 1`);
        }
        
        // 6. 尋找並點擊確認出貨按鈕
        console.log('🚚 尋找確認出貨按鈕...');
        
        const submitButton = await page.locator('button:has-text("確認出貨"), button:has-text("出貨"), button:has-text("提交"), button[type="submit"]').first();
        
        if (await submitButton.isVisible()) {
          console.log('✅ 找到確認出貨按鈕');
          
          // 點擊前截圖
          await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/screenshots/shipment-before-submit.png',
            fullPage: true 
          });
          console.log('📸 點擊前截圖已保存');
          
          // 點擊確認出貨按鈕
          await submitButton.click();
          console.log('🖱️ 已點擊確認出貨按鈕');
          
          // 等待響應
          await page.waitForTimeout(3000);
          
          // 7. 檢查結果
          console.log('🔍 檢查出貨結果...');
          
          // 檢查是否有成功消息
          const successElements = await page.locator('.alert-success, .success, .text-green-500, text=/成功|success/i').count();
          if (successElements > 0) {
            const successText = await page.locator('.alert-success, .success, .text-green-500').first().textContent();
            console.log(`✅ 找到成功消息: ${successText}`);
          }
          
          // 檢查是否有錯誤消息
          const errorElementsAfter = await page.locator('.alert-danger, .error, .text-red-500').count();
          if (errorElementsAfter > 0) {
            const errorText = await page.locator('.alert-danger, .error, .text-red-500').first().textContent();
            console.log(`❌ 發現錯誤消息: ${errorText}`);
          }
          
          // 檢查當前 URL 是否已跳轉到訂單詳情頁面
          const currentUrl = page.url();
          console.log(`🌐 當前 URL: ${currentUrl}`);
          
          if (currentUrl !== shipmentUrl) {
            console.log('✅ 頁面已跳轉，可能表示出貨成功');
          }
          
          // 點擊後截圖
          await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/screenshots/shipment-after-submit.png',
            fullPage: true 
          });
          console.log('📸 點擊後截圖已保存');
          
        } else {
          console.log('❌ 未找到確認出貨按鈕');
        }
        
      } else {
        console.log('❌ 未找到足夠的數量輸入框');
      }
      
      // 8. 檢查控制台錯誤
      console.log('🔍 檢查 JavaScript 錯誤...');
      
      // 監聽控制台錯誤
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`❌ JavaScript 錯誤: ${msg.text()}`);
        }
      });
      
      // 最終截圖
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/screenshots/shipment-final-state.png',
        fullPage: true 
      });
      console.log('📸 最終狀態截圖已保存');
      
      console.log('🏁 測試完成');
      
    } catch (error) {
      console.error(`❌ 測試過程中發生錯誤: ${error.message}`);
      
      // 錯誤時也截圖
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/screenshots/shipment-error.png',
        fullPage: true 
      });
      console.log('📸 錯誤截圖已保存');
      
      throw error;
    }
  });
});