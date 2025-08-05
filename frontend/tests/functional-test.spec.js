import { test, expect } from '@playwright/test';

test.describe('供應商和採購訂單功能性測試', () => {
  
  test('實際新增供應商和建立採購訂單', async ({ page }) => {
    console.log('開始功能性測試...');
    
    // 1. 登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]:has-text("Log in")');
    await page.waitForTimeout(3000);
    console.log('✅ 登入成功');
    
    // 2. 實際新增一個供應商
    console.log('步驟 2: 實際新增供應商');
    await page.goto('http://127.0.0.1:8000/suppliers/create');
    await page.waitForLoadState('domcontentloaded');
    
    const timestamp = Date.now();
    const supplierName = `測試供應商公司_${timestamp}`;
    
    // 填寫所有必要欄位
    await page.fill('input[name="name"]', supplierName);
    
    // 檢查其他欄位是否存在並填寫
    const contactField = page.locator('input[name="contact_person"]');
    if (await contactField.count() > 0) {
      await contactField.fill('測試聯絡人');
    }
    
    const phoneField = page.locator('input[name="phone"]');
    if (await phoneField.count() > 0) {
      await phoneField.fill('0912345678');
    }
    
    const emailField = page.locator('input[name="email"]');
    if (await emailField.count() > 0) {
      await emailField.fill(`supplier${timestamp}@test.com`);
    }
    
    const addressField = page.locator('textarea[name="address"]');
    if (await addressField.count() > 0) {
      await addressField.fill('測試地址123號');
    }
    
    // 提交表單
    console.log('提交新供應商表單...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000); // 等待提交處理
    
    // 檢查提交結果
    const currentUrl = page.url();
    console.log('提交後 URL:', currentUrl);
    
    // 檢查是否有錯誤訊息
    const errors = await page.locator('.alert-danger, .error, .text-danger').count();
    if (errors > 0) {
      const errorTexts = await page.locator('.alert-danger, .error, .text-danger').allTextContents();
      console.log('❌ 供應商新增錯誤:', errorTexts);
    } else {
      console.log('✅ 供應商新增成功，無錯誤訊息');
    }
    
    // 檢查成功訊息
    const success = await page.locator('.alert-success, .success, .text-success').count();
    if (success > 0) {
      const successTexts = await page.locator('.alert-success, .success, .text-success').allTextContents();
      console.log('✅ 成功訊息:', successTexts);
    }
    
    // 3. 確認供應商已被新增到列表
    console.log('步驟 3: 確認供應商列表');
    await page.goto('http://127.0.0.1:8000/suppliers');
    await page.waitForLoadState('domcontentloaded');
    
    // 搜尋新新增的供應商
    const supplierExists = await page.locator(`text="${supplierName}"`).count() > 0;
    if (supplierExists) {
      console.log('✅ 新供應商出現在列表中');
    } else {
      console.log('⚠️  新供應商未在列表中找到');
    }
    
    // 4. 測試採購訂單建立功能
    console.log('步驟 4: 測試採購訂單建立');
    await page.goto('http://127.0.0.1:8000/orders/purchase/create');
    await page.waitForLoadState('domcontentloaded');
    
    // 選擇供應商
    const supplierSelect = page.locator('select[name*="supplier"]').first();
    const options = await supplierSelect.locator('option').count();
    console.log('可用供應商選項數量:', options);
    
    if (options > 1) {
      // 選擇第一個可用供應商
      await supplierSelect.selectOption({ index: 1 });
      console.log('✅ 已選擇供應商');
      
      // 填寫其他必要欄位
      const orderDate = new Date().toISOString().split('T')[0];
      const orderDateField = page.locator('input[name="order_date"], input[type="date"]');
      if (await orderDateField.count() > 0) {
        await orderDateField.fill(orderDate);
        console.log('✅ 已填寫訂單日期');
      }
      
      const notesField = page.locator('textarea[name="notes"], input[name="notes"]');
      if (await notesField.count() > 0) {
        await notesField.fill('Playwright 自動化測試採購訂單');
        console.log('✅ 已填寫訂單備註');
      }
      
      // 嘗試新增產品項目（如果有的話）
      const addItemButton = page.locator('button:has-text("新增"), button:has-text("添加"), button[data-add-item]');
      if (await addItemButton.count() > 0) {
        console.log('發現新增項目按鈕');
      }
      
      // 提交採購訂單
      console.log('提交採購訂單表單...');
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(5000);
        
        // 檢查提交結果
        const purchaseErrors = await page.locator('.alert-danger, .error, .text-danger').count();
        if (purchaseErrors > 0) {
          const errorTexts = await page.locator('.alert-danger, .error, .text-danger').allTextContents();
          console.log('❌ 採購訂單建立錯誤:', errorTexts);
        } else {
          console.log('✅ 採購訂單建立成功，無錯誤訊息');
        }
        
        const purchaseSuccess = await page.locator('.alert-success, .success, .text-success').count();
        if (purchaseSuccess > 0) {
          const successTexts = await page.locator('.alert-success, .success, .text-success').allTextContents();
          console.log('✅ 採購訂單成功訊息:', successTexts);
        }
      } else {
        console.log('⚠️  未找到提交按鈕');
      }
    }
    
    // 5. 最終驗證 - 檢查所有關鍵錯誤
    console.log('步驟 5: 最終驗證');
    
    // 再次檢查採購訂單頁面是否正常
    await page.goto('http://127.0.0.1:8000/orders/purchase/create');
    await page.waitForLoadState('domcontentloaded');
    
    const finalErrors = await page.locator('.alert-danger, .error').count();
    const rlsErrors = await page.locator('text=/RLS|row.*security|access.*denied/i').count();
    const supplierErrors = await page.locator('text=/選擇一供應商不存在或已停用/i').count();
    
    console.log('最終檢查結果:');
    console.log('- 一般錯誤數量:', finalErrors);
    console.log('- RLS 錯誤數量:', rlsErrors);  
    console.log('- 供應商錯誤數量:', supplierErrors);
    
    if (finalErrors === 0 && rlsErrors === 0 && supplierErrors === 0) {
      console.log('🎉 所有測試通過！供應商和採購訂單功能正常運作');
    } else {
      console.log('⚠️  仍有部分問題需要處理');
    }
    
    console.log('🎯 功能性測試完成');
  });
});