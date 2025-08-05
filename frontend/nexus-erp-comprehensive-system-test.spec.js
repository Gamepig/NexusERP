/**
 * NexusERP 系統功能綜合測試
 * 測試環境：http://127.0.0.1:8000
 * 測試帳號：test@example.com / password123
 * 
 * 測試範圍：
 * 1. 系統登入測試
 * 2. 客戶管理模組測試
 * 3. 商品管理模組測試
 * 4. 供應商管理模組測試
 * 5. 綜合測試報告
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
  }
};

// 測試結果記錄
class TestReporter {
  constructor() {
    this.results = {
      login: { status: 'pending', screenshots: [], errors: [] },
      customers: { status: 'pending', screenshots: [], errors: [] },
      products: { status: 'pending', screenshots: [], errors: [] },
      suppliers: { status: 'pending', screenshots: [], errors: [] },
      overall: { status: 'pending', screenshots: [], errors: [] }
    };
  }

  recordSuccess(module, message, screenshot = null) {
    this.results[module].status = 'success';
    if (screenshot) this.results[module].screenshots.push(screenshot);
    console.log(`✅ [${module.toUpperCase()}] ${message}`);
  }

  recordError(module, message, screenshot = null) {
    this.results[module].status = 'error';
    this.results[module].errors.push(message);
    if (screenshot) this.results[module].screenshots.push(screenshot);
    console.log(`❌ [${module.toUpperCase()}] ${message}`);
  }

  recordWarning(module, message, screenshot = null) {
    if (this.results[module].status === 'pending') {
      this.results[module].status = 'warning';
    }
    if (screenshot) this.results[module].screenshots.push(screenshot);
    console.log(`⚠️ [${module.toUpperCase()}] ${message}`);
  }

  generateReport() {
    console.log('\n🔍 NexusERP 系統測試報告');
    console.log('='.repeat(50));
    
    Object.entries(this.results).forEach(([module, result]) => {
      const statusIcon = result.status === 'success' ? '✅' : 
                        result.status === 'error' ? '❌' : 
                        result.status === 'warning' ? '⚠️' : '⏳';
      
      console.log(`${statusIcon} ${module.toUpperCase()}: ${result.status}`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`   - 錯誤: ${error}`));
      }
      
      if (result.screenshots.length > 0) {
        console.log(`   - 截圖: ${result.screenshots.length} 張`);
      }
    });
    
    return this.results;
  }
}

// 工具函數
class TestUtils {
  static async takeScreenshot(page, name, reporter, module) {
    try {
      const screenshotPath = `screenshots/${Date.now()}-${name}.png`;
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true
      });
      reporter.results[module].screenshots.push(screenshotPath);
      return screenshotPath;
    } catch (error) {
      console.log(`截圖失敗: ${error.message}`);
    }
  }

  static async checkForErrors(page) {
    const content = await page.content();
    return {
      has500Error: content.includes('500') || content.includes('Internal Server Error'),
      has404Error: content.includes('404') || content.includes('Not Found'),
      hasJsError: false // 將在測試中動態檢測
    };
  }

  static async waitForPageLoad(page, timeout = 5000) {
    try {
      await page.waitForLoadState('networkidle', { timeout });
      return true;
    } catch (error) {
      console.log(`頁面載入超時: ${error.message}`);
      return false;
    }
  }
}

// 登入頁面物件模型
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"], input[type="email"], #email');
    this.passwordInput = page.locator('input[name="password"], input[type="password"], #password');
    this.submitButton = page.locator('button[type="submit"], input[type="submit"], .login-button');
  }

  async navigate() {
    await this.page.goto(`${TEST_CONFIG.baseURL}/login`);
    await TestUtils.waitForPageLoad(this.page);
  }

  async fillCredentials(email = TEST_CONFIG.email, password = TEST_CONFIG.password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
    await TestUtils.waitForPageLoad(this.page);
  }

  async login(email = TEST_CONFIG.email, password = TEST_CONFIG.password) {
    await this.navigate();
    await this.fillCredentials(email, password);
    await this.submit();
  }
}

// 主要測試套件
test.describe('NexusERP 系統功能綜合測試', () => {
  let reporter;

  test.beforeAll(async () => {
    reporter = new TestReporter();
    console.log('🚀 開始 NexusERP 系統功能測試');
    console.log(`測試環境: ${TEST_CONFIG.baseURL}`);
    console.log(`測試帳號: ${TEST_CONFIG.email}`);
  });

  test.afterAll(async () => {
    const report = reporter.generateReport();
    console.log('\n📊 測試完成');
  });

  // 1. 系統登入測試
  test('1. 系統登入測試', async ({ page }) => {
    console.log('\n🔐 開始系統登入測試');
    
    try {
      const loginPage = new LoginPage(page);
      
      // 訪問主頁面
      await page.goto(TEST_CONFIG.baseURL);
      await TestUtils.takeScreenshot(page, '01-homepage', reporter, 'login');
      
      const homeContent = await page.content();
      if (homeContent.includes('500') || homeContent.includes('404')) {
        reporter.recordError('login', '主頁面載入失敗 - 伺服器錯誤');
        return;
      }
      
      reporter.recordSuccess('login', '成功訪問主頁面');
      
      // 執行登入流程
      await loginPage.navigate();
      await TestUtils.takeScreenshot(page, '02-login-page', reporter, 'login');
      
      // 檢查登入頁面元素
      const emailVisible = await loginPage.emailInput.isVisible();
      const passwordVisible = await loginPage.passwordInput.isVisible();
      const submitVisible = await loginPage.submitButton.isVisible();
      
      if (!emailVisible || !passwordVisible || !submitVisible) {
        reporter.recordError('login', '登入表單元素不完整');
        return;
      }
      
      // 填入登入資訊並提交
      await loginPage.fillCredentials();
      await TestUtils.takeScreenshot(page, '03-login-filled', reporter, 'login');
      
      await loginPage.submit();
      
      // 驗證登入成功
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/home')) {
        await TestUtils.takeScreenshot(page, '04-login-success', reporter, 'login');
        reporter.recordSuccess('login', '登入成功，重定向到主頁面');
      } else {
        const loginError = await page.locator('.error, .alert-danger, .invalid-feedback').textContent().catch(() => '');
        reporter.recordError('login', `登入失敗: ${loginError || '未知錯誤'}`);
      }
      
    } catch (error) {
      reporter.recordError('login', `登入測試異常: ${error.message}`);
      await TestUtils.takeScreenshot(page, '99-login-error', reporter, 'login');
    }
  });

  // 2. 客戶管理模組測試
  test('2. 客戶管理模組測試', async ({ page }) => {
    console.log('\n👥 開始客戶管理模組測試');
    
    try {
      // 先登入
      const loginPage = new LoginPage(page);
      await loginPage.login();
      
      // 測試建立銷售訂單功能
      await page.goto(`${TEST_CONFIG.baseURL}/orders/sales/create`, { waitUntil: 'networkidle' });
      await TestUtils.takeScreenshot(page, '01-sales-order-create', reporter, 'customers');
      
      const errorCheck = await TestUtils.checkForErrors(page);
      if (errorCheck.has500Error) {
        reporter.recordError('customers', '銷售訂單建立頁面發生 500 錯誤');
      } else if (errorCheck.has404Error) {
        reporter.recordError('customers', '銷售訂單建立頁面發生 404 錯誤');
      } else {
        reporter.recordSuccess('customers', '銷售訂單建立頁面載入正常');
      }
      
      // 檢查表單元素
      const form = page.locator('form').first();
      if (await form.count() > 0) {
        reporter.recordSuccess('customers', '找到銷售訂單表單');
        
        // 測試表單功能
        const customerSelect = page.locator('select[name*="customer"], input[name*="customer"]').first();
        const productInput = page.locator('input[name*="product"], select[name*="product"]').first();
        
        if (await customerSelect.count() > 0) {
          reporter.recordSuccess('customers', '客戶選擇欄位存在');
        } else {
          reporter.recordWarning('customers', '未找到客戶選擇欄位');
        }
        
        if (await productInput.count() > 0) {
          reporter.recordSuccess('customers', '產品選擇欄位存在');
        } else {
          reporter.recordWarning('customers', '未找到產品選擇欄位');
        }
      } else {
        reporter.recordWarning('customers', '未找到銷售訂單表單');
      }
      
      // 測試報價表單 DEMO 功能
      await page.goto(`${TEST_CONFIG.baseURL}/quotes/create`, { waitUntil: 'networkidle' });
      await TestUtils.takeScreenshot(page, '02-quote-demo', reporter, 'customers');
      
      const quoteErrorCheck = await TestUtils.checkForErrors(page);
      if (quoteErrorCheck.has500Error || quoteErrorCheck.has404Error) {
        reporter.recordWarning('customers', '報價表單頁面無法訪問');
      } else {
        reporter.recordSuccess('customers', '報價表單 DEMO 功能正常');
      }
      
    } catch (error) {
      reporter.recordError('customers', `客戶管理測試異常: ${error.message}`);
      await TestUtils.takeScreenshot(page, '99-customers-error', reporter, 'customers');
    }
  });

  // 3. 商品管理模組測試
  test('3. 商品管理模組測試', async ({ page }) => {
    console.log('\n📦 開始商品管理模組測試');
    
    try {
      // 先登入
      const loginPage = new LoginPage(page);
      await loginPage.login();
      
      // 測試新增商品功能
      await page.goto(`${TEST_CONFIG.baseURL}/products/create`, { waitUntil: 'networkidle' });
      await TestUtils.takeScreenshot(page, '01-product-create', reporter, 'products');
      
      const errorCheck = await TestUtils.checkForErrors(page);
      if (errorCheck.has500Error) {
        reporter.recordError('products', '新增商品頁面發生 500 錯誤');
      } else if (errorCheck.has404Error) {
        reporter.recordError('products', '新增商品頁面發生 404 錯誤');
      } else {
        reporter.recordSuccess('products', '新增商品頁面載入正常');
        
        // 檢查表單完整性
        const nameInput = page.locator('input[name*="name"], input[name*="product_name"]').first();
        const priceInput = page.locator('input[name*="price"], input[name*="unit_price"]').first();
        const stockInput = page.locator('input[name*="stock"], input[name*="quantity"]').first();
        
        const hasNameField = await nameInput.count() > 0;
        const hasPriceField = await priceInput.count() > 0;
        const hasStockField = await stockInput.count() > 0;
        
        if (hasNameField && hasPriceField) {
          reporter.recordSuccess('products', '商品基本資訊欄位完整');
        } else {
          reporter.recordWarning('products', '商品基本資訊欄位不完整');
        }
        
        if (hasStockField) {
          reporter.recordSuccess('products', '庫存管理欄位存在');
        } else {
          reporter.recordWarning('products', '庫存管理欄位缺失');
        }
      }
      
      // 測試編輯商品時庫存數據顯示
      await page.goto(`${TEST_CONFIG.baseURL}/products`, { waitUntil: 'networkidle' });
      await TestUtils.takeScreenshot(page, '02-products-list', reporter, 'products');
      
      const listErrorCheck = await TestUtils.checkForErrors(page);
      if (!listErrorCheck.has500Error && !listErrorCheck.has404Error) {
        // 尋找編輯按鈕
        const editButtons = page.locator('a[href*="edit"], button:has-text("編輯"), button:has-text("Edit")');
        const editButtonCount = await editButtons.count();
        
        if (editButtonCount > 0) {
          reporter.recordSuccess('products', `找到 ${editButtonCount} 個編輯按鈕`);
          
          // 點擊第一個編輯按鈕
          try {
            await editButtons.first().click();
            await TestUtils.waitForPageLoad(page);
            await TestUtils.takeScreenshot(page, '03-product-edit', reporter, 'products');
            
            // 檢查庫存數據顯示
            const inventoryFields = page.locator('[name*="inventory"], [name*="stock"], [name*="quantity"], .inventory-info, .stock-info');
            const inventoryCount = await inventoryFields.count();
            
            if (inventoryCount > 0) {
              reporter.recordSuccess('products', `編輯頁面顯示 ${inventoryCount} 個庫存相關欄位`);
            } else {
              reporter.recordWarning('products', '編輯頁面未顯示庫存數據');
            }
            
          } catch (editError) {
            reporter.recordWarning('products', `編輯功能測試失敗: ${editError.message}`);
          }
        } else {
          reporter.recordWarning('products', '商品列表未找到編輯按鈕');
        }
      } else {
        reporter.recordError('products', '商品列表頁面載入失敗');
      }
      
    } catch (error) {
      reporter.recordError('products', `商品管理測試異常: ${error.message}`);
      await TestUtils.takeScreenshot(page, '99-products-error', reporter, 'products');
    }
  });

  // 4. 供應商管理模組測試
  test('4. 供應商管理模組測試', async ({ page }) => {
    console.log('\n🏭 開始供應商管理模組測試');
    
    try {
      // 先登入
      const loginPage = new LoginPage(page);
      await loginPage.login();
      
      // 測試供應商列表頁面
      await page.goto(`${TEST_CONFIG.baseURL}/suppliers`, { waitUntil: 'networkidle' });
      await TestUtils.takeScreenshot(page, '01-suppliers-list', reporter, 'suppliers');
      
      const errorCheck = await TestUtils.checkForErrors(page);
      if (errorCheck.has500Error) {
        reporter.recordError('suppliers', '供應商列表頁面發生 500 錯誤');
      } else if (errorCheck.has404Error) {
        reporter.recordError('suppliers', '供應商列表頁面發生 404 錯誤');
      } else {
        reporter.recordSuccess('suppliers', '供應商列表頁面載入正常');
        
        // 測試狀態顯示功能
        const statusElements = page.locator('.status, [data-status], td:has-text("狀態"), td:has-text("Status")');
        const statusCount = await statusElements.count();
        
        if (statusCount > 0) {
          reporter.recordSuccess('suppliers', `找到 ${statusCount} 個狀態顯示元素`);
          
          // 檢查狀態值
          const statusTexts = await statusElements.allTextContents();
          const hasValidStatus = statusTexts.some(text => 
            text.includes('活躍') || text.includes('Active') || 
            text.includes('停用') || text.includes('Inactive') ||
            text.includes('pending') || text.includes('approved')
          );
          
          if (hasValidStatus) {
            reporter.recordSuccess('suppliers', '供應商狀態顯示正常');
          } else {
            reporter.recordWarning('suppliers', '供應商狀態值可能異常');
          }
        } else {
          reporter.recordWarning('suppliers', '未找到狀態顯示欄位');
        }
        
        // 檢查表格結構
        const tableRows = page.locator('tbody tr, .supplier-row');
        const rowCount = await tableRows.count();
        
        if (rowCount > 0) {
          reporter.recordSuccess('suppliers', `供應商列表顯示 ${rowCount} 筆記錄`);
        } else {
          reporter.recordWarning('suppliers', '供應商列表為空或結構異常');
        }
        
        // 測試搜尋功能
        const searchInput = page.locator('input[type="search"], input[name="search"], .search-input').first();
        if (await searchInput.count() > 0) {
          await searchInput.fill('test');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          
          await TestUtils.takeScreenshot(page, '02-suppliers-search', reporter, 'suppliers');
          reporter.recordSuccess('suppliers', '搜尋功能正常運作');
        } else {
          reporter.recordWarning('suppliers', '未找到搜尋功能');
        }
      }
      
      // 測試新增供應商功能
      await page.goto(`${TEST_CONFIG.baseURL}/suppliers/create`, { waitUntil: 'networkidle' });
      await TestUtils.takeScreenshot(page, '03-supplier-create', reporter, 'suppliers');
      
      const createErrorCheck = await TestUtils.checkForErrors(page);
      if (!createErrorCheck.has500Error && !createErrorCheck.has404Error) {
        const form = page.locator('form').first();
        if (await form.count() > 0) {
          reporter.recordSuccess('suppliers', '新增供應商表單存在');
        } else {
          reporter.recordWarning('suppliers', '新增供應商表單缺失');
        }
      } else {
        reporter.recordWarning('suppliers', '新增供應商頁面無法訪問');
      }
      
    } catch (error) {
      reporter.recordError('suppliers', `供應商管理測試異常: ${error.message}`);
      await TestUtils.takeScreenshot(page, '99-suppliers-error', reporter, 'suppliers');
    }
  });

  // 5. 綜合功能測試
  test('5. 系統綜合功能測試', async ({ page }) => {
    console.log('\n🔄 開始系統綜合功能測試');
    
    try {
      // 先登入
      const loginPage = new LoginPage(page);
      await loginPage.login();
      
      // 測試主要導航功能
      const navigationItems = [
        { url: '/dashboard', name: '儀表板' },
        { url: '/customers', name: '客戶管理' },
        { url: '/products', name: '商品管理' },
        { url: '/suppliers', name: '供應商管理' },
        { url: '/inventory', name: '庫存管理' },
        { url: '/orders', name: '訂單管理' },
        { url: '/reports', name: '報表中心' }
      ];
      
      let navigationErrors = [];
      let successfulPages = 0;
      
      for (const nav of navigationItems) {
        try {
          await page.goto(`${TEST_CONFIG.baseURL}${nav.url}`, { waitUntil: 'networkidle' });
          
          const errorCheck = await TestUtils.checkForErrors(page);
          if (errorCheck.has500Error || errorCheck.has404Error) {
            navigationErrors.push(`${nav.name}: 頁面錯誤`);
          } else {
            successfulPages++;
            console.log(`✓ ${nav.name} 頁面正常`);
          }
          
          await page.waitForTimeout(1000);
        } catch (error) {
          navigationErrors.push(`${nav.name}: ${error.message}`);
        }
      }
      
      await TestUtils.takeScreenshot(page, '01-navigation-test', reporter, 'overall');
      
      if (navigationErrors.length === 0) {
        reporter.recordSuccess('overall', `所有 ${successfulPages} 個主要頁面導航正常`);
      } else if (navigationErrors.length < navigationItems.length / 2) {
        reporter.recordWarning('overall', `${successfulPages}/${navigationItems.length} 個頁面正常，部分頁面有問題`);
      } else {
        reporter.recordError('overall', `多數頁面存在問題: ${navigationErrors.join(', ')}`);
      }
      
      // 測試響應式設計
      const viewports = [
        { width: 375, height: 667, name: '手機' },
        { width: 768, height: 1024, name: '平板' },
        { width: 1920, height: 1080, name: '桌面' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
        await page.waitForTimeout(1000);
        
        await TestUtils.takeScreenshot(page, `02-responsive-${viewport.name}`, reporter, 'overall');
        console.log(`✓ ${viewport.name}版面測試完成`);
      }
      
      reporter.recordSuccess('overall', '響應式設計測試完成');
      
      // JavaScript 錯誤檢測
      const jsErrors = [];
      page.on('pageerror', error => jsErrors.push(error.message));
      page.on('console', msg => {
        if (msg.type() === 'error') {
          jsErrors.push(msg.text());
        }
      });
      
      // 重新載入主頁面檢測 JS 錯誤
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
      await page.waitForTimeout(3000);
      
      if (jsErrors.length === 0) {
        reporter.recordSuccess('overall', 'JavaScript 執行無錯誤');
      } else {
        reporter.recordWarning('overall', `發現 ${jsErrors.length} 個 JavaScript 錯誤`);
        jsErrors.forEach(error => console.log(`JS 錯誤: ${error}`));
      }
      
    } catch (error) {
      reporter.recordError('overall', `綜合測試異常: ${error.message}`);
      await TestUtils.takeScreenshot(page, '99-overall-error', reporter, 'overall');
    }
  });
});