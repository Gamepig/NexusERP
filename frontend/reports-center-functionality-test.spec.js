import { test, expect, chromium } from '@playwright/test';

test.describe('NexusERP 報表中心功能測試', () => {
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('登入系統並導航到報表中心', async () => {
    console.log('📋 開始測試：登入系統並導航到報表中心');
    
    // 訪問登入頁面
    await page.goto('http://127.0.0.1:8000');
    await expect(page).toHaveTitle(/NexusERP/);
    
    // 登入測試用戶
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待跳轉到主控台
    await page.waitForURL(/.*dashboard/);
    await expect(page.locator('text=主控台')).toBeVisible();
    
    console.log('✅ 登入成功，已進入主控台');
    
    // 點擊導航菜單中的報表中心
    await page.click('text=報表中心');
    await page.waitForURL(/.*reports/);
    
    console.log('✅ 已成功導航到報表中心');
    
    // 截圖記錄報表中心首頁
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/screenshots/reports-center-homepage.png',
      fullPage: true 
    });
  });

  test('測試銷售總覽報表頁面', async () => {
    console.log('📋 開始測試：銷售總覽報表');
    
    // 點擊銷售總覽報表
    await page.click('text=銷售總覽');
    await page.waitForTimeout(3000); // 等待頁面載入
    
    // 檢查頁面標題
    const pageTitle = await page.locator('h1, h2, .page-title').first().textContent();
    console.log(`📊 頁面標題: ${pageTitle}`);
    
    // 檢查圖表元素
    const canvasElements = await page.locator('canvas').count();
    console.log(`📈 Canvas 元素數量: ${canvasElements}`);
    
    // 檢查是否顯示載入中
    const loadingText = await page.locator('text=圖表載入中').count();
    console.log(`⏳ 載入中文字數量: ${loadingText}`);
    
    // 檢查是否有錯誤信息
    const errorMessages = await page.locator('.error, .alert-danger, [class*="error"]').count();
    console.log(`❌ 錯誤信息數量: ${errorMessages}`);
    
    // 截圖記錄
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/screenshots/sales-overview-report.png',
      fullPage: true 
    });
    
    // 檢查控制台錯誤
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    if (consoleErrors.length > 0) {
      console.log('🚨 控制台錯誤:', consoleErrors);
    }
  });

  test('測試銷售趨勢報表頁面', async () => {
    console.log('📋 開始測試：銷售趨勢報表');
    
    // 導航到報表中心
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForTimeout(2000);
    
    // 點擊銷售趨勢報表
    await page.click('text=銷售趨勢');
    await page.waitForTimeout(3000);
    
    // 檢查頁面內容
    const pageTitle = await page.locator('h1, h2, .page-title').first().textContent();
    console.log(`📊 頁面標題: ${pageTitle}`);
    
    const canvasElements = await page.locator('canvas').count();
    console.log(`📈 Canvas 元素數量: ${canvasElements}`);
    
    const loadingText = await page.locator('text=圖表載入中').count();
    console.log(`⏳ 載入中文字數量: ${loadingText}`);
    
    // 截圖記錄
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/screenshots/sales-trend-report.png',
      fullPage: true 
    });
  });

  test('測試客戶分析報表頁面', async () => {
    console.log('📋 開始測試：客戶分析報表');
    
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForTimeout(2000);
    
    // 點擊客戶分析報表
    await page.click('text=客戶分析');
    await page.waitForTimeout(3000);
    
    const pageTitle = await page.locator('h1, h2, .page-title').first().textContent();
    console.log(`📊 頁面標題: ${pageTitle}`);
    
    const canvasElements = await page.locator('canvas').count();
    console.log(`📈 Canvas 元素數量: ${canvasElements}`);
    
    const loadingText = await page.locator('text=圖表載入中').count();
    console.log(`⏳ 載入中文字數量: ${loadingText}`);
    
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/screenshots/customer-analysis-report.png',
      fullPage: true 
    });
  });

  test('測試產品分析報表頁面', async () => {
    console.log('📋 開始測試：產品分析報表');
    
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForTimeout(2000);
    
    // 點擊產品分析報表
    await page.click('text=產品分析');
    await page.waitForTimeout(3000);
    
    const pageTitle = await page.locator('h1, h2, .page-title').first().textContent();
    console.log(`📊 頁面標題: ${pageTitle}`);
    
    const canvasElements = await page.locator('canvas').count();
    console.log(`📈 Canvas 元素數量: ${canvasElements}`);
    
    const loadingText = await page.locator('text=圖表載入中').count();
    console.log(`⏳ 載入中文字數量: ${loadingText}`);
    
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/screenshots/product-analysis-report.png',
      fullPage: true 
    });
  });

  test('測試庫存評估報表頁面', async () => {
    console.log('📋 開始測試：庫存評估報表');
    
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForTimeout(2000);
    
    // 點擊庫存評估報表
    await page.click('text=庫存評估');
    await page.waitForTimeout(3000);
    
    const pageTitle = await page.locator('h1, h2, .page-title').first().textContent();
    console.log(`📊 頁面標題: ${pageTitle}`);
    
    const canvasElements = await page.locator('canvas').count();
    console.log(`📈 Canvas 元素數量: ${canvasElements}`);
    
    const loadingText = await page.locator('text=圖表載入中').count();
    console.log(`⏳ 載入中文字數量: ${loadingText}`);
    
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/screenshots/inventory-assessment-report.png',
      fullPage: true 
    });
  });

  test('測試損益表報表頁面', async () => {
    console.log('📋 開始測試：損益表報表');
    
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForTimeout(2000);
    
    // 點擊損益表報表
    await page.click('text=損益表');
    await page.waitForTimeout(3000);
    
    const pageTitle = await page.locator('h1, h2, .page-title').first().textContent();
    console.log(`📊 頁面標題: ${pageTitle}`);
    
    const canvasElements = await page.locator('canvas').count();
    console.log(`📈 Canvas 元素數量: ${canvasElements}`);
    
    const loadingText = await page.locator('text=圖表載入中').count();
    console.log(`⏳ 載入中文字數量: ${loadingText}`);
    
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/screenshots/profit-loss-report.png',
      fullPage: true 
    });
  });

  test('綜合報表功能分析', async () => {
    console.log('📋 開始綜合分析報表功能狀態');
    
    // 返回報表中心主頁
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForTimeout(2000);
    
    // 檢查所有報表連結
    const reportLinks = await page.locator('a[href*="/reports/"], text=銷售總覽, text=銷售趨勢, text=客戶分析, text=產品分析, text=庫存評估, text=損益表').count();
    console.log(`🔗 報表連結總數: ${reportLinks}`);
    
    // 檢查頁面整體結構
    const hasNavigation = await page.locator('nav, .navigation, .sidebar').count();
    console.log(`🧭 導航元素數量: ${hasNavigation}`);
    
    // 檢查是否有報表卡片或按鈕
    const reportCards = await page.locator('.card, .report-item, .btn, button').count();
    console.log(`📋 報表卡片/按鈕數量: ${reportCards}`);
    
    // 最終截圖
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/screenshots/reports-center-final.png',
      fullPage: true 
    });
    
    console.log('✅ 報表中心功能測試完成');
  });
});