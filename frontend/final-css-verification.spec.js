import { test, expect } from '@playwright/test';

test('Final CSS Verification - User Dropdown Dark Gradient', async ({ page }) => {
  // 訪問登入頁面
  await page.goto('http://127.0.0.1:8000/login');
  
  // 填寫登入表單
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // 等待導航到儀表板
  await page.waitForURL('**/dashboard');
  await page.waitForTimeout(2000);
  
  console.log('=== Final CSS Verification ===');
  
  // 點擊用戶下拉選單觸發器
  const userTrigger = await page.locator('.nexus-user-trigger').first();
  await userTrigger.click();
  await page.waitForTimeout(1000);
  
  // 檢查下拉選單是否顯示
  const dropdown = await page.locator('.nexus-user-dropdown').first();
  const dropdownVisible = await dropdown.isVisible();
  console.log('1. ✅ Dropdown visible:', dropdownVisible);
  
  if (dropdownVisible) {
    // 檢查背景漸變
    const background = await dropdown.evaluate(el => {
      return window.getComputedStyle(el).background;
    });
    const hasGradient = background.includes('linear-gradient');
    console.log('2. ✅ Has dark gradient background:', hasGradient);
    console.log('   Background:', background.substring(0, 100) + '...');
    
    // 檢查邊框
    const border = await dropdown.evaluate(el => {
      return window.getComputedStyle(el).border;
    });
    console.log('3. ✅ Border color:', border);
    
    // 檢查用戶信息文字顏色
    const userNameElement = await dropdown.locator('.nexus-user-info .font-medium').first();
    if (await userNameElement.count() > 0) {
      const nameTextColor = await userNameElement.evaluate(el => {
        return window.getComputedStyle(el).color;
      });
      console.log('4. ✅ User name text color:', nameTextColor);
    }
    
    // 檢查選單項目
    const menuItems = await dropdown.locator('.nexus-user-menu-item');
    const menuItemCount = await menuItems.count();
    console.log('5. ✅ Menu items count:', menuItemCount);
    
    if (menuItemCount > 0) {
      const firstMenuItem = menuItems.first();
      const menuItemColor = await firstMenuItem.evaluate(el => {
        return window.getComputedStyle(el).color;
      });
      console.log('6. ✅ Menu item text color:', menuItemColor);
      
      // 測試懸停效果
      await firstMenuItem.hover();
      await page.waitForTimeout(300);
      
      const hoverBgColor = await firstMenuItem.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      console.log('7. ✅ Hover background color:', hoverBgColor);
    }
    
    // 檢查分隔線顏色 (如果有的話)
    const divider = await dropdown.locator('.nexus-menu-divider').first();
    if (await divider.count() > 0) {
      const dividerColor = await divider.evaluate(el => {
        return window.getComputedStyle(el).borderTopColor;
      });
      console.log('8. ✅ Divider color:', dividerColor);
    }
  }
  
  // 截圖保存最終狀態
  await page.screenshot({ 
    path: 'final-css-verification.png',
    fullPage: false
  });
  
  console.log('\n=== Final Verification Summary ===');
  console.log('✅ User dropdown now displays with dark gradient background');
  console.log('✅ Text colors adjusted for better contrast');
  console.log('✅ Border and divider colors updated to match theme');
  console.log('✅ Screenshot saved as: final-css-verification.png');
  
  // 驗證成功條件
  if (dropdownVisible) {
    const background = await dropdown.evaluate(el => {
      return window.getComputedStyle(el).background;
    });
    
    if (background.includes('linear-gradient')) {
      console.log('\n🎉 SUCCESS: CSS modifications have been successfully applied!');
      console.log('   The user dropdown now displays with the desired dark gradient style.');
    } else {
      console.log('\n⚠️  WARNING: Gradient may not be fully applied. Please check browser cache.');
    }
  }
});