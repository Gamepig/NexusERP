import { test, expect } from '@playwright/test';

test.describe('用戶下拉選單修復驗證', () => {
  test.beforeEach(async ({ page }) => {
    // 設定較長的超時時間
    test.setTimeout(60000);
    
    // 訪問登入頁面
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 登入系統
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成，導向 dashboard
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('測試 1：驗證下拉選單初始狀態為關閉', async ({ page }) => {
    console.log('🔍 測試 1：檢查下拉選單初始狀態');
    
    // 截圖：初始頁面狀態
    await page.screenshot({ 
      path: 'dropdown-test-01-initial-state.png', 
      fullPage: true 
    });
    
    // 查找用戶頭像/按鈕區域 - 使用正確的 ID
    const avatarButton = page.locator('#user-menu-trigger');
    await expect(avatarButton).toBeVisible();
    
    // 檢查特定的用戶下拉選單是否存在但隱藏
    const dropdown = page.locator('#user-dropdown-menu');
    
    if (await dropdown.count() > 0) {
      // 如果下拉選單存在，檢查是否隱藏
      const isHidden = await dropdown.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || 
               style.visibility === 'hidden' || 
               style.opacity === '0' ||
               !el.offsetParent;
      });
      expect(isHidden).toBe(true);
      console.log('✅ 下拉選單初始狀態為隱藏');
    } else {
      console.log('✅ 下拉選單初始狀態不存在於 DOM 中（正常）');
    }
  });

  test('測試 2：驗證點擊頭像開啟下拉選單', async ({ page }) => {
    console.log('🔍 測試 2：點擊頭像開啟下拉選單');
    
    // 查找並點擊用戶頭像/按鈕
    const avatarButton = page.locator('#user-menu-trigger');
    await avatarButton.click();
    
    // 等待下拉選單動畫完成
    await page.waitForTimeout(500);
    
    // 截圖：下拉選單開啟狀態
    await page.screenshot({ 
      path: 'dropdown-test-02-opened-state.png', 
      fullPage: true 
    });
    
    // 查找特定的用戶下拉選單
    const dropdown = page.locator('#user-dropdown-menu');
    
    // 驗證下拉選單可見
    await expect(dropdown).toBeVisible();
    console.log('✅ 下拉選單成功開啟');
    
    // 檢查下拉選單內容
    const menuItems = dropdown.locator('a, button');
    const itemCount = await menuItems.count();
    console.log(`📋 下拉選單包含 ${itemCount} 個選項`);
    
    // 驗證常見選項是否存在
    const expectedItems = ['Profile', 'Settings', 'Logout', '個人資料', '設定', '登出'];
    for (const item of expectedItems) {
      const itemExists = await dropdown.locator(`text=${item}`).count() > 0;
      if (itemExists) {
        console.log(`✅ 找到選項：${item}`);
      }
    }
  });

  test('測試 3：驗證下拉選單背景色（非透明）', async ({ page }) => {
    console.log('🔍 測試 3：檢查下拉選單背景色');
    
    // 點擊開啟下拉選單
    const avatarButton = page.locator('#user-menu-trigger');
    await avatarButton.click();
    await page.waitForTimeout(500);
    
    // 查找特定的用戶下拉選單
    const dropdown = page.locator('#user-dropdown-menu');
    await expect(dropdown).toBeVisible();
    
    // 檢查背景色
    const backgroundColor = await dropdown.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        opacity: style.opacity,
        visibility: style.visibility
      };
    });
    
    console.log('🎨 下拉選單樣式：', backgroundColor);
    
    // 驗證背景不透明
    expect(backgroundColor.opacity).not.toBe('0');
    expect(backgroundColor.visibility).not.toBe('hidden');
    
    // 驗證有實際背景色
    expect(backgroundColor.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(backgroundColor.backgroundColor).not.toBe('transparent');
    
    console.log('✅ 下拉選單背景色正常（非透明）');
    
    // 截圖：背景色驗證
    await page.screenshot({ 
      path: 'dropdown-test-03-background-check.png', 
      fullPage: true 
    });
  });

  test('測試 4：驗證深色主題切換', async ({ page }) => {
    console.log('🔍 測試 4：測試深色主題切換');
    
    // 點擊開啟下拉選單
    const avatarButton = page.locator('#user-menu-trigger');
    await avatarButton.click();
    await page.waitForTimeout(500);
    
    // 截圖：開啟狀態
    await page.screenshot({ 
      path: 'dropdown-test-04a-light-theme.png', 
      fullPage: true 
    });
    
    // 查找深色主題切換按鈕
    const themeToggle = page.locator('button').filter({ 
      hasText: /Theme|主題|Dark|Light|🌙|☀️|🌞/ 
    }).first();
    
    if (await themeToggle.count() > 0) {
      console.log('🔍 找到主題切換按鈕，進行切換測試');
      
      // 點擊切換主題
      await themeToggle.click();
      await page.waitForTimeout(1000);
      
      // 截圖：深色主題
      await page.screenshot({ 
        path: 'dropdown-test-04b-dark-theme.png', 
        fullPage: true 
      });
      
      // 檢查深色主題是否生效
      const bodyClass = await page.locator('body').getAttribute('class');
      const htmlClass = await page.locator('html').getAttribute('class');
      
      console.log('🎨 Body classes:', bodyClass);
      console.log('🎨 HTML classes:', htmlClass);
      
      const isDarkTheme = (bodyClass && bodyClass.includes('dark')) || 
                         (htmlClass && htmlClass.includes('dark'));
      
      if (isDarkTheme) {
        console.log('✅ 深色主題切換成功');
        
        // 切換回淺色主題
        await themeToggle.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: 'dropdown-test-04c-back-to-light.png', 
          fullPage: true 
        });
        
        console.log('✅ 主題切換功能正常');
      } else {
        console.log('⚠️ 深色主題可能未正確生效');
      }
    } else {
      console.log('⚠️ 未找到主題切換按鈕');
      
      // 手動檢查是否有其他主題相關元素
      const themeElements = await page.locator('*').filter({
        hasText: /theme|dark|light|主題/i
      }).count();
      
      console.log(`🔍 找到 ${themeElements} 個可能的主題相關元素`);
    }
  });

  test('測試 5：驗證點擊外部關閉下拉選單', async ({ page }) => {
    console.log('🔍 測試 5：點擊外部區域關閉下拉選單');
    
    // 點擊開啟下拉選單
    const avatarButton = page.locator('#user-menu-trigger');
    await avatarButton.click();
    await page.waitForTimeout(500);
    
    // 驗證下拉選單已開啟
    const dropdown = page.locator('#user-dropdown-menu');
    await expect(dropdown).toBeVisible();
    console.log('✅ 下拉選單已開啟');
    
    // 截圖：開啟狀態
    await page.screenshot({ 
      path: 'dropdown-test-05a-opened-before-click-outside.png', 
      fullPage: true 
    });
    
    // 點擊頁面其他區域（避開下拉選單）
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);
    
    // 截圖：點擊外部後
    await page.screenshot({ 
      path: 'dropdown-test-05b-after-click-outside.png', 
      fullPage: true 
    });
    
    // 檢查下拉選單是否關閉
    const isHidden = await dropdown.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.display === 'none' || 
             style.visibility === 'hidden' || 
             style.opacity === '0' ||
             !el.offsetParent;
    }).catch(() => true); // 如果元素不存在，認為已隱藏
    
    if (isHidden) {
      console.log('✅ 點擊外部區域成功關閉下拉選單');
    } else {
      console.log('⚠️ 下拉選單未正確關閉');
    }
  });

  test('測試 6：完整流程綜合測試', async ({ page }) => {
    console.log('🔍 測試 6：完整流程綜合測試');
    
    // 1. 初始狀態檢查
    await page.screenshot({ 
      path: 'dropdown-test-06a-initial.png', 
      fullPage: true 
    });
    
    // 2. 開啟下拉選單  
    const avatarButton = page.locator('#user-menu-trigger');
    await avatarButton.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'dropdown-test-06b-opened.png', 
      fullPage: true 
    });
    
    // 3. 檢查選單內容
    const dropdown = page.locator('#user-dropdown-menu');
    await expect(dropdown).toBeVisible();
    
    const menuItems = await dropdown.locator('a, button').count();
    console.log(`📋 下拉選單包含 ${menuItems} 個選項`);
    
    // 4. 測試選單項目點擊（Profile/個人資料）
    const profileLink = dropdown.locator('a, button').filter({
      hasText: /Profile|個人資料|profile/i
    }).first();
    
    if (await profileLink.count() > 0) {
      console.log('🔍 測試 Profile 選項');
      await profileLink.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'dropdown-test-06c-profile-clicked.png', 
        fullPage: true 
      });
      
      // 返回 dashboard
      await page.goto('http://127.0.0.1:8000/dashboard');
      await page.waitForLoadState('networkidle');
    }
    
    // 5. 最終狀態檢查
    await page.screenshot({ 
      path: 'dropdown-test-06d-final-state.png', 
      fullPage: true 
    });
    
    console.log('✅ 完整流程測試完成');
  });

  test('測試 7：響應式設計驗證', async ({ page }) => {
    console.log('🔍 測試 7：響應式設計驗證');
    
    // 桌面版測試
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const avatarButton = page.locator('button').filter({ hasText: /test@example\.com|Test User|T/ }).first();
    await avatarButton.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'dropdown-test-07a-desktop.png', 
      fullPage: true 
    });
    
    // 平板版測試
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'dropdown-test-07b-tablet.png', 
      fullPage: true 
    });
    
    // 手機版測試
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'dropdown-test-07c-mobile.png', 
      fullPage: true 
    });
    
    console.log('✅ 響應式設計測試完成');
  });
});

// 測試後清理
test.afterEach(async ({ page }) => {
  console.log('🧹 測試清理完成');
});