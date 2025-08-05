const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔍 開始詳細診斷報價表單認證問題...');
  
  // 設置監聽器
  page.on('console', msg => {
    console.log('🖥️ Browser Console [' + msg.type() + ']:', msg.text());
  });
  
  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('/quotes/') || request.url().includes('/login')) {
      console.log('📤 Request:', request.method(), request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/') || response.url().includes('/quotes/') || response.url().includes('/login')) {
      console.log('📥 Response:', response.status(), response.url());
    }
  });
  
  try {
    // 步驟1: 清除所有 cookies 和緩存
    await context.clearCookies();
    console.log('🧹 已清除所有 cookies');
    
    // 步驟2: 訪問首頁
    console.log('\n📍 步驟1: 訪問首頁');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 檢查頁面狀態
    const currentUrl = page.url();
    console.log('🌐 當前URL:', currentUrl);
    
    // 步驟3: 執行登入
    console.log('\n📍 步驟2: 執行完整登入流程');
    
    // 確保訪問登入頁面
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    console.log('🌐 登入頁面URL:', page.url());
    
    // 檢查登入表單是否存在
    const emailInput = await page.locator('input[name="email"]');
    const passwordInput = await page.locator('input[name="password"]');
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      console.log('✅ 找到登入表單');
      
      // 填寫登入表單
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      
      console.log('📝 已填寫登入資訊');
      
      // 提交表單
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      console.log('🚀 已提交登入表單');
      console.log('🌐 登入後URL:', page.url());
      
      // 等待重定向完成
      await page.waitForTimeout(2000);
      
      // 檢查是否成功登入（檢查是否有導航元素）
      const hasNavigation = await page.locator('.sidebar, nav, .navigation').isVisible().catch(() => false);
      console.log('📊 登入狀態檢查 - 有導航元素:', hasNavigation);
      
      // 檢查 cookies
      const cookies = await context.cookies();
      console.log('🍪 當前 cookies 數量:', cookies.length);
      
      const sessionCookie = cookies.find(cookie => cookie.name.includes('session') || cookie.name.includes('laravel'));
      if (sessionCookie) {
        console.log('✅ 找到會話 cookie:', sessionCookie.name);
      } else {
        console.log('❌ 未找到會話 cookie');
      }
      
    } else {
      console.log('❌ 找不到登入表單');
    }
    
    // 步驟4: 嘗試直接訪問報價建立頁面
    console.log('\n📍 步驟3: 直接訪問報價建立頁面');
    
    const quoteResponse = await page.goto('http://127.0.0.1:8000/quotes/create');
    console.log('📊 報價頁面狀態碼:', quoteResponse.status());
    console.log('🌐 報價頁面最終URL:', page.url());
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 詳細檢查頁面內容
    const pageTitle = await page.title();
    console.log('📄 頁面標題:', pageTitle);
    
    const bodyText = await page.locator('body').textContent();
    const hasQuoteContent = bodyText.includes('報價') || bodyText.includes('quote');
    const hasLoginContent = bodyText.includes('登入') || bodyText.includes('login');
    
    console.log('📝 頁面內容分析:');
    console.log('  - 包含報價相關內容:', hasQuoteContent);
    console.log('  - 包含登入相關內容:', hasLoginContent);
    console.log('  - 頁面文字長度:', bodyText.length);
    
    // 檢查表單和輸入框
    const forms = await page.locator('form').count();
    const inputs = await page.locator('input').count();
    console.log('📝 表單數量:', forms);
    console.log('📝 輸入框數量:', inputs);
    
    // 如果還是登入頁面，嘗試其他方法
    if (hasLoginContent && !hasQuoteContent) {
      console.log('\n🔄 仍在登入頁面，嘗試替代認證方法...');
      
      // 嘗試設置認證 cookie
      await context.addCookies([
        {
          name: 'laravel_session',
          value: 'test-session-' + Date.now(),
          domain: '127.0.0.1',
          path: '/',
          httpOnly: true,
          secure: false
        }
      ]);
      
      // 再次嘗試訪問
      await page.goto('http://127.0.0.1:8000/quotes/create');
      await page.waitForLoadState('networkidle');
      
      const finalUrl = page.url();
      const finalBodyText = await page.locator('body').textContent();
      const finalHasQuoteContent = finalBodyText.includes('報價') || finalBodyText.includes('quote');
      
      console.log('🔄 重試後URL:', finalUrl);
      console.log('🔄 重試後包含報價內容:', finalHasQuoteContent);
    }
    
    // 步驟5: 測試API端點（使用會話）
    console.log('\n📍 步驟4: 測試API端點認證');
    
    const apiTests = [
      'http://127.0.0.1:8000/api/customers',
      'http://127.0.0.1:8000/api/products/search?q=test'
    ];
    
    for (const apiUrl of apiTests) {
      try {
        console.log(`\n🔍 測試API: ${apiUrl}`);
        const apiResponse = await page.goto(apiUrl);
        console.log(`  狀態碼: ${apiResponse.status()}`);
        console.log(`  Content-Type: ${apiResponse.headers()['content-type'] || '未知'}`);
        
        const finalApiUrl = page.url();
        console.log(`  最終URL: ${finalApiUrl}`);
        
        if (apiResponse.status() === 200) {
          const contentType = apiResponse.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            try {
              const jsonData = await apiResponse.json();
              console.log(`  JSON回應: 成功，資料長度: ${JSON.stringify(jsonData).length}`);
            } catch (e) {
              console.log(`  JSON解析失敗: ${e.message}`);
            }
          } else {
            console.log(`  非JSON回應: ${contentType}`);
          }
        }
      } catch (error) {
        console.log(`  API測試錯誤: ${error.message}`);
      }
    }
    
    // 最終截圖
    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'quote-auth-debug-final.png', fullPage: true });
    console.log('\n📸 已保存最終診斷截圖: quote-auth-debug-final.png');
    
    console.log('\n✅ 詳細認證診斷完成');
    
  } catch (error) {
    console.log('❌ 診斷過程發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
})();