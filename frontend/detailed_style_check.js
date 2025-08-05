import { chromium } from 'playwright';

async function detailedStyleCheck() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('執行詳細樣式檢查...');
        
        // 登入流程
        await page.goto('http://127.0.0.1:8000');
        await page.click('text=登入');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // 點擊用戶下拉選單
        await page.click('button:has-text("使用者")');
        await page.waitForTimeout(1000);
        
        // 詳細檢查樣式
        const detailedStyles = await page.evaluate(() => {
            const userDropdown = document.getElementById('user-dropdown');
            if (!userDropdown) return null;
            
            const styles = window.getComputedStyle(userDropdown);
            const rect = userDropdown.getBoundingClientRect();
            
            return {
                // 基本資訊
                elementId: userDropdown.id,
                className: userDropdown.className,
                isVisible: styles.display !== 'none' && styles.visibility !== 'hidden',
                
                // 背景和邊框
                backgroundColor: styles.backgroundColor,
                backgroundImage: styles.backgroundImage,
                borderColor: styles.borderColor,
                borderWidth: styles.borderWidth,
                borderStyle: styles.borderStyle,
                borderRadius: styles.borderRadius,
                
                // 陰影和其他效果
                boxShadow: styles.boxShadow,
                opacity: styles.opacity,
                
                // 位置和大小
                position: styles.position,
                top: styles.top,
                right: styles.right,
                width: rect.width,
                height: rect.height,
                
                // 其他相關樣式
                zIndex: styles.zIndex,
                padding: styles.padding,
                margin: styles.margin
            };
        });
        
        console.log('\n=== 詳細樣式檢查結果 ===');
        console.log('用戶下拉選單詳細樣式:', JSON.stringify(detailedStyles, null, 2));
        
        // 驗證結果
        if (detailedStyles) {
            console.log('\n=== 樣式驗證結果 ===');
            
            // 檢查背景顏色
            const bgColor = detailedStyles.backgroundColor;
            const isWhiteBackground = bgColor === 'rgb(255, 255, 255)' || 
                                    bgColor === 'rgba(255, 255, 255, 1)' || 
                                    bgColor === 'white';
            
            console.log(`背景顏色檢查: ${isWhiteBackground ? '✅ 通過' : '❌ 失敗'}`);
            console.log(`  實際值: ${bgColor}`);
            console.log(`  預期值: rgb(255, 255, 255) 或 white`);
            
            // 檢查邊框
            const borderColor = detailedStyles.borderColor;
            const expectedBorderColor = 'rgb(229, 231, 235)'; // #e5e7eb
            const isBorderCorrect = borderColor.includes('229, 231, 235') || 
                                  borderColor.includes('rgb(229, 231, 235)');
            
            console.log(`邊框顏色檢查: ${isBorderCorrect ? '✅ 通過' : '❌ 失敗'}`);
            console.log(`  實際值: ${borderColor}`);
            console.log(`  預期值: rgb(229, 231, 235) (#e5e7eb)`);
            
            // 檢查漸變背景是否移除
            const bgImage = detailedStyles.backgroundImage;
            const hasGradient = bgImage && bgImage !== 'none' && bgImage.includes('gradient');
            
            console.log(`漸變背景檢查: ${!hasGradient ? '✅ 通過 (無漸變)' : '❌ 失敗 (仍有漸變)'}`);
            console.log(`  實際值: ${bgImage}`);
            
            // 總結
            const allChecksPass = isWhiteBackground && isBorderCorrect && !hasGradient;
            console.log(`\n=== 總體結果 ===`);
            console.log(`CSS 修改效果: ${allChecksPass ? '✅ 完全成功' : '⚠️ 部分成功或需要調整'}`);
            
        } else {
            console.log('❌ 無法找到用戶下拉選單進行樣式檢查');
        }
        
        // 最後截圖
        await page.screenshot({ 
            path: 'detailed_style_check.png', 
            fullPage: true 
        });
        
    } catch (error) {
        console.log(`錯誤: ${error}`);
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

detailedStyleCheck().catch(console.error);