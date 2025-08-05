import { chromium } from 'playwright';
import fs from 'fs';

async function testNavigationDropdown() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 Starting NexusERP Navigation Dropdown Test...');
    
    // Navigate to the application
    console.log('📍 Navigating to http://127.0.0.1:8000');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/1-initial-page.png', fullPage: true });
    console.log('📸 Initial page screenshot saved');
    
    // Check if login form is present
    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible()) {
      console.log('🔐 Login form detected, logging in...');
      
      // Fill login credentials
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // Submit login form
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      console.log('✅ Login submitted');
    }
    
    // Wait for navigation to be visible
    await page.waitForSelector('nav', { timeout: 5000 });
    console.log('📐 Navigation found');
    
    // Take screenshot after login
    await page.screenshot({ path: 'screenshots/2-after-login.png', fullPage: true });
    console.log('📸 After login screenshot saved');
    
    // Test 1: Check exclusive dropdown behavior
    console.log('\n🧪 Test 1: Exclusive Dropdown Behavior');
    
    // Find all dropdown menu items
    const dropdownTriggers = await page.locator('nav [data-dropdown], nav .dropdown-trigger, nav .has-dropdown, nav li:has(ul)').all();
    console.log(`📋 Found ${dropdownTriggers.length} potential dropdown triggers`);
    
    if (dropdownTriggers.length === 0) {
      // Try alternative selectors
      const navItems = await page.locator('nav li, nav a').all();
      console.log(`📋 Found ${navItems.length} navigation items to test`);
      
      if (navItems.length > 0) {
        // Test hovering over navigation items
        for (let i = 0; i < Math.min(navItems.length, 5); i++) {
          const item = navItems[i];
          const text = await item.textContent();
          console.log(`🖱️  Hovering over: "${text}"`);
          
          await item.hover();
          await page.waitForTimeout(200); // Wait for dropdown to show
          
          // Check for visible dropdowns
          const visibleDropdowns = await page.locator('nav ul:visible, nav .dropdown:visible, .dropdown-menu:visible').count();
          console.log(`📊 Visible dropdowns after hover: ${visibleDropdowns}`);
          
          // Take screenshot
          await page.screenshot({ 
            path: `screenshots/3-hover-${i + 1}-${text?.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
            fullPage: true 
          });
        }
      }
    } else {
      // Test dropdown triggers
      for (let i = 0; i < dropdownTriggers.length; i++) {
        const trigger = dropdownTriggers[i];
        const text = await trigger.textContent();
        console.log(`🖱️  Hovering over dropdown trigger: "${text}"`);
        
        await trigger.hover();
        await page.waitForTimeout(200);
        
        // Check for visible dropdowns
        const visibleDropdowns = await page.locator('nav ul:visible, nav .dropdown:visible, .dropdown-menu:visible').count();
        console.log(`📊 Visible dropdowns: ${visibleDropdowns}`);
        
        // Take screenshot
        await page.screenshot({ 
          path: `screenshots/3-dropdown-${i + 1}-${text?.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
          fullPage: true 
        });
        
        // Test exclusive behavior - hover over another item
        if (i < dropdownTriggers.length - 1) {
          const nextTrigger = dropdownTriggers[i + 1];
          const nextText = await nextTrigger.textContent();
          console.log(`🔄 Testing exclusive behavior: hovering over "${nextText}"`);
          
          await nextTrigger.hover();
          await page.waitForTimeout(200);
          
          const visibleAfterSwitch = await page.locator('nav ul:visible, nav .dropdown:visible, .dropdown-menu:visible').count();
          console.log(`📊 Visible dropdowns after switch: ${visibleAfterSwitch}`);
          
          if (visibleAfterSwitch <= 1) {
            console.log('✅ Exclusive behavior working - only one or no dropdown visible');
          } else {
            console.log('❌ Multiple dropdowns visible - exclusive behavior may be broken');
          }
        }
      }
    }
    
    // Test 2: Mouse leave behavior
    console.log('\n🧪 Test 2: Mouse Leave Behavior');
    
    // Hover over navigation area
    await page.hover('nav');
    await page.waitForTimeout(200);
    
    const dropdownsBeforeLeave = await page.locator('nav ul:visible, nav .dropdown:visible, .dropdown-menu:visible').count();
    console.log(`📊 Dropdowns visible before mouse leave: ${dropdownsBeforeLeave}`);
    
    // Move mouse away from navigation
    await page.mouse.move(100, 100); // Move to top-left corner
    await page.waitForTimeout(150); // Wait for timeout (should be 100ms + buffer)
    
    const dropdownsAfterLeave = await page.locator('nav ul:visible, nav .dropdown:visible, .dropdown-menu:visible').count();
    console.log(`📊 Dropdowns visible after mouse leave: ${dropdownsAfterLeave}`);
    
    if (dropdownsAfterLeave === 0) {
      console.log('✅ Mouse leave behavior working - dropdowns closed');
    } else {
      console.log('❌ Mouse leave behavior may be broken - dropdowns still visible');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'screenshots/4-final-state.png', fullPage: true });
    
    // Test 3: Check for JavaScript errors
    console.log('\n🧪 Test 3: JavaScript Console Errors');
    
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    // Trigger some navigation interactions to catch errors
    await page.hover('nav');
    await page.waitForTimeout(100);
    await page.mouse.move(50, 50);
    await page.waitForTimeout(200);
    
    if (jsErrors.length === 0) {
      console.log('✅ No JavaScript errors detected');
    } else {
      console.log('❌ JavaScript errors detected:');
      jsErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Test 4: Specific method functionality  
    console.log('\n🧪 Test 4: Testing Specific Methods');
    
    try {
      // Test if the methods exist and are callable
      const methodTests = await page.evaluate(() => {
        const results = {};
        
        // Check if NavigationManager exists
        if (typeof window.NavigationManager !== 'undefined') {
          results.navigationManagerExists = true;
          
          // Test method existence
          results.methods = {
            smartShowDropdown: typeof window.NavigationManager.smartShowDropdown === 'function',
            scheduleHideDropdown: typeof window.NavigationManager.scheduleHideDropdown === 'function',
            hideAllDropdownsExcept: typeof window.NavigationManager.hideAllDropdownsExcept === 'function'
          };
          
          // Try to call methods (safely)
          try {
            if (results.methods.hideAllDropdownsExcept) {
              window.NavigationManager.hideAllDropdownsExcept();
              results.hideAllDropdownsExceptCalled = true;
            }
          } catch (e) {
            results.methodError = e.message;
          }
        } else {
          results.navigationManagerExists = false;
        }
        
        return results;
      });
      
      console.log('📋 Method test results:', JSON.stringify(methodTests, null, 2));
      
      if (methodTests.navigationManagerExists) {
        console.log('✅ NavigationManager exists');
        
        Object.entries(methodTests.methods || {}).forEach(([method, exists]) => {
          console.log(`${exists ? '✅' : '❌'} ${method}: ${exists ? 'exists' : 'missing'}`);
        });
        
        if (methodTests.hideAllDropdownsExceptCalled) {
          console.log('✅ hideAllDropdownsExcept method callable');
        }
        
        if (methodTests.methodError) {
          console.log(`❌ Method error: ${methodTests.methodError}`);
        }
      } else {
        console.log('❌ NavigationManager not found');
      }
      
    } catch (error) {
      console.log(`❌ Error testing methods: ${error.message}`);
    }
    
    console.log('\n✅ Navigation dropdown test completed!');
    console.log('📁 Screenshots saved in screenshots/ directory');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the test
testNavigationDropdown().catch(console.error);