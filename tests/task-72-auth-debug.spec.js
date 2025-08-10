import { test, expect } from '@playwright/test';

/**
 * Authentication Debug Test for Task 72
 */

test.describe('Task 72 - Authentication Debug', () => {
  const TEST_ACCOUNT = {
    email: 'test@example.com',
    password: 'password123'
  };

  test('Debug Authentication and Route Access', async ({ page }) => {
    console.log('🔐 Starting authentication debug...');
    
    // Step 1: Check if we can access /quotes first
    await page.goto('/quotes');
    console.log('📍 Quotes page URL after direct access:', page.url());
    
    // If redirected to login, we'll be on login page
    if (page.url().includes('/login')) {
      console.log('🔐 Redirected to login, proceeding with authentication...');
      
      await page.fill('input[name="email"]', TEST_ACCOUNT.email);
      await page.fill('input[name="password"]', TEST_ACCOUNT.password);
      await page.click('button[type="submit"]');
      
      await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
      console.log('✅ Login completed, now at:', page.url());
    }
    
    // Step 2: Now try to access quotes again
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');
    console.log('📍 Quotes page after auth:', page.url());
    console.log('📄 Quotes page title:', await page.title());
    
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/auth-debug-quotes.png', 
      fullPage: true 
    });
    
    // Step 3: Check what links or buttons are available on quotes page
    const createButtons = await page.locator('a:has-text("Create"), a:has-text("建立"), a:has-text("New"), .btn-create, [href*="create"]').count();
    console.log('🔗 Create buttons/links found on quotes page:', createButtons);
    
    if (createButtons > 0) {
      const createLinks = await page.locator('a[href*="create"]').allTextContents();
      console.log('🔗 Create link texts:', createLinks);
      
      const createHrefs = await page.locator('a[href*="create"]').evaluateAll(links => 
        links.map(link => link.href)
      );
      console.log('🔗 Create link URLs:', createHrefs);
    }
    
    // Step 4: Try different quote creation paths
    const testPaths = [
      '/quotes/create',
      '/quotes/create/multi-step'
    ];
    
    for (const path of testPaths) {
      console.log(`\n🧪 Testing path: ${path}`);
      
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      const pageTitle = await page.title();
      const currentUrl = page.url();
      
      console.log(`📄 Title: ${pageTitle}`);
      console.log(`📍 URL: ${currentUrl}`);
      
      const isNotFound = pageTitle.includes('Not Found') || pageTitle.includes('404');
      const isError = pageTitle.includes('Error') || pageTitle.includes('500');
      
      if (isNotFound) {
        console.log('❌ Route not found (404)');
      } else if (isError) {
        console.log('❌ Server error (500)');
      } else {
        console.log('✅ Route accessible');
        
        // Check for key elements
        const hasForm = await page.locator('form').count() > 0;
        const hasXData = await page.locator('[x-data]').count() > 0;
        const hasSteps = (await page.locator('body').textContent()).includes('步驟');
        
        console.log(`📝 Has form: ${hasForm}`);
        console.log(`🎯 Has Alpine.js: ${hasXData}`);
        console.log(`📊 Has steps: ${hasSteps}`);
        
        await page.screenshot({ 
          path: `/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/route-test-${path.replace(/\//g, '-')}.png`, 
          fullPage: true 
        });
      }
    }
    
    // Step 5: Check Laravel routes via artisan
    console.log('\n🔍 Checking Laravel routes...');
    
    // This will be handled separately by running artisan command
    
    console.log('✅ Authentication and route debug completed');
  });
});