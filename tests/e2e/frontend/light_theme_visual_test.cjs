const { test, expect } = require('@playwright/test');

test.describe('Light Theme Visual Quality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://127.0.0.1:8000');
    
    // Login with test credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-dashboard], #statsGrid, main, .nexus-main-content-no-sidebar', { timeout: 10000 });
  });

  test('Light Theme Statistics Container Background and Contrast', async ({ page }) => {
    console.log('🌞 Testing Light Theme Visual Quality...');
    
    // Switch to Light Theme
    await page.click('.theme-toggle');
    await page.waitForTimeout(1000); // Wait for theme transition
    
    // Take screenshot for comparison
    await page.screenshot({ 
      path: 'tests/screenshots/light-theme-full.png',
      fullPage: true 
    });
    
    // Test Statistics Container Background
    const statsContainer = page.locator('.statistics-analysis');
    const statsContainerBg = await statsContainer.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        backgroundColor: styles.backgroundColor,
        backgroundImage: styles.backgroundImage
      };
    });
    
    console.log('📊 Statistics Container Background:', statsContainerBg);
    
    // Verify statistics container has proper light theme background
    expect(statsContainerBg.backgroundColor).not.toBe('rgb(17, 24, 39)'); // Should not be dark gray
    expect(statsContainerBg.backgroundColor).not.toBe('rgb(31, 41, 55)'); // Should not be dark
    
    // Test Card Contrast
    const cards = page.locator('.card');
    const cardCount = await cards.count();
    console.log(`🎴 Found ${cardCount} cards to test`);
    
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = cards.nth(i);
      const cardStyles = await card.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          borderWidth: styles.borderWidth
        };
      });
      
      console.log(`🎴 Card ${i + 1} styles:`, cardStyles);
      
      // Verify cards have proper contrast
      expect(cardStyles.backgroundColor).not.toBe('transparent');
      expect(cardStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('Text Readability and Statistical Values', async ({ page }) => {
    console.log('📝 Testing Text Readability...');
    
    // Switch to Light Theme
    await page.click('.theme-toggle');
    await page.waitForTimeout(1000);
    
    // Test Primary Text Color
    const primaryText = page.locator('.text-primary, h1, h2, h3, .card-title').first();
    if (await primaryText.count() > 0) {
      const textColor = await primaryText.evaluate(el => {
        return window.getComputedStyle(el).color;
      });
      console.log('🔤 Primary text color:', textColor);
      
      // Should be dark for light theme readability
      expect(textColor).not.toBe('rgb(255, 255, 255)'); // Should not be white
    }
    
    // Test Statistical Values
    const statValues = page.locator('.stat-value, .statistics-value, .metric-value');
    const statCount = await statValues.count();
    console.log(`📈 Found ${statCount} statistical values`);
    
    for (let i = 0; i < Math.min(statCount, 3); i++) {
      const statValue = statValues.nth(i);
      const statStyles = await statValue.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          fontWeight: styles.fontWeight,
          textShadow: styles.textShadow
        };
      });
      
      console.log(`📊 Stat value ${i + 1}:`, statStyles);
      
      // Verify statistical values are bold and visible
      expect(parseInt(statStyles.fontWeight)).toBeGreaterThanOrEqual(600);
    }
  });

  test('Change Indicators and Badge Contrast', async ({ page }) => {
    console.log('🏷️ Testing Change Indicators...');
    
    // Switch to Light Theme
    await page.click('.theme-toggle');
    await page.waitForTimeout(1000);
    
    // Test Green/Red Badges
    const badges = page.locator('.badge, .change-indicator, .percentage-badge');
    const badgeCount = await badges.count();
    console.log(`🏷️ Found ${badgeCount} badges to test`);
    
    for (let i = 0; i < Math.min(badgeCount, 3); i++) {
      const badge = badges.nth(i);
      const badgeStyles = await badge.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          border: styles.border,
          borderColor: styles.borderColor
        };
      });
      
      console.log(`🏷️ Badge ${i + 1} styles:`, badgeStyles);
      
      // Verify badges have proper contrast
      expect(badgeStyles.backgroundColor).not.toBe('transparent');
      expect(badgeStyles.color).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('Theme Toggle Functionality', async ({ page }) => {
    console.log('🔄 Testing Theme Toggle...');
    
    // Take screenshot in current theme (should be dark by default)
    await page.screenshot({ 
      path: 'tests/screenshots/before-theme-toggle.png',
      fullPage: true 
    });
    
    // Switch to Light Theme
    await page.click('.theme-toggle');
    await page.waitForTimeout(1500); // Wait for theme transition
    
    // Take screenshot after switching to light theme
    await page.screenshot({ 
      path: 'tests/screenshots/after-light-theme-toggle.png',
      fullPage: true 
    });
    
    // Verify theme toggle button state
    const themeToggle = page.locator('.theme-toggle');
    const toggleState = await themeToggle.evaluate(el => {
      return {
        innerHTML: el.innerHTML,
        classList: Array.from(el.classList),
        ariaLabel: el.getAttribute('aria-label')
      };
    });
    
    console.log('🔄 Theme toggle state:', toggleState);
    
    // Switch back to Dark Theme to test both
    await page.click('.theme-toggle');
    await page.waitForTimeout(1500);
    
    // Take screenshot of dark theme
    await page.screenshot({ 
      path: 'tests/screenshots/dark-theme-comparison.png',
      fullPage: true 
    });
    
    // Switch back to Light Theme for final verification
    await page.click('.theme-toggle');
    await page.waitForTimeout(1500);
    
    await page.screenshot({ 
      path: 'tests/screenshots/light-theme-final.png',
      fullPage: true 
    });
  });

  test('Responsive Design Verification', async ({ page }) => {
    console.log('📱 Testing Responsive Design...');
    
    // Switch to Light Theme
    await page.click('.theme-toggle');
    await page.waitForTimeout(1000);
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Take screenshot at this viewport
      await page.screenshot({ 
        path: `tests/screenshots/light-theme-${viewport.name}.png`,
        fullPage: true 
      });
      
      // Verify statistics container is still visible and properly styled
      const statsVisible = await page.locator('.statistics-analysis').isVisible();
      expect(statsVisible).toBe(true);
      
      console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height}): Statistics visible = ${statsVisible}`);
    }
  });

  test('Card Hover Effects and Interactions', async ({ page }) => {
    console.log('🖱️ Testing Card Hover Effects...');
    
    // Switch to Light Theme
    await page.click('.theme-toggle');
    await page.waitForTimeout(1000);
    
    // Test card hover effects
    const cards = page.locator('.card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      const firstCard = cards.first();
      
      // Get initial styles
      const initialStyles = await firstCard.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow,
          backgroundColor: styles.backgroundColor
        };
      });
      
      console.log('🖱️ Initial card styles:', initialStyles);
      
      // Hover over the card
      await firstCard.hover();
      await page.waitForTimeout(500);
      
      // Get hover styles
      const hoverStyles = await firstCard.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow,
          backgroundColor: styles.backgroundColor
        };
      });
      
      console.log('🖱️ Hover card styles:', hoverStyles);
      
      // Take screenshot with hover effect
      await page.screenshot({ 
        path: 'tests/screenshots/card-hover-effect.png'
      });
      
      // Verify hover effect occurred (styles should change)
      expect(hoverStyles.transform !== initialStyles.transform || 
             hoverStyles.boxShadow !== initialStyles.boxShadow).toBe(true);
    }
  });
});