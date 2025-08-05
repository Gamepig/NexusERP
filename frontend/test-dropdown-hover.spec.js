// 測試下拉選單懸停功能
import { test, expect } from '@playwright/test';

test('測試下拉選單懸停顯示功能', async ({ page }) => {
  const screenshotDir = './screenshots';
  
  console.log('🚀 開始測試下拉選單懸停功能...');
  
  // 登入到系統
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.waitForLoadState('networkidle');
  
  console.log('✅ 成功登入');
  
  // 等待導航載入
  await page.waitForSelector('.nexus-multi-nav', { timeout: 5000 });
  
  // 找到所有導航按鈕
  const navButtons = await page.$$('.nexus-multi-nav button');
  console.log(`🔘 找到 ${navButtons.length} 個導航按鈕`);
  
  // 拍攝初始狀態
  await page.screenshot({ 
    path: `${screenshotDir}/hover-test-01-initial.png`,
    fullPage: true 
  });
  
  // 測試每個導航按鈕的懸停
  for (let i = 0; i < Math.min(navButtons.length, 6); i++) {
    const button = navButtons[i];
    
    // 獲取按鈕文字
    const buttonText = await button.textContent();
    console.log(`🖱️ 測試按鈕 ${i + 1}: "${buttonText?.trim()}"`);
    
    // 懸停
    await button.hover();
    await page.waitForTimeout(800); // 等待下拉選單動畫
    
    // 檢查是否有下拉選單顯示
    const visibleDropdowns = await page.$$eval('.nexus-nav-dropdown', dropdowns => 
      dropdowns.filter(d => {
        const style = getComputedStyle(d);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      }).length
    );
    
    console.log(`📊 懸停後可見的下拉選單數量: ${visibleDropdowns}`);
    
    // 拍攝懸停狀態
    await page.screenshot({ 
      path: `${screenshotDir}/hover-test-${String(i + 2).padStart(2, '0')}-hover-${buttonText?.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '') || 'unknown'}.png`,
      fullPage: true 
    });
    
    // 移開滑鼠
    await page.mouse.move(100, 100);
    await page.waitForTimeout(500);
  }
  
  // 測試點擊觸發
  console.log('🖱️ 測試點擊觸發...');
  
  if (navButtons.length > 0) {
    await navButtons[0].click();
    await page.waitForTimeout(500);
    
    const clickDropdowns = await page.$$eval('.nexus-nav-dropdown', dropdowns => 
      dropdowns.filter(d => {
        const style = getComputedStyle(d);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      }).length
    );
    
    console.log(`📊 點擊後可見的下拉選單數量: ${clickDropdowns}`);
    
    await page.screenshot({ 
      path: `${screenshotDir}/hover-test-final-click-test.png`,
      fullPage: true 
    });
  }
  
  console.log('✅ 懸停測試完成');
});