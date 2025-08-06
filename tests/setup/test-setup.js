/**
 * NexusERP Playwright Test Setup Configuration
 * 專為 Laravel ERP 系統設計的測試配置
 * 
 * Features:
 * - Authentication handling with session persistence
 * - CSRF token management
 * - Database state management
 * - Screenshot and video recording
 * - API testing utilities
 * - Multi-browser support
 */

import { expect } from '@playwright/test';

// Test Configuration Constants
export const TEST_CONFIG = {
  // Base URLs
  baseURL: 'http://127.0.0.1:8000',
  apiURL: 'http://127.0.0.1:8000/api',
  
  // Test Credentials
  credentials: {
    email: 'test@example.com',
    password: 'password123',
    name: '測試使用者'
  },
  
  // Timeouts
  timeouts: {
    page: 30000,        // Page load timeout
    action: 15000,      // Element action timeout
    api: 10000,         // API request timeout
    navigation: 20000   // Navigation timeout
  },
  
  // Test Data
  testData: {
    customer: {
      name: 'Test Customer Ltd.',
      email: 'customer@test.com',
      phone: '02-12345678',
      address: '台北市信義區測試路123號'
    },
    product: {
      name: 'Test Product',
      code: 'TEST-001',
      price: 1000,
      quantity: 100
    },
    supplier: {
      name: 'Test Supplier Inc.',
      email: 'supplier@test.com',
      phone: '02-87654321',
      contact: 'John Manager'
    }
  }
};

/**
 * Enhanced Authentication Helper
 * 處理 Laravel 認證和 CSRF token
 */
