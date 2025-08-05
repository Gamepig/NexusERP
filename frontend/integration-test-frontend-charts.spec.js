import { test, expect } from '@playwright/test';

/**
 * NexusERP 前端圖表整合測試
 * 
 * 測試項目：
 * 1. Chart.js 載入問題診斷
 * 2. 報表頁面圖表渲染
 * 3. JavaScript 模組載入順序
 * 4. CSS 樣式衝突檢查
 */

test.describe('NexusERP Frontend Charts Integration Tests', () => {
  const baseURL = 'http://127.0.0.1:8000';
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  test.beforeEach(async ({ page }) => {
    // 登入測試用戶
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${baseURL}/dashboard`);
  });

  test('1. 診斷圖表庫載入問題', async ({ page }) => {
    console.log('📊 診斷圖表庫載入問題...');
    
    // 前往報表中心
    await page.goto(`${baseURL}/reports`);
    await page.waitForTimeout(2000);
    
    // 檢查 JavaScript 錯誤
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
        console.log('🔴 JavaScript Error:', msg.text());
      }
    });
    
    // 檢查網路請求失敗
    const networkErrors = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()} ${response.url()}`);
        console.log('🌐 Network Error:', response.status(), response.url());
      }
    });
    
    // 檢查圖表庫是否載入
    const chartLibraries = await page.evaluate(() => {
      return {
        chartjs: typeof window.Chart !== 'undefined',
        echarts: typeof window.echarts !== 'undefined',
        d3: typeof window.d3 !== 'undefined',
        jquery: typeof window.$ !== 'undefined',
        bootstrap: typeof window.bootstrap !== 'undefined'
      };
    });
    
    console.log('📊 圖表庫載入狀況:', chartLibraries);
    
    // 檢查 Vite 資源載入
    const viteAssets = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const links = Array.from(document.querySelectorAll('link[href]'));
      return {
        scripts: scripts.map(s => s.src),
        stylesheets: links.filter(l => l.rel === 'stylesheet').map(l => l.href)
      };
    });
    
    console.log('🔧 Vite 資源載入:', viteAssets);
    
    await page.screenshot({ path: 'screenshots/chart-diagnosis-reports-center.png' });
  });

  test('2. 報表頁面圖表渲染測試', async ({ page }) => {
    console.log('📈 測試報表頁面圖表渲染...');
    
    const reportPages = [
      { name: '銷售總覽', url: '/reports/sales' },
      { name: '庫存總覽', url: '/reports/inventory' },
      { name: '財務總覽', url: '/reports/financial' },
      { name: '採購總覽', url: '/reports/purchase' }
    ];
    
    for (const report of reportPages) {
      console.log(`🔍 測試 ${report.name}...`);
      
      await page.goto(`${baseURL}${report.url}`);
      await page.waitForTimeout(3000);
      
      // 檢查 Canvas 元素
      const canvasCount = await page.locator('canvas').count();
      console.log(`  Canvas 元素數量: ${canvasCount}`);
      
      // 檢查載入文字
      const loadingTexts = await page.locator('text=載入中, text=圖表載入中').count();
      console.log(`  載入文字數量: ${loadingTexts}`);
      
      // 檢查圖表容器
      const chartContainers = await page.locator('[id*="chart"], [class*="chart"], .chart-container').count();
      console.log(`  圖表容器數量: ${chartContainers}`);
      
      // 截圖記錄
      await page.screenshot({ path: `screenshots/chart-test-${report.name.replace('/', '-')}.png` });
      
      if (canvasCount === 0 && loadingTexts > 0) {
        console.log(`  ❌ ${report.name}: 圖表未渲染，顯示載入狀態`);
      } else if (canvasCount > 0) {
        console.log(`  ✅ ${report.name}: 找到 ${canvasCount} 個圖表`);
      }
    }
  });

  test('3. 檢查圖表初始化程式碼', async ({ page }) => {
    console.log('⚙️ 檢查圖表初始化程式碼...');
    
    await page.goto(`${baseURL}/reports/sales`);
    await page.waitForTimeout(2000);
    
    // 檢查DOM就緒狀態
    const domReady = await page.evaluate(() => {
      return {
        readyState: document.readyState,
        hasChartContainers: document.querySelectorAll('[id*="chart"]').length > 0,
        hasCanvasElements: document.querySelectorAll('canvas').length > 0
      };
    });
    console.log('🔧 DOM 就緒狀態:', domReady);
    
    // 檢查圖表初始化函數
    const chartFunctions = await page.evaluate(() => {
      const functions = [];
      
      // 檢查全域函數
      if (typeof window.initCharts === 'function') functions.push('initCharts');
      if (typeof window.loadChart === 'function') functions.push('loadChart');
      if (typeof window.renderChart === 'function') functions.push('renderChart');
      
      // 檢查事件監聽器
      const hasDocumentReady = document.readyState === 'complete';
      
      return {
        functions,
        hasDocumentReady,
        windowLoadComplete: performance.timing.loadEventEnd > 0
      };
    });
    console.log('🎯 圖表函數檢查:', chartFunctions);
    
    // 執行任何可用的圖表初始化函數
    try {
      await page.evaluate(() => {
        if (typeof window.initCharts === 'function') {
          console.log('嘗試執行 initCharts()');
          window.initCharts();
        }
      });
      console.log('✅ 嘗試執行圖表初始化函數');
    } catch (error) {
      console.log('❌ 圖表初始化失敗:', error.message);
    }
    
    await page.waitForTimeout(2000);
    const canvasAfterInit = await page.locator('canvas').count();
    console.log(`📊 初始化後 Canvas 數量: ${canvasAfterInit}`);
    
    await page.screenshot({ path: 'screenshots/chart-init-test.png' });
  });

  test('4. CSS 樣式衝突檢查', async ({ page }) => {
    console.log('🎨 檢查 CSS 樣式衝突...');
    
    await page.goto(`${baseURL}/reports/sales`);
    await page.waitForTimeout(2000);
    
    // 檢查圖表容器的 CSS 樣式
    const containerStyles = await page.evaluate(() => {
      const containers = document.querySelectorAll('[id*="chart"], [class*="chart"]');
      const styles = [];
      
      containers.forEach((container, index) => {
        const computedStyle = window.getComputedStyle(container);
        styles.push({
          element: container.tagName + (container.id ? '#' + container.id : ''),
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          zIndex: computedStyle.zIndex,
          position: computedStyle.position,
          width: computedStyle.width,
          height: computedStyle.height
        });
      });
      
      return styles;
    });
    
    console.log('🎨 圖表容器樣式:', containerStyles);
    
    // 檢查 Canvas 元素樣式
    const canvasStyles = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      const styles = [];
      
      canvases.forEach((canvas, index) => {
        const computedStyle = window.getComputedStyle(canvas);
        styles.push({
          index,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          width: computedStyle.width,
          height: computedStyle.height
        });
      });
      
      return styles;
    });
    
    console.log('🖼️ Canvas 元素樣式:', canvasStyles);
    
    // 檢查潛在的隱藏元素
    const hiddenElements = containerStyles.filter(style => 
      style.display === 'none' || 
      style.visibility === 'hidden' || 
      style.opacity === '0'
    );
    
    if (hiddenElements.length > 0) {
      console.log('⚠️ 發現隱藏的圖表容器:', hiddenElements);
    } else {
      console.log('✅ 未發現樣式衝突問題');
    }
  });

  test('5. 修復圖表載入問題測試', async ({ page }) => {
    console.log('🔧 嘗試修復圖表載入問題...');
    
    await page.goto(`${baseURL}/reports/sales`);
    
    // 嘗試手動載入 Chart.js（如果未載入）
    const chartJsLoaded = await page.evaluate(() => {
      return typeof window.Chart !== 'undefined';
    });
    
    if (!chartJsLoaded) {
      console.log('📥 嘗試手動載入 Chart.js...');
      await page.addScriptTag({
        url: 'https://cdn.jsdelivr.net/npm/chart.js'
      });
      
      await page.waitForTimeout(1000);
      
      const chartJsNowLoaded = await page.evaluate(() => {
        return typeof window.Chart !== 'undefined';
      });
      
      if (chartJsNowLoaded) {
        console.log('✅ Chart.js 手動載入成功');
        
        // 嘗試創建測試圖表
        await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          canvas.id = 'test-chart';
          document.body.appendChild(canvas);
          
          const ctx = canvas.getContext('2d');
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['A', 'B', 'C'],
              datasets: [{
                label: 'Test Data',
                data: [12, 19, 3],
                backgroundColor: 'rgba(75, 192, 192, 0.2)'
              }]
            }
          });
        });
        
        await page.waitForTimeout(1000);
        const testCanvasExists = await page.locator('#test-chart').count();
        console.log(`🧪 測試圖表創建結果: ${testCanvasExists > 0 ? '成功' : '失敗'}`);
        
        await page.screenshot({ path: 'screenshots/chart-manual-fix-test.png' });
      } else {
        console.log('❌ Chart.js 手動載入失敗');
      }
    } else {
      console.log('✅ Chart.js 已載入，無需手動載入');
    }
  });
});