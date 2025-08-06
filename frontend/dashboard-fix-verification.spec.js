/**
 * NexusERP 儀表板修復驗證測試
 * 測試目標：
 * 1. 統計分析容器不再有深色背景
 * 2. 營收趨勢圖表不再顯示「載入中...」文字
 * 3. 預設主題為深色
 * 4. 主題切換功能正常
 */

import { test, expect } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123'
};

test.describe('儀表板修復驗證', () => {
  
  test('驗證統計分析容器背景修復', async ({ page }) => {
    console.log('開始測試統計分析容器背景修復...');
    
    // 前往儀表板頁面
    await page.goto('/dashboard');
    
    // 如果需要登入，先完成登入
    if (await page.locator('input[name="email"]').isVisible()) {
      console.log('檢測到登入頁面，執行登入...');
      await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // 等待儀表板完全載入
    await page.waitForSelector('.grid', { timeout: 10000 });
    
    // 檢查統計分析容器
    const statsContainers = await page.locator('.bg-white.dark\\:bg-gray-800, .bg-gray-50.dark\\:bg-gray-900');
    const containerCount = await statsContainers.count();
    
    if (containerCount > 0) {
      console.log(`找到 ${containerCount} 個統計容器`);
      
      // 檢查是否沒有多餘的深色背景類別
      const darkBackgroundContainers = await page.locator('.bg-gray-900:not(.dark\\:bg-gray-900)').count();
      
      expect(darkBackgroundContainers).toBe(0);
      console.log('✓ 統計分析容器背景修復正常');
    }
    
    // 截圖記錄
    await page.screenshot({ 
      path: 'dashboard-fix-stats-containers.png',
      fullPage: true
    });
  });

  test('驗證營收趨勢圖表載入狀態修復', async ({ page }) => {
    console.log('開始測試營收趨勢圖表載入狀態...');
    
    await page.goto('/dashboard');
    
    // 登入流程
    if (await page.locator('input[name="email"]').isVisible()) {
      console.log('執行登入...');
      await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // 等待圖表容器載入
    await page.waitForSelector('.grid', { timeout: 10000 });
    
    // 等待一段時間讓圖表完全渲染
    await page.waitForTimeout(3000);
    
    // 檢查是否還有「載入中...」文字
    const loadingTexts = await page.locator('text=載入中').count();
    const loadingSpinners = await page.locator('.animate-spin').count();
    
    expect(loadingTexts).toBe(0);
    console.log('✓ 沒有發現「載入中...」文字');
    
    // 檢查圖表是否正常渲染
    const chartContainers = await page.locator('[id*="chart"], canvas, svg').count();
    expect(chartContainers).toBeGreaterThan(0);
    console.log(`✓ 發現 ${chartContainers} 個圖表元素`);
    
    // 截圖記錄
    await page.screenshot({ 
      path: 'dashboard-fix-charts-loaded.png',
      fullPage: true
    });
  });

  test('驗證預設主題為深色', async ({ page }) => {
    console.log('開始測試預設主題設定...');
    
    await page.goto('/dashboard');
    
    // 登入流程
    if (await page.locator('input[name="email"]').isVisible()) {
      await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // 檢查 html 標籤是否有 dark 類別
    const htmlElement = await page.locator('html');
    const htmlClasses = await htmlElement.getAttribute('class');
    
    console.log('HTML 類別:', htmlClasses);
    
    // 檢查是否為深色主題
    const hasDarkClass = htmlClasses && htmlClasses.includes('dark');
    expect(hasDarkClass).toBe(true);
    console.log('✓ 預設主題為深色模式');
    
    // 截圖記錄
    await page.screenshot({ 
      path: 'dashboard-fix-dark-theme.png',
      fullPage: true
    });
  });

  test('驗證主題切換功能正常', async ({ page }) => {
    console.log('開始測試主題切換功能...');
    
    await page.goto('/dashboard');
    
    // 登入流程
    if (await page.locator('input[name="email"]').isVisible()) {
      await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // 查找主題切換按鈕
    const themeToggleButtons = await page.locator('button[onclick*="toggleTheme"], button[data-theme-toggle], #theme-toggle, .theme-toggle');
    const buttonCount = await themeToggleButtons.count();
    
    console.log(`發現 ${buttonCount} 個主題切換按鈕`);
    
    if (buttonCount > 0) {
      // 記錄初始狀態
      const initialHtmlClasses = await page.locator('html').getAttribute('class');
      console.log('初始主題狀態:', initialHtmlClasses);
      
      // 點擊主題切換按鈕
      await themeToggleButtons.first().click();
      await page.waitForTimeout(500); // 等待主題切換動畫
      
      // 檢查主題是否已切換
      const updatedHtmlClasses = await page.locator('html').getAttribute('class');
      console.log('切換後主題狀態:', updatedHtmlClasses);
      
      // 驗證主題確實發生了變化
      expect(initialHtmlClasses).not.toBe(updatedHtmlClasses);
      console.log('✓ 主題切換功能正常');
      
      // 截圖記錄切換後的狀態
      await page.screenshot({ 
        path: 'dashboard-fix-theme-switched.png',
        fullPage: true
      });
      
      // 再次切換回來測試
      await themeToggleButtons.first().click();
      await page.waitForTimeout(500);
      
      const finalHtmlClasses = await page.locator('html').getAttribute('class');
      expect(finalHtmlClasses).toBe(initialHtmlClasses);
      console.log('✓ 主題可以正常切換回原狀態');
      
    } else {
      console.log('⚠️ 未找到主題切換按鈕');
    }
  });

  test('儀表板整體功能綜合驗證', async ({ page }) => {
    console.log('開始儀表板整體功能驗證...');
    
    await page.goto('/dashboard');
    
    // 登入流程
    if (await page.locator('input[name="email"]').isVisible()) {
      await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // 等待頁面完全載入
    await page.waitForSelector('.grid', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // 檢查主要功能區塊
    const mainContent = await page.locator('main, .main-content, #main').count();
    expect(mainContent).toBeGreaterThan(0);
    console.log('✓ 主要內容區域正常');
    
    // 檢查導航是否存在
    const navigation = await page.locator('nav, .navigation, .navbar').count();
    expect(navigation).toBeGreaterThan(0);
    console.log('✓ 導航元件正常');
    
    // 檢查是否有錯誤消息
    const errorMessages = await page.locator('.error, .alert-danger, [class*="error"]').count();
    expect(errorMessages).toBe(0);
    console.log('✓ 沒有錯誤消息');
    
    // 最終截圖
    await page.screenshot({ 
      path: 'dashboard-fix-final-verification.png',
      fullPage: true
    });
    
    console.log('✓ 儀表板整體功能驗證完成');
  });

});