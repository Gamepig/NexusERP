# Playwright Installation and Setup Guide

## Installation Methods

### Node.js Installation
```bash
# Install Playwright with npm
npm init playwright@latest

# Or with existing project
npm install -D @playwright/test
npm install -D playwright

# Install browsers
npx playwright install
```

### Python Installation
```bash
# Install with pip
pip install playwright pytest-playwright

# Install browsers
playwright install
```

### Docker Installation
```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal
WORKDIR /app
COPY . .
RUN npm install
```

## Project Setup

### Configuration File (playwright.config.js/ts)
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
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
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "module": "commonjs",
    "target": "ES2019",
    "lib": ["ES2019", "dom", "dom.iterable"],
    "types": ["node", "@playwright/test"]
  }
}
```

### Environment Setup
```bash
# Set environment variables
export PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers
export DEBUG=pw:api  # Enable debug logs
export PWDEBUG=1     # Enable headed mode with debugging
```

## Browser Installation Options
- `--with-deps`: Install system dependencies
- `--only-shell`: Install shell only  
- Specific browsers: `chromium`, `firefox`, `webkit`
- Force reinstall: `--force`

## Common Setup Issues and Solutions

### Permission Issues
```bash
# Fix permissions on Linux/macOS
sudo chown -R $(whoami) ~/.cache/ms-playwright
```

### System Dependencies
```bash
# Ubuntu/Debian
sudo apt-get install libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2

# CentOS/RHEL
sudo yum install -y nss atk java-atk-wrapper at-spi2-atk gtk3 libdrm libxkbcommon libxcomposite libxdamage libxrandr mesa-libgbm
```

### CI/CD Environment Variables
```bash
CI=true                    # Enables CI mode
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1  # Skip browser download
PLAYWRIGHT_BROWSERS_PATH=./browsers # Custom browser path
```

## Best Practices
- Use `baseURL` in config to avoid hardcoding URLs
- Set appropriate timeouts for CI environments
- Use `fullyParallel: true` for faster test execution
- Configure retries for flaky environments
- Use traces and screenshots for debugging