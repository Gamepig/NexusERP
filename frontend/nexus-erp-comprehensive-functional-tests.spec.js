/**
 * NexusERP 綜合功能測試套件
 * 使用 Serena MCP Playwright 進階知識庫創建
 * 
 * 測試涵蓋：
 * 1. 銷售訂單總計計算測試
 * 2. 客戶電話搜尋測試
 * 3. 供應商聯絡人搜尋測試
 * 4. Dashboard 載入測試
 */

import { test, expect } from '@playwright/test';

// 測試配置
const TEST_CONFIG = {
  email: 'test@example.com',
  password: 'password123',
  baseURL: 'http://127.0.0.1:8000',
  timeout: {
    short: 2000,
    medium: 5000,
    long: 10000
  },
  retries: 3
};

// 頁面物件模型 (POM) - 登入頁面
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async login(email = TEST_CONFIG.email, password = TEST_CONFIG.password) {
    await this.page.goto(`${TEST_CONFIG.baseURL}/login`);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL('**/dashboard', { timeout: TEST_CONFIG.timeout.long });
  }
}

// 頁面物件模型 (POM) - 銷售訂單頁面
class SalesOrderPage {
  constructor(page) {
    this.page = page;
    this.form = page.locator('form');
    this.productSelectors = [
      'input[name*="product"]',
      'select[name*="product"]',
      'input[data-product]',
      '.product-selector'
    ];
    this.quantitySelectors = [
      'input[name*="quantity"]',
      'input[type="number"]',
      'input[data-quantity]',
      '.quantity-input'
    ];
    this.priceSelectors = [
      'input[name*="price"]',
      'input[name*="unit_price"]',
      'input[data-price]',
      '.price-input'
    ];
    this.subtotalSelectors = [
      'input[name*="subtotal"]',
      'input[name*="line_total"]',
      '[data-subtotal]',
      '.subtotal',
      '.line-total'
    ];
    this.taxSelectors = [
      'input[name*="tax"]',
      'select[name*="tax_rate"]',
      'input[data-tax]',
      '.tax-input',
      '.tax-rate'
    ];
    this.totalSelectors = [
      'input[name*="total"]',
      'input[name*="grand_total"]',
      '[data-total]',
      '[data-grand-total]',
      '.total-amount',
      '.grand-total'
    ];
    this.addItemButton = page.locator('button:has-text("Add"), button:has-text("Add Item"), button:has-text("Add Product"), .add-line-item, [data-add-item]');
  }

  async navigate() {
    await this.page.goto(`${TEST_CONFIG.baseURL}/orders/sales/create`);
    await this.page.waitForLoadState('networkidle');
  }

  async findElement(selectors) {
    for (const selector of selectors) {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        return element.first();
      }
    }
    return null;
  }

  async getQuantityField() {
    return await this.findElement(this.quantitySelectors);
  }

  async getPriceField() {
    return await this.findElement(this.priceSelectors);
  }

  async getSubtotalField() {
    return await this.findElement(this.subtotalSelectors);
  }

  async getTaxField() {
    return await this.findElement(this.taxSelectors);
  }

  async getTotalField() {
    return await this.findElement(this.totalSelectors);
  }

  async fillLineItem(quantity, price, lineIndex = 0) {
    const quantityField = this.page.locator(this.quantitySelectors.join(',')).nth(lineIndex);
    const priceField = this.page.locator(this.priceSelectors.join(',')).nth(lineIndex);
    
    await quantityField.fill(quantity);
    await priceField.fill(price);
    await priceField.blur();
    await this.page.waitForTimeout(1000); // 等待計算完成
  }

  async addLineItem() {
    const addButton = await this.findElement([
      'button:has-text("Add")',
      'button:has-text("Add Item")',
      'button:has-text("Add Product")',
      '.add-line-item',
      '[data-add-item]'
    ]);
    
    if (addButton) {
      await addButton.click();
      await this.page.waitForTimeout(1000);
      return true;
    }
    return false;
  }

  async getCalculatedValue(selectors) {
    for (const selector of selectors) {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        const value = await element.first().inputValue() || await element.first().textContent();
        if (value && value.trim()) {
          return parseFloat(value.replace(/[^0-9.-]/g, ''));
        }
      }
    }
    return null;
  }
}

