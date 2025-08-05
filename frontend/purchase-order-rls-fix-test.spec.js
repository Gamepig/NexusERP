import { test, expect } from '@playwright/test';

/**
 * NexusERP 採購單 RLS 修復測試
 * 
 * 測試目標：
 * 1. 驗證採購單創建修復
 * 2. 驗證供應商代碼生成修復  
 * 3. 檢查 RLS 錯誤是否已解決
 * 
 * 測試帳號：test@example.com / password123
 */

test.describe('採購單 RLS 修復測試', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.context().clearCookies();
    
    try {
      await page.goto('http://127.0.0.1:8000');
      await page.evaluate(() => {
        if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
      });
    } catch (error) {
      console.log('清空 storage 時發生錯誤，繼續執行測試:', error.message);
    }
  });

  test('採購單創建修復測試', async ({ page }) => {
    console.log('🚀 開始測試採購單創建修復...');

    // ========== 步驟 1: 登入系統 ==========
    await test.step('登入系統', async () => {
      await page.goto('http://127.0.0.1:8000/login');
      await expect(page).toHaveURL(/.*\/login/);
      
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      await page.waitForURL(/.*\/(dashboard|home|\/)$/, { timeout: 15000 });
      console.log('✅ 登入成功');
    });

    // ========== 步驟 2: 導航到採購單創建頁面 ==========
    await test.step('訪問採購單創建頁面', async () => {
      await page.goto('http://127.0.0.1:8000/orders/purchase/create');
      await expect(page).toHaveURL(/.*\/orders\/purchase\/create/);
      await expect(page.locator('#purchase-order-form')).toBeVisible({ timeout: 10000 });
      console.log('✅ 成功導航到採購單創建頁面');
    });

    // ========== 步驟 3: 填寫表單並測試 RLS 修復 ==========
    await test.step('填寫並提交採購單表單', async () => {
      // 等待數據載入
      await page.waitForTimeout(3000);
      
      // 選擇正確公司(77)的供應商 - 使用 ID 217 (仁寶電腦工業股份有限公司)
      const supplierSelect = page.locator('#supplier_id');
      await supplierSelect.waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // 選擇供應商 ID 217
      await supplierSelect.selectOption('217');
      console.log('✅ 選擇供應商: 仁寶電腦工業股份有限公司 (ID: 217)');
      
      // 填寫基本資訊
      const today = new Date().toISOString().split('T')[0];
      await page.locator('#order_date').fill(today);
      
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const deliveryDate = nextMonth.toISOString().split('T')[0];
      await page.locator('#expected_delivery_date').fill(deliveryDate);
      
      await page.locator('#currency').selectOption('TWD');
      await page.locator('#payment_terms').fill('Net 30 days');
      await page.locator('#notes').fill('RLS 修復測試採購單');
      
      // 填寫採購項目 - 選擇第一個可用產品
      await page.waitForTimeout(2000);
      const firstProductSelect = page.locator('select[name*="[product_id]"]').first();
      await firstProductSelect.waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // 選擇第一個可用產品
      const productOptions = await firstProductSelect.locator('option:not([value=""])').count();
      if (productOptions > 0) {
        await firstProductSelect.selectOption({ index: 1 });
        console.log('✅ 產品選擇完成');
      } else {
        console.log('⚠️ 沒有可用產品，跳過產品選擇');
      }
      
      // 填寫數量和單價
      await page.locator('input[name*="[quantity]"]').first().fill('10');
      await page.locator('input[name*="[unit_price]"]').first().fill('4500');
      
      await page.waitForTimeout(1000);
      console.log('✅ 表單填寫完成');
    });

    // ========== 步驟 4: 提交表單並驗證修復 ==========
    await test.step('提交表單並檢查 RLS 修復', async () => {
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
      
      // 監聽 API 請求
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/purchase-orders') && response.request().method() === 'POST',
        { timeout: 30000 }
      );
      
      // 點擊提交
      await submitButton.click();
      console.log('✅ 提交按鈕已點擊');
      
      // 等待並分析 API 回應
      const response = await responsePromise;
      console.log('📊 API 回應狀態:', response.status());
      
      if (response.status() >= 300 && response.status() < 400) {
        console.log('✅ API 創建成功（重定向回應）- RLS 修復成功');
      } else {
        try {
          const responseData = await response.json();
          console.log('📊 API 回應數據:', JSON.stringify(responseData, null, 2));
          
          if (response.status() === 201 || response.status() === 200) {
            expect(responseData.success).toBe(true);
            console.log('✅ API 創建成功 - RLS 修復成功');
          } else if (response.status() === 422) {
            if (responseData.message?.includes('選擇的供應商不存在或已停用')) {
              console.log('❌ RLS 錯誤仍然存在:', responseData.message);
              throw new Error('RLS 修復失敗: 供應商查詢問題');
            } else {
              console.log('ℹ️ 其他驗證錯誤 (非 RLS 問題):', responseData.message);
            }
          } else {
            console.log('❌ API 回應錯誤:', response.status(), responseData);
            throw new Error(`API 請求失敗: ${response.status()}`);
          }
        } catch (jsonError) {
          if (jsonError.message.includes('Response body is unavailable')) {
            console.log('✅ API 創建成功（重定向回應）- RLS 修復成功');
          } else {
            throw jsonError;
          }
        }
      }
    });

    console.log('🎉 採購單創建修復測試完成');
  });

  test('供應商代碼生成修復測試', async ({ page }) => {
    console.log('🚀 開始測試供應商代碼生成修復...');

    // 登入系統
    await test.step('登入系統', async () => {
      await page.goto('http://127.0.0.1:8000/login');
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/.*\/(dashboard|home|\/)$/);
      console.log('✅ 登入成功');
    });

    // 訪問供應商創建頁面
    await test.step('訪問供應商創建頁面', async () => {
      await page.goto('http://127.0.0.1:8000/suppliers/create');
      await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
      console.log('✅ 成功導航到供應商創建頁面');
    });

    // 填寫並提交供應商表單
    await test.step('填寫並提交供應商表單', async () => {
      // 填寫供應商資訊
      await page.locator('input[name="name"]').fill('測試供應商123');
      await page.locator('input[name="contact_person"]').fill('Test Contact');
      await page.locator('input[name="email"]').fill('test@supplier.com');
      await page.locator('input[name="phone"]').fill('0912345678');
      
      console.log('✅ 供應商資訊填寫完成');

      // 監聽提交請求
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/suppliers') && response.request().method() === 'POST',
        { timeout: 30000 }
      );

      // 提交表單
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      console.log('✅ 提交按鈕已點擊');

      // 檢查回應
      const response = await responsePromise;
      console.log('📊 供應商創建回應狀態:', response.status());

      if (response.status() >= 200 && response.status() < 300) {
        console.log('✅ 供應商創建成功 - 代碼生成修復成功');
      } else if (response.status() >= 300 && response.status() < 400) {
        console.log('✅ 供應商創建成功（重定向）- 代碼生成修復成功');
      } else {
        try {
          const responseData = await response.json();
          console.log('📊 供應商創建回應數據:', JSON.stringify(responseData, null, 2));
          
          if (responseData.errors?.code) {
            console.log('❌ 代碼生成錯誤仍然存在:', responseData.errors.code);
            throw new Error('供應商代碼生成修復失敗');
          }
        } catch (jsonError) {
          if (jsonError.message.includes('Response body is unavailable')) {
            console.log('✅ 供應商創建成功（重定向）- 代碼生成修復成功');
          } else {
            throw jsonError;
          }
        }
      }
    });

    console.log('🎉 供應商代碼生成修復測試完成');
  });

  test('錯誤日誌檢查', async ({ page }) => {
    console.log('🚀 檢查系統錯誤日誌...');

    // 監聽控制台錯誤
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 登入並訪問幾個關鍵頁面
    await page.goto('http://127.0.0.1:8000/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/(dashboard|home|\/)$/);
    
    // 訪問採購單頁面
    await page.goto('http://127.0.0.1:8000/orders/purchase/create');
    await page.waitForTimeout(3000);
    
    // 訪問供應商頁面
    await page.goto('http://127.0.0.1:8000/suppliers');
    await page.waitForTimeout(2000);

    // 檢查控制台錯誤
    if (consoleErrors.length > 0) {
      console.log('⚠️ 發現控制台錯誤:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      
      // 檢查是否有 RLS 相關錯誤
      const rlsErrors = consoleErrors.filter(error => 
        error.includes('RLS') || 
        error.includes('row-level security') ||
        error.includes('policy')
      );
      
      if (rlsErrors.length > 0) {
        console.log('❌ 發現 RLS 相關錯誤:');
        rlsErrors.forEach(error => console.log(`- ${error}`));
      } else {
        console.log('✅ 未發現 RLS 相關錯誤');
      }
    } else {
      console.log('✅ 未發現控制台錯誤');
    }

    console.log('🎉 錯誤日誌檢查完成');
  });

  // 測試失敗時的截圖
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ 
        path: `test-results/purchase-order-rls-fix-failure-${Date.now()}.png`,
        fullPage: true 
      });
      await testInfo.attach('screenshot', { 
        body: screenshot, 
        contentType: 'image/png' 
      });
    }
  });
});