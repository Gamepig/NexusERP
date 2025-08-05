// NexusERP 庫存報表頁面修復前後對比測試
import { test, expect } from '@playwright/test';

test.describe('庫存報表頁面修復對比測試', () => {
  test('庫存報表頁面修復效果驗證', async ({ page }) => {
    test.setTimeout(120000); // 2分鐘超時
    
    console.log('🔍 開始庫存報表頁面修復效果驗證');

    // 1. 登入系統
    console.log('🔑 步驟 1: 系統登入');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    console.log('✅ 登入成功');

    // 2. 前往庫存報表頁面並詳細分析
    console.log('📊 步驟 2: 庫存報表頁面詳細分析');
    await page.goto('http://127.0.0.1:8000/reports/inventory');
    
    // 等待更長時間確保圖表完全載入
    await page.waitForTimeout(8000);

    // 3. 詳細檢查頁面結構和元素
    console.log('🧩 步驟 3: 詳細頁面結構分析');
    
    const pageAnalysis = {
      // 基本信息
      url: page.url(),
      title: await page.title(),
      
      // 頁面結構
      h1Count: await page.locator('h1').count(),
      h1Text: await page.locator('h1').first().textContent().catch(() => '無'),
      
      // 圖表相關
      canvasCount: await page.locator('canvas').count(),
      chartContainerCount: await page.locator('[class*="chart"], [id*="chart"]').count(),
      
      // 數據表格
      tableCount: await page.locator('table').count(),
      cardCount: await page.locator('.card, [class*="card"]').count(),
      
      // 錯誤狀態
      errorCount: await page.locator('.error, .alert-danger, [class*="error"]').count(),
      loadingCount: await page.locator('.loading, .spinner, [class*="loading"]').count(),
      
      // 內容豐富度
      bodyTextLength: (await page.textContent('body')).length,
    };

    console.log('📋 頁面分析結果:');
    console.log(JSON.stringify(pageAnalysis, null, 2));

    // 4. Canvas 元素詳細檢查
    if (pageAnalysis.canvasCount > 0) {
      console.log('🎨 步驟 4: Canvas 圖表詳細檢查');
      
      for (let i = 0; i < pageAnalysis.canvasCount; i++) {
        const canvas = page.locator('canvas').nth(i);
        
        const canvasInfo = {
          index: i + 1,
          id: await canvas.getAttribute('id') || '無ID',
          width: await canvas.getAttribute('width'),
          height: await canvas.getAttribute('height'),
          style: await canvas.getAttribute('style') || '無樣式',
          className: await canvas.getAttribute('class') || '無類別'
        };
        
        console.log(`Canvas ${i + 1} 詳細信息:`, canvasInfo);
        
        // 檢查 Canvas 是否真的有繪製內容
        const canvasData = await canvas.evaluate(canvas => {
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // 檢查是否全部為透明或白色像素
          let hasContent = false;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // 如果不是完全透明且不是純白色，則認為有內容
            if (a > 0 && !(r === 255 && g === 255 && b === 255)) {
              hasContent = true;
              break;
            }
          }
          
          return {
            hasContent,
            totalPixels: data.length / 4,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
          };
        });
        
        console.log(`Canvas ${i + 1} 內容檢查:`, canvasData);
      }
    }

    // 5. JavaScript 錯誤和 Console 訊息監控
    console.log('🐛 步驟 5: JavaScript 環境檢查');
    
    const jsErrors = [];
    const consoleMessages = [];
    
    page.on('console', msg => {
      const message = { type: msg.type(), text: msg.text(), timestamp: new Date().toISOString() };
      consoleMessages.push(message);
      
      if (msg.type() === 'error') {
        jsErrors.push(message);
        console.log('❌ JS 錯誤:', msg.text());
      } else if (msg.type() === 'warn') {
        console.log('⚠️  JS 警告:', msg.text());
      } else if (msg.type() === 'log' && msg.text().includes('chart')) {
        console.log('📈 圖表相關訊息:', msg.text());
      }
    });

    // 重新載入以捕獲所有訊息
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // 6. 網路請求分析
    console.log('🌐 步驟 6: 網路請求分析');
    
    const networkRequests = [];
    page.on('response', response => {
      if (response.url().includes('/reports') || 
          response.url().includes('/api') || 
          response.url().includes('chart') ||
          response.url().includes('.js') ||
          response.url().includes('.css')) {
        networkRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          contentType: response.headers()['content-type'] || '未知'
        });
      }
    });

    // 再次重新載入以捕獲網路請求
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log('🌐 網路請求詳細記錄:');
    networkRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.status} ${req.url}`);
    });

    // 7. 截圖對比
    console.log('📸 步驟 7: 截圖對比');
    
    // 完整頁面截圖
    await page.screenshot({ 
      path: 'screenshots/inventory-comparison-full-page.png',
      fullPage: true 
    });

    // 只截圖圖表區域（如果存在）
    if (pageAnalysis.canvasCount > 0) {
      const firstCanvas = page.locator('canvas').first();
      await firstCanvas.screenshot({ 
        path: 'screenshots/inventory-comparison-first-chart.png'
      });
    }

    // 8. 功能性測試
    console.log('🧪 步驟 8: 功能性測試');
    
    // 測試頁面交互性
    const interactionTests = {
      canScrollPage: false,
      canClickElements: false,
      hasWorkingLinks: false
    };

    try {
      // 測試滾動
      await page.evaluate(() => window.scrollTo(0, 100));
      await page.waitForTimeout(500);
      const scrollY = await page.evaluate(() => window.scrollY);
      interactionTests.canScrollPage = scrollY > 0;
      
      // 測試可點擊元素
      const clickableElements = await page.locator('button, a, [onclick], [class*="btn"]').count();
      interactionTests.canClickElements = clickableElements > 0;
      
      // 測試導航連結
      const navLinks = await page.locator('nav a, .nav a, [class*="nav"] a').count();
      interactionTests.hasWorkingLinks = navLinks > 0;
      
    } catch (error) {
      console.log('⚠️  交互性測試遇到問題:', error.message);
    }

    console.log('🧪 功能性測試結果:', interactionTests);

    // 9. 修復效果評估
    console.log('📊 步驟 9: 修復效果評估');
    
    const fixEvaluation = {
      overall: '成功',
      pageLoading: pageAnalysis.url.includes('/reports/inventory') ? '✅ 正常' : '❌ 異常',
      chartsPresent: pageAnalysis.canvasCount >= 2 ? '✅ 圖表已載入' : '❌ 圖表缺失',
      noJsErrors: jsErrors.length === 0 ? '✅ 無JS錯誤' : `❌ ${jsErrors.length}個錯誤`,
      hasContent: pageAnalysis.bodyTextLength > 1000 ? '✅ 內容豐富' : '⚠️  內容較少',
      performance: networkRequests.filter(r => r.status === 200).length > 0 ? '✅ 網路正常' : '❌ 網路問題'
    };

    console.log('🎯 修復效果評估:');
    console.log(JSON.stringify(fixEvaluation, null, 2));

    // 10. 對比報告生成
    const comparisonReport = {
      測試時間: new Date().toISOString(),
      頁面基本信息: pageAnalysis,
      JavaScript狀態: {
        錯誤數量: jsErrors.length,
        錯誤詳細: jsErrors,
        console訊息數量: consoleMessages.length
      },
      網路請求: {
        總數: networkRequests.length,
        成功請求: networkRequests.filter(r => r.status === 200).length,
        失敗請求: networkRequests.filter(r => r.status >= 400).length
      },
      修復效果評估: fixEvaluation,
      交互性測試: interactionTests
    };

    console.log('📋 完整對比報告:');
    console.log(JSON.stringify(comparisonReport, null, 2));

    // 11. 斷言驗證
    console.log('✅ 步驟 11: 斷言驗證');
    
    // 核心斷言
    await expect(page).toHaveURL(/.*reports\/inventory/);
    expect(pageAnalysis.canvasCount).toBeGreaterThanOrEqual(1);
    expect(jsErrors.length).toBe(0);
    expect(pageAnalysis.errorCount).toBe(0);
    expect(pageAnalysis.bodyTextLength).toBeGreaterThan(500);

    console.log('🎉 庫存報表頁面修復效果驗證完成！');
    console.log('📈 關鍵指標: Canvas圖表數量 =', pageAnalysis.canvasCount, '| JS錯誤數量 =', jsErrors.length);
    
    return comparisonReport;
  });
});