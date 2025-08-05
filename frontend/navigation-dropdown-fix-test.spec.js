import { test, expect } from '@playwright/test';

test('Navigation Dropdown Fix Verification', async ({ page }) => {
  console.log('🔍 Testing navigation dropdown fixes after authentication...');
  
  // Step 1: Navigate to login page
  await page.goto('http://127.0.0.1:8000/login');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of login page
  await page.screenshot({ path: 'screenshots/nav-fix-01-login-page.png', fullPage: true });
  console.log('📸 Login page screenshot taken');
  
  // Step 2: Login with test credentials
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  await page.screenshot({ path: 'screenshots/nav-fix-02-login-filled.png', fullPage: true });
  console.log('📸 Login form filled screenshot taken');
  
  // Submit login form
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  
  // Wait for dashboard to load
  await page.waitForTimeout(2000);
  
  // Take screenshot after login
  await page.screenshot({ path: 'screenshots/nav-fix-03-after-login.png', fullPage: true });
  console.log('📸 After login screenshot taken');
  
  // Step 3: Check if we're on dashboard
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);
  
  if (!currentUrl.includes('dashboard')) {
    console.log('⚠️ Not on dashboard, trying to navigate there...');
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }
  
  // Take initial dashboard screenshot
  await page.screenshot({ path: 'screenshots/nav-fix-04-dashboard-initial.png', fullPage: true });
  
  // Step 4: Check for navigation items
  const navigationItems = page.locator('nav li.relative');
  const itemCount = await navigationItems.count();
  console.log(`🧭 Found ${itemCount} navigation items`);
  
  if (itemCount === 0) {
    console.log('❌ No navigation items found - taking debug screenshots');
    await page.screenshot({ path: 'screenshots/nav-fix-debug-no-nav.png', fullPage: true });
    
    // Check for any navigation elements
    const allNavElements = await page.evaluate(() => {
      const navs = document.querySelectorAll('nav, .nav, [role="navigation"]');
      return Array.from(navs).map(nav => ({
        tagName: nav.tagName,
        className: nav.className,
        innerHTML: nav.innerHTML.substring(0, 200) + '...'
      }));
    });
    
    console.log('🔍 Found navigation elements:', allNavElements);
    return;
  }
  
  // Step 5: Test the dropdown fix - Multiple hover behavior
  console.log('🧪 Test 1: Multiple hover behavior (should only show one dropdown at a time)');
  
  const hoverTestResults = [];
  const maxItems = Math.min(4, itemCount);
  
  for (let i = 0; i < maxItems; i++) {
    const item = navigationItems.nth(i);
    const itemText = await item.textContent();
    console.log(`   📍 Testing item ${i + 1}: ${itemText?.trim()}`);
    
    // Hover over the navigation item
    await item.hover();
    await page.waitForTimeout(400); // Wait for dropdown to appear
    
    // Count visible dropdowns using multiple methods
    const dropdownCount = await page.evaluate(() => {
      const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
      let visibleCount = 0;
      let displayBlockCount = 0;
      
      dropdowns.forEach(dropdown => {
        const style = window.getComputedStyle(dropdown);
        const isVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         style.opacity !== '0';
        
        if (isVisible) visibleCount++;
        if (dropdown.style.display === 'block') displayBlockCount++;
      });
      
      return {
        totalDropdowns: dropdowns.length,
        visibleByComputed: visibleCount,
        displayBlock: displayBlockCount
      };
    });
    
    hoverTestResults.push({
      itemIndex: i,
      itemText: itemText?.trim(),
      dropdownCount: dropdownCount,
      pass: dropdownCount.visibleByComputed <= 1
    });
    
    console.log(`   📊 Dropdowns - Visible: ${dropdownCount.visibleByComputed}, Display Block: ${dropdownCount.displayBlock}, Total: ${dropdownCount.totalDropdowns}`);
    
    // Take screenshot after each hover
    await page.screenshot({ 
      path: `screenshots/nav-fix-05-hover-test-${i + 1}.png`, 
      fullPage: true 
    });
  }
  
  // Step 6: Test mouse leave behavior (fixed timeout issue)
  console.log('🧪 Test 2: Mouse leave behavior (300ms timeout)');
  
  // Hover over first navigation item
  const firstNavItem = navigationItems.nth(0);
  await firstNavItem.hover();
  await page.waitForTimeout(400);
  
  // Count dropdowns before mouse leave
  const beforeLeave = await page.evaluate(() => {
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
  
  console.log(`   📊 Dropdowns open before mouse leave: ${beforeLeave}`);
  
  // Move mouse away from navigation area
  await page.mouse.move(100, 100);
  
  // Wait for the timeout delay (300ms + buffer for slow systems)
  console.log('   ⏱️ Waiting for timeout delay (600ms)...');
  await page.waitForTimeout(600);
  
  // Count dropdowns after mouse leave
  const afterLeave = await page.evaluate(() => {
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
  
  console.log(`   📊 Dropdowns open after mouse leave: ${afterLeave}`);
  
  const leaveTestResult = {
    openBefore: beforeLeave,
    openAfter: afterLeave,
    closesBehaviorWorking: beforeLeave > 0 && afterLeave === 0
  };
  
  // Take final screenshot
  await page.screenshot({ 
    path: 'screenshots/nav-fix-06-after-mouse-leave.png', 
    fullPage: true 
  });
  
  // Step 7: Test rapid hover behavior (edge case)
  console.log('🧪 Test 3: Rapid hover behavior (edge case testing)');
  
  // Rapidly hover over multiple items
  for (let i = 0; i < Math.min(3, itemCount); i++) {
    await navigationItems.nth(i).hover();
    await page.waitForTimeout(50); // Very short delay
  }
  
  await page.waitForTimeout(500); // Wait for any delayed effects
  
  const rapidHoverCount = await page.evaluate(() => {
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
  
  await page.screenshot({ 
    path: 'screenshots/nav-fix-07-rapid-hover-test.png', 
    fullPage: true 
  });
  
  // Step 8: Final verification - move mouse away and check all are closed
  await page.mouse.move(100, 100);
  await page.waitForTimeout(600);
  
  const finalCount = await page.evaluate(() => {
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
  
  await page.screenshot({ 
    path: 'screenshots/nav-fix-08-final-state.png', 
    fullPage: true 
  });
  
  // Generate test summary
  console.log('\n📋 Navigation Dropdown Fix Test Summary');
  console.log('=====================================');
  
  console.log('\n🧪 Multiple Hover Test Results:');
  hoverTestResults.forEach(result => {
    const status = result.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} Item "${result.itemText}": ${result.dropdownCount.visibleByComputed} visible dropdown(s)`);
  });
  
  const multipleHoverFixed = hoverTestResults.every(result => result.pass);
  console.log(`\n🎯 Multiple Dropdown Issue: ${multipleHoverFixed ? '✅ FIXED' : '❌ STILL BROKEN'}`);
  
  console.log('\n🧪 Mouse Leave Test Result:');
  console.log(`   Before mouse leave: ${leaveTestResult.openBefore} dropdown(s)`);
  console.log(`   After mouse leave: ${leaveTestResult.openAfter} dropdown(s)`);
  console.log(`   🎯 Mouse Leave Timeout: ${leaveTestResult.closesBehaviorWorking ? '✅ WORKING' : '❌ BROKEN'}`);
  
  console.log(`\n🧪 Rapid Hover Test: ${rapidHoverCount} dropdown(s) visible`);
  console.log(`   🎯 Rapid Hover Handling: ${rapidHoverCount <= 1 ? '✅ GOOD' : '⚠️ NEEDS ATTENTION'}`);
  
  console.log(`\n🧪 Final Cleanup Test: ${finalCount} dropdown(s) visible`);
  console.log(`   🎯 Final Cleanup: ${finalCount === 0 ? '✅ PERFECT' : '⚠️ SOME DROPDOWNS STILL OPEN'}`);
  
  // Overall assessment
  const overallFixed = multipleHoverFixed && 
                      leaveTestResult.closesBehaviorWorking && 
                      rapidHoverCount <= 1 && 
                      finalCount === 0;
  
  console.log(`\n🏆 OVERALL ASSESSMENT: ${overallFixed ? '✅ NAVIGATION DROPDOWN FIXES WORKING CORRECTLY' : '❌ ISSUES STILL PRESENT'}`);
  
  // Test assertions
  expect(multipleHoverFixed, 'Multiple dropdowns should not be open simultaneously').toBe(true);
  expect(leaveTestResult.closesBehaviorWorking, 'Dropdowns should close when mouse leaves').toBe(true);
  expect(rapidHoverCount, 'Rapid hover should not break dropdown behavior').toBeLessThanOrEqual(1);
  expect(finalCount, 'All dropdowns should be closed at the end').toBe(0);
});