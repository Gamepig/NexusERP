const { test, expect } = require('@playwright/test');

test.describe('NexusERP 導航列詳細檢查', () => {
  test('檢查導航列實際狀況', async ({ page }) => {
    console.log('🎯 開始 NexusERP 導航列詳細檢查...');

    // 設定較長的超時時間
    test.setTimeout(90000);

    try {
      // 步驟 1: 訪問首頁並執行登入
      console.log('📍 步驟1: 訪問首頁並執行登入');
      await page.goto('http://127.0.0.1:8000');
      await page.waitForTimeout(2000);

      // 截圖登入頁面
      await page.screenshot({ 
        path: 'navigation-detail-01-login-page.png',
        fullPage: true 
      });

      // 執行登入
      console.log('🔐 填寫登入表單...');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      await page.screenshot({ 
        path: 'navigation-detail-02-login-filled.png',
        fullPage: true 
      });

      console.log('🚀 提交登入表單...');
      await page.click('button[type="submit"]');
      
      // 等待登入完成並導向儀表板
      try {
        await page.waitForURL('**/dashboard', { timeout: 15000 });
      } catch (error) {
        console.log('⚠️ 可能已在儀表板，檢查當前URL...');
        const currentUrl = page.url();
        console.log('🌐 當前URL:', currentUrl);
        if (!currentUrl.includes('dashboard')) {
          await page.goto('http://127.0.0.1:8000/dashboard');
        }
      }

      await page.waitForTimeout(3000);

      // 截圖儀表板狀態
      await page.screenshot({ 
        path: 'navigation-detail-03-dashboard-loaded.png',
        fullPage: true 
      });

      // 步驟 2: 詳細檢查導航列
      console.log('📍 步驟2: 檢查導航列結構');

      // 檢查導航容器是否存在
      const navContainers = await page.locator('nav, .nav, .navigation, [role="navigation"]').all();
      console.log(`🔍 找到 ${navContainers.length} 個導航容器`);

      if (navContainers.length > 0) {
        for (let i = 0; i < navContainers.length; i++) {
          const nav = navContainers[i];
          const isVisible = await nav.isVisible();
          console.log(`📋 導航容器 ${i+1}: 可見性 = ${isVisible}`);
          
          if (isVisible) {
            await nav.screenshot({ path: `navigation-detail-04-nav-${i+1}.png` });
            
            // 檢查導航項目
            const navItems = await nav.locator('a, button').all();
            console.log(`📝 導航容器 ${i+1} 包含 ${navItems.length} 個項目`);
            
            for (let j = 0; j < navItems.length; j++) {
              const item = navItems[j];
              const text = await item.textContent();
              const isVisible = await item.isVisible();
              console.log(`  - 項目 ${j+1}: "${text?.trim()}" (可見: ${isVisible})`);
            }
          }
        }
      }

      // 步驟 3: 檢查標頭區域
      console.log('📍 步驟3: 檢查標頭區域');

      const headerElements = await page.locator('header, .header, .top-nav, .navbar').all();
      console.log(`🔍 找到 ${headerElements.length} 個標頭元素`);

      if (headerElements.length > 0) {
        for (let i = 0; i < headerElements.length; i++) {
          const header = headerElements[i];
          const isVisible = await header.isVisible();
          console.log(`📋 標頭元素 ${i+1}: 可見性 = ${isVisible}`);
          
          if (isVisible) {
            await header.screenshot({ path: `navigation-detail-05-header-${i+1}.png` });
          }
        }
      }

      // 步驟 4: 檢查主題切換和使用者資訊
      console.log('📍 步驟4: 檢查主題切換和使用者資訊');

      // 檢查主題切換按鈕
      const themeButtons = await page.locator('[x-data*="theme"], .theme-toggle, button[onclick*="theme"], [data-theme]').all();
      console.log(`🎨 找到 ${themeButtons.length} 個主題相關元素`);

      for (let i = 0; i < themeButtons.length; i++) {
        const btn = themeButtons[i];
        const isVisible = await btn.isVisible();
        if (isVisible) {
          console.log(`🎨 主題按鈕 ${i+1}: 可見`);
          await btn.screenshot({ path: `navigation-detail-06-theme-${i+1}.png` });
        }
      }

      // 檢查使用者資訊
      const userElements = await page.locator('[x-data*="user"], .user-menu, .user-info, .user-dropdown').all();
      console.log(`👤 找到 ${userElements.length} 個使用者相關元素`);

      for (let i = 0; i < userElements.length; i++) {
        const elem = userElements[i];
        const isVisible = await elem.isVisible();
        if (isVisible) {
          console.log(`👤 使用者元素 ${i+1}: 可見`);
          await elem.screenshot({ path: `navigation-detail-07-user-${i+1}.png` });
        }
      }

      // 步驟 5: 檢查整個頁面結構
      console.log('📍 步驟5: 分析頁面結構');

      const pageStructure = await page.evaluate(() => {
        const structure = {
          nav: [],
          header: [],
          main: [],
          aside: [],
          other: []
        };

        // 檢查 nav 元素
        document.querySelectorAll('nav').forEach((nav, i) => {
          structure.nav.push({
            index: i,
            visible: !nav.hidden && nav.offsetWidth > 0 && nav.offsetHeight > 0,
            classes: nav.className,
            id: nav.id,
            innerHTML: nav.innerHTML.substring(0, 200) + '...'
          });
        });

        // 檢查 header 元素
        document.querySelectorAll('header').forEach((header, i) => {
          structure.header.push({
            index: i,
            visible: !header.hidden && header.offsetWidth > 0 && header.offsetHeight > 0,
            classes: header.className,
            id: header.id,
            innerHTML: header.innerHTML.substring(0, 200) + '...'
          });
        });

        return structure;
      });

      console.log('🏗️ 頁面結構分析:', JSON.stringify(pageStructure, null, 2));

      // 步驟 6: 響應式測試
      console.log('📍 步驟6: 響應式測試');

      const viewports = [
        { name: 'Desktop-1920', width: 1920, height: 1080 },
        { name: 'Desktop-1280', width: 1280, height: 800 },
        { name: 'Tablet-768', width: 768, height: 1024 },
        { name: 'Mobile-375', width: 375, height: 667 }
      ];

      for (const viewport of viewports) {
        console.log(`📱 測試 ${viewport.name} 尺寸...`);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: `navigation-detail-08-${viewport.name}.png`,
          fullPage: false 
        });
      }

      // 最終總結截圖
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'navigation-detail-09-final-summary.png',
        fullPage: true 
      });

      console.log('✅ NexusERP 導航列詳細檢查完成！');

    } catch (error) {
      console.error('❌ 檢查過程發生錯誤:', error.message);
      
      // 錯誤時也截圖記錄
      await page.screenshot({ 
        path: 'navigation-detail-error.png',
        fullPage: true 
      });
      
      // 記錄當前 URL 和頁面標題
      console.log('🌐 錯誤時的 URL:', page.url());
      const title = await page.title();
      console.log('📄 錯誤時的頁面標題:', title);
    }
  });
});