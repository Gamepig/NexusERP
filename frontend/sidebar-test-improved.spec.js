import { test, expect } from '@playwright/test';

test.describe('側邊欄移除後的頁面測試 - 改進版', () => {
  test('測試移除左側邊欄後的頁面效果', async ({ page }) => {
    console.log('🚀 開始改進版測試移除左側邊欄後的頁面效果...');

    try {
      // 步驟 1: 直接訪問登入頁面
      console.log('📍 步驟 1: 直接訪問登入頁面');
      await page.goto('http://127.0.0.1:8000/login');
      await page.waitForLoadState('networkidle');
      
      // 截圖記錄登入頁面
      await page.screenshot({ 
        path: 'screenshots/sidebar-improved-01-login-page.png',
        fullPage: true 
      });
      console.log('✅ 登入頁面截圖已保存');

      // 步驟 2: 執行登入
      console.log('📍 步驟 2: 執行系統登入');
      
      // 填寫登入表單
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"], input[type="password"]', 'password123');
      
      // 提交登入表單
      await page.click('button[type="submit"], .btn-primary, button:has-text("LOG IN")');
      
      // 等待登入完成並重定向
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 截圖記錄登入後的狀態
      await page.screenshot({ 
        path: 'screenshots/sidebar-improved-02-after-login.png',
        fullPage: true 
      });
      console.log('✅ 登入後狀態截圖已保存');

      // 步驟 3: 確保訪問儀表板
      console.log('📍 步驟 3: 確保訪問儀表板頁面');
      const currentUrl = page.url();
      console.log(`當前 URL: ${currentUrl}`);
      
      if (!currentUrl.includes('/dashboard')) {
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }

      // 截圖記錄儀表板初始狀態
      await page.screenshot({ 
        path: 'screenshots/sidebar-improved-03-dashboard.png',
        fullPage: true 
      });
      console.log('✅ 儀表板狀態截圖已保存');

      // 步驟 4: 詳細分析頁面結構
      console.log('📍 步驟 4: 分析頁面結構和佈局');
      
      // 獲取頁面標題
      const pageTitle = await page.title();
      console.log(`頁面標題: ${pageTitle}`);
      
      // 獲取頁面 URL
      console.log(`最終 URL: ${page.url()}`);

      // 檢查左側邊欄相關的選擇器
      const sidebarSelectors = [
        '.sidebar',
        '#sidebar', 
        '.nav-sidebar',
        '.side-navigation',
        '.left-sidebar',
        '[class*="sidebar"]',
        'aside',
        '.drawer',
        '.navigation-drawer'
      ];

      let sidebarAnalysis = [];
      for (const selector of sidebarSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const isVisible = await page.locator(selector).first().isVisible();
          const element = page.locator(selector).first();
          let boundingBox = null;
          try {
            boundingBox = await element.boundingBox();
          } catch (e) {
            // 元素可能不可見
          }
          
          sidebarAnalysis.push({
            selector,
            count,
            visible: isVisible,
            boundingBox
          });
          
          console.log(`📊 側邊欄元素 ${selector}: 數量=${count}, 可見=${isVisible}`);
          if (boundingBox) {
            console.log(`   位置: x=${boundingBox.x}, y=${boundingBox.y}, 寬度=${boundingBox.width}, 高度=${boundingBox.height}`);
          }
        }
      }

      // 檢查主內容區域
      const mainContentSelectors = [
        '.main-content',
        '#main-content',
        '.content',
        '.container',
        '.page-content',
        'main',
        '.app-main',
        '.dashboard-content'
      ];

      let mainContentAnalysis = [];
      for (const selector of mainContentSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const isVisible = await page.locator(selector).first().isVisible();
          let boundingBox = null;
          try {
            boundingBox = await page.locator(selector).first().boundingBox();
          } catch (e) {
            // 元素可能不可見
          }
          
          if (isVisible && boundingBox) {
            mainContentAnalysis.push({
              selector,
              count,
              visible: isVisible,
              boundingBox
            });
            
            console.log(`📐 主內容區域 ${selector}: 寬度=${boundingBox.width}px, 左邊距=${boundingBox.x}px`);
          }
        }
      }

      // 步驟 5: 檢查頂部導航
      console.log('📍 步驟 5: 檢查頂部導航結構');
      
      const topNavSelectors = [
        '.navbar',
        '.top-nav',
        '.header',
        '.navigation',
        '.app-header',
        '[class*="nav"]',
        'nav'
      ];

      let topNavFound = false;
      for (const selector of topNavSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const isVisible = await page.locator(selector).first().isVisible();
          if (isVisible) {
            console.log(`✅ 頂部導航 ${selector} 正常顯示 (數量: ${count})`);
            topNavFound = true;
          }
        }
      }

      if (!topNavFound) {
        console.log('⚠️  未發現明顯的頂部導航元素');
      }

      // 步驟 6: 檢查頁面是否有導航功能
      console.log('📍 步驟 6: 檢查導航功能');
      
      // 檢查導航鏈接和按鈕
      const navigationElements = await page.locator('a[href], button, .btn').count();
      console.log(`🔗 發現 ${navigationElements} 個可點擊導航元素`);

      // 檢查是否有下拉菜單
      const dropdownElements = await page.locator('.dropdown, [class*="dropdown"], .menu').count();
      console.log(`📋 發現 ${dropdownElements} 個下拉菜單元素`);

      // 步驟 7: 響應式設計測試
      console.log('📍 步驟 7: 響應式設計詳細測試');
      
      const viewports = [
        { name: 'desktop-large', width: 1920, height: 1080 },
        { name: 'desktop-medium', width: 1280, height: 720 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 812 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: `screenshots/sidebar-improved-04-${viewport.name}.png`,
          fullPage: true 
        });
        
        console.log(`✅ ${viewport.name} 版本截圖已保存 (${viewport.width}x${viewport.height})`);
        
        // 分析在這個視窗大小下的佈局
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        console.log(`   實際內容寬度: ${bodyWidth}px`);
      }

      // 恢復到標準桌面尺寸
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(1000);

      // 步驟 8: 最終功能測試
      console.log('📍 步驟 8: 最終功能驗證');
      
      // 檢查頁面是否有JavaScript錯誤
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // 檢查頁面載入狀態
      const readyState = await page.evaluate(() => document.readyState);
      console.log(`📄 頁面載入狀態: ${readyState}`);

      // 檢查是否有錯誤訊息在頁面上
      const errorMessages = await page.locator('.error, .alert-danger, .text-red, [class*="error"]').count();
      if (errorMessages > 0) {
        console.log(`⚠️  發現 ${errorMessages} 個頁面錯誤訊息`);
      } else {
        console.log('✅ 頁面未發現錯誤訊息');
      }

      // 最終狀態截圖
      await page.screenshot({ 
        path: 'screenshots/sidebar-improved-05-final-analysis.png',
        fullPage: true 
      });
      console.log('✅ 最終分析截圖已保存');

      // 生成測試報告
      const testReport = {
        timestamp: new Date().toISOString(),
        pageTitle,
        finalUrl: page.url(),
        sidebarAnalysis,
        mainContentAnalysis,
        topNavFound,
        navigationElements,
        dropdownElements,
        errors: errors.slice(0, 5), // 只保留前5個錯誤
        pageReadyState: readyState
      };

      console.log('📊 測試報告:', JSON.stringify(testReport, null, 2));
      
      // 保存測試報告到文件
      await page.evaluate((report) => {
        // 這只是在瀏覽器控制台顯示，實際保存需要其他方式
        console.log('Test Report:', report);
      }, testReport);

      console.log('🎉 改進版測試完成！');

    } catch (error) {
      console.error('❌ 測試過程中發生錯誤:', error.message);
      
      // 錯誤狀態截圖
      await page.screenshot({ 
        path: 'screenshots/sidebar-improved-error-state.png',
        fullPage: true 
      });
      
      throw error;
    }
  });
});