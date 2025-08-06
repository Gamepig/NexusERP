/**
 * NexusERP 已登入用戶導航功能測試
 * 
 * 專門測試已登入用戶在系統內的導航功能
 * 
 * @author Claude Code Assistant
 * @date 2025-08-06
 */

import { test, expect } from '@playwright/test';

// 測試配置
const TEST_CONFIG = {
  baseURL: 'http://127.0.0.1:8000',
  testUser: {
    email: 'test@example.com',
    password: 'password123'
  },
  timeouts: {
    navigation: 30000,
    action: 15000,
    assertion: 10000
  }
};

// 測試工具函數
class AuthenticatedNavigationHelper {
  constructor(page) {
    this.page = page;
  }

  // 完成登入流程
  async performLogin() {
    await this.page.goto(TEST_CONFIG.baseURL + '/login');
    await this.page.waitForLoadState('networkidle');

    // 填寫登入表單
    await this.page.fill('input[name="email"], input[type="email"]', TEST_CONFIG.testUser.email);
    await this.page.fill('input[name="password"], input[type="password"]', TEST_CONFIG.testUser.password);

    // 提交登入表單
    await this.page.click('button[type="submit"], input[type="submit"], .btn-primary');
    
    // 等待登入完成 - 改為等待儀表板或主頁面載入
    await this.page.waitForLoadState('networkidle');
    
    // 檢查是否成功登入（檢查URL變化或特定元素）
    const currentUrl = this.page.url();
    console.log(`登入後URL: ${currentUrl}`);
    
    return currentUrl.includes('dashboard') || currentUrl === TEST_CONFIG.baseURL + '/' || await this.page.locator('text=儀表板, text=Dashboard, [href*="logout"]').first().isVisible();
  }

  // 檢查已登入狀態的主導航
  async checkAuthenticatedNavigation() {
    // 常見的已登入導航選擇器
    const navSelectors = [
      '.navbar-nav a',
      '.main-nav a',
      '.sidebar-nav a',
      '.nav-menu a',
      '.navigation a',
      'nav a:not([href*="login"]):not([href*="register"])',
      '.header-nav a',
      '.dashboard-nav a'
    ];

    let navItems = [];
    
    for (const selector of navSelectors) {
      const items = await this.page.locator(selector).all();
      if (items.length > 0) {
        for (const item of items) {
          try {
            const text = await item.textContent();
            const href = await item.getAttribute('href');
            const visible = await item.isVisible();
            
            if (visible && text && text.trim() && href && href !== '#') {
              navItems.push({
                text: text.trim(),
                href,
                element: item,
                selector
              });
            }
          } catch (e) {
            // 忽略無法讀取的元素
          }
        }
      }
    }

    return navItems;
  }

  // 檢查側邊欄導航
  async checkSidebarNavigation() {
    const sidebarSelectors = [
      '.sidebar a',
      '.side-nav a',
      '.menu-sidebar a',
      '.left-nav a',
      '.drawer-nav a'
    ];

    let sidebarItems = [];

    for (const selector of sidebarSelectors) {
      const items = await this.page.locator(selector).all();
      if (items.length > 0) {
        for (const item of items) {
          try {
            const text = await item.textContent();
            const href = await item.getAttribute('href');
            const visible = await item.isVisible();
            
            if (visible && text && text.trim()) {
              sidebarItems.push({
                text: text.trim(),
                href,
                element: item,
                selector
              });
            }
          } catch (e) {
            // 忽略無法讀取的元素
          }
        }
      }
    }

    return sidebarItems;
  }

  // 檢查用戶下拉選單
  async checkUserDropdown() {
    const userMenuSelectors = [
      '.user-dropdown',
      '.profile-dropdown',
      '.account-menu',
      '[data-toggle="user-menu"]',
      '.navbar .dropdown:has(img)',
      '.user-avatar',
      '.profile-menu'
    ];

    for (const selector of userMenuSelectors) {
      try {
        const userMenu = this.page.locator(selector).first();
        if (await userMenu.isVisible()) {
          await userMenu.click();
          await this.page.waitForTimeout(500);

          const menuItems = await this.page.locator('.dropdown-menu:visible a, .user-menu-items a').all();
          const items = [];

          for (const item of menuItems) {
            const text = await item.textContent();
            const href = await item.getAttribute('href');
            items.push({
              text: text?.trim(),
              href
            });
          }

          // 點擊空白處關閉選單
          await this.page.locator('body').click();

          return {
            found: true,
            selector,
            items
          };
        }
      } catch (e) {
        console.log(`檢查用戶選單 ${selector} 時發生錯誤: ${e.message}`);
      }
    }

    return { found: false };
  }

