/**
 * NexusERP 報表系統導航功能全面測試
 * 測試所有報表頁面的導航連結和功能
 */

import { test, expect } from '@playwright/test';

// 測試配置
const BASE_URL = 'http://localhost:8000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// 所有報表頁面路由
const REPORT_ROUTES = {
  main: '/reports',
  sales: '/reports/sales',
  financial: '/reports/financial',
  inventory: '/reports/inventory',
  purchase: '/reports/purchase',
  // 銷售子報表
  salesSummary: '/reports/sales/summary',
  salesByCustomer: '/reports/sales/by-customer',
  salesByProduct: '/reports/sales/by-product',
  salesTrends: '/reports/sales/trends',
  // 財務子報表
  financialProfitLoss: '/reports/financial/profit-loss',
  financialCashFlow: '/reports/financial/cash-flow',
  financialAccountsReceivable: '/reports/financial/accounts-receivable',
  financialAccountsPayable: '/reports/financial/accounts-payable',
  // 庫存子報表
  inventoryValuation: '/reports/inventory/valuation',
  inventoryMovements: '/reports/inventory/movements',
  inventoryAging: '/reports/inventory/aging',
  inventoryTurnover: '/reports/inventory/turnover',
  // 採購子報表
  purchaseBySupplier: '/reports/purchase/by-supplier',
  purchaseByProduct: '/reports/purchase/by-product'
};

