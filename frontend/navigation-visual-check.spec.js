const { test, expect } = require('@playwright/test');

test.describe('NexusERP 導航列視覺檢查', () => {
  test('檢查導航列設計和對齊', async ({ page }) => {
    console.log('🎯 開始 NexusERP 導航列視覺檢查...');

    // 設定較長的超時時間
    test.setTimeout(60000);

    try {
      // 步驟 1: 訪問首頁
      console.log('📍 步驟1: 訪問 NexusERP 首頁');
      await page.goto('http://127.0.0.1:8000', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // 等待頁面載入完成
      await page.waitForTimeout(2000);
      
      // 截圖首頁狀態
      await page.screenshot({ 
        path: 'navigation-check-01-homepage.png',
        fullPage: true 
      });
      console.log('📸 已截圖：首頁狀態');

      // 步驟 2: 執行登入
      console.log('📍 步驟2: 執行登入流程');
      
      // 檢查是否有登入表單
      const hasLoginForm = await page.locator('form').first().isVisible();
      if (hasLoginForm) {
        console.log('🔐 發現登入表單，執行登入...');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // 等待登入完成
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await page.waitForTimeout(2000);
      } else {
        console.log('✅ 已登入狀態，直接進入儀表板');
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForTimeout(3000);
      }

      // 步驟 3: 詳細檢查導航列
      console.log('📍 步驟3: 詳細分析導航列設計');

      // 截圖儀表板全頁面
      await page.screenshot({ 
        path: 'navigation-check-02-dashboard-full.png',
        fullPage: true 
      });
      console.log('📸 已截圖：儀表板全頁面');

      // 專門截圖導航區域
      const navElement = await page.locator('nav').first();
      if (await navElement.isVisible()) {
        await navElement.screenshot({ path: 'navigation-check-03-nav-area.png' });
        console.log('📸 已截圖：導航區域');
      }

      // 檢查導航列結構
      console.log('🔍 檢查導航列結構...');
      
      // 1. 檢查導航文字
      const navItems = await page.locator('nav a, nav button').allTextContents();
      console.log('📋 導航項目文字:', navItems);

      // 2. 檢查右側使用者資訊
      const userInfo = await page.locator('[x-data*="userDropdown"], .user-menu, .user-info').first();
      if (await userInfo.isVisible()) {
        console.log('👤 找到使用者資訊區域');
        await userInfo.screenshot({ path: 'navigation-check-04-user-area.png' });
      }

      // 3. 檢查主題切換按鈕
      const themeToggle = await page.locator('[x-data*="theme"], .theme-toggle, button[onclick*="theme"]').first();
      if (await themeToggle.isVisible()) {
        console.log('🎨 找到主題切換按鈕');
        await themeToggle.screenshot({ path: 'navigation-check-05-theme-toggle.png' });
      }

      // 步驟 4: 檢查響應式設計
      console.log('📍 步驟4: 檢查響應式設計');

      // 桌面版 (1920px)
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'navigation-check-06-desktop-1920.png',
        fullPage: false 
      });
      console.log('📸 已截圖：桌面版 1920px');

      // 中等桌面版 (1280px)  
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'navigation-check-07-desktop-1280.png',
        fullPage: false 
      });
      console.log('📸 已截圖：桌面版 1280px');

      // 平板版 (768px)
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'navigation-check-08-tablet-768.png',
        fullPage: false 
      });
      console.log('📸 已截圖：平板版 768px');

      // 手機版 (375px)
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'navigation-check-09-mobile-375.png',
        fullPage: false 
      });
      console.log('📸 已截圖：手機版 375px');

      // 步驟 5: 測試導航交互功能
      console.log('📍 步驟5: 測試導航交互功能');

      // 回到桌面尺寸進行交互測試
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);

      // 測試導航 hover 效果
      const navLinks = await page.locator('nav a').all();
      for (let i = 0; i < Math.min(navLinks.length, 6); i++) {
        const link = navLinks[i];
        const linkText = await link.textContent();
        console.log(`🎯 測試 hover: ${linkText}`);
        
        await link.hover();
        await page.waitForTimeout(500);
        await page.screenshot({ 
          path: `navigation-check-10-hover-${i+1}-${linkText?.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')}.png`,
          fullPage: false 
        });
      }

      // 步驟 6: 檢查樣式屬性
      console.log('📍 步驟6: 檢查樣式屬性');

      // 檢查導航容器樣式
      const navStyles = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        if (!nav) return null;
        
        const styles = window.getComputedStyle(nav);
        return {
          display: styles.display,
          position: styles.position,
          width: styles.width,
          height: styles.height,
          backgroundColor: styles.backgroundColor,
          padding: styles.padding,
          margin: styles.margin,
          alignItems: styles.alignItems,
          justifyContent: styles.justifyContent,
          flexDirection: styles.flexDirection
        };
      });

      console.log('🎨 導航容器樣式:', JSON.stringify(navStyles, null, 2));

      // 檢查導航項目樣式
      const navItemStyles = await page.evaluate(() => {
        const navItems = document.querySelectorAll('nav a, nav button');
        if (navItems.length === 0) return null;
        
        const firstItem = navItems[0];
        const styles = window.getComputedStyle(firstItem);
        return {
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          color: styles.color,
          padding: styles.padding,
          margin: styles.margin,
          textDecoration: styles.textDecoration,
          borderRadius: styles.borderRadius,
          backgroundColor: styles.backgroundColor
        };
      });

      console.log('📝 導航項目樣式:', JSON.stringify(navItemStyles, null, 2));

      // 最終截圖
      await page.screenshot({ 
        path: 'navigation-check-11-final-state.png',
        fullPage: true 
      });
      console.log('📸 已截圖：最終狀態');

      console.log('✅ NexusERP 導航列視覺檢查完成！');

    } catch (error) {
      console.error('❌ 導航列檢查過程發生錯誤:', error.message);
      
      // 錯誤時也截圖記錄
      await page.screenshot({ 
        path: 'navigation-check-error.png',
        fullPage: true 
      });
      
      throw error;
    }
  });
});