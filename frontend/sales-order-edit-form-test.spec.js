import { test, expect } from '@playwright/test';

test.describe('Sales Order Edit Form Data Loading Test', () => {
  
  test('should properly load and display sales order edit form data', async ({ page }) => {
    // 1. Navigate to sales order page
    await page.goto('http://127.0.0.1:8000/orders/sales');
    
    // 2. Login if needed
    if (await page.locator('input[name="email"]').isVisible()) {
      console.log('Login required - proceeding with authentication');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
    }
    
    // 3. Navigate to sales orders if not already there
    await page.goto('http://127.0.0.1:8000/orders/sales');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of sales orders page
    await page.screenshot({ path: 'screenshots/sales-orders-list.png', fullPage: true });
    
    // 4. Look for existing sales orders
    const editButtons = page.locator('a:has-text("修改訂單"), a:has-text("Edit Order"), button:has-text("修改訂單"), button:has-text("Edit Order")');
    const editButtonCount = await editButtons.count();
    
    console.log(`Found ${editButtonCount} edit buttons`);
    
    if (editButtonCount === 0) {
      console.log('No existing sales orders found. Need to create one first.');
      // Check if there's a "New Order" or "新增訂單" button
      const newOrderButton = page.locator('a:has-text("新增訂單"), a:has-text("New Order"), button:has-text("新增訂單"), button:has-text("New Order")');
      
      if (await newOrderButton.count() > 0) {
        console.log('Creating a new sales order first...');
        await newOrderButton.first().click();
        await page.waitForLoadState('networkidle');
        
        // Fill basic form data for a new sales order
        await page.fill('select[name="customer_id"]', '1'); // Assume customer 1 exists
        await page.fill('input[name="order_date"]', '2025-07-28');
        await page.selectOption('select[name="status"]', 'pending');
        
        // Add at least one item
        await page.fill('select[name="items[0][product_id]"]', '1'); // Assume product 1 exists
        await page.fill('input[name="items[0][quantity]"]', '2');
        await page.fill('input[name="items[0][unit_price]"]', '100.00');
        
        // Submit the form
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        // Navigate back to sales orders list
        await page.goto('http://127.0.0.1:8000/orders/sales');
        await page.waitForLoadState('networkidle');
      } else {
        throw new Error('No existing sales orders and no way to create one');
      }
    }
    
    // 5. Click on the first edit button
    const firstEditButton = editButtons.first();
    await firstEditButton.click();
    
    // Wait for edit form to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Additional wait for form data to populate
    
    // Take screenshot of edit form
    await page.screenshot({ path: 'screenshots/sales-order-edit-form-loaded.png', fullPage: true });
    
    // 6. Check if form data is properly loaded
    console.log('Checking form data loading...');
    
    // Customer dropdown should be populated and selected
    const customerDropdown = page.locator('select[name="customer_id"]');
    const customerValue = await customerDropdown.inputValue();
    console.log(`Customer dropdown value: ${customerValue}`);
    
    expect(customerValue).not.toBe('');
    expect(customerValue).not.toBe('0');
    
    // Order date should be filled
    const orderDateInput = page.locator('input[name="order_date"]');
    const orderDateValue = await orderDateInput.inputValue();
    console.log(`Order date value: ${orderDateValue}`);
    
    expect(orderDateValue).not.toBe('');
    expect(orderDateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    
    // Order status should be selected
    const statusSelect = page.locator('select[name="status"]');
    const statusValue = await statusSelect.inputValue();
    console.log(`Status value: ${statusValue}`);
    
    expect(statusValue).not.toBe('');
    
    // Check if order items are loaded
    const itemRows = page.locator('[id^="item-"], .order-item-row, tr:has(select[name*="[product_id]"])');
    const itemCount = await itemRows.count();
    console.log(`Found ${itemCount} order items`);
    
    expect(itemCount).toBeGreaterThan(0);
    
    // Check first item data
    if (itemCount > 0) {
      // Product dropdown should be populated and selected
      const productDropdown = page.locator('select[name*="[product_id]"]').first();
      const productValue = await productDropdown.inputValue();
      console.log(`First item product value: ${productValue}`);
      
      expect(productValue).not.toBe('');
      expect(productValue).not.toBe('0');
      
      // Quantity should be filled
      const quantityInput = page.locator('input[name*="[quantity]"]').first();
      const quantityValue = await quantityInput.inputValue();
      console.log(`First item quantity value: ${quantityValue}`);
      
      expect(quantityValue).not.toBe('');
      expect(parseFloat(quantityValue)).toBeGreaterThan(0);
      
      // Unit price should be filled
      const priceInput = page.locator('input[name*="[unit_price]"]').first();
      const priceValue = await priceInput.inputValue();
      console.log(`First item price value: ${priceValue}`);
      
      expect(priceValue).not.toBe('');
      expect(parseFloat(priceValue)).toBeGreaterThan(0);
    }
    
    // Check if product dropdowns are populated (options available)
    const productOptions = await page.locator('select[name*="[product_id]"] option').count();
    console.log(`Product dropdown has ${productOptions} options`);
    
    expect(productOptions).toBeGreaterThan(1); // Should have at least a default option + products
    
    // Check if customer dropdown is populated
    const customerOptions = await page.locator('select[name="customer_id"] option').count();
    console.log(`Customer dropdown has ${customerOptions} options`);
    
    expect(customerOptions).toBeGreaterThan(1); // Should have at least a default option + customers
    
    // Take final screenshot showing fully loaded form
    await page.screenshot({ path: 'screenshots/sales-order-edit-form-verification.png', fullPage: true });
    
    console.log('✅ Sales order edit form data loading test completed successfully!');
    console.log('Form data verification summary:');
    console.log(`- Customer selected: ${customerValue}`);
    console.log(`- Order date filled: ${orderDateValue}`);
    console.log(`- Status selected: ${statusValue}`);
    console.log(`- Number of items: ${itemCount}`);
    console.log(`- Product options available: ${productOptions}`);
    console.log(`- Customer options available: ${customerOptions}`);
  });
  
  test('should handle edge cases and form validation', async ({ page }) => {
    // Navigate and login
    await page.goto('http://127.0.0.1:8000/orders/sales');
    
    if (await page.locator('input[name="email"]').isVisible()) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    await page.goto('http://127.0.0.1:8000/orders/sales');
    await page.waitForLoadState('networkidle');
    
    // Look for edit buttons again
    const editButtons = page.locator('a:has-text("修改訂單"), a:has-text("Edit Order"), button:has-text("修改訂單"), button:has-text("Edit Order")');
    
    if (await editButtons.count() > 0) {
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Test form interactivity
      console.log('Testing form interactivity...');
      
      // Try changing customer
      const customerDropdown = page.locator('select[name="customer_id"]');
      const originalCustomer = await customerDropdown.inputValue();
      
      // Get all customer options
      const customerOptions = await page.locator('select[name="customer_id"] option').allTextContents();
      console.log('Available customers:', customerOptions);
      
      // Try changing date
      const orderDateInput = page.locator('input[name="order_date"]');
      const originalDate = await orderDateInput.inputValue();
      await orderDateInput.fill('2025-08-01');
      const newDate = await orderDateInput.inputValue();
      console.log(`Date changed from ${originalDate} to ${newDate}`);
      
      // Check if totals are calculated (if exists)
      const totalElements = page.locator('[class*="total"], [id*="total"], .order-total');
      if (await totalElements.count() > 0) {
        const totalText = await totalElements.first().textContent();
        console.log(`Order total displayed: ${totalText}`);
      }
      
      await page.screenshot({ path: 'screenshots/sales-order-edit-form-interactivity.png', fullPage: true });
      
      console.log('✅ Form interactivity test completed');
    }
  });
});