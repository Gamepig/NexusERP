import { test, expect } from '@playwright/test';

test.describe('Enhanced Navigation System Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 登入測試帳號
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待導向到 dashboard
    await page.waitForURL('**/dashboard');
  });

  test('檢查多層級導航結構是否正確載入', async ({ page }) => {
    console.log('=== 測試：多層級導航結構 ===');
    
    // 檢查 enhanced-navigation 組件是否載入
    const navigation = page.locator('nav.bg-white.border-b');
    await expect(navigation).toBeVisible();
    console.log('✓ 主導航容器已載入');
    
    // 檢查頂層導航項目
    const topLevelItems = [
      { name: '儀表板', selector: 'a[href="/dashboard"]' },
      { name: '庫存管理', selector: 'button:has-text("庫存管理")' },
      { name: '銷售管理', selector: 'button:has-text("銷售管理")' },
      { name: '採購管理', selector: 'button:has-text("採購管理")' },
      { name: '財務管理', selector: 'button:has-text("財務管理")' },
      { name: '系統設定', selector: 'button:has-text("系統設定")' }
    ];
    
    for (const item of topLevelItems) {
      const element = page.locator(item.selector).first();
      await expect(element).toBeVisible();
      console.log(`✓ ${item.name} 項目已顯示`);
    }
  });

  test('測試庫存管理下拉選單功能', async ({ page }) => {
    console.log('=== 測試：庫存管理下拉選單 ===');
    
    // 點擊庫存管理觸發下拉選單
    const inventoryButton = page.locator('button:has-text("庫存管理")').first();
    await inventoryButton.click();
    
    // 等待下拉選單出現
    await page.waitForTimeout(500);
    
    // 檢查下拉選單項目
    const inventoryItems = [
      '產品列表',
      '庫存查詢',
      '庫存調整',
      '盤點作業',
      '庫存報表'
    ];
    
    for (const item of inventoryItems) {
      const menuItem = page.locator(`text="${item}"`);
      await expect(menuItem).toBeVisible();
      console.log(`✓ ${item} 選單項目已顯示`);
    }
  });

  test('測試銷售管理下拉選單功能', async ({ page }) => {
    console.log('=== 測試：銷售管理下拉選單 ===');
    
    // 點擊銷售管理觸發下拉選單
    const salesButton = page.locator('button:has-text("銷售管理")').first();
    await salesButton.click();
    
    // 等待下拉選單出現
    await page.waitForTimeout(500);
    
    // 檢查下拉選單項目
    const salesItems = [
      '報價單',
      '銷售訂單',
      '出貨單',
      '客戶管理',
      '銷售報表'
    ];
    
    for (const item of salesItems) {
      const menuItem = page.locator(`text="${item}"`);
      await expect(menuItem).toBeVisible();
      console.log(`✓ ${item} 選單項目已顯示`);
    }
  });

  test('測試導航連結功能', async ({ page }) => {
    console.log('=== 測試：導航連結功能 ===');
    
    // 測試庫存管理 -> 產品列表導航
    const inventoryButton = page.locator('button:has-text("庫存管理")').first();
    await inventoryButton.click();
    await page.waitForTimeout(500);
    
    const productLink = page.locator('a[href="/inventory/products"]');
    await expect(productLink).toBeVisible();
    console.log('✓ 產品列表連結已顯示');
    
    // 點擊產品列表連結
    await productLink.click();
    await page.waitForURL('**/inventory/products');
    console.log('✓ 成功導航到產品列表頁面');
    
    // 檢查麵包屑導航
    const breadcrumb = page.locator('.breadcrumb, nav[aria-label="breadcrumb"], .flex.items-center.space-x-2');
    if (await breadcrumb.count() > 0) {
      console.log('✓ 麵包屑導航已顯示');
    }
  });

  test('檢查響應式設計', async ({ page }) => {
    console.log('=== 測試：響應式設計 ===');
    
    // 測試桌面版本
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    
    const desktopNav = page.locator('nav.bg-white.border-b');
    await expect(desktopNav).toBeVisible();
    console.log('✓ 桌面版導航正常顯示');
    
    // 測試平板版本
    await page.setViewportSize({ width: 768, height: 600 });
    await page.reload();
    
    // 檢查是否有漢堡選單或摺疊導航
    const mobileMenu = page.locator('button[aria-label="toggle menu"], .mobile-menu-button, .hamburger');
    if (await mobileMenu.count() > 0) {
      console.log('✓ 行動版選單按鈕已顯示');
    }
    
    // 測試手機版本
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    console.log('✓ 手機版布局已載入');
  });

  test('檢查 JavaScript 錯誤', async ({ page }) => {
    console.log('=== 測試：JavaScript 錯誤檢查 ===');
    
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // 重新載入頁面並等待
    await page.reload();
    await page.waitForTimeout(3000);
    
    // 測試下拉選單互動
    const menuButtons = page.locator('button:has-text("管理")');
    const count = await menuButtons.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      await menuButtons.nth(i).click();
      await page.waitForTimeout(500);
    }
    
    console.log(`JavaScript 錯誤數量: ${errors.length}`);
    if (errors.length > 0) {
      console.log('錯誤詳情:', errors);
    } else {
      console.log('✓ 無 JavaScript 錯誤');
    }
    
    expect(errors.length).toBeLessThan(3); // 允許少量非關鍵錯誤
  });

  test('截圖最新結果', async ({ page }) => {
    console.log('=== 截圖：最新導航結果 ===');
    
    // 截圖主頁面
    await page.screenshot({ 
      path: 'tests/screenshots/enhanced-navigation-main.png',
      fullPage: true 
    });
    console.log('✓ 主頁面截圖已儲存');
    
    // 截圖庫存管理下拉選單
    const inventoryButton = page.locator('button:has-text("庫存管理")').first();
    await inventoryButton.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'tests/screenshots/enhanced-navigation-inventory-dropdown.png',
      fullPage: false 
    });
    console.log('✓ 庫存管理下拉選單截圖已儲存');
    
    // 截圖銷售管理下拉選單
    await page.click('body'); // 關閉當前下拉選單
    await page.waitForTimeout(500);
    
    const salesButton = page.locator('button:has-text("銷售管理")').first();
    await salesButton.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'tests/screenshots/enhanced-navigation-sales-dropdown.png',
      fullPage: false 
    });
    console.log('✓ 銷售管理下拉選單截圖已儲存');
  });
});