const { test, expect } = require('@playwright/test');

test.describe('Simple Multi-Step Quote Test', () => {
  test.setTimeout(30000);
  
  test('Basic multi-step form functionality check', async ({ page }) => {
    console.log('Starting basic multi-step form test...');
    
    // Capture all console messages
    page.on('console', msg => {
      console.log(`Browser Console [${msg.type()}]: ${msg.text()}`);
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      console.log(`JavaScript Error: ${error.message}`);
    });
    
    // Navigate to the form
    await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/simple-test-01-initial.png', 
      fullPage: true 
    });
    
    // Check if login is needed
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      console.log('Login required - performing authentication');
      await emailInput.fill('test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Click login button
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // Navigate to form again
      await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/simple-test-02-after-login.png', 
        fullPage: true 
      });
    }
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Look for key elements
    const hasSteps = await page.locator('text=步驟').count();
    console.log(`Number of step elements found: ${hasSteps}`);
    
    const hasNextBtn = await page.locator('text=下一步').count();
    console.log(`Number of "下一步" buttons found: ${hasNextBtn}`);
    
    // Try to find and click the next button using JavaScript
    const clickResult = await page.evaluate(() => {
      // Look for the next button in multiple ways
      const nextBtns = [
        document.querySelector('[onclick*="nextStep"]'),
        document.querySelector('button:contains("下一步")'),
        Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('下一步')),
        document.querySelector('.btn-next-step')
      ].filter(btn => btn !== null);
      
      console.log('Found buttons:', nextBtns.length);
      
      if (nextBtns.length > 0) {
        console.log('Clicking next button...');
        nextBtns[0].click();
        return 'Button clicked successfully';
      } else {
        return 'No next button found';
      }
    });
    
    console.log(`JavaScript click result: ${clickResult}`);
    
    // Wait and take another screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/simple-test-03-after-click.png', 
      fullPage: true 
    });
    
    // Check console logs again
    await page.waitForTimeout(1000);
    
    console.log('Simple multi-step test completed!');
  });
});