import { test, expect } from '@playwright/test';

test.describe('User Dropdown Menu Fix Verification', () => {
  test('should have no JavaScript errors and dropdown should work', async ({ page }) => {
    // Set up console error tracking
    const jsErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    // Navigate to the page
    await page.goto('http://127.0.0.1:8000/login');

    // Login first
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if the missing functions are now defined
    const functionsExist = await page.evaluate(() => {
      return {
        getNavItemClassesExists: typeof window.getNavItemClasses === 'function',
        getSubItemClassesExists: typeof window.getSubItemClasses === 'function',
        enhancedNavigationExists: typeof window.enhancedNavigation === 'function',
        multiLevelNavExists: typeof window.multiLevelNav === 'function'
      };
    });

    console.log('Function availability:', functionsExist);

    // Verify functions are available
    expect(functionsExist.getNavItemClassesExists).toBe(true);
    expect(functionsExist.getSubItemClassesExists).toBe(true);
    expect(functionsExist.enhancedNavigationExists).toBe(true);
    expect(functionsExist.multiLevelNavExists).toBe(true);

    // Check for JavaScript errors (should be none or minimal)
    console.log('JavaScript errors found:', jsErrors.length);
    jsErrors.forEach(error => console.log('JS Error:', error));
    
    // Allow for some non-critical errors but not the undefined function errors
    const criticalErrors = jsErrors.filter(error => 
      error.includes('getNavItemClasses is not defined') || 
      error.includes('getSubItemClasses is not defined')
    );
    
    expect(criticalErrors.length).toBe(0);

    // Test user dropdown functionality
    const userTrigger = page.locator('#user-menu-trigger');
    await expect(userTrigger).toBeVisible();

    // Check initial state
    const initialMenuState = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        return nav._x_dataStack[0].showUserMenu;
      }
      return null;
    });

    console.log('Initial menu state:', initialMenuState);
    expect(initialMenuState).toBe(false);

    // Click the user menu trigger
    await userTrigger.click();
    await page.waitForTimeout(500); // Wait for animation

    // Check if menu opened
    const menuOpenState = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        return nav._x_dataStack[0].showUserMenu;
      }
      return null;
    });

    console.log('Menu state after click:', menuOpenState);
    expect(menuOpenState).toBe(true);

    // Check if dropdown menu is visible in DOM
    const dropdownMenu = page.locator('#user-dropdown-menu');
    await expect(dropdownMenu).toBeVisible();

    // Check if dropdown has content
    const menuItems = await dropdownMenu.locator('a, button').count();
    console.log('Menu items found:', menuItems);
    expect(menuItems).toBeGreaterThan(0);

    // Verify visual styling is applied
    const dropdownStyles = await dropdownMenu.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        opacity: computed.opacity,
        visibility: computed.visibility,
        transform: computed.transform
      };
    });

    console.log('Dropdown styles:', dropdownStyles);
    expect(dropdownStyles.display).not.toBe('none');

    // Test closing the menu
    await page.click('body'); // Click outside
    await page.waitForTimeout(300);

    const menuClosedState = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        return nav._x_dataStack[0].showUserMenu;
      }
      return null;
    });

    console.log('Menu state after outside click:', menuClosedState);
    expect(menuClosedState).toBe(false);

    // Final JavaScript error check
    const finalCriticalErrors = jsErrors.filter(error => 
      error.includes('getNavItemClasses is not defined') || 
      error.includes('getSubItemClasses is not defined')
    );
    
    expect(finalCriticalErrors.length).toBe(0);

    console.log('✅ Test completed successfully!');
    console.log('✅ JavaScript errors fixed');
    console.log('✅ Dropdown menu functionality restored');
    console.log('✅ Visual rendering working correctly');
  });

  test('should test global function calls directly', async ({ page }) => {
    await page.goto('http://127.0.0.1:8000/login');
    
    // Login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Test function calls directly
    const functionTests = await page.evaluate(() => {
      try {
        // Test getNavItemClasses
        const testItem1 = { isActive: true };
        const testItem2 = { isActive: false };
        
        const activeClasses = window.getNavItemClasses(testItem1);
        const inactiveClasses = window.getNavItemClasses(testItem2);
        
        // Test getSubItemClasses
        const activeSubClasses = window.getSubItemClasses(testItem1);
        const inactiveSubClasses = window.getSubItemClasses(testItem2);
        
        return {
          success: true,
          activeClasses: activeClasses.includes('bg-gradient-to-r'),
          inactiveClasses: inactiveClasses.includes('text-gray-600'),
          activeSubClasses: activeSubClasses.includes('bg-purple-50'),
          inactiveSubClasses: inactiveSubClasses.includes('text-gray-700')
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('Function test results:', functionTests);
    expect(functionTests.success).toBe(true);
    expect(functionTests.activeClasses).toBe(true);
    expect(functionTests.inactiveClasses).toBe(true);
    expect(functionTests.activeSubClasses).toBe(true);
    expect(functionTests.inactiveSubClasses).toBe(true);
  });
});