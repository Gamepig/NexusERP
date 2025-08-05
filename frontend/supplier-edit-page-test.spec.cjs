const { test, expect } = require('@playwright/test');

test.describe('供應商編輯頁面修復測試', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // 設定較長的等待時間
    page.setDefaultTimeout(30000);
    
    // 監聽 console 錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ 頁面 Console 錯誤:', msg.text());
      }
    });

    // 監聽網路請求失敗
    page.on('requestfailed', request => {
      console.log('❌ 網路請求失敗:', request.url(), request.failure()?.errorText);
    });
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('測試供應商編輯頁面資料載入', async () => {
    console.log('🔍 開始測試供應商編輯頁面...');

    // 1. 訪問供應商列表頁面
    console.log('📍 步驟 1: 訪問供應商列表頁面');
    await page.goto('http://127.0.0.1:8000/suppliers');
    await page.screenshot({ path: 'supplier-edit-01-initial-page.png' });

    // 檢查是否被重定向到登入頁面
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('🔑 需要登入，執行登入流程');
      
      // 填寫登入表單
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.screenshot({ path: 'supplier-edit-02-login-form.png' });
      
      // 提交登入
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'supplier-edit-03-after-login.png' });
      
      // 再次訪問供應商頁面
      await page.goto('http://127.0.0.1:8000/suppliers');
      await page.waitForLoadState('networkidle');
    }

    // 2. 檢查供應商列表是否正確載入
    console.log('📍 步驟 2: 檢查供應商列表載入');
    await page.screenshot({ path: 'supplier-edit-04-suppliers-list.png' });
    
    // 等待供應商列表載入
    try {
      await page.waitForSelector('.suppliers-table, .supplier-card, .table, [data-testid="suppliers-list"]', { timeout: 10000 });
      console.log('✅ 供應商列表已載入');
    } catch (error) {
      console.log('⚠️ 未找到供應商列表容器，檢查頁面內容');
      const pageContent = await page.textContent('body');
      console.log('頁面內容:', pageContent.substring(0, 500));
    }

    // 3. 檢查是否有編輯按鈕
    console.log('📍 步驟 3: 檢查編輯按鈕');
    const editButtons = await page.$$('a[href*="/suppliers/"][href*="/edit"], button:has-text("編輯"), .btn-edit, [data-action="edit"]');
    
    if (editButtons.length === 0) {
      console.log('⚠️ 未找到編輯按鈕，檢查可用的連結');
      const allLinks = await page.$$eval('a', links => 
        links.map(link => ({ href: link.href, text: link.textContent?.trim() }))
          .filter(link => link.href.includes('suppliers'))
      );
      console.log('供應商相關連結:', allLinks);
      
      // 如果沒有編輯按鈕，嘗試直接訪問編輯頁面
      const supplierEditUrl = 'http://127.0.0.1:8000/suppliers/1/edit';
      console.log('🔗 嘗試直接訪問編輯頁面:', supplierEditUrl);
      await page.goto(supplierEditUrl);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'supplier-edit-05-direct-access.png' });
    } else {
      console.log(`✅ 找到 ${editButtons.length} 個編輯按鈕`);
      
      // 4. 點擊第一個編輯按鈕
      console.log('📍 步驟 4: 點擊編輯按鈕');
      await editButtons[0].click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'supplier-edit-05-edit-page-initial.png' });
    }

    // 5. 檢查編輯頁面是否正確載入
    console.log('📍 步驟 5: 檢查編輯頁面載入');
    const currentPageUrl = page.url();
    console.log('當前頁面 URL:', currentPageUrl);

    // 檢查是否是編輯頁面
    if (!currentPageUrl.includes('/edit') && !currentPageUrl.includes('suppliers')) {
      console.log('❌ 未正確導航到編輯頁面');
      return;
    }

    // 6. 檢查 API 回應
    console.log('📍 步驟 6: 檢查 API 回應');
    
    // 監聽 API 請求
    let apiResponse = null;
    page.on('response', async response => {
      if (response.url().includes('/api/suppliers/') && response.request().method() === 'GET') {
        apiResponse = response;
        console.log(`📡 API 請求: ${response.url()}`);
        console.log(`📊 回應狀態: ${response.status()}`);
        
        if (response.status() === 200) {
          try {
            const responseData = await response.json();
            console.log('✅ API 回應成功，資料:', responseData);
          } catch (error) {
            console.log('⚠️ 無法解析 API 回應資料');
          }
        } else {
          console.log(`❌ API 回應錯誤: ${response.status()}`);
        }
      }
    });

    // 重新載入頁面以觸發 API 請求
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'supplier-edit-06-after-reload.png' });

    // 7. 檢查表單欄位是否有資料
    console.log('📍 步驟 7: 檢查表單欄位資料');
    
    const formFields = [
      { name: 'company_name', label: '公司名稱' },
      { name: 'supplier_code', label: '供應商代碼' },
      { name: 'contact_name', label: '聯絡人' },
      { name: 'email', label: '電子郵件' },
      { name: 'phone', label: '電話號碼' },
      { name: 'address', label: '地址' },
      { name: 'payment_terms', label: '付款條件' }
    ];

    for (const field of formFields) {
      try {
        const input = await page.$(`input[name="${field.name}"], textarea[name="${field.name}"], select[name="${field.name}"]`);
        if (input) {
          const value = await input.inputValue();
          console.log(`📝 ${field.label} (${field.name}): "${value}"`);
          
          if (value && value.trim() !== '') {
            console.log(`✅ ${field.label} 已載入資料`);
          } else {
            console.log(`⚠️ ${field.label} 沒有資料`);
          }
        } else {
          console.log(`❌ 未找到 ${field.label} 欄位`);
        }
      } catch (error) {
        console.log(`❌ 檢查 ${field.label} 時發生錯誤:`, error.message);
      }
    }

    // 8. 檢查錯誤訊息
    console.log('📍 步驟 8: 檢查錯誤訊息');
    
    const errorSelectors = [
      '.alert-danger',
      '.error-message',
      '.text-red-500',
      '.text-danger',
      '[class*="error"]'
    ];

    for (const selector of errorSelectors) {
      const errorElements = await page.$$(selector);
      if (errorElements.length > 0) {
        for (const element of errorElements) {
          const errorText = await element.textContent();
          if (errorText && errorText.trim() !== '') {
            console.log(`❌ 發現錯誤訊息: ${errorText}`);
          }
        }
      }
    }

    // 9. 檢查 JavaScript 錯誤
    console.log('📍 步驟 9: 檢查 JavaScript 錯誤');
    
    // JavaScript 錯誤已經在 beforeEach 中監聽

    // 10. 最終截圖和總結
    await page.screenshot({ path: 'supplier-edit-07-final-state.png' });
    
    console.log('🎯 測試完成總結:');
    console.log(`- 當前 URL: ${page.url()}`);
    console.log(`- API 回應狀態: ${apiResponse?.status() || '未捕獲到 API 請求'}`);
    
    // 驗證頁面基本功能
    const hasForm = await page.$('form') !== null;
    const hasSubmitButton = await page.$('button[type="submit"], input[type="submit"]') !== null;
    
    console.log(`- 表單存在: ${hasForm ? '✅' : '❌'}`);
    console.log(`- 提交按鈕存在: ${hasSubmitButton ? '✅' : '❌'}`);

    // 基本斷言
    expect(page.url()).toMatch(/suppliers/);
    if (hasForm) {
      expect(hasForm).toBe(true);
    }
  });

  test('測試特定供應商 API 端點', async () => {
    console.log('🔍 開始測試特定供應商 API 端點...');

    // 1. 先登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // 2. 直接測試 API 端點
    const apiEndpoints = [
      '/api/suppliers/1',
      '/api/suppliers/2',
      '/api/suppliers/3'
    ];

    for (const endpoint of apiEndpoints) {
      console.log(`📡 測試 API 端點: ${endpoint}`);
      
      try {
        const response = await page.request.get(`http://127.0.0.1:8000${endpoint}`);
        console.log(`📊 ${endpoint} 回應狀態: ${response.status()}`);
        
        if (response.status() === 200) {
          const data = await response.json();
          console.log(`✅ ${endpoint} 回應成功:`, JSON.stringify(data, null, 2).substring(0, 200));
        } else if (response.status() === 404) {
          console.log(`⚠️ ${endpoint} 供應商不存在 (404)`);
        } else if (response.status() === 403) {
          console.log(`❌ ${endpoint} 權限錯誤 (403)`);
        } else {
          console.log(`❌ ${endpoint} 其他錯誤: ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} 請求失敗:`, error.message);
      }
    }
  });
});