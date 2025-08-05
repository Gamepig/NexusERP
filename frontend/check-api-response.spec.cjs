const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔍 檢查產品搜尋API回應格式...');
  
  try {
    // 步驟1: 登入獲取會話
    console.log('📍 步驟1: 登入獲取會話');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 登入完成');
    
    // 步驟2: 測試不同的API端點
    const apiEndpoints = [
      'http://127.0.0.1:8000/api/products/search?q=test&limit=10',
      'http://127.0.0.1:8000/api/products/search?q=產品&limit=10',
      'http://127.0.0.1:8000/api/products/search?q=laptop&limit=10'
    ];
    
    for (const apiUrl of apiEndpoints) {
      console.log(`\n🔍 測試API: ${apiUrl}`);
      
      try {
        const response = await page.goto(apiUrl);
        const status = response.status();
        const contentType = response.headers()['content-type'] || '';
        
        console.log(`  狀態碼: ${status}`);
        console.log(`  Content-Type: ${contentType}`);
        
        if (status === 200 && contentType.includes('application/json')) {
          const jsonData = await response.json();
          console.log(`  回應結構:`, JSON.stringify(jsonData, null, 2));
          
          // 檢查ProductAutocomplete期望的格式
          if (jsonData.success && Array.isArray(jsonData.products)) {
            console.log(`  ✅ 符合ProductAutocomplete期望格式`);
            console.log(`  產品數量: ${jsonData.products.length}`);
          } else if (Array.isArray(jsonData.data)) {
            console.log(`  ⚠️ 使用data陣列格式，需要調整`);
            console.log(`  產品數量: ${jsonData.data.length}`);
          } else if (Array.isArray(jsonData)) {
            console.log(`  ⚠️ 直接陣列格式，需要調整`);
            console.log(`  產品數量: ${jsonData.length}`);
          } else {
            console.log(`  ❌ 未知格式，需要檢查API實現`);
          }
          
          // 顯示前2個產品的結構
          let products = [];
          if (jsonData.products) {
            products = jsonData.products;
          } else if (jsonData.data) {
            products = jsonData.data;
          } else if (Array.isArray(jsonData)) {
            products = jsonData;
          }
          
          if (products.length > 0) {
            console.log(`  第一個產品結構:`, JSON.stringify(products[0], null, 2));
            
            // 檢查ProductAutocomplete需要的字段
            const requiredFields = ['name', 'sku', 'unit_price'];
            const missingFields = requiredFields.filter(field => !products[0].hasOwnProperty(field));
            
            if (missingFields.length === 0) {
              console.log(`  ✅ 包含所有必要字段: ${requiredFields.join(', ')}`);
            } else {
              console.log(`  ❌ 缺少字段: ${missingFields.join(', ')}`);
            }
          }
          
        } else if (status !== 200) {
          console.log(`  ❌ HTTP錯誤: ${status}`);
          const text = await response.text();
          console.log(`  錯誤內容: ${text.substring(0, 200)}`);
        } else {
          console.log(`  ❌ 非JSON回應`);
        }
        
      } catch (error) {
        console.log(`  ❌ 測試錯誤: ${error.message}`);
      }
    }
    
    console.log('\n✅ API回應格式檢查完成');
    
  } catch (error) {
    console.log('❌ 檢查過程發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
})();