const { test, expect } = require('@playwright/test');

test.describe('供應商編輯深層修復驗證', () => {
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

  test('驗證地址欄位智能解析功能', async ({ page }) => {
    // 導航到供應商編輯頁面
    await page.goto('http://127.0.0.1:8000/suppliers/1/edit');
    await page.waitForLoadState('networkidle');
    
    // 等待表單載入完成
    await page.waitForSelector('#form-content:not(.hidden)', { timeout: 15000 });
    
    // 檢查地址欄位
    const addressField = page.locator('#address');
    await addressField.waitFor({ timeout: 10000 });
    
    const addressValue = await addressField.inputValue();
    console.log('🏠 地址欄位值:', addressValue);
    
    // 驗證地址欄位處理
    expect(addressValue).not.toBe('[object Object]');
    expect(addressValue).not.toContain('{"address":');
    
    // 如果是結構化地址，應該是可讀格式
    if (addressValue && addressValue.trim()) {
      // 檢查是否為可讀格式或已格式化的內容
      const isReadable = !addressValue.startsWith('{') || addressValue.includes('\n');
      console.log('地址可讀性檢查:', isReadable);
      
      // 地址應該不包含原始JSON格式
      expect(addressValue).not.toMatch(/^\s*\{.*\}\s*$/);
    }
    
    await page.screenshot({ 
      path: 'supplier-edit-address-intelligent-parsing.png',
      fullPage: true 
    });
  });

  test('驗證狀態欄位雙向映射正確性', async ({ page }) => {
    // 導航到供應商編輯頁面
    await page.goto('http://127.0.0.1:8000/suppliers/1/edit');
    await page.waitForLoadState('networkidle');
    
    // 等待表單載入完成
    await page.waitForSelector('#form-content:not(.hidden)', { timeout: 15000 });
    
    // 檢查狀態欄位
    const statusField = page.locator('#status');
    await statusField.waitFor({ timeout: 10000 });
    
    const statusValue = await statusField.inputValue();
    console.log('📊 狀態欄位值:', statusValue);
    
    // 驗證狀態值是有效的選項
    expect(['active', 'inactive', 'pending']).toContain(statusValue);
    
    // 切換狀態測試
    const originalStatus = statusValue;
    const newStatus = originalStatus === 'active' ? 'inactive' : 'active';
    
    await statusField.selectOption(newStatus);
    const changedStatus = await statusField.inputValue();
    
    console.log(`狀態變更: ${originalStatus} → ${changedStatus}`);
    expect(changedStatus).toBe(newStatus);
    
    await page.screenshot({ 
      path: 'supplier-edit-status-field-test.png',
      fullPage: true 
    });
  });

  test('驗證完整的表單提交流程', async ({ page }) => {
    // 導航到供應商編輯頁面
    await page.goto('http://127.0.0.1:8000/suppliers/1/edit');
    await page.waitForLoadState('networkidle');
    
    // 等待表單載入完成
    await page.waitForSelector('#form-content:not(.hidden)', { timeout: 15000 });
    
    // 獲取原始狀態
    const originalStatus = await page.locator('#status').inputValue();
    console.log('原始狀態:', originalStatus);
    
    // 修改一些資料進行測試
    await page.fill('#name', '測試供應商公司 - 深層修復');
    
    // 確保狀態欄位有值
    await page.locator('#status').selectOption('active');
    
    // 監聽網路請求
    let requestData = null;
    page.on('request', request => {
      if (request.url().includes('/api/suppliers/') && request.method() === 'PUT') {
        try {
          requestData = JSON.parse(request.postData() || '{}');
          console.log('📤 發送的請求資料:', requestData);
        } catch (e) {
          console.log('無法解析請求資料:', e.message);
        }
      }
    });
    
    // 提交表單
    await page.click('#submit-btn');
    
    // 等待一點時間讓請求發出
    await page.waitForTimeout(2000);
    
    // 驗證請求資料格式
    if (requestData) {
      // 檢查是否使用正確的 is_active 欄位
      expect(requestData).toHaveProperty('is_active');
      expect(typeof requestData.is_active).toBe('boolean');
      
      // 檢查不應該有 status 欄位
      expect(requestData).not.toHaveProperty('status');
      
      console.log('✅ 請求資料格式正確: is_active =', requestData.is_active);
    }
    
    // 檢查是否有成功訊息或重導向
    try {
      // 等待可能的成功處理
      await page.waitForFunction(() => {
        return window.location.href.includes('/suppliers') && 
               !window.location.href.includes('/edit');
      }, { timeout: 5000 });
      
      console.log('✅ 成功重導向至列表頁面');
    } catch (e) {
      // 檢查是否有錯誤訊息
      const errorElements = await page.locator('.alert-danger, .error-message, .text-red-500').all();
      
      for (const element of errorElements) {
        const errorText = await element.textContent();
        if (errorText && errorText.trim()) {
          console.log('⚠️ 發現錯誤訊息:', errorText.trim());
          
          // 確認不是地址陣列錯誤
          expect(errorText).not.toContain('address field must be an array');
          expect(errorText).not.toContain('address 欄位必須是陣列');
        }
      }
    }
    
    await page.screenshot({ 
      path: 'supplier-edit-complete-form-test.png',
      fullPage: true 
    });
  });

  test('驗證列表頁面與編輯頁面狀態一致性', async ({ page }) => {
    // 先查看列表頁面
    await page.goto('http://127.0.0.1:8000/suppliers');
    await page.waitForLoadState('networkidle');
    
    // 尋找第一個供應商的狀態
    const statusElements = await page.locator('[data-status], .status-badge, .badge').all();
    let listPageStatus = null;
    
    for (const element of statusElements) {
      const text = await element.textContent();
      if (text && (text.includes('啟用') || text.includes('停用') || text.includes('active') || text.includes('inactive'))) {
        listPageStatus = text.trim();
        break;
      }
    }
    
    console.log('📋 列表頁面狀態:', listPageStatus);
    
    // 進入編輯頁面
    const editButton = page.locator('a[href*="/suppliers/"][href*="/edit"], .btn-edit, [data-action="edit"]').first();
    await editButton.click();
    await page.waitForLoadState('networkidle');
    
    // 等待表單載入
    await page.waitForSelector('#form-content:not(.hidden)', { timeout: 15000 });
    
    // 檢查編輯頁面的狀態
    const editPageStatus = await page.locator('#status').inputValue();
    console.log('✏️ 編輯頁面狀態:', editPageStatus);
    
    // 驗證狀態一致性
    if (listPageStatus) {
      if (listPageStatus.includes('啟用') || listPageStatus.includes('active')) {
        expect(editPageStatus).toBe('active');
      } else if (listPageStatus.includes('停用') || listPageStatus.includes('inactive')) {
        expect(editPageStatus).toBe('inactive');
      }
      
      console.log('✅ 列表和編輯頁面狀態一致');
    }
    
    await page.screenshot({ 
      path: 'supplier-status-consistency-check.png',
      fullPage: true 
    });
  });
});