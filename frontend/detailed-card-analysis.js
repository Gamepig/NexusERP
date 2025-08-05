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
      await page.waitForTimeout(3000); // 等待頁面完全載入
    }

    console.log('=== Dashboard 卡片置中效果詳細分析 ===\n');

    // 獲取頁面和視窗尺寸
    const dimensions = await page.evaluate(() => ({
      pageWidth: document.body.scrollWidth,
      pageHeight: document.body.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    }));
    
    console.log(`頁面尺寸: ${dimensions.pageWidth}x${dimensions.pageHeight}`);
    console.log(`視窗尺寸: ${dimensions.viewportWidth}x${dimensions.viewportHeight}\n`);

    // 等待 CSS 載入完成
    await page.waitForTimeout(2000);

    // 檢查卡片容器
    const cardContainerInfo = await page.evaluate(() => {
      const wrapper = document.querySelector('.dashboard-info-grid-wrapper');
      const grid = document.querySelector('.dashboard-info-grid');
      
      if (!wrapper || !grid) {
        return { error: '找不到卡片容器元素' };
      }
      
      const wrapperRect = wrapper.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const wrapperStyles = window.getComputedStyle(wrapper);
      const gridStyles = window.getComputedStyle(grid);
      
      return {
        wrapper: {
          rect: {
            x: wrapperRect.x,
            y: wrapperRect.y,
            width: wrapperRect.width,
            height: wrapperRect.height
          },
          styles: {
            display: wrapperStyles.display,
            justifyContent: wrapperStyles.justifyContent,
            width: wrapperStyles.width,
            padding: wrapperStyles.padding
          }
        },
        grid: {
          rect: {
            x: gridRect.x,
            y: gridRect.y,
            width: gridRect.width,
            height: gridRect.height
          },
          styles: {
            display: gridStyles.display,
            justifyContent: gridStyles.justifyContent,
            maxWidth: gridStyles.maxWidth,
            margin: gridStyles.margin,
            padding: gridStyles.padding,
            gap: gridStyles.gap
          }
        }
      };
    });

    if (cardContainerInfo.error) {
      console.log('❌', cardContainerInfo.error);
    } else {
      console.log('=== 卡片容器分析 ===');
      console.log('包裝器 (.dashboard-info-grid-wrapper):');
      console.log(`  位置: x=${cardContainerInfo.wrapper.rect.x}, y=${cardContainerInfo.wrapper.rect.y}`);
      console.log(`  尺寸: ${cardContainerInfo.wrapper.rect.width} x ${cardContainerInfo.wrapper.rect.height}`);
      console.log(`  樣式: display=${cardContainerInfo.wrapper.styles.display}, justify-content=${cardContainerInfo.wrapper.styles.justifyContent}`);
      console.log(`  寬度: ${cardContainerInfo.wrapper.styles.width}, 內距: ${cardContainerInfo.wrapper.styles.padding}\n`);
      
      console.log('卡片網格 (.dashboard-info-grid):');
      console.log(`  位置: x=${cardContainerInfo.grid.rect.x}, y=${cardContainerInfo.grid.rect.y}`);
      console.log(`  尺寸: ${cardContainerInfo.grid.rect.width} x ${cardContainerInfo.grid.rect.height}`);
      console.log(`  樣式: display=${cardContainerInfo.grid.styles.display}, justify-content=${cardContainerInfo.grid.styles.justifyContent}`);
      console.log(`  最大寬度: ${cardContainerInfo.grid.styles.maxWidth}, 邊距: ${cardContainerInfo.grid.styles.margin}`);
      console.log(`  內距: ${cardContainerInfo.grid.styles.padding}, 間隙: ${cardContainerInfo.grid.styles.gap}\n`);
    }

    // 檢查個別卡片
    const cardsInfo = await page.evaluate(() => {
      const cards = [
        { selector: '.user-identity-card', name: '使用者身份卡片' },
        { selector: '.company-info-card', name: '公司資訊卡片' },
        { selector: '.business-stats-card', name: '業務統計卡片' }
      ];
      
      const results = [];
      
      cards.forEach((card, index) => {
        const element = document.querySelector(card.selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);
          
          results.push({
            name: card.name,
            selector: card.selector,
            rect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              centerX: rect.x + rect.width / 2
            },
            styles: {
              flex: styles.flex,
              minWidth: styles.minWidth,
              maxWidth: styles.maxWidth,
              margin: styles.margin,
              padding: styles.padding
            }
          });
        }
      });
      
      return results;
    });

    console.log('=== 個別卡片分析 ===');
    if (cardsInfo.length === 0) {
      console.log('❌ 找不到任何卡片元素');
    } else {
      cardsInfo.forEach((card, index) => {
        console.log(`${index + 1}. ${card.name}:`);
        console.log(`   位置: x=${card.rect.x.toFixed(1)}, y=${card.rect.y.toFixed(1)}`);
        console.log(`   尺寸: ${card.rect.width.toFixed(1)} x ${card.rect.height.toFixed(1)}`);
        console.log(`   中心點 X: ${card.rect.centerX.toFixed(1)}`);
        console.log(`   樣式: flex=${card.styles.flex}, 最小寬度=${card.styles.minWidth}, 最大寬度=${card.styles.maxWidth}\n`);
      });
    }

    // 分析整體對齊狀況
    if (cardsInfo.length === 3) {
      const totalCardsWidth = cardsInfo[2].rect.x + cardsInfo[2].rect.width - cardsInfo[0].rect.x;
      const leftMargin = cardsInfo[0].rect.x;
      const rightMargin = dimensions.viewportWidth - (cardsInfo[2].rect.x + cardsInfo[2].rect.width);
      const centerOfViewport = dimensions.viewportWidth / 2;
      const centerOfCards = cardsInfo[0].rect.x + totalCardsWidth / 2;
      
      console.log('=== 整體對齊分析 ===');
      console.log(`卡片區域總寬度: ${totalCardsWidth.toFixed(1)}px`);
      console.log(`左邊距: ${leftMargin.toFixed(1)}px`);
      console.log(`右邊距: ${rightMargin.toFixed(1)}px`);
      console.log(`邊距差異: ${Math.abs(leftMargin - rightMargin).toFixed(1)}px`);
      console.log(`視窗中心點: ${centerOfViewport.toFixed(1)}px`);
      console.log(`卡片區域中心點: ${centerOfCards.toFixed(1)}px`);
      console.log(`中心點偏移: ${Math.abs(centerOfViewport - centerOfCards).toFixed(1)}px`);
      
      const isWellCentered = Math.abs(leftMargin - rightMargin) < 20 && Math.abs(centerOfViewport - centerOfCards) < 20;
      console.log(`\n置中狀況: ${isWellCentered ? '✅ 卡片已正確置中' : '❌ 卡片未正確置中'}`);
      
      if (!isWellCentered) {
        console.log('\n🔧 建議修正:');
        if (leftMargin < rightMargin) {
          console.log('- 卡片偏左，需要增加左邊距或減少右邊距');
        } else {
          console.log('- 卡片偏右，需要減少左邊距或增加右邊距');
        }
      }
    }

    // 截圖卡片區域進行視覺驗證
    try {
      const cardArea = page.locator('.dashboard-info-grid-wrapper');
      await cardArea.screenshot({ 
        path: '/tmp/dashboard-cards-centered.png',
        padding: 20
      });
      console.log('\n📸 卡片區域截圖已保存: /tmp/dashboard-cards-centered.png');
    } catch (screenshotError) {
      console.log('截圖失敗:', screenshotError.message);
    }

    // 完整頁面截圖
    await page.screenshot({ 
      path: '/tmp/dashboard-complete-analysis.png',
      fullPage: true 
    });
    console.log('📸 完整頁面截圖已保存: /tmp/dashboard-complete-analysis.png');

  } catch (error) {
    console.error('❌ 分析過程中發生錯誤:', error);
  }

  await browser.close();
})();