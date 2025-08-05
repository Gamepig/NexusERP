import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

async function login(page) {
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

test('Final User Verification: Original Problem Scenario', async ({ page }) => {
  await login(page);
  
  // 模擬原始問題場景
  console.log('🔍 Testing original problem scenario:');
  console.log('   - Product: 驗證測試商品');
  console.log('   - Quantity: 2');
  console.log('   - Unit Price: 399');
  console.log('   - Expected Subtotal: 2 × 399 = 798');
  
  // Navigate to sales order creation
  await page.goto('http://127.0.0.1:8000/orders/sales/create');
  await page.waitForLoadState('networkidle');
  
  // 點擊新增項目
  await page.click('#addItemBtn');
  await page.waitForTimeout(1000);
  
  // 輸入完全相同的測試數據
  await page.locator('.quantity-input').first().fill('2');
  await page.locator('.price-input').first().fill('399');
  
  // 觸發計算 (模擬用戶操作)
  await page.locator('.price-input').first().blur();
  await page.waitForTimeout(1000);
  
  // 檢查結果
  const itemSubtotal = await page.locator('.item-subtotal').first().textContent();
  const subtotalAmount = await page.locator('#subtotalAmount').textContent();
  const taxAmount = await page.locator('#taxAmount').textContent();
  const totalAmount = await page.locator('#totalAmount').textContent();
  
  console.log('✅ Results after fix:');
  console.log(`   - Item Subtotal: ${itemSubtotal}`);
  console.log(`   - Order Subtotal: ${subtotalAmount}`);
  console.log(`   - Tax Amount: ${taxAmount}`);
  console.log(`   - Total Amount: ${totalAmount}`);
  
  // 驗證修復成功
  expect(itemSubtotal).toBe('$798.00');
  expect(subtotalAmount).toBe('$798.00');
  expect(taxAmount).toBe('$39.90');
  expect(totalAmount).toBe('$837.90');
  
  console.log('🎉 Problem FIXED! Calculations working correctly.');
  
  // 截圖最終結果
  await page.screenshot({ 
    path: 'screenshots/FINAL-PROBLEM-FIXED.png', 
    fullPage: true 
  });
  
  // 額外測試：驗證實時計算功能
  console.log('\n🔄 Testing real-time calculation...');
  
  // 修改數量，看是否實時更新
  await page.locator('.quantity-input').first().fill('1');
  await page.waitForTimeout(500);
  
  const newSubtotal = await page.locator('.item-subtotal').first().textContent();
  const newTotal = await page.locator('#totalAmount').textContent();
  
  console.log(`   - New Subtotal (qty=1): ${newSubtotal}`);
  console.log(`   - New Total (qty=1): ${newTotal}`);
  
  expect(newSubtotal).toBe('$399.00');
  expect(newTotal).toBe('$418.95'); // 399 * 1.05
  
  console.log('✅ Real-time calculation also working!');
});