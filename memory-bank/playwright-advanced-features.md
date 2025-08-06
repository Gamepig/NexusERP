# Playwright Advanced Features - Debugging, Tracing, and Code Generation

## Debugging Features

### Visual Debugging with Playwright Inspector
```bash
# Run test in headed mode with Playwright Inspector
npx playwright test --debug

# Debug specific test
npx playwright test auth.spec.js --debug

# Debug with custom timeout
npx playwright test --debug --timeout=0
```

### Environment Variables for Debugging
```bash
# Enable debug logs
DEBUG=pw:api npx playwright test

# Run in headed mode
HEADED=1 npx playwright test

# Slow down actions for observation
PLAYWRIGHT_SLOW_MO=1000 npx playwright test

# Keep browser open after test
PLAYWRIGHT_INSPECTOR=1 npx playwright test
```

### Code Debugging Techniques
```javascript
test('debug example', async ({ page }) => {
  await page.goto('/');
  
  // Pause execution for manual inspection
  await page.pause();
  
  // Highlight elements for visual debugging
  await page.getByRole('button').highlight();
  
  // Step-by-step debugging
  await page.locator('#element').screenshot({ path: 'element.png' });
  
  // Console debugging
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Evaluate JavaScript for debugging
  const debugInfo = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    cookies: document.cookie
  }));
  console.log('Debug info:', debugInfo);
});
```

### Browser Developer Tools Integration
```javascript
test('use dev tools', async ({ page }) => {
  // Open browser with dev tools
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Add debug script
  await page.addScriptTag({
    content: `
      console.log('Test script loaded');
      window.debugHelper = {
        getAllButtons: () => Array.from(document.querySelectorAll('button')),
        getFormData: () => new FormData(document.querySelector('form'))
      };
    `
  });
  
  // Use browser context for debugging
  const result = await page.evaluate(() => window.debugHelper.getAllButtons().length);
  console.log('Button count:', result);
});
```

## Tracing and Recording

### Trace Recording Configuration
```javascript
// In playwright.config.js
export default defineConfig({
  use: {
    // Record trace on first retry of failed test
    trace: 'on-first-retry',
    
    // Always record trace
    trace: 'on',
    
    // Record trace for failed tests only
    trace: 'retain-on-failure',
    
    // Custom trace settings
    trace: {
      mode: 'on',
      screenshots: true,
      snapshots: true,
      sources: true
    }
  }
});
```

### Manual Trace Control
```javascript
test('manual trace control', async ({ page, context }) => {
  // Start tracing manually
  await context.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true
  });
  
  await page.goto('/');
  await page.getByRole('button', { name: 'Click me' }).click();
  
  // Stop and save trace
  await context.tracing.stop({ path: 'trace.zip' });
});
```

### Viewing Traces
```bash
# Open trace viewer
npx playwright show-trace trace.zip

# View latest traces
npx playwright show-trace test-results/

# Show trace from specific test run
npx playwright show-trace test-results/login-should-login-chromium/trace.zip
```

### Screenshots and Videos
```javascript
// In playwright.config.js
export default defineConfig({
  use: {
    // Screenshot options
    screenshot: 'only-on-failure', // 'off', 'on', 'only-on-failure'
    
    // Video recording
    video: 'retain-on-failure', // 'off', 'on', 'retain-on-failure', 'on-first-retry'
    
    // Video size
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 }
    }
  }
});

// Manual screenshot/video control
test('custom recording', async ({ page }) => {
  await page.goto('/');
  
  // Take screenshot
  await page.screenshot({ path: 'page.png', fullPage: true });
  
  // Screenshot specific element
  await page.getByTestId('component').screenshot({ path: 'component.png' });
  
  // Video recording is automatic based on config
});
```

## Code Generation (Codegen)

### Recording User Interactions
```bash
# Start codegen and record interactions
npx playwright codegen https://example.com

# Generate for specific browser
npx playwright codegen --browser=firefox https://example.com

# Generate with specific viewport
npx playwright codegen --viewport-size=375,667 https://example.com

# Generate with device emulation
npx playwright codegen --device="iPhone 12" https://example.com
```

