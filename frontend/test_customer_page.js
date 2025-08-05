import { chromium } from 'playwright';

(async () => {
  console.log('🚀 開始測試客戶管理頁面...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 設置較長的超時時間
    page.setDefaultTimeout(30000);
    
    console.log('🔐 先登入系統...');
    await page.goto('http://127.0.0.1:8000/login');
    
    // 使用測試帳號登入
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForLoadState('networkidle');
    
    console.log('📱 導航到客戶管理頁面...');
    await page.goto('http://127.0.0.1:8000/customers');
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle');
    
    console.log('📸 截圖頁面狀態...');
    await page.screenshot({ 
      path: 'customer_page_test.png', 
      fullPage: true 
    });
    
    // 檢查頁面標題
    const title = await page.title();
    console.log(`📄 頁面標題: ${title}`);
    
    // 檢查是否有錯誤訊息
    const errorElements = await page.locator('text=/error|Error|ERROR|authorization|Authorization|required/i').all();
    if (errorElements.length > 0) {
      console.log('⚠️  發現錯誤訊息:');
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log(`   - ${text}`);
      }
    } else {
      console.log('✅ 沒有發現錯誤訊息');
    }
    
    // 檢查是否有客戶資料表格
    const tableExists = await page.locator('table, .table, [role="table"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`📊 客戶資料表格: ${tableExists ? '✅ 存在' : '❌ 不存在'}`);
    
    // 檢查是否有資料列
    const dataRows = await page.locator('tbody tr, .data-row').count();
    console.log(`📋 資料列數量: ${dataRows}`);
    
    // 檢查 API 呼叫狀態
    console.log('🔍 監聽網路請求...');
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('customers')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // 重新載入頁面來捕獲 API 呼叫
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log('🌐 API 請求結果:');
    responses.forEach(resp => {
      console.log(`   ${resp.status} ${resp.statusText} - ${resp.url}`);
    });
    
    // 等待幾秒讓用戶查看
    await page.waitForTimeout(3000);
    
    console.log('✅ 測試完成！截圖已保存為 customer_page_test.png');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    await page.screenshot({ 
      path: 'customer_page_error.png', 
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();