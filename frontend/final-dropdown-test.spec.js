import { test, expect } from '@playwright/test';

test.describe('Final Dropdown Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and login
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Handle login if redirected
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  });

  test('Verify dropdown fix works completely', async ({ page }) => {
    console.log('驗證下拉選單修復是否完全有效...');
    
    // Wait for Alpine.js initialization
    await page.waitForTimeout(2000);
    
    // 1. Take initial screenshot
    await page.screenshot({ path: 'final-test-01-initial.png', fullPage: true });
    
    // 2. Verify elements exist
    const navigation = page.locator('nav[x-data*="enhancedNavigation"]');
    await expect(navigation).toBeVisible();
    
    const userTrigger = page.locator('.nexus-user-trigger');
    await expect(userTrigger).toBeVisible();
    
    const dropdown = page.locator('.nexus-user-dropdown');
    const dropdownExists = await dropdown.count() > 0;
    console.log(`下拉選單元素存在: ${dropdownExists ? '✅' : '❌'}`);
    
    // 3. Check initial state
    const initialState = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      const alpineState = nav && nav._x_dataStack && nav._x_dataStack[0] ? {
        showUserMenu: nav._x_dataStack[0].showUserMenu,
        activeDropdown: nav._x_dataStack[0].activeDropdown
      } : null;
      
      const dropdown = document.querySelector('.nexus-user-dropdown');
      const dropdownVisible = dropdown ? dropdown.offsetParent !== null : false;
      
      return {
        alpineState,
        dropdownVisible,
        dropdownStyles: dropdown ? {
          display: getComputedStyle(dropdown).display,
          visibility: getComputedStyle(dropdown).visibility
        } : null
      };
    });
    
    console.log('初始狀態:', initialState);
    
    // 4. Click the dropdown trigger
    console.log('點擊下拉選單觸發器...');
    await userTrigger.click();
    await page.waitForTimeout(1000);
    
    // 5. Take screenshot after click
    await page.screenshot({ path: 'final-test-02-after-click.png', fullPage: true });
    
    // 6. Check state after click
    const afterClickState = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      const alpineState = nav && nav._x_dataStack && nav._x_dataStack[0] ? {
        showUserMenu: nav._x_dataStack[0].showUserMenu,
        activeDropdown: nav._x_dataStack[0].activeDropdown,
        justOpened: nav._x_dataStack[0].justOpened
      } : null;
      
      const dropdown = document.querySelector('.nexus-user-dropdown');
      const dropdownVisible = dropdown ? dropdown.offsetParent !== null : false;
      
      return {
        alpineState,
        dropdownVisible,
        dropdownStyles: dropdown ? {
          display: getComputedStyle(dropdown).display,
          visibility: getComputedStyle(dropdown).visibility,
          opacity: getComputedStyle(dropdown).opacity
        } : null
      };
    });
    
    console.log('點擊後狀態:', afterClickState);
    
    // 7. Test dropdown functionality
    if (afterClickState.dropdownVisible) {
      console.log('✅ 下拉選單成功顯示！測試功能...');
      
      // Check dropdown content
      const menuItems = await page.locator('.nexus-user-menu-item').count();
      console.log(`選單項目數量: ${menuItems}`);
      
      if (menuItems > 0) {
        // Test first menu item
        const firstMenuItem = page.locator('.nexus-user-menu-item').first();
        const itemText = await firstMenuItem.textContent();
        console.log(`第一個選單項目: ${itemText?.trim()}`);
        
        // Test hover effect
        await firstMenuItem.hover();
        await page.waitForTimeout(300);
        await page.screenshot({ path: 'final-test-03-menu-hover.png', fullPage: true });
      }
      
      // Test outside click to close
      console.log('測試點擊外部關閉下拉選單...');
      await page.click('body', { position: { x: 100, y: 100 } });
      await page.waitForTimeout(500);
      
      const afterOutsideClick = await page.evaluate(() => {
        const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
        const showUserMenu = nav && nav._x_dataStack && nav._x_dataStack[0] ? nav._x_dataStack[0].showUserMenu : null;
        const dropdown = document.querySelector('.nexus-user-dropdown');
        const dropdownVisible = dropdown ? dropdown.offsetParent !== null : false;
        
        return { showUserMenu, dropdownVisible };
      });
      
      console.log('點擊外部後狀態:', afterOutsideClick);
      await page.screenshot({ path: 'final-test-04-after-outside-click.png', fullPage: true });
      
      // Test toggle functionality
      console.log('測試切換功能...');
      await userTrigger.click();
      await page.waitForTimeout(500);
      
      const toggleTest = await page.evaluate(() => {
        const dropdown = document.querySelector('.nexus-user-dropdown');
        return dropdown ? dropdown.offsetParent !== null : false;
      });
      
      console.log(`切換測試結果 (應該重新顯示): ${toggleTest ? '✅' : '❌'}`);
      await page.screenshot({ path: 'final-test-05-toggle-test.png', fullPage: true });
      
    } else {
      console.log('❌ 下拉選單仍未顯示，進行進一步調試...');
      
      // Additional debugging
      const debugInfo = await page.evaluate(() => {
        const dropdown = document.querySelector('.nexus-user-dropdown');
        if (!dropdown) return { error: 'Dropdown not found' };
        
        const rect = dropdown.getBoundingClientRect();
        const computedStyle = getComputedStyle(dropdown);
        
        return {
          boundingRect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          },
          computedStyles: {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            position: computedStyle.position,
            zIndex: computedStyle.zIndex,
            transform: computedStyle.transform
          },
          attributes: {
            xShow: dropdown.getAttribute('x-show'),
            xCloak: dropdown.hasAttribute('x-cloak'),
            style: dropdown.getAttribute('style'),
            className: dropdown.className
          }
        };
      });
      
      console.log('調試資訊:', debugInfo);
    }
    
    // 8. Final summary
    console.log('\n=== 最終測試結果 ===');
    console.log(`導航元素存在: ✅`);
    console.log(`觸發器存在: ✅`);
    console.log(`下拉選單元素存在: ${dropdownExists ? '✅' : '❌'}`);
    console.log(`初始狀態正確: ${!initialState.alpineState?.showUserMenu ? '✅' : '❌'}`);
    console.log(`點擊後 Alpine 狀態: ${afterClickState.alpineState?.showUserMenu ? '✅' : '❌'}`);
    console.log(`點擊後下拉選單可見: ${afterClickState.dropdownVisible ? '✅' : '❌'}`);
    
    // Success criteria
    const isSuccess = (
      dropdownExists && 
      afterClickState.alpineState?.showUserMenu && 
      afterClickState.dropdownVisible
    );
    
    console.log(`\n🎯 整體修復狀態: ${isSuccess ? '✅ 成功' : '❌ 需要更多修復'}`);
    
    if (isSuccess) {
      console.log('🎉 用戶下拉選單功能已完全修復！');
    } else {
      console.log('⚠️ 還需要進一步的修復工作');
    }
  });
});