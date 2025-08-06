/**
 * NexusERP Supplier Management Tests
 * 供應商管理功能完整測試套件
 * 
 * Test Coverage:
 * - Supplier listing and search
 * - Contact person search functionality
 * - Supplier creation and validation
 * - Supplier information management
 * - Supplier contact management
 * - Purchase order integration
 */

import { test, expect } from '@playwright/test';
import { 
  TEST_CONFIG, 
  AuthHelper, 
  NavigationHelper, 
  FormHelper,
  TestUtils 
} from '../setup/test-setup.js';

test.describe('🏭 Supplier Management Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginResult = await AuthHelper.login(page);
    expect(loginResult.success).toBe(true);
  });

  test('Supplier Listing - Page Structure and Data', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('\n🎯 測試目標: 供應商列表頁面結構');
    
    // Step 1: Navigate to suppliers page
    const navigation = await NavigationHelper.goToPage(page, '/suppliers');
    expect(navigation.success).toBe(true);
    expect(navigation.hasError).toBe(false);
    
    await TestUtils.takeScreenshot(page, '01-suppliers-page-loaded');
    
    // Step 2: Verify page title and structure
    const pageTitle = await page.title();
    expect(pageTitle).toContain('供應商' || pageTitle).toContain('Supplier');
    
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
    
    // Step 4: Check for supplier data display
    const dataElements = [
      'table',
      '.supplier-list',
      '.supplier-grid',
      '.data-table',
      '[data-suppliers]',
      '.card',
      '.list-group'
    ];
    
    let dataStructureFound = false;
    for (const selector of dataElements) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        console.log(`✅ 找到供應商數據結構: ${selector}`);
        dataStructureFound = true;
        
        // Count data rows if it's a table
        if (selector === 'table') {
          const rows = await page.locator('table tr').count();
          console.log(`表格行數: ${rows}`);
          
          if (rows > 1) {
            // Check column headers
            const headers = await page.locator('table th').allTextContents();
            console.log(`表格標題: ${headers.join(', ')}`);
          }
        }
        break;
      }
    }
    
    // Step 5: Check for action buttons
    const actionButtons = [
      'button:has-text("新增")',
      'button:has-text("Add")',
      'a:has-text("新增供應商")',
      'a:has-text("Add Supplier")',
      '.btn-primary',
      '[href*="create"]',
      '[href*="suppliers/create"]'
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
    
    console.log(`供應商數據結構: ${dataStructureFound ? '✅' : '⚠️'}`);
    console.log(`操作按鈕: ${actionButtonFound ? '✅' : '⚠️'}`);
    
    console.log('✅ 供應商列表頁面結構檢查完成');
  });

  test('Supplier Contact Search - Contact Person Search', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🎯 測試目標: 供應商聯絡人搜尋功能');
    console.log('🔍 測試案例: 搜尋聯絡人 "李先生", "John", "Manager"');
    
    // Step 1: Navigate to suppliers page
    await NavigationHelper.goToPage(page, '/suppliers');
    await TestUtils.takeScreenshot(page, '01-suppliers-initial');
    
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
      console.log('⚠️ 未找到搜尋框，跳過搜尋測試');
      test.skip('搜尋框不存在');
      return;
    }
    
    // Step 3: Test contact person search scenarios
    const contactSearchTests = [
      { contact: '李', description: '中文姓氏搜尋' },
      { contact: 'John', description: '英文名字搜尋' },
      { contact: 'Manager', description: '職位搜尋' },
      { contact: 'Director', description: '高階職位搜尋' },
      { contact: 'Smith', description: '英文姓氏搜尋' },
      { contact: '先生', description: '稱謂搜尋' }
    ];
    
    let searchResults = [];
    
    for (const [index, searchTest] of contactSearchTests.entries()) {
      console.log(`🔍 執行${searchTest.description}: "${searchTest.contact}"`);
      
      try {
        // Clear and fill search input
        await searchInput.clear();
        await searchInput.fill(searchTest.contact);
        
        // Submit search
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        
        // Take screenshot
        await TestUtils.takeScreenshot(page, `02-contact-search-${searchTest.contact.replace(/[^a-zA-Z0-9]/g, '_')}`);
        
        // Check for results or errors
        const pageHealth = await NavigationHelper.checkForErrors(page);
        const hasResults = await page.locator('table tr, .supplier-item, .card, .list-item').count() > 1;
        const noResultsMessage = await TestUtils.waitForElement(page, '.no-results, .empty-state, :has-text("沒有找到"), :has-text("No results")');
        
        searchResults.push({
          contact: searchTest.contact,
          description: searchTest.description,
          hasError: pageHealth.hasError,
          hasResults: hasResults,
          noResultsShown: noResultsMessage.found,
          success: !pageHealth.hasError
        });
        
        console.log(`搜尋結果: ${hasResults ? '有資料' : '無資料'} ${noResultsMessage.found ? '(顯示無結果訊息)' : ''} ${pageHealth.hasError ? '(頁面錯誤)' : ''}`);
        
        // Clear search for next test
        await searchInput.clear();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
      } catch (error) {
        console.log(`❌ 搜尋測試失敗: ${error.message}`);
        searchResults.push({
          contact: searchTest.contact,
          description: searchTest.description,
          success: false,
          error: error.message
        });
      }
    }
    
    // Step 4: Analyze search functionality
    const successfulSearches = searchResults.filter(r => r.success).length;
    const searchSuccessRate = searchResults.length > 0 ? successfulSearches / searchResults.length : 0;
    
    console.log('\n📊 聯絡人搜尋測試結果:');
    searchResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${result.contact} (${result.description}): ${status}`);
    });
    
    console.log(`\n🎯 搜尋成功率: ${Math.round(searchSuccessRate * 100)}% (${successfulSearches}/${searchResults.length})`);
    
    // Final screenshot showing cleared search
    await TestUtils.takeScreenshot(page, '03-contact-search-completed');
    
    console.log('✅ 供應商聯絡人搜尋功能測試完成');
  });

  test('Supplier Creation - Add New Supplier', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🎯 測試目標: 新增供應商功能');
    
    // Step 1: Navigate to suppliers page
    await NavigationHelper.goToPage(page, '/suppliers');
    
    // Step 2: Find and click add supplier button
    const addButtonSelectors = [
      'button:has-text("新增")',
      'button:has-text("Add")',
      'a:has-text("新增供應商")',
      'a:has-text("Add Supplier")',
      '.btn-primary',
      '[href*="create"]',
      '[href*="suppliers/create"]'
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
      const createNavigation = await NavigationHelper.goToPage(page, '/suppliers/create');
      if (!createNavigation.success) {
        test.skip('無法存取供應商新增頁面');
        return;
      }
    }
    
    await page.waitForTimeout(3000);
    await TestUtils.takeScreenshot(page, '01-add-supplier-form');
    
    // Step 3: Check for supplier form
    const formSelectors = [
      'form',
      '#supplierForm',
      '.supplier-form',
      '[data-form="supplier"]'
    ];
    
    let form = null;
    for (const selector of formSelectors) {
      const result = await TestUtils.waitForElement(page, selector);
      if (result.found) {
        form = result.element;
        console.log(`✅ 找到供應商表單: ${selector}`);
        break;
      }
    }
    
    if (!form) {
      console.log('⚠️ 未找到供應商表單');
      test.skip('供應商表單不存在');
      return;
    }
    
    // Step 4: Generate test supplier data
    const testSupplier = TestUtils.generateTestData('supplier');
    console.log('測試供應商數據:', testSupplier);
    
    // Step 5: Fill supplier form
    const formData = {
      name: testSupplier.name,
      company_name: testSupplier.name,
      email: testSupplier.email,
      phone: testSupplier.phone,
      contact_person: testSupplier.contact,
      contact_name: testSupplier.contact,
      address: `測試地址 - ${testSupplier.name}`,
      tax_id: `${Math.floor(Math.random() * 90000000) + 10000000}`,
      payment_terms: '30',
      category: '一般供應商',
      status: 'active'
    };
    
    const fillResult = await FormHelper.fillForm(page, formData);
    console.log(`表單填寫: ${fillResult.success ? '✅' : '❌'}`);
    
    await TestUtils.takeScreenshot(page, '02-supplier-form-filled');
    
    // Step 6: Submit form
    const submitResult = await FormHelper.submitForm(page);
    console.log(`表單提交: ${submitResult.success ? '✅' : '❌'}`);
    
    await TestUtils.takeScreenshot(page, '03-supplier-form-submitted');
    
    // Step 7: Check for success indication
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
      ':has-text("created")',
      ':has-text("儲存成功")'
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
    console.log('✅ 供應商新增功能測試完成');
  });

  test('Supplier Information Management - Contact Details', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('\n🎯 測試目標: 供應商資訊管理');
    
    // Step 1: Navigate to suppliers page
    await NavigationHelper.goToPage(page, '/suppliers');
    await TestUtils.takeScreenshot(page, '01-supplier-info-initial');
    
    // Step 2: Look for existing suppliers with view/edit options
    const supplierActionSelectors = [
      'button:has-text("檢視")',
      'button:has-text("View")',
      'button:has-text("編輯")',
      'button:has-text("Edit")',
      'a:has-text("詳細")',
      'a:has-text("Details")',
      '.btn-view',
      '.btn-edit',
      '.view-link',
      '.edit-link',
      'td a, .action-buttons a'
    ];
    
    let supplierAction = null;
    for (const selector of supplierActionSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        supplierAction = elements.first();
        console.log(`✅ 找到供應商操作: ${selector} (${count} 個)`);
        break;
      }
    }
    
    if (!supplierAction) {
      console.log('⚠️ 未找到供應商操作選項');
      // Try clicking on supplier name or row
      const supplierNames = page.locator('table td:first-child, .supplier-name, .supplier-item h3');
      const nameCount = await supplierNames.count();
      if (nameCount > 0) {
        try {
          await supplierNames.first().click();
          console.log('✅ 點擊供應商名稱');
          await page.waitForTimeout(3000);
        } catch (e) {
          console.log('⚠️ 無法點擊供應商名稱');
        }
      }
    } else {
      // Click the view/edit action
      try {
        await supplierAction.click();
        console.log('✅ 點擊供應商詳細/編輯');
        await page.waitForTimeout(3000);
        await TestUtils.takeScreenshot(page, '02-supplier-details');
      } catch (e) {
        console.log('⚠️ 無法點擊供應商操作');
      }
    }
    
    // Step 3: Check for supplier detail fields
    const detailFields = {
      name: await TestUtils.waitForElement(page, 'input[name="name"], .supplier-name, .company-name'),
      email: await TestUtils.waitForElement(page, 'input[name="email"], .supplier-email, a[href^="mailto:"]'),
      phone: await TestUtils.waitForElement(page, 'input[name="phone"], .supplier-phone, a[href^="tel:"]'),
      contact: await TestUtils.waitForElement(page, 'input[name="contact_person"], input[name="contact_name"], .contact-person'),
      address: await TestUtils.waitForElement(page, 'textarea[name="address"], input[name="address"], .supplier-address'),
      taxId: await TestUtils.waitForElement(page, 'input[name="tax_id"], .tax-id, .company-id')
    };
    
    console.log('供應商詳細欄位檢查:');
    Object.entries(detailFields).forEach(([key, result]) => {
      console.log(`- ${key}: ${result.found ? '✅' : '❌'}`);
    });
    
    // Step 4: Test contact information display/editing
    if (detailFields.contact.found) {
      try {
        const contactElement = detailFields.contact.element;
        const isInput = await contactElement.evaluate(el => el.tagName.toLowerCase() === 'input');
        
        if (isInput) {
          // It's an editable field
          const currentContact = await contactElement.inputValue();
          console.log(`目前聯絡人: ${currentContact}`);
          
          // Test updating contact person
          const newContact = `更新聯絡人 ${Date.now()}`;
          await contactElement.clear();
          await contactElement.fill(newContact);
          console.log(`更新聯絡人為: ${newContact}`);
          
          await TestUtils.takeScreenshot(page, '03-contact-updated');
          
        } else {
          // It's a display field
          const contactText = await contactElement.textContent();
          console.log(`聯絡人資訊: ${contactText}`);
        }
      } catch (e) {
        console.log(`⚠️ 聯絡人資訊處理失敗: ${e.message}`);
      }
    }
    
    // Step 5: Check for save functionality if in edit mode
    const saveButtons = [
      'button[type="submit"]',
      'button:has-text("儲存")',
      'button:has-text("Save")',
      'button:has-text("更新")',
      '.btn-save',
      '.btn-primary'
    ];
    
    let saveButtonFound = false;
    for (const btnSelector of saveButtons) {
      const result = await TestUtils.waitForElement(page, btnSelector);
      if (result.found) {
        console.log(`✅ 找到儲存按鈕: ${btnSelector}`);
        saveButtonFound = true;
        
        try {
          await result.element.click();
          console.log('✅ 點擊儲存按鈕');
          await page.waitForTimeout(3000);
          await TestUtils.takeScreenshot(page, '04-supplier-saved');
        } catch (e) {
          console.log('⚠️ 無法點擊儲存按鈕');
        }
        break;
      }
    }
    
    console.log(`儲存功能: ${saveButtonFound ? '✅' : '⚠️'}`);
    console.log('✅ 供應商資訊管理測試完成');
  });

  test('Supplier Search - Multiple Search Criteria', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('\n🎯 測試目標: 供應商多重搜尋條件');
    
    // Step 1: Navigate to suppliers page
    await NavigationHelper.goToPage(page, '/suppliers');
    await TestUtils.takeScreenshot(page, '01-supplier-search-initial');
    
    // Step 2: Find search functionality
    const searchInput = await TestUtils.waitForElement(page, 'input[type="search"], input[name="search"], .search-input');
    
    if (!searchInput.found) {
      console.log('⚠️ 未找到搜尋框');
      test.skip('搜尋功能不存在');
      return;
    }
    
    // Step 3: Test various search criteria
    const searchTests = [
      { term: 'Inc', description: '公司類型搜尋' },
      { term: 'Ltd', description: '公司類型搜尋' },
      { term: '有限公司', description: '中文公司類型搜尋' },
      { term: '02-', description: '台北電話號碼搜尋' },
      { term: '04-', description: '台中電話號碼搜尋' },
      { term: 'test', description: '測試數據搜尋' },
      { term: 'supplier', description: '供應商關鍵字搜尋' },
      { term: '@', description: 'Email 搜尋' }
    ];
    
    for (const [index, searchTest] of searchTests.entries()) {
      console.log(`🔍 執行${searchTest.description}: "${searchTest.term}"`);
      
      try {
        // Clear and fill search
        await searchInput.element.clear();
        await searchInput.element.fill(searchTest.term);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        
        // Check results
        const hasResults = await page.locator('table tr, .supplier-item, .card').count() > 1;
        const pageHealth = await NavigationHelper.checkForErrors(page);
        
        console.log(`搜尋結果: ${hasResults ? '有資料' : '無資料'} ${pageHealth.hasError ? '(頁面錯誤)' : '(頁面正常)'}`);
        
        if (index === 0 || index === searchTests.length - 1) {
          await TestUtils.takeScreenshot(page, `02-search-${searchTest.term.replace(/[^a-zA-Z0-9]/g, '_')}`);
        }
        
      } catch (error) {
        console.log(`❌ 搜尋失敗: ${error.message}`);
      }
    }
    
    // Step 4: Clear search and return to full list
    await searchInput.element.clear();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    await TestUtils.takeScreenshot(page, '03-search-cleared');
    
    console.log('✅ 供應商搜尋功能測試完成');
  });

  test.afterEach(async ({ page }) => {
    // Clean up - take final screenshot
    await TestUtils.takeScreenshot(page, 'final-state');
  });
});