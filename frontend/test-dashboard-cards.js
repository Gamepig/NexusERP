import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('導航到 Dashboard 頁面...');
  
  try {
    // 導航到 Dashboard
    await page.goto('http://127.0.0.1:8000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // 等待頁面載入
    await page.waitForTimeout(3000);

    console.log('頁面標題:', await page.title());

    // 檢查是否需要登入
    const currentUrl = page.url();
    console.log('當前URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('需要登入，使用測試帳號...');
      
      // 填寫登入表單
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // 等待登入完成並重定向
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.waitForTimeout(2000);
    }

    console.log('截圖 Dashboard 頁面...');
    
    // 截圖整個頁面
    await page.screenshot({ 
      path: '/tmp/dashboard-full-page.png',
      fullPage: true 
    });

    // 尋找卡片容器
    const cardContainer = await page.locator('.row .col-md-4, .card-container, .dashboard-cards');
    const cardCount = await cardContainer.count();
    console.log('找到卡片數量:', cardCount);

    if (cardCount > 0) {
      // 截圖卡片區域
      await cardContainer.first().screenshot({ 
        path: '/tmp/dashboard-cards-area.png' 
      });
    }

    // 檢查具體的卡片元素
    const cards = await page.locator('.card').all();
    console.log('實際卡片數量:', cards.length);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const boundingBox = await card.boundingBox();
      if (boundingBox) {
        console.log(`卡片 ${i + 1} 位置:`, {
          x: boundingBox.x,
          y: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height
        });
      }
    }

    // 檢查頁面的 CSS 樣式
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      return {
        textAlign: computedStyle.textAlign,
        margin: computedStyle.margin,
        padding: computedStyle.padding
      };
    });
    console.log('Body 樣式:', bodyStyles);

    // 檢查卡片容器的樣式
    const containerStyles = await page.evaluate(() => {
      const container = document.querySelector('.container, .container-fluid, .row');
      if (container) {
        const computedStyle = window.getComputedStyle(container);
        return {
          display: computedStyle.display,
          justifyContent: computedStyle.justifyContent,
          alignItems: computedStyle.alignItems,
          textAlign: computedStyle.textAlign,
          margin: computedStyle.margin,
          padding: computedStyle.padding
        };
      }
      return null;
    });
    console.log('容器樣式:', containerStyles);

    console.log('測試完成！截圖已保存到 /tmp/dashboard-full-page.png');

  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
    
    // 錯誤時也截圖以便診斷
    try {
      await page.screenshot({ 
        path: '/tmp/dashboard-error.png',
        fullPage: true 
      });
      console.log('錯誤截圖已保存到 /tmp/dashboard-error.png');
    } catch (screenshotError) {
      console.error('截圖失敗:', screenshotError);
    }
  }

  await browser.close();
})();