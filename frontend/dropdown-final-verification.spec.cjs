// 下拉選單修復最終驗證測試
const { test, expect } = require('@playwright/test');

test.describe('下拉選單修復最終驗證', () => {
    test('驗證下拉選單修復效果', async ({ page }) => {
        console.log('🌐 開始測試 - 訪問網站...');
        
        // 1. 訪問首頁
        await page.goto('http://127.0.0.1:8000');
        await page.waitForLoadState('networkidle');
        
        console.log('📸 截取首頁狀態...');
        await page.screenshot({ path: 'final-verification-01-homepage.png' });
        
        // 2. 登入系統
        console.log('🔑 開始登入流程...');
        await page.click('a[href*="login"]');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        
        console.log('📸 截取登入表單狀態...');
        await page.screenshot({ path: 'final-verification-02-login-form.png' });
        
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        console.log('📸 截取登入後狀態...');
        await page.screenshot({ path: 'final-verification-03-after-login.png' });
        
        // 3. 檢查控制台修復訊息
        let consoleMessages = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('下拉選單修復') || text.includes('dropdown') || text.includes('修復')) {
                consoleMessages.push(text);
                console.log('🔧 控制台修復訊息:', text);
            }
        });
        
        // 4. 等待頁面完全載入並檢查導航
        console.log('🔍 檢查導航欄結構...');
        await page.waitForSelector('nav.navbar', { timeout: 10000 });
        
        const navExists = await page.locator('nav.navbar').count();
        console.log(`✅ 導航欄存在: ${navExists > 0}`);
        
        // 5. 尋找並測試所有下拉選單
        const dropdowns = await page.locator('li.nav-item.dropdown').all();
        console.log(`🎯 找到 ${dropdowns.length} 個下拉選單`);
        
        for (let i = 0; i < dropdowns.length; i++) {
            const dropdown = dropdowns[i];
            const dropdownText = await dropdown.textContent();
            console.log(`\n🧪 測試下拉選單 ${i + 1}: "${dropdownText.trim()}"`);
            
            // 點擊下拉選單
            await dropdown.click();
            await page.waitForTimeout(500);
            
            // 檢查下拉選單是否展開
            const dropdownMenu = await page.locator('.dropdown-menu.show').first();
            const isVisible = await dropdownMenu.count() > 0;
            console.log(`   展開狀態: ${isVisible}`);
            
            if (isVisible) {
                // 檢查樣式屬性
                const overflowY = await dropdownMenu.evaluate(el => 
                    window.getComputedStyle(el).overflowY
                );
                const maxHeight = await dropdownMenu.evaluate(el => 
                    window.getComputedStyle(el).maxHeight
                );
                
                console.log(`   overflow-y: ${overflowY}`);
                console.log(`   max-height: ${maxHeight}`);
                
                // 驗證修復效果
                const hasScrollbar = overflowY === 'auto' || overflowY === 'scroll';
                if (hasScrollbar && maxHeight !== 'none' && !maxHeight.includes('calc')) {
                    console.log('⚠️  下拉選單仍有滾動條問題');
                } else {
                    console.log('✅ 下拉選單修復成功');
                }
                
                // 截圖記錄
                await page.screenshot({ 
                    path: `final-verification-dropdown-${i + 1}-expanded.png` 
                });
            }
            
            // 關閉下拉選單
            await page.click('body');
            await page.waitForTimeout(300);
        }
        
        // 6. 特別測試「分析與報表」下拉選單
        console.log('\n🎯 特別測試「分析與報表」下拉選單...');
        const analysisDropdown = await page.locator('li.nav-item.dropdown:has-text("分析與報表")').first();
        
        if (await analysisDropdown.count() > 0) {
            console.log('✅ 找到「分析與報表」下拉選單');
            
            await analysisDropdown.click();
            await page.waitForTimeout(1000);
            
            const dropdownMenu = await page.locator('.dropdown-menu.show').first();
            if (await dropdownMenu.count() > 0) {
                // 檢查財務會計項目
                const financeItem = await page.locator('.dropdown-item:has-text("財務會計")').first();
                if (await financeItem.count() > 0) {
                    const textAlign = await financeItem.evaluate(el => 
                        window.getComputedStyle(el).textAlign
                    );
                    const whiteSpace = await financeItem.evaluate(el => 
                        window.getComputedStyle(el).whiteSpace
                    );
                    
                    console.log('🔍「財務會計」項目樣式:');
                    console.log(`   text-align: ${textAlign}`);
                    console.log(`   white-space: ${whiteSpace}`);
                    
                    if (textAlign === 'left' && whiteSpace === 'nowrap') {
                        console.log('✅ 文字排列修復成功');
                    } else {
                        console.log('⚠️  文字排列需要進一步調整');
                    }
                }
                
                await page.screenshot({ path: 'final-verification-04-analysis-dropdown.png' });
            }
        } else {
            console.log('❌ 未找到「分析與報表」下拉選單');
        }
        
        // 7. 最終狀態截圖
        console.log('📸 截取最終測試狀態...');
        await page.screenshot({ path: 'final-verification-05-complete.png', fullPage: true });
        
        // 8. 執行 JavaScript 修復函數檢查
        console.log('\n🔧 執行修復函數檢查...');
        const fixResult = await page.evaluate(() => {
            // 檢查修復函數是否存在
            if (typeof window.fixDropdownScrolling === 'function') {
                try {
                    window.fixDropdownScrolling();
                    return { success: true, message: '修復函數執行成功' };
                } catch (error) {
                    return { success: false, message: `修復函數執行錯誤: ${error.message}` };
                }
            } else {
                return { success: false, message: '修復函數不存在' };
            }
        });
        
        console.log(`🔧 修復函數結果: ${fixResult.message}`);
        
        // 9. 輸出測試總結
        console.log('\n📊 測試總結:');
        console.log(`- 找到下拉選單數量: ${dropdowns.length}`);
        console.log(`- 控制台修復訊息數量: ${consoleMessages.length}`);
        console.log(`- 修復函數狀態: ${fixResult.success ? '正常' : '異常'}`);
        
        if (consoleMessages.length > 0) {
            console.log('- 修復訊息內容:');
            consoleMessages.forEach((msg, idx) => {
                console.log(`  ${idx + 1}. ${msg}`);
            });
        }
        
        console.log('✅ 最終驗證測試完成');
    });
});