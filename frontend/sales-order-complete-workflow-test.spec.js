import { test, expect } from '@playwright/test';

test.describe('Complete Sales Order Creation Workflow Test', () => {
  
  test('should complete entire sales order creation workflow', async ({ page, browser }) => {
    const testResults = {
      steps: [],
      errors: [],
      screenshots: [],
      consoleMessages: [],
      networkRequests: [],
      success: false
    };

    // Listen for console messages
    page.on('console', msg => {
      testResults.consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });

    // Listen for network requests
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/orders') || request.url().includes('/customers') || request.url().includes('/products')) {
        testResults.networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        console.log(`Network Request: ${request.method()} ${request.url()}`);
      }
    });

    // Listen for failed requests
    page.on('requestfailed', request => {
      testResults.errors.push({
        type: 'network_failure',
        message: `Failed request: ${request.method()} ${request.url()}`,
        failure: request.failure()?.errorText,
        timestamp: new Date().toISOString()
      });
      console.error(`❌ Network Request Failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Listen for page errors
    page.on('pageerror', error => {
      testResults.errors.push({
        type: 'javascript_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      console.error(`❌ JavaScript Error: ${error.message}`);
    });

    try {
      // Step 1: Navigate to login page
      console.log('🟢 Step 1: Navigating to login page');
      await page.goto('http://127.0.0.1:8000/login');
      await page.waitForLoadState('networkidle');
      
      testResults.steps.push({
        step: 1,
        action: 'Navigate to login',
        url: 'http://127.0.0.1:8000/login',
        success: true,
        timestamp: new Date().toISOString()
      });
      
      await page.screenshot({ path: 'test-results/01-login-page.png', fullPage: true });
      testResults.screenshots.push('01-login-page.png');

      // Step 2: Login with test credentials
      console.log('🟢 Step 2: Logging in with test@example.com / password123');
      
      // Check if already logged in
      if (!(await page.locator('input[name="email"]').isVisible())) {
        console.log('Already logged in, navigating to dashboard');
        await page.goto('http://127.0.0.1:8000/dashboard');
      } else {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
      }
      
      testResults.steps.push({
        step: 2,
        action: 'Login authentication',
        success: true,
        timestamp: new Date().toISOString()
      });
      
      await page.screenshot({ path: 'test-results/02-after-login.png', fullPage: true });
      testResults.screenshots.push('02-after-login.png');

      // Step 3: Navigate to sales order creation page
      console.log('🟢 Step 3: Navigating to sales order creation page');
      await page.goto('http://127.0.0.1:8000/customers/1/orders/create');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for any dynamic content to load
      
      testResults.steps.push({
        step: 3,
        action: 'Navigate to order creation',
        url: 'http://127.0.0.1:8000/customers/1/orders/create',
        success: true,
        timestamp: new Date().toISOString()
      });
      
      await page.screenshot({ path: 'test-results/03-order-create-page.png', fullPage: true });
      testResults.screenshots.push('03-order-create-page.png');

      // Step 4: Test user workflow - select customer from dropdown
      console.log('🟢 Step 4: Testing customer selection dropdown');
      
      const customerDropdown = page.locator('select[name="customer_id"]');
      const customerDropdownExists = await customerDropdown.isVisible();
      console.log(`Customer dropdown visible: ${customerDropdownExists}`);
      
      if (customerDropdownExists) {
        const customerOptions = await page.locator('select[name="customer_id"] option').count();
        console.log(`Customer dropdown has ${customerOptions} options`);
        
        if (customerOptions > 1) {
          // Select the first customer (not the default option)
          await customerDropdown.selectOption({ index: 1 });
          const selectedCustomer = await customerDropdown.inputValue();
          console.log(`Selected customer ID: ${selectedCustomer}`);
          
          testResults.steps.push({
            step: 4,
            action: 'Customer selection',
            details: `Selected customer ID: ${selectedCustomer}`,
            success: true,
            timestamp: new Date().toISOString()
          });
        } else {
          testResults.errors.push({
            type: 'workflow_error',
            message: 'Customer dropdown has no selectable options',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        testResults.errors.push({
          type: 'element_missing',
          message: 'Customer dropdown not found',
          timestamp: new Date().toISOString()
        });
      }

      // Step 5: Click "新增項目" button to add product item
      console.log('🟢 Step 5: Testing "新增項目" button functionality');
      
      const addItemButton = page.locator('button:has-text("新增項目"), .add-item-btn, [onclick*="addItem"], [data-action="add-item"]');
      const addItemButtonExists = await addItemButton.isVisible();
      console.log(`Add item button visible: ${addItemButtonExists}`);
      
      if (addItemButtonExists) {
        // Count existing product rows before adding
        const beforeRowsCount = await page.locator('select[name*="[product_id]"], .product-row, .order-item').count();
        console.log(`Product rows before adding: ${beforeRowsCount}`);
        
        await addItemButton.click();
        await page.waitForTimeout(2000); // Wait for new row to be added
        
        // Count product rows after adding
        const afterRowsCount = await page.locator('select[name*="[product_id]"], .product-row, .order-item').count();
        console.log(`Product rows after adding: ${afterRowsCount}`);
        
        const newRowAdded = afterRowsCount > beforeRowsCount;
        console.log(`New product row added: ${newRowAdded}`);
        
        testResults.steps.push({
          step: 5,
          action: 'Add item button click',
          details: `Rows before: ${beforeRowsCount}, after: ${afterRowsCount}`,
          success: newRowAdded,
          timestamp: new Date().toISOString()
        });
        
        if (!newRowAdded) {
          testResults.errors.push({
            type: 'functionality_error',
            message: 'Add item button did not create new product row',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        testResults.errors.push({
          type: 'element_missing',
          message: 'Add item button not found',
          timestamp: new Date().toISOString()
        });
      }

      // Step 6: Verify new product selection row appears
      console.log('🟢 Step 6: Verifying new product selection row');
      
      const productDropdowns = page.locator('select[name*="[product_id]"]');
      const productDropdownCount = await productDropdowns.count();
      console.log(`Found ${productDropdownCount} product dropdowns`);
      
      if (productDropdownCount > 0) {
        // Check if product dropdown has options
        const productOptions = await page.locator('select[name*="[product_id]"] option').count();
        console.log(`Product dropdown has ${productOptions} options`);
        
        testResults.steps.push({
          step: 6,
          action: 'Verify product row creation',
          details: `Product dropdowns: ${productDropdownCount}, options: ${productOptions}`,
          success: productDropdownCount > 0 && productOptions > 1,
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.errors.push({
          type: 'element_missing',
          message: 'No product dropdown found after adding item',
          timestamp: new Date().toISOString()
        });
      }

      // Step 7: Select product from dropdown in new row
      console.log('🟢 Step 7: Selecting product from dropdown');
      
      if (productDropdownCount > 0) {
        const firstProductDropdown = productDropdowns.first();
        const productOptions = await page.locator('select[name*="[product_id]"] option').count();
        
        if (productOptions > 1) {
          // Select first available product (not default option)
          await firstProductDropdown.selectOption({ index: 1 });
          const selectedProduct = await firstProductDropdown.inputValue();
          console.log(`Selected product ID: ${selectedProduct}`);
          
          // Wait for any price auto-fill to occur
          await page.waitForTimeout(2000);
          
          testResults.steps.push({
            step: 7,
            action: 'Product selection',
            details: `Selected product ID: ${selectedProduct}`,
            success: selectedProduct && selectedProduct !== '0',
            timestamp: new Date().toISOString()
          });
        } else {
          testResults.errors.push({
            type: 'workflow_error',
            message: 'Product dropdown has no selectable options',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Step 8: Enter quantity and verify price auto-fill
      console.log('🟢 Step 8: Testing quantity entry and price auto-fill');
      
      const quantityInputs = page.locator('input[name*="[quantity]"]');
      const priceInputs = page.locator('input[name*="[unit_price]"]');
      
      if (await quantityInputs.count() > 0) {
        const firstQuantityInput = quantityInputs.first();
        const firstPriceInput = priceInputs.first();
        
        // Enter quantity
        await firstQuantityInput.fill('5');
        const quantityValue = await firstQuantityInput.inputValue();
        console.log(`Entered quantity: ${quantityValue}`);
        
        // Wait for price auto-fill
        await page.waitForTimeout(2000);
        
        // Check if price was auto-filled
        const priceValue = await firstPriceInput.inputValue();
        console.log(`Price after product selection: ${priceValue}`);
        
        const priceAutoFilled = priceValue && priceValue !== '' && priceValue !== '0';
        
        testResults.steps.push({
          step: 8,
          action: 'Quantity entry and price auto-fill',
          details: `Quantity: ${quantityValue}, Price: ${priceValue}`,
          success: quantityValue === '5' && priceAutoFilled,
          timestamp: new Date().toISOString()
        });
        
        if (!priceAutoFilled) {
          // Manually enter price if auto-fill didn't work
          console.log('Price not auto-filled, entering manually...');
          await firstPriceInput.fill('100.00');
          const manualPrice = await firstPriceInput.inputValue();
          console.log(`Manually entered price: ${manualPrice}`);
        }
      } else {
        testResults.errors.push({
          type: 'element_missing',
          message: 'Quantity input field not found',
          timestamp: new Date().toISOString()
        });
      }

      // Step 9: Test subtotal calculations
      console.log('🟢 Step 9: Testing subtotal calculations');
      
      const subtotalElements = page.locator('[class*="subtotal"], [id*="subtotal"], .item-total, .row-total');
      const totalElements = page.locator('[class*="total"], [id*="total"], .order-total, .grand-total');
      
      if (await subtotalElements.count() > 0) {
        const subtotalText = await subtotalElements.first().textContent();
        console.log(`Subtotal displayed: ${subtotalText}`);
        
        testResults.steps.push({
          step: 9,
          action: 'Subtotal calculation check',
          details: `Subtotal: ${subtotalText}`,
          success: subtotalText && subtotalText.trim() !== '',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('No subtotal elements found - checking for total elements');
      }
      
      if (await totalElements.count() > 0) {
        const totalText = await totalElements.first().textContent();
        console.log(`Total displayed: ${totalText}`);
        
        testResults.steps.push({
          step: 9,
          action: 'Total calculation check', 
          details: `Total: ${totalText}`,
          success: totalText && totalText.trim() !== '',
          timestamp: new Date().toISOString()
        });
      }

      // Take screenshot after form completion
      await page.screenshot({ path: 'test-results/04-after-form-completion.png', fullPage: true });
      testResults.screenshots.push('04-after-form-completion.png');

      // Step 10: Try to submit with "建立訂單" button
      console.log('🟢 Step 10: Testing form submission');
      
      const submitButton = page.locator('button:has-text("建立訂單"), button[type="submit"], .submit-btn, .create-order-btn');
      const submitButtonExists = await submitButton.isVisible();
      console.log(`Submit button visible: ${submitButtonExists}`);
      
      if (submitButtonExists) {
        // Before submitting, capture the current form state
        const formData = {
          customer: await page.locator('select[name="customer_id"]').inputValue(),
          items: []
        };
        
        const itemRows = await page.locator('select[name*="[product_id]"]').count();
        for (let i = 0; i < itemRows; i++) {
          const product = await page.locator('select[name*="[product_id]"]').nth(i).inputValue();
          const quantity = await page.locator('input[name*="[quantity]"]').nth(i).inputValue();
          const price = await page.locator('input[name*="[unit_price]"]').nth(i).inputValue();
          
          formData.items.push({ product, quantity, price });
        }
        
        console.log('Form data before submission:', JSON.stringify(formData, null, 2));
        
        // Click submit button
        await submitButton.click();
        await page.waitForTimeout(5000); // Wait for submission to process
        
        // Check the result
        const currentUrl = page.url();
        console.log(`URL after submission: ${currentUrl}`);
        
        // Check for success or error indicators
        const successIndicators = page.locator('.alert-success, .success-message, .flash-success');
        const errorIndicators = page.locator('.alert-danger, .error-message, .flash-error, .alert-error');
        
        const hasSuccess = await successIndicators.count() > 0;
        const hasError = await errorIndicators.count() > 0;
        
        let submitResult = 'unknown';
        let submitMessage = '';
        
        if (hasSuccess) {
          submitResult = 'success';
          submitMessage = await successIndicators.first().textContent();
        } else if (hasError) {
          submitResult = 'error';
          submitMessage = await errorIndicators.first().textContent();
        } else {
          // Check if redirected to orders list or order view
          if (currentUrl.includes('/orders/sales') && !currentUrl.includes('/create')) {
            submitResult = 'success';
            submitMessage = 'Redirected to orders list';
          }
        }
        
        console.log(`Submission result: ${submitResult} - ${submitMessage}`);
        
        testResults.steps.push({
          step: 10,
          action: 'Form submission',
          details: `Result: ${submitResult}, Message: ${submitMessage}, URL: ${currentUrl}`,
          success: submitResult === 'success',
          timestamp: new Date().toISOString()
        });
        
        if (submitResult === 'error') {
          testResults.errors.push({
            type: 'submission_error',
            message: submitMessage,
            url: currentUrl,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        testResults.errors.push({
          type: 'element_missing',
          message: 'Submit button not found',
          timestamp: new Date().toISOString()
        });
      }

      // Take screenshot after submission
      await page.screenshot({ path: 'test-results/04-after-submit.png', fullPage: true });
      testResults.screenshots.push('04-after-submit.png');

      // Step 11: Test edit workflow
      console.log('🟢 Step 11: Testing edit workflow');
      
      await page.goto('http://127.0.0.1:8000/orders/sales/7246/edit');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check if edit page loads
      const editPageLoaded = !page.url().includes('/login') && page.url().includes('/edit');
      console.log(`Edit page loaded successfully: ${editPageLoaded}`);
      
      if (editPageLoaded) {
        // Check if existing data is loaded
        const customerValue = await page.locator('select[name="customer_id"]').inputValue();
        const orderDateValue = await page.locator('input[name="order_date"]').inputValue();
        const statusValue = await page.locator('select[name="status"]').inputValue();
        
        console.log(`Edit form data - Customer: ${customerValue}, Date: ${orderDateValue}, Status: ${statusValue}`);
        
        // Check product dropdowns in edit mode
        const editProductDropdowns = await page.locator('select[name*="[product_id]"]').count();
        console.log(`Product dropdowns in edit mode: ${editProductDropdowns}`);
        
        testResults.steps.push({
          step: 11,
          action: 'Edit workflow test',
          details: `Page loaded: ${editPageLoaded}, Customer: ${customerValue}, Product dropdowns: ${editProductDropdowns}`,
          success: editPageLoaded && customerValue && editProductDropdowns > 0,
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.errors.push({
          type: 'page_load_error',
          message: 'Edit page failed to load or redirected',
          url: page.url(),
          timestamp: new Date().toISOString()
        });
      }

      await page.screenshot({ path: 'test-results/05-order-edit-page.png', fullPage: true });
      testResults.screenshots.push('05-order-edit-page.png');

      // Final assessment
      const successfulSteps = testResults.steps.filter(step => step.success).length;
      const totalSteps = testResults.steps.length;
      const errorCount = testResults.errors.length;
      
      testResults.success = successfulSteps >= Math.floor(totalSteps * 0.7) && errorCount < 5;
      
      console.log(`\n🏁 Test Summary:`);
      console.log(`Successful steps: ${successfulSteps}/${totalSteps}`);
      console.log(`Errors encountered: ${errorCount}`);
      console.log(`Overall success: ${testResults.success}`);
      
      await page.screenshot({ path: 'test-results/99-final-state.png', fullPage: true });
      testResults.screenshots.push('99-final-state.png');

    } catch (error) {
      testResults.errors.push({
        type: 'test_execution_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      console.error(`❌ Test execution error: ${error.message}`);
      await page.screenshot({ path: 'test-results/error-screenshot.png', fullPage: true });
    }

    // Log detailed test results to console
    console.log('\n📊 DETAILED TEST RESULTS:');
    console.log(JSON.stringify(testResults, null, 2));
    
    // Final assertions based on results
    expect(testResults.success).toBe(true);
    expect(testResults.errors.length).toBeLessThan(5);
    expect(testResults.steps.filter(s => s.success).length).toBeGreaterThan(6);
  });
});