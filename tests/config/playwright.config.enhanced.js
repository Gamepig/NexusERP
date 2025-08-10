/**
 * Enhanced Playwright Configuration for NexusERP
 * 專為 Laravel ERP 系統優化的測試配置
 * 
 * Features:
 * - Multiple browser support with mobile testing
 * - Comprehensive reporting and debugging
 * - Session persistence and authentication
 * - Laravel-specific configurations
 * - Screenshot and video recording
 * - Network request logging
 * - Parallel execution optimization
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test Directory Configuration
  testDir: './tests',
  testMatch: [
    '**/comprehensive/*.spec.js',
    '**/integration/*.spec.js',
    '**/e2e/*.spec.js'
  ],
  
  // Global Configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  
  // Reporting Configuration
  reporter: [
    ['html', { 
      outputFolder: 'test-results/html-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { 
      outputFile: 'test-results/test-results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/junit-results.xml' 
    }],
    ['list'],
    ['github']
  ],

  // Global Test Settings
  use: {
    // Base URL - Laravel application
    baseURL: 'http://127.0.0.1:8000',
    
    // Browser Settings
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Media Settings
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    trace: 'retain-on-failure',
    
    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Laravel-specific settings
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    
    // Session persistence
    storageState: process.env.STORAGE_STATE,
    
    // Network settings
    offline: false,
    httpCredentials: undefined,
    
    // Mobile emulation disabled by default
    hasTouch: false,
    isMobile: false,
    
    // Locale and timezone
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    
    // Color scheme
    colorScheme: 'light'
  },

  // Browser Projects Configuration
  projects: [
    // Desktop Browsers
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Tablet Testing
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 }
      },
    },
    
    // Mobile Testing
    {
      name: 'mobile-chrome',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 }
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
        browserName: 'webkit',
        viewport: { width: 390, height: 844 }
      },
    },
    
    // Authentication Setup Project
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.js/,
    },
    
    // Authenticated Tests
    {
      name: 'authenticated-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: [
        '**/comprehensive/*.spec.js',
        '!**/auth-tests.spec.js' // Skip auth tests for authenticated context
      ]
    },
    
    // API Testing
    {
      name: 'api-tests',
      use: {
        baseURL: 'http://127.0.0.1:8000/api',
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      },
      testMatch: '**/api/*.spec.js'
    }
  ],

  // Global Setup and Teardown
  globalSetup: './tests/setup/global-setup.js',
  globalTeardown: './tests/setup/global-teardown.js',

  // Web Server Configuration
  webServer: [
    {
      command: 'php artisan serve --port=8000 --host=127.0.0.1',
      port: 8000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        APP_ENV: 'testing',
        DB_CONNECTION: 'testing',
        CACHE_DRIVER: 'array',
        SESSION_DRIVER: 'array',
        QUEUE_CONNECTION: 'sync'
      }
    }
  ],

  // Output Directory
  outputDir: 'test-results/artifacts/',
  
  // Test Timeout
  timeout: 60000,
  
  // Expect Configuration
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      mode: 'strict',
      animations: 'disabled'
    },
    toMatchSnapshot: {
      mode: 'strict'
    }
  },

  // Test Metadata
  metadata: {
    'test-framework': 'Playwright',
    'application': 'NexusERP',
    'environment': process.env.NODE_ENV || 'test',
    'base-url': 'http://127.0.0.1:8000',
    'created-by': 'Claude Code Assistant',
    'created-date': new Date().toISOString()
  }
});