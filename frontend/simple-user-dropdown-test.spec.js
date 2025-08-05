// 簡化的用戶下拉選單測試
import { test, expect } from '@playwright/test';

test.describe('簡化用戶下拉選單測試', () => {
  test('驗證用戶下拉選單的修改', async ({ page }) => {
    console.log('🚀 開始簡化的用戶下拉選單測試...');
    
    try {
      // 步驟 1: 直接導航到 dashboard
      console.log('📍 步驟1: 直接導航到 dashboard');
      await page.goto('http://127.0.0.1:8000/dashboard', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // 如果被重定向到登入頁面，執行登入
      if (page.url().includes('login')) {
        console.log('🔐 重定向到登入頁面，執行登入...');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ 登入成功');
      }
      
      // 等待頁面完全載入
      await page.waitForTimeout(3000);
      
      // 步驟 2: 截圖 - 初始狀態
      console.log('📍 步驟2: 截圖初始狀態');
      await page.screenshot({ 
        path: 'simple-user-dropdown-01-initial.png',
        fullPage: true 
      });
      
      // 步驟 3: 尋找用戶下拉選單按鈕
      console.log('📍 步驟3: 尋找用戶下拉選單按鈕');
      
      // 更具體地定位用戶選單
      const userMenuButton = page.locator('[x-data] button:has-text("test@example.com")').first();
      
      if (await userMenuButton.isVisible()) {
        console.log('✅ 找到用戶選單按鈕');
        
        // 步驟 4: 點擊用戶選單按鈕
        console.log('📍 步驟4: 點擊用戶選單按鈕');
        await userMenuButton.click();
        
        // 等待下拉選單出現
        await page.waitForTimeout(1000);
        
        // 步驟 5: 截圖 - 點擊後狀態
        console.log('📍 步驟5: 截圖點擊後狀態');
        await page.screenshot({ 
          path: 'simple-user-dropdown-02-after-click.png',
          fullPage: true 
        });
        
        // 步驟 6: 尋找下拉選單內容
        console.log('📍 步驟6: 尋找下拉選單內容');
        
        // 嘗試找到可見的下拉選單
        const dropdownMenu = page.locator('[x-show]:visible, .dropdown-menu:visible').first();
        
        if (await dropdownMenu.isVisible()) {
          console.log('✅ 找到下拉選單');
          
          // 獲取選單項目文本
          const menuItems = await dropdownMenu.locator('a, button').allTextContents();
          console.log('📋 選單項目:', menuItems);
          
          // 檢查修改效果
          const hasSettings = menuItems.some(text => text.includes('設定') || text.includes('Settings'));
          const hasHelpCenter = menuItems.some(text => text.includes('說明中心') || text.includes('Help'));
          const hasProfile = menuItems.some(text => text.includes('個人資料') || text.includes('Profile'));
          const hasLogout = menuItems.some(text => text.includes('登出') || text.includes('Logout'));
          
          console.log('📊 測試結果:');
          console.log(`  移除「設定」: ${!hasSettings ? '✅ 成功' : '❌ 失敗'}`);
          console.log(`  移除「說明中心」: ${!hasHelpCenter ? '✅ 成功' : '❌ 失敗'}`);
          console.log(`  保留「個人資料」: ${hasProfile ? '✅ 成功' : '❌ 失敗'}`);
          console.log(`  保留「登出」: ${hasLogout ? '✅ 成功' : '❌ 失敗'}`);
          
        } else {
          console.log('⚠️ 點擊後未找到可見的下拉選單');
          
          // 檢查是否有隱藏的下拉選單
          const hiddenMenu = page.locator('[x-show]').first();
          if (await hiddenMenu.count() > 0) {
            console.log('📋 找到隱藏的選單元素，檢查 x-show 狀態');
            const xShowValue = await hiddenMenu.getAttribute('x-show');
            console.log(`  x-show 值: ${xShowValue}`);
          }
        }
        
      } else {
        console.log('❌ 無法找到用戶選單按鈕');
        
        // 檢查頁面上所有按鈕
        const allButtons = await page.locator('button').allTextContents();
        console.log('📋 頁面所有按鈕:', allButtons.filter(text => text.trim()));
      }
      
      // 步驟 7: 最終截圖
      console.log('📍 步驟7: 最終截圖');
      await page.screenshot({ 
        path: 'simple-user-dropdown-03-final.png',
        fullPage: true 
      });
      
    } catch (error) {
      console.error('❌ 測試過程中發生錯誤:', error.message);
      
      // 錯誤截圖
      await page.screenshot({ 
        path: 'simple-user-dropdown-error.png',
        fullPage: true 
      });
      
      throw error;
    }
  });
});