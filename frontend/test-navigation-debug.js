import { chromium } from 'playwright';
import fs from 'fs';

async function testNavigationDebug() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized'] // Start with maximized window
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 } // Full HD viewport
  });
  const page = await context.newPage();
  
  try {
    console.log('🔍 Debug Navigation Dropdown Test...');
    
    // Login
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✅ Logged in successfully');
    
    // Take initial screenshot with larger viewport
    await page.screenshot({ 
      path: 'screenshots/debug-01-initial-with-debug-styles.png', 
      fullPage: true
    });
    
    // Add debug styles to visualize dropdowns
    await page.addStyleTag({
      content: `
        /* Debug styles to highlight dropdown elements */
        ul, .dropdown-menu, .dropdown, [role="menu"] {
          border: 2px solid red !important;
          background-color: rgba(255, 0, 0, 0.1) !important;
        }
        
        ul:visible, .dropdown-menu:visible, .dropdown:visible {
          border-color: lime !important;
          background-color: rgba(0, 255, 0, 0.2) !important;
          box-shadow: 0 0 10px lime !important;
        }
        
        /* Highlight navigation items */
        nav, .navbar, .navigation {
          outline: 2px solid blue !important;
        }
        
        /* Debug info for positioning */
        * {
          position: relative;
        }
        
        *:hover {
          outline: 1px solid orange !important;
        }
      `
    });
    
    // Test each navigation item individually
    const navItems = [
      '客戶關係管理',
      '產品與庫存', 
      '採購管理',
      '銷售管理',
      '分析與報表'
    ];
    
    for (let i = 0; i < navItems.length; i++) {
      const itemText = navItems[i];
      console.log(`\n🧪 Testing: ${itemText}`);
      
      try {
        // Find the navigation item
        const navItem = page.locator(`text=${itemText}`).first();
        
        if (await navItem.isVisible()) {
          console.log(`   ✅ Found navigation item: ${itemText}`);
          
          // Get element info before hover
          const beforeInfo = await page.evaluate((text) => {
            const elements = Array.from(document.querySelectorAll('*')).filter(el => 
              el.textContent && el.textContent.trim().includes(text)
            );
            
            return elements.map(el => ({
              tagName: el.tagName,
              className: el.className,
              id: el.id,
              textContent: el.textContent.trim().slice(0, 50),
              hasChildren: el.children.length > 0,
              children: Array.from(el.children).map(child => ({
                tagName: child.tagName,
                className: child.className,
                visible: !child.hidden && child.style.display !== 'none'
              }))
            }));
          }, itemText);
          
          console.log(`   📋 Before hover - Found ${beforeInfo.length} matching elements`);
          
          // Hover over the item
          await navItem.hover();
          await page.waitForTimeout(500); // Wait longer for animation
          
          // Take screenshot after hover
          await page.screenshot({ 
            path: `screenshots/debug-02-hover-${itemText}.png`, 
            fullPage: true
          });
          
          // Check for visible dropdowns with detailed analysis
          const dropdownAnalysis = await page.evaluate(() => {
            const dropdownSelectors = [
              'ul', 
              '.dropdown-menu', 
              '.dropdown', 
              '[role="menu"]',
              '.nav-dropdown',
              '.menu'
            ];
            
            const results = {};
            
            dropdownSelectors.forEach(selector => {
              const elements = document.querySelectorAll(selector);
              const visibleElements = Array.from(elements).filter(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0' &&
                       el.offsetHeight > 0 &&
                       el.offsetWidth > 0;
              });
              
              results[selector] = {
                total: elements.length,
                visible: visibleElements.length,
                positions: visibleElements.map(el => {
                  const rect = el.getBoundingClientRect();
                  return {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    textContent: el.textContent.slice(0, 100),
                    className: el.className,
                    id: el.id
                  };
                })
              };
            });
            
            return results;
          });
          
          console.log(`   📊 Dropdown analysis for ${itemText}:`);
          Object.entries(dropdownAnalysis).forEach(([selector, data]) => {
            if (data.visible > 0) {
              console.log(`      ✅ ${selector}: ${data.visible}/${data.total} visible`);
              data.positions.forEach((pos, idx) => {
                console.log(`         ${idx + 1}. Position: (${Math.round(pos.top)}, ${Math.round(pos.left)}) Size: ${Math.round(pos.width)}x${Math.round(pos.height)}`);
                if (pos.textContent.trim()) {
                  console.log(`            Content: "${pos.textContent.trim()}"`);
                }
              });
            } else {
              console.log(`      ❌ ${selector}: ${data.visible}/${data.total} visible`);
            }
          });
          
          // Test NavigationManager
          const navManagerTest = await page.evaluate(() => {
            const result = {
              windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('nav')),
              navigationManager: typeof window.NavigationManager !== 'undefined'
            };
            
            if (result.navigationManager) {
              result.methods = {};
              ['smartShowDropdown', 'scheduleHideDropdown', 'hideAllDropdownsExcept'].forEach(method => {
                result.methods[method] = typeof window.NavigationManager[method] === 'function';
              });
            }
            
            return result;
          });
          
          console.log(`   🧪 NavigationManager test:`);
          console.log(`      Exists: ${navManagerTest.navigationManager}`);
          console.log(`      Window nav keys: ${navManagerTest.windowKeys.join(', ')}`);
          
          if (navManagerTest.navigationManager) {
            Object.entries(navManagerTest.methods).forEach(([method, exists]) => {
              console.log(`      ${method}: ${exists ? '✅' : '❌'}`);
            });
          }
          
        } else {
          console.log(`   ❌ Navigation item not found: ${itemText}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error testing ${itemText}: ${error.message}`);
      }
    }
    
    // Final analysis screenshot
    await page.screenshot({ 
      path: 'screenshots/debug-03-final.png', 
      fullPage: true
    });
    
    console.log('\n✅ Debug navigation test completed!');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    await page.screenshot({ 
      path: 'screenshots/debug-error.png', 
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the test
testNavigationDebug().catch(console.error);