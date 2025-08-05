import { test, expect } from '@playwright/test';

test('超級思考：Dashboard回退問題全面診斷', async ({ page }) => {
  console.log('🚨 超級思考：診斷Dashboard嚴重回退問題...');
  
  // 檢查控制台錯誤
  const consoleErrors = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('response', response => {
    if (!response.ok() && (response.url().includes('.css') || response.url().includes('.js'))) {
      networkErrors.push({
        url: response.url(),
        status: response.status()
      });
    }
  });
  
  // 訪問dashboard頁面
  await page.goto('http://127.0.0.1:8000/dashboard');
  await page.waitForLoadState('networkidle');
  
  console.log('\n=== 第1層診斷：頁面基本狀態 ===');
  
  // 檢查頁面標題和基本元素
  const title = await page.title();
  console.log(`頁面標題: ${title}`);
  
  // 檢查是否有authentication redirect
  const currentUrl = page.url();
  console.log(`當前URL: ${currentUrl}`);
  
  if (currentUrl.includes('login')) {
    console.log('⚠️  頁面被重定向到登入頁 - 需要認證才能訪問dashboard');
    
    // 嘗試訪問一個不需要認證的頁面來比較
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    console.log('改為測試首頁...');
  }
  
  console.log('\n=== 第2層診斷：Alpine.js 和 JavaScript 狀態 ===');
  
  // 檢查Alpine.js載入狀態
  const alpineStatus = await page.evaluate(() => {
    return {
      alpine: !!window.Alpine,
      version: window.Alpine?.version,
      xDataElements: document.querySelectorAll('[x-data]').length,
      enhancedNavElements: document.querySelectorAll('[x-data*="enhancedNavigation"]').length,
      multiLevelNavElements: document.querySelectorAll('[x-data*="multiLevelNav"]').length
    };
  });
  
  console.log('Alpine.js狀態:', alpineStatus);
  
  // 檢查JavaScript檔案載入
  const scripts = await page.locator('script[src]').all();
  console.log(`載入的JavaScript檔案數量: ${scripts.length}`);
  
  for (const script of scripts) {
    const src = await script.getAttribute('src');
    console.log(`  - ${src}`);
  }
  
  console.log('\n=== 第3層診斷：CSS 和樣式狀態 ===');
  
  // 檢查CSS檔案載入
  const stylesheets = await page.locator('link[rel="stylesheet"], style').all();
  console.log(`載入的CSS檔案/樣式數量: ${stylesheets.length}`);
  
  // 檢查核心CSS變數是否存在
  const cssVariables = await page.evaluate(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    
    const nexusVariables = {};
    const allVariables = {};
    
    // 檢查Nexus設計令牌
    const nexusTokens = [
      '--nexus-primary-500',
      '--nexus-bg-primary', 
      '--nexus-text-primary',
      '--nexus-nav-bg-primary',
      '--nexus-nav-height'
    ];
    
    nexusTokens.forEach(token => {
      const value = computedStyle.getPropertyValue(token);
      nexusVariables[token] = value || 'undefined';
    });
    
    // 檢查所有CSS變數
    const styles = Array.from(document.styleSheets).flatMap(sheet => {
      try {
        return Array.from(sheet.cssRules);
      } catch (e) {
        return [];
      }
    });
    
    return { nexusVariables, totalStyles: styles.length };
  });
  
  console.log('CSS變數檢查:', cssVariables);
  
  console.log('\n=== 第4層診斷：導航組件狀態 ===');
  
  // 檢查導航組件是否存在
  const navElements = {
    navbar: await page.locator('nav, .navbar, .navigation').count(),
    enhancedNav: await page.locator('[x-data*="enhancedNavigation"]').count(),
    multiLevelNav: await page.locator('[x-data*="multiLevelNav"]').count(),
    dropdownTriggers: await page.locator('[data-dropdown], .dropdown-trigger, [aria-haspopup="true"]').count(),
    dropdownMenus: await page.locator('.dropdown-menu, [role="menu"], .absolute.bg-white').count()
  };
  
  console.log('導航元素統計:', navElements);
  
  // 如果找到導航元素，測試互動功能
  if (navElements.navbar > 0) {
    console.log('\n測試導航互動功能...');
    
    // 尋找可點擊的導航項目
    const clickableItems = await page.locator('nav button, nav a, .navbar button, .navbar a').all();
    console.log(`找到 ${clickableItems.length} 個可點擊的導航項目`);
    
    for (let i = 0; i < Math.min(3, clickableItems.length); i++) {
      const item = clickableItems[i];
      const itemText = await item.textContent();
      
      if (itemText && itemText.trim()) {
        console.log(`測試項目: "${itemText.trim()}"`);
        
        // 測試hover
        await item.hover();
        await page.waitForTimeout(300);
        
        // 檢查是否有下拉內容出現
        const hasDropdown = await page.locator('.absolute, [role="menu"], .dropdown').isVisible().catch(() => false);
        console.log(`  Hover效果: ${hasDropdown ? '✅ 有下拉' : '❌ 無下拉'}`);
      }
    }
  }
  
  console.log('\n=== 第5層診斷：錯誤和網路問題 ===');
  
  // 等待一段時間收集錯誤
  await page.waitForTimeout(2000);
  
  console.log(`JavaScript錯誤數量: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('JavaScript錯誤列表:');
    consoleErrors.forEach((error, i) => {
      console.log(`  ${i+1}. ${error}`);
    });
  }
  
  console.log(`網路錯誤數量: ${networkErrors.length}`);
  if (networkErrors.length > 0) {
    console.log('網路錯誤列表:');
    networkErrors.forEach((error, i) => {
      console.log(`  ${i+1}. [${error.status}] ${error.url}`);
    });
  }
  
  console.log('\n=== 第6層診斷：特定問題檢查 ===');
  
  // 檢查是否使用了正確的布局
  const layoutInfo = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    
    return {
      bodyClasses: body.className,
      htmlClasses: html.className,
      hasAppLayout: !!document.querySelector('[data-layout="app"]'),
      hasLandingLayout: !!document.querySelector('[data-layout="landing"]'),
      themeAttribute: html.getAttribute('data-theme'),
      currentTheme: body.style.backgroundColor || getComputedStyle(body).backgroundColor
    };
  });
  
  console.log('布局和主題資訊:', layoutInfo);
  
  // 最終截圖
  await page.screenshot({ path: 'dashboard-regression-diagnosis.png', fullPage: true });
  console.log('\n📸 Dashboard回退診斷截圖已保存');
  
  console.log('\n=== 診斷總結 ===');
  console.log('1. Alpine.js狀態:', alpineStatus.alpine ? '✅ 正常' : '❌ 異常');
  console.log('2. 導航組件:', navElements.enhancedNav > 0 ? '✅ 存在' : '❌ 缺失');
  console.log('3. CSS變數:', Object.keys(cssVariables.nexusVariables).length > 0 ? '✅ 載入' : '❌ 缺失');
  console.log('4. JavaScript錯誤:', consoleErrors.length === 0 ? '✅ 無錯誤' : `❌ ${consoleErrors.length}個錯誤`);
  console.log('5. 網路資源:', networkErrors.length === 0 ? '✅ 正常' : `❌ ${networkErrors.length}個失敗`);
});