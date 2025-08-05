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

test.describe('Sales Order Calculation Fix Verification', () => {
  
  test('verify calculation works automatically', async ({ page }) => {
    await login(page);
    
    // Navigate to sales order creation
    await page.goto('http://127.0.0.1:8000/orders/sales/create');
    await page.waitForLoadState('networkidle');
    
    // 點擊新增項目
    await page.click('#addItemBtn');
    await page.waitForTimeout(1000);
    
    // 填入測試數據
    await page.locator('.quantity-input').first().fill('2');
    await page.locator('.price-input').first().fill('399');
    
    // 觸發 blur 事件來執行計算
    await page.locator('.price-input').first().blur();
    await page.waitForTimeout(1000);
    
    // 檢查小計計算
    const itemSubtotal = await page.locator('.item-subtotal').first().textContent();
    console.log('Item subtotal after auto calculation:', itemSubtotal);
    
    // 檢查總計計算
    const subtotalAmount = await page.locator('#subtotalAmount').textContent();
    const taxAmount = await page.locator('#taxAmount').textContent();
    const totalAmount = await page.locator('#totalAmount').textContent();
    
    console.log('Subtotal:', subtotalAmount);
    console.log('Tax:', taxAmount);
    console.log('Total:', totalAmount);
    
    // 驗證計算結果
    expect(itemSubtotal).toContain('798');
    expect(subtotalAmount).toContain('798');
    expect(totalAmount).toContain('837');
    
    // 截圖驗證
    await page.screenshot({ path: 'screenshots/calculation-fix-verification.png', fullPage: true });
    
    // 測試數量變更是否觸發重新計算
    await page.locator('.quantity-input').first().fill('3');
    await page.locator('.quantity-input').first().blur();
    await page.waitForTimeout(1000);
    
    const newItemSubtotal = await page.locator('.item-subtotal').first().textContent();
    const newTotalAmount = await page.locator('#totalAmount').textContent();
    
    console.log('New item subtotal after quantity change:', newItemSubtotal);
    console.log('New total after quantity change:', newTotalAmount);
    
    // 3 * 399 = 1197, 1197 * 1.05 = 1256.85
    expect(newItemSubtotal).toContain('1197');
    expect(newTotalAmount).toContain('1256');
    
    await page.screenshot({ path: 'screenshots/calculation-quantity-update.png', fullPage: true });
  });
  
  test('verify calculation works with input event', async ({ page }) => {
    await login(page);
    
    await page.goto('http://127.0.0.1:8000/orders/sales/create');
    await page.waitForLoadState('networkidle');
    
    // 點擊新增項目
    await page.click('#addItemBtn');
    await page.waitForTimeout(1000);
    
    // 測試 input 事件觸發計算
    await page.locator('.quantity-input').first().fill('5');
    // 不需要 blur，input 事件應該就能觸發計算
    await page.waitForTimeout(500);
    
    await page.locator('.price-input').first().fill('100');
    await page.waitForTimeout(500);
    
    const itemSubtotal = await page.locator('.item-subtotal').first().textContent();
    const totalAmount = await page.locator('#totalAmount').textContent();
    
    console.log('Item subtotal with input events:', itemSubtotal);
    console.log('Total with input events:', totalAmount);
    
    // 5 * 100 = 500, 500 * 1.05 = 525
    expect(itemSubtotal).toContain('500');
    expect(totalAmount).toContain('525');
  });
  
  test('verify multiple items calculation', async ({ page }) => {
    await login(page);
    
    await page.goto('http://127.0.0.1:8000/orders/sales/create');
    await page.waitForLoadState('networkidle');
    
    // 添加第一個項目
    await page.click('#addItemBtn');
    await page.waitForTimeout(500);
    
    await page.locator('.quantity-input').first().fill('2');
    await page.locator('.price-input').first().fill('100');
    await page.waitForTimeout(500);
    
    // 添加第二個項目
    await page.click('#addItemBtn');
    await page.waitForTimeout(500);
    
    const quantityInputs = page.locator('.quantity-input');
    const priceInputs = page.locator('.price-input');
    
    await quantityInputs.nth(1).fill('3');
    await priceInputs.nth(1).fill('50');
    await page.waitForTimeout(500);
    
    // 檢查各項目的小計
    const itemSubtotals = await page.locator('.item-subtotal').allTextContents();
    console.log('All item subtotals:', itemSubtotals);
    
    // 檢查總計
    const totalAmount = await page.locator('#totalAmount').textContent();
    console.log('Total with multiple items:', totalAmount);
    
    // 第一項：2 * 100 = 200
    // 第二項：3 * 50 = 150
    // 小計：200 + 150 = 350
    // 總計：350 * 1.05 = 367.50
    expect(itemSubtotals[0]).toContain('200');
    expect(itemSubtotals[1]).toContain('150');
    expect(totalAmount).toContain('367');
    
    await page.screenshot({ path: 'screenshots/multiple-items-calculation.png', fullPage: true });
  });
});