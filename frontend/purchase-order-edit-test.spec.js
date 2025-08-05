import { test, expect } from '@playwright/test';

test.describe('採購訂單編輯功能測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設定較長的超時時間
    test.setTimeout(120000);
    
    // 建立截圖目錄
    await page.evaluate(() => {
      if (typeof window !== 'undefined') {
        console.log('Playwright 測試開始');
      }
    });
  });

  test('測試採購訂單編輯功能', async ({ page }) => {
    console.log('=== 開始測試採購訂單編輯功能 ===');
    
    try {
      // 1. 登入系統
      console.log('1. 訪問登入頁面');
      await page.goto('http://127.0.0.1:8000/login', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      await page.screenshot({ path: 'screenshots/po-01-login-page.png', fullPage: true });
      console.log('✓ 登入頁面截圖已保存');
      
      // 檢查登入頁面元素
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      
      // 填寫登入憑證
      console.log('2. 填寫登入憑證');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // 提交登入表單
      console.log('3. 提交登入表單');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
        page.click('button[type="submit"]')
      ]);
      
      await page.screenshot({ path: 'screenshots/po-02-after-login.png', fullPage: true });
      console.log('✓ 登入後截圖已保存');
      
      // 檢查登入結果
      const currentUrl = page.url();
      console.log(`登入後 URL: ${currentUrl}`);
      
      // 4. 前往採購訂單列表頁面
      console.log('4. 前往採購訂單列表頁面');
      await page.goto('http://127.0.0.1:8000/orders/purchase', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      await page.screenshot({ path: 'screenshots/po-03-purchase-orders-list.png', fullPage: true });
      console.log('✓ 採購訂單列表頁面截圖已保存');
      
      // 檢查頁面內容
      const listPageText = await page.textContent('body');
      console.log('採購訂單列表頁面載入狀況:');
      if (listPageText.includes('採購訂單') || listPageText.includes('Purchase Order')) {
        console.log('✓ 採購訂單列表頁面正常載入');
      } else {
        console.log('⚠️ 採購訂單列表頁面載入異常');
        console.log('頁面部分內容:', listPageText.substring(0, 500));
      }
      
      // 5. 尋找草稿狀態的採購訂單或創建一個
      console.log('5. 尋找可編輯的採購訂單');
      
      // 先檢查是否有現有的訂單
      const editButtons = await page.locator('a[href*="/purchase-orders/"][href*="/edit"], button:has-text("編輯"), button:has-text("Edit")').count();
      console.log(`發現 ${editButtons} 個編輯按鈕`);
      
      let editUrl = '';
      
      if (editButtons > 0) {
        // 點擊第一個編輯按鈕
        const firstEditButton = page.locator('a[href*="/purchase-orders/"][href*="/edit"], button:has-text("編輯"), button:has-text("Edit")').first();
        const href = await firstEditButton.getAttribute('href');
        if (href) {
          editUrl = href.startsWith('http') ? href : `http://127.0.0.1:8000${href}`;
          console.log(`找到編輯連結: ${editUrl}`);
        } else {
          await firstEditButton.click();
          await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
          editUrl = page.url();
        }
      } else {
        // 如果沒有現有訂單，先嘗試創建一個
        console.log('沒有找到現有訂單，嘗試創建新訂單');
        const createButton = page.locator('a[href*="/purchase-orders/create"], button:has-text("新增"), button:has-text("Create"), button:has-text("添加")');
        
        if (await createButton.count() > 0) {
          await createButton.first().click();
          await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
          
          // 快速填寫必要欄位創建草稿
          await page.fill('input[name="supplier_name"], input[name="supplier"]', '測試供應商');
          await page.fill('textarea[name="notes"], textarea[name="description"]', '測試採購訂單');
          
          // 保存為草稿
          const saveButton = page.locator('button:has-text("保存"), button:has-text("Save"), button[type="submit"]');
          if (await saveButton.count() > 0) {
            await saveButton.first().click();
            await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
          }
          
          // 返回列表頁面尋找剛創建的訂單
          await page.goto('http://127.0.0.1:8000/purchase-orders', { waitUntil: 'networkidle' });
          const newEditButtons = await page.locator('a[href*="/purchase-orders/"][href*="/edit"]').count();
          if (newEditButtons > 0) {
            const href = await page.locator('a[href*="/purchase-orders/"][href*="/edit"]').first().getAttribute('href');
            editUrl = href.startsWith('http') ? href : `http://127.0.0.1:8000${href}`;
          }
        }
      }
      
      // 6. 進入編輯頁面
      if (editUrl) {
        console.log('6. 進入採購訂單編輯頁面');
        await page.goto(editUrl, { waitUntil: 'networkidle', timeout: 30000 });
      } else {
        // 如果沒有找到編輯 URL，直接嘗試訪問一個假設的編輯頁面
        console.log('6. 直接嘗試訪問編輯頁面 (ID: 1)');
        await page.goto('http://127.0.0.1:8000/orders/purchase/1/edit', { waitUntil: 'networkidle', timeout: 30000 });
      }
      
      await page.screenshot({ path: 'screenshots/po-04-edit-page-loaded.png', fullPage: true });
      console.log('✓ 編輯頁面載入截圖已保存');
      
      // 檢查編輯頁面載入狀況
      const editPageText = await page.textContent('body');
      console.log('編輯頁面載入狀況:');
      if (editPageText.includes('編輯') || editPageText.includes('Edit') || editPageText.includes('更新')) {
        console.log('✓ 編輯頁面正常載入');
      } else if (editPageText.includes('404') || editPageText.includes('Not Found')) {
        console.log('❌ 編輯頁面返回 404 錯誤');
      } else {
        console.log('⚠️ 編輯頁面載入狀況不明');
        console.log('頁面部分內容:', editPageText.substring(0, 500));
      }
      
      // 7. 檢查狀態下拉選單
      console.log('7. 檢查狀態下拉選單');
      const statusSelects = await page.locator('select[name="status"], select[name*="status"], select:has(option:text("草稿")), select:has(option:text("Draft"))').count();
      console.log(`找到 ${statusSelects} 個狀態選擇器`);
      
      if (statusSelects > 0) {
        const statusSelect = page.locator('select[name="status"], select[name*="status"], select:has(option:text("草稿")), select:has(option:text("Draft"))').first();
        
        // 截圖顯示當前狀態
        await page.screenshot({ path: 'screenshots/po-05-status-before-change.png', fullPage: true });
        
        // 獲取所有選項
        const options = await statusSelect.locator('option').allTextContents();
        console.log('狀態選項:', options);
        
        // 8. 嘗試將狀態從草稿改為待核準
        console.log('8. 嘗試更改狀態');
        const targetOptions = ['待核準', 'pending', 'Pending', '待審核', 'under_review'];
        let statusChanged = false;
        
        for (const option of targetOptions) {
          const optionElement = statusSelect.locator(`option:text("${option}")`);
          if (await optionElement.count() > 0) {
            await statusSelect.selectOption({ label: option });
            console.log(`✓ 成功選擇狀態: ${option}`);
            statusChanged = true;
            break;
          }
        }
        
        if (!statusChanged) {
          // 如果沒有找到目標選項，選擇第二個選項（通常不是草稿）
          const optionCount = await statusSelect.locator('option').count();
          if (optionCount > 1) {
            await statusSelect.selectOption({ index: 1 });
            const selectedValue = await statusSelect.inputValue();
            console.log(`✓ 選擇了第二個選項，值: ${selectedValue}`);
            statusChanged = true;
          }
        }
        
        if (statusChanged) {
          await page.screenshot({ path: 'screenshots/po-06-status-after-change.png', fullPage: true });
        }
      } else {
        console.log('⚠️ 未找到狀態選擇器');
      }
      
      // 9. 點擊更新按鈕
      console.log('9. 點擊更新按鈕');
      const updateButtons = page.locator('button:has-text("更新"), button:has-text("Update"), button:has-text("保存"), button:has-text("Save"), button[type="submit"]');
      const updateButtonCount = await updateButtons.count();
      console.log(`找到 ${updateButtonCount} 個更新按鈕`);
      
      if (updateButtonCount > 0) {
        // 監聽網路請求和錯誤
        const networkErrors = [];
        const consoleMessages = [];
        
        page.on('response', response => {
          if (response.status() >= 400) {
            networkErrors.push({
              url: response.url(),
              status: response.status(),
              statusText: response.statusText()
            });
          }
        });
        
        page.on('console', msg => {
          consoleMessages.push({
            type: msg.type(),
            text: msg.text()
          });
        });
        
        // 點擊更新按鈕
        await updateButtons.first().click();
        
        // 等待頁面響應
        await page.waitForTimeout(5000);
        
        // 截圖顯示提交後的狀態
        await page.screenshot({ path: 'screenshots/po-07-after-update-attempt.png', fullPage: true });
        console.log('✓ 更新嘗試後截圖已保存');
        
        // 10. 檢查錯誤訊息
        console.log('10. 檢查錯誤訊息');
        
        // 檢查頁面中的錯誤訊息
        const errorSelectors = [
          '.alert-danger',
          '.error',
          '.text-red-500',
          '.text-danger',
          '.text-red-600',
          '.bg-red-100',
          '.border-red-500',
          '[class*="error"]',
          '[class*="danger"]'
        ];
        
        let foundErrors = false;
        for (const selector of errorSelectors) {
          const errorElements = await page.locator(selector).count();
          if (errorElements > 0) {
            foundErrors = true;
            const errorTexts = await page.locator(selector).allTextContents();
            console.log(`發現錯誤訊息 (${selector}):`, errorTexts);
          }
        }
        
        if (!foundErrors) {
          console.log('✓ 頁面中未發現明顯的錯誤訊息');
        }
        
        // 檢查網路錯誤
        if (networkErrors.length > 0) {
          console.log('發現網路錯誤:');
          networkErrors.forEach(error => {
            console.log(`  - ${error.status} ${error.statusText}: ${error.url}`);
          });
        } else {
          console.log('✓ 未發現網路錯誤');
        }
        
        // 檢查瀏覽器控制台錯誤
        const consoleErrors = consoleMessages.filter(msg => msg.type === 'error');
        if (consoleErrors.length > 0) {
          console.log('發現瀏覽器控制台錯誤:');
          consoleErrors.forEach(error => {
            console.log(`  - ${error.text}`);
          });
        } else {
          console.log('✓ 未發現瀏覽器控制台錯誤');
        }
        
        // 檢查當前 URL 是否改變
        const finalUrl = page.url();
        console.log(`最終 URL: ${finalUrl}`);
        
        // 檢查頁面內容以判斷操作結果
        const finalPageText = await page.textContent('body');
        if (finalPageText.includes('成功') || finalPageText.includes('Success') || finalPageText.includes('已更新')) {
          console.log('✓ 頁面顯示成功訊息');
        } else if (finalPageText.includes('錯誤') || finalPageText.includes('Error') || finalPageText.includes('失敗')) {
          console.log('❌ 頁面顯示錯誤或失敗訊息');
        } else {
          console.log('⚠️ 無法確定操作結果');
        }
        
      } else {
        console.log('❌ 未找到更新按鈕');
      }
      
      // 最終截圖
      await page.screenshot({ path: 'screenshots/po-08-final-state.png', fullPage: true });
      console.log('✓ 最終狀態截圖已保存');
      
    } catch (error) {
      console.error('測試過程中發生錯誤:', error.message);
      await page.screenshot({ path: 'screenshots/po-error-state.png', fullPage: true });
      console.log('✓ 錯誤狀態截圖已保存');
      throw error;
    }
    
    console.log('=== 採購訂單編輯功能測試完成 ===');
  });
});