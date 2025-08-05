import { chromium } from 'playwright';

async function detailedReportsAnalysis() {
  console.log('🔍 開始詳細報表功能分析');
  
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 60000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 設置控制台監聽
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`${new Date().toISOString()}: ${msg.text()}`);
    }
  });
  
  try {
    // 登入系統
    console.log('🔐 登入系統');
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // 進入報表中心
    console.log('📊 進入報表分析中心');
    await page.goto('http://127.0.0.1:8000/reports', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 分析報表中心結構
    console.log('🔍 分析報表中心結構');
    
    // 檢查所有可點擊的報表按鈕
    const reportButtons = await page.locator('button, .btn, a[href*="reports"], .card').all();
    console.log(`📋 發現 ${reportButtons.length} 個可能的報表按鈕`);
    
    // 檢查每個報表類別
    const reportCategories = [
      { 
        name: '銷售報表', 
        buttons: ['銷售總覽', '產品分析', '客戶分析', '趨勢分析'],
        category: 'sales'
      },
      { 
        name: '庫存報表', 
        buttons: ['庫存總覽', '週轉率', '庫存老化', '異動記錄'],
        category: 'inventory'
      },
      { 
        name: '財務報表', 
        buttons: ['財務總覽', '損益表', '應收帳款', '應付帳款'],
        category: 'financial'
      },
      { 
        name: '採購報表', 
        buttons: ['採購總覽'],
        category: 'purchase'
      },
      { 
        name: '人事報表', 
        buttons: ['出勤統計', '績效分析'],
        category: 'employee'
      }
    ];
    
    const testResults = [];
    
    for (const category of reportCategories) {
      console.log(`\n📊 測試類別: ${category.name}`);
      
      for (const buttonText of category.buttons) {
        console.log(`  🔍 測試按鈕: ${buttonText}`);
        
        try {
          // 重新載入報表中心頁面
          await page.goto('http://127.0.0.1:8000/reports', { waitUntil: 'networkidle' });
          await page.waitForTimeout(2000);
          
          // 查找按鈕
          const buttonLocator = page.locator(`text=${buttonText}`).first();
          const isVisible = await buttonLocator.isVisible({ timeout: 3000 });
          
          if (isVisible) {
            console.log(`    ✅ 找到按鈕: ${buttonText}`);
            
            // 點擊按鈕
            await buttonLocator.click();
            await page.waitForTimeout(5000); // 等待頁面載入
            
            // 獲取當前 URL
            const currentUrl = page.url();
            console.log(`    🔗 當前 URL: ${currentUrl}`);
            
            // 檢查頁面內容
            const pageTitle = await page.locator('h1, h2, .page-title, .card-title').first().textContent().catch(() => '未找到標題');
            const canvasCount = await page.locator('canvas').count();
            const loadingCount = await page.locator('text=圖表載入中, text=載入中, .loading').count();
            const errorCount = await page.locator('.error, .alert-danger, [class*="error"]').count();
            const chartCount = await page.locator('.chart, [id*="chart"], [class*="chart"]').count();
            
            console.log(`    📊 頁面標題: ${pageTitle}`);
            console.log(`    📈 Canvas 元素: ${canvasCount}`);
            console.log(`    📊 圖表元素: ${chartCount}`);
            console.log(`    ⏳ 載入中元素: ${loadingCount}`);
            console.log(`    ❌ 錯誤元素: ${errorCount}`);
            
            // 檢查是否有實際的圖表數據
            const hasData = canvasCount > 0 || chartCount > 0;
            const isLoading = loadingCount > 0;
            const hasError = errorCount > 0;
            
            let status = 'unknown';
            if (hasError) {
              status = 'error';
            } else if (isLoading && !hasData) {
              status = 'loading_only';
            } else if (hasData) {
              status = 'working';
            } else {
              status = 'no_charts';
            }
            
            console.log(`    🔍 狀態分析: ${status}`);
            
            // 截圖記錄
            const screenshotName = `detailed-${category.category}-${buttonText.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
            await page.screenshot({ 
              path: `screenshots/${screenshotName}`,
              fullPage: true 
            });
            console.log(`    📸 已截圖: ${screenshotName}`);
            
            testResults.push({
              category: category.name,
              button: buttonText,
              url: currentUrl,
              title: pageTitle,
              canvasCount,
              chartCount,
              loadingCount,
              errorCount,
              status,
              consoleErrors: consoleErrors.length,
              screenshot: screenshotName
            });
            
          } else {
            console.log(`    ❌ 未找到按鈕: ${buttonText}`);
            testResults.push({
              category: category.name,
              button: buttonText,
              status: 'button_not_found'
            });
          }
          
        } catch (error) {
          console.log(`    ❌ 測試錯誤: ${error.message}`);
          testResults.push({
            category: category.name,
            button: buttonText,
            status: 'test_error',
            error: error.message
          });
        }
      }
    }
    
    // 輸出測試總結
    console.log('\n📊 測試總結報告');
    console.log('=' .repeat(60));
    
    const statusCounts = testResults.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📈 狀態統計:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} 個報表`);
    });
    
    console.log('\n🔍 詳細結果:');
    testResults.forEach(result => {
      console.log(`${result.category} - ${result.button}: ${result.status}`);
      if (result.url) console.log(`  URL: ${result.url}`);
      if (result.canvasCount > 0) console.log(`  📈 有 ${result.canvasCount} 個 Canvas 圖表`);
      if (result.chartCount > 0) console.log(`  📊 有 ${result.chartCount} 個圖表元素`);
    });
    
    if (consoleErrors.length > 0) {
      console.log('\n🚨 控制台錯誤記錄:');
      consoleErrors.forEach(error => console.log(`  ${error}`));
    }
    
    console.log('\n✅ 詳細報表功能分析完成');
    
  } catch (error) {
    console.error('❌ 分析過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
}

// 執行分析
detailedReportsAnalysis();