# Playwright Parallel Testing and Fixtures

## Parallel Testing Configuration

### Worker Configuration
```javascript
// playwright.config.js
export default defineConfig({
  // Enable full parallelization
  fullyParallel: true,
  
  // Configure workers
  workers: process.env.CI ? 2 : undefined, // 2 workers in CI, auto-detect locally
  
  // Alternative: specific worker count
  workers: 4,
  
  // Timeout for each test
  timeout: 30000,
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
  
  // Reporter for parallel execution
  reporter: [
    ['html'],
    process.env.CI ? ['github'] : ['list']
  ]
});
```

### Controlling Parallelization
```javascript
// Disable parallelization for specific test group
test.describe.configure({ mode: 'serial' });

test.describe('Database setup tests', () => {
  // These tests will run serially
  test('setup database', async ({ page }) => {
    // Database setup
  });
  
  test('seed data', async ({ page }) => {
    // Data seeding
  });
});

// Force parallel execution
test.describe.configure({ mode: 'parallel' });
```

### Test Isolation Strategies
```javascript
test.describe('Isolated test suite', () => {
  test.beforeEach(async ({ page }) => {
    // Each test gets fresh data
    await setupFreshTestData();
    await page.goto('/');
  });
  
  test.afterEach(async ({ page }) => {
    // Clean up after each test
    await cleanupTestData();
  });
  
  test('test 1', async ({ page }) => {
    // This test runs in isolation
  });
  
  test('test 2', async ({ page }) => {
    // This test also runs in isolation
  });
});
```

## Custom Fixtures

### Basic Custom Fixtures
```javascript
// fixtures/base.js
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Simple data fixture
  todoData: async ({}, use) => {
    const todos = [
      { id: 1, title: 'Learn Playwright', completed: false },
      { id: 2, title: 'Write tests', completed: true }
    ];
    await use(todos);
  },
  
  // Page with pre-loaded data
  todoPage: async ({ page, todoData }, use) => {
    // Mock API with todo data
    await page.route('/api/todos', route => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(todoData)
      });
    });
    
    await page.goto('/todos');
    await use(page);
  }
});
```

### Database Fixtures
```javascript
// fixtures/database.js
import { test as base } from '@playwright/test';
import { createTestDatabase, cleanupDatabase } from '../utils/database.js';

export const test = base.extend({
  // Database fixture with automatic cleanup
  database: async ({}, use) => {
    const db = await createTestDatabase();
    
    try {
      await use(db);
    } finally {
      await cleanupDatabase(db);
    }
  },
  
  // Pre-seeded database
  seededDatabase: async ({ database }, use) => {
    // Seed with test data
    await database.users.create({
      email: 'test@example.com',
      name: 'Test User'
    });
    
    await database.products.createMany([
      { name: 'Product 1', price: 100 },
      { name: 'Product 2', price: 200 }
    ]);
    
    await use(database);
  }
});
```

### API Client Fixtures
```javascript
// fixtures/api.js
import { test as base } from '@playwright/test';

class APIClient {
  constructor(request, baseURL) {
    this.request = request;
    this.baseURL = baseURL;
  }
  
  async getUsers() {
    const response = await this.request.get(`${this.baseURL}/api/users`);
    return response.json();
  }
  
  async createUser(userData) {
    const response = await this.request.post(`${this.baseURL}/api/users`, {
      data: userData
    });
    return response.json();
  }
  
  async deleteUser(userId) {
    return this.request.delete(`${this.baseURL}/api/users/${userId}`);
  }
}

export const test = base.extend({
  apiClient: async ({ request }, use) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';
    const client = new APIClient(request, baseURL);
    await use(client);
  },
  
  authenticatedAPI: async ({ request }, use) => {
    // Create API client with authentication
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';
    
    // Get auth token
    const authResponse = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    });
    const { token } = await authResponse.json();
    
    // Create authenticated request context
    const authenticatedRequest = request;
    await authenticatedRequest.setExtraHTTPHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    const client = new APIClient(authenticatedRequest, baseURL);
    await use(client);
  }
});
```

### Page Object Fixtures
```javascript
// fixtures/pages.js
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { ProductsPage } from '../pages/ProductsPage.js';

export const test = base.extend({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
  
  productsPage: async ({ page }, use) => {
    const productsPage = new ProductsPage(page);
    await use(productsPage);
  },
  
  // Authenticated pages
  authenticatedPages: async ({ page }, use) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    // Return all page objects
    await use({
      login: loginPage,
      dashboard: new DashboardPage(page),
      products: new ProductsPage(page)
    });
  }
});
```

## Advanced Fixture Patterns

### Fixture Dependencies
```javascript
export const test = base.extend({
  // Base fixture
  userEmail: async ({}, use) => {
    await use('test@example.com');
  },
  
  // Depends on userEmail
  authenticatedUser: async ({ userEmail, page }, use) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    const user = { email: userEmail, isAuthenticated: true };
    await use(user);
  },
  
  // Depends on authenticatedUser
  userDashboard: async ({ authenticatedUser, page }, use) => {
    await page.goto('/dashboard');
    await use(page);
  }
});
```

### Conditional Fixtures
```javascript
export const test = base.extend({
  // Conditional authentication
  maybeAuthenticated: async ({ page }, use, testInfo) => {
    // Check if test needs authentication
    const needsAuth = testInfo.title.includes('@auth');
    
    if (needsAuth) {
      await page.goto('/login');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Login' }).click();
    }
    
    await use(page);
  }
});
```

