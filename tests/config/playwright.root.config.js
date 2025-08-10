/**
 * Playwright Configuration for NexusERP Navigation Testing
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  use: {
    baseURL: 'http://127.0.0.1:8000',
    headless: false,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  timeout: 120000,
});