import { test, expect } from '@playwright/test';

/**
 * Debug Test for Task 72: Capture page content for analysis
 */

test.describe('Task 72 - Debug Page Content', () => {
  const TEST_ACCOUNT = {
    email: 'test@example.com',
    password: 'password123'
  };

  async function login(page) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', TEST_ACCOUNT.email);
    await page.fill('input[name="password"]', TEST_ACCOUNT.password);
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
  }

  test('Capture Multi-Step Form HTML Content', async ({ page }) => {
    console.log('🔍 Debug: Capturing multi-step form content');
    
    await login(page);
    await page.goto('/quotes/create/multi-step');
    await page.waitForLoadState('networkidle');
    
    // Capture page title and URL
    console.log('🌐 Page URL:', page.url());
    console.log('📄 Page title:', await page.title());
    
    // Capture full page HTML content
    const htmlContent = await page.content();
    
    // Write HTML content to file for analysis
    await require('fs').promises.writeFile(
      '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/page-content.html', 
      htmlContent
    );
    
    // Log some key indicators
    console.log('🎯 HTML contains Alpine.js x-data:', htmlContent.includes('x-data'));
    console.log('📊 HTML contains step indicators:', htmlContent.includes('步驟'));
    console.log('🏗️ HTML contains multiStepQuoteForm:', htmlContent.includes('multiStepQuoteForm'));
    console.log('📝 HTML contains customer fields:', htmlContent.includes('customer'));
    console.log('🎨 HTML contains Tailwind classes:', htmlContent.includes('flex space-x-8'));
    
    // Check for JavaScript errors in console
    const jsErrors = [];
    const consoleMessages = [];
    
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    // Reload to capture console messages
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for JS to execute
    
    console.log('📨 Console messages:', consoleMessages.length);
    if (jsErrors.length > 0) {
      console.log('❌ JavaScript errors:', jsErrors);
    }
    
    // Try to manually check for Alpine.js
    const alpineStatus = await page.evaluate(() => {
      return {
        alpineExists: typeof window.Alpine !== 'undefined',
        alpineStarted: window.Alpine && window.Alpine.start,
        documentReady: document.readyState,
        hasXDataElements: document.querySelectorAll('[x-data]').length,
        bodyClasses: document.body.className,
        scriptTags: Array.from(document.scripts).map(s => s.src || 'inline').slice(0, 10)
      };
    });
    
    console.log('🎯 Alpine.js status:', JSON.stringify(alpineStatus, null, 2));
    
    // Check page source for specific elements
    const pageText = await page.locator('body').textContent();
    console.log('📝 Page contains "建立報價單":', pageText.includes('建立報價單'));
    console.log('📝 Page contains "多步驟":', pageText.includes('多步驟'));
    console.log('📝 Page contains error messages:', pageText.includes('404') || pageText.includes('500') || pageText.includes('Error'));
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/debug-content-capture.png', 
      fullPage: true 
    });
    
    console.log('✅ Debug content capture completed');
    console.log('📁 Files saved:');
    console.log('   - page-content.html');
    console.log('   - debug-content-capture.png');
  });
});