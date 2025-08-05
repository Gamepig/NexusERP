import { test, expect } from '@playwright/test';

test.describe('供應商和採購訂單核心功能測試', () => {
  
  test('完整流程測試', async ({ page }) => {
    console.log('開始完整流程測試...');
    
    // 1. 登入
    console.log('步驟 1: 登入');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('domcontentloaded');
    
    // 填寫並提交登入表單
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]:has-text("Log in")');
    
    // 等待登入成功
    await page.waitForTimeout(3000);
    console.log('✅ 登入完成');
    
    // 2. 測試供應商頁面
    console.log('步驟 2: 測試供應商頁面');
    await page.goto('http://127.0.0.1:8000/suppliers');
    await page.waitForLoadState('domcontentloaded');
    
    // 檢查頁面載入是否成功
    const pageTitle = await page.title();
    console.log('供應商頁面標題:', pageTitle);
    
    // 檢查是否有錯誤
    const errors = await page.locator('.alert-danger, .error').count();
    if (errors > 0) {
      const errorText = await page.locator('.alert-danger, .error').allTextContents();
      console.log('❌ 供應商頁面錯誤:', errorText);
    } else {
      console.log('✅ 供應商頁面正常載入');
    }
    
    // 3. 測試供應商新增頁面
    console.log('步驟 3: 測試供應商新增頁面');
    await page.goto('http://127.0.0.1:8000/suppliers/create');
    await page.waitForLoadState('domcontentloaded');
    
    const createPageErrors = await page.locator('.alert-danger, .error').count();
    if (createPageErrors > 0) {
      const errorText = await page.locator('.alert-danger, .error').allTextContents();
      console.log('❌ 供應商新增頁面錯誤:', errorText);
    } else {
      console.log('✅ 供應商新增頁面正常載入');
      
      // 嘗試填寫表單
      const nameField = page.locator('input[name="name"]');
      if (await nameField.count() > 0) {
        await nameField.fill('測試供應商_' + Date.now());
        console.log('✅ 成功填寫供應商名稱');
      }
    }
    
    // 4. 測試採購訂單建立頁面
    console.log('步驟 4: 測試採購訂單建立頁面');
    await page.goto('http://127.0.0.1:8000/orders/purchase/create');
    await page.waitForLoadState('domcontentloaded');
    
    // 檢查頁面錯誤
    const purchasePageErrors = await page.locator('.alert-danger, .error').count();
    if (purchasePageErrors > 0) {
      const errorText = await page.locator('.alert-danger, .error').allTextContents();
      console.log('❌ 採購訂單頁面錯誤:', errorText);
    } else {
      console.log('✅ 採購訂單頁面正常載入');
    }
    
    // 檢查供應商下拉選單
    const supplierSelects = await page.locator('select[name*="supplier"], select[id*="supplier"]').count();
    console.log('供應商選擇欄位數量:', supplierSelects);
    
    if (supplierSelects > 0) {
      const select = page.locator('select[name*="supplier"], select[id*="supplier"]').first();
      const options = await select.locator('option').count();
      console.log('供應商選項數量:', options);
      
      if (options > 1) {
        console.log('✅ 供應商下拉選單有可用選項');
        // 嘗試選擇一個供應商
        await select.selectOption({ index: 1 });
        console.log('✅ 成功選擇供應商');
      } else {
        console.log('⚠️  供應商選項不足');
      }
    } else {
      // 如果沒找到 select，檢查其他可能的供應商輸入方式
      const supplierInputs = await page.locator('input[name*="supplier"], [data-supplier]').count();
      console.log('其他供應商輸入欄位數量:', supplierInputs);
    }
    
    // 5. 檢查是否有 RLS 相關錯誤
    console.log('步驟 5: 檢查 RLS 錯誤');
    const rlsErrors = await page.locator('text=/RLS|row.*security|access.*denied/i').count();
    if (rlsErrors > 0) {
      const rlsErrorText = await page.locator('text=/RLS|row.*security|access.*denied/i').allTextContents();
      console.log('❌ 發現 RLS 相關錯誤:', rlsErrorText);
    } else {
      console.log('✅ 未發現 RLS 相關錯誤');
    }
    
    console.log('🎯 測試完成');
  });
});