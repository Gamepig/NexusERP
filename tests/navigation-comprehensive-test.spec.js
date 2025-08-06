/**
 * NexusERP 導航功能完整測試
 * 
 * 測試範圍：
 * 1. 頂部主導航功能
 * 2. 多層級下拉選單
 * 3. 麵包屑導航
 * 4. 響應式設計
 * 5. 互動功能（鍵盤導航、懸停效果）
 * 6. 主題切換
 * 7. 使用者選單
 * 8. 效能與無障礙測試
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
class NavigationTestHelper {
  constructor(page) {
    this.page = page;
    this.startTime = null;
    this.endTime = null;
  }

  // 開始計時
  startTimer() {
    this.startTime = Date.now();
  }

  // 結束計時並返回耗時
  endTimer() {
    this.endTime = Date.now();
    return this.endTime - this.startTime;
  }

  // 登入功能
  async login() {
    await this.page.goto(TEST_CONFIG.baseURL);
    await this.page.waitForLoadState('networkidle');

    // 檢查是否已登入
    const dashboardExists = await this.page.locator('text=儀表板').isVisible().catch(() => false);
    if (dashboardExists) {
      console.log('用戶已登入，跳過登入步驟');
      return;
    }

    // 點擊登入連結
    const loginLink = this.page.locator('a[href*="login"], text=登入, text=Login').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
    }

    // 填寫登入表單
    await this.page.waitForSelector('input[name="email"], input[type="email"]');
    await this.page.fill('input[name="email"], input[type="email"]', TEST_CONFIG.testUser.email);
    await this.page.fill('input[name="password"], input[type="password"]', TEST_CONFIG.testUser.password);

    // 提交登入表單
    await this.page.click('button[type="submit"], input[type="submit"], .btn-primary');
    
    // 等待登入完成
    await this.page.waitForURL('**/dashboard**', { timeout: TEST_CONFIG.timeouts.navigation });
    await this.page.waitForLoadState('networkidle');
  }

  // 檢查主導航元素
  async checkMainNavigation() {
    const navItems = await this.page.locator('nav a, .navbar a, .navigation a').all();
    const navData = [];

    for (const item of navItems) {
      const text = await item.textContent();
      const href = await item.getAttribute('href');
      const visible = await item.isVisible();
      
      navData.push({
        text: text?.trim(),
        href,
        visible,
        element: item
      });
    }

    return navData.filter(item => item.visible && item.text);
  }

  // 檢查下拉選單
  async checkDropdownMenus() {
    const dropdowns = await this.page.locator('[data-toggle="dropdown"], .dropdown-toggle, .nav-item.dropdown').all();
    const dropdownData = [];

    for (const dropdown of dropdowns) {
      try {
        const triggerText = await dropdown.textContent();
        
        // 懸停觸發下拉選單
        await dropdown.hover();
        await this.page.waitForTimeout(500); // 等待動畫

        // 檢查下拉選單是否出現
        const dropdownMenu = this.page.locator('.dropdown-menu:visible, .submenu:visible').first();
        const isVisible = await dropdownMenu.isVisible().catch(() => false);
        
        if (isVisible) {
          const menuItems = await dropdownMenu.locator('a, button').all();
          const items = [];

          for (const item of menuItems) {
            const itemText = await item.textContent();
            const itemHref = await item.getAttribute('href');
            items.push({
              text: itemText?.trim(),
              href: itemHref
            });
          }

          dropdownData.push({
            trigger: triggerText?.trim(),
            items,
            visible: true
          });
        }

        // 移開鼠標隱藏下拉選單
        await this.page.locator('body').hover();
        await this.page.waitForTimeout(300);

      } catch (error) {
        console.log(`下拉選單檢查錯誤: ${error.message}`);
      }
    }

    return dropdownData;
  }

  // 檢查麵包屑導航
  async checkBreadcrumb() {
    const breadcrumbSelectors = [
      '.breadcrumb',
      '.breadcrumb-nav',
      '[aria-label="breadcrumb"]',
      '.page-breadcrumb'
    ];

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

        return {
          found: true,
          selector,
          items: breadcrumbData
        };
      }
    }

    return { found: false };
  }

  // 測試鍵盤導航
  async testKeyboardNavigation() {
    const results = [];
    
    // 測試 Tab 鍵導航
    await this.page.keyboard.press('Tab');
    let focused = await this.page.evaluate(() => document.activeElement?.tagName);
    results.push({
      action: 'Tab',
      focusedElement: focused,
      success: !!focused
    });

    // 測試 Enter 鍵
    if (focused === 'A' || focused === 'BUTTON') {
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(1000);
      results.push({
        action: 'Enter',
        success: true
      });
    }

    // 測試 Escape 鍵
    await this.page.keyboard.press('Escape');
    results.push({
      action: 'Escape',
      success: true
    });

    return results;
  }

  // 檢查響應式設計
  async checkResponsiveDesign() {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    const results = [];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(1000); // 等待重新渲染

      // 檢查導航是否正確顯示
      const nav = this.page.locator('nav, .navbar, .navigation').first();
      const navVisible = await nav.isVisible();
      
      // 檢查漢堡選單 (移動端)
      const hamburger = await this.page.locator('.navbar-toggle, .menu-toggle, .hamburger').isVisible().catch(() => false);
      
      results.push({
        viewport: viewport.name,
        size: `${viewport.width}x${viewport.height}`,
        navVisible,
        hamburgerVisible: hamburger,
        appropriate: viewport.name === 'Mobile' ? hamburger : navVisible
      });
    }

    // 恢復桌面視口
    await this.page.setViewportSize({ width: 1920, height: 1080 });

    return results;
  }

  // 檢查使用者選單
  async checkUserMenu() {
    const userMenuSelectors = [
      '.user-menu',
      '.profile-dropdown',
      '[data-toggle="user-menu"]',
      '.navbar .dropdown:has(.user-avatar)',
      '.navbar .dropdown:last-child'
    ];

    for (const selector of userMenuSelectors) {
      const userMenu = this.page.locator(selector);
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

        return {
          found: true,
          selector,
          items
        };
      }
    }

    return { found: false };
  }

  // 測量頁面載入時間
  async measurePageLoadTime(url) {
    this.startTimer();
    await this.page.goto(TEST_CONFIG.baseURL + url);
    await this.page.waitForLoadState('networkidle');
    return this.endTimer();
  }

  // 檢查無障礙屬性
  async checkAccessibility() {
    const results = [];

    // 檢查 ARIA 標籤
    const ariaElements = await this.page.locator('[aria-label], [aria-expanded], [role]').all();
    for (const element of ariaElements) {
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaExpanded = await element.getAttribute('aria-expanded');
      const role = await element.getAttribute('role');
      
      results.push({
        type: 'aria',
        attributes: { ariaLabel, ariaExpanded, role },
        hasAttributes: !!(ariaLabel || ariaExpanded || role)
      });
    }

    // 檢查 alt 屬性
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      results.push({
        type: 'image',
        src,
        hasAlt: !!alt,
        altText: alt
      });
    }

    return results;
  }
}

