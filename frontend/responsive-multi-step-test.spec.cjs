const { test, expect } = require('@playwright/test');

test.describe('Multi-Step Quote Responsive Tests', () => {
  test.setTimeout(30000);
  
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];
  
  viewports.forEach(viewport => {
    test(`Multi-step form responsive test - ${viewport.name}`, async ({ page }) => {
      console.log(`Testing ${viewport.name} viewport: ${viewport.width}x${viewport.height}`);
      
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
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
      
      // Take screenshot of initial responsive state
      await page.screenshot({ 
        path: `/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/responsive-${viewport.name.toLowerCase()}-01-initial.png`, 
        fullPage: true 
      });
      
      // Test if next button is visible and functional on this viewport
      const nextButtonVisible = await page.locator('text=下一步').isVisible();
      console.log(`${viewport.name} - Next button visible: ${nextButtonVisible}`);
      
      if (nextButtonVisible) {
        // Try to click the next button
        await page.click('text=下一步');
        await page.waitForTimeout(2000);
        
        // Take screenshot after step transition
        await page.screenshot({ 
          path: `/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/responsive-${viewport.name.toLowerCase()}-02-step2.png`, 
          fullPage: true 
        });
        
        // Check if step 2 content is visible
        const step2Visible = await page.locator('text=產品選擇').isVisible();
        console.log(`${viewport.name} - Step 2 content visible: ${step2Visible}`);
      }
      
      console.log(`${viewport.name} responsive test completed`);
    });
  });
});