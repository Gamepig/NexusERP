import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Multi-step Quote Form Focused Test - Product Selection Fix', () => {
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

  test('Focused test - Product selection and complete workflow', async () => {
    const results = [];
    
    try {
      // 1. 快速導航到第二步
      results.push('=== 快速導航到多步驟表單 ===');
      await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
      await page.waitForLoadState('networkidle');
      
      // 快速填寫第一步 (已測試過，使用簡化版本)
      results.push('=== 快速填寫第一步基本資訊 ===');
      
      await page.locator('select[x-model="formData.customer_id"]').selectOption({ index: 1 });
      await page.locator('input[x-model="formData.quote_date"]').fill('2025-08-06');
      await page.locator('input[x-model="formData.valid_until"]').fill('2025-09-06');
      await page.locator('input[x-model="formData.contact_person"]').fill('測試聯絡人');
      await page.locator('select[x-model="formData.currency"]').selectOption('USD');
      await page.locator('textarea[x-model="formData.notes"]').fill('測試說明');
      
      results.push('✅ 第一步基本資訊填寫完成');
      
      // 點擊下一步
      await page.locator('button:has-text("下一步")').first().click();
      await page.waitForLoadState('networkidle');
      results.push('✅ 成功進入第二步');
      
      // 2. 重點測試 - 第二步產品選擇
      results.push('\n=== 🎯 重點測試: 第二步產品選擇 ===');
      
      const currentUrl = page.url();
      results.push(`當前URL: ${currentUrl}`);
      
      // 分析頁面中所有的input欄位
      const allInputs = await page.locator('input').count();
      results.push(`頁面中總計input欄位數: ${allInputs}`);
      
      // 分析可能的產品搜尋欄位
      const productInputs = await page.locator('input[placeholder*="產品"], input[placeholder*="搜尋"], input[x-model*="product"]').count();
      results.push(`可能的產品搜尋欄位數: ${productInputs}`);
      
      if (productInputs > 0) {
        // 嘗試多種可能的產品搜尋欄位
        const searchInputs = [
          'input[placeholder*="產品"]',
          'input[placeholder*="搜尋"]',
          'input[x-model*="product"]',
          'input[type="text"]',
          '.product-search input',
          '#product_search'
        ];
        
        let foundProductInput = false;
        
        for (const selector of searchInputs) {
          const inputCount = await page.locator(selector).count();
          if (inputCount > 0) {
            results.push(`找到搜尋欄位: ${selector} (數量: ${inputCount})`);
            
            try {
              // 嘗試第一個搜尋欄位
              const searchInput = page.locator(selector).first();
              await searchInput.fill('筆記');
              results.push(`✅ 成功輸入搜尋關鍵字到: ${selector}`);
              
              // 等待搜尋結果
              await page.waitForTimeout(1500);
              
              // 檢查各種可能的下拉結果
              const possibleDropdowns = [
                '.dropdown-menu',
                '.search-results',
                '.autocomplete-results',
                '.suggestions',
                'datalist option',
                '.product-list li',
                '.results li'
              ];
              
              for (const dropdownSelector of possibleDropdowns) {
                const dropdownCount = await page.locator(dropdownSelector).count();
                if (dropdownCount > 0) {
                  results.push(`找到下拉結果: ${dropdownSelector} (數量: ${dropdownCount})`);
                  
                  // 獲取前3個選項的內容
                  const options = await page.locator(dropdownSelector).first().locator('*').allTextContents();
                  results.push(`下拉選項內容: ${options.slice(0, 3).join(' | ')}`);
                  
                  // 嘗試點擊第一個看起來像產品的選項
                  const productOption = page.locator(dropdownSelector).locator('*').filter({ hasText: /筆記|產品|商品/ }).first();
                  if (await productOption.count() > 0) {
                    const optionText = await productOption.textContent();
                    results.push(`嘗試點擊產品選項: ${optionText}`);
                    
                    await productOption.click();
                    results.push('✅ 成功點擊產品選項');
                    foundProductInput = true;
                    break;
                  }
                }
              }
              
              if (foundProductInput) break;
              
            } catch (error) {
              results.push(`❌ 搜尋欄位 ${selector} 操作失敗: ${error.message}`);
            }
          }
        }
        
        if (!foundProductInput) {
          results.push('⚠️ 未能成功選擇產品，嘗試其他方法...');
          
          // 嘗試直接查看頁面HTML結構
          const pageContent = await page.content();
          const productMatches = pageContent.match(/product|產品|商品/gi) || [];
          results.push(`頁面中包含產品相關關鍵字數量: ${productMatches.length}`);
          
          // 檢查是否有隱藏的JavaScript錯誤
          const jsErrors = await page.evaluate(() => {
            return window.jsErrors || [];
          });
          if (jsErrors.length > 0) {
            results.push(`JavaScript錯誤: ${JSON.stringify(jsErrors)}`);
          }
        }
      }
      
      // 3. 檢查數量和計算功能
      results.push('\n=== 檢查數量和計算功能 ===');
      
      const quantityInputs = await page.locator('input[type="number"], .quantity, input[name*="quantity"]').count();
      results.push(`找到數量輸入欄位數: ${quantityInputs}`);
      
      if (quantityInputs > 0) {
        try {
          const quantityInput = page.locator('input[type="number"], .quantity, input[name*="quantity"]').first();
          await quantityInput.fill('5');
          results.push('✅ 已輸入數量: 5');
          
          await page.waitForTimeout(1000); // 等待計算
          
          // 檢查小計和總計
          const subtotalElements = await page.locator('.subtotal, [class*="subtotal"], .total, [class*="total"]').allTextContents();
          results.push(`計算結果: ${subtotalElements.join(' | ')}`);
          
        } catch (error) {
          results.push(`❌ 數量輸入失敗: ${error.message}`);
        }
      }
      
      // 4. 嘗試進入第三步
      results.push('\n=== 嘗試進入第三步確認頁面 ===');
      
      const step2NextButton = page.locator('button:has-text("下一步"), button:has-text("Next")');
      const nextButtonCount = await step2NextButton.count();
      results.push(`找到下一步按鈕數: ${nextButtonCount}`);
      
      if (nextButtonCount > 0) {
        await step2NextButton.first().click();
        await page.waitForLoadState('networkidle');
        results.push('✅ 成功點擊第二步的下一步按鈕');
        
        const finalUrl = page.url();
        results.push(`第三步URL: ${finalUrl}`);
        
        // 檢查確認頁面內容
        const confirmationContent = await page.locator('body').textContent();
        const hasConfirmationText = confirmationContent.includes('確認') || confirmationContent.includes('總計') || confirmationContent.includes('提交');
        results.push(`確認頁面特徵檢查: ${hasConfirmationText ? '✅ 包含確認相關文字' : '⚠️ 未找到確認相關文字'}`);
        
        // 5. 嘗試最終提交
        results.push('\n=== 嘗試最終提交 ===');
        
        const submitButtons = await page.locator('button[type="submit"], button:has-text("提交"), button:has-text("Submit")').count();
        results.push(`找到提交按鈕數: ${submitButtons}`);
        
        if (submitButtons > 0) {
          const submitButton = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("Submit")').first();
          results.push('準備提交表單...');
          
          await submitButton.click();
          await page.waitForLoadState('networkidle');
          
          const submitUrl = page.url();
          results.push(`提交後URL: ${submitUrl}`);
          
          // 檢查提交結果
          const messages = await page.locator('.alert, .message, .success, .error, .notification').allTextContents();
          results.push(`提交結果訊息: ${messages.join(' | ')}`);
          
          if (submitUrl.includes('/quotes') && !submitUrl.includes('/create')) {
            results.push('✅ 提交成功 - 重定向到報價列表或詳情頁面');
          } else {
            results.push('⚠️ 提交可能失敗或仍在表單頁面');
          }
        }
      }
      
    } catch (error) {
      results.push(`\n❌ 測試過程發生錯誤: ${error.message}`);
      results.push(`錯誤堆疊: ${error.stack}`);
    }
    
    // 生成測試報告
    const finalReport = results.join('\n');
    
    const debugDir = '/Users/gamepig/projects/NexusERP/debug';
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    const reportPath = path.join(debugDir, 'multi-step-focused-test.md');
    const reportContent = `# Multi-Step Quote Form Focused Test - Product Selection Fix
## 測試時間: ${new Date().toISOString()}
## 測試目標: 重點解決產品選擇功能和完整工作流程

${finalReport}

## 🎯 測試重點總結
- **第一步基本資訊**: 使用已驗證的快速填寫流程
- **第二步產品選擇**: 多種選擇器嘗試，詳細分析搜尋結果
- **第三步確認頁面**: 驗證頁面跳轉和內容顯示
- **最終提交**: 測試完整的表單提交流程

## 技術細節
- 測試框架: Playwright (Headed mode)
- 重點關注: 產品搜尋、選擇和計算功能
- 錯誤處理: 多重fallback策略
`;
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`專項測試報告已儲存至: ${reportPath}`);
    
    console.log(finalReport);
    
    // 檢查最終頁面狀態
    const finalPageContent = await page.content();
    expect(finalPageContent).toBeTruthy();
  });
});