const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('===== NexusERP 報表圖表系統全面測試 =====');
    
    // 登入
    console.log('步驟 1: 登入系統...');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    const isLoggedIn = await page.locator('.dashboard-content, #dashboard').count() > 0;
    
    if (!isLoggedIn) {
      const loginButton = page.locator('a').filter({ hasText: '登入' });
      if (await loginButton.count() > 0) {
        await loginButton.click();
        await page.waitForLoadState('networkidle');
      }
      
      const emailInput = page.locator('input[type=email], input[name=email], #email');
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');
        await page.locator('input[type=password]').fill('password123');
        await page.locator('button[type=submit]').click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    }
    
    // 測試報表頁面列表
    const reportPages = [
      { name: 'Sales-報表', url: '/reports/sales', priority: 'HIGH' },
      { name: 'Inventory-報表', url: '/reports/inventory', priority: 'HIGH' },
      { name: 'Financial-報表', url: '/reports/financial', priority: 'HIGH' },
      { name: 'Purchase-報表', url: '/reports/purchase', priority: 'HIGH' },
      { name: 'Employee-Attendance', url: '/reports/employees/attendance', priority: 'MEDIUM' },
      { name: 'Employee-Performance', url: '/reports/employees/performance', priority: 'MEDIUM' },
      // 子頁面
      { name: 'Inventory-Valuation', url: '/reports/inventory/valuation', priority: 'MEDIUM' },
      { name: 'Sales-by-Customer', url: '/reports/sales/by-customer', priority: 'LOW' },
      { name: 'Sales-by-Product', url: '/reports/sales/by-product', priority: 'LOW' }
    ];
    
    const testResults = [];
    
    for (let i = 0; i < reportPages.length; i++) {
      const report = reportPages[i];
      console.log(`\n測試 ${i + 1}/${reportPages.length}: ${report.name}`);
      
      try {
        // 訪問報表頁面
        await page.goto(`http://127.0.0.1:8000${report.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // 等待圖表載入
        
        // 檢查頁面基本狀況
        const title = await page.title().catch(() => 'Unknown');
        const canvasCount = await page.locator('canvas').count();
        const loadingCount = await page.locator('[class*=loading], .loading, .spinner').count();
        const errorCount = await page.locator('.error, .alert-danger, [class*=error]').count();
        
        // 檢查 Chart.js 是否載入
        const hasChartJS = await page.evaluate(() => {
          return typeof window.Chart !== 'undefined';
        }).catch(() => false);
        
        // 檢查特定圖表 ID
        const chartIds = await page.evaluate(() => {
          const canvases = document.querySelectorAll('canvas');
          return Array.from(canvases).map(canvas => ({
            id: canvas.id,
            width: canvas.width,
            height: canvas.height,
            hasChart: canvas._chartjs !== undefined
          }));
        });
        
        // 截圖
        const screenshotPath = `./chart-test-${i + 1}-${report.name}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        const result = {
          name: report.name,
          url: report.url,
          priority: report.priority,
          title: title,
          canvasCount: canvasCount,
          loadingElements: loadingCount,
          errorElements: errorCount,
          hasChartJS: hasChartJS,
          chartIds: chartIds,
          screenshot: screenshotPath,
          status: canvasCount > 0 && hasChartJS ? '✅ 有圖表' : (canvasCount === 0 ? '🔴 無Canvas' : '⚠️ 需檢查')
        };
        
        testResults.push(result);
        
        console.log(`  Canvas數量: ${canvasCount}`);
        console.log(`  Chart.js載入: ${hasChartJS ? '✅' : '❌'}`);
        console.log(`  圖表ID: ${chartIds.map(c => c.id).join(', ')}`);
        console.log(`  狀態: ${result.status}`);
        
      } catch (error) {
        console.error(`  測試失敗: ${error.message}`);
        testResults.push({
          name: report.name,
          url: report.url,
          priority: report.priority,
          status: '🚫 訪問失敗',
          error: error.message
        });
      }
    }
    
    console.log('\n===== 測試結果摘要 =====');
    console.log(`總測試頁面: ${reportPages.length}`);
    
    let hasCharts = 0;
    let noCanvas = 0;
    let needsCheck = 0;
    let failed = 0;
    
    testResults.forEach(result => {
      if (result.status === '✅ 有圖表') hasCharts++;
      else if (result.status === '🔴 無Canvas') noCanvas++;
      else if (result.status === '⚠️ 需檢查') needsCheck++;
      else if (result.status === '🚫 訪問失敗') failed++;
    });
    
    console.log(`✅ 有圖表: ${hasCharts} 個`);
    console.log(`🔴 無Canvas: ${noCanvas} 個`);
    console.log(`⚠️ 需檢查: ${needsCheck} 個`);
    console.log(`🚫 訪問失敗: ${failed} 個`);
    
    console.log('\n===== 詳細報告 =====');
    testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name} (${result.priority})`);
      console.log(`   URL: ${result.url}`);
      console.log(`   狀態: ${result.status}`);
      if (result.canvasCount !== undefined) {
        console.log(`   Canvas: ${result.canvasCount}, Chart.js: ${result.hasChartJS ? 'Yes' : 'No'}`);
        if (result.chartIds && result.chartIds.length > 0) {
          console.log(`   圖表ID: ${result.chartIds.map(c => c.id).join(', ')}`);
        }
      }
      if (result.error) {
        console.log(`   錯誤: ${result.error}`);
      }
      console.log('');
    });
    
    console.log(`\n📸 已生成 ${testResults.filter(r => r.screenshot).length} 個測試截圖`);
    
  } catch (error) {
    console.error('測試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
})();