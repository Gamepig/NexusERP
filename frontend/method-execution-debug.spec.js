import { test, expect } from '@playwright/test';

test.describe('Method Execution Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and login
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Handle login if redirected
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  });

  test('Debug toggleUserMenu method execution step by step', async ({ page }) => {
    console.log('調試 toggleUserMenu 方法執行過程...');
    
    // Wait for Alpine.js initialization
    await page.waitForTimeout(2000);
    
    // 1. Instrument the toggleUserMenu method to add logging
    await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        const data = nav._x_dataStack[0];
        const originalToggle = data.toggleUserMenu;
        
        data.toggleUserMenu = function() {
          console.log('🔍 toggleUserMenu started');
          console.log('  - Initial state:', {
            showUserMenu: this.showUserMenu,
            userCloseTimeout: this.userCloseTimeout !== null,
            activeDropdown: this.activeDropdown,
            justOpened: this.justOpened
          });
          
          // Clear timeout step
          if (this.userCloseTimeout) {
            console.log('  - Clearing userCloseTimeout');
            clearTimeout(this.userCloseTimeout);
            this.userCloseTimeout = null;
          } else {
            console.log('  - No userCloseTimeout to clear');
          }
          
          // Check current state
          if (this.showUserMenu) {
            console.log('  - Closing menu (showUserMenu was true)');
            this.showUserMenu = false;
            this.activeDropdown = null;
          } else {
            console.log('  - Opening menu (showUserMenu was false)');
            
            // Call closeOtherMenus
            console.log('  - Calling closeOtherMenus()');
            if (typeof this.closeOtherMenus === 'function') {
              this.closeOtherMenus();
            } else {
              console.log('  - closeOtherMenus is not a function!');
            }
            
            // Set state
            console.log('  - Setting showUserMenu = true');
            this.showUserMenu = true;
            console.log('  - Setting activeDropdown = "user"');
            this.activeDropdown = 'user';
            
            // Set protection
            console.log('  - Setting justOpened = true');
            this.justOpened = true;
            setTimeout(() => {
              console.log('  - Setting justOpened = false (after timeout)');
              this.justOpened = false;
            }, 300);
          }
          
          console.log('  - Final state:', {
            showUserMenu: this.showUserMenu,
            activeDropdown: this.activeDropdown,
            justOpened: this.justOpened
          });
          console.log('🔍 toggleUserMenu ended');
          
          // Store execution log for retrieval
          window.toggleExecutionLog = {
            executed: true,
            timestamp: Date.now(),
            finalState: {
              showUserMenu: this.showUserMenu,
              activeDropdown: this.activeDropdown,
              justOpened: this.justOpened
            }
          };
        };
        
        console.log('✅ toggleUserMenu method instrumented');
      } else {
        console.log('❌ Failed to find Alpine.js data');
      }
    });
    
    // 2. Clear any previous execution logs
    await page.evaluate(() => {
      window.toggleExecutionLog = null;
      console.clear();
    });
    
    // 3. Click the button and monitor console
    console.log('點擊按鈕並監控 console...');
    
    const userTrigger = page.locator('.nexus-user-trigger');
    await userTrigger.click();
    await page.waitForTimeout(1000);
    
    // 4. Get execution log and Alpine state
    const executionResults = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      const alpineState = nav && nav._x_dataStack && nav._x_dataStack[0] ? {
        showUserMenu: nav._x_dataStack[0].showUserMenu,
        activeDropdown: nav._x_dataStack[0].activeDropdown,
        justOpened: nav._x_dataStack[0].justOpened,
        userCloseTimeout: nav._x_dataStack[0].userCloseTimeout !== null
      } : null;
      
      return {
        executionLog: window.toggleExecutionLog,
        currentAlpineState: alpineState
      };
    });
    
    console.log('執行結果:', executionResults);
    
    // 5. Test direct method call to compare
    console.log('測試直接方法調用以比較...');
    
    await page.evaluate(() => {
      window.directCallLog = null;
      console.clear();  
      
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        console.log('直接調用 toggleUserMenu...');
        nav._x_dataStack[0].toggleUserMenu();
      }
    });
    
    await page.waitForTimeout(500);
    
    const directCallResults = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      const alpineState = nav && nav._x_dataStack && nav._x_dataStack[0] ? {
        showUserMenu: nav._x_dataStack[0].showUserMenu,
        activeDropdown: nav._x_dataStack[0].activeDropdown,
        justOpened: nav._x_dataStack[0].justOpened
      } : null;
      
      return {
        executionLog: window.toggleExecutionLog,
        currentAlpineState: alpineState
      };
    });
    
    console.log('直接調用結果:', directCallResults);
    
    // 6. Test if Alpine.js reactive updates are working
    console.log('測試 Alpine.js 響應式更新...');
    
    const reactiveTest = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        const data = nav._x_dataStack[0];
        
        // Test 1: Direct property assignment
        console.log('Test 1: 直接屬性賦值');
        const before = data.showUserMenu;
        data.showUserMenu = !data.showUserMenu;
        const after = data.showUserMenu;
        
        console.log(`Before: ${before}, After: ${after}`);
        
        // Test 2: Check if the DOM updates
        setTimeout(() => {
          const dropdown = document.querySelector('[x-show="showUserMenu"]');
          if (dropdown) {
            const isVisible = dropdown.offsetParent !== null;
            console.log(`DOM element visible after direct assignment: ${isVisible}`);
            window.reactiveTestResult = {
              beforeState: before,
              afterState: after,
              domVisible: isVisible
            };
          }
        }, 100);
        
        return {
          beforeState: before,
          afterState: after,
          testCompleted: true
        };
      }
      return { error: 'Alpine data not found' };
    });
    
    console.log('響應式測試結果:', reactiveTest);
    
    // Wait for DOM update check
    await page.waitForTimeout(500);
    
    const finalReactiveTest = await page.evaluate(() => window.reactiveTestResult || null);
    console.log('最終響應式測試結果:', finalReactiveTest);
    
    // 7. Check if x-show is working with manual state change
    const xShowTest = await page.evaluate(() => {
      const dropdown = document.querySelector('[x-show="showUserMenu"]');
      if (!dropdown) return { error: 'Dropdown element not found' };
      
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (!nav || !nav._x_dataStack || !nav._x_dataStack[0]) {
        return { error: 'Alpine data not found' };
      }
      
      const data = nav._x_dataStack[0];
      
      // Force showUserMenu to true and check x-show
      data.showUserMenu = true;
      
      // Wait a tick for Alpine to process
      return new Promise(resolve => {
        setTimeout(() => {
          const isVisible = dropdown.offsetParent !== null;
          const computedStyle = getComputedStyle(dropdown);
          
          resolve({
            showUserMenuValue: data.showUserMenu,
            dropdownVisible: isVisible,
            displayStyle: computedStyle.display,
            visibilityStyle: computedStyle.visibility,
            xShowAttribute: dropdown.getAttribute('x-show')
          });
        }, 100);
      });
    });
    
    const xShowResult = await xShowTest;
    console.log('x-show 測試結果:', xShowResult);
    
    // 8. Final screenshots
    await page.screenshot({ path: 'method-debug-final.png', fullPage: true });
    
    // Summary
    console.log('\n=== 方法執行調試總結 ===');
    console.log(`方法被調用: ${executionResults.executionLog ? '✅' : '❌'}`);
    console.log(`點擊後狀態更新: ${executionResults.currentAlpineState?.showUserMenu ? '✅' : '❌'}`);
    console.log(`直接調用狀態更新: ${directCallResults.currentAlpineState?.showUserMenu ? '✅' : '❌'}`);
    console.log(`直接屬性賦值: ${reactiveTest.testCompleted && reactiveTest.afterState ? '✅' : '❌'}`);
    console.log(`x-show 響應: ${xShowResult.dropdownVisible ? '✅' : '❌'}`);
  });
});