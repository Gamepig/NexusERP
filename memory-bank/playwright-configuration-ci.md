# Playwright Configuration and CI/CD Setup

## Configuration File Structure

### Complete playwright.config.js Example
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Timeout settings
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // Global test settings
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Browser context options
    headless: !!process.env.CI,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Recording options
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Authentication
    storageState: process.env.STORAGE_STATE || undefined
  },
  
  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    
    // Authenticated tests
    {
      name: 'logged-in',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup'],
    }
  ],
  
  // Web server configuration
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  // Global setup and teardown
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
});
```

### Environment-Specific Configurations
```javascript
// playwright.config.prod.js
import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.js';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: 'https://production.example.com',
    headless: true
  },
  retries: 3,
  workers: 2
});

// playwright.config.local.js
export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:3000',
    headless: false,
    slowMo: 500
  },
  workers: 1
});
```

## Reporter Configuration

### HTML Reporter
```javascript
reporter: [
  ['html', {
    open: 'never', // 'always', 'never', 'on-failure'
    outputFolder: 'playwright-report',
    host: 'localhost',
    port: 9323
  }]
]
```

### Custom Reporter
```javascript
// custom-reporter.js
class CustomReporter {
  onBegin(config, suite) {
    console.log(`Starting the run with ${suite.allTests().length} tests`);
  }

  onTestBegin(test, result) {
    console.log(`Starting test ${test.title}`);
  }

  onTestEnd(test, result) {
    console.log(`Finished test ${test.title}: ${result.status}`);
  }

  onEnd(result) {
    console.log(`Finished the run: ${result.status}`);
  }
}

module.exports = CustomReporter;
```

### Multiple Reporters
```javascript
reporter: [
  ['list'],
  ['json', { outputFile: 'test-results.json' }],
  ['html', { open: 'never' }],
  ['./custom-reporter.js']
]
```

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - uses: actions/setup-node@v4
      with:
        node-version: lts/*
        
    - name: Install dependencies
      run: npm ci
      
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
      
    - name: Run Playwright tests
      run: npx playwright test
      
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### Docker CI
```dockerfile
# Dockerfile.playwright
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Run tests
CMD ["npx", "playwright", "test"]
```

### GitLab CI
```yaml
# .gitlab-ci.yml
stages:
  - test

playwright:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  script:
    - npm ci
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
    expire_in: 1 week
```

### Jenkins Pipeline
```groovy
pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.40.0-focal'
        }
    }
    
    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npx playwright test'
            }
            
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright Report'
                    ])
                }
            }
        }
    }
}
```

## Environment Variables

### Common Environment Variables
```bash
# Test execution
CI=true                    # Enable CI mode
HEADED=false              # Run in headless mode
PLAYWRIGHT_WORKERS=2      # Number of workers

# Browser settings
PLAYWRIGHT_BROWSERS_PATH=/custom/path
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Debugging
DEBUG=pw:api              # Debug API calls
PWDEBUG=1                # Enable debugging
PLAYWRIGHT_SLOW_MO=1000   # Slow down actions

# Base URL
BASE_URL=https://staging.example.com

# Authentication
STORAGE_STATE=auth.json
```

### Environment-Specific Configs
```javascript
// utils/config.js
export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      baseURL: 'http://localhost:3000',
      headless: false,
      workers: 1
    },
    staging: {
      baseURL: 'https://staging.example.com',
      headless: true,
      workers: 2
    },
    production: {
      baseURL: 'https://example.com',
      headless: true,
      workers: 4
    }
  };
  
  return configs[env];
};
```

## Global Setup and Teardown

### Global Setup
```javascript
// global-setup.js
async function globalSetup(config) {
  // Start database
  await startTestDatabase();
  
  // Seed test data
  await seedTestData();
  
  // Setup authentication
  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Login and save state
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();
  
  await page.context().storageState({ 
    path: 'playwright/.auth/admin.json' 
  });
  
  await browser.close();
}

module.exports = globalSetup;
```

### Global Teardown
```javascript
// global-teardown.js
async function globalTeardown(config) {
  // Cleanup test data
  await cleanupTestData();
  
  // Stop services
  await stopTestDatabase();
  
  // Remove auth files
  const fs = require('fs');
  if (fs.existsSync('playwright/.auth')) {
    fs.rmSync('playwright/.auth', { recursive: true, force: true });
  }
}

module.exports = globalTeardown;
```

## Sharding and Parallel Execution

### Test Sharding
```bash
# Run tests in shards
npx playwright test --shard=1/3
npx playwright test --shard=2/3
npx playwright test --shard=3/3

# GitHub Actions sharding
```

```yaml
strategy:
  fail-fast: false
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - name: Run Playwright tests
    run: npx playwright test --shard=${{ matrix.shard }}/4
```

### Worker Configuration
```javascript
// Adjust workers based on environment
export default defineConfig({
  workers: process.env.CI 
    ? 2  // Limited workers in CI
    : Math.max(1, Math.floor(require('os').cpus().length / 2))
});
```

## Test Organization and Filtering

### Test Tagging
```javascript
// Tag tests for different execution groups
test('login @smoke @critical', async ({ page }) => {
  // Critical smoke test
});

test('admin features @admin', async ({ page }) => {
  // Admin-only test
});

test('mobile responsive @mobile', async ({ page }) => {
  // Mobile-specific test
});
```

### Running Tagged Tests
```bash
# Run smoke tests only
npx playwright test --grep "@smoke"

# Run all except admin tests
npx playwright test --grep-invert "@admin"

# Run specific test files
npx playwright test auth.spec.js user.spec.js

# Run tests by project
npx playwright test --project=chromium
```

### Test Filtering in Config
```javascript
export default defineConfig({
  // Only run smoke tests in CI
  grep: process.env.CI ? /@smoke/ : undefined,
  
  // Exclude admin tests in staging
  grepInvert: process.env.ENVIRONMENT === 'staging' ? /@admin/ : undefined
});
```