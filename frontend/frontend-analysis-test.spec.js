import { test, expect } from '@playwright/test';

test.describe('NexusERP Frontend Architecture Analysis', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('📊 報表系統架構分析', async () => {
    console.log('\n🔍 開始分析 NexusERP 報表系統前端架構...\n');
    
    // 1. 檢查報表中心頁面
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForLoadState('networkidle');
    
    // 截圖記錄現狀
    await page.screenshot({ path: 'screenshots/frontend-analysis-01-reports-center.png', fullPage: true });
    console.log('✅ 報表中心頁面載入成功');
    
    // 2. 檢查多租戶組件
    const companySwitcher = await page.locator('[x-data="companySwitcher()"]').count();
    console.log(`📋 多租戶切換組件: ${companySwitcher > 0 ? '✅ 存在' : '❌ 未找到'}`);
    
    if (companySwitcher > 0) {
      await page.screenshot({ path: 'screenshots/frontend-analysis-02-company-switcher.png' });
    }
    
    // 3. 檢查圖表載入狀況
    const salesReportButton = page.locator('a[href*="reports.sales.index"]');
    if (await salesReportButton.count() > 0) {
      await salesReportButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // 等待圖表載入
      
      // 檢查 Canvas 元素（Chart.js 圖表）
      const canvasElements = await page.locator('canvas').count();
      console.log(`📈 Canvas 圖表元素數量: ${canvasElements}`);
      
      // 檢查是否有圖表載入中的元素
      const loadingElements = await page.locator(':text("載入中"), :text("圖表載入中")').count();
      console.log(`⏳ 載入中元素: ${loadingElements}`);
      
      await page.screenshot({ path: 'screenshots/frontend-analysis-03-sales-charts.png', fullPage: true });
    }
    
    // 4. 檢查 Chart.js 和 NexusChartTheme
    const chartJs = await page.evaluate(() => {
      return {
        chartJsLoaded: typeof window.Chart !== 'undefined',
        nexusThemeLoaded: typeof window.NexusChartTheme !== 'undefined',
        alpineLoaded: typeof window.Alpine !== 'undefined'
      };
    });
    
    console.log(`📊 Chart.js 載入狀態: ${chartJs.chartJsLoaded ? '✅' : '❌'}`);
    console.log(`🎨 NexusChartTheme 載入狀態: ${chartJs.nexusThemeLoaded ? '✅' : '❌'}`);
    console.log(`⚡ Alpine.js 載入狀態: ${chartJs.alpineLoaded ? '✅' : '❌'}`);
    
    // 5. 檢查深色主題支援
    const themeToggle = await page.locator('[data-theme], .theme-toggle, [x-data*="theme"]').count();
    console.log(`🌙 主題切換功能: ${themeToggle > 0 ? '✅ 存在' : '❌ 未找到'}`);
    
    // 6. 檢查響應式設計
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://127.0.0.1:8000/reports');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: `screenshots/frontend-analysis-04-responsive-${viewport.name}.png`, 
        fullPage: true 
      });
    }
    
    // 恢復預設視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('\n📋 前端架構分析總結:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 報表中心: 正常載入`);
    console.log(`🏢 多租戶組件: ${companySwitcher > 0 ? '已實現' : '需要開發'}`);
    console.log(`📊 圖表系統: Chart.js ${chartJs.chartJsLoaded ? '已載入' : '未載入'}`);
    console.log(`🎨 主題系統: NexusChartTheme ${chartJs.nexusThemeLoaded ? '已載入' : '未載入'}`);
    console.log(`📱 響應式設計: 已測試 Desktop/Tablet/Mobile`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });

  test('🎯 圖表功能深度分析', async () => {
    console.log('\n🔍 深度分析圖表渲染狀況...\n');
    
    // 測試所有報表頁面的圖表功能
    const reportPages = [
      { name: '銷售總覽', url: '/reports/sales' },
      { name: '銷售趨勢', url: '/reports/sales/trends' },
      { name: '庫存總覽', url: '/reports/inventory' },
      { name: '財務總覽', url: '/reports/financial' }
    ];
    
    for (const report of reportPages) {
      try {
        await page.goto(`http://127.0.0.1:8000${report.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000); // 等待圖表完全載入
        
        const canvasCount = await page.locator('canvas').count();
        const chartContainers = await page.locator('[id*="chart"], .chart-container').count();
        const loadingStates = await page.locator(':text("載入中"), :text("圖表載入中"), .loading').count();
        
        console.log(`📊 ${report.name}:`);
        console.log(`   Canvas 元素: ${canvasCount}`);
        console.log(`   圖表容器: ${chartContainers}`);
        console.log(`   載入狀態: ${loadingStates > 0 ? '⏳ 仍在載入' : '✅ 載入完成'}`);
        
        await page.screenshot({ 
          path: `screenshots/chart-analysis-${report.name.replace(/\s+/g, '-')}.png`, 
          fullPage: true 
        });
        
      } catch (error) {
        console.log(`❌ ${report.name}: 頁面載入失敗 - ${error.message}`);
      }
    }
  });

  test('🏢 多租戶界面組件分析', async () => {
    console.log('\n🔍 分析多租戶界面組件...\n');
    
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 檢查公司切換器
    const companySwitcherExists = await page.locator('[x-data="companySwitcher()"]').count() > 0;
    console.log(`🏢 公司切換器: ${companySwitcherExists ? '✅ 存在' : '❌ 未找到'}`);
    
    if (companySwitcherExists) {
      // 點擊公司切換器
      await page.click('[x-data="companySwitcher()"] [role="button"]');
      await page.waitForTimeout(1000);
      
      const dropdownVisible = await page.locator('.dropdown-content').isVisible();
      console.log(`📋 下拉選單: ${dropdownVisible ? '✅ 正常顯示' : '❌ 未顯示'}`);
      
      await page.screenshot({ path: 'screenshots/company-switcher-dropdown.png' });
    }
    
    // 檢查用戶邀請功能
    const inviteElements = await page.locator(':text("邀請"), [href*="invite"]').count();
    console.log(`👥 用戶邀請界面: ${inviteElements > 0 ? '✅ 存在' : '❌ 需要開發'}`);
    
    // 檢查權限管理界面
    const permissionElements = await page.locator(':text("權限"), [href*="permission"]').count();
    console.log(`🔐 權限管理界面: ${permissionElements > 0 ? '✅ 存在' : '❌ 需要開發'}`);
  });

  test.afterEach(async () => {
    await page.close();
  });
});