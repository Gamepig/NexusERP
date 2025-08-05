import { chromium } from 'playwright';

async function inspectDropdownHTML() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('檢查下拉選單的 HTML 結構...');
        
        // 登入流程
        await page.goto('http://127.0.0.1:8000');
        await page.click('text=登入');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // 點擊用戶下拉選單
        const userButton = page.locator('button:has-text("使用者")');
        await userButton.click();
        await page.waitForTimeout(1000);
        
        // 獲取完整的下拉選單 HTML 結構
        const dropdownHTML = await page.evaluate(() => {
            // 查找所有可能的下拉選單元素
            const results = [];
            
            // 查找所有可見的下拉選單
            const visibleDropdowns = Array.from(document.querySelectorAll('.dropdown-menu, [id*="dropdown"], [class*="dropdown"]'))
                .filter(el => {
                    const styles = window.getComputedStyle(el);
                    return styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0';
                });
            
            visibleDropdowns.forEach(el => {
                const rect = el.getBoundingClientRect();
                const styles = window.getComputedStyle(el);
                
                results.push({
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    innerHTML: el.innerHTML.substring(0, 500),
                    isVisible: rect.width > 0 && rect.height > 0,
                    position: {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                    },
                    styles: {
                        backgroundColor: styles.backgroundColor,
                        borderColor: styles.borderColor,
                        borderWidth: styles.borderWidth,
                        display: styles.display,
                        position: styles.position
                    }
                });
            });
            
            return results;
        });
        
        console.log('\n=== 找到的下拉選單元素 ===');
        dropdownHTML.forEach((dropdown, index) => {
            console.log(`\n下拉選單 ${index + 1}:`);
            console.log(`  標籤: ${dropdown.tagName}`);
            console.log(`  ID: ${dropdown.id || '(無)'}`);
            console.log(`  Class: ${dropdown.className || '(無)'}`);
            console.log(`  可見性: ${dropdown.isVisible ? '可見' : '隱藏'}`);
            console.log(`  位置: ${JSON.stringify(dropdown.position)}`);
            console.log(`  樣式: ${JSON.stringify(dropdown.styles, null, 2)}`);
            console.log(`  HTML 內容: ${dropdown.innerHTML.substring(0, 200)}...`);
            
            // 驗證白色背景
            const bgColor = dropdown.styles.backgroundColor;
            const isWhite = bgColor === 'rgb(255, 255, 255)' || 
                          bgColor === 'rgba(255, 255, 255, 1)' || 
                          bgColor === 'white';
            
            console.log(`  背景顏色檢查: ${isWhite ? '✅ 白色背景' : '❌ 非白色背景'} (${bgColor})`);
        });
        
        // 截圖當前狀態
        await page.screenshot({ 
            path: 'dropdown_html_inspection.png', 
            fullPage: true 
        });
        
        console.log(`\n總共找到 ${dropdownHTML.length} 個下拉選單元素`);
        
    } catch (error) {
        console.log(`錯誤: ${error}`);
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

inspectDropdownHTML().catch(console.error);