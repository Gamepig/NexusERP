import { test, expect } from '@playwright/test';

test('Debug Sales Order Form Data Loading Issues', async ({ page }) => {
  // Navigate and login
  await page.goto('http://127.0.0.1:8000/orders/sales');
  
  if (await page.locator('input[name="email"]').isVisible()) {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  }
  
  await page.goto('http://127.0.0.1:8000/orders/sales');
  await page.waitForLoadState('networkidle');
  
  console.log('=== 測試多個不同的銷售訂單編輯表單 ===');
  
  // 測試不同的訂單 ID
  const orderIds = [7246, 7101, 6647, 6854];
  
  for (const orderId of orderIds) {
    console.log(`\n--- 測試訂單 ID: ${orderId} ---`);
    
    await page.goto(`http://127.0.0.1:8000/orders/sales/${orderId}/edit`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 檢查客戶選擇
    const customerSelect = page.locator('select[name="customer_id"]');
    const customerValue = await customerSelect.inputValue();
    const customerText = await customerSelect.locator(`option[value="${customerValue}"]`).textContent();
    console.log(`🏢 客戶: ${customerValue} - "${customerText}"`);
    
    // 檢查所有產品選擇器
    const productSelects = page.locator('select[name*="product_id"]');
    const productCount = await productSelects.count();
    console.log(`📦 產品選擇器數量: ${productCount}`);
    
    for (let i = 0; i < productCount; i++) {
      const productSelect = productSelects.nth(i);
      const productValue = await productSelect.inputValue();
      const quantityInput = page.locator('input[name*="[quantity]"]').nth(i);
      const priceInput = page.locator('input[name*="[unit_price]"]').nth(i);
      
      const quantity = await quantityInput.inputValue();
      const price = await priceInput.inputValue();
      
      // 取得產品選項文字
      let productText = '未選擇';
      if (productValue) {
        const productOption = productSelect.locator(`option[value="${productValue}"]`);
        if (await productOption.count() > 0) {
          productText = await productOption.textContent();
        }
      }
      
      console.log(`   項目 ${i + 1}: 產品 ID="${productValue}" 名稱="${productText}", 數量="${quantity}", 價格="${price}"`);
    }
    
    // 檢查產品選項總數
    if (productCount > 0) {
      const firstProductSelect = productSelects.first();
      const optionCount = await firstProductSelect.locator('option').count();
      console.log(`🛍️ 第一個產品選擇器的選項總數: ${optionCount}`);
      
      // 列出前幾個產品選項
      const options = firstProductSelect.locator('option');
      const firstFewOptions = await options.evaluateAll(opts => 
        opts.slice(0, 5).map(opt => `"${opt.value}" - "${opt.textContent}"`)
      );
      console.log(`📋 前5個產品選項:`, firstFewOptions);
    }
  }
  
  console.log('\n=== 測試完成 ===');
});