import { test, expect } from '@playwright/test';

test.describe('User Dropdown Menu Diagnosis', () => {
  test('Comprehensive dropdown diagnosis', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    console.log('1. Navigating to homepage...');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'user-dropdown-01-initial.png', fullPage: true });

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
    await page.screenshot({ path: 'user-dropdown-02-after-login.png', fullPage: true });

    console.log('3. Analyzing DOM structure for user dropdown...');
    
    // Check if Alpine.js is loaded
    const alpineLoaded = await page.evaluate(() => {
      return typeof window.Alpine !== 'undefined';
    });
    console.log('Alpine.js loaded:', alpineLoaded);

    // Find user dropdown elements
    const dropdownTrigger = await page.locator('[data-dropdown-trigger]').first();
    const dropdownButton = await page.locator('button:has-text("test@example.com")').first();
    const userMenuButton = await page.locator('#user-menu-button').first();
    
    // Check multiple possible selectors
    const possibleTriggers = [
      '[data-dropdown-trigger]',
      'button:has-text("test@example.com")',
      '#user-menu-button',
      '[x-data*="dropdown"]',
      '.user-dropdown-trigger',
      'button[aria-expanded]'
    ];

    let foundTrigger = null;
    let triggerSelector = null;

    for (const selector of possibleTriggers) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        foundTrigger = element;
        triggerSelector = selector;
        console.log(`Found trigger with selector: ${selector}`);
        break;
      }
    }

    if (!foundTrigger) {
      console.log('❌ No dropdown trigger found! Checking HTML structure...');
      
      // Get the navigation HTML structure
      const navHTML = await page.evaluate(() => {
        const nav = document.querySelector('nav') || document.querySelector('header');
        return nav ? nav.outerHTML : 'No navigation found';
      });
      
      console.log('Navigation HTML structure:', navHTML.substring(0, 1000));
      return;
    }

    console.log(`4. Found dropdown trigger: ${triggerSelector}`);

    // Get element properties
    const elementInfo = await foundTrigger.evaluate((el) => ({
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      dataset: {...el.dataset},
      attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`),
      innerHTML: el.innerHTML.substring(0, 200),
      offsetWidth: el.offsetWidth,
      offsetHeight: el.offsetHeight,
      style: {
        display: getComputedStyle(el).display,
        visibility: getComputedStyle(el).visibility,
        opacity: getComputedStyle(el).opacity
      }
    }));

    console.log('Dropdown trigger element info:', elementInfo);

    // Check for Alpine.js data
    const alpineData = await foundTrigger.evaluate((el) => {
      const alpineObj = el._x_dataStack?.[0] || el.__x?.$data || {};
      return {
        hasAlpineData: Object.keys(alpineObj).length > 0,
        alpineKeys: Object.keys(alpineObj),
        dropdownOpen: alpineObj.open || alpineObj.dropdownOpen || alpineObj.isOpen || false
      };
    });

    console.log('Alpine.js data:', alpineData);

    // Look for dropdown menu
    const dropdownMenuSelectors = [
      '[x-show]',
      '.dropdown-menu',
      '[data-dropdown-menu]',
      '#user-menu',
      '.user-dropdown-menu'
    ];

    let dropdownMenu = null;
    let menuSelector = null;

    for (const selector of dropdownMenuSelectors) {
      const menu = await page.locator(selector).first();
      if (await menu.count() > 0) {
        dropdownMenu = menu;
        menuSelector = selector;
        console.log(`Found dropdown menu with selector: ${selector}`);
        break;
      }
    }

    if (dropdownMenu) {
      const menuInfo = await dropdownMenu.evaluate((el) => ({
        isVisible: el.offsetWidth > 0 && el.offsetHeight > 0,
        display: getComputedStyle(el).display,
        visibility: getComputedStyle(el).visibility,
        opacity: getComputedStyle(el).opacity,
        zIndex: getComputedStyle(el).zIndex,
        position: getComputedStyle(el).position,
        xShowValue: el.getAttribute('x-show'),
        className: el.className
      }));
      
      console.log('Dropdown menu info:', menuInfo);
    }

    console.log('5. Testing click behavior...');
    
    // Take screenshot before click
    await page.screenshot({ path: 'user-dropdown-03-before-click.png', fullPage: true });

    // Try clicking the trigger
    try {
      await foundTrigger.click();
      await page.waitForTimeout(500); // Wait for dropdown animation
      
      // Take screenshot after click
      await page.screenshot({ path: 'user-dropdown-04-after-click.png', fullPage: true });

      // Check if dropdown is now visible
      if (dropdownMenu) {
        const isVisibleAfterClick = await dropdownMenu.isVisible();
        console.log('Dropdown visible after click:', isVisibleAfterClick);
        
        // Get updated Alpine data
        const updatedAlpineData = await foundTrigger.evaluate((el) => {
          const alpineObj = el._x_dataStack?.[0] || el.__x?.$data || {};
          return {
            dropdownOpen: alpineObj.open || alpineObj.dropdownOpen || alpineObj.isOpen || false,
            allData: alpineObj
          };
        });
        
        console.log('Updated Alpine data after click:', updatedAlpineData);
      }

    } catch (error) {
      console.log('❌ Click failed:', error.message);
    }

    console.log('6. Testing manual Alpine.js methods...');
    
    // Try to manually trigger Alpine.js
    const manualTriggerResult = await page.evaluate(() => {
      // Find element with Alpine data
      const elements = document.querySelectorAll('[x-data]');
      let targetElement = null;
      
      for (const el of elements) {
        const data = el._x_dataStack?.[0] || el.__x?.$data || {};
        if ('open' in data || 'dropdownOpen' in data || 'isOpen' in data) {
          targetElement = el;
          break;
        }
      }
      
      if (targetElement) {
        const data = targetElement._x_dataStack?.[0] || targetElement.__x?.$data || {};
        
        // Try to manually set open state
        if ('open' in data) {
          data.open = true;
          return { success: true, method: 'open = true' };
        } else if ('dropdownOpen' in data) {
          data.dropdownOpen = true;
          return { success: true, method: 'dropdownOpen = true' };
        } else if ('isOpen' in data) {
          data.isOpen = true;
          return { success: true, method: 'isOpen = true' };
        }
      }
      
      return { success: false, reason: 'No Alpine element with dropdown state found' };
    });

    console.log('Manual trigger result:', manualTriggerResult);

    // Take final screenshot
    await page.screenshot({ path: 'user-dropdown-05-final-state.png', fullPage: true });

    console.log('7. Checking JavaScript errors and event listeners...');
    
    // Check for JavaScript errors
    const jsErrors = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      console.error = function(...args) {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      return errors;
    });

    console.log('JavaScript errors found:', jsErrors);

    // Check event listeners
    const eventListeners = await foundTrigger.evaluate((el) => {
      const listeners = [];
      const events = ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'];
      
      events.forEach(event => {
        const hasListener = el.onclick || 
                           el.addEventListener || 
                           (el.getAttribute && el.getAttribute(`on${event}`));
        if (hasListener) {
          listeners.push(event);
        }
      });
      
      return listeners;
    });

    console.log('Event listeners found:', eventListeners);

    console.log('8. Summary of findings:');
    console.log('- Alpine.js loaded:', alpineLoaded);
    console.log('- Trigger element found:', !!foundTrigger);
    console.log('- Trigger selector:', triggerSelector);
    console.log('- Dropdown menu found:', !!dropdownMenu);
    console.log('- Menu selector:', menuSelector);
    console.log('- Alpine data present:', alpineData.hasAlpineData);
    console.log('- Manual trigger worked:', manualTriggerResult.success);
  });
});