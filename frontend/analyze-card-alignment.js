import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 導航到 Dashboard
    await page.goto('http://127.0.0.1:8000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // 登入
    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.waitForTimeout(2000);
    }

    console.log('=== 分析 Dashboard 卡片對齊狀況 ===\n');

    // 獲取頁面總寬度
    const pageWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    console.log(`頁面寬度: ${pageWidth}px, 視窗寬度: ${viewportWidth}px\n`);

    // 檢查主要卡片區域（使用者身份、公司資訊、業務概況）
    const topCards = await page.locator('.row .col-md-4').all();
    console.log(`找到頂部卡片數量: ${topCards.length}`);

    if (topCards.length > 0) {
      console.log('\n=== 頂部三張卡片位置分析 ===');
      
      const cardPositions = [];
      
      for (let i = 0; i < topCards.length; i++) {
        const card = topCards[i];
        const boundingBox = await card.boundingBox();
        if (boundingBox) {
          cardPositions.push({
            index: i + 1,
            x: boundingBox.x,
            y: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
            centerX: boundingBox.x + boundingBox.width / 2
          });
          
          console.log(`卡片 ${i + 1}:`);
          console.log(`  位置: x=${boundingBox.x}, y=${boundingBox.y}`);
          console.log(`  尺寸: ${boundingBox.width} x ${boundingBox.height}`);
          console.log(`  中心點 X: ${boundingBox.x + boundingBox.width / 2}`);
        }
      }

      // 分析對齊狀況
      if (cardPositions.length === 3) {
        const totalCardsWidth = cardPositions[2].x + cardPositions[2].width - cardPositions[0].x;
        const leftMargin = cardPositions[0].x;
        const rightMargin = viewportWidth - (cardPositions[2].x + cardPositions[2].width);
        
        console.log(`\n=== 對齊分析 ===`);
        console.log(`卡片區域總寬度: ${totalCardsWidth}px`);
        console.log(`左邊距: ${leftMargin}px`);
        console.log(`右邊距: ${rightMargin}px`);
        console.log(`對齊狀況: ${Math.abs(leftMargin - rightMargin) < 20 ? '✅ 置中對齊' : '❌ 未置中對齊'}`);
        console.log(`邊距差異: ${Math.abs(leftMargin - rightMargin)}px`);
      }
    }

    // 檢查容器的 CSS 類別和樣式
    const containerInfo = await page.evaluate(() => {
      const containers = document.querySelectorAll('.container, .container-fluid, .row');
      const results = [];
      
      containers.forEach((container, index) => {
        const rect = container.getBoundingClientRect();
        const styles = window.getComputedStyle(container);
        
        results.push({
          index,
          tagName: container.tagName,
          className: container.className,
          width: rect.width,
          left: rect.left,
          margin: styles.margin,
          padding: styles.padding,
          textAlign: styles.textAlign,
          display: styles.display,
          justifyContent: styles.justifyContent
        });
      });
      
      return results;
    });

    console.log('\n=== 容器樣式分析 ===');
    containerInfo.forEach((info, index) => {
      console.log(`容器 ${index + 1} (${info.tagName}.${info.className}):`);
      console.log(`  寬度: ${info.width}px, 左邊距: ${info.left}px`);
      console.log(`  margin: ${info.margin}`);
      console.log(`  padding: ${info.padding}`);
      console.log(`  text-align: ${info.textAlign}`);
      console.log(`  display: ${info.display}`);
      console.log(`  justify-content: ${info.justifyContent}`);
      console.log('');
    });

    // 特別截圖頂部卡片區域
    const topCardsArea = page.locator('.row').first();
    await topCardsArea.screenshot({ 
      path: '/tmp/dashboard-top-cards.png' 
    });

    console.log('詳細分析完成！');
    console.log('頂部卡片區域截圖: /tmp/dashboard-top-cards.png');

  } catch (error) {
    console.error('分析過程中發生錯誤:', error);
  }

  await browser.close();
})();