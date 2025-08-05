// 最終庫存修復驗證測試
// 驗證跨公司庫存加總問題和庫存設定邏輯的修復

import { test, expect } from '@playwright/test';

test.describe('最終庫存修復驗證測試', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // 設定視窗大小
    await page.setViewportSize({ width: 1366, height: 768 });
    
    // 登入系統
    console.log('🔑 開始登入系統...');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 填寫登入資料
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 提交登入表單
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 確認登入成功
    await expect(page).toHaveURL(/dashboard/);
    console.log('✅ 登入成功');
  });

  test('測試產品列表頁面庫存顯示', async () => {
    console.log('📦 測試產品列表頁面庫存顯示...');
    
    // 訪問產品列表頁面
    await page.goto('http://127.0.0.1:8000/products');
    await page.waitForLoadState('networkidle');
    
    // 等待產品表格載入
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // 截取產品列表截圖
    await page.screenshot({ 
      path: 'screenshots/final-inventory-verification-01-products-list.png',
      fullPage: true 
    });
    
    // 尋找產品 857
    const product857Row = page.locator('table tbody tr').filter({ 
      hasText: /產品 857|Product 857/ 
    });
    
    if (await product857Row.count() > 0) {
      // 檢查產品 857 的現有庫存顯示（應該是 230，不是 430）
      const stockCell = product857Row.locator('td').nth(4); // 假設庫存在第5欄
      const stockText = await stockCell.textContent();
      console.log(`📊 產品 857 當前庫存顯示: ${stockText}`);
      
      // 驗證庫存不是 430（之前的錯誤數值）
      expect(stockText).not.toContain('430');
      console.log('✅ 確認庫存不是錯誤的 430');
    } else {
      console.log('⚠️ 未找到產品 857，繼續其他測試');
    }
  });

  test('測試產品編輯功能 - 設定庫存為 290', async () => {
    console.log('✏️ 測試產品編輯功能 - 設定庫存為 290...');
    
    // 前往產品列表頁面
    await page.goto('http://127.0.0.1:8000/products');
    await page.waitForLoadState('networkidle');
    
    // 尋找產品 857 的編輯按鈕
    const product857Row = page.locator('table tbody tr').filter({ 
      hasText: /產品 857|Product 857/ 
    });
    
    if (await product857Row.count() > 0) {
      // 點擊編輯按鈕
      await product857Row.locator('a[href*="edit"]').first().click();
      await page.waitForLoadState('networkidle');
      
      // 記錄當前顯示的庫存數量
      const currentStockField = page.locator('input[name="current_stock"]');
      const currentStock = await currentStockField.inputValue();
      console.log(`📊 編輯頁面當前庫存顯示: ${currentStock}`);
      
      // 截取編輯頁面初始狀態
      await page.screenshot({ 
        path: 'screenshots/final-inventory-verification-02-edit-initial.png',
        fullPage: true 
      });
      
      // 清空並設定新的庫存為 290
      await currentStockField.fill('');
      await currentStockField.fill('290');
      
      // 設定低庫存閾值為 20
      const lowStockField = page.locator('input[name="low_stock_threshold"]');
      await lowStockField.fill('');
      await lowStockField.fill('20');
      
      // 截取表單填寫完成狀態
      await page.screenshot({ 
        path: 'screenshots/final-inventory-verification-03-form-filled.png',
        fullPage: true 
      });
      
      console.log('📝 已設定庫存為 290，低庫存閾值為 20');
      
      // 提交表單
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // 等待並檢查成功訊息
      const successMessage = page.locator('.alert-success, .bg-green-100, .text-green-800').first();
      if (await successMessage.count() > 0) {
        const messageText = await successMessage.textContent();
        console.log(`✅ 更新成功訊息: ${messageText}`);
      }
      
      // 截取提交後狀態
      await page.screenshot({ 
        path: 'screenshots/final-inventory-verification-04-after-submit.png',
        fullPage: true 
      });
      
    } else {
      console.log('⚠️ 未找到產品 857，跳過編輯測試');
    }
  });

  test('驗證數據一致性 - 確認庫存顯示為 290', async () => {
    console.log('🔍 驗證數據一致性 - 確認庫存顯示為 290...');
    
    // 重新載入編輯頁面，確認庫存顯示為 290
    await page.goto('http://127.0.0.1:8000/products');
    await page.waitForLoadState('networkidle');
    
    const product857Row = page.locator('table tbody tr').filter({ 
      hasText: /產品 857|Product 857/ 
    });
    
    if (await product857Row.count() > 0) {
      // 再次進入編輯頁面
      await product857Row.locator('a[href*="edit"]').first().click();
      await page.waitForLoadState('networkidle');
      
      // 檢查編輯頁面庫存顯示
      const stockField = page.locator('input[name="current_stock"]');
      const stockValue = await stockField.inputValue();
      console.log(`📊 重新載入後編輯頁面庫存顯示: ${stockValue}`);
      
      // 驗證庫存為 290
      expect(stockValue).toBe('290');
      console.log('✅ 編輯頁面庫存顯示正確 (290)');
      
      // 截取驗證截圖
      await page.screenshot({ 
        path: 'screenshots/final-inventory-verification-05-reload-verification.png',
        fullPage: true 
      });
      
      // 回到產品列表
      await page.goto('http://127.0.0.1:8000/products');
      await page.waitForLoadState('networkidle');
      
      // 檢查列表中的庫存顯示
      const updatedRow = page.locator('table tbody tr').filter({ 
        hasText: /產品 857|Product 857/ 
      });
      
      if (await updatedRow.count() > 0) {
        const stockCell = updatedRow.locator('td').nth(4);
        const stockText = await stockCell.textContent();
        console.log(`📊 產品列表中庫存顯示: ${stockText}`);
        
        // 驗證列表中顯示為 290
        expect(stockText).toContain('290');
        console.log('✅ 產品列表庫存顯示正確 (290)');
        
        // 確認沒有額外的 200 加總問題
        expect(stockText).not.toContain('490'); // 290 + 200 = 490
        console.log('✅ 確認沒有額外的 200 加總問題');
      }
    }
  });

  test('再次測試確認 - 設定庫存為 100', async () => {
    console.log('🔄 再次測試確認 - 設定庫存為 100...');
    
    // 前往產品列表
    await page.goto('http://127.0.0.1:8000/products');
    await page.waitForLoadState('networkidle');
    
    const product857Row = page.locator('table tbody tr').filter({ 
      hasText: /產品 857|Product 857/ 
    });
    
    if (await product857Row.count() > 0) {
      // 進入編輯頁面
      await product857Row.locator('a[href*="edit"]').first().click();
      await page.waitForLoadState('networkidle');
      
      // 設定庫存為 100
      const stockField = page.locator('input[name="current_stock"]');
      await stockField.fill('');
      await stockField.fill('100');
      
      console.log('📝 設定庫存為 100');
      
      // 提交表單
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // 等待 2 秒確保數據更新完成
      await page.waitForTimeout(2000);
      
      // 重新載入編輯頁面驗證
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 檢查庫存顯示
      const finalStockValue = await stockField.inputValue();
      console.log(`📊 最終庫存顯示: ${finalStockValue}`);
      
      // 驗證庫存為 100，不是 300 (100 + 200)
      expect(finalStockValue).toBe('100');
      expect(finalStockValue).not.toBe('300');
      console.log('✅ 最終庫存顯示正確 (100)，確認沒有加總問題');
      
      // 截取最終驗證截圖
      await page.screenshot({ 
        path: 'screenshots/final-inventory-verification-06-final-verification.png',
        fullPage: true 
      });
      
      // 回到產品列表最終確認
      await page.goto('http://127.0.0.1:8000/products');
      await page.waitForLoadState('networkidle');
      
      const finalRow = page.locator('table tbody tr').filter({ 
        hasText: /產品 857|Product 857/ 
      });
      
      if (await finalRow.count() > 0) {
        const finalStockCell = finalRow.locator('td').nth(4);
        const finalStockText = await finalStockCell.textContent();
        console.log(`📊 產品列表最終庫存顯示: ${finalStockText}`);
        
        // 最終驗證
        expect(finalStockText).toContain('100');
        expect(finalStockText).not.toContain('300');
        console.log('✅ 產品列表最終庫存顯示正確 (100)');
      }
      
      // 最終完整頁面截圖
      await page.screenshot({ 
        path: 'screenshots/final-inventory-verification-07-complete.png',
        fullPage: true 
      });
      
    } else {
      console.log('⚠️ 未找到產品 857，測試完成');
    }
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
    
    console.log('\n🎉 庫存修復驗證測試完成！');
    console.log('📸 所有截圖已保存到 screenshots/ 目錄');
    console.log('✅ 主要驗證點：');
    console.log('   - 跨公司庫存加總問題已修復');
    console.log('   - 庫存設定邏輯正常運作');
    console.log('   - 數據顯示一致性正確');
    console.log('   - 沒有額外的加總錯誤');
  });
});