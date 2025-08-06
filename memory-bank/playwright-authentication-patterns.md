# Playwright Authentication Patterns

## Global Authentication Setup

### Authentication State Management
```javascript
// auth.setup.js - Global authentication setup
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Perform authentication steps
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD || 'password123');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Wait for successful login
  await page.waitForURL('/dashboard');
  await expect(page.getByText('Welcome')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});
```

### Configuration with Authentication
```javascript
// playwright.config.js
export default defineConfig({
  // Define setup project
  projects: [
    { 
      name: 'setup', 
      testMatch: /.*\.setup\.js/ 
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup'],
    },
  ],
});
```

## Multiple User Authentication

### Multi-User Setup
```javascript
// auth.setup.js - Multiple users
import { test as setup } from '@playwright/test';

// Admin user setup
setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/admin');
  
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});

// Regular user setup
setup('authenticate as user', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('user123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/dashboard');
  
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// Guest user (no auth)
setup('guest user', async ({ page }) => {
  // Just save empty state for guest tests
  await page.context().storageState({ path: 'playwright/.auth/guest.json' });
});
```

### Project Configuration for Multiple Users
```javascript
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.js/ },
    
    // Admin tests
    {
      name: 'admin-tests',
      testMatch: /.*admin.*\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json'
      },
      dependencies: ['setup'],
    },
    
    // User tests
    {
      name: 'user-tests',
      testMatch: /.*user.*\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup'],
    },
    
    // Guest tests
    {
      name: 'guest-tests',
      testMatch: /.*guest.*\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/guest.json'
      },
      dependencies: ['setup'],
    }
  ],
});
```

## Authentication Helpers and Utilities

### Reusable Authentication Functions
```javascript
// utils/auth.js
export async function loginAsUser(page, email, password) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Wait for successful login
  await page.waitForURL('/dashboard');
  await expect(page.getByText('Welcome')).toBeVisible();
}

export async function loginAsAdmin(page) {
  await loginAsUser(page, 'admin@example.com', 'admin123');
  await page.waitForURL('/admin');
}

export async function logout(page) {
  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('/login');
}

export async function ensureLoggedIn(page, userType = 'user') {
  // Check if already logged in
  const isLoggedIn = await page.getByTestId('user-menu').isVisible();
  
  if (!isLoggedIn) {
    if (userType === 'admin') {
      await loginAsAdmin(page);
    } else {
      await loginAsUser(page, 'user@example.com', 'user123');
    }
  }
}
```

### Custom Authentication Fixture
```javascript
// fixtures/auth.js
import { test as base, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin, logout } from '../utils/auth.js';

export const test = base.extend({
  // Authenticated user page
  authenticatedUser: async ({ page }, use) => {
    await loginAsUser(page, 'user@example.com', 'user123');
    await use(page);
    await logout(page);
  },
  
  // Authenticated admin page
  authenticatedAdmin: async ({ page }, use) => {
    await loginAsAdmin(page);
    await use(page);
    await logout(page);
  },
  
  // Multiple users
  users: async ({ browser }, use) => {
    const userContext = await browser.newContext();
    const adminContext = await browser.newContext();
    
    const userPage = await userContext.newPage();
    const adminPage = await adminContext.newPage();
    
    await loginAsUser(userPage, 'user@example.com', 'user123');
    await loginAsAdmin(adminPage);
    
    await use({ user: userPage, admin: adminPage });
    
    await userContext.close();
    await adminContext.close();
  }
});

export { expect } from '@playwright/test';
```

## OAuth and Social Authentication

### OAuth Flow Testing
```javascript
test('OAuth login flow', async ({ page, context }) => {
  // Mock OAuth provider
  await page.route('**/oauth/authorize', route => {
    // Redirect to callback with mock code
    const url = new URL(route.request().url());
    const redirectUri = url.searchParams.get('redirect_uri');
    
    route.fulfill({
      status: 302,
      headers: {
        'Location': `${redirectUri}?code=mock_auth_code&state=${url.searchParams.get('state')}`
      }
    });
  });
  
  await page.route('**/oauth/token', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock_access_token',
        token_type: 'Bearer',
        expires_in: 3600
      })
    });
  });
  
  await page.route('**/oauth/user', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'oauth_user_123',
        name: 'OAuth User',
        email: 'oauth@example.com'
      })
    });
  });
  
  // Test OAuth flow
  await page.goto('/login');
  await page.getByRole('button', { name: 'Login with OAuth' }).click();
  
  // Should redirect back and complete login
  await page.waitForURL('/dashboard');
  await expect(page.getByText('Welcome, OAuth User')).toBeVisible();
});
```