### Shared State Fixtures
```javascript
export const test = base.extend({
  // Shared worker-scoped fixture
  sharedDatabase: [async ({}, use) => {
    const db = await createSharedDatabase();
    await use(db);
    // Database persists across tests in same worker
  }, { scope: 'worker' }],
  
  // Test-scoped transaction
  transaction: async ({ sharedDatabase }, use) => {
    const transaction = await sharedDatabase.beginTransaction();
    try {
      await use(transaction);
    } finally {
      await transaction.rollback(); // Each test gets clean state
    }
  }
});
```

## Parallel Data Management

### Test Data Isolation
```javascript
// utils/test-data.js
export class TestDataManager {
  constructor() {
    this.testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  createUser(overrides = {}) {
    return {
      email: `user_${this.testId}@example.com`,
      name: `Test User ${this.testId}`,
      ...overrides
    };
  }
  
  createProduct(overrides = {}) {
    return {
      name: `Product ${this.testId}`,
      sku: `SKU_${this.testId}`,
      price: 100,
      ...overrides
    };
  }
}

// In fixtures
export const test = base.extend({
  testData: async ({}, use) => {
    const manager = new TestDataManager();
    await use(manager);
  }
});
```

### Unique Test Resources
```javascript
test('create unique user', async ({ page, testData }) => {
  const userData = testData.createUser({
    role: 'admin'
  });
  
  // This creates a unique user for this test
  await page.goto('/users/create');
  await page.getByLabel('Email').fill(userData.email);
  await page.getByLabel('Name').fill(userData.name);
  await page.selectOption('#role', userData.role);
  await page.getByRole('button', { name: 'Create' }).click();
  
  await expect(page.getByText(`User ${userData.name} created`)).toBeVisible();
});
```

## Worker-Scoped Fixtures

### Expensive Setup Operations
```javascript
export const test = base.extend({
  // Worker-scoped database connection
  workerDatabase: [async ({}, use) => {
    console.log('Setting up database connection for worker');
    const db = await createDatabaseConnection();
    await use(db);
    await db.close();
    console.log('Closed database connection for worker');
  }, { scope: 'worker' }],
  
  // Worker-scoped server
  testServer: [async ({}, use) => {
    console.log('Starting test server for worker');
    const server = await startTestServer();
    await use(server);
    await server.stop();
    console.log('Stopped test server for worker');
  }, { scope: 'worker' }]
});
```

### Shared Authentication State
```javascript
export const test = base.extend({
  // Worker-scoped authentication
  workerAuth: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login once per worker
    await page.goto('/login');
    await page.getByLabel('Email').fill('worker@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Save auth state
    const storageState = await context.storageState();
    await context.close();
    
    await use(storageState);
  }, { scope: 'worker' }],
  
  // Test-scoped authenticated page
  authenticatedPage: async ({ browser, workerAuth }, use) => {
    const context = await browser.newContext({ storageState: workerAuth });
    const page = await context.newPage();
    await use(page);
    await context.close();
  }
});
```

## Test Execution Patterns

### Grouped Test Execution
```javascript
test.describe('User Management @group:user', () => {
  test('create user', async ({ page }) => {
    // Test implementation
  });
  
  test('edit user', async ({ page }) => {
    // Test implementation
  });
});

test.describe('Product Management @group:product', () => {
  test('create product', async ({ page }) => {
    // Test implementation
  });
});
```

### Sequential Dependencies
```javascript
test.describe('E2E User Journey', () => {
  test.describe.configure({ mode: 'serial' });
  
  let userId;
  
  test('register user', async ({ page }) => {
    await page.goto('/register');
    // Registration flow
    userId = await page.textContent('[data-testid="user-id"]');
  });
  
  test('login user', async ({ page }) => {
    test.skip(!userId, 'User registration failed');
    // Login with registered user
  });
  
  test('complete profile', async ({ page }) => {
    test.skip(!userId, 'User not available');
    // Complete user profile
  });
});
```

### Test Hooks with Fixtures
```javascript
export const test = base.extend({
  testMetrics: async ({}, use, testInfo) => {
    const startTime = Date.now();
    
    await use({
      testName: testInfo.title,
      startTime
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log test metrics
    console.log(`Test "${testInfo.title}" took ${duration}ms`);
    
    // Store metrics for reporting
    if (testInfo.status === 'failed') {
      console.log(`Failed test metrics: ${JSON.stringify({
        name: testInfo.title,
        duration,
        error: testInfo.error?.message
      })}`);
    }
  }
});
```

## Best Practices for Parallel Testing

### Avoiding Test Interference
```javascript
// Good: Each test creates its own data
test('user can create post', async ({ page, testData }) => {
  const user = testData.createUser();
  const post = testData.createPost({ authorId: user.id });
  
  // Test with unique data
});

// Bad: Tests share data and can interfere
let sharedUserId;
test('create user', async ({ page }) => {
  // Sets global state
  sharedUserId = await createUser();
});

test('use shared user', async ({ page }) => {
  // Depends on global state - fragile
  await page.goto(`/users/${sharedUserId}`);
});
```

### Resource Management
```javascript
test.afterEach(async ({ page }) => {
  // Clean up resources after each test
  await page.evaluate(() => {
    // Clear local storage
    localStorage.clear();
    // Clear session storage
    sessionStorage.clear();
    // Clear any test-specific global variables
    delete window.testData;
  });
});

test.afterAll(async () => {
  // Clean up shared resources
  await cleanupTestDatabase();
  await stopTestServices();
});
```