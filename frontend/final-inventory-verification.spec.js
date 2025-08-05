// 庫存報表頁面最終驗證測試
import { test, expect } from '@playwright/test';

test('庫存報表頁面最終成功驗證', async ({ page }) => {
  console.log('🎯 執行庫存報表頁面最終驗證');

  // 登入
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]')
  ]);

  // 前往庫存報表頁面
  await page.goto('http://127.0.0.1:8000/reports/inventory');
  await page.waitForTimeout(5000);

  // 檢查關鍵指標
  const canvasCount = await page.locator('canvas').count();
  const errorCount = await page.locator('.error, .alert-danger').count();
  const h1Text = await page.locator('h1').textContent();

  // 最終成功截圖
  await page.screenshot({ 
    path: 'screenshots/FINAL-INVENTORY-REPORTS-SUCCESS.png',
    fullPage: true 
  });

  // 驗證
  expect(canvasCount).toBe(2);
  expect(errorCount).toBe(0);
  expect(h1Text).toContain('庫存報表');

  console.log('✅ 最終驗證成功！');
  console.log(`📊 圖表數量: ${canvasCount}`);
  console.log(`❌ 錯誤數量: ${errorCount}`);
  console.log(`📋 頁面標題: ${h1Text}`);
});