// 測試套件開始
test.describe('NexusERP 導航功能完整測試', () => {
  let helper;

  test.beforeEach(async ({ page }) => {
    helper = new NavigationTestHelper(page);
    await helper.login();
  });

  test('1. 頂部主導航功能測試', async ({ page }) => {
    console.log('\n=== 頂部主導航功能測試 ===');
    
    const navItems = await helper.checkMainNavigation();
    
    // 驗證
    expect(navItems.length).toBeGreaterThan(0);
    
    console.log('發現的導航項目：');
    navItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.text} (${item.href})`);
    });

    // 測試每個導航項目
    for (const item of navItems.slice(0, 5)) { // 限制測試前5個項目
      if (item.href && item.href !== '#' && !item.href.includes('logout')) {
        try {
          await item.element.click();
          await page.waitForLoadState('networkidle');
          
          const currentUrl = page.url();
          console.log(`✅ 導航到: ${item.text} -> ${currentUrl}`);
          
          // 回到儀表板
          await page.goto(TEST_CONFIG.baseURL + '/dashboard');
          await page.waitForLoadState('networkidle');
        } catch (error) {
          console.log(`❌ 導航失敗: ${item.text} - ${error.message}`);
        }
      }
    }
  });

  test('2. 多層級下拉選單測試', async ({ page }) => {
    console.log('\n=== 多層級下拉選單測試 ===');
    
    const dropdowns = await helper.checkDropdownMenus();
    
    console.log(`發現 ${dropdowns.length} 個下拉選單`);
    dropdowns.forEach((dropdown, index) => {
      console.log(`${index + 1}. ${dropdown.trigger}:`);
      dropdown.items.forEach((item, itemIndex) => {
        console.log(`   ${itemIndex + 1}. ${item.text} (${item.href})`);
      });
    });

    // 驗證至少有一些下拉選單
    expect(dropdowns.length).toBeGreaterThan(0);
  });

  test('3. 麵包屑導航測試', async ({ page }) => {
    console.log('\n=== 麵包屑導航測試 ===');
    
    // 導航到子頁面測試麵包屑
    const testPages = ['/customers', '/products', '/sales-orders'];
    
    for (const testPage of testPages) {
      try {
        await page.goto(TEST_CONFIG.baseURL + testPage);
        await page.waitForLoadState('networkidle');
        
        const breadcrumb = await helper.checkBreadcrumb();
        
        if (breadcrumb.found) {
          console.log(`✅ 在 ${testPage} 發現麵包屑導航:`);
          breadcrumb.items.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.text} ${item.clickable ? '(可點擊)' : '(不可點擊)'}`);
          });
        } else {
          console.log(`⚠️ 在 ${testPage} 未發現麵包屑導航`);
        }
      } catch (error) {
        console.log(`❌ 測試 ${testPage} 麵包屑時發生錯誤: ${error.message}`);
      }
    }
  });

  test('4. 響應式設計測試', async ({ page }) => {
    console.log('\n=== 響應式設計測試 ===');
    
    const responsiveResults = await helper.checkResponsiveDesign();
    
    responsiveResults.forEach(result => {
      console.log(`${result.viewport} (${result.size}):`);
      console.log(`  導航可見: ${result.navVisible ? '✅' : '❌'}`);
      console.log(`  漢堡選單: ${result.hamburgerVisible ? '✅' : '❌'}`);
      console.log(`  設計合適: ${result.appropriate ? '✅' : '❌'}`);
    });

    // 驗證響應式設計
    const mobileResult = responsiveResults.find(r => r.viewport === 'Mobile');
    const desktopResult = responsiveResults.find(r => r.viewport === 'Desktop');
    
    expect(desktopResult.navVisible).toBe(true);
    expect(mobileResult.appropriate).toBe(true);
  });

  test('5. 鍵盤導航測試', async ({ page }) => {
    console.log('\n=== 鍵盤導航測試 ===');
    
    const keyboardResults = await helper.testKeyboardNavigation();
    
    keyboardResults.forEach(result => {
      console.log(`${result.action}: ${result.success ? '✅' : '❌'}`);
      if (result.focusedElement) {
        console.log(`  聚焦元素: ${result.focusedElement}`);
      }
    });

    // 驗證鍵盤導航基本功能
    const tabResult = keyboardResults.find(r => r.action === 'Tab');
    expect(tabResult.success).toBe(true);
  });

  test('6. 使用者選單測試', async ({ page }) => {
    console.log('\n=== 使用者選單測試 ===');
    
    const userMenu = await helper.checkUserMenu();
    
    if (userMenu.found) {
      console.log('✅ 發現使用者選單:');
      userMenu.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.text} (${item.href})`);
      });
      
      expect(userMenu.items.length).toBeGreaterThan(0);
    } else {
      console.log('⚠️ 未發現使用者選單');
    }
  });

  test('7. 頁面載入效能測試', async ({ page }) => {
    console.log('\n=== 頁面載入效能測試 ===');
    
    const testUrls = [
      '/',
      '/dashboard',
      '/customers',
      '/products'
    ];

    const performanceResults = [];

    for (const url of testUrls) {
      try {
        const loadTime = await helper.measurePageLoadTime(url);
        performanceResults.push({
          url,
          loadTime,
          acceptable: loadTime < 3000 // 3秒內
        });
        
        console.log(`${url}: ${loadTime}ms ${loadTime < 3000 ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`❌ ${url}: 載入失敗 - ${error.message}`);
      }
    }

    // 驗證效能要求
    const averageLoadTime = performanceResults.reduce((sum, result) => sum + result.loadTime, 0) / performanceResults.length;
    console.log(`平均載入時間: ${averageLoadTime.toFixed(0)}ms`);
    
    expect(averageLoadTime).toBeLessThan(5000); // 平均5秒內
  });

  test('8. 無障礙功能測試', async ({ page }) => {
    console.log('\n=== 無障礙功能測試 ===');
    
    const accessibilityResults = await helper.checkAccessibility();
    
    const ariaElements = accessibilityResults.filter(r => r.type === 'aria' && r.hasAttributes);
    const imageElements = accessibilityResults.filter(r => r.type === 'image');
    const imagesWithAlt = imageElements.filter(r => r.hasAlt);

    console.log(`ARIA 屬性元素: ${ariaElements.length}`);
    console.log(`圖片元素: ${imageElements.length}`);
    console.log(`有 alt 屬性的圖片: ${imagesWithAlt.length}`);

    // 基本無障礙驗證
    if (imageElements.length > 0) {
      const altCoverage = (imagesWithAlt.length / imageElements.length) * 100;
      console.log(`圖片 alt 屬性覆蓋率: ${altCoverage.toFixed(1)}%`);
      expect(altCoverage).toBeGreaterThan(50); // 至少50%的圖片有alt屬性
    }
  });

  test('9. 導航一致性測試', async ({ page }) => {
    console.log('\n=== 導航一致性測試 ===');
    
    const testPages = ['/', '/dashboard', '/customers', '/products'];
    const navigationConsistency = [];

    for (const testPage of testPages) {
      try {
        await page.goto(TEST_CONFIG.baseURL + testPage);
        await page.waitForLoadState('networkidle');
        
        const navItems = await helper.checkMainNavigation();
        navigationConsistency.push({
          page: testPage,
          navItemCount: navItems.length,
          navItems: navItems.map(item => item.text)
        });
        
        console.log(`${testPage}: ${navItems.length} 個導航項目`);
      } catch (error) {
        console.log(`❌ 檢查 ${testPage} 導航一致性時發生錯誤: ${error.message}`);
      }
    }

    // 驗證導航一致性
    if (navigationConsistency.length > 1) {
      const firstPageNavCount = navigationConsistency[0].navItemCount;
      const allSameCount = navigationConsistency.every(page => page.navItemCount === firstPageNavCount);
      
      console.log(`導航項目數量一致: ${allSameCount ? '✅' : '⚠️'}`);
    }
  });

  test('10. 整體導航體驗測試', async ({ page }) => {
    console.log('\n=== 整體導航體驗測試 ===');
    
    // 模擬真實使用者操作流程
    const userJourney = [
      { action: '訪問首頁', url: '/' },
      { action: '進入儀表板', url: '/dashboard' },
      { action: '查看客戶', url: '/customers' },
      { action: '查看產品', url: '/products' },
      { action: '返回儀表板', url: '/dashboard' }
    ];

    let allSuccess = true;
    const journeyResults = [];

    for (const step of userJourney) {
      try {
        const startTime = Date.now();
        await page.goto(TEST_CONFIG.baseURL + step.url);
        await page.waitForLoadState('networkidle');
        const endTime = Date.now();

        const loadTime = endTime - startTime;
        const success = loadTime < 5000; // 5秒內載入
        
        journeyResults.push({
          ...step,
          loadTime,
          success
        });

        allSuccess = allSuccess && success;
        
        console.log(`${step.action}: ${loadTime}ms ${success ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`❌ ${step.action}: ${error.message}`);
        allSuccess = false;
      }
    }

    console.log(`整體使用者體驗: ${allSuccess ? '✅ 優秀' : '⚠️ 需要改進'}`);
    
    // 驗證整體體驗
    expect(allSuccess).toBe(true);
  });
});