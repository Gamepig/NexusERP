import { chromium } from 'playwright';

async function testUserDropdown() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 開始測試用戶下拉選單...');
    
    // 1. 直接訪問登入頁面
    console.log('🔐 訪問登入頁面: http://127.0.0.1:8000/login');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');

    // 2. 執行登入
    const pageTitle = await page.title();
    console.log('📋 頁面標題:', pageTitle);
    
    const hasLoginForm = await page.locator('input[name="email"]').isVisible();
    console.log('🔐 是否顯示登入表單:', hasLoginForm);
    
    if (hasLoginForm) {
      console.log('🔐 執行登入程序...');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      console.log('✅ 登入完成');
      
      // 等待重定向到儀表板
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log('🔗 當前 URL:', currentUrl);
    } else {
      throw new Error('找不到登入表單');
    }

    // 3. 檢查用戶觸發器
    console.log('👤 檢查用戶觸發器...');
    
    // 嘗試多種可能的選擇器
    const possibleSelectors = [
      '.nexus-user-trigger-modern',
      '[data-dropdown-trigger="user"]',
      '.user-dropdown-trigger',
      '.dropdown-toggle',
      '[data-bs-toggle="dropdown"]',
      '.navbar .dropdown-toggle'
    ];
    
    let userTrigger = null;
    for (const selector of possibleSelectors) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible();
      console.log(`🔍 選擇器 ${selector}:`, isVisible ? '找到' : '未找到');
      if (isVisible) {
        userTrigger = element;
        break;
      }
    }
    
    if (!userTrigger) {
      console.log('❌ 找不到用戶觸發器，檢查導航欄結構...');
      
      // 分別檢查每個nav元素
      const navElements = await page.locator('nav').all();
      console.log(`🔍 找到 ${navElements.length} 個 nav 元素`);
      
      for (let i = 0; i < navElements.length; i++) {
        const navHTML = await navElements[i].innerHTML();
        console.log(`🔍 Nav ${i + 1} 結構:`, navHTML.substring(0, 300));
        
        // 查看是否包含用戶相關元素
        const hasUser = navHTML.includes('用戶') || navHTML.includes('user') || navHTML.includes('dropdown') || navHTML.includes('User');
        console.log(`👤 Nav ${i + 1} 包含用戶元素:`, hasUser);
      }
      
      throw new Error('找不到用戶下拉觸發器');
    }
    
    // 檢查觸發器內容
    const triggerText = await userTrigger.textContent();
    console.log('📝 觸發器文字內容:', triggerText.trim());
    
    // 檢查是否包含用戶名稱和email
    const hasUserInfo = triggerText.includes('@') || triggerText.length > 10;
    console.log('✅ 觸發器包含用戶資訊:', hasUserInfo);

    // 4. 檢查頭像
    console.log('🖼️ 檢查用戶頭像...');
    const avatar = userTrigger.locator('.w-8.h-8, .w-10.h-10');
    const avatarExists = await avatar.count() > 0;
    console.log('✅ 頭像元素存在:', avatarExists);
    
    if (avatarExists) {
      const avatarText = await avatar.textContent();
      console.log('📝 頭像文字內容:', avatarText.trim());
    }

    // 5. 點擊下拉選單
    console.log('🖱️ 點擊用戶下拉選單...');
    
    // 等待 Alpine.js 完全初始化
    await page.waitForTimeout(1000);
    
    // 點擊觸發器
    await userTrigger.click();
    console.log('✅ 已點擊觸發器');
    
    // 等待下拉動畫完成
    await page.waitForTimeout(1000);

    // 6. 檢查下拉選單內容
    console.log('📋 檢查下拉選單內容...');
    
    // 嘗試多種下拉選單選擇器
    const dropdownSelectors = [
      '.nexus-user-dropdown-modern',
      '[data-dropdown-menu="user"]',
      '.dropdown-menu',
      '.user-dropdown-menu',
      '.dropdown-menu.show'
    ];
    
    let dropdown = null;
    for (const selector of dropdownSelectors) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible();
      console.log(`🔍 下拉選單選擇器 ${selector}:`, isVisible ? '找到' : '未找到');
      if (isVisible) {
        dropdown = element;
        break;
      }
    }
    
    if (!dropdown) {
      console.log('❌ 找不到下拉選單，檢查頁面狀態...');
      
      // 檢查是否有任何下拉相關元素
      const allDropdowns = await page.locator('[x-show], .dropdown, div[style*="display"]').all();
      console.log(`🔍 找到 ${allDropdowns.length} 個可能的下拉元素`);
      
      // 查看是否有 Alpine.js 狀態變化
      const alpineState = await page.evaluate(() => {
        return window.Alpine ? 'Alpine loaded' : 'Alpine not loaded';
      });
      console.log('🔍 Alpine.js 狀態:', alpineState);
      
      // 再次嘗試查找任何顯示的下拉選單
      const visibleDropdowns = await page.locator('div[style*="display: block"], div:not([style*="display: none"])').all();
      console.log(`🔍 找到 ${visibleDropdowns.length} 個可見元素`);
      
      // 最後嘗試
      dropdown = page.locator('.nexus-user-dropdown-modern').first();
      const exists = await dropdown.count() > 0;
      console.log('🔍 Nexus 下拉選單元素存在:', exists);
      
      if (!exists) {
        throw new Error('找不到用戶下拉選單');
      }
    }
    
    // 檢查選單項目
    const menuItems = await dropdown.locator('a, button').allTextContents();
    console.log('📝 選單項目:', menuItems);
    
    // 驗證是否只包含「個人資料」和「登出」
    const hasProfile = menuItems.some(item => item.includes('個人資料') || item.includes('Profile'));
    const hasLogout = menuItems.some(item => item.includes('登出') || item.includes('Logout'));
    const hasSettings = menuItems.some(item => item.includes('設定') || item.includes('Settings'));
    const hasHelp = menuItems.some(item => item.includes('說明') || item.includes('Help'));
    
    console.log('✅ 包含個人資料選項:', hasProfile);
    console.log('✅ 包含登出選項:', hasLogout);
    console.log('❌ 不應包含設定選項:', !hasSettings);
    console.log('❌ 不應包含說明選項:', !hasHelp);

    // 7. 檢查下拉選單樣式
    console.log('🎨 檢查下拉選單樣式...');
    const dropdownStyles = await dropdown.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow
      };
    });
    console.log('🎨 下拉選單樣式:', dropdownStyles);

    // 8. 截圖記錄
    console.log('📸 截圖記錄當前狀態...');
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/user_dropdown_test.png',
      fullPage: false
    });

    // 9. 測試結果總結
    console.log('\n📊 測試結果總結:');
    console.log('==================');
    console.log('✅ 用戶觸發器顯示:', hasUserInfo ? '成功' : '失敗');
    console.log('✅ 頭像顯示:', avatarExists ? '成功' : '失敗');
    console.log('✅ 下拉選單顯示:', await dropdown.isVisible() ? '成功' : '失敗');
    console.log('✅ 個人資料選項:', hasProfile ? '存在' : '缺失');
    console.log('✅ 登出選項:', hasLogout ? '存在' : '缺失');
    console.log('✅ 設定選項移除:', !hasSettings ? '成功' : '仍存在');
    console.log('✅ 說明選項移除:', !hasHelp ? '成功' : '仍存在');

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/user_dropdown_error.png'
    });
  } finally {
    await browser.close();
  }
}

testUserDropdown();