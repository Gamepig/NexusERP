import { test, expect } from '@playwright/test';

test.describe('Authentication Debug Test', () => {
  test('Debug authentication and navigation flow', async ({ page }) => {
    console.log('開始認證和導航流程調試...');
    
    // 1. Go to homepage
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'auth-debug-01-homepage.png', fullPage: true });
    
    const homeUrl = page.url();
    console.log(`首頁 URL: ${homeUrl}`);
    
    // 2. Check if already logged in by trying to access dashboard
    console.log('嘗試直接訪問 dashboard...');
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'auth-debug-02-dashboard-attempt.png', fullPage: true });
    
    const dashboardUrl = page.url();
    console.log(`Dashboard 嘗試後 URL: ${dashboardUrl}`);
    
    // 3. If redirected to login, perform login
    if (dashboardUrl.includes('login')) {
      console.log('被重定向到登入頁面，執行登入...');
      
      // Fill login form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.screenshot({ path: 'auth-debug-03-login-filled.png', fullPage: true });
      
      // Submit login
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for redirect
      
      const postLoginUrl = page.url();
      console.log(`登入後 URL: ${postLoginUrl}`);
      await page.screenshot({ path: 'auth-debug-04-after-login.png', fullPage: true });
    }
    
    // 4. Ensure we're on dashboard
    const currentUrl = page.url();
    if (!currentUrl.includes('dashboard')) {
      console.log('未在 dashboard，嘗試手動導航...');
      await page.goto('http://127.0.0.1:8000/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'auth-debug-05-final-dashboard.png', fullPage: true });
    
    // 5. Check authentication state
    const authState = await page.evaluate(() => {
      // Check for Laravel session/auth indicators
      const csrfToken = document.querySelector('meta[name="csrf-token"]');
      const authUser = document.querySelector('meta[name="user"]');
      
      // Check for any user info in the page
      const userInfo = document.body.innerHTML.includes('test@example.com');
      
      // Check current page indicators
      const pageTitle = document.title;
      const bodyClass = document.body.className;
      
      return {
        hasCsrfToken: !!csrfToken,
        csrfToken: csrfToken ? csrfToken.content : null,
        hasAuthUser: !!authUser,
        userInfoInPage: userInfo,
        pageTitle,
        bodyClass,
        currentPath: window.location.pathname
      };
    });
    
    console.log('認證狀態:', authState);
    
    // 6. Check for navigation elements again
    const navCheck = await page.evaluate(() => {
      const results = {};
      
      // Look for different navigation patterns
      results.navTags = document.querySelectorAll('nav').length;
      results.enhancedNav = document.querySelectorAll('nav[x-data*="enhancedNavigation"]').length;
      results.nexusUserTrigger = document.querySelectorAll('.nexus-user-trigger').length;
      results.alpineElements = document.querySelectorAll('[x-data]').length;
      
      // Check for Laravel Blade components
      results.xLayoutsEnhancedNav = document.body.innerHTML.includes('x-layouts.enhanced-navigation');
      
      // Get current page content indicators
      results.hasLoginLink = document.body.innerHTML.includes('登入');
      results.hasRegisterLink = document.body.innerHTML.includes('註冊');
      results.hasUserEmail = document.body.innerHTML.includes('test@example.com');
      
      // Check for specific navigation HTML
      const navHTML = [];
      document.querySelectorAll('nav').forEach((nav, i) => {
        navHTML.push(`Nav ${i + 1}: ${nav.outerHTML.substring(0, 200)}`);
      });
      results.navHTML = navHTML;
      
      return results;
    });
    
    console.log('導航檢查結果:', navCheck);
    
    // 7. Try to get session/cookie info
    const cookies = await page.context().cookies();
    const laravelSession = cookies.find(c => c.name.includes('laravel_session') || c.name.includes('session'));
    
    console.log('Session Cookie:', laravelSession ? 'Found' : 'Not found');
    if (laravelSession) {
      console.log(`Session name: ${laravelSession.name}`);
    }
    
    // 8. Check if we can make authenticated requests
    console.log('檢查認證 API 請求...');
    try {
      const response = await page.request.get('http://127.0.0.1:8000/dashboard');
      console.log(`Dashboard API 狀態: ${response.status()}`);
      
      if (response.status() === 200) {
        const html = await response.text();
        const hasEnhancedNav = html.includes('x-layouts.enhanced-navigation');
        const hasUserDropdown = html.includes('nexus-user-trigger');
        console.log(`Dashboard HTML 包含 enhanced-navigation: ${hasEnhancedNav}`);
        console.log(`Dashboard HTML 包含 user-trigger: ${hasUserDropdown}`);
      }
    } catch (error) {
      console.log(`API 請求錯誤: ${error.message}`);
    }
    
    // 9. Final diagnostic
    console.log('\n=== 診斷總結 ===');
    console.log(`當前 URL: ${page.url()}`);
    console.log(`頁面標題: ${authState.pageTitle}`);
    console.log(`CSRF Token: ${authState.hasCsrfToken ? '存在' : '不存在'}`);
    console.log(`Session Cookie: ${laravelSession ? '存在' : '不存在'}`);
    console.log(`Navigation 元素: ${navCheck.navTags} 個`);
    console.log(`Enhanced Navigation: ${navCheck.enhancedNav} 個`);
    console.log(`Alpine.js 元素: ${navCheck.alpineElements} 個`);
    console.log(`用戶資訊顯示: ${navCheck.hasUserEmail ? '是' : '否'}`);
  });
});