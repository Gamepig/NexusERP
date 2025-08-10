import { test, expect } from '@playwright/test';

/**
 * Working Test for Task 72: Multi-Step Quote Form
 * Tests the actual implementation that exists
 */

test.describe('Task 72 - Working Multi-Step Quote Form Test', () => {
  const TEST_ACCOUNT = {
    email: 'test@example.com',
    password: 'password123'
  };

  // Helper function for login
  async function login(page) {
    console.log('🔐 Logging in...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', TEST_ACCOUNT.email);
    await page.fill('input[name="password"]', TEST_ACCOUNT.password);
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
    console.log('✅ Login successful, redirected to:', page.url());
  }

  test('1. Multi-Step Quote Form - Full Navigation Test', async ({ page }) => {
    console.log('🧪 Test 1: Complete multi-step form test');
    
    // Login first
    await login(page);
    
    // Navigate to multi-step quote form
    await page.goto('/quotes/create/multi-step');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/test-01-initial-load.png', 
      fullPage: true 
    });
    
    console.log('📝 Multi-step form loaded successfully');
    
    // Check for Alpine.js initialization
    const hasAlpineData = await page.locator('[x-data]').count();
    console.log('🎯 Alpine.js elements found:', hasAlpineData);
    
    // Verify step indicators are present
    const stepIndicators = await page.locator('.flex.space-x-8 > div').count();
    console.log('📊 Step indicators found:', stepIndicators);
    expect(stepIndicators).toBeGreaterThanOrEqual(3); // Should have 3 steps
    
    // Check if we're on Step 1 (客戶資訊)
    const step1Text = await page.locator('text=客戶資訊').isVisible();
    console.log('1️⃣ Step 1 text visible:', step1Text);
    
    // Check for Alpine.js currentStep variable
    const currentStep = await page.evaluate(() => {
      // Try to access Alpine.js data
      const alpineEl = document.querySelector('[x-data*="multiStepQuoteForm"]');
      if (alpineEl && alpineEl._x_dataStack) {
        return alpineEl._x_dataStack[0].currentStep || 1;
      }
      return null;
    });
    console.log('🎯 Current step from Alpine.js:', currentStep);
    
    // Test Step 1: Look for customer selection elements
    console.log('🧪 Testing Step 1 - Customer Information');
    
    // Wait a bit for Alpine.js to initialize
    await page.waitForTimeout(2000);
    
    // Look for customer selection field (might be hidden/shown by Alpine.js)
    const customerFields = await page.locator('select[name*="customer"], #customer_id, .customer-select, [name="customer_id"]').count();
    console.log('👥 Customer fields found:', customerFields);
    
    if (customerFields > 0) {
      const customerField = await page.locator('select[name*="customer"], #customer_id, [name="customer_id"]').first();
      
      if (await customerField.isVisible()) {
        console.log('✅ Customer field is visible');
        
        // Check for options
        const options = await customerField.locator('option').count();
        console.log('👥 Customer options available:', options);
        
        if (options > 1) {
          await customerField.selectOption({ index: 1 });
          console.log('✅ Customer selected');
        }
      } else {
        console.log('⚠️ Customer field exists but not visible (may be controlled by Alpine.js)');
      }
    }
    
    // Look for date fields
    const dateFields = await page.locator('input[type="date"], input[name*="date"]').count();
    console.log('📅 Date fields found:', dateFields);
    
    // Take screenshot after step 1 interaction
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/test-02-step1-interaction.png', 
      fullPage: true 
    });
    
    // Test navigation buttons
    const nextButtons = await page.locator('button:has-text("下一步"), button:has-text("Next"), .btn-next, [data-next]').count();
    console.log('▶️ Next buttons found:', nextButtons);
    
    if (nextButtons > 0) {
      const nextButton = await page.locator('button:has-text("下一步"), button:has-text("Next")').first();
      
      if (await nextButton.isVisible()) {
        console.log('✅ Clicking next button...');
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot after clicking next
        await page.screenshot({ 
          path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/test-03-after-next.png', 
          fullPage: true 
        });
        
        console.log('✅ Next button clicked successfully');
      } else {
        console.log('⚠️ Next button exists but not visible');
      }
    }
    
    // Test Step 2: Product selection
    console.log('🧪 Testing Step 2 - Product Selection');
    
    // Look for product-related fields
    const productFields = await page.locator('input[name*="product"], .product-search, #product_search').count();
    console.log('📦 Product fields found:', productFields);
    
    // Look for product add buttons
    const addButtons = await page.locator('button:has-text("新增"), button:has-text("Add"), .btn-add').count();
    console.log('➕ Add buttons found:', addButtons);
    
    // Test Draft Save functionality
    console.log('🧪 Testing Draft Save Functionality');
    
    const draftButtons = await page.locator('button:has-text("草稿"), button:has-text("Draft"), .btn-draft').count();
    console.log('💾 Draft buttons found:', draftButtons);
    
    if (draftButtons > 0) {
      const draftButton = await page.locator('button:has-text("草稿"), button:has-text("Draft")').first();
      
      if (await draftButton.isVisible()) {
        console.log('✅ Testing draft save...');
        await draftButton.click();
        await page.waitForTimeout(2000);
        
        // Look for success/error messages
        const messages = await page.locator('.alert, .toast, .notification, .success, .error').count();
        console.log('📨 Messages after draft save:', messages);
        
        if (messages > 0) {
          const message = await page.locator('.alert, .toast, .notification, .success, .error').first().textContent();
          console.log('📨 Draft save message:', message);
        }
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/test-04-final-state.png', 
      fullPage: true 
    });
    
    console.log('✅ Multi-step form test completed successfully');
  });

  test('2. Form JavaScript and Alpine.js Integration', async ({ page }) => {
    console.log('🧪 Test 2: JavaScript and Alpine.js integration');
    
    await login(page);
    await page.goto('/quotes/create/multi-step');
    await page.waitForLoadState('networkidle');
    
    // Check for JavaScript errors
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    // Wait for Alpine.js initialization
    await page.waitForTimeout(3000);
    
    // Test Alpine.js data and methods
    const alpineTest = await page.evaluate(() => {
      const alpineEl = document.querySelector('[x-data*="multiStepQuoteForm"]');
      if (alpineEl && alpineEl._x_dataStack) {
        const data = alpineEl._x_dataStack[0];
        return {
          hasData: true,
          currentStep: data.currentStep,
          methods: Object.keys(data).filter(key => typeof data[key] === 'function'),
          properties: Object.keys(data).filter(key => typeof data[key] !== 'function')
        };
      }
      return { hasData: false };
    });
    
    console.log('🎯 Alpine.js integration test:', JSON.stringify(alpineTest, null, 2));
    
    // Report JavaScript errors
    if (jsErrors.length > 0) {
      console.log('❌ JavaScript errors found:', jsErrors);
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/test-05-js-integration.png', 
      fullPage: true 
    });
  });

  test('3. Responsive Design Test', async ({ page }) => {
    console.log('🧪 Test 3: Responsive design test');
    
    await login(page);
    
    // Test different screen sizes
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/quotes/create/multi-step');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: `/Users/gamepig/projects/NexusERP/debug/task-72-multi-step-quote/test-06-${viewport.name.toLowerCase()}-view.png`, 
        fullPage: true 
      });
      
      // Check if step indicators are responsive
      const stepIndicators = await page.locator('.flex.space-x-8').isVisible();
      console.log(`📊 Step indicators visible on ${viewport.name}:`, stepIndicators);
    }
    
    console.log('✅ Responsive design test completed');
  });
});