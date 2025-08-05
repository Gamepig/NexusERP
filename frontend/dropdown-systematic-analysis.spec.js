import { test, expect } from '@playwright/test';

test.describe('Systematic Dropdown Analysis', () => {
  test('Analyze dropdown functionality step by step', async ({ page }) => {
    // Enable comprehensive logging
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    console.log('=== STEP 1: Navigate and Login ===');
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'dropdown-analysis-01-initial.png', fullPage: true });

    // Login if needed
    const loginButton = await page.locator('text=登入').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    await page.screenshot({ path: 'dropdown-analysis-02-after-login.png', fullPage: true });

    console.log('=== STEP 2: HTML Structure Analysis ===');
    
    // Get the complete navigation HTML structure
    const navStructure = await page.evaluate(() => {
      const navElements = document.querySelectorAll('nav');
      return Array.from(navElements).map((nav, index) => ({
        index,
        id: nav.id,
        className: nav.className,
        xData: nav.getAttribute('x-data'),
        innerHTML: nav.innerHTML.substring(0, 2000) + '...',
        hasUserDropdown: nav.innerHTML.includes('user') || nav.innerHTML.includes('User') || nav.innerHTML.includes('test@example.com'),
        children: Array.from(nav.children).map(child => ({
          tagName: child.tagName,
          className: child.className,
          id: child.id,
          hasXData: child.hasAttribute('x-data')
        }))
      }));
    });

    console.log('Navigation structure:', JSON.stringify(navStructure, null, 2));

    console.log('=== STEP 3: Alpine.js Context Analysis ===');
    
    const alpineAnalysis = await page.evaluate(() => {
      const results = {
        alpineLoaded: typeof window.Alpine !== 'undefined',
        alpineVersion: window.Alpine ? window.Alpine.version : null,
        enhancedNavCount: document.querySelectorAll('[x-data*="enhancedNavigation"]').length,
        userMenuElements: [],
        dropdownElements: []
      };

      // Find all elements with Alpine context that might be user menu related
      const walkDOM = (element) => {
        if (element._x_dataStack && element._x_dataStack.length > 0) {
          const data = element._x_dataStack[0];
          const keys = Object.keys(data);
          
          if (keys.some(key => key.includes('user') || key.includes('User') || key.includes('show') || key.includes('open'))) {
            results.userMenuElements.push({
              element: element.tagName + (element.id ? '#' + element.id : '') + (element.className ? '.' + element.className.split(' ').slice(0, 3).join('.') : ''),
              dataKeys: keys,
              hasShowUserMenu: 'showUserMenu' in data,
              showUserMenuValue: data.showUserMenu,
              hasOpen: 'open' in data,
              openValue: data.open,
              hasUserMenuState: 'userMenuState' in data,
              userFunctions: keys.filter(key => typeof data[key] === 'function' && key.includes('user'))
            });
          }
        }

        // Check for dropdown-related elements
        if (element.getAttribute && (
          element.getAttribute('x-show') || 
          element.getAttribute('role') === 'menu' ||
          element.className.includes('dropdown') ||
          element.id.includes('dropdown') ||
          element.id.includes('menu')
        )) {
          results.dropdownElements.push({
            element: element.tagName + (element.id ? '#' + element.id : '') + (element.className ? '.' + element.className.split(' ').slice(0, 3).join('.') : ''),
            xShow: element.getAttribute('x-show'),
            role: element.getAttribute('role'),
            visible: element.offsetWidth > 0 && element.offsetHeight > 0,
            computedDisplay: getComputedStyle(element).display,
            computedVisibility: getComputedStyle(element).visibility,
            computedOpacity: getComputedStyle(element).opacity
          });
        }

        for (let child of element.children) {
          walkDOM(child);
        }
      };

      walkDOM(document.body);
      return results;
    });

    console.log('Alpine analysis:', JSON.stringify(alpineAnalysis, null, 2));

    console.log('=== STEP 4: JavaScript Function Analysis ===');
    
    const jsAnalysis = await page.evaluate(() => {
      const results = {
        globalFunctions: [],
        enhancedNavigationExists: false,
        getNavItemClassesExists: false,
        getSubItemClassesExists: false
      };

      // Check for global navigation functions
      if (typeof window.enhancedNavigation === 'function') {
        results.enhancedNavigationExists = true;
      }

      if (typeof window.getNavItemClasses === 'function') {
        results.getNavItemClassesExists = true;
      }

      if (typeof window.getSubItemClasses === 'function') {
        results.getSubItemClassesExists = true;
      }

      // Look for any navigation-related functions in global scope
      for (let prop in window) {
        if (typeof window[prop] === 'function' && (
          prop.includes('nav') || 
          prop.includes('Nav') || 
          prop.includes('menu') || 
          prop.includes('dropdown') ||
          prop.includes('user')
        )) {
          results.globalFunctions.push(prop);
        }
      }

      return results;
    });

    console.log('JavaScript analysis:', JSON.stringify(jsAnalysis, null, 2));

    console.log('=== STEP 5: User Menu Trigger Analysis ===');
    
    // Test different potential user menu triggers
    const triggerSelectors = [
      '#user-menu-trigger',
      'button[aria-expanded]',
      '.nexus-user-trigger',
      'button:has-text("test@example.com")',
      '[data-user-menu-trigger]',
      '.user-dropdown-trigger',
      '.user-menu-button',
      '[x-on\\:click*="showUserMenu"]',
      '[x-on\\:click*="userMenuState"]',
      '[x-on\\:click*="open"]'
    ];

    let foundTriggers = [];

    for (const selector of triggerSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (await element.isVisible()) {
            const triggerInfo = await element.evaluate((el, sel) => ({
              selector: sel,
              tagName: el.tagName,
              id: el.id,
              className: el.className,
              textContent: el.textContent?.trim().substring(0, 50),
              onClick: el.getAttribute('x-on:click') || el.getAttribute('@click'),
              ariaExpanded: el.getAttribute('aria-expanded'),
              hasAlpineContext: !!el._x_dataStack
            }), selector);
            foundTriggers.push(triggerInfo);
          }
        }
      } catch (e) {
        console.log(`Selector ${selector} failed:`, e.message);
      }
    }

    console.log('Found triggers:', JSON.stringify(foundTriggers, null, 2));

    console.log('=== STEP 6: Dropdown Menu Content Analysis ===');
    
    const dropdownContent = await page.evaluate(() => {
      const dropdownSelectors = [
        '#user-dropdown-menu',
        '[x-show="showUserMenu"]',
        '[x-show="open"]',
        '[x-show="userMenuState"]',
        '.dropdown-menu',
        '[role="menu"]',
        '.user-dropdown',
        '.nexus-user-dropdown'
      ];

      const results = [];

      dropdownSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el, index) => {
            results.push({
              selector: selector,
              index: index,
              tagName: el.tagName,
              id: el.id,
              className: el.className,
              xShow: el.getAttribute('x-show'),
              visible: el.offsetWidth > 0 && el.offsetHeight > 0,
              display: getComputedStyle(el).display,
              visibility: getComputedStyle(el).visibility,
              opacity: getComputedStyle(el).opacity,
              hasItems: el.children.length > 0,
              itemCount: el.children.length,
              innerHTML: el.innerHTML?.substring(0, 500)
            });
          });
        } catch (e) {
          console.log(`Dropdown selector ${selector} failed:`, e.message);
        }
      });

      return results;
    });

    console.log('Dropdown content analysis:', JSON.stringify(dropdownContent, null, 2));

    console.log('=== STEP 7: Click Test on Best Trigger ===');
    
    if (foundTriggers.length > 0) {
      // Use the first found trigger for testing
      const testTrigger = foundTriggers[0];
      console.log(`Testing trigger: ${testTrigger.selector}`);

      await page.screenshot({ path: 'dropdown-analysis-03-before-click.png', fullPage: true });

      try {
        await page.locator(testTrigger.selector).first().click();
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'dropdown-analysis-04-after-click.png', fullPage: true });

        // Check state after click
        const postClickState = await page.evaluate(() => {
          // Check Alpine state changes
          const alpineStates = [];
          const walkDOM = (element) => {
            if (element._x_dataStack && element._x_dataStack.length > 0) {
              const data = element._x_dataStack[0];
              if ('showUserMenu' in data || 'open' in data || 'userMenuState' in data) {
                alpineStates.push({
                  element: element.tagName + (element.id ? '#' + element.id : ''),
                  showUserMenu: data.showUserMenu,
                  open: data.open,
                  userMenuState: data.userMenuState
                });
              }
            }
            for (let child of element.children) {
              walkDOM(child);
            }
          };
          walkDOM(document.body);

          // Check dropdown visibility
          const visibleDropdowns = [];
          const dropdownSelectors = [
            '#user-dropdown-menu',
            '[x-show="showUserMenu"]',
            '[x-show="open"]',
            '[role="menu"]'
          ];

          dropdownSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                visibleDropdowns.push({
                  selector: selector,
                  visible: true,
                  display: getComputedStyle(el).display,
                  opacity: getComputedStyle(el).opacity
                });
              }
            });
          });

          return {
            alpineStates,
            visibleDropdowns,
            anyDropdownVisible: visibleDropdowns.length > 0
          };
        });

        console.log('Post-click state:', JSON.stringify(postClickState, null, 2));

      } catch (e) {
        console.log('Click test failed:', e.message);
      }
    } else {
      console.log('❌ No triggers found for testing');
    }

    await page.screenshot({ path: 'dropdown-analysis-05-final.png', fullPage: true });

    console.log('=== ANALYSIS SUMMARY ===');
    console.log(`Alpine.js loaded: ${alpineAnalysis.alpineLoaded}`);
    console.log(`Enhanced navigation elements: ${alpineAnalysis.enhancedNavCount}`);
    console.log(`User menu elements found: ${alpineAnalysis.userMenuElements.length}`);
    console.log(`Dropdown elements found: ${alpineAnalysis.dropdownElements.length}`);
    console.log(`Potential triggers found: ${foundTriggers.length}`);
    console.log(`Missing functions detected: ${!jsAnalysis.getNavItemClassesExists ? 'getNavItemClasses, ' : ''}${!jsAnalysis.getSubItemClassesExists ? 'getSubItemClasses' : ''}`);
  });
});