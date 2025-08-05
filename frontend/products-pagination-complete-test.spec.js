import { test, expect } from '@playwright/test';

test('NexusERP 商品管理頁面完整測試（包含登入）', async ({ page }) => {
  try {
    console.log('開始完整測試流程...');
    
    // 第一步：前往首頁
    await page.goto('http://127.0.0.1:8000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('首頁已載入');
    
    // 第二步：前往登入頁面（如果尚未登入）
    const isLoginPage = await page.locator('input[name="email"]').isVisible();
    if (!isLoginPage) {
      await page.goto('http://127.0.0.1:8000/login', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
    }
    
    console.log('已到達登入頁面');
    
    // 第三步：執行登入
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 點擊登入按鈕
    await page.click('button[type="submit"], .btn-primary, [class*="login"], input[type="submit"]');
    
    // 等待登入完成
    await page.waitForTimeout(3000);
    
    console.log('登入完成，開始前往商品管理頁面');
    
    // 第四步：前往商品管理頁面
    await page.goto('http://127.0.0.1:8000/products', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('商品管理頁面已載入');
    
    // 等待頁面完全載入
    await page.waitForTimeout(5000);
    
    // 截圖保存當前頁面狀態
    await page.screenshot({ 
      path: 'products-complete-test.png', 
      fullPage: true 
    });
    console.log('已保存完整測試截圖：products-complete-test.png');
    
    // 檢查頁面標題
    const title = await page.title();
    console.log('頁面標題:', title);
    
    // 檢查頁面 URL
    const currentUrl = page.url();
    console.log('當前 URL:', currentUrl);
    
    // 檢查是否有商品相關內容
    const hasProductsContent = await page.locator('table, .product, [class*="product"], .table, .data-table').count() > 0;
    console.log('是否包含商品相關內容:', hasProductsContent);
    
    // 檢查分頁統計資訊的所有可能選擇器
    const paginationSelectors = [
      '.pagination-info',
      '[class*="pagination-info"]',
      '.pager-info',
      '[class*="pager-info"]',
      '.showing-results',
      '[class*="showing"]',
      '.results-info',
      '[class*="results"]'
    ];
    
    let paginationFound = false;
    let paginationText = '';
    
    for (const selector of paginationSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        paginationText = await elements[0].textContent();
        if (paginationText && paginationText.trim()) {
          paginationFound = true;
          console.log(`找到分頁資訊 (選擇器: ${selector}):`, paginationText);
          break;
        }
      }
    }
    
    if (!paginationFound) {
      // 搜尋包含分頁相關文字的所有元素
      const allPaginationElements = await page.locator('*').filter({ hasText: /顯示第|共.*項結果|第.*頁|showing|results|items/ }).all();
      console.log('搜尋到的分頁相關元素數量:', allPaginationElements.length);
      
      for (let i = 0; i < Math.min(allPaginationElements.length, 5); i++) {
        const text = await allPaginationElements[i].textContent();
        console.log(`分頁元素 ${i + 1}:`, text?.trim());
        if (text && text.includes('顯示第') && !paginationFound) {
          paginationText = text;
          paginationFound = true;
        }
      }
    }
    
    // 分析分頁統計結果
    if (paginationFound && paginationText) {
      console.log('\n=== 分頁統計分析 ===');
      console.log('分頁文字:', paginationText);
      
      if (paginationText.includes('顯示第1到0項，共0項結果')) {
        console.log('🚨 發現問題：顯示「顯示第1到0項，共0項結果」錯誤');
        console.log('❌ 測試結果：分頁統計有錯誤');
      } else if (paginationText.includes('顯示第') && paginationText.includes('項')) {
        console.log('✅ 測試結果：分頁統計看起來正常');
      } else {
        console.log('ℹ️  測試結果：找到分頁相關資訊，但格式可能不同');
      }
    } else {
      console.log('⚠️  測試結果：未找到分頁統計資訊');
    }
    
    // 檢查是否有商品資料
    const productRows = await page.locator('tbody tr, .product-row, [class*="product-item"]').count();
    console.log('商品資料行數:', productRows);
    
    // 檢查是否有表格標題
    const tableHeaders = await page.locator('thead th, .table-header, [class*="header"]').all();
    console.log('表格標題數量:', tableHeaders.length);
    
    // 獲取頁面的主要內容
    const mainContent = await page.locator('main, .main-content, .content, .container').first().textContent();
    if (mainContent) {
      console.log('頁面主要內容長度:', mainContent.length);
      
      // 檢查是否包含商品相關關鍵字
      const keywords = ['商品', '產品', 'product', '庫存', '名稱', '價格', '數量'];
      const foundKeywords = keywords.filter(keyword => mainContent.includes(keyword));
      console.log('找到的相關關鍵字:', foundKeywords);
    }
    
    // 檢查是否有錯誤訊息
    const errorMessages = await page.locator('.alert-danger, .error, .alert-error, [class*="error"]').all();
    if (errorMessages.length > 0) {
      console.log('發現錯誤訊息:');
      for (let error of errorMessages) {
        const errorText = await error.textContent();
        console.log('- 錯誤:', errorText?.trim());
      }
    }
    
    // 最終檢查頁面 HTML 以確認是否在正確的頁面
    const htmlContent = await page.content();
    const isProductsPage = htmlContent.includes('product') || htmlContent.includes('商品') || htmlContent.includes('Product');
    console.log('是否為商品頁面:', isProductsPage);
    
    console.log('\n=== 測試完成 ===');
    
  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
    await page.screenshot({ path: 'products-complete-test-error.png' });
    throw error;
  }
});