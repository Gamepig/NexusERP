import { test, expect } from '@playwright/test';

test.describe('NexusERP 報表系統修復驗收測試', () => {

  test.beforeEach(async ({ page }) => {
    // 登入系統
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('🎨 1. 顏色主題修復驗證 - 深色主題統一', async ({ page }) => {
    console.log('🧪 測試 1: 顏色主題修復驗證');
    
    // 前往報表中心
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForLoadState('networkidle');
    
    // 截圖 - 報表中心頁面
    await page.screenshot({ path: 'screenshots/theme-test-01-reports-center.png' });
    
    // 檢查頁面背景色 - 應該是深色主題
    const bodyBg = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    
    console.log('🎨 頁面背景色:', bodyBg);
    
    // 檢查是否有白色背景殘留
    const whiteElements = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const whiteElements = [];
      
      for (let el of allElements) {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        
        // 檢查是否為白色或接近白色
        if (bgColor === 'rgb(255, 255, 255)' || bgColor === 'white' || 
            bgColor === '#ffffff' || bgColor === '#fff') {
          whiteElements.push({
            tag: el.tagName,
            class: el.className,
            id: el.id,
            bgColor: bgColor
          });
        }
      }
      return whiteElements;
    });
    
    console.log('🔍 發現白色背景元素數量:', whiteElements.length);
    if (whiteElements.length > 0) {
      console.log('⚠️  白色背景元素:', whiteElements.slice(0, 5));
    }
    
    // 前往銷售報表頁面
    await page.click('a[href="/reports/sales"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 截圖 - 銷售報表頁面
    await page.screenshot({ path: 'screenshots/theme-test-02-sales-report.png' });
    
    // 檢查圖表是否有深色主題
    const chartElements = await page.locator('canvas, .chart-container, [id*="chart"]').count();
    console.log('📊 發現圖表元素數量:', chartElements);
    
    // 檢查是否有錯誤訊息
    const errorText = await page.textContent('body');
    const hasApiError = errorText.includes('載入銷售報表失敗') || 
                       errorText.includes('500') || 
                       errorText.includes('Server Error');
    
    console.log('❌ 是否有 API 錯誤:', hasApiError);
    
    // 檢查篩選元素
    const filterElements = await page.locator('input[type="date"], select, button').count();
    console.log('🔧 篩選控制元素數量:', filterElements);
    
    // 驗證結果
    expect(whiteElements.length).toBeLessThanOrEqual(5); // 允許少量白色元素（如輸入框內部）
    expect(chartElements).toBeGreaterThan(0); // 應該有圖表元素
    expect(filterElements).toBeGreaterThan(0); // 應該有篩選元素
    
    console.log('✅ 主題修復驗證完成');
  });

  test('🔗 2. 其他報表頁面主題驗證', async ({ page }) => {
    console.log('🧪 測試 2: 其他報表頁面主題驗證');
    
    const reportPages = [
      { url: '/reports/inventory', name: '庫存報表' },
      { url: '/reports/financial', name: '財務報表' }
    ];
    
    for (const report of reportPages) {
      console.log(`📋 測試頁面: ${report.name}`);
      
      await page.goto(`http://127.0.0.1:8000${report.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // 截圖
      const fileName = report.url.replace(/\//g, '-');
      await page.screenshot({ path: `screenshots/theme-test${fileName}.png` });
      
      // 檢查是否正常載入
      const pageTitle = await page.textContent('h1, h2, .page-title');
      console.log(`📄 頁面標題: ${pageTitle}`);
      
      // 檢查深色主題
      const isDarkTheme = await page.evaluate(() => {
        const body = document.body;
        const bgColor = window.getComputedStyle(body).backgroundColor;
        // 檢查是否為深色背景
        const rgb = bgColor.match(/\d+/g);
        if (rgb) {
          const [r, g, b] = rgb.map(Number);
          return (r + g + b) / 3 < 128; // 平均亮度小於 128 算深色
        }
        return false;
      });
      
      console.log(`🎨 ${report.name} 深色主題: ${isDarkTheme}`);
      expect(isDarkTheme).toBeTruthy();
    }
    
    console.log('✅ 其他頁面主題驗證完成');
  });

  test('🚀 3. 系統整體穩定性測試', async ({ page }) => {
    console.log('🧪 測試 3: 系統整體穩定性測試');
    
    // 測試主要導航
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForLoadState('networkidle');
    
    // 測試導航連結
    const navLinks = [
      'a[href="/reports/sales"]',
      'a[href="/reports/inventory"]', 
      'a[href="/reports/financial"]'
    ];
    
    for (const link of navLinks) {
      const linkElement = page.locator(link);
      if (await linkElement.count() > 0) {
        await linkElement.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        // 檢查頁面載入
        const currentUrl = page.url();
        console.log(`🔗 導航至: ${currentUrl}`);
        
        // 返回報表中心
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }
    }
    
    // 最終截圖
    await page.screenshot({ path: 'screenshots/theme-test-final-stability.png' });
    
    console.log('✅ 穩定性測試完成');
  });

  test('📱 4. 響應式設計測試', async ({ page }) => {
    console.log('🧪 測試 4: 響應式設計測試');
    
    await page.goto('http://127.0.0.1:8000/reports/sales');
    await page.waitForLoadState('networkidle');
    
    // 測試不同螢幕尺寸
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // 截圖
      await page.screenshot({ 
        path: `screenshots/theme-test-responsive-${viewport.name}.png` 
      });
      
      // 檢查主要元素是否可見
      const mainContent = await page.locator('main, .main-content').isVisible();
      console.log(`📱 ${viewport.name} 主要內容可見: ${mainContent}`);
      
      expect(mainContent).toBeTruthy();
    }
    
    console.log('✅ 響應式設計測試完成');
  });

});