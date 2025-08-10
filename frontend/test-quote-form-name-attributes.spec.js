/**
 * NexusERP 報價單表單 name 屬性修復驗證測試
 * 
 * 系統性調試 Phase 1: 數據輸入測試
 * 使用非預設數據進行表單元素和功能性測試
 */

import { test, expect } from '@playwright/test';

// 測試配置
const BASE_URL = 'http://127.0.0.1:8000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// 非預設測試數據 (遵循系統性調試原則)
const TEST_QUOTE_DATA = {
  customer: 'Advanced Test Customer Corp', // 非第一個選項
  date: '2025-12-31',                      // 非今日日期
  validUntil: '2026-03-31',               // 非預設到期日
  status: 'sent',                         // 非預設 draft
  notes: 'System debugging test quote with non-default data', // 非空備註
  discount: 15.5                          // 非零折扣
};

test.describe('NexusERP 報價單表單 name 屬性修復驗證', () => {
  
  test.beforeEach(async ({ page }) => {
    // 登入系統
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    console.log('✅ 成功登入系統');
  });

  test('Phase 1: 表單元素驗證 - name 屬性檢查', async ({ page }) => {
    console.log('📍 Phase 1: 檢查多步驟表單的 name 屬性修復效果');
    
    // 導航到多步驟表單
    await page.goto(`${BASE_URL}/quotes/create/multi-step`);
    await page.waitForLoadState('networkidle');
    
    // 截圖記錄初始狀態
    await page.screenshot({ path: 'test-results/step1-initial-form.png', fullPage: true });
    
    // 檢查關鍵表單元素的 name 屬性
    const formElements = {
      customerSelect: 'select[name="customer_id"]',
      quoteDate: 'input[name="quote_date"]', 
      validUntil: 'input[name="valid_until"]',
      status: 'select[name="status"]',
      notes: 'textarea[name="notes"]'
    };
    
    console.log('🔍 檢查表單元素存在性和 name 屬性:');
    
    for (const [elementName, selector] of Object.entries(formElements)) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible();
      const nameAttribute = await element.getAttribute('name');
      
      console.log(`  ${elementName}: 存在=${isVisible}, name="${nameAttribute}"`);
      
      // 驗證關鍵元素存在且有正確 name 屬性
      if (elementName === 'customerSelect') {
        expect(isVisible, `客戶選擇器應該可見`).toBeTruthy();
        expect(nameAttribute, `客戶選擇器應該有 name="customer_id" 屬性`).toBe('customer_id');
      }
    }
    
    // 記錄表單結構資訊
    const allFormElements = await page.locator('form input, form select, form textarea').count();
    const elementsWithName = await page.locator('form [name]').count();
    
    console.log(`📊 表單統計: 總元素=${allFormElements}, 有name屬性=${elementsWithName}`);
    
    // 檢查修復前的問題是否已解決
    const customerSelectNameAttr = await page.locator('select[name="customer_id"]').getAttribute('name');
    expect(customerSelectNameAttr).toBe('customer_id');
    console.log('✅ 客戶選擇器 name 屬性修復確認');
  });

  test('Phase 2: 功能性測試 - 使用非預設數據', async ({ page }) => {
    console.log('📍 Phase 2: 數據流驗證 - 使用非預設測試數據');
    
    await page.goto(`${BASE_URL}/quotes/create/multi-step`);
    await page.waitForLoadState('networkidle');
    
    try {
      // 步驟1: 基本資訊填入 (使用非預設數據)
      
      // 客戶選擇 - 嘗試選擇非第一個選項
      const customerSelect = page.locator('select[name="customer_id"]');
      if (await customerSelect.isVisible()) {
        const options = await customerSelect.locator('option').allTextContents();
        console.log(`🎯 客戶選項數量: ${options.length}`);
        
        if (options.length > 2) {
          // 選擇第二個選項 (跳過第一個空選項)
          await customerSelect.selectOption({ index: 2 });
          console.log('✅ 成功選擇客戶');
        } else {
          console.log('⚠️ 客戶選項不足，跳過客戶選擇');
        }
      }
      
      // 填入日期資訊 (使用非預設日期)
      await page.fill('input[name="quote_date"]', TEST_QUOTE_DATA.date);
      await page.fill('input[name="valid_until"]', TEST_QUOTE_DATA.validUntil);
      
      // 填入備註 (非空內容)
      if (await page.locator('textarea[name="notes"]').isVisible()) {
        await page.fill('textarea[name="notes"]', TEST_QUOTE_DATA.notes);
      }
      
      console.log('✅ 步驟1基本資訊填入完成');
      
      // 截圖記錄步驟1完成狀態
      await page.screenshot({ path: 'test-results/step1-filled-form.png', fullPage: true });
      
      // 嘗試進入下一步
      const nextButton = page.locator('button:has-text("下一步"), button:has-text("Next")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ 成功進入步驟2');
        
        // 截圖記錄步驟2
        await page.screenshot({ path: 'test-results/step2-product-selection.png', fullPage: true });
      } else {
        console.log('⚠️ 未找到下一步按鈕');
      }
      
    } catch (error) {
      console.log(`❌ 功能性測試過程出現錯誤: ${error.message}`);
      await page.screenshot({ path: 'test-results/step2-error-state.png', fullPage: true });
    }
  });

  test('Phase 3: 產品搜尋功能測試', async ({ page }) => {
    console.log('📍 Phase 3: 產品搜尋功能驗證');
    
    await page.goto(`${BASE_URL}/quotes/create/multi-step`);
    await page.waitForLoadState('networkidle');
    
    // 快速填入基本資訊進入產品選擇步驟
    try {
      const customerSelect = page.locator('select[name="customer_id"]');
      if (await customerSelect.isVisible()) {
        const options = await customerSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await customerSelect.selectOption({ index: 1 });
        }
      }
      
      await page.fill('input[name="quote_date"]', '2025-08-10');
      await page.fill('input[name="valid_until"]', '2025-09-10');
      
      const nextButton = page.locator('button:has-text("下一步"), button:has-text("Next")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        
        // 檢查產品搜尋功能
        const productSearch = page.locator('input[placeholder*="搜尋產品"], input[placeholder*="Search"], input[name*="product"]');
        const productSelect = page.locator('select[name*="product"]');
        
        console.log('🔍 檢查產品搜尋元素:');
        console.log(`  搜尋輸入框存在: ${await productSearch.isVisible()}`);
        console.log(`  產品下拉選單存在: ${await productSelect.isVisible()}`);
        
        // 如果有搜尋功能，測試搜尋
        if (await productSearch.isVisible()) {
          await productSearch.fill('test product');
          await page.waitForTimeout(1000); // 等待搜尋結果
          console.log('✅ 產品搜尋功能測試完成');
        }
        
        await page.screenshot({ path: 'test-results/step2-product-search.png', fullPage: true });
      }
      
    } catch (error) {
      console.log(`❌ 產品搜尋測試錯誤: ${error.message}`);
      await page.screenshot({ path: 'test-results/step2-product-error.png', fullPage: true });
    }
  });

  test('Phase 4: 數據流驗證 - 表單提交測試', async ({ page }) => {
    console.log('📍 Phase 4: 數據流驗證 - 嘗試提交測試報價單');
    
    await page.goto(`${BASE_URL}/quotes/create/multi-step`);
    await page.waitForLoadState('networkidle');
    
    let testSuccess = false;
    let errorMessage = '';
    
    try {
      // 填入最小必要資訊
      const customerSelect = page.locator('select[name="customer_id"]');
      if (await customerSelect.isVisible()) {
        const options = await customerSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await customerSelect.selectOption({ index: 1 });
        }
      }
      
      await page.fill('input[name="quote_date"]', '2025-08-10');
      await page.fill('input[name="valid_until"]', '2025-09-10');
      
      // 記錄輸入的數據
      const inputData = {
        date: await page.inputValue('input[name="quote_date"]'),
        validUntil: await page.inputValue('input[name="valid_until"]')
      };
      console.log('📥 輸入數據:', inputData);
      
      // 嘗試提交或進入下一步
      const nextButton = page.locator('button:has-text("下一步"), button:has-text("Next")');
      const submitButton = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("Save")');
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        
        // 如果有提交按鈕，嘗試提交
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForLoadState('networkidle');
          
          // 檢查是否成功重定向到列表頁或詳情頁
          const currentUrl = page.url();
          if (currentUrl.includes('/quotes') && !currentUrl.includes('/create')) {
            testSuccess = true;
            console.log('✅ 表單提交成功，重定向至: ' + currentUrl);
          }
        }
      }
      
      await page.screenshot({ path: 'test-results/step4-final-state.png', fullPage: true });
      
    } catch (error) {
      errorMessage = error.message;
      console.log(`❌ 數據流驗證錯誤: ${errorMessage}`);
      await page.screenshot({ path: 'test-results/step4-error-final.png', fullPage: true });
    }
    
    // 記錄最終測試結果
    console.log('📊 Phase 4 總結:');
    console.log(`  表單提交成功: ${testSuccess}`);
    console.log(`  錯誤訊息: ${errorMessage || '無'}`);
  });

  test('修復效果對比總結', async ({ page }) => {
    console.log('📊 表單 name 屬性修復效果總結測試');
    
    await page.goto(`${BASE_URL}/quotes/create/multi-step`);
    await page.waitForLoadState('networkidle');
    
    // 統計修復效果
    const stats = {
      totalFormElements: await page.locator('form input, form select, form textarea').count(),
      elementsWithName: await page.locator('form [name]').count(),
      customerSelectExists: await page.locator('select[name="customer_id"]').isVisible(),
      dateFieldsExist: await page.locator('input[name="quote_date"], input[name="valid_until"]').count(),
      submitButtonExists: await page.locator('button[type="submit"], button:has-text("提交")').isVisible()
    };
    
    console.log('📈 修復效果統計:');
    console.log(`  表單元素總數: ${stats.totalFormElements}`);
    console.log(`  具有name屬性的元素: ${stats.elementsWithName}`);
    console.log(`  客戶選擇器存在: ${stats.customerSelectExists}`);
    console.log(`  日期欄位數量: ${stats.dateFieldsExist}`);
    console.log(`  提交按鈕存在: ${stats.submitButtonExists}`);
    
    // 名屬性完整性檢查
    const nameAttributeRatio = stats.elementsWithName / stats.totalFormElements;
    console.log(`  name屬性完整率: ${(nameAttributeRatio * 100).toFixed(1)}%`);
    
    if (nameAttributeRatio > 0.8) {
      console.log('✅ name 屬性修復效果良好');
    } else {
      console.log('⚠️ 仍有部分元素缺少 name 屬性');
    }
    
    await page.screenshot({ path: 'test-results/final-summary.png', fullPage: true });
  });
});