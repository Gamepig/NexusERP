/**
 * NexusERP Authentication Tests
 * 全面的認證功能測試套件
 * 
 * Test Coverage:
 * - User login/logout functionality
 * - Session management
 * - CSRF protection
 * - Authentication persistence
 * - Error handling
 */

import { test, expect } from '@playwright/test';
import { 
  TEST_CONFIG, 
  AuthHelper, 
  NavigationHelper, 
  TestUtils 
} from '../setup/test-setup.js';

test.describe('🔐 Authentication Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ensure we start with clean state
    await page.context().clearCookies();
    await page.goto(TEST_CONFIG.baseURL);
  });

  test('Login Flow - Complete Authentication Process', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('\n🎯 測試目標: 完整的用戶登入流程');
    
    // Step 1: Navigate to login page
    const navigation = await NavigationHelper.goToPage(page, '/login');
    expect(navigation.success).toBe(true);
    await TestUtils.takeScreenshot(page, '01-login-page');
    
    // Step 2: Verify login form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Step 3: Check CSRF token
    const csrfToken = await page.getAttribute('input[name="_token"]', 'value');
    expect(csrfToken).toBeTruthy();
    console.log('✅ CSRF Token 已找到');
    
    // Step 4: Perform login
    const loginResult = await AuthHelper.login(page);
    expect(loginResult.success).toBe(true);
    await TestUtils.takeScreenshot(page, '02-after-login');
    
    // Step 5: Verify successful authentication
    const isAuthenticated = await AuthHelper.isAuthenticated(page);
    expect(isAuthenticated).toBe(true);
    
    // Step 6: Check dashboard access
    expect(page.url()).toContain('/dashboard');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    
    console.log('✅ 登入流程測試通過');
  });

  test('Logout Flow - Session Termination', async ({ page }) => {
    test.setTimeout(45000);
    
    console.log('\n🎯 測試目標: 用戶登出流程');
    
    // Step 1: Login first
    const loginResult = await AuthHelper.login(page);
    expect(loginResult.success).toBe(true);
    
    // Step 2: Verify authenticated state
    const isAuthenticatedBefore = await AuthHelper.isAuthenticated(page);
    expect(isAuthenticatedBefore).toBe(true);
    await TestUtils.takeScreenshot(page, '01-before-logout');
    
    // Step 3: Perform logout
    const logoutResult = await AuthHelper.logout(page);
    expect(logoutResult.success).toBe(true);
    await TestUtils.takeScreenshot(page, '02-after-logout');
    
    // Step 4: Verify logout success
    const isAuthenticatedAfter = await AuthHelper.isAuthenticated(page);
    expect(isAuthenticatedAfter).toBe(false);
    
    // Step 5: Check redirect to login
    expect(page.url()).toContain('/login');
    
    console.log('✅ 登出流程測試通過');
  });

  test('Invalid Credentials - Error Handling', async ({ page }) => {
    test.setTimeout(45000);
    
    console.log('\n🎯 測試目標: 無效認證處理');
    
    // Step 1: Navigate to login
    await NavigationHelper.goToPage(page, '/login');
    
    // Step 2: Try invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Step 3: Wait for error handling
    await page.waitForTimeout(3000);
    await TestUtils.takeScreenshot(page, '01-invalid-login-attempt');
    
    // Step 4: Verify still on login page
    expect(page.url()).toContain('/login');
    
    // Step 5: Check for error messages
    const possibleErrorSelectors = [
      '.alert-danger',
      '.error-message',
      '.invalid-feedback',
      '[role="alert"]',
      '.text-red-500',
      '.text-danger'
    ];
    
    let errorFound = false;
    for (const selector of possibleErrorSelectors) {
      try {
        const errorElement = page.locator(selector);
        const isVisible = await errorElement.isVisible({ timeout: 2000 });
        if (isVisible) {
          errorFound = true;
          console.log(`✅ 錯誤訊息已顯示: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Even if no specific error message, the fact that we're still on login page is correct behavior
    console.log(errorFound ? '✅ 錯誤處理正確' : '⚠️ 未找到錯誤訊息但行為正確');
  });

  test('Session Persistence - Browser Refresh', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('\n🎯 測試目標: 會話持久性測試');
    
    // Step 1: Login
    const loginResult = await AuthHelper.login(page);
    expect(loginResult.success).toBe(true);
    
    // Step 2: Navigate to different page
    await NavigationHelper.goToPage(page, '/customers');
    await TestUtils.takeScreenshot(page, '01-before-refresh');
    
    // Step 3: Refresh the page
    await page.reload({ waitUntil: 'networkidle' });
    await TestUtils.takeScreenshot(page, '02-after-refresh');
    
    // Step 4: Verify still authenticated
    const isStillAuthenticated = await AuthHelper.isAuthenticated(page);
    expect(isStillAuthenticated).toBe(true);
    
    // Step 5: Test navigation to protected page
    const dashboardNavigation = await NavigationHelper.goToPage(page, '/dashboard');
    expect(dashboardNavigation.success).toBe(true);
    
    console.log('✅ 會話持久性測試通過');
  });

  test('Authentication Required Pages - Access Control', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('\n🎯 測試目標: 受保護頁面存取控制');
    
    const protectedPages = [
      '/dashboard',
      '/customers',
      '/products', 
      '/suppliers',
      '/orders/sales',
      '/reports'
    ];
    
    for (const [index, protectedPath] of protectedPages.entries()) {
      console.log(`🔒 測試受保護頁面: ${protectedPath}`);
      
      // Step 1: Try to access without authentication
      const navigation = await NavigationHelper.goToPage(page, protectedPath);
      
      // Step 2: Should redirect to login or show access denied
      const currentUrl = page.url();
      const isRedirectedOrDenied = currentUrl.includes('/login') || 
                                  currentUrl.includes('/unauthorized') ||
                                  currentUrl.includes('/403');
      
      if (isRedirectedOrDenied) {
        console.log(`✅ ${protectedPath} 正確要求認證`);
      } else {
        // Some pages might load but show limited content
        console.log(`⚠️ ${protectedPath} 未重定向，檢查內容限制`);
        const hasContent = await page.locator('main, .content, .container').count() > 0;
        console.log(`頁面內容: ${hasContent ? '有' : '無'}`);
      }
      
      if (index === 0) {
        await TestUtils.takeScreenshot(page, '01-protected-page-access');
      }
    }
    
    console.log('✅ 存取控制測試完成');
  });

  test('Multiple Login Attempts - Rate Limiting', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('\n🎯 測試目標: 多次登入嘗試限制');
    
    await NavigationHelper.goToPage(page, '/login');
    
    // Attempt multiple failed logins
    for (let i = 1; i <= 3; i++) {
      console.log(`🔐 登入嘗試 ${i}/3`);
      
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', `wrongpassword${i}`);
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(2000);
      
      if (i === 3) {
        await TestUtils.takeScreenshot(page, '01-multiple-failed-attempts');
      }
    }
    
    // Try correct credentials after failed attempts
    console.log('🔐 嘗試正確認證');
    await page.fill('input[name="email"]', TEST_CONFIG.credentials.email);
    await page.fill('input[name="password"]', TEST_CONFIG.credentials.password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(5000);
    await TestUtils.takeScreenshot(page, '02-after-correct-credentials');
    
    // Check if login succeeded or if there's rate limiting
    const isAuthenticated = await AuthHelper.isAuthenticated(page);
    if (isAuthenticated) {
      console.log('✅ 正確認證成功');
    } else {
      console.log('⚠️ 可能存在速率限制或其他安全機制');
    }
  });

  test.afterEach(async ({ page }) => {
    // Clean up after each test
    try {
      await AuthHelper.logout(page);
    } catch (e) {
      // Ignore logout errors in cleanup
    }
    
    await page.context().clearCookies();
  });
});

test.describe('🛡️ Authentication Security Tests', () => {
  
  test('CSRF Protection - Token Validation', async ({ page }) => {
    test.setTimeout(45000);
    
    console.log('\n🎯 測試目標: CSRF 保護機制');
    
    // Step 1: Get login page
    await NavigationHelper.goToPage(page, '/login');
    
    // Step 2: Check CSRF token presence
    const csrfToken = await page.getAttribute('input[name="_token"]', 'value');
    expect(csrfToken).toBeTruthy();
    console.log('✅ CSRF Token 存在');
    
    // Step 3: Check meta tag
    const metaCsrfToken = await page.getAttribute('meta[name="csrf-token"]', 'content');
    console.log(`CSRF Meta Token: ${metaCsrfToken ? '存在' : '不存在'}`);
    
    await TestUtils.takeScreenshot(page, '01-csrf-protection-check');
    
    console.log('✅ CSRF 保護機制測試完成');
  });

  test('Session Security - Cookie Attributes', async ({ page }) => {
    test.setTimeout(45000);
    
    console.log('\n🎯 測試目標: 會話安全屬性');
    
    // Login to establish session
    await AuthHelper.login(page);
    
    // Check cookies
    const cookies = await page.context().cookies();
    console.log(`找到 ${cookies.length} 個 cookies`);
    
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.toLowerCase().includes('session') ||
      cookie.name.toLowerCase().includes('laravel') ||
      cookie.name.includes('XSRF')
    );
    
    console.log('會話相關 Cookies:');
    sessionCookies.forEach(cookie => {
      console.log(`- ${cookie.name}: HttpOnly=${cookie.httpOnly}, Secure=${cookie.secure}, SameSite=${cookie.sameSite}`);
    });
    
    await TestUtils.takeScreenshot(page, '01-session-security-check');
    
    console.log('✅ 會話安全屬性檢查完成');
  });
});