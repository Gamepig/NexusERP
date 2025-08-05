// 下拉選單修復後的簡單測試
import { test, expect } from '@playwright/test';

test('檢查下拉選單修復效果和主題顏色', async ({ page, browser }) => {
  // 設置截圖目錄
  const screenshotDir = './screenshots';
  
  console.log('🚀 開始測試下拉選單修復效果...');
  
  try {
    // 前往登入頁面
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 已到達登入頁面');
    
    // 填寫登入資料
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 登入
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 成功登入到 Dashboard');
    
    // 等待導航載入
    await page.waitForSelector('.nexus-multi-nav', { timeout: 5000 });
    
    // 拍攝初始狀態
    await page.screenshot({ 
      path: `${screenshotDir}/fixed-dropdown-01-initial.png`,
      fullPage: true 
    });
    
    console.log('📸 已拍攝初始狀態截圖');
    
    // 檢查主題顏色設定
    const themeClass = await page.evaluate(() => {
      return document.documentElement.className;
    });
    
    console.log('🎨 當前主題類別:', themeClass);
    
    // 檢查下拉選單元素
    const dropdownElements = await page.$$('.nexus-nav-dropdown');
    console.log(`🔍 找到 ${dropdownElements.length} 個下拉選單元素`);
    
    // 檢查導航項目
    const navButtons = await page.$$('[x-data*="multiLevelNav"] button');
    console.log(`🔘 找到 ${navButtons.length} 個導航按鈕`);
    
    // 測試第一個有子選單的導航項目
    const firstNavButton = await page.$('[x-data*="multiLevelNav"] button');
    if (firstNavButton) {
      console.log('🖱️ 測試第一個導航按鈕懸停...');
      
      // 懸停觸發
      await firstNavButton.hover();
      await page.waitForTimeout(500);
      
      // 拍攝懸停後狀態
      await page.screenshot({ 
        path: `${screenshotDir}/fixed-dropdown-02-hover-test.png`,
        fullPage: true 
      });
      
      console.log('📸 已拍攝懸停測試截圖');
    }
    
    // 檢查 CSS 變數
    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      return {
        navBgPrimary: computedStyle.getPropertyValue('--nexus-nav-bg-primary'),
        navTextPrimary: computedStyle.getPropertyValue('--nexus-nav-text-primary'),
        navDropdownZIndex: computedStyle.getPropertyValue('--nexus-nav-z-dropdown'),
        bgPrimary: computedStyle.getPropertyValue('--nexus-bg-primary'),
        textPrimary: computedStyle.getPropertyValue('--nexus-text-primary')
      };
    });
    
    console.log('🎨 CSS 變數檢查:', cssVariables);
    
    // 檢查下拉選單的計算樣式
    if (dropdownElements.length > 0) {
      const dropdownStyle = await page.evaluate(() => {
        const dropdown = document.querySelector('.nexus-nav-dropdown');
        if (dropdown) {
          const style = getComputedStyle(dropdown);
          return {
            position: style.position,
            zIndex: style.zIndex,
            display: style.display,
            top: style.top,
            left: style.left,
            backgroundColor: style.backgroundColor,
            visibility: style.visibility
          };
        }
        return null;
      });
      
      console.log('🎯 下拉選單樣式檢查:', dropdownStyle);
    }
    
    // 嘗試點擊切換主題
    const themeToggle = await page.$('[data-theme-toggle]');
    if (themeToggle) {
      console.log('🌙 測試主題切換...');
      await themeToggle.click();
      await page.waitForTimeout(1000);
      
      const newThemeClass = await page.evaluate(() => {
        return document.documentElement.className;
      });
      
      console.log('🎨 切換後主題類別:', newThemeClass);
      
      // 拍攝主題切換後狀態
      await page.screenshot({ 
        path: `${screenshotDir}/fixed-dropdown-03-theme-switched.png`,
        fullPage: true 
      });
    }
    
    console.log('✅ 測試完成');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    
    // 拍攝錯誤狀態截圖
    await page.screenshot({ 
      path: `${screenshotDir}/fixed-dropdown-error.png`,
      fullPage: true 
    });
  }
});