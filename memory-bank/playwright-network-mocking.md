# Playwright Network Handling and Mocking

## Network Interception and Routing

### Basic Request Interception
```javascript
test('intercept and modify requests', async ({ page }) => {
  // Intercept all API requests
  await page.route('/api/**', route => {
    console.log('Request URL:', route.request().url());
    console.log('Request method:', route.request().method());
    console.log('Request headers:', route.request().headers());
    
    // Continue with original request
    route.continue();
  });
  
  // Intercept specific endpoint
  await page.route('/api/users', async route => {
    const request = route.request();
    
    // Log request details
    console.log('Request payload:', request.postData());
    
    // Continue request
    await route.continue();
  });
  
  await page.goto('/users');
});
```

### Response Mocking
```javascript
test('mock API responses', async ({ page }) => {
  // Mock successful response
  await page.route('/api/users', async route => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Custom-Header': 'test-value'
      },
      body: JSON.stringify(mockUsers)
    });
  });
  
  // Mock error response
  await page.route('/api/orders', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' })
    });
  });
  
  await page.goto('/dashboard');
  await expect(page.getByText('John Doe')).toBeVisible();
});
```

### Request Modification
```javascript
test('modify requests before sending', async ({ page }) => {
  await page.route('/api/**', async route => {
    const request = route.request();
    
    // Add authentication header
    const headers = {
      ...request.headers(),
      'Authorization': 'Bearer test-token',
      'X-Test-Mode': 'true'
    };
    
    // Modify request URL
    const url = request.url().replace('/api/', '/api/v2/');
    
    // Continue with modifications
    await route.continue({
      url,
      headers,
      // Modify POST data if needed
      postData: request.method() === 'POST' 
        ? JSON.stringify({ ...JSON.parse(request.postData()), modified: true })
        : undefined
    });
  });
  
  await page.goto('/');
});
```

## Advanced Mocking Patterns

### Dynamic Response Generation
```javascript
test('dynamic mock responses', async ({ page }) => {
  let requestCount = 0;
  
  await page.route('/api/data', route => {
    requestCount++;
    
    // Return different responses based on request count
    const responses = [
      { data: 'First load', timestamp: Date.now() },
      { data: 'Subsequent load', timestamp: Date.now() },
      { error: 'Rate limited', status: 429 }
    ];
    
    const response = responses[Math.min(requestCount - 1, responses.length - 1)];
    const status = response.status || 200;
    
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
  
  await page.goto('/data');
});
```

### Conditional Mocking
```javascript
test('conditional mocking based on request', async ({ page }) => {
  await page.route('/api/users', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const searchParams = url.searchParams;
    
    // Mock based on query parameters
    if (searchParams.get('role') === 'admin') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Admin User', role: 'admin' }
        ])
      });
    } else if (searchParams.get('active') === 'true') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 2, name: 'Active User', active: true }
        ])
      });
    } else {
      // Use real API for other requests
      await route.continue();
    }
  });
  
  await page.goto('/users?role=admin');
  await expect(page.getByText('Admin User')).toBeVisible();
});
```

### File-Based Mocks
```javascript
// mock-data/users.json
{
  "users": [
    { "id": 1, "name": "Mock User 1" },
    { "id": 2, "name": "Mock User 2" }
  ]
}

// test file
test('file-based mocking', async ({ page }) => {
  const fs = require('fs');
  const path = require('path');
  
  await page.route('/api/users', async route => {
    const mockData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'mock-data/users.json'), 'utf8')
    );
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData)
    });
  });
  
  await page.goto('/users');
});
```

## Network Monitoring and Testing

### Request/Response Logging
```javascript
test('log network activity', async ({ page }) => {
  const requests = [];
  const responses = [];
  
  // Log all requests
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
    console.log(`→ ${request.method()} ${request.url()}`);
  });
  
  // Log all responses
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers()
    });
    console.log(`← ${response.status()} ${response.url()}`);
  });
  
  await page.goto('/');
  
  // Assert network behavior
  expect(requests.some(r => r.url.includes('/api/users'))).toBeTruthy();
  expect(responses.some(r => r.status === 200)).toBeTruthy();
});
```

### Network Failure Testing
```javascript
test('handle network failures', async ({ page }) => {
  // Simulate network failure
  await page.route('/api/critical-data', route => {
    route.abort('failed');
  });
  
  // Simulate slow network
  await page.route('/api/slow-endpoint', async route => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await route.continue();
  });
  
  // Simulate timeout
  await page.route('/api/timeout', route => {
    // Never respond, causing timeout
  });
  
  await page.goto('/');
  
  // Verify error handling
  await expect(page.getByText('Failed to load data')).toBeVisible();
});
```

