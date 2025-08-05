const { test, expect } = require('@playwright/test');

// 測試配置
const BASE_URL = 'http://127.0.0.1:8000';
const TEST_TIMEOUT = 60000;

test.describe('產品 857 編輯功能直接測試', () => {
  let page;
  let context;
  
  // 測試數據
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  test.beforeAll(async ({ browser }) => {
    console.log('🚀 開始產品 857 編輯功能直接測試');
    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
    
    // 收集網路請求和回應
    const networkLogs = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/products/857')) {
        networkLogs.push({
          type: 'request',
          method: request.method(),
          url: request.url(),
          timestamp: new Date().toISOString()
        });
        console.log(`📤 API 請求: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/products/857')) {
        networkLogs.push({
          type: 'response',
          status: response.status(),
          statusText: response.statusText(),
          url: response.url(),
          timestamp: new Date().toISOString()
        });
        console.log(`📥 API 回應: ${response.status()} ${response.url()}`);
        if (response.status() >= 400) {
          console.error(`❌ API 錯誤: ${response.status()} ${response.statusText()} - ${response.url()}`);
        }
      }
    });
    
    // 監聽 JavaScript 錯誤
    page.on('pageerror', error => {
      console.error(`❌ JavaScript 錯誤: ${error.message}`);
    });
    
    // 監聽控制台錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ 控制台錯誤: ${msg.text()}`);
      }
    });
    
    // 將網路日誌暴露給測試使用
    page.networkLogs = networkLogs;
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
  });

  test('步驟 1：登入系統', async () => {
    console.log('🔐 開始登入流程...');
    
    const loginStart = Date.now();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    const loginLoadTime = Date.now() - loginStart;
    console.log(`⏱️ 登入頁面載入時間: ${loginLoadTime}ms`);
    
    await page.screenshot({ path: 'product-857-01-login.png', fullPage: true });
    
    // 執行登入
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    
    const loginSubmitStart = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: TEST_TIMEOUT });
    const loginSubmitTime = Date.now() - loginSubmitStart;
    console.log(`⏱️ 登入提交時間: ${loginSubmitTime}ms`);
    
    await page.screenshot({ path: 'product-857-02-dashboard.png', fullPage: true });
    console.log('✅ 登入成功');
  });

  test('步驟 2：直接訪問產品 857 編輯頁面', async () => {
    console.log('🔗 直接訪問產品 857 編輯頁面...');
    
    const editPageStart = Date.now();
    await page.goto(`${BASE_URL}/products/857/edit`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    const editPageLoadTime = Date.now() - editPageStart;
    console.log(`⏱️ 編輯頁面載入時間: ${editPageLoadTime}ms`);
    
    await page.screenshot({ path: 'product-857-03-edit-page-initial.png', fullPage: true });
    
    // 檢查頁面 URL 和標題
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`🔗 當前 URL: ${currentUrl}`);
    console.log(`📄 頁面標題: ${pageTitle}`);
    
    // 檢查是否有錯誤頁面
    const pageContent = await page.textContent('body');
    const hasError = pageContent.includes('500') || pageContent.includes('Error') || pageContent.includes('錯誤');
    
    if (hasError) {
      console.error('❌ 頁面載入時發現錯誤');
      await page.screenshot({ path: 'product-857-04-page-error.png', fullPage: true });
    } else {
      console.log('✅ 頁面載入正常');
    }
  });

  test('步驟 3：分析編輯表單結構', async () => {
    console.log('🔍 分析編輯表單結構...');
    
    // 確保我們在編輯頁面
    const currentUrl = page.url();
    if (!currentUrl.includes('/products/857/edit')) {
      await page.goto(`${BASE_URL}/products/857/edit`, { waitUntil: 'networkidle' });
    }
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // 等待 JavaScript 執行
    
    await page.screenshot({ path: 'product-857-05-form-structure.png', fullPage: true });
    
    // 檢查表單是否存在
    const forms = await page.locator('form').count();
    console.log(`📝 找到 ${forms} 個表單`);
    
    // 檢查各種可能的表單元素
    const formElements = [
      { selector: 'input[name="name"]', description: '產品名稱' },
      { selector: 'input[name="sku"]', description: 'SKU' },
      { selector: 'input[name="price"]', description: '價格' },
      { selector: 'input[name="stock_quantity"]', description: '庫存數量' },
      { selector: 'input[name="low_stock_threshold"]', description: '低庫存閾值' },
      { selector: 'textarea[name="description"]', description: '描述' },
      { selector: 'select[name="category"]', description: '分類' },
      { selector: 'select[name="status"]', description: '狀態' },
      { selector: 'input[type="file"]', description: '圖片上傳' },
      { selector: 'button[type="submit"]', description: '提交按鈕' },
      { selector: 'input[type="submit"]', description: '提交輸入' },
      { selector: 'button:has-text("更新")', description: '更新按鈕' },
      { selector: 'button:has-text("儲存")', description: '儲存按鈕' },
      { selector: 'button:has-text("Save")', description: '儲存按鈕(英)' },
      { selector: 'button:has-text("Update")', description: '更新按鈕(英)' }
    ];
    
    console.log('\n📊 表單元素檢查結果:');
    for (const element of formElements) {
      try {
        const count = await page.locator(element.selector).count();
        const exists = count > 0;
        console.log(`  ${exists ? '✅' : '❌'} ${element.description} (${element.selector}): ${count} 個`);
        
        if (exists && element.selector.includes('input') && !element.selector.includes('type="file"') && !element.selector.includes('type="submit"')) {
          // 嘗試獲取目前值
          try {
            const value = await page.locator(element.selector).first().inputValue();
            console.log(`    └─ 目前值: "${value}"`);
          } catch (err) {
            console.log(`    └─ 無法獲取值: ${err.message}`);
          }
        }
      } catch (error) {
        console.log(`  ❌ ${element.description} (${element.selector}): 檢查失敗 - ${error.message}`);
      }
    }
    
    // 檢查頁面中是否有產品資訊
    const hasProductInfo = await page.textContent('body');
    if (hasProductInfo.includes('測試產品 15') || hasProductInfo.includes('TEST-PROD-015')) {
      console.log('✅ 頁面包含產品 857 的資訊');
    } else {
      console.log('⚠️ 頁面似乎不包含產品 857 的資訊');
    }
  });

  test('步驟 4：嘗試修改庫存相關欄位', async () => {
    console.log('✏️ 嘗試修改庫存相關欄位...');
    
    // 確保我們在編輯頁面
    const currentUrl = page.url();
    if (!currentUrl.includes('/products/857/edit')) {
      await page.goto(`${BASE_URL}/products/857/edit`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }
    
    // 嘗試尋找並修改庫存數量
    const stockQuantitySelectors = [
      'input[name="stock_quantity"]',
      'input[name="stockQuantity"]',
      'input[name="quantity"]',
      'input[name="stock"]',
      '#stock_quantity',
      '#stockQuantity',
      '#quantity',
      'input[placeholder*="庫存"]',
      'input[placeholder*="數量"]'
    ];
    
    let stockField = null;
    let usedStockSelector = '';
    
    for (const selector of stockQuantitySelectors) {
      try {
        const field = page.locator(selector);
        if (await field.count() > 0) {
          stockField = field.first();
          usedStockSelector = selector;
          console.log(`✅ 找到庫存欄位: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    // 嘗試尋找並修改低庫存閾值
    const lowStockSelectors = [
      'input[name="low_stock_threshold"]',
      'input[name="lowStockThreshold"]',
      'input[name="low_stock"]',
      'input[name="threshold"]',
      '#low_stock_threshold',
      '#lowStockThreshold',
      'input[placeholder*="低庫存"]',
      'input[placeholder*="閾值"]'
    ];
    
    let lowStockField = null;
    let usedLowStockSelector = '';
    
    for (const selector of lowStockSelectors) {
      try {
        const field = page.locator(selector);
        if (await field.count() > 0) {
          lowStockField = field.first();
          usedLowStockSelector = selector;
          console.log(`✅ 找到低庫存閾值欄位: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    // 執行修改
    let stockModified = false;
    let lowStockModified = false;
    
    if (stockField) {
      try {
        const originalValue = await stockField.inputValue();
        console.log(`📊 原始庫存數量: ${originalValue}`);
        
        await stockField.fill('999');
        const newValue = await stockField.inputValue();
        console.log(`📊 修改後庫存數量: ${newValue}`);
        
        if (newValue === '999') {
          stockModified = true;
          console.log('✅ 庫存數量修改成功');
        } else {
          console.log('❌ 庫存數量修改失敗');
        }
      } catch (error) {
        console.log(`❌ 修改庫存數量時出錯: ${error.message}`);
      }
    } else {
      console.log('❌ 未找到庫存數量欄位');
    }
    
    if (lowStockField) {
      try {
        const originalValue = await lowStockField.inputValue();
        console.log(`📊 原始低庫存閾值: ${originalValue}`);
        
        await lowStockField.fill('50');
        const newValue = await lowStockField.inputValue();
        console.log(`📊 修改後低庫存閾值: ${newValue}`);
        
        if (newValue === '50') {
          lowStockModified = true;
          console.log('✅ 低庫存閾值修改成功');
        } else {
          console.log('❌ 低庫存閾值修改失敗');
        }
      } catch (error) {
        console.log(`❌ 修改低庫存閾值時出錯: ${error.message}`);
      }
    } else {
      console.log('❌ 未找到低庫存閾值欄位');
    }
    
    await page.screenshot({ path: 'product-857-06-values-modified.png', fullPage: true });
    
    console.log(`\n📋 修改結果總結:`);
    console.log(`  - 庫存數量: ${stockModified ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`  - 低庫存閾值: ${lowStockModified ? '✅ 成功' : '❌ 失敗'}`);
  });

  test('步驟 5：提交表單並檢查回應', async () => {
    console.log('📤 提交表單並檢查回應...');
    
    // 確保我們在編輯頁面
    const currentUrl = page.url();
    if (!currentUrl.includes('/products/857/edit')) {
      await page.goto(`${BASE_URL}/products/857/edit`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // 重新設定測試值
      try {
        await page.fill('input[name="stock_quantity"]', '999');
        await page.fill('input[name="low_stock_threshold"]', '50');
      } catch (error) {
        console.log('⚠️ 重新設定值時出現問題，繼續測試...');
      }
    }
    
    // 清空之前的網路日誌
    page.networkLogs.length = 0;
    
    // 尋找提交按鈕
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("更新")',
      'button:has-text("儲存")',
      'button:has-text("Save")',
      'button:has-text("Update")',
      '.btn-primary',
      'button.btn',
      'form button:last-child'
    ];
    
    let submitButton = null;
    let usedSubmitSelector = '';
    
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.count() > 0) {
          submitButton = button.first();
          usedSubmitSelector = selector;
          console.log(`✅ 找到提交按鈕: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!submitButton) {
      console.log('❌ 未找到提交按鈕，嘗試直接提交表單');
      await page.screenshot({ path: 'product-857-07-no-submit-button.png', fullPage: true });
      
      // 嘗試直接提交表單
      try {
        await page.locator('form').first().press('Enter');
        console.log('✅ 嘗試使用 Enter 提交表單');
      } catch (error) {
        console.log(`❌ 無法提交表單: ${error.message}`);
        return;
      }
    } else {
      // 點擊提交按鈕
      console.log('🚀 點擊提交按鈕...');
      const submitStart = Date.now();
      
      try {
        await submitButton.click();
        console.log('✅ 提交按鈕點擊成功');
      } catch (error) {
        console.error(`❌ 點擊提交按鈕失敗: ${error.message}`);
        await page.screenshot({ path: 'product-857-08-submit-click-error.png', fullPage: true });
        return;
      }
    }
    
    // 等待響應
    console.log('⏳ 等待表單提交響應...');
    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      const submitTime = Date.now() - (page.submitStart || Date.now());
      console.log(`⏱️ 表單提交處理時間: ${submitTime}ms`);
    } catch (error) {
      console.log(`⚠️ 等待響應超時: ${error.message}`);
    }
    
    await page.screenshot({ path: 'product-857-09-after-submit.png', fullPage: true });
    
    // 檢查提交後的 URL 和內容
    const afterSubmitUrl = page.url();
    console.log(`🔗 提交後 URL: ${afterSubmitUrl}`);
    
    const pageContent = await page.textContent('body');
    
    // 檢查是否有錯誤
    const errorPatterns = [
      'HTTP 500',
      'Internal Server Error',
      'Server Error',
      '500 Internal Server Error',
      'SQLSTATE',
      'Exception',
      'Error:',
      'Fatal error',
      'Whoops',
      'Something went wrong'
    ];
    
    const foundErrors = [];
    errorPatterns.forEach(pattern => {
      if (pageContent.includes(pattern)) {
        foundErrors.push(pattern);
      }
    });
    
    // 檢查是否有成功訊息
    const successPatterns = [
      '成功',
      'Success',
      'successfully',
      '更新完成',
      'Updated',
      'saved',
      '已儲存',
      '已更新'
    ];
    
    const foundSuccess = [];
    successPatterns.forEach(pattern => {
      if (pageContent.toLowerCase().includes(pattern.toLowerCase())) {
        foundSuccess.push(pattern);
      }
    });
    
    console.log('\n📊 提交結果分析:');
    if (foundErrors.length > 0) {
      console.log('❌ 發現錯誤模式:');
      foundErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ 未發現明顯錯誤模式');
    }
    
    if (foundSuccess.length > 0) {
      console.log('✅ 發現成功模式:');
      foundSuccess.forEach(success => console.log(`  - ${success}`));
    } else {
      console.log('⚠️ 未發現明顯成功模式');
    }
    
    // 分析網路請求
    const relevantLogs = page.networkLogs.filter(log => 
      log.url.includes('/products/857') || 
      (log.url.includes('/api/products') && log.type === 'request' && (log.method === 'PUT' || log.method === 'POST' || log.method === 'PATCH'))
    );
    
    console.log('\n🌐 相關網路請求分析:');
    if (relevantLogs.length > 0) {
      relevantLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. [${log.type.toUpperCase()}] ${log.method || ''} ${log.status || ''} - ${log.url}`);
        console.log(`     時間: ${log.timestamp}`);
      });
    } else {
      console.log('  ⚠️ 未發現相關的網路請求');
    }
    
    // 檢查是否有 HTTP 500 錯誤
    const http500Logs = page.networkLogs.filter(log => log.status === 500);
    if (http500Logs.length > 0) {
      console.log('\n❌ 發現 HTTP 500 錯誤:');
      http500Logs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.url} - ${log.statusText}`);
      });
    }
  });

  test('步驟 6：最終分析和總結', async () => {
    console.log('📋 進行最終分析和總結...');
    
    await page.screenshot({ path: 'product-857-10-final-state.png', fullPage: true });
    
    // 獲取最終狀態
    const finalUrl = page.url();
    const finalTitle = await page.title();
    const pageContent = await page.textContent('body');
    
    console.log('\n🎯 最終測試結果總結:');
    console.log(`🔗 最終 URL: ${finalUrl}`);
    console.log(`📄 最終頁面標題: ${finalTitle}`);
    
    // 檢查是否成功返回產品列表或編輯頁面
    const isOnProductsList = finalUrl.includes('/products') && !finalUrl.includes('/edit');
    const isOnEditPage = finalUrl.includes('/products/857/edit');
    const isOnShowPage = finalUrl.includes('/products/857') && !finalUrl.includes('/edit');
    
    console.log(`📍 頁面位置分析:`);
    console.log(`  - 產品列表頁: ${isOnProductsList ? '✅' : '❌'}`);
    console.log(`  - 產品編輯頁: ${isOnEditPage ? '✅' : '❌'}`);
    console.log(`  - 產品查看頁: ${isOnShowPage ? '✅' : '❌'}`);
    
    // 功能測試總結
    const networkErrors = page.networkLogs.filter(log => log.status >= 400);
    const networkRequests = page.networkLogs.filter(log => log.type === 'request');
    const networkResponses = page.networkLogs.filter(log => log.type === 'response');
    
    console.log(`\n📊 功能測試總結:`);
    console.log(`  - 總網路請求: ${networkRequests.length}`);
    console.log(`  - 總網路回應: ${networkResponses.length}`);
    console.log(`  - 錯誤回應數: ${networkErrors.length}`);
    
    if (networkErrors.length > 0) {
      console.log(`\n❌ 錯誤詳情:`);
      networkErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.status} ${error.statusText} - ${error.url}`);
      });
    }
    
    // 檢查產品更新請求
    const updateRequests = page.networkLogs.filter(log => 
      log.type === 'request' && 
      (log.method === 'PUT' || log.method === 'POST' || log.method === 'PATCH') &&
      log.url.includes('/products')
    );
    
    if (updateRequests.length > 0) {
      console.log(`\n📤 產品更新請求:`);
      updateRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.method} ${req.url}`);
      });
    } else {
      console.log(`\n⚠️ 未檢測到產品更新請求`);
    }
    
    // 最終結論
    const hasErrors = networkErrors.length > 0 || pageContent.includes('500') || pageContent.includes('Error');
    const hasSuccess = pageContent.includes('成功') || pageContent.includes('Success') || isOnProductsList || isOnShowPage;
    
    console.log(`\n🏁 最終結論:`);
    if (hasErrors) {
      console.log(`❌ 測試發現錯誤，需要進一步調查`);
    } else if (hasSuccess) {
      console.log(`✅ 測試基本成功，功能運作正常`);
    } else {
      console.log(`⚠️ 測試結果不明確，需要手動驗證`);
    }
    
    console.log(`\n🎯 測試完成！請檢查生成的截圖了解詳細情況。`);
  });
});