import { test, expect } from '@playwright/test';

test.describe('Working Dropdown Test', () => {
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

  test('Test user dropdown functionality with authentication', async ({ page }) => {
    console.log('測試已認證用戶的下拉選單功能...');
    
    // 1. Take initial screenshot
    await page.screenshot({ path: 'working-dropdown-01-initial.png', fullPage: true });
    
    // 2. Wait for Alpine.js to initialize
    await page.waitForTimeout(2000);
    
    // 3. Verify we're on dashboard
    const currentUrl = page.url();
    console.log(`當前 URL: ${currentUrl}`);
    expect(currentUrl).toContain('dashboard');
    
    // 4. Find and verify navigation elements
    const navElement = page.locator('nav[x-data*="enhancedNavigation"]');
    await expect(navElement).toBeVisible();
    console.log('✅ Enhanced Navigation 可見');
    
    const userTrigger = page.locator('.nexus-user-trigger');
    await expect(userTrigger).toBeVisible();
    console.log('✅ User Trigger 可見');
    
    // 5. Check Alpine.js state before interaction
    const initialState = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        const data = nav._x_dataStack[0];
        return {
          showUserMenu: data.showUserMenu,
          hasToggleFunction: typeof data.toggleUserMenu === 'function',
          activeDropdown: data.activeDropdown,
          justOpened: data.justOpened
        };
      }
      return { error: 'Alpine data not found' };
    });
    console.log('初始 Alpine 狀態:', initialState);
    
    // 6. Check dropdown element existence
    const dropdownElement = page.locator('.nexus-user-dropdown');
    const dropdownExists = await dropdownElement.count() > 0;
    console.log(`下拉選單元素存在: ${dropdownExists ? '是' : '否'}`);
    
    if (dropdownExists) {
      const dropdownStyles = await dropdownElement.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          zIndex: computed.zIndex,
          position: computed.position
        };
      });
      console.log('下拉選單初始樣式:', dropdownStyles);
    }
    
    // 7. Take screenshot before click
    await page.screenshot({ path: 'working-dropdown-02-before-click.png', fullPage: true });
    
    // 8. Click the user trigger
    console.log('點擊用戶觸發器...');
    await userTrigger.click();
    await page.waitForTimeout(1000);
    
    // 9. Take screenshot after click
    await page.screenshot({ path: 'working-dropdown-03-after-click.png', fullPage: true });
    
    // 10. Check Alpine.js state after click
    const afterClickState = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        const data = nav._x_dataStack[0];
        return {
          showUserMenu: data.showUserMenu,
          activeDropdown: data.activeDropdown,
          justOpened: data.justOpened,
          userCloseTimeout: data.userCloseTimeout !== null
        };
      }
      return { error: 'Alpine data not found' };
    });
    console.log('點擊後 Alpine 狀態:', afterClickState);
    
    // 11. Check dropdown visibility after click
    if (dropdownExists) {
      const dropdownVisible = await dropdownElement.isVisible();
      console.log(`點擊後下拉選單可見: ${dropdownVisible ? '是' : '否'}`);
      
      const dropdownStylesAfter = await dropdownElement.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          transform: computed.transform
        };
      });
      console.log('點擊後下拉選單樣式:', dropdownStylesAfter);
      
      // Check x-show attribute
      const xShowAttr = await dropdownElement.getAttribute('x-show');
      console.log(`x-show 屬性: ${xShowAttr}`);
    }
    
    // 12. Test manual Alpine.js method invocation
    console.log('測試手動 Alpine.js 方法調用...');
    const manualToggleResult = await page.evaluate(() => {
      try {
        const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
        if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
          const data = nav._x_dataStack[0];
          if (typeof data.toggleUserMenu === 'function') {
            const beforeState = data.showUserMenu;
            data.toggleUserMenu();
            const afterState = data.showUserMenu;
            return {
              success: true,
              beforeState,
              afterState,
              stateChanged: beforeState !== afterState
            };
          }
        }
        return { success: false, reason: 'Method not found' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    console.log('手動切換結果:', manualToggleResult);
    
    // 13. Wait and take screenshot after manual toggle
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'working-dropdown-04-after-manual-toggle.png', fullPage: true });
    
    // 14. Check final dropdown state
    if (dropdownExists) {
      const finalDropdownVisible = await dropdownElement.isVisible();
      console.log(`手動切換後下拉選單可見: ${finalDropdownVisible ? '是' : '否'}`);
    }
    
    // 15. Test direct style manipulation for debugging
    console.log('測試直接樣式操作以排除 CSS 問題...');
    await page.evaluate(() => {
      const dropdown = document.querySelector('.nexus-user-dropdown');
      if (dropdown) {
        // Force show with inline styles
        dropdown.style.display = 'block';
        dropdown.style.visibility = 'visible';
        dropdown.style.opacity = '1';
        dropdown.style.transform = 'scale(1)';
        dropdown.style.pointerEvents = 'auto';
      }
    });
    
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'working-dropdown-05-forced-visible.png', fullPage: true });
    
    const forcedVisible = await dropdownElement.isVisible();
    console.log(`強制顯示後可見: ${forcedVisible ? '是' : '否'}`);
    
    // 16. Check for CSS conflicts or overrides
    const cssCheck = await page.evaluate(() => {
      const dropdown = document.querySelector('.nexus-user-dropdown');
      if (!dropdown) return { error: 'Dropdown not found' };
      
      const computed = window.getComputedStyle(dropdown);
      const allStyles = {};
      
      // Get all computed styles that might affect visibility
      const relevantProps = [
        'display', 'visibility', 'opacity', 'transform', 'position', 'zIndex',
        'top', 'right', 'left', 'bottom', 'width', 'height', 'overflow'
      ];
      
      relevantProps.forEach(prop => {
        allStyles[prop] = computed.getPropertyValue(prop);
      });
      
      return {
        computedStyles: allStyles,
        hasXShow: dropdown.hasAttribute('x-show'),
        xShowValue: dropdown.getAttribute('x-show'),
        hasStyleAttr: dropdown.hasAttribute('style'),
        styleAttr: dropdown.getAttribute('style')
      };
    });
    console.log('CSS 檢查結果:', cssCheck);
    
    // 17. Test x-show directive manually
    if (dropdownExists) {
      console.log('測試 x-show 指令手動切換...');
      await page.evaluate(() => {
        const dropdown = document.querySelector('.nexus-user-dropdown');
        if (dropdown && dropdown.hasAttribute('x-show')) {
          // Try to trigger x-show evaluation
          const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
          if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
            nav._x_dataStack[0].showUserMenu = true; // Set to true directly
          }
        }
      });
      
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'working-dropdown-06-xshow-manual.png', fullPage: true });
      
      const xShowManualVisible = await dropdownElement.isVisible();
      console.log(`x-show 手動設置後可見: ${xShowManualVisible ? '是' : '否'}`);
    }
    
    // 18. Summary
    console.log('\n=== 測試總結 ===');
    console.log(`導航元素存在: ✅`);
    console.log(`用戶觸發器存在: ✅`);
    console.log(`下拉選單元素存在: ${dropdownExists ? '✅' : '❌'}`);
    console.log(`Alpine.js 功能: ${initialState.hasToggleFunction ? '✅' : '❌'}`);
    console.log(`點擊觸發狀態變更: ${afterClickState.showUserMenu ? '✅' : '❌'}`);
    console.log(`手動切換成功: ${manualToggleResult.success && manualToggleResult.stateChanged ? '✅' : '❌'}`);
    console.log(`CSS 強制顯示: ${forcedVisible ? '✅' : '❌'}`);
  });
});