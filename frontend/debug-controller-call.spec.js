import { test, expect } from '@playwright/test';

test('Debug Controller Call', async ({ page }) => {
  // Navigate and login
  await page.goto('http://127.0.0.1:8000/orders/sales');
  
  if (await page.locator('input[name="email"]').isVisible()) {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  }
  
  // Go to edit page
  await page.goto('http://127.0.0.1:8000/orders/sales/7246/edit');
  await page.waitForLoadState('networkidle');
  
  // Check for debug info
  const debugInfo = page.locator('div.bg-yellow-100:has-text("調試信息")');
  const hasDebugInfo = await debugInfo.count() > 0;
  
  console.log(`🔍 調試信息是否顯示: ${hasDebugInfo}`);
  
  if (hasDebugInfo) {
    const debugText = await debugInfo.textContent();
    console.log(`📄 調試內容: ${debugText}`);
  } else {
    console.log('❌ 沒有找到調試信息 - 可能控制器沒有被調用');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'screenshots/debug-controller-call.png', fullPage: true });
});