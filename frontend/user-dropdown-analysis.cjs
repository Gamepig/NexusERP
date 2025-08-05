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
    
    console.log('=== 現代化用戶下拉選單分析報告 ===');
    
    // 截圖完整導航區域
    await page.screenshot({ path: 'user_dropdown_full_nav.png' });
    console.log('✓ 已截圖完整導航區域');
    
    // 檢查右上角區域
    const headerRight = await page.locator('.ml-auto, .ms-auto, .header-right, .navbar-nav').last();
    if (await headerRight.isVisible()) {
      await headerRight.screenshot({ path: 'user_dropdown_right_area.png' });
      console.log('✓ 已截圖右上角區域');
    }
    
    // 檢查主題按鈕
    const themeButton = await page.locator('button:has-text("主題"), [title*="主題"]').first();
    if (await themeButton.isVisible()) {
      console.log('✓ 找到主題切換按鈕');
      await themeButton.screenshot({ path: 'theme_button.png' });
    }
    
    // 尋找用戶下拉選單（可能在主題按鈕右邊）
    const allDropdowns = await page.locator('[data-bs-toggle="dropdown"], .dropdown-toggle').all();
    console.log('找到的下拉選單數量:', allDropdowns.length);
    
    for (let i = 0; i < allDropdowns.length; i++) {
      const dropdown = allDropdowns[i];
      if (await dropdown.isVisible()) {
        const html = await dropdown.innerHTML();
        console.log(`下拉選單 ${i + 1} HTML:`, html.substring(0, 100));
        
        // 如果這個下拉選單包含用戶相關內容
        if (html.includes('用戶') || html.includes('user') || html.includes('profile') || html.includes('登出') || html.includes('logout')) {
          console.log(`✓ 找到用戶下拉選單 (第 ${i + 1} 個)`);
          
          // 截圖觸發器
          await dropdown.screenshot({ path: `user_dropdown_trigger_${i + 1}.png` });
          
          // 點擊展開
          await dropdown.click();
          await page.waitForTimeout(500);
          
          // 截圖展開狀態
          await page.screenshot({ path: `user_dropdown_expanded_${i + 1}.png` });
          
          // 檢查選單內容
          const menuItems = await page.locator('.dropdown-menu:visible a, .dropdown-menu:visible button').all();
          console.log('選單項目:');
          for (let j = 0; j < menuItems.length; j++) {
            const text = await menuItems[j].textContent();
            console.log(`  ${j + 1}. ${text ? text.trim() : ''}`);
          }
          
          break;
        }
      }
    }
    
    // 最終完整頁面截圖
    await page.screenshot({ path: 'user_dropdown_final_analysis.png', fullPage: true });
    console.log('✓ 分析完成');
    
  } catch (error) {
    console.error('錯誤:', error.message);
    await page.screenshot({ path: 'user_dropdown_error.png', fullPage: true });
  }
  
  await browser.close();
})();