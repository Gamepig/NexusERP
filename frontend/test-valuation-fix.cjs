const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('===== 測試 Inventory Valuation 頁面修復結果 =====');
    
    // 登入
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
    
    console.log('步驟 1: 訪問 Inventory Valuation 頁面...');
    
    // 訪問修復後的頁面
    await page.goto('http://127.0.0.1:8000/reports/inventory/valuation');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000); // 等待圖表渲染
    
    // 檢查修復結果
    const title = await page.title();
    const canvasCount = await page.locator('canvas').count();
    const hasChartJS = await page.evaluate(() => typeof window.Chart !== 'undefined');
    
    // 檢查特定圖表
    const chartIds = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      return Array.from(canvases).map(canvas => ({
        id: canvas.id,
        width: canvas.width,
        height: canvas.height,
        hasChart: canvas._chartjs !== undefined
      }));
    });
    
    // 檢查 JavaScript 錯誤
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // 截圖記錄修復結果
    await page.screenshot({ 
      path: './inventory-valuation-fixed.png', 
      fullPage: true 
    });
    
    console.log('\n===== 修復測試結果 =====');
    console.log(`頁面標題: ${title}`);
    console.log(`Canvas 數量: ${canvasCount} (修復前: 0)`);
    console.log(`Chart.js 載入: ${hasChartJS ? '✅' : '❌'}`);
    console.log(`JavaScript 錯誤: ${errors.length}`);
    
    if (chartIds.length > 0) {
      console.log('\n圖表詳情:');
      chartIds.forEach((chart, index) => {
        console.log(`  圖表 ${index + 1}: ID=${chart.id}, 尺寸=${chart.width}x${chart.height}, Chart.js=${chart.hasChart ? '✅' : '❌'}`);
      });
    }
    
    const status = canvasCount >= 2 && hasChartJS ? '✅ 修復成功' : '❌ 需要檢查';
    console.log(`\n最終狀態: ${status}`);
    
    if (errors.length > 0) {
      console.log('\nJavaScript 錯誤詳情:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log(`\n📸 截圖已保存: inventory-valuation-fixed.png`);
    
    // 等待一下再關閉，讓圖表完全渲染
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('測試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
})();