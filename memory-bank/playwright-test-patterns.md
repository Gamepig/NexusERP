# Playwright Test Writing Patterns and Best Practices

## Test Structure and Organization

### Basic Test Structure
```javascript
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    // Arrange
    const email = 'user@example.com';
    const password = 'password123';

    // Act
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Assert
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
```

### Test Hooks
```javascript
test.describe('Feature Tests', () => {
  // Run once before all tests in describe block
  test.beforeAll(async ({ browser }) => {
    // Setup database, start services, etc.
  });

  // Run before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsUser(page, 'test@example.com');
  });

  // Run after each test
  test.afterEach(async ({ page }) => {
    // Cleanup, logout, reset state
  });

  // Run once after all tests in describe block
  test.afterAll(async () => {
    // Teardown database, stop services, etc.
  });
});
```

## Page Object Model (POM)

### Page Object Class
```javascript
// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectErrorMessage(message) {
    await expect(this.errorMessage).toHaveText(message);
  }
}
```

### Using Page Objects
```javascript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('login with invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.goto();
  await loginPage.login('invalid@email.com', 'wrongpassword');
  await loginPage.expectErrorMessage('Invalid credentials');
});
```

## Data-Driven Testing

### Test Data Management
```javascript
// test-data/users.json
{
  "validUser": {
    "email": "user@example.com",
    "password": "password123"
  },
  "adminUser": {
    "email": "admin@example.com", 
    "password": "admin123"
  }
}
```

### Parameterized Tests
```javascript
import testData from '../test-data/users.json';

const users = [
  { role: 'user', ...testData.validUser },
  { role: 'admin', ...testData.adminUser }
];

for (const user of users) {
  test(`login as ${user.role}`, async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Login' }).click();
    
    await expect(page).toHaveURL('/dashboard');
  });
}
```

## Custom Fixtures and Utilities

### Custom Fixtures
```javascript
// fixtures/auth.js
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Auto-login fixture
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard');
    
    await use(page);
  },

  // Database fixture
  database: async ({}, use) => {
    const db = await setupTestDatabase();
    await use(db);
    await cleanupTestDatabase(db);
  }
});
```

### Helper Functions
```javascript
// utils/helpers.js
export async function loginAsUser(page, email, password = 'password123') {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/dashboard');
}

export async function createTestUser(page, userData) {
  await page.goto('/admin/users');
  await page.getByRole('button', { name: 'Add User' }).click();
  
  for (const [field, value] of Object.entries(userData)) {
    await page.getByLabel(field).fill(value);
  }
  
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('User created successfully')).toBeVisible();
}
```

## Error Handling and Debugging

### Retry Logic
```javascript
test('flaky network request', async ({ page }) => {
  // Configure retries for specific test
  test.setTimeout(60000);
  
  await test.step('Navigate to page', async () => {
    await page.goto('/data');
  });
  
  await test.step('Wait for data to load', async () => {
    // Use polling assertion for dynamic content
    await expect(async () => {
      const response = await page.request.get('/api/data');
      expect(response.status()).toBe(200);
    }).toPass({
      timeout: 30000,
      intervals: [1000, 2000, 5000]
    });
  });
});
```

### Conditional Logic
```javascript
test('handle optional elements', async ({ page }) => {
  await page.goto('/');
  
  // Check if modal exists before trying to close it
  const modal = page.getByRole('dialog');
  if (await modal.isVisible()) {
    await modal.getByRole('button', { name: 'Close' }).click();
  }
  
  // Alternative: use count
  const closeButtons = page.getByRole('button', { name: 'Close' });
  if (await closeButtons.count() > 0) {
    await closeButtons.first().click();
  }
});
```

### Debugging Helpers
```javascript
test('debug example', async ({ page }) => {
  await page.goto('/');
  
  // Pause execution for manual debugging
  await page.pause();
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'debug.png', fullPage: true });
  
  // Log element information
  const button = page.getByRole('button', { name: 'Submit' });
  console.log('Button text:', await button.textContent());
  console.log('Button visible:', await button.isVisible());
  
  // Highlight element
  await button.highlight();
});
```

## Advanced Testing Patterns

### Test Steps for Better Reporting
```javascript
test('user registration flow', async ({ page }) => {
  await test.step('Navigate to registration page', async () => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
  });

  await test.step('Fill registration form', async () => {
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('john@example.com');
    await page.getByLabel('Password').fill('password123');
  });

  await test.step('Submit form and verify success', async () => {
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByText('Registration successful')).toBeVisible();
  });
});
```

### Cross-browser Testing Patterns
```javascript
test.describe('Cross-browser compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Skipping for ${currentBrowser}`);
      
      await page.goto('/');
      await expect(page.getByText('Welcome')).toBeVisible();
    });
  });
});
```

### Mobile Testing Patterns
```javascript
test.describe('Mobile tests', () => {
  test.use({ 
    ...devices['iPhone 12'],
    // Override specific properties
    viewport: { width: 375, height: 812 }
  });

  test('mobile navigation', async ({ page }) => {
    await page.goto('/');
    
    // Mobile-specific interactions
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Touch interactions
    await page.touchscreen.tap(100, 200);
  });
});
```

### Performance Monitoring
```javascript
test('performance monitoring', async ({ page }) => {
  // Start performance monitoring
  await page.coverage.startCSSCoverage();
  await page.coverage.startJSCoverage();
  
  await page.goto('/');
  
  // Measure performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
    };
  });
  
  expect(metrics.loadTime).toBeLessThan(3000); // Less than 3 seconds
  
  // Get coverage reports
  const [jsCoverage, cssCoverage] = await Promise.all([
    page.coverage.stopJSCoverage(),
    page.coverage.stopCSSCoverage(),
  ]);
});
```

## Test Configuration Patterns

### Environment-Specific Tests
```javascript
// Tests that only run in specific environments
test.describe('Production tests', () => {
  test.skip(process.env.NODE_ENV !== 'production', 'Production only tests');
  
  test('production feature', async ({ page }) => {
    // Test that only runs in production
  });
});

// Conditional test execution
test.describe.configure({ 
  mode: process.env.CI ? 'parallel' : 'serial' 
});
```

### Annotation and Tagging
```javascript
test('critical user flow @smoke @critical', async ({ page }) => {
  // Critical test that should run in smoke test suite
});

test('regression test @regression', async ({ page }) => {
  // Regression test
});

// Skip or focus tests
test.skip('broken test', async ({ page }) => {
  // Temporarily skip this test
});

test.only('focused test', async ({ page }) => {
  // Only run this test
});
```