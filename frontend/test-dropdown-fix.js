import { chromium } from 'playwright';

async function testDropdownFix() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('🌐 正在訪問 NexusERP...');
        await page.goto('http://127.0.0.1:8000', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });

        console.log('📸 截取首頁狀態...');
        await page.screenshot({ path: 'homepage-before-login.png', fullPage: true });

        // 檢查是否需要登入
        const loginButton = await page.locator('a[href*="login"]').first();
        if (await loginButton.count() > 0) {
            console.log('🔑 需要登入，點擊登入按鈕...');
            await loginButton.click();
            await page.waitForLoadState('networkidle');
            
            console.log('📸 截取登入頁面...');
            await page.screenshot({ path: 'login-page.png', fullPage: true });
            
            // 填寫登入表單
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            
            console.log('🔑 提交登入表單...');
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            console.log('📸 截取登入後狀態...');
            await page.screenshot({ path: 'after-login.png', fullPage: true });
        }

        // 檢查控制台訊息
        page.on('console', msg => {
            if (msg.text().includes('下拉選單修復') || msg.text().includes('dropdown')) {
                console.log('🔧 控制台訊息:', msg.text());
            }
        });

        // 等待導航欄載入
        await page.waitForSelector('nav.navbar', { timeout: 10000 });
        console.log('✅ 導航欄已載入');

        // 尋找「分析與報表」下拉選單
        const analysisDropdown = await page.locator('li.nav-item.dropdown:has-text("分析與報表")').first();
        
        if (await analysisDropdown.count() > 0) {
            console.log('🎯 找到「分析與報表」下拉選單');
            
            // 點擊下拉選單
            await analysisDropdown.click();
            await page.waitForTimeout(1000);
            
            console.log('📸 截取下拉選單展開狀態...');
            await page.screenshot({ path: 'dropdown-expanded.png', fullPage: true });
            
            // 檢查下拉選單是否有滾動條
            const dropdownMenu = await page.locator('.dropdown-menu.show').first();
            if (await dropdownMenu.count() > 0) {
                const overflowY = await dropdownMenu.evaluate(el => 
                    window.getComputedStyle(el).overflowY
                );
                const maxHeight = await dropdownMenu.evaluate(el => 
                    window.getComputedStyle(el).maxHeight
                );
                
                console.log('🔍 下拉選單樣式檢查:');
                console.log('   overflow-y:', overflowY);
                console.log('   max-height:', maxHeight);
                
                if (overflowY === 'auto' || overflowY === 'scroll') {
                    console.log('⚠️  仍然存在滾動條問題');
                } else {
                    console.log('✅ 滾動條問題已修復');
                }
            }
            
            // 檢查「財務會計」選單項目
            const financeItem = await page.locator('.dropdown-item:has-text("財務會計")').first();
            if (await financeItem.count() > 0) {
                const textAlign = await financeItem.evaluate(el => 
                    window.getComputedStyle(el).textAlign
                );
                const whiteSpace = await financeItem.evaluate(el => 
                    window.getComputedStyle(el).whiteSpace
                );
                
                console.log('🔍「財務會計」文字樣式:');
                console.log('   text-align:', textAlign);
                console.log('   white-space:', whiteSpace);
                
                if (textAlign === 'left' && whiteSpace === 'nowrap') {
                    console.log('✅ 文字排列正常');
                } else {
                    console.log('⚠️  文字排列需要調整');
                }
            }
        } else {
            console.log('❌ 未找到「分析與報表」下拉選單');
        }

        // 測試其他下拉選單
        const otherDropdowns = await page.locator('li.nav-item.dropdown').all();
        console.log(`🔍 找到 ${otherDropdowns.length} 個下拉選單`);
        
        for (let i = 0; i < Math.min(otherDropdowns.length, 3); i++) {
            const dropdown = otherDropdowns[i];
            const text = await dropdown.textContent();
            console.log(`🎯 測試下拉選單: ${text.trim()}`);
            
            await dropdown.click();
            await page.waitForTimeout(500);
            
            const dropdownMenu = await page.locator('.dropdown-menu.show').first();
            if (await dropdownMenu.count() > 0) {
                const overflowY = await dropdownMenu.evaluate(el => 
                    window.getComputedStyle(el).overflowY
                );
                console.log(`   overflow-y: ${overflowY}`);
            }
            
            // 點擊其他地方關閉下拉選單
            await page.click('body');
            await page.waitForTimeout(500);
        }

        console.log('📸 截取最終狀態...');
        await page.screenshot({ path: 'final-state.png', fullPage: true });

        console.log('✅ 測試完成');

    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
        await page.screenshot({ path: 'error-state.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testDropdownFix();