import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔑 Logging in...');
  await page.goto('http://127.0.0.1:8000/login');
  
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  
  console.log('✅ Logged in, now testing CSS and Alpine.js x-show behavior...');
  
  // Check initial state
  console.log('\n📋 Initial dropdown state:');
  const initialState = await page.evaluate(() => {
    const dropdown = document.querySelector('#user-dropdown-menu');
    if (!dropdown) return { error: 'Dropdown not found' };
    
    const computedStyle = window.getComputedStyle(dropdown);
    
    return {
      hasXCloak: dropdown.hasAttribute('x-cloak'),
      xShowValue: dropdown.getAttribute('x-show'),
      inlineStyle: dropdown.style.cssText,
      computedDisplay: computedStyle.display,
      computedVisibility: computedStyle.visibility,
      computedOpacity: computedStyle.opacity,
      classes: dropdown.className,
      alpineShowState: dropdown._x_model ? dropdown._x_model.get() : 'no model'
    };
  });
  console.log('Initial state:', initialState);
  
  // Click the user trigger
  console.log('\n🎯 Clicking user trigger...');
  await page.click('#user-menu-trigger');
  await page.waitForTimeout(1000);
  
  // Check state after click
  console.log('\n📋 Dropdown state after click:');
  const afterClickState = await page.evaluate(() => {
    const dropdown = document.querySelector('#user-dropdown-menu');
    if (!dropdown) return { error: 'Dropdown not found' };
    
    const computedStyle = window.getComputedStyle(dropdown);
    const nav = document.querySelector('nav[x-data="enhancedNavigation()"]');
    const alpineState = nav && nav._x_dataStack && nav._x_dataStack[0] ? nav._x_dataStack[0].showUserMenu : 'unknown';
    
    return {
      hasXCloak: dropdown.hasAttribute('x-cloak'),
      xShowValue: dropdown.getAttribute('x-show'),
      inlineStyle: dropdown.style.cssText,
      computedDisplay: computedStyle.display,
      computedVisibility: computedStyle.visibility,
      computedOpacity: computedStyle.opacity,
      computedTransform: computedStyle.transform,
      classes: dropdown.className,
      alpineShowState: alpineState,
      parentAlpineData: !!nav
    };
  });
  console.log('After click state:', afterClickState);
  
  // Try to force show for debugging
  console.log('\n🔧 Forcing dropdown visibility for testing...');
  await page.evaluate(() => {
    const dropdown = document.querySelector('#user-dropdown-menu');
    if (dropdown) {
      // Remove x-cloak if present
      dropdown.removeAttribute('x-cloak');
      
      // Force display
      dropdown.style.display = 'block';
      dropdown.style.visibility = 'visible';
      dropdown.style.opacity = '1';
      dropdown.style.transform = 'translateY(0)';
      
      console.log('Forced visibility applied');
    }
  });
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/forced_dropdown_test.png' });
  console.log('📸 Screenshot with forced visibility saved');
  
  // Check if dropdown is now visible
  const forcedState = await page.evaluate(() => {
    const dropdown = document.querySelector('#user-dropdown-menu');
    if (!dropdown) return { error: 'Dropdown not found' };
    
    const rect = dropdown.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(dropdown);
    
    return {
      isVisible: rect.width > 0 && rect.height > 0,
      boundingRect: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      },
      computedDisplay: computedStyle.display,
      inlineStyle: dropdown.style.cssText
    };
  });
  
  console.log('\n✅ Final state with forced visibility:', forcedState);
  
  await browser.close();
})();