import { test, expect } from '@playwright/test';

test.describe('API 和產品自動完成調試測試', () => {
  test('檢查產品搜尋 API 和前端互動', async ({ page }) => {
    // 監聽所有網路請求
    const networkRequests = [];
    const networkResponses = [];
    
    page.on('request', request => {
      networkRequests.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers()
      });
      
      // 特別關注 API 請求
      if (request.url().includes('/api/')) {
        console.log(`🌐 [API REQUEST] ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', async response => {
      networkResponses.push({
        status: response.status(),
        url: response.url()
      });
      
      // 特別關注 API 響應
      if (response.url().includes('/api/')) {
        console.log(`🌐 [API RESPONSE] ${response.status()} ${response.url()}`);
        
        // 如果是產品搜尋 API，記錄響應內容
        if (response.url().includes('products') || response.url().includes('search')) {
          try {
            const responseText = await response.text();
            console.log(`📋 [API CONTENT] ${responseText.substring(0, 200)}...`);
          } catch (e) {
            console.log(`❌ [API ERROR] 無法讀取響應內容: ${e.message}`);
          }
        }
      }
    });
    
    // 監聽 console 訊息
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      
      // 即時輸出重要的調試訊息
      if (text.includes('Selected product:') || 
          text.includes('=== 草稿保存調試 ===') ||
          text.includes('Before update') ||
          text.includes('After update') ||
          text.includes('Product ID set to:')) {
        console.log(`🔍 [CONSOLE] ${text}`);
      }
    });

    try {
      console.log('🚀 導航到報價創建頁面...');
      await page.goto('/quotes/create', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      // 檢查登入狀態
      if (page.url().includes('login')) {
        console.log('🔐 需要登入...');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        await page.goto('/quotes/create');
        await page.waitForTimeout(3000);
      }
      
      console.log('✅ 頁面載入完成');
      
      // 檢查頁面結構和 Alpine.js 數據
      console.log('🔍 檢查頁面 Alpine.js 數據...');
      
      const alpineData = await page.evaluate(() => {
        const formElement = document.querySelector('[x-data]');
        if (formElement && formElement._x_dataStack) {
          return {
            hasAlpineData: true,
            formDataExists: !!formElement._x_dataStack[0]?.formData,
            itemsCount: formElement._x_dataStack[0]?.formData?.items?.length || 0
          };
        }
        return { hasAlpineData: false };
      });
      
      console.log(`📊 Alpine.js 狀態:`, alpineData);
      
      // 填寫基本資訊
      console.log('📝 填寫基本資訊...');
      const customerSelect = page.locator('#customer_id');
      if (await customerSelect.count() > 0) {
        await customerSelect.selectOption({ index: 1 });
        console.log('✅ 客戶已選擇');
      }
      
      // 找到產品輸入框
      console.log('🔍 尋找並測試產品輸入框...');
      const productInput = page.locator('input[placeholder*="產品名稱"]').first();
      
      if (await productInput.count() > 0) {
        console.log('✅ 找到產品輸入框');
        
        // 點擊輸入框獲得焦點
        await productInput.click();
        await page.waitForTimeout(500);
        
        // 清除網路記錄
        networkRequests.length = 0;
        networkResponses.length = 0;
        
        console.log('🔍 輸入搜尋關鍵字並監控 API 請求...');
        await productInput.fill('測試');
        
        // 等待可能的 API 請求
        await page.waitForTimeout(3000);
        
        // 檢查是否有 API 請求
        const apiRequests = networkRequests.filter(req => 
          req.url.includes('/api/') || 
          req.url.includes('search') || 
          req.url.includes('products')
        );
        
        console.log(`🌐 捕獲到 ${apiRequests.length} 個相關 API 請求:`);
        apiRequests.forEach((req, index) => {
          console.log(`  ${index + 1}. ${req.method} ${req.url}`);
        });
        
        // 如果沒有 API 請求，嘗試手動觸發
        if (apiRequests.length === 0) {
          console.log('⚠️ 沒有檢測到 API 請求，嘗試其他觸發方式...');
          
          // 嘗試按 Enter 鍵
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
          
          // 嘗試觸發 input 事件
          await productInput.dispatchEvent('input');
          await page.waitForTimeout(1000);
          
          // 嘗試其他搜尋關鍵字
          await productInput.fill('');
          await page.waitForTimeout(500);
          await productInput.fill('laptop');
          await page.waitForTimeout(2000);
        }
        
        // 檢查搜尋結果
        console.log('🔍 檢查搜尋結果容器...');
        
        const resultContainers = [
          '.autocomplete-results',
          '.autocomplete-dropdown',
          '.search-results',
          '.suggestions',
          '[x-show*="suggestions"]'
        ];
        
        let foundResults = false;
        for (const selector of resultContainers) {
          const container = page.locator(selector);
          if (await container.count() > 0) {
            const isVisible = await container.isVisible();
            const itemCount = await page.locator(`${selector} .autocomplete-item, ${selector} .item, ${selector} li`).count();
            console.log(`📋 搜尋結果容器 ${selector}: 存在=${container.count() > 0}, 可見=${isVisible}, 項目數=${itemCount}`);
            
            if (itemCount > 0) {
              foundResults = true;
              console.log('🎯 找到搜尋結果，嘗試點擊第一個...');
              await page.locator(`${selector} .autocomplete-item, ${selector} .item, ${selector} li`).first().click();
              await page.waitForTimeout(2000);
              break;
            }
          }
        }
        
        if (!foundResults) {
          console.log('❌ 沒有找到搜尋結果，檢查 HTML 結構...');
          
          // 檢查實際的 HTML 結構
          const htmlContent = await page.locator('body').innerHTML();
          const hasAutoComplete = htmlContent.includes('autocomplete') || 
                                 htmlContent.includes('suggestions') ||
                                 htmlContent.includes('search-results');
          
          console.log(`📋 頁面包含自動完成相關元素: ${hasAutoComplete}`);
          
          // 手動模擬產品選擇
          console.log('🔧 嘗試手動模擬產品選擇...');
          
          // 執行 JavaScript 來手動觸發 selectProduct
          await page.evaluate(() => {
            // 找到 Alpine.js 組件
            const formElement = document.querySelector('[x-data]');
            if (formElement && formElement._x_dataStack && formElement._x_dataStack[0]) {
              const component = formElement._x_dataStack[0];
              
              if (component.selectProduct && component.formData && component.formData.items) {
                console.log('🔧 手動觸發 selectProduct...');
                
                // 模擬一個測試產品
                const testProduct = {
                  id: 123,
                  name: '測試產品',
                  unit_price: 1000,
                  description: '測試產品描述'
                };
                
                // 選擇第一個項目
                const item = component.formData.items[0];
                if (item) {
                  component.selectProduct(item, testProduct);
                }
              }
            }
          });
          
          await page.waitForTimeout(2000);
        }
        
        // 檢查產品選擇後的狀態
        console.log('📊 檢查產品選擇後的狀態...');
        const finalValue = await productInput.inputValue();
        console.log(`📦 最終產品輸入框值: "${finalValue}"`);
        
      } else {
        console.log('❌ 找不到產品輸入框');
      }
      
      // 輸出 console 訊息
      console.log('\n📋 重要的 Console 訊息:');
      const importantMessages = consoleMessages.filter(msg => 
        msg.includes('Selected product:') ||
        msg.includes('Before update') ||
        msg.includes('After update') ||
        msg.includes('Product ID set to:') ||
        msg.includes('草稿保存')
      );
      
      if (importantMessages.length > 0) {
        importantMessages.forEach(msg => console.log(`  🔍 ${msg}`));
      } else {
        console.log('  ❌ 沒有發現重要的調試訊息');
      }
      
      // 拍攝最終截圖
      await page.screenshot({
        path: 'api-debugging-test-final.png',
        fullPage: true
      });
      
      console.log('\n🎯 API 和產品自動完成調試測試完成！');
      console.log('📸 截圖已保存: api-debugging-test-final.png');
      
    } catch (error) {
      console.error(`❌ 測試過程中出現錯誤: ${error.message}`);
      
      await page.screenshot({
        path: 'api-debugging-test-error.png',
        fullPage: true
      });
      
      throw error;
    }
  });
});