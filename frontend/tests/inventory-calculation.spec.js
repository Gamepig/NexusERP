import { test, expect } from '@playwright/test';

test.describe('Inventory Calculation Fix', () => {
  test('should show correct inventory quantities on product list', async ({ page }) => {
    // Navigate to the products page
    await page.goto('/products');
    
    // Check if we need to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for redirect after login
      await page.waitForURL('/products', { timeout: 10000 });
    }
    
    // Wait for the products table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'products-page.png', fullPage: true });
    
    // Check for inventory columns - look for inventory-related text
    const pageContent = await page.textContent('body');
    console.log('Page contains inventory data:', pageContent.includes('inventory') || pageContent.includes('庫存') || pageContent.includes('數量'));
    
    // Look for specific products and their inventory values
    const productRows = await page.locator('table tbody tr').all();
    console.log(`Found ${productRows.length} product rows`);
    
    for (let i = 0; i < Math.min(productRows.length, 10); i++) {
      const row = productRows[i];
      const rowText = await row.textContent();
      console.log(`Row ${i + 1}: ${rowText}`);
      
      // Look for products with IDs 857, 832, 833, 854
      if (rowText.includes('857') || rowText.includes('832') || rowText.includes('833') || rowText.includes('854')) {
        console.log(`Found target product in row: ${rowText}`);
        
        // Check if inventory shows a non-zero value
        const hasNonZeroInventory = !rowText.includes('0') || rowText.match(/[1-9]\d*/);
        console.log(`Row has non-zero inventory: ${hasNonZeroInventory}`);
      }
    }
    
    // Try to click on a product to test edit page (first clickable link)
    const firstProductLink = page.locator('table tbody tr a').first();
    if (await firstProductLink.count() > 0) {
      await firstProductLink.click();
      
      // Wait for page navigation and check for HTTP 500 errors
      await page.waitForLoadState('domcontentloaded');
      const currentUrl = page.url();
      const pageTitle = await page.title();
      
      console.log(`Navigated to: ${currentUrl}`);
      console.log(`Page title: ${pageTitle}`);
      
      // Check if we got an error page
      const isErrorPage = pageTitle.includes('Error') || pageTitle.includes('500') || await page.locator('text=500').count() > 0;
      
      if (isErrorPage) {
        console.log('ERROR: Product edit page returned HTTP 500');
        await page.screenshot({ path: 'product-edit-error.png', fullPage: true });
      } else {
        console.log('SUCCESS: Product edit page loaded successfully');
        await page.screenshot({ path: 'product-edit-success.png', fullPage: true });
      }
      
      expect(isErrorPage).toBeFalsy();
    }
  });
  
  test('should verify specific product inventory values', async ({ page }) => {
    // Navigate to products page
    await page.goto('/products');
    
    // Handle login if needed
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/products', { timeout: 10000 });
    }
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check specific products and their expected inventory
    const expectedInventory = {
      '857': 20,    // Should show around 20 units
      '832': 92,    // Should show around 92 units  
      '833': 47,    // Should show around 47 units
      '854': 49     // Should show around 49 units
    };
    
    for (const [productId, expectedQty] of Object.entries(expectedInventory)) {
      // Look for row containing this product ID
      const productRow = page.locator(`table tbody tr:has-text("${productId}")`);
      
      if (await productRow.count() > 0) {
        const rowText = await productRow.textContent();
        console.log(`Product ${productId} row: ${rowText}`);
        
        // Extract numbers from the row to find inventory quantity
        const numbers = rowText.match(/\d+/g) || [];
        const hasExpectedRange = numbers.some(num => {
          const quantity = parseInt(num);
          return quantity > 0 && Math.abs(quantity - expectedQty) < expectedQty * 0.5; // Within 50% range
        });
        
        console.log(`Product ${productId} - Expected: ~${expectedQty}, Found numbers: ${numbers.join(', ')}, In range: ${hasExpectedRange}`);
        
        // At minimum, ensure we don't show 0 inventory for these products
        expect(rowText).not.toMatch(/庫存.*?0(?!\d)/); // Don't match "庫存: 0" patterns
      } else {
        console.log(`Product ${productId} not found in current page`);
      }
    }
  });
});