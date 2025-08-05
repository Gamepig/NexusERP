import { chromium } from 'playwright';

(async () => {
  console.log('🔍 檢查客戶管理頁面當前實際狀況...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 登入流程
    console.log('1. 導航到登入頁面...');
    await page.goto('http://127.0.0.1:8000/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ 登入成功');
    
    // 2. 導航到客戶頁面
    console.log('\n2. 導航到客戶頁面...');
    await page.goto('http://127.0.0.1:8000/customers');
    
    // 等待頁面載入
    await page.waitForSelector('.container', { timeout: 10000 });
    
    // 3. 截圖記錄當前狀態
    console.log('3. 截圖記錄當前狀態...');
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/debug_current_customer_page.png',
      fullPage: true 
    });
    
    // 4. 檢查錯誤狀況
    console.log('\n4. 檢查頁面錯誤狀況:');
    
    // 檢查是否有錯誤訊息
    const errorElements = await page.locator('.alert-danger, .error, [class*="error"]').all();
    if (errorElements.length > 0) {
      console.log(`❌ 找到 ${errorElements.length} 個錯誤元素:`);
      for (let i = 0; i < errorElements.length; i++) {
        const text = await errorElements[i].textContent();
        console.log(`   - 錯誤 ${i + 1}: ${text}`);
      }
    } else {
      console.log('✅ 沒有找到明顯的錯誤元素');
    }
    
    // 檢查 Console 錯誤
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 刷新頁面以捕獲 console 錯誤
    await page.reload();
    await page.waitForSelector('.container', { timeout: 10000 });
    
    // 等待一下讓 console 錯誤出現
    await page.waitForTimeout(3000);
    
    console.log('\n5. Console 錯誤檢查:');
    if (consoleErrors.length > 0) {
      console.log(`❌ 找到 ${consoleErrors.length} 個 Console 錯誤:`);
      consoleErrors.forEach((error, i) => {
        console.log(`   - Console 錯誤 ${i + 1}: ${error}`);
      });
    } else {
      console.log('✅ 沒有 Console 錯誤');
    }
    
    // 6. 檢查 Network 請求
    console.log('\n6. 檢查 API 請求狀況:');
    
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/customers')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // 觸發 API 請求（如果有的話）
    await page.reload();
    await page.waitForSelector('.container', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    if (responses.length > 0) {
      console.log('📡 發現 API 請求:');
      responses.forEach((resp, i) => {
        console.log(`   - 請求 ${i + 1}: ${resp.url}`);
        console.log(`     狀態: ${resp.status} ${resp.statusText}`);
      });
    } else {
      console.log('⚠️ 沒有檢測到 /api/customers 請求');
    }
    
    // 7. 檢查頁面內容
    console.log('\n7. 檢查頁面基本內容:');
    
    const pageTitle = await page.title();
    console.log(`   - 頁面標題: ${pageTitle}`);
    
    const hasTable = await page.locator('table').count() > 0;
    console.log(`   - 是否有表格: ${hasTable ? '✅ 是' : '❌ 否'}`);
    
    const hasCustomerData = await page.locator('tr').count() > 1; // 超過標題行
    console.log(`   - 是否有客戶資料: ${hasCustomerData ? '✅ 是' : '❌ 否'}`);
    
    console.log('\n✅ 檢查完成，請查看截圖 debug_current_customer_page.png');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    
    // 即使錯誤也要截圖
    try {
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/frontend/debug_current_customer_page_error.png',
        fullPage: true 
      });
      console.log('📸 錯誤狀態截圖已儲存: debug_current_customer_page_error.png');
    } catch (screenshotError) {
      console.error('截圖失敗:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }
})();