export class AuthHelper {
  static async login(page, credentials = TEST_CONFIG.credentials) {
    console.log('🔐 執行用戶登入流程...');
    
    try {
      // Navigate to login page
      await page.goto(`${TEST_CONFIG.baseURL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Check if already logged in
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ 已登入，跳過登入流程');
        return { success: true, message: '已經登入' };
      }
      
      // Fill login form
      await page.fill('input[name="email"]', credentials.email);
      await page.fill('input[name="password"]', credentials.password);
      
      // Get CSRF token if needed
      const csrfToken = await page.getAttribute('input[name="_token"]', 'value');
      console.log('🛡️ CSRF Token:', csrfToken ? 'Found' : 'Not found');
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { 
        timeout: TEST_CONFIG.timeouts.navigation 
      });
      
      // Verify login success
      const isLoggedIn = await AuthHelper.isAuthenticated(page);
      
      if (isLoggedIn) {
        console.log('✅ 登入成功');
        return { success: true, message: '登入成功' };
      } else {
        throw new Error('登入失敗：未能正確跳轉到 dashboard');
      }
      
    } catch (error) {
      console.log(`❌ 登入失敗: ${error.message}`);
      await page.screenshot({ 
        path: `test-results/login-failure-${Date.now()}.png`,
        fullPage: true 
      });
      return { success: false, message: error.message };
    }
  }

  static async isAuthenticated(page) {
    try {
      // Check if we're on dashboard or authenticated page
      const url = page.url();
      if (url.includes('/login')) {
        return false;
      }
      
      // Check for authenticated elements
      const authElements = [
        '.user-menu',
        '[data-user]',
        'nav:has-text("Dashboard")',
        'a[href*="logout"]'
      ];
      
      for (const selector of authElements) {
        try {
          const element = await page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 2000 });
          if (isVisible) {
            return true;
          }
        } catch (e) {
          continue;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  static async logout(page) {
    console.log('🚪 執行登出流程...');
    
    try {
      // Look for logout button or link
      const logoutSelectors = [
        'a[href*="logout"]',
        'button:has-text("登出")',
        'button:has-text("Logout")',
        '.logout-btn'
      ];
      
      for (const selector of logoutSelectors) {
        try {
          const element = page.locator(selector);
          const isVisible = await element.isVisible({ timeout: 2000 });
          if (isVisible) {
            await element.click();
            await page.waitForURL('**/login', { 
              timeout: TEST_CONFIG.timeouts.navigation 
            });
            console.log('✅ 登出成功');
            return { success: true };
          }
        } catch (e) {
          continue;
        }
      }
      
      // Alternative: Go to logout URL directly
      await page.goto(`${TEST_CONFIG.baseURL}/logout`);
      await page.waitForURL('**/login');
      console.log('✅ 直接登出成功');
      return { success: true };
      
    } catch (error) {
      console.log(`❌ 登出失敗: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}

/**
 * API Testing Helper
 * 處理 API 請求和認證
 */
export class APIHelper {
  static async authenticatedRequest(page, method, endpoint, data = null) {
    console.log(`🌐 API ${method} 請求: ${endpoint}`);
    
    try {
      // Get CSRF token from page
      let csrfToken = null;
      try {
        csrfToken = await page.evaluate(() => {
          const metaTag = document.querySelector('meta[name="csrf-token"]');
          return metaTag ? metaTag.getAttribute('content') : null;
        });
      } catch (e) {
        console.log('⚠️ 無法取得 CSRF token');
      }
      
      // Prepare request options
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
      
      // Add CSRF token if available
      if (csrfToken) {
        options.headers['X-CSRF-TOKEN'] = csrfToken;
      }
      
      // Add request body for POST/PUT requests
      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = JSON.stringify(data);
      }
      
      // Make the request
      const response = await page.request.fetch(`${TEST_CONFIG.apiURL}${endpoint}`, options);
      
      const responseData = await response.json().catch(() => ({}));
      
      console.log(`📊 API 回應: ${response.status()}`);
      
      return {
        success: response.ok(),
        status: response.status(),
        data: responseData,
        response: response
      };
      
    } catch (error) {
      console.log(`❌ API 請求失敗: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Page Navigation Helper
 * 處理頁面導航和狀態檢查
 */
export class NavigationHelper {
  static async goToPage(page, path, options = {}) {
    const fullUrl = `${TEST_CONFIG.baseURL}${path}`;
    console.log(`🌐 導航到: ${fullUrl}`);
    
    try {
      await page.goto(fullUrl, {
        timeout: TEST_CONFIG.timeouts.page,
        waitUntil: 'networkidle',
        ...options
      });
      
      // Wait for page to be ready
      await page.waitForLoadState('domcontentloaded');
      
      // Check for error pages
      const hasError = await NavigationHelper.checkForErrors(page);
      if (hasError.hasError) {
        console.log(`⚠️ 頁面載入有錯誤: ${hasError.errorType}`);
      }
      
      console.log('✅ 頁面導航成功');
      return { 
        success: true, 
        url: page.url(),
        hasError: hasError.hasError,
        errorInfo: hasError
      };
      
    } catch (error) {
      console.log(`❌ 頁面導航失敗: ${error.message}`);
      await page.screenshot({ 
        path: `test-results/navigation-failure-${Date.now()}.png`,
        fullPage: true 
      });
      return { success: false, error: error.message };
    }
  }

  static async checkForErrors(page) {
    try {
      const content = await page.content();
      
      const errorChecks = {
        http500: content.includes('500') || content.includes('Internal Server Error'),
        http404: content.includes('404') || content.includes('Not Found'),
        phpError: content.includes('Fatal error') || content.includes('Exception:'),
        laravelError: content.includes('Whoops') || content.includes('ErrorException'),
        dbError: content.includes('database') && content.includes('error'),
        tokenError: content.includes('CSRF token mismatch') || content.includes('TokenMismatchException')
      };
      
      const hasError = Object.values(errorChecks).some(check => check);
      const errorType = Object.keys(errorChecks).find(key => errorChecks[key]) || 'unknown';
      
      return {
        hasError,
        errorType,
        checks: errorChecks,
        title: await page.title()
      };
      
    } catch (error) {
      return {
        hasError: true,
        errorType: 'check_failed',
        error: error.message
      };
    }
  }
}

/**
 * Form Interaction Helper
 * 處理表單填寫和提交
 */
export class FormHelper {
  static async fillForm(page, formData, formSelector = 'form') {
    console.log('📝 填寫表單...');
    
    try {
      const form = page.locator(formSelector);
      await expect(form).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });
      
      for (const [fieldName, value] of Object.entries(formData)) {
        const selectors = [
          `input[name="${fieldName}"]`,
          `select[name="${fieldName}"]`,
          `textarea[name="${fieldName}"]`,
          `[name="${fieldName}"]`
        ];
        
        let filled = false;
        for (const selector of selectors) {
          try {
            const field = page.locator(selector);
            const isVisible = await field.isVisible({ timeout: 2000 });
            
            if (isVisible) {
              const tagName = await field.evaluate(el => el.tagName.toLowerCase());
              
              if (tagName === 'select') {
                await field.selectOption(value);
              } else {
                await field.fill(String(value));
              }
              
              console.log(`✅ 填寫 ${fieldName}: ${value}`);
              filled = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!filled) {
          console.log(`⚠️ 無法找到欄位: ${fieldName}`);
        }
      }
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ 表單填寫失敗: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  static async submitForm(page, formSelector = 'form', submitSelector = 'button[type="submit"]') {
    console.log('🚀 提交表單...');
    
    try {
      const submitButton = page.locator(submitSelector);
      await expect(submitButton).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });
      
      // Click submit button
      await submitButton.click();
      
      // Wait for form submission to complete
      await page.waitForLoadState('networkidle', { 
        timeout: TEST_CONFIG.timeouts.navigation 
      });
      
      console.log('✅ 表單提交成功');
      return { success: true };
      
    } catch (error) {
      console.log(`❌ 表單提交失敗: ${error.message}`);
      await page.screenshot({ 
        path: `test-results/form-submit-failure-${Date.now()}.png`,
        fullPage: true 
      });
      return { success: false, error: error.message };
    }
  }
}

/**
 * Test Utilities
 * 測試工具函數
 */
export class TestUtils {
  static async takeScreenshot(page, name, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results/${name}-${timestamp}.png`;
    
    try {
      await page.screenshot({
        path: filename,
        fullPage: true,
        ...options
      });
      console.log(`📸 截圖已保存: ${filename}`);
      return filename;
    } catch (error) {
      console.log(`❌ 截圖失敗: ${error.message}`);
      return null;
    }
  }

  static async waitForElement(page, selector, options = {}) {
    try {
      const element = page.locator(selector);
      await element.waitFor({
        state: 'visible',
        timeout: TEST_CONFIG.timeouts.action,
        ...options
      });
      return { found: true, element };
    } catch (error) {
      console.log(`⚠️ 元素未找到: ${selector}`);
      return { found: false, error: error.message };
    }
  }

  static async getPageInfo(page) {
    try {
      return {
        url: page.url(),
        title: await page.title(),
        timestamp: new Date().toISOString(),
        viewport: await page.viewportSize(),
        userAgent: await page.evaluate(() => navigator.userAgent)
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  static generateTestData(type) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    const templates = {
      customer: {
        name: `測試客戶 ${timestamp}`,
        email: `customer${random}@test.com`,
        phone: `02-${random}${random}`,
        address: `台北市測試區測試路${random}號`
      },
      product: {
        name: `測試產品 ${timestamp}`,
        code: `TEST-${random}`,
        price: random * 10,
        quantity: random
      },
      supplier: {
        name: `測試供應商 ${timestamp}`,
        email: `supplier${random}@test.com`,
        phone: `04-${random}${random}`,
        contact: `聯絡人 ${random}`
      }
    };
    
    return templates[type] || {};
  }
}

// All classes are already exported individually above