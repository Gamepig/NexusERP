import { chromium } from 'playwright';

async function quickNavTest() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    console.log('📍 快速測試：檢查導航修復');
    await page.goto('http://127.0.0.1:8000/dashboard');
    
    if (page.url().includes('login')) {
        // 登入
        await page.waitForSelector('input[name="email"]');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
    }

    await page.waitForLoadState('networkidle');
    
    // 截圖
    await page.screenshot({ path: 'nav-quick-test-1920.png', fullPage: false });
    
    // 檢查導航是否顯示
    const navContainer = await page.$('div.hidden.lg\\:flex');
    const navVisible = await page.isVisible('div.hidden.lg\\:flex');
    console.log(`1920px 導航容器存在: ${navContainer ? '✅' : '❌'}`);
    console.log(`1920px 導航可見: ${navVisible ? '✅' : '❌'}`);
    
    // 檢查漢堡選單是否隱藏
    const hamburgerHidden = await page.isHidden('div.lg\\:hidden button');
    console.log(`1920px 漢堡選單隱藏: ${hamburgerHidden ? '✅' : '❌'}`);

    // 測試 1024px（lg 斷點）
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'nav-quick-test-1024.png', fullPage: false });
    
    const navVisible1024 = await page.isVisible('div.hidden.lg\\:flex');
    const hamburgerVisible1024 = await page.isVisible('div.lg\\:hidden button');
    console.log(`1024px 導航可見: ${navVisible1024 ? '✅' : '❌'}`);
    console.log(`1024px 漢堡選單可見: ${hamburgerVisible1024 ? '✅' : '❌'}`);

    // 測試 768px
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'nav-quick-test-768.png', fullPage: false });
    
    const navHidden768 = await page.isHidden('div.hidden.lg\\:flex');
    const hamburgerVisible768 = await page.isVisible('div.lg\\:hidden button');
    console.log(`768px 導航隱藏: ${navHidden768 ? '✅' : '❌'}`);
    console.log(`768px 漢堡選單可見: ${hamburgerVisible768 ? '✅' : '❌'}`);

    await browser.close();
    console.log('🎉 快速測試完成！');
}

quickNavTest().catch(console.error);