  // 測試導航功能性
  async testNavigationFunctionality(navItems) {
    const results = [];
    
    // 測試前幾個主要導航項目
    for (const item of navItems.slice(0, 5)) {
      if (item.href && !item.href.includes('logout') && !item.href.includes('javascript:')) {
        try {
          const startTime = Date.now();
          await item.element.click();
          await this.page.waitForLoadState('networkidle');
          const endTime = Date.now();
          
          const currentUrl = this.page.url();
          const loadTime = endTime - startTime;
          
          results.push({
            text: item.text,
            targetUrl: item.href,
            actualUrl: currentUrl,
            loadTime,
            success: true
          });

          console.log(`✅ ${item.text}: ${loadTime}ms -> ${currentUrl}`);
          
          // 等待一秒避免過快導航
          await this.page.waitForTimeout(1000);
          
        } catch (error) {
          results.push({
            text: item.text,
            targetUrl: item.href,
            error: error.message,
            success: false
          });
          
          console.log(`❌ ${item.text}: ${error.message}`);
        }
      }
    }

    return results;
  }

  // 檢查麵包屑導航（已登入頁面）
  async checkBreadcrumbOnPages(pages = ['/dashboard', '/customers', '/products']) {
    const breadcrumbResults = [];

    for (const page of pages) {
      try {
        await this.page.goto(TEST_CONFIG.baseURL + page);
        await this.page.waitForLoadState('networkidle');

        const breadcrumbSelectors = [
          '.breadcrumb',
          '.breadcrumb-nav',
          '[aria-label="breadcrumb"]',
          '.page-breadcrumb',
          '.nav-breadcrumb'
        ];

        let breadcrumbFound = false;

        for (const selector of breadcrumbSelectors) {
          const breadcrumb = this.page.locator(selector);
          if (await breadcrumb.isVisible()) {
            const items = await breadcrumb.locator('a, span, li').all();
            const breadcrumbData = [];

            for (const item of items) {
              const text = await item.textContent();
              const href = await item.getAttribute('href');
              breadcrumbData.push({
                text: text?.trim(),
                href,
                clickable: !!href
              });
            }

            breadcrumbResults.push({
              page,
              found: true,
              selector,
              items: breadcrumbData
            });

            breadcrumbFound = true;
            break;
          }
        }

        if (!breadcrumbFound) {
          breadcrumbResults.push({
            page,
            found: false
          });
        }

      } catch (error) {
        breadcrumbResults.push({
          page,
          error: error.message,
          found: false
        });
      }
    }

    return breadcrumbResults;
  }
}

