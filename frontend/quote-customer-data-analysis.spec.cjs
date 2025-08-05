/**
 * 報價建立頁面客戶資料載入問題分析腳本
 * 
 * 檢查項目：
 * 1. 訪問 http://127.0.0.1:8000/quotes/create
 * 2. 檢查Network面板是否有客戶相關的API請求
 * 3. 檢查是否有任何API錯誤或失敗
 * 4. 檢查頁面源碼中客戶下拉選單的HTML結構
 * 5. 確認是否有客戶選項被渲染到HTML中
 * 6. 檢查JavaScript控制台是否有錯誤
 * 7. 檢查用戶認證和會話狀態
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://127.0.0.1:8000';
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123'
};

test('報價建立頁面客戶資料載入問題詳細分析', async ({ page }) => {
  console.log('🔍 開始分析報價建立頁面客戶資料載入問題...\n');

  // 監聽所有網路請求
  const networkRequests = [];
  const apiErrors = [];
  const consoleErrors = [];

  page.on('request', (request) => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: new Date().toISOString()
    });
    console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
  });

  page.on('response', async (response) => {
    const isError = response.status() >= 400;
    const responseInfo = {
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      timestamp: new Date().toISOString()
    };

    if (isError) {
      try {
        responseInfo.body = await response.text();
      } catch (e) {
        responseInfo.body = 'Could not read response body';
      }
      apiErrors.push(responseInfo);
      console.log(`❌ ERROR RESPONSE: ${response.status()} ${response.url()}`);
    } else {
      console.log(`✅ SUCCESS RESPONSE: ${response.status()} ${response.url()}`);
    }
  });

  page.on('console', (msg) => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    };
    
    if (msg.type() === 'error') {
      consoleErrors.push(message);
      console.log(`🚨 CONSOLE ERROR: ${msg.text()}`);
    } else {
      console.log(`📝 CONSOLE ${msg.type().toUpperCase()}: ${msg.text()}`);
    }
  });

  try {
    // 步驟 1: 前往登入頁面
    console.log('\n1. 🚪 前往登入頁面...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'quote-customer-analysis-01-login-page.png' });
    console.log('   ✅ 登入頁面截圖已儲存');

    // 步驟 2: 執行登入
    console.log('\n2. 🔐 執行登入...');
    await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    
    // 確保登入按鈕存在並點擊
    const loginButton = page.locator('button[type="submit"]:has-text("Log in"), button:has-text("登入"), button:has-text("Login")').first();
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    
    // 等待登入完成
    await page.waitForURL(/\/dashboard|\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'quote-customer-analysis-02-after-login.png' });
    console.log('   ✅ 登入成功，截圖已儲存');

    // 步驟 3: 檢查會話狀態
    console.log('\n3. 🔍 檢查用戶會話狀態...');
    
    const sessionInfo = await page.evaluate(() => {
      // 檢查是否有認證相關的資訊
      return {
        currentUrl: window.location.href,
        cookies: document.cookie,
        sessionStorage: JSON.stringify(sessionStorage),
        localStorage: JSON.stringify(localStorage),
        csrfToken: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      };
    });
    
    console.log('   📊 會話資訊:');
    console.log(`      - 當前URL: ${sessionInfo.currentUrl}`);
    console.log(`      - CSRF Token: ${sessionInfo.csrfToken ? '存在' : '不存在'}`);
    console.log(`      - Cookies數量: ${sessionInfo.cookies.split(';').length}`);

    // 步驟 4: 前往報價建立頁面
    console.log('\n4. 📄 前往報價建立頁面...');
    
    // 清除之前的請求記錄，專注於報價頁面的請求
    networkRequests.length = 0;
    apiErrors.length = 0;
    consoleErrors.length = 0;
    
    await page.goto(`${BASE_URL}/quotes/create`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 等待任何延遲的API請求
    
    await page.screenshot({ path: 'quote-customer-analysis-03-quotes-create-page.png' });
    console.log('   ✅ 報價建立頁面截圖已儲存');

    // 步驟 5: 檢查頁面是否正確載入
    console.log('\n5. 🔍 檢查頁面內容...');
    
    const pageTitle = await page.title();
    const pageContent = await page.textContent('body');
    
    console.log(`   📋 頁面標題: ${pageTitle}`);
    
    // 檢查是否重定向到登入頁面
    if (page.url().includes('/login')) {
      console.log('   ⚠️  頁面重定向到登入頁面，可能會話已過期');
      throw new Error('頁面重定向到登入頁面，需要重新登入');
    }
    
    // 檢查是否顯示錯誤訊息
    const errorMessages = await page.locator('.alert-danger, .text-red-500, .bg-red-50').allTextContents();
    if (errorMessages.length > 0) {
      console.log('   ⚠️  頁面顯示錯誤訊息:', errorMessages);
    }

    // 步驟 6: 詳細檢查客戶下拉選單
    console.log('\n6. 🔍 檢查客戶下拉選單...');
    
    const customerSelect = page.locator('#customer_id');
    
    // 檢查下拉選單是否存在
    const selectExists = await customerSelect.count() > 0;
    console.log(`   📋 客戶下拉選單存在: ${selectExists}`);
    
    if (selectExists) {
      // 檢查下拉選單的HTML結構
      const selectHTML = await customerSelect.innerHTML();
      console.log('   📄 下拉選單HTML結構:');
      console.log(selectHTML.substring(0, 500) + (selectHTML.length > 500 ? '...' : ''));
      
      // 檢查選項數量
      const options = await customerSelect.locator('option').allTextContents();
      console.log(`   📊 選項總數: ${options.length}`);
      console.log('   📋 前5個選項:');
      options.slice(0, 5).forEach((option, index) => {
        console.log(`      ${index + 1}. ${option.trim()}`);
      });
      
      // 檢查是否有 "請選擇客戶" 預設選項
      const defaultOption = await customerSelect.locator('option[value=""]').textContent();
      console.log(`   🎯 預設選項: ${defaultOption || '無'}`);
      
      // 檢查是否有實際的客戶選項
      const customerOptions = await customerSelect.locator('option[value!=""]').count();
      console.log(`   👥 實際客戶選項數量: ${customerOptions}`);
      
      if (customerOptions === 0) {
        console.log('   ⚠️  沒有發現任何客戶選項！');
      }
    } else {
      console.log('   ❌ 客戶下拉選單不存在！');
    }

    // 步驟 7: 分析網路請求
    console.log('\n7. 📡 分析網路請求...');
    
    // 篩選客戶相關的API請求
    const customerApiRequests = networkRequests.filter(req => 
      req.url.includes('/customers') || 
      req.url.includes('/api/customers') ||
      req.url.includes('customer')
    );
    
    console.log(`   📊 總網路請求數: ${networkRequests.length}`);
    console.log(`   👥 客戶相關請求數: ${customerApiRequests.length}`);
    
    if (customerApiRequests.length > 0) {
      console.log('   📋 客戶相關請求詳情:');
      customerApiRequests.forEach((req, index) => {
        console.log(`      ${index + 1}. ${req.method} ${req.url}`);
      });
    } else {
      console.log('   ⚠️  沒有發現任何客戶相關的API請求！');
    }

    // 步驟 8: 檢查API錯誤
    console.log('\n8. 🚨 檢查API錯誤...');
    
    console.log(`   📊 API錯誤數量: ${apiErrors.length}`);
    
    if (apiErrors.length > 0) {
      console.log('   ❌ API錯誤詳情:');
      apiErrors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error.status} ${error.url}`);
        console.log(`         狀態: ${error.statusText}`);
        if (error.body) {
          console.log(`         回應: ${error.body.substring(0, 200)}...`);
        }
      });
    } else {
      console.log('   ✅ 沒有發現API錯誤');
    }

    // 步驟 9: 檢查JavaScript控制台錯誤
    console.log('\n9. 🐛 檢查JavaScript錯誤...');
    
    console.log(`   📊 控制台錯誤數量: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('   ❌ JavaScript錯誤詳情:');
      consoleErrors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error.text}`);
        if (error.location) {
          console.log(`         位置: ${error.location.url}:${error.location.lineNumber}`);
        }
      });
    } else {
      console.log('   ✅ 沒有發現JavaScript錯誤');
    }

    // 步驟 10: 檢查當前公司上下文
    console.log('\n10. 🏢 檢查公司上下文...');
    
    const companyContext = await page.evaluate(() => {
      // 嘗試查找公司相關的資訊
      const companySelectors = [
        'select[name="company_id"]',
        '#company_id',
        '.company-selector',
        '[data-current-company]'
      ];
      
      const companyInfo = {};
      companySelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          companyInfo[selector] = {
            value: element.value,
            innerHTML: element.innerHTML.substring(0, 200)
          };
        }
      });
      
      return companyInfo;
    });
    
    console.log('   📊 公司上下文資訊:');
    console.log(JSON.stringify(companyContext, null, 2));

    // 步驟 11: 手動觸發客戶資料載入（如果有相關JavaScript）
    console.log('\n11. 🔄 嘗試手動觸發客戶資料載入...');
    
    // 清除之前的請求記錄
    networkRequests.length = 0;
    
    // 嘗試執行可能的客戶載入函數
    await page.evaluate(() => {
      // 檢查是否有客戶載入相關的函數
      const possibleFunctions = [
        'loadCustomers',
        'initCustomers',
        'fetchCustomers',
        'getCustomers'
      ];
      
      possibleFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
          console.log(`🔄 嘗試呼叫 ${funcName}()`);
          try {
            window[funcName]();
          } catch (e) {
            console.log(`❌ 呼叫 ${funcName} 時發生錯誤:`, e.message);
          }
        }
      });
    });
    
    // 等待可能的網路請求
    await page.waitForTimeout(3000);
    
    console.log(`   📡 手動觸發後的新請求數: ${networkRequests.length}`);

    // 最終截圖
    await page.screenshot({ path: 'quote-customer-analysis-04-final-state.png' });
    console.log('\n✅ 分析完成，最終狀態截圖已儲存');

    // 步驟 12: 總結分析結果
    console.log('\n📋 === 分析結果總結 ===');
    
    const summary = {
      pageLoaded: !page.url().includes('/login'),
      customerSelectExists: await customerSelect.count() > 0,
      customerOptionsCount: await customerSelect.locator('option[value!=""]').count(),
      customerApiRequests: customerApiRequests.length,
      apiErrors: apiErrors.length,
      jsErrors: consoleErrors.length,
      hasCompanyContext: Object.keys(companyContext).length > 0
    };
    
    console.log('🎯 關鍵指標:');
    console.log(`   - 頁面正確載入: ${summary.pageLoaded ? '✅' : '❌'}`);
    console.log(`   - 客戶下拉選單存在: ${summary.customerSelectExists ? '✅' : '❌'}`);
    console.log(`   - 客戶選項數量: ${summary.customerOptionsCount}`);
    console.log(`   - 客戶API請求數: ${summary.customerApiRequests}`);
    console.log(`   - API錯誤數: ${summary.apiErrors}`);
    console.log(`   - JavaScript錯誤數: ${summary.jsErrors}`);
    console.log(`   - 公司上下文存在: ${summary.hasCompanyContext ? '✅' : '❌'}`);

    // 問題診斷
    console.log('\n🔍 問題診斷:');
    
    if (!summary.pageLoaded) {
      console.log('   ❌ 主要問題: 頁面未正確載入（可能重定向到登入頁面）');
    } else if (!summary.customerSelectExists) {
      console.log('   ❌ 主要問題: 客戶下拉選單HTML元素不存在');
    } else if (summary.customerOptionsCount === 0) {
      console.log('   ❌ 主要問題: 客戶下拉選單存在但沒有客戶選項');
      
      if (summary.customerApiRequests === 0) {
        console.log('   🔍 可能原因: 沒有發出客戶資料API請求');
      } else if (summary.apiErrors > 0) {
        console.log('   🔍 可能原因: 客戶資料API請求失敗');
      } else {
        console.log('   🔍 可能原因: API請求成功但資料未正確渲染到HTML');
      }
      
      if (!summary.hasCompanyContext) {
        console.log('   🔍 可能原因: 缺少公司上下文，影響多租戶資料篩選');
      }
    } else {
      console.log('   ✅ 客戶資料載入看起來正常');
    }

  } catch (error) {
    console.error('\n❌ 測試執行過程中發生錯誤:', error.message);
    await page.screenshot({ path: 'quote-customer-analysis-error.png' });
    throw error;
  }
});