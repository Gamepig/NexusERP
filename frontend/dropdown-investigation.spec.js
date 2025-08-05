import { test, expect } from '@playwright/test';

test.describe('Dropdown Investigation', () => {
  test('should investigate page structure and find dropdown elements', async ({ page }) => {
    console.log('Starting dropdown investigation...');
    
    // Navigate to homepage
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: './screenshots/dropdown-investigation-01-initial.png',
      fullPage: true 
    });

    console.log('Current URL:', page.url());

    // Check if this is a login page
    const isLoginPage = await page.locator('input[name="email"]').isVisible().catch(() => false);
    console.log('Is login page:', isLoginPage);

    if (isLoginPage) {
      console.log('Performing login...');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ 
        path: './screenshots/dropdown-investigation-02-after-login.png',
        fullPage: true 
      });
      
      console.log('URL after login:', page.url());
    }

    // Search for all possible dropdown/menu related elements
    const elementSearch = await page.evaluate(() => {
      const selectors = [
        '#user-menu-trigger',
        '#user-dropdown-menu',
        '[data-dropdown]',
        '[x-data*="dropdown"]',
        '[x-data*="menu"]',
        '.dropdown',
        '.user-menu',
        '.nav-user',
        'button[aria-haspopup]',
        '[role="button"]',
        'nav button',
        'header button'
      ];

      const results = {};
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        results[selector] = {
          count: elements.length,
          elements: Array.from(elements).map(el => ({
            tagName: el.tagName,
            id: el.id || 'no-id',
            classes: el.className || 'no-classes',
            text: el.textContent?.trim().substring(0, 50) || 'no-text',
            attributes: Object.fromEntries(Array.from(el.attributes).map(attr => [attr.name, attr.value]))
          }))
        };
      });

      // Also search for any elements containing "user" or "dropdown" or "menu"
      const allElements = document.querySelectorAll('*');
      const userElements = [];
      
      Array.from(allElements).forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        const id = el.id?.toLowerCase() || '';
        const classes = el.className?.toLowerCase() || '';
        
        if ((text.includes('user') || id.includes('user') || classes.includes('user') ||
             text.includes('dropdown') || id.includes('dropdown') || classes.includes('dropdown') ||
             text.includes('menu') || id.includes('menu') || classes.includes('menu')) &&
             el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
          userElements.push({
            tagName: el.tagName,
            id: el.id || 'no-id',
            classes: el.className || 'no-classes',
            text: text.substring(0, 100),
            outerHTML: el.outerHTML.substring(0, 200)
          });
        }
      });

      results['user_related_elements'] = userElements.slice(0, 10); // Limit to first 10

      return results;
    });

    console.log('Element Search Results:');
    console.log(JSON.stringify(elementSearch, null, 2));

    // Check for Alpine.js and any navigation structures
    const alpineAndNavCheck = await page.evaluate(() => {
      return {
        alpineExists: typeof window.Alpine !== 'undefined',
        alpineVersion: window.Alpine?.version || 'not found',
        navigationElements: {
          nav: document.querySelectorAll('nav').length,
          header: document.querySelectorAll('header').length,
          topbar: document.querySelectorAll('.topbar, .top-bar, #topbar').length,
          navbar: document.querySelectorAll('.navbar, .nav-bar, #navbar').length
        },
        possibleUserAreas: {
          userInfo: document.querySelectorAll('.user-info, #user-info').length,
          userProfile: document.querySelectorAll('.user-profile, #user-profile').length,
          authUser: document.querySelectorAll('.auth-user, #auth-user').length
        }
      };
    });

    console.log('Alpine and Navigation Check:');
    console.log(JSON.stringify(alpineAndNavCheck, null, 2));

    // Get page source for further analysis
    const pageContent = await page.content();
    const hasUserDropdown = pageContent.includes('user-dropdown') || 
                           pageContent.includes('user-menu') ||
                           pageContent.includes('dropdown-menu');
    
    console.log('Page contains user dropdown references:', hasUserDropdown);

    // Take final investigation screenshot
    await page.screenshot({ 
      path: './screenshots/dropdown-investigation-03-final.png',
      fullPage: true 
    });

    // Test passes regardless - this is just investigation
    expect(true).toBe(true);
  });
});