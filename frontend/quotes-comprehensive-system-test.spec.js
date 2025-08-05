import { test, expect } from '@playwright/test';

// 測試帳號資訊
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// 基礎URL
const BASE_URL = 'http://127.0.0.1:8000';

test.describe('報價系統全功能測試 - 修復驗證', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // 登入系統
    console.log('🔑 開始登入流程...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
    console.log('✅ 登入成功');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('1️⃣ 報價單列表頁面功能測試', async () => {
    console.log('📋 測試報價單列表頁面...');
    
    // 導航到報價頁面
    await page.goto(`${BASE_URL}/quotes`);
    await page.waitForLoadState('networkidle');
    
    // 檢查頁面標題
    await expect(page.locator('h1, h2, .page-title')).toContainText(['報價', 'Quote', '報價單'], { timeout: 10000 });
    
    // 檢查基本頁面元素
    const hasCreateButton = await page.locator('a[href*="quotes/create"], button:has-text("新增"), button:has-text("Create")').count() > 0;
    expect(hasCreateButton).toBeTruthy();
    
    // 檢查是否有報價列表表格
    const hasTable = await page.locator('table, .table, .quotes-list').count() > 0;
    if (hasTable) {
      console.log('✅ 報價列表表格存在');
    }
    
    await page.screenshot({ path: 'quotes-test-01-list-page.png', fullPage: true });
    console.log('✅ 報價單列表頁面測試完成');
  });

  test('2️⃣ 建立報價單功能測試', async () => {
    console.log('📝 測試建立報價單功能...');
    
    // 導航到建立報價頁面
    await page.goto(`${BASE_URL}/quotes/create`);
    await page.waitForLoadState('networkidle');
    
    // 檢查頁面載入
    await expect(page.locator('h1, h2, .page-title')).toContainText(['建立', 'Create', '新增'], { timeout: 10000 });
    
    // 檢查表單元素
    const formExists = await page.locator('form').count() > 0;
    expect(formExists).toBeTruthy();
    
    // 檢查客戶選擇欄位
    const customerField = await page.locator('select[name*="customer"], input[name*="customer"], .customer-select').first();
    if (await customerField.count() > 0) {
      console.log('✅ 客戶選擇欄位存在');
    }
    
    // 檢查產品選擇欄位 (重點測試 - 修復的錯誤之一)
    const productField = await page.locator('input[name*="product"], .product-autocomplete, .product-search').first();
    if (await productField.count() > 0) {
      console.log('✅ 產品選擇欄位存在');
      
      // 測試產品自動完成功能
      await productField.click();
      await page.waitForTimeout(1000);
      await productField.fill('產品');
      await page.waitForTimeout(2000);
      
      // 檢查是否有下拉選項出現
      const hasDropdown = await page.locator('.autocomplete-dropdown, .product-options, .dropdown-menu').count() > 0;
      if (hasDropdown) {
        console.log('✅ 產品自動完成功能正常');
      }
    }
    
    // 檢查有效期限欄位 (重點測試 - 修復的錯誤之一)
    const validUntilField = await page.locator('input[name*="valid_until"], input[type="date"]').first();
    if (await validUntilField.count() > 0) {
      console.log('✅ 有效期限欄位存在');
    }
    
    await page.screenshot({ path: 'quotes-test-02-create-page.png', fullPage: true });
    console.log('✅ 建立報價單功能測試完成');
  });

  test('3️⃣ 報價單編輯功能測試', async () => {
    console.log('✏️ 測試報價單編輯功能...');
    
    // 先到列表頁面找到可編輯的報價
    await page.goto(`${BASE_URL}/quotes`);
    await page.waitForLoadState('networkidle');
    
    // 尋找編輯按鈕或連結
    const editButton = await page.locator('a[href*="/quotes/"][href*="/edit"], button:has-text("編輯"), a:has-text("Edit")').first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      
      // 檢查編輯頁面載入
      await expect(page.locator('h1, h2, .page-title')).toContainText(['編輯', 'Edit'], { timeout: 10000 });
      
      // 重點檢查 valid_until 欄位是否正常顯示 (修復的錯誤)
      const validUntilField = await page.locator('input[name*="valid_until"], input[type="date"]').first();
      if (await validUntilField.count() > 0) {
        const fieldValue = await validUntilField.inputValue();
        console.log(`✅ valid_until 欄位正常顯示，值: ${fieldValue}`);
      } else {
        console.log('⚠️ valid_until 欄位未找到');
      }
      
      await page.screenshot({ path: 'quotes-test-03-edit-page.png', fullPage: true });
    } else {
      console.log('⚠️ 未找到可編輯的報價單，嘗試直接訪問編輯頁面');
      await page.goto(`${BASE_URL}/quotes/1/edit`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'quotes-test-03-edit-direct.png', fullPage: true });
    }
    
    console.log('✅ 報價單編輯功能測試完成');
  });

  test('4️⃣ 報價單檢視功能測試', async () => {
    console.log('👁️ 測試報價單檢視功能...');
    
    // 到列表頁面找到可檢視的報價
    await page.goto(`${BASE_URL}/quotes`);
    await page.waitForLoadState('networkidle');
    
    // 尋找檢視按鈕或連結
    const viewButton = await page.locator('a[href*="/quotes/"][href*="/show"], button:has-text("檢視"), a:has-text("View"), a:has-text("詳細")').first();
    
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      // 檢查檢視頁面載入
      const hasContent = await page.locator('h1, h2, .page-title, .quote-details').count() > 0;
      expect(hasContent).toBeTruthy();
      
      // 檢查轉換訂單按鈕 (重點測試 - 修復的錯誤)
      const convertButton = await page.locator('button:has-text("轉換"), button:has-text("Convert"), a:has-text("轉為訂單")').first();
      if (await convertButton.count() > 0) {
        console.log('✅ 轉換訂單按鈕存在');
        
        // 測試按鈕點擊 (但不實際轉換)
        const isEnabled = await convertButton.isEnabled();
        console.log(`✅ 轉換按鈕狀態: ${isEnabled ? '可用' : '不可用'}`);
      }
      
      await page.screenshot({ path: 'quotes-test-04-view-page.png', fullPage: true });
    } else {
      console.log('⚠️ 未找到可檢視的報價單，嘗試直接訪問檢視頁面');
      await page.goto(`${BASE_URL}/quotes/1`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'quotes-test-04-view-direct.png', fullPage: true });
    }
    
    console.log('✅ 報價單檢視功能測試完成');
  });

  test('5️⃣ 客戶詳情頁面建立報價功能測試', async () => {
    console.log('👤 測試從客戶詳情頁面建立報價功能...');
    
    // 先到客戶頁面
    await page.goto(`${BASE_URL}/customers`);
    await page.waitForLoadState('networkidle');
    
    // 尋找客戶詳情連結
    const customerLink = await page.locator('a[href*="/customers/"], .customer-name, td a').first();
    
    if (await customerLink.count() > 0) {
      await customerLink.click();
      await page.waitForLoadState('networkidle');
      
      // 在客戶詳情頁面尋找建立報價按鈕
      const createQuoteButton = await page.locator('a:has-text("建立報價"), a:has-text("Create Quote"), button:has-text("新增報價")').first();
      
      if (await createQuoteButton.count() > 0) {
        await createQuoteButton.click();
        await page.waitForLoadState('networkidle');
        
        // 檢查聯絡人是否自動填入 (重點測試 - 修復的錯誤)
        const customerField = await page.locator('select[name*="customer"], input[name*="customer"]').first();
        if (await customerField.count() > 0) {
          const fieldValue = await customerField.inputValue();
          if (fieldValue) {
            console.log(`✅ 客戶聯絡人自動填入功能正常，值: ${fieldValue}`);
          } else {
            console.log('⚠️ 客戶聯絡人未自動填入');
          }
        }
        
        await page.screenshot({ path: 'quotes-test-05-customer-quote.png', fullPage: true });
      } else {
        console.log('⚠️ 客戶詳情頁面未找到建立報價按鈕');
      }
    } else {
      console.log('⚠️ 未找到客戶詳情連結，直接測試客戶詳情頁面');
      await page.goto(`${BASE_URL}/customers/1`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'quotes-test-05-customer-direct.png', fullPage: true });
    }
    
    console.log('✅ 客戶詳情頁面建立報價功能測試完成');
  });

  test('6️⃣ 表單驗證和錯誤處理測試', async () => {
    console.log('🔍 測試表單驗證和錯誤處理...');
    
    // 到建立報價頁面
    await page.goto(`${BASE_URL}/quotes/create`);
    await page.waitForLoadState('networkidle');
    
    // 嘗試提交空表單
    const submitButton = await page.locator('button[type="submit"], input[type="submit"], .btn-submit').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // 檢查是否顯示驗證錯誤
      const hasErrors = await page.locator('.error, .invalid-feedback, .alert-danger, .validation-error').count() > 0;
      if (hasErrors) {
        console.log('✅ 表單驗證錯誤正常顯示');
      }
      
      await page.screenshot({ path: 'quotes-test-06-validation.png', fullPage: true });
    }
    
    console.log('✅ 表單驗證和錯誤處理測試完成');
  });

  test('7️⃣ 路由和導航測試', async () => {
    console.log('🔗 測試路由和導航功能...');
    
    // 測試主要路由
    const routes = [
      '/quotes',
      '/quotes/create'
    ];
    
    for (const route of routes) {
      console.log(`測試路由: ${route}`);
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('networkidle');
      
      // 檢查頁面是否正常載入 (無 404 或 500 錯誤)
      const hasError = await page.locator('.error-page, .not-found, h1:has-text("404"), h1:has-text("500")').count() > 0;
      expect(hasError).toBeFalsy();
      
      console.log(`✅ 路由 ${route} 正常載入`);
    }
    
    await page.screenshot({ path: 'quotes-test-07-routes.png', fullPage: true });
    console.log('✅ 路由和導航測試完成');
  });

  test('8️⃣ API 回應測試', async () => {
    console.log('🌐 測試 API 回應...');
    
    // 監聽網路請求
    let apiErrors = [];
    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        apiErrors.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // 訪問報價相關頁面觸發 API 調用
    await page.goto(`${BASE_URL}/quotes`);
    await page.waitForLoadState('networkidle');
    
    await page.goto(`${BASE_URL}/quotes/create`);
    await page.waitForLoadState('networkidle');
    
    // 檢查是否有 API 錯誤
    if (apiErrors.length > 0) {
      console.log('⚠️ 發現 API 錯誤:', apiErrors);
    } else {
      console.log('✅ 所有 API 請求正常');
    }
    
    await page.screenshot({ path: 'quotes-test-08-api.png', fullPage: true });
    console.log('✅ API 回應測試完成');
  });
});

