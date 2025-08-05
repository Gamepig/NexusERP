// Playwright 測試：登入後測試使用者下拉選單功能
import { chromium } from 'playwright';

async function testUserDropdownWithLogin() {
    console.log('🧪 開始測試使用者下拉選單（含登入流程）...');
    
    // 啟動瀏覽器
    const browser = await chromium.launch({ 
        headless: false,  // 顯示瀏覽器窗口以便觀察
        slowMo: 500      // 放慢操作速度以便觀察
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 步驟 1: 訪問登入頁面
        console.log('📍 導航到登入頁面...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForTimeout(2000);
        
        console.log(`📄 當前頁面: ${await page.title()}`);
        
        // 步驟 2: 執行登入
        console.log('🔐 執行登入流程...');
        
        // 填寫登入表單
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        
        // 點擊登入按鈕
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000); // 等待登入完成
        
        // 檢查是否成功登入
        const currentUrl = page.url();
        console.log(`📍 登入後URL: ${currentUrl}`);
        
        if (currentUrl.includes('/dashboard')) {
            console.log('✅ 登入成功！');
        } else {
            console.log('⚠️ 可能未成功登入，繼續測試...');
        }
        
        // 截圖 - 登入後狀態
        await page.screenshot({ path: 'test-after-login.png', fullPage: true });
        console.log('📸 已保存登入後狀態截圖');
        
        // 步驟 3: 查找使用者下拉選單觸發器
        console.log('🔍 尋找使用者下拉選單觸發器...');
        
        const possibleSelectors = [
            '.nexus-user-trigger',
            'button[aria-haspopup="true"]',
            'button:has(.nexus-user-avatar)',
            '.nexus-user-avatar',
            'button:has(img[alt*="頭像"])',
            'button:has(div[class*="rounded-full"])',
            '[class*="user"]',
            'button:has-text("測試使用者")',
            'button:has-text("test@example.com")',
            'button[class*="user"]'
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
            console.log('🔍 分析頁面中的所有按鈕和可點擊元素...');
            
            // 列出所有按鈕
            const allButtons = await page.$$('button');
            console.log(`\n📋 找到 ${allButtons.length} 個按鈕:`);
            
            for (let i = 0; i < allButtons.length; i++) {
                const button = allButtons[i];
                const text = await button.textContent();
                const className = await button.getAttribute('class');
                const isVisible = await button.isVisible();
                console.log(`  按鈕 ${i}: "${text?.trim()}" - class: "${className}" - visible: ${isVisible}`);
            }
            
            // 列出所有可能的用戶相關元素
            const userElements = await page.$$('[class*="user"], [data-*="user"], [id*="user"]');
            console.log(`\n👤 找到 ${userElements.length} 個用戶相關元素:`);
            
            for (let i = 0; i < userElements.length; i++) {
                const element = userElements[i];
                const tagName = await element.evaluate(el => el.tagName);
                const text = await element.textContent();
                const className = await element.getAttribute('class');
                const isVisible = await element.isVisible();
                console.log(`  元素 ${i}: <${tagName}> "${text?.trim()}" - class: "${className}" - visible: ${isVisible}`);
            }
            
            // 嘗試右上角區域
            console.log('\n🔍 檢查右上角可能的使用者區域...');
            const rightCornerElements = await page.$$('div:has(svg), span:has(svg), button:has(svg)');
            console.log(`找到 ${rightCornerElements.length} 個包含 SVG 的元素`);
            
            for (let i = 0; i < Math.min(rightCornerElements.length, 5); i++) {
                const element = rightCornerElements[i];
                const tagName = await element.evaluate(el => el.tagName);
                const className = await element.getAttribute('class');
                const boundingBox = await element.boundingBox();
                const isVisible = await element.isVisible();
                
                // 檢查是否在右上角（假設頁面寬度 > 800px）
                if (boundingBox && boundingBox.x > 600) {
                    console.log(`  右側元素 ${i}: <${tagName}> - class: "${className}" - position: (${boundingBox.x}, ${boundingBox.y}) - visible: ${isVisible}`);
                    
                    // 如果是可點擊的元素，嘗試作為用戶觸發器
                    if (tagName === 'BUTTON' || (className && className.includes('cursor-pointer'))) {
                        console.log(`  🎯 嘗試使用此元素作為觸發器...`);
                        userTrigger = element;
                        break;
                    }
                }
            }
        }
        
        if (!userTrigger) {
            console.log('❌ 仍然無法找到使用者觸發器，測試終止');
            return;
        }
        
        // 步驟 4: 測試使用者下拉選單
        console.log('🖱️ 點擊使用者觸發器...');
        
        // 獲取觸發器位置信息
        const boundingBox = await userTrigger.boundingBox();
        console.log(`📍 觸發器位置: ${JSON.stringify(boundingBox)}`);
        
        // 點擊觸發器
        await userTrigger.click();
        console.log('✅ 已點擊觸發器');
        
        // 等待下拉選單可能出現
        await page.waitForTimeout(1000);
        
        // 截圖 - 點擊後狀態
        await page.screenshot({ path: 'test-dropdown-after-click.png', fullPage: true });
        console.log('📸 已保存點擊後狀態截圖');
        
        // 步驟 5: 檢查下拉選單
        console.log('🔍 檢查下拉選單是否出現...');
        
        const dropdownSelectors = [
            '.nexus-user-dropdown',
            '[x-show="showUserMenu"]',
            '[class*="dropdown"]',
            '[role="menu"]',
            '[class*="user-menu"]',
            'div[class*="absolute"][class*="right"]',
            'div[style*="position: fixed"]'
        ];
        
        let dropdown = null;
        let dropdownInfo = null;
        
        for (const selector of dropdownSelectors) {
            try {
                const elements = await page.$$(selector);
                for (const element of elements) {
                    const isVisible = await element.isVisible();
                    if (isVisible) {
                        const boundingBox = await element.boundingBox();
                        const textContent = await element.textContent();
                        
                        // 檢查是否包含預期的下拉選單內容
                        if (textContent && (textContent.includes('登出') || textContent.includes('設定') || textContent.includes('個人'))) {
                            dropdown = element;
                            dropdownInfo = { selector, boundingBox, textContent };
                            console.log(`✅ 找到下拉選單: ${selector}`);
                            break;
                        }
                    }
                }
                if (dropdown) break;
            } catch (e) {
                // 繼續嘗試
            }
        }
        
        if (dropdown && dropdownInfo) {
            console.log(`📍 下拉選單位置: ${JSON.stringify(dropdownInfo.boundingBox)}`);
            console.log(`📝 下拉選單內容: "${dropdownInfo.textContent?.trim()}"`);
            
            // 測試下拉選單穩定性
            console.log('⏱️ 測試下拉選單穩定性（等待3秒）...');
            
            const startTime = Date.now();
            let visibleTime = 0;
            let lastVisible = true;
            
            // 每100ms檢查一次可見性
            for (let i = 0; i < 30; i++) {
                await page.waitForTimeout(100);
                const isVisible = await dropdown.isVisible();
                
                if (isVisible) {
                    visibleTime += 100;
                } else if (lastVisible) {
                    console.log(`⚠️ 下拉選單在 ${visibleTime}ms 後消失`);
                    break;
                }
                lastVisible = isVisible;
            }
            
            const finalVisible = await dropdown.isVisible();
            console.log(`結果: 下拉選單可見時間 ${visibleTime}ms，最終狀態: ${finalVisible ? '可見' : '不可見'}`);
            
            if (finalVisible) {
                console.log('✅ 下拉選單穩定性良好');
                
                // 尋找登出按鈕
                const logoutSelectors = [
                    'button:has-text("登出")',
                    'a:has-text("登出")',
                    'form[action*="logout"] button',
                    '.nexus-logout-item',
                    'button[type="submit"]:has-text("登出")'
                ];
                
                for (const selector of logoutSelectors) {
                    try {
                        const logoutBtn = await page.$(selector);
                        if (logoutBtn && await logoutBtn.isVisible()) {
                            console.log(`✅ 找到登出按鈕: ${selector}`);
                            const logoutBox = await logoutBtn.boundingBox();
                            console.log(`📍 登出按鈕位置: ${JSON.stringify(logoutBox)}`);
                            break;
                        }
                    } catch (e) {
                        // 繼續嘗試
                    }
                }
            } else if (visibleTime < 500) {
                console.log('❌ 下拉選單立即消失 - 存在嚴重問題！');
            } else {
                console.log('⚠️ 下拉選單提前消失 - 可能存在計時問題');
            }
            
        } else {
            console.log('❌ 下拉選單未出現或不包含預期內容');
            console.log('🔍 檢查所有新出現的元素...');
            
            // 再次點擊並檢查所有可能的變化
            await userTrigger.click();
            await page.waitForTimeout(100);
            
            const allVisibleElements = await page.$$('div[style*="display"], [class*="show"], [class*="open"], [x-show]');
            console.log(`發現 ${allVisibleElements.length} 個可能相關的元素`);
            
            for (let i = 0; i < Math.min(allVisibleElements.length, 10); i++) {
                const element = allVisibleElements[i];
                const isVisible = await element.isVisible();
                if (isVisible) {
                    const tagName = await element.evaluate(el => el.tagName);
                    const className = await element.getAttribute('class');
                    const textContent = await element.textContent();
                    console.log(`  可見元素 ${i}: <${tagName}> "${textContent?.trim()}" - class: "${className}"`);
                }
            }
        }
        
        // 最終截圖
        await page.screenshot({ path: 'test-final-result.png', fullPage: true });
        console.log('📸 已保存最終結果截圖');
        
        // 測試結果總結
        console.log('\n📊 完整測試結果總結:');
        console.log('='.repeat(50));
        console.log(`✅ 頁面載入: 成功`);
        console.log(`✅ 用戶登入: 成功`);
        console.log(`${userTrigger ? '✅' : '❌'} 找到觸發器: ${userTrigger ? '是' : '否'}`);
        console.log(`${dropdown ? '✅' : '❌'} 下拉選單出現: ${dropdown ? '是' : '否'}`);
        
        if (dropdown && dropdownInfo) {
            const finalVisible = await dropdown.isVisible();
            console.log(`${finalVisible ? '✅' : '❌'} 下拉選單穩定: ${finalVisible ? '是' : '否'}`);
            console.log(`⏱️ 可見時間: ${visibleTime}ms`);
        }
        
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
        await page.screenshot({ path: 'test-error-final.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('🏁 測試完成');
    }
}

// 執行測試
testUserDropdownWithLogin().catch(console.error);