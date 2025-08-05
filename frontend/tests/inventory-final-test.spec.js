import { test, expect } from '@playwright/test';

test.describe('Final Inventory Calculation Test', () => {
  test('should show correct inventory after cache clear', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Login with test credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/\/dashboard|\/products/, { timeout: 10000 });
    
    // Test API endpoint directly
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/api/products', {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });
      
      const data = await response.json();
      return { status: response.status, data: data };
    });
    
    console.log('API Status:', apiResponse.status);
    expect(apiResponse.status).toBe(200);
    
    // Check target products inventory
    const targetProducts = {
      '857': { expected: 20, name: '測試產品 15' },
      '832': { expected: 92, name: '測試商品 A' },
      '833': { expected: 47, name: '測試商品 B' },
      '854': { expected: 49, name: '測試產品 12' }
    };
    
    console.log('\\n=== Inventory Test Results ===');
    
    let allPassed = true;
    const results = {};
    
    if (apiResponse.data && apiResponse.data.data) {
      apiResponse.data.data.forEach(product => {
        const productId = String(product.id);
        if (targetProducts[productId]) {
          const expected = targetProducts[productId].expected;
          const actual = product.stock_quantity || 0;
          const passed = actual === expected;
          
          results[productId] = {
            name: product.name,
            expected: expected,
            actual: actual,
            passed: passed
          };
          
          console.log(`Product ${productId} (${product.name}):`);
          console.log(`  Expected: ${expected} units`);
          console.log(`  Actual: ${actual} units`);
          console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
          console.log('');
          
          if (!passed) {
            allPassed = false;
          }
        }
      });
    }
    
    // Test the products page UI
    await page.goto('/products');
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'inventory-final-test.png', 
      fullPage: true 
    });
    
    // Check if products are displayed in UI
    const uiCheck = await page.evaluate(() => {
      const tbody = document.getElementById('products-table-body');
      const hasEmptyState = tbody.innerHTML.includes('尚無商品資料');
      const rows = tbody.querySelectorAll('tr');
      
      const productRows = [];
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
          const nameCell = cells[1]?.textContent?.trim() || '';
          const stockCell = cells[4]?.textContent?.trim() || '';
          
          if (nameCell && !nameCell.includes('尚無商品資料')) {
            productRows.push({
              name: nameCell,
              stock: stockCell
            });
          }
        }
      });
      
      return {
        hasEmptyState,
        productRowCount: productRows.length,
        products: productRows.slice(0, 10) // First 10 for logging
      };
    });
    
    console.log('\\n=== UI Check Results ===');
    console.log(`Has empty state: ${uiCheck.hasEmptyState}`);
    console.log(`Product rows found: ${uiCheck.productRowCount}`);
    console.log('Sample products in UI:');
    uiCheck.products.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - Stock: ${p.stock}`);
    });
    
    // Final assertions
    console.log('\\n=== Final Results ===');
    console.log(`All inventory calculations passed: ${allPassed}`);
    console.log(`Products displayed in UI: ${!uiCheck.hasEmptyState}`);
    
    // Main assertions
    expect(allPassed).toBeTruthy();
    expect(uiCheck.hasEmptyState).toBeFalsy();
    expect(uiCheck.productRowCount).toBeGreaterThan(0);
    
    // Verify specific inventory values
    Object.keys(targetProducts).forEach(productId => {
      if (results[productId]) {
        expect(results[productId].passed).toBeTruthy();
      }
    });
  });
});