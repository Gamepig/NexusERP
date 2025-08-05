import { chromium } from 'playwright';

async function investigateAlpineIssue() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // 監聽所有控制台訊息
        page.on('console', (msg) => {
            console.log(`🖥️  [${msg.type().toUpperCase()}] ${msg.text()}`);
        });
        
        // 監聽錯誤
        page.on('pageerror', (error) => {
            console.log('🚨 頁面錯誤:', error.message);
        });
        
        console.log('🔍 調查 Alpine.js 初始化問題...');
        
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
        
        // 詳細檢查 Alpine.js 和函數狀態
        const detailedCheck = await page.evaluate(() => {
            const results = {
                window: {
                    Alpine: typeof window.Alpine,
                    multiLevelNav: typeof multiLevelNav
                },
                elements: {
                    mainNav: !!document.querySelector('#main-navigation'),
                    multiLevelNavElements: document.querySelectorAll('[x-data*="multiLevelNav"]').length
                },
                alpineDetails: null,
                functionSource: null,
                errors: []
            };
            
            // 檢查 Alpine.js 詳細資訊
            if (window.Alpine) {
                results.alpineDetails = {
                    version: window.Alpine.version || 'unknown',
                    started: window.Alpine.version ? true : false
                };
            }
            
            // 檢查 multiLevelNav 函數源碼
            if (typeof multiLevelNav === 'function') {
                results.functionSource = multiLevelNav.toString().substring(0, 300) + '...';
            }
            
            // 嘗試手動初始化一個 Alpine 組件
            try {
                const nav = document.querySelector('#main-navigation');
                if (nav && window.Alpine) {
                    const xDataAttr = nav.getAttribute('x-data');
                    results.xDataAttribute = xDataAttr;
                    
                    // 嘗試獲取 Alpine 數據
                    try {
                        const alpineData = window.Alpine.$data(nav);
                        results.alpineDataKeys = Object.keys(alpineData);
                        results.alpineDataMethods = Object.keys(alpineData).filter(k => typeof alpineData[k] === 'function');
                        
                        // 檢查特定方法
                        results.specificMethods = {
                            smartShowDropdown: typeof alpineData.smartShowDropdown,
                            hideAllDropdownsExcept: typeof alpineData.hideAllDropdownsExcept,
                            scheduleHideDropdown: typeof alpineData.scheduleHideDropdown
                        };
                    } catch (e) {
                        results.errors.push('Alpine data access error: ' + e.message);
                    }
                }
            } catch (e) {
                results.errors.push('Manual initialization error: ' + e.message);
            }
            
            return results;
        });
        
        console.log('\n🔍 詳細檢查結果:');
        console.log('=' .repeat(50));
        console.log('🪟 Window 物件:');
        console.log('  Alpine:', detailedCheck.window.Alpine);
        console.log('  multiLevelNav:', detailedCheck.window.multiLevelNav);
        
        console.log('\n📄 DOM 元素:');
        console.log('  主導航存在:', detailedCheck.elements.mainNav);
        console.log('  多層級導航元素數量:', detailedCheck.elements.multiLevelNavElements);
        
        if (detailedCheck.alpineDetails) {
            console.log('\n🏔️  Alpine.js 詳情:');
            console.log('  版本:', detailedCheck.alpineDetails.version);
            console.log('  已啟動:', detailedCheck.alpineDetails.started);
        }
        
        if (detailedCheck.functionSource) {
            console.log('\n⚙️  multiLevelNav 函數源碼預覽:');
            console.log('  ', detailedCheck.functionSource);
        }
        
        if (detailedCheck.xDataAttribute) {
            console.log('\n📋 x-data 屬性:');
            console.log('  ', detailedCheck.xDataAttribute.substring(0, 100) + '...');
        }
        
        if (detailedCheck.alpineDataKeys) {
            console.log('\n🗝️  Alpine 數據鍵值:');
            console.log('  所有鍵值:', detailedCheck.alpineDataKeys.join(', '));
            console.log('  方法:', detailedCheck.alpineDataMethods.join(', '));
        }
        
        if (detailedCheck.specificMethods) {
            console.log('\n🔧 特定方法檢查:');
            console.log('  smartShowDropdown:', detailedCheck.specificMethods.smartShowDropdown);
            console.log('  hideAllDropdownsExcept:', detailedCheck.specificMethods.hideAllDropdownsExcept);
            console.log('  scheduleHideDropdown:', detailedCheck.specificMethods.scheduleHideDropdown);
        }
        
        if (detailedCheck.errors.length > 0) {
            console.log('\n🚨 錯誤訊息:');
            detailedCheck.errors.forEach(error => console.log('  ', error));
        }
        
        // 嘗試手動觸發一個下拉選單來測試事件處理
        console.log('\n🧪 測試事件處理...');
        
        const eventTest = await page.evaluate(() => {
            const nav = document.querySelector('#main-navigation');
            const button = nav?.querySelector('button[aria-haspopup="true"]');
            
            if (!button) return { error: 'No dropdown button found' };
            
            const results = {
                buttonFound: true,
                eventListeners: [],
                manualTrigger: null
            };
            
            // 檢查事件監聽器 (這個方法可能不會顯示 Alpine.js 綁定的事件)
            const events = ['mouseenter', 'mouseleave', 'click'];
            events.forEach(eventType => {
                // 嘗試觸發事件並檢查回應
                try {
                    const event = new MouseEvent(eventType, { bubbles: true });
                    const dispatched = button.dispatchEvent(event);
                    results.eventListeners.push({ type: eventType, dispatched });
                } catch (e) {
                    results.eventListeners.push({ type: eventType, error: e.message });
                }
            });
            
            // 嘗試檢查 Alpine.js 是否正確綁定到按鈕
            try {
                const alpineDirectives = button.getAttributeNames().filter(name => name.startsWith('@') || name.startsWith('x-'));
                results.alpineDirectives = alpineDirectives;
            } catch (e) {
                results.error = e.message;
            }
            
            return results;
        });
        
        console.log('事件測試結果:', eventTest);
        
        // 手動測試 Alpine.js 初始化
        console.log('\n🔄 嘗試手動重新初始化...');
        
        const reinitTest = await page.evaluate(() => {
            try {
                // 檢查是否可以手動調用 multiLevelNav
                const nav = document.querySelector('#main-navigation');
                if (!nav || typeof multiLevelNav !== 'function') {
                    return { error: 'Navigation element or function not found' };
                }
                
                // 獲取導航數據
                const xDataAttr = nav.getAttribute('x-data');
                const match = xDataAttr.match(/multiLevelNav\((.+?), '.+?'\)/);
                
                if (!match) {
                    return { error: 'Could not parse x-data attribute' };
                }
                
                // 嘗試手動創建實例 (僅用於測試)
                const navigationData = JSON.parse(match[1]);
                const instance = multiLevelNav(navigationData, 'dashboard');
                
                return {
                    success: true,
                    instanceMethods: Object.keys(instance).filter(k => typeof instance[k] === 'function'),
                    hasSmartShowDropdown: typeof instance.smartShowDropdown === 'function',
                    navigationItemsCount: instance.navigationItems?.length || 0
                };
            } catch (e) {
                return { error: e.message };
            }
        });
        
        console.log('手動初始化測試結果:', reinitTest);
        
        // 最終截圖
        await page.screenshot({ 
            path: 'alpine-investigation.png',
            fullPage: true 
        });
        console.log('📸 調查截圖已保存');
        
        console.log('\n📊 調查總結:');
        console.log('=' .repeat(60));
        
        const hasAlpine = detailedCheck.window.Alpine !== 'undefined';
        const hasFunction = detailedCheck.window.multiLevelNav !== 'undefined';
        const hasNav = detailedCheck.elements.mainNav;
        const hasData = detailedCheck.alpineDataKeys && detailedCheck.alpineDataKeys.length > 0;
        const hasMethods = detailedCheck.alpineDataMethods && detailedCheck.alpineDataMethods.length > 0;
        
        console.log(`✅ Alpine.js 載入: ${hasAlpine}`);
        console.log(`✅ multiLevelNav 函數: ${hasFunction}`);
        console.log(`✅ 導航元素存在: ${hasNav}`);
        console.log(`✅ Alpine 數據綁定: ${hasData}`);
        console.log(`❌ Alpine 方法綁定: ${hasMethods}`);
        
        if (reinitTest.success) {
            console.log(`✅ 手動初始化成功: ${reinitTest.hasSmartShowDropdown}`);
            console.log(`📋 實例方法數量: ${reinitTest.instanceMethods.length}`);
        } else {
            console.log(`❌ 手動初始化失敗: ${reinitTest.error}`);
        }
        
        console.log('=' .repeat(60));
        
        // 診斷建議
        console.log('\n💡 診斷建議:');
        if (!hasMethods && hasData) {
            console.log('  🔧 問題可能是 Alpine.js 組件初始化時機問題');
            console.log('  🔧 multiLevelNav 函數可能在 Alpine.js 解析 x-data 時未正確執行');
            console.log('  🔧 建議檢查腳本載入順序和 Alpine.js 初始化時機');
        }
        
        if (reinitTest.success && !hasMethods) {
            console.log('  ✅ multiLevelNav 函數本身運作正常');
            console.log('  ⚠️  問題在於 Alpine.js 與函數的整合');
        }
        
    } catch (error) {
        console.error('❌ 調查過程中發生錯誤:', error);
    } finally {
        await browser.close();
    }
}

investigateAlpineIssue();