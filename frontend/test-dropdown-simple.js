import { chromium } from 'playwright';
import fs from 'fs';

async function testDropdownSimple() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 Simple Navigation Dropdown Test...');
    
    // Login and get to dashboard
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.screenshot({ path: 'screenshots/dropdown-simple-01-login.png' });
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/dropdown-simple-02-login-filled.png' });
    
    await page.screenshot({ path: 'screenshots/dropdown-simple-03-dashboard.png' });
    console.log('✅ Logged in and on dashboard');
    
    // Set up error monitoring
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Test specific navigation items with dropdowns
    const navigationTests = [
      { text: '客戶關係管理', selector: 'text=客戶關係管理' },
      { text: '產品與庫存', selector: 'text=產品與庫存' }, 
      { text: '採購管理', selector: 'text=採購管理' },
      { text: '銷售管理', selector: 'text=銷售管理' },
      { text: '分析與報表', selector: 'text=分析與報表' }
    ];
    
    console.log('🧪 Testing navigation dropdowns...');
    
    for (let i = 0; i < navigationTests.length; i++) {
      const test = navigationTests[i];
      console.log(`\n📋 Test ${i + 1}: ${test.text}`);
      
      try {
        // Take before screenshot
        await page.screenshot({ 
          path: `screenshots/dropdown-simple-test-${i + 1}-before.png`,
          fullPage: true
        });
        
        // Find and hover over the navigation item
        const navItem = page.locator(test.selector).first();
        if (await navItem.isVisible()) {
          console.log(`   🖱️  Hovering over ${test.text}`);
          await navItem.hover();
          await page.waitForTimeout(300); // Wait for dropdown animation
          
          // Take after screenshot  
          await page.screenshot({ 
            path: `screenshots/dropdown-simple-test-${i + 1}-after.png`,
            fullPage: true
          });
          
          // Check for dropdown content
          const dropdownChecks = [
            'ul:visible',
            '.dropdown-menu:visible', 
            '.dropdown:visible ul',
            '[role="menu"]:visible',
            '.nav-dropdown:visible',
            '.menu:visible'
          ];
          
          let dropdownFound = false;
          for (const dropdownSelector of dropdownChecks) {
            const dropdownCount = await page.locator(dropdownSelector).count();
            if (dropdownCount > 0) {
              console.log(`   ✅ Found ${dropdownCount} dropdown(s) with selector: ${dropdownSelector}`);
              dropdownFound = true;
              break;
            }
          }
          
          if (!dropdownFound) {
            console.log('   ⚠️  No dropdown detected with standard selectors');
          }
          
          // Check if NavigationManager methods exist and work
          const methodTest = await page.evaluate(() => {
            if (typeof window.NavigationManager !== 'undefined') {
              return {
                exists: true,
                methods: {
                  smartShowDropdown: typeof window.NavigationManager.smartShowDropdown === 'function',
                  scheduleHideDropdown: typeof window.NavigationManager.scheduleHideDropdown === 'function',
                  hideAllDropdownsExcept: typeof window.NavigationManager.hideAllDropdownsExcept === 'function'
                }
              };
            }
            return { exists: false };
          });
          
          if (methodTest.exists) {
            console.log('   ✅ NavigationManager found');
            Object.entries(methodTest.methods).forEach(([method, exists]) => {
              console.log(`      ${exists ? '✅' : '❌'} ${method}`);
            });
          } else {
            console.log('   ❌ NavigationManager not found');
          }
          
          // Test exclusive behavior by moving to next item
          if (i < navigationTests.length - 1) {
            const nextTest = navigationTests[i + 1];
            console.log(`   🔄 Testing exclusive behavior with ${nextTest.text}`);
            
            const nextNavItem = page.locator(nextTest.selector).first();
            if (await nextNavItem.isVisible()) {
              await nextNavItem.hover();
              await page.waitForTimeout(200);
              
              // Count visible dropdowns after switch
              let totalDropdowns = 0;
              for (const dropdownSelector of dropdownChecks) {
                totalDropdowns += await page.locator(dropdownSelector).count();
              }
              
              console.log(`   📊 Total visible dropdowns after switch: ${totalDropdowns}`);
              
              if (totalDropdowns <= 1) {
                console.log('   ✅ Exclusive behavior working');
              } else {
                console.log('   ❌ Multiple dropdowns visible - exclusive behavior broken');
              }
            }
          }
          
          await page.screenshot({ 
            path: `screenshots/dropdown-simple-success-${i + 1}.png`,
            fullPage: true
          });
          
        } else {
          console.log(`   ❌ Navigation item "${test.text}" not visible`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error testing ${test.text}: ${error.message}`);
      }
    }
    
    // Test mouse leave behavior
    console.log('\n🧪 Testing mouse leave behavior...');
    
    // Hover over first item
    const firstItem = page.locator(navigationTests[0].selector).first();
    if (await firstItem.isVisible()) {
      await firstItem.hover();
      await page.waitForTimeout(200);
      
      // Move mouse completely away
      await page.mouse.move(100, 100);
      await page.waitForTimeout(200);
      
      // Check if dropdowns are hidden
      let remainingDropdowns = 0;
      const dropdownSelectors = ['ul:visible', '.dropdown-menu:visible', '.dropdown:visible ul'];
      
      for (const selector of dropdownSelectors) {
        remainingDropdowns += await page.locator(selector).count();
      }
      
      console.log(`📊 Dropdowns remaining after mouse leave: ${remainingDropdowns}`);
      
      if (remainingDropdowns === 0) {
        console.log('✅ Mouse leave behavior working - all dropdowns hidden');
      } else {
        console.log('❌ Mouse leave behavior broken - some dropdowns still visible');
      }
    }
    
    // Final report
    await page.screenshot({ path: 'screenshots/dropdown-simple-final-report.png', fullPage: true });
    
    console.log('\n📊 Final Report:');
    console.log(`🔍 JavaScript Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('❌ JavaScript Errors:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    console.log('\n✅ Simple dropdown test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/dropdown-simple-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the test
testDropdownSimple().catch(console.error);