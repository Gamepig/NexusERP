import { test, expect } from '@playwright/test';

test.describe('Dropdown Fix Test', () => {
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

  test('Test and fix Alpine.js context binding issue', async ({ page }) => {
    console.log('測試並修復 Alpine.js 上下文綁定問題...');
    
    // Wait for Alpine.js initialization
    await page.waitForTimeout(2000);
    
    // 1. Apply the fix by modifying the Alpine.js component
    console.log('應用修復...');
    
    const fixApplied = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (!nav || !nav._x_dataStack || !nav._x_dataStack[0]) {
        return { success: false, reason: 'Alpine data not found' };
      }
      
      const data = nav._x_dataStack[0];
      
      // Store original method
      const originalToggle = data.toggleUserMenu;
      
      // Create a new method that ensures proper context binding
      data.toggleUserMenu = function() {
        console.log('🔧 Fixed toggleUserMenu called');
        
        // Ensure we're working with the correct context
        const self = this;
        
        // Clear any timeout
        if (self.userCloseTimeout) {
          clearTimeout(self.userCloseTimeout);
          self.userCloseTimeout = null;
        }
        
        // Toggle logic with explicit context
        if (self.showUserMenu) {
          console.log('🔧 Closing menu');
          self.showUserMenu = false;
          self.activeDropdown = null;
        } else {
          console.log('🔧 Opening menu');
          
          // Close other menus if method exists
          if (typeof self.closeOtherMenus === 'function') {
            self.closeOtherMenus.call(self);
          }
          
          // Set state with explicit context
          self.showUserMenu = true;
          self.activeDropdown = 'user';
          self.justOpened = true;
          
          // Set timeout with proper context
          setTimeout(function() {
            self.justOpened = false;
          }, 300);
        }
        
        console.log('🔧 Fixed method completed, state:', {
          showUserMenu: self.showUserMenu,
          activeDropdown: self.activeDropdown
        });
        
        // Force Alpine.js reactivity update
        if (window.Alpine && window.Alpine.nextTick) {
          window.Alpine.nextTick(() => {
            console.log('🔧 Alpine nextTick executed');
          });
        }
        
        return true; // Indicate success
      };
      
      // Also try alternative approach: use x-on instead of @click
      const button = document.querySelector('.nexus-user-trigger');
      if (button) {
        // Remove existing @click
        button.removeAttribute('@click');
        
        // Add new click handler that explicitly calls the method
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          console.log('🔧 Direct click handler called');
          const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
          if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
            nav._x_dataStack[0].toggleUserMenu();
          }
        });
        
        return { success: true, method: 'direct_handler' };
      }
      
      return { success: true, method: 'alpine_fix' };
    });
    
    console.log('修復應用結果:', fixApplied);
    
    // 2. Test the fix
    console.log('測試修復後的功能...');
    
    await page.screenshot({ path: 'fix-test-01-before-click.png', fullPage: true });
    
    // Get initial state
    const initialState = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      return nav && nav._x_dataStack && nav._x_dataStack[0] ? {
        showUserMenu: nav._x_dataStack[0].showUserMenu,
        activeDropdown: nav._x_dataStack[0].activeDropdown
      } : null;
    });
    console.log('初始狀態:', initialState);
    
    // Click the button
    const userTrigger = page.locator('.nexus-user-trigger');
    await userTrigger.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'fix-test-02-after-click.png', fullPage: true });
    
    // Check state after click
    const stateAfterClick = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      const state = nav && nav._x_dataStack && nav._x_dataStack[0] ? {
        showUserMenu: nav._x_dataStack[0].showUserMenu,
        activeDropdown: nav._x_dataStack[0].activeDropdown,
        justOpened: nav._x_dataStack[0].justOpened
      } : null;
      
      // Also check dropdown visibility
      const dropdown = document.querySelector('.nexus-user-dropdown');
      const dropdownVisible = dropdown ? dropdown.offsetParent !== null : false;
      
      return {
        alpineState: state,
        dropdownVisible: dropdownVisible
      };
    });
    
    console.log('點擊後狀態:', stateAfterClick);
    
    // 3. Try alternative fix if first one didn't work
    if (!stateAfterClick.alpineState?.showUserMenu) {
      console.log('嘗試替代修復方案...');
      
      // Alternative fix: Use $nextTick and force reactivity
      await page.evaluate(() => {
        const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
        if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
          const data = nav._x_dataStack[0];
          
          // Force state change and reactivity
          data.showUserMenu = true;
          data.activeDropdown = 'user';
          
          // Trigger Alpine.js reactivity manually
          if (nav.dispatchEvent) {
            const event = new CustomEvent('x-data-changed', { bubbles: true });
            nav.dispatchEvent(event);
          }
          
          // Also try to trigger x-show re-evaluation
          const dropdown = document.querySelector('[x-show="showUserMenu"]');
          if (dropdown && window.Alpine) {
            // Force Alpine to re-evaluate the x-show directive
            const alpineEl = window.Alpine.closestDataStack(dropdown);
            if (alpineEl && alpineEl[0]) {
              alpineEl[0].showUserMenu = true;
            }
          }
        }
      });
      
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'fix-test-03-alternative-fix.png', fullPage: true });
      
      const alternativeResult = await page.evaluate(() => {
        const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
        const state = nav && nav._x_dataStack && nav._x_dataStack[0] ? nav._x_dataStack[0].showUserMenu : null;
        const dropdown = document.querySelector('.nexus-user-dropdown');
        const dropdownVisible = dropdown ? dropdown.offsetParent !== null : false;
        
        return { showUserMenu: state, dropdownVisible };
      });
      
      console.log('替代修復結果:', alternativeResult);
    }
    
    // 4. Try the simplest fix: bypass Alpine.js x-show and use direct DOM manipulation
    console.log('嘗試直接 DOM 操作修復...');
    
    await page.evaluate(() => {
      const button = document.querySelector('.nexus-user-trigger');
      const dropdown = document.querySelector('.nexus-user-dropdown');
      
      if (button && dropdown) {
        // Remove all existing event listeners and Alpine bindings
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Create a simple toggle function
        let isOpen = false;
        
        newButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          isOpen = !isOpen;
          
          if (isOpen) {
            dropdown.style.display = 'block';
            dropdown.style.visibility = 'visible';
            dropdown.style.opacity = '1';
            dropdown.style.transform = 'scale(1)';
            dropdown.style.pointerEvents = 'auto';
            newButton.setAttribute('aria-expanded', 'true');
          } else {
            dropdown.style.display = 'none';
            dropdown.style.visibility = 'hidden';
            dropdown.style.opacity = '0';
            dropdown.style.transform = 'scale(0.95)';
            dropdown.style.pointerEvents = 'none';
            newButton.setAttribute('aria-expanded', 'false');
          }
          
          console.log('🔧 Direct DOM toggle:', isOpen);
        });
        
        // Handle outside clicks
        document.addEventListener('click', function(e) {
          if (!dropdown.contains(e.target) && !newButton.contains(e.target)) {
            isOpen = false;
            dropdown.style.display = 'none';
            dropdown.style.visibility = 'hidden';
            dropdown.style.opacity = '0';
            dropdown.style.transform = 'scale(0.95)';
            dropdown.style.pointerEvents = 'none';
            newButton.setAttribute('aria-expanded', 'false');
          }
        });
        
        return { success: true, method: 'direct_dom' };
      }
      
      return { success: false, reason: 'Elements not found' };
    });
    
    await page.waitForTimeout(500);
    
    // Test the direct DOM fix
    console.log('測試直接 DOM 修復...');
    
    const fixedButton = page.locator('.nexus-user-trigger');
    await fixedButton.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'fix-test-04-dom-fix.png', fullPage: true });
    
    const domFixResult = await page.evaluate(() => {
      const dropdown = document.querySelector('.nexus-user-dropdown');
      const button = document.querySelector('.nexus-user-trigger');
      
      return {
        dropdownVisible: dropdown ? dropdown.offsetParent !== null : false,
        dropdownDisplay: dropdown ? dropdown.style.display : 'not found',
        buttonAriaExpanded: button ? button.getAttribute('aria-expanded') : 'not found'
      };
    });
    
    console.log('直接 DOM 修復結果:', domFixResult);
    
    // 5. Final verification - click again to test toggle
    console.log('最終驗證 - 測試切換功能...');
    
    await fixedButton.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'fix-test-05-toggle-test.png', fullPage: true });
    
    const toggleResult = await page.evaluate(() => {
      const dropdown = document.querySelector('.nexus-user-dropdown');
      return {
        dropdownVisible: dropdown ? dropdown.offsetParent !== null : false,
        dropdownDisplay: dropdown ? dropdown.style.display : 'not found'
      };
    });
    
    console.log('切換測試結果:', toggleResult);
    
    // Summary
    console.log('\n=== 修復測試總結 ===');
    console.log(`修復應用成功: ${fixApplied.success ? '✅' : '❌'}`);
    console.log(`Alpine.js 修復: ${stateAfterClick.alpineState?.showUserMenu ? '✅' : '❌'}`);
    console.log(`直接 DOM 修復: ${domFixResult.dropdownVisible ? '✅' : '❌'}`);
    console.log(`切換功能: ${!toggleResult.dropdownVisible ? '✅' : '❌'} (should be closed after second click)`);
    
    // Test dropdown content and functionality
    if (domFixResult.dropdownVisible || stateAfterClick.dropdownVisible) {
      console.log('測試下拉選單內容...');
      
      // Click to open if closed
      if (!domFixResult.dropdownVisible) {
        await fixedButton.click();
        await page.waitForTimeout(500);
      }
      
      // Check dropdown menu items
      const menuItems = await page.locator('.nexus-user-menu-item').count();
      console.log(`下拉選單項目數量: ${menuItems}`);
      
      if (menuItems > 0) {
        const firstMenuItem = page.locator('.nexus-user-menu-item').first();
        const itemText = await firstMenuItem.textContent();
        console.log(`第一個選單項目: ${itemText}`);
      }
      
      await page.screenshot({ path: 'fix-test-06-dropdown-content.png', fullPage: true });
    }
  });
});