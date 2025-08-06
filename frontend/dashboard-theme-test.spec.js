import { test, expect } from '@playwright/test';

test('Dashboard Theme Test - Focused', async ({ page }) => {
  console.log('=== Dashboard Theme Testing ===');
  
  // Step 1: Go directly to login page
  console.log('1. Going to login page');
  await page.goto('http://127.0.0.1:8000/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'step1-login-page.png', fullPage: true });
  
  // Step 2: Login
  console.log('2. Logging in');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  console.log('3. Waiting for dashboard redirect');
  await page.waitForURL('**/dashboard*', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  // Step 3: Take screenshot of dashboard
  console.log('4. Taking dashboard screenshot');
  await page.screenshot({ path: 'step2-dashboard-initial.png', fullPage: true });
  
  // Step 4: Inspect page elements for theme functionality
  console.log('5. Inspecting page for theme elements');
  
  // Get page title and URL to confirm we're on dashboard
  const title = await page.title();
  const url = page.url();
  console.log(`Page title: ${title}`);
  console.log(`Current URL: ${url}`);
  
  // Look for common theme toggle patterns
  const themeElements = await page.evaluate(() => {
    const results = [];
    
    // Check for theme toggle buttons or switches
    const possibleSelectors = [
      'button[id*="theme"]',
      'button[class*="theme"]',
      'switch[id*="theme"]',
      'input[type="checkbox"][id*="theme"]',
      '.theme-toggle',
      '.theme-switch',
      '#themeToggle',
      '[data-theme-toggle]',
      '.dropdown-item:contains("light")',
      '.dropdown-item:contains("dark")',
      'button:contains("Light")',
      'button:contains("Dark")'
    ];
    
    // Also look for any elements containing theme-related text or attributes
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el, index) => {
      const text = el.textContent?.toLowerCase() || '';
      const classes = el.className?.toLowerCase() || '';
      const id = el.id?.toLowerCase() || '';
      const dataAttrs = Array.from(el.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');
      
      if (text.includes('theme') || text.includes('light') || text.includes('dark') || 
          classes.includes('theme') || id.includes('theme') || dataAttrs.includes('theme')) {
        results.push({
          tagName: el.tagName,
          text: el.textContent?.slice(0, 50) + '...',
          className: el.className,
          id: el.id,
          dataAttributes: dataAttrs,
          outerHTML: el.outerHTML.slice(0, 200) + '...'
        });
      }
    });
    
    return results.slice(0, 15); // Limit results
  });
  
  console.log('Theme-related elements found:', themeElements);
  
  // Step 5: Check current theme state
  const bodyClasses = await page.getAttribute('body', 'class');
  const htmlClasses = await page.getAttribute('html', 'class');
  const bodyDataTheme = await page.getAttribute('body', 'data-theme');
  const htmlDataTheme = await page.getAttribute('html', 'data-theme');
  
  console.log('Current theme state:');
  console.log(`  Body classes: ${bodyClasses}`);
  console.log(`  HTML classes: ${htmlClasses}`);
  console.log(`  Body data-theme: ${bodyDataTheme}`);
  console.log(`  HTML data-theme: ${htmlDataTheme}`);
  
  // Step 6: Look for navigation or header area that might contain theme toggle
  console.log('6. Examining navigation and header areas');
  
  try {
    // Look for navigation elements
    const navElements = await page.$$eval('nav, .navbar, .header, .top-bar', elements => 
      elements.map(el => ({
        tagName: el.tagName,
        classes: el.className,
        id: el.id,
        innerHTML: el.innerHTML.slice(0, 300) + '...'
      }))
    );
    console.log('Navigation elements:', navElements);
  } catch (e) {
    console.log('No standard navigation elements found');
  }
  
  // Step 7: Try to find and test any theme toggle
  console.log('7. Attempting to find and test theme toggle');
  
  // Try various common theme toggle selectors
  const possibleSelectors = [
    '#theme-toggle',
    '.theme-toggle',
    '.theme-switch',
    '[data-theme-toggle]',
    'button[aria-label*="theme"]',
    'button[title*="theme"]',
    '.btn-theme',
    '.toggle-theme'
  ];
  
  let themeToggleFound = false;
  let workingSelector = null;
  
  for (const selector of possibleSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        console.log(`Found potential theme toggle: ${selector}`);
        themeToggleFound = true;
        workingSelector = selector;
        break;
      }
    } catch (e) {
      // Continue searching
    }
  }
  
  if (themeToggleFound) {
    console.log(`Testing theme toggle with selector: ${workingSelector}`);
    
    // Click the toggle
    await page.click(workingSelector);
    await page.waitForTimeout(1000); // Wait for animation
    
    // Take screenshot after toggle
    await page.screenshot({ path: 'step3-after-theme-toggle.png', fullPage: true });
    
    // Check if theme changed
    const newBodyClasses = await page.getAttribute('body', 'class');
    const newHtmlClasses = await page.getAttribute('html', 'class');
    const newBodyDataTheme = await page.getAttribute('body', 'data-theme');
    const newHtmlDataTheme = await page.getAttribute('html', 'data-theme');
    
    console.log('After theme toggle:');
    console.log(`  Body classes: ${newBodyClasses}`);
    console.log(`  HTML classes: ${newHtmlClasses}`);
    console.log(`  Body data-theme: ${newBodyDataTheme}`);
    console.log(`  HTML data-theme: ${newHtmlDataTheme}`);
    
    // Compare before/after
    const themeChanged = (
      bodyClasses !== newBodyClasses ||
      htmlClasses !== newHtmlClasses ||
      bodyDataTheme !== newBodyDataTheme ||
      htmlDataTheme !== newHtmlDataTheme
    );
    
    console.log(`Theme state changed: ${themeChanged}`);
  } else {
    console.log('No theme toggle button found');
    await page.screenshot({ path: 'step3-no-theme-toggle.png', fullPage: true });
  }
  
  // Step 8: Check for theme-related CSS files
  console.log('8. Checking loaded CSS for theme files');
  const stylesheets = await page.$$eval('link[rel="stylesheet"]', links =>
    links.map(link => ({
      href: link.href,
      id: link.id,
      className: link.className
    }))
  );
  
  console.log('Loaded stylesheets:');
  stylesheets.forEach(sheet => {
    console.log(`  ${sheet.href}`);
  });
  
  // Step 9: Final inspection - dump relevant HTML structure
  console.log('9. Final HTML structure inspection');
  
  try {
    const headerHTML = await page.$eval('header, .header, nav, .navbar', el => el.outerHTML.slice(0, 500));
    console.log('Header/Nav HTML snippet:', headerHTML);
  } catch (e) {
    console.log('No header/nav elements found');
  }
  
  console.log('=== Test Complete ===');
  console.log('Screenshots saved:');
  console.log('  - step1-login-page.png: Login page');
  console.log('  - step2-dashboard-initial.png: Dashboard initial state');
  if (themeToggleFound) {
    console.log('  - step3-after-theme-toggle.png: After clicking theme toggle');
  } else {
    console.log('  - step3-no-theme-toggle.png: Final state (no theme toggle found)');
  }
});