import { test, expect } from '@playwright/test';

test.describe('庫存報表頁面綜合測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設置長時間等待
    page.setDefaultTimeout(30000);
    
    // 前往首頁
    await page.goto('/');
    
    // 登入系統
    await page.click('text=登入');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test('1. 庫存報表頁面基本加載測試', async ({ page }) => {
    console.log('=== 開始庫存報表頁面基本加載測試 ===');
    
    // 直接導航到庫存報表頁面
    await page.goto('/reports/inventory');
    
    // 等待頁面加載
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    
    // 拍攝頁面截圖
    await page.screenshot({ 
      path: 'screenshots/inventory-reports-basic-load.png',
      fullPage: true 
    });
    
    // 檢查頁面標題和基本元素
    const title = await page.title();
    console.log('頁面標題:', title);
    
    // 檢查是否有錯誤訊息
    const errorElements = await page.$$('text=/error|錯誤|Error|500|404/i');
    if (errorElements.length > 0) {
      console.log('發現錯誤訊息數量:', errorElements.length);
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        console.log(`錯誤訊息 ${i + 1}:`, errorText);
      }
    }
    
    // 檢查頁面基本結構
    const bodyContent = await page.locator('body').textContent();
    console.log('頁面內容長度:', bodyContent.length);
    console.log('頁面包含 "庫存" 關鍵字:', bodyContent.includes('庫存'));
    console.log('頁面包含 "報表" 關鍵字:', bodyContent.includes('報表'));
    
    // 檢查是否有主要內容區域
    const mainContent = await page.locator('main, .main-content, .content, .container').first();
    if (await mainContent.count() > 0) {
      console.log('找到主要內容區域');
    } else {
      console.log('⚠️ 未找到主要內容區域');
    }
  });

  test('2. JavaScript 錯誤檢測', async ({ page }) => {
    console.log('=== 開始 JavaScript 錯誤檢測 ===');
    
    const jsErrors = [];
    const consoleMessages = [];
    
    // 監聽頁面錯誤
    page.on('pageerror', (error) => {
      jsErrors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack
      });
      console.log('❌ JavaScript 錯誤:', error.message);
    });
    
    // 監聽控制台訊息
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
      if (msg.type() === 'error') {
        console.log('❌ 控制台錯誤:', msg.text());
      }
    });
    
    // 導航到庫存報表頁面
    await page.goto('/reports/inventory');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    
    // 等待可能的動態內容加載
    await page.waitForTimeout(5000);
    
    // 嘗試與頁面互動
    try {
      const buttons = await page.$$('button, .btn, [role="button"]');
      console.log('找到按鈕數量:', buttons.length);
      
      // 點擊第一個按鈕（如果存在）
      if (buttons.length > 0) {
        await buttons[0].click();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('按鈕互動錯誤:', error.message);
    }
    
    // 拍攝最終截圖
    await page.screenshot({ 
      path: 'screenshots/inventory-reports-js-errors.png',
      fullPage: true 
    });
    
    // 輸出錯誤總結
    console.log('=== JavaScript 錯誤總結 ===');
    console.log('JavaScript 錯誤數量:', jsErrors.length);
    console.log('控制台錯誤訊息數量:', consoleMessages.filter(msg => msg.type === 'error').length);
    
    if (jsErrors.length > 0) {
      console.log('\n詳細錯誤列表:');
      jsErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }
    
    if (consoleMessages.filter(msg => msg.type === 'error').length > 0) {
      console.log('\n控制台錯誤列表:');
      consoleMessages.filter(msg => msg.type === 'error').forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.text}`);
      });
    }
  });

  test('3. 圖表元素和 Canvas 檢測', async ({ page }) => {
    console.log('=== 開始圖表元素和 Canvas 檢測 ===');
    
    await page.goto('/reports/inventory');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    
    // 等待可能的圖表加載
    await page.waitForTimeout(8000);
    
    // 檢查 Canvas 元素
    const canvasElements = await page.$$('canvas');
    console.log('Canvas 元素數量:', canvasElements.length);
    
    if (canvasElements.length > 0) {
      for (let i = 0; i < canvasElements.length; i++) {
        const canvas = canvasElements[i];
        const isVisible = await canvas.isVisible();
        const boundingBox = await canvas.boundingBox();
        
        console.log(`Canvas ${i + 1}:`);
        console.log('  可見性:', isVisible);
        console.log('  尺寸:', boundingBox);
        
        if (boundingBox) {
          console.log('  寬度:', boundingBox.width);
          console.log('  高度:', boundingBox.height);
        }
      }
    }
    
    // 檢查其他圖表相關元素
    const chartContainers = await page.$$('.chart, .chart-container, [id*="chart"], [class*="chart"]');
    console.log('圖表容器數量:', chartContainers.length);
    
    // 檢查 Chart.js 或其他圖表庫的存在
    const hasChartJS = await page.evaluate(() => {
      return typeof window.Chart !== 'undefined';
    });
    console.log('Chart.js 是否可用:', hasChartJS);
    
    // 檢查是否有圖表數據
    const hasChartData = await page.evaluate(() => {
      // 尋找可能的圖表數據變數
      return !!(window.chartData || window.inventoryData || window.reportData);
    });
    console.log('是否有圖表數據變數:', hasChartData);
    
    // 拍攝截圖
    await page.screenshot({ 
      path: 'screenshots/inventory-reports-charts.png',
      fullPage: true 
    });
  });

  test('4. 載入狀態和錯誤訊息檢測', async ({ page }) => {
    console.log('=== 開始載入狀態和錯誤訊息檢測 ===');
    
    // 監聽網路請求
    const requests = [];
    const responses = [];
    const failedRequests = [];
    
    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });
    
    page.on('response', (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`❌ 請求失敗: ${response.status()} ${response.url()}`);
      }
    });
    
    await page.goto('/reports/inventory');
    
    // 檢查載入指示器
    const loadingIndicators = await page.$$('text=/loading|載入|加載/i, .loading, .spinner, .loader');
    console.log('載入指示器數量:', loadingIndicators.length);
    
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(5000);
    
    // 檢查錯誤訊息
    const errorMessages = await page.$$('text=/error|錯誤|失敗|Error|Failed/i, .error, .alert-danger');
    console.log('錯誤訊息元素數量:', errorMessages.length);
    
    if (errorMessages.length > 0) {
      console.log('\n錯誤訊息詳情:');
      for (let i = 0; i < errorMessages.length; i++) {
        const errorText = await errorMessages[i].textContent();
        const isVisible = await errorMessages[i].isVisible();
        console.log(`  ${i + 1}. "${errorText}" (可見: ${isVisible})`);
      }
    }
    
    // 檢查空白狀態訊息
    const emptyStateMessages = await page.$$('text=/no data|沒有資料|暫無數據|no results/i');
    console.log('空白狀態訊息數量:', emptyStateMessages.length);
    
    // 輸出網路請求統計
    console.log('\n=== 網路請求統計 ===');
    console.log('總請求數:', requests.length);
    console.log('失敗請求數:', failedRequests.length);
    
    if (failedRequests.length > 0) {
      console.log('\n失敗請求詳情:');
      failedRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.status} ${req.url}`);
      });
    }
    
    // 拍攝截圖
    await page.screenshot({ 
      path: 'screenshots/inventory-reports-loading-errors.png',
      fullPage: true 
    });
  });

  test('5. 與銷售報表對比分析', async ({ page }) => {
    console.log('=== 開始與銷售報表對比分析 ===');
    
    // 先測試銷售報表作為對比基準
    console.log('\n--- 測試銷售報表 ---');
    await page.goto('/reports/sales');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // 銷售報表截圖
    await page.screenshot({ 
      path: 'screenshots/sales-reports-comparison.png',
      fullPage: true 
    });
    
    // 檢查銷售報表的結構
    const salesPageContent = await page.locator('body').textContent();
    const salesCanvasCount = await page.$$eval('canvas', canvases => canvases.length);
    const salesChartCount = await page.$$eval('[class*="chart"], [id*="chart"]', elements => elements.length);
    
    console.log('銷售報表頁面內容長度:', salesPageContent.length);
    console.log('銷售報表 Canvas 數量:', salesCanvasCount);
    console.log('銷售報表圖表元素數量:', salesChartCount);
    
    // 然後測試庫存報表
    console.log('\n--- 測試庫存報表 ---');
    await page.goto('/reports/inventory');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // 庫存報表截圖
    await page.screenshot({ 
      path: 'screenshots/inventory-reports-comparison.png',
      fullPage: true 
    });
    
    // 檢查庫存報表的結構
    const inventoryPageContent = await page.locator('body').textContent();
    const inventoryCanvasCount = await page.$$eval('canvas', canvases => canvases.length);
    const inventoryChartCount = await page.$$eval('[class*="chart"], [id*="chart"]', elements => elements.length);
    
    console.log('庫存報表頁面內容長度:', inventoryPageContent.length);
    console.log('庫存報表 Canvas 數量:', inventoryCanvasCount);
    console.log('庫存報表圖表元素數量:', inventoryChartCount);
    
    // 對比分析
    console.log('\n=== 對比分析結果 ===');
    console.log('頁面內容長度對比:');
    console.log(`  銷售報表: ${salesPageContent.length} 字符`);
    console.log(`  庫存報表: ${inventoryPageContent.length} 字符`);
    console.log(`  差異: ${salesPageContent.length - inventoryPageContent.length} 字符`);
    
    console.log('\nCanvas 元素對比:');
    console.log(`  銷售報表: ${salesCanvasCount} 個`);
    console.log(`  庫存報表: ${inventoryCanvasCount} 個`);
    
    console.log('\n圖表元素對比:');
    console.log(`  銷售報表: ${salesChartCount} 個`);
    console.log(`  庫存報表: ${inventoryChartCount} 個`);
    
    // 檢查具體的差異點
    const salesHasCharts = salesCanvasCount > 0 || salesChartCount > 0;
    const inventoryHasCharts = inventoryCanvasCount > 0 || inventoryChartCount > 0;
    
    console.log('\n功能對比:');
    console.log(`  銷售報表有圖表: ${salesHasCharts}`);
    console.log(`  庫存報表有圖表: ${inventoryHasCharts}`);
    
    if (salesHasCharts && !inventoryHasCharts) {
      console.log('⚠️ 發現問題: 銷售報表有圖表但庫存報表沒有圖表');
    }
  });

  test('6. 詳細頁面分析和診斷', async ({ page }) => {
    console.log('=== 開始詳細頁面分析和診斷 ===');
    
    await page.goto('/reports/inventory');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(5000);
    
    // 獲取頁面 HTML 結構
    const htmlContent = await page.content();
    
    // 分析頁面結構
    console.log('\n--- 頁面結構分析 ---');
    
    // 檢查是否有標準的報表結構
    const hasReportContainer = htmlContent.includes('report-container') || 
                              htmlContent.includes('reports-container') ||
                              htmlContent.includes('inventory-report');
    console.log('有報表容器:', hasReportContainer);
    
    // 檢查是否有圖表相關的 JavaScript
    const hasChartJS = htmlContent.includes('Chart.js') || 
                      htmlContent.includes('chart.min.js') ||
                      htmlContent.includes('chartjs');
    console.log('包含 Chart.js:', hasChartJS);
    
    // 檢查是否有 Vue.js 或其他框架
    const hasVue = htmlContent.includes('vue') || htmlContent.includes('Vue');
    const hasReact = htmlContent.includes('react') || htmlContent.includes('React');
    const hasJQuery = htmlContent.includes('jquery') || htmlContent.includes('jQuery');
    
    console.log('使用 Vue.js:', hasVue);
    console.log('使用 React:', hasReact);
    console.log('使用 jQuery:', hasJQuery);
    
    // 檢查 CSS 和樣式
    const stylesheets = await page.$$eval('link[rel="stylesheet"]', links => 
      links.map(link => link.href)
    );
    console.log('\nCSS 文件數量:', stylesheets.length);
    
    // 檢查 JavaScript 文件
    const scripts = await page.$$eval('script[src]', scripts => 
      scripts.map(script => script.src)
    );
    console.log('JavaScript 文件數量:', scripts.length);
    
    // 檢查頁面中的數據
    const pageData = await page.evaluate(() => {
      return {
        hasInventoryData: !!(window.inventoryData || window.reportData),
        hasChartData: !!(window.chartData || window.chartsData),
        windowVars: Object.keys(window).filter(key => 
          key.includes('inventory') || 
          key.includes('report') || 
          key.includes('chart')
        )
      };
    });
    
    console.log('\n--- 頁面數據分析 ---');
    console.log('有庫存數據變數:', pageData.hasInventoryData);
    console.log('有圖表數據變數:', pageData.hasChartData);
    console.log('相關 window 變數:', pageData.windowVars);
    
    // 檢查頁面中的具體元素
    const elementCounts = await page.evaluate(() => {
      return {
        divs: document.querySelectorAll('div').length,
        canvases: document.querySelectorAll('canvas').length,
        chartContainers: document.querySelectorAll('[class*="chart"], [id*="chart"]').length,
        loadingElements: document.querySelectorAll('.loading, .spinner, .loader').length,
        errorElements: document.querySelectorAll('.error, .alert-danger, [class*="error"]').length,
        buttons: document.querySelectorAll('button, .btn').length,
        tables: document.querySelectorAll('table').length
      };
    });
    
    console.log('\n--- 元素統計 ---');
    Object.entries(elementCounts).forEach(([key, count]) => {
      console.log(`${key}: ${count}`);
    });
    
    // 拍攝最終診斷截圖
    await page.screenshot({ 
      path: 'screenshots/inventory-reports-final-diagnosis.png',
      fullPage: true 
    });
    
    // 將 HTML 內容的前 2000 字符輸出用於分析
    console.log('\n--- HTML 內容摘要 (前 2000 字符) ---');
    console.log(htmlContent.substring(0, 2000));
  });
});