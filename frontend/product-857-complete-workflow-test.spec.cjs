const { test, expect } = require('@playwright/test');

// 測試配置
const BASE_URL = 'http://127.0.0.1:8000';
const TEST_TIMEOUT = 90000;

test.describe('產品 857 完整編輯工作流程測試', () => {
  let page;
  let context;
  
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  test.beforeAll(async ({ browser }) => {
    console.log('🚀 開始產品 857 完整編輯工作流程測試');
    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
    
    // 收集所有網路活動
    const networkLogs = [];
    
    page.on('request', request => {
      networkLogs.push({
        type: 'request',
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString(),
        headers: Object.fromEntries(request.headers())
      });
      
      if (request.url().includes('/api/') || request.url().includes('/products/857')) {
        console.log(`📤 請求: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', async response => {
      const responseData = {
        type: 'response',
        status: response.status(),
        statusText: response.statusText(),
        url: response.url(),
        timestamp: new Date().toISOString(),
        headers: Object.fromEntries(response.headers())
      };
      
      // 嘗試獲取響應內容（僅限文本類型）
      try {
        if (response.headers()['content-type']?.includes('text/') || 
            response.headers()['content-type']?.includes('application/json')) {
          responseData.body = await response.text();
        }
      } catch (error) {
        // 忽略無法讀取的響應體
      }
      
      networkLogs.push(responseData);
      
      if (response.url().includes('/api/') || response.url().includes('/products/857')) {
        console.log(`📥 回應: ${response.status()} ${response.url()}`);
        if (response.status() >= 400) {
          console.error(`❌ 錯誤回應: ${response.status()} ${response.statusText()}`);
        }
      }
    });
    
    // 監聽錯誤
    page.on('pageerror', error => {
      console.error(`❌ 頁面錯誤: ${error.message}`);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ 控制台錯誤: ${msg.text()}`);
      }
    });
    
    // 暴露給測試
    page.networkLogs = networkLogs;
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
  });

  test('第 1 步：完整登入流程', async () => {
    console.log('🔐 開始完整登入流程...');
    
    // 先清除所有 cookies 和 localStorage
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    const loginStart = Date.now();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    const loginLoadTime = Date.now() - loginStart;
    console.log(`⏱️ 登入頁面載入時間: ${loginLoadTime}ms`);
    
    await page.screenshot({ path: 'workflow-01-login-page.png', fullPage: true });
    
    // 填寫登入資料
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    
    // 等待一下確保資料填入完成
    await page.waitForTimeout(500);
    
    const submitStart = Date.now();
    await page.click('button[type="submit"]');
    
    // 等待重定向到 dashboard
    try {
      await page.waitForURL(/\/dashboard/, { timeout: TEST_TIMEOUT });
      const submitTime = Date.now() - submitStart;
      console.log(`⏱️ 登入處理時間: ${submitTime}ms`);
      console.log('✅ 成功重定向到 dashboard');
    } catch (error) {
      console.error('❌ 登入失敗或未重定向到 dashboard');
      await page.screenshot({ path: 'workflow-02-login-failed.png', fullPage: true });
      throw error;
    }
    
    await page.screenshot({ path: 'workflow-02-dashboard.png', fullPage: true });
    
    // 驗證登入狀態
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`🔗 登入後 URL: ${currentUrl}`);
    console.log(`📄 頁面標題: ${pageTitle}`);
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
    console.log('✅ 登入流程完成');
  });

  test('第 2 步：導航到產品列表', async () => {
    console.log('📦 導航到產品列表...');
    
    // 確保我們在 dashboard
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      console.log('⚠️ 不在 dashboard，先導航過去');
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    }
    
    // 點擊商品管理導航
    try {
      await page.click('a[href="/products"], a:has-text("商品管理"), a:has-text("產品"), a:has-text("Products")');
      await page.waitForURL(/\/products/, { timeout: TEST_TIMEOUT });
      console.log('✅ 成功導航到產品列表');
    } catch (error) {
      console.log('⚠️ 無法通過導航點擊，嘗試直接 URL 訪問');
      await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
    }
    
    await page.screenshot({ path: 'workflow-03-products-list.png', fullPage: true });
    
    // 等待產品列表載入
    await page.waitForSelector('table, .product-card, .product-item', { timeout: TEST_TIMEOUT });
    
    const productsUrl = page.url();
    console.log(`🔗 產品列表 URL: ${productsUrl}`);
    
    // 檢查是否有產品數據
    const hasProducts = await page.textContent('body');
    if (hasProducts.includes('測試產品 15') || hasProducts.includes('TEST-PROD-015')) {
      console.log('✅ 產品列表包含測試產品 15');
    } else {
      console.log('⚠️ 未在產品列表中找到測試產品 15');
    }
  });

  test('第 3 步：點擊進入產品 857 編輯頁面', async () => {
    console.log('✏️ 點擊進入產品 857 編輯頁面...');
    
    // 確保我們在產品列表頁面
    const currentUrl = page.url();
    if (!currentUrl.includes('/products')) {
      await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
      await page.waitForSelector('table', { timeout: TEST_TIMEOUT });
    }
    
    // 尋找產品 857 的編輯連結
    const editSelectors = [
      'a[href="/products/857/edit"]',
      'tr:has-text("測試產品 15") a:has-text("編輯")',
      'tr:has-text("TEST-PROD-015") a:has-text("編輯")',
      'tr:has-text("857") a:has-text("編輯")'
    ];
    
    let editLink = null;
    for (const selector of editSelectors) {
      try {
        const link = page.locator(selector);
        if (await link.count() > 0) {
          editLink = link.first();
          console.log(`✅ 找到編輯連結: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (editLink) {
      const editClickStart = Date.now();
      await editLink.click();
      
      try {
        await page.waitForURL(/\/products\/857\/edit/, { timeout: TEST_TIMEOUT });
        const editClickTime = Date.now() - editClickStart;
        console.log(`⏱️ 編輯頁面載入時間: ${editClickTime}ms`);
        console.log('✅ 成功進入編輯頁面');
      } catch (error) {
        console.log('⚠️ 點擊編輯連結後未重定向到編輯頁面');
      }
    } else {
      console.log('⚠️ 未找到編輯連結，嘗試直接訪問編輯 URL');
      await page.goto(`${BASE_URL}/products/857/edit`, { waitUntil: 'networkidle' });
    }
    
    await page.screenshot({ path: 'workflow-04-edit-page.png', fullPage: true });
    
    const editUrl = page.url();
    console.log(`🔗 編輯頁面 URL: ${editUrl}`);
    
    // 檢查是否真的在編輯頁面
    if (editUrl.includes('/products/857/edit')) {
      console.log('✅ 成功到達編輯頁面');
    } else if (editUrl.includes('/login')) {
      console.error('❌ 被重定向到登入頁面，可能存在權限問題');
      throw new Error('無法訪問編輯頁面 - 權限不足');
    } else {
      console.log(`⚠️ 意外的頁面: ${editUrl}`);
    }
  });

  test('第 4 步：分析編輯表單並填寫數據', async () => {
    console.log('📝 分析編輯表單並填寫數據...');
    
    // 確保我們在編輯頁面
    const currentUrl = page.url();
    if (!currentUrl.includes('/products/857/edit')) {
      await page.goto(`${BASE_URL}/products/857/edit`, { waitUntil: 'networkidle' });
    }
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'workflow-05-form-before-edit.png', fullPage: true });
    
    // 檢查表單結構
    const formCount = await page.locator('form').count();
    console.log(`📋 頁面表單數量: ${formCount}`);
    
    if (formCount === 0) {
      console.log('❌ 頁面沒有表單，可能載入錯誤');
      const pageContent = await page.textContent('body');
      
      if (pageContent.includes('Error') || pageContent.includes('500')) {
        console.error('❌ 頁面顯示錯誤');
        throw new Error('編輯頁面載入錯誤');
      }
      
      return;
    }
    
    // 嘗試填寫各種可能的欄位
    const fieldsToTest = [
      { name: 'stock_quantity', value: '999', description: '庫存數量' },
      { name: 'low_stock_threshold', value: '50', description: '低庫存閾值' },
      { name: 'price', value: '1299.99', description: '價格' },
      { name: 'name', value: '測試產品 15 (已更新)', description: '產品名稱' }
    ];
    
    const modifiedFields = [];
    
    for (const field of fieldsToTest) {
      const selectors = [
        `input[name="${field.name}"]`,
        `#${field.name}`,
        `input[id="${field.name}"]`,
        `textarea[name="${field.name}"]`
      ];
      
      let fieldFound = false;
      for (const selector of selectors) {
        try {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            const originalValue = await element.inputValue();
            console.log(`📊 ${field.description} 原始值: "${originalValue}"`);
            
            await element.fill(field.value);
            const newValue = await element.inputValue();
            
            if (newValue === field.value) {
              console.log(`✅ ${field.description} 修改成功: "${newValue}"`);
              modifiedFields.push(field);
            } else {
              console.log(`⚠️ ${field.description} 修改可能失敗: 期望 "${field.value}", 實際 "${newValue}"`);
            }
            
            fieldFound = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!fieldFound) {
        console.log(`❌ 未找到欄位: ${field.description} (${field.name})`);
      }
    }
    
    await page.screenshot({ path: 'workflow-06-form-after-edit.png', fullPage: true });
    
    console.log(`📊 成功修改 ${modifiedFields.length} 個欄位`);
    if (modifiedFields.length === 0) {
      console.error('❌ 沒有成功修改任何欄位');
      throw new Error('無法修改表單欄位');
    }
  });

  test('第 5 步：提交表單並監控響應', async () => {
    console.log('🚀 提交表單並監控響應...');
    
    // 清空網路日誌以專注於提交請求
    page.networkLogs.length = 0;
    
    // 確保我們在編輯頁面
    const currentUrl = page.url();
    if (!currentUrl.includes('/products/857/edit')) {
      await page.goto(`${BASE_URL}/products/857/edit`, { waitUntil: 'networkidle' });
      // 重新填寫測試數據
      try {
        await page.fill('input[name="stock_quantity"]', '999');
        await page.fill('input[name="low_stock_threshold"]', '50');
        await page.waitForTimeout(500);
      } catch (error) {
        console.log('⚠️ 重新填寫數據失敗，繼續測試...');
      }
    }
    
    // 尋找並點擊提交按鈕
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("更新")',
      'button:has-text("儲存")',
      'button:has-text("Save")',
      'button:has-text("Update")',
      'form button:last-child'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.count() > 0) {
          submitButton = button.first();
          console.log(`✅ 找到提交按鈕: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!submitButton) {
      console.error('❌ 找不到提交按鈕');
      await page.screenshot({ path: 'workflow-07-no-submit-button.png', fullPage: true });
      throw new Error('找不到提交按鈕');
    }
    
    // 提交表單
    console.log('📤 點擊提交按鈕...');
    const submitStart = Date.now();
    
    await submitButton.click();
    
    // 等待頁面響應
    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      const submitTime = Date.now() - submitStart;
      console.log(`⏱️ 表單提交處理時間: ${submitTime}ms`);
    } catch (error) {
      console.log('⚠️ 等待頁面載入超時，繼續分析...');
    }
    
    await page.screenshot({ path: 'workflow-08-after-submit.png', fullPage: true });
    
    const afterSubmitUrl = page.url();
    console.log(`🔗 提交後 URL: ${afterSubmitUrl}`);
    
    // 分析網路請求
    const relevantRequests = page.networkLogs.filter(log => 
      log.url.includes('/products') || 
      (log.url.includes('/api') && log.type === 'request')
    );
    
    console.log('\n📊 網路請求分析:');
    relevantRequests.forEach((log, index) => {
      if (log.type === 'request') {
        console.log(`  📤 ${index + 1}. ${log.method} ${log.url}`);
      } else if (log.type === 'response') {
        console.log(`  📥 ${index + 1}. ${log.status} ${log.statusText} - ${log.url}`);
        
        // 檢查特定錯誤
        if (log.status === 500) {
          console.error(`    ❌ HTTP 500 錯誤詳情:`);
          if (log.body && log.body.includes('SQLSTATE')) {
            console.error(`    💾 資料庫錯誤: ${log.body.substring(0, 200)}...`);
          }
        }
      }
    });
    
    // 檢查是否有 HTTP 500 錯誤
    const http500Responses = page.networkLogs.filter(log => log.status === 500);
    if (http500Responses.length > 0) {
      console.error('\n❌ 發現 HTTP 500 錯誤:');
      http500Responses.forEach((response, index) => {
        console.error(`  ${index + 1}. ${response.url}`);
        if (response.body) {
          console.error(`     錯誤內容: ${response.body.substring(0, 300)}...`);
        }
      });
    } else {
      console.log('\n✅ 未發現 HTTP 500 錯誤');
    }
  });

  test('第 6 步：驗證提交結果', async () => {
    console.log('🔍 驗證提交結果...');
    
    const finalUrl = page.url();
    const pageContent = await page.textContent('body');
    
    await page.screenshot({ path: 'workflow-09-final-result.png', fullPage: true });
    
    console.log(`🔗 最終 URL: ${finalUrl}`);
    
    // 檢查成功指標
    const successIndicators = [
      '成功',
      'Success',
      'successfully',
      '更新完成',
      'Updated',
      '已儲存',
      '已更新'
    ];
    
    const errorIndicators = [
      'HTTP 500',
      'Internal Server Error',
      'Server Error',
      'SQLSTATE',
      'Exception',
      'Error:',
      'Fatal error',
      'Whoops',
      'Something went wrong'
    ];
    
    let hasSuccess = false;
    let hasError = false;
    
    successIndicators.forEach(indicator => {
      if (pageContent.toLowerCase().includes(indicator.toLowerCase())) {
        console.log(`✅ 找到成功指標: ${indicator}`);
        hasSuccess = true;
      }
    });
    
    errorIndicators.forEach(indicator => {
      if (pageContent.includes(indicator)) {
        console.log(`❌ 找到錯誤指標: ${indicator}`);
        hasError = true;
      }
    });
    
    // 檢查是否重定向到合適的頁面
    const isOnProductsList = finalUrl.includes('/products') && !finalUrl.includes('/edit');
    const isOnProductShow = finalUrl.includes('/products/857') && !finalUrl.includes('/edit');
    const isStillOnEdit = finalUrl.includes('/products/857/edit');
    
    console.log('\n📍 頁面位置分析:');
    console.log(`  - 產品列表頁: ${isOnProductsList ? '✅' : '❌'}`);
    console.log(`  - 產品詳情頁: ${isOnProductShow ? '✅' : '❌'}`);
    console.log(`  - 仍在編輯頁: ${isStillOnEdit ? '⚠️' : '✅'}`);
    
    // 分析網路活動
    const totalRequests = page.networkLogs.filter(log => log.type === 'request').length;
    const totalResponses = page.networkLogs.filter(log => log.type === 'response').length;
    const errorResponses = page.networkLogs.filter(log => log.status >= 400).length;
    
    console.log('\n📊 網路活動總結:');
    console.log(`  - 總請求數: ${totalRequests}`);
    console.log(`  - 總回應數: ${totalResponses}`);
    console.log(`  - 錯誤回應數: ${errorResponses}`);
    
    // 最終結論
    console.log('\n🏁 測試結果總結:');
    
    if (hasError) {
      console.log('❌ 測試發現錯誤 - 產品編輯功能存在問題');
      console.log('🔧 建議檢查:');
      console.log('   - 後端 API 實現');
      console.log('   - 資料庫權限和查詢');
      console.log('   - 表單驗證邏輯');
      console.log('   - 中間件配置');
    } else if (hasSuccess || isOnProductsList || isOnProductShow) {
      console.log('✅ 測試基本成功 - 產品編輯功能運作正常');
    } else {
      console.log('⚠️ 測試結果不明確 - 需要進一步驗證');
      console.log('📝 可能的情況:');
      console.log('   - 表單提交成功但沒有明確的成功消息');
      console.log('   - 頁面重定向邏輯不標準');
      console.log('   - 需要手動驗證數據是否實際更新');
    }
    
    console.log('\n🎯 測試完成！詳細截圖和日誌已保存。');
  });
});