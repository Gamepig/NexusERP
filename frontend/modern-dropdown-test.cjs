const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    console.log('=== 用戶下拉選單現代化重新設計測試 ===');
    
    // 1. 導航到首頁
    console.log('\n1. 導航到首頁...');
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'modern_dropdown_01_homepage.png', fullPage: true });
    console.log('✓ 已截圖首頁');
    
    // 2. 點擊登入
    console.log('\n2. 點擊登入按鈕...');
    await page.click('a[href*="login"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'modern_dropdown_02_login_page.png', fullPage: true });
    console.log('✓ 已截圖登入頁面');
    
    // 3. 填寫登入表單
    console.log('\n3. 填寫登入表單...');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.screenshot({ path: 'modern_dropdown_03_login_filled.png', fullPage: true });
    console.log('✓ 已截圖填寫完成的登入表單');
    
    // 4. 提交登入表單
    console.log('\n4. 提交登入表單...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // 5. 強制刷新確保最新樣式載入
    console.log('\n5. 強制刷新頁面載入最新樣式...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'modern_dropdown_04_after_login.png', fullPage: true });
    console.log('✓ 已截圖登入後的頁面');
    
    // 6. 分析用戶下拉選單區域
    console.log('\n6. 分析用戶下拉選單區域...');
    
    // 尋找用戶下拉選單的各種可能選擇器
    const possibleSelectors = [
      '.dropdown-toggle',
      '.user-dropdown', 
      '.user-menu',
      '[data-bs-toggle="dropdown"]',
      '.nav-item.dropdown a',
      '.navbar .dropdown-toggle',
      'a[data-bs-toggle]',
      '.dropdown button',
      '.user-profile-trigger'
    ];
    
    let dropdownTrigger = null;
    let usedSelector = '';
    
    for (const selector of possibleSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          dropdownTrigger = element;
          usedSelector = selector;
          console.log(`✓ 找到用戶下拉選單觸發器: ${selector}`);
          break;
        }
      } catch (e) {
        // 繼續嘗試下一個選擇器
      }
    }
    
    if (!dropdownTrigger) {
      console.log('❌ 未找到用戶下拉選單，截圖導航區域進行分析...');
      const navArea = await page.locator('nav, .navbar, .navigation, header').first();
      if (await navArea.isVisible()) {
        await navArea.screenshot({ path: 'modern_dropdown_05_nav_analysis.png' });
        console.log('✓ 已截圖導航区域');
      }
      
      // 檢查頁面右上角區域
      await page.screenshot({ path: 'modern_dropdown_06_full_page_analysis.png', fullPage: true });
      console.log('✓ 已截圖完整頁面');
      
      // 輸出頁面HTML結構用於分析
      const navHTML = await page.locator('nav').innerHTML();
      console.log('\n導航區域HTML結構:');
      console.log(navHTML.substring(0, 500) + '...');
    } else {
      console.log(`\n7. 測試用戶下拉選單 (使用選擇器: ${usedSelector})...`);
      
      // 截圖觸發器初始狀態
      await dropdownTrigger.screenshot({ path: 'modern_dropdown_07_trigger_initial.png' });
      console.log('✓ 已截圖觸發器初始狀態');
      
      // 檢查觸發器的外觀是否現代化
      const triggerHTML = await dropdownTrigger.innerHTML();
      console.log('觸發器HTML內容:', triggerHTML);
      
      // 8. 點擊下拉選單
      console.log('\n8. 點擊用戶下拉選單...');
      await dropdownTrigger.click();
      await page.waitForTimeout(500);
      
      // 截圖展開狀態
      await page.screenshot({ path: 'modern_dropdown_08_expanded.png', fullPage: true });
      console.log('✓ 已截圖下拉選單展開狀態');
      
      // 9. 檢查下拉選單內容
      console.log('\n9. 檢查下拉選單內容...');
      const dropdownMenu = await page.locator('.dropdown-menu, .user-dropdown-menu, [role="menu"]').first();
      const menuVisible = await dropdownMenu.isVisible();
      console.log('下拉選單是否可見:', menuVisible);
      
      if (menuVisible) {
        // 截圖選單內容
        await dropdownMenu.screenshot({ path: 'modern_dropdown_09_menu_content.png' });
        console.log('✓ 已截圖選單內容');
        
        // 檢查選單項目
        const menuItems = await page.locator('.dropdown-menu a, .dropdown-item, [role="menuitem"]').all();
        console.log('選單項目數量:', menuItems.length);
        
        for (let i = 0; i < menuItems.length; i++) {
          const itemText = await menuItems[i].textContent();
          console.log(`選單項目 ${i + 1}:`, itemText ? itemText.trim() : '');
        }
        
        // 10. 測試 hover 效果
        if (menuItems.length > 0) {
          console.log('\n10. 測試 hover 效果...');
          await menuItems[0].hover();
          await page.waitForTimeout(300);
          await page.screenshot({ path: 'modern_dropdown_10_hover_effect.png', fullPage: true });
          console.log('✓ 已截圖 hover 效果');
        }
        
        // 11. 檢查是否移除了用戶信息顯示
        const userInfoArea = await page.locator('.user-info, .user-details, .user-name, .user-email').count();
        console.log('是否還有用戶信息顯示區域:', userInfoArea > 0 ? '是 (尚未移除)' : '否 (已成功移除)');
        
        // 12. 最終狀態截圖
        console.log('\n12. 最終測試狀態...');
        await page.screenshot({ path: 'modern_dropdown_11_final_state.png', fullPage: true });
        console.log('✓ 已截圖最終狀態');
      }
    }
    
    console.log('\n=== 測試完成 ===');
    
  } catch (error) {
    console.error('測試過程中發生錯誤:', error.message);
    await page.screenshot({ path: 'modern_dropdown_error.png', fullPage: true });
  }
  
  await browser.close();
})();