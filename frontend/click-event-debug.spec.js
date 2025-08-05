import { test, expect } from '@playwright/test';

test.describe('Click Event Debug Test', () => {
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

  test('Debug click event binding and propagation', async ({ page }) => {
    console.log('調試點擊事件綁定和傳播...');
    
    // Wait for Alpine.js initialization
    await page.waitForTimeout(2000);
    
    // 1. Add event listeners to monitor all clicks
    await page.evaluate(() => {
      window.clickEvents = [];
      
      // Monitor all clicks on the page
      document.addEventListener('click', (e) => {
        window.clickEvents.push({
          target: e.target.tagName + (e.target.className ? '.' + e.target.className.split(' ').join('.') : ''),
          currentTarget: e.currentTarget.tagName,
          type: e.type,
          bubbles: e.bubbles,
          cancelable: e.cancelable,
          defaultPrevented: e.defaultPrevented,
          timestamp: Date.now()
        });
      }, true); // Use capture phase
      
      // Monitor Alpine.js method calls
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        const originalToggle = nav._x_dataStack[0].toggleUserMenu;
        nav._x_dataStack[0].toggleUserMenu = function(...args) {
          console.log('toggleUserMenu called with args:', args);
          window.clickEvents.push({
            type: 'method_call',
            method: 'toggleUserMenu',
            args: args,
            timestamp: Date.now()
          });
          return originalToggle.apply(this, args);
        };
      }
    });
    
    // 2. Get detailed information about the button element
    const buttonInfo = await page.evaluate(() => {
      const button = document.querySelector('.nexus-user-trigger');
      if (!button) return { error: 'Button not found' };
      
      return {
        tagName: button.tagName,
        className: button.className,
        id: button.id,
        hasClickAttr: button.hasAttribute('@click'),
        clickAttr: button.getAttribute('@click'),
        onclick: button.onclick ? 'function exists' : 'no function',
        disabled: button.disabled,
        type: button.type,
        parentTagName: button.parentElement.tagName,
        parentClassName: button.parentElement.className,
        hasAlpineParent: button.closest('[x-data]') !== null,
        alpineParentXData: button.closest('[x-data]')?.getAttribute('x-data')
      };
    });
    console.log('按鈕元素資訊:', buttonInfo);
    
    // 3. Check Alpine.js event binding status
    const alpineBindingInfo = await page.evaluate(() => {
      const button = document.querySelector('.nexus-user-trigger');
      if (!button) return { error: 'Button not found' };
      
      // Check if Alpine.js has processed this element
      const hasAlpineId = button.hasAttribute('x-id');
      const alpineId = button.getAttribute('x-id');
      
      // Check for Alpine event listeners
      const eventListeners = [];
      try {
        // Try to get event listeners (this might not work in all browsers)
        if (getEventListeners) {
          const listeners = getEventListeners(button);
          Object.keys(listeners).forEach(event => {
            eventListeners.push({
              event: event,
              count: listeners[event].length
            });
          });
        }
      } catch (e) {
        eventListeners.push({ error: 'Cannot access event listeners' });
      }
      
      return {
        hasAlpineId,
        alpineId,
        eventListeners,
        hasXClickAttr: button.hasAttribute('x-click'),
        hasAtClickAttr: button.hasAttribute('@click'),
        atClickValue: button.getAttribute('@click')
      };
    });
    console.log('Alpine.js 綁定資訊:', alpineBindingInfo);
    
    // 4. Take screenshot before interaction
    await page.screenshot({ path: 'click-debug-01-before-click.png', fullPage: true });
    
    // 5. Clear previous events and perform click
    await page.evaluate(() => {
      window.clickEvents = [];
    });
    
    console.log('執行點擊...');
    const userTrigger = page.locator('.nexus-user-trigger');
    await userTrigger.click();
    await page.waitForTimeout(1000);
    
    // 6. Get click events and state after click
    const clickEvents = await page.evaluate(() => window.clickEvents);
    console.log('點擊事件記錄:', clickEvents);
    
    const stateAfterClick = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        return {
          showUserMenu: nav._x_dataStack[0].showUserMenu,
          activeDropdown: nav._x_dataStack[0].activeDropdown,
          justOpened: nav._x_dataStack[0].justOpened
        };
      }
      return { error: 'Alpine data not found' };
    });
    console.log('點擊後狀態:', stateAfterClick);
    
    // 7. Take screenshot after click
    await page.screenshot({ path: 'click-debug-02-after-click.png', fullPage: true });
    
    // 8. Test different click methods
    console.log('測試不同的點擊方法...');
    
    // Reset state
    await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        nav._x_dataStack[0].showUserMenu = false;
      }
      window.clickEvents = [];
    });
    
    // Method 1: Direct element click via JavaScript
    console.log('方法 1: JavaScript 直接點擊');
    await page.evaluate(() => {
      const button = document.querySelector('.nexus-user-trigger');
      if (button) {
        button.click();
      }
    });
    await page.waitForTimeout(500);
    
    const method1Events = await page.evaluate(() => window.clickEvents);
    const method1State = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      return nav && nav._x_dataStack && nav._x_dataStack[0] ? nav._x_dataStack[0].showUserMenu : 'error';
    });
    console.log('方法 1 結果:', { events: method1Events.length, state: method1State });
    
    // Reset state
    await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      if (nav && nav._x_dataStack && nav._x_dataStack[0]) {
        nav._x_dataStack[0].showUserMenu = false;
      }
      window.clickEvents = [];
    });
    
    // Method 2: Dispatch click event
    console.log('方法 2: 派發點擊事件');
    await page.evaluate(() => {
      const button = document.querySelector('.nexus-user-trigger');
      if (button) {
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        button.dispatchEvent(event);
      }
    });
    await page.waitForTimeout(500);
    
    const method2Events = await page.evaluate(() => window.clickEvents);
    const method2State = await page.evaluate(() => {
      const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
      return nav && nav._x_dataStack && nav._x_dataStack[0] ? nav._x_dataStack[0].showUserMenu : 'error';
    });
    console.log('方法 2 結果:', { events: method2Events.length, state: method2State });
    
    // 9. Check if Alpine.js is properly initialized
    const alpineStatus = await page.evaluate(() => {
      return {
        alpineExists: typeof window.Alpine !== 'undefined',
        alpineStarted: window.Alpine && window.Alpine.version,
        alpineStore: window.Alpine && typeof window.Alpine.store === 'function',
        deferredMutations: window.Alpine && window.Alpine.deferredMutations ? window.Alpine.deferredMutations.length : 'unknown'
      };
    });
    console.log('Alpine.js 狀態:', alpineStatus);
    
    // 10. Test with a simple Alpine component to see if @click works at all
    console.log('測試簡單的 Alpine.js @click 功能...');
    await page.evaluate(() => {
      // Create a test element with @click
      const testDiv = document.createElement('div');
      testDiv.setAttribute('x-data', '{ test: false }');
      testDiv.innerHTML = '<button id="test-alpine-button" @click="test = !test" x-text="test ? \'Clicked\' : \'Not clicked\'">Not clicked</button>';
      document.body.appendChild(testDiv);
    });
    
    await page.waitForTimeout(500);
    
    // Click the test button
    const testButton = page.locator('#test-alpine-button');
    await testButton.click();
    await page.waitForTimeout(500);
    
    const testButtonText = await testButton.textContent();
    console.log(`測試按鈕文字: ${testButtonText}`);
    
    // 11. Final summary
    console.log('\n=== 點擊事件調試總結 ===');
    console.log(`按鈕元素存在: ${buttonInfo.error ? '❌' : '✅'}`);
    console.log(`@click 屬性存在: ${buttonInfo.hasClickAttr ? '✅' : '❌'}`);
    console.log(`@click 屬性值: ${buttonInfo.clickAttr}`);
    console.log(`Alpine.js 父元素: ${buttonInfo.hasAlpineParent ? '✅' : '❌'}`);
    console.log(`Playwright 點擊事件: ${clickEvents.length} 個`);
    console.log(`JavaScript 點擊事件: ${method1Events.length} 個`);
    console.log(`派發點擊事件: ${method2Events.length} 個`);
    console.log(`點擊後狀態變更: ${stateAfterClick.showUserMenu ? '✅' : '❌'}`);
    console.log(`Alpine.js 基本功能: ${testButtonText === 'Clicked' ? '✅' : '❌'}`);
  });
});