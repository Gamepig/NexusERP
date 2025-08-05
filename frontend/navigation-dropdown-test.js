import { chromium } from 'playwright';

async function testNavigationDropdownBehavior() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500 // 放慢操作便於觀察
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('🔍 正在測試 NexusERP 導航下拉選單行為...');
        
        // 先嘗試直接進入 dashboard，然後回退到登入頁面
        try {
            await page.goto('http://127.0.0.1:8000/dashboard');
            await page.waitForTimeout(2000);
            
            // 檢查是否被重定向到登入頁面
            const currentUrl = page.url();
            if (currentUrl.includes('/login')) {
                console.log('🔐 需要先登入，嘗試使用測試帳號登入...');
                
                // 填寫登入表單
                await page.fill('input[name="email"]', 'test@example.com');
                await page.fill('input[name="password"]', 'password123');
                await page.click('button[type="submit"]');
                await page.waitForTimeout(3000);
                
                // 再次嘗試進入 dashboard
                await page.goto('http://127.0.0.1:8000/dashboard');
                await page.waitForTimeout(2000);
            }
        } catch (error) {
            console.log('⚠️  直接進入 dashboard 失敗，使用主頁面進行測試...');
            await page.goto('http://127.0.0.1:8000');
            await page.waitForTimeout(2000);
        }
        
        // 檢查頁面標題
        const title = await page.title();
        console.log('📖 頁面標題:', title);
        
        // 截圖保存初始狀態
        await page.screenshot({ 
            path: 'navigation-initial-state.png',
            fullPage: true 
        });
        console.log('📸 初始狀態截圖已保存: navigation-initial-state.png');
        
        // 檢查導航結構
        console.log('\n🧭 分析導航結構...');
        
        // 查找主要導航區域
        const navElement = await page.locator('nav').first();
        const navExists = await navElement.count() > 0;
        console.log('✅ 主導航是否存在:', navExists);
        
        // 查找所有導航連結
        const navLinks = await page.locator('nav a, nav button').all();
        console.log('🔗 導航連結/按鈕總數:', navLinks.length);
        
        // 列出所有導航項目
        for (let i = 0; i < navLinks.length; i++) {
            const linkText = await navLinks[i].textContent();
            const linkHref = await navLinks[i].getAttribute('href');
            const isButton = await navLinks[i].evaluate(el => el.tagName.toLowerCase() === 'button');
            console.log(`   ${i + 1}. ${linkText?.trim()} ${isButton ? '(按鈕)' : `(連結: ${linkHref})`}`);
        }
        
        // 查找下拉選單元素
        console.log('\n🔍 檢查下拉選單元素...');
        
        // 查找可能的下拉選單容器
        const dropdownContainers = await page.locator('[x-data*="dropdown"], [x-data*="open"], .dropdown, [class*="dropdown"]').all();
        console.log('📦 找到的下拉選單容器數量:', dropdownContainers.length);
        
        // 檢查設定下拉選單
        const settingsDropdown = await page.locator('[x-data*="dropdown"]').first();
        const settingsDropdownExists = await settingsDropdown.count() > 0;
        console.log('⚙️  設定下拉選單是否存在:', settingsDropdownExists);
        
        if (settingsDropdownExists) {
            console.log('\n🧪 測試設定下拉選單行為...');
            
            // 截圖設定下拉選單觸發器
            const triggerButton = await page.locator('[x-data*="dropdown"] button').first();
            
            // 測試點擊觸發器
            console.log('👆 點擊設定下拉選單觸發器...');
            await triggerButton.click();
            await page.waitForTimeout(1000);
            
            // 檢查下拉選單是否開啟
            const dropdownContent = await page.locator('[x-data*="dropdown"] [x-show]').first();
            const isVisible = await dropdownContent.isVisible().catch(() => false);
            console.log('👁️  下拉選單是否可見:', isVisible);
            
            // 截圖下拉選單開啟狀態
            await page.screenshot({ 
                path: 'navigation-dropdown-open.png',
                fullPage: true 
            });
            console.log('📸 下拉選單開啟狀態截圖已保存: navigation-dropdown-open.png');
            
            // 測試點擊外部關閉下拉選單
            console.log('👆 點擊外部區域測試關閉行為...');
            await page.click('body', { position: { x: 100, y: 100 } });
            await page.waitForTimeout(1000);
            
            const isHidden = await dropdownContent.isHidden().catch(() => true);
            console.log('👁️  點擊外部後下拉選單是否關閉:', isHidden);
            
            // 截圖關閉狀態
            await page.screenshot({ 
                path: 'navigation-dropdown-closed.png',
                fullPage: true 
            });
            console.log('📸 下拉選單關閉狀態截圖已保存: navigation-dropdown-closed.png');
        }
        
        // 檢查是否有多層級導航組件
        console.log('\n🏗️  檢查多層級導航組件...');
        const multiLevelNav = await page.locator('[x-data*="multiLevelNav"]').count();
        console.log('🎯 多層級導航組件數量:', multiLevelNav);
        
        if (multiLevelNav > 0) {
            console.log('🧪 測試多層級導航下拉行為...');
            
            // 查找所有具有下拉功能的導航項目
            const dropdownItems = await page.locator('[x-data*="multiLevelNav"] li[x-show] button, [x-data*="multiLevelNav"] button[aria-haspopup="true"]').all();
            console.log('📋 具有下拉功能的導航項目數量:', dropdownItems.length);
            
            for (let i = 0; i < Math.min(dropdownItems.length, 3); i++) {
                console.log(`\n🧪 測試第 ${i + 1} 個下拉項目...`);
                
                const item = dropdownItems[i];
                const itemText = await item.textContent();
                console.log(`   項目文字: ${itemText?.trim()}`);
                
                // 懸停測試
                console.log('   🖱️  懸停測試...');
                await item.hover();
                await page.waitForTimeout(200);
                
                // 檢查下拉選單是否出現
                const dropdownVisible = await page.locator(`[x-show*="openDropdowns"]`).isVisible().catch(() => false);
                console.log(`   👁️  懸停後下拉選單可見: ${dropdownVisible}`);
                
                // 移動到其他位置測試關閉
                await page.mouse.move(100, 100);
                await page.waitForTimeout(200);
                
                const dropdownHidden = await page.locator(`[x-show*="openDropdowns"]`).isHidden().catch(() => true);
                console.log(`   👁️  移開後下拉選單關閉: ${dropdownHidden}`);
            }
            
            // 測試排他性行為
            if (dropdownItems.length >= 2) {
                console.log('\n🎯 測試排他性下拉行為...');
                
                // 懸停第一個項目
                await dropdownItems[0].hover();
                await page.waitForTimeout(100);
                
                // 懸停第二個項目
                await dropdownItems[1].hover();
                await page.waitForTimeout(100);
                
                // 檢查是否只有一個下拉選單開啟
                const openDropdowns = await page.locator(`[x-show*="openDropdowns"][style*="display: block"], [x-show*="openDropdowns"]:not([style*="display: none"])`).count();
                console.log('🎯 同時開啟的下拉選單數量:', openDropdowns);
                console.log('✅ 排他性行為:', openDropdowns <= 1 ? '正確' : '有問題');
                
                // 截圖排他性測試結果
                await page.screenshot({ 
                    path: 'navigation-exclusive-behavior.png',
                    fullPage: true 
                });
                console.log('📸 排他性行為測試截圖已保存: navigation-exclusive-behavior.png');
            }
        }
        
        // 檢查響應式導航
        console.log('\n📱 檢查響應式導航...');
        const mobileMenuButton = await page.locator('button[\\@click*="open"]').count();
        console.log('📱 行動版選單按鈕數量:', mobileMenuButton);
        
        if (mobileMenuButton > 0) {
            console.log('🧪 測試行動版導航...');
            
            // 點擊行動版選單按鈕
            await page.locator('button[\\@click*="open"]').first().click();
            await page.waitForTimeout(1000);
            
            // 檢查行動版選單是否開啟
            const mobileMenuVisible = await page.locator('[\\:class*="open"]').isVisible().catch(() => false);
            console.log('👁️  行動版選單是否可見:', mobileMenuVisible);
            
            // 截圖行動版選單
            await page.screenshot({ 
                path: 'navigation-mobile-menu.png',
                fullPage: true 
            });
            console.log('📸 行動版選單截圖已保存: navigation-mobile-menu.png');
        }
        
        // 檢查 JavaScript 錯誤
        console.log('\n🐛 檢查 JavaScript 錯誤...');
        const errors = [];
        page.on('pageerror', (error) => {
            errors.push(error.message);
        });
        
        const consoleLogs = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleLogs.push(msg.text());
            }
        });
        
        await page.waitForTimeout(2000);
        
        console.log('🚨 JavaScript 錯誤:', errors.length > 0 ? errors : '無');
        console.log('🚨 控制台錯誤:', consoleLogs.length > 0 ? consoleLogs : '無');
        
        // 檢查 Alpine.js 是否載入
        const alpineLoaded = await page.evaluate(() => {
            return typeof window.Alpine !== 'undefined';
        });
        console.log('🏔️  Alpine.js 是否載入:', alpineLoaded);
        
        // 最終截圖
        await page.screenshot({ 
            path: 'navigation-final-state.png',
            fullPage: true 
        });
        console.log('📸 最終狀態截圖已保存: navigation-final-state.png');
        
        console.log('\n✅ 導航下拉選單測試完成!');
        
        // 總結報告
        console.log('\n📊 測試總結報告:');
        console.log('=' .repeat(50));
        console.log(`✅ 導航存在: ${navExists}`);
        console.log(`🔗 導航連結數量: ${navLinks.length}`);
        console.log(`📦 下拉選單容器: ${dropdownContainers.length}`);
        console.log(`⚙️  設定下拉選單: ${settingsDropdownExists}`);
        console.log(`🎯 多層級導航: ${multiLevelNav > 0}`);
        console.log(`📱 行動版選單: ${mobileMenuButton > 0}`);
        console.log(`🏔️  Alpine.js 載入: ${alpineLoaded}`);
        console.log(`🚨 錯誤數量: ${errors.length + consoleLogs.length}`);
        console.log('=' .repeat(50));
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
        
        // 錯誤狀態截圖
        try {
            await page.screenshot({ 
                path: 'navigation-error-state.png',
                fullPage: true 
            });
            console.log('📸 錯誤狀態截圖已保存: navigation-error-state.png');
        } catch (screenshotError) {
            console.error('截圖保存失敗:', screenshotError);
        }
    } finally {
        await browser.close();
    }
}

// 執行測試
testNavigationDropdownBehavior();