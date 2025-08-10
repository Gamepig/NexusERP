// Playwright 漢堡選單診斷腳本 - Debug 版本
import { chromium } from 'playwright';

(async () => {
  console.log('🔍 開始漢堡選單診斷...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 } // iPhone 8 尺寸
  });
  const page = await context.newPage();

  try {
    // 1. 導航到網站
    console.log('📱 設定手機版視口並導航到網站...');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 檢查當前頁面狀態
    const currentUrl = await page.url();
    const title = await page.title();
    console.log('當前 URL:', currentUrl);
    console.log('頁面標題:', title);
    
    // 檢查頁面內容
    const pageContent = await page.evaluate(() => {
      return {
        hasLoginForm: !!document.querySelector('form[method="POST"]'),
        hasEmailInput: !!document.querySelector('input[name="email"]'),
        hasPasswordInput: !!document.querySelector('input[name="password"]'),
        loginFormHTML: document.querySelector('form') ? document.querySelector('form').outerHTML.substring(0, 300) : 'No form found',
        bodyContent: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('頁面內容分析:', pageContent);
    
    // 如果不在登入頁面，檢查是否已經登入
    if (!currentUrl.includes('login')) {
      console.log('✅ 似乎已經登入或重定向，直接檢查漢堡選單');
    } else {
      // 2. 如果是登入頁面，進行登入
      console.log('🔐 檢測到登入頁面，進行登入...');
      
      if (pageContent.hasEmailInput) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        const postLoginUrl = await page.url();
        console.log('登入後 URL:', postLoginUrl);
      } else {
        console.log('❌ 未找到登入表單元素');
      }
    }
    
    // 3. 檢查漢堡選單按鈕
    console.log('🍔 檢查漢堡選單按鈕...');
    
    const hamburgerButton = await page.locator('.nexus-mobile-menu-trigger');
    const exists = await hamburgerButton.count() > 0;
    
    console.log('按鈕存在:', exists);
    
    if (exists) {
      const isVisible = await hamburgerButton.isVisible();
      const isEnabled = await hamburgerButton.isEnabled();
      
      console.log('按鈕可見:', isVisible);
      console.log('按鈕啟用:', isEnabled);
      
      // 檢查按鈕樣式
      const buttonStyles = await hamburgerButton.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          position: computed.position,
          zIndex: computed.zIndex,
          width: computed.width,
          height: computed.height
        };
      });
      
      console.log('按鈕樣式:', buttonStyles);
      
      // 嘗試點擊按鈕
      if (isVisible && isEnabled) {
        console.log('🖱️ 嘗試點擊漢堡選單按鈕...');
        await hamburgerButton.click();
        
        // 等待一下讓動畫完成
        await page.waitForTimeout(1000);
        
        // 檢查手機版選單是否出現
        const mobileMenu = await page.locator('#mobile-menu');
        const menuVisible = await mobileMenu.isVisible();
        
        console.log('手機版選單出現:', menuVisible);
        
        if (menuVisible) {
          const menuContent = await mobileMenu.evaluate(el => ({
            innerHTML: el.innerHTML.substring(0, 200),
            classes: el.className
          }));
          console.log('選單內容預覽:', menuContent);
        }
      }
    } else {
      console.log('❌ 漢堡選單按鈕未找到');
      
      // 檢查頁面結構
      const pageStructure = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        if (nav) {
          return {
            navHTML: nav.outerHTML.substring(0, 800) + '...',
            hasAlpine: !!window.Alpine,
            alpineVersion: window.Alpine ? window.Alpine.version : null
          };
        }
        return { message: '未找到 nav 元素' };
      });
      
      console.log('頁面結構:', pageStructure);
    }
    
    // 4. 檢查 Alpine.js
    console.log('🔧 檢查 Alpine.js 狀態...');
    const alpineStatus = await page.evaluate(() => {
      return {
        loaded: !!window.Alpine,
        version: window.Alpine ? window.Alpine.version : null,
        data: window.Alpine ? window.Alpine.data : null
      };
    });
    
    console.log('Alpine.js 狀態:', alpineStatus);
    
    // 5. 搜尋所有按鈕
    console.log('🔍 搜尋所有按鈕元素...');
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], .btn'));
      return buttons.map((btn, index) => ({
        index,
        tagName: btn.tagName,
        className: btn.className,
        id: btn.id,
        text: btn.textContent.trim().substring(0, 50),
        visible: btn.offsetParent !== null,
        hasMenuKeyword: btn.className.includes('menu') || btn.textContent.includes('menu')
      }));
    });
    
    console.log('找到的按鈕:', allButtons);
    
  } catch (error) {
    console.error('診斷過程中發生錯誤:', error);
  } finally {
    await browser.close();
  }
})();