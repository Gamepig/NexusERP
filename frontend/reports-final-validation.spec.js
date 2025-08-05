// NexusERP 報表功能最終完整驗證測試
import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:8000';
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

// 測試設定
test.describe('NexusERP 報表功能最終驗證', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // 登入系統
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL(`${baseURL}/dashboard`);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page?.close();
  });

  // 1. 核心功能驗證 - 銷售總覽頁面
  test('1. 核心功能驗證 - 銷售總覽頁面完全正常工作', async () => {
    console.log('🧪 測試 1: 核心功能驗證 - 銷售總覽頁面');
    
    // 導航到銷售總覽頁面
    await page.goto(`${baseURL}/reports/sales`);
    await page.waitForLoadState('networkidle');
    
    // 截圖記錄
    await page.screenshot({ path: 'screenshots/final-test-sales-overview.png' });
    
    // 驗證頁面基本元素
    await expect(page.locator('h1')).toContainText(/銷售報表|銷售總覽/);
    
    // 檢查是否有 500 錯誤
    const pageContent = await page.content();
    expect(pageContent).not.toContain('500');
    expect(pageContent).not.toContain('Server Error');
    expect(pageContent).not.toContain('error');
    
    // 檢查頁面標題
    const title = await page.title();
    expect(title).toContain('NexusERP');
    
    console.log('✅ 銷售總覽頁面基本功能正常');
  });

  // 2. API 整合測試
  test('2. API 整合測試 - 檢查 API 請求成功', async () => {
    console.log('🧪 測試 2: API 整合測試');
    
    // 監聽 API 請求
    const apiRequests = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // 訪問銷售總覽頁面
    await page.goto(`${baseURL}/reports/sales`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 等待 API 請求完成
    
    // 檢查 API 請求狀態
    console.log('API 請求記錄:', apiRequests);
    
    // 驗證沒有 500 錯誤
    const hasError = apiRequests.some(req => req.status >= 500);
    expect(hasError).toBeFalsy();
    
    // 截圖記錄
    await page.screenshot({ path: 'screenshots/final-test-api-integration.png' });
    
    console.log('✅ API 整合測試通過');
  });

  // 3. 所有報表頁面測試
  test('3. 所有報表頁面功能測試', async () => {
    console.log('🧪 測試 3: 所有報表頁面功能');
    
    const reportPages = [
      { url: '/reports/sales', name: '銷售總覽' },
      { url: '/reports/sales/by-product', name: '產品分析' },
      { url: '/reports/sales/by-customer', name: '客戶分析' },
      { url: '/reports/sales/trends', name: '趨勢分析' }
    ];
    
    for (const reportPage of reportPages) {
      console.log(`測試頁面: ${reportPage.name} (${reportPage.url})`);
      
      // 訪問頁面
      await page.goto(`${baseURL}${reportPage.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // 截圖記錄
      await page.screenshot({ 
        path: `screenshots/final-test-${reportPage.name.replace(/\//g, '-')}.png` 
      });
      
      // 檢查基本頁面元素
      const pageContent = await page.content();
      
      // 驗證沒有錯誤
      expect(pageContent).not.toContain('500');
      expect(pageContent).not.toContain('Server Error');
      expect(pageContent).not.toContain('error occurred');
      
      // 驗證有基本內容
      expect(pageContent.length).toBeGreaterThan(1000); // 頁面有合理的內容量
      
      console.log(`✅ ${reportPage.name} 頁面正常`);
    }
  });

  // 4. 功能完整性檢查
  test('4. 功能完整性檢查 - 篩選和圖表', async () => {
    console.log('🧪 測試 4: 功能完整性檢查');
    
    // 訪問銷售總覽頁面
    await page.goto(`${baseURL}/reports/sales`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 檢查篩選功能元素
    const filterElements = await page.locator('select, input[type="date"], button').count();
    console.log(`發現 ${filterElements} 個可能的篩選元素`);
    
    // 檢查圖表元素（Chart.js 或其他圖表庫）
    const chartElements = await page.locator('canvas, .chart, [id*="chart"], [class*="chart"]').count();
    console.log(`發現 ${chartElements} 個可能的圖表元素`);
    
    // 檢查表格元素
    const tableElements = await page.locator('table, .table, [class*="table"]').count();
    console.log(`發現 ${tableElements} 個表格元素`);
    
    // 截圖記錄完整頁面
    await page.screenshot({ 
      path: 'screenshots/final-test-functionality-check.png',
      fullPage: true 
    });
    
    // 檢查頁面響應式設計
    await page.setViewportSize({ width: 768, height: 1024 }); // 平板檢視
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/final-test-tablet-view.png' });
    
    await page.setViewportSize({ width: 375, height: 812 }); // 手機檢視
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/final-test-mobile-view.png' });
    
    console.log('✅ 功能完整性檢查完成');
  });

  // 5. 錯誤訊息檢查
  test('5. 錯誤訊息檢查', async () => {
    console.log('🧪 測試 5: 錯誤訊息檢查');
    
    const reportPages = [
      '/reports/sales',
      '/reports/sales/by-product',
      '/reports/sales/by-customer',
      '/reports/sales/trends'
    ];
    
    for (const url of reportPages) {
      await page.goto(`${baseURL}${url}`);
      await page.waitForLoadState('networkidle');
      
      const pageContent = await page.content();
      
      // 檢查各種錯誤訊息
      const errorChecks = [
        { pattern: /500|Server Error|Internal Server Error/i, name: '伺服器錯誤' },
        { pattern: /404|Not Found/i, name: '頁面不存在' },
        { pattern: /403|Forbidden/i, name: '權限錯誤' },
        { pattern: /undefined|null/i, name: 'JavaScript 錯誤' },
        { pattern: /error/i, name: '一般錯誤' }
      ];
      
      for (const check of errorChecks) {
        const hasError = check.pattern.test(pageContent);
        if (hasError) {
          console.log(`⚠️  在 ${url} 發現可能的${check.name}`);
        }
        expect(hasError).toBeFalsy();
      }
    }
    
    console.log('✅ 錯誤訊息檢查通過');
  });

  // 6. 效能和載入測試
  test('6. 效能和載入測試', async () => {
    console.log('🧪 測試 6: 效能和載入測試');
    
    const startTime = Date.now();
    
    // 測試頁面載入時間
    await page.goto(`${baseURL}/reports/sales`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`頁面載入時間: ${loadTime}ms`);
    
    // 檢查載入時間是否合理（少於 10 秒）
    expect(loadTime).toBeLessThan(10000);
    
    // 檢查頁面大小是否合理
    const pageContent = await page.content();
    const pageSize = new Blob([pageContent]).size;
    console.log(`頁面大小: ${Math.round(pageSize / 1024)}KB`);
    
    // 截圖最終狀態
    await page.screenshot({ 
      path: 'screenshots/final-test-performance-result.png',
      fullPage: true 
    });
    
    console.log('✅ 效能測試完成');
  });
});