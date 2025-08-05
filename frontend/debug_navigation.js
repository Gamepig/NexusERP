import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Navigating to dashboard...');
  await page.goto('http://127.0.0.1:8000/dashboard');
  
  // Wait for page load
  await page.waitForLoadState('networkidle');
  
  console.log('📋 Page title:', await page.title());
  
  // Check what navigation template is being used
  console.log('\n🔍 Navigation Analysis:');
  const navInfo = await page.evaluate(() => {
    const navs = document.querySelectorAll('nav');
    return Array.from(navs).map(nav => ({
      xData: nav.getAttribute('x-data'),
      classes: nav.className,
      id: nav.id,
      childCount: nav.children.length,
      hasUserMenu: !!nav.querySelector('#user-menu-trigger, .nexus-user-trigger, [id*="user"], [class*="user"]'),
      innerHTML: nav.innerHTML.substring(0, 300) + '...'
    }));
  });
  
  console.log('Navigation elements found:', navInfo.length);
  navInfo.forEach((nav, index) => {
    console.log(`Nav ${index + 1}:`, nav);
  });
  
  // Check user menu elements specifically
  console.log('\n👤 User Menu Analysis:');
  const userMenuInfo = await page.evaluate(() => {
    const userTrigger = document.querySelector('#user-menu-trigger');
    const userTriggerByClass = document.querySelector('.nexus-user-trigger');
    const userDropdown = document.querySelector('#user-dropdown-menu');
    const userDropdownByClass = document.querySelector('.nexus-user-dropdown');
    
    // Check what's actually in the right section of navigation
    const rightSection = document.querySelector('.justify-end');
    const rightChildren = rightSection ? Array.from(rightSection.children).map(child => ({
      tag: child.tagName,
      classes: child.className,
      id: child.id,
      text: child.textContent.trim(),
      visible: window.getComputedStyle(child).display !== 'none',
      hasClickEvent: child.onclick !== null || child.getAttribute('onclick') !== null,
      xData: child.getAttribute('x-data'),
      xClick: child.getAttribute('@click') || child.getAttribute('x-on:click')
    })) : [];
    
    return {
      userTriggerById: !!userTrigger,
      userTriggerByClass: !!userTriggerByClass,
      userDropdownById: !!userDropdown,
      userDropdownByClass: !!userDropdownByClass,
      rightSectionExists: !!rightSection,
      rightSectionChildren: rightChildren
    };
  });
  
  console.log('User menu info:', userMenuInfo);
  
  // Check if enhanced-navigation component is being used vs regular navigation
  console.log('\n🏗️ Layout Component Analysis:');
  const layoutInfo = await page.evaluate(() => {
    const layoutElements = document.querySelectorAll('[x-data*="enhanced"], [x-data*="navigation"], [x-data*="dropdown"], [x-data*="menu"]');
    return Array.from(layoutElements).map(el => ({
      tag: el.tagName,
      xData: el.getAttribute('x-data'),
      classes: el.className,
      id: el.id
    }));
  });
  
  console.log('Layout components found:', layoutInfo.length);
  layoutInfo.forEach((comp, index) => {
    console.log(`Component ${index + 1}:`, comp);
  });
  
  // Check Alpine.js components
  console.log('\n🏔️ Alpine.js Components:');
  const alpineInfo = await page.evaluate(() => {
    // Look for Alpine.js specific attributes
    const alpineElements = document.querySelectorAll('[x-data]');
    return Array.from(alpineElements).map(el => ({
      tag: el.tagName,
      xData: el.getAttribute('x-data'),
      classes: el.className,
      id: el.id,
      hasUserRelated: el.innerHTML.includes('user') || el.className.includes('user') || el.id.includes('user')
    })).filter(el => el.hasUserRelated || el.xData);
  });
  
  console.log('Alpine elements found:', alpineInfo.length);
  alpineInfo.forEach((alpine, index) => {
    console.log(`Alpine ${index + 1}:`, alpine);
  });
  
  // Take a screenshot
  console.log('\n📸 Taking screenshot...');
  await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/debug_navigation_state.png' });
  
  // Try to interact with user menu area
  console.log('\n🎯 Testing User Menu Interaction:');
  try {
    // Look for any clickable element in the right section
    const clickableUser = await page.locator('.justify-end button, .justify-end [role="button"], .justify-end .cursor-pointer').first();
    if (await clickableUser.count() > 0) {
      console.log('Found clickable user element, attempting click...');
      await clickableUser.click();
      await page.waitForTimeout(500);
      
      // Check if dropdown appeared
      const dropdownAppeared = await page.locator('[role="menu"], .dropdown-menu, [x-show], .nexus-user-dropdown').isVisible();
      console.log('Dropdown appeared after click:', dropdownAppeared);
    } else {
      console.log('No clickable user element found in right section');
    }
  } catch (error) {
    console.log('Error during interaction test:', error.message);
  }
  
  console.log('\n✅ Analysis complete. Screenshot saved to debug_navigation_state.png');
  
  await browser.close();
})();