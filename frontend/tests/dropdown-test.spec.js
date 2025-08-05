import { test, expect } from '@playwright/test';

test('測試下拉選單功能', async ({ page }) => {
  // 登入
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  console.log('=== 下拉選單功能測試 ===');

  // 截圖初始狀態
  await page.screenshot({ 
    path: 'tests/screenshots/dropdown-initial.png',
    fullPage: true 
  });
  console.log('✓ 初始狀態截圖');

  // 尋找有下拉箭頭的按鈕
  const dropdownButtons = page.locator('button').filter({ hasText: /管理.*↓|管理.*▼|管理.*⌄/ });
  const buttonCount = await dropdownButtons.count();
  console.log(`✓ 找到 ${buttonCount} 個下拉按鈕`);

  if (buttonCount === 0) {
    // 如果沒找到，嘗試找所有包含管理的按鈕
    const allManagementButtons = page.locator('button').filter({ hasText: '管理' });
    const allCount = await allManagementButtons.count();
    console.log(`✓ 找到 ${allCount} 個包含'管理'的按鈕`);
    
    if (allCount > 0) {
      console.log('測試第一個管理按鈕的 hover 效果...');
      await allManagementButtons.first().hover();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'tests/screenshots/dropdown-hover-test.png',
        fullPage: false 
      });
      console.log('✓ Hover 測試截圖');
    }
  }

  // 檢查是否有客戶關係管理按鈕
  const customerMgmtBtn = page.locator('button:has-text("客戶關係管理"), button:has-text("客戶管理")');
  if (await customerMgmtBtn.count() > 0) {
    console.log('測試客戶關係管理按鈕...');
    await customerMgmtBtn.first().click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'tests/screenshots/dropdown-customer-mgmt.png',
      fullPage: false 
    });
    console.log('✓ 客戶關係管理下拉截圖');
  }

  // 檢查是否有產品與庫存按鈕
  const productMgmtBtn = page.locator('button:has-text("產品與庫存"), button:has-text("產品"), button:has-text("庫存")');
  if (await productMgmtBtn.count() > 0) {
    console.log('測試產品與庫存按鈕...');
    await productMgmtBtn.first().click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'tests/screenshots/dropdown-product-mgmt.png',
      fullPage: false 
    });
    console.log('✓ 產品與庫存下拉截圖');
  }

  // 最終截圖
  await page.screenshot({ 
    path: 'tests/screenshots/dropdown-final.png',
    fullPage: true 
  });
  console.log('✓ 最終截圖完成');
});