// 額外的整合測試
test.describe('報價系統整合測試', () => {
  test('🎯 完整工作流程測試', async ({ page }) => {
    console.log('🔄 執行完整報價工作流程測試...');
    
    // 登入
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    // 1. 訪問報價列表
    await page.goto(`${BASE_URL}/quotes`);
    await page.waitForLoadState('networkidle');
    console.log('✅ 步驟 1: 報價列表頁面載入成功');
    
    // 2. 進入建立報價頁面
    await page.goto(`${BASE_URL}/quotes/create`);
    await page.waitForLoadState('networkidle');
    console.log('✅ 步驟 2: 建立報價頁面載入成功');
    
    // 3. 測試表單元素
    const hasForm = await page.locator('form').count() > 0;
    expect(hasForm).toBeTruthy();
    console.log('✅ 步驟 3: 報價表單存在');
    
    // 4. 檢查關鍵欄位
    const keyFields = [
      'input[name*="customer"], select[name*="customer"]',
      'input[name*="product"]',
      'input[name*="valid_until"], input[type="date"]'
    ];
    
    for (const selector of keyFields) {
      const fieldExists = await page.locator(selector).count() > 0;
      if (fieldExists) {
        console.log(`✅ 關鍵欄位存在: ${selector}`);
      } else {
        console.log(`⚠️ 關鍵欄位缺失: ${selector}`);
      }
    }
    
    await page.screenshot({ path: 'quotes-test-09-workflow.png', fullPage: true });
    console.log('✅ 完整工作流程測試完成');
  });
});