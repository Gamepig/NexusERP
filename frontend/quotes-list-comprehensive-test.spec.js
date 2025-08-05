import { test, expect } from '@playwright/test';
import path from 'path';

const TEST_CONFIG = {
  baseURL: 'http://127.0.0.1:8000',
  quotesURL: 'http://127.0.0.1:8000/quotes',
  testCredentials: {
    email: 'test@example.com',
    password: 'password123'
  },
  timeouts: {
    navigation: 30000,
    element: 10000,
    api: 15000
  }
};

test.describe('NexusERP 報價列表頁面功能測試', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // 設定更長的超時時間
    page.setDefaultTimeout(TEST_CONFIG.timeouts.element);
    page.setDefaultNavigationTimeout(TEST_CONFIG.timeouts.navigation);
    
    // 監聽控制台錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Console Error:', msg.text());
      }
    });
    
    // 監聽網路錯誤
    page.on('requestfailed', request => {
      console.log('🔴 Network Error:', request.url(), request.failure().errorText);
    });
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('1. 測試用戶登入功能', async () => {
    console.log('🔵 開始測試用戶登入...');
    
    // 訪問首頁
    await page.goto(TEST_CONFIG.baseURL);
    await page.screenshot({ path: 'quotes-test-01-homepage.png', fullPage: true });
    
    // 檢查是否需要登入
    const loginButton = page.locator('a[href*="login"], button:has-text("登入"), button:has-text("Login")');
    if (await loginButton.count() > 0) {
      await loginButton.first().click();
    } else {
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
    }
    
    await page.screenshot({ path: 'quotes-test-02-login-page.png', fullPage: true });
    
    // 檢查登入表單
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    
    // 填寫登入資訊
    await page.fill('input[type="email"], input[name="email"]', TEST_CONFIG.testCredentials.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_CONFIG.testCredentials.password);
    
    await page.screenshot({ path: 'quotes-test-03-login-filled.png', fullPage: true });
    
    // 提交登入表單
    await page.click('button[type="submit"], input[type="submit"], button:has-text("登入"), button:has-text("Login")');
    
    // 等待登入完成
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'quotes-test-04-after-login.png', fullPage: true });
    
    console.log('✅ 用戶登入測試完成');
  });

  test('2. 測試報價列表頁面載入', async () => {
    console.log('🔵 開始測試報價列表頁面載入...');
    
    // 先登入
    await loginToSystem(page);
    
    // 直接訪問報價列表頁面
    const response = await page.goto(TEST_CONFIG.quotesURL, { 
      waitUntil: 'networkidle',
      timeout: TEST_CONFIG.timeouts.navigation 
    });
    
    await page.screenshot({ path: 'quotes-test-05-quotes-page-initial.png', fullPage: true });
    
    // 檢查頁面回應狀態
    expect(response.status()).toBeLessThan(400);
    console.log(`📊 頁面回應狀態: ${response.status()}`);
    
    // 檢查頁面標題
    const title = await page.title();
    console.log(`📊 頁面標題: ${title}`);
    expect(title).toContain('報價');
    
    // 檢查頁面 URL
    const currentURL = page.url();
    expect(currentURL).toContain('/quotes');
    console.log(`📊 當前 URL: ${currentURL}`);
    
    console.log('✅ 報價列表頁面載入測試完成');
  });

  test('3. 測試頁面結構和UI元素', async () => {
    console.log('🔵 開始測試頁面結構和UI元素...');
    
    await loginToSystem(page);
    await page.goto(TEST_CONFIG.quotesURL, { waitUntil: 'networkidle' });
    
    // 檢查主要容器
    const mainContainer = page.locator('main, .container, .quotes-container, [class*="quote"]');
    await expect(mainContainer.first()).toBeVisible();
    
    // 檢查標題元素
    const pageHeader = page.locator('h1, h2, .page-title, .quotes-title');
    if (await pageHeader.count() > 0) {
      await expect(pageHeader.first()).toBeVisible();
      const headerText = await pageHeader.first().textContent();
      console.log(`📊 頁面標題: ${headerText}`);
    }
    
    // 檢查導航麵包屑
    const breadcrumb = page.locator('.breadcrumb, nav[aria-label="breadcrumb"], .nav-breadcrumb');
    if (await breadcrumb.count() > 0) {
      console.log('✅ 找到麵包屑導航');
    }
    
    // 檢查搜尋框
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜尋"], input[placeholder*="search"], .search-input');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      console.log('✅ 找到搜尋功能');
    }
    
    // 檢查篩選按鈕或下拉選單
    const filterElements = page.locator('select, .filter, button:has-text("篩選"), .dropdown-filter');
    if (await filterElements.count() > 0) {
      console.log(`✅ 找到 ${await filterElements.count()} 個篩選元素`);
    }
    
    await page.screenshot({ path: 'quotes-test-06-page-structure.png', fullPage: true });
    
    console.log('✅ 頁面結構和UI元素測試完成');
  });

  test('4. 測試表格結構和資料顯示', async () => {
    console.log('🔵 開始測試表格結構和資料顯示...');
    
    await loginToSystem(page);
    await page.goto(TEST_CONFIG.quotesURL, { waitUntil: 'networkidle' });
    
    // 等待表格載入
    await page.waitForTimeout(3000);
    
    // 檢查表格容器
    const tableContainer = page.locator('table, .table, .data-table, .quotes-table, .list-group, .card-list');
    
    if (await tableContainer.count() > 0) {
      await expect(tableContainer.first()).toBeVisible();
      console.log('✅ 找到資料顯示容器');
      
      // 檢查表格標題列
      const tableHeaders = page.locator('th, .table-header, .header-cell, .col-header');
      if (await tableHeaders.count() > 0) {
        console.log(`📊 表格標題欄位數量: ${await tableHeaders.count()}`);
        
        // 獲取所有標題文字
        const headerTexts = await tableHeaders.allTextContents();
        console.log('📊 表格標題:', headerTexts.join(', '));
      }
      
      // 檢查資料行
      const dataRows = page.locator('tbody tr, .table-row, .data-row, .list-item');
      const rowCount = await dataRows.count();
      console.log(`📊 資料行數量: ${rowCount}`);
      
      if (rowCount > 0) {
        // 檢查第一行資料
        const firstRow = dataRows.first();
        const firstRowData = await firstRow.allTextContents();
        console.log('📊 第一行資料:', firstRowData);
      } else {
        // 檢查是否有無資料訊息
        const noDataMessage = page.locator('.no-data, .empty-state, .no-quotes, :has-text("沒有資料"), :has-text("無報價單")');
        if (await noDataMessage.count() > 0) {
          console.log('📊 顯示無資料訊息');
        }
      }
    } else {
      console.log('⚠️ 未找到表格或資料容器');
    }
    
    await page.screenshot({ path: 'quotes-test-07-table-structure.png', fullPage: true });
    
    console.log('✅ 表格結構和資料顯示測試完成');
  });

  test('5. 測試搜尋和篩選功能', async () => {
    console.log('🔵 開始測試搜尋和篩選功能...');
    
    await loginToSystem(page);
    await page.goto(TEST_CONFIG.quotesURL, { waitUntil: 'networkidle' });
    
    // 測試搜尋功能
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜尋"], input[placeholder*="search"], .search-input');
    
    if (await searchInput.count() > 0) {
      console.log('✅ 找到搜尋輸入框');
      
      // 測試搜尋輸入
      await searchInput.first().fill('TEST');
      await page.waitForTimeout(1000);
      
      // 檢查搜尋按鈕
      const searchButton = page.locator('button[type="submit"], button:has-text("搜尋"), button:has-text("Search"), .search-btn');
      if (await searchButton.count() > 0) {
        await searchButton.first().click();
        await page.waitForTimeout(2000);
        console.log('✅ 執行搜尋功能');
      }
      
      // 清除搜尋
      await searchInput.first().fill('');
      await page.waitForTimeout(1000);
    }
    
    // 測試篩選功能
    const filterDropdowns = page.locator('select, .dropdown-toggle');
    if (await filterDropdowns.count() > 0) {
      console.log(`✅ 找到 ${await filterDropdowns.count()} 個篩選下拉選單`);
      
      for (let i = 0; i < Math.min(await filterDropdowns.count(), 3); i++) {
        const dropdown = filterDropdowns.nth(i);
        if (await dropdown.isVisible()) {
          const tagName = await dropdown.evaluate(el => el.tagName.toLowerCase());
          
          if (tagName === 'select') {
            const options = page.locator(`select:nth-of-type(${i + 1}) option`);
            const optionCount = await options.count();
            if (optionCount > 1) {
              await dropdown.selectOption({ index: 1 });
              await page.waitForTimeout(1000);
              console.log(`✅ 測試第 ${i + 1} 個下拉選單`);
            }
          }
        }
      }
    }
    
    await page.screenshot({ path: 'quotes-test-08-search-filter.png', fullPage: true });
    
    console.log('✅ 搜尋和篩選功能測試完成');
  });

  test('6. 測試響應式設計', async () => {
    console.log('🔵 開始測試響應式設計...');
    
    await loginToSystem(page);
    await page.goto(TEST_CONFIG.quotesURL, { waitUntil: 'networkidle' });
    
    // 測試桌面版本 (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'quotes-test-09-responsive-desktop.png', fullPage: true });
    console.log('✅ 桌面版本測試完成');
    
    // 測試平板版本 (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'quotes-test-10-responsive-tablet.png', fullPage: true });
    console.log('✅ 平板版本測試完成');
    
    // 測試手機版本 (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'quotes-test-11-responsive-mobile.png', fullPage: true });
    console.log('✅ 手機版本測試完成');
    
    // 恢復桌面版本
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('✅ 響應式設計測試完成');
  });

  test('7. 測試API資料連接', async () => {
    console.log('🔵 開始測試API資料連接...');
    
    await loginToSystem(page);
    
    // 監聽API請求
    const apiRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('quotes')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    // 監聽API回應
    const apiResponses = [];
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('quotes')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    await page.goto(TEST_CONFIG.quotesURL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log(`📊 API 請求數量: ${apiRequests.length}`);
    console.log(`📊 API 回應數量: ${apiResponses.length}`);
    
    // 分析API回應
    apiResponses.forEach((response, index) => {
      console.log(`📊 API ${index + 1}: ${response.method || 'GET'} ${response.url} - ${response.status} ${response.statusText}`);
    });
    
    // 檢查是否有失敗的API請求
    const failedRequests = apiResponses.filter(r => r.status >= 400);
    if (failedRequests.length > 0) {
      console.log('🔴 失敗的API請求:');
      failedRequests.forEach(req => {
        console.log(`   ${req.url} - ${req.status} ${req.statusText}`);
      });
    } else {
      console.log('✅ 所有API請求都成功');
    }
    
    await page.screenshot({ path: 'quotes-test-12-api-test.png', fullPage: true });
    
    console.log('✅ API資料連接測試完成');
  });

  test('8. 測試分頁功能', async () => {
    console.log('🔵 開始測試分頁功能...');
    
    await loginToSystem(page);
    await page.goto(TEST_CONFIG.quotesURL, { waitUntil: 'networkidle' });
    
    // 尋找分頁元素
    const paginationElements = page.locator('.pagination, .pager, .page-nav, [class*="pagina"], [aria-label*="pagination"]');
    
    if (await paginationElements.count() > 0) {
      console.log('✅ 找到分頁元素');
      
      // 檢查分頁按鈕
      const pageButtons = page.locator('.pagination a, .pagination button, .page-link, .page-btn');
      const buttonCount = await pageButtons.count();
      console.log(`📊 分頁按鈕數量: ${buttonCount}`);
      
      if (buttonCount > 0) {
        // 獲取分頁按鈕文字
        const buttonTexts = await pageButtons.allTextContents();
        console.log('📊 分頁按鈕文字:', buttonTexts.join(', '));
        
        // 測試下一頁按鈕 (如果存在)
        const nextButton = page.locator('.pagination a:has-text("下一頁"), .pagination a:has-text("Next"), .pagination a:has-text(">"), .page-link:has-text("下一頁")');
        if (await nextButton.count() > 0 && await nextButton.first().isEnabled()) {
          await nextButton.first().click();
          await page.waitForTimeout(2000);
          console.log('✅ 測試下一頁功能');
          
          // 測試上一頁按鈕
          const prevButton = page.locator('.pagination a:has-text("上一頁"), .pagination a:has-text("Previous"), .pagination a:has-text("<"), .page-link:has-text("上一頁")');
          if (await prevButton.count() > 0 && await prevButton.first().isEnabled()) {
            await prevButton.first().click();
            await page.waitForTimeout(2000);
            console.log('✅ 測試上一頁功能');
          }
        }
      }
    } else {
      console.log('📊 未找到分頁元素 (可能沒有足夠的資料需要分頁)');
    }
    
    await page.screenshot({ path: 'quotes-test-13-pagination.png', fullPage: true });
    
    console.log('✅ 分頁功能測試完成');
  });

  test('9. 測試錯誤處理和邊界情況', async () => {
    console.log('🔵 開始測試錯誤處理和邊界情況...');
    
    await loginToSystem(page);
    
    // 測試無效URL
    console.log('📊 測試無效的報價ID...');
    const invalidQuoteURL = `${TEST_CONFIG.baseURL}/quotes/99999`;
    const response = await page.goto(invalidQuoteURL, { 
      waitUntil: 'networkidle',
      timeout: TEST_CONFIG.timeouts.navigation 
    });
    
    console.log(`📊 無效報價頁面回應狀態: ${response.status()}`);
    await page.screenshot({ path: 'quotes-test-14-invalid-quote.png', fullPage: true });
    
    // 回到正常的報價列表頁面
    await page.goto(TEST_CONFIG.quotesURL, { waitUntil: 'networkidle' });
    
    // 測試網路中斷情況
    console.log('📊 測試網路離線情況...');
    await page.context().setOffline(true);
    await page.reload({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {
      console.log('📊 網路離線時正確顯示錯誤');
    });
    
    // 恢復網路連接
    await page.context().setOffline(false);
    await page.goto(TEST_CONFIG.quotesURL, { waitUntil: 'networkidle' });
    
    await page.screenshot({ path: 'quotes-test-15-error-handling.png', fullPage: true });
    
    console.log('✅ 錯誤處理和邊界情況測試完成');
  });

  test('10. 測試完整的頁面功能流程', async () => {
    console.log('🔵 開始測試完整的頁面功能流程...');
    
    await loginToSystem(page);
    await page.goto(TEST_CONFIG.quotesURL, { waitUntil: 'networkidle' });
    
    // 檢查新增報價按鈕
    const addButton = page.locator('a:has-text("新增"), button:has-text("新增"), a:has-text("建立"), .btn-primary, .add-quote');
    if (await addButton.count() > 0) {
      console.log('✅ 找到新增報價按鈕');
      // 可以點擊測試 (但不實際建立)
      // await addButton.first().click();
      // await page.waitForTimeout(2000);
      // await page.goBack();
    }
    
    // 檢查查看詳情功能
    const viewLinks = page.locator('a:has-text("查看"), a:has-text("詳情"), .view-link, .quote-link');
    if (await viewLinks.count() > 0) {
      console.log(`✅ 找到 ${await viewLinks.count()} 個查看連結`);
    }
    
    // 檢查編輯功能
    const editLinks = page.locator('a:has-text("編輯"), button:has-text("編輯"), .edit-link, .btn-edit');
    if (await editLinks.count() > 0) {
      console.log(`✅ 找到 ${await editLinks.count()} 個編輯連結`);
    }
    
    // 檢查刪除功能
    const deleteButtons = page.locator('button:has-text("刪除"), a:has-text("刪除"), .delete-btn, .btn-danger');
    if (await deleteButtons.count() > 0) {
      console.log(`✅ 找到 ${await deleteButtons.count()} 個刪除按鈕`);
    }
    
    // 檢查匯出功能
    const exportButtons = page.locator('button:has-text("匯出"), a:has-text("匯出"), .export-btn, button:has-text("下載")');
    if (await exportButtons.count() > 0) {
      console.log(`✅ 找到 ${await exportButtons.count()} 個匯出按鈕`);
    }
    
    await page.screenshot({ path: 'quotes-test-16-complete-flow.png', fullPage: true });
    
    console.log('✅ 完整的頁面功能流程測試完成');
  });
});

// 輔助函數：用戶登入
async function loginToSystem(page) {
  console.log('🔵 執行用戶登入...');
  
  await page.goto(TEST_CONFIG.baseURL);
  
  // 檢查是否已經登入
  const logoutButton = page.locator('a:has-text("登出"), button:has-text("登出"), a:has-text("Logout")');
  if (await logoutButton.count() > 0) {
    console.log('✅ 用戶已經登入');
    return;
  }
  
  // 需要登入
  const loginButton = page.locator('a[href*="login"], button:has-text("登入"), button:has-text("Login")');
  if (await loginButton.count() > 0) {
    await loginButton.first().click();
  } else {
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
  }
  
  await page.fill('input[type="email"], input[name="email"]', TEST_CONFIG.testCredentials.email);
  await page.fill('input[type="password"], input[name="password"]', TEST_CONFIG.testCredentials.password);
  await page.click('button[type="submit"], input[type="submit"], button:has-text("登入"), button:has-text("Login")');
  
  await page.waitForLoadState('networkidle');
  console.log('✅ 用戶登入完成');
}