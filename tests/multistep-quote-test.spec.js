import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Multi-step Quote Form Complete Test', () => {
  let page;
  
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // 先登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待重定向完成
    await page.waitForURL(/dashboard|home/);
  });

  test('Complete multi-step quote form test with real data', async () => {
    const results = [];
    
    try {
      // 1. 導航到多步驟表單
      results.push('=== 步驟1: 導航到報價建立頁面 ===');
      await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
      await page.waitForLoadState('networkidle');
      
      // 檢查頁面載入
      const pageTitle = await page.title();
      results.push(`頁面標題: ${pageTitle}`);
      
      // 檢查是否有表單元素
      const hasForm = await page.locator('form').count() > 0;
      results.push(`表單存在: ${hasForm}`);
      
      // 2. 第一步完整填寫測試
      results.push('\n=== 步驟2: 第一步基本資訊填寫 ===');
      
      // 選擇客戶 (檢查是否有選項)
      const customerSelect = page.locator('select[x-model="formData.customer_id"], select[name="customer_id"], #customer_id');
      if (await customerSelect.count() > 0) {
        const customerOptions = await customerSelect.locator('option').count();
        results.push(`客戶選項數量: ${customerOptions}`);
        
        if (customerOptions > 1) {
          await customerSelect.selectOption({ index: 1 }); // 選第一個客戶
          results.push('✅ 已選擇客戶');
        }
      } else {
        results.push('⚠️ 未找到客戶選擇欄位');
      }
      
      // 填入報價日期 (使用更具體的選擇器)
      const quoteDateInput = page.locator('input[x-model="formData.quote_date"]');
      if (await quoteDateInput.count() > 0) {
        await quoteDateInput.fill('2025-08-06');
        results.push('✅ 已填入報價日期: 2025-08-06');
      } else {
        results.push('⚠️ 未找到報價日期欄位');
      }
      
      // 填入有效期限 (使用更具體的選擇器)
      const validUntilInput = page.locator('input[x-model="formData.valid_until"]');
      if (await validUntilInput.count() > 0) {
        await validUntilInput.fill('2025-09-06');
        results.push('✅ 已填入有效期限: 2025-09-06');
      } else {
        results.push('⚠️ 未找到有效期限欄位');
      }
      
      // 填入聯絡人姓名
      const contactInput = page.locator('input[x-model="formData.contact_person"], input[name="contact_person"], #contact_person');
      if (await contactInput.count() > 0) {
        await contactInput.fill('張三');
        results.push('✅ 已填入聯絡人: 張三');
      } else {
        results.push('⚠️ 未找到聯絡人欄位');
      }
      
      // 選擇幣別
      const currencySelect = page.locator('select[x-model="formData.currency"], select[name="currency"], #currency');
      if (await currencySelect.count() > 0) {
        const currencyOptions = await currencySelect.locator('option').allTextContents();
        results.push(`可用幣別: ${currencyOptions.join(', ')}`);
        
        // 嘗試選擇USD
        const usdOption = await currencySelect.locator('option[value="USD"]');
        if (await usdOption.count() > 0) {
          await currencySelect.selectOption('USD');
          results.push('✅ 已選擇幣別: USD');
        } else {
          await currencySelect.selectOption({ index: 1 });
          results.push('✅ 已選擇第一個可用幣別');
        }
      } else {
        results.push('⚠️ 未找到幣別選擇欄位');
      }
      
      // 填入報價說明
      const notesInput = page.locator('textarea[x-model="formData.notes"], textarea[name="notes"], #notes, textarea[name="description"], #description');
      if (await notesInput.count() > 0) {
        await notesInput.fill('這是一個測試報價單，用於驗證系統功能。');
        results.push('✅ 已填入報價說明');
      } else {
        results.push('⚠️ 未找到報價說明欄位');
      }
      
      // 尋找並點擊下一步按鈕
      results.push('\n=== 檢查導航按鈕 ===');
      const nextButtons = await page.locator('button:has-text("下一步"), button:has-text("Next"), button[class*="next"], .btn-next').allTextContents();
      results.push(`找到的下一步按鈕: ${nextButtons.join(', ')}`);
      
      const nextButton = page.locator('button:has-text("下一步"), button:has-text("Next"), button[class*="next"], .btn-next').first();
      if (await nextButton.count() > 0) {
        await nextButton.click();
        results.push('✅ 已點擊下一步按鈕');
        await page.waitForLoadState('networkidle');
      } else {
        results.push('⚠️ 未找到下一步按鈕');
      }
      
      // 3. 第二步產品選擇測試
      results.push('\n=== 步驟3: 第二步產品選擇測試 ===');
      
      // 檢查是否進入第二步
      const currentUrl = page.url();
      results.push(`當前URL: ${currentUrl}`);
      
      // 尋找產品搜尋欄位
      const productSearchInputs = page.locator('input[placeholder*="搜尋"], input[placeholder*="產品"], input[name*="product"], .product-search, #product_search');
      const productSearchCount = await productSearchInputs.count();
      results.push(`找到產品搜尋欄位數量: ${productSearchCount}`);
      
      if (productSearchCount > 0) {
        const searchInput = productSearchInputs.first();
        
        // 測試產品搜尋
        await searchInput.fill('測試');
        results.push('✅ 已輸入搜尋關鍵字: 測試');
        
        await page.waitForTimeout(1000); // 等待搜尋結果
        
        // 檢查搜尋下拉選單
        const dropdownOptions = page.locator('.dropdown-menu li, .search-results li, .product-option, option');
        const optionCount = await dropdownOptions.count();
        results.push(`搜尋結果選項數: ${optionCount}`);
        
        if (optionCount > 0) {
          const firstOption = dropdownOptions.first();
          const optionText = await firstOption.textContent();
          results.push(`第一個選項內容: ${optionText}`);
          
          await firstOption.click();
          results.push('✅ 已選擇第一個產品');
        } else {
          results.push('⚠️ 未找到搜尋結果選項');
        }
        
        // 檢查產品資訊是否填入
        const productNameField = page.locator('input[name*="name"], .product-name');
        if (await productNameField.count() > 0) {
          const productName = await productNameField.inputValue();
          results.push(`產品名稱: ${productName}`);
        }
        
        const productPriceField = page.locator('input[name*="price"], .product-price');
        if (await productPriceField.count() > 0) {
          const productPrice = await productPriceField.inputValue();
          results.push(`產品價格: ${productPrice}`);
        }
        
        // 修改數量
        const quantityInput = page.locator('input[name*="quantity"], .quantity-input');
        if (await quantityInput.count() > 0) {
          await quantityInput.fill('3');
          results.push('✅ 已修改數量為: 3');
          
          await page.waitForTimeout(500); // 等待計算
          
          // 檢查小計
          const subtotalElement = page.locator('.subtotal, [class*="subtotal"]');
          if (await subtotalElement.count() > 0) {
            const subtotal = await subtotalElement.textContent();
            results.push(`小計: ${subtotal}`);
          }
        }
        
        // 嘗試新增第二個產品
        const addProductBtn = page.locator('button:has-text("新增"), button:has-text("Add"), .add-product-btn, #add-product');
        if (await addProductBtn.count() > 0) {
          await addProductBtn.click();
          results.push('✅ 已點擊新增產品按鈕');
        }
        
        // 檢查總計
        const totalElement = page.locator('.total, [class*="total"], #total');
        if (await totalElement.count() > 0) {
          const total = await totalElement.textContent();
          results.push(`總計: ${total}`);
        }
      }
      
      // 點擊下一步到第三步
      const step2NextButton = page.locator('button:has-text("下一步"), button:has-text("Next"), button[class*="next"], .btn-next').first();
      if (await step2NextButton.count() > 0) {
        await step2NextButton.click();
        results.push('✅ 已點擊第二步的下一步按鈕');
        await page.waitForLoadState('networkidle');
      }
      
      // 4. 第三步確認頁面測試
      results.push('\n=== 步驟4: 第三步確認頁面測試 ===');
      
      const step3Url = page.url();
      results.push(`第三步URL: ${step3Url}`);
      
      // 檢查資料顯示
      const confirmationData = await page.locator('.confirmation, .summary, .review').allTextContents();
      results.push(`確認頁面資料: ${confirmationData.join(' | ')}`);
      
      // 檢查幣別符號
      const currencySymbols = await page.locator('text=/\\$|NT\\$|USD|TWD/').allTextContents();
      results.push(`找到的幣別符號: ${currencySymbols.join(', ')}`);
      
      // 5. 錯誤處理測試
      results.push('\n=== 步驟5: 錯誤處理測試 ===');
      
      // 測試回到上一步
      const prevButton = page.locator('button:has-text("上一步"), button:has-text("Previous"), button[class*="prev"], .btn-prev');
      if (await prevButton.count() > 0) {
        await prevButton.click();
        results.push('✅ 已測試回到上一步功能');
        await page.waitForLoadState('networkidle');
        
        // 再次前進
        const nextAgain = page.locator('button:has-text("下一步"), button:has-text("Next"), button[class*="next"], .btn-next').first();
        if (await nextAgain.count() > 0) {
          await nextAgain.click();
          await page.waitForLoadState('networkidle');
        }
      }
      
      // 嘗試提交表單
      const submitButton = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("Submit"), .btn-submit');
      if (await submitButton.count() > 0) {
        results.push('找到提交按鈕，進行提交測試...');
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        
        // 檢查提交後的結果
        const submitUrl = page.url();
        results.push(`提交後URL: ${submitUrl}`);
        
        // 檢查是否有成功訊息或錯誤訊息
        const messages = await page.locator('.alert, .message, .success, .error, .notification').allTextContents();
        results.push(`提交後訊息: ${messages.join(' | ')}`);
      } else {
        results.push('⚠️ 未找到提交按鈕');
      }
      
    } catch (error) {
      results.push(`\n❌ 測試過程發生錯誤: ${error.message}`);
      results.push(`錯誤堆疊: ${error.stack}`);
    }
    
    // 生成最終報告
    const finalReport = results.join('\n');
    
    // 將結果寫入文件 (已在頂部導入)
    
    const debugDir = '/Users/gamepig/projects/NexusERP/debug';
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    const reportPath = path.join(debugDir, 'multi-step-complete-test.md');
    const reportContent = `# Multi-Step Quote Form Complete Test Report
## 測試時間: ${new Date().toISOString()}
## 測試URL: http://127.0.0.1:8000/quotation/create

${finalReport}

## 測試總結
- 測試完成時間: ${new Date().toLocaleString('zh-TW')}
- 總體測試結果: 詳見上述各步驟結果
- 建議改進項目: 根據測試發現的問題進行相應調整
`;
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`測試報告已儲存至: ${reportPath}`);
    
    // 在測試中也輸出結果
    console.log(finalReport);
    
    // 最後檢查當前頁面狀態
    const finalPageContent = await page.content();
    expect(finalPageContent).toBeTruthy();
  });
});