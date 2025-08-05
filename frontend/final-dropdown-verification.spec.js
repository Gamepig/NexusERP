import { test, expect } from '@playwright/test';

test('Final Navigation Dropdown Verification - User Experience Test', async ({ page }) => {
  console.log('🔍 Final verification of navigation dropdown user experience...');
  
  // Step 1: Login
  await page.goto('http://127.0.0.1:8000/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  if (!page.url().includes('dashboard')) {
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForLoadState('networkidle');
  }
  
  console.log('✅ Successfully authenticated and on dashboard');
  
  // Step 2: Take initial screenshot
  await page.screenshot({ path: 'screenshots/final-dropdown-01-initial.png', fullPage: true });
  
  // Step 3: Test the original issue - multiple dropdowns staying open
  console.log('🧪 Testing the original issue: Multiple dropdowns staying open');
  
  const testItems = [
    { name: '客戶關係管理', selector: 'nav li.relative:nth-child(2)' },
    { name: '產品與庫存', selector: 'nav li.relative:nth-child(3)' },
    { name: '採購管理', selector: 'nav li.relative:nth-child(4)' },
    { name: '銷售管理', selector: 'nav li.relative:nth-child(5)' }
  ];
  
  // Test rapid hovering over multiple items (the problematic behavior)
  console.log('   📍 Step 1: Rapid hover over multiple navigation items');
  
  for (let i = 0; i < testItems.length; i++) {
    const item = testItems[i];
    console.log(`      Hovering over: ${item.name}`);
    
    await page.hover(item.selector);
    await page.waitForTimeout(100); // Short delay to mimic real user behavior
    
    // Check how many dropdowns are visible immediately after hover
    const visibleDropdowns = await page.evaluate(() => {
      const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
      let visibleCount = 0;
      dropdowns.forEach(dropdown => {
        const isVisible = dropdown.offsetHeight > 0 && dropdown.offsetWidth > 0;
        if (isVisible) visibleCount++;
      });
      return visibleCount;
    });
    
    console.log(`      Visible dropdowns: ${visibleDropdowns}`);
    
    // Take screenshot after each hover
    await page.screenshot({ 
      path: `screenshots/final-dropdown-02-rapid-hover-${i + 1}.png`, 
      fullPage: true 
    });
  }
  
  // Step 4: Wait a moment then check final state
  console.log('   📍 Step 2: Check state after rapid hovering');
  await page.waitForTimeout(500);
  
  const afterRapidHover = await page.evaluate(() => {
    const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
    let visibleCount = 0;
    const visibleItems = [];
    
    dropdowns.forEach((dropdown, index) => {
      const isVisible = dropdown.offsetHeight > 0 && dropdown.offsetWidth > 0;
      if (isVisible) {
        visibleCount++;
        visibleItems.push({
          index,
          text: dropdown.closest('li')?.textContent?.trim().substring(0, 20) || 'Unknown'
        });
      }
    });
    
    return { visibleCount, visibleItems };
  });
  
  console.log(`   📊 After rapid hover: ${afterRapidHover.visibleCount} dropdowns visible`);
  afterRapidHover.visibleItems.forEach(item => {
    console.log(`      - ${item.text}`);
  });
  
  await page.screenshot({ 
    path: 'screenshots/final-dropdown-03-after-rapid-hover.png', 
    fullPage: true 
  });
  
  // Step 5: Test mouse leave behavior
  console.log('🧪 Testing mouse leave behavior (should close dropdowns)');
  
  // Move mouse away from navigation area
  await page.mouse.move(400, 400);
  console.log('   📍 Mouse moved away from navigation area');
  
  // Wait for the timeout (300ms + buffer)
  await page.waitForTimeout(600);
  
  const afterMouseLeave = await page.evaluate(() => {
    const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
    let visibleCount = 0;
    dropdowns.forEach(dropdown => {
      const isVisible = dropdown.offsetHeight > 0 && dropdown.offsetWidth > 0;
      if (isVisible) visibleCount++;
    });
    return visibleCount;
  });
  
  console.log(`   📊 After mouse leave: ${afterMouseLeave} dropdowns visible`);
  
  await page.screenshot({ 
    path: 'screenshots/final-dropdown-04-after-mouse-leave.png', 
    fullPage: true 
  });
  
  // Step 6: Test single dropdown behavior (expected normal behavior)
  console.log('🧪 Testing single dropdown hover behavior');
  
  await page.hover(testItems[1].selector); // Hover over '產品與庫存'
  await page.waitForTimeout(400);
  
  const singleHoverResult = await page.evaluate(() => {
    const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
    let visibleCount = 0;
    const visibleDropdown = [];
    
    dropdowns.forEach((dropdown, index) => {
      const isVisible = dropdown.offsetHeight > 0 && dropdown.offsetWidth > 0;
      if (isVisible) {
        visibleCount++;
        // Get dropdown content for verification
        const content = Array.from(dropdown.querySelectorAll('a')).map(link => 
          link.textContent?.trim()
        ).filter(text => text && text.length > 0);
        
        visibleDropdown.push({
          index,
          content: content.slice(0, 3) // First 3 items
        });
      }
    });
    
    return { visibleCount, visibleDropdown };
  });
  
  console.log(`   📊 Single hover result: ${singleHoverResult.visibleCount} dropdown(s) visible`);
  singleHoverResult.visibleDropdown.forEach(dropdown => {
    console.log(`      Dropdown content: ${dropdown.content.join(', ')}`);
  });
  
  await page.screenshot({ 
    path: 'screenshots/final-dropdown-05-single-hover.png', 
    fullPage: true 
  });
  
  // Step 7: Final cleanup test
  console.log('🧪 Final cleanup test');
  
  await page.mouse.move(100, 100);
  await page.waitForTimeout(600);
  
  const finalCleanup = await page.evaluate(() => {
    const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
    let visibleCount = 0;
    dropdowns.forEach(dropdown => {
      const isVisible = dropdown.offsetHeight > 0 && dropdown.offsetWidth > 0;
      if (isVisible) visibleCount++;
    });
    return visibleCount;
  });
  
  await page.screenshot({ 
    path: 'screenshots/final-dropdown-06-final-cleanup.png', 
    fullPage: true 
  });
  
  // Step 8: Generate comprehensive report
  console.log('\n📋 COMPREHENSIVE NAVIGATION DROPDOWN TEST REPORT');
  console.log('================================================');
  
  console.log('\n🎯 ORIGINAL ISSUE TEST:');
  console.log(`   Multiple dropdowns after rapid hover: ${afterRapidHover.visibleCount}`);
  console.log(`   ✅ ISSUE STATUS: ${afterRapidHover.visibleCount <= 1 ? 'FIXED' : 'STILL EXISTS'}`);
  
  console.log('\n🎯 MOUSE LEAVE BEHAVIOR TEST:');
  console.log(`   Dropdowns after mouse leave: ${afterMouseLeave}`);
  console.log(`   ✅ TIMEOUT STATUS: ${afterMouseLeave === 0 ? 'WORKING' : 'BROKEN'}`);
  
  console.log('\n🎯 NORMAL OPERATION TEST:');
  console.log(`   Single hover dropdowns: ${singleHoverResult.visibleCount}`);
  console.log(`   ✅ NORMAL BEHAVIOR: ${singleHoverResult.visibleCount === 1 ? 'WORKING' : 'ISSUE'}`);
  
  console.log('\n🎯 CLEANUP TEST:');
  console.log(`   Final cleanup dropdowns: ${finalCleanup}`);
  console.log(`   ✅ CLEANUP STATUS: ${finalCleanup === 0 ? 'PERFECT' : 'INCOMPLETE'}`);
  
  // Overall assessment
  const originalIssueFixed = afterRapidHover.visibleCount <= 1;
  const mouseLeaveWorks = afterMouseLeave === 0;
  const normalBehaviorWorks = singleHoverResult.visibleCount === 1;
  const cleanupWorks = finalCleanup === 0;
  
  const allTestsPass = originalIssueFixed && mouseLeaveWorks && normalBehaviorWorks && cleanupWorks;
  
  console.log('\n🏆 OVERALL ASSESSMENT:');
  console.log(`   Original multiple dropdown issue: ${originalIssueFixed ? '✅ FIXED' : '❌ NOT FIXED'}`);
  console.log(`   Mouse leave timeout behavior: ${mouseLeaveWorks ? '✅ WORKING' : '❌ BROKEN'}`);
  console.log(`   Normal single dropdown behavior: ${normalBehaviorWorks ? '✅ WORKING' : '❌ BROKEN'}`);
  console.log(`   Final cleanup behavior: ${cleanupWorks ? '✅ WORKING' : '❌ BROKEN'}`);
  
  console.log(`\n🎖️  FINAL VERDICT: ${allTestsPass ? '✅ ALL NAVIGATION DROPDOWN FIXES WORKING CORRECTLY' : '⚠️ SOME ISSUES REMAIN'}`);
  
  // Test assertions based on user experience
  expect(originalIssueFixed, 'Multiple dropdowns should not stay open after rapid hover').toBe(true);
  expect(mouseLeaveWorks, 'Dropdowns should close when mouse leaves navigation area').toBe(true);
  expect(normalBehaviorWorks, 'Single dropdown should work normally').toBe(true);
  expect(cleanupWorks, 'All dropdowns should be closed after mouse moves away').toBe(true);
});