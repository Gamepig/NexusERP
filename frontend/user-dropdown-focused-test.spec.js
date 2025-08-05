import { test, expect } from '@playwright/test';

test.describe('User Dropdown Focused Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // Handle login if needed
    const loginForm = page.locator('form[action*="login"]');
    if (await loginForm.isVisible()) {
      console.log('需要登入，執行登入流程...');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
    
    // Ensure we're on dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('User dropdown comprehensive test', async ({ page }) => {
    console.log('開始用戶下拉選單測試...');
    
    // 1. Take initial screenshot
    await page.screenshot({ path: 'user-dropdown-01-initial.png', fullPage: true });
    
    // 2. Wait for Alpine.js to load
    await page.waitForTimeout(2000);
    
    // 3. Check if Alpine.js is loaded
    const alpineLoaded = await page.evaluate(() => {
      return typeof window.Alpine !== 'undefined';
    });
    console.log(`Alpine.js 載入狀態: ${alpineLoaded ? '✅ 已載入' : '❌ 未載入'}`);
    
    // 4. Find the navigation element
    const navigation = page.locator('nav[x-data*="enhancedNavigation"]');
    await expect(navigation).toBeVisible();
    console.log('✅ 找到導航元素');
    
    // 5. Find the user dropdown trigger
    const userTrigger = page.locator('.nexus-user-trigger');
    await expect(userTrigger).toBeVisible();
    console.log('✅ 找到用戶觸發器');
    
    // 6. Check Alpine.js data state before click
    const alpineStateBefore = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        return {
          showUserMenu: nav._x_dataStack[0].showUserMenu,
          mobileMenuOpen: nav._x_dataStack[0].mobileMenuOpen,
          toggleUserMenuExists: typeof nav._x_dataStack[0].toggleUserMenu === 'function'
        };
      }
      return null;
    });
    console.log('Alpine 狀態 (點擊前):', alpineStateBefore);
    
    // 7. Take screenshot before click
    await page.screenshot({ path: 'user-dropdown-02-before-click.png', fullPage: true });
    
    // 8. Click the user dropdown trigger
    console.log('點擊用戶下拉觸發器...');
    await userTrigger.click();
    await page.waitForTimeout(1000);
    
    // 9. Take screenshot after click
    await page.screenshot({ path: 'user-dropdown-03-after-click.png', fullPage: true });
    
    // 10. Check Alpine.js data state after click
    const alpineStateAfter = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        return {
          showUserMenu: nav._x_dataStack[0].showUserMenu,
          mobileMenuOpen: nav._x_dataStack[0].mobileMenuOpen,
          activeDropdown: nav._x_dataStack[0].activeDropdown
        };
      }
      return null;
    });
    console.log('Alpine 狀態 (點擊後):', alpineStateAfter);
    
    // 11. Check if dropdown is visible
    const dropdownVisible = await page.locator('.nexus-user-dropdown').isVisible();
    console.log(`下拉選單可見性: ${dropdownVisible ? '✅ 可見' : '❌ 不可見'}`);
    
    // 12. Check x-show attribute
    const xShowValue = await page.locator('[x-show="showUserMenu"]').getAttribute('x-show');
    console.log(`x-show 屬性值: ${xShowValue}`);
    
    // 13. Check computed styles of dropdown
    const dropdownStyles = await page.locator('.nexus-user-dropdown').evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        transform: computed.transform,
        position: computed.position,
        zIndex: computed.zIndex
      };
    });
    console.log('下拉選單樣式:', dropdownStyles);
    
    // 14. Check for JavaScript errors
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    // Wait for any delayed errors
    await page.waitForTimeout(2000);
    
    if (jsErrors.length > 0) {
      console.log('⚠️ JavaScript 錯誤:');
      jsErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    } else {
      console.log('✅ 無 JavaScript 錯誤');
    }
    
    // 15. Try manual Alpine.js method call
    console.log('嘗試手動調用 Alpine.js 方法...');
    const manualToggleResult = await page.evaluate(() => {
      try {
        const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
        if (nav && nav._x_dataStack && nav._x_dataStack[0] && nav._x_dataStack[0].toggleUserMenu) {
          nav._x_dataStack[0].toggleUserMenu();
          return {
            success: true,
            newState: nav._x_dataStack[0].showUserMenu
          };
        }
        return { success: false, reason: 'Method not found' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    console.log('手動切換結果:', manualToggleResult);
    
    // 16. Take final screenshot
    await page.screenshot({ path: 'user-dropdown-04-final-state.png', fullPage: true });
    
    // 17. Check if dropdown appeared after manual toggle
    const dropdownVisibleAfterManual = await page.locator('.nexus-user-dropdown').isVisible();
    console.log(`手動切換後下拉選單可見性: ${dropdownVisibleAfterManual ? '✅ 可見' : '❌ 不可見'}`);
    
    // 18. Test direct attribute manipulation
    console.log('測試直接屬性操作...');
    await page.evaluate(() => {
      const dropdown = document.querySelector('.nexus-user-dropdown');
      if (dropdown) {
        dropdown.style.display = 'block';
        dropdown.style.opacity = '1';
        dropdown.style.visibility = 'visible';
      }
    });
    
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'user-dropdown-05-forced-visible.png', fullPage: true });
    
    const forcedVisible = await page.locator('.nexus-user-dropdown').isVisible();
    console.log(`強制顯示後可見性: ${forcedVisible ? '✅ 可見' : '❌ 不可見'}`);
    
    // Summary
    console.log('\n=== 測試結果總結 ===');
    console.log(`Alpine.js 載入: ${alpineLoaded ? '✅' : '❌'}`);
    console.log(`導航元素存在: ✅`);
    console.log(`用戶觸發器存在: ✅`);
    console.log(`點擊後下拉選單可見: ${dropdownVisible ? '✅' : '❌'}`);
    console.log(`手動切換成功: ${manualToggleResult.success ? '✅' : '❌'}`);
    console.log(`強制顯示成功: ${forcedVisible ? '✅' : '❌'}`);
    console.log(`JavaScript 錯誤: ${jsErrors.length === 0 ? '✅ 無錯誤' : `❌ ${jsErrors.length} 個錯誤`}`);
  });
  
  test('Alpine.js event binding test', async ({ page }) => {
    console.log('測試 Alpine.js 事件綁定...');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Test click event binding
    const clickEventResult = await page.evaluate(() => {
      const trigger = document.querySelector('.nexus-user-trigger');
      if (!trigger) return { success: false, reason: 'Trigger not found' };
      
      // Check for Alpine.js click handler
      const clickHandler = trigger.getAttribute('@click');
      const onClickHandler = trigger.onclick;
      
      // Check if element has Alpine.js data
      const hasAlpineData = trigger.closest('[x-data]') !== null;
      
      return {
        success: true,
        clickHandler,
        onClickHandler: onClickHandler ? 'function exists' : 'no function',
        hasAlpineData,
        elementHTML: trigger.outerHTML.substring(0, 200)
      };
    });
    
    console.log('點擊事件檢查結果:', clickEventResult);
    
    // Test Alpine.js initialization
    const alpineInitResult = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (!nav) return { success: false, reason: 'Nav not found' };
      
      return {
        success: true,
        hasXData: nav.hasAttribute('x-data'),
        xDataValue: nav.getAttribute('x-data'),
        hasDataStack: nav._x_dataStack ? true : false,
        dataStackLength: nav._x_dataStack ? nav._x_dataStack.length : 0,
        methods: nav._x_dataStack && nav._x_dataStack[0] ? Object.keys(nav._x_dataStack[0]).filter(key => typeof nav._x_dataStack[0][key] === 'function') : []
      };
    });
    
    console.log('Alpine.js 初始化檢查:', alpineInitResult);
  });
});