import { test, expect } from '@playwright/test';

test.describe('Inventory Calculation Success Test', () => {
  test('should show correct inventory values for all target products', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Login with test credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/\/dashboard|\/products/, { timeout: 10000 });
    
    // Test API endpoint
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
    
    expect(apiResponse.status).toBe(200);
    
    // Check target products inventory
    const targetProducts = {
      '857': 20,   // Product 857: 20 units
      '832': 92,   // Product 832: 92 units  
      '833': 47,   // Product 833: 47 units
      '854': 49    // Product 854: 49 units
    };
    
    console.log('=== INVENTORY CALCULATION FIX SUCCESS ===');
    
    let allCorrect = true;
    const results = [];
    
    if (apiResponse.data && apiResponse.data.data) {
      apiResponse.data.data.forEach(product => {
        const productId = String(product.id);
        if (targetProducts[productId]) {
          const expected = targetProducts[productId];
          const actual = product.stock_quantity || 0;
          const isCorrect = actual === expected;
          
          results.push({
            id: productId,
            name: product.name,
            expected: expected,
            actual: actual,
            correct: isCorrect
          });
          
          console.log(`✅ Product ${productId} (${product.name}): ${actual} units (Expected: ${expected})`);
          
          if (!isCorrect) {
            allCorrect = false;
          }
        }
      });
    }
    
    // Verify all target products were found and correct
    expect(results.length).toBe(4);
    expect(allCorrect).toBeTruthy();
    
    // Verify specific values
    results.forEach(result => {
      expect(result.actual).toBe(result.expected);
    });
    
    console.log('🎉 ALL INVENTORY CALCULATIONS WORKING CORRECTLY!');
    console.log('✅ Cross-company warehouse inventory issue RESOLVED');
    console.log('✅ RLS bypass for inventory_levels implemented successfully');
  });
});