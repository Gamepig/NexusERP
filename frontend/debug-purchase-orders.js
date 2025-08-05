import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 開始調試採購訂單頁面...');
    
    // 1. 登入系統
    console.log('📋 步驟 1: 登入系統');
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL(/\/dashboard|\/home/, { timeout: 10000 });
    console.log('✅ 登入成功');
    
    // 2. 進入採購訂單列表頁面
    console.log('📋 步驟 2: 進入採購訂單列表');
    await page.goto('http://127.0.0.1:8000/orders/purchase');
    await page.waitForLoadState('networkidle');
    
    // 3. 檢查頁面標題和內容
    const title = await page.title();
    console.log(`📋 頁面標題: ${title}`);
    
    const url = page.url();
    console.log(`📋 目前 URL: ${url}`);
    
    // 4. 檢查是否有錯誤訊息
    const errorMessages = await page.locator('.alert-danger, .error').allTextContents();
    if (errorMessages.length > 0) {
      console.log('❌ 頁面錯誤訊息:');
      errorMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    }
    
    // 5. 列出所有連結
    const allLinks = await page.locator('a').all();
    console.log(`📋 頁面上的所有連結 (${allLinks.length} 個):`);
    for (let i = 0; i < Math.min(allLinks.length, 20); i++) {
      const href = await allLinks[i].getAttribute('href');
      const text = await allLinks[i].textContent();
      console.log(`  ${i + 1}. "${text}" -> ${href}`);
    }
    
    // 6. 檢查是否有表格
    const tables = await page.locator('table').count();
    console.log(`📋 表格數量: ${tables}`);
    
    if (tables > 0) {
      const tableHeaders = await page.locator('table th').allTextContents();
      console.log('📋 表格標題:');
      tableHeaders.forEach((header, index) => {
        console.log(`  ${index + 1}. ${header}`);
      });
      
      const tableRows = await page.locator('table tbody tr').count();
      console.log(`📋 表格資料行數: ${tableRows}`);
    }
    
    // 7. 檢查是否有「新增」按鈕或連結
    const createLinks = await page.locator('a').filter({ hasText: /新增|Add|Create|建立/ }).all();
    console.log(`📋 新增相關連結 (${createLinks.length} 個):`);
    for (let i = 0; i < createLinks.length; i++) {
      const href = await createLinks[i].getAttribute('href');
      const text = await createLinks[i].textContent();
      console.log(`  ${i + 1}. "${text}" -> ${href}`);
    }
    
    // 8. 如果沒有採購訂單，試著創建一個
    if (createLinks.length > 0) {
      console.log('📋 步驟 8: 嘗試創建採購訂單');
      await createLinks[0].click();
      await page.waitForLoadState('networkidle');
      
      const createUrl = page.url();
      console.log(`📋 創建頁面 URL: ${createUrl}`);
      
      // 檢查創建表單
      const formInputs = await page.locator('input, select, textarea').all();
      console.log(`📋 表單欄位 (${formInputs.length} 個):`);
      for (let i = 0; i < Math.min(formInputs.length, 10); i++) {
        const name = await formInputs[i].getAttribute('name');
        const type = await formInputs[i].getAttribute('type');
        const placeholder = await formInputs[i].getAttribute('placeholder');
        console.log(`  ${i + 1}. name="${name}" type="${type}" placeholder="${placeholder}"`);
      }
    }
    
    // 等待一段時間讓使用者查看
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ 調試過程中發生錯誤:', error);
  } finally {
    await browser.close();
  }
})();