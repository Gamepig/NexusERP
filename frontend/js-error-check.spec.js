import { test, expect } from '@playwright/test';

test('Check JavaScript Errors and Alpine.js Loading', async ({ page }) => {
  console.log('🔍 Checking for JavaScript errors and Alpine.js functionality...');
  
  const jsErrors = [];
  const consoleMessages = [];
  
  // Capture JavaScript errors
  page.on('pageerror', error => {
    jsErrors.push(error.message);
    console.log('❌ JavaScript Error:', error.message);
  });
  
  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', text);
    }
  });
  
  // Login
  await page.goto('http://127.0.0.1:8000/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  if (!page.url().includes('dashboard')) {
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }
  
  console.log('✅ Page loaded successfully');
  
  // Check if Alpine.js is loaded
  const alpineCheck = await page.evaluate(() => {
    return {
      alpineExists: typeof window.Alpine !== 'undefined',
      alpineVersion: window.Alpine ? window.Alpine.version : null,
      xDataExists: document.querySelectorAll('[x-data]').length > 0,
      multiLevelNavExists: typeof window.multiLevelNav !== 'undefined'
    };
  });
  
  console.log('📊 Alpine.js Check:');
  console.log(`   Alpine.js loaded: ${alpineCheck.alpineExists}`);
  console.log(`   Alpine.js version: ${alpineCheck.alpineVersion || 'N/A'}`);
  console.log(`   x-data elements: ${alpineCheck.xDataExists}`);
  console.log(`   multiLevelNav function: ${alpineCheck.multiLevelNavExists}`);
  
  // Check navigation structure
  const navCheck = await page.evaluate(() => {
    const navElement = document.querySelector('nav[x-data]');
    const navItems = document.querySelectorAll('nav li.relative');
    const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
    
    let navData = null;
    if (navElement && navElement._x_dataStack) {
      navData = navElement._x_dataStack[0];
    }
    
    return {
      navElementExists: !!navElement,
      navElementHasXData: navElement ? navElement.hasAttribute('x-data') : false,
      navItemCount: navItems.length,
      dropdownCount: dropdowns.length,
      hasNavData: !!navData,
      navigationItems: navData && navData.navigationItems ? navData.navigationItems.length : 0,
      openDropdowns: navData && navData.openDropdowns ? navData.openDropdowns.length : 0
    };
  });
  
  console.log('📊 Navigation Structure Check:');
  console.log(`   Nav element exists: ${navCheck.navElementExists}`);
  console.log(`   Nav has x-data: ${navCheck.navElementHasXData}`);
  console.log(`   Nav items found: ${navCheck.navItemCount}`);
  console.log(`   Dropdown elements: ${navCheck.dropdownCount}`);
  console.log(`   Alpine data attached: ${navCheck.hasNavData}`);
  console.log(`   Navigation items in data: ${navCheck.navigationItems}`);
  console.log(`   Open dropdowns: ${navCheck.openDropdowns}`);
  
  // Test Alpine.js functionality manually
  const alpineTest = await page.evaluate(() => {
    const navElement = document.querySelector('nav[x-data]');
    if (!navElement || !navElement._x_dataStack) {
      return { error: 'No Alpine.js data found on navigation' };
    }
    
    const navData = navElement._x_dataStack[0];
    
    // Try to manually trigger showDropdown
    if (navData.showDropdown && navData.navigationItems.length > 0) {
      const firstItemId = navData.navigationItems[0].id;
      try {
        navData.showDropdown(firstItemId);
        
        // Check if dropdown was opened
        const isOpen = navData.openDropdowns.includes(firstItemId);
        
        return {
          success: true,
          firstItemId,
          isOpen,
          openDropdowns: navData.openDropdowns.length,
          navigationItemsCount: navData.navigationItems.length
        };
      } catch (error) {
        return { error: 'Error calling showDropdown: ' + error.message };
      }
    }
    
    return { error: 'showDropdown method not found or no navigation items' };
  });
  
  console.log('📊 Alpine.js Function Test:');
  console.log('   Result:', alpineTest);
  
  // Test hover event directly
  const hoverTest = await page.evaluate(() => {
    const firstNavItem = document.querySelector('nav li.relative');
    if (!firstNavItem) {
      return { error: 'No navigation item found' };
    }
    
    // Create and dispatch mouseenter event
    const mouseEnterEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true
    });
    
    firstNavItem.dispatchEvent(mouseEnterEvent);
    
    // Wait a moment and check
    return new Promise(resolve => {
      setTimeout(() => {
        const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
        let visibleCount = 0;
        dropdowns.forEach(dropdown => {
          if (dropdown.offsetHeight > 0 && dropdown.offsetWidth > 0) {
            visibleCount++;
          }
        });
        
        resolve({
          success: true,
          visibleDropdowns: visibleCount,
          itemText: firstNavItem.textContent?.trim().substring(0, 20)
        });
      }, 500);
    });
  });
  
  console.log('📊 Hover Event Test:');
  console.log('   Result:', hoverTest);
  
  // Generate report
  console.log('\n📋 JAVASCRIPT AND ALPINE.JS DIAGNOSTIC REPORT');
  console.log('==============================================');
  
  console.log('\n❌ JavaScript Errors:');
  if (jsErrors.length === 0) {
    console.log('   ✅ No JavaScript errors detected');
  } else {
    jsErrors.forEach(error => console.log(`   ❌ ${error}`));
  }
  
  console.log('\n⚠️ Console Errors:');
  const consoleErrors = consoleMessages.filter(msg => msg.type === 'error');
  if (consoleErrors.length === 0) {
    console.log('   ✅ No console errors detected');
  } else {
    consoleErrors.forEach(error => console.log(`   ❌ ${error.text}`));
  }
  
  console.log('\n🧪 Alpine.js Status:');
  console.log(`   Alpine.js loaded: ${alpineCheck.alpineExists ? '✅' : '❌'}`);
  console.log(`   Navigation data attached: ${navCheck.hasNavData ? '✅' : '❌'}`);
  console.log(`   Navigation items loaded: ${navCheck.navigationItems > 0 ? '✅' : '❌'}`);
  
  console.log('\n🧪 Functionality Test:');
  console.log(`   Manual showDropdown: ${alpineTest.success && !alpineTest.error ? '✅' : '❌'}`);
  console.log(`   Hover event response: ${hoverTest.success && hoverTest.visibleDropdowns > 0 ? '✅' : '❌'}`);
  
  const isWorkingProperly = alpineCheck.alpineExists && 
                           navCheck.hasNavData && 
                           navCheck.navigationItems > 0 && 
                           jsErrors.length === 0;
  
  console.log(`\n🏆 OVERALL STATUS: ${isWorkingProperly ? '✅ ALPINE.JS AND NAVIGATION WORKING' : '❌ ISSUES DETECTED'}`);
  
  if (!isWorkingProperly) {
    console.log('\n🔧 POTENTIAL SOLUTIONS:');
    if (!alpineCheck.alpineExists) {
      console.log('   - Alpine.js is not loaded. Check if Alpine.js script is included.');
    }
    if (!navCheck.hasNavData) {
      console.log('   - Navigation Alpine.js data not attached. Check x-data attribute.');
    }
    if (navCheck.navigationItems === 0) {
      console.log('   - No navigation items in Alpine.js data. Check data structure.');
    }
    if (jsErrors.length > 0) {
      console.log('   - Fix JavaScript errors listed above.');
    }
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'screenshots/js-alpine-diagnostic.png', fullPage: true });
});