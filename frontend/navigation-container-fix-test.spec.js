import { test, expect } from '@playwright/test';

test.describe('導航容器大小修復測試', () => {
  test('檢查導航列容器大小修復效果', async ({ page }) => {
    // 設置較大的視窗大小來測試佈局
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('1. 開始訪問 NexusERP 主頁面...');
    
    // 訪問頁面並強制重新載入
    await page.goto('http://127.0.0.1:8000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 強制重新載入頁面 (等效 Ctrl+F5)
    await page.reload({ waitUntil: 'networkidle' });
    
    console.log('2. 頁面載入完成，開始檢查導航列...');
    
    // 等待頁面完全載入
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // 檢查導航列是否存在
    const navbar = await page.locator('.navbar, nav, [role="navigation"]').first();
    await expect(navbar).toBeVisible();
    
    console.log('3. 檢查導航列對齊方式...');
    
    // 檢查導航列的對齊方式
    const navbarClasses = await navbar.getAttribute('class') || '';
    console.log('導航列 class:', navbarClasses);
    
    // 檢查是否有居中對齊的 class
    const hasCenterAlignment = navbarClasses.includes('justify-center') || 
                               navbarClasses.includes('mx-auto') ||
                               navbarClasses.includes('text-center');
    console.log('導航列是否居中對齊:', hasCenterAlignment);
    
    console.log('4. 尋找最後兩個導航項目...');
    
    // 查找所有導航項目
    const navItems = await page.locator('.navbar a, nav a, [role="navigation"] a').all();
    console.log('發現導航項目數量:', navItems.length);
    
    if (navItems.length >= 2) {
      const lastNavItem = navItems[navItems.length - 1];
      const secondLastNavItem = navItems[navItems.length - 2];
      
      // 取得最後兩個導航項目的文字
      const lastNavText = await lastNavItem.textContent();
      const secondLastNavText = await secondLastNavItem.textContent();
      
      console.log('最後一個導航項目:', lastNavText);
      console.log('倒數第二個導航項目:', secondLastNavText);
      
      console.log('5. 測試最後一個導航項目的下拉選單...');
      
      // 點擊最後一個導航項目 (通常是「分析與報表」)
      await lastNavItem.hover();
      await page.waitForTimeout(500);
      await lastNavItem.click();
      await page.waitForTimeout(1000);
      
      // 檢查下拉選單是否出現
      const dropdown = await page.locator('.dropdown-menu, .dropdown-content, [role="menu"]').first();
      const dropdownVisible = await dropdown.isVisible().catch(() => false);
      console.log('最後一個導航的下拉選單是否可見:', dropdownVisible);
      
      if (dropdownVisible) {
        // 檢查下拉選單是否有滾動條
        const hasScrollbar = await dropdown.evaluate((element) => {
          return element.scrollHeight > element.clientHeight;
        });
        console.log('下拉選單是否有滾動條:', hasScrollbar);
        
        // 檢查下拉選單的寬度和高度
        const dropdownBox = await dropdown.boundingBox();
        console.log('下拉選單尺寸:', dropdownBox);
        
        // 檢查下拉選單中的項目
        const dropdownItems = await dropdown.locator('a, li, [role="menuitem"]').all();
        console.log('下拉選單項目數量:', dropdownItems.length);
        
        // 檢查文字方向
        for (let i = 0; i < Math.min(3, dropdownItems.length); i++) {
          const itemText = await dropdownItems[i].textContent();
          const itemStyles = await dropdownItems[i].evaluate((element) => {
            const computed = window.getComputedStyle(element);
            return {
              writingMode: computed.writingMode,
              textOrientation: computed.textOrientation,
              direction: computed.direction
            };
          });
          console.log(`下拉選單項目 ${i + 1}: "${itemText?.trim()}", 樣式:`, itemStyles);
        }
      }
      
      console.log('6. 測試倒數第二個導航項目的下拉選單...');
      
      // 點擊倒數第二個導航項目
      await secondLastNavItem.hover();
      await page.waitForTimeout(500);
      await secondLastNavItem.click();
      await page.waitForTimeout(1000);
      
      // 檢查下拉選單
      const secondDropdown = await page.locator('.dropdown-menu, .dropdown-content, [role="menu"]').last();
      const secondDropdownVisible = await secondDropdown.isVisible().catch(() => false);
      console.log('倒數第二個導航的下拉選單是否可見:', secondDropdownVisible);
      
      if (secondDropdownVisible) {
        const secondHasScrollbar = await secondDropdown.evaluate((element) => {
          return element.scrollHeight > element.clientHeight;
        });
        console.log('倒數第二個下拉選單是否有滾動條:', secondHasScrollbar);
      }
    }
    
    console.log('7. 檢查瀏覽器控制台日誌...');
    
    // 監聽控制台訊息
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('容器大小') || text.includes('修復') || text.includes('導航')) {
        consoleLogs.push(text);
      }
    });
    
    // 等待一段時間讓JavaScript修復機制執行
    await page.waitForTimeout(3000);
    
    console.log('控制台修復相關日誌:', consoleLogs);
    
    console.log('8. 截圖記錄...');
    
    // 截圖記錄
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/navigation-fix-test-result.png',
      fullPage: true 
    });
    
    console.log('測試完成！截圖已保存到 navigation-fix-test-result.png');
  });
});