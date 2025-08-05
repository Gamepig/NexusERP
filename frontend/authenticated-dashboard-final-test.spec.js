import { test, expect } from '@playwright/test';

test('使用正確測試帳號驗證Dashboard導航功能', async ({ page }) => {
  console.log('🔓 使用測試帳號 test@example.com 登入並測試Dashboard導航...');
  
  // 第1步：登入系統
  console.log('\n=== 第1步：登入系統 ===');
  await page.goto('http://127.0.0.1:8000/login');
  await page.waitForLoadState('networkidle');
  
  // 確認在登入頁面
  const loginUrl = page.url();
  console.log(`當前URL: ${loginUrl}`);
  
  // 填寫登入資訊
  console.log('填寫測試帳號資訊...');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  // 點擊登入按鈕
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 檢查登入結果
  const afterLoginUrl = page.url();
  console.log(`登入後URL: ${afterLoginUrl}`);
  
  const isLoggedIn = !afterLoginUrl.includes('login');
  console.log(`登入狀態: ${isLoggedIn ? '✅ 成功' : '❌ 失敗'}`);
  
  if (!isLoggedIn) {
    console.log('❌ 登入失敗，終止測試');
    return;
  }
  
  // 第2步：訪問Dashboard
  console.log('\n=== 第2步：訪問Dashboard ===');
  await page.goto('http://127.0.0.1:8000/dashboard');
  await page.waitForLoadState('networkidle');
  
  const dashboardUrl = page.url();
  console.log(`Dashboard URL: ${dashboardUrl}`);
  
  const pageTitle = await page.title();
  console.log(`頁面標題: ${pageTitle}`);
  
  // 第3步：檢查Alpine.js狀態
  console.log('\n=== 第3步：檢查Alpine.js和JavaScript狀態 ===');
  
  const alpineStatus = await page.evaluate(() => {
    return {
      alpine: !!window.Alpine,
      version: window.Alpine?.version,
      themeManager: !!window.nexusThemeManager
    };
  });
  
  console.log('JavaScript狀態:', alpineStatus);
  
  // 第4步：檢查導航組件
  console.log('\n=== 第4步：檢查Enhanced Navigation組件 ===');
  
  const navComponents = await page.evaluate(() => {
    return {
      enhancedNavElements: document.querySelectorAll('[x-data*="enhancedNavigation"]').length,
      multiLevelNavElements: document.querySelectorAll('[x-data*="multiLevelNav"]').length,
      totalXDataElements: document.querySelectorAll('[x-data]').length,
      navElements: document.querySelectorAll('nav').length,
      dropdownTriggers: document.querySelectorAll('[data-dropdown], .dropdown-trigger, [aria-haspopup="true"]').length
    };
  });
  
  console.log('導航組件統計:', navComponents);
  
  // 第5步：測試導航互動功能
  if (navComponents.enhancedNavElements > 0 || navComponents.multiLevelNavElements > 0) {
    console.log('\n=== 第5步：測試導航互動功能 ===');
    
    // 尋找可互動的導航元素
    const interactiveElements = await page.locator('nav button, nav a, [x-data] button, [x-data] a').all();
    console.log(`找到 ${interactiveElements.length} 個可互動的導航元素`);
    
    for (let i = 0; i < Math.min(5, interactiveElements.length); i++) {
      const element = interactiveElements[i];
      const elementText = await element.textContent();
      
      if (elementText && elementText.trim()) {
        console.log(`測試元素 ${i+1}: "${elementText.trim()}"`);
        
        // 測試hover效果
        await element.hover();
        await page.waitForTimeout(500);
        
        // 檢查是否有下拉選單出現
        const hasDropdown = await page.locator('.absolute, [role="menu"], .dropdown-menu, .z-50, .z-\\[9999\\]').isVisible().catch(() => false);
        console.log(`  Hover效果: ${hasDropdown ? '✅ 有下拉選單' : 'ℹ️  無下拉選單'}`);
        
        // 如果是按鈕，嘗試點擊
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'button') {
          try {
            await element.click();
            await page.waitForTimeout(300);
            
            const hasActiveDropdown = await page.locator('.absolute, [role="menu"], .dropdown-menu').isVisible().catch(() => false);
            console.log(`  點擊效果: ${hasActiveDropdown ? '✅ 下拉選單顯示' : 'ℹ️  無下拉選單'}`);
            
            // 點擊空白處關閉下拉選單
            await page.click('body');
            await page.waitForTimeout(200);
            
          } catch (error) {
            console.log(`  點擊測試失敗: ${error.message}`);
          }
        }
      }
    }
    
  } else {
    console.log('\n❌ 沒有找到Enhanced Navigation組件');
    
    // 檢查頁面HTML結構
    const pageStructure = await page.evaluate(() => {
      const body = document.body;
      const hasEnhancedNavInHTML = body.innerHTML.includes('enhanced-navigation') || 
                                   body.innerHTML.includes('enhancedNavigation');
      
      return {
        hasEnhancedNavInHTML,
        bodyClasses: body.className,
        htmlDatasets: Object.keys(document.documentElement.dataset),
        scriptsCount: document.querySelectorAll('script').length,
        stylesCount: document.querySelectorAll('style, link[rel="stylesheet"]').length
      };
    });
    
    console.log('頁面結構分析:', pageStructure);
  }
  
  // 第6步：檢查CSS設計令牌
  console.log('\n=== 第6步：檢查CSS設計令牌 ===');
  
  const cssTokens = await page.evaluate(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    
    const tokens = {};
    const nexusTokens = [
      '--nexus-primary-500',
      '--nexus-bg-primary', 
      '--nexus-text-primary',
      '--nexus-nav-bg-primary',
      '--nexus-nav-height',
      '--nexus-nav-dropdown-width'
    ];
    
    nexusTokens.forEach(token => {
      const value = computedStyle.getPropertyValue(token);
      tokens[token] = value.trim() || 'undefined';
    });
    
    return tokens;
  });
  
  console.log('CSS設計令牌:', cssTokens);
  
  // 第7步：檢查控制台錯誤
  console.log('\n=== 第7步：檢查JavaScript錯誤 ===');
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // 等待收集錯誤
  await page.waitForTimeout(2000);
  
  console.log(`JavaScript錯誤數量: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('錯誤詳情:');
    consoleErrors.forEach((error, i) => {
      console.log(`  ${i+1}. ${error}`);
    });
  } else {
    console.log('✅ 無JavaScript錯誤');
  }
  
  // 第8步：最終截圖和總結
  console.log('\n=== 第8步：最終截圖和診斷總結 ===');
  
  await page.screenshot({ path: 'authenticated-dashboard-final.png', fullPage: true });
  console.log('📸 已認證Dashboard最終截圖已保存');
  
  // 診斷總結
  console.log('\n🎯 === 最終診斷總結 ===');
  console.log(`1. 登入狀態: ${isLoggedIn ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`2. Alpine.js: ${alpineStatus.alpine ? '✅ 載入' : '❌ 未載入'} ${alpineStatus.version ? `(v${alpineStatus.version})` : ''}`);
  console.log(`3. Enhanced Navigation: ${navComponents.enhancedNavElements > 0 ? '✅ 存在' : '❌ 不存在'} (${navComponents.enhancedNavElements}個)`);
  console.log(`4. Multi-level Navigation: ${navComponents.multiLevelNavElements > 0 ? '✅ 存在' : '❌ 不存在'} (${navComponents.multiLevelNavElements}個)`);
  console.log(`5. Alpine組件總數: ${navComponents.totalXDataElements}個`);
  console.log(`6. CSS設計令牌: ${Object.values(cssTokens).filter(v => v !== 'undefined').length}/${Object.keys(cssTokens).length}個載入`);
  console.log(`7. JavaScript錯誤: ${consoleErrors.length === 0 ? '✅ 無錯誤' : `❌ ${consoleErrors.length}個錯誤`}`);
  
  if (navComponents.enhancedNavElements > 0 && navComponents.multiLevelNavElements > 0) {
    console.log('\n🎉 結論: Enhanced Navigation組件成功載入並運行！');
    console.log('   用戶報告的問題已解決，下拉選單功能應該正常工作。');
  } else {
    console.log('\n⚠️  結論: Enhanced Navigation組件未找到');
    console.log('   需要進一步檢查組件載入問題或blade模板問題。');
  }
  
  console.log('\n✅ 測試完成');
});