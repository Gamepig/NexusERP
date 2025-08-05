import { test, expect } from '@playwright/test';

test('採購單創建簡化測試', async ({ page }) => {
  console.log('🚀 開始採購單創建測試...');
  
  // ========== 步驟 1: 登入系統 ==========
  console.log('📝 步驟 1: 登入系統...');  
  await page.goto('http://127.0.0.1:8000/login');
  await page.locator('input[type="email"]').fill('test@example.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  
  // 等待登入完成
  await page.waitForURL(/.*\/(dashboard|home|$)/, { timeout: 10000 });
  console.log('✅ 登入成功，當前 URL:', page.url());
  
  // ========== 步驟 2: 導航到採購單創建頁面 ==========
  console.log('📝 步驟 2: 導航到採購單創建頁面...');
  await page.goto('http://127.0.0.1:8000/orders/purchase/create');
  
  // 檢查頁面是否載入成功
  await page.waitForLoadState('domcontentloaded');
  console.log('📍 當前 URL:', page.url());
  
  // 檢查關鍵元素是否存在 - 專門尋找採購單表單
  const form = page.locator('#purchase-order-form');
  await expect(form).toBeVisible({ timeout: 10000 });
  console.log('✅ 找到採購單表單');
  
  // ========== 步驟 3: 檢查表單元素 ==========
  console.log('📝 步驟 3: 檢查表單元素...');
  
  // 檢查主要表單元素
  const supplierSelect = page.locator('#supplier_id, select[name="supplier_id"]');
  const orderDateInput = page.locator('#order_date, input[name="order_date"]');
  const submitButton = page.locator('button[type="submit"]');
  
  await expect(supplierSelect).toBeVisible();
  await expect(orderDateInput).toBeVisible();
  await expect(submitButton).toBeVisible();
  
  console.log('✅ 主要表單元素都存在');
  
  // ========== 步驟 4: 嘗試填寫基本資訊 ==========
  console.log('📝 步驟 4: 填寫基本資訊...');
  
  // 等待數據載入
  await page.waitForTimeout(3000);
  
  // 檢查供應商選項
  const supplierOptions = await supplierSelect.locator('option').count();
  console.log(`📊 供應商選項數量: ${supplierOptions}`);
  
  if (supplierOptions > 1) {
    // 選擇第一個非空供應商選項
    await supplierSelect.selectOption({ index: 1 });
    console.log('✅ 供應商選擇完成');
  } else {
    console.log('⚠️ 沒有可用的供應商選項');
  }
  
  // 填寫其他基本資訊
  const today = new Date().toISOString().split('T')[0];
  await orderDateInput.fill(today);
  
  const paymentTermsInput = page.locator('#payment_terms, input[name="payment_terms"]');
  if (await paymentTermsInput.isVisible()) {
    await paymentTermsInput.fill('Net 30 days');
  }
  
  const notesTextarea = page.locator('#notes, textarea[name="notes"]');
  if (await notesTextarea.isVisible()) {
    await notesTextarea.fill('Playwright 測試採購單');
  }
  
  console.log('✅ 基本資訊填寫完成');
  
  // ========== 步驟 5: 檢查產品項目 ==========
  console.log('📝 步驟 5: 檢查產品項目...');
  
  const productSelect = page.locator('select[name*="[product_id]"]').first();
  const quantityInput = page.locator('input[name*="[quantity]"]').first();
  const priceInput = page.locator('input[name*="[unit_price]"]').first();
  
  if (await productSelect.isVisible()) {
    // 等待產品選項載入
    await page.waitForTimeout(2000);
    const productOptions = await productSelect.locator('option').count();
    console.log(`📊 產品選項數量: ${productOptions}`);
    
    if (productOptions > 1) {
      await productSelect.selectOption({ index: 1 });
      console.log('✅ 產品選擇完成');
      
      // 填寫數量和價格
      await quantityInput.fill('10');
      await priceInput.fill('25.50');
      console.log('✅ 產品項目填寫完成');
    } else {
      console.log('⚠️ 沒有可用的產品選項');
    }
  }
  
  // ========== 步驟 6: 提交測試 (不實際提交) ==========
  console.log('📝 步驟 6: 檢查提交按鈕狀態...');
  
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
  console.log('✅ 提交按鈕可用');
  
  // 記錄表單數據以供檢查
  const formData = {
    supplier: await supplierSelect.inputValue(),
    orderDate: await orderDateInput.inputValue(),
    quantity: await quantityInput.inputValue(),
    price: await priceInput.inputValue()
  };
  
  console.log('📊 表單數據:', JSON.stringify(formData, null, 2));
  
  // ========== 步驟 7: 可選 - 實際提交 ==========
  console.log('📝 步驟 7: 嘗試提交表單...');
  
  if (formData.supplier && formData.quantity && formData.price) {
    console.log('✅ 所有必要數據已填寫，嘗試提交...');
    
    // 監聽 API 請求
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/purchase-orders'),
      { timeout: 15000 }
    ).catch(() => {
      console.log('⚠️ 未捕獲到 API 請求，可能提交失敗');
      return null;
    });
    
    // 點擊提交
    await submitButton.click();
    
    // 等待回應
    const response = await responsePromise;
    
    if (response) {
      console.log('📊 API 回應狀態:', response.status());
      const responseData = await response.json().catch(() => ({}));
      console.log('📊 API 回應數據:', JSON.stringify(responseData, null, 2));
      
      if (response.status() === 200 || response.status() === 201) {
        console.log('🎉 採購單創建成功！');
      } else {
        console.log('❌ 採購單創建失敗');
      }
    } else {
      console.log('⚠️ 沒有收到 API 回應，檢查頁面狀態...');
      await page.waitForTimeout(3000);
      console.log('📍 提交後 URL:', page.url());
    }
  } else {
    console.log('⚠️ 缺少必要數據，跳過實際提交');
  }
  
  console.log('🎯 採購單創建測試完成！');
});