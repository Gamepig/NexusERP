import { test, expect } from '@playwright/test';

/**
 * Route Debug Test for Task 72
 */

test.describe('Task 72 - Route Loading Debug', () => {
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

  test('Test Various Routes from orders.php', async ({ page }) => {
    console.log('🧪 Testing routes from orders.php module');
    
    await login(page);
    
    // Test various routes that should exist from orders.php
    const testRoutes = [
      { path: '/quotes', expectedStatus: 'accessible' },
      { path: '/quotes/create', expectedStatus: 'accessible' },
      { path: '/quotes/create/multi-step', expectedStatus: 'should_be_accessible' },
      { path: '/orders/sales', expectedStatus: 'accessible' },
      { path: '/orders/sales/create', expectedStatus: 'accessible' },
      { path: '/orders/purchase', expectedStatus: 'accessible' }
    ];
    
    for (const route of testRoutes) {
      console.log(`\n🔍 Testing route: ${route.path}`);
      
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      
      const pageTitle = await page.title();
      const currentUrl = page.url();
      const isNotFound = pageTitle.includes('Not Found') || pageTitle.includes('404');
      
      console.log(`📄 Title: ${pageTitle}`);
      console.log(`📍 URL: ${currentUrl}`);
      
      if (isNotFound) {
        console.log(`❌ Route ${route.path} returns 404`);
        
        // If this is the multi-step route, it indicates the issue
        if (route.path === '/quotes/create/multi-step') {
          console.log('🚨 ISSUE FOUND: Multi-step route not registered');
        }
      } else {
        console.log(`✅ Route ${route.path} is accessible`);
      }
    }
    
    console.log('\n📊 ANALYSIS:');
    console.log('If basic quote routes work but multi-step does not,');
    console.log('the issue is likely in the route definition or method implementation.');
    
    console.log('✅ Route debug test completed');
  });
});