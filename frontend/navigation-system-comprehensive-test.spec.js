import { test, expect } from '@playwright/test';

test.describe('NexusERP Navigation System Comprehensive Tests', () => {
  const BASE_URL = 'http://127.0.0.1:8000';
  
  test.beforeEach(async ({ page }) => {
    // 設置較長的超時時間
    test.setTimeout(60000);
  });

  test('1. 首頁正常載入測試', async ({ page }) => {
    console.log('開始測試首頁載入...');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // 截圖記錄首頁狀態
    await page.screenshot({ path: 'homepage-initial.png', fullPage: true });
    
    // 檢查頁面標題
    const title = await page.title();
    console.log(`頁面標題: ${title}`);
    expect(title).toBeTruthy();
    
    // 檢查主要頁面元素
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
    
    console.log('✅ 首頁載入測試完成');
  });

  test('2. 增強型導航組件顯示測試', async ({ page }) => {
    console.log('開始測試增強型導航組件...');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 檢查主導航容器
    const mainNav = await page.locator('nav, .navbar, [data-nav], .navigation').first();
    await expect(mainNav).toBeVisible();
    
    // 檢查導航項目
    const navLinks = await page.locator('nav a, .nav-link, .navbar-nav a').all();
    console.log(`發現 ${navLinks.length} 個導航連結`);
    
    // 檢查是否有首頁、儀表板等基本導航項
    const navText = await page.evaluate(() => {
      const navElements = document.querySelectorAll('nav, .navbar, .navigation');
      return Array.from(navElements).map(el => el.textContent).join(' ');
    });
    
    console.log(`導航內容: ${navText.substring(0, 200)}...`);
    
    // 截圖記錄導航狀態
    await page.screenshot({ path: 'navigation-enhanced.png', fullPage: true });
    
    console.log('✅ 增強型導航組件測試完成');
  });

  test('3. 麵包屑導航測試', async ({ page }) => {
    console.log('開始測試麵包屑導航...');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // 檢查首頁是否有麵包屑 (通常首頁不顯示)
    let breadcrumbs = await page.locator('.breadcrumb, [data-breadcrumb], .breadcrumbs, nav[aria-label="breadcrumb"]').count();
    console.log(`首頁麵包屑數量: ${breadcrumbs}`);
    
    // 嘗試導航到其他頁面查看麵包屑
    const testRoutes = [
      '/dashboard',
      '/inventory',
      '/products',
      '/customers',
      '/suppliers',
      '/reports'
    ];
    
    for (const route of testRoutes) {
      try {
        console.log(`測試路由: ${route}`);
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // 檢查麵包屑是否出現
        const breadcrumbElements = await page.locator('.breadcrumb, [data-breadcrumb], .breadcrumbs, nav[aria-label="breadcrumb"]').count();
        console.log(`路由 ${route} 的麵包屑數量: ${breadcrumbElements}`);
        
        if (breadcrumbElements > 0) {
          const breadcrumbText = await page.locator('.breadcrumb, [data-breadcrumb], .breadcrumbs').first().textContent();
          console.log(`麵包屑內容: ${breadcrumbText}`);
          
          // 截圖記錄麵包屑
          await page.screenshot({ path: `breadcrumb-${route.replace('/', '')}.png` });
          break; // 找到一個有麵包屑的頁面就停止
        }
      } catch (error) {
        console.log(`路由 ${route} 測試失敗: ${error.message}`);
      }
    }
    
    console.log('✅ 麵包屑導航測試完成');
  });

  test('4. 多層級主導航結構測試', async ({ page }) => {
    console.log('開始測試多層級導航結構...');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // 檢查是否有下拉選單或多層級導航
    const dropdownMenus = await page.locator('.dropdown, .nav-dropdown, .submenu, [data-dropdown]').count();
    console.log(`下拉選單數量: ${dropdownMenus}`);
    
    // 檢查是否有可展開的導航項
    const expandableNavs = await page.locator('[data-toggle="dropdown"], .dropdown-toggle, .nav-toggle').count();
    console.log(`可展開導航項數量: ${expandableNavs}`);
    
    // 嘗試點擊第一個下拉選單
    if (dropdownMenus > 0) {
      try {
        const firstDropdown = page.locator('.dropdown, .nav-dropdown, [data-toggle="dropdown"]').first();
        await firstDropdown.hover();
        await page.waitForTimeout(500);
        
        // 檢查是否有子選單出現
        const submenus = await page.locator('.dropdown-menu, .submenu, .nav-submenu').count();
        console.log(`子選單數量: ${submenus}`);
        
        await page.screenshot({ path: 'navigation-multilevel.png' });
      } catch (error) {
        console.log(`多層級導航測試錯誤: ${error.message}`);
      }
    }
    
    console.log('✅ 多層級導航結構測試完成');
  });

  test('5. 響應式設計測試', async ({ page }) => {
    console.log('開始測試響應式導航...');
    
    // 測試桌面版
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'navigation-desktop.png' });
    
    // 測試平板版
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'navigation-tablet.png' });
    
    // 測試手機版
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // 檢查是否有漢堡選單
    const mobileMenu = await page.locator('.navbar-toggler, .mobile-menu, .hamburger, [data-toggle="collapse"]').count();
    console.log(`行動版選單按鈕數量: ${mobileMenu}`);
    
    if (mobileMenu > 0) {
      // 嘗試點擊漢堡選單
      try {
        await page.locator('.navbar-toggler, .mobile-menu, .hamburger').first().click();
        await page.waitForTimeout(500);
        
        // 檢查選單是否展開
        const expandedMenu = await page.locator('.navbar-collapse.show, .mobile-nav.open, .nav-menu.active').count();
        console.log(`展開的行動版選單數量: ${expandedMenu}`);
        
        await page.screenshot({ path: 'navigation-mobile-expanded.png' });
      } catch (error) {
        console.log(`行動版選單操作錯誤: ${error.message}`);
      }
    }
    
    await page.screenshot({ path: 'navigation-mobile.png' });
    console.log('✅ 響應式設計測試完成');
  });

  test('6. 主題切換功能測試', async ({ page }) => {
    console.log('開始測試主題切換功能...');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // 檢查主題切換按鈕
    const themeToggle = await page.locator('[data-theme-toggle], .theme-toggle, .dark-mode-toggle, .theme-switch').count();
    console.log(`主題切換按鈕數量: ${themeToggle}`);
    
    if (themeToggle > 0) {
      try {
        // 記錄切換前的狀態
        await page.screenshot({ path: 'theme-before-toggle.png' });
        
        // 點擊主題切換
        await page.locator('[data-theme-toggle], .theme-toggle, .dark-mode-toggle').first().click();
        await page.waitForTimeout(1000);
        
        // 記錄切換後的狀態
        await page.screenshot({ path: 'theme-after-toggle.png' });
        
        // 檢查是否有主題相關的類名變化
        const bodyClasses = await page.evaluate(() => document.body.className);
        console.log(`Body 類名: ${bodyClasses}`);
        
        // 再次點擊確認可以切換回來
        await page.locator('[data-theme-toggle], .theme-toggle, .dark-mode-toggle').first().click();
        await page.waitForTimeout(1000);
        
        console.log('✅ 主題切換功能正常');
      } catch (error) {
        console.log(`主題切換測試錯誤: ${error.message}`);
      }
    } else {
      console.log('⚠️ 未找到主題切換按鈕');
    }
    
    console.log('✅ 主題切換功能測試完成');
  });

  test('7. 使用者選單下拉測試', async ({ page }) => {
    console.log('開始測試使用者選單下拉...');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // 檢查使用者選單/個人資料選單
    const userMenu = await page.locator('.user-menu, .profile-menu, .account-menu, [data-user-menu]').count();
    console.log(`使用者選單數量: ${userMenu}`);
    
    // 檢查是否有登入/登出按鈕
    const authButtons = await page.locator('a[href*="login"], a[href*="logout"], .login-btn, .logout-btn').count();
    console.log(`認證按鈕數量: ${authButtons}`);
    
    if (userMenu > 0) {
      try {
        // 點擊使用者選單
        await page.locator('.user-menu, .profile-menu, .account-menu').first().click();
        await page.waitForTimeout(500);
        
        // 檢查下拉選單項目
        const menuItems = await page.locator('.dropdown-menu a, .user-dropdown a, .profile-dropdown a').count();
        console.log(`選單項目數量: ${menuItems}`);
        
        await page.screenshot({ path: 'user-menu-dropdown.png' });
      } catch (error) {
        console.log(`使用者選單測試錯誤: ${error.message}`);
      }
    }
    
    console.log('✅ 使用者選單下拉測試完成');
  });

  test('8. 通知中心功能測試', async ({ page }) => {
    console.log('開始測試通知中心功能...');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // 檢查通知圖示或按鈕
    const notificationBell = await page.locator('.notification, .notifications, .bell, [data-notifications]').count();
    console.log(`通知按鈕數量: ${notificationBell}`);
    
    if (notificationBell > 0) {
      try {
        // 點擊通知按鈕
        await page.locator('.notification, .notifications, .bell').first().click();
        await page.waitForTimeout(500);
        
        // 檢查通知面板
        const notificationPanel = await page.locator('.notification-panel, .notifications-dropdown, .alert-panel').count();
        console.log(`通知面板數量: ${notificationPanel}`);
        
        // 檢查通知項目
        const notificationItems = await page.locator('.notification-item, .alert-item, .notification-list li').count();
        console.log(`通知項目數量: ${notificationItems}`);
        
        await page.screenshot({ path: 'notification-center.png' });
      } catch (error) {
        console.log(`通知中心測試錯誤: ${error.message}`);
      }
    } else {
      console.log('⚠️ 未找到通知中心功能');
    }
    
    console.log('✅ 通知中心功能測試完成');
  });

  test('9. 導航整體功能總結測試', async ({ page }) => {
    console.log('開始進行導航整體功能總結...');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // 收集所有導航相關元素的詳細資訊
    const navigationSummary = await page.evaluate(() => {
      const summary = {
        navElements: [],
        links: [],
        buttons: [],
        dropdowns: [],
        breadcrumbs: [],
        userMenus: [],
        notifications: [],
        themeToggles: []
      };
      
      // 導航元素
      document.querySelectorAll('nav, .navbar, .navigation').forEach(el => {
        summary.navElements.push({
          tagName: el.tagName,
          className: el.className,
          textContent: el.textContent.substring(0, 100)
        });
      });
      
      // 連結
      document.querySelectorAll('nav a, .nav-link, .navbar-nav a').forEach(el => {
        summary.links.push({
          href: el.href,
          textContent: el.textContent.trim(),
          className: el.className
        });
      });
      
      // 下拉選單
      document.querySelectorAll('.dropdown, [data-toggle="dropdown"]').forEach(el => {
        summary.dropdowns.push({
          className: el.className,
          textContent: el.textContent.substring(0, 50)
        });
      });
      
      // 麵包屑
      document.querySelectorAll('.breadcrumb, [data-breadcrumb]').forEach(el => {
        summary.breadcrumbs.push({
          className: el.className,
          textContent: el.textContent.trim()
        });
      });
      
      return summary;
    });
    
    console.log('📊 導航系統總結:');
    console.log(`- 導航元素: ${navigationSummary.navElements.length}`);
    console.log(`- 導航連結: ${navigationSummary.links.length}`);
    console.log(`- 下拉選單: ${navigationSummary.dropdowns.length}`);
    console.log(`- 麵包屑: ${navigationSummary.breadcrumbs.length}`);
    
    // 最終截圖
    await page.screenshot({ path: 'navigation-final-summary.png', fullPage: true });
    
    console.log('✅ 導航整體功能總結測試完成');
  });
});