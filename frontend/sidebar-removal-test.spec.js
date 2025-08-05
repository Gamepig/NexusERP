import { test, expect } from '@playwright/test';

test.describe('側邊欄移除後的頁面測試', () => {
  test('測試移除左側邊欄後的頁面效果', async ({ page }) => {
    console.log('🚀 開始測試移除左側邊欄後的頁面效果...');

    try {
      // 步驟 1: 訪問首頁
      console.log('📍 步驟 1: 訪問首頁');
      await page.goto('http://127.0.0.1:8000');
      await page.waitForLoadState('networkidle');
      
      // 截圖記錄首頁狀態
      await page.screenshot({ 
        path: 'screenshots/sidebar-test-01-homepage.png',
        fullPage: true 
      });
      console.log('✅ 首頁截圖已保存');

      // 步驟 2: 登入系統
      console.log('📍 步驟 2: 進行登入');
      
      // 檢查是否在登入頁面或需要登入
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/auth/login')) {
        console.log('🔐 偵測到登入頁面，進行登入');
        
        // 填寫登入表單
        await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
        await page.fill('input[name="password"], input[type="password"]', 'password123');
        
        // 提交登入表單
        await page.click('button[type="submit"], .btn-primary, .login-btn');
        await page.waitForLoadState('networkidle');
        
        console.log('✅ 登入完成');
      } else {
        console.log('ℹ️  已在首頁，嘗試訪問儀表板');
      }

      // 步驟 3: 訪問儀表板頁面
      console.log('📍 步驟 3: 訪問儀表板頁面');
      await page.goto('http://127.0.0.1:8000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // 等待頁面完全載入
      await page.waitForTimeout(3000);

      // 截圖記錄儀表板初始狀態
      await page.screenshot({ 
        path: 'screenshots/sidebar-test-02-dashboard-initial.png',
        fullPage: true 
      });
      console.log('✅ 儀表板初始狀態截圖已保存');

      // 步驟 4: 檢查左側邊欄是否已移除
      console.log('📍 步驟 4: 檢查左側邊欄狀態');
      
      // 檢查可能的側邊欄選擇器
      const sidebarSelectors = [
        '.sidebar',
        '#sidebar', 
        '.nav-sidebar',
        '.side-navigation',
        '.left-sidebar',
        '[class*="sidebar"]',
        'aside'
      ];

      let sidebarFound = false;
      for (const selector of sidebarSelectors) {
        const sidebarElements = await page.locator(selector).count();
        if (sidebarElements > 0) {
          console.log(`⚠️  發現側邊欄元素: ${selector} (數量: ${sidebarElements})`);
          sidebarFound = true;
          
          // 檢查是否可見
          const isVisible = await page.locator(selector).first().isVisible();
          console.log(`   - 可見性: ${isVisible ? '可見' : '隱藏'}`);
        }
      }

      if (!sidebarFound) {
        console.log('✅ 左側邊欄已成功移除');
      }

      // 步驟 5: 檢查主內容區域是否全寬顯示
      console.log('📍 步驟 5: 檢查主內容區域佈局');
      
      // 檢查主內容區域
      const mainContentSelectors = [
        '.main-content',
        '#main-content',
        '.content',
        '.container',
        '.page-content',
        'main'
      ];

      for (const selector of mainContentSelectors) {
        const contentElements = await page.locator(selector).count();
        if (contentElements > 0) {
          const element = page.locator(selector).first();
          const box = await element.boundingBox();
          if (box) {
            console.log(`📐 主內容區域 ${selector}: 寬度=${box.width}px, 左邊距=${box.x}px`);
          }
        }
      }

      // 步驟 6: 檢查頂部導航
      console.log('📍 步驟 6: 檢查頂部導航狀態');
      
      const topNavSelectors = [
        '.navbar',
        '.top-nav',
        '.header',
        '.navigation',
        '[class*="nav"]'
      ];

      let topNavFound = false;
      for (const selector of topNavSelectors) {
        const navElements = await page.locator(selector).count();
        if (navElements > 0) {
          const isVisible = await page.locator(selector).first().isVisible();
          if (isVisible) {
            console.log(`✅ 頂部導航 ${selector} 正常顯示`);
            topNavFound = true;
          }
        }
      }

      if (!topNavFound) {
        console.log('⚠️  未發現頂部導航元素');
      }

      // 步驟 7: 響應式設計測試
      console.log('📍 步驟 7: 測試響應式設計');
      
      // 桌面版本 (1920x1080)
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'screenshots/sidebar-test-03-desktop-1920.png',
        fullPage: true 
      });
      console.log('✅ 桌面版本截圖已保存');

      // 平板版本 (768x1024)
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'screenshots/sidebar-test-04-tablet-768.png',
        fullPage: true 
      });
      console.log('✅ 平板版本截圖已保存');

      // 手機版本 (375x812)
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'screenshots/sidebar-test-05-mobile-375.png',
        fullPage: true 
      });
      console.log('✅ 手機版本截圖已保存');

      // 恢復桌面版本進行最終檢查
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(1000);

      // 步驟 8: 檢查頁面功能是否正常
      console.log('📍 步驟 8: 檢查頁面功能');
      
      // 檢查是否有導航菜單或按鈕
      const navigationButtons = await page.locator('button, .btn, a[href*="/"]').count();
      console.log(`🔗 發現 ${navigationButtons} 個導航元素`);

      // 檢查是否有錯誤訊息
      const errorMessages = await page.locator('.error, .alert-danger, .text-red, [class*="error"]').count();
      if (errorMessages > 0) {
        console.log(`⚠️  發現 ${errorMessages} 個錯誤訊息`);
      } else {
        console.log('✅ 未發現錯誤訊息');
      }

      // 最終截圖
      await page.screenshot({ 
        path: 'screenshots/sidebar-test-06-final-state.png',
        fullPage: true 
      });
      console.log('✅ 最終狀態截圖已保存');

      console.log('🎉 測試完成！');

    } catch (error) {
      console.error('❌ 測試過程中發生錯誤:', error.message);
      
      // 錯誤狀態截圖
      await page.screenshot({ 
        path: 'screenshots/sidebar-test-error-state.png',
        fullPage: true 
      });
      
      throw error;
    }
  });
});