import { test, expect } from '@playwright/test';

test('Theme Toggle Test - Focused on clicking theme button', async ({ page }) => {
  console.log('=== Theme Toggle Test ===');
  
  // Step 1: Login and get to dashboard
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard*');
  await page.waitForLoadState('networkidle');
  
  console.log('1. Successfully logged in and reached dashboard');
  
  // Step 2: Take initial screenshot
  await page.screenshot({ path: 'theme-test-01-initial-light.png', fullPage: true });
  console.log('2. Initial screenshot taken (should be light theme)');
  
  // Step 3: Find and click theme toggle
  console.log('3. Looking for theme toggle button');
  
  // Multiple strategies to find the theme toggle
  let themeToggleClicked = false;
  const strategies = [
    // Strategy 1: Look for theme button by text or aria-label
    async () => {
      try {
        await page.click('button:has-text("主題")');
        return true;
      } catch (e) { return false; }
    },
    
    // Strategy 2: Look for sun/moon icon buttons
    async () => {
      try {
        await page.click('button[aria-label*="theme"], button[title*="theme"]');
        return true;
      } catch (e) { return false; }
    },
    
    // Strategy 3: Look for common theme toggle classes
    async () => {
      try {
        await page.click('.theme-toggle, .theme-switch, #theme-toggle');
        return true;
      } catch (e) { return false; }
    },
    
    // Strategy 4: Try clicking on elements containing theme-related text
    async () => {
      try {
        // Look for any clickable element near "主題"
        const themeElements = await page.$$('*:has-text("主題")');
        for (const element of themeElements) {
          try {
            await element.click();
            return true;
          } catch (e) {
            continue;
          }
        }
        return false;
      } catch (e) { return false; }
    },
    
    // Strategy 5: Look for buttons in the header area that might be theme toggle
    async () => {
      try {
        // Get all buttons in header area
        const headerButtons = await page.$$('header button, nav button, .navbar button, .top-bar button');
        console.log(`Found ${headerButtons.length} header buttons`);
        
        for (let i = 0; i < headerButtons.length; i++) {
          try {
            const button = headerButtons[i];
            const text = await button.textContent();
            const classes = await button.getAttribute('class');
            const id = await button.getAttribute('id');
            
            console.log(`Button ${i}: text="${text}", classes="${classes}", id="${id}"`);
            
            // If it's likely a theme toggle, try clicking it
            if (text?.includes('主題') || 
                classes?.includes('theme') || 
                id?.includes('theme') ||
                text?.includes('☀') || text?.includes('🌙') || 
                text?.includes('🌞') || text?.includes('🌛')) {
              await button.click();
              return true;
            }
          } catch (e) {
            continue;
          }
        }
        return false;
      } catch (e) { return false; }
    }
  ];
  
  // Try each strategy
  for (let i = 0; i < strategies.length; i++) {
    console.log(`Trying strategy ${i + 1}`);
    try {
      themeToggleClicked = await strategies[i]();
      if (themeToggleClicked) {
        console.log(`Strategy ${i + 1} succeeded!`);
        break;
      }
    } catch (e) {
      console.log(`Strategy ${i + 1} failed:`, e.message);
    }
  }
  
  if (!themeToggleClicked) {
    console.log('4. No theme toggle found, trying to inspect the page structure');
    
    // Take a screenshot and dump HTML of the header area for analysis
    await page.screenshot({ path: 'theme-test-02-no-toggle-found.png', fullPage: true });
    
    try {
      const headerHTML = await page.$eval('header, nav, .header, .navbar', el => el.outerHTML);
      console.log('Header HTML structure:', headerHTML.slice(0, 1000) + '...');
    } catch (e) {
      console.log('Could not find header element');
    }
    
    // Try to list all buttons on the page
    const allButtons = await page.$$eval('button', buttons => 
      buttons.map((btn, index) => ({
        index,
        text: btn.textContent?.slice(0, 50),
        classes: btn.className,
        id: btn.id,
        type: btn.type,
        disabled: btn.disabled
      }))
    );
    console.log('All buttons on page:', allButtons);
    
  } else {
    // Step 4: Wait for theme change and take screenshot
    console.log('4. Theme toggle clicked, waiting for changes');
    await page.waitForTimeout(1000); // Wait for animation/transition
    
    await page.screenshot({ path: 'theme-test-03-after-toggle.png', fullPage: true });
    console.log('5. Screenshot taken after theme toggle');
    
    // Check if theme actually changed
    const bodyClasses = await page.getAttribute('body', 'class') || '';
    const htmlClasses = await page.getAttribute('html', 'class') || '';
    const bodyTheme = await page.getAttribute('body', 'data-theme') || '';
    const htmlTheme = await page.getAttribute('html', 'data-theme') || '';
    
    console.log('Theme state after toggle:');
    console.log(`  Body classes: ${bodyClasses}`);
    console.log(`  HTML classes: ${htmlClasses}`);
    console.log(`  Body data-theme: ${bodyTheme}`);
    console.log(`  HTML data-theme: ${htmlTheme}`);
    
    // Check for dark theme indicators
    const isDarkTheme = bodyClasses.includes('dark') || 
                       htmlClasses.includes('dark') || 
                       bodyTheme.includes('dark') || 
                       htmlTheme.includes('dark');
    
    console.log(`Dark theme detected: ${isDarkTheme}`);
    
    // Try toggling back to see if it works both ways
    console.log('6. Testing toggle back to light theme');
    try {
      await page.click('button:has-text("主題"), .theme-toggle, .theme-switch'); // Try the same selectors
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'theme-test-04-toggle-back.png', fullPage: true });
      console.log('7. Successfully toggled back');
    } catch (e) {
      console.log('7. Could not toggle back:', e.message);
    }
  }
  
  console.log('=== Test Complete ===');
});