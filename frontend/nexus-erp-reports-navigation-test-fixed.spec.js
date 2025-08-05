/**
 * NexusERP 報表系統導航功能測試 (修正版)
 * 根據實際頁面結構進行測試
 */

import { test, expect } from '@playwright/test';

// 測試配置
const BASE_URL = 'http://localhost:8000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

test.describe('NexusERP 報表系統導航測試 (修正版)', () => {
  
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
    
    // 使用正確的導航連結文字「報表分析」
    await page.click('text=報表分析');
    
    // 等待頁面載入
    await page.waitForURL(`${BASE_URL}/reports`);
    await expect(page).toHaveURL(`${BASE_URL}/reports`);
    
    // 檢查頁面內容
    await page.waitForLoadState('networkidle');
    
    // 截圖記錄
    await page.screenshot({ path: 'screenshots/fixed-01-reports-center.png' });
    
    console.log('✅ 主導航到報表中心測試通過');
  });

  test('02. 檢查報表中心頁面結構', async ({ page }) => {
    console.log('🔍 檢查報表中心頁面結構...');
    
    // 直接前往報表頁面
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 截圖記錄當前頁面
    await page.screenshot({ path: 'screenshots/fixed-02-reports-page-structure.png' });
    
    // 檢查頁面是否載入成功
    const pageContent = await page.content();
    
    // 檢查是否有錯誤
    const hasError = pageContent.includes('500') || pageContent.includes('404') || pageContent.includes('Error');
    
    if (hasError) {
      console.log('❌ 報表頁面載入出現錯誤');
    } else {
      console.log('✅ 報表頁面載入成功');
    }
    
    // 尋找可能的報表分類連結
    const allLinks = await page.locator('a').all();
    const reportLinks = [];
    
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href && href.includes('/reports/')) {
        reportLinks.push({ href, text: text?.trim() });
      }
    }
    
    console.log('📋 找到的報表相關連結:');
    reportLinks.forEach(link => {
      console.log(`  - ${link.text}: ${link.href}`);
    });
    
    console.log('✅ 報表頁面結構檢查完成');
  });

  test('03. 測試快速動作中的銷售報表連結', async ({ page }) => {
    console.log('🔍 測試儀表板快速動作中的銷售報表連結...');
    
    // 點擊快速動作中的銷售報表連結
    await page.click('text=銷售報表');
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle');
    
    // 檢查是否成功導航到銷售報表頁面
    const currentURL = page.url();
    console.log(`當前 URL: ${currentURL}`);
    
    // 截圖記錄
    await page.screenshot({ path: 'screenshots/fixed-03-sales-report-direct.png' });
    
    console.log('✅ 銷售報表直接連結測試完成');
  });

  test('04. 探索所有報表路由可達性', async ({ page }) => {
    console.log('🔍 探索所有報表路由的可達性...');
    
    const testRoutes = [
      { route: '/reports', name: '報表中心' },
      { route: '/reports/sales', name: '銷售報表' },
      { route: '/reports/financial', name: '財務報表' },
      { route: '/reports/inventory', name: '庫存報表' },
      { route: '/reports/purchase', name: '採購報表' },
      { route: '/reports/sales/summary', name: '銷售總覽' },
      { route: '/reports/sales/by-customer', name: '客戶銷售分析' },
      { route: '/reports/sales/by-product', name: '產品銷售分析' },
      { route: '/reports/sales/trends', name: '銷售趨勢' }
    ];
    
    for (const testRoute of testRoutes) {
      console.log(`  測試路由: ${testRoute.name} (${testRoute.route})`);
      
      try {
        // 直接導航到路由
        const response = await page.goto(`${BASE_URL}${testRoute.route}`);
        
        // 等待頁面載入
        await page.waitForLoadState('networkidle');
        
        // 檢查回應狀態
        const status = response?.status() || 0;
        console.log(`    HTTP 狀態: ${status}`);
        
        // 截圖記錄
        const routeName = testRoute.route.replace(/\//g, '-').replace(/^-/, '');
        await page.screenshot({ path: `screenshots/fixed-04-route-${routeName}.png` });
        
        if (status >= 200 && status < 300) {
          console.log(`    ✅ ${testRoute.name} 可正常訪問`);
        } else {
          console.log(`    ⚠️ ${testRoute.name} 返回狀態 ${status}`);
        }
      } catch (error) {
        console.log(`    ❌ ${testRoute.name} 訪問失敗: ${error.message}`);
        await page.screenshot({ path: `screenshots/fixed-04-error-${testRoute.name}.png` });
      }
    }
  });

  test('05. 測試瀏覽器導航功能', async ({ page }) => {
    console.log('🔍 測試瀏覽器前進後退導航功能...');
    
    // 從儀表板開始
    await page.goto(`${BASE_URL}/dashboard`);
    console.log('  起始頁面: 儀表板');
    
    // 導航到報表分析
    await page.click('text=報表分析');
    await page.waitForLoadState('networkidle');
    console.log('  導航到: 報表分析');
    
    // 使用瀏覽器後退
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // 檢查是否回到儀表板
    const backURL = page.url();
    if (backURL.includes('/dashboard')) {
      console.log('  ✅ 瀏覽器後退功能正常');
    } else {
      console.log(`  ⚠️ 瀏覽器後退未回到儀表板，當前: ${backURL}`);
    }
    
    // 使用瀏覽器前進
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    const forwardURL = page.url();
    if (forwardURL.includes('/reports')) {
      console.log('  ✅ 瀏覽器前進功能正常');
    } else {
      console.log(`  ⚠️ 瀏覽器前進未回到報表頁面，當前: ${forwardURL}`);
    }
    
    // 截圖記錄
    await page.screenshot({ path: 'screenshots/fixed-05-browser-navigation.png' });
  });

  test('06. 測試報表頁面響應式設計', async ({ page }) => {
    console.log('🔍 測試報表頁面響應式設計...');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    // 先導航到報表頁面
    await page.goto(`${BASE_URL}/reports`);
    
    for (const viewport of viewports) {
      console.log(`  測試 ${viewport.name} 視圖 (${viewport.width}x${viewport.height})`);
      
      // 設置視窗大小
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // 重新載入頁面以確保響應式設計生效
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 截圖記錄
      await page.screenshot({ 
        path: `screenshots/fixed-06-responsive-${viewport.name}.png`,
        fullPage: true 
      });
      
      console.log(`  ✅ ${viewport.name} 視圖測試完成`);
    }
    
    // 恢復桌面視圖
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('07. 測試頁面載入性能', async ({ page }) => {
    console.log('🔍 測試報表頁面載入性能...');
    
    const performanceResults = [];
    
    const testPages = [
      { url: `${BASE_URL}/reports`, name: '報表中心' },
      { url: `${BASE_URL}/reports/sales`, name: '銷售報表' }
    ];
    
    for (const testPage of testPages) {
      console.log(`  測試 ${testPage.name} 載入性能...`);
      
      const startTime = Date.now();
      
      try {
        await page.goto(testPage.url);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        performanceResults.push({
          page: testPage.name,
          loadTime: loadTime,
          status: 'success'
        });
        
        console.log(`    載入時間: ${loadTime}ms`);
        
        if (loadTime < 3000) {
          console.log(`    ✅ ${testPage.name} 載入性能良好`);
        } else {
          console.log(`    ⚠️ ${testPage.name} 載入時間較長`);
        }
      } catch (error) {
        performanceResults.push({
          page: testPage.name,
          loadTime: Date.now() - startTime,
          status: 'error',
          error: error.message
        });
        console.log(`    ❌ ${testPage.name} 載入失敗`);
      }
    }
    
    // 輸出性能總結
    console.log('📊 性能測試總結:');
    performanceResults.forEach(result => {
      console.log(`  ${result.page}: ${result.loadTime}ms (${result.status})`);
    });
  });

  test('08. 檢查導航連結完整性', async ({ page }) => {
    console.log('🔍 檢查導航連結的完整性...');
    
    // 前往報表頁面
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    // 獲取所有連結
    const allLinks = await page.locator('a[href]').all();
    const brokenLinks = [];
    const workingLinks = [];
    
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href && (href.startsWith('/reports') || href.startsWith('http://localhost:8000/reports'))) {
        console.log(`  檢查連結: ${text?.trim()} -> ${href}`);
        
        try {
          // 點擊連結測試
          await link.click();
          await page.waitForLoadState('networkidle');
          
          const currentURL = page.url();
          if (currentURL.includes('404') || currentURL.includes('error')) {
            brokenLinks.push({ text: text?.trim(), href, error: '頁面返回錯誤' });
          } else {
            workingLinks.push({ text: text?.trim(), href });
          }
          
          // 回到報表頁面繼續測試
          await page.goto(`${BASE_URL}/reports`);
          await page.waitForLoadState('networkidle');
        } catch (error) {
          brokenLinks.push({ text: text?.trim(), href, error: error.message });
        }
      }
    }
    
    // 輸出結果
    console.log('📋 連結完整性檢查結果:');
    console.log(`  ✅ 正常連結: ${workingLinks.length} 個`);
    console.log(`  ❌ 問題連結: ${brokenLinks.length} 個`);
    
    if (brokenLinks.length > 0) {
      console.log('🚨 問題連結詳情:');
      brokenLinks.forEach(link => {
        console.log(`    ${link.text} (${link.href}): ${link.error}`);
      });
    }
    
    // 截圖記錄最終狀態
    await page.screenshot({ path: 'screenshots/fixed-08-link-integrity-check.png' });
  });

});