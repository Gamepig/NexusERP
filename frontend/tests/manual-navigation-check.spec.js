import { test, expect } from '@playwright/test';

test.describe('Manual Navigation Verification', () => {
  test('手動驗證導航功能', async ({ page }) => {
    // 登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    console.log('=== 手動導航功能驗證 ===');

    // 截圖初始狀態
    await page.screenshot({ 
      path: 'tests/screenshots/manual-navigation-initial.png',
      fullPage: true 
    });
    console.log('✓ 初始狀態截圖已儲存');

    // 檢查頂層導航是否存在
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
    console.log('✓ 主導航容器已載入');

    // 檢查是否有下拉選單（通過 hover 測試）
    const navItems = page.locator('nav button, nav a').filter({ hasText: '管理' });
    const count = await navItems.count();
    console.log(`✓ 找到 ${count} 個包含'管理'的導航項目`);

    // 嘗試 hover 第一個管理項目
    if (count > 0) {
      await navItems.first().hover();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'tests/screenshots/manual-navigation-hover.png',
        fullPage: false 
      });
      console.log('✓ Hover 效果截圖已儲存');
    }

    // 檢查實際的 HTML 結構
    const navHTML = await page.locator('nav').innerHTML();
    console.log('導航 HTML 結構樣本：');
    console.log(navHTML.substring(0, 500) + '...');

    // 檢查是否有 Alpine.js 或其他 JS 框架
    const alpineElements = page.locator('[x-data], [x-show], [@click]');
    const alpineCount = await alpineElements.count();
    console.log(`✓ 找到 ${alpineCount} 個 Alpine.js 相關元素`);

    // 最終完整截圖
    await page.screenshot({ 
      path: 'tests/screenshots/manual-navigation-final.png',
      fullPage: true 
    });
    console.log('✓ 最終截圖已儲存');
  });
});