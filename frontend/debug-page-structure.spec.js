import { test, expect } from '@playwright/test';

test.describe('Debug Page Structure', () => {
  test('Check what is actually rendered', async ({ page }) => {
    console.log('檢查頁面實際渲染內容...');
    
    // Navigate to the app
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'debug-01-initial-page.png', fullPage: true });
    
    // Check if we need to login
    const hasLoginForm = await page.locator('form[action*="login"]').isVisible();
    console.log(`登入表單存在: ${hasLoginForm ? '是' : '否'}`);
    
    if (hasLoginForm) {
      console.log('執行登入...');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.screenshot({ path: 'debug-02-login-filled.png', fullPage: true });
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Take post-login screenshot
    await page.screenshot({ path: 'debug-03-after-login.png', fullPage: true });
    
    // Get the current URL
    const currentUrl = page.url();
    console.log(`當前 URL: ${currentUrl}`);
    
    // Check for different types of navigation elements
    const navElements = await page.evaluate(() => {
      const results = [];
      
      // Check for nav tags
      const navTags = document.querySelectorAll('nav');
      results.push(`nav 標籤數量: ${navTags.length}`);
      
      navTags.forEach((nav, i) => {
        results.push(`nav ${i + 1}:`);
        results.push(`  - id: ${nav.id || '無'}`);
        results.push(`  - class: ${nav.className || '無'}`);
        results.push(`  - x-data: ${nav.getAttribute('x-data') || '無'}`);
        results.push(`  - 可見: ${nav.offsetParent !== null ? '是' : '否'}`);
      });
      
      // Check for any elements with x-data
      const alpineElements = document.querySelectorAll('[x-data]');
      results.push(`Alpine.js 元素數量: ${alpineElements.length}`);
      
      alpineElements.forEach((el, i) => {
        results.push(`Alpine 元素 ${i + 1}:`);
        results.push(`  - 標籤: ${el.tagName}`);
        results.push(`  - x-data: ${el.getAttribute('x-data')}`);
        results.push(`  - class: ${el.className}`);
      });
      
      // Check for navigation-related classes
      const navClasses = [
        '.nexus-user-trigger',
        '.nexus-user-dropdown',
        '.enhanced-navigation',
        '[data-dropdown]',
        '.dropdown',
        '.navigation'
      ];
      
      navClasses.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.push(`${selector}: 找到 ${elements.length} 個元素`);
        }
      });
      
      // Check if Alpine.js is loaded
      results.push(`Alpine.js 載入: ${typeof window.Alpine !== 'undefined' ? '是' : '否'}`);
      
      // Get page title and HTML structure
      results.push(`頁面標題: ${document.title}`);
      results.push(`body class: ${document.body.className}`);
      
      return results;
    });
    
    console.log('頁面結構分析:');
    navElements.forEach(line => console.log(line));
    
    // Get the raw HTML of potential navigation areas
    const headerHTML = await page.evaluate(() => {
      const header = document.querySelector('header');
      return header ? header.outerHTML.substring(0, 500) : '無 header 元素';
    });
    
    const bodyTopHTML = await page.evaluate(() => {
      const body = document.body;
      const firstChild = body.children[0];
      return firstChild ? firstChild.outerHTML.substring(0, 1000) : '無 body 第一個子元素';
    });
    
    console.log('Header HTML (前500字符):');
    console.log(headerHTML);
    console.log('Body 第一個子元素 HTML (前1000字符):');
    console.log(bodyTopHTML);
    
    // Check for any errors in console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      console.log('JavaScript 錯誤:');
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    } else {
      console.log('✅ 無 JavaScript 錯誤');
    }
    
    // Try to go to dashboard explicitly
    if (!currentUrl.includes('dashboard')) {
      console.log('嘗試導航到 dashboard...');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-04-dashboard-page.png', fullPage: true });
      
      // Check again after navigating to dashboard
      const dashboardNavElements = await page.evaluate(() => {
        const results = [];
        const navTags = document.querySelectorAll('nav');
        results.push(`Dashboard - nav 標籤數量: ${navTags.length}`);
        
        navTags.forEach((nav, i) => {
          results.push(`Dashboard nav ${i + 1}:`);
          results.push(`  - x-data: ${nav.getAttribute('x-data') || '無'}`);
          results.push(`  - 可見: ${nav.offsetParent !== null ? '是' : '否'}`);
        });
        
        return results;
      });
      
      console.log('Dashboard 頁面分析:');
      dashboardNavElements.forEach(line => console.log(line));
    }
    
    // Final screenshot
    await page.screenshot({ path: 'debug-05-final-state.png', fullPage: true });
  });
});