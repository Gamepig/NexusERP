import { test, expect } from '@playwright/test';

test('Verify CSS Fix for User Dropdown', async ({ page }) => {
  // 訪問登入頁面
  await page.goto('http://127.0.0.1:8000/login');
  
  // 填寫登入表單
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // 等待導航到儀表板
  await page.waitForURL('**/dashboard');
  await page.waitForTimeout(2000);
  
  console.log('=== CSS Fix Verification ===');
  
  // 點擊用戶下拉選單觸發器
  const userTrigger = await page.locator('.nexus-user-trigger').first();
  await userTrigger.click();
  await page.waitForTimeout(1000);
  
  // 檢查下拉選單樣式
  const dropdown = await page.locator('.nexus-user-dropdown').first();
  const dropdownVisible = await dropdown.isVisible();
  console.log('1. Dropdown visible:', dropdownVisible);
  
  if (dropdownVisible) {
    // 檢查背景是否為深色漸變
    const backgroundStyle = await dropdown.evaluate(el => {
      return window.getComputedStyle(el).background;
    });
    
    console.log('2. Background style:', backgroundStyle);
    
    // 檢查是否包含漸變
    const hasGradient = backgroundStyle.includes('gradient') || backgroundStyle.includes('linear-gradient');
    console.log('3. Has gradient background:', hasGradient);
    
    // 檢查文字顏色
    const userInfo = await dropdown.locator('.nexus-user-info .font-medium').first();
    const textColor = await userInfo.evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    console.log('4. Text color:', textColor);
    
    // 檢查選單項目顏色
    const menuItem = await dropdown.locator('.nexus-user-menu-item').first();
    const menuItemColor = await menuItem.evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    console.log('5. Menu item color:', menuItemColor);
    
    // 驗證懸停效果
    await menuItem.hover();
    await page.waitForTimeout(500);
    
    const hoverBackgroundColor = await menuItem.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log('6. Hover background color:', hoverBackgroundColor);
  }
  
  // 截圖保存修復後的狀態
  await page.screenshot({ 
    path: 'css-fix-verification.png',
    fullPage: false
  });
  
  console.log('=== Verification Complete ===');
  console.log('Screenshot saved as: css-fix-verification.png');
  
  // 驗證是否達到期望效果
  if (dropdownVisible) {
    console.log('\n✅ SUCCESS: User dropdown is displaying correctly');
  } else {
    console.log('\n❌ FAILED: User dropdown is not visible');
  }
});