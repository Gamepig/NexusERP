/**
 * 調試認證流程 - 專門找出認證相關問題
 */

import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  email: 'test@example.com',
  password: 'password123',
  baseURL: 'http://127.0.0.1:8000'
};

test.describe('認證流程調試', () => {
  test('詳細分析認證流程問題', async ({ page }) => {
    console.log('🔍 開始認證流程調試');
    
    // 監聽所有網路請求和響應
    const networkLogs = [];
    page.on('request', request => {
      networkLogs.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });
    
    page.on('response', response => {
      networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });

    // 監聽控制台訊息
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    try {
      // 1. 測試首頁訪問
      console.log('📋 1. 訪問首頁');
      await page.goto(TEST_CONFIG.baseURL);
      await page.waitForTimeout(3000);
      
      const homeContent = await page.content();
      console.log(`首頁內容長度: ${homeContent.length}`);
      
      if (homeContent.includes('500')) {
        console.log('❌ 首頁就有 500 錯誤');
        await page.screenshot({ path: 'screenshots/debug-homepage-500.png' });
        
        // 檢查是否有錯誤訊息
        const errorMessages = await page.locator('.error, .exception, .whoops').allTextContents();
        if (errorMessages.length > 0) {
          console.log('錯誤訊息:', errorMessages);
        }
      } else {
        console.log('✅ 首頁正常載入');
      }

      // 2. 測試登入頁面
      console.log('🔐 2. 訪問登入頁面');
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      await page.waitForTimeout(3000);
      
      const loginContent = await page.content();
      if (loginContent.includes('500')) {
        console.log('❌ 登入頁面有 500 錯誤');
        await page.screenshot({ path: 'screenshots/debug-login-500.png' });
      } else {
        console.log('✅ 登入頁面正常載入');
        
        // 3. 嘗試登入
        console.log('📝 3. 執行登入');
        const emailInput = page.locator('input[name="email"]');
        const passwordInput = page.locator('input[name="password"]');
        const submitButton = page.locator('button[type="submit"]');
        
        if (await emailInput.count() > 0) {
          await emailInput.fill(TEST_CONFIG.email);
          await passwordInput.fill(TEST_CONFIG.password);
          await page.screenshot({ path: 'screenshots/debug-before-login.png' });
          
          console.log('提交登入表單...');
          await submitButton.click();
          
          // 等待登入處理
          await page.waitForTimeout(5000);
          
          const postLoginUrl = page.url();
          console.log(`登入後 URL: ${postLoginUrl}`);
          
          const postLoginContent = await page.content();
          if (postLoginContent.includes('500')) {
            console.log('❌ 登入後出現 500 錯誤');
            await page.screenshot({ path: 'screenshots/debug-post-login-500.png' });
            
            // 嘗試獲取具體的錯誤資訊
            const errorInfo = await page.locator('body').textContent();
            if (errorInfo.includes('SetCompanyContext')) {
              console.log('🔍 發現 SetCompanyContext 中介軟體問題');
            }
            if (errorInfo.includes('hasCompany')) {
              console.log('🔍 發現 hasCompany 方法問題');
            }
            if (errorInfo.includes('companies()')) {
              console.log('🔍 發現 companies() 關聯問題');
            }
          } else {
            console.log('✅ 登入成功');
            await page.screenshot({ path: 'screenshots/debug-login-success.png' });
          }
        }
      }

      // 4. 分析網路日誌
      console.log('🌐 4. 網路請求分析');
      const errorRequests = networkLogs.filter(log => 
        log.type === 'response' && log.status >= 400
      );
      
      if (errorRequests.length > 0) {
        console.log('❌ 錯誤請求:');
        errorRequests.forEach(req => {
          console.log(`   ${req.status} ${req.statusText} - ${req.url}`);
        });
      }

      // 5. 分析控制台日誌
      console.log('📝 5. 控制台訊息分析');
      const errorLogs = consoleLogs.filter(log => log.type === 'error');
      if (errorLogs.length > 0) {
        console.log('❌ JavaScript 錯誤:');
        errorLogs.forEach(log => {
          console.log(`   ${log.text}`);
        });
      }

      // 6. 嘗試直接訪問需要認證的頁面
      console.log('🔒 6. 測試保護頁面');
      const protectedPages = ['/dashboard', '/customers', '/products'];
      
      for (const pagePath of protectedPages) {
        try {
          await page.goto(`${TEST_CONFIG.baseURL}${pagePath}`);
          await page.waitForTimeout(2000);
          
          const content = await page.content();
          if (content.includes('500')) {
            console.log(`❌ ${pagePath} 有 500 錯誤`);
          } else if (content.includes('login')) {
            console.log(`🔐 ${pagePath} 正確重定向到登入`);
          } else {
            console.log(`✅ ${pagePath} 載入正常`);
          }
        } catch (error) {
          console.log(`❌ ${pagePath} 訪問異常: ${error.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ 調試過程異常: ${error.message}`);
      await page.screenshot({ path: 'screenshots/debug-exception.png' });
    }

    console.log('📋 認證流程調試完成');
  });
});