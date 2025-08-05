const { test, expect } = require('@playwright/test');

test.describe('NexusERP 儀表板導航列檢查', () => {
  test('檢查儀表板導航列實際狀況', async ({ page }) => {
    console.log('🎯 開始檢查 NexusERP 儀表板導航列...');

    test.setTimeout(60000);

    try {
      // 步驟 1: 直接訪問儀表板（假設自動登入）
      console.log('📍 步驟1: 訪問儀表板');
      await page.goto('http://127.0.0.1:8000/dashboard', { 
        waitUntil: 'domcontentloaded',
        timeout: 20000 
      });
      
      await page.waitForTimeout(3000);
      
      // 如果需要登入，執行登入流程
      const currentUrl = page.url();
      console.log('🌐 當前 URL:', currentUrl);
      
      if (currentUrl.includes('login') || !currentUrl.includes('dashboard')) {
        console.log('🔐 需要登入，執行登入流程...');
        
        // 點擊登入按鈕
        const loginButton = await page.locator('a[href*="login"], button:has-text("登入")').first();
        if (await loginButton.isVisible()) {
          await loginButton.click();
          await page.waitForTimeout(2000);
        }
        
        // 截圖登入頁面
        await page.screenshot({ 
          path: 'dashboard-nav-01-login-page.png',
          fullPage: true 
        });
        
        // 如果有測試帳號提示，點擊使用
        const testAccountHint = await page.locator('text=測試者可以使用測試帳號登入').first();
        if (await testAccountHint.isVisible()) {
          console.log('📋 發現測試帳號提示');
          // 通常測試帳號會自動填入，直接提交
          const submitButton = await page.locator('button[type="submit"], button:has-text("LOG IN")').first();
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(3000);
          }
        } else {
          // 手動填入登入資訊
          await page.fill('input[name="email"]', 'test@example.com');
          await page.fill('input[name="password"]', 'password123');
          await page.click('button[type="submit"]');
          await page.waitForTimeout(3000);
        }
        
        // 等待導向儀表板
        try {
          await page.waitForURL('**/dashboard', { timeout: 10000 });
        } catch (error) {
          console.log('⚠️ 直接訪問儀表板...');
          await page.goto('http://127.0.0.1:8000/dashboard');
          await page.waitForTimeout(3000);
        }
      }

      // 截圖儀表板完整頁面
      await page.screenshot({ 
        path: 'dashboard-nav-02-dashboard-full.png',
        fullPage: true 
      });
      console.log('📸 已截圖：儀表板完整頁面');

      // 步驟 2: 專門檢查導航列區域
      console.log('📍 步驟2: 檢查導航列區域');

      // 檢查頂部導航列
      const topNavs = await page.locator('nav, .navbar, .navigation, header nav, .header-nav').all();
      console.log(`🔍 找到 ${topNavs.length} 個導航區域`);

      for (let i = 0; i < topNavs.length; i++) {
        const nav = topNavs[i];
        const isVisible = await nav.isVisible();
        
        if (isVisible) {
          console.log(`📋 導航區域 ${i+1}: 可見`);
          await nav.screenshot({ 
            path: `dashboard-nav-03-nav-area-${i+1}.png` 
          });
          
          // 檢查導航項目
          const navItems = await nav.locator('a, button').allTextContents();
          console.log(`📝 導航項目:`, navItems);
        }
      }

      // 步驟 3: 檢查右側功能區（主題切換、使用者資訊）
      console.log('📍 步驟3: 檢查右側功能區');

      // 尋找主題切換按鈕
      const themeElements = await page.locator(
        '[x-data*="theme"], [data-theme], .theme-toggle, button:has-text("主題"), button:has-text("theme")'
      ).all();
      
      console.log(`🎨 找到 ${themeElements.length} 個主題相關元素`);
      
      for (let i = 0; i < themeElements.length; i++) {
        const elem = themeElements[i];
        if (await elem.isVisible()) {
          await elem.screenshot({ path: `dashboard-nav-04-theme-${i+1}.png` });
          console.log(`🎨 主題元素 ${i+1}: 已截圖`);
        }
      }

      // 尋找使用者資訊區域  
      const userElements = await page.locator(
        '[x-data*="user"], .user-menu, .user-info, .user-dropdown, [data-user]'
      ).all();
      
      console.log(`👤 找到 ${userElements.length} 個使用者相關元素`);
      
      for (let i = 0; i < userElements.length; i++) {
        const elem = userElements[i];
        if (await elem.isVisible()) {
          await elem.screenshot({ path: `dashboard-nav-05-user-${i+1}.png` });
          console.log(`👤 使用者元素 ${i+1}: 已截圖`);
        }
      }

      // 步驟 4: 檢查導航列對齊和佈局
      console.log('📍 步驟4: 檢查導航列佈局');

      const layoutInfo = await page.evaluate(() => {
        const result = {
          navigation: [],
          header: [],
          rightSide: []
        };

        // 檢查導航元素
        document.querySelectorAll('nav, .navbar, .navigation').forEach((nav, i) => {
          const rect = nav.getBoundingClientRect();
          const styles = window.getComputedStyle(nav);
          
          result.navigation.push({
            index: i,
            visible: rect.width > 0 && rect.height > 0,
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            },
            styles: {
              display: styles.display,
              justifyContent: styles.justifyContent,
              alignItems: styles.alignItems,
              padding: styles.padding,
              backgroundColor: styles.backgroundColor
            }
          });
        });

        // 檢查右側元素（主題切換、使用者資訊）
        const rightElements = document.querySelectorAll(
          '[x-data*="theme"], [x-data*="user"], .theme-toggle, .user-menu'
        );
        
        rightElements.forEach((elem, i) => {
          const rect = elem.getBoundingClientRect();
          result.rightSide.push({
            index: i,
            className: elem.className,
            position: {
              top: rect.top,
              right: window.innerWidth - rect.right,
              width: rect.width,
              height: rect.height
            }
          });
        });

        return result;
      });

      console.log('🏗️ 導航佈局資訊:', JSON.stringify(layoutInfo, null, 2));

      // 步驟 5: 響應式測試
      console.log('📍 步驟5: 響應式測試');

      const viewports = [
        { name: 'Desktop-1920', width: 1920, height: 1080 },
        { name: 'Desktop-1280', width: 1280, height: 800 },
        { name: 'Tablet-768', width: 768, height: 1024 },
        { name: 'Mobile-375', width: 375, height: 667 }
      ];

      for (const viewport of viewports) {
        console.log(`📱 測試 ${viewport.name}...`);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(1500);
        
        await page.screenshot({ 
          path: `dashboard-nav-06-responsive-${viewport.name}.png`,
          fullPage: false 
        });
      }

      // 步驟 6: 測試導航交互
      console.log('📍 步驟6: 測試導航交互');

      // 回到桌面版本進行交互測試
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);

      // 嘗試 hover 導航項目
      const interactiveNavs = await page.locator('nav a, nav button').all();
      
      for (let i = 0; i < Math.min(interactiveNavs.length, 5); i++) {
        const nav = interactiveNavs[i];
        const text = await nav.textContent();
        
        if (text && text.trim()) {
          console.log(`🎯 測試 hover: ${text.trim()}`);
          await nav.hover();
          await page.waitForTimeout(500);
          
          await page.screenshot({ 
            path: `dashboard-nav-07-hover-${i+1}-${text.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')}.png`,
            fullPage: false 
          });
        }
      }

      // 最終總結截圖
      await page.screenshot({ 
        path: 'dashboard-nav-08-final-summary.png',
        fullPage: true 
      });

      console.log('✅ NexusERP 儀表板導航列檢查完成！');

    } catch (error) {
      console.error('❌ 檢查過程發生錯誤:', error.message);
      
      await page.screenshot({ 
        path: 'dashboard-nav-error.png',
        fullPage: true 
      });
      
      console.log('🌐 錯誤時的 URL:', page.url());
    }
  });
});