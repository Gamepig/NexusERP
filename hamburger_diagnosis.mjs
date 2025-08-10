// Playwright 漢堡選單診斷腳本
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
    
    // 2. 登入
    console.log('🔐 進行登入...');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 檢查是否成功登入
    const isLoggedIn = await page.evaluate(() => {
      return !window.location.href.includes('login');
    });
    
    if (!isLoggedIn) {
      console.log('❌ 登入失敗，檢查登入頁面元素...');
      const currentUrl = await page.url();
      console.log('當前 URL:', currentUrl);
      return;
    }
    
    console.log('✅ 成功登入');
    
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
          zIndex: computed.zIndex
        };
      });
      
      console.log('按鈕樣式:', buttonStyles);
      
      // 嘗試點擊按鈕
      if (isVisible && isEnabled) {
        console.log('🖱️ 嘗試點擊漢堡選單按鈕...');
        await hamburgerButton.click();
        
        // 等待一下讓動畫完成
        await page.waitForTimeout(500);
        
        // 檢查手機版選單是否出現
        const mobileMenu = await page.locator('#mobile-menu');
        const menuVisible = await mobileMenu.isVisible();
        
        console.log('手機版選單出現:', menuVisible);
      }
    } else {
      console.log('❌ 漢堡選單按鈕未找到');
      
      // 檢查頁面結構
      const pageStructure = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        if (nav) {
          return {
            navHTML: nav.outerHTML.substring(0, 500) + '...',
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
        components: window.Alpine ? Object.keys(window.Alpine.store || {}) : []
      };
    });
    
    console.log('Alpine.js 狀態:', alpineStatus);
    
    // 5. 檢查所有可能的選單按鈕
    console.log('🔍 搜尋所有可能的選單按鈕...');
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      return buttons.map(btn => ({
        tagName: btn.tagName,
        className: btn.className,
        id: btn.id,
        text: btn.textContent.trim(),
        visible: btn.offsetParent !== null
      })).filter(btn => 
        btn.className.includes('menu') || 
        btn.className.includes('mobile') || 
        btn.text.includes('☰') ||
        btn.text.includes('≡')
      );
    });
    
    console.log('找到的選單相關按鈕:', allButtons);
    
    // 6. 檢查導航列結構
    console.log('🧭 檢查導航列結構...');
    const navStructure = await page.evaluate(() => {
      const navElement = document.querySelector('nav');
      if (navElement) {
        const buttons = Array.from(navElement.querySelectorAll('button'));
        return {
          navClasses: navElement.className,
          buttonCount: buttons.length,
          buttons: buttons.map(btn => ({
            classes: btn.className,
            text: btn.textContent.trim(),
            visible: btn.offsetParent !== null,
            computed: window.getComputedStyle(btn).display
          }))
        };
      }
      return null;
    });
    
    console.log('導航結構:', navStructure);
    
  } catch (error) {
    console.error('診斷過程中發生錯誤:', error);
  } finally {
    await browser.close();
  }
})();