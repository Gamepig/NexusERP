import { test, expect } from '@playwright/test';

test.describe('Final User Dropdown Fix Test', () => {
  test('Test user dropdown after cache clear', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    console.log('1. Navigating to homepage after cache clear...');
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });
    
    // Take initial screenshot
    await page.screenshot({ path: 'dropdown-fix-01-initial.png', fullPage: true });

    console.log('2. Checking if user is logged in...');
    const loginButton = await page.locator('text=登入').first();
    if (await loginButton.isVisible()) {
      console.log('User not logged in, performing login...');
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    // Take screenshot after login
    await page.screenshot({ path: 'dropdown-fix-02-after-login.png', fullPage: true });

    console.log('3. Checking which navigation component is loaded...');
    
    // Check for enhanced navigation elements
    const enhancedNavTrigger = await page.locator('#user-menu-trigger').first();
    const enhancedNavButton = await page.locator('button[aria-expanded]').first();
    
    // Check for standard navigation elements
    const standardDropdown = await page.locator('x-dropdown').first();
    
    // Check Alpine.js initialization on body
    const alpineCheck = await page.evaluate(() => {
      return {
        alpineLoaded: typeof window.Alpine !== 'undefined',
        bodyHasAlpine: document.body.hasAttribute('x-data'),
        enhancedNavExists: !!document.querySelector('[x-data*="enhancedNavigation"]'),
        dropdownExists: !!document.querySelector('[x-data*="{ open: false }"]')
      };
    });
    
    console.log('Alpine and navigation check:', alpineCheck);

    // Look for any navigation container with Alpine data
    const navContainers = await page.evaluate(() => {
      const containers = document.querySelectorAll('nav[x-data], [x-data*="enhancedNavigation"]');
      return Array.from(containers).map(container => ({
        tagName: container.tagName,
        xData: container.getAttribute('x-data'),
        id: container.id,
        className: container.className
      }));
    });
    
    console.log('Navigation containers found:', navContainers);

    if (navContainers.length === 0) {
      console.log('❌ No Alpine navigation containers found!');
      
      // Check if enhanced navigation component exists in DOM
      const hasEnhancedNav = await page.locator('[x-data*="enhancedNavigation"]').count();
      const hasStandardNav = await page.locator('nav[x-data*="{ open: false }"]').count();
      
      console.log('Enhanced navigation elements:', hasEnhancedNav);
      console.log('Standard navigation elements:', hasStandardNav);
      
      // Get the actual HTML structure
      const navHTML = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        return nav ? nav.outerHTML.substring(0, 500) : 'No nav found';
      });
      
      console.log('Actual navigation HTML:', navHTML);
      return;
    }

    console.log('4. Testing dropdown functionality...');
    
    // Try different selectors for the user menu trigger
    const possibleTriggers = [
      '#user-menu-trigger',
      'button[aria-expanded]',
      '.nexus-user-trigger',
      'button:has-text("test@example.com")',
      '[data-user-menu-trigger]'
    ];

    let workingTrigger = null;

    for (const selector of possibleTriggers) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0 && await element.isVisible()) {
        workingTrigger = element;
        console.log(`✅ Found working trigger: ${selector}`);
        break;
      }
    }

    if (!workingTrigger) {
      console.log('❌ No working trigger found!');
      await page.screenshot({ path: 'dropdown-fix-03-no-trigger.png', fullPage: true });
      return;
    }

    // Check Alpine data on the trigger
    const triggerAlpineData = await workingTrigger.evaluate((el) => {
      // Walk up the DOM tree to find Alpine context
      let current = el;
      while (current && current !== document.body) {
        if (current._x_dataStack && current._x_dataStack.length > 0) {
          const data = current._x_dataStack[0];
          return {
            found: true,
            keys: Object.keys(data),
            showUserMenu: data.showUserMenu,
            open: data.open,
            element: current.tagName + (current.id ? '#' + current.id : '') + (current.className ? '.' + current.className.split(' ').join('.') : '')
          };
        }
        current = current.parentElement;
      }
      return { found: false };
    });

    console.log('Alpine data on trigger:', triggerAlpineData);

    // Take screenshot before click
    await page.screenshot({ path: 'dropdown-fix-04-before-click.png', fullPage: true });

    // Try clicking the trigger
    console.log('5. Clicking the user menu trigger...');
    await workingTrigger.click();
    await page.waitForTimeout(500);

    // Take screenshot after click
    await page.screenshot({ path: 'dropdown-fix-05-after-click.png', fullPage: true });

    // Check if dropdown is visible after click
    const dropdownVisible = await page.evaluate(() => {
      const dropdowns = [
        '#user-dropdown-menu',
        '[x-show="showUserMenu"]',
        '[x-show="open"]',
        '.dropdown-menu',
        '[role="menu"]'
      ];
      
      for (const selector of dropdowns) {
        const el = document.querySelector(selector);
        if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
          return {
            found: true,
            selector: selector,
            display: getComputedStyle(el).display,
            visibility: getComputedStyle(el).visibility,
            opacity: getComputedStyle(el).opacity
          };
        }
      }
      return { found: false };
    });

    console.log('Dropdown visibility after click:', dropdownVisible);

    // Get updated Alpine data after click
    const updatedAlpineData = await workingTrigger.evaluate((el) => {
      let current = el;
      while (current && current !== document.body) {
        if (current._x_dataStack && current._x_dataStack.length > 0) {
          const data = current._x_dataStack[0];
          return {
            showUserMenu: data.showUserMenu,
            open: data.open,
            allKeys: Object.keys(data)
          };
        }
        current = current.parentElement;
      }
      return { error: 'No Alpine data found' };
    });

    console.log('Updated Alpine data after click:', updatedAlpineData);

    // Take final screenshot
    await page.screenshot({ path: 'dropdown-fix-06-final.png', fullPage: true });

    console.log('6. Test Summary:');
    console.log('- Alpine.js loaded:', alpineCheck.alpineLoaded);
    console.log('- Enhanced navigation exists:', alpineCheck.enhancedNavExists);
    console.log('- Working trigger found:', !!workingTrigger);
    console.log('- Alpine data accessible:', triggerAlpineData.found);
    console.log('- Dropdown visible after click:', dropdownVisible.found);
    console.log('- Test result:', dropdownVisible.found ? '✅ SUCCESS' : '❌ FAILED');
  });
});