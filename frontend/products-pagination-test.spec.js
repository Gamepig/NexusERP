import { test, expect } from '@playwright/test';

test('NexusERP 商品管理頁面分頁統計測試', async ({ page }) => {
  try {
    console.log('開始測試商品管理頁面...');
    
    // 前往商品管理頁面
    await page.goto('http://127.0.0.1:8000/products', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('頁面已載入，開始檢查內容...');
    
    // 等待頁面載入完成
    await page.waitForTimeout(3000);
    
    // 截圖保存當前頁面狀態
    await page.screenshot({ 
      path: 'products-page-test.png', 
      fullPage: true 
    });
    console.log('已保存頁面截圖：products-page-test.png');
    
    // 檢查頁面標題
    const title = await page.title();
    console.log('頁面標題:', title);
    
    // 檢查是否有商品表格
    const tableExists = await page.locator('table').isVisible();
    console.log('商品表格是否可見:', tableExists);
    
    // 檢查分頁統計資訊元素
    const paginationInfo = page.locator('.pagination-info, [class*="pagination-info"], .pager-info, [class*="pager-info"]');
    const paginationExists = await paginationInfo.count() > 0;
    console.log('分頁統計元素數量:', await paginationInfo.count());
    
    if (paginationExists) {
      const paginationText = await paginationInfo.first().textContent();
      console.log('分頁統計文字內容:', paginationText);
      
      // 檢查是否出現「顯示第1到0項，共0項結果」的錯誤
      if (paginationText && paginationText.includes('顯示第1到0項，共0項結果')) {
        console.log('❌ 發現分頁統計錯誤：顯示第1到0項，共0項結果');
      } else if (paginationText && paginationText.includes('顯示第')) {
        console.log('✅ 分頁統計資訊看起來正常:', paginationText);
      }
    }
    
    // 檢查所有可能包含分頁資訊的元素
    const allPaginationElements = await page.locator('*').filter({ hasText: /顯示第|共.*項結果|第.*頁/ }).all();
    console.log('找到的分頁相關元素數量:', allPaginationElements.length);
    
    for (let i = 0; i < allPaginationElements.length; i++) {
      const text = await allPaginationElements[i].textContent();
      console.log(`分頁元素 ${i + 1}:`, text);
    }
    
    // 檢查是否有商品資料
    const productRows = page.locator('tbody tr, .product-item, [class*="product"]');
    const productCount = await productRows.count();
    console.log('商品資料行數:', productCount);
    
    // 檢查頁面中是否有錯誤訊息
    const errorMessages = await page.locator('.alert-danger, .error, [class*="error"]').all();
    if (errorMessages.length > 0) {
      console.log('發現錯誤訊息:');
      for (let error of errorMessages) {
        const errorText = await error.textContent();
        console.log('- 錯誤:', errorText);
      }
    }
    
    // 獲取頁面的 HTML 內容以供分析
    const htmlContent = await page.content();
    console.log('頁面 HTML 長度:', htmlContent.length);
    
    // 檢查是否有 JavaScript 錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('JavaScript 錯誤:', msg.text());
      }
    });
    
    console.log('測試完成！');
    
  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
    await page.screenshot({ path: 'products-test-error.png' });
    throw error;
  }
});