### Performance Testing with Network Conditions
```javascript
test('test under slow network conditions', async ({ page, context }) => {
  // Throttle network
  await context.route('**/*', async route => {
    // Add delay to simulate slow network
    await new Promise(resolve => setTimeout(resolve, 100));
    await route.continue();
  });
  
  const startTime = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - startTime;
  
  // Verify page still loads within acceptable time
  expect(loadTime).toBeLessThan(10000); // 10 seconds
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

## Authentication and Session Management

### Mock Authentication
```javascript
test('mock authentication flow', async ({ page }) => {
  // Mock login endpoint
  await page.route('/api/auth/login', async route => {
    const request = route.request();
    const credentials = JSON.parse(request.postData());
    
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: { id: 1, name: 'Test User', email: 'test@example.com' }
        })
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    }
  });
  
  // Mock authenticated requests
  await page.route('/api/**', async route => {
    const request = route.request();
    const authHeader = request.headers()['authorization'];
    
    if (!authHeader || !authHeader.includes('mock-jwt-token')) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
      return;
    }
    
    await route.continue();
  });
  
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();
  
  await expect(page).toHaveURL('/dashboard');
});
```

### Session State Management
```javascript
test('manage session state', async ({ page }) => {
  // Mock session validation
  await page.route('/api/auth/validate', route => {
    const sessionCookie = route.request().headers()['cookie'];
    
    if (sessionCookie && sessionCookie.includes('session=valid')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, user: { id: 1, name: 'User' } })
      });
    } else {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ valid: false })
      });
    }
  });
  
  // Set session cookie
  await page.context().addCookies([{
    name: 'session',
    value: 'valid',
    domain: 'localhost',
    path: '/'
  }]);
  
  await page.goto('/dashboard');
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

## WebSocket and Real-time Communication

### WebSocket Mocking
```javascript
test('mock WebSocket connections', async ({ page }) => {
  await page.goto('/chat');
  
  // Evaluate in browser context to mock WebSocket
  await page.evaluate(() => {
    // Store original WebSocket
    const OriginalWebSocket = window.WebSocket;
    
    // Mock WebSocket class
    class MockWebSocket {
      constructor(url) {
        this.url = url;
        this.readyState = MockWebSocket.CONNECTING;
        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;
        
        // Simulate connection
        setTimeout(() => {
          this.readyState = MockWebSocket.OPEN;
          if (this.onopen) this.onopen();
          
          // Send mock message
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({
                data: JSON.stringify({ type: 'message', content: 'Hello from mock WebSocket' })
              });
            }
          }, 100);
        }, 50);
      }
      
      send(data) {
        console.log('Mock WebSocket send:', data);
        // Echo back the message
        if (this.onmessage) {
          setTimeout(() => {
            this.onmessage({
              data: JSON.stringify({ type: 'echo', content: data })
            });
          }, 50);
        }
      }
      
      close() {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) this.onclose();
      }
    }
    
    MockWebSocket.CONNECTING = 0;
    MockWebSocket.OPEN = 1;
    MockWebSocket.CLOSING = 2;
    MockWebSocket.CLOSED = 3;
    
    // Replace global WebSocket
    window.WebSocket = MockWebSocket;
  });
  
  // Test WebSocket functionality
  await page.getByRole('button', { name: 'Connect' }).click();
  await expect(page.getByText('Connected')).toBeVisible();
  
  await page.getByLabel('Message').fill('Test message');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Echo: Test message')).toBeVisible();
});
```

## GraphQL API Mocking

### GraphQL Response Mocking
```javascript
test('mock GraphQL queries', async ({ page }) => {
  await page.route('/graphql', async route => {
    const request = route.request();
    const body = JSON.parse(request.postData());
    const query = body.query;
    
    // Mock different queries
    if (query.includes('getUsers')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            users: [
              { id: '1', name: 'User 1', email: 'user1@example.com' },
              { id: '2', name: 'User 2', email: 'user2@example.com' }
            ]
          }
        })
      });
    } else if (query.includes('createUser')) {
      const variables = body.variables;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            createUser: {
              id: '3',
              name: variables.name,
              email: variables.email
            }
          }
        })
      });
    } else {
      await route.continue();
    }
  });
  
  await page.goto('/users');
  await expect(page.getByText('User 1')).toBeVisible();
});
```