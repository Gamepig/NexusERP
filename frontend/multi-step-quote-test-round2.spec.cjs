const { test, expect } = require('@playwright/test');

test.describe('Multi-Step Quote Form - Round 2 Testing', () => {
  test.setTimeout(60000);
  
  test('Comprehensive multi-step form test after bug fixes', async ({ page }) => {
    console.log('Starting comprehensive multi-step quote form test...');
    
    // Navigate to multi-step quote form
    await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
    
    // Wait for page load and take initial screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/round2-01-initial-load.png', fullPage: true });
    
    // Check if login is required
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    if (isLoginPage) {
      console.log('Login required, performing authentication...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // Navigate to multi-step form again after login
      await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
      await page.waitForTimeout(2000);
    }
    
    // Take screenshot after authentication
    await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/round2-02-after-auth.png', fullPage: true });
    
    // Wait for the form to be fully loaded
    await page.waitForSelector('.step-content', { timeout: 10000 });
    console.log('Multi-step form loaded successfully');
    
    // Check console output for debugging logs
    console.log('Checking for JavaScript console logs...');
    page.on('console', msg => {
      console.log(`Browser console [${msg.type()}]: ${msg.text()}`);
    });
    
    // Verify step 1 is visible
    const step1Visible = await page.locator('#step-1').isVisible();
    console.log(`Step 1 visible: ${step1Visible}`);
    
    // Fill step 1 form
    console.log('Filling Step 1 - Basic Quote Information...');
    
    // Fill customer selection
    const customerSelect = await page.locator('select[name="customer_id"]');
    if (await customerSelect.isVisible()) {
      await customerSelect.selectOption({ index: 1 }); // Select first customer option
      console.log('Customer selected');
    }
    
    // Fill quote date
    const quoteDateInput = await page.locator('input[name="quote_date"]');
    if (await quoteDateInput.isVisible()) {
      await quoteDateInput.fill('2025-08-06');
      console.log('Quote date filled');
    }
    
    // Fill valid until date
    const validUntilInput = await page.locator('input[name="valid_until"]');
    if (await validUntilInput.isVisible()) {
      await validUntilInput.fill('2025-09-06');
      console.log('Valid until date filled');
    }
    
    // Take screenshot after filling step 1
    await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/round2-03-step1-filled.png', fullPage: true });
    
    // Test Next Step functionality
    console.log('Testing Next Step button functionality...');
    const nextStepBtn = await page.locator('.btn-next-step');
    console.log(`Next step button visible: ${await nextStepBtn.isVisible()}`);
    
    if (await nextStepBtn.isVisible()) {
      await nextStepBtn.click();
      console.log('Next Step button clicked');
      await page.waitForTimeout(1000);
      
      // Check if step 2 is now visible
      const step2Visible = await page.locator('#step-2').isVisible();
      console.log(`Step 2 visible after navigation: ${step2Visible}`);
      
      // Take screenshot after step transition
      await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/round2-04-step2-loaded.png', fullPage: true });
    }
    
    // Test step 2 functionality if visible
    const currentStep2 = await page.locator('#step-2').isVisible();
    if (currentStep2) {
      console.log('Testing Step 2 - Product Selection...');
      
      // Test product search if available
      const productSearchInput = await page.locator('input[name="product_search"]');
      if (await productSearchInput.isVisible()) {
        await productSearchInput.fill('test');
        console.log('Product search filled');
        await page.waitForTimeout(1000);
      }
      
      // Try to navigate to step 3
      const nextBtn2 = await page.locator('.btn-next-step');
      if (await nextBtn2.isVisible()) {
        await nextBtn2.click();
        console.log('Attempting to navigate to Step 3');
        await page.waitForTimeout(1000);
        
        // Check if step 3 is visible
        const step3Visible = await page.locator('#step-3').isVisible();
        console.log(`Step 3 visible: ${step3Visible}`);
        
        if (step3Visible) {
          await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/round2-05-step3-loaded.png', fullPage: true });
        }
      }
    }
    
    // Test Previous Step functionality
    console.log('Testing Previous Step functionality...');
    const prevStepBtn = await page.locator('.btn-prev-step');
    if (await prevStepBtn.isVisible()) {
      await prevStepBtn.click();
      console.log('Previous Step button clicked');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/round2-06-previous-step-test.png', fullPage: true });
    }
    
    // Test draft save functionality
    console.log('Testing draft save functionality...');
    const draftSaveBtn = await page.locator('.btn-save-draft');
    if (await draftSaveBtn.isVisible()) {
      await draftSaveBtn.click();
      console.log('Draft save button clicked');
      await page.waitForTimeout(2000);
      
      // Check for success message or response
      const successMessage = await page.locator('.alert-success').isVisible();
      console.log(`Draft save success message visible: ${successMessage}`);
    }
    
    // Capture final state
    await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/round2-07-final-state.png', fullPage: true });
    
    // Test responsive behavior
    console.log('Testing responsive behavior...');
    
    // Desktop view (already tested above)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/round2-08-desktop-view.png', fullPage: true });
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/round2-09-tablet-view.png', fullPage: true });
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/round2-10-mobile-view.png', fullPage: true });
    
    console.log('Multi-step quote form testing completed!');
  });
  
  test('Console and JavaScript error detection test', async ({ page }) => {
    console.log('Starting JavaScript error detection test...');
    
    const consoleMessages = [];
    const jsErrors = [];
    
    // Capture console messages
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      console.log(`Console: [${msg.type()}] ${msg.text()}`);
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.log(`JavaScript Error: ${error.message}`);
    });
    
    // Navigate and trigger form interactions
    await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
    await page.waitForTimeout(2000);
    
    // Login if needed
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    if (isLoginPage) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
      await page.waitForTimeout(2000);
    }
    
    // Trigger step transitions to capture debugging logs
    const nextStepBtn = await page.locator('.btn-next-step');
    if (await nextStepBtn.isVisible()) {
      console.log('Triggering next step to capture console logs...');
      await nextStepBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Report findings
    console.log('\n=== CONSOLE MESSAGES SUMMARY ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    console.log('\n=== JAVASCRIPT ERRORS SUMMARY ===');
    if (jsErrors.length > 0) {
      jsErrors.forEach(error => console.log(`ERROR: ${error}`));
    } else {
      console.log('No JavaScript errors detected!');
    }
  });
});