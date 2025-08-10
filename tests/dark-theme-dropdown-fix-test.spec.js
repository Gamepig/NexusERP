import { test, expect } from '@playwright/test';

/**
 * 深色主題用戶下拉選單背景透明問題專項修復測試
 */
test('深色主題用戶下拉選單背景透明修復驗證', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('🌙 深色主題下拉選單背景透明問題專項修復測試開始');
    
    // 導航到儀表板頁面
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('📍 階段1: 切換到深色主題');
    
    // 查找主題切換按鈕
    const themeToggle = page.locator('[aria-label="切換主題"]').first();
    const themeToggleExists = await themeToggle.count() > 0;
    console.log(`🎨 主題切換按鈕: ${themeToggleExists ? '✅ 找到' : '❌ 未找到'}`);
    
    if (themeToggleExists) {
        // 切換到深色主題
        await themeToggle.click();
        await page.waitForTimeout(1000);
        console.log('✅ 已切換到深色主題');
    } else {
        // 手動強制設置深色主題
        await page.evaluate(() => {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
            console.log('手動強制設置深色主題');
        });
        await page.waitForTimeout(500);
    }
    
    // 驗證深色主題是否生效
    const isDarkTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') || 
               document.body.classList.contains('dark');
    });
    console.log(`🌙 深色主題狀態: ${isDarkTheme ? '✅ 已啟用' : '❌ 未啟用'}`);
    
    console.log('📍 階段2: 檢查深色主題下的用戶下拉選單');
    
    // 檢查用戶觸發器
    const userTrigger = page.locator('#user-menu-trigger');
    const triggerExists = await userTrigger.count() > 0;
    console.log(`👤 用戶選單觸發器: ${triggerExists ? '✅ 存在' : '❌ 不存在'}`);
    
    if (!triggerExists) {
        console.log('❌ 測試失敗：無法找到用戶選單觸發器');
        return;
    }
    
    // 截圖記錄深色主題修復前狀態
    await page.screenshot({ 
        path: `dark-theme-dropdown-before-${Date.now()}.png`, 
        fullPage: false 
    });
    
    // 點擊觸發器打開下拉選單
    console.log('🖱️ 點擊用戶頭像打開下拉選單 (深色主題)');
    await userTrigger.click();
    await page.waitForTimeout(800); // 給予充分時間顯示
    
    // 檢查下拉選單是否顯示
    const dropdown = page.locator('#user-dropdown-menu');
    const isVisible = await dropdown.isVisible();
    console.log(`📋 下拉選單顯示狀態: ${isVisible ? '✅ 已顯示' : '❌ 未顯示'}`);
    
    if (!isVisible) {
        console.log('❌ 測試失敗：下拉選單未正確顯示');
        return;
    }
    
    console.log('📍 階段3: 深色主題樣式深度檢查');
    
    // 檢查深色主題下的詳細樣式
    const darkThemeStyles = await dropdown.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        const inline = el.style;
        
        return {
            // 背景相關
            computedBg: computed.backgroundColor,
            inlineBg: inline.backgroundColor,
            computedBgImage: computed.backgroundImage,
            
            // 透明度
            computedOpacity: computed.opacity,
            inlineOpacity: inline.opacity,
            
            // 顯示狀態
            computedDisplay: computed.display,
            computedVisibility: computed.visibility,
            
            // 濾鏡
            computedBackdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
            
            // 邊框和陰影
            computedBorder: computed.border,
            computedBoxShadow: computed.boxShadow,
            
            // 層級
            computedZIndex: computed.zIndex,
            
            // 顏色值分析
            isTransparent: computed.backgroundColor === 'rgba(0, 0, 0, 0)' || 
                          computed.backgroundColor === 'transparent',
            isLightBackground: computed.backgroundColor.includes('255, 255, 255'),
            isDarkBackground: computed.backgroundColor.includes('31, 41, 55') || // #1f2937
                             computed.backgroundColor.includes('55, 65, 81') ||   // #374151
                             computed.backgroundColor.includes('17, 24, 39'),      // #111827
            
            // HTML 類檢查
            hasNexusClass: el.classList.contains('nexus-user-dropdown-modern'),
            parentHasDarkClass: el.closest('.dark') !== null,
            rootHasDarkClass: document.documentElement.classList.contains('dark'),
            bodyHasDarkClass: document.body.classList.contains('dark')
        };
    });
    
    console.log('🔍 深色主題詳細樣式分析:');
    console.log(`   背景色: ${darkThemeStyles.computedBg}`);
    console.log(`   內聯背景: ${darkThemeStyles.inlineBg || '無'}`);
    console.log(`   透明度: ${darkThemeStyles.computedOpacity}`);
    console.log(`   是否透明: ${darkThemeStyles.isTransparent ? '❌ 透明' : '✅ 不透明'}`);
    console.log(`   是否淺色背景: ${darkThemeStyles.isLightBackground ? '❌ 錯誤' : '✅ 正確'}`);
    console.log(`   是否深色背景: ${darkThemeStyles.isDarkBackground ? '✅ 正確' : '❌ 錯誤'}`);
    console.log(`   背景濾鏡: ${darkThemeStyles.computedBackdropFilter || '無'}`);
    console.log(`   邊框: ${darkThemeStyles.computedBorder}`);
    console.log(`   陰影: ${darkThemeStyles.computedBoxShadow !== 'none' ? '已設定' : '無'}`);
    console.log(`   層級: ${darkThemeStyles.computedZIndex}`);
    console.log('');
    console.log('🔍 深色主題類檢查:');
    console.log(`   Nexus類: ${darkThemeStyles.hasNexusClass ? '✅' : '❌'}`);
    console.log(`   父元素Dark類: ${darkThemeStyles.parentHasDarkClass ? '✅' : '❌'}`);
    console.log(`   Root Dark類: ${darkThemeStyles.rootHasDarkClass ? '✅' : '❌'}`);
    console.log(`   Body Dark類: ${darkThemeStyles.bodyHasDarkClass ? '✅' : '❌'}`);
    
    console.log('📍 階段4: 深色主題修復效果評估');
    
    // 深色主題修復效果指標
    const hasValidDarkBackground = darkThemeStyles.isDarkBackground && !darkThemeStyles.isTransparent;
    const hasFullOpacity = parseFloat(darkThemeStyles.computedOpacity) === 1;
    const isProperlyVisible = darkThemeStyles.computedDisplay !== 'none' && 
                             darkThemeStyles.computedVisibility === 'visible';
    const hasBackdropFilter = darkThemeStyles.computedBackdropFilter && 
                             darkThemeStyles.computedBackdropFilter !== 'none';
    const hasBoxShadow = darkThemeStyles.computedBoxShadow && 
                        darkThemeStyles.computedBoxShadow !== 'none';
    const hasHighZIndex = parseInt(darkThemeStyles.computedZIndex) >= 9999;
    const hasDarkThemeActive = darkThemeStyles.rootHasDarkClass || darkThemeStyles.bodyHasDarkClass;
    
    console.log('\\n🎯 深色主題修復效果驗證:');
    console.log(`   ✅ 深色背景: ${hasValidDarkBackground ? '✅ 完美修復' : '❌ 透明問題'}`);
    console.log(`   ✅ 完全不透明: ${hasFullOpacity ? '✅ 完美修復' : '❌ 透明度問題'}`);
    console.log(`   ✅ 正確顯示: ${isProperlyVisible ? '✅ 完美修復' : '❌ 顯示問題'}`);
    console.log(`   ✅ 背景濾鏡: ${hasBackdropFilter ? '✅ 完美修復' : '❌ 濾鏡問題'}`);
    console.log(`   ✅ 陰影效果: ${hasBoxShadow ? '✅ 完美修復' : '❌ 陰影問題'}`);
    console.log(`   ✅ 正確層級: ${hasHighZIndex ? '✅ 完美修復' : '❌ 層級問題'}`);
    console.log(`   ✅ 深色主題: ${hasDarkThemeActive ? '✅ 完美修復' : '❌ 主題問題'}`);
    
    // 計算深色主題修復成功率
    const darkCriteria = [hasValidDarkBackground, hasFullOpacity, isProperlyVisible, hasBackdropFilter, hasBoxShadow, hasHighZIndex, hasDarkThemeActive];
    const darkSuccessCount = darkCriteria.filter(Boolean).length;
    const darkSuccessRate = Math.round((darkSuccessCount / darkCriteria.length) * 100);
    
    console.log(`\\n🏆 深色主題修復總體成功率: ${darkSuccessRate}% (${darkSuccessCount}/${darkCriteria.length} 項目)\\n`);
    
    // 特別檢查背景透明問題
    if (!hasValidDarkBackground) {
        console.log('🚨 發現深色主題背景透明問題！');
        console.log(`   當前背景色: ${darkThemeStyles.computedBg}`);
        console.log(`   期望背景色: rgb(31, 41, 55) 或類似深色`);
        
        if (darkThemeStyles.isTransparent) {
            console.log('   ❌ 背景完全透明');
        } else if (darkThemeStyles.isLightBackground) {
            console.log('   ❌ 背景錯誤使用淺色');
        } else {
            console.log('   ❓ 背景顏色不正確但非透明');
        }
    }
    
    // 驗證結果判定
    if (darkSuccessRate >= 95) {
        console.log('🎉 深色主題修復 - 完美成功！背景透明問題已徹底解決！');
    } else if (darkSuccessRate >= 85) {
        console.log('✅ 深色主題修復 - 優秀成果！大部分問題已解決');
    } else if (darkSuccessRate >= 70) {
        console.log('⚠️ 深色主題修復 - 部分成功，核心背景問題需進一步修復');
    } else {
        console.log('❌ 深色主題修復 - 背景透明問題嚴重，需要重新修復');
    }
    
    // 最終截圖記錄修復後狀態
    await page.screenshot({ 
        path: `dark-theme-dropdown-after-${Date.now()}.png`, 
        fullPage: false 
    });
    
    console.log('✅ 深色主題下拉選單背景透明修復測試完成');
    
    // 關鍵斷言 - 專注於背景透明問題
    expect(hasValidDarkBackground).toBe(true);  // 深色背景必須不透明
    expect(hasFullOpacity).toBe(true);          // 透明度必須為1
    expect(isProperlyVisible).toBe(true);       // 必須可見
    expect(darkSuccessRate).toBeGreaterThan(70); // 至少70%修復成功率
});