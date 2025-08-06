// NexusERP UI 診斷測試
import { test, expect } from '@playwright/test';

test.describe('NexusERP UI 問題診斷', () => {
    test('系統導航和色調問題診斷', async ({ page, context }) => {
        console.log('🔍 開始診斷 NexusERP UI 問題...');
        
        // 設定測試用戶憑證
        const testCredentials = {
            email: 'test@example.com',
            password: 'password123'
        };
        
        try {
            // 步驟 1: 訪問首頁檢查基本載入
            console.log('📍 步驟 1: 檢查首頁載入狀況');
            await page.goto('http://127.0.0.1:8000');
            await page.waitForLoadState('networkidle');
            
            // 檢查基本頁面結構
            const title = await page.title();
            console.log(`✓ 頁面標題: ${title}`);
            
            // 截圖記錄初始狀態
            await page.screenshot({ 
                path: 'ui-diagnosis-01-homepage.png',
                fullPage: true
            });
            
            // 步驟 2: 登入系統
            console.log('📍 步驟 2: 執行登入流程');
            
            // 檢查登入按鈕
            const loginButton = page.locator('a[href*="login"], button:has-text("登入"), button:has-text("Login")');
            if (await loginButton.count() > 0) {
                await loginButton.first().click();
                await page.waitForLoadState('networkidle');
            }
            
            // 填寫登入表單
            await page.fill('input[type="email"], input[name="email"]', testCredentials.email);
            await page.fill('input[type="password"], input[name="password"]', testCredentials.password);
            
            // 提交登入表單
            await page.click('button[type="submit"], input[type="submit"]');
            await page.waitForTimeout(3000);
            
            // 截圖記錄登入後狀態
            await page.screenshot({ 
                path: 'ui-diagnosis-02-after-login.png',
                fullPage: true
            });
            
            // 步驟 3: 檢查系統導航問題
            console.log('📍 步驟 3: 診斷系統導航問題');
            
            // 檢查導航元素
            const navigation = page.locator('nav, .navigation, .sidebar, .nav-menu');
            const navCount = await navigation.count();
            console.log(`✓ 找到 ${navCount} 個導航元素`);
            
            // 檢查主導航結構
            const mainNav = page.locator('.nav-link, .menu-item, a[href*="dashboard"]');
            const navItems = await mainNav.count();
            console.log(`✓ 找到 ${navItems} 個導航項目`);
            
            // 檢查導航樣式
            const navStyles = await page.locator('nav').first().evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    backgroundColor: styles.backgroundColor,
                    color: styles.color,
                    display: styles.display,
                    position: styles.position
                };
            }).catch(() => null);
            
            if (navStyles) {
                console.log('✓ 導航樣式:', navStyles);
            }
            
            // 步驟 4: 檢查使用者資訊下拉選單
            console.log('📍 步驟 4: 檢查使用者下拉選單');
            
            // 尋找使用者下拉選單
            const userDropdown = page.locator('.user-dropdown, .profile-dropdown, [data-dropdown], .dropdown');
            const dropdownCount = await userDropdown.count();
            console.log(`✓ 找到 ${dropdownCount} 個下拉選單`);
            
            if (dropdownCount > 0) {
                // 嘗試觸發下拉選單
                await userDropdown.first().hover();
                await page.waitForTimeout(1000);
                
                // 檢查下拉選單樣式
                const dropdownStyles = await userDropdown.first().evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return {
                        backgroundColor: styles.backgroundColor,
                        borderRadius: styles.borderRadius,
                        boxShadow: styles.boxShadow,
                        padding: styles.padding
                    };
                }).catch(() => null);
                
                if (dropdownStyles) {
                    console.log('✓ 下拉選單樣式:', dropdownStyles);
                }
            }
            
            // 截圖記錄導航診斷結果
            await page.screenshot({ 
                path: 'ui-diagnosis-03-navigation-check.png',
                fullPage: true
            });
            
            // 步驟 5: 檢查色調問題
            console.log('📍 步驟 5: 診斷色調問題');
            
            // 檢查主體樣式
            const bodyStyles = await page.evaluate(() => {
                const body = document.body;
                const styles = window.getComputedStyle(body);
                return {
                    backgroundColor: styles.backgroundColor,
                    color: styles.color,
                    fontFamily: styles.fontFamily
                };
            });
            
            console.log('✓ 頁面主體樣式:', bodyStyles);
            
            // 檢查主要內容區域的色調
            const mainContent = page.locator('main, .main, .content, .dashboard');
            if (await mainContent.count() > 0) {
                const contentStyles = await mainContent.first().evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return {
                        backgroundColor: styles.backgroundColor,
                        color: styles.color
                    };
                }).catch(() => null);
                
                if (contentStyles) {
                    console.log('✓ 主要內容區域樣式:', contentStyles);
                }
            }
            
            // 檢查卡片組件的色調
            const cards = page.locator('.card, .widget, .panel');
            const cardCount = await cards.count();
            console.log(`✓ 找到 ${cardCount} 個卡片組件`);
            
            if (cardCount > 0) {
                const cardStyles = await cards.first().evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return {
                        backgroundColor: styles.backgroundColor,
                        borderColor: styles.borderColor,
                        color: styles.color
                    };
                }).catch(() => null);
                
                if (cardStyles) {
                    console.log('✓ 卡片組件樣式:', cardStyles);
                }
            }
            
            // 步驟 6: 檢查報表頁面（除外頁面）
            console.log('📍 步驟 6: 檢查報表頁面色調');
            
            // 嘗試訪問報表頁面
            try {
                await page.goto('http://127.0.0.1:8000/reports');
                await page.waitForLoadState('networkidle');
                
                // 檢查報表頁面色調
                const reportsBodyStyles = await page.evaluate(() => {
                    const body = document.body;
                    const styles = window.getComputedStyle(body);
                    return {
                        backgroundColor: styles.backgroundColor,
                        color: styles.color
                    };
                });
                
                console.log('✓ 報表頁面樣式:', reportsBodyStyles);
                
                // 截圖記錄報表頁面
                await page.screenshot({ 
                    path: 'ui-diagnosis-04-reports-page.png',
                    fullPage: true
                });
                
            } catch (error) {
                console.log('⚠️ 無法訪問報表頁面:', error.message);
            }
            
            // 最終診斷結果截圖
            await page.screenshot({ 
                path: 'ui-diagnosis-05-final-state.png',
                fullPage: true
            });
            
            console.log('✅ UI 診斷測試完成');
            
        } catch (error) {
            console.error('❌ UI 診斷測試失敗:', error.message);
            
            // 錯誤狀態截圖
            await page.screenshot({ 
                path: 'ui-diagnosis-error.png',
                fullPage: true
            });
            
            throw error;
        }
    });
});