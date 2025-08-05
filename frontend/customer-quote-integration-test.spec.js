import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'test@example.com', 
  password: 'password123'
};

const BASE_URL = 'http://127.0.0.1:8000';

test.describe('客戶-報價整合功能深度測試', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // 登入
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('🔍 客戶詳情頁面分析', async () => {
    console.log('🔍 分析客戶詳情頁面結構...');
    
    // 到客戶管理頁面
    await page.goto(`${BASE_URL}/customers`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'customer-integration-01-list.png', fullPage: true });
    
    // 檢查客戶列表
    const customerRows = await page.locator('table tbody tr').count();
    console.log(`👥 客戶列表中有 ${customerRows} 個客戶`);
    
    if (customerRows > 0) {
      // 點擊第一個客戶的詳情
      const firstCustomerLink = await page.locator('table tbody tr td a').first();
      if (await firstCustomerLink.count() > 0) {
        await firstCustomerLink.click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'customer-integration-02-detail.png', fullPage: true });
        
        // 分析客戶詳情頁面內容
        const pageContent = await page.locator('body').textContent();
        console.log('📋 客戶詳情頁面內容關鍵字分析:');
        
        const keywords = ['報價', 'Quote', '建立', 'Create', '新增', 'Add'];
        keywords.forEach(keyword => {
          const hasKeyword = pageContent.includes(keyword);
          console.log(`   - ${keyword}: ${hasKeyword ? '✓ 找到' : '✗ 未找到'}`);
        });
        
        // 檢查所有按鈕和連結
        const allButtons = await page.locator('a, button').count();
        console.log(`🔘 頁面總按鈕/連結數量: ${allButtons}`);
        
        for (let i = 0; i < Math.min(allButtons, 10); i++) {
          const element = page.locator('a, button').nth(i);
          const text = await element.textContent();
          const href = await element.getAttribute('href');
          console.log(`   按鈕/連結 ${i + 1}: "${text?.trim()}" ${href ? `(${href})` : ''}`);
        }
        
        // 檢查是否有相關的操作區域
        const actionAreas = await page.locator('.actions, .operations, .customer-actions, .btn-group').count();
        console.log(`⚙️ 操作區域數量: ${actionAreas}`);
        
      } else {
        console.log('⚠️ 未找到客戶詳情連結');
      }
    } else {
      console.log('⚠️ 客戶列表為空');
    }
  });

  test('🔗 測試客戶ID參數傳遞', async () => {
    console.log('🔗 測試從客戶頁面帶參數建立報價...');
    
    // 嘗試直接用客戶ID參數建立報價
    await page.goto(`${BASE_URL}/quotes/create?customer_id=1`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'customer-integration-03-with-params.png', fullPage: true });
    
    // 檢查客戶欄位是否預填
    const customerSelect = await page.locator('select[name*="customer"]').first();
    if (await customerSelect.count() > 0) {
      const selectedValue = await customerSelect.inputValue();
      const selectedText = await customerSelect.locator('option:checked').textContent();
      
      console.log(`📋 客戶欄位檢查:`);
      console.log(`   - 選中值: ${selectedValue || '無'}`);
      console.log(`   - 選中文字: ${selectedText?.trim() || '無'}`);
      
      if (selectedValue && selectedValue !== '') {
        console.log('✅ 客戶ID參數傳遞功能正常');
      } else {
        console.log('⚠️ 客戶ID參數未能自動填入');
      }
    }
    
    // 測試其他可能的參數格式
    const paramFormats = [
      'customer=1',
      'customer_id=1', 
      'customerId=1'
    ];
    
    for (const param of paramFormats) {
      console.log(`🧪 測試參數格式: ${param}`);
      await page.goto(`${BASE_URL}/quotes/create?${param}`);
      await page.waitForTimeout(1000);
      
      const customerField = await page.locator('select[name*="customer"], input[name*="customer"]').first();
      if (await customerField.count() > 0) {
        const value = await customerField.inputValue();
        if (value && value !== '') {
          console.log(`✅ 參數格式 ${param} 有效`);
        }
      }
    }
  });

  test('🔄 測試手動客戶選擇流程', async () => {
    console.log('🔄 測試手動選擇客戶建立報價...');
    
    // 到報價建立頁面
    await page.goto(`${BASE_URL}/quotes/create`);
    await page.waitForLoadState('networkidle');
    
    // 測試客戶下拉選單
    const customerSelect = await page.locator('select[name*="customer"]').first();
    if (await customerSelect.count() > 0) {
      
      // 點擊打開下拉選單
      await customerSelect.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'customer-integration-04-dropdown.png', fullPage: true });
      
      // 檢查選項數量
      const options = await customerSelect.locator('option').count();
      console.log(`👥 客戶選項數量: ${options}`);
      
      // 列出前5個客戶選項
      for (let i = 1; i < Math.min(options, 6); i++) { // 跳過第0個（通常是"請選擇"）
        const option = customerSelect.locator('option').nth(i);
        const value = await option.getAttribute('value');
        const text = await option.textContent();
        console.log(`   客戶 ${i}: ${text?.trim()} (value: ${value})`);
      }
      
      // 選擇第一個真實客戶
      if (options > 1) {
        await customerSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
        
        const selectedValue = await customerSelect.inputValue();
        console.log(`✅ 已選擇客戶: ${selectedValue}`);
        
        await page.screenshot({ path: 'customer-integration-05-selected.png', fullPage: true });
      }
    } else {
      console.log('❌ 未找到客戶選擇下拉選單');
    }
  });

  test('📝 完整的客戶報價建立流程測試', async () => {
    console.log('📝 測試完整的客戶報價建立流程...');
    
    await page.goto(`${BASE_URL}/quotes/create`);
    await page.waitForLoadState('networkidle');
    
    // 1. 選擇客戶
    const customerSelect = await page.locator('select[name*="customer"]').first();
    if (await customerSelect.count() > 0) {
      await customerSelect.selectOption({ index: 1 }); // 選擇第一個客戶
      console.log('✅ 步驟 1: 客戶已選擇');
    }
    
    // 2. 填入聯絡人
    const contactInput = await page.locator('input[name*="contact"], input[placeholder*="聯絡人"]').first();
    if (await contactInput.count() > 0) {
      await contactInput.fill('測試聯絡人');
      console.log('✅ 步驟 2: 聯絡人已填入');
    }
    
    // 3. 設定有效期限 
    const validUntilInput = await page.locator('input[name*="valid_until"], input[type="date"]').first();
    if (await validUntilInput.count() > 0) {
      await validUntilInput.fill('2025-12-31');
      console.log('✅ 步驟 3: 有效期限已設定');
    }
    
    // 4. 添加產品
    const productInput = await page.locator('input[name*="product"], input[placeholder*="產品"]').first();
    if (await productInput.count() > 0) {
      await productInput.click();
      await productInput.fill('產品');
      await page.waitForTimeout(2000);
      
      // 選擇第一個產品
      const firstProduct = await page.locator('.autocomplete-item, .product-option').first();
      if (await firstProduct.count() > 0) {
        await firstProduct.click();
        console.log('✅ 步驟 4: 產品已添加');
      }
    }
    
    await page.screenshot({ path: 'customer-integration-06-complete-form.png', fullPage: true });
    
    // 5. 嘗試提交（但不實際提交）
    const submitButton = await page.locator('button[type="submit"], button:has-text("建立"), button:has-text("保存")').first();
    if (await submitButton.count() > 0) {
      const isEnabled = await submitButton.isEnabled();
      console.log(`✅ 步驟 5: 提交按鈕狀態 - ${isEnabled ? '可用' : '不可用'}`);
      
      if (isEnabled) {
        console.log('🎉 完整流程測試成功 - 表單可以提交');
      }
    }
    
    console.log('✅ 完整客戶報價建立流程測試完成');
  });
});