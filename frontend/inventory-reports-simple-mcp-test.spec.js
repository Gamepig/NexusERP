// NexusERP 庫存報表頁面簡化 MCP Playwright 測試
import { test, expect } from '@playwright/test';

test.describe('庫存報表頁面測試', () => {
  test('庫存報表頁面完整測試', async ({ page }) => {
    test.setTimeout(120000); // 2分鐘超時
    
    console.log('🚀 開始庫存報表頁面測試');

    // 1. 前往登入頁面
    console.log('📝 步驟 1: 前往登入頁面');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');

    // 截圖 - 登入頁面
    await page.screenshot({ 
      path: 'screenshots/inventory-mcp-01-login-page.png',
      fullPage: true 
    });

    // 2. 執行登入
    console.log('🔑 步驟 2: 執行系統登入');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    // 截圖 - 登入後
    await page.screenshot({ 
      path: 'screenshots/inventory-mcp-02-after-login.png',
      fullPage: true 
    });

    console.log('✅ 登入成功，當前 URL:', page.url());

    // 3. 前往庫存報表頁面
    console.log('📊 步驟 3: 前往庫存報表頁面');
    await page.goto('http://127.0.0.1:8000/reports/inventory');
    await page.waitForTimeout(5000); // 等待頁面載入

    // 截圖 - 庫存報表頁面初始狀態
    await page.screenshot({ 
      path: 'screenshots/inventory-mcp-03-inventory-reports-initial.png',
      fullPage: true 
    });

    console.log('📄 當前 URL:', page.url());

    // 4. 檢查 JavaScript 錯誤
    console.log('🐛 步驟 4: 監控 JavaScript 錯誤');
    const jsErrors = [];
    const consoleMessages = [];
    
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
        console.log('❌ JS 錯誤:', msg.text());
      }
    });

    // 等待 JavaScript 執行
    await page.waitForTimeout(3000);

    // 5. 檢查頁面元素
    console.log('🔍 步驟 5: 檢查頁面元素');
    
    // 檢查頁面標題
    const pageTitle = await page.title();
    console.log('頁面標題:', pageTitle);

    // 檢查 H1 標題
    const h1Elements = await page.locator('h1').count();
    console.log('H1 元素數量:', h1Elements);
    
    if (h1Elements > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log('H1 內容:', h1Text);
    }

    // 檢查 Canvas 元素（圖表）
    const canvasElements = await page.locator('canvas').count();
    console.log('Canvas 元素數量:', canvasElements);

    // 如果有 Canvas，檢查其屬性
    if (canvasElements > 0) {
      for (let i = 0; i < canvasElements; i++) {
        const canvas = page.locator('canvas').nth(i);
        const width = await canvas.getAttribute('width');
        const height = await canvas.getAttribute('height');
        console.log(`Canvas ${i + 1}: ${width}x${height}`);
      }
    }

    // 檢查圖表容器
    const chartContainers = await page.locator('[class*="chart"], [id*="chart"]').count();
    console.log('圖表容器數量:', chartContainers);

    // 檢查載入狀態
    const loadingIndicators = await page.locator('.loading, .spinner, [class*="loading"], [class*="spinner"]').count();
    console.log('載入指示器數量:', loadingIndicators);

    // 檢查錯誤訊息
    const errorElements = await page.locator('.error, .alert-danger, [class*="error"]').count();
    console.log('錯誤元素數量:', errorElements);

    if (errorElements > 0) {
      const errorText = await page.locator('.error, .alert-danger, [class*="error"]').first().textContent();
      console.log('錯誤訊息:', errorText);
    }

    // 6. 檢查網路請求
    console.log('🌐 步驟 6: 檢查網路請求');
    
    // 監控 API 請求
    const apiRequests = [];
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/reports/')) {
        apiRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // 重新載入頁面以捕獲 API 請求
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log('API 請求記錄:', apiRequests);

    // 7. 最終檢查與截圖
    console.log('📸 步驟 7: 最終檢查與截圖');
    
    // 最終狀態截圖
    await page.screenshot({ 
      path: 'screenshots/inventory-mcp-04-final-state.png',
      fullPage: true 
    });

    // 重新檢查圖表元素
    const finalCanvasCount = await page.locator('canvas').count();
    console.log('最終 Canvas 元素數量:', finalCanvasCount);

    // 8. 測試結果總結
    console.log('📋 步驟 8: 測試結果總結');
    
    const testResults = {
      頁面載入: '成功',
      當前URL: page.url(),
      頁面標題: pageTitle,
      JavaScript錯誤數量: jsErrors.length,
      Canvas圖表數量: finalCanvasCount,
      圖表容器數量: chartContainers,
      錯誤元素數量: errorElements,
      API請求數量: apiRequests.length,
      Console訊息數量: consoleMessages.length
    };

    console.log('🎯 詳細測試結果:');
    console.log(JSON.stringify(testResults, null, 2));

    // 顯示 Console 訊息
    if (consoleMessages.length > 0) {
      console.log('📨 Console 訊息:');
      consoleMessages.forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
      });
    }

    // 顯示 JavaScript 錯誤
    if (jsErrors.length > 0) {
      console.log('❌ JavaScript 錯誤詳細:');
      jsErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // 9. 斷言驗證
    console.log('✅ 步驟 9: 執行斷言驗證');
    
    // 基本斷言
    await expect(page).toHaveURL(/.*reports\/inventory/);
    expect(pageTitle).toBeTruthy();
    
    // 頁面應該有基本內容
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(50);

    console.log('🎉 庫存報表頁面測試完成！');
    
    // 返回測試結果供外部使用
    return testResults;
  });
});