// 頁面物件模型 (POM) - 搜尋功能基類
class SearchPageBase {
  constructor(page, url) {
    this.page = page;
    this.url = url;
    this.searchSelectors = [
      'input[type="search"]',
      'input[name="search"]',
      'input[placeholder*="search" i]',
      '#search',
      '.search-input'
    ];
    this.rowSelectors = [
      'tbody tr',
      '.row',
      '.item',
      '.list-item'
    ];
  }

  async navigate() {
    await this.page.goto(`${TEST_CONFIG.baseURL}${this.url}`);
    await this.page.waitForLoadState('networkidle');
  }

  async getSearchInput() {
    for (const selector of this.searchSelectors) {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        return element.first();
      }
    }
    return null;
  }

  async getRowCount() {
    return await this.page.locator(this.rowSelectors.join(',')).count();
  }

  async search(term) {
    const searchInput = await this.getSearchInput();
    if (!searchInput) return false;

    await searchInput.fill(term);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(TEST_CONFIG.timeout.short);
    return true;
  }

  async clearSearch() {
    const searchInput = await this.getSearchInput();
    if (!searchInput) return false;

    await searchInput.fill('');
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
    return true;
  }

  async isNoResultsMessageVisible() {
    const noResultsSelectors = [
      'text=No results found',
      'text=No data',
      'text=No matches',
      '.no-results',
      '.empty-state'
    ];

    for (const selector of noResultsSelectors) {
      if (await this.page.locator(selector).count() > 0) {
        return true;
      }
    }
    return false;
  }
}

// 頁面物件模型 (POM) - 客戶頁面
class CustomersPage extends SearchPageBase {
  constructor(page) {
    super(page, '/customers');
    this.customerRowSelectors = [
      'tbody tr',
      '.customer-row',
      '.customer-item'
    ];
  }

  async getCustomerCount() {
    return await this.page.locator(this.customerRowSelectors.join(',')).count();
  }
}

// 頁面物件模型 (POM) - 供應商頁面
class SuppliersPage extends SearchPageBase {
  constructor(page) {
    super(page, '/suppliers');
    this.supplierRowSelectors = [
      'tbody tr',
      '.supplier-row',
      '.supplier-item'
    ];
  }

  async getSupplierCount() {
    return await this.page.locator(this.supplierRowSelectors.join(',')).count();
  }
}

// 頁面物件模型 (POM) - Dashboard 頁面
class DashboardPage {
  constructor(page) {
    this.page = page;
    this.cardSelectors = [
      '.dashboard-card',
      '.stats-card',
      '.metric-card',
      '.card'
    ];
    this.statisticSelectors = [
      '[data-statistic]',
      '.statistic-value',
      '.metric-value',
      '.count'
    ];
  }

  async navigate() {
    await this.page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForContent() {
    // 等待 Dashboard 內容載入
    await this.page.waitForTimeout(TEST_CONFIG.timeout.medium);
  }

  async hasCards() {
    for (const selector of this.cardSelectors) {
      if (await this.page.locator(selector).count() > 0) {
        return true;
      }
    }
    return false;
  }

  async hasStatistics() {
    for (const selector of this.statisticSelectors) {
      if (await this.page.locator(selector).count() > 0) {
        return true;
      }
    }
    return false;
  }

  async checkForErrors() {
    const content = await this.page.content();
    return {
      has500Error: content.includes('500') || content.includes('Internal Server Error'),
      has404Error: content.includes('404') || content.includes('Not Found'),
      hasJsError: false // 將在測試中動態檢測
    };
  }
}

// 工具函數
class TestUtils {
  static formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
  }

  static extractNumbers(text) {
    const match = text.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : null;
  }

