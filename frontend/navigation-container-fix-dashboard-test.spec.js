import { test, expect } from '@playwright/test';

test.describe('儀表板導航容器大小修復測試', () => {
  test('檢查儀表板導航列容器大小修復效果', async ({ page }) => {
    // 設置較大的視窗大小來測試佈局
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('1. 開始訪問 NexusERP 登入頁面...');
    
    // 先訪問登入頁面
    await page.goto('http://127.0.0.1:8000/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('2. 執行登入操作...');
    
    // 填寫登入表單
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 點擊登入按鈕
    await page.click('button[type="submit"], input[type="submit"], .btn-primary');
    
    // 等待重定向到儀表板
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    console.log('3. 登入完成，檢查當前頁面...');
    
    // 檢查是否成功登入到儀表板
    const currentUrl = page.url();
    console.log('當前 URL:', currentUrl);
    
    // 確保在儀表板頁面
    if (!currentUrl.includes('dashboard') && !currentUrl.includes('home')) {
      // 嘗試直接導航到儀表板
      await page.goto('http://127.0.0.1:8000/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }
    
    console.log('4. 開始檢查儀表板導航列...');
    
    // 檢查是否存在主要導航選單
    const mainNav = await page.locator('.main-nav, .navigation, .nav-menu, nav:has(.nav-item)').first();
    const mainNavExists = await mainNav.isVisible().catch(() => false);
    console.log('主要導航選單是否可見:', mainNavExists);
    
    if (mainNavExists) {
      // 檢查導航列的對齊方式
      const navClasses = await mainNav.getAttribute('class') || '';
      console.log('主要導航列 class:', navClasses);
      
      // 檢查是否有居中對齊
      const hasCenterAlignment = navClasses.includes('justify-center') || 
                                 navClasses.includes('mx-auto') ||
                                 navClasses.includes('text-center');
      console.log('導航列是否居中對齊:', hasCenterAlignment);
      
      console.log('5. 尋找主要導航項目...');
      
      // 查找主要導航項目 (如：客戶關係管理、產品與庫存等)
      const navItems = await page.locator('.nav-item, .navigation-item, [data-nav-item]').all();
      console.log('發現主要導航項目數量:', navItems.length);
      
      // 列出所有導航項目的文字內容
      for (let i = 0; i < Math.min(10, navItems.length); i++) {
        const itemText = await navItems[i].textContent();
        console.log(`導航項目 ${i + 1}:`, itemText?.trim());
      }
      
      if (navItems.length >= 2) {
        const lastNavItem = navItems[navItems.length - 1];
        const secondLastNavItem = navItems[navItems.length - 2];
        
        const lastNavText = await lastNavItem.textContent();
        const secondLastNavText = await secondLastNavItem.textContent();
        
        console.log('6. 測試最後兩個導航項目...');
        console.log('最後一個導航項目:', lastNavText?.trim());
        console.log('倒數第二個導航項目:', secondLastNavText?.trim());
        
        // 測試最後一個導航項目的下拉選單
        console.log('7. 測試最後一個導航項目的下拉選單...');
        
        await lastNavItem.hover();
        await page.waitForTimeout(1000);
        
        // 尋找下拉選單
        const dropdown = await page.locator('.dropdown-menu, .sub-menu, [role="menu"]').last();
        const dropdownVisible = await dropdown.isVisible().catch(() => false);
        console.log('最後一個導航的下拉選單是否可見:', dropdownVisible);
        
        if (dropdownVisible) {
          // 檢查下拉選單容器大小
          const dropdownBox = await dropdown.boundingBox();
          console.log('下拉選單尺寸:', dropdownBox);
          
          // 檢查是否還有滾動條
          const hasScrollbar = await dropdown.evaluate((element) => {
            return element.scrollHeight > element.clientHeight;
          });
          console.log('下拉選單是否有滾動條:', hasScrollbar);
          
          // 檢查下拉選單項目
          const dropdownItems = await dropdown.locator('a, li, [role="menuitem"]').all();
          console.log('下拉選單項目數量:', dropdownItems.length);
          
          // 檢查前3個項目的文字方向
          for (let i = 0; i < Math.min(3, dropdownItems.length); i++) {
            const itemText = await dropdownItems[i].textContent();
            const itemStyles = await dropdownItems[i].evaluate((element) => {
              const computed = window.getComputedStyle(element);
              return {
                writingMode: computed.writingMode,
                textOrientation: computed.textOrientation,
                direction: computed.direction,
                width: computed.width,
                overflow: computed.overflow
              };
            });
            console.log(`下拉選單項目 ${i + 1}: "${itemText?.trim()}", 樣式:`, itemStyles);
          }
        }
        
        console.log('8. 測試倒數第二個導航項目...');
        
        // 測試倒數第二個導航項目
        await secondLastNavItem.hover();
        await page.waitForTimeout(1000);
        
        const secondDropdown = await page.locator('.dropdown-menu, .sub-menu, [role="menu"]').last();
        const secondDropdownVisible = await secondDropdown.isVisible().catch(() => false);
        console.log('倒數第二個導航的下拉選單是否可見:', secondDropdownVisible);
        
        if (secondDropdownVisible) {
          const secondHasScrollbar = await secondDropdown.evaluate((element) => {
            return element.scrollHeight > element.clientHeight;
          });
          console.log('倒數第二個下拉選單是否有滾動條:', secondHasScrollbar);
        }
      }
    }
    
    console.log('9. 檢查瀏覽器控制台日誌...');
    
    // 監聽控制台訊息
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('容器大小') || text.includes('修復') || text.includes('導航') || text.includes('dropdown')) {
        consoleLogs.push(text);
      }
    });
    
    // 等待JavaScript修復機制執行
    await page.waitForTimeout(3000);
    
    console.log('控制台修復相關日誌:', consoleLogs);
    
    console.log('10. 截圖記錄...');
    
    // 截圖記錄
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/navigation-dashboard-fix-test-result.png',
      fullPage: true 
    });
    
    console.log('儀表板導航測試完成！截圖已保存到 navigation-dashboard-fix-test-result.png');
  });
});