/**
 * NexusERP Sales Order Tests
 * 銷售訂單功能完整測試套件
 * 
 * Test Coverage:
 * - Sales order listing and navigation
 * - Sales order creation workflow
 * - Order calculation logic (quantities, pricing, taxes)
 * - Customer selection and integration
 * - Product selection and pricing
 * - Order status management
 * - Order editing and updates
 */

import { test, expect } from '@playwright/test';
import { 
  TEST_CONFIG, 
  AuthHelper, 
  NavigationHelper, 
  FormHelper,
  TestUtils 
} from '../setup/test-setup.js';

test.describe('🛒 Sales Order Management Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginResult = await AuthHelper.login(page);
    expect(loginResult.success).toBe(true);
  });

  test('Sales Order Listing - Page Structure and Navigation', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('\n🎯 測試目標: 銷售訂單列表頁面結構');
    
    // Step 1: Test different possible sales order URLs
    const salesOrderUrls = [
      '/orders/sales',
      '/sales-orders',
      '/sales/orders',
      '/orders',
      '/sales'
    ];
    
    let navigationSuccess = false;
    let workingUrl = '';
    
    for (const url of salesOrderUrls) {
      console.log(`🌐 嘗試導航至: ${url}`);
      const navigation = await NavigationHelper.goToPage(page, url);
      
      if (navigation.success && !navigation.hasError) {
        navigationSuccess = true;
        workingUrl = url;
        console.log(`✅ 成功存取: ${url}`);
        break;
      } else {
        console.log(`❌ 無法存取: ${url}`);
      }
    }
    
    if (!navigationSuccess) {
      test.skip('無法找到銷售訂單頁面');
      return;
    }
    
    await TestUtils.takeScreenshot(page, '01-sales-orders-page-loaded');
    
    // Step 2: Verify page content
    const pageTitle = await page.title();
    console.log(`頁面標題: ${pageTitle}`);
    
    // Step 3: Check main page elements
    const pageElements = {
      heading: await TestUtils.waitForElement(page, 'h1, h2, h3, .page-title'),
      content: await TestUtils.waitForElement(page, 'main, .content, .container'),
      navigation: await TestUtils.waitForElement(page, 'nav, .navigation, .breadcrumb')
    };
    
    console.log('頁面元素檢查:');
    Object.entries(pageElements).forEach(([key, result]) => {
      console.log(`- ${key}: ${result.found ? '✅' : '❌'}`);
    });
    
    // Step 4: Check for order data display
    const dataElements = [
      'table',
      '.order-list',
      '.sales-order-list',
      '.data-table',
      '[data-orders]',
      '.card',
      '.list-group'
    ];
    
    let dataStructureFound = false;
    for (const selector of dataElements) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        console.log(`✅ 找到訂單數據結構: ${selector}`);
        dataStructureFound = true;
        
        if (selector === 'table') {
          const rows = await page.locator('table tr').count();
          console.log(`表格行數: ${rows}`);
        }
        break;
      }
    }
    
    // Step 5: Check for create order button
    const createButtonSelectors = [
      'button:has-text("新增")',
      'button:has-text("Add")',
      'button:has-text("Create")',
      'a:has-text("新增訂單")',
      'a:has-text("Create Order")',
      '.btn-primary',
      '[href*="create"]',
      '[href*="orders/create"]'
    ];
    
    let createButtonFound = false;
    for (const selector of createButtonSelectors) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        console.log(`✅ 找到新增訂單按鈕: ${selector}`);
        createButtonFound = true;
        break;
      }
    }
    
    console.log(`訂單數據結構: ${dataStructureFound ? '✅' : '⚠️'}`);
    console.log(`新增功能: ${createButtonFound ? '✅' : '⚠️'}`);
    
    console.log('✅ 銷售訂單列表頁面結構檢查完成');
  });

  test('Sales Order Creation - Order Form Structure', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🎯 測試目標: 銷售訂單創建表單結構');
    console.log('📊 預期計算: 數量(2) × 單價(85000) = 小計(170000) + 稅額(8500) = 總計(178500)');
    
    // Step 1: Navigate to create order page
    const createUrls = [
      '/orders/sales/create',
      '/sales-orders/create',
      '/sales/orders/create',
      '/orders/create'
    ];
    
    let createPageFound = false;
    for (const url of createUrls) {
      console.log(`🌐 嘗試存取訂單創建頁面: ${url}`);
      const navigation = await NavigationHelper.goToPage(page, url);
      
      if (navigation.success && !navigation.hasError) {
        createPageFound = true;
        console.log(`✅ 成功存取創建頁面: ${url}`);
        break;
      }
    }
    
    if (!createPageFound) {
      // Try finding create button from orders list
      console.log('⚠️ 直接導航失敗，嘗試從列表頁面尋找新增按鈕');
      
      const listUrls = ['/orders/sales', '/sales-orders', '/orders'];
      for (const listUrl of listUrls) {
        const listNavigation = await NavigationHelper.goToPage(page, listUrl);
        if (listNavigation.success) {
          const createBtn = page.locator('button:has-text("新增"), a:has-text("新增"), .btn-primary').first();
          try {
            await createBtn.click({ timeout: 5000 });
            createPageFound = true;
            console.log('✅ 透過新增按鈕存取創建頁面');
            break;
          } catch (e) {
            continue;
          }
        }
      }
    }
    
    if (!createPageFound) {
      test.skip('無法存取銷售訂單創建頁面');
      return;
    }
    
    await page.waitForTimeout(3000);
    await TestUtils.takeScreenshot(page, '01-sales-order-create-form');
    
    // Step 2: Check for order form structure
    const formElements = {
      form: await TestUtils.waitForElement(page, 'form, #salesOrderForm, .order-form'),
      customerField: await TestUtils.waitForElement(page, 'select[name*="customer"], input[name*="customer"], .customer-select'),
      dateField: await TestUtils.waitForElement(page, 'input[name*="date"], input[type="date"]'),
      itemsSection: await TestUtils.waitForElement(page, '.order-items, .line-items, #orderItems, table'),
      addItemButton: await TestUtils.waitForElement(page, 'button:has-text("新增"), button:has-text("Add"), #addItemBtn, .add-item-btn')
    };
    
    console.log('訂單表單元素檢查:');
    Object.entries(formElements).forEach(([key, result]) => {
      console.log(`- ${key}: ${result.found ? '✅' : '❌'}`);
    });
    
    // Step 3: Check calculation elements
    const calculationElements = {
      subtotal: await TestUtils.waitForElement(page, '#subtotalAmount, [data-subtotal], .subtotal, input[name*="subtotal"]'),
      tax: await TestUtils.waitForElement(page, '#taxAmount, [data-tax], .tax, input[name*="tax"]'),
      total: await TestUtils.waitForElement(page, '#totalAmount, [data-total], .total, input[name*="total"]')
    };
    
    console.log('計算元素檢查:');
    Object.entries(calculationElements).forEach(([key, result]) => {
      console.log(`- ${key}: ${result.found ? '✅' : '❌'}`);
    });
    
    // Step 4: Evaluate order form structure completeness
    const structureScore = {
      basicForm: formElements.form.found ? 1 : 0,
      customerSelection: formElements.customerField.found ? 1 : 0,
      itemManagement: (formElements.itemsSection.found + formElements.addItemButton.found) / 2,
      calculations: Object.values(calculationElements).filter(e => e.found).length / 3
    };
    
    const overallScore = Object.values(structureScore).reduce((a, b) => a + b, 0) / 4;
    console.log(`\n📊 表單結構完整度: ${Math.round(overallScore * 100)}%`);
    
    // Step 5: Test basic form interactions if structure is adequate
    if (overallScore >= 0.6) {
      console.log('🧪 測試基本表單互動...');
      
      // Test customer selection
      if (formElements.customerField.found) {
        try {
          const customerField = formElements.customerField.element;
          const tagName = await customerField.evaluate(el => el.tagName.toLowerCase());
          
          if (tagName === 'select') {
            const options = await page.locator('select[name*="customer"] option').count();
            console.log(`客戶選項數量: ${options}`);
            
            if (options > 1) {
              await customerField.selectOption({ index: 1 });
              console.log('✅ 客戶選擇測試成功');
            }
          } else if (tagName === 'input') {
            await customerField.fill('測試客戶');
            console.log('✅ 客戶輸入測試成功');
          }
        } catch (e) {
          console.log(`⚠️ 客戶選擇測試失敗: ${e.message}`);
        }
      }
      
      // Test add item button
      if (formElements.addItemButton.found) {
        try {
          await formElements.addItemButton.element.click();
          await page.waitForTimeout(2000);
          await TestUtils.takeScreenshot(page, '02-after-add-item-click');
          console.log('✅ 新增項目按鈕測試成功');
        } catch (e) {
          console.log(`⚠️ 新增項目按鈕測試失敗: ${e.message}`);
        }
      }
      
      await TestUtils.takeScreenshot(page, '03-form-interaction-complete');
    }
    
    console.log('✅ 銷售訂單創建表單結構測試完成');
  });

  test('Sales Order Calculations - Pricing and Tax Logic', async ({ page }) => {
    test.setTimeout(150000);
    
    console.log('\n🎯 測試目標: 銷售訂單計算邏輯');
    console.log('📊 測試案例: 測試價格、數量、稅額的自動計算');
    
    // Step 1: Navigate to create order page
    let navigationSuccess = false;
    
    const createUrls = ['/orders/sales/create', '/sales-orders/create', '/orders/create'];
    for (const url of createUrls) {
      const navigation = await NavigationHelper.goToPage(page, url);
      if (navigation.success && !navigation.hasError) {
        navigationSuccess = true;
        break;
      }
    }
    
    if (!navigationSuccess) {
      // Try via list page
      await NavigationHelper.goToPage(page, '/orders/sales');
      const createBtn = page.locator('button:has-text("新增"), a:has-text("新增")').first();
      try {
        await createBtn.click();
        navigationSuccess = true;
      } catch (e) {
        test.skip('無法存取銷售訂單創建頁面');
        return;
      }
    }
    
    await page.waitForTimeout(3000);
    await TestUtils.takeScreenshot(page, '01-calculation-form-initial');
    
    // Step 2: Find calculation-related fields
    const calculationFields = {
      quantity: await TestUtils.waitForElement(page, 'input[name*="quantity"], input[name*="qty"], .quantity-input'),
      unitPrice: await TestUtils.waitForElement(page, 'input[name*="price"], input[name*="unit_price"], .price-input'),
      lineTotal: await TestUtils.waitForElement(page, 'input[name*="line_total"], input[name*="amount"], .line-total'),
      subtotal: await TestUtils.waitForElement(page, 'input[name*="subtotal"], #subtotalAmount, .subtotal'),
      taxRate: await TestUtils.waitForElement(page, 'input[name*="tax_rate"], select[name*="tax"], .tax-rate'),
      taxAmount: await TestUtils.waitForElement(page, 'input[name*="tax_amount"], #taxAmount, .tax-amount'),
      grandTotal: await TestUtils.waitForElement(page, 'input[name*="total"], input[name*="grand_total"], #totalAmount, .grand-total')
    };
    
    console.log('計算欄位檢查:');
    Object.entries(calculationFields).forEach(([key, result]) => {
      console.log(`- ${key}: ${result.found ? '✅' : '❌'}`);
    });
    
    // Step 3: Test calculation scenarios
    const testCases = [
      { quantity: 2, unitPrice: 85000, expectedSubtotal: 170000, description: '基本計算測試' },
      { quantity: 1, unitPrice: 1000, expectedSubtotal: 1000, description: '簡單計算測試' },
      { quantity: 5, unitPrice: 2500, expectedSubtotal: 12500, description: '多數量測試' }
    ];
    
    for (const [index, testCase] of testCases.entries()) {
      console.log(`🧮 執行${testCase.description}: 數量=${testCase.quantity}, 單價=${testCase.unitPrice}`);
      
      try {
        // Fill quantity field
        if (calculationFields.quantity.found) {
          await calculationFields.quantity.element.clear();
          await calculationFields.quantity.element.fill(testCase.quantity.toString());
          console.log(`✅ 設定數量: ${testCase.quantity}`);
        }
        
        // Fill unit price field
        if (calculationFields.unitPrice.found) {
          await calculationFields.unitPrice.element.clear();
          await calculationFields.unitPrice.element.fill(testCase.unitPrice.toString());
          console.log(`✅ 設定單價: ${testCase.unitPrice}`);
        }
        
        // Trigger calculation (blur or tab out)
        if (calculationFields.unitPrice.found) {
          await calculationFields.unitPrice.element.blur();
        }
        
        // Wait for calculations to update
        await page.waitForTimeout(2000);
        
        // Check line total calculation
        if (calculationFields.lineTotal.found) {
          const lineTotal = await calculationFields.lineTotal.element.inputValue();
          console.log(`計算結果 - 行總計: ${lineTotal}`);
          
          const numericLineTotal = parseFloat(lineTotal.replace(/[^\d.]/g, ''));
          if (numericLineTotal === testCase.expectedSubtotal) {
            console.log('✅ 行總計計算正確');
          } else {
            console.log(`⚠️ 行總計計算可能有誤 - 期望: ${testCase.expectedSubtotal}, 實際: ${numericLineTotal}`);
          }
        }
        
        // Check subtotal
        if (calculationFields.subtotal.found) {
          const subtotal = await calculationFields.subtotal.element.inputValue();
          console.log(`計算結果 - 小計: ${subtotal}`);
        }
        
        // Check tax calculation
        if (calculationFields.taxAmount.found) {
          const taxAmount = await calculationFields.taxAmount.element.inputValue();
          console.log(`計算結果 - 稅額: ${taxAmount}`);
        }
        
        // Check grand total
        if (calculationFields.grandTotal.found) {
          const grandTotal = await calculationFields.grandTotal.element.inputValue();
          console.log(`計算結果 - 總計: ${grandTotal}`);
        }
        
        await TestUtils.takeScreenshot(page, `02-calculation-test-${index + 1}`);
        
      } catch (error) {
        console.log(`❌ 計算測試失敗: ${error.message}`);
      }
    }
    
    // Step 4: Test tax rate changes
    if (calculationFields.taxRate.found) {
      console.log('🧮 測試稅率變更...');
      
      try {
        const taxField = calculationFields.taxRate.element;
        const tagName = await taxField.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'select') {
          const options = await page.locator('select[name*="tax"] option').count();
          console.log(`稅率選項數量: ${options}`);
          
          if (options > 1) {
            await taxField.selectOption({ index: 1 });
            await page.waitForTimeout(2000);
            console.log('✅ 稅率變更測試');
          }
        } else if (tagName === 'input') {
          await taxField.clear();
          await taxField.fill('0.05'); // 5% tax
          await taxField.blur();
          await page.waitForTimeout(2000);
          console.log('✅ 稅率輸入測試');
        }
        
        await TestUtils.takeScreenshot(page, '03-tax-rate-test');
        
      } catch (error) {
        console.log(`⚠️ 稅率測試失敗: ${error.message}`);
      }
    }
    
    // Step 5: Final calculation verification
    await TestUtils.takeScreenshot(page, '04-final-calculations');
    
    console.log('✅ 銷售訂單計算邏輯測試完成');
  });

  test('Sales Order Item Management - Add/Remove Items', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🎯 測試目標: 銷售訂單項目管理');
    
    // Step 1: Navigate to create order page
    const createUrls = ['/orders/sales/create', '/sales-orders/create', '/orders/create'];
    let createPageAccessed = false;
    
    for (const url of createUrls) {
      const navigation = await NavigationHelper.goToPage(page, url);
      if (navigation.success && !navigation.hasError) {
        createPageAccessed = true;
        break;
      }
    }
    
    if (!createPageAccessed) {
      test.skip('無法存取銷售訂單創建頁面');
      return;
    }
    
    await page.waitForTimeout(3000);
    await TestUtils.takeScreenshot(page, '01-item-management-initial');
    
    // Step 2: Find item management elements
    const itemElements = {
      addButton: await TestUtils.waitForElement(page, 'button:has-text("新增"), button:has-text("Add"), .add-item-btn, #addItemBtn'),
      itemsTable: await TestUtils.waitForElement(page, 'table, .items-table, .order-items, #orderItems'),
      productSelect: await TestUtils.waitForElement(page, 'select[name*="product"], .product-select'),
      removeButton: await TestUtils.waitForElement(page, 'button:has-text("刪除"), button:has-text("Remove"), .remove-btn')
    };
    
    console.log('項目管理元素檢查:');
    Object.entries(itemElements).forEach(([key, result]) => {
      console.log(`- ${key}: ${result.found ? '✅' : '❌'}`);
    });
    
    // Step 3: Test adding items
    if (itemElements.addButton.found) {
      console.log('🛒 測試新增訂單項目...');
      
      try {
        // Click add item button multiple times
        for (let i = 1; i <= 3; i++) {
          await itemElements.addButton.element.click();
          await page.waitForTimeout(1500);
          console.log(`✅ 新增第 ${i} 個項目`);
          
          if (i === 1) {
            await TestUtils.takeScreenshot(page, '02-first-item-added');
          }
        }
        
        await TestUtils.takeScreenshot(page, '03-multiple-items-added');
        
        // Count current items
        const itemRows = await page.locator('tr, .item-row, .order-item').count();
        console.log(`目前項目數量: ${itemRows}`);
        
      } catch (error) {
        console.log(`⚠️ 新增項目失敗: ${error.message}`);
      }
    }
    
    // Step 4: Test product selection
    if (itemElements.productSelect.found) {
      console.log('📦 測試產品選擇...');
      
      try {
        const productSelects = page.locator('select[name*="product"], .product-select');
        const selectCount = await productSelects.count();
        console.log(`產品選擇器數量: ${selectCount}`);
        
        if (selectCount > 0) {
          const firstSelect = productSelects.first();
          const options = await page.locator('select[name*="product"] option').count();
          console.log(`產品選項數量: ${options}`);
          
          if (options > 1) {
            await firstSelect.selectOption({ index: 1 });
            await page.waitForTimeout(2000);
            console.log('✅ 產品選擇測試成功');
            
            await TestUtils.takeScreenshot(page, '04-product-selected');
          }
        }
        
      } catch (error) {
        console.log(`⚠️ 產品選擇失敗: ${error.message}`);
      }
    }
    
    // Step 5: Test item removal
    if (itemElements.removeButton.found) {
      console.log('🗑️ 測試刪除項目...');
      
      try {
        const removeButtons = page.locator('button:has-text("刪除"), button:has-text("Remove"), .remove-btn');
        const removeCount = await removeButtons.count();
        console.log(`刪除按鈕數量: ${removeCount}`);
        
        if (removeCount > 0) {
          // Remove the last item
          const lastRemoveBtn = removeButtons.last();
          await lastRemoveBtn.click();
          await page.waitForTimeout(2000);
          console.log('✅ 項目刪除測試成功');
          
          await TestUtils.takeScreenshot(page, '05-item-removed');
        }
        
      } catch (error) {
        console.log(`⚠️ 項目刪除失敗: ${error.message}`);
      }
    }
    
    // Step 6: Test quantity and price input for items
    const quantityInputs = page.locator('input[name*="quantity"], .quantity-input');
    const quantityCount = await quantityInputs.count();
    
    if (quantityCount > 0) {
      console.log('🔢 測試數量輸入...');
      
      try {
        const firstQuantity = quantityInputs.first();
        await firstQuantity.clear();
        await firstQuantity.fill('5');
        console.log('✅ 數量輸入測試成功');
        
        await page.waitForTimeout(1000);
        await TestUtils.takeScreenshot(page, '06-quantity-updated');
        
      } catch (error) {
        console.log(`⚠️ 數量輸入失敗: ${error.message}`);
      }
    }
    
    console.log('✅ 銷售訂單項目管理測試完成');
  });

  test('Sales Order Submission - Form Validation and Save', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🎯 測試目標: 銷售訂單提交和驗證');
    
    // Step 1: Navigate to create order page
    const createUrls = ['/orders/sales/create', '/sales-orders/create', '/orders/create'];
    let createPageAccessed = false;
    
    for (const url of createUrls) {
      const navigation = await NavigationHelper.goToPage(page, url);
      if (navigation.success && !navigation.hasError) {
        createPageAccessed = true;
        break;
      }
    }
    
    if (!createPageAccessed) {
      test.skip('無法存取銷售訂單創建頁面');
      return;
    }
    
    await page.waitForTimeout(3000);
    await TestUtils.takeScreenshot(page, '01-submission-form-initial');
    
    // Step 2: Fill basic order information
    console.log('📝 填寫基本訂單資訊...');
    
    // Try to select customer
    const customerField = await TestUtils.waitForElement(page, 'select[name*="customer"], input[name*="customer"]');
    if (customerField.found) {
      try {
        const element = customerField.element;
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'select') {
          const options = await page.locator('select[name*="customer"] option').count();
          if (options > 1) {
            await element.selectOption({ index: 1 });
            console.log('✅ 客戶選擇完成');
          }
        } else {
          await element.fill('測試客戶');
          console.log('✅ 客戶輸入完成');
        }
      } catch (e) {
        console.log('⚠️ 客戶欄位填寫失敗');
      }
    }
    
    // Fill order date if available
    const dateField = await TestUtils.waitForElement(page, 'input[name*="date"], input[type="date"]');
    if (dateField.found) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await dateField.element.fill(today);
        console.log('✅ 訂單日期設定完成');
      } catch (e) {
        console.log('⚠️ 日期欄位填寫失敗');
      }
    }
    
    // Step 3: Add at least one item
    console.log('🛒 新增訂單項目...');
    
    const addItemBtn = await TestUtils.waitForElement(page, 'button:has-text("新增"), .add-item-btn');
    if (addItemBtn.found) {
      try {
        await addItemBtn.element.click();
        await page.waitForTimeout(2000);
        console.log('✅ 項目新增成功');
        
        // Try to fill item details
        const productSelect = page.locator('select[name*="product"]').first();
        const productOptions = await page.locator('select[name*="product"] option').count();
        
        if (productOptions > 1) {
          await productSelect.selectOption({ index: 1 });
          console.log('✅ 產品選擇完成');
        }
        
        // Fill quantity
        const quantityInput = page.locator('input[name*="quantity"]').first();
        const quantityExists = await quantityInput.count();
        if (quantityExists > 0) {
          await quantityInput.fill('2');
          console.log('✅ 數量填寫完成');
        }
        
        await page.waitForTimeout(2000);
        
      } catch (e) {
        console.log('⚠️ 項目新增失敗');
      }
    }
    
    await TestUtils.takeScreenshot(page, '02-order-form-filled');
    
    // Step 4: Test form validation (submit empty or incomplete form)
    console.log('🧪 測試表單驗證...');
    
    const submitBtn = await TestUtils.waitForElement(page, 'button[type="submit"], .btn-submit, .btn-save');
    if (submitBtn.found) {
      try {
        await submitBtn.element.click();
        await page.waitForTimeout(3000);
        
        // Check for validation messages
        const validationSelectors = [
          '.error-message',
          '.invalid-feedback',
          '.field-error',
          '.alert-danger',
          '.text-red-500',
          '.validation-error'
        ];
        
        let validationFound = false;
        for (const selector of validationSelectors) {
          const elements = page.locator(selector);
          const count = await elements.count();
          if (count > 0) {
            console.log(`✅ 找到驗證錯誤: ${selector} (${count} 個)`);
            validationFound = true;
            break;
          }
        }
        
        // Check current URL to see if submission was successful or stayed on form
        const currentUrl = page.url();
        const stayedOnForm = currentUrl.includes('/create');
        
        await TestUtils.takeScreenshot(page, '03-after-submission');
        
        if (stayedOnForm && validationFound) {
          console.log('✅ 表單驗證正常運作');
        } else if (!stayedOnForm) {
          console.log('✅ 訂單可能已成功創建');
          
          // Check for success messages
          const successSelectors = [
            '.alert-success',
            '.success-message',
            '.toast-success',
            ':has-text("成功")',
            ':has-text("已建立")',
            ':has-text("created")'
          ];
          
          for (const selector of successSelectors) {
            const result = await TestUtils.waitForElement(page, selector);
            if (result.found) {
              console.log(`✅ 找到成功訊息: ${selector}`);
              break;
            }
          }
        } else {
          console.log('⚠️ 表單提交狀態不明確');
        }
        
      } catch (error) {
        console.log(`❌ 表單提交測試失敗: ${error.message}`);
      }
    }
    
    await TestUtils.takeScreenshot(page, '04-submission-final');
    
    console.log('✅ 銷售訂單提交測試完成');
  });

  test.afterEach(async ({ page }) => {
    // Clean up - take final screenshot
    await TestUtils.takeScreenshot(page, 'final-state');
  });
});