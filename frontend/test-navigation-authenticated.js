import { chromium } from 'playwright';
import fs from 'fs';

async function testNavigationDropdownAuthenticated() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 Starting Authenticated NexusERP Navigation Dropdown Test...');
    
    // Step 1: Navigate to login page directly
    console.log('📍 Navigating to login page: http://127.0.0.1:8000/login');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // Take login page screenshot
    await page.screenshot({ path: 'screenshots/auth-nav-01-login-page.png', fullPage: true });
    console.log('📸 Login page screenshot saved');
    
    // Step 2: Perform login
    console.log('🔐 Filling login credentials...');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Take filled form screenshot
    await page.screenshot({ path: 'screenshots/auth-nav-02-login-filled.png', fullPage: true });
    console.log('📸 Login form filled screenshot saved');
    
    // Submit login form
    console.log('🚀 Submitting login form...');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for redirect
    
    // Step 3: Verify we're on dashboard and take screenshot
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    await page.screenshot({ path: 'screenshots/auth-nav-03-after-login.png', fullPage: true });
    console.log('📸 After login screenshot saved');
    
    // Step 4: Navigate to dashboard if not already there
    if (!currentUrl.includes('dashboard') && !currentUrl.includes('home')) {
      console.log('🧭 Navigating to dashboard...');
      try {
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForLoadState('networkidle');
      } catch (e) {
        console.log('ℹ️  Dashboard route not found, trying /home...');
        try {
          await page.goto('http://127.0.0.1:8000/home');
          await page.waitForLoadState('networkidle');
        } catch (e2) {
          console.log('ℹ️  Home route not found, checking current page for navigation...');
        }
      }
    }
    
    // Step 5: Wait for navigation to be visible and take screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/auth-nav-04-dashboard.png', fullPage: true });
    console.log('📸 Dashboard screenshot saved');
    
    // Step 6: Find the navigation area with dropdowns
    console.log('🔍 Looking for navigation with dropdowns...');
    
    // Try different selectors for navigation
    const navSelectors = [
      'nav.navbar',
      '.navbar-nav',
      '.navigation',
      'header nav',
      '.main-navigation',
      '.sidebar-nav',
      '[data-navigation]'
    ];
    
    let navigationFound = false;
    let navElement = null;
    
    for (const selector of navSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        navElement = element;
        navigationFound = true;
        console.log(`✅ Navigation found with selector: ${selector}`);
        break;
      }
    }
    
    if (!navigationFound) {
      // Check for any navigation-like elements
      const possibleNavs = await page.locator('nav, .nav, .navigation, .navbar, .menu').all();
      console.log(`🔍 Found ${possibleNavs.length} possible navigation elements`);
      
      for (let i = 0; i < possibleNavs.length; i++) {
        const nav = possibleNavs[i];
        const isVisible = await nav.isVisible();
        console.log(`   Nav ${i + 1}: visible=${isVisible}`);
        if (isVisible && !navElement) {
          navElement = nav;
          navigationFound = true;
          console.log(`✅ Using navigation element ${i + 1}`);
          break;
        }
      }
    }
    
    if (!navigationFound) {
      console.log('❌ No navigation found. Taking full page screenshot for analysis...');
      await page.screenshot({ path: 'screenshots/auth-nav-05-no-navigation.png', fullPage: true });
      
      // Output page structure for debugging
      const pageStructure = await page.evaluate(() => {
        const structure = {
          title: document.title,
          url: window.location.href,
          bodyClasses: document.body.className,
          navElements: Array.from(document.querySelectorAll('nav, .nav, .navigation, .navbar, .menu')).map(el => ({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            visible: !el.hidden && el.style.display !== 'none',
            textContent: el.textContent.slice(0, 100)
          })),
          allElements: Array.from(document.querySelectorAll('*')).slice(0, 20).map(el => ({
            tagName: el.tagName,
            className: el.className,
            id: el.id
          }))
        };
        return structure;
      });
      
      console.log('📋 Page structure analysis:', JSON.stringify(pageStructure, null, 2));
      return;
    }
    
    // Step 7: Test dropdown behavior
    console.log('\n🧪 Testing Navigation Dropdown Behavior...');
    
    // Find dropdown triggers
    const dropdownSelectors = [
      'li:has(ul)',
      '.dropdown',
      '.has-dropdown',
      '[data-dropdown]',
      '.nav-item.dropdown',
      'li.dropdown'
    ];
    
    let dropdownTriggers = [];
    
    for (const selector of dropdownSelectors) {
      const elements = await navElement.locator(selector).all();
      if (elements.length > 0) {
        dropdownTriggers = elements;
        console.log(`✅ Found ${elements.length} dropdown triggers with selector: ${selector}`);
        break;
      }
    }
    
    if (dropdownTriggers.length === 0) {
      // Fallback: find all navigation links/items
      const navItems = await navElement.locator('a, li, .nav-item').all();
      console.log(`📋 Found ${navItems.length} navigation items to test`);
      dropdownTriggers = navItems.slice(0, 6); // Test first 6 items
    }
    
    // Test 1: Individual dropdown behavior
    console.log('\n🧪 Test 1: Individual Dropdown Behavior');
    
    for (let i = 0; i < dropdownTriggers.length; i++) {
      const trigger = dropdownTriggers[i];
      
      try {
        const text = await trigger.textContent();
        const cleanText = text?.trim().slice(0, 20) || `item-${i + 1}`;
        console.log(`🖱️  Testing item ${i + 1}: "${cleanText}"`);
        
        // Hover over the trigger
        await trigger.hover();
        await page.waitForTimeout(300); // Wait for dropdown animation
        
        // Count visible dropdowns
        const visibleDropdowns = await page.locator('ul:visible, .dropdown-menu:visible, .dropdown:visible .menu:visible').count();
        console.log(`   📊 Visible dropdowns: ${visibleDropdowns}`);
        
        // Take screenshot
        await page.screenshot({ 
          path: `screenshots/auth-nav-test-${i + 1}-${cleanText.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
          fullPage: true 
        });
        
        // Test exclusive behavior if we have multiple triggers
        if (i < dropdownTriggers.length - 1) {
          const nextTrigger = dropdownTriggers[i + 1];
          const nextText = await nextTrigger.textContent();
          const nextCleanText = nextText?.trim().slice(0, 20) || `item-${i + 2}`;
          
          console.log(`🔄 Testing exclusive behavior: switching to "${nextCleanText}"`);
          await nextTrigger.hover();
          await page.waitForTimeout(200);
          
          const visibleAfterSwitch = await page.locator('ul:visible, .dropdown-menu:visible, .dropdown:visible .menu:visible').count();
          console.log(`   📊 Visible after switch: ${visibleAfterSwitch}`);
          
          if (visibleAfterSwitch <= 1) {
            console.log('   ✅ Exclusive behavior working');
          } else {
            console.log('   ❌ Multiple dropdowns visible - exclusive behavior may be broken');
          }
        }
        
      } catch (error) {
        console.log(`   ⚠️  Error testing item ${i + 1}: ${error.message}`);
      }
    }
    
    // Test 2: Mouse leave behavior
    console.log('\n🧪 Test 2: Mouse Leave Behavior');
    
    // Hover over first dropdown trigger
    if (dropdownTriggers.length > 0) {
      await dropdownTriggers[0].hover();
      await page.waitForTimeout(200);
      
      const dropdownsBeforeLeave = await page.locator('ul:visible, .dropdown-menu:visible, .dropdown:visible .menu:visible').count();
      console.log(`📊 Dropdowns before mouse leave: ${dropdownsBeforeLeave}`);
      
      // Move mouse away from navigation area
      await page.mouse.move(100, 100);
      await page.waitForTimeout(200); // Wait for hide timeout
      
      const dropdownsAfterLeave = await page.locator('ul:visible, .dropdown-menu:visible, .dropdown:visible .menu:visible').count();
      console.log(`📊 Dropdowns after mouse leave: ${dropdownsAfterLeave}`);
      
      if (dropdownsAfterLeave < dropdownsBeforeLeave) {
        console.log('✅ Mouse leave behavior working - dropdowns reduced/closed');
      } else if (dropdownsAfterLeave === 0) {
        console.log('✅ Mouse leave behavior working - all dropdowns closed');
      } else {
        console.log('❌ Mouse leave behavior may be broken - dropdowns still visible');
      }
    }
    
    // Test 3: Check JavaScript console for errors
    console.log('\n🧪 Test 3: JavaScript Console Error Check');
    
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    // Trigger navigation interactions to catch errors
    if (dropdownTriggers.length > 0) {
      for (let i = 0; i < Math.min(dropdownTriggers.length, 3); i++) {
        await dropdownTriggers[i].hover();
        await page.waitForTimeout(100);
        await page.mouse.move(50, 50);
        await page.waitForTimeout(100);
      }
    }
    
    if (jsErrors.length === 0) {
      console.log('✅ No JavaScript errors detected during testing');
    } else {
      console.log('❌ JavaScript errors detected:');
      jsErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Test 4: Check for NavigationManager and specific methods
    console.log('\n🧪 Test 4: NavigationManager Method Test');
    
    const methodTest = await page.evaluate(() => {
      const results = {
        timestamp: new Date().toISOString(),
        windowObjects: Object.keys(window).filter(key => key.toLowerCase().includes('nav')),
        navigationManager: {
          exists: typeof window.NavigationManager !== 'undefined'
        }
      };
      
      if (results.navigationManager.exists) {
        results.navigationManager.methods = {
          smartShowDropdown: typeof window.NavigationManager.smartShowDropdown === 'function',
          scheduleHideDropdown: typeof window.NavigationManager.scheduleHideDropdown === 'function',
          hideAllDropdownsExcept: typeof window.NavigationManager.hideAllDropdownsExcept === 'function'
        };
        
        // Try to call a safe method
        try {
          if (window.NavigationManager.hideAllDropdownsExcept) {
            window.NavigationManager.hideAllDropdownsExcept(null);
            results.navigationManager.testCall = 'hideAllDropdownsExcept called successfully';
          }
        } catch (error) {
          results.navigationManager.testCall = `Error calling method: ${error.message}`;
        }
      }
      
      return results;
    });
    
    console.log('📋 NavigationManager test results:');
    console.log(JSON.stringify(methodTest, null, 2));
    
    if (methodTest.navigationManager.exists) {
      console.log('✅ NavigationManager exists on window object');
      
      Object.entries(methodTest.navigationManager.methods || {}).forEach(([method, exists]) => {
        console.log(`${exists ? '✅' : '❌'} ${method}: ${exists ? 'exists' : 'missing'}`);
      });
      
      if (methodTest.navigationManager.testCall) {
        console.log(`🧪 Test call result: ${methodTest.navigationManager.testCall}`);
      }
    } else {
      console.log('❌ NavigationManager not found on window object');
      console.log('🔍 Navigation-related window objects:', methodTest.windowObjects);
    }
    
    // Final screenshot
    await page.screenshot({ path: 'screenshots/auth-nav-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
    console.log('\n✅ Authenticated navigation dropdown test completed!');
    console.log('📁 Screenshots saved in screenshots/ directory');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/auth-nav-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory if it doesn't exist
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the test
testNavigationDropdownAuthenticated().catch(console.error);