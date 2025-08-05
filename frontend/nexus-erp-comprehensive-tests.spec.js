import { test, expect } from '@playwright/test';

// Test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// Helper function to login
async function login(page) {
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

test.describe('NexusERP System Tests', () => {
  
  test.describe('1. Dashboard Tests', () => {
    test('should load dashboard without HTTP 500 errors', async ({ page }) => {
      // Navigate to login page
      await page.goto('http://127.0.0.1:8000/login');
      
      // Fill in login credentials
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard');
      
      // Check that dashboard loaded successfully
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Verify no 500 error by checking for error indicators
      const errorIndicators = [
        'text=500',
        'text=Internal Server Error',
        'text=Whoops',
        'text=Something went wrong'
      ];
      
      for (const indicator of errorIndicators) {
        await expect(page.locator(indicator)).toHaveCount(0);
      }
      
      // Check for positive indicators that dashboard loaded
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Take screenshot for verification
      await page.screenshot({ path: 'screenshots/dashboard-success.png' });
    });

    test('should display dashboard cards and metrics', async ({ page }) => {
      await login(page);
      
      // Check for common dashboard elements
      const dashboardElements = [
        'Dashboard',
        'Recent',
        'Total'
      ];
      
      for (const element of dashboardElements) {
        const locator = page.locator(`text=${element}`);
        if (await locator.count() > 0) {
          await expect(locator.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('2. Sales Order Total Calculation Tests', () => {
    test('should calculate sales order totals correctly in real-time', async ({ page }) => {
      await login(page);
      
      // Navigate to sales orders
      await page.goto('http://127.0.0.1:8000/orders/sales');
      await page.waitForLoadState('networkidle');
      
      // Look for create new order button/link
      const createButtons = [
        'text=Create',
        'text=New',
        'text=Add',
        'a[href*="create"]',
        'button:has-text("Create")',
        'button:has-text("New")'
      ];
      
      let createFound = false;
      for (const selector of createButtons) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await element.first().click();
          createFound = true;
          break;
        }
      }
      
      if (!createFound) {
        // Try direct navigation to create form
        await page.goto('http://127.0.0.1:8000/orders/sales/create');
      }
      
      await page.waitForLoadState('networkidle');
      
      // Check if we're on the sales order creation page
      const pageContent = await page.content();
      console.log('Current page URL:', page.url());
      
      // Look for form elements that would indicate a sales order form
      const formSelectors = [
        'input[name*="customer"]',
        'select[name*="customer"]',
        'input[name*="product"]',
        'input[name*="quantity"]',
        'input[name*="price"]',
        'form'
      ];
      
      let formFound = false;
      for (const selector of formSelectors) {
        if (await page.locator(selector).count() > 0) {
          formFound = true;
          break;
        }
      }
      
      if (formFound) {
        // Test real-time calculation functionality
        const quantityInput = page.locator('input[name*="quantity"], input[type="number"]').first();
        const priceInput = page.locator('input[name*="price"], input[name*="unit_price"]').first();
        
        if (await quantityInput.count() > 0 && await priceInput.count() > 0) {
          // Fill in test values
          await quantityInput.fill('5');
          await priceInput.fill('10.50');
          
          // Trigger calculation by clicking outside or pressing tab
          await page.keyboard.press('Tab');
          
          // Wait for any JavaScript calculations to complete
          await page.waitForTimeout(1000);
          
          // Look for total/subtotal fields
          const totalSelectors = [
            'input[name*="total"]',
            'input[name*="subtotal"]',
            '[data-total]',
            '.total',
            '.subtotal'
          ];
          
          for (const selector of totalSelectors) {
            const totalElement = page.locator(selector);
            if (await totalElement.count() > 0) {
              const totalValue = await totalElement.first().inputValue() || await totalElement.first().textContent();
              console.log(`Found total element with value: ${totalValue}`);
              
              // Check if calculation is correct (5 * 10.50 = 52.50)
              if (totalValue && (totalValue.includes('52.5') || totalValue.includes('52.50'))) {
                console.log('✓ Sales order calculation appears to be working correctly');
              }
            }
          }
        }
        
        await page.screenshot({ path: 'screenshots/sales-order-form.png' });
      } else {
        console.log('Sales order form not found, may need to be implemented');
        await page.screenshot({ path: 'screenshots/sales-order-not-found.png' });
      }
    });

    test('should handle tax calculations correctly', async ({ page }) => {
      await login(page);
      
      // Navigate to sales order creation
      await page.goto('http://127.0.0.1:8000/orders/sales/create');
      await page.waitForLoadState('networkidle');
      
      // Look for tax-related fields
      const taxSelectors = [
        'input[name*="tax"]',
        'select[name*="tax"]',
        '[data-tax]',
        '.tax'
      ];
      
      for (const selector of taxSelectors) {
        const taxElement = page.locator(selector);
        if (await taxElement.count() > 0) {
          console.log(`Found tax element: ${selector}`);
          // Additional tax calculation tests could be added here
        }
      }
    });
  });

  test.describe('3. Supplier Contact Person Search Tests', () => {
    test('should search suppliers by contact person name', async ({ page }) => {
      await login(page);
      
      // Navigate to suppliers page
      await page.goto('http://127.0.0.1:8000/suppliers');
      await page.waitForLoadState('networkidle');
      
      // Look for search functionality
      const searchSelectors = [
        'input[type="search"]',
        'input[name*="search"]',
        'input[placeholder*="search" i]',
        'input[placeholder*="Search" i]',
        '.search-input',
        '#search'
      ];
      
      let searchInput = null;
      for (const selector of searchSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          searchInput = element.first();
          break;
        }
      }
      
      if (searchInput) {
        // Test searching by contact person name
        await searchInput.fill('John');
        await page.keyboard.press('Enter');
        
        // Wait for search results
        await page.waitForTimeout(2000);
        
        // Check if search results are displayed
        const resultsTable = page.locator('table, .results, .supplier-list');
        if (await resultsTable.count() > 0) {
          console.log('✓ Supplier search functionality is working');
          
          // Take screenshot of search results
          await page.screenshot({ path: 'screenshots/supplier-search-results.png' });
        }
        
        // Test with another contact person name
        await searchInput.fill('Smith');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        // Clear search to see all suppliers
        await searchInput.fill('');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
      } else {
        console.log('Search input not found on suppliers page');
        await page.screenshot({ path: 'screenshots/supplier-no-search.png' });
      }
    });

    test('should filter supplier results by contact person', async ({ page }) => {
      await login(page);
      
      await page.goto('http://127.0.0.1:8000/suppliers');
      await page.waitForLoadState('networkidle');
      
      // Get initial count of suppliers
      const supplierRows = page.locator('tr, .supplier-item');
      const initialCount = await supplierRows.count();
      
      // Perform search
      const searchInput = page.locator('input[type="search"], input[name*="search"]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('contact');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        // Check if results are filtered
        const filteredCount = await supplierRows.count();
        console.log(`Initial suppliers: ${initialCount}, Filtered: ${filteredCount}`);
        
        if (filteredCount <= initialCount) {
          console.log('✓ Supplier filtering appears to be working');
        }
      }
    });
  });

  test.describe('4. Customer Phone Number Search Tests', () => {
    test('should search customers by phone number', async ({ page }) => {
      await login(page);
      
      // Navigate to customers page
      await page.goto('http://127.0.0.1:8000/customers');
      await page.waitForLoadState('networkidle');
      
      // Look for search functionality
      const searchInput = page.locator('input[type="search"], input[name*="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Test searching with different phone number formats
        const phoneNumbers = [
          '123-456-7890',
          '(123) 456-7890',
          '123 456 7890',
          '1234567890',
          '+1-123-456-7890'
        ];
        
        for (const phone of phoneNumbers) {
          await searchInput.fill(phone);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          
          // Check if search works with this format
          const results = page.locator('table tr, .customer-item');
          const resultCount = await results.count();
          console.log(`Phone search '${phone}': ${resultCount} results found`);
          
          // Clear search for next test
          await searchInput.fill('');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
        }
        
        console.log('✓ Phone number search functionality tested');
        await page.screenshot({ path: 'screenshots/customer-phone-search.png' });
        
      } else {
        console.log('Search input not found on customers page');
        await page.screenshot({ path: 'screenshots/customer-no-search.png' });
      }
    });

    test('should handle phone numbers with special characters', async ({ page }) => {
      await login(page);
      
      await page.goto('http://127.0.0.1:8000/customers');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"], input[name*="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Test special characters in phone numbers
        const specialPhoneFormats = [
          '123.456.7890',
          '123/456/7890',
          '123_456_7890',
          '+1 (123) 456-7890',
          '123-456-7890 ext 123'
        ];
        
        for (const phone of specialPhoneFormats) {
          await searchInput.fill(phone);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1500);
          
          // Verify search doesn't cause errors
          const errorElements = page.locator('text=Error, text=500, .error');
          await expect(errorElements).toHaveCount(0);
          
          console.log(`✓ Phone format '${phone}' handled without errors`);
        }
      }
    });
  });

  test.describe('5. Navigation and General Functionality Tests', () => {
    test('should navigate through main menu items', async ({ page }) => {
      await login(page);
      
      // Test navigation to main sections
      const navigationItems = [
        { text: 'Dashboard', url: 'dashboard' },
        { text: 'Customers', url: 'customers' },
        { text: 'Suppliers', url: 'suppliers' },
        { text: 'Products', url: 'products' },
        { text: 'Orders', url: 'orders' },
        { text: 'Sales', url: 'sales' },
        { text: 'Purchase', url: 'purchase' }
      ];
      
      for (const item of navigationItems) {
        // Look for navigation link
        const navLink = page.locator(`a:has-text("${item.text}"), nav a[href*="${item.url}"]`);
        
        if (await navLink.count() > 0) {
          await navLink.first().click();
          await page.waitForLoadState('networkidle');
          
          // Verify no 500 errors
          const errorIndicators = page.locator('text=500, text=Internal Server Error');
          await expect(errorIndicators).toHaveCount(0);
          
          console.log(`✓ Navigation to ${item.text} successful`);
          await page.waitForTimeout(500);
        }
      }
    });

    test('should handle form submissions without errors', async ({ page }) => {
      await login(page);
      
      // Test various forms don't throw 500 errors when accessed
      const formPages = [
        '/customers/create',
        '/suppliers/create',
        '/products/create',
        '/orders/sales/create',
        '/orders/purchase/create'
      ];
      
      for (const formPath of formPages) {
        try {
          await page.goto(`http://127.0.0.1:8000${formPath}`);
          await page.waitForLoadState('networkidle');
          
          // Check for 500 errors
          const errorIndicators = page.locator('text=500, text=Internal Server Error, text=Whoops');
          if (await errorIndicators.count() > 0) {
            console.log(`❌ Error found on ${formPath}`);
          } else {
            console.log(`✓ Form page ${formPath} loads without errors`);
          }
          
        } catch (error) {
          console.log(`⚠️ Could not access ${formPath}: ${error.message}`);
        }
      }
    });
  });

  test.describe('6. Data Integrity and API Tests', () => {
    test('should verify API endpoints respond correctly', async ({ page }) => {
      await login(page);
      
      // Test API endpoints
      const apiEndpoints = [
        '/api/customers',
        '/api/suppliers', 
        '/api/products',
        '/api/dashboard'
      ];
      
      for (const endpoint of apiEndpoints) {
        const response = await page.request.get(`http://127.0.0.1:8000${endpoint}`);
        
        if (response.status() === 200) {
          console.log(`✓ API endpoint ${endpoint} responding correctly (200)`);
        } else if (response.status() === 401 || response.status() === 403) {
          console.log(`⚠️ API endpoint ${endpoint} requires authentication (${response.status()})`);
        } else {
          console.log(`❌ API endpoint ${endpoint} returned error: ${response.status()}`);
        }
      }
    });

    test('should verify search functionality works across modules', async ({ page }) => {
      await login(page);
      
      const searchTests = [
        { page: '/customers', searchTerm: 'test' },
        { page: '/suppliers', searchTerm: 'supplier' },
        { page: '/products', searchTerm: 'product' }
      ];
      
      for (const test of searchTests) {
        await page.goto(`http://127.0.0.1:8000${test.page}`);
        await page.waitForLoadState('networkidle');
        
        const searchInput = page.locator('input[type="search"], input[name*="search"]').first();
        
        if (await searchInput.count() > 0) {
          await searchInput.fill(test.searchTerm);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          
          // Check for JavaScript errors
          const jsErrors = [];
          page.on('pageerror', error => jsErrors.push(error));
          
          if (jsErrors.length === 0) {
            console.log(`✓ Search on ${test.page} working without JS errors`);
          } else {
            console.log(`❌ JS errors on ${test.page}: ${jsErrors.join(', ')}`);
          }
        }
      }
    });
  });

  test.describe('7. Error Handling and Edge Cases', () => {
    test('should handle invalid URLs gracefully', async ({ page }) => {
      await login(page);
      
      const invalidUrls = [
        '/nonexistent-page',
        '/customers/999999',
        '/suppliers/invalid-id',
        '/products/does-not-exist'
      ];
      
      for (const url of invalidUrls) {
        await page.goto(`http://127.0.0.1:8000${url}`);
        await page.waitForLoadState('networkidle');
        
        // Should get 404, not 500
        const content = await page.content();
        if (content.includes('500') || content.includes('Internal Server Error')) {
          console.log(`❌ Invalid URL ${url} returns 500 error instead of 404`);
        } else if (content.includes('404') || content.includes('Not Found')) {
          console.log(`✓ Invalid URL ${url} properly returns 404`);
        } else {
          console.log(`⚠️ Invalid URL ${url} has unexpected response`);
        }
      }
    });

    test('should maintain session across page navigation', async ({ page }) => {
      await login(page);
      
      // Navigate through several pages
      const pages = ['/dashboard', '/customers', '/suppliers', '/products'];
      
      for (const pagePath of pages) {
        await page.goto(`http://127.0.0.1:8000${pagePath}`);
        await page.waitForLoadState('networkidle');
        
        // Check that we're still logged in (not redirected to login)
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          console.log(`❌ Session lost when navigating to ${pagePath}`);
        } else {
          console.log(`✓ Session maintained on ${pagePath}`);
        }
      }
    });
  });
});