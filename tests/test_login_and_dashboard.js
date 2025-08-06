import { chromium } from 'playwright';

async function testLoginAndDashboard() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 監聽控制台訊息
  page.on('console', (msg) => {
    console.log('🎯 Console:', msg.text());
  });

  // 監聽錯誤
  page.on('pageerror', (error) => {
    console.error('❌ Page Error:', error.message);
  });

  try {
    console.log('🔄 Step 1: 嘗試直接訪問儀表板...');
    
    await page.goto('http://127.0.0.1:8000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    const currentUrl = page.url();
    console.log('📍 當前 URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('🔐 需要登入，執行登入流程...');
      
      // 填寫登入表單
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'password123');
      
      console.log('📝 已填寫登入資訊');
      
      // 點擊登入按鈕
      await page.click('button[type="submit"]');
      
      console.log('🔄 已提交登入表單，等待回應...');
      
      // 等待頁面重定向
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const afterLoginUrl = page.url();
      console.log('📍 登入後 URL:', afterLoginUrl);
      
      if (afterLoginUrl.includes('/dashboard')) {
        console.log('✅ 成功重定向到儀表板');
      } else if (afterLoginUrl.includes('/login')) {
        console.log('❌ 登入失敗，仍在登入頁面');
        
        // 檢查是否有錯誤訊息
        const errors = await page.$$('.alert-danger, .error, .text-red-500');
        if (errors.length > 0) {
          for (const error of errors) {
            const errorText = await error.textContent();
            console.log('🚨 錯誤訊息:', errorText);
          }
        }
        
        // 嘗試註冊新帳號
        console.log('🔄 嘗試註冊新測試帳號...');
        await page.goto('http://127.0.0.1:8000/register');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="name"]', '測試使用者');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="password_confirmation"]', 'password123');
        
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        const afterRegisterUrl = page.url();
        console.log('📍 註冊後 URL:', afterRegisterUrl);
      }
    }

    // 確保我們在儀表板頁面
    if (!page.url().includes('/dashboard')) {
      await page.goto('http://127.0.0.1:8000/dashboard');
      await page.waitForLoadState('networkidle');
    }

    console.log('🔍 Step 2: 分析儀表板頁面內容...');
    
    // 等待一段時間讓 JavaScript 執行
    await page.waitForTimeout(8000);

    // 檢查頁面內容
    const pageAnalysis = await page.evaluate(() => {
      const body = document.body;
      const hasLoginForm = body.innerHTML.includes('email') && body.innerHTML.includes('password') && body.innerHTML.includes('type="submit"');
      const hasDashboardContent = body.innerHTML.includes('dashboard') || body.innerHTML.includes('Dashboard');
      
      return {
        url: window.location.href,
        title: document.title,
        hasLoginForm,
        hasDashboardContent,
        bodyClasses: body.className,
        allIds: Array.from(document.querySelectorAll('[id]')).map(el => el.id),
        bodyLength: body.innerHTML.length,
        mainElements: Array.from(document.querySelectorAll('main, .main, #main, .dashboard, #dashboard')).map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className
        }))
      };
    });

    console.log('📊 頁面分析結果:');
    console.log('📍 URL:', pageAnalysis.url);
    console.log('📝 標題:', pageAnalysis.title);
    console.log('🔐 有登入表單:', pageAnalysis.hasLoginForm);
    console.log('📊 有儀表板內容:', pageAnalysis.hasDashboardContent);
    console.log('🎨 Body Classes:', pageAnalysis.bodyClasses);
    console.log('🆔 所有 IDs:', pageAnalysis.allIds);
    console.log('📄 Body 長度:', pageAnalysis.bodyLength);
    console.log('🏠 主要元素:', pageAnalysis.mainElements);

    if (pageAnalysis.hasDashboardContent) {
      console.log('🔍 Step 3: 檢查儀表板狀態切換...');
      
      // 檢查載入和內容元素
      const dashboardState = await page.evaluate(() => {
        const loading = document.getElementById('dashboard-loading');
        const content = document.getElementById('dashboard-content');
        
        return {
          loadingExists: !!loading,
          loadingVisible: loading ? window.getComputedStyle(loading).display !== 'none' : false,
          contentExists: !!content,
          contentVisible: content ? window.getComputedStyle(content).display !== 'none' : false,
          dashboardReadyEvent: window.dashboardReady || false
        };
      });
      
      console.log('📊 儀表板狀態:', JSON.stringify(dashboardState, null, 2));
      
      // 手動觸發狀態切換（如果需要）
      if (dashboardState.loadingExists && dashboardState.loadingVisible) {
        console.log('🔧 手動觸發狀態切換...');
        await page.evaluate(() => {
          // 觸發事件
          window.dispatchEvent(new Event('dashboard-loaded'));
          
          // 直接設置狀態
          const loading = document.getElementById('dashboard-loading');
          const content = document.getElementById('dashboard-content');
          
          if (loading) loading.style.display = 'none';
          if (content) content.style.display = 'block';
        });
        
        await page.waitForTimeout(2000);
        
        const finalState = await page.evaluate(() => {
          const loading = document.getElementById('dashboard-loading');
          const content = document.getElementById('dashboard-content');
          
          return {
            loadingVisible: loading ? window.getComputedStyle(loading).display !== 'none' : false,
            contentVisible: content ? window.getComputedStyle(content).display !== 'none' : false
          };
        });
        
        console.log('📊 手動切換後狀態:', finalState);
      }
    }

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
}

testLoginAndDashboard().catch(console.error);