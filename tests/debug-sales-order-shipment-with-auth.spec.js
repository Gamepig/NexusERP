// NexusERP 銷售訂單出貨功能測試（包含認證）
import { test, expect } from '@playwright/test';

test.describe('銷售訂單出貨功能測試（含認證）', () => {
  test('測試訂單 7268 出貨功能（完整流程）', async ({ page }) => {
    console.log('🚀 開始銷售訂單出貨功能完整測試...');
    
    try {
      // 步驟 1: 登入系統
      console.log('🔐 步驟 1: 執行登入流程...');
      await page.goto('http://127.0.0.1:8000/login', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // 等待登入頁面載入
      await page.waitForLoadState('domcontentloaded');
      console.log('✅ 登入頁面已載入');
      
      // 填寫登入資訊
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"], input[type="password"]', 'password123');
      console.log('✅ 已填寫登入資訊');
      
      // 點擊登入按鈕
      await page.click('button[type="submit"], button:has-text("LOG IN"), button:has-text("登入")');
      console.log('✅ 已點擊登入按鈕');
      
      // 等待登入完成（等待跳轉到 dashboard 或其他頁面）
      await page.waitForTimeout(3000);
      
      // 檢查是否登入成功
      const currentUrl = page.url();
      console.log(`🌐 登入後 URL: ${currentUrl}`);
      
      if (currentUrl.includes('/login')) {
        console.log('❌ 登入可能失敗，仍在登入頁面');
        await page.screenshot({ 
          path: '/Users/gamepig/projects/NexusERP/screenshots/login-failed.png',
          fullPage: true 
        });
      } else {
        console.log('✅ 登入成功，已跳轉到系統內部');
      }
      
      // 步驟 2: 直接訪問出貨頁面
      console.log('📦 步驟 2: 訪問出貨頁面...');
      const shipmentUrl = 'http://127.0.0.1:8000/orders/sales/7268/ship';
      console.log(`📍 導航到出貨頁面: ${shipmentUrl}`);
      
      await page.goto(shipmentUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // 等待頁面載入
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      const finalUrl = page.url();
      console.log(`🌐 出貨頁面最終 URL: ${finalUrl}`);
      
      // 檢查是否再次被重定向到登入頁面
      if (finalUrl.includes('/login')) {
        console.log('❌ 仍被重定向到登入頁面，可能是 session 問題');
        await page.screenshot({ 
          path: '/Users/gamepig/projects/NexusERP/screenshots/auth-redirect-again.png',
          fullPage: true 
        });
        return; // 早期退出
      }
      
      console.log('✅ 成功訪問出貨頁面');
      
      // 步驟 3: 檢查頁面內容
      console.log('🔍 步驟 3: 檢查頁面內容...');
      
      // 檢查頁面標題
      const pageTitle = await page.title();
      console.log(`📋 頁面標題: ${pageTitle}`);
      
      // 檢查是否有錯誤提示
      const errorElements = await page.locator('.alert-danger, .error, .text-red-500, .text-danger').count();
      if (errorElements > 0) {
        const errorText = await page.locator('.alert-danger, .error, .text-red-500, .text-danger').first().textContent();
        console.log(`❌ 發現錯誤信息: ${errorText}`);
      }
      
      // 步驟 4: 尋找庫存信息
      console.log('📊 步驟 4: 檢查庫存顯示...');
      
      // 更廣泛地尋找庫存相關信息
      const stockTexts = await page.locator('text=/庫存|inventory|stock|available|可用|現有/i').allTextContents();
      console.log(`📊 找到庫存相關文字: ${JSON.stringify(stockTexts)}`);
      
      // 尋找包含數字的元素（可能是庫存數量）
      const numberElements = await page.locator('text=/\\d+/').allTextContents();
      console.log(`🔢 找到數字元素: ${JSON.stringify(numberElements.slice(0, 10))}`); // 只顯示前10個
      
      // 尋找特定數字 50
      const fiftyElements = await page.locator(':has-text("50")').count();
      console.log(`🎯 找到 ${fiftyElements} 個包含 "50" 的元素`);
      
      // 步驟 5: 檢查產品和數量輸入框
      console.log('📦 步驟 5: 檢查產品列表和輸入框...');
      
      // 尋找各種可能的輸入框
      const allInputs = await page.locator('input').count();
      const numberInputs = await page.locator('input[type="number"]').count();
      const quantityInputs = await page.locator('input[name*="quantity"], input[placeholder*="數量"], input[placeholder*="qty"]').count();
      
      console.log(`📝 總輸入框: ${allInputs}`);
      console.log(`🔢 數字輸入框: ${numberInputs}`);
      console.log(`📦 數量輸入框: ${quantityInputs}`);
      
      // 如果找到輸入框，嘗試操作
      if (numberInputs > 0 || quantityInputs > 0) {
        console.log('✅ 找到輸入框，嘗試設置數量...');
        
        const inputs = await page.locator('input[type="number"], input[name*="quantity"]').all();
        
        for (let i = 0; i < Math.min(2, inputs.length); i++) {
          try {
            await inputs[i].clear();
            await inputs[i].fill('1');
            console.log(`✅ 產品 ${i + 1} 數量設為 1`);
          } catch (error) {
            console.log(`❌ 無法設置產品 ${i + 1} 數量: ${error.message}`);
          }
        }
        
        // 步驟 6: 尋找提交按鈕
        console.log('🚚 步驟 6: 尋找出貨按鈕...');
        
        const submitButtons = await page.locator('button[type="submit"], button:has-text("確認"), button:has-text("出貨"), button:has-text("提交"), .btn-primary').all();
        
        if (submitButtons.length > 0) {
          console.log(`✅ 找到 ${submitButtons.length} 個可能的提交按鈕`);
          
          // 拍攝提交前截圖
          await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/screenshots/shipment-before-submit-auth.png',
            fullPage: true 
          });
          
          // 點擊第一個按鈕
          await submitButtons[0].click();
          console.log('🖱️ 已點擊提交按鈕');
          
          // 等待響應
          await page.waitForTimeout(3000);
          
          // 檢查結果
          const afterSubmitUrl = page.url();
          console.log(`🌐 提交後 URL: ${afterSubmitUrl}`);
          
          // 檢查成功/錯誤消息
          const successElements = await page.locator('.alert-success, .success, .text-green-500, text=/成功|success/i').count();
          const errorElementsAfter = await page.locator('.alert-danger, .error, .text-red-500').count();
          
          if (successElements > 0) {
            const successText = await page.locator('.alert-success, .success, .text-green-500').first().textContent();
            console.log(`✅ 成功消息: ${successText}`);
          }
          
          if (errorElementsAfter > 0) {
            const errorText = await page.locator('.alert-danger, .error, .text-red-500').first().textContent();
            console.log(`❌ 錯誤消息: ${errorText}`);
          }
          
          // 拍攝提交後截圖
          await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/screenshots/shipment-after-submit-auth.png',
            fullPage: true 
          });
        } else {
          console.log('❌ 未找到提交按鈕');
        }
      } else {
        console.log('❌ 未找到數量輸入框');
      }
      
      // 步驟 7: 檢查 DOM 結構
      console.log('🔍 步驟 7: 分析頁面 DOM 結構...');
      
      // 獲取頁面主要內容
      const bodyText = await page.locator('body').textContent();
      const hasShipmentContent = bodyText.includes('出貨') || bodyText.includes('shipment') || bodyText.includes('ship');
      const hasOrderContent = bodyText.includes('訂單') || bodyText.includes('order');
      const hasProductContent = bodyText.includes('產品') || bodyText.includes('product');
      
      console.log(`📄 頁面包含出貨相關內容: ${hasShipmentContent}`);
      console.log(`📄 頁面包含訂單相關內容: ${hasOrderContent}`);
      console.log(`📄 頁面包含產品相關內容: ${hasProductContent}`);
      
      // 檢查是否是 404 或其他錯誤頁面
      const is404 = bodyText.includes('404') || bodyText.includes('Not Found') || bodyText.includes('找不到');
      const is500 = bodyText.includes('500') || bodyText.includes('Server Error') || bodyText.includes('伺服器錯誤');
      
      if (is404) {
        console.log('❌ 頁面顯示 404 錯誤');
      }
      if (is500) {
        console.log('❌ 頁面顯示 500 錯誤');
      }
      
      // 最終截圖
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/screenshots/shipment-final-auth.png',
        fullPage: true 
      });
      console.log('📸 最終狀態截圖已保存');
      
      console.log('🏁 測試完成');
      
    } catch (error) {
      console.error(`❌ 測試過程中發生錯誤: ${error.message}`);
      
      // 錯誤時截圖
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/screenshots/shipment-error-auth.png',
        fullPage: true 
      });
      console.log('📸 錯誤截圖已保存');
      
      throw error;
    }
  });
});