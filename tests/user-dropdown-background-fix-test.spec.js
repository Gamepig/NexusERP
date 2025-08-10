import { test, expect } from '@playwright/test';

/**
 * 用戶下拉選單背景透明問題修復驗證測試
 */
test('用戶下拉選單背景修復驗證', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('🔍 測試用戶下拉選單背景修復效果');
    
    // 導航到儀表板頁面
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 檢查用戶觸發器是否存在
    const userTrigger = page.locator('#user-menu-trigger');
    const userTriggerExists = await userTrigger.count() > 0;
    console.log(`👤 用戶選單觸發器: ${userTriggerExists ? '存在' : '不存在'}`);
    
    if (userTriggerExists) {
        // 點擊用戶頭像打開下拉選單
        console.log('🖱️ 點擊用戶頭像打開下拉選單');
        await userTrigger.click();
        await page.waitForTimeout(500);
        
        // 檢查下拉選單是否顯示
        const dropdown = page.locator('#user-dropdown-menu');
        const isVisible = await dropdown.isVisible();
        console.log(`📋 下拉選單顯示狀態: ${isVisible ? '已顯示' : '未顯示'}`);
        
        if (isVisible) {
            // 檢查CSS樣式 - 背景相關屬性
            const backgroundStyles = await dropdown.evaluate((el) => {
                const computed = window.getComputedStyle(el);
                return {
                    background: computed.background,
                    backgroundColor: computed.backgroundColor,
                    backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
                    boxShadow: computed.boxShadow,
                    borderRadius: computed.borderRadius,
                    border: computed.border,
                    opacity: computed.opacity,
                    zIndex: computed.zIndex
                };
            });
            
            console.log('🎨 下拉選單樣式分析:');
            console.log(`   背景色: ${backgroundStyles.backgroundColor}`);
            console.log(`   背景濾鏡: ${backgroundStyles.backdropFilter || '無'}`);
            console.log(`   陰影: ${backgroundStyles.boxShadow !== 'none' ? '已設定' : '無'}`);
            console.log(`   邊框圓角: ${backgroundStyles.borderRadius}`);
            console.log(`   邊框: ${backgroundStyles.border}`);
            console.log(`   透明度: ${backgroundStyles.opacity}`);
            console.log(`   層級: ${backgroundStyles.zIndex}`);
            
            // 檢查修復效果指標
            const hasBackdropFilter = backgroundStyles.backdropFilter && 
                                    backgroundStyles.backdropFilter !== 'none' && 
                                    backgroundStyles.backdropFilter.includes('blur');
            const hasProperBackground = backgroundStyles.backgroundColor && 
                                      backgroundStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                                      backgroundStyles.backgroundColor !== 'transparent';
            const hasBoxShadow = backgroundStyles.boxShadow && backgroundStyles.boxShadow !== 'none';
            const hasHighZIndex = parseInt(backgroundStyles.zIndex) >= 9999;
            
            console.log('\\n✅ 修復效果驗證:');
            console.log(`   背景濾鏡 (backdrop-filter): ${hasBackdropFilter ? '✅ 已修復' : '❌ 未修復'}`);
            console.log(`   不透明背景: ${hasProperBackground ? '✅ 已修復' : '❌ 未修復'}`);
            console.log(`   陰影效果: ${hasBoxShadow ? '✅ 已設定' : '❌ 未設定'}`);
            console.log(`   正確層級: ${hasHighZIndex ? '✅ 已設定' : '❌ 未設定'}`);
            
            // 檢查選單項目的樣式
            const menuItems = dropdown.locator('.nexus-user-menu-item-modern');
            const menuItemCount = await menuItems.count();
            console.log(`\\n📄 選單項目數量: ${menuItemCount}`);
            
            if (menuItemCount > 0) {
                // 測試第一個選單項目的懸停效果
                const firstItem = menuItems.first();
                console.log('🖱️ 測試選單項目懸停效果');
                
                await firstItem.hover();
                await page.waitForTimeout(200);
                
                const hoverStyles = await firstItem.evaluate((el) => {
                    const computed = window.getComputedStyle(el);
                    return {
                        backgroundColor: computed.backgroundColor,
                        transform: computed.transform,
                        backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
                        boxShadow: computed.boxShadow
                    };
                });
                
                console.log('   懸停效果驗證:');
                console.log(`     背景變化: ${hoverStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' ? '✅' : '❌'}`);
                console.log(`     變換效果: ${hoverStyles.transform !== 'none' ? '✅' : '❌'}`);
                console.log(`     濾鏡效果: ${hoverStyles.backdropFilter && hoverStyles.backdropFilter !== 'none' ? '✅' : '❌'}`);
            }
            
            // 測試主題切換下的效果
            console.log('\\n🌙 測試深色主題下的效果');
            const themeToggle = page.locator('[aria-label="切換主題"]').first();
            if (await themeToggle.count() > 0) {
                await themeToggle.click();
                await page.waitForTimeout(1000);
                
                const darkThemeStyles = await dropdown.evaluate((el) => {
                    const computed = window.getComputedStyle(el);
                    return {
                        backgroundColor: computed.backgroundColor,
                        backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
                    };
                });
                
                console.log(`   深色主題背景: ${darkThemeStyles.backgroundColor}`);
                console.log(`   深色主題濾鏡: ${darkThemeStyles.backdropFilter || '無'}`);
                
                // 切換回淺色主題
                await themeToggle.click();
                await page.waitForTimeout(1000);
            }
            
            // 綜合修復狀態評估
            const fixScore = [hasBackdropFilter, hasProperBackground, hasBoxShadow, hasHighZIndex]
                .filter(Boolean).length;
            const fixPercentage = (fixScore / 4) * 100;
            
            console.log(`\\n🏆 修復完成度: ${fixPercentage}% (${fixScore}/4 項目)\\n`);
            
            if (fixPercentage >= 75) {
                console.log('✅ 用戶下拉選單背景透明問題已成功修復！');
            } else {
                console.log('⚠️ 用戶下拉選單背景仍需進一步調整');
            }
            
        } else {
            console.log('❌ 下拉選單未正確顯示，無法進行樣式驗證');
        }
        
        // 截圖記錄修復效果 (下拉選單開啟狀態)
        await page.screenshot({ 
            path: `user-dropdown-fix-verification-${Date.now()}.png`, 
            fullPage: false 
        });
        
    } else {
        console.log('❌ 未找到用戶選單觸發器，無法測試');
    }
    
    console.log('✅ 用戶下拉選單背景修復驗證完成');
});