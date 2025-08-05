import { test, expect } from '@playwright/test';

test('Debug Navigation Dropdown Behavior', async ({ page }) => {
  console.log('🔍 Debugging navigation dropdown behavior...');
  
  // Step 1: Login
  await page.goto('http://127.0.0.1:8000/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Step 2: Navigate to dashboard if not already there
  if (!page.url().includes('dashboard')) {
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForLoadState('networkidle');
  }
  
  console.log('✅ Successfully logged in and on dashboard');
  
  // Step 3: Inspect navigation structure
  const navStructure = await page.evaluate(() => {
    const navItems = document.querySelectorAll('nav li.relative');
    const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
    
    return {
      navItemsCount: navItems.length,
      dropdownsCount: dropdowns.length,
      navItems: Array.from(navItems).slice(0, 5).map((item, index) => ({
        index,
        text: item.textContent?.trim().substring(0, 50),
        hasDropdown: item.querySelector('.nexus-nav-dropdown') !== null,
        classes: item.className,
        hasMouseEvents: item.onmouseenter !== null || item.onmouseleave !== null
      })),
      dropdowns: Array.from(dropdowns).slice(0, 5).map((dropdown, index) => ({
        index,
        classes: dropdown.className,
        style: dropdown.style.cssText,
        computedDisplay: window.getComputedStyle(dropdown).display,
        computedVisibility: window.getComputedStyle(dropdown).visibility,
        parent: dropdown.parentElement?.tagName
      }))
    };
  });
  
  console.log('📊 Navigation Structure Analysis:');
  console.log(`   Navigation items: ${navStructure.navItemsCount}`);
  console.log(`   Dropdown elements: ${navStructure.dropdownsCount}`);
  
  navStructure.navItems.forEach(item => {
    console.log(`   Nav Item ${item.index}: "${item.text}", hasDropdown: ${item.hasDropdown}, hasMouseEvents: ${item.hasMouseEvents}`);
  });
  
  navStructure.dropdowns.forEach(dropdown => {
    console.log(`   Dropdown ${dropdown.index}: display: ${dropdown.computedDisplay}, visibility: ${dropdown.computedVisibility}`);
  });
  
  // Step 4: Test mouse events directly via JavaScript
  console.log('\n🧪 Testing JavaScript mouse events...');
  
  const jsTestResult = await page.evaluate(() => {
    const firstNavItem = document.querySelector('nav li.relative');
    const dropdown = firstNavItem?.querySelector('.nexus-nav-dropdown');
    
    if (!firstNavItem || !dropdown) {
      return { error: 'Navigation item or dropdown not found' };
    }
    
    // Check initial state
    const initialDisplay = window.getComputedStyle(dropdown).display;
    
    // Manually trigger mouseenter event
    const mouseEnterEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    firstNavItem.dispatchEvent(mouseEnterEvent);
    
    // Check after mouseenter
    const afterEnterDisplay = window.getComputedStyle(dropdown).display;
    
    // Wait a bit
    return new Promise(resolve => {
      setTimeout(() => {
        const finalDisplay = window.getComputedStyle(dropdown).display;
        resolve({
          itemText: firstNavItem.textContent?.trim().substring(0, 30),
          initialDisplay,
          afterEnterDisplay,
          finalDisplay,
          dropdownHTML: dropdown.outerHTML.substring(0, 200) + '...'
        });
      }, 500);
    });
  });
  
  console.log('🔍 JavaScript Event Test Result:');
  console.log(`   Item: ${jsTestResult.itemText}`);
  console.log(`   Initial display: ${jsTestResult.initialDisplay}`);
  console.log(`   After mouseenter: ${jsTestResult.afterEnterDisplay}`);
  console.log(`   Final display: ${jsTestResult.finalDisplay}`);
  
  // Step 5: Take a screenshot and try actual hover
  await page.screenshot({ path: 'screenshots/dropdown-debug-01-before-hover.png', fullPage: true });
  
  // Use Playwright's hover method
  console.log('\n🧪 Testing Playwright hover...');
  const firstNavItem = page.locator('nav li.relative').first();
  const itemText = await firstNavItem.textContent();
  console.log(`   Hovering over: ${itemText?.trim().substring(0, 30)}`);
  
  await firstNavItem.hover();
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'screenshots/dropdown-debug-02-after-hover.png', fullPage: true });
  
  // Check dropdown visibility after hover
  const afterHoverState = await page.evaluate(() => {
    const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
    return Array.from(dropdowns).map((dropdown, index) => ({
      index,
      display: window.getComputedStyle(dropdown).display,
      visibility: window.getComputedStyle(dropdown).visibility,
      opacity: window.getComputedStyle(dropdown).opacity,
      zIndex: window.getComputedStyle(dropdown).zIndex,
      position: window.getComputedStyle(dropdown).position
    }));
  });
  
  console.log('📊 After Hover State:');
  afterHoverState.forEach(dropdown => {
    const isVisible = dropdown.display !== 'none' && 
                     dropdown.visibility !== 'hidden' && 
                     dropdown.opacity !== '0';
    console.log(`   Dropdown ${dropdown.index}: visible=${isVisible}, display=${dropdown.display}, visibility=${dropdown.visibility}, opacity=${dropdown.opacity}`);
  });
  
  // Step 6: Test if CSS or JavaScript is preventing dropdown display
  const cssDebug = await page.evaluate(() => {
    const dropdown = document.querySelector('.nexus-nav-dropdown');
    if (!dropdown) return { error: 'No dropdown found' };
    
    const styles = window.getComputedStyle(dropdown);
    const allStyles = {};
    
    // Get relevant CSS properties
    [
      'display', 'visibility', 'opacity', 'position', 'top', 'left', 'right', 'bottom',
      'z-index', 'transform', 'max-height', 'overflow', 'clip', 'clip-path'
    ].forEach(prop => {
      allStyles[prop] = styles.getPropertyValue(prop);
    });
    
    return {
      styles: allStyles,
      boundingRect: dropdown.getBoundingClientRect(),
      parentRect: dropdown.parentElement?.getBoundingClientRect()
    };
  });
  
  console.log('\n🎨 CSS Debug Information:');
  console.log('   Computed styles:', cssDebug.styles);
  console.log('   Bounding rect:', cssDebug.boundingRect);
  
  // Final screenshot
  await page.screenshot({ path: 'screenshots/dropdown-debug-03-final.png', fullPage: true });
  
  console.log('\n📋 Debug Summary:');
  console.log(`   ✅ Found ${navStructure.navItemsCount} navigation items`);
  console.log(`   ✅ Found ${navStructure.dropdownsCount} dropdown elements`);
  console.log(`   🔍 JS mouseenter result: ${jsTestResult.finalDisplay}`);
  console.log(`   🔍 Playwright hover test completed`);
  
  const hasVisibleDropdowns = afterHoverState.some(d => 
    d.display !== 'none' && d.visibility !== 'hidden' && d.opacity !== '0'
  );
  
  console.log(`   🎯 Dropdowns visible after hover: ${hasVisibleDropdowns ? '✅ YES' : '❌ NO'}`);
  
  if (!hasVisibleDropdowns) {
    console.log('\n⚠️ ISSUE IDENTIFIED: Dropdowns are not becoming visible on hover');
    console.log('   Possible causes:');
    console.log('   1. JavaScript event handlers not working');
    console.log('   2. CSS preventing visibility');
    console.log('   3. Timing issues with event handling');
    console.log('   4. Z-index or positioning problems');
  } else {
    console.log('\n✅ WORKING: Dropdowns are visible on hover');
  }
});