import { test, expect } from '@playwright/test';

test.describe('簡化產品輸入框測試', () => {
  test('直接測試產品輸入框值獲取', async ({ page }) => {
    // 設定較長的超時時間
    test.setTimeout(60000);
    
    console.log('🔄 開始測試...');

    try {
      // 1. 前往登入頁面
      console.log('🔄 前往登入頁面...');
      await page.goto('http://127.0.0.1:8000/login');
      await page.waitForLoadState('networkidle');

      // 2. 登入
      console.log('🔐 執行登入...');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // 等待登入完成
      await page.waitForTimeout(2000);

      // 3. 直接前往報價單建立頁面
      console.log('🔄 前往報價單建立頁面...');
      await page.goto('http://127.0.0.1:8000/quotes/create');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // 截圖：頁面載入狀態
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/frontend/simple-test-01-page-loaded.png',
        fullPage: true 
      });

      // 4. 檢查頁面是否正確載入
      const currentUrl = page.url();
      console.log('📍 當前URL:', currentUrl);
      
      // 如果被重新導向到登入頁面，說明登入失敗
      if (currentUrl.includes('/login')) {
        console.log('❌ 登入失敗，被重新導向到登入頁面');
        return;
      }

      // 5. 尋找並測試產品輸入框
      console.log('🔍 尋找產品輸入框...');
      
      // 嘗試多種可能的選擇器
      const possibleSelectors = [
        '.product-search',
        'input[name*="name"]',
        'input[placeholder*="產品"]',
        'input[placeholder*="product"]',
        'input.form-control[type="text"]'
      ];

      let productInput = null;
      for (const selector of possibleSelectors) {
        try {
          productInput = page.locator(selector).first();
          if (await productInput.isVisible({ timeout: 1000 })) {
            console.log('✅ 找到產品輸入框，選擇器:', selector);
            break;
          }
        } catch (e) {
          console.log('⏭️ 選擇器不存在:', selector);
        }
      }

      if (!productInput || !(await productInput.isVisible().catch(() => false))) {
        console.log('❌ 無法找到產品輸入框');
        
        // 列出頁面上所有的輸入框
        const allInputs = await page.locator('input').all();
        console.log('📝 頁面上的所有輸入框:');
        for (let i = 0; i < allInputs.length; i++) {
          const input = allInputs[i];
          const name = await input.getAttribute('name').catch(() => '無name');
          const placeholder = await input.getAttribute('placeholder').catch(() => '無placeholder');
          const className = await input.getAttribute('class').catch(() => '無class');
          console.log(`  輸入框 ${i}: name="${name}", placeholder="${placeholder}", class="${className}"`);
        }
        return;
      }

      // 6. 開始測試產品輸入框
      console.log('🎯 開始測試產品輸入框...');

      // 檢查初始狀態
      const initialValue = await productInput.inputValue();
      const placeholder = await productInput.getAttribute('placeholder');
      const name = await productInput.getAttribute('name');
      
      console.log('📝 初始值:', initialValue);
      console.log('📝 Placeholder:', placeholder);
      console.log('📝 Name 屬性:', name);

      // 7. 添加 Console 監聽腳本
      await page.addScriptTag({
        content: `
          console.log('=== 產品輸入框測試開始 ===');
          
          // 監聽表單提交事件
          document.addEventListener('submit', function(e) {
            console.log('📋 表單提交事件觸發');
            const form = e.target;
            const formData = new FormData(form);
            
            console.log('=== FormData 內容 ===');
            for (let [key, value] of formData.entries()) {
              console.log('FormData:', key, '=', '"' + value + '"');
            }
          });
        `
      });

      // 8. 清空並輸入測試文字
      console.log('⌨️ 輸入測試產品名稱...');
      await productInput.clear();
      await productInput.fill('測試產品ABC');
      
      // 等待輸入完成
      await page.waitForTimeout(500);

      // 檢查輸入後的值
      const afterInputValue = await productInput.inputValue();
      console.log('📝 輸入後的值:', afterInputValue);

      // 9. 失焦測試
      console.log('👆 點擊其他地方失焦...');
      await page.click('body');
      await page.waitForTimeout(500);

      const afterBlurValue = await productInput.inputValue();
      console.log('📝 失焦後的值:', afterBlurValue);

      // 截圖：產品輸入完成
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/frontend/simple-test-02-product-filled.png',
        fullPage: true 
      });

      // 10. 在 Console 中執行檢查
      const detailedCheck = await page.evaluate(() => {
        const results = {
          productInputs: [],
          allNameInputs: [],
          formData: {}
        };

        // 查找所有可能的產品輸入框
        const productSelectors = ['.product-search', 'input[name*="name"]', 'input[placeholder*="產品"]'];
        productSelectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            results.productInputs.push({
              selector: selector,
              value: element.value,
              name: element.name || 'NO_NAME',
              placeholder: element.placeholder || 'NO_PLACEHOLDER'
            });
          }
        });

        // 查找所有 name 相關的輸入框
        const nameInputs = document.querySelectorAll('input[name*="name"]');
        nameInputs.forEach((input, index) => {
          results.allNameInputs.push({
            index: index,
            name: input.name,
            value: input.value,
            type: input.type
          });
        });

        // 檢查表單資料
        const form = document.querySelector('form');
        if (form) {
          const formData = new FormData(form);
          for (let [key, value] of formData.entries()) {
            results.formData[key] = value;
          }
        }

        return results;
      });

      console.log('🔍 詳細檢查結果:');
      console.log('產品輸入框:', JSON.stringify(detailedCheck.productInputs, null, 2));
      console.log('所有 name 輸入框:', JSON.stringify(detailedCheck.allNameInputs, null, 2));
      console.log('表單資料:', JSON.stringify(detailedCheck.formData, null, 2));

      // 11. 嘗試提交表單（如果有其他必要欄位）
      console.log('🔍 檢查是否有提交按鈕...');
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible().catch(() => false)) {
        console.log('📋 找到提交按鈕，準備提交測試...');
        
        // 在提交前先添加調試腳本
        await page.addScriptTag({
          content: `
            console.log('=== 提交前最終檢查 ===');
            const productInput = document.querySelector('.product-search') || 
                                 document.querySelector('input[name*="name"]');
            
            if (productInput) {
              console.log('Product Input Found!');
              console.log('Product 1: value="' + productInput.value + '"');
              console.log('Product 1: name="' + productInput.name + '"');
            } else {
              console.log('Product Input NOT FOUND!');
            }
            
            // 檢查表單
            const form = document.querySelector('form');
            if (form) {
              console.log('=== FormData 最終檢查 ===');
              const formData = new FormData(form);
              for (let [key, value] of formData.entries()) {
                console.log('FormData Final:', key, '=', '"' + value + '"');
              }
            }
          `
        });

        await page.waitForTimeout(1000);
        
        // 點擊提交（但可能會因缺少其他欄位而失敗）
        try {
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          // 最終截圖
          await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/simple-test-03-after-submit.png',
            fullPage: true 
          });
          
        } catch (submitError) {
          console.log('⚠️ 提交可能失敗（預期的，因為其他欄位可能未填寫）:', submitError.message);
        }
      }

      console.log('✅ 測試完成');

    } catch (error) {
      console.log('❌ 測試過程中發生錯誤:', error.message);
      
      // 錯誤時也截圖
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/frontend/simple-test-error.png',
        fullPage: true 
      });
    }
  });
});