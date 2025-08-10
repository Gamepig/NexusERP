/**
 * 簡化的報價列表頁面測試
 * 重點測試登入後的功能
 */

const { test, expect } = require('@playwright/test');

test.describe('報價列表頁面簡化測試', () => {
  
  test('完整流程測試：登入 → 訪問報價列表 → 驗證功能', async ({ page }) => {
    console.log('🧪 執行完整流程測試');
    
    // 設置視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 1. 直接訪問登入頁面
    console.log('步驟 1: 直接訪問登入頁面');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForTimeout(2000);
    
    // 2. 執行登入
    console.log('步驟 2: 執行登入');
    
    // 檢查是否在登入頁面
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    
    // 如果欄位已有值，清除後重新填入
    await emailInput.clear();
    await emailInput.fill('test@example.com');
    
    await passwordInput.clear();
    await passwordInput.fill('password123');
    
    await loginButton.click();
    
    // 等待登入完成，可能重定向到儀表板或首頁
    await page.waitForTimeout(3000);
    console.log(`登入後的 URL: ${page.url()}`);
    
    // 3. 訪問報價列表頁面
    console.log('步驟 3: 訪問報價列表頁面');
    await page.goto('http://127.0.0.1:8000/quotes');
    await page.waitForTimeout(3000);
    
    // 4. 驗證頁面載入
    console.log('步驟 4: 驗證頁面載入');
    const currentUrl = page.url();
    console.log(`當前頁面 URL: ${currentUrl}`);
    
    // 如果還在登入頁面，表示認證失敗
    if (currentUrl.includes('login')) {
      console.log('❌ 仍在登入頁面，認證可能失敗');
      
      // 取截圖以供診斷
      await page.screenshot({ 
        path: 'test-results/login-failure-debug.png',
        fullPage: true 
      });
      
      // 再次嘗試登入
      console.log('🔄 再次嘗試登入...');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await loginButton.click();
      await page.waitForTimeout(5000);
      
      // 再次嘗試訪問報價頁面
      await page.goto('http://127.0.0.1:8000/quotes');
      await page.waitForTimeout(3000);
    }
    
    // 5. 檢查頁面內容
    console.log('步驟 5: 檢查頁面內容');
    
    // 檢查是否包含報價相關內容
    const pageContent = await page.content();
    const hasQuoteContent = pageContent.includes('報價單') || 
                           pageContent.includes('報價') || 
                           pageContent.includes('Quote') ||
                           pageContent.includes('搜尋') ||
                           pageContent.includes('建立');
    
    console.log(`頁面是否包含報價相關內容: ${hasQuoteContent}`);
    
    if (hasQuoteContent) {
      console.log('✅ 頁面載入成功，包含報價相關內容');
      
      // 6. 測試基本元素
      console.log('步驟 6: 測試基本元素');
      
      // 檢查頁面標題
      try {
        const title = await page.locator('h1, h2, h3').first().textContent({ timeout: 5000 });
        console.log(`頁面標題: ${title}`);
      } catch (e) {
        console.log('無法找到頁面標題');
      }
      
      // 檢查表格或內容區域
      const hasTable = await page.locator('table').count() > 0;
      const hasSearchForm = await page.locator('form, input[name="search"]').count() > 0;
      const hasCreateButton = await page.locator('a:has-text("建立"), button:has-text("建立")').count() > 0;
      
      console.log(`包含表格: ${hasTable}`);
      console.log(`包含搜尋表單: ${hasSearchForm}`);
      console.log(`包含建立按鈕: ${hasCreateButton}`);
      
      // 如果有表格，檢查表格結構
      if (hasTable) {
        const headerCount = await page.locator('thead th').count();
        const rowCount = await page.locator('tbody tr').count();
        console.log(`表格標題欄數: ${headerCount}`);
        console.log(`表格資料行數: ${rowCount}`);
      }
      
      // 7. 測試搜尋功能 (如果存在)
      if (hasSearchForm) {
        console.log('步驟 7: 測試搜尋功能');
        try {
          const searchInput = page.locator('input[name="search"]').first();
          await searchInput.fill('test');
          await page.waitForTimeout(1000);
          console.log('搜尋輸入測試完成');
        } catch (e) {
          console.log('搜尋功能測試跳過:', e.message);
        }
      }
      
    } else {
      console.log('❌ 頁面不包含預期的報價內容');
      
      // 檢查是否有錯誤訊息
      const errorElements = await page.locator('.alert, .error, .message, [class*="error"]').count();
      if (errorElements > 0) {
        const errorText = await page.locator('.alert, .error, .message, [class*="error"]').first().textContent();
        console.log(`錯誤訊息: ${errorText}`);
      }
    }
    
    // 8. 取得最終截圖
    await page.screenshot({ 
      path: 'test-results/quote-list-final-state.png',
      fullPage: true 
    });
    
    console.log('🏁 測試完成');
    
    // 基本斷言
    expect(currentUrl).not.toContain('login'); // 不應該還在登入頁面
    expect(hasQuoteContent).toBe(true); // 應該有報價相關內容
  });

});