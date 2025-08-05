import { test, expect } from '@playwright/test';

test('檢查認證狀態和導航組件載入', async ({ page }) => {
  console.log('🔍 檢查認證狀態和導航組件...');
  
  // 第1步：檢查未認證狀態
  console.log('\n=== 第1步：檢查未認證訪問dashboard ===');
  await page.goto('http://127.0.0.1:8000/dashboard');
  await page.waitForLoadState('networkidle');
  
  const redirectUrl = page.url();
  console.log(`訪問dashboard後的URL: ${redirectUrl}`);
  
  const isRedirectedToLogin = redirectUrl.includes('login');
  console.log(`是否重定向到登入頁: ${isRedirectedToLogin ? '是' : '否'}`);
  
  // 第2步：檢查登入頁面的導航
  if (isRedirectedToLogin) {
    console.log('\n=== 第2步：檢查登入頁面導航 ===');
    
    const title = await page.title();
    console.log(`登入頁面標題: ${title}`);
    
    // 檢查登入頁面是否使用enhanced-navigation
    const hasEnhancedNav = await page.locator('[x-data*="enhancedNavigation"]').count();
    console.log(`登入頁面enhanced-navigation數量: ${hasEnhancedNav}`);
    
    // 檢查登入頁面使用的布局
    const layoutInfo = await page.evaluate(() => {
      const hasAppLayout = document.querySelector('[data-layout="app"]') || 
                           document.body.innerHTML.includes('enhanced-navigation');
      const hasGuestLayout = document.querySelector('[data-layout="guest"]') ||
                             document.body.innerHTML.includes('guest');
      
      return {
        hasAppLayout,
        hasGuestLayout,
        bodyClasses: document.body.className,
        hasNavigation: !!document.querySelector('nav')
      };
    });
    
    console.log('登入頁面布局資訊:', layoutInfo);
    
    // 截圖登入頁面
    await page.screenshot({ path: 'login-page-navigation.png' });
    console.log('📸 登入頁面截圖已保存');
  }
  
  // 第3步：檢查首頁（非認證頁面）的導航
  console.log('\n=== 第3步：檢查首頁導航對比 ===');
  await page.goto('http://127.0.0.1:8000');
  await page.waitForLoadState('networkidle');
  
  const homePageInfo = await page.evaluate(() => {
    return {
      hasEnhancedNav: document.querySelectorAll('[x-data*="enhancedNavigation"]').length,
      hasMultiLevelNav: document.querySelectorAll('[x-data*="multiLevelNav"]').length,
      totalXDataElements: document.querySelectorAll('[x-data]').length,
      navElements: document.querySelectorAll('nav').length,
      alpineVersion: window.Alpine?.version,
      title: document.title
    };
  });
  
  console.log('首頁導航資訊:', homePageInfo);
  
  // 第4步：嘗試模擬登入（如果有表單）
  if (isRedirectedToLogin) {
    console.log('\n=== 第4步：檢查登入表單 ===');
    
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 檢查是否有登入表單
    const hasLoginForm = await page.locator('form').count();
    const hasEmailField = await page.locator('input[type="email"], input[name="email"]').count();
    const hasPasswordField = await page.locator('input[type="password"], input[name="password"]').count();
    
    console.log(`登入表單數量: ${hasLoginForm}`);
    console.log(`郵箱欄位數量: ${hasEmailField}`);
    console.log(`密碼欄位數量: ${hasPasswordField}`);
    
    // 檢查是否有測試帳號或bypass方式
    const hasTestLogin = await page.locator('text*="測試", text*="demo", text*="guest"').count();
    console.log(`測試登入選項: ${hasTestLogin > 0 ? '存在' : '不存在'}`);
  }
  
  // 第5步：檢查enhanced-navigation組件檔案
  console.log('\n=== 第5步：檢查組件檔案狀態 ===');
  
  // 使用網路請求檢查組件是否能被載入
  try {
    const componentResponse = await page.goto('http://127.0.0.1:8000');
    console.log(`伺服器響應狀態: ${componentResponse.status()}`);
    
    // 檢查頁面內容是否包含enhanced-navigation相關內容
    const pageContent = await page.content();
    const hasEnhancedNavInContent = pageContent.includes('enhanced-navigation') || 
                                   pageContent.includes('enhancedNavigation');
    
    console.log(`頁面內容包含enhanced-navigation: ${hasEnhancedNavInContent ? '是' : '否'}`);
    
    if (hasEnhancedNavInContent) {
      console.log('✅ enhanced-navigation組件存在於頁面中');
    } else {
      console.log('❌ enhanced-navigation組件不存在於頁面中');
    }
    
  } catch (error) {
    console.log(`組件檢查錯誤: ${error.message}`);
  }
  
  console.log('\n=== 診斷結論 ===');
  
  if (isRedirectedToLogin) {
    console.log('🔍 問題分析：');
    console.log('1. Dashboard需要認證，未登入用戶被重定向到登入頁');
    console.log('2. 用戶看到的可能是登入頁面，而非真正的dashboard');
    console.log('3. 登入頁面可能使用不同的布局，沒有enhanced-navigation');
    console.log('4. 需要先解決認證問題，才能測試dashboard的導航功能');
  } else {
    console.log('🔍 問題分析：');
    console.log('1. Dashboard可以直接訪問，無需認證');
    console.log('2. 問題可能出現在enhanced-navigation組件本身');
    console.log('3. 需要檢查組件定義和Alpine.js初始化');
  }
});