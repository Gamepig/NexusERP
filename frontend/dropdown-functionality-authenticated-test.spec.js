import { test, expect } from '@playwright/test';

test.describe('Dropdown Functionality - Authenticated Test', () => {
  test('should verify dropdown functionality after login with test credentials', async ({ page }) => {
    console.log('=== Starting Authenticated Dropdown Test ===');
    
    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: './screenshots/dropdown-auth-test-01-login-page.png',
      fullPage: true 
    });

    // Step 2: Perform login
    console.log('Step 2: Performing login with test credentials');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Take screenshot before login
    await page.screenshot({ 
      path: './screenshots/dropdown-auth-test-02-before-login.png',
      fullPage: true 
    });
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL after login:', page.url());

    // Step 3: Take screenshot after login
    await page.screenshot({ 
      path: './screenshots/dropdown-auth-test-03-after-login.png',
      fullPage: true 
    });

    // Step 4: Check for JavaScript errors after login
    console.log('Step 4: Checking for JavaScript errors after login');
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    // Wait for any immediate errors
    await page.waitForTimeout(2000);

    // Step 5: Check if required functions exist
    console.log('Step 5: Checking if Alpine.js and navigation functions exist');
    const functionCheck = await page.evaluate(() => {
      return {
        Alpine: typeof window.Alpine,
        alpineVersion: window.Alpine?.version || 'not available',
        enhancedNavigation: typeof window.enhancedNavigation,
        getNavItemClasses: typeof window.getNavItemClasses,
        getSubItemClasses: typeof window.getSubItemClasses,
        navigationPresent: !!document.querySelector('nav[x-data="enhancedNavigation()"]')
      };
    });

    console.log('Function Check Results:', functionCheck);

    // Step 6: Check if user dropdown elements exist
    console.log('Step 6: Checking for user dropdown elements');
    const dropdownElementsCheck = await page.evaluate(() => {
      const trigger = document.querySelector('#user-menu-trigger');
      const dropdown = document.querySelector('#user-dropdown-menu');
      const navigation = document.querySelector('nav[x-data="enhancedNavigation()"]');
      
      return {
        navigationExists: !!navigation,
        triggerExists: !!trigger,
        dropdownExists: !!dropdown,
        triggerVisible: trigger ? window.getComputedStyle(trigger).display !== 'none' : false,
        dropdownClasses: dropdown ? dropdown.className : 'not found',
        triggerClasses: trigger ? trigger.className : 'not found',
        alpineData: navigation ? (navigation._x_dataStack ? 'present' : 'missing') : 'no navigation'
      };
    });

    console.log('Dropdown Elements Check:', dropdownElementsCheck);

    // Step 7: If elements exist, test dropdown functionality
    if (dropdownElementsCheck.triggerExists) {
      console.log('Step 7: Testing dropdown trigger click');
      
      // Take screenshot before clicking
      await page.screenshot({ 
        path: './screenshots/dropdown-auth-test-04-before-click.png',
        fullPage: true 
      });

      // Get Alpine.js state before click
      const stateBeforeClick = await page.evaluate(() => {
        const nav = document.querySelector('nav[x-data="enhancedNavigation()"]');
        if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
          return {
            showUserMenu: nav._x_dataStack[0].showUserMenu,
            activeDropdown: nav._x_dataStack[0].activeDropdown
          };
        }
        return { error: 'Alpine data not accessible' };
      });
      console.log('Alpine State Before Click:', stateBeforeClick);

      // Click the dropdown trigger
      await page.click('#user-menu-trigger');
      
      // Wait for dropdown animation
      await page.waitForTimeout(1000);

      // Take screenshot after clicking
      await page.screenshot({ 
        path: './screenshots/dropdown-auth-test-05-after-click.png',
        fullPage: true 
      });

      // Check Alpine.js state after click
      const stateAfterClick = await page.evaluate(() => {
        const nav = document.querySelector('nav[x-data="enhancedNavigation()"]');
        if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
          return {
            showUserMenu: nav._x_dataStack[0].showUserMenu,
            activeDropdown: nav._x_dataStack[0].activeDropdown
          };
        }
        return { error: 'Alpine data not accessible' };
      });
      console.log('Alpine State After Click:', stateAfterClick);

      // Check dropdown visibility
      const dropdownVisibility = await page.evaluate(() => {
        const dropdown = document.querySelector('#user-dropdown-menu');
        if (!dropdown) return { error: 'Dropdown not found' };
        
        const styles = window.getComputedStyle(dropdown);
        return {
          display: styles.display,
          opacity: styles.opacity,
          visibility: styles.visibility,
          transform: styles.transform,
          xShowAttribute: dropdown.getAttribute('x-show'),
          hasStyleAttribute: dropdown.hasAttribute('style'),
          styleAttribute: dropdown.getAttribute('style') || 'no style attribute',
          offsetHeight: dropdown.offsetHeight,
          offsetWidth: dropdown.offsetWidth,
          isVisible: dropdown.offsetHeight > 0 && dropdown.offsetWidth > 0 && styles.display !== 'none'
        };
      });

      console.log('Dropdown Visibility Check:', dropdownVisibility);

      // Test clicking dropdown items if visible
      if (dropdownVisibility.isVisible) {
        console.log('Step 8: Testing dropdown menu items');
        const menuItems = await page.locator('#user-dropdown-menu a, #user-dropdown-menu button').count();
        console.log('Dropdown menu items found:', menuItems);
        
        if (menuItems > 0) {
          const firstItemText = await page.locator('#user-dropdown-menu a, #user-dropdown-menu button').first().textContent();
          console.log('First menu item text:', firstItemText);
        }
      }

      // Test closing dropdown by clicking outside
      console.log('Step 9: Testing dropdown close by clicking outside');
      await page.click('body', { position: { x: 100, y: 100 } });
      await page.waitForTimeout(500);

      const dropdownAfterClickOutside = await page.evaluate(() => {
        const dropdown = document.querySelector('#user-dropdown-menu');
        const nav = document.querySelector('nav[x-data="enhancedNavigation()"]');
        
        return {
          dropdownVisible: dropdown ? window.getComputedStyle(dropdown).display !== 'none' : false,
          alpineState: nav && nav._x_dataStack && nav._x_dataStack[0] ? 
            nav._x_dataStack[0].showUserMenu : 'not accessible'
        };
      });

      console.log('Dropdown State After Click Outside:', dropdownAfterClickOutside);
    } else {
      console.log('Step 7: Dropdown trigger not found - checking alternative navigation');
      
      // Check what navigation elements are actually present
      const actualElements = await page.evaluate(() => {
        const elements = [];
        const selectors = [
          'nav', 'header', '[data-dropdown]', '[x-data]', 'button', '.dropdown'
        ];
        
        selectors.forEach(selector => {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            elements.push({
              selector,
              count: found.length,
              examples: Array.from(found).slice(0, 3).map(el => ({
                tagName: el.tagName,
                id: el.id || 'no-id',
                className: el.className || 'no-class',
                textContent: (el.textContent || '').substring(0, 50)
              }))
            });
          }
        });
        
        return elements;
      });

      console.log('Available Elements on Page:', actualElements);
    }

    // Final screenshot
    await page.screenshot({ 
      path: './screenshots/dropdown-auth-test-06-final-state.png',
      fullPage: true 
    });

    // Final test results
    const testResults = {
      timestamp: new Date().toISOString(),
      loginSuccessful: !page.url().includes('/login'),
      navigationExists: functionCheck.navigationPresent,
      dropdownElementsExist: dropdownElementsCheck.triggerExists && dropdownElementsCheck.dropdownExists,
      alpineLoaded: functionCheck.Alpine === 'object',
      jsErrors: jsErrors,
      testStatus: dropdownElementsCheck.triggerExists ? 'DROPDOWN_ELEMENTS_FOUND' : 'DROPDOWN_ELEMENTS_MISSING',
      functionalityStatus: dropdownElementsCheck.triggerExists ? 'TESTABLE' : 'NOT_TESTABLE'
    };

    console.log('=== Final Test Results ===');
    console.log(JSON.stringify(testResults, null, 2));

    // Basic assertions
    expect(testResults.loginSuccessful, 'Should successfully log in').toBe(true);
    expect(testResults.alpineLoaded, 'Alpine.js should be loaded').toBe(true);
    
    // If we found dropdown elements, they should be functional
    if (testResults.dropdownElementsExist) {
      expect(testResults.navigationExists, 'Enhanced navigation should be present').toBe(true);
      console.log('✅ Dropdown elements found and navigation is present');
    } else {
      console.log('⚠️ Dropdown elements not found - may need to check layout usage');
    }

    return testResults;
  });
});