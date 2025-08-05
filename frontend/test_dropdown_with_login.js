import { chromium } from 'playwright';

async function testUserDropdownWithLogin() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('1. 導航到主頁');
        await page.goto('http://127.0.0.1:8000');
        await page.waitForTimeout(2000);
        
        console.log('2. 點擊登入按鈕');
        const loginButton = page.locator('text=登入');
        if (await loginButton.count() > 0) {
            await loginButton.click();
            await page.waitForTimeout(2000);
            
            console.log('3. 填寫登入資訊');
            // 使用測試帳號
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            
            console.log('4. 提交登入表單');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000);
            
            console.log('5. 強制刷新頁面清除快取');
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
            
            console.log('6. 截圖登入後的狀態');
            await page.screenshot({ 
                path: 'after_login.png', 
                fullPage: true 
            });
            
            console.log('7. 尋找用戶下拉選單');
            // 嘗試多種可能的選擇器
            const possibleSelectors = [
                "[data-dropdown-toggle='user-dropdown']",
                ".user-dropdown-toggle",
                "#userDropdown",
                ".dropdown-toggle",
                "[data-bs-toggle='dropdown']",
                "button:has-text('用戶')",
                "button:has-text('使用者')",
                ".navbar .dropdown button"
            ];
            
            let dropdownFound = false;
            for (const selector of possibleSelectors) {
                const element = page.locator(selector);
                if (await element.count() > 0) {
                    console.log(`找到用戶下拉選單: ${selector}`);
                    await element.click();
                    dropdownFound = true;
                    break;
                }
            }
            
            if (!dropdownFound) {
                console.log('未找到用戶下拉選單，檢查頁面上所有下拉元素...');
                const allDropdowns = await page.evaluate(() => {
                    const elements = [];
                    const dropdownSelectors = [
                        '[data-dropdown-toggle]',
                        '[data-bs-toggle="dropdown"]',
                        '.dropdown-toggle',
                        'button'
                    ];
                    
                    dropdownSelectors.forEach(selector => {
                        const els = document.querySelectorAll(selector);
                        els.forEach(el => {
                            elements.push({
                                selector: selector,
                                tag: el.tagName,
                                id: el.id,
                                className: el.className,
                                text: el.textContent?.trim().substring(0, 50),
                                dataAttributes: Object.fromEntries(
                                    [...el.attributes]
                                        .filter(attr => attr.name.startsWith('data-'))
                                        .map(attr => [attr.name, attr.value])
                                )
                            });
                        });
                    });
                    
                    return elements;
                });
                
                console.log('找到的所有可能的下拉元素:', allDropdowns);
            }
            
            await page.waitForTimeout(1000);
            
            console.log('8. 檢查下拉選單樣式');
            const dropdownMenu = page.locator('#user-dropdown, .dropdown-menu');
            
            if (await dropdownMenu.count() > 0) {
                console.log('找到下拉選單，檢查樣式...');
                
                const styles = await page.evaluate(() => {
                    const selectors = ['#user-dropdown', '.dropdown-menu'];
                    const results = [];
                    
                    selectors.forEach(selector => {
                        const element = document.querySelector(selector);
                        if (element) {
                            const computedStyles = window.getComputedStyle(element);
                            results.push({
                                selector: selector,
                                backgroundColor: computedStyles.backgroundColor,
                                borderColor: computedStyles.borderColor,
                                borderWidth: computedStyles.borderWidth,
                                borderStyle: computedStyles.borderStyle,
                                boxShadow: computedStyles.boxShadow,
                                display: computedStyles.display
                            });
                        }
                    });
                    
                    return results;
                });
                
                console.log('下拉選單樣式:', styles);
                
                // 驗證白色背景
                styles.forEach(style => {
                    if (style.backgroundColor) {
                        if (style.backgroundColor.includes('rgb(255, 255, 255)') || 
                            style.backgroundColor === 'white') {
                            console.log(`✅ ${style.selector} 背景顏色已成功變更為白色`);
                        } else {
                            console.log(`❌ ${style.selector} 背景顏色未變更: ${style.backgroundColor}`);
                        }
                    }
                });
            }
            
            console.log('9. 最終截圖');
            await page.screenshot({ 
                path: 'user_dropdown_final_test.png', 
                fullPage: true 
            });
            
            console.log('測試完成！截圖已保存。');
            
        } else {
            console.log('❌ 找不到登入按鈕');
        }
        
    } catch (error) {
        console.log(`測試過程中發生錯誤: ${error}`);
        await page.screenshot({ 
            path: 'error_screenshot.png', 
            fullPage: true 
        });
    } finally {
        // 保持瀏覽器開啟一段時間供檢查
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

testUserDropdownWithLogin().catch(console.error);