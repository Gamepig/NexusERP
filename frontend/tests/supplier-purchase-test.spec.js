import { test, expect } from '@playwright/test';

test.describe('供應商和採購訂單功能測試', () => {
  let context;
  let page;
  
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('1. 測試登入功能', async () => {
    console.log('測試步驟 1: 登入測試');
    
    // 訪問登入頁面
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 填寫登入資訊
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 點擊登入按鈕
    await page.click('button[type="submit"]');
    
    // 等待登入成功，檢查是否跳轉到首頁
    await page.waitForURL('http://127.0.0.1:8000/dashboard', { timeout: 10000 });
    
    console.log('✅ 登入成功');
  });

  test('2. 測試供應商管理頁面訪問', async () => {
    console.log('測試步驟 2: 訪問供應商管理頁面');
    
    // 訪問供應商管理頁面
    await page.goto('http://127.0.0.1:8000/suppliers');
    await page.waitForLoadState('networkidle');
    
    // 檢查頁面是否正常載入
    const pageTitle = await page.locator('h1, .page-title, .card-header').first().textContent();
    console.log('頁面標題:', pageTitle);
    
    // 檢查是否有新增按鈕
    const addButton = page.locator('a[href*="create"], button:has-text("新增"), button:has-text("添加")').first();
    if (await addButton.count() > 0) {
      console.log('✅ 找到新增按鈕');
    } else {
      console.log('⚠️  未找到新增按鈕，檢查頁面結構');
    }
  });

  test('3. 測試供應商新增功能', async () => {
    console.log('測試步驟 3: 新增供應商');
    
    // 訪問供應商新增頁面
    await page.goto('http://127.0.0.1:8000/suppliers/create');
    await page.waitForLoadState('networkidle');
    
    // 生成唯一的供應商名稱
    const timestamp = Date.now();
    const supplierName = `測試供應商公司_${timestamp}`;
    
    // 填寫供應商資訊
    await page.fill('input[name="name"]', supplierName);
    await page.fill('input[name="contact_person"]', '測試聯絡人');
    await page.fill('input[name="phone"]', '0912345678');
    await page.fill('input[name="email"]', `supplier${timestamp}@test.com`);
    await page.fill('textarea[name="address"]', '測試地址123號');
    
    // 提交表單
    await page.click('button[type="submit"]');
    
    // 等待提交結果
    await page.waitForLoadState('networkidle');
    
    // 檢查是否成功創建 - 可能跳轉到列表頁面或顯示成功訊息
    const currentUrl = page.url();
    console.log('提交後的 URL:', currentUrl);
    
    // 檢查是否有成功訊息或回到列表頁面
    const successMessage = await page.locator('.alert-success, .toast-success, .notification-success').count();
    if (successMessage > 0) {
      console.log('✅ 發現成功訊息');
    }
    
    // 記錄創建的供應商名稱供後續測試使用
    test.info().annotations.push({ type: 'supplier-name', description: supplierName });
    console.log('✅ 供應商創建測試完成，供應商名稱:', supplierName);
  });

  test('4. 測試採購訂單建立頁面訪問', async () => {
    console.log('測試步驟 4: 訪問採購訂單建立頁面');
    
    // 訪問採購訂單建立頁面
    await page.goto('http://127.0.0.1:8000/orders/purchase/create');
    await page.waitForLoadState('networkidle');
    
    // 檢查頁面是否正常載入
    const pageContent = await page.content();
    
    // 檢查是否有錯誤訊息
    const errorMessage = await page.locator('.alert-danger, .error, .text-danger').count();
    if (errorMessage > 0) {
      const errorText = await page.locator('.alert-danger, .error, .text-danger').first().textContent();
      console.log('❌ 發現錯誤訊息:', errorText);
    } else {
      console.log('✅ 頁面正常載入，無錯誤訊息');
    }
    
    // 檢查供應商下拉選單
    const supplierSelect = page.locator('select[name="supplier_id"], select[name="supplier"]').first();
    if (await supplierSelect.count() > 0) {
      console.log('✅ 找到供應商下拉選單');
      
      // 檢查下拉選單選項
      const options = await supplierSelect.locator('option').count();
      console.log('供應商選項數量:', options);
      
      if (options > 1) { // 通常第一個是 "請選擇" 選項
        console.log('✅ 供應商下拉選單有可用選項');
      } else {
        console.log('⚠️  供應商下拉選單選項不足');
      }
    } else {
      console.log('❌ 未找到供應商下拉選單');
    }
  });

  test('5. 測試採購訂單建立功能', async () => {
    console.log('測試步驟 5: 建立採購訂單');
    
    // 確保在採購訂單建立頁面
    await page.goto('http://127.0.0.1:8000/orders/purchase/create');
    await page.waitForLoadState('networkidle');
    
    // 選擇供應商
    const supplierSelect = page.locator('select[name="supplier_id"], select[name="supplier"]').first();
    
    if (await supplierSelect.count() > 0) {
      // 獲取可用的供應商選項
      const options = await supplierSelect.locator('option').all();
      
      if (options.length > 1) {
        // 選擇第一個可用的供應商（跳過預設的空選項）
        await supplierSelect.selectOption({ index: 1 });
        console.log('✅ 已選擇供應商');
        
        // 填寫其他必要欄位
        const orderDate = new Date().toISOString().split('T')[0];
        await page.fill('input[name="order_date"]', orderDate);
        
        // 如果有備註欄位
        const notesField = page.locator('textarea[name="notes"], input[name="notes"]');
        if (await notesField.count() > 0) {
          await notesField.fill('測試採購訂單備註');
        }
        
        // 提交表單
        await page.click('button[type="submit"]');
        
        // 等待提交結果
        await page.waitForLoadState('networkidle');
        
        // 檢查結果
        const currentUrl = page.url();
        console.log('提交後的 URL:', currentUrl);
        
        // 檢查是否有錯誤訊息
        const errorMessage = await page.locator('.alert-danger, .error, .text-danger').count();
        if (errorMessage > 0) {
          const errorText = await page.locator('.alert-danger, .error, .text-danger').allTextContents();
          console.log('❌ 發現錯誤訊息:', errorText);
        } else {
          console.log('✅ 採購訂單建立測試完成，無錯誤');
        }
        
        // 檢查成功訊息
        const successMessage = await page.locator('.alert-success, .toast-success, .notification-success').count();
        if (successMessage > 0) {
          console.log('✅ 發現成功訊息');
        }
        
      } else {
        console.log('❌ 沒有可用的供應商選項');
      }
    } else {
      console.log('❌ 未找到供應商選擇欄位');
    }
  });

  test('6. 測試結果總結', async () => {
    console.log('測試步驟 6: 結果總結');
    
    // 再次檢查供應商列表
    await page.goto('http://127.0.0.1:8000/suppliers');
    await page.waitForLoadState('networkidle');
    
    const supplierCount = await page.locator('table tbody tr, .supplier-item, .card').count();
    console.log('供應商總數:', supplierCount);
    
    // 再次檢查採購訂單建立頁面
    await page.goto('http://127.0.0.1:8000/orders/purchase/create');
    await page.waitForLoadState('networkidle');
    
    const finalErrorCheck = await page.locator('.alert-danger, .error, .text-danger').count();
    if (finalErrorCheck === 0) {
      console.log('✅ 最終檢查：採購訂單頁面無錯誤');
    } else {
      console.log('❌ 最終檢查：仍有錯誤訊息');
    }
    
    console.log('🎯 測試完成');
  });
});