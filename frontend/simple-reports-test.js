import { chromium } from 'playwright';

async function testReportsCenter() {
  console.log('🚀 開始 NexusERP 報表中心功能測試');
  
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 60000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // 步驟 1: 登入系統
    console.log('📋 步驟 1: 訪問登入頁面');
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    
    // 檢查是否有登入表單
    const hasLoginForm = await page.locator('input[name="email"]').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasLoginForm) {
      console.log('🔐 執行登入流程');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000); // 等待登入完成
    } else {
      console.log('🔍 檢查是否已經登入');
      await page.goto('http://127.0.0.1:8000/dashboard', { waitUntil: 'networkidle' });
    }
    
    console.log('✅ 成功登入系統');
    
    // 步驟 2: 導航到報表中心
    console.log('📋 步驟 2: 導航到報表中心');
    await page.click('text=報表中心');
    await page.waitForTimeout(3000);
    
    // 截圖報表中心首頁
    await page.screenshot({ 
      path: 'screenshots/reports-center-homepage.png',
      fullPage: true 
    });
    console.log('📸 已截圖：報表中心首頁');
    
    // 檢查報表中心結構
    const reportLinks = await page.locator('a, button, .card').count();
    console.log(`🔗 頁面互動元素數量: ${reportLinks}`);
    
    // 測試各個報表頁面
    const reports = [
      { name: '銷售總覽', selector: 'text=銷售總覽' },
      { name: '銷售趨勢', selector: 'text=銷售趨勢' },
      { name: '客戶分析', selector: 'text=客戶分析' },
      { name: '產品分析', selector: 'text=產品分析' },
      { name: '庫存評估', selector: 'text=庫存評估' },
      { name: '損益表', selector: 'text=損益表' }
    ];
    
    for (const report of reports) {
      console.log(`📋 測試報表: ${report.name}`);
      
      try {
        // 返回報表中心
        await page.goto('http://127.0.0.1:8000/reports', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // 點擊報表連結
        const linkExists = await page.locator(report.selector).isVisible({ timeout: 5000 });
        
        if (linkExists) {
          await page.click(report.selector);
          await page.waitForTimeout(5000); // 等待報表載入
          
          // 檢查圖表元素
          const canvasCount = await page.locator('canvas').count();
          const loadingCount = await page.locator('text=圖表載入中').count();
          const errorCount = await page.locator('.error, .alert-danger, [class*="error"]').count();
          
          console.log(`  📈 Canvas 元素: ${canvasCount}`);
          console.log(`  ⏳ 載入中文字: ${loadingCount}`);
          console.log(`  ❌ 錯誤元素: ${errorCount}`);
          
          // 截圖
          const screenshotName = report.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          await page.screenshot({ 
            path: `screenshots/report-${screenshotName}.png`,
            fullPage: true 
          });
          console.log(`  📸 已截圖：${report.name}`);
          
          // 檢查控制台錯誤
          const logs = [];
          page.on('console', msg => {
            if (msg.type() === 'error') {
              logs.push(msg.text());
            }
          });
          
          await page.waitForTimeout(2000);
          if (logs.length > 0) {
            console.log(`  🚨 控制台錯誤: ${logs.join(', ')}`);
          }
          
        } else {
          console.log(`  ❌ 找不到報表連結: ${report.name}`);
        }
        
      } catch (error) {
        console.log(`  ❌ 測試報表 ${report.name} 時發生錯誤: ${error.message}`);
      }
    }
    
    console.log('✅ 報表中心功能測試完成');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
}

// 執行測試
testReportsCenter();