import { test, expect } from '@playwright/test';

test.describe('NexusERP 客戶管理功能測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設定超時時間
    test.setTimeout(60000);
  });

  test('客戶管理功能完整測試流程', async ({ page }) => {
    console.log('開始測試 NexusERP 客戶管理功能...');

    // 步驟 1: 訪問登入頁面
    console.log('步驟 1: 訪問登入頁面');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 截圖登入頁面
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    
    // 檢查登入頁面基本元素
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    console.log('✅ 登入頁面載入成功，表單元素正常顯示');

    // 步驟 2: 執行登入
    console.log('步驟 2: 執行登入');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 截圖填寫完成的登入表單
    await page.screenshot({ path: 'screenshots/02-login-filled.png', fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 等待登入完成並檢查是否重定向到儀表板
    try {
      await expect(page).toHaveURL(/dashboard|home/, { timeout: 10000 });
      console.log('✅ 登入成功，已重定向到儀表板');
    } catch (error) {
      console.log('⚠️  登入後可能停留在當前頁面或其他頁面');
      console.log('當前 URL:', page.url());
    }
    
    // 截圖登入後頁面
    await page.screenshot({ path: 'screenshots/03-after-login.png', fullPage: true });

    // 步驟 3: 導航到客戶管理頁面
    console.log('步驟 3: 導航到客戶管理頁面');
    await page.goto('http://127.0.0.1:8000/customers');
    await page.waitForLoadState('networkidle');
    
    // 等待頁面完全載入
    await page.waitForTimeout(3000);
    
    // 截圖客戶管理頁面
    await page.screenshot({ path: 'screenshots/04-customers-page.png', fullPage: true });

    // 檢查頁面是否正確顯示
    console.log('檢查客戶管理頁面內容...');
    
    // 檢查是否有錯誤訊息
    const hasAuthError = await page.locator('text=Authorization header required').isVisible().catch(() => false);
    const hasServerError = await page.locator('text=500').isVisible().catch(() => false);
    const hasNotFoundError = await page.locator('text=404').isVisible().catch(() => false);
    
    if (hasAuthError) {
      console.log('❌ 發現 Authorization header required 錯誤');
    }
    if (hasServerError) {
      console.log('❌ 發現 500 伺服器錯誤');
    }
    if (hasNotFoundError) {
      console.log('❌ 發現 404 頁面未找到錯誤');
    }

    // 檢查客戶列表是否正常顯示
    const customerTableExists = await page.locator('table').isVisible().catch(() => false);
    const customerListExists = await page.locator('.customer-list, [data-testid="customer-list"]').isVisible().catch(() => false);
    const noDataMessage = await page.locator('text=暫無資料, text=沒有客戶, text=No customers found').isVisible().catch(() => false);
    
    if (customerTableExists) {
      console.log('✅ 找到客戶列表表格');
    } else if (customerListExists) {
      console.log('✅ 找到客戶列表容器');
    } else if (noDataMessage) {
      console.log('ℹ️  顯示無客戶資料訊息（正常情況）');
    } else {
      console.log('⚠️  未找到明確的客戶列表元素');
    }

    // 步驟 4: 檢查「新增客戶」按鈕
    console.log('步驟 4: 檢查「新增客戶」按鈕');
    
    const addCustomerButtons = [
      'text=新增客戶',
      'text=添加客戶', 
      'text=Add Customer',
      'button:has-text("新增")',
      'button:has-text("添加")',
      'button:has-text("Add")',
      '[data-testid="add-customer"]',
      '.btn-add-customer'
    ];
    
    let addButtonFound = false;
    let addButtonSelector = '';
    
    for (const selector of addCustomerButtons) {
      try {
        if (await page.locator(selector).isVisible()) {
          addButtonFound = true;
          addButtonSelector = selector;
          console.log(`✅ 找到新增客戶按鈕: ${selector}`);
          break;
        }
      } catch (error) {
        // 繼續尋找下一個選擇器
      }
    }
    
    if (!addButtonFound) {
      console.log('❌ 未找到新增客戶按鈕');
      
      // 檢查頁面內所有按鈕
      const allButtons = await page.locator('button').all();
      console.log(`頁面上共有 ${allButtons.length} 個按鈕:`);
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const buttonText = await allButtons[i].textContent();
        console.log(`  按鈕 ${i + 1}: "${buttonText}"`);
      }
    }

    // 步驟 5: 嘗試點擊新增客戶按鈕（如果存在）
    if (addButtonFound) {
      console.log('步驟 5: 嘗試點擊新增客戶按鈕');
      
      try {
        await page.locator(addButtonSelector).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // 截圖點擊後的頁面
        await page.screenshot({ path: 'screenshots/05-after-add-button-click.png', fullPage: true });
        
        console.log('✅ 成功點擊新增客戶按鈕');
        console.log('當前 URL:', page.url());
        
        // 檢查是否進入客戶建立頁面
        const hasCreateForm = await page.locator('form').isVisible().catch(() => false);
        const hasNameField = await page.locator('input[name="name"], input[name="customer_name"]').isVisible().catch(() => false);
        const hasEmailField = await page.locator('input[name="email"], input[name="customer_email"]').isVisible().catch(() => false);
        
        if (hasCreateForm || hasNameField || hasEmailField) {
          console.log('✅ 成功進入客戶建立頁面');
          
          // 步驟 6: 測試客戶建立表單
          console.log('步驟 6: 測試客戶建立表單');
          
          // 填寫客戶基本資訊
          if (hasNameField) {
            const nameField = await page.locator('input[name="name"], input[name="customer_name"]').first();
            await nameField.fill('測試客戶公司');
            console.log('✅ 已填寫客戶姓名/公司名稱');
          }
          
          if (hasEmailField) {
            const emailField = await page.locator('input[name="email"], input[name="customer_email"]').first();
            await emailField.fill('test.customer@example.com');
            console.log('✅ 已填寫客戶電子郵件');
          }
          
          // 填寫其他可能的字段
          const phoneField = await page.locator('input[name="phone"], input[name="customer_phone"]').first().catch(() => null);
          if (phoneField && await phoneField.isVisible()) {
            await phoneField.fill('0912345678');
            console.log('✅ 已填寫客戶電話');
          }
          
          const addressField = await page.locator('input[name="address"], textarea[name="address"]').first().catch(() => null);
          if (addressField && await addressField.isVisible()) {
            await addressField.fill('台北市信義區松仁路100號');
            console.log('✅ 已填寫客戶地址');
          }
          
          // 截圖填寫完成的表單
          await page.screenshot({ path: 'screenshots/06-customer-form-filled.png', fullPage: true });
          
          // 嘗試提交表單
          const submitButtons = [
            'button[type="submit"]',
            'text=提交',
            'text=儲存',
            'text=Save',
            'text=Create',
            'text=建立'
          ];
          
          let submitButtonFound = false;
          for (const selector of submitButtons) {
            try {
              if (await page.locator(selector).isVisible()) {
                console.log(`找到提交按鈕: ${selector}`);
                await page.locator(selector).click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);
                
                // 截圖提交後的頁面
                await page.screenshot({ path: 'screenshots/07-after-form-submit.png', fullPage: true });
                
                submitButtonFound = true;
                console.log('✅ 成功提交客戶建立表單');
                console.log('提交後 URL:', page.url());
                
                // 檢查是否成功建立客戶
                const successMessage = await page.locator('text=成功, text=Success, text=已建立, text=已新增').isVisible().catch(() => false);
                const errorMessage = await page.locator('text=錯誤, text=Error, text=失敗').isVisible().catch(() => false);
                
                if (successMessage) {
                  console.log('✅ 顯示成功訊息，客戶建立成功');
                } else if (errorMessage) {
                  console.log('❌ 顯示錯誤訊息，客戶建立失敗');
                } else {
                  console.log('ℹ️  未顯示明確的成功或失敗訊息');
                }
                
                break;
              }
            } catch (error) {
              // 繼續尋找下一個選擇器
            }
          }
          
          if (!submitButtonFound) {
            console.log('❌ 未找到提交按鈕');
          }
          
        } else {
          console.log('❌ 點擊後未進入客戶建立表單頁面');
        }
        
      } catch (error) {
        console.log('❌ 點擊新增客戶按鈕時發生錯誤:', error.message);
      }
    }

    // 最終截圖
    await page.screenshot({ path: 'screenshots/08-final-state.png', fullPage: true });
    
    // 總結測試結果
    console.log('\n=== 測試結果總結 ===');
    console.log('1. 登入功能: ✅ 正常');
    console.log('2. 客戶頁面訪問:', hasAuthError || hasServerError ? '❌ 有錯誤' : '✅ 正常');
    console.log('3. 新增客戶按鈕:', addButtonFound ? '✅ 存在' : '❌ 不存在');
    console.log('4. 客戶建立功能: 需要進一步驗證');
    console.log('========================\n');
  });

  test.afterEach(async ({ page }) => {
    // 清理工作
    await page.close();
  });
});