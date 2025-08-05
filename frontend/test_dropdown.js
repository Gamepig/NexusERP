import { chromium } from 'playwright';

async function testUserDropdown() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('1. 導航到 http://127.0.0.1:8000');
        await page.goto('http://127.0.0.1:8000');
        
        console.log('2. 強制刷新頁面');
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        console.log('3. 點擊用戶下拉選單');
        const userDropdownTrigger = page.locator("[data-dropdown-toggle='user-dropdown']");
        
        if (await userDropdownTrigger.count() > 0) {
            await userDropdownTrigger.click();
            await page.waitForTimeout(1000);
            
            console.log('4. 截圖用戶下拉選單狀態');
            await page.screenshot({ 
                path: 'user_dropdown_test.png', 
                fullPage: true 
            });
            
            console.log('5. 檢查下拉選單的樣式');
            const dropdownMenu = page.locator('#user-dropdown');
            
            if (await dropdownMenu.count() > 0) {
                // 獲取計算樣式
                const styles = await page.evaluate(() => {
                    const element = document.getElementById('user-dropdown');
                    if (element) {
                        const computedStyles = window.getComputedStyle(element);
                        return {
                            backgroundColor: computedStyles.backgroundColor,
                            borderColor: computedStyles.borderColor,
                            borderWidth: computedStyles.borderWidth,
                            borderStyle: computedStyles.borderStyle,
                            boxShadow: computedStyles.boxShadow
                        };
                    }
                    return null;
                });
                
                console.log('下拉選單樣式:', styles);
                
                // 驗證是否為白色背景
                if (styles && styles.backgroundColor) {
                    if (styles.backgroundColor.includes('rgb(255, 255, 255)') || 
                        styles.backgroundColor === 'white') {
                        console.log('✅ 背景顏色已成功變更為白色');
                    } else {
                        console.log(`❌ 背景顏色未變更: ${styles.backgroundColor}`);
                    }
                }
                
                // 檢查邊框顏色
                if (styles && styles.borderColor) {
                    console.log(`邊框顏色: ${styles.borderColor}`);
                }
                
                console.log('測試完成，截圖已保存為 user_dropdown_test.png');
                return true;
            } else {
                console.log('❌ 找不到下拉選單元素');
                return false;
            }
        } else {
            console.log('❌ 找不到用戶下拉觸發按鈕');
            return false;
        }
    } catch (error) {
        console.log(`測試過程中發生錯誤: ${error}`);
        return false;
    } finally {
        await browser.close();
    }
}

testUserDropdown().then(() => {
    console.log('測試執行完成');
}).catch(error => {
    console.error('測試執行失敗:', error);
});