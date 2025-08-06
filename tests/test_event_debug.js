import { chromium } from 'playwright';

async function debugEvents() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('=== 事件調試測試 ===\n');

        // 1. 登入
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ 登入成功');

        // 2. 注入事件調試腳本
        await page.evaluate(() => {
            // 攔截所有 dashboard 相關事件
            const originalDispatchEvent = document.dispatchEvent.bind(document);
            document.dispatchEvent = function(event) {
                if (event.type.startsWith('dashboard-')) {
                    console.log('[DEBUG] 事件被觸發:', event.type, event.detail);
                }
                return originalDispatchEvent(event);
            };
            
            // 添加通用事件監聽器
            document.addEventListener('dashboard-loaded', function(e) {
                console.log('[DEBUG] dashboard-loaded 監聽器觸發:', e.detail);
            });
            
            document.addEventListener('dashboard-error', function(e) {
                console.log('[DEBUG] dashboard-error 監聽器觸發:', e.detail);
            });
            
            document.addEventListener('dashboard-loading-start', function(e) {
                console.log('[DEBUG] dashboard-loading-start 監聽器觸發:', e.detail);
            });
            
            console.log('[DEBUG] 事件調試腳本已注入');
        });

        // 3. 等待事件
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(10000);
        
        // 4. 手動觸發測試事件
        await page.evaluate(() => {
            console.log('[DEBUG] 手動觸發測試事件...');
            const testEvent = new CustomEvent('dashboard-loaded', {
                detail: { test: true },
                bubbles: true
            });
            document.dispatchEvent(testEvent);
        });
        
        await page.waitForTimeout(2000);
        
        console.log('\n測試完成');

    } catch (error) {
        console.error('測試錯誤:', error);
    } finally {
        await browser.close();
    }
}

debugEvents();