### Advanced Codegen Options
```bash
# Save generated code to file
npx playwright codegen --output=test.spec.js https://example.com

# Generate with specific language
npx playwright codegen --target=python https://example.com
npx playwright codegen --target=java https://example.com
npx playwright codegen --target=csharp https://example.com

# Load existing storage state
npx playwright codegen --load-storage=auth.json https://example.com

# Generate with custom user agent
npx playwright codegen --user-agent="Custom Agent" https://example.com
```

### Generated Code Patterns
```javascript
// Example of generated code from codegen
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://example.com/');
  await page.getByRole('link', { name: 'Products' }).click();
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByText('Item added to cart')).toBeVisible();
});
```

### Customizing Generated Code
```javascript
// Refactored generated code with better practices
test('add product to cart', async ({ page }) => {
  // Navigate to products page
  await page.goto('/');
  await page.getByRole('link', { name: 'Products' }).click();
  
  // Add product to cart
  const productCard = page.getByTestId('product-1');
  await productCard.getByRole('button', { name: 'Add to Cart' }).click();
  
  // Verify success message
  await expect(page.getByTestId('success-message')).toHaveText('Item added to cart');
  
  // Verify cart count
  await expect(page.getByTestId('cart-count')).toHaveText('1');
});
```

## API Testing Integration

### REST API Testing
```javascript
test('API integration', async ({ request, page }) => {
  // Make API calls
  const response = await request.get('/api/users');
  expect(response.status()).toBe(200);
  
  const users = await response.json();
  expect(users).toHaveLength(3);
  
  // Use API data in UI test
  await page.goto('/users');
  for (const user of users) {
    await expect(page.getByText(user.name)).toBeVisible();
  }
});
```

### API Mocking
```javascript
test('mock API responses', async ({ page }) => {
  // Mock API endpoint
  await page.route('/api/users', async route => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUsers)
    });
  });
  
  await page.goto('/users');
  await expect(page.getByText('John Doe')).toBeVisible();
  await expect(page.getByText('Jane Smith')).toBeVisible();
});
```

## Performance Testing

### Performance Metrics Collection
```javascript
test('performance metrics', async ({ page }) => {
  await page.goto('/');
  
  // Collect performance metrics
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      // Navigation timing
      domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
      loadComplete: nav.loadEventEnd - nav.loadEventStart,
      
      // Paint timing
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      
      // Other metrics
      transferSize: nav.transferSize,
      encodedBodySize: nav.encodedBodySize
    };
  });
  
  // Assert performance requirements
  expect(metrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
  expect(metrics.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds
  
  console.log('Performance metrics:', metrics);
});
```

### Lighthouse Integration
```javascript
test('lighthouse audit', async ({ page }) => {
  await page.goto('/');
  
  // Run Lighthouse audit (requires playwright-lighthouse)
  const lighthouse = require('playwright-lighthouse');
  
  await lighthouse(page, {
    port: 9222,
    thresholds: {
      performance: 90,
      accessibility: 95,
      'best-practices': 90,
      seo: 85
    }
  });
});
```

## Browser Context Manipulation

### Multiple Contexts and Pages
```javascript
test('multiple contexts', async ({ browser }) => {
  // Create multiple isolated contexts
  const userContext = await browser.newContext();
  const adminContext = await browser.newContext();
  
  const userPage = await userContext.newPage();
  const adminPage = await adminContext.newPage();
  
  // Login as different users in parallel
  await Promise.all([
    loginAsUser(userPage, 'user@example.com'),
    loginAsUser(adminPage, 'admin@example.com')
  ]);
  
  // Verify different user experiences
  await userPage.goto('/dashboard');
  await adminPage.goto('/admin');
  
  await expect(userPage.getByText('User Dashboard')).toBeVisible();
  await expect(adminPage.getByText('Admin Panel')).toBeVisible();
  
  await userContext.close();
  await adminContext.close();
});
```

### State Management
```javascript
test('preserve authentication state', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login and save state
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Save authentication state
  await context.storageState({ path: 'auth.json' });
  await context.close();
  
  // Create new context with saved state
  const newContext = await browser.newContext({
    storageState: 'auth.json'
  });
  const newPage = await newContext.newPage();
  
  // Should be already logged in
  await newPage.goto('/dashboard');
  await expect(newPage.getByText('Welcome back')).toBeVisible();
  
  await newContext.close();
});
```