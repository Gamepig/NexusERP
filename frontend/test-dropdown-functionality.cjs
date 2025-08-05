const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    // 快速登入
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    console.log('=== 用戶下拉選單功能測試 ===');
    
    // 截圖初始狀態
    await page.screenshot({ path: 'dropdown_test_01_initial.png' });
    console.log('✓ 已截圖初始狀態');
    
    // 尋找主題按鈕右邊的下拉選單
    const themeButton = await page.locator('button:has-text("主題")');
    if (await themeButton.isVisible()) {
      console.log('✓ 找到主題按鈕');
      
      // 查找主題按鈕的父容器，然後找其後的下拉選單
      const parentContainer = themeButton.locator('..');
      const nextSibling = await parentContainer.locator('+ *').first();
      
      if (await nextSibling.isVisible()) {
        console.log('✓ 找到主題按鈕後的元素');
        const siblingHTML = await nextSibling.innerHTML();
        console.log('後續元素HTML:', siblingHTML.substring(0, 200));
        
        // 檢查是否是下拉選單
        if (siblingHTML.includes('dropdown') || siblingHTML.includes('▼')) {
          console.log('✓ 確認是下拉選單');
          
          // 嘗試點擊
          await nextSibling.click();
          await page.waitForTimeout(500);
          
          // 截圖展開狀態
          await page.screenshot({ path: 'dropdown_test_02_expanded.png' });
          console.log('✓ 已截圖展開狀態');
        }
      }
    }
    
    // 嘗試直接點擊右上角下拉箭頭區域
    const rightCorner = await page.locator('nav .ml-auto, nav .ms-auto').last();
    if (await rightCorner.isVisible()) {
      // 找到所有可點擊元素
      const clickableElements = await rightCorner.locator('*').all();
      
      for (let i = 0; i < clickableElements.length; i++) {
        const element = clickableElements[i];
        const html = await element.innerHTML();
        
        if (html.includes('▼') || html.includes('dropdown')) {
          console.log(`✓ 找到下拉元素 ${i + 1}`);
          
          try {
            await element.click();
            await page.waitForTimeout(500);
            
            // 檢查是否有下拉選單出現
            const dropdownMenu = await page.locator('.dropdown-menu:visible').first();
            if (await dropdownMenu.isVisible()) {
              console.log('✓ 下拉選單已展開');
              
              // 截圖展開的選單
              await page.screenshot({ path: 'dropdown_test_03_menu_expanded.png' });
              
              // 檢查選單項目
              const menuItems = await dropdownMenu.locator('a, button').all();
              console.log('選單項目數量:', menuItems.length);
              
              for (let j = 0; j < menuItems.length; j++) {
                const text = await menuItems[j].textContent();
                console.log(`  項目 ${j + 1}: ${text ? text.trim() : ''}`);
              }
              
              // 測試 hover 效果
              if (menuItems.length > 0) {
                await menuItems[0].hover();
                await page.waitForTimeout(300);
                await page.screenshot({ path: 'dropdown_test_04_hover.png' });
                console.log('✓ 已測試 hover 效果');
              }
              
              break;
            }
          } catch (e) {
            console.log('點擊失敗:', e.message);
          }
        }
      }
    }
    
    // 最終截圖
    await page.screenshot({ path: 'dropdown_test_05_final.png' });
    console.log('✓ 測試完成');
    
  } catch (error) {
    console.error('錯誤:', error.message);
    await page.screenshot({ path: 'dropdown_test_error.png', fullPage: true });
  }
  
  await browser.close();
})();