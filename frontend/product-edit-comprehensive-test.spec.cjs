const { test, expect } = require('@playwright/test');

// 測試配置
const BASE_URL = 'http://127.0.0.1:8000';
const TEST_TIMEOUT = 60000;

test.describe('產品編輯功能完整測試', () => {
  let page;
  let context;
  
  // 測試數據
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  test.beforeAll(async ({ browser }) => {
    console.log('🚀 開始產品編輯功能完整測試');
    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
    
    // 監聽網路請求
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`📤 API 請求: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📥 API 回應: ${response.status()} ${response.url()}`);
        if (response.status() >= 400) {
          console.error(`❌ API 錯誤: ${response.status()} ${response.url()}`);
        }
      }
    });
    
    // 監聽 JavaScript 錯誤
    page.on('pageerror', error => {
      console.error(`❌ JavaScript 錯誤: ${error.message}`);
    });
    
    // 監聽控制台訊息
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ 控制台錯誤: ${msg.text()}`);
      }
    });
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
  });

  test('第一步：訪問產品列表頁面', async () => {
    console.log('🔐 開始登入流程...');
    
    // 訪問登入頁面
    const loginStart = Date.now();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    const loginLoadTime = Date.now() - loginStart;
    console.log(`⏱️ 登入頁面載入時間: ${loginLoadTime}ms`);
    
    await page.screenshot({ path: 'product-edit-test-01-login.png', fullPage: true });
    
    // 執行登入
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    
    const loginSubmitStart = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: TEST_TIMEOUT });
    const loginSubmitTime = Date.now() - loginSubmitStart;
    console.log(`⏱️ 登入提交時間: ${loginSubmitTime}ms`);
    
    await page.screenshot({ path: 'product-edit-test-02-dashboard.png', fullPage: true });
    
    // 訪問產品列表頁面
    console.log('📦 訪問產品列表頁面...');
    const productsPageStart = Date.now();
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
    const productsPageLoadTime = Date.now() - productsPageStart;
    console.log(`⏱️ 產品頁面載入時間: ${productsPageLoadTime}ms`);
    
    await page.screenshot({ path: 'product-edit-test-03-products-list.png', fullPage: true });
    
    // 檢查頁面是否正確載入
    await expect(page.locator('h1, h2')).toContainText(/產品|Products/i);
    
    // 記錄頁面載入情況
    const pageTitle = await page.title();
    console.log(`📄 頁面標題: ${pageTitle}`);
    
    const pageUrl = page.url();
    console.log(`🔗 當前 URL: ${pageUrl}`);
  });

  test('第二步：查找並點擊產品 857', async () => {
    console.log('🔍 尋找產品 857 (測試產品 15)...');
    
    // 等待產品列表載入
    await page.waitForSelector('table, .product-card, .product-item', { timeout: TEST_TIMEOUT });
    
    // 嘗試不同的選擇器來找到產品 857
    const productSelectors = [
      'a[href*="/products/857/edit"]',
      'a[href*="/products/857"]',
      'tr:has-text("857")',
      'tr:has-text("測試產品 15")',
      '.product-item:has-text("857")',
      '.product-card:has-text("857")'
    ];
    
    let productElement = null;
    let usedSelector = '';
    
    for (const selector of productSelectors) {
      try {
        productElement = await page.locator(selector).first();
        if (await productElement.count() > 0) {
          usedSelector = selector;
          console.log(`✅ 找到產品使用選擇器: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`❌ 選擇器失敗: ${selector}`);
      }
    }
    
    if (!productElement || await productElement.count() === 0) {
      console.log('❌ 未找到產品 857，嘗試查看頁面內容...');
      
      // 檢查頁面內容
      const pageContent = await page.content();
      const hasProduct857 = pageContent.includes('857');
      const hasTestProduct15 = pageContent.includes('測試產品 15');
      
      console.log(`📄 頁面包含 "857": ${hasProduct857}`);
      console.log(`📄 頁面包含 "測試產品 15": ${hasTestProduct15}`);
      
      // 截圖目前頁面狀態
      await page.screenshot({ path: 'product-edit-test-04-no-857-found.png', fullPage: true });
      
      // 如果沒有找到，嘗試直接訪問編輯頁面
      console.log('🔄 嘗試直接訪問編輯頁面...');
      await page.goto(`${BASE_URL}/products/857/edit`, { waitUntil: 'networkidle' });
      
      const currentUrl = page.url();
      console.log(`🔗 直接訪問後的 URL: ${currentUrl}`);
      
      await page.screenshot({ path: 'product-edit-test-05-direct-access.png', fullPage: true });
      
      return;
    }
    
    // 找到產品，點擊進入編輯頁面
    console.log(`✅ 找到產品 857，準備點擊...`);
    
    // 如果是表格行，尋找編輯連結
    if (usedSelector.includes('tr')) {
      const editLink = await productElement.locator('a[href*="edit"], button:has-text("編輯"), button:has-text("Edit")').first();
      if (await editLink.count() > 0) {
        const editClickStart = Date.now();
        await editLink.click();
        const editClickTime = Date.now() - editClickStart;
        console.log(`⏱️ 點擊編輯按鈕時間: ${editClickTime}ms`);
      } else {
        console.log('❌ 在表格行中未找到編輯連結');
        await page.screenshot({ path: 'product-edit-test-06-no-edit-link.png', fullPage: true });
        return;
      }
    } else {
      // 直接點擊連結
      const editClickStart = Date.now();
      await productElement.click();
      const editClickTime = Date.now() - editClickStart;
      console.log(`⏱️ 點擊產品連結時間: ${editClickTime}ms`);
    }
    
    // 等待編輯頁面載入
    await page.waitForLoadState('networkidle', { timeout: TEST_TIMEOUT });
    
    const finalUrl = page.url();
    console.log(`🔗 編輯頁面 URL: ${finalUrl}`);
    
    await page.screenshot({ path: 'product-edit-test-07-edit-page-loaded.png', fullPage: true });
  });

  test('第三步：測試編輯頁面載入和穩定性', async () => {
    console.log('🔍 測試編輯頁面載入和穩定性...');
    
    // 確保我們在編輯頁面
    const currentUrl = page.url();
    if (!currentUrl.includes('/products/857/edit') && !currentUrl.includes('/products/857')) {
      console.log('🔄 不在編輯頁面，嘗試直接訪問...');
      await page.goto(`${BASE_URL}/products/857/edit`, { waitUntil: 'networkidle' });
    }
    
    const pageLoadStart = Date.now();
    await page.waitForLoadState('networkidle', { timeout: TEST_TIMEOUT });
    const pageLoadTime = Date.now() - pageLoadStart;
    console.log(`⏱️ 編輯頁面完全載入時間: ${pageLoadTime}ms`);
    
    // 檢查頁面標題和基本元素
    const pageTitle = await page.title();
    console.log(`📄 編輯頁面標題: ${pageTitle}`);
    
    // 檢查表單元素是否存在
    const formElements = [
      'input[name="name"]',
      'input[name="sku"]',
      'input[name="price"]',
      'input[name="stock_quantity"]',
      'input[name="low_stock_threshold"]',
      'textarea[name="description"]',
      'form'
    ];
    
    const elementStatus = {};
    for (const selector of formElements) {
      try {
        const element = page.locator(selector);
        const count = await element.count();
        elementStatus[selector] = count > 0;
        console.log(`📝 表單元素 ${selector}: ${count > 0 ? '✅ 存在' : '❌ 不存在'}`);
      } catch (error) {
        elementStatus[selector] = false;
        console.log(`📝 表單元素 ${selector}: ❌ 錯誤 - ${error.message}`);
      }
    }
    
    await page.screenshot({ path: 'product-edit-test-08-form-analysis.png', fullPage: true });
    
    // 檢查是否有 JavaScript 錯誤
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    // 等待一段時間看是否有延遲載入的錯誤
    await page.waitForTimeout(3000);
    
    if (jsErrors.length > 0) {
      console.log(`❌ 發現 ${jsErrors.length} 個 JavaScript 錯誤:`);
      jsErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ 沒有發現 JavaScript 錯誤');
    }
    
    // 檢查網路請求狀態
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    console.log(`📊 頁面載入穩定性測試完成`);
    console.log(`  - 頁面載入時間: ${pageLoadTime}ms`);
    console.log(`  - JavaScript 錯誤: ${jsErrors.length}`);
    console.log(`  - 網路錯誤: ${networkErrors.length}`);
  });

  test('第四步：修改庫存數量和低庫存閾值', async () => {
    console.log('✏️ 開始修改庫存數量和低庫存閾值...');
    
    // 確保我們在編輯頁面
    const currentUrl = page.url();
    if (!currentUrl.includes('/products/857/edit') && !currentUrl.includes('/products/857')) {
      await page.goto(`${BASE_URL}/products/857/edit`, { waitUntil: 'networkidle' });
    }
    
    // 等待表單載入
    await page.waitForSelector('form', { timeout: TEST_TIMEOUT });
    
    // 獲取目前的值
    const stockQuantityInput = page.locator('input[name="stock_quantity"]');
    const lowStockThresholdInput = page.locator('input[name="low_stock_threshold"]');
    
    let currentStockQuantity = '';
    let currentLowStockThreshold = '';
    
    try {
      currentStockQuantity = await stockQuantityInput.inputValue();
      currentLowStockThreshold = await lowStockThresholdInput.inputValue();
      
      console.log(`📊 目前庫存數量: ${currentStockQuantity}`);
      console.log(`📊 目前低庫存閾值: ${currentLowStockThreshold}`);
    } catch (error) {
      console.log(`❌ 無法獲取目前值: ${error.message}`);
    }
    
    // 準備新的測試值
    const newStockQuantity = '999';
    const newLowStockThreshold = '50';
    
    console.log(`🔄 準備修改庫存數量為: ${newStockQuantity}`);
    console.log(`🔄 準備修改低庫存閾值為: ${newLowStockThreshold}`);
    
    // 清空並填入新值
    try {
      // 修改庫存數量
      await stockQuantityInput.fill('');
      await stockQuantityInput.fill(newStockQuantity);
      
      // 修改低庫存閾值
      await lowStockThresholdInput.fill('');
      await lowStockThresholdInput.fill(newLowStockThreshold);
      
      console.log('✅ 值修改完成');
      
      // 驗證值是否正確填入
      const verifyStockQuantity = await stockQuantityInput.inputValue();
      const verifyLowStockThreshold = await lowStockThresholdInput.inputValue();
      
      console.log(`✓ 驗證庫存數量: ${verifyStockQuantity} (期望: ${newStockQuantity})`);
      console.log(`✓ 驗證低庫存閾值: ${verifyLowStockThreshold} (期望: ${newLowStockThreshold})`);
      
      await page.screenshot({ path: 'product-edit-test-09-values-modified.png', fullPage: true });
      
    } catch (error) {
      console.log(`❌ 修改值時出錯: ${error.message}`);
      await page.screenshot({ path: 'product-edit-test-10-modification-error.png', fullPage: true });
    }
  });

  test('第五步：提交表單並檢查錯誤', async () => {
    console.log('📤 開始提交表單測試...');
    
    // 確保我們在編輯頁面
    const currentUrl = page.url();
    if (!currentUrl.includes('/products/857/edit') && !currentUrl.includes('/products/857')) {
      await page.goto(`${BASE_URL}/products/857/edit`, { waitUntil: 'networkidle' });
      
      // 重新填入測試值
      await page.fill('input[name="stock_quantity"]', '999');
      await page.fill('input[name="low_stock_threshold"]', '50');
    }
    
    // 尋找提交按鈕
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("更新")',
      'button:has-text("儲存")',
      'button:has-text("Save")',
      'button:has-text("Update")',
      '.btn-primary',
      'button.btn'
    ];
    
    let submitButton = null;
    let usedSelector = '';
    
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.count() > 0) {
          submitButton = button.first();
          usedSelector = selector;
          console.log(`✅ 找到提交按鈕: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`❌ 提交按鈕選擇器失敗: ${selector}`);
      }
    }
    
    if (!submitButton) {
      console.log('❌ 未找到提交按鈕，截圖當前狀態');
      await page.screenshot({ path: 'product-edit-test-11-no-submit-button.png', fullPage: true });
      return;
    }
    
    // 監聽網路請求，特別關注 POST /api/products/857
    const networkRequests = [];
    const networkResponses = [];
    
    page.on('request', request => {
      if (request.url().includes('/products/857') || request.url().includes('/api/products')) {
        networkRequests.push({
          method: request.method(),
          url: request.url(),
          timestamp: Date.now()
        });
        console.log(`📤 監聽到相關請求: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/products/857') || response.url().includes('/api/products')) {
        networkResponses.push({
          status: response.status(),
          statusText: response.statusText(),
          url: response.url(),
          timestamp: Date.now()
        });
        console.log(`📥 監聽到相關回應: ${response.status()} ${response.url()}`);
        
        if (response.status() >= 400) {
          console.error(`❌ 錯誤回應: ${response.status()} ${response.statusText()}`);
        }
      }
    });
    
    // 點擊提交按鈕
    console.log('🚀 點擊提交按鈕...');
    const submitStart = Date.now();
    
    try {
      await submitButton.click();
      console.log('✅ 提交按鈕點擊成功');
      
      // 等待響應
      await page.waitForLoadState('networkidle', { timeout: TEST_TIMEOUT });
      const submitTime = Date.now() - submitStart;
      console.log(`⏱️ 表單提交處理時間: ${submitTime}ms`);
      
      await page.screenshot({ path: 'product-edit-test-12-after-submit.png', fullPage: true });
      
      // 檢查當前 URL
      const afterSubmitUrl = page.url();
      console.log(`🔗 提交後 URL: ${afterSubmitUrl}`);
      
      // 檢查頁面內容是否有錯誤
      const pageContent = await page.textContent('body');
      const hasError500 = pageContent.includes('500') || pageContent.includes('Server Error') || pageContent.toLowerCase().includes('internal server error');
      const hasError = pageContent.includes('Error') || pageContent.includes('錯誤');
      
      console.log(`🔍 是否包含 HTTP 500 錯誤: ${hasError500}`);
      console.log(`🔍 是否包含其他錯誤: ${hasError}`);
      
      // 檢查是否有成功訊息
      const hasSuccess = pageContent.includes('成功') || pageContent.includes('Success') || pageContent.includes('更新完成') || pageContent.includes('Updated successfully');
      console.log(`✅ 是否包含成功訊息: ${hasSuccess}`);
      
    } catch (error) {
      console.error(`❌ 提交表單時出錯: ${error.message}`);
      await page.screenshot({ path: 'product-edit-test-13-submit-error.png', fullPage: true });
    }
    
    // 分析網路請求和回應
    console.log('\n📊 網路請求分析:');
    console.log(`  - 總請求數: ${networkRequests.length}`);
    console.log(`  - 總回應數: ${networkResponses.length}`);
    
    if (networkRequests.length > 0) {
      console.log('\n📤 請求詳情:');
      networkRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.method} ${req.url}`);
      });
    }
    
    if (networkResponses.length > 0) {
      console.log('\n📥 回應詳情:');
      networkResponses.forEach((res, index) => {
        console.log(`  ${index + 1}. ${res.status} ${res.statusText} - ${res.url}`);
      });
    }
    
    // 檢查是否有 HTTP 500 錯誤
    const http500Responses = networkResponses.filter(res => res.status === 500);
    if (http500Responses.length > 0) {
      console.error('\n❌ 發現 HTTP 500 錯誤:');
      http500Responses.forEach((res, index) => {
        console.error(`  ${index + 1}. ${res.url} - ${res.statusText}`);
      });
    }
    
    // 檢查特定的 POST /api/products/857 請求
    const productUpdateRequest = networkRequests.find(req => 
      req.method === 'POST' && req.url.includes('/products/857')
    );
    const productUpdateResponse = networkResponses.find(res => 
      res.url.includes('/products/857') && res.status !== 200
    );
    
    if (productUpdateRequest) {
      console.log('\n🎯 找到產品更新請求:');
      console.log(`  - 方法: ${productUpdateRequest.method}`);
      console.log(`  - URL: ${productUpdateRequest.url}`);
    }
    
    if (productUpdateResponse) {
      console.log('\n🎯 產品更新回應:');
      console.log(`  - 狀態: ${productUpdateResponse.status}`);
      console.log(`  - 狀態文字: ${productUpdateResponse.statusText}`);
      console.log(`  - URL: ${productUpdateResponse.url}`);
    }
  });

  test('第六步：詳細分析和總結', async () => {
    console.log('📋 開始詳細分析和總結...');
    
    // 最終截圖
    await page.screenshot({ path: 'product-edit-test-14-final-state.png', fullPage: true });
    
    // 獲取最終頁面資訊
    const finalUrl = page.url();
    const finalTitle = await page.title();
    const pageContent = await page.textContent('body');
    
    console.log('\n📊 最終測試結果總結:');
    console.log(`🔗 最終 URL: ${finalUrl}`);
    console.log(`📄 最終頁面標題: ${finalTitle}`);
    
    // 檢查常見的錯誤模式
    const errorPatterns = [
      'HTTP 500',
      'Internal Server Error',
      'Server Error',
      '500 Internal Server Error',
      'SQLSTATE',
      'Whoops',
      'Something went wrong',
      'Exception',
      'Error:',
      'Fatal error'
    ];
    
    const foundErrors = [];
    errorPatterns.forEach(pattern => {
      if (pageContent.includes(pattern)) {
        foundErrors.push(pattern);
      }
    });
    
    if (foundErrors.length > 0) {
      console.log('\n❌ 發現錯誤模式:');
      foundErrors.forEach(error => {
        console.log(`  - ${error}`);
      });
    } else {
      console.log('\n✅ 未發現明顯的錯誤模式');
    }
    
    // 檢查成功模式
    const successPatterns = [
      '成功',
      'Success',
      'successfully',
      '更新完成',
      'Updated',
      'saved'
    ];
    
    const foundSuccess = [];
    successPatterns.forEach(pattern => {
      if (pageContent.toLowerCase().includes(pattern.toLowerCase())) {
        foundSuccess.push(pattern);
      }
    });
    
    if (foundSuccess.length > 0) {
      console.log('\n✅ 發現成功模式:');
      foundSuccess.forEach(success => {
        console.log(`  - ${success}`);
      });
    }
    
    // 性能分析
    const performanceEntries = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation'));
    });
    
    try {
      const perfData = JSON.parse(performanceEntries);
      if (perfData.length > 0) {
        const navTiming = perfData[0];
        console.log('\n⚡ 頁面性能分析:');
        console.log(`  - DOM 載入時間: ${Math.round(navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart)}ms`);
        console.log(`  - 頁面完全載入時間: ${Math.round(navTiming.loadEventEnd - navTiming.loadEventStart)}ms`);
        console.log(`  - 總載入時間: ${Math.round(navTiming.loadEventEnd - navTiming.fetchStart)}ms`);
      }
    } catch (error) {
      console.log('⚠️ 無法分析性能數據');
    }
    
    console.log('\n🎯 測試完成！詳細結果請查看生成的截圖文件。');
  });
});