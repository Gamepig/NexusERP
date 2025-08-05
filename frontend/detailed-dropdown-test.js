import { chromium } from 'playwright';

async function detailedDropdownTest() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 300 // 減慢操作便於觀察
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('🔍 詳細測試 NexusERP 導航下拉選單行為...');
        
        // 登入並進入 dashboard
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
            console.log('🔐 進行登入...');
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000);
            await page.goto('http://127.0.0.1:8000/dashboard');
            await page.waitForTimeout(2000);
        }
        
        console.log('📖 當前頁面標題:', await page.title());
        
        // 截圖初始狀態
        await page.screenshot({ 
            path: 'detailed-dropdown-initial.png',
            fullPage: true 
        });
        
        // 查找多層級導航容器
        const navContainers = await page.locator('[x-data*="multiLevelNav"]').all();
        console.log(`🎯 找到 ${navContainers.length} 個多層級導航容器`);
        
        if (navContainers.length > 0) {
            // 測試每個導航容器
            for (let containerIndex = 0; containerIndex < navContainers.length; containerIndex++) {
                const container = navContainers[containerIndex];
                console.log(`\n📦 測試第 ${containerIndex + 1} 個導航容器...`);
                
                // 查找容器內的下拉按鈕
                const dropdownButtons = await container.locator('button[aria-haspopup="true"]').all();
                console.log(`   🔘 找到 ${dropdownButtons.length} 個下拉按鈕`);
                
                // 測試前三個下拉按鈕
                for (let i = 0; i < Math.min(dropdownButtons.length, 3); i++) {
                    const button = dropdownButtons[i];
                    const buttonText = await button.textContent();
                    console.log(`\n   🧪 測試按鈕 ${i + 1}: "${buttonText?.trim()}"`);
                    
                    // 獲取按鈕的相關屬性
                    const ariaExpanded = await button.getAttribute('aria-expanded');
                    const buttonId = await button.getAttribute('id');
                    console.log(`      初始 aria-expanded: ${ariaExpanded}`);
                    console.log(`      按鈕 ID: ${buttonId}`);
                    
                    // 測試 1: 懸停觸發
                    console.log('      🖱️  測試懸停觸發...');
                    await button.hover();
                    await page.waitForTimeout(500);
                    
                    // 檢查 aria-expanded 是否變化
                    const ariaExpandedAfterHover = await button.getAttribute('aria-expanded');
                    console.log(`      懸停後 aria-expanded: ${ariaExpandedAfterHover}`);
                    
                    // 查找對應的下拉選單
                    const dropdownId = buttonId ? buttonId.replace('nav-item-', 'dropdown-') : null;
                    if (dropdownId) {
                        const dropdown = page.locator(`#${dropdownId}`);
                        const dropdownVisible = await dropdown.isVisible().catch(() => false);
                        console.log(`      下拉選單 #${dropdownId} 可見: ${dropdownVisible}`);
                        
                        if (dropdownVisible) {
                            // 截圖下拉選單開啟狀態
                            await page.screenshot({ 
                                path: `dropdown-open-${containerIndex}-${i}.png`
                            });
                            console.log(`      📸 截圖已保存: dropdown-open-${containerIndex}-${i}.png`);
                            
                            // 檢查下拉選單內容
                            const menuItems = await dropdown.locator('a, button').all();
                            console.log(`      📋 下拉選單項目數量: ${menuItems.length}`);
                            
                            // 測試移開滑鼠
                            console.log('      🖱️  移開滑鼠...');
                            await page.mouse.move(100, 100);
                            await page.waitForTimeout(200); // 等待 100ms 超時時間 + 緩衝
                            
                            const dropdownHiddenAfterMove = await dropdown.isHidden().catch(() => true);
                            console.log(`      移開後下拉選單關閉: ${dropdownHiddenAfterMove}`);
                        }
                    }
                    
                    // 測試 2: 點擊觸發
                    console.log('      👆 測試點擊觸發...');
                    await button.click();
                    await page.waitForTimeout(300);
                    
                    const ariaExpandedAfterClick = await button.getAttribute('aria-expanded');
                    console.log(`      點擊後 aria-expanded: ${ariaExpandedAfterClick}`);
                    
                    if (dropdownId) {
                        const dropdown = page.locator(`#${dropdownId}`);
                        const dropdownVisibleAfterClick = await dropdown.isVisible().catch(() => false);
                        console.log(`      點擊後下拉選單可見: ${dropdownVisibleAfterClick}`);
                    }
                    
                    // 測試點擊外部關閉
                    console.log('      🖱️  測試點擊外部關閉...');
                    await page.click('body', { position: { x: 50, y: 50 } });
                    await page.waitForTimeout(300);
                    
                    if (dropdownId) {
                        const dropdown = page.locator(`#${dropdownId}`);
                        const dropdownHiddenAfterOutsideClick = await dropdown.isHidden().catch(() => true);
                        console.log(`      點擊外部後下拉選單關閉: ${dropdownHiddenAfterOutsideClick}`);
                    }
                }
                
                // 測試排他性行為
                if (dropdownButtons.length >= 2) {
                    console.log(`\n   🎯 測試排他性行為...`);
                    
                    // 懸停第一個按鈕
                    console.log('      🖱️  懸停第一個按鈕...');
                    await dropdownButtons[0].hover();
                    await page.waitForTimeout(200);
                    
                    // 檢查第一個下拉選單狀態
                    const firstButtonId = await dropdownButtons[0].getAttribute('id');
                    const firstDropdownId = firstButtonId ? firstButtonId.replace('nav-item-', 'dropdown-') : null;
                    const firstDropdownOpen = firstDropdownId ? 
                        await page.locator(`#${firstDropdownId}`).isVisible().catch(() => false) : false;
                    console.log(`      第一個下拉選單開啟: ${firstDropdownOpen}`);
                    
                    // 立即懸停第二個按鈕
                    console.log('      🖱️  懸停第二個按鈕...');
                    await dropdownButtons[1].hover();
                    await page.waitForTimeout(200);
                    
                    // 檢查兩個下拉選單的狀態
                    const secondButtonId = await dropdownButtons[1].getAttribute('id');
                    const secondDropdownId = secondButtonId ? secondButtonId.replace('nav-item-', 'dropdown-') : null;
                    
                    const firstDropdownStillOpen = firstDropdownId ? 
                        await page.locator(`#${firstDropdownId}`).isVisible().catch(() => false) : false;
                    const secondDropdownOpen = secondDropdownId ? 
                        await page.locator(`#${secondDropdownId}`).isVisible().catch(() => false) : false;
                    
                    console.log(`      第一個下拉選單仍開啟: ${firstDropdownStillOpen}`);
                    console.log(`      第二個下拉選單開啟: ${secondDropdownOpen}`);
                    
                    const exclusiveBehavior = !(firstDropdownStillOpen && secondDropdownOpen);
                    console.log(`      ✅ 排他性行為正確: ${exclusiveBehavior}`);
                    
                    // 截圖排他性測試
                    await page.screenshot({ 
                        path: `exclusive-behavior-${containerIndex}.png`
                    });
                    
                    // 測試 100ms 超時行為
                    console.log('   ⏱️  測試 100ms 超時行為...');
                    
                    // 懸停按鈕然後快速移開
                    await dropdownButtons[0].hover();
                    await page.waitForTimeout(50); // 不到 100ms
                    await page.mouse.move(500, 500); // 移到遠處
                    
                    console.log('      等待 150ms (超過 100ms 超時)...');
                    await page.waitForTimeout(150);
                    
                    const dropdownAfterTimeout = firstDropdownId ? 
                        await page.locator(`#${firstDropdownId}`).isVisible().catch(() => false) : false;
                    console.log(`      100ms 超時後下拉選單關閉: ${!dropdownAfterTimeout}`);
                }
            }
        }
        
        // 檢查 JavaScript 函數是否存在
        console.log('\n🔧 檢查 JavaScript 函數...');
        
        const jsCheck = await page.evaluate(() => {
            // 檢查 multiLevelNav 函數是否存在
            const multiLevelNavExists = typeof multiLevelNav === 'function';
            
            // 檢查 Alpine.js 數據
            const alpineData = document.querySelector('[x-data*="multiLevelNav"]');
            let alpineInstance = null;
            if (alpineData && window.Alpine) {
                try {
                    alpineInstance = window.Alpine.$data(alpineData);
                } catch (e) {
                    // 可能還沒初始化
                }
            }
            
            return {
                multiLevelNavFunction: multiLevelNavExists,
                alpineDataFound: !!alpineData,
                alpineInstanceMethods: alpineInstance ? Object.keys(alpineInstance) : [],
                openDropdowns: alpineInstance ? alpineInstance.openDropdowns : null
            };
        });
        
        console.log('   🔧 multiLevelNav 函數存在:', jsCheck.multiLevelNavFunction);
        console.log('   🔧 Alpine 數據元素找到:', jsCheck.alpineDataFound);
        console.log('   🔧 Alpine 實例方法:', jsCheck.alpineInstanceMethods);
        console.log('   🔧 當前開啟的下拉選單:', jsCheck.openDropdowns);
        
        // 最終截圖
        await page.screenshot({ 
            path: 'detailed-dropdown-final.png',
            fullPage: true 
        });
        
        console.log('\n✅ 詳細下拉選單測試完成!');
        
        // 生成報告
        console.log('\n📊 詳細測試報告:');
        console.log('=' .repeat(60));
        console.log(`🎯 多層級導航容器數量: ${navContainers.length}`);
        console.log(`🔧 JavaScript 函數正常: ${jsCheck.multiLevelNavFunction}`);
        console.log(`🏔️  Alpine.js 整合正常: ${jsCheck.alpineDataFound}`);
        console.log(`📋 Alpine 實例方法: ${jsCheck.alpineInstanceMethods.join(', ')}`);
        console.log('=' .repeat(60));
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
        
        try {
            await page.screenshot({ 
                path: 'detailed-dropdown-error.png',
                fullPage: true 
            });
            console.log('📸 錯誤狀態截圖已保存');
        } catch (screenshotError) {
            console.error('截圖保存失敗:', screenshotError);
        }
    } finally {
        await browser.close();
    }
}

// 執行測試
detailedDropdownTest();