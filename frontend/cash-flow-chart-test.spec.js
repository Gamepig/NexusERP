import { test, expect } from '@playwright/test';

test.describe('現金流量表圖表功能測試', () => {
  test('測試現金流量表頁面和圖表載入', async ({ page }) => {
    // 設定瀏覽器視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 訪問登入頁面
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 填寫登入表單
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 點擊登入按鈕
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 檢查是否成功登入（確認 URL 變化或頁面內容）
    await expect(page).toHaveURL(/dashboard|reports/);
    
    // 直接訪問現金流量表頁面
    await page.goto('http://127.0.0.1:8000/reports/financial/cash-flow');
    await page.waitForLoadState('networkidle');
    
    // 檢查頁面基本元素
    await expect(page.locator('h1')).toContainText('現金流量表');
    
    // 檢查現金流摘要卡片
    await expect(page.locator('text=營業活動現金流')).toBeVisible();
    await expect(page.locator('text=投資活動現金流')).toBeVisible();
    await expect(page.locator('text=籌資活動現金流')).toBeVisible();
    
    // 檢查現金流量表明細表格
    await expect(page.locator('text=現金流量表明細')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
    
    // 檢查圖表區域是否存在
    await expect(page.locator('text=現金流趨勢分析')).toBeVisible();
    await expect(page.locator('canvas#cashFlowChart')).toBeVisible();
    
    // 等待 Chart.js 載入完成
    await page.waitForFunction(() => {
      return window.Chart !== undefined;
    }, { timeout: 10000 });
    
    // 檢查 Chart.js 是否正確載入並初始化
    await page.waitForFunction(() => {
      const canvas = document.getElementById('cashFlowChart');
      return canvas && canvas.chart !== undefined;
    }, { timeout: 15000 });
    
    // 檢查圖表是否有數據
    const chartExists = await page.evaluate(() => {
      const canvas = document.getElementById('cashFlowChart');
      if (!canvas || !canvas.chart) return false;
      
      const chart = canvas.chart;
      return chart.data && chart.data.datasets && chart.data.datasets.length > 0;
    });
    
    expect(chartExists).toBe(true);
    
    // 檢查圖表圖例
    const legendExists = await page.evaluate(() => {
      const canvas = document.getElementById('cashFlowChart');
      if (!canvas || !canvas.chart) return false;
      
      const chart = canvas.chart;
      const datasets = chart.data.datasets;
      
      // 檢查是否有4條線：營業活動、投資活動、籌資活動、淨現金流
      const expectedLabels = ['營業活動現金流', '投資活動現金流', '籌資活動現金流', '淨現金流'];
      const actualLabels = datasets.map(dataset => dataset.label);
      
      return expectedLabels.every(label => actualLabels.includes(label));
    });
    
    expect(legendExists).toBe(true);
    
    // 檢查圖表顏色配置
    const colorsCorrect = await page.evaluate(() => {
      const canvas = document.getElementById('cashFlowChart');
      if (!canvas || !canvas.chart) return false;
      
      const chart = canvas.chart;
      const datasets = chart.data.datasets;
      
      // 檢查顏色設定
      const expectedColors = {
        '營業活動現金流': 'rgba(34, 197, 94, 1)', // 綠色
        '投資活動現金流': 'rgba(249, 115, 22, 1)', // 橘色
        '籌資活動現金流': 'rgba(59, 130, 246, 1)', // 藍色
        '淨現金流': 'rgba(107, 114, 128, 1)' // 灰色
      };
      
      return datasets.every(dataset => {
        return expectedColors[dataset.label] === dataset.borderColor;
      });
    });
    
    expect(colorsCorrect).toBe(true);
    
    // 檢查現金流結構分析區域
    await expect(page.locator('text=現金流結構分析')).toBeVisible();
    
    // 檢查現金流健康指標
    await expect(page.locator('text=現金流健康指標')).toBeVisible();
    await expect(page.locator('text=營業現金流佔比')).toBeVisible();
    
    // 截圖記錄
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/cash-flow-chart-test.png',
      fullPage: true 
    });
    
    console.log('✅ 現金流量表圖表功能測試完成');
    console.log('📸 截圖已保存到: cash-flow-chart-test.png');
  });

  test('測試深色模式下的圖表適應', async ({ page }) => {
    // 先登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 訪問現金流量表
    await page.goto('http://127.0.0.1:8000/reports/financial/cash-flow');
    await page.waitForLoadState('networkidle');
    
    // 等待圖表載入
    await page.waitForFunction(() => {
      const canvas = document.getElementById('cashFlowChart');
      return canvas && canvas.chart !== undefined;
    }, { timeout: 15000 });
    
    // 檢查是否有深色模式切換功能
    const darkModeToggle = page.locator('button[data-theme-toggle], .theme-toggle, [class*="dark"], [class*="theme"]');
    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.first().click();
      await page.waitForTimeout(1000);
      
      // 截圖深色模式
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/frontend/cash-flow-chart-dark-mode.png',
        fullPage: true 
      });
      
      console.log('📸 深色模式截圖已保存');
    } else {
      console.log('ℹ️ 未找到深色模式切換按鈕，跳過深色模式測試');
    }
  });
  
  test('測試響應式設計', async ({ page }) => {
    // 先登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 訪問現金流量表
    await page.goto('http://127.0.0.1:8000/reports/financial/cash-flow');
    await page.waitForLoadState('networkidle');
    
    // 測試平板大小
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // 檢查圖表在小螢幕下是否可見
    await expect(page.locator('canvas#cashFlowChart')).toBeVisible();
    
    // 測試手機大小
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    await expect(page.locator('canvas#cashFlowChart')).toBeVisible();
    
    // 截圖手機版面
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/cash-flow-chart-mobile.png',
      fullPage: true 
    });
    
    console.log('📱 手機版截圖已保存');
  });
});