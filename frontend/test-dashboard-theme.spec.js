import { test, expect } from '@playwright/test';

test('Dashboard Theme Testing', async ({ page }) => {
  // Step 1: Navigate to homepage
  console.log('1. Navigating to http://127.0.0.1:8000');
  await page.goto('http://127.0.0.1:8000');
  await page.screenshot({ path: 'homepage.png', fullPage: true });
  
  // Step 2: Login with test credentials
  console.log('2. Logging in with test@example.com');
  
  // Check if we're already logged in by looking for logout button or redirect to dashboard
  try {
    await page.waitForSelector('[href="/dashboard"]', { timeout: 5000 });
    console.log('Already logged in, going directly to dashboard');
    await page.goto('http://127.0.0.1:8000/dashboard');
  } catch (e) {
    // Not logged in, need to login
    console.log('Not logged in, attempting login');
    
    // Look for login form or login link
    try {
      await page.click('a[href="/login"]', { timeout: 5000 });
    } catch (e2) {
      // Maybe already on login page or login form is visible
      console.log('Login link not found, checking for login form');
    }
    
    // Fill in login credentials
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    
    // Submit login form
    await page.click('button[type="submit"], input[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard*', { timeout: 10000 });
  }
  
  // Step 3: Take screenshot of current dashboard state
  console.log('3. Taking screenshot of dashboard');
  await page.screenshot({ path: 'dashboard-current.png', fullPage: true });
  
  // Step 4: Look for theme toggle functionality
  console.log('4. Looking for theme toggle');
  
  // Common theme toggle selectors
  const themeSelectors = [
    '#themeToggle',
    '.theme-toggle',
    '.theme-switch',
    '[data-theme-toggle]',
    'button:has-text("Light")',
    'button:has-text("Dark")',
    'button:has-text("Theme")',
    '.dropdown-toggle:has-text("Theme")',
    '.nav-item:has-text("Theme")'
  ];
  
  let themeToggleFound = false;
  let themeToggleSelector = null;
  
  for (const selector of themeSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 2000 });
      themeToggleFound = true;
      themeToggleSelector = selector;
      console.log(`Found theme toggle with selector: ${selector}`);
      break;
    } catch (e) {
      // Continue to next selector
    }
  }
  
  if (!themeToggleFound) {
    console.log('No theme toggle found with common selectors, checking page content');
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    
    // Look for any elements containing theme-related text
    try {
      const themeElements = await page.$$eval('*', (elements) => {
        const results = [];
        elements.forEach((el, index) => {
          const text = el.textContent?.toLowerCase() || '';
          const classes = el.className || '';
          const id = el.id || '';
          
          if (text.includes('theme') || text.includes('light') || text.includes('dark') || 
              classes.includes('theme') || id.includes('theme')) {
            results.push({
              tagName: el.tagName,
              text: el.textContent?.slice(0, 100),
              className: classes,
              id: id,
              index: index
            });
          }
        });
        return results.slice(0, 10); // Limit to first 10 matches
      });
      
      console.log('Found theme-related elements:', themeElements);
    } catch (e) {
      console.log('Error searching for theme elements:', e.message);
    }
  }
  
  // Step 5: Test theme switching if toggle is found
  if (themeToggleFound && themeToggleSelector) {
    console.log('5. Testing theme toggle functionality');
    
    // Click the theme toggle
    await page.click(themeToggleSelector);
    
    // Wait a moment for theme to change
    await page.waitForTimeout(1000);
    
    // Take screenshot after theme change
    await page.screenshot({ path: 'dashboard-after-theme-toggle.png', fullPage: true });
    
    // Check if theme actually changed by looking at body classes or CSS variables
    const bodyClasses = await page.getAttribute('body', 'class');
    const htmlClasses = await page.getAttribute('html', 'class');
    console.log('Body classes after toggle:', bodyClasses);
    console.log('HTML classes after toggle:', htmlClasses);
    
    // Try to find light theme elements
    try {
      await page.waitForSelector('.light-theme, [data-theme="light"], body.light', { timeout: 3000 });
      console.log('Light theme detected after toggle');
    } catch (e) {
      console.log('Light theme classes not found after toggle');
    }
  } else {
    console.log('5. No theme toggle found - taking final screenshot');
    await page.screenshot({ path: 'dashboard-no-theme-toggle.png', fullPage: true });
  }
  
  // Step 6: Inspect CSS and JavaScript for theme functionality
  console.log('6. Checking for theme-related CSS and JS');
  
  // Check loaded stylesheets for theme-related files
  const stylesheets = await page.$$eval('link[rel="stylesheet"]', links => 
    links.map(link => ({ href: link.href, id: link.id, className: link.className }))
  );
  console.log('Loaded stylesheets:', stylesheets);
  
  // Check for theme-related scripts
  const scripts = await page.$$eval('script[src]', scripts => 
    scripts.map(script => ({ src: script.src, id: script.id, className: script.className }))
  );
  console.log('Loaded scripts:', scripts);
  
  // Log final state
  console.log('Test completed. Screenshots saved:');
  console.log('- homepage.png: Initial homepage state');
  console.log('- dashboard-current.png: Dashboard current state');
  if (themeToggleFound) {
    console.log('- dashboard-after-theme-toggle.png: After clicking theme toggle');
  } else {
    console.log('- dashboard-no-theme-toggle.png: Final state (no theme toggle found)');
  }
});