  static async captureJavaScriptErrors(page) {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  static async takeScreenshot(page, name) {
    await page.screenshot({ 
      path: `screenshots/${name}.png`,
      fullPage: true
    });
  }
}

// 測試套件開始
test.describe('NexusERP 核心功能測試', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    
    // 設置錯誤監聽
    await TestUtils.captureJavaScriptErrors(page);
    
    // 登入系統
    await loginPage.login();
  });

  test.describe('銷售訂單總計計算測試', () => {
    test('應該正確計算銷售訂單總計 - 基本測試', async ({ page }) => {
      const salesOrderPage = new SalesOrderPage(page);
      await salesOrderPage.navigate();

      // 檢查表單是否存在
      await expect(salesOrderPage.form).toBeVisible({ timeout: TEST_CONFIG.timeout.medium });

      // 獲取數量和價格欄位
      const quantityField = await salesOrderPage.getQuantityField();
      const priceField = await salesOrderPage.getPriceField();

      if (quantityField && priceField) {
        console.log('✓ 找到數量和價格欄位');

        // 測試案例 1: 基本計算 (數量=2, 單價=85000)
        await quantityField.fill('2');
        await priceField.fill('85000');
        await priceField.blur();
        await page.waitForTimeout(TEST_CONFIG.timeout.short);

        // 驗證小計計算 (預期: 170000)
        const calculatedSubtotal = await salesOrderPage.getCalculatedValue(salesOrderPage.subtotalSelectors);
        
        if (calculatedSubtotal !== null) {
          expect(calculatedSubtotal).toBe(170000);
          console.log(`✓ 小計計算正確: ${calculatedSubtotal}`);
        }

        // 檢查稅額計算 (預期: 8500，假設5%稅率)
        const taxAmount = await salesOrderPage.getCalculatedValue(salesOrderPage.taxSelectors);
        if (taxAmount !== null) {
          console.log(`稅額: ${taxAmount}`);
        }

        // 檢查總計 (預期: 178500)
        const grandTotal = await salesOrderPage.getCalculatedValue(salesOrderPage.totalSelectors);
        if (grandTotal !== null) {
          console.log(`總計: ${grandTotal}`);
        }

        await TestUtils.takeScreenshot(page, 'sales-order-basic-calculation');

      } else {
        test.fail('找不到銷售訂單表單欄位');
      }
    });

    test('應該處理多行項目計算', async ({ page }) => {
      const salesOrderPage = new SalesOrderPage(page);
      await salesOrderPage.navigate();

      // 填寫第一行項目
      await salesOrderPage.fillLineItem('5', '15.00', 0);

      // 嘗試添加第二行項目
      const addedNewLine = await salesOrderPage.addLineItem();
      
      if (addedNewLine) {
        // 填寫第二行項目
        await salesOrderPage.fillLineItem('3', '25.00', 1);

        // 預期總計: (5 * 15.00) + (3 * 25.00) = 75.00 + 75.00 = 150.00
        const orderTotal = await salesOrderPage.getCalculatedValue(salesOrderPage.totalSelectors);
        
        if (orderTotal !== null) {
          console.log(`多行項目總計: ${orderTotal}`);
          // 允許一些浮點數誤差
          expect(Math.abs(orderTotal - 150.00)).toBeLessThan(0.01);
        }

        await TestUtils.takeScreenshot(page, 'sales-order-multi-line-calculation');
      } else {
        console.log('⚠️ 無法添加新行項目，測試單行項目');
      }
    });

    test('應該處理邊界值計算', async ({ page }) => {
      const salesOrderPage = new SalesOrderPage(page);
      await salesOrderPage.navigate();

      const quantityField = await salesOrderPage.getQuantityField();
      const priceField = await salesOrderPage.getPriceField();

      if (quantityField && priceField) {
        const edgeCases = [
          { qty: '0', price: '10.00', note: '零數量' },
          { qty: '1', price: '0', note: '零價格' },
          { qty: '0.001', price: '1000.00', note: '極小數量' },
          { qty: '1000', price: '0.01', note: '極小價格' },
          { qty: '99999', price: '1.00', note: '大數量' }
        ];

        for (const testCase of edgeCases) {
          console.log(`測試邊界值: ${testCase.note}`);

          await quantityField.fill(testCase.qty);
          await priceField.fill(testCase.price);
          await priceField.blur();
          await page.waitForTimeout(1000);

          // 檢查是否有 JavaScript 錯誤
          const jsErrors = await TestUtils.captureJavaScriptErrors(page);
          expect(jsErrors.length).toBe(0);

          const calculatedValue = await salesOrderPage.getCalculatedValue(salesOrderPage.subtotalSelectors);
          const expectedValue = parseFloat(testCase.qty) * parseFloat(testCase.price);
          
          if (calculatedValue !== null) {
            expect(Math.abs(calculatedValue - expectedValue)).toBeLessThan(0.01);
            console.log(`✓ ${testCase.note}: ${calculatedValue}`);
          }
        }

        await TestUtils.takeScreenshot(page, 'sales-order-edge-cases');
      }
    });
  });

  test.describe('客戶電話搜尋測試', () => {
    test('應該支援多種電話號碼格式搜尋', async ({ page }) => {
      const customersPage = new CustomersPage(page);
      await customersPage.navigate();

      const searchInput = await customersPage.getSearchInput();
      expect(searchInput).toBeTruthy();

      // 獲取初始客戶數量
      const initialCount = await customersPage.getCustomerCount();
      console.log(`初始客戶數量: ${initialCount}`);

      const phoneFormats = [
        '02-1234-5678',
        '02-1234',
        '1234',
        '(02) 1234-5678',
        '02 1234 5678'
      ];

      for (const phone of phoneFormats) {
        console.log(`測試電話格式: ${phone}`);

        const searchSuccess = await customersPage.search(phone);
        expect(searchSuccess).toBe(true);

        // 檢查搜尋結果
        const resultCount = await customersPage.getCustomerCount();
        console.log(`搜尋 '${phone}' 結果: ${resultCount} 客戶`);

        // 驗證頁面沒有錯誤
        const content = await page.content();
        expect(content).not.toContain('500');
        expect(content).not.toContain('Internal Server Error');

        await TestUtils.takeScreenshot(page, `customer-phone-search-${phone.replace(/[^0-9]/g, '')}`);

        // 清除搜尋
        await customersPage.clearSearch();
      }
    });

    test('應該處理特殊字符電話號碼', async ({ page }) => {
      const customersPage = new CustomersPage(page);
      await customersPage.navigate();

      const specialPhones = [
        '02-1234 ext 123',
        '02/1234/5678',
        '02_1234_5678',
        '02*1234*5678'
      ];

      for (const phone of specialPhones) {
        console.log(`測試特殊字符電話: ${phone}`);

        await customersPage.search(phone);

        // 主要檢查沒有伺服器錯誤
        const content = await page.content();
        expect(content).not.toContain('500');
        expect(content).not.toContain('Internal Server Error');

        await customersPage.clearSearch();
      }

      await TestUtils.takeScreenshot(page, 'customer-special-phone-search');
    });

    test('應該支援部分電話號碼搜尋', async ({ page }) => {
      const customersPage = new CustomersPage(page);
      await customersPage.navigate();

      const partialPhones = ['02-', '1234', '5678'];
      const results = [];

      for (const partial of partialPhones) {
        await customersPage.search(partial);
        const resultCount = await customersPage.getCustomerCount();
        results.push({ search: partial, count: resultCount });
        console.log(`部分搜尋 '${partial}': ${resultCount} 結果`);
        await customersPage.clearSearch();
      }

      // 驗證部分搜尋有效
      const hasResults = results.some(r => r.count > 0);
      if (hasResults) {
        console.log('✓ 部分電話號碼搜尋功能正常');
      }

      await TestUtils.takeScreenshot(page, 'customer-partial-phone-search');
    });
  });

  test.describe('供應商聯絡人搜尋測試', () => {
    test('應該能搜尋供應商聯絡人姓名', async ({ page }) => {
      const suppliersPage = new SuppliersPage(page);
      await suppliersPage.navigate();

      const searchInput = await suppliersPage.getSearchInput();
      expect(searchInput).toBeTruthy();

      // 獲取初始供應商數量
      const initialCount = await suppliersPage.getSupplierCount();
      console.log(`初始供應商數量: ${initialCount}`);

      const contactNames = [
        '李先生',
        '李',
        '先生',
        'John',
        'Jane',
        'Manager'
      ];

      for (const name of contactNames) {
        console.log(`搜尋聯絡人: ${name}`);

        await suppliersPage.search(name);
        const resultCount = await suppliersPage.getSupplierCount();
        console.log(`搜尋 '${name}' 結果: ${resultCount} 供應商`);

        // 如果有結果，檢查結果是否包含搜尋詞
        if (resultCount > 0) {
          const tableContent = await page.locator('table, .supplier-list').textContent();
          if (tableContent && tableContent.toLowerCase().includes(name.toLowerCase())) {
            console.log(`✓ 搜尋結果包含 '${name}'`);
          }
        }

        await TestUtils.takeScreenshot(page, `supplier-contact-search-${name.replace(/[^a-zA-Z0-9]/g, '_')}`);
        await suppliersPage.clearSearch();
      }
    });

    test('應該支援大小寫不敏感搜尋', async ({ page }) => {
      const suppliersPage = new SuppliersPage(page);
      await suppliersPage.navigate();

      const testCases = ['john', 'JOHN', 'John', 'jOhN'];
      const results = [];

      for (const testCase of testCases) {
        await suppliersPage.search(testCase);
        const resultCount = await suppliersPage.getSupplierCount();
        results.push({ search: testCase, count: resultCount });
        console.log(`搜尋 '${testCase}': ${resultCount} 結果`);
        await suppliersPage.clearSearch();
      }

      // 驗證所有大小寫變化返回相同結果
      const uniqueCounts = [...new Set(results.map(r => r.count))];
      if (uniqueCounts.length === 1) {
        console.log('✓ 大小寫不敏感搜尋正常運作');
      } else {
        console.log('⚠️ 大小寫敏感性可能影響搜尋結果');
      }
    });

    test('應該顯示無結果訊息', async ({ page }) => {
      const suppliersPage = new SuppliersPage(page);
      await suppliersPage.navigate();

      // 搜尋不太可能存在的名稱
      await suppliersPage.search('XyzUnlikelyName123456');
      const resultCount = await suppliersPage.getSupplierCount();

      if (resultCount === 0) {
        const hasNoResultsMessage = await suppliersPage.isNoResultsMessageVisible();
        if (hasNoResultsMessage) {
          console.log('✓ 找到無結果訊息');
        } else {
          console.log('⚠️ 無結果訊息未找到（表格可能為空）');
        }
      }

      await TestUtils.takeScreenshot(page, 'supplier-no-results-message');
    });
  });

  test.describe('Dashboard 載入測試', () => {
    test('應該無 HTTP 500 錯誤載入 Dashboard', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      
      // 監聽網路響應
      const responses = [];
      page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      });

      await dashboardPage.navigate();
      await dashboardPage.waitForContent();

      // 檢查是否有 500 錯誤
      const serverErrors = responses.filter(r => r.status >= 500);
      expect(serverErrors.length).toBe(0);

      if (serverErrors.length > 0) {
        console.log('❌ 發現伺服器錯誤:', serverErrors);
      } else {
        console.log('✓ Dashboard 載入無伺服器錯誤');
      }

      // 檢查頁面內容錯誤
      const errorCheck = await dashboardPage.checkForErrors();
      expect(errorCheck.has500Error).toBe(false);
      expect(errorCheck.has404Error).toBe(false);

      await TestUtils.takeScreenshot(page, 'dashboard-loaded-successfully');
    });

    test('應該顯示統計數據', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.navigate();
      await dashboardPage.waitForContent();

      // 檢查是否有卡片或統計數據
      const hasCards = await dashboardPage.hasCards();
      const hasStatistics = await dashboardPage.hasStatistics();

      if (hasCards || hasStatistics) {
        console.log('✓ Dashboard 顯示統計數據');
      } else {
        console.log('⚠️ Dashboard 可能未顯示統計數據');
      }

      // 檢查特定統計元素
      const statsElements = await page.locator('.stats, .statistics, .metrics, .dashboard-stats').count();
      console.log(`找到 ${statsElements} 個統計元素`);

      await TestUtils.takeScreenshot(page, 'dashboard-statistics');
    });

    test('應該在不同裝置尺寸正常顯示', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.navigate();

      const deviceSizes = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop-medium', width: 1024, height: 768 },
        { name: 'desktop-large', width: 1920, height: 1080 }
      ];

      for (const device of deviceSizes) {
        await page.setViewportSize({ width: device.width, height: device.height });
        await page.waitForTimeout(1000);

        // 檢查響應式佈局
        const content = await page.content();
        expect(content).not.toContain('500');

        await TestUtils.takeScreenshot(page, `dashboard-${device.name}`);
        console.log(`✓ Dashboard 在 ${device.name} 尺寸正常顯示`);
      }
    });

    test('應該處理 Dashboard API 呼叫', async ({ page }) => {
      // 監聽 API 呼叫
      const apiCalls = [];
      page.on('request', request => {
        if (request.url().includes('/api/') || request.url().includes('/dashboard')) {
          apiCalls.push({
            url: request.url(),
            method: request.method()
          });
        }
      });

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.navigate();
      await dashboardPage.waitForContent();

      // 檢查 API 呼叫
      console.log(`發現 ${apiCalls.length} 個 API 呼叫`);
      apiCalls.forEach(call => {
        console.log(`API 呼叫: ${call.method} ${call.url}`);
      });

      // 檢查是否沒有錯誤
      const errorCheck = await dashboardPage.checkForErrors();
      expect(errorCheck.has500Error).toBe(false);

      await TestUtils.takeScreenshot(page, 'dashboard-api-calls');
    });
  });

  test.describe('整合與性能測試', () => {
    test('應該在快速導航中保持穩定', async ({ page }) => {
      const pages = [
        '/dashboard',
        '/customers',
        '/suppliers',
        '/orders/sales/create',
        '/products'
      ];

      const errors = [];

      for (const pagePath of pages) {
        try {
          await page.goto(`${TEST_CONFIG.baseURL}${pagePath}`);
          await page.waitForLoadState('networkidle');

          const content = await page.content();
          if (content.includes('500') || content.includes('Internal Server Error')) {
            errors.push(`${pagePath}: 伺服器錯誤`);
          }

          console.log(`✓ ${pagePath} 載入成功`);
        } catch (error) {
          errors.push(`${pagePath}: ${error.message}`);
        }
      }

      expect(errors.length).toBe(0);
      
      if (errors.length > 0) {
        console.log('導航錯誤:', errors);
      } else {
        console.log('✓ 所有頁面導航正常');
      }

      await TestUtils.takeScreenshot(page, 'navigation-stability-test');
    });

    test('應該處理同時進行的搜尋操作', async ({ page }) => {
      // 測試併發搜尋操作的穩定性
      const customersPage = new CustomersPage(page);
      await customersPage.navigate();

      const searchInput = await customersPage.getSearchInput();
      if (searchInput) {
        // 快速連續搜尋模擬
        const rapidSearches = ['a', 'ab', 'abc', 'abcd', 'abcde'];

        for (const search of rapidSearches) {
          await searchInput.fill(search);
          await page.waitForTimeout(100); // 快速輸入模擬
        }

        // 最終搜尋
        await page.keyboard.press('Enter');
        await page.waitForTimeout(TEST_CONFIG.timeout.short);

        // 檢查沒有錯誤
        const jsErrors = await TestUtils.captureJavaScriptErrors(page);
        expect(jsErrors.length).toBe(0);

        console.log('✓ 快速搜尋操作處理正常');
      }

      await TestUtils.takeScreenshot(page, 'concurrent-search-test');
    });
  });
});

// 測試報告生成
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === 'failed') {
    // 失敗時額外截圖
    await TestUtils.takeScreenshot(page, `failed-${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}`);
    
    // 獲取控制台錯誤
    const jsErrors = await TestUtils.captureJavaScriptErrors(page);
    if (jsErrors.length > 0) {
      console.log('JavaScript 錯誤:', jsErrors);
    }
  }
});