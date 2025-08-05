import { test } from '@playwright/test';

test('debug API call', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard|\/products/, { timeout: 10000 });
  
  // Make API call that will trigger our debug logs
  await page.evaluate(async () => {
    await fetch('/api/products', {
      headers: {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      }
    });
  });
  
  // Wait a moment for logs to be written
  await page.waitForTimeout(2000);
});