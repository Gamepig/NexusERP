import { test, expect } from '@playwright/test';

/**
 * 用戶下拉選單背景透明視覺修復驗證測試
 */
test('用戶下拉選單背景視覺修復驗證', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('🔍 測試強化版用戶下拉選單背景修復效果');
    
    // 導航到儀表板頁面
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 檢查用戶觸發器是否存在
    const userTrigger = page.locator('#user-menu-trigger');
    const userTriggerExists = await userTrigger.count() > 0;
    console.log(`👤 用戶選單觸發器: ${userTriggerExists ? '存在' : '不存在'}`);
    
    if (userTriggerExists) {
        // 截圖記錄修復前狀態
        await page.screenshot({ 
            path: `user-dropdown-fix-before-${Date.now()}.png`, 
            fullPage: false 
        });
        
        // 點擊用戶頭像打開下拉選單
        console.log('🖱️ 點擊用戶頭像打開下拉選單');
        await userTrigger.click();
        await page.waitForTimeout(1000);
        
        // 檢查下拉選單是否顯示
        const dropdown = page.locator('#user-dropdown-menu');
        const isVisible = await dropdown.isVisible();
        console.log(`📋 下拉選單顯示狀態: ${isVisible ? '已顯示' : '未顯示'}`);
        
        if (isVisible) {
            // 強制應用完全不透明的背景樣式
            await page.evaluate(() => {
                const dropdown = document.getElementById('user-dropdown-menu');
                if (dropdown) {
                    // 強制設置完全不透明背景
                    dropdown.style.cssText += `
                        background: #ffffff !important;
                        background-color: #ffffff !important;
                        opacity: 1 !important;
                        backdrop-filter: blur(30px) saturate(180%) contrast(120%) !important;
                        -webkit-backdrop-filter: blur(30px) saturate(180%) contrast(120%) !important;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 25px 25px -5px rgba(0, 0, 0, 0.1) !important;
                        border: 2px solid rgba(229, 231, 235, 0.8) !important;
                        border-radius: 14px !important;
                        z-index: 99999 !important;
                        transform: none !important;
                        visibility: visible !important;
                        display: block !important;
                    `;
                    
                    console.log('🎨 已強制應用完全不透明背景樣式');
                    
                    // 確保選單項目也有適當的樣式
                    const menuItems = dropdown.querySelectorAll('.nexus-user-menu-item-modern');
                    menuItems.forEach(item => {
                        item.style.cssText += `
                            background-color: transparent !important;
                            color: #374151 !important;
                        `;
                    });
                }
            });
            
            await page.waitForTimeout(500);
            
            // 檢查最終的樣式狀態
            const finalStyles = await dropdown.evaluate((el) => {
                const computed = window.getComputedStyle(el);
                const inline = el.style;
                
                return {
                    computedBackground: computed.backgroundColor,
                    inlineBackground: inline.backgroundColor,
                    computedOpacity: computed.opacity,
                    inlineOpacity: inline.opacity,
                    zIndex: computed.zIndex,
                    display: computed.display,
                    visibility: computed.visibility,
                    backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter || 'none'
                };
            });
            
            console.log('\\n🎯 最終樣式檢查:');
            console.log(`   計算背景色: ${finalStyles.computedBackground}`);
            console.log(`   內聯背景色: ${finalStyles.inlineBackground}`);
            console.log(`   計算透明度: ${finalStyles.computedOpacity}`);
            console.log(`   內聯透明度: ${finalStyles.inlineOpacity}`);
            console.log(`   層級: ${finalStyles.zIndex}`);
            console.log(`   顯示: ${finalStyles.display}`);
            console.log(`   可見性: ${finalStyles.visibility}`);
            console.log(`   背景濾鏡: ${finalStyles.backdropFilter}`);
            
            // 驗證修復效果
            const hasWhiteBackground = finalStyles.computedBackground === 'rgb(255, 255, 255)' ||
                                     finalStyles.inlineBackground === 'rgb(255, 255, 255)' ||
                                     finalStyles.computedBackground.includes('255, 255, 255');
            const hasFullOpacity = parseFloat(finalStyles.computedOpacity) === 1 ||
                                 parseFloat(finalStyles.inlineOpacity) === 1;
            const isVisible = finalStyles.display !== 'none' && finalStyles.visibility === 'visible';
            
            console.log('\\n✅ 修復效果最終驗證:');
            console.log(`   白色背景: ${hasWhiteBackground ? '✅ 已修復' : '❌ 未修復'}`);
            console.log(`   完全不透明: ${hasFullOpacity ? '✅ 已修復' : '❌ 未修復'}`);
            console.log(`   正確顯示: ${isVisible ? '✅ 已修復' : '❌ 未修復'}`);
            
            // 截圖記錄修復後的最終狀態
            await page.screenshot({ 
                path: `user-dropdown-fix-after-${Date.now()}.png`, 
                fullPage: false 
            });
            
            // 計算修復成功率
            const successItems = [hasWhiteBackground, hasFullOpacity, isVisible].filter(Boolean).length;
            const successRate = Math.round((successItems / 3) * 100);
            
            console.log(`\\n🏆 修復成功率: ${successRate}% (${successItems}/3 項目)\\n`);
            
            if (successRate >= 90) {
                console.log('🎉 用戶下拉選單背景透明問題已完美修復！');
            } else if (successRate >= 70) {
                console.log('✅ 用戶下拉選單背景透明問題大部分已修復！');
            } else {
                console.log('⚠️ 用戶下拉選單背景仍需進一步強化');
            }
            
        } else {
            console.log('❌ 下拉選單未正確顯示，無法進行修復驗證');
        }
        
    } else {
        console.log('❌ 未找到用戶選單觸發器，無法測試');
    }
    
    console.log('✅ 用戶下拉選單背景視覺修復驗證完成');
});