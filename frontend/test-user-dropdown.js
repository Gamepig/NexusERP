// Playwright 測試：使用者下拉選單功能驗證
import { chromium } from 'playwright';

async function testUserDropdown() {
    console.log('🧪 開始測試使用者下拉選單...');
    
    // 啟動瀏覽器
    const browser = await chromium.launch({ 
        headless: false,  // 顯示瀏覽器窗口以便觀察
        slowMo: 1000     // 放慢操作速度以便觀察
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 訪問 NexusERP 首頁
        console.log('📍 導航到 NexusERP 首頁...');
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForTimeout(3000); // 等待頁面完全載入
        
        // 檢查頁面是否正確載入
        const title = await page.title();
        console.log(`📄 頁面標題: ${title}`);
        
        // 截圖 - 初始狀態
        await page.screenshot({ path: 'test-initial-state.png', fullPage: true });
        console.log('📸 已保存初始狀態截圖');
        
        // 查找使用者頭像/觸發按鈕
        console.log('🔍 尋找使用者下拉選單觸發器...');
        
        // 嘗試多種可能的選擇器
        const possibleSelectors = [
            '.nexus-user-trigger',
            '[data-testid="user-menu"]',
            'button[aria-haspopup="true"]',
            'button:has(.nexus-user-avatar)',
            '.nexus-user-avatar',
            'button:has(img[alt*="頭像"])',
            'button:has(div[class*="rounded-full"])',
            '[class*="user"]'
        ];
        
        let userTrigger = null;
        for (const selector of possibleSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    const isVisible = await element.isVisible();
                    if (isVisible) {
                        userTrigger = element;
                        console.log(`✅ 找到使用者觸發器: ${selector}`);
                        break;
                    }
                }
            } catch (e) {
                // 繼續嘗試下一個選擇器
            }
        }
        
        if (!userTrigger) {
            console.log('❌ 無法找到使用者下拉選單觸發器');
            console.log('🔍 嘗試查找所有可能的按鈕...');
            
            const allButtons = await page.$$('button');
            console.log(`找到 ${allButtons.length} 個按鈕`);
            
            for (let i = 0; i < allButtons.length; i++) {
                const button = allButtons[i];
                const text = await button.textContent();
                const className = await button.getAttribute('class');
                console.log(`按鈕 ${i}: "${text}" - class: "${className}"`);
            }
            
            return;
        }
        
        // 獲取觸發器位置信息
        const boundingBox = await userTrigger.boundingBox();
        console.log(`📍 觸發器位置: ${JSON.stringify(boundingBox)}`);
        
        // 點擊使用者觸發器
        console.log('🖱️ 點擊使用者觸發器...');
        await userTrigger.click();
        await page.waitForTimeout(500); // 等待下拉選單出現
        
        // 截圖 - 點擊後狀態
        await page.screenshot({ path: 'test-after-click.png', fullPage: true });
        console.log('📸 已保存點擊後狀態截圖');
        
        // 檢查下拉選單是否出現
        console.log('🔍 檢查下拉選單是否出現...');
        
        const dropdownSelectors = [
            '.nexus-user-dropdown',
            '[x-show="showUserMenu"]',
            '[class*="dropdown"]',
            '[role="menu"]',
            '[class*="user-menu"]'
        ];
        
        let dropdown = null;
        for (const selector of dropdownSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    const isVisible = await element.isVisible();
                    if (isVisible) {
                        dropdown = element;
                        console.log(`✅ 找到下拉選單: ${selector}`);
                        break;
                    }
                }
            } catch (e) {
                // 繼續嘗試
            }
        }
        
        if (dropdown) {
            // 獲取下拉選單信息
            const dropdownBox = await dropdown.boundingBox();
            console.log(`📍 下拉選單位置: ${JSON.stringify(dropdownBox)}`);
            
            // 檢查下拉選單內容
            const dropdownContent = await dropdown.textContent();
            console.log(`📝 下拉選單內容: "${dropdownContent}"`);
            
            // 測試下拉選單是否會立即消失
            console.log('⏱️ 測試下拉選單穩定性...');
            await page.waitForTimeout(2000); // 等待2秒
            
            const stillVisible = await dropdown.isVisible();
            if (stillVisible) {
                console.log('✅ 下拉選單保持顯示 - 穩定性良好');
                
                // 嘗試找到登出按鈕
                const logoutSelectors = [
                    'button:has-text("登出")',
                    'a:has-text("登出")',
                    'form[action*="logout"] button',
                    '.nexus-logout-item'
                ];
                
                for (const selector of logoutSelectors) {
                    try {
                        const logoutBtn = await page.$(selector);
                        if (logoutBtn && await logoutBtn.isVisible()) {
                            console.log(`✅ 找到登出按鈕: ${selector}`);
                            
                            // 測試是否可以點擊登出按鈕
                            console.log('🖱️ 測試點擊登出按鈕...');
                            const logoutBox = await logoutBtn.boundingBox();
                            console.log(`📍 登出按鈕位置: ${JSON.stringify(logoutBox)}`);
                            
                            break;
                        }
                    } catch (e) {
                        // 繼續嘗試
                    }
                }
            } else {
                console.log('❌ 下拉選單立即消失 - 存在問題');
            }
        } else {
            console.log('❌ 下拉選單未出現或不可見');
            
            // 檢查是否有任何新元素出現
            console.log('🔍 檢查頁面中所有可能的下拉選單元素...');
            
            const allElements = await page.$$('[style*="display"], [x-show], [class*="show"], [class*="open"]');
            console.log(`找到 ${allElements.length} 個可能相關的元素`);
            
            for (let i = 0; i < Math.min(allElements.length, 10); i++) {
                const element = allElements[i];
                const tagName = await element.evaluate(el => el.tagName);
                const className = await element.getAttribute('class');
                const style = await element.getAttribute('style');
                const isVisible = await element.isVisible();
                
                console.log(`元素 ${i}: <${tagName}> - class: "${className}" - style: "${style}" - visible: ${isVisible}`);
            }
        }
        
        // 最終截圖
        await page.screenshot({ path: 'test-final-state.png', fullPage: true });
        console.log('📸 已保存最終狀態截圖');
        
        // 測試結果總結
        console.log('\n📊 測試結果總結:');
        console.log(`✅ 頁面載入: 成功`);
        console.log(`${userTrigger ? '✅' : '❌'} 找到觸發器: ${userTrigger ? '是' : '否'}`);
        console.log(`${dropdown ? '✅' : '❌'} 下拉選單出現: ${dropdown ? '是' : '否'}`);
        
        if (dropdown) {
            const finalVisible = await dropdown.isVisible();
            console.log(`${finalVisible ? '✅' : '❌'} 下拉選單穩定: ${finalVisible ? '是' : '否'}`);
        }
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
        await page.screenshot({ path: 'test-error-state.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('🏁 測試完成');
    }
}

// 執行測試
testUserDropdown().catch(console.error);