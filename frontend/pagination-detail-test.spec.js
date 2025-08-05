import { test, expect } from '@playwright/test';

test('NexusERP 商品管理頁面分頁統計詳細檢查', async ({ page }) => {
  try {
    console.log('開始詳細檢查分頁統計...');
    
    // 登入流程
    await page.goto('http://127.0.0.1:8000/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"], .btn-primary, [class*="login"], input[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 前往商品管理頁面
    await page.goto('http://127.0.0.1:8000/products', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // 專門檢查分頁統計元素
    const paginationInfo = page.locator('.pagination-info');
    const paginationExists = await paginationInfo.count() > 0;
    
    console.log('分頁統計元素是否存在:', paginationExists);
    
    if (paginationExists) {
      const paginationText = await paginationInfo.first().textContent();
      console.log('分頁統計完整文字:', `"${paginationText}"`);
      
      // 檢查 CSS 類別
      const classes = await paginationInfo.first().getAttribute('class');
      console.log('分頁統計 CSS 類別:', classes);
      
      // 檢查元素的 HTML
      const innerHTML = await paginationInfo.first().innerHTML();
      console.log('分頁統計內部 HTML:', innerHTML);
      
      // 檢查是否有問題的統計
      if (paginationText?.includes('顯示第1到0項，共0項結果')) {
        console.log('❌ 發現問題：顯示錯誤的分頁統計');
      } else if (paginationText?.includes('顯示第 1 到')) {
        console.log('✅ 分頁統計正常：', paginationText);
        
        // 解析數字
        const match = paginationText.match(/顯示第 (\d+) 到 (\d+) 項，共 (\d+) 項結果/);
        if (match) {
          const [, start, end, total] = match;
          console.log(`分頁統計解析結果: 開始=${start}, 結束=${end}, 總計=${total}`);
          
          if (parseInt(start) > 0 && parseInt(end) > 0 && parseInt(total) > 0) {
            console.log('✅ 所有數字都大於 0，統計正確');
          } else {
            console.log('❌ 發現數字為 0 或負數的問題');
          }
        }
      }
    }
    
    // 檢查商品資料數量
    const productRows = await page.locator('tbody tr').count();
    console.log('實際商品行數:', productRows);
    
    // 截圖分頁區域
    if (paginationExists) {
      await paginationInfo.first().screenshot({ path: 'pagination-info-detail.png' });
      console.log('已保存分頁統計區域截圖');
    }
    
    // 完整頁面截圖
    await page.screenshot({ 
      path: 'products-pagination-detail.png', 
      fullPage: true 
    });
    
    console.log('詳細檢查完成！');
    
  } catch (error) {
    console.error('詳細檢查過程中發生錯誤:', error);
    await page.screenshot({ path: 'pagination-detail-error.png' });
    throw error;
  }
});