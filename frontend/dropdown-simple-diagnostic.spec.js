import { test, expect } from '@playwright/test';

test.describe('Simple Dropdown Diagnostic', () => {
  test('Quick dropdown analysis', async ({ page }) => {
    // Enable logging
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    console.log('1. Navigating and logging in...');
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });

    // Login
    const loginButton = await page.locator('text=登入').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    await page.screenshot({ path: 'dropdown-diagnostic-01.png', fullPage: true });

    console.log('2. Looking for user dropdown trigger...');
    
    // Find user menu trigger
    const triggerResult = await page.evaluate(() => {
      // Look for text containing user email
      const emailElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.includes('test@example.com')
      );
      
      const triggers = emailElements.map(el => {
        // Walk up to find clickable parent
        let current = el;
        while (current && current !== document.body) {
          if (current.tagName === 'BUTTON' || current.getAttribute('x-on:click') || current.getAttribute('@click')) {
            return {
              element: current.tagName + (current.id ? '#' + current.id : '') + (current.className ? '.' + current.className.split(' ').slice(0, 2).join('.') : ''),
              textContent: current.textContent?.trim().substring(0, 100),
              hasClick: !!(current.getAttribute('x-on:click') || current.getAttribute('@click')),
              clickHandler: current.getAttribute('x-on:click') || current.getAttribute('@click'),
              xData: current.getAttribute('x-data')
            };
          }
          current = current.parentElement;
        }
        return null;
      }).filter(Boolean);

      return {
        emailElementsCount: emailElements.length,
        triggers: triggers,
        alpineLoaded: typeof window.Alpine !== 'undefined'
      };
    });

    console.log('Trigger analysis:', JSON.stringify(triggerResult, null, 2));

    console.log('3. Looking for dropdown menu...');
    
    const dropdownResult = await page.evaluate(() => {
      const dropdownSelectors = [
        '[x-show*="showUserMenu"]',
        '[x-show*="open"]',
        '[role="menu"]',
        '.dropdown-menu',
        '#user-dropdown-menu'
      ];

      const dropdowns = [];
      
      dropdownSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            dropdowns.push({
              selector: selector,
              element: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''),
              xShow: el.getAttribute('x-show'),
              visible: el.offsetWidth > 0 && el.offsetHeight > 0,
              display: getComputedStyle(el).display,
              opacity: getComputedStyle(el).opacity,
              innerHTML: el.innerHTML?.substring(0, 200) + '...'
            });
          });
        } catch (e) {
          console.log(`Error with selector ${selector}:`, e.message);
        }
      });

      return dropdowns;
    });

    console.log('Dropdown analysis:', JSON.stringify(dropdownResult, null, 2));

    console.log('4. Checking Alpine state...');
    
    const alpineState = await page.evaluate(() => {
      const results = [];
      
      // Find elements with Alpine data
      const walkDOM = (element) => {
        if (element._x_dataStack && element._x_dataStack.length > 0) {
          const data = element._x_dataStack[0];
          const keys = Object.keys(data);
          
          if (keys.some(key => key.includes('show') || key.includes('user') || key.includes('menu'))) {
            results.push({
              element: element.tagName + (element.id ? '#' + element.id : ''),
              relevantKeys: keys.filter(key => key.includes('show') || key.includes('user') || key.includes('menu')),
              showUserMenu: data.showUserMenu,
              open: data.open
            });
          }
        }

        for (let child of element.children || []) {
          try {
            walkDOM(child);
          } catch (e) {
            // Skip problematic elements
          }
        }
      };

      try {
        walkDOM(document.body);
      } catch (e) {
        console.log('Error walking DOM:', e.message);
      }

      return results;
    });

    console.log('Alpine state:', JSON.stringify(alpineState, null, 2));

    console.log('5. Testing trigger click...');
    
    if (triggerResult.triggers.length > 0) {
      const trigger = triggerResult.triggers[0];
      console.log(`Clicking trigger: ${trigger.element}`);
      
      // Try to click the trigger
      try {
        // Find clickable element by text content
        const clickableElement = await page.locator('text=test@example.com').first();
        if (await clickableElement.isVisible()) {
          await clickableElement.click();
          await page.waitForTimeout(500);
          
          await page.screenshot({ path: 'dropdown-diagnostic-02-after-click.png', fullPage: true });

          // Check if any dropdown became visible
          const postClickDropdowns = await page.evaluate(() => {
            const selectors = ['[x-show*="showUserMenu"]', '[x-show*="open"]', '[role="menu"]'];
            const visible = [];
            
            selectors.forEach(selector => {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                  visible.push({
                    selector: selector,
                    visible: true,
                    display: getComputedStyle(el).display
                  });
                }
              });
            });
            
            return visible;
          });

          console.log('Post-click visible dropdowns:', JSON.stringify(postClickDropdowns, null, 2));
          console.log(`Result: ${postClickDropdowns.length > 0 ? '✅ SUCCESS - Dropdown visible' : '❌ FAILED - No dropdown visible'}`);
        }
      } catch (e) {
        console.log('Click test error:', e.message);
      }
    } else {
      console.log('❌ No triggers found to test');
    }

    console.log('6. Checking for JavaScript errors...');
    
    const jsErrors = await page.evaluate(() => {
      // Check for missing functions that cause errors
      const errors = [];
      
      if (typeof getNavItemClasses === 'undefined') {
        errors.push('getNavItemClasses function is missing');
      }
      
      if (typeof getSubItemClasses === 'undefined') {
        errors.push('getSubItemClasses function is missing');
      }
      
      if (typeof enhancedNavigation === 'undefined') {
        errors.push('enhancedNavigation function may be missing');
      }

      return errors;
    });

    console.log('JavaScript errors:', jsErrors);

    await page.screenshot({ path: 'dropdown-diagnostic-03-final.png', fullPage: true });

    console.log('=== DIAGNOSTIC SUMMARY ===');
    console.log(`Alpine.js loaded: ${triggerResult.alpineLoaded}`);
    console.log(`Email triggers found: ${triggerResult.triggers.length}`);
    console.log(`Dropdown elements found: ${dropdownResult.length}`);
    console.log(`Alpine state elements: ${alpineState.length}`);
    console.log(`JavaScript errors: ${jsErrors.length}`);
    
    if (jsErrors.length > 0) {
      console.log('⚠️  MAIN ISSUE: Missing JavaScript functions causing Alpine errors');
      jsErrors.forEach(error => console.log(`   - ${error}`));
    }
  });
});