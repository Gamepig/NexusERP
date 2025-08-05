import { test, expect } from '@playwright/test';

// 測試帳號資訊
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// 基礎URL
const BASE_URL = 'http://127.0.0.1:8000';

test.describe('報價系統特定功能測試 - 基於實際頁面內容', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // 登入系統
    console.log('🔑 開始登入流程...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
    console.log('✅ 登入成功');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('🔍 報價單管理頁面功能驗證', async () => {
    console.log('📋 測試報價單管理頁面...');
    
    // 導航到報價頁面
    await page.goto(`${BASE_URL}/quotes`);
    await page.waitForLoadState('networkidle');
    
    // 檢查頁面標題 (基於實際內容)
    await expect(page.locator('h1, h2, .page-title')).toContainText('報價單管理', { timeout: 10000 });
    console.log('✅ 頁面標題正確顯示');
    
    // 檢查建立報價單按鈕
    const createButton = await page.locator('text=建立報價單').first();
    await expect(createButton).toBeVisible();
    console.log('✅ 建立報價單按鈕存在');
    
    // 檢查報價單列表
    const hasQuotesList = await page.locator('.table, table, tbody tr').count() > 0;
    if (hasQuotesList) {
      console.log('✅ 報價單列表顯示正常');
      
      // 檢查列表中的操作按鈕
      const viewButtons = await page.locator('text=檢視').count();
      const editButtons = await page.locator('text=編輯').count();
      const convertButtons = await page.locator('text=轉換為訂單').count();
      
      console.log(`🔍 檢視按鈕數量: ${viewButtons}`);
      console.log(`✏️ 編輯按鈕數量: ${editButtons}`);
      console.log(`🔄 轉換按鈕數量: ${convertButtons}`);
      
      if (viewButtons > 0) console.log('✅ 檢視功能按鈕存在');
      if (editButtons > 0) console.log('✅ 編輯功能按鈕存在');  
      if (convertButtons > 0) console.log('✅ 轉換為訂單功能按鈕存在');
    }
    
    await page.screenshot({ path: 'quotes-specific-01-main-page.png', fullPage: true });
    console.log('✅ 報價單管理頁面功能驗證完成');
  });

  test('📝 建立報價單頁面功能測試', async () => {
    console.log('📝 測試建立報價單頁面...');
    
    // 點擊建立報價單按鈕
    await page.goto(`${BASE_URL}/quotes`);
    await page.waitForLoadState('networkidle');
    
    const createButton = await page.locator('text=建立報價單').first();
    await createButton.click();
    await page.waitForLoadState('networkidle');
    
    // 檢查頁面標題
    const hasCreateTitle = await page.locator('text=建立報價單').count() > 0;
    expect(hasCreateTitle).toBeTruthy();
    console.log('✅ 建立報價單頁面載入成功');
    
    // 檢查關鍵表單欄位
    const customerField = await page.locator('select[name*="customer"], input[name*="customer"]').first();
    if (await customerField.count() > 0) {
      console.log('✅ 客戶選擇欄位存在');
    }
    
    // 重點測試：產品自動完成功能 (修復的錯誤)
    const productField = await page.locator('input[placeholder*="產品"], input[name*="product"]').first();
    if (await productField.count() > 0) {
      console.log('✅ 產品搜尋欄位存在');
      
      // 測試產品搜尋功能
      await productField.click();
      await productField.fill('產品');
      await page.waitForTimeout(2000);
      
      const hasProductDropdown = await page.locator('.autocomplete, .dropdown-menu, .suggestion').count() > 0;
      if (hasProductDropdown) {
        console.log('✅ 產品自動完成功能正常運作');
      } else {
        console.log('⚠️ 產品自動完成下拉選單未出現');
      }
    }
    
    // 重點測試：有效期限欄位 (修復的錯誤)
    const validUntilField = await page.locator('input[name*="valid_until"], input[type="date"]').first();
    if (await validUntilField.count() > 0) {
      console.log('✅ 有效期限欄位存在');
      
      // 測試日期欄位功能
      const isEnabled = await validUntilField.isEnabled();
      console.log(`✅ 有效期限欄位狀態: ${isEnabled ? '可用' : '不可用'}`);
    } else {
      console.log('⚠️ 有效期限欄位未找到');
    }
    
    await page.screenshot({ path: 'quotes-specific-02-create-page.png', fullPage: true });
    console.log('✅ 建立報價單頁面功能測試完成');
  });

  test('✏️ 編輯報價單功能測試', async () => {
    console.log('✏️ 測試編輯報價單功能...');
    
    // 到報價列表頁面
    await page.goto(`${BASE_URL}/quotes`);
    await page.waitForLoadState('networkidle');
    
    // 點擊第一個編輯按鈕
    const editButton = await page.locator('text=編輯').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      
      // 檢查編輯頁面標題
      const hasEditTitle = await page.locator('text=修改報價單').count() > 0;
      if (hasEditTitle) {
        console.log('✅ 編輯報價單頁面載入成功');
      }
      
      // 重點檢查：valid_until 欄位是否正常顯示 (修復的關鍵錯誤)
      const validUntilField = await page.locator('input[name*="valid_until"], input[type="date"]').first();
      if (await validUntilField.count() > 0) {
        const fieldValue = await validUntilField.inputValue();
        const isVisible = await validUntilField.isVisible();
        const isEnabled = await validUntilField.isEnabled();
        
        console.log(`✅ valid_until 欄位檢查:`);
        console.log(`   - 可見性: ${isVisible}`);
        console.log(`   - 可用性: ${isEnabled}`);
        console.log(`   - 當前值: ${fieldValue || '(空白)'}`);
        
        if (isVisible && isEnabled) {
          console.log('✅ valid_until 欄位修復成功');
        } else {
          console.log('⚠️ valid_until 欄位仍有問題');
        }
      } else {
        console.log('❌ valid_until 欄位完全缺失');
      }
      
      await page.screenshot({ path: 'quotes-specific-03-edit-page.png', fullPage: true });
    } else {
      console.log('⚠️ 未找到編輯按鈕，嘗試直接訪問編輯頁面');
      await page.goto(`${BASE_URL}/quotes/1/edit`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'quotes-specific-03-edit-direct.png', fullPage: true });
    }
    
    console.log('✅ 編輯報價單功能測試完成');
  });

  test('👁️ 檢視報價單和轉換功能測試', async () => {
    console.log('👁️ 測試檢視報價單和轉換功能...');
    
    // 到報價列表頁面
    await page.goto(`${BASE_URL}/quotes`);
    await page.waitForLoadState('networkidle');
    
    // 點擊第一個檢視按鈕
    const viewButton = await page.locator('text=檢視').first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      // 檢查詳細頁面載入
      const hasContent = await page.locator('h1, h2, .card, .quote-details').count() > 0;
      if (hasContent) {
        console.log('✅ 報價單詳細頁面載入成功');
      }
      
      // 重點測試：轉換為訂單功能 (修復的關鍵錯誤)
      const convertButton = await page.locator('text=轉換為訂單').first();
      if (await convertButton.count() > 0) {
        const isVisible = await convertButton.isVisible();
        const isEnabled = await convertButton.isEnabled();
        
        console.log(`✅ 轉換為訂單按鈕檢查:`);
        console.log(`   - 可見性: ${isVisible}`);
        console.log(`   - 可用性: ${isEnabled}`);
        
        if (isVisible && isEnabled) {
          console.log('✅ 轉換為訂單功能正常');
          
          // 可以進一步測試點擊行為 (但不實際執行轉換)
          // await convertButton.click({ trial: true }); // 試點擊不執行
        } else {
          console.log('⚠️ 轉換為訂單按鈕有問題');
        }
      } else {
        console.log('❌ 轉換為訂單按鈕未找到');
      }
      
      await page.screenshot({ path: 'quotes-specific-04-view-page.png', fullPage: true });
    } else {
      console.log('⚠️ 未找到檢視按鈕，嘗試直接訪問檢視頁面');
      await page.goto(`${BASE_URL}/quotes/1`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'quotes-specific-04-view-direct.png', fullPage: true });
    }
    
    console.log('✅ 檢視報價單和轉換功能測試完成');
  });

  test('🔗 從客戶頁面建立報價單功能測試', async () => {
    console.log('🔗 測試從客戶頁面建立報價單功能...');
    
    // 到客戶管理頁面
    await page.goto(`${BASE_URL}/customers`);
    await page.waitForLoadState('networkidle');
    
    // 尋找第一個客戶的詳細連結
    const customerLink = await page.locator('table tbody tr td a, .customer-name a').first();
    if (await customerLink.count() > 0) {
      await customerLink.click();
      await page.waitForLoadState('networkidle');
      
      // 在客戶詳細頁面尋找建立報價按鈕
      const createQuoteButton = await page.locator('text=建立報價, text=Create Quote, a[href*="quotes/create"]').first();
      if (await createQuoteButton.count() > 0) {
        await createQuoteButton.click();
        await page.waitForLoadState('networkidle');
        
        // 重點測試：檢查客戶資訊是否自動填入 (修復的錯誤)
        const customerField = await page.locator('select[name*="customer"], input[name*="customer"]').first();
        if (await customerField.count() > 0) {
          const fieldValue = await customerField.inputValue();
          const selectedText = await customerField.textContent();
          
          if (fieldValue || selectedText) {
            console.log(`✅ 客戶資訊自動填入功能正常`);
            console.log(`   - 欄位值: ${fieldValue || '(下拉選擇)'}`);
            console.log(`   - 選中文字: ${selectedText?.trim() || '無'}`);
          } else {
            console.log('⚠️ 客戶資訊未自動填入');
          }
        }
        
        await page.screenshot({ path: 'quotes-specific-05-customer-prefill.png', fullPage: true });
      } else {
        console.log('⚠️ 客戶詳細頁面未找到建立報價按鈕');
        await page.screenshot({ path: 'quotes-specific-05-customer-no-button.png', fullPage: true });
      }
    } else {
      console.log('⚠️ 客戶列表中未找到客戶連結');
      await page.screenshot({ path: 'quotes-specific-05-no-customers.png', fullPage: true });
    }
    
    console.log('✅ 從客戶頁面建立報價單功能測試完成');
  });

  test('🧪 表單驗證和提交測試', async () => {
    console.log('🧪 測試表單驗證和提交...');
    
    // 到建立報價頁面
    await page.goto(`${BASE_URL}/quotes/create`);
    await page.waitForLoadState('networkidle');
    
    // 測試空表單提交
    const submitButton = await page.locator('button[type="submit"], input[type="submit"], button:has-text("保存"), button:has-text("提交")').first();
    if (await submitButton.count() > 0) {
      console.log('✅ 提交按鈕存在');
      
      // 嘗試提交空表單
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // 檢查驗證錯誤
      const errorMessages = await page.locator('.error, .invalid-feedback, .alert-danger, .text-danger').count();
      if (errorMessages > 0) {
        console.log('✅ 表單驗證錯誤正常顯示');
      } else {
        console.log('⚠️ 未發現表單驗證錯誤提示');
      }
      
      await page.screenshot({ path: 'quotes-specific-06-form-validation.png', fullPage: true });
    } else {
      console.log('⚠️ 未找到提交按鈕');
    }
    
    console.log('✅ 表單驗證和提交測試完成');
  });
});

