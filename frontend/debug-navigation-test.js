import { chromium } from 'playwright';

async function debugNavigationTest() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });
    
    try {
        const context = await browser.newContext();  
        const page = await context.newPage();
        
        console.log('🔍 調試導航結構...');
        
        // 登入
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
        
        // 檢查實際的導航結構
        console.log('\n🔍 檢查實際導航 HTML 結構...');
        
        const navHTML = await page.evaluate(() => {
            const navs = document.querySelectorAll('nav');
            return Array.from(navs).map((nav, index) => ({
                index,
                id: nav.id,
                classes: nav.className,
                xData: nav.getAttribute('x-data'),
                innerHTML: nav.innerHTML.substring(0, 500) + '...'
            }));
        });
        
        console.log('導航元素數量:', navHTML.length);
        navHTML.forEach((nav, index) => {
            console.log(`\n導航 ${index + 1}:`);
            console.log(`  ID: ${nav.id}`);
            console.log(`  Classes: ${nav.classes}`);
            console.log(`  x-data: ${nav.xData}`);
            console.log(`  HTML preview: ${nav.innerHTML.substring(0, 200)}...`);
        });
        
        // 檢查多層級導航元素
        const multiLevelNavDetails = await page.evaluate(() => {
            const multiNavs = document.querySelectorAll('[x-data*="multiLevelNav"]');
            return Array.from(multiNavs).map((nav, index) => ({
                index,
                xData: nav.getAttribute('x-data'),
                visible: nav.offsetHeight > 0 && nav.offsetWidth > 0,
                children: nav.children.length,
                buttons: nav.querySelectorAll('button').length,
                dropdownButtons: nav.querySelectorAll('button[aria-haspopup="true"]').length
            }));
        });
        
        console.log('\n🎯 多層級導航詳情:');
        multiLevelNavDetails.forEach((nav, index) => {
            console.log(`\n多層級導航 ${index + 1}:`);
            console.log(`  x-data: ${nav.xData}`);
            console.log(`  可見: ${nav.visible}`);
            console.log(`  子元素數量: ${nav.children}`);
            console.log(`  按鈕數量: ${nav.buttons}`);
            console.log(`  下拉按鈕數量: ${nav.dropdownButtons}`);
        });
        
        // 檢查實際存在的導航連結
        console.log('\n🔗 檢查實際的導航連結:');
        const actualNavLinks = await page.evaluate(() => {
            // 查看主導航區域
            const mainNav = document.querySelector('nav');
            if (!mainNav) return { error: '沒有找到導航元素' };
            
            const links = mainNav.querySelectorAll('a, button');
            return Array.from(links).map((el, index) => ({
                index,
                tag: el.tagName,
                text: el.textContent?.trim(),
                href: el.href,
                id: el.id,
                classes: el.className,
                visible: el.offsetHeight > 0 && el.offsetWidth > 0,
                ariaHaspopup: el.getAttribute('aria-haspopup'),
                ariaExpanded: el.getAttribute('aria-expanded')
            }));
        });
        
        if (actualNavLinks.error) {
            console.log('❌', actualNavLinks.error);
        } else {
            console.log(`找到 ${actualNavLinks.length} 個導航元素:`);
            actualNavLinks.forEach(link => {
                if (link.visible) {
                    console.log(`  ${link.index + 1}. [${link.tag}] "${link.text}" ${link.ariaHaspopup ? '(有下拉)' : ''}`);
                    if (link.ariaHaspopup) {
                        console.log(`      ID: ${link.id}, aria-expanded: ${link.ariaExpanded}`);
                    }
                }
            });
        }
        
        // 查找 Alpine.js 初始化狀態
        console.log('\n🏔️  檢查 Alpine.js 狀態...');
        const alpineStatus = await page.evaluate(() => {
            return {
                alpineLoaded: typeof window.Alpine !== 'undefined',
                multiLevelNavFunction: typeof multiLevelNav !== 'undefined',
                alpineStarted: window.Alpine && window.Alpine.version,
                alpineDataElements: document.querySelectorAll('[x-data]').length
            };
        });
        
        console.log('Alpine.js 載入:', alpineStatus.alpineLoaded);
        console.log('multiLevelNav 函數存在:', alpineStatus.multiLevelNavFunction);
        console.log('Alpine 版本:', alpineStatus.alpineStarted);
        console.log('x-data 元素數量:', alpineStatus.alpineDataElements);
        
        // 手動測試一個具體的導航項目
        console.log('\n🧪 手動測試導航互動...');
        
        // 嘗試找到任何可見的導航按鈕
        const visibleNavButtons = await page.locator('nav button').all();
        console.log(`找到 ${visibleNavButtons.length} 個導航按鈕`);
        
        if (visibleNavButtons.length > 0) {
            for (let i = 0; i < Math.min(3, visibleNavButtons.length); i++) {
                const button = visibleNavButtons[i];
                const isVisible = await button.isVisible();
                const text = await button.textContent();
                
                console.log(`\n按鈕 ${i + 1}: "${text?.trim()}" (可見: ${isVisible})`);
                
                if (isVisible) {
                    try {
                        console.log('  嘗試點擊...');
                        await button.click();
                        await page.waitForTimeout(500);
                        
                        // 檢查是否有任何變化
                        const afterClick = await page.evaluate(() => {
                            const dropdowns = document.querySelectorAll('[x-show]');
                            return Array.from(dropdowns).map(dd => ({
                                visible: dd.offsetHeight > 0 && dd.offsetWidth > 0,
                                display: getComputedStyle(dd).display,
                                innerHTML: dd.innerHTML.substring(0, 100)
                            }));
                        });
                        
                        console.log('  點擊後下拉選單狀態:', afterClick);
                        
                    } catch (error) {
                        console.log('  點擊失敗:', error.message);
                    }
                }
            }
        }
        
        // 截圖當前狀態
        await page.screenshot({ 
            path: 'debug-navigation-state.png',
            fullPage: true 
        });
        console.log('📸 調試截圖已保存: debug-navigation-state.png');
        
        console.log('\n✅ 調試完成!');
        
    } catch (error) {
        console.error('❌ 調試過程中發生錯誤:', error);
    } finally {
        await browser.close();
    }
}

debugNavigationTest();