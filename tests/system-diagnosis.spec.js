// NexusERP 系統性問題診斷測試
// 生成日期: 2025-08-06
import { test, expect } from '@playwright/test';

test.describe('NexusERP 系統診斷', () => {
  
  test.beforeEach(async ({ page }) => {
    // 設定基本配置
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 監聽控制台錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    // 監聽請求失敗
    page.on('requestfailed', request => {
      console.log(`🔴 Request Failed: ${request.url()}`);
    });
  });

  test('階段一：首頁主題系統診斷', async ({ page }) => {
    console.log('\n🔍 === 階段一：首頁主題系統診斷 ===');
    
    // 訪問首頁
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 1. 檢查頁面基本載入
    const title = await page.title();
    console.log(`✅ 頁面標題: ${title}`);
    
    // 2. 檢查主題切換按鈕存在性
    const themeToggle = page.locator('[data-theme-toggle], .theme-toggle, button:has-text("🌙"), button:has-text("☀️")');
    const themeToggleCount = await themeToggle.count();
    console.log(`🎨 主題切換按鈕數量: ${themeToggleCount}`);
    
    if (themeToggleCount > 0) {
      const isVisible = await themeToggle.first().isVisible();
      console.log(`🎨 主題切換按鈕可見: ${isVisible}`);
      
      // 截圖主題按鈕區域
      await themeToggle.first().screenshot({ path: 'debug/P1_4_navigation_fixes/theme-button.png' });
    }
    
    // 3. 檢查 CSS 變數載入
    const bodyElement = page.locator('body');
    const computedStyles = await bodyElement.evaluate((el) => {
      const styles = getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        cssVarPrimary: styles.getPropertyValue('--color-primary'),
        cssVarBackground: styles.getPropertyValue('--color-background'),
        cssVarText: styles.getPropertyValue('--color-text')
      };
    });
    
    console.log('🎨 CSS 樣式檢查:');
    console.log(`   背景色: ${computedStyles.backgroundColor}`);
    console.log(`   文字色: ${computedStyles.color}`);
    console.log(`   主要色變數: ${computedStyles.cssVarPrimary}`);
    console.log(`   背景變數: ${computedStyles.cssVarBackground}`);
    console.log(`   文字變數: ${computedStyles.cssVarText}`);
    
    // 4. 檢查 Vite 資產載入
    const stylesheets = await page.$$eval('link[rel="stylesheet"]', links => 
      links.map(link => ({
        href: link.href,
        loaded: link.sheet !== null
      }))
    );
    
    console.log('📦 樣式表載入狀態:');
    stylesheets.forEach((sheet, index) => {
      console.log(`   ${index + 1}. ${sheet.href} - ${sheet.loaded ? '✅ 已載入' : '❌ 載入失敗'}`);
    });
    
    // 5. 檢查 Alpine.js 狀態
    const alpineLoaded = await page.evaluate(() => {
      return typeof window.Alpine !== 'undefined';
    });
    console.log(`⚡ Alpine.js 載入: ${alpineLoaded ? '✅ 已載入' : '❌ 未載入'}`);
    
    // 截圖首頁全屏
    await page.screenshot({ path: 'debug/P1_4_navigation_fixes/homepage-full.png', fullPage: true });
  });

  test('階段二：登入後主題狀態檢查', async ({ page }) => {
    console.log('\n🔍 === 階段二：登入後主題狀態檢查 ===');
    
    // 訪問登入頁
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 執行登入
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 檢查是否成功登入 (URL 變化或 Dashboard 元素)
    const currentUrl = page.url();
    console.log(`🔐 登入後 URL: ${currentUrl}`);
    
    // 檢查 Dashboard 主題狀態
    const dashboardElement = page.locator('main, .dashboard, [class*="dashboard"]').first();
    if (await dashboardElement.count() > 0) {
      const dashboardStyles = await dashboardElement.evaluate((el) => {
        const styles = getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          themeClass: el.className
        };
      });
      
      console.log('🏠 Dashboard 主題狀態:');
      console.log(`   背景色: ${dashboardStyles.backgroundColor}`);
      console.log(`   文字色: ${dashboardStyles.color}`);
      console.log(`   CSS 類: ${dashboardStyles.themeClass}`);
    }
    
    // 測試導航到報表中心 (已知正常的頁面)
    const reportsLink = page.locator('a[href*="reports"], a:has-text("報表"), a:has-text("報告")');
    if (await reportsLink.count() > 0) {
      await reportsLink.first().click();
      await page.waitForLoadState('networkidle');
      
      console.log(`📊 報表中心 URL: ${page.url()}`);
      
      // 檢查報表中心主題
      const reportsStyles = await page.locator('body').evaluate((el) => {
        const styles = getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color
        };
      });
      
      console.log('📊 報表中心主題狀態:');
      console.log(`   背景色: ${reportsStyles.backgroundColor}`);
      console.log(`   文字色: ${reportsStyles.color}`);
      
      // 截圖報表中心
      await page.screenshot({ path: 'debug/P1_4_navigation_fixes/reports-center.png' });
    }
    
    // 截圖登入後狀態
    await page.screenshot({ path: 'debug/P1_4_navigation_fixes/dashboard-logged-in.png' });
  });

  test('階段三：響應式導航深度診斷', async ({ page }) => {
    console.log('\n🔍 === 階段三：響應式導航深度診斷 ===');
    
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      console.log(`\n📱 測試 ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://127.0.0.1:8000');
      await page.waitForLoadState('networkidle');
      
      // 檢查主導航元素
      const navbar = page.locator('nav, .navbar, header nav').first();
      const navbarExists = await navbar.count() > 0;
      console.log(`📍 主導航存在: ${navbarExists}`);
      
      if (navbarExists) {
        const navbarVisible = await navbar.isVisible();
        const navbarStyles = await navbar.evaluate((el) => {
          const styles = getComputedStyle(el);
          return {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity
          };
        });
        
        console.log(`📍 主導航可見: ${navbarVisible}`);
        console.log(`📍 導航樣式: display=${navbarStyles.display}, visibility=${navbarStyles.visibility}, opacity=${navbarStyles.opacity}`);
      }
      
      // 檢查漢堡選單 (移動端)
      if (viewport.width <= 768) {
        const hamburger = page.locator('.hamburger, .menu-toggle, button[aria-label*="menu"], [data-mobile-menu]');
        const hamburgerCount = await hamburger.count();
        console.log(`🍔 漢堡選單數量: ${hamburgerCount}`);
        
        if (hamburgerCount > 0) {
          const hamburgerVisible = await hamburger.first().isVisible();
          console.log(`🍔 漢堡選單可見: ${hamburgerVisible}`);
        }
      }
      
      // 檢查導航項目
      const navItems = page.locator('nav a, .nav-link');
      const navItemsCount = await navItems.count();
      console.log(`📋 導航項目數量: ${navItemsCount}`);
      
      // 截圖每種視窗大小
      await page.screenshot({ 
        path: `debug/P1_4_navigation_fixes/navigation-${viewport.name.toLowerCase()}.png` 
      });
    }
  });

  test('階段四：JavaScript 互動診斷', async ({ page }) => {
    console.log('\n🔍 === 階段四：JavaScript 互動診斷 ===');
    
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 1. 檢查 Alpine.js 互動元素
    const alpineElements = await page.$$eval('[x-data], [x-show], [x-if]', elements => 
      elements.map(el => ({
        tag: el.tagName,
        attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' '),
        visible: el.offsetParent !== null
      }))
    );
    
    console.log('⚡ Alpine.js 元素檢查:');
    alpineElements.forEach((element, index) => {
      console.log(`   ${index + 1}. <${element.tag}> ${element.attributes} - ${element.visible ? '✅ 可見' : '❌ 隱藏'}`);
    });
    
    // 2. 測試主題切換功能
    const themeToggle = page.locator('[data-theme-toggle], .theme-toggle, button:has-text("🌙"), button:has-text("☀️")').first();
    if (await themeToggle.count() > 0) {
      console.log('🎨 測試主題切換功能...');
      
      // 記錄切換前的主題
      const beforeTheme = await page.locator('html').getAttribute('data-theme') || 
                         await page.locator('body').getAttribute('class');
      console.log(`🎨 切換前主題: ${beforeTheme}`);
      
      // 點擊主題切換
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // 記錄切換後的主題
      const afterTheme = await page.locator('html').getAttribute('data-theme') || 
                        await page.locator('body').getAttribute('class');
      console.log(`🎨 切換後主題: ${afterTheme}`);
      
      const themeChanged = beforeTheme !== afterTheme;
      console.log(`🎨 主題切換功能: ${themeChanged ? '✅ 正常' : '❌ 異常'}`);
      
      // 截圖主題切換後
      await page.screenshot({ path: 'debug/P1_4_navigation_fixes/theme-switched.png' });
    }
    
    // 3. 測試錨點滾動功能
    const anchorLinks = page.locator('a[href^="#"]');
    const anchorCount = await anchorLinks.count();
    console.log(`⚓ 錨點連結數量: ${anchorCount}`);
    
    if (anchorCount > 0) {
      const firstAnchor = anchorLinks.first();
      const anchorHref = await firstAnchor.getAttribute('href');
      console.log(`⚓ 測試錨點: ${anchorHref}`);
      
      // 記錄滾動前位置
      const beforeScroll = await page.evaluate(() => window.scrollY);
      
      // 點擊錨點
      await firstAnchor.click();
      await page.waitForTimeout(1000);
      
      // 記錄滾動後位置
      const afterScroll = await page.evaluate(() => window.scrollY);
      
      const scrolled = Math.abs(afterScroll - beforeScroll) > 10;
      console.log(`⚓ 錨點滾動: ${scrolled ? '✅ 正常' : '❌ 異常'} (${beforeScroll} → ${afterScroll})`);
    }
    
    // 4. 檢查下拉選單功能
    const dropdowns = page.locator('.dropdown, [data-dropdown], .nav-item.dropdown');
    const dropdownCount = await dropdowns.count();
    console.log(`📋 下拉選單數量: ${dropdownCount}`);
    
    if (dropdownCount > 0) {
      const firstDropdown = dropdowns.first();
      const dropdownToggle = firstDropdown.locator('button, a[data-toggle], .dropdown-toggle');
      
      if (await dropdownToggle.count() > 0) {
        // 點擊下拉選單
        await dropdownToggle.click();
        await page.waitForTimeout(300);
        
        // 檢查下拉選單是否展開
        const dropdownMenu = firstDropdown.locator('.dropdown-menu, [data-dropdown-menu]');
        const menuVisible = await dropdownMenu.isVisible();
        console.log(`📋 下拉選單展開: ${menuVisible ? '✅ 正常' : '❌ 異常'}`);
        
        // 截圖下拉選單展開狀態
        await page.screenshot({ path: 'debug/P1_4_navigation_fixes/dropdown-expanded.png' });
      }
    }
  });
});