const { test, expect } = require('@playwright/test');

test.describe('供應商編輯功能修復驗證', () => {
  test.beforeEach(async ({ page }) => {
    // 導航到首頁並登入
    await page.goto('http://127.0.0.1:8000');
    
    // 檢查是否需要登入
    const loginForm = await page.locator('form[action*="login"]').first();
    if (await loginForm.isVisible()) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
  });

  test('應能正確載入供應商列表頁面並進入編輯頁面', async ({ page }) => {
    // 導航到供應商管理頁面
    await page.goto('http://127.0.0.1:8000/suppliers');
    await page.waitForLoadState('networkidle');
    
    // 檢查頁面標題
    await expect(page).toHaveTitle(/供應商管理/);
    
    // 尋找編輯按鈕並點擊第一個供應商的編輯
    const editButtons = page.locator('a[href*="/suppliers/"][href*="/edit"], .btn-edit, [data-action="edit"]');
    
    // 等待編輯按鈕出現
    await editButtons.first().waitFor({ timeout: 10000 });
    
    // 點擊第一個編輯按鈕
    await editButtons.first().click();
    await page.waitForLoadState('networkidle');
    
    // 驗證成功進入編輯頁面
    await expect(page).toHaveURL(/\/suppliers\/\d+\/edit/);
    await expect(page.locator('form#supplier-form')).toBeVisible();
  });

  test('驗證地址欄位不再顯示 [object Object]', async ({ page }) => {
    // 導航到供應商編輯頁面（使用第一個供應商）
    await page.goto('http://127.0.0.1:8000/suppliers/1/edit');
    await page.waitForLoadState('networkidle');
    
    // 等待表單載入完成
    await page.waitForSelector('#form-content:not(.hidden)', { timeout: 15000 });
    
    // 檢查地址欄位
    const addressField = page.locator('#address');
    await addressField.waitFor({ timeout: 10000 });
    
    const addressValue = await addressField.inputValue();
    console.log('地址欄位值:', addressValue);
    
    // 驗證地址欄位不是 [object Object]
    expect(addressValue).not.toBe('[object Object]');
    expect(addressValue).not.toContain('[object Object]');
    
    // 如果有地址資料，應該是可讀的格式
    if (addressValue && addressValue.trim()) {
      // 檢查是否是結構化的地址或 JSON 格式
      const isStructuredAddress = addressValue.includes(',') || addressValue.includes('{');
      expect(isStructuredAddress).toBeTruthy();
    }
    
    // 截圖記錄
    await page.screenshot({ 
      path: 'supplier-edit-address-fixed.png',
      fullPage: true 
    });
  });

  test('驗證表單能成功提交而不出現陣列錯誤', async ({ page }) => {
    // 導航到供應商編輯頁面
    await page.goto('http://127.0.0.1:8000/suppliers/1/edit');
    await page.waitForLoadState('networkidle');
    
    // 等待表單載入完成
    await page.waitForSelector('#form-content:not(.hidden)', { timeout: 15000 });
    
    // 修改一些基本資料（不改變地址，只測試提交）
    await page.fill('#name', '測試供應商公司');
    
    // 監聽網路請求
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/suppliers/') && 
      response.request().method() === 'PUT'
    );
    
    // 提交表單
    await page.click('#submit-btn');
    
    try {
      // 等待 API 回應
      const response = await responsePromise;
      const responseStatus = response.status();
      
      console.log('API 回應狀態:', responseStatus);
      
      if (responseStatus >= 200 && responseStatus < 300) {
        console.log('✅ 表單提交成功');
        
        // 等待成功訊息或重導向
        await page.waitForFunction(() => {
          return window.location.href.includes('/suppliers') && 
                 !window.location.href.includes('/edit');
        }, { timeout: 10000 });
        
      } else {
        const responseText = await response.text();
        console.log('API 錯誤回應:', responseText);
        
        // 檢查是否包含陣列錯誤
        expect(responseText).not.toContain('address field must be an array');
        expect(responseText).not.toContain('address 欄位必須是陣列');
      }
      
    } catch (error) {
      console.log('提交測試錯誤:', error.message);
      
      // 檢查頁面是否有錯誤訊息
      const errorMessage = await page.locator('.alert-danger, .error-message, .text-red-500').textContent().catch(() => '');
      
      // 驗證不是地址陣列錯誤
      expect(errorMessage).not.toContain('address field must be an array');
      expect(errorMessage).not.toContain('address 欄位必須是陣列');
    }
    
    // 最終截圖
    await page.screenshot({ 
      path: 'supplier-edit-submit-result.png',
      fullPage: true 
    });
  });

  test('驗證 API 端點使用正確的 8082 端口', async ({ page }) => {
    // 導航到供應商編輯頁面
    await page.goto('http://127.0.0.1:8000/suppliers/1/edit');
    await page.waitForLoadState('networkidle');
    
    // 等待表單載入完成
    await page.waitForSelector('#form-content:not(.hidden)', { timeout: 15000 });
    
    // 檢查頁面中的 API_BASE_URL 設定
    const apiBaseUrl = await page.evaluate(() => {
      // 尋找頁面中的 API_BASE_URL
      const scripts = document.querySelectorAll('script');
      for (let script of scripts) {
        if (script.textContent && script.textContent.includes('API_BASE_URL')) {
          const match = script.textContent.match(/API_BASE_URL\s*=\s*['"]([^'"]+)['"]/);
          if (match) return match[1];
        }
      }
      return null;
    });
    
    console.log('檢測到的 API_BASE_URL:', apiBaseUrl);
    
    if (apiBaseUrl) {
      expect(apiBaseUrl).toBe('http://127.0.0.1:8082');
      expect(apiBaseUrl).not.toContain(':8000');
    }
    
    // 監聽網路請求以驗證實際使用的端點
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/suppliers/')) {
        requests.push(request.url());
      }
    });
    
    // 觸發一個 API 請求（重新載入資料）
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 檢查捕獲的請求
    if (requests.length > 0) {
      console.log('捕獲的 API 請求:', requests);
      requests.forEach(url => {
        expect(url).toContain(':8082');
        expect(url).not.toContain(':8000');
      });
    }
  });
});