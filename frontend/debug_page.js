import { chromium } from 'playwright';

async function debugPage() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 2000 
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('導航到主頁...');
        await page.goto('http://127.0.0.1:8000');
        await page.waitForTimeout(3000);
        
        console.log('檢查頁面內容...');
        
        // 檢查是否有任何下拉觸發按鈕
        const allButtons = await page.locator('button').all();
        console.log(`找到 ${allButtons.length} 個按鈕`);
        
        // 檢查所有可能的用戶相關元素
        const userElements = await page.evaluate(() => {
            const elements = [];
            
            // 查找所有包含 'user' 的元素
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.id && el.id.toLowerCase().includes('user')) {
                    elements.push({
                        tag: el.tagName,
                        id: el.id,
                        class: el.className,
                        text: el.textContent?.substring(0, 50)
                    });
                }
                if (el.className && el.className.toLowerCase().includes('user')) {
                    elements.push({
                        tag: el.tagName,
                        id: el.id,
                        class: el.className,
                        text: el.textContent?.substring(0, 50)
                    });
                }
            });
            
            // 查找所有下拉相關元素
            const dropdownElements = document.querySelectorAll('[data-dropdown-toggle], [data-bs-toggle="dropdown"], .dropdown-toggle');
            dropdownElements.forEach(el => {
                elements.push({
                    tag: el.tagName,
                    id: el.id,
                    class: el.className,
                    'data-dropdown-toggle': el.getAttribute('data-dropdown-toggle'),
                    text: el.textContent?.substring(0, 50)
                });
            });
            
            return elements;
        });
        
        console.log('找到的用戶/下拉相關元素:', userElements);
        
        // 截圖當前狀態
        await page.screenshot({ 
            path: 'debug_page_full.png', 
            fullPage: true 
        });
        
        console.log('截圖已保存為 debug_page_full.png');
        
        // 等待用戶手動操作
        console.log('等待 10 秒供手動檢查...');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.log(`錯誤: ${error}`);
    } finally {
        await browser.close();
    }
}

debugPage().catch(console.error);