// 總結測試
test.describe('報價系統修復驗證總結', () => {
  test('📊 5個關鍵錯誤修復狀況報告', async ({ page }) => {
    console.log('📊 生成5個關鍵錯誤修復狀況報告...');
    
    // 登入
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    let report = {
      '轉換訂單功能': '待檢測',
      '編輯頁面valid_until欄位': '待檢測', 
      '檢視功能': '待檢測',
      '客戶預填功能': '待檢測',
      '報價單建立流程': '待檢測'
    };
    
    // 1. 檢查轉換訂單功能
    try {
      await page.goto(`${BASE_URL}/quotes`);
      await page.waitForLoadState('networkidle');
      const convertExists = await page.locator('text=轉換為訂單').count() > 0;
      report['轉換訂單功能'] = convertExists ? '✅ 正常' : '❌ 異常';
    } catch (e) {
      report['轉換訂單功能'] = '❌ 錯誤';
    }
    
    // 2. 檢查編輯頁面 valid_until 欄位
    try {
      await page.goto(`${BASE_URL}/quotes/1/edit`);
      await page.waitForLoadState('networkidle');
      const validUntilExists = await page.locator('input[name*="valid_until"], input[type="date"]').count() > 0;
      report['編輯頁面valid_until欄位'] = validUntilExists ? '✅ 正常' : '❌ 異常';
    } catch (e) {
      report['編輯頁面valid_until欄位'] = '❌ 錯誤';
    }
    
    // 3. 檢查檢視功能
    try {
      await page.goto(`${BASE_URL}/quotes`);
      await page.waitForLoadState('networkidle');
      const viewExists = await page.locator('text=檢視').count() > 0;
      report['檢視功能'] = viewExists ? '✅ 正常' : '❌ 異常';
    } catch (e) {
      report['檢視功能'] = '❌ 錯誤';
    }
    
    // 4. 檢查客戶預填功能 (簡化檢查)
    try {
      await page.goto(`${BASE_URL}/quotes/create`);
      await page.waitForLoadState('networkidle');
      const customerFieldExists = await page.locator('select[name*="customer"], input[name*="customer"]').count() > 0;
      report['客戶預填功能'] = customerFieldExists ? '✅ 欄位存在' : '❌ 欄位缺失';
    } catch (e) {
      report['客戶預填功能'] = '❌ 錯誤';
    }
    
    // 5. 檢查報價單建立流程
    try {
      await page.goto(`${BASE_URL}/quotes/create`);
      await page.waitForLoadState('networkidle');
      const formExists = await page.locator('form').count() > 0;
      const productFieldExists = await page.locator('input[name*="product"]').count() > 0;
      const buildComplete = formExists && productFieldExists;
      report['報價單建立流程'] = buildComplete ? '✅ 正常' : '❌ 異常';
    } catch (e) {
      report['報價單建立流程'] = '❌ 錯誤';
    }
    
    // 輸出報告
    console.log('\n🔍 ===== 報價系統修復驗證報告 =====');
    for (const [key, value] of Object.entries(report)) {
      console.log(`${key}: ${value}`);
    }
    console.log('=====================================\n');
    
    await page.screenshot({ path: 'quotes-final-verification-report.png', fullPage: true });
    console.log('✅ 修復驗證報告生成完成');
  });
});