### Social Login Mocking
```javascript
test('Google OAuth login', async ({ page }) => {
  // Mock Google OAuth endpoints
  await page.route('**/accounts.google.com/oauth2/auth', route => {
    const url = new URL(route.request().url());
    const redirectUri = url.searchParams.get('redirect_uri');
    const state = url.searchParams.get('state');
    
    // Simulate successful Google auth
    route.fulfill({
      status: 302,
      headers: {
        'Location': `${redirectUri}?code=google_mock_code&state=${state}`
      }
    });
  });
  
  await page.route('**/oauth2.googleapis.com/token', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'google_access_token',
        id_token: 'google_id_token',
        token_type: 'Bearer',
        expires_in: 3600
      })
    });
  });
  
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  
  await expect(page).toHaveURL('/dashboard');
});
```

## Token-Based Authentication

### JWT Token Management
```javascript
// utils/jwt-auth.js
export class JWTAuth {
  constructor(page) {
    this.page = page;
  }
  
  async setAuthToken(token) {
    // Set token in local storage
    await this.page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, token);
    
    // Set authorization header for all requests
    await this.page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  
  async generateMockToken(payload = {}) {
    const defaultPayload = {
      sub: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };
    
    // In real app, you'd properly sign the JWT
    // For testing, we just base64 encode
    const mockToken = btoa(JSON.stringify({ ...defaultPayload, ...payload }));
    return `mock.${mockToken}.signature`;
  }
  
  async loginWithToken(payload = {}) {
    const token = await this.generateMockToken(payload);
    await this.setAuthToken(token);
    
    // Mock token validation endpoint
    await this.page.route('/api/auth/validate', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, ...payload })
      });
    });
    
    return token;
  }
}

// Usage in tests
test('JWT authentication', async ({ page }) => {
  const auth = new JWTAuth(page);
  
  await auth.loginWithToken({
    name: 'Admin User',
    role: 'admin'
  });
  
  await page.goto('/admin');
  await expect(page.getByText('Admin Dashboard')).toBeVisible();
});
```

### API Key Authentication
```javascript
test('API key authentication', async ({ page }) => {
  const apiKey = 'test-api-key-12345';
  
  // Set API key in context
  await page.setExtraHTTPHeaders({
    'X-API-Key': apiKey
  });
  
  // Mock API key validation
  await page.route('/api/**', async route => {
    const request = route.request();
    const headers = request.headers();
    
    if (headers['x-api-key'] !== apiKey) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid API key' })
      });
      return;
    }
    
    await route.continue();
  });
  
  await page.goto('/api-dashboard');
});
```

## Session and Cookie-Based Authentication

### Cookie Authentication
```javascript
test('cookie-based authentication', async ({ page, context }) => {
  // Set authentication cookies
  await context.addCookies([
    {
      name: 'session_id',
      value: 'mock-session-12345',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    },
    {
      name: 'csrf_token',
      value: 'mock-csrf-token',
      domain: 'localhost',
      path: '/'
    }
  ]);
  
  // Mock session validation
  await page.route('/api/auth/session', route => {
    const cookies = route.request().headers()['cookie'] || '';
    
    if (cookies.includes('session_id=mock-session-12345')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          user: { id: 1, name: 'Session User' }
        })
      });
    } else {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false })
      });
    }
  });
  
  await page.goto('/dashboard');
  await expect(page.getByText('Welcome, Session User')).toBeVisible();
});
```

## Multi-Factor Authentication (MFA)

### MFA Flow Testing
```javascript
test('two-factor authentication flow', async ({ page }) => {
  // Mock TOTP verification
  await page.route('/api/auth/verify-totp', route => {
    const body = JSON.parse(route.request().postData());
    
    // Accept mock TOTP code
    if (body.code === '123456') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'authenticated-token'
        })
      });
    } else {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid code'
        })
      });
    }
  });
  
  await page.goto('/login');
  
  // Step 1: Username/password
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Step 2: TOTP code
  await expect(page.getByText('Enter verification code')).toBeVisible();
  await page.getByLabel('Verification Code').fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();
  
  // Should be logged in
  await expect(page).toHaveURL('/dashboard');
});
```

## Permission and Role-Based Testing

### Role-Based Access Testing
```javascript
test.describe('Role-based access control', () => {
  test('admin can access admin panel', async ({ page }) => {
    const auth = new JWTAuth(page);
    await auth.loginWithToken({ role: 'admin' });
    
    await page.goto('/admin');
    await expect(page.getByText('Admin Panel')).toBeVisible();
  });
  
  test('user cannot access admin panel', async ({ page }) => {
    const auth = new JWTAuth(page);
    await auth.loginWithToken({ role: 'user' });
    
    await page.goto('/admin');
    await expect(page.getByText('Access Denied')).toBeVisible();
  });
  
  test('guest redirected to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/login');
  });
});
```