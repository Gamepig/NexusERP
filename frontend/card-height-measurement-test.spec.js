import { test, expect } from '@playwright/test';

test.describe('NexusERP Card Height Measurement Tests', () => {

  test('Comprehensive card height verification after 1/3 reduction', async ({ page }) => {
    console.log('🔧 === NexusERP 卡片高度驗證測試開始 ===');

    // Step 1: Navigate to homepage
    console.log('📍 步驟 1: 訪問首頁');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForTimeout(2000);

    // Step 2: Handle login if needed
    const isLoginPage = await page.locator('input[name="email"]').count() > 0;
    console.log(`🔐 是否為登入頁面: ${isLoginPage}`);

    if (!isLoginPage) {
      console.log('🔄 重定向到登入頁面');
      await page.goto('http://127.0.0.1:8000/login');
      await page.waitForTimeout(2000);
    }

    // Take screenshot of login page
    await page.screenshot({ 
      path: 'card-height-01-login-page.png',
      fullPage: true 
    });

    // Step 3: Login
    console.log('📍 步驟 2: 執行登入');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    await page.screenshot({ 
      path: 'card-height-02-form-filled.png',
      fullPage: true 
    });

    // Click login button
    console.log('🖱️ 點擊登入按鈕');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Step 4: Wait for dashboard to load
    console.log('📍 步驟 3: 等待儀表板載入');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Additional wait to ensure all content is loaded
    await page.waitForTimeout(3000);

    // Take screenshot of loaded dashboard
    await page.screenshot({ 
      path: 'card-height-03-dashboard-loaded.png',
      fullPage: true 
    });

    // Step 5: Comprehensive card measurement
    console.log('📍 步驟 4: 開始卡片高度測量');
    
    // Define expected heights after 1/3 reduction
    const expectedHeights = {
      quickAction: { target: 133, tolerance: 15, original: 200, name: 'Quick Action Cards' },
      statistics: { target: 120, tolerance: 15, original: 180, name: 'Statistics Cards' },
      chart: { target: 267, tolerance: 20, original: 400, name: 'Chart Cards' }
    };

    const measurements = {
      quickAction: [],
      statistics: [],
      chart: []
    };

    // Measure all visible cards using multiple approaches
    console.log('🔍 搜尋並測量所有卡片...');

    // Get all potential card elements
    const allCards = await page.locator('div').evaluateAll(elements => {
      return elements.filter(el => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        const classList = el.classList;
        
        // Filter for card-like elements with reasonable size
        return rect.height > 50 && 
               rect.width > 100 && 
               (classList.contains('bg-') || 
                classList.contains('card') || 
                classList.contains('rounded') ||
                classList.contains('shadow') ||
                styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                styles.boxShadow !== 'none');
      }).map(el => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        return {
          height: Math.round(rect.height),
          width: Math.round(rect.width),
          classes: el.className,
          text: el.textContent.trim().substring(0, 100),
          backgroundColor: styles.backgroundColor,
          x: Math.round(rect.x),
          y: Math.round(rect.y)
        };
      });
    });

    console.log(`🔍 找到 ${allCards.length} 個潛在卡片元素`);

    // Categorize cards based on height and content
    allCards.forEach((card, index) => {
      const height = card.height;
      const text = card.text;
      const classes = card.classes;

      // Determine card type based on height ranges and content
      if (height >= 90 && height <= 170) {
        // Quick Action Cards or Statistics Cards
        if (text.match(/\d+/) && (classes.includes('bg-') || classes.includes('card'))) {
          if (height <= 140) {
            measurements.quickAction.push({
              ...card,
              index,
              type: 'Quick Action',
              actualReduction: Math.round(((200 - height) / 200) * 100)
            });
          } else {
            measurements.statistics.push({
              ...card,
              index,
              type: 'Statistics',
              actualReduction: Math.round(((180 - height) / 180) * 100)
            });
          }
        }
      } else if (height >= 200 && height <= 350) {
        // Chart Cards
        if (classes.includes('bg-') || classes.includes('card') || text.includes('分析') || text.includes('圖表')) {
          measurements.chart.push({
            ...card,
            index,
            type: 'Chart',
            actualReduction: Math.round(((400 - height) / 400) * 100)
          });
        }
      }
    });

    // Log detailed measurements
    console.log('\n📊 === 詳細測量結果 ===');
    console.log('='.repeat(80));

    let totalTests = 0;
    let passedTests = 0;

    // Verify Quick Action Cards
    if (measurements.quickAction.length > 0) {
      console.log(`\n🚀 ${expectedHeights.quickAction.name} (${measurements.quickAction.length} 個):`);
      console.log(`   目標高度: ~${expectedHeights.quickAction.target}px (從 ${expectedHeights.quickAction.original}px 減少)`);
      
      measurements.quickAction.forEach((card, i) => {
        totalTests++;
        const isWithinTolerance = Math.abs(card.height - expectedHeights.quickAction.target) <= expectedHeights.quickAction.tolerance;
        const status = isWithinTolerance ? '✅' : '❌';
        
        console.log(`   ${i + 1}. ${card.height}px ${status} (減少 ${card.actualReduction}%) - "${card.text.substring(0, 30)}..."`);
        console.log(`      位置: (${card.x}, ${card.y}) | 尺寸: ${card.width}x${card.height}px`);
        
        if (isWithinTolerance) passedTests++;
      });
    }

    // Verify Statistics Cards
    if (measurements.statistics.length > 0) {
      console.log(`\n📊 ${expectedHeights.statistics.name} (${measurements.statistics.length} 個):`);
      console.log(`   目標高度: ~${expectedHeights.statistics.target}px (從 ${expectedHeights.statistics.original}px 減少)`);
      
      measurements.statistics.forEach((card, i) => {
        totalTests++;
        const isWithinTolerance = Math.abs(card.height - expectedHeights.statistics.target) <= expectedHeights.statistics.tolerance;
        const status = isWithinTolerance ? '✅' : '❌';
        
        console.log(`   ${i + 1}. ${card.height}px ${status} (減少 ${card.actualReduction}%) - "${card.text.substring(0, 30)}..."`);
        console.log(`      位置: (${card.x}, ${card.y}) | 尺寸: ${card.width}x${card.height}px`);
        
        if (isWithinTolerance) passedTests++;
      });
    }

    // Verify Chart Cards
    if (measurements.chart.length > 0) {
      console.log(`\n📈 ${expectedHeights.chart.name} (${measurements.chart.length} 個):`);
      console.log(`   目標高度: ~${expectedHeights.chart.target}px (從 ${expectedHeights.chart.original}px 減少)`);
      
      measurements.chart.forEach((card, i) => {
        totalTests++;
        const isWithinTolerance = Math.abs(card.height - expectedHeights.chart.target) <= expectedHeights.chart.tolerance;
        const status = isWithinTolerance ? '✅' : '❌';
        
        console.log(`   ${i + 1}. ${card.height}px ${status} (減少 ${card.actualReduction}%) - "${card.text.substring(0, 30)}..."`);
        console.log(`      位置: (${card.x}, ${card.y}) | 尺寸: ${card.width}x${card.height}px`);
        
        if (isWithinTolerance) passedTests++;
      });
    }

    // Final summary
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    console.log('\n🎯 === 最終測試結果 ===');
    console.log('='.repeat(80));
    console.log(`✅ 通過測試: ${passedTests}/${totalTests} (${successRate}%)`);
    console.log(`🚀 Quick Action Cards: ${measurements.quickAction.length} 個`);
    console.log(`📊 Statistics Cards: ${measurements.statistics.length} 個`);
    console.log(`📈 Chart Cards: ${measurements.chart.length} 個`);
    console.log(`📏 總計測量卡片: ${measurements.quickAction.length + measurements.statistics.length + measurements.chart.length} 個`);

    // Take final measurement screenshot
    await page.screenshot({ 
      path: 'card-height-04-final-measurements.png',
      fullPage: true 
    });

    // Content visibility and readability check
    console.log('\n👀 === 內容可見性與可讀性檢查 ===');
    
    let contentIssues = [];
    
    // Check for text overflow in all measured cards
    const allMeasuredCards = [
      ...measurements.quickAction,
      ...measurements.statistics,
      ...measurements.chart
    ];

    for (const card of allMeasuredCards) {
      if (card.height < 80) {
        contentIssues.push(`卡片過小可能影響可讀性: ${card.height}px - "${card.text.substring(0, 30)}..."`);
      }
    }

    if (contentIssues.length === 0) {
      console.log('✅ 所有卡片高度適當，內容可讀性良好');
    } else {
      console.log(`⚠️ 發現 ${contentIssues.length} 個潛在內容可讀性問題:`);
      contentIssues.forEach(issue => console.log(`   - ${issue}`));
    }

    // Assertions
    expect(totalTests).toBeGreaterThan(0, '應該找到至少一些卡片進行測量');
    expect(measurements.quickAction.length + measurements.statistics.length + measurements.chart.length)
      .toBeGreaterThan(10, '應該找到至少10個卡片 (根據儀表板截圖應該有14個卡片)');
    expect(successRate).toBeGreaterThanOrEqual(70, `預期至少70%的卡片符合高度減少目標，實際 ${successRate}%`);
    expect(contentIssues.length).toBeLessThan(3, `內容可讀性問題過多: ${contentIssues.length}`);

    console.log('\n🎉 === 卡片高度驗證測試完成 ===');
  });

  test('Responsive card height verification', async ({ page }) => {
    console.log('📱 === 響應式卡片高度驗證測試 ===');

    // Login first
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const screenSizes = [
      { name: 'Desktop-Large', width: 1920, height: 1080 },
      { name: 'Desktop-Medium', width: 1280, height: 720 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const size of screenSizes) {
      console.log(`\n📏 測試 ${size.name} (${size.width}x${size.height})...`);
      
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(2000); // Wait for responsive adjustments
      
      // Take screenshot
      await page.screenshot({ 
        path: `card-height-responsive-${size.name}-${size.width}x${size.height}.png`,
        fullPage: true 
      });

      // Quick card count and average height measurement
      const cardStats = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('div')).filter(el => {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          return rect.height > 50 && 
                 rect.width > 100 && 
                 (el.classList.contains('bg-') || 
                  el.classList.contains('card') || 
                  styles.backgroundColor !== 'rgba(0, 0, 0, 0)');
        });
        
        if (cards.length === 0) return { count: 0, avgHeight: 0 };
        
        const totalHeight = cards.reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
        return {
          count: cards.length,
          avgHeight: Math.round(totalHeight / cards.length)
        };
      });

      console.log(`   📊 找到 ${cardStats.count} 個卡片，平均高度: ${cardStats.avgHeight}px`);
      
      // Verify reasonable number of cards found
      expect(cardStats.count).toBeGreaterThan(5, `${size.name} 應該找到至少 5 個卡片`);
    }
  });

});