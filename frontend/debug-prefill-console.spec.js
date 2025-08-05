import { test, expect } from '@playwright/test';

test('Debug Pre-fill Console Output', async ({ page }) => {
  // Listen to console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
  });
  
  // Navigate and login
  await page.goto('http://127.0.0.1:8000/orders/sales');
  
  if (await page.locator('input[name="email"]').isVisible()) {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  }
  
  // Go to edit page and wait for form loading
  await page.goto('http://127.0.0.1:8000/orders/sales/7246/edit');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Wait for all async operations
  
  // Output all console messages
  console.log('=== CONSOLE MESSAGES ===');
  consoleMessages.forEach((msg, index) => {
    console.log(`${index + 1}: ${msg}`);
  });
  
  // Check customer selection
  const customerSelect = page.locator('select[name="customer_id"]');
  const customerValue = await customerSelect.inputValue();
  console.log(`\n🏢 客戶選擇結果: ${customerValue}`);
  
  // Check product selections
  const productSelects = page.locator('select[name*="product_id"]');
  const productCount = await productSelects.count();
  console.log(`📦 產品選擇器數量: ${productCount}`);
  
  for (let i = 0; i < productCount; i++) {
    const productSelect = productSelects.nth(i);
    const productValue = await productSelect.inputValue();
    console.log(`   項目 ${i + 1}: 產品 ID="${productValue}"`);
  }
});