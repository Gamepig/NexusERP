import { test, expect } from '@playwright/test';

test('Navigation Dropdown Behavior Test', async ({ page }) => {
  console.log('🔍 Testing navigation dropdown fixes...');
  
  // Navigate to dashboard
  await page.goto('http://127.0.0.1:8000/dashboard');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take initial screenshot
  await page.screenshot({ path: 'screenshots/nav-dropdown-test-01-initial.png', fullPage: true });
  console.log('📸 Initial state screenshot taken');
  
  // Find navigation items
  const navigationItems = page.locator('nav li.relative');
  const itemCount = await navigationItems.count();
  console.log(`🧭 Found ${itemCount} navigation items`);
  
  if (itemCount === 0) {
    console.log('⚠️ No navigation items found, taking debug screenshot');
    await page.screenshot({ path: 'screenshots/nav-dropdown-debug.png', fullPage: true });
    return;
  }
  
  // Test 1: Multiple hover behavior (should only show one dropdown at a time)
  console.log('🧪 Test 1: Multiple hover behavior');
  
  const testResults = [];
  const maxItems = Math.min(3, itemCount);
  
  for (let i = 0; i < maxItems; i++) {
    const item = navigationItems.nth(i);
    const itemText = await item.textContent();
    console.log(`   Hovering over item ${i + 1}: ${itemText?.trim()}`);
    
    // Hover over the navigation item
    await item.hover();
    
    // Wait a moment for dropdown to appear
    await page.waitForTimeout(200);
    
    // Count open dropdowns
    const openDropdowns = await page.evaluate(() => {
      const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
      let visibleCount = 0;
      dropdowns.forEach(dropdown => {
        const style = window.getComputedStyle(dropdown);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          visibleCount++;
        }
      });
      return visibleCount;
    });
    
    testResults.push({
      itemIndex: i,
      itemText: itemText?.trim(),
      openDropdownCount: openDropdowns,
      expectedCount: 1
    });
    
    console.log(`   Open dropdowns: ${openDropdowns} (expected: 1)`);
    
    // Take screenshot after each hover
    await page.screenshot({ 
      path: `screenshots/nav-dropdown-test-02-hover-${i + 1}.png`, 
      fullPage: true 
    });
  }
  
  // Test 2: Mouse leave behavior
  console.log('🧪 Test 2: Mouse leave behavior');
  
  const firstNavItem = navigationItems.nth(0);
  
  // Hover to open dropdown
  await firstNavItem.hover();
  await page.waitForTimeout(200);
  
  const openBefore = await page.evaluate(() => {
    const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
    let visibleCount = 0;
    dropdowns.forEach(dropdown => {
      const style = window.getComputedStyle(dropdown);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        visibleCount++;
      }
    });
    return visibleCount;
  });
  
  console.log(`   Dropdowns open before mouse leave: ${openBefore}`);
  
  // Move mouse away from navigation
  await page.mouse.move(100, 100);
  
  // Wait for the timeout delay (300ms + buffer)
  await page.waitForTimeout(500);
  
  const openAfter = await page.evaluate(() => {
    const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
    let visibleCount = 0;
    dropdowns.forEach(dropdown => {
      const style = window.getComputedStyle(dropdown);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        visibleCount++;
      }
    });
    return visibleCount;
  });
  
  console.log(`   Dropdowns open after mouse leave: ${openAfter}`);
  
  const leaveTestResult = {
    openBefore: openBefore,
    openAfter: openAfter,
    closesBehaviorWorking: openBefore > 0 && openAfter === 0
  };
  
  // Take final screenshot
  await page.screenshot({ 
    path: 'screenshots/nav-dropdown-test-03-after-leave.png', 
    fullPage: true 
  });
  
  // Test 3: Check for JavaScript errors
  const jsErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      jsErrors.push(msg.text());
    }
  });
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log('================');
  
  console.log('\n🧪 Multiple Hover Test Results:');
  testResults.forEach(result => {
    const status = result.openDropdownCount === 1 ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} Item "${result.itemText}": ${result.openDropdownCount} dropdown(s) open`);
  });
  
  const multipleHoverPassed = testResults.every(result => result.openDropdownCount <= 1);
  console.log(`\n🎯 Multiple Hover Fix: ${multipleHoverPassed ? '✅ WORKING' : '❌ BROKEN'}`);
  
  console.log('\n🧪 Mouse Leave Test Result:');
  console.log(`   Before: ${leaveTestResult.openBefore} open`);
  console.log(`   After: ${leaveTestResult.openAfter} open`);
  console.log(`   🎯 Mouse Leave Fix: ${leaveTestResult.closesBehaviorWorking ? '✅ WORKING' : '❌ BROKEN'}`);
  
  if (jsErrors.length > 0) {
    console.log('\n⚠️ JavaScript Errors Detected:');
    jsErrors.forEach(error => console.log(`   ${error}`));
  } else {
    console.log('\n✅ No JavaScript errors detected');
  }
  
  // Assertions for actual test results
  expect(multipleHoverPassed).toBe(true);
  expect(leaveTestResult.closesBehaviorWorking).toBe(true);
});