const { chromium } = require('playwright');

(async () => {
  console.log('🧪 開始 Task 48.4 產品路由功能測試...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 先進行登入
    console.log('🔐 執行登入流程...');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForTimeout(1000);
    
    // 檢查是否需要登入
    const needsLogin = await page.locator('input[name="email"]').isVisible().catch(() => false);
    
    if (needsLogin) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      console.log('   ✅ 登入完成');
    } else {
      console.log('   ✅ 已登入狀態');
    }
    
    // 測試 1: 產品清單頁面
    console.log('\n1️⃣ 測試產品清單頁面 (/products)');
    await page.goto('http://127.0.0.1:8000/products');
    await page.waitForTimeout(3000);
    
    // 檢查頁面標題
    const title = await page.textContent('h1');
    console.log(`   ✅ 頁面標題: ${title}`);
    
    // 檢查新增商品按鈕
    const addButton = await page.locator('text=新增商品').first();
    console.log(`   ✅ 新增商品按鈕存在: ${await addButton.isVisible()}`);
    
    // 檢查搜尋功能
    const searchInput = await page.locator('#search');
    console.log(`   ✅ 搜尋框存在: ${await searchInput.isVisible()}`);
    
    // 測試 2: 新增商品頁面  
    console.log('\n2️⃣ 測試新增商品頁面 (/products/create)');
    await addButton.click();
    await page.waitForTimeout(2000);
    
    const createTitle = await page.textContent('h1');
    console.log(`   ✅ 新增頁面標題: ${createTitle}`);
    
    // 檢查表單欄位
    const nameField = await page.locator('#name');
    const skuField = await page.locator('#sku');
    const priceField = await page.locator('#price');
    
    console.log(`   ✅ 商品名稱欄位: ${await nameField.isVisible()}`);
    console.log(`   ✅ SKU 欄位: ${await skuField.isVisible()}`);
    console.log(`   ✅ 價格欄位: ${await priceField.isVisible()}`);
    
    // 檢查返回按鈕
    const backButton = await page.locator('text=返回清單');
    console.log(`   ✅ 返回清單按鈕: ${await backButton.isVisible()}`);
    
    // 測試 3: 商品詳情頁面
    console.log('\n3️⃣ 測試商品詳情頁面 (/products/1)');
    await page.goto('http://127.0.0.1:8000/products/1');
    await page.waitForTimeout(3000);
    
    // 等待載入完成，檢查是否有錯誤彈窗
    const dialogHandled = await page.evaluate(() => {
      return new Promise((resolve) => {
        let dialogShown = false;
        const originalAlert = window.alert;
        window.alert = function(message) {
          dialogShown = true;
          console.log('Alert shown:', message);
          resolve({ hasDialog: true, message: message });
          return true;
        };
        setTimeout(() => {
          if (!dialogShown) {
            resolve({ hasDialog: false, message: null });
          }
        }, 2000);
      });
    });
    
    if (dialogHandled.hasDialog) {
      console.log(`   ❌ 載入錯誤: ${dialogHandled.message}`);
    } else {
      const detailTitle = await page.textContent('h1');
      console.log(`   ✅ 詳情頁面標題: ${detailTitle}`);
      
      // 檢查編輯按鈕
      const editButton = await page.locator('text=編輯商品');
      console.log(`   ✅ 編輯商品按鈕: ${await editButton.isVisible()}`);
    }
    
    // 測試 4: 編輯商品頁面
    console.log('\n4️⃣ 測試編輯商品頁面 (/products/1/edit)');
    await page.goto('http://127.0.0.1:8000/products/1/edit');
    await page.waitForTimeout(2000);
    
    const editTitle = await page.textContent('h1');
    console.log(`   ✅ 編輯頁面標題: ${editTitle}`);
    
    // 測試 5: API 端點驗證
    console.log('\n5️⃣ 驗證 API 端點回應');
    
    const apiTests = [
      { url: '/api/products', name: '產品清單 API' },
      { url: '/api/products/1', name: '單一產品 API' },
      { url: '/api/product-categories', name: '產品分類 API' },
      { url: '/api/units-of-measure', name: '計量單位 API' }
    ];
    
    for (let test of apiTests) {
      const response = await page.request.get(`http://127.0.0.1:8000${test.url}`);
      const isSuccess = response.ok();
      console.log(`   ${isSuccess ? '✅' : '❌'} ${test.name}: ${response.status()}`);
    }
    
    console.log('\n🎉 產品路由功能測試完成！');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
})();