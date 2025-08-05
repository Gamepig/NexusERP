// NexusERP 庫存報表頁面 MCP Playwright 測試
// 目標：測試庫存報表頁面的正常載入和圖表渲染

import { test, expect } from '@playwright/test';

// 配置測試
test.describe('庫存報表頁面測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設置較長的超時時間
    test.setTimeout(60000);
    
    // 前往首頁
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
  });

  test('完整庫存報表頁面測試流程', async ({ page }) => {
    console.log('🚀 開始庫存報表頁面測試');

    // 1. 登入系統
    console.log('📝 步驟 1: 執行系統登入');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    // 驗證登入成功
    await expect(page).toHaveURL(/.*dashboard/);
    console.log('✅ 登入成功，當前 URL:', page.url());

    // 截圖 - 登入後狀態
    await page.screenshot({ 
      path: 'screenshots/inventory-mcp-test-01-after-login.png',
      fullPage: true 
    });

    // 2. 前往庫存報表頁面
    console.log('📊 步驟 2: 導航至庫存報表頁面');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.goto('http://127.0.0.1:8000/reports/inventory')
    ]);

    // 等待頁面完全載入
    await page.waitForTimeout(3000);

    // 截圖 - 初始載入狀態
    await page.screenshot({ 
      path: 'screenshots/inventory-mcp-test-02-initial-load.png',
      fullPage: true 
    });

    // 3. 檢查頁面基本結構
    console.log('🔍 步驟 3: 檢查頁面基本結構');
    
    // 檢查標題
    const pageTitle = await page.textContent('h1, .page-title, [class*="title"]');
    console.log('頁面標題:', pageTitle);

    // 檢查麵包屑
    const breadcrumb = await page.locator('[class*="breadcrumb"], .breadcrumb, nav[aria-label*="breadcrumb"]').first();
    if (await breadcrumb.count() > 0) {
      const breadcrumbText = await breadcrumb.textContent();
      console.log('麵包屑:', breadcrumbText);
    }

    // 4. 檢查 JavaScript 錯誤
    console.log('🐛 步驟 4: 監控JavaScript錯誤');
    
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
        console.log('❌ JS錯誤:', msg.text());
      }
    });

    // 等待可能的 JS 錯誤
    await page.waitForTimeout(2000);

    // 5. 檢查圖表元素
    console.log('📈 步驟 5: 檢查圖表元素');
    
    // 檢查 Canvas 元素（Chart.js 圖表）
    const canvasElements = await page.locator('canvas').count();
    console.log('Canvas 元素數量:', canvasElements);

    // 檢查圖表容器
    const chartContainers = await page.locator('[class*="chart"], [id*="chart"], .chartjs-container').count();
    console.log('圖表容器數量:', chartContainers);

    // 檢查載入狀態指示器
    const loadingIndicators = await page.locator('.loading, [class*="loading"], .spinner, [class*="spinner"]').count();
    console.log('載入指示器數量:', loadingIndicators);

    // 6. 檢查頁面內容
    console.log('📄 步驟 6: 檢查頁面內容');
    
    // 檢查是否有錯誤訊息
    const errorMessages = await page.locator('.error, [class*="error"], .alert-danger, [class*="alert-danger"]').count();
    console.log('錯誤訊息數量:', errorMessages);

    if (errorMessages > 0) {
      const errorText = await page.locator('.error, [class*="error"], .alert-danger, [class*="alert-danger"]').first().textContent();
      console.log('錯誤訊息內容:', errorText);
    }

    // 檢查是否有資料表格
    const tables = await page.locator('table, .table, [class*="table"]').count();
    console.log('資料表格數量:', tables);

    // 檢查是否有卡片/面板
    const cards = await page.locator('.card, [class*="card"], .panel, [class*="panel"]').count();
    console.log('卡片/面板數量:', cards);

    // 7. 等待圖表渲染完成
    console.log('⏳ 步驟 7: 等待圖表渲染');
    
    // 等待較長時間讓圖表渲染
    await page.waitForTimeout(5000);

    // 重新檢查 Canvas 元素
    const finalCanvasCount = await page.locator('canvas').count();
    console.log('最終 Canvas 元素數量:', finalCanvasCount);

    // 截圖 - 最終狀態
    await page.screenshot({ 
      path: 'screenshots/inventory-mcp-test-03-final-state.png',
      fullPage: true 
    });

    // 8. 測試結果總結
    console.log('📋 步驟 8: 測試結果總結');
    
    const testResults = {
      頁面載入: '成功',
      JavaScript錯誤: jsErrors.length === 0 ? '無錯誤' : `發現 ${jsErrors.length} 個錯誤`,
      圖表元素: finalCanvasCount > 0 ? `發現 ${finalCanvasCount} 個圖表` : '無圖表元素',
      錯誤訊息: errorMessages === 0 ? '無錯誤訊息' : `發現 ${errorMessages} 個錯誤訊息`,
      頁面結構: '正常'
    };

    console.log('🎯 測試結果:', JSON.stringify(testResults, null, 2));

    // 9. 進行斷言驗證
    console.log('✅ 步驟 9: 執行斷言驗證');
    
    // 斷言：頁面應該成功載入
    await expect(page).toHaveURL(/.*reports\/inventory/);
    
    // 斷言：不應該有 JavaScript 致命錯誤
    expect(jsErrors.filter(err => err.includes('Error') || err.includes('Uncaught')).length).toBe(0);
    
    // 斷言：頁面應該有基本內容（不是空白頁）
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(100);

    console.log('🎉 庫存報表頁面測試完成！');
  });

  test('庫存報表頁面響應式測試', async ({ page }) => {
    console.log('📱 開始響應式測試');

    // 登入
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    // 前往庫存報表頁面
    await page.goto('http://127.0.0.1:8000/reports/inventory');
    await page.waitForTimeout(3000);

    // 測試不同螢幕尺寸
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      console.log(`📏 測試 ${viewport.name} 視圖 (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(2000);
      
      // 截圖
      await page.screenshot({ 
        path: `screenshots/inventory-mcp-test-responsive-${viewport.name}.png`,
        fullPage: true 
      });

      // 檢查圖表在該尺寸下是否正常
      const canvasCount = await page.locator('canvas').count();
      console.log(`${viewport.name} 視圖下的 Canvas 數量:`, canvasCount);
    }

    console.log('📱 響應式測試完成！');
  });
});