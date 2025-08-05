import { chromium } from 'playwright';

async function directUrlTest() {
  console.log('🔍 直接 URL 訪問測試');
  
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 60000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // 先登入
    console.log('🔐 登入系統');
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // 測試各個報表頁面的直接 URL 訪問
    const testUrls = [
      { name: '銷售總覽', url: 'http://127.0.0.1:8000/reports/sales' },
      { name: '銷售趨勢', url: 'http://127.0.0.1:8000/reports/sales/trends' },
      { name: '客戶分析', url: 'http://127.0.0.1:8000/reports/sales/by-customer' },
      { name: '產品分析', url: 'http://127.0.0.1:8000/reports/sales/by-product' },
      { name: '庫存總覽', url: 'http://127.0.0.1:8000/reports/inventory' },
      { name: '損益表', url: 'http://127.0.0.1:8000/reports/financial/profit-loss' }
    ];
    
    for (const testUrl of testUrls) {
      console.log(`\n📊 測試: ${testUrl.name} - ${testUrl.url}`);
      
      try {
        await page.goto(testUrl.url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        const pageTitle = await page.locator('h1, h2, .page-title').first().textContent().catch(() => '未找到標題');
        const canvasCount = await page.locator('canvas').count();
        const chartCount = await page.locator('.chart, [id*="chart"], [class*="chart"]').count();
        const loadingCount = await page.locator('text=載入中, text=圖表載入中, .loading').count();
        const errorCount = await page.locator('.error, .alert-danger, [class*="error"]').count();
        
        console.log(`  ✅ 實際 URL: ${currentUrl}`);
        console.log(`  📊 頁面標題: ${pageTitle}`);
        console.log(`  📈 Canvas 元素: ${canvasCount}`);
        console.log(`  📊 圖表元素: ${chartCount}`);
        console.log(`  ⏳ 載入中元素: ${loadingCount}`);
        console.log(`  ❌ 錯誤元素: ${errorCount}`);
        
        // 檢查是否成功載入報表頁面
        const isCorrectPage = currentUrl.includes('reports') && !currentUrl.endsWith('/reports');
        const hasCharts = canvasCount > 0 || chartCount > 0;
        const hasLoadingOnly = loadingCount > 0 && !hasCharts;
        
        let status = '';
        if (!isCorrectPage) {
          status = '❌ 頁面重定向失敗';
        } else if (errorCount > 0) {
          status = '❌ 頁面有錯誤';
        } else if (hasCharts) {
          status = '✅ 圖表正常載入';
        } else if (hasLoadingOnly) {
          status = '⏳ 僅顯示載入中';
        } else {
          status = '⚠️  無圖表元素';
        }
        
        console.log(`  🔍 狀態: ${status}`);
        
        // 截圖
        const screenshotName = `direct-url-${testUrl.name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        await page.screenshot({ 
          path: `screenshots/${screenshotName}`,
          fullPage: true 
        });
        console.log(`  📸 已截圖: ${screenshotName}`);
        
      } catch (error) {
        console.log(`  ❌ 訪問錯誤: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
}

// 執行測試
directUrlTest();