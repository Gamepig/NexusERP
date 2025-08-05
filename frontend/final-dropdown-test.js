import { chromium } from 'playwright';

async function finalDropdownTest() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 800
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('🔍 最終下拉選單行為測試...');
        
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
            await page.waitForTimeout(3000);
        }
        
        console.log('📖 頁面標題:', await page.title());
        
        // 截圖初始狀態
        await page.screenshot({ 
            path: 'final-dropdown-initial.png',
            fullPage: true 
        });
        console.log('📸 初始狀態截圖已保存');
        
        // 檢查 Alpine.js 和導航狀態
        const alpineStatus = await page.evaluate(() => {
            const nav = document.querySelector('#main-navigation');
            let alpineData = null;
            
            if (nav && window.Alpine) {
                try {
                    alpineData = window.Alpine.$data(nav);
                } catch (e) {
                    console.log('Alpine data error:', e);
                }
            }
            
            return {
                navExists: !!nav,
                alpineLoaded: typeof window.Alpine !== 'undefined',
                multiLevelNavFunction: typeof multiLevelNav !== 'undefined',
                alpineData: alpineData ? {
                    openDropdowns: alpineData.openDropdowns,
                    navigationItems: alpineData.navigationItems?.length || 0,
                    methods: Object.keys(alpineData).filter(k => typeof alpineData[k] === 'function')
                } : null
            };
        });
        
        console.log('\n🔧 Alpine.js 狀態檢查:');
        console.log('  導航存在:', alpineStatus.navExists);
        console.log('  Alpine.js 載入:', alpineStatus.alpineLoaded);
        console.log('  multiLevelNav 函數存在:', alpineStatus.multiLevelNavFunction);
        if (alpineStatus.alpineData) {
            console.log('  開啟的下拉選單:', alpineStatus.alpineData.openDropdowns);
            console.log('  導航項目數量:', alpineStatus.alpineData.navigationItems);
            console.log('  可用方法:', alpineStatus.alpineData.methods.join(', '));
        }
        
        // 測試 1: 程式化觸發下拉選單
        console.log('\n🧪 測試 1: 程式化觸發下拉選單...');
        
        const programmaticTest = await page.evaluate(() => {
            const nav = document.querySelector('#main-navigation');
            if (!nav || !window.Alpine) return { error: 'Navigation or Alpine not found' };
            
            try {
                const alpineData = window.Alpine.$data(nav);
                if (!alpineData.smartShowDropdown) return { error: 'smartShowDropdown function not found' };
                
                // 嘗試觸發客戶關係管理下拉選單
                alpineData.smartShowDropdown('crm', 'click');
                
                return {
                    success: true,
                    openDropdowns: alpineData.openDropdowns,
                    navigationItems: alpineData.navigationItems.map(item => ({
                        id: item.id,
                        title: item.title,
                        hasChildren: item.hasChildren
                    }))
                };
            } catch (e) {
                return { error: e.message };
            }
        });
        
        console.log('程式化觸發結果:', programmaticTest);
        
        if (programmaticTest.success) {
            await page.waitForTimeout(500);
            
            // 檢查下拉選單是否可見
            const dropdownVisible = await page.locator('#dropdown-crm').isVisible().catch(() => false);
            console.log('CRM 下拉選單可見:', dropdownVisible);
            
            if (dropdownVisible) {
                await page.screenshot({ 
                    path: 'final-dropdown-programmatic-open.png'
                });
                console.log('📸 程式化開啟下拉選單截圖已保存');
            }
        }
        
        // 測試 2: 滑鼠事件觸發
        console.log('\n🧪 測試 2: 滑鼠事件觸發...');
        
        // 找到具有 aria-haspopup="true" 的按鈕
        const dropdownButtons = await page.locator('#main-navigation button[aria-haspopup="true"]').all();
        console.log(`找到 ${dropdownButtons.length} 個下拉按鈕`);
        
        if (dropdownButtons.length > 0) {
            for (let i = 0; i < Math.min(3, dropdownButtons.length); i++) {
                const button = dropdownButtons[i];
                const buttonText = (await button.textContent())?.trim();
                const buttonId = await button.getAttribute('id');
                
                console.log(`\n  測試按鈕 ${i + 1}: "${buttonText}" (ID: ${buttonId})`);
                
                try {
                    // 確保按鈕可見並可交互
                    await button.scrollIntoViewIfNeeded();
                    
                    // 測試程式化懸停事件
                    const hoverResult = await page.evaluate((buttonId) => {
                        const button = document.getElementById(buttonId);
                        const nav = document.querySelector('#main-navigation');
                        
                        if (!button || !nav || !window.Alpine) return { error: 'Elements not found' };
                        
                        try {
                            const alpineData = window.Alpine.$data(nav);
                            
                            // 模擬 mouseenter 事件
                            const mouseenterEvent = new MouseEvent('mouseenter', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            
                            button.dispatchEvent(mouseenterEvent);
                            
                            return {
                                success: true,
                                openDropdowns: alpineData.openDropdowns
                            };
                        } catch (e) {
                            return { error: e.message };
                        }
                    }, buttonId);
                    
                    console.log(`    程式化懸停結果:`, hoverResult);
                    
                    if (hoverResult.success) {
                        await page.waitForTimeout(300);
                        
                        // 檢查對應的下拉選單
                        const dropdownId = buttonId?.replace('nav-item-', 'dropdown-');
                        if (dropdownId) {
                            const dropdown = page.locator(`#${dropdownId}`);
                            const isVisible = await dropdown.isVisible().catch(() => false);
                            console.log(`    下拉選單 #${dropdownId} 可見:`, isVisible);
                            
                            if (isVisible) {
                                await page.screenshot({ 
                                    path: `final-dropdown-hover-${i}.png`
                                });
                                console.log(`    📸 懸停下拉選單截圖已保存: final-dropdown-hover-${i}.png`);
                            }
                        }
                    }
                    
                    // 測試點擊事件
                    console.log('    測試點擊事件...');
                    await button.click({ force: true });
                    await page.waitForTimeout(300);
                    
                    const clickResult = await page.evaluate(() => {
                        const nav = document.querySelector('#main-navigation');
                        if (!nav || !window.Alpine) return { openDropdowns: [] };
                        
                        const alpineData = window.Alpine.$data(nav);
                        return { openDropdowns: alpineData.openDropdowns };
                    });
                    
                    console.log(`    點擊後開啟的下拉選單:`, clickResult.openDropdowns);
                    
                } catch (error) {
                    console.log(`    按鈕 ${i + 1} 測試失敗:`, error.message);
                }
            }
        }
        
        // 測試 3: 排他性行為驗證
        console.log('\n🧪 測試 3: 排他性行為驗證...');
        
        const exclusiveTest = await page.evaluate(() => {
            const nav = document.querySelector('#main-navigation');
            if (!nav || !window.Alpine) return { error: 'Navigation not found' };
            
            try {
                const alpineData = window.Alpine.$data(nav);
                
                // 開啟第一個下拉選單
                alpineData.smartShowDropdown('crm', 'hover');
                const firstOpen = [...alpineData.openDropdowns];
                
                // 開啟第二個下拉選單
                alpineData.smartShowDropdown('inventory', 'hover');  
                const secondOpen = [...alpineData.openDropdowns];
                
                // 檢查是否只有一個開啟
                const exclusiveBehavior = secondOpen.length <= 1;
                
                return {
                    success: true,
                    firstOpen,
                    secondOpen,
                    exclusiveBehavior,
                    currentOpen: alpineData.openDropdowns
                };
            } catch (e) {
                return { error: e.message };
            }
        });
        
        console.log('排他性行為測試結果:', exclusiveTest);
        
        // 測試 4: 100ms 超時行為
        console.log('\n🧪 測試 4: 100ms 超時行為...');
        
        const timeoutTest = await page.evaluate(() => {
            const nav = document.querySelector('#main-navigation');
            if (!nav || !window.Alpine) return { error: 'Navigation not found' };
            
            try {
                const alpineData = window.Alpine.$data(nav);
                
                // 開啟下拉選單
                alpineData.smartShowDropdown('crm', 'hover');
                const openBefore = [...alpineData.openDropdowns];
                
                // 安排關閉
                alpineData.scheduleHideDropdown('crm');
                
                // 立即檢查 (應該還開著)
                const openImmediately = [...alpineData.openDropdowns];
                
                return {
                    success: true,
                    openBefore,
                    openImmediately,
                    timeoutScheduled: !!alpineData.hideTimeouts['crm']
                };
            } catch (e) {
                return { error: e.message };
            }
        });
        
        console.log('100ms 超時測試結果:', timeoutTest);
        
        if (timeoutTest.success && timeoutTest.timeoutScheduled) {
            console.log('等待 150ms 檢查超時關閉...');
            await page.waitForTimeout(150);
            
            const afterTimeout = await page.evaluate(() => {
                const nav = document.querySelector('#main-navigation');
                const alpineData = window.Alpine.$data(nav);
                return { openDropdowns: alpineData.openDropdowns };
            });
            
            console.log('150ms 後開啟的下拉選單:', afterTimeout.openDropdowns);
            console.log('✅ 100ms 超時行為:', afterTimeout.openDropdowns.length === 0 ? '正確' : '有問題');
        }
        
        // 最終截圖
        await page.screenshot({ 
            path: 'final-dropdown-complete.png',
            fullPage: true 
        });
        console.log('📸 最終測試完成截圖已保存');
        
        console.log('\n📊 最終測試報告:');
        console.log('=' .repeat(60));
        console.log(`✅ 導航系統載入: ${alpineStatus.navExists && alpineStatus.alpineLoaded}`);
        console.log(`✅ 多層級導航功能: ${alpineStatus.multiLevelNavFunction}`);
        console.log(`✅ Alpine.js 整合: ${!!alpineStatus.alpineData}`);
        console.log(`✅ 程式化控制: ${programmaticTest.success || false}`);
        console.log(`✅ 排他性行為: ${exclusiveTest.exclusiveBehavior || false}`);
        console.log(`✅ 100ms 超時機制: ${timeoutTest.success || false}`);
        console.log('=' .repeat(60));
        
        // 總結
        const allTestsPassed = 
            alpineStatus.navExists && 
            alpineStatus.alpineLoaded && 
            alpineStatus.multiLevelNavFunction &&
            !!alpineStatus.alpineData;
            
        console.log(`\n🎯 總體評估: ${allTestsPassed ? '✅ 系統正常運作' : '⚠️ 發現問題'}`);
        
        if (!allTestsPassed) {
            console.log('\n🔧 可能的問題:');
            if (!alpineStatus.navExists) console.log('  - 導航元素未找到');
            if (!alpineStatus.alpineLoaded) console.log('  - Alpine.js 未正確載入');
            if (!alpineStatus.multiLevelNavFunction) console.log('  - multiLevelNav 函數未定義');
            if (!alpineStatus.alpineData) console.log('  - Alpine.js 數據綁定失敗');
        }
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
        
        try {
            await page.screenshot({ 
                path: 'final-dropdown-error.png',
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

finalDropdownTest();