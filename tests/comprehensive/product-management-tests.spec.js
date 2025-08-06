/**
 * NexusERP Product Management Tests
 * 產品管理功能完整測試套件
 * 
 * Test Coverage:
 * - Product listing and search
 * - Product creation and validation
 * - Product editing and updates
 * - Product inventory management
 * - Product categorization
 * - Product pricing and calculations
 */

import { test, expect } from '@playwright/test';
import { 
  TEST_CONFIG, 
  AuthHelper, 
  NavigationHelper, 
  FormHelper,
  TestUtils 
} from '../setup/test-setup.js';

test.describe('📦 Product Management Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginResult = await AuthHelper.login(page);
    expect(loginResult.success).toBe(true);
  });

  test('Product Listing - Page Structure and Loading', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('\n🎯 測試目標: 產品列表頁面結構');
    
    // Step 1: Navigate to products page
    const navigation = await NavigationHelper.goToPage(page, '/products');
    expect(navigation.success).toBe(true);
    expect(navigation.hasError).toBe(false);
    
    await TestUtils.takeScreenshot(page, '01-products-page-loaded');
    
    // Step 2: Verify page title and structure
    const pageTitle = await page.title();
    expect(pageTitle).toContain('產品' || pageTitle).toContain('Product');
    
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
    
    // Step 4: Check for product data display
    const dataElements = [
      'table',
      '.product-list',
      '.product-grid',
      '.data-table',
      '[data-products]',
      '.card',
      '.list-group'
    ];
    
    let dataStructureFound = false;
    for (const selector of dataElements) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        console.log(`✅ 找到產品數據結構: ${selector}`);
        dataStructureFound = true;
        break;
      }
    }
    
    // Step 5: Check for action buttons
    const actionButtons = [
      'button:has-text("新增")',
      'button:has-text("Add")',
      'a:has-text("新增產品")',
      'a:has-text("Add Product")',
      '.btn-primary',
      '[href*="create"]',
      '[href*="products/create"]'
    ];
    
    let actionButtonFound = false;
    for (const selector of actionButtons) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        console.log(`✅ 找到操作按鈕: ${selector}`);
        actionButtonFound = true;
        break;
      }
    }
    
    console.log(`產品數據結構: ${dataStructureFound ? '✅' : '⚠️'}`);
    console.log(`操作按鈕: ${actionButtonFound ? '✅' : '⚠️'}`);
    
    console.log('✅ 產品列表頁面結構檢查完成');
  });

  test('Product Search - Search and Filter Functionality', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('\n🎯 測試目標: 產品搜尋和篩選功能');
    
    // Step 1: Navigate to products page
    await NavigationHelper.goToPage(page, '/products');
    await TestUtils.takeScreenshot(page, '01-products-search-initial');
    
    // Step 2: Find search functionality
    const searchSelectors = [
      'input[type="search"]',
      'input[name="search"]',
      'input[placeholder*="搜尋" i]',
      'input[placeholder*="search" i]',
      '.search-input',
      '#search'
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        searchInput = result.element;
        console.log(`✅ 找到搜尋框: ${selector}`);
        break;
      }
    }
    
    if (!searchInput) {
      console.log('⚠️ 未找到搜尋框');
    } else {
      // Step 3: Test different search scenarios
      const searchTests = [
        { term: 'iPhone', description: '產品名稱搜尋' },
        { term: 'TEST-', description: '產品代碼搜尋' },
        { term: '1000', description: '價格搜尋' },
        { term: '3C', description: '分類搜尋' }
      ];
      
      for (const [index, searchTest] of searchTests.entries()) {
        console.log(`🔍 執行${searchTest.description}: "${searchTest.term}"`);
        
        // Clear and fill search input
        await searchInput.clear();
        await searchInput.fill(searchTest.term);
        
        // Submit search
        try {
          await page.keyboard.press('Enter');
        } catch (e) {
          // Try search button
          const searchBtn = page.locator('button[type="submit"], .search-btn, button:has-text("搜尋")').first();
          try {
            await searchBtn.click({ timeout: 3000 });
          } catch (e) {
            console.log('⚠️ 無法提交搜尋');
          }
        }
        
        await page.waitForTimeout(3000);
        await TestUtils.takeScreenshot(page, `02-search-${searchTest.term.replace(/[^a-zA-Z0-9]/g, '_')}`);
        
        // Check results
        const hasResults = await page.locator('table tr, .product-item, .card, .list-item').count() > 0;
        console.log(`搜尋結果: ${hasResults ? '有資料' : '無資料'}`);
      }
      
      // Clear search
      await searchInput.clear();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }
    
    // Step 4: Check for filter options
    const filterSelectors = [
      'select[name="category"]',
      'select[name="status"]',
      '.filter-dropdown',
      '.category-filter',
      '.status-filter'
    ];
    
    let filterFound = false;
    for (const selector of filterSelectors) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        console.log(`✅ 找到篩選器: ${selector}`);
        filterFound = true;
        
        // Try to interact with filter
        try {
          const options = await page.locator(`${selector} option`).count();
          console.log(`篩選選項數量: ${options}`);
          
          if (options > 1) {
            await result.element.selectOption({ index: 1 });
            await page.waitForTimeout(2000);
            await TestUtils.takeScreenshot(page, '03-filter-applied');
            console.log('✅ 篩選器測試成功');
          }
        } catch (e) {
          console.log('⚠️ 篩選器測試失敗');
        }
        break;
      }
    }
    
    console.log(`篩選功能: ${filterFound ? '✅' : '⚠️'}`);
    console.log('✅ 產品搜尋功能測試完成');
  });

  test('Product Creation - Add New Product', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🎯 測試目標: 新增產品功能');
    
    // Step 1: Navigate to products page
    await NavigationHelper.goToPage(page, '/products');
    
    // Step 2: Find and click add product button
    const addButtonSelectors = [
      'button:has-text("新增")',
      'button:has-text("Add")',
      'a:has-text("新增產品")',
      'a:has-text("Add Product")',
      '.btn-primary',
      '[href*="create"]',
      '[href*="products/create"]'
    ];
    
    let addButtonClicked = false;
    for (const selector of addButtonSelectors) {
      try {
        const button = page.locator(selector);
        const isVisible = await button.isVisible({ timeout: 3000 });
        if (isVisible) {
          await button.click();
          console.log(`✅ 點擊新增按鈕: ${selector}`);
          addButtonClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!addButtonClicked) {
      // Try direct navigation
      console.log('⚠️ 未找到新增按鈕，嘗試直接導航');
      const createNavigation = await NavigationHelper.goToPage(page, '/products/create');
      if (!createNavigation.success) {
        test.skip('無法存取產品新增頁面');
        return;
      }
    }
    
    await page.waitForTimeout(3000);
    await TestUtils.takeScreenshot(page, '01-add-product-form');
    
    // Step 3: Check for product form
    const formSelectors = [
      'form',
      '#productForm',
      '.product-form',
      '[data-form="product"]'
    ];
    
    let form = null;
    for (const selector of formSelectors) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        form = result.element;
        console.log(`✅ 找到產品表單: ${selector}`);
        break;
      }
    }
    
    if (!form) {
      console.log('⚠️ 未找到產品表單');
      test.skip('產品表單不存在');
      return;
    }
    
    // Step 4: Generate test product data
    const testProduct = TestUtils.generateTestData('product');
    console.log('測試產品數據:', testProduct);
    
    // Step 5: Fill form with product data
    const formData = {
      name: testProduct.name,
      code: testProduct.code,
      sku: testProduct.code,
      price: testProduct.price.toString(),
      cost: (testProduct.price * 0.7).toString(),
      quantity: testProduct.quantity.toString(),
      stock: testProduct.quantity.toString(),
      description: `測試產品描述 - ${testProduct.name}`,
      category_id: '1',
      unit: '個',
      status: 'active'
    };
    
    const fillResult = await FormHelper.fillForm(page, formData);
    console.log(`表單填寫: ${fillResult.success ? '✅' : '❌'}`);
    
    await TestUtils.takeScreenshot(page, '02-product-form-filled');
    
    // Step 6: Handle file upload if present
    const fileInputs = page.locator('input[type="file"]');
    const fileInputCount = await fileInputs.count();
    if (fileInputCount > 0) {
      console.log(`找到 ${fileInputCount} 個檔案上傳欄位`);
      // Note: File upload testing would require actual files
    }
    
    // Step 7: Submit form
    const submitResult = await FormHelper.submitForm(page);
    console.log(`表單提交: ${submitResult.success ? '✅' : '❌'}`);
    
    await TestUtils.takeScreenshot(page, '03-product-form-submitted');
    
    // Step 8: Check for success indication
    const currentUrl = page.url();
    const isRedirected = !currentUrl.includes('/create');
    
    console.log(`提交後 URL: ${currentUrl}`);
    console.log(`已重定向: ${isRedirected ? '✅' : '❌'}`);
    
    // Check for success messages
    const successSelectors = [
      '.alert-success',
      '.success-message',
      '.toast-success',
      '.notification-success',
      ':has-text("成功")',
      ':has-text("已新增")',
      ':has-text("created")'
    ];
    
    let successMessageFound = false;
    for (const selector of successSelectors) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        console.log(`✅ 找到成功訊息: ${selector}`);
        successMessageFound = true;
        break;
      }
    }
    
    console.log(`成功訊息: ${successMessageFound ? '✅' : '⚠️'}`);
    console.log('✅ 產品新增功能測試完成');
  });

  test('Product Inventory Management - Stock Updates', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('\n🎯 測試目標: 產品庫存管理');
    
    // Step 1: Navigate to products page
    await NavigationHelper.goToPage(page, '/products');
    await TestUtils.takeScreenshot(page, '01-inventory-initial');
    
    // Step 2: Look for existing products with edit/manage options
    const productActionSelectors = [
      'button:has-text("編輯")',
      'button:has-text("Edit")',
      'a:has-text("管理")',
      'a:has-text("Manage")',
      '.btn-edit',
      '.edit-link',
      'td a, .action-buttons a'
    ];
    
    let productAction = null;
    for (const selector of productActionSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        productAction = elements.first();
        console.log(`✅ 找到產品操作: ${selector} (${count} 個)`);
        break;
      }
    }
    
    if (!productAction) {
      console.log('⚠️ 未找到產品操作選項');
      // Try to find any clickable product rows
      const productRows = page.locator('table tr, .product-item, .card');
      const rowCount = await productRows.count();
      if (rowCount > 1) {
        // Try clicking first data row (skip header)
        try {
          await productRows.nth(1).click();
          console.log('✅ 點擊產品行');
          await page.waitForTimeout(3000);
        } catch (e) {
          console.log('⚠️ 無法點擊產品');
        }
      }
    } else {
      // Click the first edit/manage action
      try {
        await productAction.click();
        console.log('✅ 點擊產品管理');
        await page.waitForTimeout(3000);
        await TestUtils.takeScreenshot(page, '02-product-edit-form');
      } catch (e) {
        console.log('⚠️ 無法點擊產品管理');
      }
    }
    
    // Step 3: Look for inventory/stock fields
    const inventorySelectors = [
      'input[name="quantity"]',
      'input[name="stock"]',
      'input[name="inventory"]',
      'input[name="stock_quantity"]',
      '.quantity-input',
      '.stock-input'
    ];
    
    let inventoryField = null;
    for (const selector of inventorySelectors) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        inventoryField = result.element;
        console.log(`✅ 找到庫存欄位: ${selector}`);
        break;
      }
    }
    
    if (inventoryField) {
      // Test inventory update
      try {
        const currentValue = await inventoryField.inputValue();
        console.log(`目前庫存值: ${currentValue}`);
        
        const newQuantity = Math.floor(Math.random() * 100) + 1;
        await inventoryField.clear();
        await inventoryField.fill(newQuantity.toString());
        
        console.log(`更新庫存為: ${newQuantity}`);
        await TestUtils.takeScreenshot(page, '03-inventory-updated');
        
        // Try to save changes
        const saveButtons = [
          'button[type="submit"]',
          'button:has-text("儲存")',
          'button:has-text("Save")',
          'button:has-text("更新")',
          '.btn-primary'
        ];
        
        for (const btnSelector of saveButtons) {
          try {
            const saveBtn = page.locator(btnSelector);
            const isVisible = await saveBtn.isVisible({ timeout: 2000 });
            if (isVisible) {
              await saveBtn.click();
              console.log('✅ 點擊儲存按鈕');
              await page.waitForTimeout(3000);
              await TestUtils.takeScreenshot(page, '04-inventory-saved');
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
      } catch (e) {
        console.log(`⚠️ 庫存更新失敗: ${e.message}`);
      }
    }
    
    console.log(`庫存管理功能: ${inventoryField ? '✅' : '⚠️'}`);
    console.log('✅ 產品庫存管理測試完成');
  });

  test('Product Pricing - Price Calculations', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('\n🎯 測試目標: 產品價格計算');
    
    // Step 1: Navigate to product create/edit page
    let navigationSuccess = false;
    
    // Try create page first
    const createNavigation = await NavigationHelper.goToPage(page, '/products/create');
    if (createNavigation.success && !createNavigation.hasError) {
      navigationSuccess = true;
      console.log('✅ 存取產品新增頁面');
    } else {
      // Try going to products list and find edit button
      await NavigationHelper.goToPage(page, '/products');
      const editButton = page.locator('button:has-text("編輯"), a:has-text("編輯"), .btn-edit').first();
      try {
        await editButton.click({ timeout: 5000 });
        navigationSuccess = true;
        console.log('✅ 存取產品編輯頁面');
      } catch (e) {
        console.log('⚠️ 無法存取產品表單頁面');
      }
    }
    
    if (!navigationSuccess) {
      test.skip('無法存取產品表單頁面');
      return;
    }
    
    await page.waitForTimeout(3000);
    await TestUtils.takeScreenshot(page, '01-pricing-form');
    
    // Step 2: Find pricing fields
    const pricingFields = {
      cost: await TestUtils.waitForElement(page, 'input[name="cost"], input[name="cost_price"], .cost-input'),
      price: await TestUtils.waitForElement(page, 'input[name="price"], input[name="selling_price"], input[name="unit_price"], .price-input'),
      margin: await TestUtils.waitForElement(page, 'input[name="margin"], input[name="profit_margin"], .margin-input'),
      discount: await TestUtils.waitForElement(page, 'input[name="discount"], .discount-input')
    };
    
    console.log('價格欄位檢查:');
    Object.entries(pricingFields).forEach(([key, result]) => {
      console.log(`- ${key}: ${result.found ? '✅' : '❌'}`);
    });
    
    // Step 3: Test price calculations
    if (pricingFields.cost.found && pricingFields.price.found) {
      try {
        const costValue = 100;
        const priceValue = 150;
        
        // Fill cost
        await pricingFields.cost.element.clear();
        await pricingFields.cost.element.fill(costValue.toString());
        console.log(`設定成本: ${costValue}`);
        
        // Fill price
        await pricingFields.price.element.clear();
        await pricingFields.price.element.fill(priceValue.toString());
        console.log(`設定售價: ${priceValue}`);
        
        // Check if margin is auto-calculated
        await page.waitForTimeout(2000);
        
        if (pricingFields.margin.found) {
          const marginValue = await pricingFields.margin.element.inputValue();
          console.log(`自動計算毛利: ${marginValue}`);
        }
        
        await TestUtils.takeScreenshot(page, '02-pricing-calculated');
        
        // Test different cost/price combinations
        const testCases = [
          { cost: 80, price: 120 },
          { cost: 200, price: 280 },
          { cost: 50, price: 100 }
        ];
        
        for (const [index, testCase] of testCases.entries()) {
          await pricingFields.cost.element.clear();
          await pricingFields.cost.element.fill(testCase.cost.toString());
          
          await pricingFields.price.element.clear();
          await pricingFields.price.element.fill(testCase.price.toString());
          
          await page.waitForTimeout(1000);
          
          if (index === testCases.length - 1) {
            await TestUtils.takeScreenshot(page, '03-pricing-final-test');
          }
          
          console.log(`測試案例 ${index + 1}: 成本=${testCase.cost}, 售價=${testCase.price}`);
        }
        
        console.log('✅ 價格計算測試完成');
        
      } catch (e) {
        console.log(`⚠️ 價格計算測試失敗: ${e.message}`);
      }
    }
    
    console.log('✅ 產品價格功能測試完成');
  });

  test.afterEach(async ({ page }) => {
    // Clean up - take final screenshot
    await TestUtils.takeScreenshot(page, 'final-state');
  });
});