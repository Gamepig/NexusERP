import { chromium } from 'playwright';

async function debugNavHTML() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    await page.goto('http://127.0.0.1:8000/dashboard');
    
    if (page.url().includes('login')) {
        await page.waitForSelector('input[name="email"]');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
    }

    await page.waitForLoadState('networkidle');
    
    // 檢查完整的導航 HTML
    const navHTML = await page.innerHTML('nav');
    console.log('=== 完整導航 HTML ===');
    console.log(navHTML);
    
    // 檢查是否有導航連結容器
    const navContainers = await page.$$('nav div');
    console.log(`\n=== 找到 ${navContainers.length} 個導航容器 ===`);
    
    for (let i = 0; i < navContainers.length; i++) {
        const container = navContainers[i];
        const classes = await container.getAttribute('class');
        const isVisible = await container.isVisible();
        console.log(`容器 ${i + 1}: class="${classes}" 可見=${isVisible}`);
    }

    await browser.close();
}

debugNavHTML().catch(console.error);