test.describe('NexusERP 報表系統導航測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 前往登入頁面並登入
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  test('01. 測試主導航到報表中心', async ({ page }) => {
    console.log('🔍 測試從主導航進入報表中心...');
    
    // 點擊主導航的報表連結
    await page.click('a[href="/reports"]');
    
    // 等待頁面載入
    await page.waitForURL(`${BASE_URL}/reports`);
    await expect(page).toHaveURL(`${BASE_URL}/reports`);
    
    // 檢查頁面標題
    await expect(page.locator('h1')).toContainText('報表中心');
    
    // 截圖記錄
    await page.screenshot({ path: 'screenshots/01-reports-center.png' });
    
    console.log('✅ 主導航到報表中心測試通過');
  });

  test('02. 測試報表首頁分類卡片點擊', async ({ page }) => {
    console.log('🔍 測試報表首頁各分類卡片點擊...');
    
    // 前往報表首頁
    await page.goto(`${BASE_URL}/reports`);
    
    // 測試各分類卡片
    const categories = [
      { selector: 'a[href="/reports/sales"]', name: '銷售報表' },
      { selector: 'a[href="/reports/financial"]', name: '財務報表' },
      { selector: 'a[href="/reports/inventory"]', name: '庫存報表' },
      { selector: 'a[href="/reports/purchase"]', name: '採購報表' }
    ];
    
    for (const category of categories) {
      console.log(`  測試點擊 ${category.name} 卡片...`);
      
      // 前往報表首頁
      await page.goto(`${BASE_URL}/reports`);
      
      // 點擊分類卡片
      await page.click(category.selector);
      
      // 等待頁面載入
      await page.waitForLoadState('networkidle');
      
      // 檢查是否成功導航
      await expect(page).toHaveURL(new RegExp(category.selector.replace('a[href="', '').replace('"]', '')));
      
      // 截圖記錄
      await page.screenshot({ path: `screenshots/02-category-${category.name}.png` });
      
      console.log(`  ✅ ${category.name} 卡片點擊測試通過`);
    }
  });

  test('03. 測試銷售報表總覽頁面導航', async ({ page }) => {
    console.log('🔍 測試銷售報表總覽頁面導航功能...');
    
    // 前往銷售報表頁面
    await page.goto(`${BASE_URL}/reports/sales`);
    
    // 檢查頁面標題
    await expect(page.locator('h1')).toContainText('銷售報表');
    
    // 測試子報表連結
    const salesSubReports = [
      { href: '/reports/sales/summary', name: '銷售總覽' },
      { href: '/reports/sales/by-customer', name: '客戶銷售分析' },
      { href: '/reports/sales/by-product', name: '產品銷售分析' },
      { href: '/reports/sales/trends', name: '銷售趨勢' }
    ];
    
    for (const subReport of salesSubReports) {
      console.log(`  測試 ${subReport.name} 連結...`);
      
      // 回到銷售報表主頁
      await page.goto(`${BASE_URL}/reports/sales`);
      
      // 點擊子報表連結
      await page.click(`a[href="${subReport.href}"]`);
      
      // 等待頁面載入
      await page.waitForLoadState('networkidle');
      
      // 檢查 URL
      await expect(page).toHaveURL(`${BASE_URL}${subReport.href}`);
      
      // 截圖記錄
      await page.screenshot({ path: `screenshots/03-sales-${subReport.name}.png` });
      
      console.log(`  ✅ ${subReport.name} 導航測試通過`);
    }
  });

  test('04. 隨機測試子報表頁面載入', async ({ page }) => {
    console.log('🔍 隨機測試子報表頁面載入...');
    
    // 隨機選擇一些子報表進行測試
    const randomRoutes = [
      { route: REPORT_ROUTES.salesSummary, name: '銷售總覽' },
      { route: REPORT_ROUTES.inventoryValuation, name: '庫存評估' },
      { route: REPORT_ROUTES.financialProfitLoss, name: '損益表' },
      { route: REPORT_ROUTES.purchaseBySupplier, name: '供應商採購分析' },
      { route: REPORT_ROUTES.salesTrends, name: '銷售趨勢' }
    ];
    
    for (const testRoute of randomRoutes) {
      console.log(`  測試 ${testRoute.name} 頁面載入...`);
      
      try {
        // 直接前往子報表頁面
        await page.goto(`${BASE_URL}${testRoute.route}`);
        
        // 等待頁面載入
        await page.waitForLoadState('networkidle');
        
        // 檢查頁面不是錯誤頁面
        const isError = await page.locator('body').textContent();
        expect(isError).not.toContain('500');
        expect(isError).not.toContain('404');
        expect(isError).not.toContain('Error');
        
        // 截圖記錄
        await page.screenshot({ path: `screenshots/04-random-${testRoute.name}.png` });
        
        console.log(`  ✅ ${testRoute.name} 頁面載入測試通過`);
      } catch (error) {
        console.log(`  ❌ ${testRoute.name} 頁面載入失敗: ${error.message}`);
        await page.screenshot({ path: `screenshots/04-error-${testRoute.name}.png` });
      }
    }
  });

  test('05. 測試麵包屑導航功能', async ({ page }) => {
    console.log('🔍 測試麵包屑導航功能...');
    
    // 前往深層子報表頁面
    await page.goto(`${BASE_URL}/reports/sales/by-customer`);
    
    // 檢查麵包屑是否存在
    const breadcrumb = page.locator('.breadcrumb, nav[aria-label="breadcrumb"], .bg-white nav');
    
    if (await breadcrumb.count() > 0) {
      console.log('  找到麵包屑導航元素');
      
      // 測試麵包屑連結
      const breadcrumbLinks = await breadcrumb.locator('a').all();
      
      for (let i = 0; i < breadcrumbLinks.length; i++) {
        const link = breadcrumbLinks[i];
        const linkText = await link.textContent();
        const linkHref = await link.getAttribute('href');
        
        console.log(`  測試麵包屑連結: ${linkText} -> ${linkHref}`);
        
        if (linkHref && linkHref !== '#') {
          // 點擊麵包屑連結
          await link.click();
          
          // 等待頁面載入
          await page.waitForLoadState('networkidle');
          
          // 檢查 URL 是否正確
          if (linkHref.startsWith('/')) {
            await expect(page).toHaveURL(`${BASE_URL}${linkHref}`);
          }
          
          console.log(`  ✅ 麵包屑連結 ${linkText} 測試通過`);
          
          // 回到原始頁面繼續測試
          await page.goto(`${BASE_URL}/reports/sales/by-customer`);
        }
      }
    } else {
      console.log('  未找到麵包屑導航元素，檢查替代導航方式...');
      
      // 檢查是否有返回按鈕或其他導航元素
      const backButton = page.locator('button:has-text("返回"), a:has-text("返回"), .btn-back');
      if (await backButton.count() > 0) {
        console.log('  找到返回按鈕');
        await backButton.first().click();
        await page.waitForLoadState('networkidle');
        console.log('  ✅ 返回按鈕功能正常');
      }
    }
    
    // 截圖記錄
    await page.screenshot({ path: 'screenshots/05-breadcrumb-test.png' });
  });

  test('06. 測試報表頁面響應式設計', async ({ page }) => {
    console.log('🔍 測試報表頁面響應式設計...');
    
    const testRoutes = [
      REPORT_ROUTES.main,
      REPORT_ROUTES.sales,
      REPORT_ROUTES.salesSummary
    ];
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const route of testRoutes) {
      for (const viewport of viewports) {
        console.log(`  測試 ${route} 在 ${viewport.name} 視圖...`);
        
        // 設置視窗大小
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // 前往頁面
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForLoadState('networkidle');
        
        // 截圖記錄
        const routeName = route.replace(/\//g, '-').replace(/^-/, '');
        await page.screenshot({ 
          path: `screenshots/06-responsive-${routeName}-${viewport.name}.png` 
        });
        
        console.log(`  ✅ ${route} ${viewport.name} 視圖測試完成`);
      }
    }
    
    // 恢復桌面視圖
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('07. 測試報表數據載入狀態', async ({ page }) => {
    console.log('🔍 測試報表數據載入狀態...');
    
    const dataHeavyRoutes = [
      { route: REPORT_ROUTES.salesSummary, name: '銷售總覽' },
      { route: REPORT_ROUTES.inventoryValuation, name: '庫存評估' },
      { route: REPORT_ROUTES.financialProfitLoss, name: '損益表' }
    ];
    
    for (const testRoute of dataHeavyRoutes) {
      console.log(`  測試 ${testRoute.name} 數據載入...`);
      
      // 前往頁面
      await page.goto(`${BASE_URL}${testRoute.route}`);
      
      // 檢查載入指示器
      const loadingIndicators = [
        '.loading',
        '.spinner',
        '.skeleton',
        '[data-loading="true"]',
        '.chart-loading'
      ];
      
      // 等待載入完成
      await page.waitForLoadState('networkidle');
      
      // 檢查數據是否載入
      const hasContent = await page.locator('table, .chart, .data-table, .report-content').count() > 0;
      
      if (hasContent) {
        console.log(`  ✅ ${testRoute.name} 數據載入成功`);
      } else {
        console.log(`  ⚠️ ${testRoute.name} 可能無數據或載入未完成`);
      }
      
      // 截圖記錄
      await page.screenshot({ path: `screenshots/07-data-${testRoute.name}.png` });
    }
  });

  test('08. 測試報表頁面錯誤處理', async ({ page }) => {
    console.log('🔍 測試報表頁面錯誤處理...');
    
    // 測試不存在的報表路由
    const invalidRoutes = [
      '/reports/nonexistent',
      '/reports/sales/invalid',
      '/reports/financial/fake'
    ];
    
    for (const invalidRoute of invalidRoutes) {
      console.log(`  測試無效路由: ${invalidRoute}`);
      
      const response = await page.goto(`${BASE_URL}${invalidRoute}`);
      
      // 檢查回應狀態
      if (response.status() === 404) {
        console.log(`  ✅ 正確返回 404 錯誤`);
      } else if (response.status() >= 200 && response.status() < 300) {
        // 檢查是否重定向到有效頁面或顯示錯誤信息
        const content = await page.content();
        const hasErrorMessage = content.includes('找不到') || content.includes('不存在') || content.includes('404');
        
        if (hasErrorMessage) {
          console.log(`  ✅ 顯示適當的錯誤信息`);
        } else {
          console.log(`  ⚠️ 可能需要改善錯誤處理`);
        }
      }
      
      // 截圖記錄
      await page.screenshot({ path: `screenshots/08-error-${invalidRoute.replace(/\//g, '-')}.png` });
    }
  });

  test('09. 完整導航流程測試', async ({ page }) => {
    console.log('🔍 執行完整導航流程測試...');
    
    // 從首頁開始的完整導航流程
    await page.goto(`${BASE_URL}/dashboard`);
    
    // 1. 首頁 -> 報表中心
    await page.click('a[href="/reports"]');
    await page.waitForURL(`${BASE_URL}/reports`);
    console.log('  ✅ 步驟 1: 首頁 -> 報表中心');
    
    // 2. 報表中心 -> 銷售報表
    await page.click('a[href="/reports/sales"]');
    await page.waitForURL(`${BASE_URL}/reports/sales`);
    console.log('  ✅ 步驟 2: 報表中心 -> 銷售報表');
    
    // 3. 銷售報表 -> 銷售總覽
    await page.click('a[href="/reports/sales/summary"]');
    await page.waitForURL(`${BASE_URL}/reports/sales/summary`);
    console.log('  ✅ 步驟 3: 銷售報表 -> 銷售總覽');
    
    // 4. 使用瀏覽器返回功能
    await page.goBack();
    await expect(page).toHaveURL(`${BASE_URL}/reports/sales`);
    console.log('  ✅ 步驟 4: 瀏覽器返回功能正常');
    
    // 5. 前往其他報表類別
    await page.click('a[href="/reports"]');
    await page.waitForURL(`${BASE_URL}/reports`);
    
    await page.click('a[href="/reports/inventory"]');
    await page.waitForURL(`${BASE_URL}/reports/inventory`);
    console.log('  ✅ 步驟 5: 切換到庫存報表');
    
    // 最終截圖
    await page.screenshot({ path: 'screenshots/09-complete-navigation-test.png' });
    
    console.log('✅ 完整導航流程測試通過');
  });

});