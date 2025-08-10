const { test, expect } = require('@playwright/test');

test.describe('Manual Step Navigation Test', () => {
  test.setTimeout(30000);
  
  test('Manual button click test', async ({ page }) => {
    console.log('Starting manual step test...');
    
    // Capture all console messages including your debug logs
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
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/manual-test-01-initial.png', 
      fullPage: true 
    });
    
    // Fill form fields first to satisfy validation
    console.log('Filling required form fields...');
    
    // Select customer
    await page.selectOption('select[name="customer_id"]', { index: 1 });
    console.log('Customer selected');
    
    // Fill quote date
    await page.fill('input[name="quote_date"]', '2025-08-06');
    console.log('Quote date filled');
    
    // Fill valid until date  
    await page.fill('input[name="valid_until"]', '2025-09-06');
    console.log('Valid until date filled');
    
    await page.waitForTimeout(1000);
    
    // Take screenshot after form fill
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/manual-test-02-form-filled.png', 
      fullPage: true 
    });
    
    // Now manually trigger the nextStep function using JavaScript
    console.log('Triggering nextStep function manually...');
    
    const nextStepResult = await page.evaluate(() => {
      // Check if nextStep function exists in window
      if (typeof window.nextStep === 'function') {
        console.log('nextStep function found, calling it...');
        try {
          window.nextStep();
          return 'nextStep function called successfully';
        } catch (error) {
          return `Error calling nextStep: ${error.message}`;
        }
      } else {
        return 'nextStep function not found in window';
      }
    });
    
    console.log(`Next step result: ${nextStepResult}`);
    
    // Wait for any animations or updates
    await page.waitForTimeout(2000);
    
    // Take screenshot after nextStep call
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/manual-test-03-after-nextstep.png', 
      fullPage: true 
    });
    
    // Check current step state
    const stepState = await page.evaluate(() => {
      // Look for current step indicators
      const step1 = document.querySelector('#step-1') ? 
        (document.querySelector('#step-1').style.display !== 'none' ? 'visible' : 'hidden') : 'not found';
      const step2 = document.querySelector('#step-2') ? 
        (document.querySelector('#step-2').style.display !== 'none' ? 'visible' : 'hidden') : 'not found';
      const step3 = document.querySelector('#step-3') ? 
        (document.querySelector('#step-3').style.display !== 'none' ? 'visible' : 'hidden') : 'not found';
        
      return {
        step1: step1,
        step2: step2, 
        step3: step3,
        currentStep: window.currentStep || 'unknown'
      };
    });
    
    console.log('Step state after nextStep:', JSON.stringify(stepState, null, 2));
    
    // Try clicking the actual button as well
    const buttonExists = await page.locator('text=下一步').isVisible();
    console.log(`Next step button visible: ${buttonExists}`);
    
    if (buttonExists) {
      console.log('Clicking the actual 下一步 button...');
      await page.click('text=下一步');
      await page.waitForTimeout(2000);
      
      // Take screenshot after button click
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/manual-test-04-after-button-click.png', 
        fullPage: true 
      });
      
      // Check step state again
      const finalStepState = await page.evaluate(() => {
        return {
          step1Display: document.querySelector('#step-1')?.style.display,
          step2Display: document.querySelector('#step-2')?.style.display,
          step3Display: document.querySelector('#step-3')?.style.display,
          currentStep: window.currentStep || 'unknown',
          step1Visible: document.querySelector('#step-1')?.offsetParent !== null,
          step2Visible: document.querySelector('#step-2')?.offsetParent !== null,
          step3Visible: document.querySelector('#step-3')?.offsetParent !== null
        };
      });
      
      console.log('Final step state:', JSON.stringify(finalStepState, null, 2));
    }
    
    console.log('Manual step test completed!');
  });
});