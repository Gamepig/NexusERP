import { chromium } from 'playwright';

async function testNavigation() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    console.log('📍 測試 1: 訪問登入頁面');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 截圖登入頁面
    await page.screenshot({ path: 'navigation-test-login.png', fullPage: true });
    console.log('✅ 登入頁面截圖已保存');

    // 檢查導航是否存在（guest 頁面通常沒有導航）
    const navigation = await page.$('nav[x-data]');
    if (navigation) {
        console.log('✅ 找到導航元素');
    } else {
        console.log('ℹ️ 登入頁面未找到導航元素（正常）');
    }

    console.log('📍 測試 2: 登入系統');
    try {
        // 填寫登入表單（表單已預填，只需點擊登入）
        await page.waitForSelector('button[type="submit"]', { state: 'visible' });
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
        console.log('✅ 登入成功');
    } catch (error) {
        console.log('❌ 登入失敗:', error.message);
        await browser.close();
        return;
    }

    console.log('📍 測試 3: 檢查 Dashboard 導航');
    await page.waitForLoadState('networkidle');
    
    // 截圖 Dashboard 頁面
    await page.screenshot({ path: 'navigation-test-dashboard-full.png', fullPage: true });
    console.log('✅ Dashboard 完整截圖已保存');

    // 檢查導航連結
    const navLinks = await page.$$('nav a[href*="route"]');
    console.log(`✅ 找到 ${navLinks.length} 個導航連結`);

    // 檢查導航文字是否擠壓
    const navigationContainer = await page.$('.flex.justify-between.h-16 .flex .hidden.space-x-8');
    if (navigationContainer) {
        const boundingBox = await navigationContainer.boundingBox();
        console.log(`導航容器寬度: ${boundingBox.width}px`);
        
        // 檢查每個導航項目
        const navItems = await navigationContainer.$$('a');
        for (let i = 0; i < navItems.length; i++) {
            const item = navItems[i];
            const text = await item.innerText();
            const box = await item.boundingBox();
            console.log(`導航項目 ${i + 1}: "${text}" - 寬度: ${box.width}px`);
        }
    }

    console.log('📍 測試 4: 不同螢幕尺寸測試');
    
    // 測試中等螢幕 (1280px)
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'navigation-test-1280.png', fullPage: true });
    console.log('✅ 1280px 截圖已保存');

    // 測試小螢幕 (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'navigation-test-768.png', fullPage: true });
    console.log('✅ 768px 截圖已保存');

    // 測試極小螢幕 (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'navigation-test-375.png', fullPage: true });
    console.log('✅ 375px 截圖已保存');

    console.log('📍 測試 5: 漢堡選單功能');
    // 在小螢幕上測試漢堡選單
    const hamburgerButton = await page.$('button[\\@click="open = ! open"]');
    if (hamburgerButton) {
        await hamburgerButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'navigation-test-hamburger-open.png', fullPage: true });
        console.log('✅ 漢堡選單開啟截圖已保存');
        
        // 關閉漢堡選單
        await hamburgerButton.click();
        await page.waitForTimeout(500);
    } else {
        console.log('❌ 未找到漢堡選單按鈕');
    }

    await browser.close();
    console.log('🎉 導航測試完成！請查看截圖文件了解詳細結果。');
}

testNavigation().catch(console.error);