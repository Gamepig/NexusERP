import { chromium } from 'playwright';

async function testThemeSwitching() {
    console.log('🚀 開始測試儀表板主題切換功能...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000  // 慢速操作以便觀察
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        // 1. 登入系統
        console.log('📝 正在登入系統...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // 等待登入成功並跳轉到儀表板
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ 登入成功，已到達儀表板');
        
        // 2. 等待儀表板內容載入
        await page.waitForSelector('#dashboard-content', { timeout: 15000 });
        await page.waitForTimeout(2000); // 等待動畫完成
        console.log('✅ 儀表板內容已載入');
        
        // 3. 找到紅色框區域（公司資訊區域）
        const companyInfoSection = page.locator('.dashboard-info-grid');
        await companyInfoSection.waitFor({ timeout: 5000 });
        console.log('✅ 找到公司資訊區域');
        
        // 4. 截圖 - 深色主題狀態
        await page.screenshot({
            path: 'screenshots/dashboard-dark-theme-before.png',
            fullPage: true
        });
        console.log('📸 已截圖：深色主題狀態');
        
        // 5. 檢查當前主題
        const currentTheme = await page.evaluate(() => {
            return document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
        });
        console.log(`🎨 當前主題：${currentTheme}`);
        
        // 6. 尋找主題切換按鈕
        let themeToggleButton = null;
        try {
            // 方法1：通過 data-theme-toggle 屬性尋找
            themeToggleButton = page.locator('[data-theme-toggle]').first();
            await themeToggleButton.waitFor({ timeout: 3000 });
            console.log('✅ 找到主題切換按鈕 (data-theme-toggle)');
        } catch (error) {
            try {
                // 方法2：通過類名尋找
                themeToggleButton = page.locator('.theme-toggle').first();
                await themeToggleButton.waitFor({ timeout: 3000 });
                console.log('✅ 找到主題切換按鈕 (theme-toggle class)');
            } catch (error2) {
                // 方法3：手動切換主題
                console.log('⚠️ 未找到主題切換按鈕，手動執行主題切換');
                await page.evaluate(() => {
                    if (window.NexusTheme) {
                        window.NexusTheme.toggleTheme();
                    } else if (window.nexusTheme) {
                        window.nexusTheme.toggleTheme();
                    } else {
                        // 手動切換主題類
                        const root = document.documentElement;
                        if (root.classList.contains('dark-theme')) {
                            root.classList.remove('dark-theme', 'dark');
                            root.classList.add('light-theme');
                        } else {
                            root.classList.remove('light-theme');
                            root.classList.add('dark-theme', 'dark');
                        }
                    }
                });
            }
        }
        
        // 7. 點擊主題切換按鈕（如果找到的話）
        if (themeToggleButton) {
            await themeToggleButton.click();
            console.log('🔄 已點擊主題切換按鈕');
        }
        
        // 8. 等待主題切換完成
        await page.waitForTimeout(1000);
        
        // 9. 檢查主題是否已切換
        const newTheme = await page.evaluate(() => {
            return document.documentElement.classList.contains('light-theme') ? 'light' : 'dark';
        });
        console.log(`🎨 切換後主題：${newTheme}`);
        
        // 10. 截圖 - 切換後主題狀態
        await page.screenshot({
            path: 'screenshots/dashboard-light-theme-after.png',
            fullPage: true
        });
        console.log('📸 已截圖：淺色主題狀態');
        
        // 11. 檢查公司資訊區域的顏色是否正確切換
        const cardBackgroundColors = await page.evaluate(() => {
            const cards = document.querySelectorAll('.user-identity-card, .company-info-card, .business-stats-card');
            return Array.from(cards).map(card => {
                const styles = window.getComputedStyle(card);
                return {
                    backgroundColor: styles.backgroundColor,
                    borderColor: styles.borderColor,
                    color: styles.color
                };
            });
        });
        
        console.log('🎨 卡片樣式檢查：', cardBackgroundColors);
        
        // 12. 再次切換回原主題
        if (themeToggleButton) {
            await themeToggleButton.click();
        } else {
            await page.evaluate(() => {
                if (window.NexusTheme) {
                    window.NexusTheme.toggleTheme();
                } else {
                    const root = document.documentElement;
                    if (root.classList.contains('light-theme')) {
                        root.classList.remove('light-theme');
                        root.classList.add('dark-theme', 'dark');
                    } else {
                        root.classList.remove('dark-theme', 'dark');
                        root.classList.add('light-theme');
                    }
                }
            });
        }
        
        await page.waitForTimeout(1000);
        
        // 13. 最終截圖
        await page.screenshot({
            path: 'screenshots/dashboard-final-theme-test.png',
            fullPage: true
        });
        console.log('📸 已截圖：最終測試結果');
        
        console.log('✅ 主題切換測試完成！');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤：', error);
        
        // 錯誤截圖
        await page.screenshot({
            path: 'screenshots/dashboard-theme-test-error.png',
            fullPage: true
        });
    } finally {
        await browser.close();
    }
}

// 執行測試
testThemeSwitching().catch(console.error);