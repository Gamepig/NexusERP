const { test, expect } = require('@playwright/test');

test.describe('Direct Function Call Test', () => {
  test.setTimeout(30000);
  
  test('Test nextStep function directly', async ({ page }) => {
    console.log('Testing nextStep function directly...');
    
    // Capture all console messages to see your debug output
    page.on('console', msg => {
      console.log(`Browser Console [${msg.type()}]: ${msg.text()}`);
    });
    
    // Navigate and login
    await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
    await page.waitForTimeout(2000);
    
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    if (isLoginPage) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
      await page.waitForTimeout(3000);
    }
    
    // Wait for Alpine.js to initialize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/direct-test-01-initial.png', 
      fullPage: true 
    });
    
    // Test the nextStep function directly through Alpine.js context
    console.log('Calling nextStep function directly...');
    
    const functionCallResult = await page.evaluate(() => {
      // Find the Alpine.js component data
      const form = document.querySelector('[x-data]');
      if (!form) return 'No Alpine component found';
      
      // Try to access the Alpine data
      if (form._x_dataStack && form._x_dataStack[0]) {
        const data = form._x_dataStack[0];
        console.log('Initial current step:', data.currentStep);
        
        if (typeof data.nextStep === 'function') {
          console.log('nextStep function found, calling it...');
          data.nextStep();
          console.log('After nextStep, current step:', data.currentStep);
          return `nextStep called successfully, new step: ${data.currentStep}`;
        } else {
          return 'nextStep function not found in Alpine data';
        }
      } else {
        return 'Alpine data stack not accessible';
      }
    });
    
    console.log(`Function call result: ${functionCallResult}`);
    
    // Wait for any DOM updates
    await page.waitForTimeout(2000);
    
    // Take screenshot after function call
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/direct-test-02-after-call.png', 
      fullPage: true 
    });
    
    // Check the current visual state
    const visualState = await page.evaluate(() => {
      const step1 = document.querySelector('[x-show*="currentStep === 1"]');
      const step2 = document.querySelector('[x-show*="currentStep === 2"]'); 
      const step3 = document.querySelector('[x-show*="currentStep === 3"]');
      
      return {
        step1Visible: step1 ? step1.offsetParent !== null : 'not found',
        step2Visible: step2 ? step2.offsetParent !== null : 'not found',
        step3Visible: step3 ? step3.offsetParent !== null : 'not found'
      };
    });
    
    console.log('Visual state after nextStep:', JSON.stringify(visualState, null, 2));
    
    // Try clicking the actual button as well
    console.log('Attempting to click the actual Next Step button...');
    
    const buttonClickResult = await page.evaluate(() => {
      // Find buttons containing "下一步"
      const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.trim().includes('下一步')
      );
      
      if (buttons.length > 0) {
        console.log(`Found ${buttons.length} next step buttons`);
        buttons[0].click();
        return `Button clicked successfully, found ${buttons.length} buttons`;
      } else {
        return 'No next step buttons found';
      }
    });
    
    console.log(`Button click result: ${buttonClickResult}`);
    
    // Final state check and screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/direct-test-03-final.png', 
      fullPage: true 
    });
    
    console.log('Direct function test completed!');
  });
});