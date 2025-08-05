/**
 * 快速診斷測試 - 找出系統核心問題
 */

import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  email: 'test@example.com',
  password: 'password123',
  baseURL: 'http://127.0.0.1:8000'
};

test.describe('NexusERP 快速診斷', () => {
  test('診斷核心系統問題', async ({ page }) => {
    console.log('🔍 開始快速診斷測試');
    
    // 監聽所有網路響應
    const responses = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });

    // 監聽 JavaScript 錯誤
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    try {
      // 1. 測試首頁
      console.log('📋 1. 測試首頁');
      await page.goto(TEST_CONFIG.baseURL);
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'screenshots/01-診斷-首頁.png', fullPage: true });
      
      const homeContent = await page.content();
      if (homeContent.includes('500')) {
        console.log('❌ 首頁發生 500 錯誤');
      } else {
        console.log('✅ 首頁載入正常');
      }

      // 2. 測試登入頁面
      console.log('🔐 2. 測試登入頁面');
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'screenshots/02-診斷-登入頁面.png', fullPage: true });
      
      const loginContent = await page.content();
      if (loginContent.includes('500')) {
        console.log('❌ 登入頁面發生 500 錯誤');
      } else {
        console.log('✅ 登入頁面載入正常');
        
        // 嘗試登入
        const emailInput = page.locator('input[name="email"], input[type="email"]');
        const passwordInput = page.locator('input[name="password"], input[type="password"]');
        const submitButton = page.locator('button[type="submit"], input[type="submit"]');
        
        if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
          await emailInput.fill(TEST_CONFIG.email);
          await passwordInput.fill(TEST_CONFIG.password);
          
          await page.screenshot({ path: 'screenshots/03-診斷-登入表單.png', fullPage: true });
          
          await submitButton.click();
          await page.waitForTimeout(3000);
          
          await page.screenshot({ path: 'screenshots/04-診斷-登入完成.png', fullPage: true });
          
          const currentUrl = page.url();
          console.log(`登入後 URL: ${currentUrl}`);
          
          if (currentUrl.includes('/dashboard')) {
            console.log('✅ 登入成功，重定向到 dashboard');
            
            // 3. 測試 Dashboard
            console.log('📊 3. 測試 Dashboard');
            const dashboardContent = await page.content();
            if (dashboardContent.includes('500')) {
              console.log('❌ Dashboard 發生 500 錯誤');
            } else {
              console.log('✅ Dashboard 載入正常');
            }
            
          } else {
            console.log('❌ 登入失敗或重定向異常');
          }
        }
      }

      // 4. 測試各主要頁面 (不需要登入狀態)
      console.log('🌐 4. 測試主要頁面路由');
      const routes = [
        '/customers',
        '/products', 
        '/suppliers',
        '/orders',
        '/inventory',
        '/reports'
      ];

      for (const route of routes) {
        try {
          await page.goto(`${TEST_CONFIG.baseURL}${route}`);
          await page.waitForTimeout(1000);
          
          const content = await page.content();
          if (content.includes('500')) {
            console.log(`❌ ${route} 發生 500 錯誤`);
          } else if (content.includes('404')) {
            console.log(`⚠️ ${route} 發生 404 錯誤`);
          } else if (content.includes('login') || content.includes('登入')) {
            console.log(`🔐 ${route} 需要登入 (正常)`);
          } else {
            console.log(`✅ ${route} 載入正常`);
          }
        } catch (error) {
          console.log(`❌ ${route} 測試異常: ${error.message}`);
        }
      }

      // 5. 分析網路響應
      console.log('🌐 5. 網路響應分析');
      const errorResponses = responses.filter(r => r.status >= 400);
      if (errorResponses.length > 0) {
        console.log('❌ 發現錯誤響應:');
        errorResponses.forEach(r => {
          console.log(`   ${r.status} ${r.statusText} - ${r.url}`);
        });
      } else {
        console.log('✅ 所有網路響應正常');
      }

      // 6. JavaScript 錯誤分析
      console.log('⚠️ 6. JavaScript 錯誤分析');
      if (jsErrors.length > 0) {
        console.log('❌ 發現 JavaScript 錯誤:');
        jsErrors.forEach(error => {
          console.log(`   ${error}`);
        });
      } else {
        console.log('✅ 沒有 JavaScript 錯誤');
      }

    } catch (error) {
      console.log(`❌ 診斷測試異常: ${error.message}`);
      await page.screenshot({ path: 'screenshots/99-診斷-錯誤.png', fullPage: true });
    }

    console.log('📋 診斷測試完成');
  });
});