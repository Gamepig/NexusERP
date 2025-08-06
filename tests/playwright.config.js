/**
 * Playwright Configuration for NexusERP Comprehensive Testing
 * 
 * Optimized configuration for comprehensive system testing including:
 * - Multiple browser support
 * - Screenshot and video recording
 * - Detailed reporting
 * - Network monitoring
 * - Authentication state management
 * 
 * @author Claude Code Assistant
 * @version 2.0
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test Directory and Pattern
  testDir: './tests',
  testMatch: [
    '**/comprehensive/*.spec.js',
    '**/integration/*.spec.js',
    '**/debug-*.spec.js'
  ],
  
  // Global Test Configuration
  fullyParallel: false, // Run tests sequentially for comprehensive testing
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker for comprehensive testing
  
  // Reporting Configuration
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { 
      outputFile: 'test-results/comprehensive-test-results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/junit-results.xml' 
    }],
    ['list'],
    ...(process.env.CI ? [['github']] : [])
  ],

  // Global Test Settings
  use: {
    // Base URL
    baseURL: 'http://127.0.0.1:8000',
    
    // Browser Settings
    headless: process.env.CI ? true : false,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    
    // Media Recording
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // HTTP Headers
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    
    // Locale Settings
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    colorScheme: 'light',
    
    // Network Settings
    offline: false,
    hasTouch: false,
    isMobile: false
  },

  // Browser Projects
  projects: [
    // Main Comprehensive Testing Project
    {
      name: 'comprehensive-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: '**/comprehensive/*.spec.js'
    },
    
    // Firefox Compatibility Testing
    {
      name: 'comprehensive-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: '**/comprehensive/*.spec.js'
    },
    
    // WebKit/Safari Testing
    {
      name: 'comprehensive-webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: '**/comprehensive/*.spec.js'
    },
    
    // Mobile Testing
    {
      name: 'mobile-testing',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 }
      },
      testMatch: '**/comprehensive/*.spec.js'
    },
    
    // Tablet Testing
    {
      name: 'tablet-testing',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 }
      },
      testMatch: '**/comprehensive/*.spec.js'
    },
    
    // Debug Testing Project
    {
      name: 'debug-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        headless: false // Always run debug tests in headed mode
      },
      testMatch: '**/debug-*.spec.js'
    }
  ],

  // Global Setup and Teardown
  // globalSetup: './tests/setup/global-setup.js',
  // globalTeardown: './tests/setup/global-teardown.js',

  // Output Directory
  outputDir: 'test-results/',
  
  // Test Timeout
  timeout: 120000, // 2 minutes for comprehensive tests
  
  // Expect Configuration
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      mode: 'strict',
      animations: 'disabled'
    },
    toMatchSnapshot: {
      mode: 'strict'
    }
  },

  // Web Server Configuration (Optional - if you want Playwright to start the server)
  // webServer: {
  //   command: 'php artisan serve --port=8000 --host=127.0.0.1',
  //   port: 8000,
  //   timeout: 120 * 1000,
  //   reuseExistingServer: !process.env.CI,
  //   stdout: 'pipe',
  //   stderr: 'pipe'
  // },

  // Test Metadata
  metadata: {
    'test-framework': 'Playwright',
    'application': 'NexusERP',
    'test-type': 'Comprehensive System Testing',
    'environment': process.env.NODE_ENV || 'test',
    'base-url': 'http://127.0.0.1:8000',
    'created-by': 'Claude Code Assistant',
    'created-date': new Date().toISOString(),
    'version': '2.0'
  }
});