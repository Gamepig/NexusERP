import { chromium } from 'playwright';

async function debugPageStructure() {
    console.log('🔍 檢查產品編輯頁面結構...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 登入
        console.log('📝 登入系統...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        console.log(`✅ 登入成功，當前 URL: ${page.url()}`);
        
        // 導航到編輯頁面
        console.log('📝 導航到產品編輯頁面...');
        await page.goto('http://127.0.0.1:8000/products/857/edit');
        await page.waitForLoadState('networkidle');
        
        console.log(`✅ 當前頁面 URL: ${page.url()}`);
        console.log(`✅ 頁面標題: ${await page.title()}`);
        
        // 截圖
        await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/page_structure_debug.png', fullPage: true });
        console.log('📸 已截取頁面截圖: page_structure_debug.png');
        
        // 檢查所有輸入欄位
        console.log('🔍 檢查頁面所有輸入欄位...');
        const inputs = await page.$$('input');
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const name = await input.getAttribute('name');
            const type = await input.getAttribute('type');
            const value = await input.inputValue();
            console.log(`輸入欄位 ${i + 1}: name="${name}", type="${type}", value="${value}"`);
        }
        
        // 檢查所有 textarea
        console.log('🔍 檢查頁面所有 textarea...');
        const textareas = await page.$$('textarea');
        for (let i = 0; i < textareas.length; i++) {
            const textarea = textareas[i];
            const name = await textarea.getAttribute('name');
            const value = await textarea.inputValue();
            console.log(`Textarea ${i + 1}: name="${name}", value="${value}"`);
        }
        
        // 檢查是否有包含庫存或閾值的元素
        console.log('🔍 搜尋包含庫存相關字詞的元素...');
        const stockElements = await page.$$('*:has-text("庫存"), *:has-text("stock"), *:has-text("閾值"), *:has-text("threshold")');
        for (let i = 0; i < stockElements.length; i++) {
            const element = stockElements[i];
            const text = await element.textContent();
            const tagName = await element.evaluate(el => el.tagName);
            console.log(`庫存相關元素 ${i + 1}: ${tagName} - "${text}"`);
        }
        
        // 檢查表單結構
        console.log('🔍 檢查表單結構...');
        const forms = await page.$$('form');
        for (let i = 0; i < forms.length; i++) {
            const form = forms[i];
            const action = await form.getAttribute('action');
            const method = await form.getAttribute('method');
            console.log(`表單 ${i + 1}: action="${action}", method="${method}"`);
        }
        
        // 等待用戶檢查
        console.log('🔍 瀏覽器將保持開啟 10 秒以供檢查...');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('❌ 錯誤:', error.message);
        await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/error_debug.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

debugPageStructure().catch(console.error);