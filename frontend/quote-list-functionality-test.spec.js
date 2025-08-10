import { test, expect } from '@playwright/test';

test.describe('報價單列表頁面功能測試', () => {
  test('測試報價單列表頁面的完整功能', async ({ page }) => {
    console.log('🚀 開始測試報價單列表頁面功能...');

    // 步驟 1: 導航到登入頁面
    console.log('📍 步驟 1: 導航到登入頁面');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'quote-test-01-login-page.png' });
    
    // 步驟 2: 執行登入
    console.log('📍 步驟 2: 執行登入');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.screenshot({ path: 'quote-test-02-login-filled.png' });
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'quote-test-03-after-login.png' });
    
    // 步驟 3: 導航到報價單頁面
    console.log('📍 步驟 3: 導航到報價單頁面');
    await page.goto('http://127.0.0.1:8000/quotes');
    await page.waitForLoadState('networkidle');
    
    // 等待一些時間讓API加載完成
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'quote-test-04-quotes-initial-load.png' });

    // 步驟 4: 檢查頁面載入狀態
    console.log('📍 步驟 4: 檢查頁面載入狀態');
    
    // 檢查頁面標題
    const pageTitle = await page.locator('h1').textContent();
    console.log('頁面標題:', pageTitle);
    
    // 檢查是否還在載入中
    const loadingElements = await page.locator('text=載入中').count();
    console.log('載入中元素數量:', loadingElements);
    
    // 檢查是否有錯誤訊息
    const errorMessages = await page.locator('.alert-danger, .error').count();
    console.log('錯誤訊息數量:', errorMessages);
    
    // 步驟 5: 檢查核心元素
    console.log('📍 步驟 5: 檢查核心元素');
    
    // 檢查搜尋表單
    const searchForm = await page.locator('form#searchForm').isVisible();
    console.log('搜尋表單可見:', searchForm);
    
    // 檢查搜尋欄位
    const searchInput = await page.locator('input[name="search"]').isVisible();
    console.log('搜尋輸入框可見:', searchInput);
    
    // 檢查日期篩選器
    const dateFilters = await page.locator('input[type="date"]').count();
    console.log('日期篩選器數量:', dateFilters);
    
    // 檢查狀態篩選器
    const statusSelect = await page.locator('select[name="status"]').isVisible();
    console.log('狀態篩選器可見:', statusSelect);
    
    await page.screenshot({ path: 'quote-test-05-form-elements-check.png' });
    
    // 步驟 6: 檢查資料顯示區域
    console.log('📍 步驟 6: 檢查資料顯示區域');
    
    // 檢查資料表格
    const dataTable = await page.locator('#quotesTable').isVisible();
    console.log('資料表格可見:', dataTable);
    
    // 檢查資料行
    const tableRows = await page.locator('#quotesTable tbody tr').count();
    console.log('資料行數量:', tableRows);
    
    // 檢查是否有資料卡片
    const dataCards = await page.locator('.quote-card, .card').count();
    console.log('資料卡片數量:', dataCards);
    
    // 檢查是否有「無資料」訊息
    const noDataMessage = await page.locator('text=無資料, text=沒有找到報價單, text=no data').count();
    console.log('無資料訊息數量:', noDataMessage);
    
    await page.screenshot({ path: 'quote-test-06-data-display-check.png' });
    
    // 步驟 7: 檢查分頁和排序功能
    console.log('📍 步驟 7: 檢查分頁和排序功能');
    
    // 檢查分頁控制
    const pagination = await page.locator('.pagination, .page-numbers').count();
    console.log('分頁控制數量:', pagination);
    
    // 檢查排序選項
    const sortSelect = await page.locator('select[name="sort"]').isVisible();
    console.log('排序選項可見:', sortSelect);
    
    await page.screenshot({ path: 'quote-test-07-pagination-sort-check.png' });
    
    // 步驟 8: 測試 API 連接
    console.log('📍 步驟 8: 測試 API 連接');
    
    // 監聽網路請求
    let apiCalled = false;
    let apiResponse = null;
    
    page.on('response', response => {
      if (response.url().includes('/api/quotes') || response.url().includes(':8082')) {
        apiCalled = true;
        apiResponse = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        };
        console.log('API 請求:', apiResponse);
      }
    });
    
    // 重新載入頁面觸發 API 請求
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('API 是否被呼叫:', apiCalled);
    if (apiResponse) {
      console.log('API 回應:', apiResponse);
    }
    
    await page.screenshot({ path: 'quote-test-08-after-reload.png' });
    
    // 步驟 9: 檢查頁面內容
    console.log('📍 步驟 9: 檢查頁面內容');
    
    // 獲取頁面所有文字內容進行分析
    const pageContent = await page.textContent('body');
    const hasLoadingText = pageContent.includes('載入中') || pageContent.includes('Loading');
    const hasErrorText = pageContent.includes('錯誤') || pageContent.includes('Error');
    const hasDataText = pageContent.includes('報價單') || pageContent.includes('Quote');
    
    console.log('頁面包含載入文字:', hasLoadingText);
    console.log('頁面包含錯誤文字:', hasErrorText);
    console.log('頁面包含資料文字:', hasDataText);
    
    // 檢查 JavaScript 錯誤
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    // 等待一下讓 JS 錯誤顯示
    await page.waitForTimeout(1000);
    
    if (jsErrors.length > 0) {
      console.log('JavaScript 錯誤:', jsErrors);
    } else {
      console.log('無 JavaScript 錯誤');
    }
    
    // 步驟 10: 最終截圖和總結
    console.log('📍 步驟 10: 最終截圖和總結');
    await page.screenshot({ path: 'quote-test-09-final-state.png', fullPage: true });
    
    // 總結資訊
    const summary = {
      pageTitle,
      loadingElements,
      errorMessages,
      searchForm,
      searchInput,
      dateFilters,
      statusSelect,
      dataTable,
      tableRows,
      dataCards,
      noDataMessage,
      pagination,
      sortSelect,
      apiCalled,
      apiResponse,
      hasLoadingText,
      hasErrorText,
      hasDataText,
      jsErrorsCount: jsErrors.length
    };
    
    console.log('🎯 測試總結:', JSON.stringify(summary, null, 2));
    
    // 基本斷言
    expect(pageTitle).toBeTruthy();
    expect(loadingElements).toBeLessThan(5); // 應該不會有太多載入中元素
    expect(errorMessages).toBe(0); // 不應該有錯誤訊息
    expect(searchForm).toBe(true); // 搜尋表單應該存在
  });
});