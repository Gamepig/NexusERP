// Playwright 完整流程漢堡選單診斷腳本
import { chromium } from 'playwright';

(async () => {
  console.log('🔍 開始完整流程漢堡選單診斷...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 } // iPhone 8 尺寸
  });
  const page = await context.newPage();

  try {
    // 1. 直接導航到登入頁面
    console.log('🔐 直接導航到登入頁面...');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 檢查登入頁面
    const loginPageContent = await page.evaluate(() => {
      return {
        hasEmailInput: !!document.querySelector('input[name="email"]'),
        hasPasswordInput: !!document.querySelector('input[name="password"]'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        title: document.title,
        url: window.location.href
      };
    });
    
    console.log('登入頁面狀態:', loginPageContent);
    
    if (loginPageContent.hasEmailInput) {
      // 2. 執行登入
      console.log('📝 填寫登入表單...');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // 等待重定向
      await page.waitForLoadState('networkidle');
      
      const postLoginUrl = await page.url();
      const postLoginTitle = await page.title();
      console.log('登入後 URL:', postLoginUrl);
      console.log('登入後標題:', postLoginTitle);
      
      // 如果登入失敗，檢查錯誤訊息
      if (postLoginUrl.includes('login')) {
        const errorMessages = await page.evaluate(() => {
          const errors = Array.from(document.querySelectorAll('.alert, .error, .invalid-feedback'));
          return errors.map(el => el.textContent.trim());
        });
        console.log('❌ 登入失敗，錯誤訊息:', errorMessages);
        return;
      }
      
      console.log('✅ 登入成功');
      
      // 3. 現在檢查後台頁面的漢堡選單
      console.log('🍔 檢查後台頁面的漢堡選單按鈕...');
      
      // 檢查多種可能的選擇器
      const menuSelectors = [
        '.nexus-mobile-menu-trigger',
        '.mobile-menu-trigger',
        '.hamburger-menu',
        '.menu-toggle',
        '[data-toggle="mobile-menu"]',
        'button[aria-label*="menu"]',
        '.navbar-toggler'
      ];
      
      let foundButton = null;
      let foundSelector = null;
      
      for (const selector of menuSelectors) {
        const button = await page.locator(selector);
        const count = await button.count();
        if (count > 0) {
          foundButton = button;
          foundSelector = selector;
          console.log(`✅ 找到選單按鈕，選擇器: ${selector}`);
          break;
        }
      }
      
      if (foundButton) {
        const isVisible = await foundButton.isVisible();
        const isEnabled = await foundButton.isEnabled();
        
        console.log('按鈕可見:', isVisible);
        console.log('按鈕啟用:', isEnabled);
        
        // 檢查按鈕樣式
        const buttonStyles = await foundButton.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            position: computed.position,
            zIndex: computed.zIndex,
            width: computed.width,
            height: computed.height,
            transform: computed.transform
          };
        });
        
        console.log('按鈕樣式:', buttonStyles);
        
        // 檢查按鈕內容
        const buttonContent = await foundButton.evaluate(el => ({
          innerHTML: el.innerHTML,
          classes: el.className,
          attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`),
          parentClasses: el.parentElement ? el.parentElement.className : null
        }));
        
        console.log('按鈕內容:', buttonContent);
        
        // 嘗試點擊按鈕
        if (isVisible && isEnabled) {
          console.log('🖱️ 嘗試點擊漢堡選單按鈕...');
          await foundButton.click();
          
          // 等待一下讓動畫完成
          await page.waitForTimeout(1000);
          
          // 檢查各種可能的手機版選單
          const mobileMenuSelectors = [
            '#mobile-menu',
            '.mobile-menu',
            '.mobile-nav',
            '.navbar-collapse',
            '[x-show="mobileMenuOpen"]',
            '[style*="display: block"]'
          ];
          
          let menuFound = false;
          for (const menuSelector of mobileMenuSelectors) {
            const menu = await page.locator(menuSelector);
            const menuCount = await menu.count();
            if (menuCount > 0) {
              const menuVisible = await menu.isVisible();
              console.log(`選單 ${menuSelector} 存在:`, menuCount, '可見:', menuVisible);
              
              if (menuVisible) {
                menuFound = true;
                const menuContent = await menu.evaluate(el => ({
                  innerHTML: el.innerHTML.substring(0, 300),
                  classes: el.className,
                  style: el.style.cssText
                }));
                console.log('選單內容預覽:', menuContent);
              }
            }
          }
          
          if (!menuFound) {
            console.log('❌ 未找到顯示的手機版選單');
          }
        }
      } else {
        console.log('❌ 未找到任何漢堡選單按鈕');
        
        // 檢查完整的導航結構
        const navStructure = await page.evaluate(() => {
          const navElements = Array.from(document.querySelectorAll('nav, header, .navbar, .navigation'));
          return navElements.map((nav, index) => ({
            index,
            tagName: nav.tagName,
            classes: nav.className,
            id: nav.id,
            innerHTML: nav.innerHTML.substring(0, 500) + '...'
          }));
        });
        
        console.log('導航結構:', navStructure);
        
        // 檢查所有按鈕
        const allButtons = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, [role="button"], .btn'));
          return buttons.map((btn, index) => ({
            index,
            tagName: btn.tagName,
            className: btn.className,
            id: btn.id,
            text: btn.textContent.trim().substring(0, 30),
            visible: btn.offsetParent !== null,
            innerHTML: btn.innerHTML.substring(0, 100)
          }));
        });
        
        console.log('所有按鈕:', allButtons);
      }
      
      // 4. 檢查 Alpine.js 資料狀態
      console.log('🔧 檢查 Alpine.js 資料狀態...');
      const alpineData = await page.evaluate(() => {
        const navElement = document.querySelector('nav, header, .navbar');
        if (navElement && window.Alpine) {
          return {
            hasAlpineData: navElement.hasAttribute('x-data'),
            alpineDataValue: navElement.getAttribute('x-data'),
            computedData: navElement._x_dataStack ? navElement._x_dataStack[0] : null
          };
        }
        return { message: '未找到 Alpine 資料' };
      });
      
      console.log('Alpine 資料狀態:', alpineData);
      
    } else {
      console.log('❌ 登入頁面格式異常');
    }
    
  } catch (error) {
    console.error('診斷過程中發生錯誤:', error);
  } finally {
    await browser.close();
  }
})();