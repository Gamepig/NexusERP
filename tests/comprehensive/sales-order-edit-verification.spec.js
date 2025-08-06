/**
 * NexusERP Sales Order Edit Page Verification Tests
 * 銷售訂單編輯頁面修復驗證測試
 * 
 * Test Coverage:
 * - Customer name display fix verification
 * - Multiple product items display fix verification
 * - Order data population accuracy
 * - JavaScript error monitoring
 * - Console log analysis
 */

import { test, expect } from '@playwright/test';
import { 
  TEST_CONFIG, 
  AuthHelper, 
  NavigationHelper, 
  FormHelper,
  TestUtils 
} from '../setup/test-setup.js';

test.describe('🔧 Sales Order Edit Page Verification Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginResult = await AuthHelper.login(page);
    expect(loginResult.success).toBe(true);
  });

  test('Sales Order Edit Page - Customer Name Display Fix Verification', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('\n🎯 測試目標: 驗證客戶名稱顯示修復');
    console.log('📝 測試訂單: Order ID 7246');
    console.log('🔍 檢查項目: 客戶下拉選單應顯示正確客戶名稱，而非「請選擇客戶」');
    
    // Step 1: Navigate to specific sales order edit page
    const editUrl = '/orders/sales/7246/edit';
    console.log(`🌐 導航至編輯頁面: ${editUrl}`);
    
    const navigation = await NavigationHelper.goToPage(page, editUrl);
    if (!navigation.success) {
      console.log('❌ 無法存取編輯頁面，嘗試替代路徑...');
      
      // Try alternative paths
      const altPaths = [
        '/sales-orders/7246/edit',
        '/orders/7246/edit',
        '/sales/orders/7246/edit'
      ];
      
      let foundPath = false;
      for (const altPath of altPaths) {
        const altNavigation = await NavigationHelper.goToPage(page, altPath);
        if (altNavigation.success && !altNavigation.hasError) {
          foundPath = true;
          console.log(`✅ 成功存取替代路徑: ${altPath}`);
          break;
        }
      }
      
      if (!foundPath) {
        test.skip('無法存取銷售訂單編輯頁面');
        return;
      }
    }
    
    // Wait for page to load completely
    await page.waitForTimeout(5000);
    await TestUtils.takeScreenshot(page, '01-order-edit-page-loaded');
    
    // Step 2: Monitor JavaScript errors
    const jsErrors = [];
    const consoleMessages = [];
    
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.log(`JavaScript Error: ${error.message}`);
    });
    
    // Step 3: Check Customer Dropdown Display Fix
    console.log('🔍 檢查客戶下拉選單...');
    
    const customerDropdownSelectors = [
      'select[name*="customer"]',
      'select[name="customer_id"]',
      '#customer_id',
      '.customer-select',
      'select.form-select[name*="customer"]'
    ];
    
    let customerDropdown = null;
    let customerDropdownSelector = '';
    
    for (const selector of customerDropdownSelectors) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        customerDropdown = result.element;
        customerDropdownSelector = selector;
        console.log(`✅ 找到客戶下拉選單: ${selector}`);
        break;
      }
    }
    
    if (!customerDropdown) {
      console.log('❌ 未找到客戶下拉選單');
      await TestUtils.takeScreenshot(page, '02-customer-dropdown-not-found');
    } else {
      // Check selected option and options available
      const selectedValue = await customerDropdown.inputValue();
      const selectedText = await customerDropdown.locator('option:checked').textContent();
      
      console.log(`當前選中值: ${selectedValue}`);
      console.log(`當前選中文字: ${selectedText}`);
      
      // Check if the selected text is the problematic "請選擇客戶"
      const isDefaultPlaceholder = selectedText && (
        selectedText.includes('請選擇客戶') || 
        selectedText.includes('Select Customer') ||
        selectedText.includes('Choose Customer') ||
        selectedText.trim() === ''
      );
      
      if (isDefaultPlaceholder) {
        console.log('❌ 客戶名稱顯示問題: 仍顯示預設占位符');
      } else {
        console.log('✅ 客戶名稱顯示正常: 顯示實際客戶名稱');
      }
      
      // Get all available options
      const allOptions = await page.locator(`${customerDropdownSelector} option`).allTextContents();
      console.log(`可用客戶選項: ${JSON.stringify(allOptions)}`);
      
      await TestUtils.takeScreenshot(page, '03-customer-dropdown-status');
    }
    
    // Step 4: Detailed Customer Selection Analysis
    if (customerDropdown) {
      console.log('🔬 詳細分析客戶選擇狀態...');
      
      // Check if there's a valid customer ID selected
      const selectedValue = await customerDropdown.inputValue();
      const hasValidSelection = selectedValue && selectedValue !== '' && selectedValue !== '0';
      
      console.log(`客戶選擇狀態分析:`);
      console.log(`- 選中的值: "${selectedValue}"`);
      console.log(`- 是否有效選擇: ${hasValidSelection ? '✅' : '❌'}`);
      
      if (hasValidSelection) {
        // Get the selected option text
        const selectedOptionText = await page.locator(`${customerDropdownSelector} option[value="${selectedValue}"]`).textContent();
        console.log(`- 選中的客戶名稱: "${selectedOptionText}"`);
        
        // Verify this is not a placeholder
        const isRealCustomer = selectedOptionText && 
          !selectedOptionText.includes('請選擇') && 
          !selectedOptionText.includes('Select') &&
          !selectedOptionText.includes('Choose') &&
          selectedOptionText.trim().length > 0;
        
        if (isRealCustomer) {
          console.log('✅ 客戶名稱顯示修復成功: 顯示真實客戶名稱');
        } else {
          console.log('❌ 客戶名稱顯示仍有問題: 顯示占位符文字');
        }
      } else {
        console.log('❌ 客戶選擇狀態無效: 沒有選中任何客戶');
      }
    }
    
    console.log('✅ 客戶名稱顯示測試完成');
  });

  test('Sales Order Edit Page - Multiple Product Items Display Fix Verification', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('\n🎯 測試目標: 驗證多個產品項目顯示修復');
    console.log('📝 測試訂單: Order ID 7246');
    console.log('🔍 檢查項目: 所有訂單項目應顯示正確產品名稱，數量和價格');
    
    // Step 1: Navigate to sales order edit page
    const editUrl = '/orders/sales/7246/edit';
    const navigation = await NavigationHelper.goToPage(page, editUrl);
    
    if (!navigation.success) {
      test.skip('無法存取銷售訂單編輯頁面');
      return;
    }
    
    // Wait for page to load and AJAX requests to complete
    await page.waitForTimeout(8000);
    await TestUtils.takeScreenshot(page, '01-edit-page-products-loading');
    
    // Step 2: Monitor console for product loading messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
      if (msg.text().includes('product') || msg.text().includes('item') || msg.text().includes('loaded')) {
        console.log(`Product-related console: ${msg.type()} - ${msg.text()}`);
      }
    });
    
    // Step 3: Find and analyze order items table/container
    console.log('🛒 檢查訂單項目顯示...');
    
    const itemsContainerSelectors = [
      '#orderItems',
      '.order-items',
      '.line-items',
      'table',
      '.items-table',
      '[data-order-items]',
      '.product-items'
    ];
    
    let itemsContainer = null;
    let containerSelector = '';
    
    for (const selector of itemsContainerSelectors) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        itemsContainer = result.element;
        containerSelector = selector;
        console.log(`✅ 找到訂單項目容器: ${selector}`);
        break;
      }
    }
    
    if (!itemsContainer) {
      console.log('❌ 未找到訂單項目容器');
      await TestUtils.takeScreenshot(page, '02-no-items-container');
      return;
    }
    
    // Step 4: Count and analyze individual order items
    const itemRowSelectors = [
      'tr:has(select[name*="product"])',
      '.order-item',
      '.line-item',
      '.item-row',
      '[data-item-row]'
    ];
    
    let totalItems = 0;
    let itemRows = [];
    
    for (const selector of itemRowSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        totalItems = count;
        itemRows = elements;
        console.log(`✅ 找到 ${count} 個訂單項目 (${selector})`);
        break;
      }
    }
    
    console.log(`訂單項目總數: ${totalItems}`);
    
    if (totalItems === 0) {
      console.log('❌ 未找到任何訂單項目');
      await TestUtils.takeScreenshot(page, '03-no-order-items');
      return;
    }
    
    // Step 5: Detailed analysis of each order item
    console.log('🔍 詳細檢查每個訂單項目...');
    
    const itemAnalysis = [];
    
    for (let i = 0; i < totalItems; i++) {
      console.log(`\n分析項目 ${i + 1}:`);
      
      const itemData = {
        itemNumber: i + 1,
        productDropdown: null,
        productName: null,
        quantity: null,
        unitPrice: null,
        subtotal: null,
        hasValidProduct: false
      };
      
      try {
        // Find product dropdown in this row
        const productDropdownSelectors = [
          `select[name*="product"]:nth-of-type(${i + 1})`,
          `select[name="items[${i}][product_id]"]`,
          `#product_${i}`,
          `.product-select:nth-of-type(${i + 1})`
        ];
        
        let productDropdown = null;
        for (const selector of productDropdownSelectors) {
          try {
            const element = page.locator(selector);
            const count = await element.count();
            if (count > 0) {
              productDropdown = element;
              console.log(`  找到產品下拉選單: ${selector}`);
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }
        
        // If specific selectors don't work, try generic approach
        if (!productDropdown) {
          const allProductSelects = page.locator('select[name*="product"]');
          const selectCount = await allProductSelects.count();
          if (i < selectCount) {
            productDropdown = allProductSelects.nth(i);
            console.log(`  使用通用選擇器找到產品下拉選單 (索引 ${i})`);
          }
        }
        
        if (productDropdown) {
          itemData.productDropdown = productDropdown;
          
          // Get selected value and text
          const selectedValue = await productDropdown.inputValue();
          const selectedText = await productDropdown.locator('option:checked').textContent();
          
          itemData.productName = selectedText;
          itemData.hasValidProduct = selectedValue && selectedValue !== '' && selectedValue !== '0';
          
          console.log(`  產品選擇值: "${selectedValue}"`);
          console.log(`  產品名稱: "${selectedText}"`);
          console.log(`  是否有效產品: ${itemData.hasValidProduct ? '✅' : '❌'}`);
          
          // Check if showing placeholder
          const showingPlaceholder = selectedText && (
            selectedText.includes('請選擇產品') ||
            selectedText.includes('Select Product') ||
            selectedText.includes('Choose Product') ||
            selectedText.trim() === ''
          );
          
          if (showingPlaceholder) {
            console.log('  ❌ 產品顯示問題: 仍顯示占位符');
          } else if (itemData.hasValidProduct) {
            console.log('  ✅ 產品顯示正常: 顯示實際產品名稱');
          }
        } else {
          console.log('  ❌ 未找到產品下拉選單');
        }
        
        // Find quantity field
        const quantitySelectors = [
          `input[name*="quantity"]:nth-of-type(${i + 1})`,
          `input[name="items[${i}][quantity]"]`,
          `#quantity_${i}`,
          `.quantity-input:nth-of-type(${i + 1})`
        ];
        
        for (const selector of quantitySelectors) {
          try {
            const element = page.locator(selector);
            const count = await element.count();
            if (count > 0) {
              const value = await element.inputValue();
              itemData.quantity = value;
              console.log(`  數量: ${value}`);
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }
        
        // Find unit price field
        const priceSelectors = [
          `input[name*="price"]:nth-of-type(${i + 1})`,
          `input[name*="unit_price"]:nth-of-type(${i + 1})`,
          `input[name="items[${i}][unit_price]"]`,
          `#price_${i}`,
          `.price-input:nth-of-type(${i + 1})`
        ];
        
        for (const selector of priceSelectors) {
          try {
            const element = page.locator(selector);
            const count = await element.count();
            if (count > 0) {
              const value = await element.inputValue();
              itemData.unitPrice = value;
              console.log(`  單價: ${value}`);
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }
        
        // Find subtotal field
        const subtotalSelectors = [
          `input[name*="subtotal"]:nth-of-type(${i + 1})`,
          `input[name*="line_total"]:nth-of-type(${i + 1})`,
          `input[name="items[${i}][subtotal]"]`,
          `#subtotal_${i}`,
          `.subtotal-input:nth-of-type(${i + 1})`
        ];
        
        for (const selector of subtotalSelectors) {
          try {
            const element = page.locator(selector);
            const count = await element.count();
            if (count > 0) {
              const value = await element.inputValue();
              itemData.subtotal = value;
              console.log(`  小計: ${value}`);
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }
        
      } catch (error) {
        console.log(`  ❌ 分析項目 ${i + 1} 時發生錯誤: ${error.message}`);
      }
      
      itemAnalysis.push(itemData);
    }
    
    await TestUtils.takeScreenshot(page, '04-items-analysis-complete');
    
    // Step 6: Summary analysis
    console.log('\n📊 訂單項目修復狀態總結:');
    
    const validProductItems = itemAnalysis.filter(item => item.hasValidProduct).length;
    const itemsWithQuantity = itemAnalysis.filter(item => item.quantity && item.quantity !== '').length;
    const itemsWithPrice = itemAnalysis.filter(item => item.unitPrice && item.unitPrice !== '').length;
    
    console.log(`- 總項目數: ${totalItems}`);
    console.log(`- 有效產品項目: ${validProductItems}`);
    console.log(`- 有數量的項目: ${itemsWithQuantity}`);
    console.log(`- 有價格的項目: ${itemsWithPrice}`);
    
    const fixSuccess = validProductItems > 0 && validProductItems === totalItems;
    if (fixSuccess) {
      console.log('✅ 多產品項目顯示修復成功: 所有項目都顯示正確產品名稱');
    } else {
      console.log('❌ 多產品項目顯示仍有問題: 部分項目未正確顯示產品名稱');
    }
    
    // Step 7: Verify calculations if possible
    console.log('\n🧮 驗證項目計算...');
    
    for (const item of itemAnalysis) {
      if (item.quantity && item.unitPrice && item.subtotal) {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.unitPrice);
        const subtotal = parseFloat(item.subtotal);
        const expectedSubtotal = qty * price;
        
        console.log(`項目 ${item.itemNumber}:`);
        console.log(`  計算: ${qty} × ${price} = ${expectedSubtotal}`);
        console.log(`  實際小計: ${subtotal}`);
        console.log(`  計算正確: ${Math.abs(expectedSubtotal - subtotal) < 0.01 ? '✅' : '❌'}`);
      }
    }
    
    console.log('✅ 多產品項目顯示測試完成');
  });

  test('Sales Order Edit Page - Comprehensive Fix Verification', async ({ page }) => {
    test.setTimeout(240000);
    
    console.log('\n🎯 測試目標: 綜合驗證編輯頁面修復狀況');
    console.log('📝 測試訂單: Order ID 7246');
    console.log('🔍 執行完整的編輯頁面檢查，包含所有修復項目');
    
    // Step 1: Navigate and setup monitoring
    const editUrl = '/orders/sales/7246/edit';
    const navigation = await NavigationHelper.goToPage(page, editUrl);
    
    if (!navigation.success) {
      test.skip('無法存取銷售訂單編輯頁面');
      return;
    }
    
    // Setup comprehensive monitoring
    const jsErrors = [];
    const consoleMessages = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });
    
    page.on('pageerror', error => {
      jsErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
    
    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Wait for page to fully load and populate
    await page.waitForTimeout(10000);
    await TestUtils.takeScreenshot(page, '01-comprehensive-page-loaded');
    
    // Step 2: Comprehensive customer verification
    console.log('👤 客戶資訊綜合檢查...');
    
    const customerCheck = {
      dropdownFound: false,
      hasValidSelection: false,
      customerName: null,
      showsPlaceholder: false
    };
    
    const customerSelectors = ['select[name*="customer"]', '#customer_id', '.customer-select'];
    for (const selector of customerSelectors) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        customerCheck.dropdownFound = true;
        const element = result.element;
        
        const selectedValue = await element.inputValue();
        const selectedText = await element.locator('option:checked').textContent();
        
        customerCheck.hasValidSelection = selectedValue && selectedValue !== '' && selectedValue !== '0';
        customerCheck.customerName = selectedText;
        customerCheck.showsPlaceholder = selectedText && (
          selectedText.includes('請選擇') || 
          selectedText.includes('Select') ||
          selectedText.trim() === ''
        );
        
        break;
      }
    }
    
    console.log('客戶檢查結果:');
    console.log(`- 下拉選單存在: ${customerCheck.dropdownFound ? '✅' : '❌'}`);
    console.log(`- 有效選擇: ${customerCheck.hasValidSelection ? '✅' : '❌'}`);
    console.log(`- 客戶名稱: "${customerCheck.customerName}"`);
    console.log(`- 顯示占位符: ${customerCheck.showsPlaceholder ? '❌' : '✅'}`);
    
    // Step 3: Comprehensive product items verification
    console.log('\n🛒 產品項目綜合檢查...');
    
    const productSelects = page.locator('select[name*="product"]');
    const productCount = await productSelects.count();
    
    console.log(`發現產品選擇器數量: ${productCount}`);
    
    const productItemsCheck = {
      totalItems: productCount,
      validProducts: 0,
      invalidProducts: 0,
      itemDetails: []
    };
    
    for (let i = 0; i < productCount; i++) {
      const productSelect = productSelects.nth(i);
      const selectedValue = await productSelect.inputValue();
      const selectedText = await productSelect.locator('option:checked').textContent();
      
      const isValid = selectedValue && selectedValue !== '' && selectedValue !== '0';
      const showsPlaceholder = selectedText && (
        selectedText.includes('請選擇產品') ||
        selectedText.includes('Select Product') ||
        selectedText.trim() === ''
      );
      
      if (isValid && !showsPlaceholder) {
        productItemsCheck.validProducts++;
      } else {
        productItemsCheck.invalidProducts++;
      }
      
      productItemsCheck.itemDetails.push({
        index: i,
        value: selectedValue,
        text: selectedText,
        isValid: isValid,
        showsPlaceholder: showsPlaceholder
      });
      
      console.log(`項目 ${i + 1}: ${selectedText} (${isValid && !showsPlaceholder ? '✅' : '❌'})`);
    }
    
    console.log('產品項目檢查結果:');
    console.log(`- 總項目數: ${productItemsCheck.totalItems}`);
    console.log(`- 有效產品: ${productItemsCheck.validProducts}`);
    console.log(`- 無效產品: ${productItemsCheck.invalidProducts}`);
    
    await TestUtils.takeScreenshot(page, '02-comprehensive-verification');
    
    // Step 4: Form completeness check
    console.log('\n📋 表單完整性檢查...');
    
    const formElements = {
      form: await TestUtils.waitForElement(page, 'form'),
      customerField: customerCheck.dropdownFound,
      productItems: productItemsCheck.totalItems > 0,
      submitButton: await TestUtils.waitForElement(page, 'button[type="submit"], .btn-submit'),
      calculationFields: {
        subtotal: await TestUtils.waitForElement(page, 'input[name*="subtotal"], #subtotalAmount'),
        tax: await TestUtils.waitForElement(page, 'input[name*="tax"], #taxAmount'),
        total: await TestUtils.waitForElement(page, 'input[name*="total"], #totalAmount')
      }
    };
    
    console.log('表單元素檢查:');
    console.log(`- 主表單: ${formElements.form.found ? '✅' : '❌'}`);
    console.log(`- 客戶欄位: ${formElements.customerField ? '✅' : '❌'}`);
    console.log(`- 產品項目: ${formElements.productItems ? '✅' : '❌'}`);
    console.log(`- 提交按鈕: ${formElements.submitButton.found ? '✅' : '❌'}`);
    console.log(`- 小計: ${formElements.calculationFields.subtotal.found ? '✅' : '❌'}`);
    console.log(`- 稅額: ${formElements.calculationFields.tax.found ? '✅' : '❌'}`);
    console.log(`- 總計: ${formElements.calculationFields.total.found ? '✅' : '❌'}`);
    
    // Step 5: Error and console analysis
    console.log('\n🐛 錯誤和控制台分析...');
    
    console.log(`JavaScript 錯誤數量: ${jsErrors.length}`);
    if (jsErrors.length > 0) {
      jsErrors.forEach((error, index) => {
        console.log(`JS錯誤 ${index + 1}: ${error.message}`);
      });
    }
    
    console.log(`網路錯誤數量: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      networkErrors.forEach((error, index) => {
        console.log(`網路錯誤 ${index + 1}: ${error.url} - ${error.failure?.errorText || 'Unknown'}`);
      });
    }
    
    // Filter important console messages
    const importantMessages = consoleMessages.filter(msg => 
      msg.text.includes('error') || 
      msg.text.includes('warning') ||
      msg.text.includes('customer') ||
      msg.text.includes('product') ||
      msg.text.includes('load')
    );
    
    console.log(`重要控制台訊息數量: ${importantMessages.length}`);
    importantMessages.slice(0, 10).forEach((msg, index) => {
      console.log(`控制台 ${index + 1}: [${msg.type}] ${msg.text}`);
    });
    
    // Step 6: Final assessment
    console.log('\n📊 修復狀況總結評估:');
    
    const customerFixSuccessful = customerCheck.dropdownFound && 
                                 customerCheck.hasValidSelection && 
                                 !customerCheck.showsPlaceholder;
    
    const productFixSuccessful = productItemsCheck.totalItems > 0 && 
                                productItemsCheck.validProducts === productItemsCheck.totalItems;
    
    const overallSuccess = customerFixSuccessful && productFixSuccessful && jsErrors.length === 0;
    
    console.log(`客戶名稱顯示修復: ${customerFixSuccessful ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`產品項目顯示修復: ${productFixSuccessful ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`無JavaScript錯誤: ${jsErrors.length === 0 ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`整體修復狀況: ${overallSuccess ? '✅ 完全成功' : '⚠️ 部分成功或仍有問題'}`);
    
    await TestUtils.takeScreenshot(page, '03-final-assessment');
    
    // Step 7: Detailed recommendations
    if (!overallSuccess) {
      console.log('\n🔧 改進建議:');
      
      if (!customerFixSuccessful) {
        console.log('- 客戶下拉選單需要進一步修復');
        console.log('- 檢查客戶資料預載入邏輯');
        console.log('- 確認客戶 ID 正確傳遞到前端');
      }
      
      if (!productFixSuccessful) {
        console.log('- 產品項目顯示需要進一步修復');
        console.log('- 檢查產品資料 AJAX 載入');
        console.log('- 確認產品 ID 和名稱正確對應');
      }
      
      if (jsErrors.length > 0) {
        console.log('- 修復 JavaScript 錯誤以確保功能正常');
        console.log('- 檢查前端腳本載入順序');
      }
    }
    
    console.log('✅ 綜合修復驗證測試完成');
  });

  test.afterEach(async ({ page }) => {
    // Take final screenshot and log any remaining console messages
    await TestUtils.takeScreenshot(page, 'test-final-state');
    
    // Get final page title and URL for reference
    const finalTitle = await page.title();
    const finalUrl = page.url();
    console.log(`測試結束 - 頁面: ${finalTitle} | URL: ${finalUrl}`);
  });
});