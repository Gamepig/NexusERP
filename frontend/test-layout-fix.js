// 測試排版修復
import { chromium } from 'playwright';

async function testLayoutFix() {
    console.log('🔧 測試排版修復...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 登入系統
        console.log('📍 登入系統...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // 檢查佈局
        console.log('🔍 檢查排版修復...');
        
        // 檢查左側邊欄
        const sidebar = await page.$('.nexus-sidebar');
        if (sidebar) {
            const sidebarBox = await sidebar.boundingBox();
            console.log(`✅ 左側邊欄位置: ${JSON.stringify(sidebarBox)}`);
            
            // 檢查是否寬度正確
            if (sidebarBox && sidebarBox.width >= 250) {
                console.log('✅ 左側邊欄寬度正常');
            } else {
                console.log('❌ 左側邊欄寬度異常');
            }
        } else {
            console.log('❌ 找不到左側邊欄');
        }
        
        // 檢查主內容區域
        const mainContent = await page.$('.nexus-main-content');
        if (mainContent) {
            const mainBox = await mainContent.boundingBox();
            console.log(`✅ 主內容區域位置: ${JSON.stringify(mainBox)}`);
        } else {
            console.log('❌ 找不到主內容區域');
        }
        
        // 檢查是否有 Flexbox 佈局
        const flexContainer = await page.$('.flex');
        if (flexContainer) {
            console.log('✅ Flexbox 佈局容器存在');
        } else {
            console.log('❌ Flexbox 佈局容器不存在');
        }
        
        // 截圖
        await page.screenshot({ path: 'layout-fix-test.png', fullPage: true });
        console.log('📸 已保存排版修復測試截圖');
        
        // 檢查響應式
        console.log('📱 測試響應式設計...');
        
        // 桌面
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'layout-desktop.png' });
        
        // 平板
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'layout-tablet.png' });
        
        // 手機
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'layout-mobile.png' });
        
        console.log('✅ 排版修復測試完成');
        
    } catch (error) {
        console.error('❌ 測試錯誤:', error);
        await page.screenshot({ path: 'layout-fix-error.png' });
    } finally {
        await browser.close();
    }
}

testLayoutFix().catch(console.error);