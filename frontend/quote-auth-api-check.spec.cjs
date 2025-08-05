const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔐 開始檢查用戶登入狀態和認證機制...');
  
  // 設置監聽器
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ JavaScript錯誤:', msg.text());
    }
  });
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('📤 API請求:', request.method(), request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('📥 API回應:', response.status(), response.url());
    }
  });
  
  try {
    // 步驟1: 訪問首頁
    console.log('\n📍 步驟1: 訪問首頁');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 步驟2: 執行登入
    console.log('\n📍 步驟2: 執行登入');
    const isLoggedIn = await page.locator('.sidebar, [data-sidebar], nav').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      await page.goto('http://127.0.0.1:8000/login');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      console.log('✅ 登入完成');
    } else {
      console.log('✅ 用戶已登入');
    }
    
    // 步驟3: 訪問報價建立頁面
    console.log('\n📍 步驟3: 訪問報價建立頁面');
    const response = await page.goto('http://127.0.0.1:8000/quotes/create');
    console.log('📊 頁面狀態碼:', response.status());
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 檢查頁面標題和內容
    const title = await page.title();
    console.log('📄 頁面標題:', title);
    
    const bodyText = await page.locator('body').textContent();
    console.log('📝 頁面關鍵內容檢查:');
    console.log('  - 包含"報價":', bodyText.includes('報價'));
    console.log('  - 包含"建立":', bodyText.includes('建立') || bodyText.includes('create'));
    console.log('  - 包含"客戶":', bodyText.includes('客戶'));
    console.log('  - 包含"產品":', bodyText.includes('產品'));
    
    // 檢查認證狀態
    console.log('\n🔐 檢查認證狀態:');
    const authElements = await page.locator('.login, .auth, .user-info, .profile').count();
    console.log('  - 認證相關元素數量:', authElements);
    
    // 檢查右上角用戶資訊
    const userInfo = await page.locator('.user-info, .profile, .navbar .user, .header .user').textContent().catch(() => '未找到');
    console.log('  - 用戶資訊:', userInfo);
    
    // 步驟4: 測試API端點
    console.log('\n📍 步驟4: 測試關鍵API端點');
    
    const apiTests = [
      { name: '客戶資料API', url: 'http://127.0.0.1:8000/api/customers' },
      { name: '產品搜尋API (無參數)', url: 'http://127.0.0.1:8000/api/products/search' },
      { name: '產品搜尋API (test)', url: 'http://127.0.0.1:8000/api/products/search?q=test' },
      { name: '產品搜尋API (產品)', url: 'http://127.0.0.1:8000/api/products/search?q=產品' }
    ];
    
    for (const test of apiTests) {
      try {
        console.log('\n🔍 測試:', test.name);
        const apiResponse = await page.goto(test.url);
        const status = apiResponse.status();
        console.log('  狀態碼:', status);
        
        if (status === 200) {
          const contentType = apiResponse.headers()['content-type'] || '';
          console.log('  Content-Type:', contentType);
          
          if (contentType.includes('application/json')) {
            const jsonData = await apiResponse.json();
            console.log('  JSON回應成功, 大小:', JSON.stringify(jsonData).length);
            if (jsonData.data) {
              console.log('  數據項目數量:', jsonData.data.length || 0);
            }
          }
        } else if (status === 401) {
          console.log('  ❌ 認證失敗 - 可能需要登入');
        } else if (status === 403) {
          console.log('  ❌ 權限不足 - 可能是多租戶問題');
        } else if (status === 500) {
          console.log('  ❌ 伺服器錯誤');
        }
      } catch (error) {
        console.log('  ❌ API測試錯誤:', error.message);
      }
    }
    
    // 步驟5: 檢查前端組件
    console.log('\n📍 步驟5: 檢查前端組件載入');
    
    // 回到報價頁面
    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 檢查表單元素
    const formElements = await page.locator('form').count();
    console.log('📝 表單數量:', formElements);
    
    const inputElements = await page.locator('input').count();
    console.log('📝 輸入框數量:', inputElements);
    
    // 尋找產品自動完成輸入框
    const productInputSelectors = [
      'input[name*="product"]',
      'input[placeholder*="產品"]',
      'input[placeholder*="product"]',
      '.product-search input',
      '#product-search'
    ];
    
    let productInputFound = false;
    for (const selector of productInputSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log('✅ 找到產品輸入框:', selector);
        productInputFound = true;
        break;
      }
    }
    
    if (!productInputFound) {
      console.log('❌ 未找到產品自動完成輸入框');
      const allInputs = await page.locator('input').all();
      console.log('所有輸入框:');
      for (let i = 0; i < Math.min(allInputs.length, 5); i++) {
        const input = allInputs[i];
        const name = await input.getAttribute('name') || '';
        const placeholder = await input.getAttribute('placeholder') || '';
        const id = await input.getAttribute('id') || '';
        console.log('  ', `name="${name}" placeholder="${placeholder}" id="${id}"`);
      }
    }
    
    // 截圖保存當前狀態
    await page.screenshot({ path: 'quote-form-current-state.png', fullPage: true });
    console.log('📸 截圖已保存: quote-form-current-state.png');
    
    console.log('\n✅ 報價表單檢查完成');
    
  } catch (error) {
    console.log('❌ 測試過程發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
})();