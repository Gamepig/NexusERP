import { test, expect } from '@playwright/test';

test.describe('庫存報表頁面問題診斷', () => {
  test.beforeEach(async ({ page }) => {
    // 設置長時間等待
    page.setDefaultTimeout(30000);
    
    // 前往首頁並登入
    await page.goto('/');
    await page.click('text=登入');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test('庫存報表完整問題分析', async ({ page }) => {
    console.log('=== 開始庫存報表問題診斷 ===');
    
    // 監聽 JavaScript 錯誤
    const jsErrors = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
      console.log('❌ JavaScript 錯誤:', error.message);
    });
    
    // 監聽網路請求失敗
    const failedRequests = [];
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
        console.log(`❌ 請求失敗: ${response.status()} ${response.url()}`);
      }
    });
    
    // 1. 先測試銷售報表作為對比
    console.log('\n=== 1. 銷售報表對比測試 ===');
    await page.goto('/reports/sales');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(5000);
    
    // 拍攝銷售報表截圖
    await page.screenshot({ 
      path: 'screenshots/comparison-sales-reports.png',
      fullPage: true 
    });
    
    // 檢查銷售報表的元素
    const salesData = await page.evaluate(() => {
      return {
        canvasCount: document.querySelectorAll('canvas').length,
        chartContainers: document.querySelectorAll('[class*="chart"], [id*="chart"]').length,
        hasChartJS: typeof window.Chart !== 'undefined',
        bodyLength: document.body.textContent.length,
        hasLoadingElements: document.querySelectorAll('.loading, .spinner').length,
        hasErrorElements: document.querySelectorAll('.error, .alert-danger').length
      };
    });
    
    console.log('銷售報表分析結果:');
    console.log('  Canvas 數量:', salesData.canvasCount);
    console.log('  圖表容器數量:', salesData.chartContainers);
    console.log('  Chart.js 可用:', salesData.hasChartJS);
    console.log('  頁面內容長度:', salesData.bodyLength);
    console.log('  載入元素:', salesData.hasLoadingElements);
    console.log('  錯誤元素:', salesData.hasErrorElements);
    
    // 2. 測試庫存報表
    console.log('\n=== 2. 庫存報表問題診斷 ===');
    await page.goto('/reports/inventory');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(8000); // 給更多時間讓圖表加載
    
    // 拍攝庫存報表截圖
    await page.screenshot({ 
      path: 'screenshots/diagnosis-inventory-reports.png',
      fullPage: true 
    });
    
    // 檢查庫存報表的元素
    const inventoryData = await page.evaluate(() => {
      return {
        canvasCount: document.querySelectorAll('canvas').length,
        chartContainers: document.querySelectorAll('[class*="chart"], [id*="chart"]').length,
        hasChartJS: typeof window.Chart !== 'undefined',
        bodyLength: document.body.textContent.length,
        hasLoadingElements: document.querySelectorAll('.loading, .spinner').length,
        hasErrorElements: document.querySelectorAll('.error, .alert-danger').length,
        hasInventoryData: !!(window.inventoryData || window.reportData),
        windowVars: Object.keys(window).filter(key => 
          key.toLowerCase().includes('inventory') || 
          key.toLowerCase().includes('chart') ||
          key.toLowerCase().includes('report')
        ),
        scriptTags: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline').filter(Boolean),
        divCount: document.querySelectorAll('div').length,
        hasMainContent: !!document.querySelector('main, .main-content, .content')
      };
    });
    
    console.log('庫存報表分析結果:');
    console.log('  Canvas 數量:', inventoryData.canvasCount);
    console.log('  圖表容器數量:', inventoryData.chartContainers);
    console.log('  Chart.js 可用:', inventoryData.hasChartJS);
    console.log('  頁面內容長度:', inventoryData.bodyLength);
    console.log('  載入元素:', inventoryData.hasLoadingElements);
    console.log('  錯誤元素:', inventoryData.hasErrorElements);
    console.log('  有庫存數據:', inventoryData.hasInventoryData);
    console.log('  相關變數:', inventoryData.windowVars);
    console.log('  JavaScript 文件:', inventoryData.scriptTags.length);
    console.log('  DIV 元素數量:', inventoryData.divCount);
    console.log('  有主要內容:', inventoryData.hasMainContent);
    
    // 3. 對比分析
    console.log('\n=== 3. 對比分析結果 ===');
    console.log('頁面內容差異:', salesData.bodyLength - inventoryData.bodyLength, '字符');
    console.log('Canvas 元素差異:', salesData.canvasCount - inventoryData.canvasCount);
    console.log('圖表容器差異:', salesData.chartContainers - inventoryData.chartContainers);
    
    // 4. 問題診斷
    console.log('\n=== 4. 問題診斷 ===');
    
    if (inventoryData.canvasCount === 0 && salesData.canvasCount > 0) {
      console.log('🔍 主要問題: 庫存報表缺少 Canvas 元素（圖表）');
    }
    
    if (!inventoryData.hasChartJS && salesData.hasChartJS) {
      console.log('🔍 問題: 庫存報表頁面 Chart.js 不可用');
    }
    
    if (inventoryData.bodyLength < salesData.bodyLength * 0.5) {
      console.log('🔍 問題: 庫存報表內容明顯少於銷售報表');
    }
    
    if (jsErrors.length > 0) {
      console.log('🔍 JavaScript 錯誤:', jsErrors);
    }
    
    if (failedRequests.length > 0) {
      console.log('🔍 網路請求失敗:', failedRequests);
    }
    
    // 5. 檢查頁面源碼關鍵部分
    const pageSource = await page.content();
    console.log('\n=== 5. 頁面源碼分析 ===');
    console.log('包含 Chart.js:', pageSource.includes('chart.js') || pageSource.includes('Chart.js'));
    console.log('包含 Canvas:', pageSource.includes('<canvas'));
    console.log('包含庫存相關 JavaScript:', pageSource.includes('inventory') && pageSource.includes('script'));
    console.log('包含報表容器:', pageSource.includes('report-container') || pageSource.includes('chart-container'));
    
    // 輸出頁面 HTML 的關鍵部分（搜索圖表相關的內容）
    const chartRelatedContent = pageSource.match(/<canvas[\s\S]*?<\/canvas>|<div[^>]*chart[^>]*>[\s\S]*?<\/div>|<script[^>]*>[\s\S]*?chart[\s\S]*?<\/script>/gi);
    if (chartRelatedContent) {
      console.log('\n找到圖表相關內容:', chartRelatedContent.length, '個匹配');
      chartRelatedContent.slice(0, 3).forEach((content, index) => {
        console.log(`匹配 ${index + 1}:`, content.substring(0, 200) + '...');
      });
    } else {
      console.log('\n⚠️ 未找到任何圖表相關的 HTML 內容');
    }
    
    console.log('\n=== 診斷完成 ===');
  });
});