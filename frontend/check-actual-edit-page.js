import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 檢查編輯頁面的實際數據...');
    
    // 1. 登入系統
    console.log('📋 步驟 1: 登入系統');
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL(/\/dashboard|\/home/, { timeout: 10000 });
    console.log('✅ 登入成功');
    
    // 2. 嘗試直接訪問編輯頁面
    console.log('📋 步驟 2: 直接訪問編輯頁面');
    try {
      await page.goto('http://127.0.0.1:8000/orders/purchase/675/edit');
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      console.log(`📋 頁面標題: ${title}`);
      
      const url = page.url();
      console.log(`📋 最終 URL: ${url}`);
      
      // 3. 檢查頁面內容
      const pageContent = await page.locator('body').textContent();
      
      if (pageContent.includes('404') || pageContent.includes('Not Found')) {
        console.log('❌ 頁面返回 404 錯誤');
      } else if (pageContent.includes('編輯採購訂單')) {
        console.log('✅ 頁面正常加載');
        
        // 檢查表單中的實際數據
        const poNumber = await page.locator('input[name="po_number"]').getAttribute('value');
        console.log(`📋 採購單號: ${poNumber || '無'}`);
        
        const supplierOptions = await page.locator('select[name="supplier_id"] option:checked').textContent();
        console.log(`📋 選中的供應商: ${supplierOptions || '無'}`);
        
        // 檢查是否有錯誤訊息
        const errorMessages = await page.locator('.alert-danger, .error').allTextContents();
        if (errorMessages.length > 0) {
          console.log('❌ 錯誤訊息:');
          errorMessages.forEach((msg, index) => {
            console.log(`  ${index + 1}. ${msg}`);
          });
        }
        
      } else {
        console.log('❓ 頁面內容未知');
        console.log('頁面內容片段:', pageContent.substring(0, 500));
      }
      
    } catch (error) {
      console.log('❌ 訪問編輯頁面失敗:', error.message);
    }
    
    // 4. 檢查採購訂單列表頁面
    console.log('\n📋 步驟 4: 檢查列表頁面');
    await page.goto('http://127.0.0.1:8000/orders/purchase');
    await page.waitForLoadState('networkidle');
    
    const listTitle = await page.title();
    console.log(`📋 列表頁面標題: ${listTitle}`);
    
    // 檢查表格行數
    const tableRows = await page.locator('table tbody tr').count();
    console.log(`📋 表格行數: ${tableRows}`);
    
    if (tableRows > 0) {
      console.log('📋 列表中的採購訂單:');
      for (let i = 0; i < Math.min(tableRows, 5); i++) {
        const row = page.locator('table tbody tr').nth(i);
        const cells = await row.locator('td').allTextContents();
        console.log(`  ${i + 1}. ${cells.join(' | ')}`);
      }
    } else {
      console.log('❌ 列表中沒有採購訂單');
    }
    
    // 等待查看
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ 檢查過程中發生錯誤:', error);
  } finally {
    await browser.close();
  }
})();