// 測試套件
test.describe('NexusERP 已登入用戶導航功能測試', () => {
  let helper;

  test.beforeEach(async ({ page }) => {
    helper = new AuthenticatedNavigationHelper(page);
  });

  test('1. 用戶登入流程測試', async ({ page }) => {
    console.log('\n=== 用戶登入流程測試 ===');
    
    const loginSuccess = await helper.performLogin();
    
    console.log(`登入結果: ${loginSuccess ? '✅ 成功' : '❌ 失敗'}`);
    expect(loginSuccess).toBe(true);
  });

  test('2. 已登入用戶主導航測試', async ({ page }) => {
    console.log('\n=== 已登入用戶主導航測試 ===');
    
    await helper.performLogin();
    const navItems = await helper.checkAuthenticatedNavigation();
    
    console.log(`發現 ${navItems.length} 個導航項目：`);
    navItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.text} (${item.href}) [${item.selector}]`);
    });

    expect(navItems.length).toBeGreaterThan(0);
  });

  test('3. 側邊欄導航測試', async ({ page }) => {
    console.log('\n=== 側邊欄導航測試 ===');
    
    await helper.performLogin();
    const sidebarItems = await helper.checkSidebarNavigation();
    
    if (sidebarItems.length > 0) {
      console.log(`發現 ${sidebarItems.length} 個側邊欄項目：`);
      sidebarItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.text} (${item.href}) [${item.selector}]`);
      });
    } else {
      console.log('未發現側邊欄導航');
    }
  });

  test('4. 用戶下拉選單測試', async ({ page }) => {
    console.log('\n=== 用戶下拉選單測試 ===');
    
    await helper.performLogin();
    const userMenu = await helper.checkUserDropdown();
    
    if (userMenu.found) {
      console.log(`✅ 發現用戶選單 (${userMenu.selector})：`);
      userMenu.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.text} (${item.href})`);
      });
    } else {
      console.log('⚠️ 未發現用戶下拉選單');
    }
  });

  test('5. 導航功能性測試', async ({ page }) => {
    console.log('\n=== 導航功能性測試 ===');
    
    await helper.performLogin();
    const navItems = await helper.checkAuthenticatedNavigation();
    
    if (navItems.length > 0) {
      const results = await helper.testNavigationFunctionality(navItems);
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      console.log(`導航功能性測試結果: ${successCount}/${totalCount} 成功`);
      
      if (results.length > 0) {
        const averageLoadTime = results
          .filter(r => r.success)
          .reduce((sum, r) => sum + r.loadTime, 0) / results.filter(r => r.success).length;
        
        console.log(`平均載入時間: ${averageLoadTime.toFixed(0)}ms`);
        expect(averageLoadTime).toBeLessThan(3000); // 3秒內
      }
    } else {
      console.log('⚠️ 無可測試的導航項目');
    }
  });

  test('6. 已登入頁面麵包屑測試', async ({ page }) => {
    console.log('\n=== 已登入頁面麵包屑測試 ===');
    
    await helper.performLogin();
    const breadcrumbResults = await helper.checkBreadcrumbOnPages();
    
    breadcrumbResults.forEach(result => {
      if (result.found) {
        console.log(`✅ ${result.page}: 發現麵包屑 (${result.selector})`);
        result.items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.text} ${item.clickable ? '(可點擊)' : '(不可點擊)'}`);
        });
      } else {
        console.log(`⚠️ ${result.page}: 未發現麵包屑`);
      }
    });
  });

  test('7. 完整用戶體驗流程測試', async ({ page }) => {
    console.log('\n=== 完整用戶體驗流程測試 ===');
    
    // 模擬真實用戶操作流程
    const userJourney = [
      { step: '登入系統', action: () => helper.performLogin() },
      { step: '檢查主導航', action: () => helper.checkAuthenticatedNavigation() },
      { step: '檢查用戶選單', action: () => helper.checkUserDropdown() },
      { step: '訪問儀表板', action: () => page.goto(TEST_CONFIG.baseURL + '/dashboard') },
      { step: '訪問客戶頁面', action: () => page.goto(TEST_CONFIG.baseURL + '/customers') },
    ];

    let allStepsSuccess = true;
    const journeyResults = [];

    for (const step of userJourney) {
      try {
        const startTime = Date.now();
        const result = await step.action();
        const endTime = Date.now();

        const stepSuccess = step.step === '登入系統' ? result : true;
        const stepTime = endTime - startTime;

        journeyResults.push({
          step: step.step,
          success: stepSuccess,
          time: stepTime
        });

        allStepsSuccess = allStepsSuccess && stepSuccess;
        
        console.log(`${step.step}: ${stepTime}ms ${stepSuccess ? '✅' : '❌'}`);
        
        // 等待頁面穩定
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
      } catch (error) {
        journeyResults.push({
          step: step.step,
          success: false,
          error: error.message,
          time: 0
        });

        allStepsSuccess = false;
        console.log(`${step.step}: ❌ ${error.message}`);
      }
    }

    console.log(`整體用戶體驗: ${allStepsSuccess ? '✅ 優秀' : '⚠️ 需要改進'}`);
    
    const totalTime = journeyResults.reduce((sum, result) => sum + result.time, 0);
    console.log(`總體驗時間: ${totalTime}ms`);
  });
});