import { test, expect } from '@playwright/test';

test('Trigger pagination debug', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Trigger debug logging
    await page.goto('/quotes?per_page=5');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Debug logging triggered for per_page=5');
});