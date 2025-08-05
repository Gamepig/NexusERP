import { test, expect } from '@playwright/test';

test.describe('NexusERP Real Dropdown Menu Test', () => {
  test('真實的下拉選單測試 - 直接訪問儀表板', async ({ page }) => {
    console.log('=== 開始真實下拉選單測試 ===');
    
    // 1. 先嘗試直接訪問儀表板
    console.log('1. 嘗試直接訪問儀表板');
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForTimeout(2000);
    
    // 截圖：檢查是否到達儀表板或被重導向到登入頁
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/real-test-01-dashboard-attempt.png', 
      fullPage: true 
    });
    
    // 2. 檢查當前 URL，如果在登入頁面則進行登入
    const currentUrl = page.url();
    console.log('當前 URL:', currentUrl);
    
    if (currentUrl.includes('login') || !currentUrl.includes('dashboard')) {
      console.log('2. 需要登入，填寫登入表單');
      
      // 等待登入表單出現
      await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 5000 });
      
      // 填寫登入資訊
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"], input[type="password"]', 'password123');
      
      // 點擊登入按鈕
      await page.click('button[type="submit"], .btn-primary, button:has-text("登入"), button:has-text("Login")');
      
      // 等待登入完成並跳轉
      await page.waitForTimeout(3000);
      
      // 如果仍然不在儀表板，再次嘗試導航
      if (!page.url().includes('dashboard')) {
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForTimeout(2000);
      }
    }
    
    // 截圖：登入後的狀態
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/real-test-02-after-login.png', 
      fullPage: true 
    });
    
    console.log('3. 檢查頁面是否包含主導航');
    
    // 3. 尋找主導航容器
    const possibleNavSelectors = [
      '.main-header', 
      '.navbar', 
      '.nav-container',
      '.main-navigation',
      'nav',
      '[role="navigation"]'
    ];
    
    let navContainer = null;
    for (const selector of possibleNavSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        navContainer = element.first();
        console.log(`✅ 找到主導航容器: ${selector}`);
        break;
      }
    }
    
    if (navContainer) {
      // 4. 檢查導航內容
      console.log('4. 分析導航內容');
      
      // 獲取所有導航文字
      const navText = await navContainer.textContent();
      console.log('導航區域文字內容:', navText);
      
      // 尋找包含中文的下拉選單項目
      const dropdownKeywords = ['客戶', '產品', '採購', '銷售', '財務', '報表', '庫存', '管理'];
      
      for (const keyword of dropdownKeywords) {
        const items = page.locator(`text=${keyword}`);
        const count = await items.count();
        
        if (count > 0) {
          console.log(`找到包含 "${keyword}" 的元素: ${count} 個`);
          
          // 嘗試懸停第一個找到的元素
          try {
            const firstItem = items.first();
            await firstItem.hover();
            await page.waitForTimeout(500);
            
            // 截圖：懸停後的狀態
            await page.screenshot({ 
              path: `/Users/gamepig/projects/NexusERP/frontend/real-test-hover-${keyword}.png`, 
              fullPage: true 
            });
            
            // 檢查是否有下拉選單出現
            const dropdownSelectors = [
              '.dropdown-menu',
              '.sub-menu', 
              '.dropdown-content',
              '[class*="dropdown"]',
              '.nav-dropdown'
            ];
            
            for (const dropdownSelector of dropdownSelectors) {
              const dropdown = page.locator(dropdownSelector);
              if (await dropdown.count() > 0 && await dropdown.first().isVisible()) {
                console.log(`🎯 發現下拉選單: ${dropdownSelector}`);
                
                // 檢查下拉選單的 CSS 樣式
                const dropdownElement = dropdown.first();
                const styles = await dropdownElement.evaluate((element) => {
                  const computed = window.getComputedStyle(element);
                  return {
                    writingMode: computed.writingMode,
                    textOrientation: computed.textOrientation,
                    direction: computed.direction,
                    flexDirection: computed.flexDirection,
                    display: computed.display,
                    position: computed.position,
                    visibility: computed.visibility
                  };
                });
                
                console.log(`下拉選單 CSS 樣式:`, styles);
                
                // 檢查下拉選單內的項目
                const menuItems = await dropdownElement.locator('a, li, .menu-item').all();
                console.log(`下拉選單包含 ${menuItems.length} 個項目`);
                
                for (let i = 0; i < Math.min(menuItems.length, 3); i++) {
                  const itemText = await menuItems[i].textContent();
                  console.log(`  項目 ${i + 1}: ${itemText}`);
                }
              }
            }
            
            // 移開滑鼠
            await page.hover('body', { position: { x: 100, y: 100 } });
            await page.waitForTimeout(300);
            
          } catch (error) {
            console.log(`測試 "${keyword}" 時發生錯誤:`, error.message);
          }
        }
      }
    } else {
      console.log('❌ 未找到主導航容器');
    }
    
    // 5. 檢查頁面的整體結構
    console.log('5. 分析頁面結構');
    
    const pageStructure = await page.evaluate(() => {
      const structure = {};
      
      // 檢查常見的導航結構
      const navElements = document.querySelectorAll('nav, .navbar, .navigation, .main-nav, .header-nav');
      structure.navCount = navElements.length;
      
      // 檢查是否有下拉相關的類別
      const dropdownElements = document.querySelectorAll('[class*="dropdown"], [class*="sub-menu"], [class*="nav-item"]');
      structure.dropdownCount = dropdownElements.length;
      
      // 檢查是否有 Alpine.js 或其他 JS 框架
      structure.hasAlpine = !!window.Alpine;
      structure.hasJQuery = !!window.jQuery;
      
      // 檢查 body 類別
      structure.bodyClasses = document.body.className;
      
      return structure;
    });
    
    console.log('頁面結構分析:', pageStructure);
    
    // 最終截圖
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/real-test-03-final-analysis.png', 
      fullPage: true 
    });
    
    console.log('\n=== 真實測試完成 ===');
    console.log('請檢查生成的截圖檔案以了解實際狀況');
  });
});