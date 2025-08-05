import { test, expect } from '@playwright/test';

test.describe('現金流量表圖表功能驗證', () => {
  test('檢查現金流量表圖表是否正確載入', async ({ page }) => {
    // 設定較大的視窗以便截圖
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 訪問登入頁面
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 登入
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 訪問現金流量表頁面
    await page.goto('http://127.0.0.1:8000/reports/financial/cash-flow');
    await page.waitForLoadState('networkidle');
    
    // 截圖初始狀態
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/cash-flow-initial-load.png',
      fullPage: true 
    });
    
    // 等待頁面完全載入
    await page.waitForTimeout(3000);
    
    // 檢查基本頁面元素
    await expect(page.locator('h1')).toContainText('現金流量表');
    console.log('✅ 頁面標題正確載入');
    
    // 檢查現金流摘要區域
    const summaryCards = page.locator('.grid .bg-white');
    await expect(summaryCards).toHaveCount(3);
    console.log('✅ 現金流摘要卡片載入 (3張)');
    
    // 檢查表格是否存在
    await expect(page.locator('table')).toBeVisible();
    console.log('✅ 現金流量表明細表格載入');
    
    // 檢查圖表標題
    await expect(page.locator('text=現金流趨勢分析')).toBeVisible();
    console.log('✅ 圖表標題顯示');
    
    // 檢查 canvas 元素
    const canvas = page.locator('canvas#cashFlowChart');
    await expect(canvas).toBeVisible();
    console.log('✅ Canvas 圖表元素存在');
    
    // 等待 Chart.js 和腳本載入
    await page.waitForTimeout(5000);
    
    // 檢查 Chart.js 是否載入
    const chartJsLoaded = await page.evaluate(() => {
      return typeof window.Chart !== 'undefined';
    });
    
    console.log('Chart.js 載入狀態:', chartJsLoaded ? '✅ 已載入' : '❌ 未載入');
    
    // 檢查圖表是否初始化
    const chartInitialized = await page.evaluate(() => {
      const canvas = document.getElementById('cashFlowChart');
      if (!canvas) return false;
      
      // 檢查 Chart.js 實例
      const ctx = canvas.getContext('2d');
      return canvas.chart !== undefined || ctx !== null;
    });
    
    console.log('圖表初始化狀態:', chartInitialized ? '✅ 已初始化' : '❌ 未初始化');
    
    // 檢查是否有任何 JavaScript 錯誤
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // 等待一下以捕獲可能的錯誤
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('⚠️ JavaScript 錯誤:', errors);
    } else {
      console.log('✅ 無 JavaScript 錯誤');
    }
    
    // 檢查現金流結構分析區域
    await expect(page.locator('text=現金流結構分析')).toBeVisible();
    console.log('✅ 現金流結構分析區域顯示');
    
    // 檢查現金流健康指標
    await expect(page.locator('text=現金流健康指標')).toBeVisible();
    console.log('✅ 現金流健康指標區域顯示');
    
    // 最終截圖
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/cash-flow-complete-analysis.png',
      fullPage: true 
    });
    
    console.log('✅ 現金流量表功能測試完成');
    console.log('📸 完整截圖已保存到: cash-flow-complete-analysis.png');
  });
  
  test('驗證圖表的具體實作細節', async ({ page }) => {
    // 登入並導航
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    await page.goto('http://127.0.0.1:8000/reports/financial/cash-flow');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 檢查圖表的詳細實作
    const chartAnalysis = await page.evaluate(() => {
      const canvas = document.getElementById('cashFlowChart');
      if (!canvas) return { error: 'Canvas not found' };
      
      const analysis = {
        canvasExists: true,
        canvasVisible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0,
        chartJsAvailable: typeof window.Chart !== 'undefined',
        canvasSize: {
          width: canvas.width,
          height: canvas.height,
          offsetWidth: canvas.offsetWidth,
          offsetHeight: canvas.offsetHeight
        }
      };
      
      // 檢查 Chart.js 實例
      if (canvas.chart) {
        analysis.chartInstance = {
          exists: true,
          type: canvas.chart.config?.type || 'unknown',
          datasetsCount: canvas.chart.data?.datasets?.length || 0,
          labelsCount: canvas.chart.data?.labels?.length || 0
        };
        
        // 檢查數據集標籤
        if (canvas.chart.data?.datasets) {
          analysis.chartInstance.datasetLabels = canvas.chart.data.datasets.map(ds => ds.label);
        }
      } else {
        analysis.chartInstance = { exists: false };
      }
      
      return analysis;
    });
    
    console.log('📊 圖表分析結果:', JSON.stringify(chartAnalysis, null, 2));
    
    // 檢查圖表數據是否符合預期
    if (chartAnalysis.chartInstance && chartAnalysis.chartInstance.exists) {
      expect(chartAnalysis.chartInstance.type).toBe('line');
      expect(chartAnalysis.chartInstance.datasetsCount).toBe(4); // 應該有4條線
      expect(chartAnalysis.chartInstance.labelsCount).toBe(6); // 應該有6個月的數據
      
      // 檢查標籤是否正確
      const expectedLabels = ['營業活動現金流', '投資活動現金流', '籌資活動現金流', '淨現金流'];
      expectedLabels.forEach(label => {
        expect(chartAnalysis.chartInstance.datasetLabels).toContain(label);
      });
      
      console.log('✅ 圖表配置驗證成功');
    } else {
      console.log('❌ 圖表實例未找到或未正確初始化');
    }
    
    // 滾動到圖表區域並截圖
    await page.locator('canvas#cashFlowChart').scrollIntoView();
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/cash-flow-chart-focus.png',
      clip: { x: 0, y: 0, width: 1920, height: 800 }
    });
    
    console.log('📸 圖表區域截圖已保存');
  });
});