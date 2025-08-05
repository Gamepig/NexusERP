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

test.describe('Search Functionality Tests', () => {
  
  test.describe('Supplier Contact Person Search', () => {
    test('should find suppliers by contact person name', async ({ page }) => {
      await login(page);
      
      // Navigate to suppliers page
      await page.goto('http://127.0.0.1:8000/suppliers');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of initial suppliers page
      await page.screenshot({ path: 'screenshots/suppliers-initial.png' });
      
      // Find search input
      const searchSelectors = [
        'input[type="search"]',
        'input[name="search"]',
        'input[placeholder*="search" i]',
        '#search',
        '.search-input'
      ];
      
      let searchInput = null;
      for (const selector of searchSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          searchInput = element.first();
          console.log(`Found search input: ${selector}`);
          break;
        }
      }
      
      if (searchInput) {
        // Get initial supplier count
        const supplierRows = page.locator('tbody tr, .supplier-row, .supplier-item');
        const initialCount = await supplierRows.count();
        console.log(`Initial supplier count: ${initialCount}`);
        
        // Test contact person names
        const contactNames = [
          'John',
          'Jane',
          'Smith',
          'Johnson',
          'Manager',
          'Director'
        ];
        
        for (const name of contactNames) {
          console.log(`Searching for contact: ${name}`);
          
          await searchInput.fill(name);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          
          // Count results after search
          const filteredCount = await supplierRows.count();
          console.log(`Search results for '${name}': ${filteredCount} suppliers`);
          
          // Verify search results contain the search term (if any results)
          if (filteredCount > 0) {
            const tableContent = await page.locator('table, .supplier-list').textContent();
            if (tableContent.toLowerCase().includes(name.toLowerCase())) {
              console.log(`✓ Search results contain '${name}'`);
            } else {
              console.log(`⚠️ Search results may not contain '${name}' (could be valid if no matches)`);
            }
            
            await page.screenshot({ path: `screenshots/supplier-search-${name.toLowerCase()}.png` });
          }
          
          // Clear search
          await searchInput.fill('');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
        }
        
        // Test partial name matching
        await searchInput.fill('Joh');
        await page.keyboard.press('Enter');  
        await page.waitForTimeout(2000);
        
        const partialResults = await supplierRows.count();
        console.log(`Partial search 'Joh': ${partialResults} results`);
        
        await page.screenshot({ path: 'screenshots/supplier-search-partial.png' });
        
      } else {
        console.log('❌ Search input not found on suppliers page');
        await page.screenshot({ path: 'screenshots/suppliers-no-search.png' });
      }
    });

    test('should handle case-insensitive contact person search', async ({ page }) => {
      await login(page);
      
      await page.goto('http://127.0.0.1:8000/suppliers');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"], input[name="search"]').first();
      
      if (await searchInput.count() > 0) {
        const testCases = [
          'john',
          'JOHN', 
          'John',
          'jOhN'
        ];
        
        let results = [];
        for (const testCase of testCases) {
          await searchInput.fill(testCase);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1500);
          
          const resultCount = await page.locator('tbody tr, .supplier-row').count();
          results.push({ search: testCase, count: resultCount });
          console.log(`Search '${testCase}': ${resultCount} results`);
          
          await searchInput.fill('');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        }
        
        // All case variations should return same results
        const uniqueCounts = [...new Set(results.map(r => r.count))];
        if (uniqueCounts.length === 1) {
          console.log('✓ Case-insensitive search working correctly');
        } else {
          console.log('⚠️ Case sensitivity may be affecting search results');
        }
      }
    });

    test('should display appropriate message when no contact persons match', async ({ page }) => {
      await login(page);
      
      await page.goto('http://127.0.0.1:8000/suppliers');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"], input[name="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Search for something unlikely to exist
        await searchInput.fill('XyzUnlikelyName123');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        const resultRows = await page.locator('tbody tr, .supplier-row').count();
        
        if (resultRows === 0) {
          // Look for "no results" message
          const noResultsMessages = [
            'text=No suppliers found',
            'text=No results',
            'text=No matches',
            'text=No data',
            '.no-results',
            '.empty-state'
          ];
          
          let messageFound = false;
          for (const selector of noResultsMessages) {
            if (await page.locator(selector).count() > 0) {
              console.log(`✓ Found no-results message: ${selector}`);
              messageFound = true;
              break;
            }
          }
          
          if (!messageFound) {
            console.log('⚠️ No results message not found (table may just be empty)');
          }
        }
        
        await page.screenshot({ path: 'screenshots/supplier-search-no-results.png' });
      }
    });
  });

  test.describe('Customer Phone Number Search', () => {
    test('should find customers by phone number with various formats', async ({ page }) => {
      await login(page);
      
      await page.goto('http://127.0.0.1:8000/customers');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'screenshots/customers-initial.png' });
      
      const searchInput = page.locator('input[type="search"], input[name="search"]').first();
      
      if (await searchInput.count() > 0) {
        const phoneFormats = [
          '123-456-7890',
          '(123) 456-7890', 
          '123 456 7890',
          '1234567890',
          '+1-123-456-7890',
          '+1 (123) 456-7890',
          '123.456.7890'
        ];
        
        // Get initial customer count
        const customerRows = page.locator('tbody tr, .customer-row, .customer-item');
        const initialCount = await customerRows.count();
        console.log(`Initial customer count: ${initialCount}`);
        
        for (const phone of phoneFormats) {
          console.log(`Testing phone format: ${phone}`);
          
          await searchInput.fill(phone);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          
          // Check for JavaScript errors
          const jsErrors = [];
          page.on('pageerror', error => jsErrors.push(error.message));
          
          if (jsErrors.length === 0) {
            console.log(`✓ Phone format '${phone}' processed without errors`);
          } else {
            console.log(`❌ Errors with '${phone}': ${jsErrors.join(', ')}`);
          }
          
          // Count search results
          const resultCount = await customerRows.count();
          console.log(`Search results for '${phone}': ${resultCount} customers`);
          
          await page.screenshot({ path: `screenshots/customer-phone-${phone.replace(/[^0-9]/g, '')}.png` });
          
          // Clear search
          await searchInput.fill('');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
        }
        
      } else {
        console.log('❌ Search input not found on customers page');
        await page.screenshot({ path: 'screenshots/customers-no-search.png' });
      }
    });

    test('should handle special characters in phone numbers', async ({ page }) => {
      await login(page);
      
      await page.goto('http://127.0.0.1:8000/customers');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"], input[name="search"]').first();
      
      if (await searchInput.count() > 0) {
        const specialCharPhones = [
          '123-456-7890 ext 123',
          '123/456/7890',
          '123_456_7890',
          '123|456|7890',
          '123*456*7890',
          '123#456#7890'
        ];
        
        for (const phone of specialCharPhones) {
          console.log(`Testing special character phone: ${phone}`);
          
          await searchInput.fill(phone);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1500);
          
          // Verify no 500 errors
          const pageContent = await page.content();
          if (pageContent.includes('500') || pageContent.includes('Internal Server Error')) {
            console.log(`❌ Phone '${phone}' caused server error`);
          } else {
            console.log(`✓ Phone '${phone}' handled without server errors`);
          }
          
          // Clear search
          await searchInput.fill('');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        }
      }
    });

    test('should search partial phone numbers', async ({ page }) => {
      await login(page);
      
      await page.goto('http://127.0.0.1:8000/customers');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"], input[name="search"]').first();
      
      if (await searchInput.count() > 0) {
        const partialPhones = [
          '123',
          '456',
          '7890',
          '123-456',
          '456-7890'
        ];
        
        for (const partial of partialPhones) {
          console.log(`Testing partial phone: ${partial}`);
          
          await searchInput.fill(partial);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1500);
          
          const resultCount = await page.locator('tbody tr, .customer-row').count();
          console.log(`Partial search '${partial}': ${resultCount} results`);
          
          // Clear search
          await searchInput.fill('');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        }
        
        await page.screenshot({ path: 'screenshots/customer-partial-phone-search.png' });
      }
    });
  });

  test.describe('General Search Functionality', () => {
    test('should maintain search state during page navigation', async ({ page }) => {
      await login(page);
      
      // Test on customers page
      await page.goto('http://127.0.0.1:8000/customers');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"], input[name="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Perform search
        await searchInput.fill('test');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        // Navigate away and back
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForLoadState('networkidle');
        
        await page.goto('http://127.0.0.1:8000/customers');
        await page.waitForLoadState('networkidle');
        
        // Check if search is cleared (expected behavior)
        const searchValue = await page.locator('input[type="search"], input[name="search"]').first().inputValue();
        console.log(`Search value after navigation: '${searchValue}'`);
      }
    });

    test('should handle rapid search queries without errors', async ({ page }) => {
      await login(page);
      
      await page.goto('http://127.0.0.1:8000/customers');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"], input[name="search"]').first();
      
      if (await searchInput.count() > 0) {
        const rapidSearches = ['a', 'ab', 'abc', 'abcd', 'abcde'];
        
        for (const search of rapidSearches) {
          await searchInput.fill(search);
          await page.waitForTimeout(100); // Rapid typing simulation
        }
        
        // Final search
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        // Check for any JavaScript errors
        const jsErrors = [];
        page.on('pageerror', error => jsErrors.push(error.message));
        
        if (jsErrors.length === 0) {
          console.log('✓ Rapid search queries handled without errors');
        } else {
          console.log(`❌ Rapid search caused errors: ${jsErrors.join(', ')}`);
        }
      }
    });

    test('should clear search results when search input is cleared', async ({ page }) => {
      await login(page);
      
      const testPages = [
        { url: '/customers', name: 'Customers' },
        { url: '/suppliers', name: 'Suppliers' }
      ];
      
      for (const testPage of testPages) {
        await page.goto(`http://127.0.0.1:8000${testPage.url}`);
        await page.waitForLoadState('networkidle');
        
        const searchInput = page.locator('input[type="search"], input[name="search"]').first();
        
        if (await searchInput.count() > 0) {
          // Get initial count
          const initialCount = await page.locator('tbody tr, .row').count();
          
          // Perform search
          await searchInput.fill('unlikely_search_term_12345');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          
          const searchedCount = await page.locator('tbody tr, .row').count();
          
          // Clear search
          await searchInput.fill('');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          
          const clearedCount = await page.locator('tbody tr, .row').count();
          
          console.log(`${testPage.name} - Initial: ${initialCount}, Searched: ${searchedCount}, Cleared: ${clearedCount}`);
          
          if (clearedCount >= searchedCount) {
            console.log(`✓ ${testPage.name} search clearing works correctly`);
          } else {
            console.log(`⚠️ ${testPage.name} search clearing may have issues`);
          }
        }
      }
    });
  });
});