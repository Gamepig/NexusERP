import { test, expect } from '@playwright/test';

test.describe('Products API Test', () => {
  test('should fetch products from API after login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login with test credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL(/\/dashboard|\/products/, { timeout: 10000 });
    
    // Test the API endpoint directly from browser context
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/products', {
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          }
        });
        
        const data = await response.json();
        
        return {
          status: response.status,
          data: data,
          url: response.url
        };
      } catch (error) {
        return {
          error: error.message,
          status: 'failed'
        };
      }
    });
    
    console.log('API Response:', JSON.stringify(apiResponse, null, 2));
    
    // Check if API call was successful
    expect(apiResponse.status).toBe(200);
    
    // Check if we got products data
    if (apiResponse.data && apiResponse.data.data) {
      console.log(`Found ${apiResponse.data.data.length} products`);
      
      // Look for our target products
      const targetProducts = ['857', '832', '833', '854'];
      const foundProducts = [];
      
      apiResponse.data.data.forEach(product => {
        if (targetProducts.includes(String(product.id))) {
          foundProducts.push({
            id: product.id,
            name: product.name,
            stock_quantity: product.stock_quantity,
            inventory_quantity: product.inventory_quantity
          });
        }
      });
      
      console.log('Target products found:', JSON.stringify(foundProducts, null, 2));
      
      // Verify that target products have non-zero inventory
      foundProducts.forEach(product => {
        console.log(`Product ${product.id}: Stock=${product.stock_quantity}, Inventory=${product.inventory_quantity}`);
        
        // Check that inventory is not zero
        const hasInventory = (product.stock_quantity && product.stock_quantity > 0) || 
                           (product.inventory_quantity && product.inventory_quantity > 0);
        
        console.log(`Product ${product.id} has inventory: ${hasInventory}`);
        
        // For our specific test products, we expect them to have inventory
        if (['857', '832', '833', '854'].includes(String(product.id))) {
          expect(hasInventory).toBeTruthy();
        }
      });
      
    } else {
      console.log('No products data in API response');
    }
    
    // Now test the products page
    await page.goto('/products');
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'products-page-after-api-test.png', fullPage: true });
    
    // Check if products are displayed
    const hasData = await page.evaluate(() => {
      const tbody = document.getElementById('products-table-body');
      const hasEmptyState = tbody.innerHTML.includes('尚無商品資料');
      const hasProductRows = tbody.querySelectorAll('tr').length > 1 || 
                           (!hasEmptyState && tbody.querySelectorAll('tr').length > 0);
      
      return {
        hasEmptyState,
        hasProductRows,
        rowCount: tbody.querySelectorAll('tr').length,
        innerHTML: tbody.innerHTML.substring(0, 500) // First 500 chars for debugging
      };
    });
    
    console.log('Page data check:', JSON.stringify(hasData, null, 2));
    
    if (!hasData.hasProductRows && hasData.hasEmptyState) {
      console.log('Products page shows empty state despite API having data');
      
      // Check browser console for errors
      const consoleMessages = [];
      page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));
      
      await page.reload();
      await page.waitForTimeout(3000);
      
      console.log('Browser console messages:', consoleMessages);
    }
  });
});