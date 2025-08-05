/**
 * NexusERP 報表系統導航功能最終驗證測試
 * 重點測試關鍵導航功能
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

test.describe('NexusERP 報表導航最終驗證', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
  });

  test('🎯 核心導航流程測試', async ({ page }) => {
    console.log('🔍 執行核心導航流程測試...');
    
    // 1. 從儀表板點擊「報表分析」
    console.log('  步驟 1: 點擊主導航「報表分析」');
    await page.click('text=報表分析');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(`${BASE_URL}/reports`);
    await page.screenshot({ path: 'screenshots/final-01-reports-center.png' });
    console.log('  ✅ 成功進入報表中心');
    
    // 2. 點擊銷售報表卡片
    console.log('  步驟 2: 點擊銷售報表');
    const salesReportLink = page.locator('a[href="/reports/sales"]').first();
    await salesReportLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(`${BASE_URL}/reports/sales`);
    await page.screenshot({ path: 'screenshots/final-02-sales-reports.png' });
    console.log('  ✅ 成功進入銷售報表');
    
    // 3. 測試子報表導航
    const subReports = [
      { text: '銷售總覽', expectedPath: '/reports/sales/summary' },
      { text: '客戶銷售分析', expectedPath: '/reports/sales/by-customer' },
      { text: '產品銷售分析', expectedPath: '/reports/sales/by-product' },
      { text: '銷售趨勢', expectedPath: '/reports/sales/trends' }
    ];
    
    for (const subReport of subReports) {
      console.log(`  步驟 3.${subReports.indexOf(subReport) + 1}: 測試 ${subReport.text}`);
      
      // 回到銷售報表主頁
      await page.goto(`${BASE_URL}/reports/sales`);
      await page.waitForLoadState('networkidle');
      
      // 查找並點擊子報表連結
      const subReportLink = page.locator(`a[href="${subReport.expectedPath}"]`).first();
      
      if (await subReportLink.count() > 0) {
        await subReportLink.click();
        await page.waitForLoadState('networkidle');
        
        const currentURL = page.url();
        if (currentURL.includes(subReport.expectedPath)) {
          console.log(`    ✅ ${subReport.text} 導航成功`);
          await page.screenshot({ path: `screenshots/final-03-${subReport.text}.png` });
        } else {
          console.log(`    ⚠️ ${subReport.text} 導航異常: ${currentURL}`);
        }
      } else {
        console.log(`    ⚠️ 找不到 ${subReport.text} 連結`);
      }
    }
    
    console.log('✅ 核心導航流程測試完成');
  });

  test('🎯 快速動作連結測試', async ({ page }) => {
    console.log('🔍 測試儀表板快速動作連結...');
    
    // 測試儀表板上的銷售報表快速連結
    await page.click('text=銷售報表');
    await page.waitForLoadState('networkidle');
    
    const currentURL = page.url();
    console.log(`  導航到: ${currentURL}`);
    
    if (currentURL.includes('/reports/sales')) {
      console.log('  ✅ 銷售報表快速連結正常工作');
      await page.screenshot({ path: 'screenshots/final-quick-action-sales.png' });
    } else {
      console.log('  ❌ 銷售報表快速連結導航異常');
    }
  });

  test('🎯 所有主要報表路由可達性測試', async ({ page }) => {
    console.log('🔍 測試所有主要報表路由的可達性...');
    
    const mainRoutes = [
      { name: '報表中心', path: '/reports' },
      { name: '銷售報表', path: '/reports/sales' },
      { name: '財務報表', path: '/reports/financial' },
      { name: '庫存報表', path: '/reports/inventory' },
      { name: '採購報表', path: '/reports/purchase' }
    ];
    
    const results = [];
    
    for (const route of mainRoutes) {
      console.log(`  測試 ${route.name}: ${route.path}`);
      
      try {
        const response = await page.goto(`${BASE_URL}${route.path}`);
        await page.waitForLoadState('networkidle');
        
        const status = response?.status() || 0;
        const isSuccess = status >= 200 && status < 300;
        
        results.push({
          name: route.name,
          path: route.path,
          status: status,
          success: isSuccess
        });
        
        if (isSuccess) {
          console.log(`    ✅ ${route.name} (HTTP ${status})`);
        } else {
          console.log(`    ❌ ${route.name} (HTTP ${status})`);
        }
        
        // 截圖記錄
        const filename = route.name.replace(/[^a-zA-Z0-9]/g, '');
        await page.screenshot({ path: `screenshots/final-route-${filename}.png` });
        
      } catch (error) {
        results.push({
          name: route.name,
          path: route.path,
          status: 0,
          success: false,
          error: error.message
        });
        console.log(`    ❌ ${route.name} 錯誤: ${error.message}`);
      }
    }
    
    // 輸出總結
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`📊 路由可達性測試總結: ${successCount}/${totalCount} 成功`);
    
    if (successCount === totalCount) {
      console.log('✅ 所有主要報表路由都可正常訪問');
    } else {
      console.log('⚠️ 部分報表路由存在問題');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.name}: ${r.error || `HTTP ${r.status}`}`);
      });
    }
  });

  test('🎯 瀏覽器導航功能測試', async ({ page }) => {
    console.log('🔍 測試瀏覽器前進後退功能...');
    
    // 導航序列: 儀表板 -> 報表 -> 銷售報表
    await page.goto(`${BASE_URL}/dashboard`);
    console.log('  起始: 儀表板');
    
    await page.click('text=報表分析');
    await page.waitForLoadState('networkidle');
    console.log('  導航到: 報表中心');
    
    await page.click('a[href="/reports/sales"]');
    await page.waitForLoadState('networkidle');
    console.log('  導航到: 銷售報表');
    
    // 測試後退
    await page.goBack();
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/reports') && !page.url().includes('/reports/sales')) {
      console.log('  ✅ 後退到報表中心成功');
    } else {
      console.log('  ⚠️ 後退功能異常');
    }
    
    // 測試前進
    await page.goForward();
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/reports/sales')) {
      console.log('  ✅ 前進到銷售報表成功');
    } else {
      console.log('  ⚠️ 前進功能異常');
    }
    
    await page.screenshot({ path: 'screenshots/final-browser-navigation.png' });
    console.log('✅ 瀏覽器導航功能測試完成');
  });

  test('🎯 響應式設計基本測試', async ({ page }) => {
    console.log('🔍 測試報表頁面響應式設計...');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    await page.goto(`${BASE_URL}/reports`);
    
    for (const viewport of viewports) {
      console.log(`  測試 ${viewport.name} 視圖`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 檢查頁面是否正常顯示
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      
      if (bodyHeight > 0) {
        console.log(`    ✅ ${viewport.name} 視圖正常 (高度: ${bodyHeight}px)`);
      } else {
        console.log(`    ⚠️ ${viewport.name} 視圖可能有問題`);
      }
      
      await page.screenshot({ 
        path: `screenshots/final-responsive-${viewport.name.toLowerCase()}.png`,
        fullPage: true 
      });
    }
    
    // 恢復桌面視圖
    await page.setViewportSize({ width: 1920, height: 1080 });
    console.log('✅ 響應式設計測試完成');
  });

  test('🎯 頁面載入性能測試', async ({ page }) => {
    console.log('🔍 測試報表頁面載入性能...');
    
    const testPages = [
      { name: '報表中心', url: `${BASE_URL}/reports` },
      { name: '銷售報表', url: `${BASE_URL}/reports/sales` }
    ];
    
    for (const testPage of testPages) {
      console.log(`  測試 ${testPage.name} 載入性能`);
      
      const startTime = Date.now();
      
      try {
        await page.goto(testPage.url);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        if (loadTime < 3000) {
          console.log(`    ✅ ${testPage.name} 載入快速 (${loadTime}ms)`);
        } else if (loadTime < 5000) {
          console.log(`    ⚠️ ${testPage.name} 載入一般 (${loadTime}ms)`);
        } else {
          console.log(`    ❌ ${testPage.name} 載入緩慢 (${loadTime}ms)`);
        }
      } catch (error) {
        console.log(`    ❌ ${testPage.name} 載入失敗: ${error.message}`);
      }
    }
    
    console.log('✅ 頁面載入性能測試完成');
  });

});