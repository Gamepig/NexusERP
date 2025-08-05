const { chromium } = require('playwright');

async function testDashboardReports() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing Dashboard Report Links...\n');

    // Navigate to dashboard
    console.log('1. Navigating to dashboard...');
    await page.goto('http://127.0.0.1:8000/dashboard');
    
    // Check if login is needed
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('2. Login required, logging in...');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // Use Promise.race to handle potential navigation issues
      try {
        await Promise.race([
          page.click('button[type="submit"]').then(() => page.waitForNavigation({ timeout: 10000 })),
          page.waitForURL('**/dashboard', { timeout: 10000 })
        ]);
        console.log('   ✅ Login successful');
      } catch (e) {
        console.log('   ⚠️ Login navigation timeout, checking current page...');
        const newUrl = page.url();
        console.log(`   Current URL: ${newUrl}`);
        if (!newUrl.includes('/dashboard')) {
          throw new Error('Login failed - not redirected to dashboard');
        }
      }
    } else {
      console.log('2. Already logged in, proceeding...');
    }

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Define the 5 report links to test
    const reportLinks = [
      { name: '銷售報表 (Sales Reports)', selector: 'a[href*="sales"]', expectedPath: '/reports/sales' },
      { name: '庫存報表 (Inventory Reports)', selector: 'a[href*="inventory"]', expectedPath: '/reports/inventory' },
      { name: '財務報表 (Financial Reports)', selector: 'a[href*="financial"]', expectedPath: '/reports/financial' },
      { name: '採購報表 (Purchase Reports)', selector: 'a[href*="purchase"]', expectedPath: '/reports/purchase' },
      { name: '人事報表 (Employee Reports)', selector: 'a[href*="employee"]', expectedPath: '/reports/employee' }
    ];

    console.log('3. Testing report links...\n');

    for (let i = 0; i < reportLinks.length; i++) {
      const report = reportLinks[i];
      console.log(`Testing ${i + 1}/5: ${report.name}`);

      try {
        // Go back to dashboard first
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForTimeout(1000);

        // Look for the link in different ways
        let linkElement = null;
        
        // Try different selectors
        const selectors = [
          report.selector,
          `a:has-text("${report.name.split(' ')[0]}")`,
          `a[href*="${report.expectedPath}"]`,
          `text=${report.name.split(' ')[0]}`
        ];

        for (const selector of selectors) {
          try {
            linkElement = await page.waitForSelector(selector, { timeout: 2000 });
            if (linkElement) break;
          } catch (e) {
            // Continue to next selector
          }
        }

        if (!linkElement) {
          console.log(`  ❌ Link not found: ${report.name}`);
          
          // Take screenshot of dashboard to see what's available
          await page.screenshot({ 
            path: `/Users/gamepig/projects/NexusERP/frontend/dashboard-screenshot-${i + 1}.png`,
            fullPage: true 
          });
          console.log(`  📸 Dashboard screenshot saved as dashboard-screenshot-${i + 1}.png`);
          continue;
        }

        console.log(`  ✅ Link found: ${report.name}`);

        // Click the link
        await linkElement.click();
        await page.waitForTimeout(2000);

        // Check the result
        const newUrl = page.url();
        console.log(`  🔗 Navigation to: ${newUrl}`);

        // Check for errors
        const hasError = await page.locator('text=404').count() > 0 || 
                        await page.locator('text=Not Found').count() > 0 ||
                        await page.locator('text=Error').count() > 0;

        if (hasError) {
          console.log(`  ❌ Error found on page: ${report.name}`);
        } else {
          console.log(`  ✅ Page loaded successfully: ${report.name}`);
        }

        // Take screenshot
        await page.screenshot({ 
          path: `/Users/gamepig/projects/NexusERP/frontend/report-${i + 1}-${report.name.split(' ')[0].toLowerCase()}.png`,
          fullPage: true 
        });
        console.log(`  📸 Screenshot saved for ${report.name}`);

      } catch (error) {
        console.log(`  ❌ Error testing ${report.name}: ${error.message}`);
      }

      console.log(''); // Empty line for readability
    }

    console.log('✅ Testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testDashboardReports();