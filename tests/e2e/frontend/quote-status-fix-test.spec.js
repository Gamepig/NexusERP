import { test, expect } from '@playwright/test';

test.describe('Quote Status Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('http://127.0.0.1:8084/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Status field should not be hardcoded to draft in multi-step form', async ({ page }) => {
    // Navigate to multi-step quote creation form
    await page.goto('http://127.0.0.1:8084/quotes/create/multi-step');
    
    // Wait for the form to load
    await page.waitForSelector('select[x-model="formData.status"]', { state: 'visible' });
    
    // Check that the status select dropdown exists and has correct options
    const statusSelect = page.locator('select[x-model="formData.status"]');
    await expect(statusSelect).toBeVisible();
    
    // Verify all status options are present
    const options = statusSelect.locator('option');
    await expect(options).toHaveCount(5);
    
    // Verify option values
    await expect(options.nth(0)).toHaveValue('draft');
    await expect(options.nth(1)).toHaveValue('sent');
    await expect(options.nth(2)).toHaveValue('accepted');
    await expect(options.nth(3)).toHaveValue('rejected');
    await expect(options.nth(4)).toHaveValue('expired');
    
    // Test that we can select "sent" status
    await statusSelect.selectOption('sent');
    
    // Verify the selection works
    const selectedValue = await statusSelect.inputValue();
    expect(selectedValue).toBe('sent');
    
    console.log('✅ Status dropdown is working correctly and not hardcoded to draft');
  });

  test('Quote list should show edit and view links correctly', async ({ page }) => {
    // Navigate to quotes list page
    await page.goto('http://127.0.0.1:8084/quotes');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("報價單列表")', { timeout: 10000 });
    
    // Check if there are any quotes in the table
    const hasQuotes = await page.locator('table tbody tr').count() > 0;
    
    if (hasQuotes) {
      // Verify edit and view links exist for the first quote
      const firstRow = page.locator('table tbody tr').first();
      
      // Check for view link
      const viewLink = firstRow.locator('a:has-text("檢視")');
      await expect(viewLink).toBeVisible();
      
      // Check for edit link
      const editLink = firstRow.locator('a:has-text("編輯")');
      await expect(editLink).toBeVisible();
      
      // Verify the href patterns
      const viewHref = await viewLink.getAttribute('href');
      const editHref = await editLink.getAttribute('href');
      
      expect(viewHref).toMatch(/\/quotes\/\d+$/);
      expect(editHref).toMatch(/\/quotes\/\d+\/edit$/);
      
      console.log('✅ Edit and view links are properly configured');
      console.log(`View link: ${viewHref}`);
      console.log(`Edit link: ${editHref}`);
    } else {
      console.log('ℹ️ No quotes found in the list to test edit/view links');
    }
  });

  test('Routes should be accessible', async ({ page }) => {
    // Test that the main routes are accessible (should not return 404)
    
    // Test quotes index
    const indexResponse = await page.goto('http://127.0.0.1:8084/quotes');
    expect(indexResponse.status()).toBe(200);
    
    // Test create form
    const createResponse = await page.goto('http://127.0.0.1:8084/quotes/create');
    expect(createResponse.status()).toBe(200);
    
    // Test multi-step create form
    const multiStepResponse = await page.goto('http://127.0.0.1:8084/quotes/create/multi-step');
    expect(multiStepResponse.status()).toBe(200);
    
    console.log('✅ All main quote routes are accessible');
  });
});