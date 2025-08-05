const { test, expect } = require('@playwright/test');

test.describe('User Dropdown Menu Debug - Comprehensive Analysis', () => {
  test('Debug dropdown issue on dashboard', async ({ page }) => {
    console.log('🔍 Starting comprehensive dropdown debugging...');
    
    // 1. Navigate to the exact same page
    console.log('📍 Step 1: Navigating to dashboard...');
    await page.goto('http://127.0.0.1:8000/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // 2. Take initial screenshot
    console.log('📸 Step 2: Taking initial screenshot...');
    await page.screenshot({ 
      path: 'dropdown-debug-01-initial-state.png',
      fullPage: true
    });

    // Check if we need to login
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
      console.log('🔐 Login required - proceeding with authentication...');
      
      // Fill login form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // Submit login
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      
      console.log('✅ Login successful, now on dashboard');
    }

    // Take screenshot after login
    await page.screenshot({ 
      path: 'dropdown-debug-02-after-login.png',
      fullPage: true
    });

    // 3. Inspect the navigation HTML structure
    console.log('🔍 Step 3: Inspecting navigation HTML structure...');
    
    // Look for user avatar/trigger element
    const avatarSelectors = [
      'button[aria-label*="user"]',
      'button[aria-label*="User"]', 
      '.user-avatar',
      '.user-menu-trigger',
      '[data-dropdown-toggle]',
      'button img[alt*="user"]',
      'button img[alt*="User"]',
      'button:has(img)',
      'nav button:last-child',
      'header button:last-child',
      '.navbar button:last-child'
    ];

    let avatarElement = null;
    let avatarSelector = null;

    for (const selector of avatarSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          avatarElement = element;
          avatarSelector = selector;
          console.log(`✅ Found potential avatar element with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Get the complete navigation structure
    const navHTML = await page.evaluate(() => {
      const nav = document.querySelector('nav') || document.querySelector('header') || document.querySelector('.navbar');
      return nav ? nav.outerHTML : 'No navigation found';
    });
    
    console.log('📋 Navigation HTML structure:');
    console.log(navHTML);

    // Look for dropdown menu elements
    const dropdownSelectors = [
      '.dropdown-menu',
      '.user-dropdown',
      '.user-menu',
      '[role="menu"]',
      '[aria-labelledby]',
      '.dropdown',
      '[data-dropdown]',
      '[x-show]'
    ];

    let dropdownElement = null;
    let dropdownSelector = null;

    for (const selector of dropdownSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          dropdownElement = element;
          dropdownSelector = selector;
          console.log(`✅ Found potential dropdown element with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Check for Alpine.js data attributes
    const alpineData = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const alpineButtons = buttons.filter(btn => 
        btn.hasAttribute('x-data') || 
        btn.hasAttribute('@click') ||
        btn.hasAttribute('x-on:click') ||
        btn.closest('[x-data]')
      );
      
      return alpineButtons.map(btn => ({
        innerHTML: btn.innerHTML,
        attributes: Array.from(btn.attributes).map(attr => `${attr.name}="${attr.value}"`),
        classes: btn.className,
        parentData: btn.closest('[x-data]')?.getAttribute('x-data') || null
      }));
    });

    console.log('🏔️ Alpine.js elements found:');
    console.log(JSON.stringify(alpineData, null, 2));

    // 4. Check Alpine.js state before click
    console.log('🏔️ Step 4: Checking Alpine.js state before click...');
    
    const alpineStateBefore = await page.evaluate(() => {
      if (window.Alpine && window.Alpine.store) {
        return {
          stores: Object.keys(window.Alpine.store),
          version: window.Alpine.version
        };
      }
      return { alpine: 'not found' };
    });
    
    console.log('Alpine.js state before click:', alpineStateBefore);

    // Check for x-data components
    const xDataComponents = await page.evaluate(() => {
      const components = Array.from(document.querySelectorAll('[x-data]'));
      return components.map(comp => ({
        tag: comp.tagName,
        xData: comp.getAttribute('x-data'),
        classes: comp.className,
        innerHTML: comp.innerHTML.substring(0, 200) + '...'
      }));
    });

    console.log('x-data components:', xDataComponents);

    // 5. Test clicking the user avatar
    console.log('🖱️ Step 5: Testing click on user avatar...');
    
    if (avatarElement && avatarSelector) {
      // Take screenshot before click
      await page.screenshot({ 
        path: 'dropdown-debug-03-before-click.png',
        fullPage: true
      });

      console.log(`Clicking on avatar element: ${avatarSelector}`);
      
      // Try different click methods
      try {
        // Method 1: Regular click
        await avatarElement.click();
        console.log('✅ Regular click executed');
      } catch (e) {
        console.log('❌ Regular click failed:', e.message);
        
        try {
          // Method 2: Force click
          await avatarElement.click({ force: true });
          console.log('✅ Force click executed');
        } catch (e2) {
          console.log('❌ Force click failed:', e2.message);
          
          try {
            // Method 3: JavaScript click
            await page.evaluate((selector) => {
              document.querySelector(selector).click();
            }, avatarSelector);
            console.log('✅ JavaScript click executed');
          } catch (e3) {
            console.log('❌ JavaScript click failed:', e3.message);
          }
        }
      }

      // Wait a bit for any animations/state changes
      await page.waitForTimeout(1000);

      // Take screenshot after click
      await page.screenshot({ 
        path: 'dropdown-debug-04-after-click.png',
        fullPage: true
      });

    } else {
      console.log('❌ No avatar element found to click');
      
      // Try to find ANY clickable button in navigation
      const navButtons = await page.$$('nav button, header button, .navbar button');
      console.log(`Found ${navButtons.length} buttons in navigation`);
      
      if (navButtons.length > 0) {
        console.log('Trying to click the last button in navigation...');
        const lastButton = navButtons[navButtons.length - 1];
        
        // Get button info
        const buttonInfo = await lastButton.evaluate(btn => ({
          innerHTML: btn.innerHTML,
          className: btn.className,
          attributes: Array.from(btn.attributes).map(attr => `${attr.name}="${attr.value}"`)
        }));
        
        console.log('Last button info:', buttonInfo);
        
        await lastButton.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: 'dropdown-debug-04-fallback-click.png',
          fullPage: true
        });
      }
    }

    // 6. Check Alpine.js state after click
    console.log('🏔️ Step 6: Checking Alpine.js state after click...');
    
    const alpineStateAfter = await page.evaluate(() => {
      if (window.Alpine) {
        // Check for any x-show elements
        const xShowElements = Array.from(document.querySelectorAll('[x-show]'));
        const showStates = xShowElements.map(el => ({
          element: el.tagName + '.' + el.className,
          xShow: el.getAttribute('x-show'),
          display: getComputedStyle(el).display,
          visibility: getComputedStyle(el).visibility,
          opacity: getComputedStyle(el).opacity
        }));

        return {
          version: window.Alpine.version || 'unknown',
          xShowElements: showStates,
          totalElements: xShowElements.length
        };
      }
      return { alpine: 'not found' };
    });
    
    console.log('Alpine.js state after click:', JSON.stringify(alpineStateAfter, null, 2));

    // 7. Check for JavaScript errors in console
    console.log('🐛 Step 7: Checking for JavaScript errors...');
    
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    // Re-trigger any events to capture errors
    if (avatarSelector) {
      await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          // Trigger various events
          element.dispatchEvent(new Event('click', { bubbles: true }));
          element.dispatchEvent(new Event('mousedown', { bubbles: true }));
          element.dispatchEvent(new Event('mouseup', { bubbles: true }));
        }
      }, avatarSelector);
    }

    await page.waitForTimeout(500);
    console.log('JavaScript errors found:', jsErrors);

    // 8. Examine CSS for dropdown visibility
    console.log('🎨 Step 8: Examining CSS for dropdown visibility...');
    
    const dropdownStyles = await page.evaluate(() => {
      const dropdowns = Array.from(document.querySelectorAll('.dropdown, .dropdown-menu, [x-show], .user-menu, .user-dropdown'));
      return dropdowns.map(el => {
        const styles = getComputedStyle(el);
        return {
          selector: el.tagName + '.' + el.className,
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          transform: styles.transform,
          position: styles.position,
          zIndex: styles.zIndex,
          top: styles.top,
          left: styles.left,
          maxHeight: styles.maxHeight,
          overflow: styles.overflow
        };
      });
    });

    console.log('Dropdown styles:', JSON.stringify(dropdownStyles, null, 2));

    // 9. Final comprehensive analysis
    console.log('📊 Step 9: Final comprehensive analysis...');
    
    const finalAnalysis = await page.evaluate(() => {
      // Look for theme button as reference
      const themeButton = document.querySelector('button:has-text("主題"), button[aria-label*="theme"], button[aria-label*="Theme"]');
      
      // Look for user-related elements
      const userElements = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.innerHTML.includes('img') || 
        btn.innerHTML.includes('avatar') ||
        btn.innerHTML.includes('user') ||
        btn.innerHTML.includes('User') ||
        btn.getAttribute('aria-label')?.includes('user') ||
        btn.getAttribute('aria-label')?.includes('User')
      );

      return {
        themeButtonFound: !!themeButton,
        themeButtonHTML: themeButton ? themeButton.outerHTML : null,
        userElementsCount: userElements.length,
        userElements: userElements.map(el => ({
          html: el.outerHTML,
          text: el.textContent,
          attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`)
        })),
        totalButtons: document.querySelectorAll('button').length,
        dropdownElements: Array.from(document.querySelectorAll('[x-show], .dropdown, .dropdown-menu')).length,
        alpineVersion: window.Alpine ? window.Alpine.version : 'not found'
      };
    });

    console.log('Final analysis:', JSON.stringify(finalAnalysis, null, 2));

    // Take final screenshot
    await page.screenshot({ 
      path: 'dropdown-debug-05-final-analysis.png',
      fullPage: true
    });

    // 10. Summary and recommendations
    console.log('📋 SUMMARY AND FINDINGS:');
    console.log('========================');
    console.log(`✅ Successfully navigated to: ${page.url()}`);
    console.log(`🔍 Avatar element found: ${!!avatarElement} (${avatarSelector})`);
    console.log(`📋 Dropdown element found: ${!!dropdownElement} (${dropdownSelector})`);
    console.log(`🏔️ Alpine.js detected: ${alpineStateBefore.alpine !== 'not found'}`);
    console.log(`🐛 JavaScript errors: ${jsErrors.length}`);
    console.log(`🎨 Dropdown styles examined: ${dropdownStyles.length} elements`);
    
    if (jsErrors.length > 0) {
      console.log('❌ JavaScript errors detected:');
      jsErrors.forEach(error => console.log(`   - ${error}`));
    }

    if (!avatarElement) {
      console.log('❌ ISSUE: User avatar/trigger element not found');
      console.log('💡 RECOMMENDATION: Check the navigation template and ensure proper user menu implementation');
    }

    if (!dropdownElement) {
      console.log('❌ ISSUE: Dropdown menu element not found in DOM');
      console.log('💡 RECOMMENDATION: Check if dropdown menu HTML is properly rendered');
    }

    if (alpineStateBefore.alpine === 'not found') {
      console.log('❌ ISSUE: Alpine.js not detected');
      console.log('💡 RECOMMENDATION: Ensure Alpine.js is properly loaded');
    }

    console.log('📸 Screenshots saved:');
    console.log('   - dropdown-debug-01-initial-state.png');
    console.log('   - dropdown-debug-02-after-login.png');  
    console.log('   - dropdown-debug-03-before-click.png');
    console.log('   - dropdown-debug-04-after-click.png');
    console.log('   - dropdown-debug-05-final-analysis.png');
  });
});