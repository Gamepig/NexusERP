import { test, expect } from '@playwright/test';

test.describe('Final Card Height Documentation', () => {

  test('Document current card heights with detailed screenshots', async ({ page }) => {
    console.log('📸 === 建立卡片高度最終文檔 ===');

    // Login process
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Set to desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(2000);

    // Take comprehensive full page screenshot
    await page.screenshot({ 
      path: 'FINAL-card-heights-full-dashboard-1920x1080.png',
      fullPage: true 
    });

    console.log('📊 測量並標記每個卡片區域...');

    // Measure and highlight each card section
    await page.evaluate(() => {
      // Add measurement overlay styles
      const style = document.createElement('style');
      style.textContent = `
        .measurement-overlay {
          position: absolute;
          border: 3px solid #ff0000;
          background: rgba(255, 0, 0, 0.1);
          z-index: 10000;
          pointer-events: none;
        }
        .measurement-label {
          position: absolute;
          background: #ff0000;
          color: white;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: bold;
          z-index: 10001;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);

      // Find and highlight cards
      const cards = Array.from(document.querySelectorAll('div')).filter(el => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        return rect.height > 50 && 
               rect.width > 100 && 
               (el.classList.contains('bg-') || 
                el.classList.contains('card') || 
                styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                styles.boxShadow !== 'none');
      });

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        if (rect.height > 80) {
          // Create overlay
          const overlay = document.createElement('div');
          overlay.className = 'measurement-overlay';
          overlay.style.left = rect.left + 'px';
          overlay.style.top = rect.top + window.scrollY + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';

          // Create label
          const label = document.createElement('div');
          label.className = 'measurement-label';
          label.style.left = rect.left + 'px';
          label.style.top = (rect.top + window.scrollY - 25) + 'px';
          label.textContent = `${Math.round(rect.width)}x${Math.round(rect.height)}px`;

          document.body.appendChild(overlay);
          document.body.appendChild(label);
        }
      });
    });

    // Take screenshot with measurements
    await page.screenshot({ 
      path: 'FINAL-card-heights-with-measurements.png',
      fullPage: true 
    });

    // Test different screen sizes
    const screenSizes = [
      { name: 'Desktop-Large', width: 1920, height: 1080 },
      { name: 'Desktop-Medium', width: 1280, height: 720 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const size of screenSizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: `FINAL-responsive-${size.name}-${size.width}x${size.height}.png`,
        fullPage: true 
      });
      
      console.log(`✅ 已截圖 ${size.name}: ${size.width}x${size.height}`);
    }

    // Get final measurements for documentation
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    const finalMeasurements = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div')).filter(el => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        return rect.height > 50 && 
               rect.width > 100 && 
               (el.classList.contains('bg-') || 
                el.classList.contains('card') || 
                styles.backgroundColor !== 'rgba(0, 0, 0, 0)');
      });

      return cards.map((card, index) => {
        const rect = card.getBoundingClientRect();
        return {
          index: index + 1,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          text: card.textContent.trim().substring(0, 50),
          classes: card.className
        };
      }).filter(card => card.height > 80);
    });

    console.log('\n📋 === 最終卡片測量結果 ===');
    console.log('='.repeat(80));
    
    finalMeasurements.forEach(card => {
      console.log(`卡片 ${card.index}: ${card.width}x${card.height}px @ (${card.x}, ${card.y})`);
      console.log(`   內容: "${card.text}..."`);
      console.log(`   類別: ${card.classes}`);
      console.log('   ' + '-'.repeat(70));
    });

    console.log('\n🎯 === 高度減少分析 ===');
    
    // Categorize by height
    const quickActionCards = finalMeasurements.filter(c => c.height >= 100 && c.height <= 140 && c.y < 300);
    const statisticsCards = finalMeasurements.filter(c => c.height >= 100 && c.height <= 140 && c.y >= 300 && c.y < 600);
    const chartCards = finalMeasurements.filter(c => c.height >= 250 && c.height <= 350);

    console.log(`🚀 Quick Action Cards: ${quickActionCards.length} 個，平均高度: ${quickActionCards.length > 0 ? Math.round(quickActionCards.reduce((sum, c) => sum + c.height, 0) / quickActionCards.length) : 0}px`);
    console.log(`📊 Statistics Cards: ${statisticsCards.length} 個，平均高度: ${statisticsCards.length > 0 ? Math.round(statisticsCards.reduce((sum, c) => sum + c.height, 0) / statisticsCards.length) : 0}px`);
    console.log(`📈 Chart Cards: ${chartCards.length} 個，平均高度: ${chartCards.length > 0 ? Math.round(chartCards.reduce((sum, c) => sum + c.height, 0) / chartCards.length) : 0}px`);

    // Calculate reduction percentages
    const originalHeights = { quickAction: 200, statistics: 180, chart: 400 };
    
    if (quickActionCards.length > 0) {
      const avgQuickHeight = quickActionCards.reduce((sum, c) => sum + c.height, 0) / quickActionCards.length;
      const reduction = ((originalHeights.quickAction - avgQuickHeight) / originalHeights.quickAction * 100);
      console.log(`   Quick Action 減少: ${reduction.toFixed(1)}% (${originalHeights.quickAction}px → ${Math.round(avgQuickHeight)}px)`);
    }
    
    if (statisticsCards.length > 0) {
      const avgStatsHeight = statisticsCards.reduce((sum, c) => sum + c.height, 0) / statisticsCards.length;
      const reduction = ((originalHeights.statistics - avgStatsHeight) / originalHeights.statistics * 100);
      console.log(`   Statistics 減少: ${reduction.toFixed(1)}% (${originalHeights.statistics}px → ${Math.round(avgStatsHeight)}px)`);
    }
    
    if (chartCards.length > 0) {
      const avgChartHeight = chartCards.reduce((sum, c) => sum + c.height, 0) / chartCards.length;
      const reduction = ((originalHeights.chart - avgChartHeight) / originalHeights.chart * 100);
      console.log(`   Chart Cards 減少: ${reduction.toFixed(1)}% (${originalHeights.chart}px → ${Math.round(avgChartHeight)}px)`);
    }

    console.log('\n🎉 === 文檔建立完成 ===');
    console.log(`📸 截圖總數: ${screenSizes.length + 2} 張`);
    console.log(`📏 測量卡片: ${finalMeasurements.length} 個`);

    expect(finalMeasurements.length).toBeGreaterThan(10, '應該找到足夠的卡片進行測量');
  });

});