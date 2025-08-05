import { test, expect } from '@playwright/test';

test.describe('採購訂單編輯功能重點測試', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  test('重點測試採購訂單編輯功能與錯誤', async ({ page }) => {
    console.log('=== 開始重點測試採購訂單編輯功能 ===');
    
    try {
      // 1. 登入系統
      console.log('1. 登入系統');
      await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle', timeout: 30000 });
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
        page.click('button[type="submit"]')
      ]);
      
      console.log('✓ 登入成功');
      
      // 2. 前往採購訂單列表
      console.log('2. 前往採購訂單列表');
      await page.goto('http://127.0.0.1:8000/orders/purchase', { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: 'screenshots/focused-01-purchase-list.png', fullPage: true });
      
      // 3. 尋找並點擊第一個「編輯」按鈕
      console.log('3. 尋找並點擊編輯按鈕');
      
      // 等待列表完全載入
      await page.waitForTimeout(2000);
      
      // 尋找編輯按鈕
      const editButtons = await page.locator('a:has-text("編輯"), button:has-text("編輯")').count();
      console.log(`找到 ${editButtons} 個編輯按鈕`);
      
      if (editButtons > 0) {
        // 點擊第一個編輯按鈕
        const firstEditButton = page.locator('a:has-text("編輯"), button:has-text("編輯")').first();
        console.log('準備點擊編輯按鈕');
        
        // 監聽網路請求
        const networkErrors = [];
        page.on('response', response => {
          if (response.status() >= 400) {
            networkErrors.push({
              url: response.url(),
              status: response.status(),
              statusText: response.statusText()
            });
          }
        });
        
        // 點擊編輯按鈕
        await firstEditButton.click();
        
        // 等待頁面載入
        await page.waitForTimeout(3000);
        
        console.log(`編輯頁面 URL: ${page.url()}`);
        
        // 截圖編輯頁面
        await page.screenshot({ path: 'screenshots/focused-02-edit-page.png', fullPage: true });
        
        // 4. 檢查編輯頁面載入狀況
        console.log('4. 檢查編輯頁面狀態');
        const pageContent = await page.textContent('body');
        
        if (pageContent.includes('404') || pageContent.includes('Not Found')) {
          console.log('❌ 編輯頁面返回 404 錯誤');
        } else if (pageContent.includes('編輯') || pageContent.includes('更新')) {
          console.log('✓ 編輯頁面正常載入');
          
          // 5. 檢查狀態選擇器
          console.log('5. 檢查狀態下拉選單');
          const statusSelectors = await page.locator('select[name*="status"], select:has(option:text("草稿")), select:has(option:text("待核準"))').count();
          console.log(`找到 ${statusSelectors} 個狀態選擇器`);
          
          if (statusSelectors > 0) {
            const statusSelect = page.locator('select[name*="status"], select:has(option:text("草稿")), select:has(option:text("待核準"))').first();
            
            // 獲取所有選項
            const options = await statusSelect.locator('option').allTextContents();
            console.log('狀態選項:', options);
            
            // 檢查當前值
            const currentValue = await statusSelect.inputValue();
            console.log(`目前狀態值: ${currentValue}`);
            
            // 截圖狀態選擇器
            await page.screenshot({ path: 'screenshots/focused-03-status-selector.png', fullPage: true });
            
            // 6. 嘗試更改狀態
            console.log('6. 嘗試更改狀態');
            
            // 如果目前是草稿，改為待核準
            if (options.includes('待核準') && currentValue === 'draft') {
              await statusSelect.selectOption({ label: '待核準' });
              console.log('✓ 成功選擇「待核準」狀態');
            } else if (options.includes('草稿') && currentValue !== 'draft') {
              await statusSelect.selectOption({ label: '草稿' });
              console.log('✓ 成功選擇「草稿」狀態');
            } else {
              // 選擇第二個選項
              const optionCount = await statusSelect.locator('option').count();
              if (optionCount > 1) {
                await statusSelect.selectOption({ index: 1 });
                const newValue = await statusSelect.inputValue();
                console.log(`✓ 選擇了新狀態，值: ${newValue}`);
              }
            }
            
            // 截圖更改後的狀態
            await page.screenshot({ path: 'screenshots/focused-04-status-changed.png', fullPage: true });
            
            // 7. 嘗試提交更新
            console.log('7. 嘗試提交更新');
            
            // 監聽瀏覽器控制台錯誤
            const consoleMessages = [];
            page.on('console', msg => {
              if (msg.type() === 'error') {
                consoleMessages.push(msg.text());
              }
            });
            
            // 尋找更新按鈕
            const updateButtons = page.locator('button:has-text("更新"), button:has-text("保存"), button:has-text("儲存"), button[type="submit"]');
            const updateButtonCount = await updateButtons.count();
            console.log(`找到 ${updateButtonCount} 個更新/提交按鈕`);
            
            if (updateButtonCount > 0) {
              // 點擊更新按鈕
              await updateButtons.first().click();
              console.log('✓ 已點擊更新按鈕');
              
              // 等待響應
              await page.waitForTimeout(5000);
              
              // 截圖提交後的狀態
              await page.screenshot({ path: 'screenshots/focused-05-after-submit.png', fullPage: true });
              
              // 8. 檢查錯誤訊息
              console.log('8. 檢查提交結果');
              
              // 檢查頁面中的錯誤訊息
              const errorSelectors = [
                '.alert-danger',
                '.error',
                '.text-red-500',
                '.text-danger',
                '.text-red-600',
                '.bg-red-100',
                '.border-red-500',
                '[class*="error"]'
              ];
              
              let foundPageErrors = false;
              for (const selector of errorSelectors) {
                const errorElements = await page.locator(selector).count();
                if (errorElements > 0) {
                  foundPageErrors = true;
                  const errorTexts = await page.locator(selector).allTextContents();
                  console.log(`🔴 頁面錯誤 (${selector}):`, errorTexts);
                }
              }
              
              // 檢查網路錯誤
              if (networkErrors.length > 0) {
                console.log('🔴 網路錯誤:');
                networkErrors.forEach(error => {
                  console.log(`  - ${error.status} ${error.statusText}: ${error.url}`);
                });
              }
              
              // 檢查瀏覽器控制台錯誤
              if (consoleMessages.length > 0) {
                console.log('🔴 瀏覽器控制台錯誤:');
                consoleMessages.forEach(error => {
                  console.log(`  - ${error}`);
                });
              }
              
              // 檢查成功訊息
              const pageContentAfter = await page.textContent('body');
              if (pageContentAfter.includes('成功') || pageContentAfter.includes('已更新') || pageContentAfter.includes('儲存完成')) {
                console.log('✅ 發現成功訊息');
              } else if (pageContentAfter.includes('錯誤') || pageContentAfter.includes('失敗')) {
                console.log('❌ 發現錯誤訊息');
              }
              
              // 檢查 URL 變化
              const finalUrl = page.url();
              console.log(`最終 URL: ${finalUrl}`);
              
              if (!foundPageErrors && networkErrors.length === 0 && consoleMessages.length === 0) {
                console.log('✅ 未發現明顯錯誤，更新可能成功');
              } else {
                console.log('⚠️ 發現一些錯誤，需要進一步調查');
              }
              
            } else {
              console.log('❌ 未找到更新按鈕');
            }
          } else {
            console.log('❌ 未找到狀態選擇器');
          }
        } else {
          console.log('⚠️ 編輯頁面內容不明確');
          console.log('頁面內容片段:', pageContent.substring(0, 300));
        }
        
      } else {
        console.log('❌ 未找到編輯按鈕');
      }
      
      // 最終截圖
      await page.screenshot({ path: 'screenshots/focused-06-final-state.png', fullPage: true });
      
    } catch (error) {
      console.error('🔴 測試過程中發生錯誤:', error.message);
      await page.screenshot({ path: 'screenshots/focused-error.png', fullPage: true });
      throw error;
    }
    
    console.log('=== 重點測試完成 ===');
  });
});