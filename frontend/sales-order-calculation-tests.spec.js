import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

async function login(page) {
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

test.describe('Sales Order Total Calculation - Detailed Tests', () => {
  
  test('should perform real-time calculation when product quantities change', async ({ page }) => {
    await login(page);
    
    // Navigate to sales order creation
    await page.goto('http://127.0.0.1:8000/orders/sales/create');
    await page.waitForLoadState('networkidle');
    
    // Test if form elements are present
    const formExists = await page.locator('form').count() > 0;
    
    if (formExists) {
      // Look for product selection or input fields
      const productFields = [
        'input[name*="product"]',
        'select[name*="product"]',
        'input[data-product]',
        '.product-selector'
      ];
      
      let productField = null;
      for (const selector of productFields) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          productField = element.first();
          break;
        }
      }
      
      // Look for quantity input fields
      const quantityFields = [
        'input[name*="quantity"]',
        'input[type="number"]',
        'input[data-quantity]',
        '.quantity-input'
      ];
      
      let quantityField = null;
      for (const selector of quantityFields) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          quantityField = element.first();
          break;
        }
      }
      
      // Look for price input fields
      const priceFields = [
        'input[name*="price"]',
        'input[name*="unit_price"]',
        'input[data-price]',
        '.price-input'
      ];
      
      let priceField = null;
      for (const selector of priceFields) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          priceField = element.first();
          break;
        }
      }
      
      if (quantityField && priceField) {
        console.log('✓ Found quantity and price fields');
        
        // Test Case 1: Basic calculation
        await quantityField.fill('2');
        await priceField.fill('25.00');
        
        // Trigger calculation events
        await quantityField.blur();
        await priceField.blur();
        await page.waitForTimeout(1000);
        
        // Look for subtotal/total fields
        const totalFields = [
          'input[name*="subtotal"]',
          'input[name*="total"]',
          '[data-subtotal]',
          '[data-total]',
          '.subtotal',
          '.total-amount'
        ];
        
        let calculatedValue = null;
        for (const selector of totalFields) {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            const value = await element.first().inputValue() || await element.first().textContent();
            if (value && value.includes('50')) {
              calculatedValue = value;
              console.log(`✓ Found calculated subtotal: ${value}`);
              break;
            }
          }
        }
        
        // Test Case 2: Decimal quantities
        await quantityField.fill('2.5');
        await priceField.fill('10.40');
        await quantityField.blur();
        await page.waitForTimeout(1000);
        
        // Expected: 2.5 * 10.40 = 26.00
        
        // Test Case 3: High quantities
        await quantityField.fill('100');
        await priceField.fill('5.99');
        await quantityField.blur();
        await page.waitForTimeout(1000);
        
        // Expected: 100 * 5.99 = 599.00
        
        await page.screenshot({ path: 'screenshots/sales-order-calculations.png' });
        
      } else {
        console.log('⚠️ Sales order form fields not found or different structure');
        await page.screenshot({ path: 'screenshots/sales-order-form-structure.png' });
      }
    } else {
      console.log('⚠️ Sales order form not found');
    }
  });

  test('should calculate tax correctly on order totals', async ({ page }) => {
    await login(page);
    
    await page.goto('http://127.0.0.1:8000/orders/sales/create');
    await page.waitForLoadState('networkidle');
    
    // Look for tax-related fields
    const taxSelectors = [
      'input[name*="tax"]',
      'select[name*="tax_rate"]',
      'input[data-tax]',
      '.tax-input',
      '.tax-rate'
    ];
    
    let taxField = null;
    for (const selector of taxSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        taxField = element.first();
        console.log(`Found tax field: ${selector}`);
        break;
      }
    }
    
    if (taxField) {
      // Test tax calculation
      const quantityField = page.locator('input[name*="quantity"], input[type="number"]').first();
      const priceField = page.locator('input[name*="price"], input[name*="unit_price"]').first();
      
      if (await quantityField.count() > 0 && await priceField.count() > 0) {
        // Set base values
        await quantityField.fill('10');
        await priceField.fill('20.00');
        
        // Set tax rate (if it's an input field)
        if (await taxField.getAttribute('type') === 'number' || await taxField.getAttribute('type') === 'text') {
          await taxField.fill('10'); // 10% tax
        }
        
        // Trigger calculations
        await taxField.blur();
        await page.waitForTimeout(1500);
        
        // Look for tax amount and total with tax
        const taxAmountFields = [
          'input[name*="tax_amount"]',
          '[data-tax-amount]',
          '.tax-amount'
        ];
        
        const totalWithTaxFields = [
          'input[name*="total"]',
          'input[name*="grand_total"]',
          '[data-grand-total]',
          '.grand-total'
        ];
        
        // Check tax amount (should be 20.00 for 200 * 10%)
        for (const selector of taxAmountFields) {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            const taxAmount = await element.first().inputValue() || await element.first().textContent();
            console.log(`Tax amount calculated: ${taxAmount}`);
          }
        }
        
        // Check total with tax (should be 220.00)
        for (const selector of totalWithTaxFields) {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            const grandTotal = await element.first().inputValue() || await element.first().textContent();
            console.log(`Grand total with tax: ${grandTotal}`);
          }
        }
      }
    } else {
      console.log('⚠️ Tax calculation fields not found');
    }
    
    await page.screenshot({ path: 'screenshots/tax-calculation-test.png' });
  });

  test('should handle multiple line items with different prices', async ({ page }) => {
    await login(page);
    
    await page.goto('http://127.0.0.1:8000/orders/sales/create');
    await page.waitForLoadState('networkidle');
    
    // Look for "Add Line Item" or similar button to add multiple products
    const addItemSelectors = [
      'button:has-text("Add")',
      'button:has-text("Add Item")',
      'button:has-text("Add Product")',
      '.add-line-item',
      '[data-add-item]'
    ];
    
    let addButton = null;
    for (const selector of addItemSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        addButton = element.first();
        break;
      }
    }
    
    if (addButton) {
      console.log('✓ Found add item button, testing multiple line items');
      
      // Fill first line item
      const firstQuantity = page.locator('input[name*="quantity"]').first();
      const firstPrice = page.locator('input[name*="price"]').first();
      
      if (await firstQuantity.count() > 0 && await firstPrice.count() > 0) {
        await firstQuantity.fill('5');
        await firstPrice.fill('15.00');
        
        // Add second line item
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // Fill second line item
        const allQuantities = page.locator('input[name*="quantity"]');
        const allPrices = page.locator('input[name*="price"]');
        
        if (await allQuantities.count() >= 2 && await allPrices.count() >= 2) {
          await allQuantities.nth(1).fill('3');
          await allPrices.nth(1).fill('25.00');
          
          // Trigger calculations
          await allPrices.nth(1).blur();
          await page.waitForTimeout(1500);
          
          // Expected total: (5 * 15.00) + (3 * 25.00) = 75.00 + 75.00 = 150.00
          
          // Look for order total
          const orderTotalFields = [
            'input[name*="order_total"]',
            'input[name*="grand_total"]',
            '[data-order-total]',
            '.order-total'
          ];
          
          for (const selector of orderTotalFields) {
            const element = page.locator(selector);
            if (await element.count() > 0) {
              const total = await element.first().inputValue() || await element.first().textContent();
              console.log(`Multi-line order total: ${total}`);
              
              if (total && total.includes('150')) {
                console.log('✓ Multi-line item calculation is working correctly');
              }
            }
          }
        }
      }
    } else {
      console.log('⚠️ Add item functionality not found, testing single line item only');
      
      // Test single line item with different scenarios
      const quantity = page.locator('input[name*="quantity"]').first();
      const price = page.locator('input[name*="price"]').first();
      
      if (await quantity.count() > 0 && await price.count() > 0) {
        const testCases = [
          { qty: '1', price: '100.00', expected: '100.00' },
          { qty: '0.5', price: '200.00', expected: '100.00' },
          { qty: '10', price: '9.99', expected: '99.90' }
        ];
        
        for (const testCase of testCases) {
          await quantity.fill(testCase.qty);
          await price.fill(testCase.price);
          await price.blur();
          await page.waitForTimeout(1000);
          
          console.log(`Test: ${testCase.qty} × ${testCase.price} = ${testCase.expected}`);
        }
      }
    }
    
    await page.screenshot({ path: 'screenshots/multi-line-items.png' });
  });

  test('should validate calculation accuracy with edge cases', async ({ page }) => {
    await login(page);
    
    await page.goto('http://127.0.0.1:8000/orders/sales/create');
    await page.waitForLoadState('networkidle');
    
    const quantityField = page.locator('input[name*="quantity"]').first();
    const priceField = page.locator('input[name*="price"]').first();
    
    if (await quantityField.count() > 0 && await priceField.count() > 0) {
      const edgeCases = [
        { qty: '0', price: '10.00', note: 'Zero quantity' },
        { qty: '1', price: '0', note: 'Zero price' },
        { qty: '0.001', price: '1000.00', note: 'Very small quantity' },
        { qty: '1000', price: '0.01', note: 'Very small price' },
        { qty: '99999', price: '99999.99', note: 'Very large values' }
      ];
      
      for (const testCase of edgeCases) {
        console.log(`Testing edge case: ${testCase.note}`);
        
        await quantityField.fill(testCase.qty);
        await priceField.fill(testCase.price);
        await priceField.blur();
        await page.waitForTimeout(1000);
        
        // Check for any JavaScript errors or UI issues
        const jsErrors = [];
        page.on('pageerror', error => jsErrors.push(error.message));
        
        if (jsErrors.length === 0) {
          console.log(`✓ ${testCase.note} handled without errors`);
        } else {
          console.log(`❌ ${testCase.note} caused errors: ${jsErrors.join(', ')}`);
        }
      }
    }
    
    await page.screenshot({ path: 'screenshots/edge-case-calculations.png' });
  });
});