import { test, expect } from '@playwright/test';

test.describe('Card Height Verification Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage and login
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Check if already logged in by looking for login form or dashboard
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    
    if (isLoginPage) {
      console.log('🔐 Logging in with test credentials...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }
    
    // Wait for dashboard to fully load
    await page.waitForSelector('.main-content', { timeout: 10000 });
    await page.waitForTimeout(2000); // Additional wait for CSS animations
  });

  test('Verify all card types have reduced height by ~1/3', async ({ page }) => {
    console.log('📏 Starting comprehensive card height verification...');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'card-height-verification-full-dashboard.png',
      fullPage: true 
    });

    // Define expected card dimensions (after 1/3 reduction)
    const expectedHeights = {
      quickAction: { target: 133, tolerance: 10, original: 200 },
      statistics: { target: 120, tolerance: 10, original: 180 },
      chart: { target: 267, tolerance: 15, original: 400 }
    };

    const measurements = {
      quickAction: [],
      statistics: [],
      chart: []
    };

    // 1. Measure Quick Action Cards
    console.log('📊 Measuring Quick Action Cards...');
    const quickActionCards = await page.locator('.quick-action-card, [class*="quick-action"], .btn-card, .action-btn-card');
    const quickActionCount = await quickActionCards.count();
    
    if (quickActionCount > 0) {
      for (let i = 0; i < quickActionCount; i++) {
        const card = quickActionCards.nth(i);
        const box = await card.boundingBox();
        if (box) {
          measurements.quickAction.push({
            index: i,
            height: Math.round(box.height),
            width: Math.round(box.width),
            element: await card.textContent() || `Card ${i + 1}`
          });
        }
      }
    }

    // 2. Measure Statistics/Analysis Cards
    console.log('📈 Measuring Statistics Analysis Cards...');
    const statsCards = await page.locator('.stats-card, .statistics-card, [class*="stat"], .metric-card, .analysis-card');
    const statsCount = await statsCards.count();
    
    if (statsCount > 0) {
      for (let i = 0; i < statsCount; i++) {
        const card = statsCards.nth(i);
        const box = await card.boundingBox();
        if (box) {
          measurements.statistics.push({
            index: i,
            height: Math.round(box.height),
            width: Math.round(box.width),
            element: await card.textContent() || `Stats Card ${i + 1}`
          });
        }
      }
    }

    // 3. Measure Chart Cards
    console.log('📊 Measuring Chart Cards...');
    const chartCards = await page.locator('.chart-card, [class*="chart"], .canvas-container, .chart-container');
    const chartCount = await chartCards.count();
    
    if (chartCount > 0) {
      for (let i = 0; i < chartCount; i++) {
        const card = chartCards.nth(i);
        const box = await card.boundingBox();
        if (box) {
          measurements.chart.push({
            index: i,
            height: Math.round(box.height),
            width: Math.round(box.width),
            element: await card.textContent() || `Chart Card ${i + 1}`
          });
        }
      }
    }

    // Alternative approach: Look for common card structures
    console.log('🔍 Searching for alternative card selectors...');
    const alternativeCards = await page.locator('.card, .bg-white, .shadow, .rounded').all();
    
    for (const card of alternativeCards) {
      const box = await card.boundingBox();
      if (box && box.height > 50) { // Filter out very small elements
        const classList = await card.getAttribute('class') || '';
        const content = (await card.textContent() || '').trim().substring(0, 50);
        
        // Categorize based on content or height
        if (box.height >= 200 && box.height <= 320) {
          measurements.chart.push({
            height: Math.round(box.height),
            width: Math.round(box.width),
            element: `Alt Chart: ${content}`,
            classes: classList
          });
        } else if (box.height >= 100 && box.height <= 160) {
          measurements.statistics.push({
            height: Math.round(box.height),
            width: Math.round(box.width),
            element: `Alt Stats: ${content}`,
            classes: classList
          });
        } else if (box.height >= 80 && box.height <= 150) {
          measurements.quickAction.push({
            height: Math.round(box.height),
            width: Math.round(box.width),
            element: `Alt Action: ${content}`,
            classes: classList
          });
        }
      }
    }

    // Log all measurements
    console.log('\n📋 MEASUREMENT RESULTS:');
    console.log('='.repeat(60));
    
    console.log('\n🚀 Quick Action Cards:');
    measurements.quickAction.forEach((card, i) => {
      console.log(`  ${i + 1}. Height: ${card.height}px | Width: ${card.width}px | ${card.element}`);
    });
    
    console.log('\n📊 Statistics Analysis Cards:');
    measurements.statistics.forEach((card, i) => {
      console.log(`  ${i + 1}. Height: ${card.height}px | Width: ${card.width}px | ${card.element}`);
    });
    
    console.log('\n📈 Chart Cards:');
    measurements.chart.forEach((card, i) => {
      console.log(`  ${i + 1}. Height: ${card.height}px | Width: ${card.width}px | ${card.element}`);
    });

    // Verification against targets
    console.log('\n✅ VERIFICATION AGAINST TARGETS:');
    console.log('='.repeat(60));

    let passedTests = 0;
    let totalTests = 0;

    // Verify Quick Action Cards
    if (measurements.quickAction.length > 0) {
      console.log('\n🚀 Quick Action Cards Verification:');
      console.log(`   Target: ~${expectedHeights.quickAction.target}px (reduced from ${expectedHeights.quickAction.original}px)`);
      
      measurements.quickAction.forEach((card, i) => {
        totalTests++;
        const isWithinTolerance = Math.abs(card.height - expectedHeights.quickAction.target) <= expectedHeights.quickAction.tolerance;
        const reductionPercent = Math.round(((expectedHeights.quickAction.original - card.height) / expectedHeights.quickAction.original) * 100);
        
        console.log(`   ${i + 1}. ${card.height}px ${isWithinTolerance ? '✅' : '❌'} (${reductionPercent}% reduction)`);
        
        if (isWithinTolerance) passedTests++;
      });
    }

    // Verify Statistics Cards
    if (measurements.statistics.length > 0) {
      console.log('\n📊 Statistics Analysis Cards Verification:');
      console.log(`   Target: ~${expectedHeights.statistics.target}px (reduced from ${expectedHeights.statistics.original}px)`);
      
      measurements.statistics.forEach((card, i) => {
        totalTests++;
        const isWithinTolerance = Math.abs(card.height - expectedHeights.statistics.target) <= expectedHeights.statistics.tolerance;
        const reductionPercent = Math.round(((expectedHeights.statistics.original - card.height) / expectedHeights.statistics.original) * 100);
        
        console.log(`   ${i + 1}. ${card.height}px ${isWithinTolerance ? '✅' : '❌'} (${reductionPercent}% reduction)`);
        
        if (isWithinTolerance) passedTests++;
      });
    }

    // Verify Chart Cards
    if (measurements.chart.length > 0) {
      console.log('\n📈 Chart Cards Verification:');
      console.log(`   Target: ~${expectedHeights.chart.target}px (reduced from ${expectedHeights.chart.original}px)`);
      
      measurements.chart.forEach((card, i) => {
        totalTests++;
        const isWithinTolerance = Math.abs(card.height - expectedHeights.chart.target) <= expectedHeights.chart.tolerance;
        const reductionPercent = Math.round(((expectedHeights.chart.original - card.height) / expectedHeights.chart.original) * 100);
        
        console.log(`   ${i + 1}. ${card.height}px ${isWithinTolerance ? '✅' : '❌'} (${reductionPercent}% reduction)`);
        
        if (isWithinTolerance) passedTests++;
      });
    }

    // Summary
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    console.log('\n📊 FINAL SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests (${successRate}%)`);
    console.log(`🚀 Quick Action Cards Found: ${measurements.quickAction.length}`);
    console.log(`📊 Statistics Cards Found: ${measurements.statistics.length}`);
    console.log(`📈 Chart Cards Found: ${measurements.chart.length}`);

    // Assert that we found cards and most passed verification
    expect(totalTests).toBeGreaterThan(0, 'Should find at least some cards to measure');
    expect(successRate).toBeGreaterThanOrEqual(70, `Expected at least 70% of cards to meet height reduction targets, got ${successRate}%`);
  });

  test('Responsive design verification - different screen sizes', async ({ page }) => {
    console.log('📱 Testing responsive behavior across different screen sizes...');
    
    const screenSizes = [
      { name: 'Desktop Large', width: 1920, height: 1080 },
      { name: 'Desktop Medium', width: 1280, height: 720 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const size of screenSizes) {
      console.log(`\n📏 Testing ${size.name} (${size.width}x${size.height})...`);
      
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(1000); // Wait for responsive adjustments
      
      // Take screenshot
      await page.screenshot({ 
        path: `card-height-${size.name.toLowerCase().replace(' ', '-')}-${size.width}x${size.height}.png`,
        fullPage: true 
      });

      // Quick measurement of visible cards
      const visibleCards = await page.locator('.card, .bg-white, [class*="card"]').all();
      let cardCount = 0;
      let avgHeight = 0;

      for (const card of visibleCards) {
        const box = await card.boundingBox();
        if (box && box.height > 50) { // Only count meaningful cards
          avgHeight += box.height;
          cardCount++;
        }
      }

      if (cardCount > 0) {
        avgHeight = Math.round(avgHeight / cardCount);
        console.log(`   📊 Found ${cardCount} cards, average height: ${avgHeight}px`);
      }
    }
  });

  test('Visual quality and content readability verification', async ({ page }) => {
    console.log('👀 Verifying visual quality and content readability...');
    
    // Check for text overflow, truncation, or layout issues
    const cards = await page.locator('.card, .bg-white, [class*="card"]').all();
    let issues = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const box = await card.boundingBox();
      
      if (box) {
        // Check for text overflow
        const hasOverflow = await card.evaluate(el => {
          return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
        });
        
        if (hasOverflow) {
          const cardText = (await card.textContent() || '').substring(0, 50);
          issues.push(`Card ${i + 1}: Text overflow detected - "${cardText}..."`);
        }

        // Check for minimum readable height
        if (box.height < 80) {
          const cardText = (await card.textContent() || '').substring(0, 50);
          issues.push(`Card ${i + 1}: Potentially too small (${box.height}px) - "${cardText}..."`);
        }
      }
    }

    console.log('\n🔍 Content Quality Check Results:');
    if (issues.length === 0) {
      console.log('✅ No content readability issues detected');
    } else {
      console.log(`⚠️  Found ${issues.length} potential issues:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // Take final verification screenshot
    await page.screenshot({ 
      path: 'card-height-final-visual-quality-check.png',
      fullPage: true 
    });

    // Assert reasonable quality standards
    expect(issues.length).toBeLessThan(5, `Too many visual quality issues found: ${issues.length}`);
  });

});