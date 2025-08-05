import { test, expect } from '@playwright/test';

test('Debug Session and Company Data', async ({ page }) => {
  // Navigate and login
  await page.goto('http://127.0.0.1:8000/orders/sales');
  
  if (await page.locator('input[name="email"]').isVisible()) {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  }
  
  // 創建臨時測試路由來檢查 session 數據
  await page.goto('http://127.0.0.1:8000/orders/sales/7246/edit');
  
  // 注入 JavaScript 來檢查當前頁面的後端數據傳遞
  const debugInfo = await page.evaluate(() => {
    // 檢查是否有後端傳遞的數據
    const scriptTags = Array.from(document.scripts).filter(script => 
      script.textContent.includes('customers') || 
      script.textContent.includes('products') ||
      script.textContent.includes('salesOrder')
    );
    
    const debugData = {
      hasCustomersData: false,
      hasProductsData: false,
      hasSalesOrderData: false,
      customersCount: 0,
      productsCount: 0,
      currentCompanyId: null
    };
    
    // 嘗試從腳本標籤中解析數據
    scriptTags.forEach(script => {
      const content = script.textContent;
      
      // 檢查客戶數據
      if (content.includes('const serverCustomers =')) {
        debugData.hasCustomersData = true;
        const customersMatch = content.match(/const serverCustomers = (\[.*?\]);/s);
        if (customersMatch) {
          try {
            const customers = JSON.parse(customersMatch[1]);
            debugData.customersCount = customers.length;
          } catch (e) {}
        }
      }
      
      // 檢查產品數據
      if (content.includes('const serverProducts =')) {
        debugData.hasProductsData = true;
        const productsMatch = content.match(/const serverProducts = (\[.*?\]);/s);
        if (productsMatch) {
          try {
            const products = JSON.parse(productsMatch[1]);
            debugData.productsCount = products.length;
          } catch (e) {}
        }
      }
      
      // 檢查銷售訂單數據
      if (content.includes('const salesOrder =')) {
        debugData.hasSalesOrderData = true;
      }
    });
    
    return debugData;
  });
  
  console.log('=== SESSION 和後端數據檢查 ===');
  console.log(`📊 後端傳遞客戶數據: ${debugInfo.hasCustomersData} (數量: ${debugInfo.customersCount})`);
  console.log(`📦 後端傳遞產品數據: ${debugInfo.hasProductsData} (數量: ${debugInfo.productsCount})`);
  console.log(`📄 後端傳遞訂單數據: ${debugInfo.hasSalesOrderData}`);
  
  if (debugInfo.customersCount === 0) {
    console.log('⚠️ 客戶數據為空 - 可能是 session company_id 問題');
  }
  
  if (debugInfo.productsCount === 0) {
    console.log('⚠️ 產品數據為空 - 可能是 session company_id 問題');
  }
});