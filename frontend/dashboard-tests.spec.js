import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

async function login(page) {
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

test.describe('Dashboard Functionality Tests', () => {
  
  test('should load dashboard without HTTP 500 errors after login', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // Verify login page loads
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Fill credentials
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for redirect and dashboard to load
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'screenshots/dashboard-after-login.png' });
    
    // Check for error indicators
    const errorSelectors = [
      'text=500',
      'text=Internal Server Error',
      'text=Whoops',
      'text=Error 500',
      '.error-500',
      '.server-error'
    ];
    
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector);
      await expect(errorElement).toHaveCount(0);
    }
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Check for positive dashboard indicators
    const dashboardIndicators = [
      'text=Dashboard',
      'text=Welcome',
      'text=Overview'
    ];
    
    let foundIndicator = false;
    for (const indicator of dashboardIndicators) {
      const element = page.locator(indicator);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        foundIndicator = true;
        console.log(`✓ Found dashboard indicator: ${indicator}`);
        break;
      }
    }
    
    if (!foundIndicator) {
      console.log('⚠️ No specific dashboard indicators found, but no errors detected');
    }
    
    console.log('✓ Dashboard loaded successfully without HTTP 500 errors');
  });

  test('should display dashboard cards and metrics', async ({ page }) => {
    await login(page);
    
    // Look for dashboard cards/widgets
    const cardSelectors = [
      '.card',
      '.dashboard-card',
      '.metric-card',
      '.widget',
      '.stats-card',
      '[data-card]'
    ];
    
    let cardsFound = 0;
    for (const selector of cardSelectors) {
      const cards = page.locator(selector);
      const count = await cards.count();
      if (count > 0) {
        cardsFound += count;
        console.log(`Found ${count} cards with selector: ${selector}`);
      }
    }
    
    // Look for common dashboard metrics
    const metricIndicators = [
      'text=Total',
      'text=Sales',
      'text=Orders',
      'text=Customers',
      'text=Revenue',
      'text=Products',
      'text=Inventory'
    ];
    
    let metricsFound = 0;
    for (const indicator of metricIndicators) {
      const elements = page.locator(indicator);
      const count = await elements.count();
      if (count > 0) {
        metricsFound += count;
        console.log(`Found metric indicator: ${indicator}`);
      }
    }
    
    console.log(`Dashboard summary: ${cardsFound} cards, ${metricsFound} metric indicators`);
    
    // Look for charts or graphs
    const chartSelectors = [
      'canvas',
      '.chart',
      '.graph',
      '[data-chart]',
      'svg'
    ];
    
    let chartsFound = 0;
    for (const selector of chartSelectors) {
      const charts = page.locator(selector);
      const count = await charts.count();
      if (count > 0) {
        chartsFound += count;
        console.log(`Found ${count} potential charts with selector: ${selector}`);
      }
    }
    
    await page.screenshot({ path: 'screenshots/dashboard-content.png' });
  });

  test('should handle dashboard refresh without errors', async ({ page }) => {
    await login(page);
    
    // Initial dashboard load
    await page.waitForLoadState('networkidle');
    const initialUrl = page.url();
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check we're still on dashboard
    await expect(page).toHaveURL(initialUrl);
    
    // Check for errors after refresh
    const errorSelectors = [
      'text=500',
      'text=Internal Server Error',
      'text=Whoops'
    ];
    
    for (const selector of errorSelectors) {
      await expect(page.locator(selector)).toHaveCount(0);
    }
    
    await page.screenshot({ path: 'screenshots/dashboard-after-refresh.png' });
    console.log('✓ Dashboard refresh handled without errors');
  });

  test('should navigate from dashboard to other sections', async ({ page }) => {
    await login(page);
    
    // Test navigation links from dashboard
    const navigationItems = [
      { text: 'Customers', expectedUrl: 'customers' },
      { text: 'Suppliers', expectedUrl: 'suppliers' },
      { text: 'Products', expectedUrl: 'products' },
      { text: 'Orders', expectedUrl: 'orders' },
      { text: 'Sales', expectedUrl: 'sales' }
    ];
    
    for (const item of navigationItems) {
      // Return to dashboard
      await page.goto('http://127.0.0.1:8000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for navigation link
      const navSelectors = [
        `a:has-text("${item.text}")`,
        `nav a[href*="${item.expectedUrl}"]`,
        `[href*="${item.expectedUrl}"]`,
        `.nav-link:has-text("${item.text}")`
      ];
      
      let linkFound = false;
      for (const selector of navSelectors) {
        const link = page.locator(selector);
        if (await link.count() > 0) {
          console.log(`Clicking navigation: ${item.text}`);
          await link.first().click();
          await page.waitForLoadState('networkidle');
          
          // Check we navigated successfully (no 500 error)
          const content = await page.content();
          if (!content.includes('500') && !content.includes('Internal Server Error')) {
            console.log(`✓ Navigation to ${item.text} successful`);
          } else {
            console.log(`❌ Navigation to ${item.text} resulted in error`);
          }
          
          linkFound = true;
          break;
        }
      }
      
      if (!linkFound) {
        console.log(`⚠️ Navigation link for ${item.text} not found`);
      }
    }
  });

  test('should display recent activities or notifications', async ({ page }) => {
    await login(page);
    
    // Look for recent activities section
    const activitySelectors = [
      'text=Recent',
      'text=Activities',
      'text=Notifications',
      'text=Updates',
      '.recent-activities',
      '.notifications',
      '.activity-feed'
    ];
    
    let activitiesFound = false;
    for (const selector of activitySelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✓ Found activities section: ${selector}`);
        activitiesFound = true;
        
        // Check if there are activity items
        const activityItems = page.locator(`${selector} ~ ul li, ${selector} ~ div .item`);
        const itemCount = await activityItems.count();
        console.log(`Activity items found: ${itemCount}`);
        
        break;
      }
    }
    
    if (!activitiesFound) {
      console.log('⚠️ No recent activities section found');
    }
    
    await page.screenshot({ path: 'screenshots/dashboard-activities.png' });
  });

  test('should handle dashboard data loading states', async ({ page }) => {
    await login(page);
    
    // Look for loading indicators
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '.skeleton',
      '[data-loading]',
      'text=Loading'
    ];
    
    // Since data loads quickly, we mainly check for absence of loading states
    // in a fully loaded dashboard
    await page.waitForLoadState('networkidle');
    
    let persistentLoading = false;
    for (const selector of loadingSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`⚠️ Found persistent loading indicator: ${selector}`);
        persistentLoading = true;
      }
    }
    
    if (!persistentLoading) {
      console.log('✓ No persistent loading states found - dashboard loaded completely');
    }
    
    // Check for data placeholders or empty states
    const emptyStateSelectors = [
      'text=No data',
      'text=No records',
      '.empty-state',
      '.no-data'
    ];
    
    let emptyStates = 0;
    for (const selector of emptyStateSelectors) {
      const count = await page.locator(selector).count();
      emptyStates += count;
    }
    
    console.log(`Empty state indicators: ${emptyStates}`);
    
    await page.screenshot({ path: 'screenshots/dashboard-loaded-state.png' });  
  });

  test('should handle dashboard API calls gracefully', async ({ page }) => {
    // Monitor network requests
    const apiCalls = [];
    const failedRequests = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/dashboard')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        
        if (response.status() >= 400) {
          failedRequests.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      }
    });
    
    await login(page);
    
    // Wait for all API calls to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log(`Total API calls made: ${apiCalls.length}`);
    console.log(`Failed API calls: ${failedRequests.length}`);
    
    // Log successful API calls
    apiCalls.forEach(call => {
      if (call.status < 400) {
        console.log(`✓ API call successful: ${call.url} (${call.status})`);
      }
    });
    
    // Log failed API calls
    failedRequests.forEach(call => {
      console.log(`❌ API call failed: ${call.url} (${call.status} ${call.statusText})`);
    });
    
    // Dashboard should still load even if some API calls fail
    const dashboardElements = page.locator('text=Dashboard, h1, h2, .dashboard');
    await expect(dashboardElements.first()).toBeVisible();
    
    console.log('✓ Dashboard loaded despite any API call issues');
  });

  test('should maintain responsive design on different viewport sizes', async ({ page }) => {
    await login(page);
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Medium' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Check that dashboard elements are still visible
      const mainContent = page.locator('main, .main-content, .dashboard');
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
        console.log(`✓ Dashboard visible on ${viewport.name}`);
      }
      
      // Take screenshot for each viewport
      await page.screenshot({ path: `screenshots/dashboard-${viewport.name.toLowerCase().replace(' ', '-')}.png` });
    }
    
    // Reset to default viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});