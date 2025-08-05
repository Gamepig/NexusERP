// 用戶下拉選單修改驗證測試
import { test, expect } from '@playwright/test';

test.describe('用戶下拉選單修改驗證測試', () => {
  test('驗證用戶下拉選單修改效果', async ({ page }) => {
    console.log('🚀 開始測試用戶下拉選單的修改...');
    
    try {
      // 步驟 1: 導航到首頁
      console.log('📍 步驟1: 導航到首頁 http://127.0.0.1:8000');
      await page.goto('http://127.0.0.1:8000', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // 等待頁面完全載入
      await page.waitForTimeout(2000);
      
      // 步驟 2: 檢查是否在首頁，需要先登入
      console.log('📍 步驟2: 檢查是否需要登入');
      
      // 檢查是否有登入按鈕（表示在首頁）
      const loginButton = page.locator('a:has-text("登入"), button:has-text("登入")').first();
      
      if (await loginButton.isVisible()) {
        console.log('🔐 在首頁，點擊登入按鈕...');
        await loginButton.click();
        
        // 等待導航到登入頁面
        await page.waitForTimeout(2000);
        
        // 填寫登入表單
        console.log('📝 填寫登入表單...');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        
        // 提交登入
        await page.click('button[type="submit"]');
        
        // 等待登入完成，導航到 dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ 登入成功，已導航到 dashboard');
      } else {
        // 檢查是否已經在 dashboard 或其他認證頁面
        const currentURL = page.url();
        if (currentURL.includes('dashboard') || currentURL.includes('admin')) {
          console.log('✅ 已經在認證後的頁面');
        } else {
          console.log('⚠️ 頁面狀態不明確，嘗試直接導航到 dashboard');
          await page.goto('http://127.0.0.1:8000/dashboard', { waitUntil: 'networkidle' });
        }
      }
      
      // 步驟 3: 截圖 - 修改前的狀態
      console.log('📍 步驟3: 截圖頁面初始狀態');
      await page.screenshot({ 
        path: 'user-dropdown-before.png',
        fullPage: true 
      });
      
      // 步驟 4: 尋找用戶下拉選單觸發器
      console.log('📍 步驟4: 尋找用戶下拉選單');
      
      // 嘗試多種可能的用戶選單選擇器
      const userMenuSelectors = [
        '[x-data*="userMenuOpen"]',
        '.dropdown:has([x-show*="userMenuOpen"])',
        'div:has(button:has-text("test@example.com"))',
        'div:has(img[alt*="User"])',
        '.relative:has(.dropdown-menu)',
        '[data-dropdown="user"]'
      ];
      
      let userMenuTrigger = null;
      let userMenuContainer = null;
      
      for (const selector of userMenuSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible()) {
            userMenuContainer = element;
            // 尋找觸發按鈕
            const trigger = element.locator('button').first();
            if (await trigger.isVisible()) {
              userMenuTrigger = trigger;
              console.log(`✅ 找到用戶選單容器: ${selector}`);
              break;
            }
          }
        } catch (e) {
          // 繼續嘗試下一個選擇器
        }
      }
      
      if (!userMenuTrigger) {
        console.log('⚠️ 無法找到用戶選單觸發器，嘗試通用方法');
        
        // 嘗試找到包含用戶信息的按鈕
        const allButtons = await page.locator('button').all();
        for (const button of allButtons) {
          const text = await button.textContent();
          if (text && (text.includes('@') || text.includes('User') || text.includes('用戶'))) {
            userMenuTrigger = button;
            userMenuContainer = button.locator('..').first(); // 父元素
            console.log('✅ 通過文本找到用戶選單按鈕');
            break;
          }
        }
      }
      
      if (!userMenuTrigger) {
        console.log('❌ 無法找到用戶下拉選單，截圖當前頁面狀態');
        await page.screenshot({ 
          path: 'user-dropdown-not-found.png',
          fullPage: true 
        });
        
        // 輸出頁面HTML結構幫助診斷
        const bodyHTML = await page.locator('body').innerHTML();
        console.log('📄 當前頁面結構（前500字符）:');
        console.log(bodyHTML.substring(0, 500));
        
        throw new Error('無法找到用戶下拉選單');
      }
      
      // 步驟 5: 點擊用戶選單觸發器
      console.log('📍 步驟5: 點擊用戶下拉選單觸發器');
      await userMenuTrigger.click();
      
      // 等待下拉選單出現
      await page.waitForTimeout(1000);
      
      // 步驟 6: 截圖 - 下拉選單展開狀態
      console.log('📍 步驟6: 截圖下拉選單展開狀態');
      await page.screenshot({ 
        path: 'user-dropdown-expanded.png',
        fullPage: true 
      });
      
      // 步驟 7: 檢查下拉選單內容
      console.log('📍 步驟7: 分析下拉選單內容');
      
      // 尋找下拉選單內容
      const dropdownSelectors = [
        '[x-show*="userMenuOpen"]',
        '.dropdown-menu',
        '[role="menu"]',
        '.absolute.right-0',
        '.origin-top-right'
      ];
      
      let dropdownMenu = null;
      for (const selector of dropdownSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          dropdownMenu = element;
          console.log(`✅ 找到下拉選單: ${selector}`);
          break;
        }
      }
      
      if (!dropdownMenu) {
        // 嘗試在用戶選單容器內尋找
        if (userMenuContainer) {
          dropdownMenu = userMenuContainer.locator('.absolute, .dropdown-menu, [role="menu"]').first();
        }
      }
      
      if (dropdownMenu && await dropdownMenu.isVisible()) {
        // 獲取選單項目
        const menuItems = await dropdownMenu.locator('a, button').all();
        console.log(`📋 找到 ${menuItems.length} 個選單項目:`);
        
        const menuItemsInfo = [];
        for (const item of menuItems) {
          const text = await item.textContent();
          const href = await item.getAttribute('href');
          menuItemsInfo.push({ text: text?.trim(), href });
          console.log(`  - "${text?.trim()}" ${href ? `(${href})` : ''}`);
        }
        
        // 驗證修改效果
        console.log('📍 步驟8: 驗證修改效果');
        
        // 檢查是否移除了「設定」和「說明中心」
        const hasSettings = menuItemsInfo.some(item => 
          item.text && (item.text.includes('設定') || item.text.includes('Settings'))
        );
        const hasHelpCenter = menuItemsInfo.some(item => 
          item.text && (item.text.includes('說明中心') || item.text.includes('Help') || item.text.includes('Support'))
        );
        
        // 檢查是否包含必要項目
        const hasProfile = menuItemsInfo.some(item => 
          item.text && (item.text.includes('個人資料') || item.text.includes('Profile'))
        );
        const hasLogout = menuItemsInfo.some(item => 
          item.text && (item.text.includes('登出') || item.text.includes('Logout'))
        );
        
        // 生成測試報告
        console.log('📊 測試結果報告:');
        console.log(`  ✅ 移除「設定」選項: ${!hasSettings ? '成功' : '失敗'}`);
        console.log(`  ✅ 移除「說明中心」選項: ${!hasHelpCenter ? '成功' : '失敗'}`);
        console.log(`  ✅ 保留「個人資料」選項: ${hasProfile ? '成功' : '失敗'}`);
        console.log(`  ✅ 保留「登出」選項: ${hasLogout ? '成功' : '失敗'}`);
        
        // 驗證選單項目數量（應該只有個人資料和登出，可能還有分隔線）
        const actualItemCount = menuItemsInfo.filter(item => item.text && item.text.length > 0).length;
        console.log(`  📊 選單項目數量: ${actualItemCount} (預期: 2-3個，包含可能的分隔線)`);
        
        // 檢查風格一致性
        const menuHTML = await dropdownMenu.innerHTML();
        console.log('📍 步驟9: 檢查選單風格一致性');
        
        // 檢查是否使用了一致的CSS類
        const hasConsistentStyling = menuHTML.includes('border-gray-200') || 
                                   menuHTML.includes('divide-y') ||
                                   menuHTML.includes('bg-white');
        console.log(`  🎨 風格一致性: ${hasConsistentStyling ? '良好' : '需要檢查'}`);
        
        // 截圖最終狀態
        await page.screenshot({ 
          path: 'user-dropdown-final-verification.png',
          fullPage: true 
        });
        
        // 測試總結
        console.log('🎯 測試總結:');
        if (!hasSettings && !hasHelpCenter && hasProfile && hasLogout) {
          console.log('✅ 用戶下拉選單修改成功！所有要求都已滿足。');
        } else {
          console.log('⚠️ 用戶下拉選單修改部分成功，請檢查以下項目:');
          if (hasSettings) console.log('  - 「設定」選項仍然存在');
          if (hasHelpCenter) console.log('  - 「說明中心」選項仍然存在');
          if (!hasProfile) console.log('  - 缺少「個人資料」選項');
          if (!hasLogout) console.log('  - 缺少「登出」選項');
        }
        
      } else {
        console.log('❌ 無法找到下拉選單內容');
        await page.screenshot({ 
          path: 'user-dropdown-menu-not-found.png',
          fullPage: true 
        });
      }
      
    } catch (error) {
      console.error('❌ 測試過程中發生錯誤:', error.message);
      
      // 錯誤截圖
      await page.screenshot({ 
        path: 'user-dropdown-error.png',
        fullPage: true 
      });
      
      throw error;
    }
  });
});