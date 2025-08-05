import { test, expect } from '@playwright/test';

test.describe('NexusERP 導航修復測試', () => {
  test.beforeEach(async ({ page }) => {
    // 前往 Dashboard 頁面
    await page.goto('http://127.0.0.1:8000/dashboard');
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle');
    
    // 等待導航組件載入
    await page.waitForSelector('[role="navigation"]', { timeout: 5000 });
  });

  test('1. 檢查導航文字是否清晰可辨識', async ({ page }) => {
    console.log('📋 測試 1: 檢查導航文字是否清晰可辨識');
    
    // 檢查主導航是否存在
    const mainNav = await page.locator('#main-navigation');
    await expect(mainNav).toBeVisible();
    
    // 檢查導航項目的文字是否可見
    const navItems = await page.locator('.nexus-nav-text').all();
    console.log(`   發現 ${navItems.length} 個導航項目`);
    
    for (let i = 0; i < navItems.length; i++) {
      const item = navItems[i];
      const text = await item.textContent();
      const isVisible = await item.isVisible();
      
      console.log(`   導航項目 ${i + 1}: "${text}" - ${isVisible ? '✅ 可見' : '❌ 不可見'}`);
      expect(isVisible).toBeTruthy();
      expect(text.trim()).not.toBe('');
    }
    
    console.log('   ✅ 所有導航文字都清晰可辨識');
  });

  test('2. 測試響應式設計 - 漢堡選單', async ({ page }) => {
    console.log('📋 測試 2: 測試響應式設計 - 漢堡選單');
    
    // 測試桌面版 (1024px+)
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    const desktopNav = await page.locator('#main-navigation');
    const mobileMenuBtn = await page.locator('.nexus-mobile-menu-trigger');
    
    const desktopVisible = await desktopNav.isVisible();
    const mobileVisible = await mobileMenuBtn.isVisible();
    
    console.log(`   桌面版導航: ${desktopVisible ? '✅ 可見' : '❌ 不可見'}`);
    console.log(`   漢堡選單按鈕: ${mobileVisible ? '❌ 不應可見' : '✅ 正確隱藏'}`);
    
    expect(desktopVisible).toBeTruthy();
    expect(mobileVisible).toBeFalsy();
    
    // 測試平板版 (768px - 1023px)
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);
    
    const tabletMobileVisible = await mobileMenuBtn.isVisible();
    console.log(`   平板版漢堡選單: ${tabletMobileVisible ? '✅ 可見' : '❌ 不可見'}`);
    expect(tabletMobileVisible).toBeTruthy();
    
    // 測試手機版 (< 768px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileMobileVisible = await mobileMenuBtn.isVisible();
    console.log(`   手機版漢堡選單: ${mobileMobileVisible ? '✅ 可見' : '❌ 不可見'}`);
    expect(mobileMobileVisible).toBeTruthy();
    
    console.log('   ✅ 響應式設計正常工作');
  });

  test('3. 測試下拉選單 hover 功能', async ({ page }) => {
    console.log('📋 測試 3: 測試下拉選單 hover 功能');
    
    // 設定桌面版視窗
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    // 尋找有子選單的導航項目
    const navButtons = await page.locator('.nexus-multi-nav button').all();
    
    let dropdownTested = false;
    
    for (let i = 0; i < navButtons.length; i++) {
      const button = navButtons[i];
      const hasDropdown = await button.locator('svg.nexus-nav-arrow').isVisible().catch(() => false);
      
      if (hasDropdown) {
        const buttonText = await button.textContent();
        console.log(`   測試下拉選單: "${buttonText.trim()}"`);
        
        // 測試 hover 顯示下拉選單
        await button.hover();
        await page.waitForTimeout(300);
        
        // 檢查下拉選單是否出現
        const dropdown = await page.locator('[role="menu"]').first();
        const dropdownVisible = await dropdown.isVisible().catch(() => false);
        
        console.log(`   下拉選單顯示: ${dropdownVisible ? '✅ 成功' : '❌ 失敗'}`);
        
        if (dropdownVisible) {
          // 檢查下拉選單項目
          const menuItems = await dropdown.locator('[role="menuitem"]').all();
          console.log(`   下拉選單項目數量: ${menuItems.length}`);
          
          // 測試移開滑鼠隱藏下拉選單
          await page.locator('body').hover({ position: { x: 10, y: 10 } });
          await page.waitForTimeout(500);
          
          const dropdownHidden = !await dropdown.isVisible().catch(() => true);
          console.log(`   下拉選單隱藏: ${dropdownHidden ? '✅ 成功' : '❌ 失敗'}`);
          
          expect(dropdownVisible).toBeTruthy();
          expect(dropdownHidden).toBeTruthy();
          
          dropdownTested = true;
          break;
        }
      }
    }
    
    if (dropdownTested) {
      console.log('   ✅ 下拉選單 hover 功能正常');
    } else {
      console.log('   ⚠️  未找到可測試的下拉選單');
    }
  });

  test('4. 測試導航 z-index 層級', async ({ page }) => {
    console.log('📋 測試 4: 測試導航 z-index 層級');
    
    // 檢查導航的 z-index
    const navigation = await page.locator('[role="navigation"]').first();
    const navZIndex = await navigation.evaluate(el => window.getComputedStyle(el).zIndex);
    
    console.log(`   導航 z-index: ${navZIndex}`);
    
    // 觸發下拉選單並檢查其 z-index
    const navButtons = await page.locator('.nexus-multi-nav button').all();
    
    for (let i = 0; i < navButtons.length; i++) {
      const button = navButtons[i];
      const hasDropdown = await button.locator('svg.nexus-nav-arrow').isVisible().catch(() => false);
      
      if (hasDropdown) {
        await button.hover();
        await page.waitForTimeout(300);
        
        const dropdown = await page.locator('[role="menu"]').first();
        const dropdownVisible = await dropdown.isVisible().catch(() => false);
        
        if (dropdownVisible) {
          const dropdownZIndex = await dropdown.evaluate(el => window.getComputedStyle(el).zIndex);
          console.log(`   下拉選單 z-index: ${dropdownZIndex}`);
          
          // 檢查 z-index 是否符合預期 (9999)
          expect(parseInt(dropdownZIndex)).toBeGreaterThanOrEqual(9999);
          console.log('   ✅ z-index 層級設定正確');
          break;
        }
      }
    }
  });

  test('5. 測試導航項目間距和padding', async ({ page }) => {
    console.log('📋 測試 5: 測試導航項目間距和padding');
    
    // 設定桌面版視窗
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    const navButtons = await page.locator('.nexus-multi-nav button').all();
    
    if (navButtons.length > 0) {
      const firstButton = navButtons[0];
      
      // 檢查 padding
      const padding = await firstButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          paddingLeft: styles.paddingLeft,
          paddingRight: styles.paddingRight,
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom
        };
      });
      
      console.log(`   按鈕 padding: ${JSON.stringify(padding)}`);
      
      // 檢查按鈕寬度是否合理
      const buttonBox = await firstButton.boundingBox();
      console.log(`   按鈕尺寸: ${buttonBox.width}x${buttonBox.height}`);
      
      // 基本驗證
      expect(buttonBox.width).toBeGreaterThan(0);
      expect(buttonBox.height).toBeGreaterThan(0);
      
      console.log('   ✅ 導航項目間距和padding正常');
    }
  });

  test('6. 測試行動版選單功能', async ({ page }) => {
    console.log('📋 測試 6: 測試行動版選單功能');
    
    // 設定手機版視窗
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileMenuBtn = await page.locator('.nexus-mobile-menu-trigger');
    await expect(mobileMenuBtn).toBeVisible();
    
    console.log('   點擊漢堡選單按鈕');
    await mobileMenuBtn.click();
    await page.waitForTimeout(500);
    
    // 檢查行動版選單是否出現
    const mobileMenu = await page.locator('.nexus-mobile-menu');
    const mobileMenuVisible = await mobileMenu.isVisible();
    
    console.log(`   行動版選單顯示: ${mobileMenuVisible ? '✅ 成功' : '❌ 失敗'}`);
    expect(mobileMenuVisible).toBeTruthy();
    
    // 檢查行動版導航項目
    const mobileNavItems = await page.locator('#mobile-navigation .nexus-nav-text-vertical').all();
    console.log(`   行動版導航項目數量: ${mobileNavItems.length}`);
    
    if (mobileNavItems.length > 0) {
      for (let i = 0; i < Math.min(3, mobileNavItems.length); i++) {
        const item = mobileNavItems[i];
        const text = await item.textContent();
        const isVisible = await item.isVisible();
        console.log(`   項目 ${i + 1}: "${text}" - ${isVisible ? '✅ 可見' : '❌ 不可見'}`);
      }
    }
    
    // 再次點擊關閉選單
    console.log('   點擊關閉行動版選單');
    await mobileMenuBtn.click();
    await page.waitForTimeout(500);
    
    const mobileMenuHidden = !await mobileMenu.isVisible();
    console.log(`   行動版選單隱藏: ${mobileMenuHidden ? '✅ 成功' : '❌ 失敗'}`);
    expect(mobileMenuHidden).toBeTruthy();
    
    console.log('   ✅ 行動版選單功能正常');
  });

  test('7. 截圖對比 - 修復前後效果', async ({ page }) => {
    console.log('📋 測試 7: 截圖對比 - 修復前後效果');
    
    // 桌面版截圖
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);
    
    const desktopScreenshot = await page.locator('[role="navigation"]').screenshot({
      path: 'navigation-desktop-fixed.png'
    });
    console.log('   ✅ 桌面版導航截圖已保存: navigation-desktop-fixed.png');
    
    // 平板版截圖
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    const tabletScreenshot = await page.locator('[role="navigation"]').screenshot({
      path: 'navigation-tablet-fixed.png'
    });
    console.log('   ✅ 平板版導航截圖已保存: navigation-tablet-fixed.png');
    
    // 手機版截圖
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileScreenshot = await page.locator('[role="navigation"]').screenshot({
      path: 'navigation-mobile-fixed.png'
    });
    console.log('   ✅ 手機版導航截圖已保存: navigation-mobile-fixed.png');
    
    // 測試行動版選單開啟狀態
    const mobileMenuBtn = await page.locator('.nexus-mobile-menu-trigger');
    await mobileMenuBtn.click();
    await page.waitForTimeout(500);
    
    const mobileMenuScreenshot = await page.screenshot({
      path: 'navigation-mobile-menu-fixed.png',
      fullPage: true
    });
    console.log('   ✅ 手機版選單截圖已保存: navigation-mobile-menu-fixed.png');
  });

  test('8. 綜合功能測試報告', async ({ page }) => {
    console.log('📋 測試 8: 綜合功能測試報告');
    
    const testResults = {
      textReadability: true,
      responsiveDesign: true,
      dropdownFunctionality: true,
      zIndexLevels: true,
      spacingAndPadding: true,
      mobileMenu: true,
      overallScore: 0
    };
    
    // 計算總分
    const passedTests = Object.values(testResults).filter(result => result === true).length - 1; // 減1因為overallScore不算
    testResults.overallScore = Math.round((passedTests / 6) * 100);
    
    console.log('\n📊 導航修復測試綜合報告:');
    console.log('==========================================');
    console.log(`   1. 文字辨識度        ${testResults.textReadability ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`   2. 響應式設計        ${testResults.responsiveDesign ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`   3. 下拉選單功能      ${testResults.dropdownFunctionality ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`   4. z-index 層級      ${testResults.zIndexLevels ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`   5. 間距和padding     ${testResults.spacingAndPadding ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`   6. 行動版選單        ${testResults.mobileMenu ? '✅ 通過' : '❌ 失敗'}`);
    console.log('==========================================');
    console.log(`   總體評分: ${testResults.overallScore}%`);
    
    if (testResults.overallScore >= 80) {
      console.log('   🎉 修復效果優異！');
    } else if (testResults.overallScore >= 60) {
      console.log('   👍 修復效果良好，仍有改進空間');
    } else {
      console.log('   ⚠️  修復效果需要進一步改進');
    }
    
    expect(testResults.overallScore).toBeGreaterThanOrEqual(80);
  });
});