const { test, expect } = require('@playwright/test');

test.describe('Multi-Step Quote Navigation Tests', () => {
  test.setTimeout(60000);
  
  test('Test step navigation functionality', async ({ page }) => {
    console.log('Testing multi-step navigation after bug fixes...');
    
    // Navigate and login
    await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
    await page.waitForTimeout(2000);
    
    // Handle login if required
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    if (isLoginPage) {
      console.log('Performing login...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
      await page.waitForTimeout(2000);
    }
    
    // Capture console logs for debugging
    page.on('console', msg => {
      if (msg.text().includes('nextStep') || msg.text().includes('step') || msg.text().includes('Step')) {
        console.log(`STEP LOG: [${msg.type()}] ${msg.text()}`);
      }
    });
    
    // Wait for form to be ready - use a more generic selector
    await page.waitForSelector('.btn', { timeout: 10000 }); // Wait for any button to be ready
    await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/nav-test-01-initial.png', fullPage: true });
    
    // Check current step visibility
    const step1Visible = await page.locator('text=步驟 1').isVisible();
    console.log(`Step 1 header visible: ${step1Visible}`);
    
    // Fill required fields for Step 1
    console.log('Filling Step 1 fields...');
    
    // Customer selection
    const customerSelect = await page.locator('select[name="customer_id"]');
    if (await customerSelect.isVisible()) {
      await customerSelect.selectOption({ index: 1 });
      console.log('Customer selected');
    }
    
    // Fill dates
    const quoteDateInput = await page.locator('input[name="quote_date"]');
    if (await quoteDateInput.isVisible()) {
      await quoteDateInput.fill('2025-08-06');
      console.log('Quote date filled');
    }
    
    // Look for the Next Step button with multiple possible selectors
    const nextBtnSelectors = [
      '.btn-next-step',
      'button:has-text("下一步")',
      'button[onclick*="nextStep"]',
      '.btn:has-text("下一步")'
    ];
    
    let nextStepBtn = null;
    for (const selector of nextBtnSelectors) {
      const btn = page.locator(selector);
      if (await btn.isVisible()) {
        nextStepBtn = btn;
        console.log(`Found Next Step button with selector: ${selector}`);
        break;
      }
    }
    
    if (nextStepBtn) {
      console.log('Clicking Next Step button...');
      await nextStepBtn.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/nav-test-02-after-next.png', fullPage: true });
      
      // Check if step 2 is now visible
      const step2Text = await page.locator('text=步驟 2').isVisible();
      const step2Content = await page.locator('text=產品選擇').isVisible();
      console.log(`Step 2 header visible: ${step2Text}`);
      console.log(`Step 2 content visible: ${step2Content}`);
      
      // Test Previous Step functionality
      const prevBtnSelectors = [
        '.btn-prev-step',
        'button:has-text("上一步")',
        'button[onclick*="prevStep"]',
        '.btn:has-text("上一步")'
      ];
      
      let prevStepBtn = null;
      for (const selector of prevBtnSelectors) {
        const btn = page.locator(selector);
        if (await btn.isVisible()) {
          prevStepBtn = btn;
          console.log(`Found Previous Step button with selector: ${selector}`);
          break;
        }
      }
      
      if (prevStepBtn) {
        console.log('Testing Previous Step functionality...');
        await prevStepBtn.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/nav-test-03-after-prev.png', fullPage: true });
        
        const backToStep1 = await page.locator('text=步驟 1').isVisible();
        console.log(`Back to Step 1: ${backToStep1}`);
      }
      
    } else {
      console.log('Next Step button not found with any of the tested selectors');
    }
    
    // Test draft save functionality
    const draftBtnSelectors = [
      '.btn-save-draft',
      'button:has-text("儲存草稿")',
      'button[onclick*="saveDraft"]',
      '.btn:has-text("草稿")'
    ];
    
    let draftBtn = null;
    for (const selector of draftBtnSelectors) {
      const btn = page.locator(selector);
      if (await btn.isVisible()) {
        draftBtn = btn;
        console.log(`Found Draft Save button with selector: ${selector}`);
        break;
      }
    }
    
    if (draftBtn) {
      console.log('Testing Draft Save functionality...');
      await draftBtn.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/nav-test-04-draft-save.png', fullPage: true });
    }
    
    console.log('Multi-step navigation test completed!');
  });
});