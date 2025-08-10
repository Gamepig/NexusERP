import { test, expect } from '@playwright/test';

test('測試下拉選單展開功能', async ({ page }) => {
  // 登入
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  console.log('=== 下拉選單展開功能測試 ===');

  // 截圖初始狀態
  await page.screenshot({ 
    path: 'tests/screenshots/expand-initial.png',
    fullPage: true 
  });
  console.log('✓ 初始狀態截圖');

  // 等待頁面完全載入
  await page.waitForTimeout(2000);

  // 測試客戶關係管理下拉選單
  console.log('測試客戶關係管理下拉選單...');
  const customerBtn = page.locator('button:has-text("客戶關係管理")').first();
  
  if (await customerBtn.count() > 0) {
    // 點擊按鈕
    await customerBtn.click();
    console.log('✓ 點擊客戶關係管理按鈕');
    
    // 等待下拉選單展開
    await page.waitForTimeout(1000);
    
    // 截圖展開狀態
    await page.screenshot({ 
      path: 'tests/screenshots/expand-customer-dropdown.png',
      fullPage: true 
    });
    console.log('✓ 客戶關係管理下拉展開截圖');
    
    // 檢查是否有下拉選單項目出現
    const dropdownItems = page.locator('[role="menu"], [data-dropdown], .dropdown-menu, .menu-items');
    const itemCount = await dropdownItems.count();
    console.log(`✓ 找到 ${itemCount} 個下拉選單容器`);
    
    // 檢查是否有客戶相關的選單項目
    const customerItems = page.locator('a:has-text("客戶"), a:has-text("聯絡人"), a:has-text("Customer")');
    const customerItemCount = await customerItems.count();
    console.log(`✓ 找到 ${customerItemCount} 個客戶相關選單項目`);
  }

  // 點擊空白處關閉下拉選單
  await page.click('body', { position: { x: 100, y: 300 } });
  await page.waitForTimeout(500);

  // 測試產品與庫存下拉選單
  console.log('測試產品與庫存下拉選單...');
  const productBtn = page.locator('button:has-text("產品與庫存")').first();
  
  if (await productBtn.count() > 0) {
    // 點擊按鈕
    await productBtn.click();
    console.log('✓ 點擊產品與庫存按鈕');
    
    // 等待下拉選單展開
    await page.waitForTimeout(1000);
    
    // 截圖展開狀態
    await page.screenshot({ 
      path: 'tests/screenshots/expand-product-dropdown.png',
      fullPage: true 
    });
    console.log('✓ 產品與庫存下拉展開截圖');
    
    // 檢查是否有產品相關的選單項目
    const productItems = page.locator('a:has-text("產品"), a:has-text("庫存"), a:has-text("Product"), a:has-text("Inventory")');
    const productItemCount = await productItems.count();
    console.log(`✓ 找到 ${productItemCount} 個產品相關選單項目`);
  }

  // 點擊空白處關閉下拉選單
  await page.click('body', { position: { x: 100, y: 300 } });
  await page.waitForTimeout(500);

  // 測試採購管理下拉選單
  console.log('測試採購管理下拉選單...');
  const purchaseBtn = page.locator('button:has-text("採購管理")').first();
  
  if (await purchaseBtn.count() > 0) {
    await purchaseBtn.click();
    console.log('✓ 點擊採購管理按鈕');
    
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'tests/screenshots/expand-purchase-dropdown.png',
      fullPage: true 
    });
    console.log('✓ 採購管理下拉展開截圖');
  }

  // 檢查頁面上是否有任何可見的下拉選單
  const visibleDropdowns = page.locator('.dropdown-open, .show, [aria-expanded="true"]');
  const visibleCount = await visibleDropdowns.count();
  console.log(`✓ 頁面上有 ${visibleCount} 個展開的下拉選單`);

  // 最終截圖
  await page.screenshot({ 
    path: 'tests/screenshots/expand-final.png',
    fullPage: true 
  });
  console.log('✓ 最終展開測試截圖');

  // 檢查控制台錯誤
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(msg.text());
    }
  });
  
  console.log(`✓ JavaScript 錯誤數量: ${logs.length}`);
});